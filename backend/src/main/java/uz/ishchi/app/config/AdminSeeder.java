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
import uz.ishchi.app.user.User;
import uz.ishchi.app.user.UserRepository;

/**
 * Keeps an ADMIN account matching ADMIN_PHONE/ADMIN_PASSWORD (see .env), since admins are never
 * created through the public /auth/register endpoint.
 *
 * <p>The env vars are the source of truth: a new phone creates the account, and a changed
 * password replaces the stored one on the next start, so the server owner can always get back
 * into the panel by editing .env. A phone that already belongs to a worker or employer is left
 * alone rather than silently promoted.
 */
@Component
@RequiredArgsConstructor
@EnableConfigurationProperties(AdminProperties.class)
public class AdminSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminSeeder.class);

    private final AdminProperties adminProperties;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        String phone = adminProperties.phone();
        String password = adminProperties.password();
        if (phone == null || phone.isBlank() || password == null || password.isBlank()) {
            return;
        }
        var existing = userRepository.findByPhone(phone);
        if (existing.isPresent()) {
            User user = existing.get();
            if (user.getRole() != Role.ADMIN) {
                log.warn("ADMIN_PHONE {} oddiy foydalanuvchiga tegishli — administrator qilinmadi", phone);
                return;
            }
            if (!passwordEncoder.matches(password, user.getPasswordHash()) || !user.isActive()) {
                user.setPasswordHash(passwordEncoder.encode(password));
                user.setActive(true);
                userRepository.save(user);
                log.info("Administrator paroli .env bo'yicha yangilandi: {}", phone);
            }
            return;
        }
        User admin = new User(phone, passwordEncoder.encode(password), Role.ADMIN);
        admin.setActive(true);
        admin.setVerified(true);
        userRepository.save(admin);
        log.info("Administrator akkaunti yaratildi: {}", phone);
    }
}
