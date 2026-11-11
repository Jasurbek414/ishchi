package uz.ishchi.app.notification;

import com.google.firebase.messaging.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.ishchi.app.admin.dto.AdminNotificationResponse;
import uz.ishchi.app.common.DevicePlatform;
import uz.ishchi.app.common.Role;
import uz.ishchi.app.common.exception.ApiException;
import uz.ishchi.app.config.FirebaseConfig;
import uz.ishchi.app.notification.dto.NotificationResponse;
import uz.ishchi.app.user.User;

import java.util.List;
import java.util.Map;

@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);
    private static final int BATCH_SIZE = 500;

    private final FirebaseConfig firebaseConfig;
    private final DeviceTokenRepository deviceTokenRepository;
    private final AppNotificationRepository appNotificationRepository;
    private final NotificationService self;

    public NotificationService(FirebaseConfig firebaseConfig,
                               DeviceTokenRepository deviceTokenRepository,
                               AppNotificationRepository appNotificationRepository,
                               @Lazy NotificationService self) {
        this.firebaseConfig = firebaseConfig;
        this.deviceTokenRepository = deviceTokenRepository;
        this.appNotificationRepository = appNotificationRepository;
        this.self = self;
    }

    @Transactional
    public void registerToken(User user, String token, DevicePlatform platform) {
        DeviceToken existing = deviceTokenRepository.findByToken(token).orElse(null);
        if (existing != null) {
            existing.setUser(user);
            existing.setPlatform(platform);
            deviceTokenRepository.save(existing);
            return;
        }
        deviceTokenRepository.save(new DeviceToken(user, token, platform));
    }

    @Transactional
    public void unregisterToken(User user, String token) {
        deviceTokenRepository.deleteByTokenAndUserId(token, user.getId());
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> getUserNotifications(User user, int page, int size) {
        return appNotificationRepository.findByUserIdOrderByCreatedAtDesc(
                user.getId(), PageRequest.of(page, Math.min(size, 100))
        ).stream().map(NotificationResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public Page<AdminNotificationResponse> getRecentNotifications(Pageable pageable) {
        return appNotificationRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(AdminNotificationResponse::from);
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(User user) {
        return appNotificationRepository.countByUserIdAndReadFalse(user.getId());
    }

    @Transactional
    public void markAsRead(User user, Long notificationId) {
        AppNotification n = appNotificationRepository.findById(notificationId)
                .orElseThrow(() -> ApiException.notFound("Bildirishnoma topilmadi"));
        if (!n.getUser().getId().equals(user.getId())) {
            throw ApiException.forbidden("Ruxsat berilmagan");
        }
        n.setRead(true);
        appNotificationRepository.save(n);
    }

    @Transactional
    public void markAllAsRead(User user) {
        appNotificationRepository.markAllAsRead(user.getId());
    }

    @Transactional
    public void deleteNotification(User user, Long notificationId) {
        AppNotification n = appNotificationRepository.findById(notificationId)
                .orElseThrow(() -> ApiException.notFound("Bildirishnoma topilmadi"));
        if (!n.getUser().getId().equals(user.getId())) {
            throw ApiException.forbidden("Ruxsat berilmagan");
        }
        appNotificationRepository.delete(n);
    }

    @Transactional
    public void clearAll(User user) {
        appNotificationRepository.deleteAllByUserId(user.getId());
    }

    /** Saves in database and sends push to all user's registered devices */
    @Transactional
    public void sendToUser(User user, String title, String body, String type, Map<String, String> data) {
        AppNotification n = new AppNotification(user, title, body, type != null ? type : "SYSTEM");
        appNotificationRepository.save(n);

        List<String> tokens = deviceTokenRepository.findTokensByUserId(user.getId());
        if (!tokens.isEmpty()) {
            self.send(tokens, title, body, data != null ? data : Map.of("type", type != null ? type : "system"));
        }
    }

    /** Fire-and-forget — never blocks the caller (job creation, admin broadcast, etc.). */
    @Async
    @Transactional
    public void send(List<String> tokens, String title, String body, Map<String, String> data) {
        if (!firebaseConfig.isReady()) {
            log.debug("Firebase sozlanmagan — bildirishnoma yuborilmadi: {}", title);
            return;
        }
        if (tokens == null || tokens.isEmpty()) return;

        for (int i = 0; i < tokens.size(); i += BATCH_SIZE) {
            List<String> batch = tokens.subList(i, Math.min(i + BATCH_SIZE, tokens.size()));
            MulticastMessage message = MulticastMessage.builder()
                    .setNotification(Notification.builder().setTitle(title).setBody(body).build())
                    .putAllData(data == null ? Map.of() : data)
                    .addAllTokens(batch)
                    .build();
            try {
                BatchResponse response = FirebaseMessaging.getInstance().sendEachForMulticast(message);
                if (response.getFailureCount() > 0) {
                    List<SendResponse> responses = response.getResponses();
                    for (int j = 0; j < responses.size(); j++) {
                        SendResponse r = responses.get(j);
                        if (!r.isSuccessful() && isUnregistered(r)) {
                            deviceTokenRepository.deleteByToken(batch.get(j));
                        }
                    }
                }
            } catch (FirebaseMessagingException e) {
                log.error("Push-bildirishnoma yuborishda xatolik", e);
            }
        }
    }

    /** Resolves the token list for an admin broadcast, then sends async. */
    public void broadcast(Role role, Long regionId, String title, String body) {
        List<String> tokens;
        if (role == null) {
            tokens = deviceTokenRepository.findAllActiveTokens();
        } else if (role == Role.ADMIN) {
            throw ApiException.badRequest("Administratorlarga bildirishnoma yuborilmaydi");
        } else if (regionId == null) {
            tokens = deviceTokenRepository.findTokensByRole(role);
        } else if (role == Role.WORKER) {
            tokens = deviceTokenRepository.findWorkerTokensByRegion(regionId);
        } else {
            tokens = deviceTokenRepository.findEmployerTokensByRegion(regionId);
        }
        self.send(tokens, title, body, Map.of("type", "admin_broadcast"));
    }

    private boolean isUnregistered(SendResponse r) {
        if (r.getException() == null) return false;
        MessagingErrorCode code = r.getException().getMessagingErrorCode();
        return code == MessagingErrorCode.UNREGISTERED || code == MessagingErrorCode.INVALID_ARGUMENT;
    }
}
