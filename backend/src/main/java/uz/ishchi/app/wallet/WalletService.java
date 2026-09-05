package uz.ishchi.app.wallet;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.ishchi.app.common.Role;
import uz.ishchi.app.common.TransactionType;
import uz.ishchi.app.common.exception.ApiException;
import uz.ishchi.app.profile.EmployerProfileRepository;
import uz.ishchi.app.profile.WorkerProfileRepository;
import uz.ishchi.app.user.User;
import uz.ishchi.app.user.UserRepository;
import uz.ishchi.app.wallet.dto.AdminTransactionResponse;
import uz.ishchi.app.wallet.dto.TransactionResponse;
import uz.ishchi.app.wallet.dto.WalletResponse;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class WalletService {

    private final WalletAccountRepository walletAccountRepository;
    private final WalletTransactionRepository walletTransactionRepository;
    private final UserRepository userRepository;
    private final PaymentGatewayService paymentGatewayService;
    private final WorkerProfileRepository workerProfileRepository;
    private final EmployerProfileRepository employerProfileRepository;

    @Transactional
    public WalletAccount createForUser(User user) {
        return walletAccountRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    try {
                        return walletAccountRepository.save(new WalletAccount(user));
                    } catch (org.springframework.dao.DataIntegrityViolationException e) {
                        return walletAccountRepository.findByUserId(user.getId()).orElseThrow(() -> e);
                    }
                });
    }

    @Transactional
    public WalletResponse getWallet(User user) {
        return WalletResponse.from(getOrCreate(user.getId()));
    }

    @Transactional
    public WalletResponse getWalletByUserId(Long userId) {
        return WalletResponse.from(getOrCreate(userId));
    }

    @Transactional
    public Page<TransactionResponse> getTransactions(User user, Pageable pageable) {
        WalletAccount wallet = getOrCreate(user.getId());
        return walletTransactionRepository.findByWalletIdOrderByCreatedAtDesc(wallet.getId(), pageable)
                .map(TransactionResponse::from);
    }

    @Transactional
    public WalletResponse topUp(User user, BigDecimal amount) {
        var payment = paymentGatewayService.charge(user.getId(), amount);
        if (!payment.approved()) {
            throw ApiException.badRequest("To'lov amalga oshmadi, qaytadan urinib ko'ring");
        }
        WalletAccount wallet = getOrCreateWithLock(user);
        credit(wallet, amount, TransactionType.TOPUP, "Hamyonni to'ldirish (" + payment.providerReference() + ")");
        return WalletResponse.from(wallet);
    }

    /**
     * Charges a user for a paid platform action (posting a job, unlocking a job's contact
     * details, etc.) — debits the wallet and records the transaction under the given type.
     * Throws with {@code INSUFFICIENT_BALANCE} if the balance can't cover it, so callers can
     * reject the underlying action (job not created / job stays locked) atomically: this runs
     * in the same transaction as the caller, so a thrown exception rolls back any charge.
     */
    @Transactional
    public void charge(User user, BigDecimal amount, TransactionType type, String note) {
        WalletAccount wallet = getOrCreateWithLock(user);
        debit(wallet, amount, type, note);
    }

    @Transactional
    public WalletResponse adminAdjust(Long targetUserId, BigDecimal amount, String note) {
        if (amount.compareTo(BigDecimal.ZERO) == 0) {
            throw ApiException.badRequest("Summa nolga teng bo'lishi mumkin emas");
        }
        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> ApiException.notFound("Foydalanuvchi topilmadi"));
        WalletAccount wallet = getOrCreateWithLock(targetUser);

        if (amount.compareTo(BigDecimal.ZERO) > 0) {
            credit(wallet, amount, TransactionType.ADMIN_CREDIT, note);
        } else {
            debit(wallet, amount.abs(), TransactionType.ADMIN_DEBIT, note);
        }
        return WalletResponse.from(wallet);
    }

    @Transactional(readOnly = true)
    public Page<AdminTransactionResponse> adminListTransactions(TransactionType type, String search, Pageable pageable) {
        return walletTransactionRepository.searchForAdmin(type, search, pageable)
                .map(tx -> AdminTransactionResponse.from(tx, resolveFullName(tx.getWallet().getUser())));
    }

    private String resolveFullName(User user) {
        if (user.getRole() == Role.WORKER) {
            return workerProfileRepository.findByUserId(user.getId())
                    .map(p -> p.getFirstName() + " " + p.getLastName()).orElse(null);
        }
        if (user.getRole() == Role.EMPLOYER) {
            return employerProfileRepository.findByUserId(user.getId())
                    .map(p -> p.getFirstName() + " " + p.getLastName()).orElse(null);
        }
        return null;
    }

    private WalletAccount getOrCreate(Long userId) {
        return walletAccountRepository.findByUserId(userId)
                .orElseGet(() -> {
                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> ApiException.notFound("Foydalanuvchi topilmadi"));
                    try {
                        return walletAccountRepository.save(new WalletAccount(user));
                    } catch (org.springframework.dao.DataIntegrityViolationException e) {
                        return walletAccountRepository.findByUserId(userId).orElseThrow(() -> e);
                    }
                });
    }

    private WalletAccount getOrCreateWithLock(User user) {
        return walletAccountRepository.findWithLockByUserId(user.getId())
                .orElseGet(() -> {
                    try {
                        return walletAccountRepository.save(new WalletAccount(user));
                    } catch (org.springframework.dao.DataIntegrityViolationException e) {
                        return walletAccountRepository.findWithLockByUserId(user.getId()).orElseThrow(() -> e);
                    }
                });
    }

    private void credit(WalletAccount wallet, BigDecimal amount, TransactionType type, String note) {
        wallet.setBalance(wallet.getBalance().add(amount));
        walletTransactionRepository.save(new WalletTransaction(wallet, type, amount, wallet.getBalance(), note));
    }

    private void debit(WalletAccount wallet, BigDecimal amount, TransactionType type, String note) {
        if (wallet.getBalance().compareTo(amount) < 0) {
            throw ApiException.badRequest("Hamyonda mablag' yetarli emas", "INSUFFICIENT_BALANCE");
        }
        wallet.setBalance(wallet.getBalance().subtract(amount));
        walletTransactionRepository.save(new WalletTransaction(wallet, type, amount.negate(), wallet.getBalance(), note));
    }
}
