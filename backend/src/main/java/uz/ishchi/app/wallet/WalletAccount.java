package uz.ishchi.app.wallet;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.UpdateTimestamp;
import uz.ishchi.app.user.User;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "wallet_accounts")
@Getter
@Setter
@NoArgsConstructor
public class WalletAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal balance = BigDecimal.ZERO;

    @Version
    private Long version;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public WalletAccount(User user) {
        this.user = user;
        this.balance = BigDecimal.ZERO;
    }
}
