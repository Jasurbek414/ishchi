package uz.ishchi.app.telephony;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface OperatorTicketRepository extends JpaRepository<OperatorTicket, Long>, JpaSpecificationExecutor<OperatorTicket> {

    Optional<OperatorTicket> findByTicketNumber(String ticketNumber);

    List<OperatorTicket> findTop10ByCustomerPhoneOrderByCreatedAtDesc(String customerPhone);

    long countByStatus(TicketStatus status);

    long countByCreatedAtAfter(Instant after);

    long countByCompletedAtAfter(Instant after);
}
