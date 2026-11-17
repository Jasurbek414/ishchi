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

@Component
@RequiredArgsConstructor
@EnableConfigurationProperties(OperatorProperties.class)
public class OperatorSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(OperatorSeeder.class);

    private final OperatorProperties operatorProperties;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        String phone = operatorProperties.phone();
        String password = operatorProperties.password();

        if (phone == null || phone.isBlank()) {
            phone = "+998900000002";
        }
        if (password == null || password.isBlank()) {
            password = "Operator123!";
        }

        var existing = userRepository.findByPhone(phone);
        if (existing.isPresent()) {
            User user = existing.get();
            if (user.getRole() == Role.OPERATOR) {
                // Parol o'zgargan bo'lsa yangilaymiz
                if (!passwordEncoder.matches(password, user.getPasswordHash())) {
                    user.setPasswordHash(passwordEncoder.encode(password));
                    user.setActive(true);
                    user.setVerified(true);
                    userRepository.save(user);
                    log.info("OPERATOR paroli yangilandi: phone={}", phone);
                }
            }
            return;
        }

        User operator = new User();
        operator.setPhone(phone);
        operator.setPasswordHash(passwordEncoder.encode(password));
        operator.setRole(Role.OPERATOR);
        operator.setActive(true);
        operator.setVerified(true);

        userRepository.save(operator);
        log.info("Boshlang'ich OPERATOR akkaunti yaratildi: phone={}", phone);
    }
}
