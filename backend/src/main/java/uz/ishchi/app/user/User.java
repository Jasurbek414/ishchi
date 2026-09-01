package uz.ishchi.app.user;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import uz.ishchi.app.common.Role;

import java.time.Instant;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PUBLIC)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 20)
    private String phone;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Column(name = "is_verified", nullable = false)
    private boolean verified = false;

    @Column(name = "telegram_chat_id")
    private Long telegramChatId;

    @Column(name = "telegram_link_token", length = 64)
    private String telegramLinkToken;

    @Enumerated(EnumType.STRING)
    @Column(name = "telegram_link_purpose", length = 20)
    private uz.ishchi.app.common.OtpPurpose telegramLinkPurpose;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public User(String phone, String passwordHash, Role role) {
        this.phone = phone;
        this.passwordHash = passwordHash;
        this.role = role;
    }
}
