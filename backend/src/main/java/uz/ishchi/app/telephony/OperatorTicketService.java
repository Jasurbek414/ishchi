package uz.ishchi.app.telephony;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.ishchi.app.location.District;
import uz.ishchi.app.location.DistrictRepository;
import uz.ishchi.app.location.Region;
import uz.ishchi.app.location.RegionRepository;
import uz.ishchi.app.notification.NotificationService;
import uz.ishchi.app.profile.WorkerProfile;
import uz.ishchi.app.profile.WorkerProfileRepository;
import uz.ishchi.app.security.UserPrincipal;
import uz.ishchi.app.telephony.dto.*;
import uz.ishchi.app.user.User;
import uz.ishchi.app.user.UserRepository;

import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class OperatorTicketService {

    private static final Logger log = LoggerFactory.getLogger(OperatorTicketService.class);

    private final OperatorTicketRepository ticketRepository;
    private final CallLogRepository callLogRepository;
    private final UserRepository userRepository;
    private final WorkerProfileRepository workerProfileRepository;
    private final RegionRepository regionRepository;
    private final DistrictRepository districtRepository;
    private final NotificationService notificationService;

    public OperatorTicketService(OperatorTicketRepository ticketRepository,
                                 CallLogRepository callLogRepository,
                                 UserRepository userRepository,
                                 WorkerProfileRepository workerProfileRepository,
                                 RegionRepository regionRepository,
                                 DistrictRepository districtRepository,
                                 NotificationService notificationService) {
        this.ticketRepository = ticketRepository;
        this.callLogRepository = callLogRepository;
        this.userRepository = userRepository;
        this.workerProfileRepository = workerProfileRepository;
        this.regionRepository = regionRepository;
        this.districtRepository = districtRepository;
        this.notificationService = notificationService;
    }

    @Transactional
    public OperatorTicketResponse createTicket(CreateTicketRequest req, UserPrincipal operatorPrincipal) {
        OperatorTicket ticket = new OperatorTicket();

        String datePrefix = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String shortId = UUID.randomUUID().toString().substring(0, 5).toUpperCase();
        ticket.setTicketNumber("TCK-" + datePrefix + "-" + shortId);

        ticket.setCustomerPhone(req.customerPhone());
        ticket.setCustomerName(req.customerName());
        ticket.setAddressLine(req.addressLine());
        ticket.setLatitude(req.latitude());
        ticket.setLongitude(req.longitude());
        ticket.setCategory(req.category());
        ticket.setProblemDescription(req.problemDescription());
        ticket.setUrgency(req.urgency() != null ? req.urgency() : TicketUrgency.NORMAL);
        ticket.setPriceAgreed(req.priceAgreed());
        ticket.setPaymentType(req.paymentType() != null ? req.paymentType() : "CASH");
        ticket.setNotes(req.notes());

        // Bog'liq qo'ng'iroq
        if (req.callId() != null && !req.callId().isBlank()) {
            callLogRepository.findByCallId(req.callId()).ifPresent(ticket::setCall);
        }

        // Operator
        if (operatorPrincipal != null && operatorPrincipal.getId() != null) {
            userRepository.findById(operatorPrincipal.getId()).ifPresent(ticket::setOperator);
        }

        // Mijoz akkaunti
        if (req.customerUserId() != null) {
            userRepository.findById(req.customerUserId()).ifPresent(ticket::setCustomerUser);
        } else {
            userRepository.findByPhone(req.customerPhone()).ifPresent(ticket::setCustomerUser);
        }

        // Hudud va tuman
        if (req.regionId() != null) {
            regionRepository.findById(req.regionId()).ifPresent(ticket::setRegion);
        }
        if (req.districtId() != null) {
            districtRepository.findById(req.districtId()).ifPresent(ticket::setDistrict);
        }

        // Mutaxassis biriktirish
        if (req.assignedWorkerId() != null) {
            Optional<WorkerProfile> workerOpt = workerProfileRepository.findById(req.assignedWorkerId());
            if (workerOpt.isPresent()) {
                WorkerProfile worker = workerOpt.get();
                ticket.setAssignedWorker(worker);
                ticket.setStatus(TicketStatus.ASSIGNED);
                ticket.setAssignedAt(Instant.now());
                notifyWorker(worker, ticket);
            }
        }

        OperatorTicket saved = ticketRepository.save(ticket);
        log.info("Yangi operator chiptasi yaratildi: number={}, category={}, urgency={}",
                saved.getTicketNumber(), saved.getCategory(), saved.getUrgency());

        return OperatorTicketResponse.from(saved);
    }

    @Transactional
    public OperatorTicketResponse updateTicket(Long ticketId, UpdateTicketRequest req) {
        OperatorTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("Ariza topilmadi: " + ticketId));

        if (req.customerName() != null) ticket.setCustomerName(req.customerName());
        if (req.addressLine() != null) ticket.setAddressLine(req.addressLine());
        if (req.latitude() != null) ticket.setLatitude(req.latitude());
        if (req.longitude() != null) ticket.setLongitude(req.longitude());
        if (req.category() != null) ticket.setCategory(req.category());
        if (req.problemDescription() != null) ticket.setProblemDescription(req.problemDescription());
        if (req.urgency() != null) ticket.setUrgency(req.urgency());
        if (req.priceAgreed() != null) ticket.setPriceAgreed(req.priceAgreed());
        if (req.paymentType() != null) ticket.setPaymentType(req.paymentType());
        if (req.notes() != null) ticket.setNotes(req.notes());
        if (req.cancellationReason() != null) ticket.setCancellationReason(req.cancellationReason());

        if (req.regionId() != null) {
            regionRepository.findById(req.regionId()).ifPresent(ticket::setRegion);
        }
        if (req.districtId() != null) {
            districtRepository.findById(req.districtId()).ifPresent(ticket::setDistrict);
        }

        if (req.assignedWorkerId() != null) {
            workerProfileRepository.findById(req.assignedWorkerId()).ifPresent(worker -> {
                ticket.setAssignedWorker(worker);
                if (ticket.getStatus() == TicketStatus.NEW) {
                    ticket.setStatus(TicketStatus.ASSIGNED);
                    ticket.setAssignedAt(Instant.now());
                }
                notifyWorker(worker, ticket);
            });
        }

        if (req.status() != null) {
            ticket.setStatus(req.status());
            if (req.status() == TicketStatus.COMPLETED && ticket.getCompletedAt() == null) {
                ticket.setCompletedAt(Instant.now());
            }
        }

        ticket.setUpdatedAt(Instant.now());
        OperatorTicket saved = ticketRepository.save(ticket);
        return OperatorTicketResponse.from(saved);
    }

    @Transactional
    public OperatorTicketResponse assignWorker(Long ticketId, AssignWorkerRequest req) {
        OperatorTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("Ariza topilmadi: " + ticketId));

        WorkerProfile worker = workerProfileRepository.findById(req.workerId())
                .orElseThrow(() -> new IllegalArgumentException("Mutaxassis topilmadi: " + req.workerId()));

        ticket.setAssignedWorker(worker);
        ticket.setStatus(TicketStatus.ASSIGNED);
        ticket.setAssignedAt(Instant.now());
        if (req.priceAgreed() != null) {
            ticket.setPriceAgreed(req.priceAgreed());
        }
        if (req.notes() != null) {
            ticket.setNotes((ticket.getNotes() != null ? ticket.getNotes() + "\n" : "") + req.notes());
        }
        ticket.setUpdatedAt(Instant.now());

        OperatorTicket saved = ticketRepository.save(ticket);
        notifyWorker(worker, saved);

        return OperatorTicketResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public Page<OperatorTicketResponse> getTickets(TicketStatus status,
                                                   TicketUrgency urgency,
                                                   String category,
                                                   String search,
                                                   Pageable pageable) {
        org.springframework.data.jpa.domain.Specification<OperatorTicket> spec = (root, query, cb) -> {
            var predicates = new java.util.ArrayList<jakarta.persistence.criteria.Predicate>();
            if (status != null) predicates.add(cb.equal(root.get("status"), status));
            if (urgency != null) predicates.add(cb.equal(root.get("urgency"), urgency));
            if (category != null && !category.isBlank()) predicates.add(cb.equal(root.get("category"), category));
            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                var p1 = cb.like(cb.lower(root.get("customerPhone")), pattern);
                var p2 = cb.like(cb.lower(root.get("customerName")), pattern);
                var p3 = cb.like(cb.lower(root.get("ticketNumber")), pattern);
                predicates.add(cb.or(p1, p2, p3));
            }
            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };
        return ticketRepository.findAll(spec, pageable).map(OperatorTicketResponse::from);

    }

    @Transactional(readOnly = true)
    public OperatorTicketResponse getTicketById(Long id) {
        return ticketRepository.findById(id)
                .map(OperatorTicketResponse::from)
                .orElseThrow(() -> new IllegalArgumentException("Ariza topilmadi: " + id));
    }

    @Transactional(readOnly = true)
    public OperatorStatsResponse getStats() {
        Instant startOfDay = LocalDate.now().atStartOfDay(java.time.ZoneId.of("Asia/Tashkent")).toInstant();

        long totalCalls = callLogRepository.countByStartTimeAfter(startOfDay);
        long answeredCalls = callLogRepository.countByStatus(CallStatus.COMPLETED) +
                callLogRepository.countByStatus(CallStatus.ANSWERED);
        long missedCalls = callLogRepository.countByStatus(CallStatus.MISSED);

        long activeTickets = ticketRepository.countByStatus(TicketStatus.NEW) +
                ticketRepository.countByStatus(TicketStatus.ASSIGNED) +
                ticketRepository.countByStatus(TicketStatus.IN_PROGRESS);

        long completedToday = ticketRepository.countByCompletedAtAfter(startOfDay);
        long emergencyCount = ticketRepository.countByStatus(TicketStatus.NEW); // Yangi arizalar tezkor e'tibor talab qiladi

        return new OperatorStatsResponse(
                totalCalls,
                answeredCalls,
                missedCalls,
                activeTickets,
                completedToday,
                emergencyCount
        );
    }

    @Transactional(readOnly = true)
    public List<AvailableWorkerDto> getAvailableWorkers(Long regionId, Long districtId, String search) {
        // Hudud va mavjudligi bo'yicha mutaxassislarni qidirish
        List<WorkerProfile> workers = workerProfileRepository.findAll().stream()
                .filter(WorkerProfile::isAvailable)
                .filter(w -> regionId == null || (w.getRegion() != null && w.getRegion().getId().equals(regionId)))
                .filter(w -> districtId == null || (w.getDistrict() != null && w.getDistrict().getId().equals(districtId)))
                .filter(w -> {
                    if (search == null || search.isBlank()) return true;
                    String s = search.toLowerCase();
                    boolean nameMatch = (w.getFirstName() + " " + (w.getLastName() != null ? w.getLastName() : ""))
                            .toLowerCase().contains(s);
                    boolean profMatch = w.getProfessions() != null && w.getProfessions().stream()
                            .anyMatch(p -> p.getName() != null && p.getName().toLowerCase().contains(s));

                    return nameMatch || profMatch;
                })
                .limit(50)
                .toList();

        return workers.stream().map(AvailableWorkerDto::from).toList();
    }

    private void notifyWorker(WorkerProfile worker, OperatorTicket ticket) {
        if (worker.getUser() == null) return;
        try {
            String title = "Yangi chaqiruv: " + ticket.getCategory();
            String body = "Manzil: " + (ticket.getAddressLine() != null ? ticket.getAddressLine() : "Operator orqali belgilandi") +
                    ". Aloqa: " + ticket.getCustomerPhone();

            notificationService.sendToUser(
                    worker.getUser(),
                    title,
                    body,
                    "TICKET_DISPATCH",
                    Map.of(
                            "ticketId", String.valueOf(ticket.getId()),
                            "ticketNumber", ticket.getTicketNumber(),
                            "phone", ticket.getCustomerPhone()
                    )
            );
            log.info("Mutaxassisga bildirishnoma yuborildi: workerId={}, ticketId={}",
                    worker.getId(), ticket.getId());
        } catch (Exception e) {
            log.warn("Mutaxassisga bildirishnoma yuborishda xatolik (davom etiladi): {}", e.getMessage());
        }
    }
}
