package uz.ishchi.app.wallet;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WalletService {

    private final WalletAccountRepository walletAccountRepository;
    private final WalletTransactionRepository walletTransactionRepository;
    private final UserRepository userRepository;
    private final PaymentGatewayService paymentGatewayService;
    private final WorkerProfileRepository workerProfileRepository;
    private final EmployerProfileRepository employerProfileRepository;

    private static final Logger log = LoggerFactory.getLogger(WalletService.class);

    /** balance is numeric(14,2), so an unbounded amount could overflow the column. */
    private static final BigDecimal MAX_TOPUP = new BigDecimal("100000000");

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

    @Transactional(readOnly = true)
    public Page<TransactionResponse> getTransactions(User user, Pageable pageable) {
        WalletAccount wallet = getOrCreate(user.getId());
        return walletTransactionRepository.findByWalletIdOrderByCreatedAtDesc(wallet.getId(), pageable)
                .map(TransactionResponse::from);
    }

    /**
     * Charging the gateway first and only then touching the database meant a failure on the
     * database side (lock timeout, constraint, anything) rolled back the credit while the money
     * had already left the payer — a silently lost top-up. Everything that can be checked is now
     * checked before any money moves, and a charge that does go through but cannot be credited is
     * logged with its provider reference so it can be reconciled rather than vanishing.
     *
     * <p>A real gateway also needs a persisted pending-charge row so an interrupted request can be
     * settled on retry; with the current mock that would be scaffolding around nothing, so it is
     * deliberately left for whoever wires the real provider up.
     */
    @Transactional
    public WalletResponse topUp(User user, BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw ApiException.badRequest("Summa noldan katta bo'lishi kerak");
        }
        if (amount.compareTo(MAX_TOPUP) > 0) {
            throw ApiException.badRequest("Bir martada ko'pi bilan " + MAX_TOPUP.toBigInteger() + " so'm to'ldirish mumkin");
        }
        WalletAccount wallet = getOrCreateWithLock(user);

        var payment = paymentGatewayService.charge(user.getId(), amount);
        if (!payment.approved()) {
            throw ApiException.badRequest("To'lov amalga oshmadi, qaytadan urinib ko'ring");
        }
        try {
            credit(wallet, amount, TransactionType.TOPUP, "Hamyonni to'ldirish (" + payment.providerReference() + ")");
        } catch (RuntimeException e) {
            log.error("To'lov o'tdi, lekin balansga yozilmadi — solishtirish kerak. userId={} amount={} ref={}",
                    user.getId(), amount, payment.providerReference(), e);
            throw e;
        }
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
        Page<WalletTransaction> page = walletTransactionRepository.searchForAdmin(type, search, pageable);
        Map<Long, String> names = resolveFullNames(page.getContent());
        return page.map(tx -> AdminTransactionResponse.from(tx, names.get(tx.getWallet().getUser().getId())));
    }

    /**
     * Resolves every display name for the page in two queries instead of one per row — the admin
     * transaction list used to fire a profile lookup for each transaction it rendered.
     */
    private Map<Long, String> resolveFullNames(List<WalletTransaction> transactions) {
        Map<Role, List<Long>> idsByRole = transactions.stream()
                .map(tx -> tx.getWallet().getUser())
                .distinct()
                .filter(u -> u.getRole() == Role.WORKER || u.getRole() == Role.EMPLOYER)
                .collect(Collectors.groupingBy(User::getRole,
                        Collectors.mapping(User::getId, Collectors.toList())));

        Map<Long, String> names = new HashMap<>();
        List<Long> workerIds = idsByRole.getOrDefault(Role.WORKER, List.of());
        if (!workerIds.isEmpty()) {
            workerProfileRepository.findByUserIdIn(workerIds).forEach(p ->
                    names.put(p.getUser().getId(), p.getFirstName() + " " + p.getLastName()));
        }
        List<Long> employerIds = idsByRole.getOrDefault(Role.EMPLOYER, List.of());
        if (!employerIds.isEmpty()) {
            employerProfileRepository.findByUserIdIn(employerIds).forEach(p ->
                    names.put(p.getUser().getId(), p.getFirstName() + " " + p.getLastName()));
        }
        return names;
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
