package uz.ishchi.app.wallet;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

import jakarta.persistence.LockModeType;
import java.math.BigDecimal;
import java.util.Optional;

public interface WalletAccountRepository extends JpaRepository<WalletAccount, Long> {

    Optional<WalletAccount> findByUserId(Long userId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<WalletAccount> findWithLockByUserId(Long userId);

    @Query("select coalesce(sum(w.balance), 0) from WalletAccount w")
    BigDecimal sumAllBalances();
}
