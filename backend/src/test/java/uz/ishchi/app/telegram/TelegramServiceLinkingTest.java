package uz.ishchi.app.telegram;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.test.util.ReflectionTestUtils;
import uz.ishchi.app.common.OtpPurpose;
import uz.ishchi.app.common.Role;
import uz.ishchi.app.profile.EmployerProfileRepository;
import uz.ishchi.app.profile.WorkerProfileRepository;
import uz.ishchi.app.settings.AppSettingsService;
import uz.ishchi.app.telegram.dto.TelegramUpdate;
import uz.ishchi.app.user.User;
import uz.ishchi.app.user.UserRepository;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Regression guards for the account-takeover hole in Telegram linking.
 *
 * <p>A deep-link token proves only that somebody asked to link a number — it is handed straight to
 * the unauthenticated caller of register/forgot-password. Linking on it alone let an attacker point
 * a stranger's account at their own chat and have the code delivered there. A shared contact is the
 * only thing Telegram actually vouches for, and only when it carries the sender's own user id.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class TelegramServiceLinkingTest {

    private static final String SECRET = "the-webhook-secret";
    private static final long ATTACKER_CHAT = 555L;
    private static final long ATTACKER_TELEGRAM_USER = 555L;

    @Mock private AppSettingsService appSettingsService;
    @Mock private TelegramClient telegramClient;
    @Mock private UserRepository userRepository;
    @Mock private TelegramFeedbackRepository feedbackRepository;
    @Mock private TelegramAwaitingFeedbackRepository awaitingFeedbackRepository;
    @Mock private WorkerProfileRepository workerProfileRepository;
    @Mock private EmployerProfileRepository employerProfileRepository;
    @Mock private TelegramJobWizardService jobWizardService;
    @Mock private TelegramService self;

    @InjectMocks private TelegramService telegramService;

    private User victim;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(telegramService, "baseUrl", "https://example.test");
        when(appSettingsService.getTelegramBotToken()).thenReturn("bot-token");
        when(appSettingsService.matchesWebhookSecret(SECRET)).thenReturn(true);

        victim = new User("+998901234567", "hash", Role.WORKER);
        ReflectionTestUtils.setField(victim, "id", 42L);
        victim.setTelegramLinkToken("deep-link-token");
        victim.setTelegramLinkPurpose(OtpPurpose.RESET_PASSWORD);
    }

    @Test
    void deepLinkAloneNeverLinksAnAccount() {
        when(userRepository.findByTelegramLinkToken("deep-link-token")).thenReturn(Optional.of(victim));

        Optional<TelegramService.LinkedUser> linked = telegramService.handleWebhookUpdate(
                SECRET, update(startCommand("deep-link-token")));

        assertThat(linked).isEmpty();
        assertThat(victim.getTelegramChatId()).isNull();
        verify(userRepository, never()).save(any(User.class));
        // It asks for the number instead, via the contact-request keyboard.
        verify(telegramClient).sendMessageWithKeyboard(anyString(), anyLong(), anyString(), any());
    }

    @Test
    void aForwardedContactCardIsRefused() {
        // Telegram sets contact.user_id to the *contact's* id, not the sender's, when a card is
        // forwarded from the address book — accepting it would hand over anyone's account.
        Optional<TelegramService.LinkedUser> linked = telegramService.handleWebhookUpdate(
                SECRET, contactUpdate("998901234567", 999L));

        assertThat(linked).isEmpty();
        verify(userRepository, never()).findByPhone(anyString());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void aContactWithoutAUserIdIsRefused() {
        Optional<TelegramService.LinkedUser> linked = telegramService.handleWebhookUpdate(
                SECRET, contactUpdate("998901234567", null));

        assertThat(linked).isEmpty();
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void theSendersOwnVerifiedNumberDoesLink() {
        when(userRepository.findByPhone("+998901234567")).thenReturn(Optional.of(victim));
        when(userRepository.findByTelegramChatId(ATTACKER_CHAT)).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        Optional<TelegramService.LinkedUser> linked = telegramService.handleWebhookUpdate(
                SECRET, contactUpdate("998901234567", ATTACKER_TELEGRAM_USER));

        assertThat(linked).isPresent();
        assertThat(linked.get().pendingPurpose()).isEqualTo(OtpPurpose.RESET_PASSWORD);
        assertThat(victim.getTelegramChatId()).isEqualTo(ATTACKER_CHAT);
        assertThat(victim.getTelegramLinkToken()).isNull();
    }

    @Test
    void aWrongWebhookSecretIsIgnored() {
        Optional<TelegramService.LinkedUser> linked = telegramService.handleWebhookUpdate(
                "not-the-secret", contactUpdate("998901234567", ATTACKER_TELEGRAM_USER));

        assertThat(linked).isEmpty();
        verify(userRepository, never()).findByPhone(anyString());
    }

    private TelegramUpdate update(TelegramUpdate.Message message) {
        return new TelegramUpdate(message);
    }

    private TelegramUpdate.Message startCommand(String token) {
        return new TelegramUpdate.Message(
                new TelegramUpdate.Message.Chat(ATTACKER_CHAT),
                new TelegramUpdate.Message.From(ATTACKER_TELEGRAM_USER),
                "/start " + token, null, null);
    }

    private TelegramUpdate contactUpdate(String phone, Long contactUserId) {
        return update(new TelegramUpdate.Message(
                new TelegramUpdate.Message.Chat(ATTACKER_CHAT),
                new TelegramUpdate.Message.From(ATTACKER_TELEGRAM_USER),
                null,
                new TelegramUpdate.Message.Contact(phone, contactUserId),
                null));
    }
}
