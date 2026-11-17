package uz.ishchi.app.telephony;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface OperatorTicketRepository extends JpaRepository<OperatorTicket, Long> {

    Optional<OperatorTicket> findByTicketNumber(String ticketNumber);

    List<OperatorTicket> findTop10ByCustomerPhoneOrderByCreatedAtDesc(String customerPhone);

    @Query("SELECT t FROM OperatorTicket t " +
           "LEFT JOIN FETCH t.region " +
           "LEFT JOIN FETCH t.district " +
           "LEFT JOIN FETCH t.operator " +
           "LEFT JOIN FETCH t.assignedWorker " +
           "WHERE (:status IS NULL OR t.status = :status) AND " +
           "(:urgency IS NULL OR t.urgency = :urgency) AND " +
           "(:category IS NULL OR t.category = :category) AND " +
           "(:search IS NULL OR t.customerPhone LIKE CONCAT('%', :search, '%') OR " +
           " LOWER(t.customerName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(t.ticketNumber) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY t.createdAt DESC")
    Page<OperatorTicket> findAllFiltered(@Param("status") TicketStatus status,
                                         @Param("urgency") TicketUrgency urgency,
                                         @Param("category") String category,
                                         @Param("search") String search,
                                         Pageable pageable);

    long countByStatus(TicketStatus status);

    long countByCreatedAtAfter(Instant after);

    long countByCompletedAtAfter(Instant after);
}
