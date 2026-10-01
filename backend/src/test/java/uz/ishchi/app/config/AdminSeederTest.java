package uz.ishchi.app.config;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import uz.ishchi.app.common.Role;
import uz.ishchi.app.user.User;
import uz.ishchi.app.user.UserRepository;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AdminSeederTest {

    private static final String PHONE = "+998900000099";

    private final UserRepository users = mock(UserRepository.class);
    private final PasswordEncoder encoder = new BCryptPasswordEncoder(4);

    private AdminSeeder seeder(String password) {
        return new AdminSeeder(new AdminProperties(PHONE, password), users, encoder);
    }

    @Test
    void createsTheAdminWhenThePhoneIsNew() {
        when(users.findByPhone(PHONE)).thenReturn(Optional.empty());

        seeder("first-pass").run();

        verify(users).save(any(User.class));
    }

    @Test
    void aChangedPasswordInEnvReplacesTheStoredOne() {
        User admin = new User(PHONE, encoder.encode("old-pass"), Role.ADMIN);
        admin.setActive(true);
        when(users.findByPhone(PHONE)).thenReturn(Optional.of(admin));

        seeder("new-pass").run();

        assertThat(encoder.matches("new-pass", admin.getPasswordHash())).isTrue();
        verify(users).save(admin);
    }

    @Test
    void anUnchangedPasswordIsNotRewritten() {
        User admin = new User(PHONE, encoder.encode("same-pass"), Role.ADMIN);
        admin.setActive(true);
        when(users.findByPhone(PHONE)).thenReturn(Optional.of(admin));

        seeder("same-pass").run();

        verify(users, never()).save(any(User.class));
    }

    @Test
    void aWorkersPhoneIsNotPromoted() {
        User worker = new User(PHONE, encoder.encode("x"), Role.WORKER);
        when(users.findByPhone(PHONE)).thenReturn(Optional.of(worker));

        seeder("admin-pass").run();

        assertThat(worker.getRole()).isEqualTo(Role.WORKER);
        verify(users, never()).save(any(User.class));
    }
}
