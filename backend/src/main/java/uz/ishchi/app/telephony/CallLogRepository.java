package uz.ishchi.app.telephony;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;

public interface CallLogRepository extends JpaRepository<CallLog, Long> {

    Optional<CallLog> findByCallId(String callId);

    Page<CallLog> findByCallerPhoneContainingOrderByStartTimeDesc(String phone, Pageable pageable);

    @Query("SELECT c FROM CallLog c LEFT JOIN FETCH c.operator WHERE " +
           "(:status IS NULL OR c.status = :status) AND " +
           "(:phone IS NULL OR c.callerPhone LIKE CONCAT('%', :phone, '%')) " +
           "ORDER BY c.startTime DESC")
    Page<CallLog> findAllFiltered(@Param("status") CallStatus status,
                                  @Param("phone") String phone,
                                  Pageable pageable);

    long countByStartTimeAfter(Instant after);

    long countByStatus(CallStatus status);
}
