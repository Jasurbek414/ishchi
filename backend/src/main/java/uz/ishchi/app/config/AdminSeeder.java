package uz.ishchi.app.config;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import uz.ishchi.app.common.Role;
import uz.ishchi.app.settings.AppSettings;
import uz.ishchi.app.settings.AppSettingsRepository;
import uz.ishchi.app.user.User;
import uz.ishchi.app.user.UserRepository;

/**
 * Applies ADMIN_PHONE/ADMIN_PASSWORD (see .env) to an ADMIN account, since admins are never
 * created through the public /auth/register endpoint.
 *
 * <p>Each pair is applied once: a new phone creates the account, a new password replaces the
 * stored one. The pair last applied is remembered (salted), so a login later changed in the admin
 * panel is not overwritten on the next start — editing .env again is how the server owner takes
 * it back. A phone that already belongs to a worker or employer is never promoted.
 */
@Component
@RequiredArgsConstructor
@EnableConfigurationProperties(AdminProperties.class)
public class AdminSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminSeeder.class);

    private final AdminProperties adminProperties;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AppSettingsRepository appSettingsRepository;

    @Override
    @Transactional
    public void run(String... args) {
        String phone = adminProperties.phone();
        String password = adminProperties.password();
        if (phone == null || phone.isBlank() || password == null || password.isBlank()) {
            return;
        }
        AppSettings settings = appSettingsRepository.findById(1L).orElseGet(AppSettings::new);
        String pair = phone + "\n" + password;
        String applied = settings.getAdminEnvFingerprint();
        if (applied != null && passwordEncoder.matches(pair, applied)) {
            return;
        }

        var existing = userRepository.findByPhone(phone);
        if (existing.isPresent()) {
            User user = existing.get();
            if (user.getRole() != Role.ADMIN) {
                log.warn("ADMIN_PHONE {} oddiy foydalanuvchiga tegishli — administrator qilinmadi", phone);
                return;
            }
            user.setPasswordHash(passwordEncoder.encode(password));
            user.setActive(true);
            userRepository.save(user);
            log.info("Administrator paroli .env bo'yicha yangilandi: {}", phone);
        } else {
            User admin = new User(phone, passwordEncoder.encode(password), Role.ADMIN);
            admin.setActive(true);
            admin.setVerified(true);
            userRepository.save(admin);
            log.info("Administrator akkaunti yaratildi: {}", phone);
        }
        settings.setAdminEnvFingerprint(passwordEncoder.encode(pair));
        appSettingsRepository.save(settings);
    }
}
