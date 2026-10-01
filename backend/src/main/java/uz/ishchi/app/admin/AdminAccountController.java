package uz.ishchi.app.admin;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import uz.ishchi.app.admin.dto.AdminAccountResponse;
import uz.ishchi.app.admin.dto.AdminAccountUpdateRequest;
import uz.ishchi.app.common.exception.ApiException;
import uz.ishchi.app.security.UserPrincipal;
import uz.ishchi.app.user.RefreshTokenRepository;
import uz.ishchi.app.user.User;
import uz.ishchi.app.user.UserRepository;

/** The admin's own login (phone and password), changed from the panel's settings page. */
@RestController
@RequestMapping("/api/admin/account")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminAccountController {

    private static final int MIN_PASSWORD = 8;

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;

    @GetMapping
    public AdminAccountResponse get(@AuthenticationPrincipal UserPrincipal principal) {
        return new AdminAccountResponse(load(principal).getPhone(), null);
    }

    @PatchMapping
    @Transactional
    public AdminAccountResponse update(@AuthenticationPrincipal UserPrincipal principal,
                                       @Valid @RequestBody AdminAccountUpdateRequest request) {
        User admin = load(principal);
        if (!passwordEncoder.matches(request.currentPassword(), admin.getPasswordHash())) {
            throw ApiException.badRequest("Joriy parol noto'g'ri", "INVALID_CURRENT_PASSWORD");
        }

        String phone = blankToNull(request.phone());
        String newPassword = blankToNull(request.newPassword());
        boolean phoneChanged = phone != null && !phone.equals(admin.getPhone());
        if (!phoneChanged && newPassword == null) {
            throw ApiException.badRequest("Yangi telefon raqam yoki yangi parolni kiriting");
        }

        if (phoneChanged) {
            if (userRepository.existsByPhone(phone)) {
                throw ApiException.conflict("Bu telefon raqam boshqa akkauntga tegishli");
            }
            admin.setPhone(phone);
        }
        if (newPassword != null) {
            if (newPassword.length() < MIN_PASSWORD) {
                throw ApiException.badRequest("Yangi parol kamida " + MIN_PASSWORD + " belgidan iborat bo'lsin");
            }
            if (passwordEncoder.matches(newPassword, admin.getPasswordHash())) {
                throw ApiException.badRequest("Yangi parol joriy paroldan farq qilishi kerak");
            }
            admin.setPasswordHash(passwordEncoder.encode(newPassword));
        }
        // Any other signed-in panel has to log in again with the new details.
        refreshTokenRepository.revokeAllForUser(admin.getId());
        userRepository.save(admin);
        return new AdminAccountResponse(admin.getPhone(), "Kirish ma'lumotlari yangilandi");
    }

    private User load(UserPrincipal principal) {
        return userRepository.findById(principal.getUser().getId())
                .orElseThrow(() -> ApiException.notFound("Foydalanuvchi topilmadi"));
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
