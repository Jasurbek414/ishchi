package uz.ishchi.app.user;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import uz.ishchi.app.common.Role;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByPhone(String phone);

    Optional<User> findByTelegramLinkToken(String telegramLinkToken);

    boolean existsByPhone(String phone);

    Page<User> findByRole(uz.ishchi.app.common.Role role, Pageable pageable);

    long countByRole(uz.ishchi.app.common.Role role);

    long countByCreatedAtAfter(Instant instant);

    long countByCreatedAtBetween(Instant from, Instant to);

    @Query("select u.telegramChatId from User u where u.telegramChatId is not null and u.active = true")
    List<Long> findAllActiveTelegramChatIds();

    @Query("select u.telegramChatId from User u where u.telegramChatId is not null and u.active = true and u.role = :role")
    List<Long> findTelegramChatIdsByRole(@Param("role") Role role);

    @Query("select u.telegramChatId from User u join WorkerProfile wp on wp.user = u " +
            "where u.telegramChatId is not null and u.active = true and u.role = 'WORKER' and wp.region.id = :regionId")
    List<Long> findWorkerTelegramChatIdsByRegion(@Param("regionId") Long regionId);

    @Query("select u.telegramChatId from User u join EmployerProfile ep on ep.user = u " +
            "where u.telegramChatId is not null and u.active = true and u.role = 'EMPLOYER' and ep.region.id = :regionId")
    List<Long> findEmployerTelegramChatIdsByRegion(@Param("regionId") Long regionId);

    Optional<User> findByTelegramChatId(Long telegramChatId);

    long countByTelegramChatIdIsNotNull();

    long countByActiveFalse();

    /** Admin search — matches phone (contains) or the linked worker/employer profile's
     *  full name (contains, case-insensitive). Role and search are both optional filters. */
    @Query(value = """
            select u from User u
            left join WorkerProfile wp on wp.user = u
            left join EmployerProfile ep on ep.user = u
            where (:role is null or u.role = :role)
            and (:active is null or u.active = :active)
            and (:verified is null or u.verified = :verified)
            and (:search is null or :search = ''
                 or lower(u.phone) like lower(concat('%', :search, '%'))
                 or lower(concat(concat(coalesce(wp.firstName, ''), ' '), coalesce(wp.lastName, ''))) like lower(concat('%', :search, '%'))
                 or lower(concat(concat(coalesce(ep.firstName, ''), ' '), coalesce(ep.lastName, ''))) like lower(concat('%', :search, '%')))
            """,
            countQuery = """
            select count(u) from User u
            left join WorkerProfile wp on wp.user = u
            left join EmployerProfile ep on ep.user = u
            where (:role is null or u.role = :role)
            and (:active is null or u.active = :active)
            and (:verified is null or u.verified = :verified)
            and (:search is null or :search = ''
                 or lower(u.phone) like lower(concat('%', :search, '%'))
                 or lower(concat(concat(coalesce(wp.firstName, ''), ' '), coalesce(wp.lastName, ''))) like lower(concat('%', :search, '%'))
                 or lower(concat(concat(coalesce(ep.firstName, ''), ' '), coalesce(ep.lastName, ''))) like lower(concat('%', :search, '%')))
            """)
    Page<User> search(@Param("role") Role role, @Param("active") Boolean active, @Param("verified") Boolean verified,
                       @Param("search") String search, Pageable pageable);
}
