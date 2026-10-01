package uz.ishchi.app.auth;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import uz.ishchi.app.common.OtpPurpose;

import java.time.Instant;

@Entity
@Table(name = "otp_codes")
@Getter
@Setter
@NoArgsConstructor
public class OtpCode {

    /** A 4-digit code has 9000 possibilities, so guessing has to be capped hard. */
    public static final int MAX_ATTEMPTS = 5;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 20)
    private String phone;

    @Column(nullable = false, length = 10)
    private String code;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private OtpPurpose purpose;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "is_used", nullable = false)
    private boolean used = false;

    /** Wrong-guess counter; the code is burned once it hits {@code MAX_ATTEMPTS}. */
    @Column(nullable = false)
    private int attempts = 0;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public OtpCode(String phone, String code, OtpPurpose purpose, Instant expiresAt) {
        this.phone = phone;
        this.code = code;
        this.purpose = purpose;
        this.expiresAt = expiresAt;
    }
}
