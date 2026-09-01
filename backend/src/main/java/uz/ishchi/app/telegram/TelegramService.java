package uz.ishchi.app.telegram;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.ishchi.app.common.OtpPurpose;
import uz.ishchi.app.common.Role;
import uz.ishchi.app.common.exception.ApiException;
import uz.ishchi.app.profile.EmployerProfileRepository;
import uz.ishchi.app.profile.WorkerProfileRepository;
import uz.ishchi.app.settings.AppSettingsService;
import uz.ishchi.app.settings.dto.AppSettingsResponse;
import uz.ishchi.app.telegram.dto.TelegramFeedbackResponse;
import uz.ishchi.app.telegram.dto.TelegramUpdate;
import uz.ishchi.app.user.User;
import uz.ishchi.app.user.UserRepository;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class TelegramService {

    private static final Logger log = LoggerFactory.getLogger(TelegramService.class);

    private final AppSettingsService appSettingsService;
    private final TelegramClient telegramClient;
    private final UserRepository userRepository;
    private final TelegramFeedbackRepository feedbackRepository;
    private final WorkerProfileRepository workerProfileRepository;
    private final EmployerProfileRepository employerProfileRepository;
    // Self-injected proxy so broadcast()'s call into sendBroadcast() goes through the Spring
    // proxy and actually picks up @Async — a plain `this.sendBroadcast(...)` would run inline
    // and block the admin request for the whole (rate-limited) send loop.
    private final TelegramService self;

    /** Chat ids that just tapped "feedback" and whose next free-text message should be
     *  captured as feedback rather than matched against the menu buttons. In-memory is fine —
     *  worst case a restart mid-conversation makes the user tap the button again. */
    private final Set<Long> awaitingFeedback = ConcurrentHashMap.newKeySet();

    public TelegramService(AppSettingsService appSettingsService, TelegramClient telegramClient,
                            UserRepository userRepository, TelegramFeedbackRepository feedbackRepository,
                            WorkerProfileRepository workerProfileRepository,
                            EmployerProfileRepository employerProfileRepository, @Lazy TelegramService self) {
        this.appSettingsService = appSettingsService;
        this.telegramClient = telegramClient;
        this.userRepository = userRepository;
        this.feedbackRepository = feedbackRepository;
        this.workerProfileRepository = workerProfileRepository;
        this.employerProfileRepository = employerProfileRepository;
        this.self = self;
    }

    @Value("${app.base-url}")
    private String baseUrl;

    private static final SecureRandom RANDOM = new SecureRandom();

    private static final String BTN_ABOUT = "ℹ️ Ilova haqida";
    private static final String BTN_CONTACT = "📞 Bog'lanish";
    private static final String BTN_DOWNLOAD = "📱 Ilovani yuklab olish";
    private static final String BTN_SHARE_PHONE = "📲 Telefon raqamni ulash";
    private static final String BTN_FEEDBACK = "💬 Fikr-mulohaza / Muammo";

    public record LinkedUser(User user, OtpPurpose pendingPurpose) {
    }

    public boolean isConfigured() {
        return appSettingsService.isTelegramConfigured();
    }

    public String generateLinkToken() {
        byte[] bytes = new byte[16];
        RANDOM.nextBytes(bytes);
        return HexFormat.of().formatHex(bytes);
    }

    public String buildLinkUrl(String linkToken) {
        String username = appSettingsService.getTelegramBotUsername();
        if (username == null) return null;
        return "https://t.me/" + username + "?start=" + linkToken;
    }

    public void sendOtp(long chatId, String code) {
        String token = appSettingsService.getTelegramBotToken();
        if (token == null) return;
        telegramClient.sendMessage(token, chatId, "Tasdiqlash kodingiz: " + code);
    }

    /** Resolves the linked-chat list for an admin broadcast, then hands the actual sending off
     *  to the async, rate-limited loop so the admin request returns immediately. */
    public void broadcast(Role role, Long regionId, String title, String body) {
        String token = appSettingsService.getTelegramBotToken();
        if (token == null) {
            throw ApiException.badRequest("Telegram bot ulanmagan");
        }
        List<Long> chatIds;
        if (role == null) {
            chatIds = userRepository.findAllActiveTelegramChatIds();
        } else if (role == Role.ADMIN) {
            throw ApiException.badRequest("Administratorlarga xabar yuborilmaydi");
        } else if (regionId == null) {
            chatIds = userRepository.findTelegramChatIdsByRole(role);
        } else if (role == Role.WORKER) {
            chatIds = userRepository.findWorkerTelegramChatIdsByRegion(regionId);
        } else {
            chatIds = userRepository.findEmployerTelegramChatIdsByRegion(regionId);
        }
        self.sendBroadcast(token, chatIds, title + "\n\n" + body);
    }

    /** Fire-and-forget. Paced at ~28 msg/s to stay under Telegram's per-bot rate limit. */
    @Async
    public void sendBroadcast(String token, List<Long> chatIds, String text) {
        for (Long chatId : chatIds) {
            try {
                telegramClient.sendMessage(token, chatId, text);
                Thread.sleep(35);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                return;
            } catch (Exception e) {
                log.error("Telegram broadcast: chatId={} ga yuborib bo'lmadi", chatId, e);
            }
        }
    }

    /**
     * Handles every incoming webhook update. Two paths resolve a pending OTP link and are
     * returned to the caller so it can dispatch the actual code: {@code /start <token>} (deep
     * link tapped from the app) and sharing a contact whose phone number matches an existing
     * user (tapped the "share phone number" button — Telegram guarantees this is the viewer's
     * own verified number, so it can't be spoofed to link someone else's account). Everything
     * else is a self-contained menu interaction this method answers directly.
     */
    @Transactional
    public Optional<LinkedUser> handleWebhookUpdate(String secret, TelegramUpdate update) {
        String token = appSettingsService.getTelegramBotToken();
        if (token == null || !AppSettingsService.webhookSecret(token).equals(secret)) {
            return Optional.empty();
        }
        if (update.message() == null || update.message().chat() == null) {
            return Optional.empty();
        }
        long chatId = update.message().chat().id();

        if (update.message().contact() != null) {
            return handleContact(token, chatId, update.message().contact());
        }

        String text = update.message().text() == null ? "" : update.message().text().trim();
        if (text.isEmpty()) {
            return Optional.empty();
        }

        if (text.startsWith("/start ")) {
            String linkToken = text.substring("/start ".length()).trim();
            return userRepository.findByTelegramLinkToken(linkToken).map(user -> linkUser(user, chatId));
        }

        if (text.equals("/start") || text.equals("/help") || text.equals("/menu")) {
            sendMainMenu(token, chatId);
        } else if (text.equals(BTN_ABOUT)) {
            sendAbout(token, chatId);
        } else if (text.equals(BTN_CONTACT)) {
            sendContact(token, chatId);
        } else if (text.equals(BTN_DOWNLOAD)) {
            telegramClient.sendMessage(token, chatId,
                    "Ilovani shu havoladan yuklab oling:\n" + baseUrl + "/uploads/apk/ishchi.apk");
        } else if (text.equals(BTN_SHARE_PHONE)) {
            telegramClient.sendMessage(token, chatId,
                    "Pastdagi \"📲 Telefon raqamni ulash\" tugmasini bosib, raqamingizni ulashing.");
        } else if (text.equals(BTN_FEEDBACK)) {
            awaitingFeedback.add(chatId);
            telegramClient.sendMessage(token, chatId,
                    "✍️ Fikr-mulohaza yoki duch kelgan muammoingizni yozib yuboring — administratorlarga yetkaziladi.");
        } else if (awaitingFeedback.remove(chatId)) {
            User user = userRepository.findByTelegramChatId(chatId).orElse(null);
            feedbackRepository.save(new TelegramFeedback(chatId, user, text));
            telegramClient.sendMessage(token, chatId, "✅ Rahmat! Xabaringiz qabul qilindi va tez orada ko'rib chiqiladi.");
        }
        return Optional.empty();
    }

    private Optional<LinkedUser> handleContact(String token, long chatId, TelegramUpdate.Message.Contact contact) {
        String phone = normalizePhone(contact.phoneNumber());
        if (phone == null) {
            telegramClient.sendMessage(token, chatId, "Telefon raqam formatini aniqlab bo'lmadi.");
            return Optional.empty();
        }
        Optional<User> userOpt = userRepository.findByPhone(phone);
        if (userOpt.isEmpty()) {
            telegramClient.sendMessage(token, chatId,
                    "Bu raqam (" + phone + ") bilan ro'yxatdan o'tilmagan. Avval ilovada ro'yxatdan o'ting.");
            return Optional.empty();
        }
        LinkedUser linked = linkUser(userOpt.get(), chatId);
        if (linked.pendingPurpose() == null) {
            telegramClient.sendMessage(token, chatId, "✅ Akkountingiz ulandi. Endi tasdiqlash kodlari shu botga yuboriladi.");
        }
        return Optional.of(linked);
    }

    private LinkedUser linkUser(User user, long chatId) {
        OtpPurpose purpose = user.getTelegramLinkPurpose();
        user.setTelegramChatId(chatId);
        user.setTelegramLinkToken(null);
        user.setTelegramLinkPurpose(null);
        userRepository.save(user);
        return new LinkedUser(user, purpose);
    }

    /** Telegram sends contact numbers without a leading '+' (e.g. "998901234567"). */
    private String normalizePhone(String raw) {
        if (raw == null) return null;
        String digits = raw.replaceAll("[^0-9]", "");
        String candidate = "+" + digits;
        return candidate.matches("^\\+998\\d{9}$") ? candidate : null;
    }

    private void sendMainMenu(String token, long chatId) {
        String welcome = "Assalomu alaykum! \"Ishchi\" botiga xush kelibsiz.\n\n"
                + "Ish beruvchi va ishchini bog'laydigan platforma. Quyidagi tugmalardan birini tanlang:";
        telegramClient.sendMessageWithKeyboard(token, chatId, welcome, List.of(
                List.of(TelegramClient.KeyboardButton.contactRequest(BTN_SHARE_PHONE)),
                List.of(TelegramClient.KeyboardButton.of(BTN_ABOUT)),
                List.of(TelegramClient.KeyboardButton.of(BTN_CONTACT), TelegramClient.KeyboardButton.of(BTN_DOWNLOAD)),
                List.of(TelegramClient.KeyboardButton.of(BTN_FEEDBACK))
        ));
    }

    private void sendAbout(String token, long chatId) {
        AppSettingsResponse settings = appSettingsService.get();
        String text = settings.aboutText() != null && !settings.aboutText().isBlank()
                ? settings.aboutText()
                : "Ishchi — ish beruvchi va ishchini bog'laydigan platforma.";
        telegramClient.sendMessage(token, chatId, text);
    }

    private void sendContact(String token, long chatId) {
        AppSettingsResponse settings = appSettingsService.get();
        StringBuilder sb = new StringBuilder("Biz bilan bog'lanish:\n\n");
        if (settings.supportPhone() != null && !settings.supportPhone().isBlank()) {
            sb.append("📞 Telefon: ").append(settings.supportPhone()).append('\n');
        }
        if (settings.supportEmail() != null && !settings.supportEmail().isBlank()) {
            sb.append("✉️ Email: ").append(settings.supportEmail()).append('\n');
        }
        if (settings.supportTelegram() != null && !settings.supportTelegram().isBlank()) {
            sb.append("💬 Telegram: @").append(settings.supportTelegram()).append('\n');
        }
        telegramClient.sendMessage(token, chatId, sb.toString());
    }

    @Transactional(readOnly = true)
    public Page<TelegramFeedbackResponse> listFeedback(Boolean resolved, Pageable pageable) {
        Page<TelegramFeedback> page = resolved != null
                ? feedbackRepository.findByResolved(resolved, pageable)
                : feedbackRepository.findAll(pageable);
        return page.map(f -> TelegramFeedbackResponse.from(f, resolveUserName(f.getUser())));
    }

    @Transactional
    public TelegramFeedbackResponse replyToFeedback(Long feedbackId, String text) {
        TelegramFeedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> ApiException.notFound("Xabar topilmadi"));
        String token = appSettingsService.getTelegramBotToken();
        if (token == null) {
            throw ApiException.badRequest("Telegram bot ulanmagan");
        }
        if (!telegramClient.sendMessage(token, feedback.getChatId(), text)) {
            throw ApiException.badRequest("Xabarni yuborib bo'lmadi");
        }
        feedback.setAdminReply(text);
        feedback.setRepliedAt(Instant.now());
        feedback.setResolved(true);
        return TelegramFeedbackResponse.from(feedback, resolveUserName(feedback.getUser()));
    }

    @Transactional
    public TelegramFeedbackResponse setFeedbackResolved(Long feedbackId, boolean resolved) {
        TelegramFeedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> ApiException.notFound("Xabar topilmadi"));
        feedback.setResolved(resolved);
        return TelegramFeedbackResponse.from(feedback, resolveUserName(feedback.getUser()));
    }

    /** Admin sends a one-off direct message to a specific user's linked Telegram chat. */
    @Transactional(readOnly = true)
    public void sendDirectMessage(Long userId, String text) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("Foydalanuvchi topilmadi"));
        if (user.getTelegramChatId() == null) {
            throw ApiException.badRequest("Foydalanuvchi Telegram botga ulanmagan");
        }
        String token = appSettingsService.getTelegramBotToken();
        if (token == null) {
            throw ApiException.badRequest("Telegram bot ulanmagan");
        }
        if (!telegramClient.sendMessage(token, user.getTelegramChatId(), text)) {
            throw ApiException.badRequest("Xabarni yuborib bo'lmadi");
        }
    }

    private String resolveUserName(User user) {
        if (user == null) return null;
        if (user.getRole() == Role.WORKER) {
            return workerProfileRepository.findByUserId(user.getId())
                    .map(p -> p.getFirstName() + " " + p.getLastName()).orElse(null);
        } else if (user.getRole() == Role.EMPLOYER) {
            return employerProfileRepository.findByUserId(user.getId())
                    .map(p -> p.getFirstName() + " " + p.getLastName()).orElse(null);
        }
        return null;
    }
}
