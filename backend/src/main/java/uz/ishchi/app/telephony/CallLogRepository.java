package uz.ishchi.app.telephony;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.time.Instant;
import java.util.Optional;

public interface CallLogRepository extends JpaRepository<CallLog, Long>, JpaSpecificationExecutor<CallLog> {

    Optional<CallLog> findByCallId(String callId);

    long countByStartTimeAfter(Instant after);

    long countByStatus(CallStatus status);
}
