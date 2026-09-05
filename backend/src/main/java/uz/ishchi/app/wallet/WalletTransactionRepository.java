package uz.ishchi.app.wallet;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import uz.ishchi.app.common.TransactionType;

public interface WalletTransactionRepository extends JpaRepository<WalletTransaction, Long> {

    Page<WalletTransaction> findByWalletIdOrderByCreatedAtDesc(Long walletId, Pageable pageable);

    /** Admin-wide ledger — matches phone or the linked worker/employer profile's full name. */
    @Query(value = """
            select t from WalletTransaction t
            join t.wallet w
            join w.user u
            left join WorkerProfile wp on wp.user = u
            left join EmployerProfile ep on ep.user = u
            where (:type is null or t.type = :type)
            and (:search is null or :search = ''
                 or lower(u.phone) like lower(concat('%', :search, '%'))
                 or lower(concat(concat(coalesce(wp.firstName, ''), ' '), coalesce(wp.lastName, ''))) like lower(concat('%', :search, '%'))
                 or lower(concat(concat(coalesce(ep.firstName, ''), ' '), coalesce(ep.lastName, ''))) like lower(concat('%', :search, '%')))
            """,
            countQuery = """
            select count(t) from WalletTransaction t
            join t.wallet w
            join w.user u
            left join WorkerProfile wp on wp.user = u
            left join EmployerProfile ep on ep.user = u
            where (:type is null or t.type = :type)
            and (:search is null or :search = ''
                 or lower(u.phone) like lower(concat('%', :search, '%'))
                 or lower(concat(concat(coalesce(wp.firstName, ''), ' '), coalesce(wp.lastName, ''))) like lower(concat('%', :search, '%'))
                 or lower(concat(concat(coalesce(ep.firstName, ''), ' '), coalesce(ep.lastName, ''))) like lower(concat('%', :search, '%')))
            """)
    Page<WalletTransaction> searchForAdmin(@Param("type") TransactionType type, @Param("search") String search, Pageable pageable);
}
