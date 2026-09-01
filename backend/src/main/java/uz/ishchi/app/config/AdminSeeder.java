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
 * Creates the first ADMIN account from ADMIN_PHONE/ADMIN_PASSWORD env vars (see .env),
 * since admins are never created through the public /auth/register endpoint.
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
        if (userRepository.existsByPhone(phone)) {
            return;
        }
        User admin = new User(phone, passwordEncoder.encode(password), Role.ADMIN);
        admin.setActive(true);
        admin.setVerified(true);
        userRepository.save(admin);
        log.info("Administrator akkaunti yaratildi: {}", phone);
    }
}
