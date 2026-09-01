package uz.ishchi.app.notification;

import com.google.firebase.messaging.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Lazy;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.ishchi.app.common.DevicePlatform;
import uz.ishchi.app.common.Role;
import uz.ishchi.app.common.exception.ApiException;
import uz.ishchi.app.config.FirebaseConfig;
import uz.ishchi.app.user.User;

import java.util.List;
import java.util.Map;

@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);
    private static final int BATCH_SIZE = 500;

    private final FirebaseConfig firebaseConfig;
    private final DeviceTokenRepository deviceTokenRepository;
    // Self-injected proxy: broadcast() must call send() *through the Spring proxy* (not a
    // plain `this.send(...)`) or the @Async/@Transactional on send() are silently skipped —
    // that self-invocation gap is exactly what caused deleteByToken() to run outside any
    // transaction and blow up with TransactionRequiredException on the broadcast path.
    private final NotificationService self;

    public NotificationService(FirebaseConfig firebaseConfig, DeviceTokenRepository deviceTokenRepository,
                                @Lazy NotificationService self) {
        this.firebaseConfig = firebaseConfig;
        this.deviceTokenRepository = deviceTokenRepository;
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
