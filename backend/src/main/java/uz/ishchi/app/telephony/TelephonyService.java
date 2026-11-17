package uz.ishchi.app.telephony;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.ishchi.app.profile.EmployerProfile;
import uz.ishchi.app.profile.EmployerProfileRepository;
import uz.ishchi.app.profile.WorkerProfile;
import uz.ishchi.app.profile.WorkerProfileRepository;
import uz.ishchi.app.telephony.dto.*;
import uz.ishchi.app.user.User;
import uz.ishchi.app.user.UserRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
public class TelephonyService {

    private static final Logger log = LoggerFactory.getLogger(TelephonyService.class);

    private final CallLogRepository callLogRepository;
    private final OperatorTicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final WorkerProfileRepository workerProfileRepository;
    private final EmployerProfileRepository employerProfileRepository;
    private final OperatorSseService sseService;

    public TelephonyService(CallLogRepository callLogRepository,
                            OperatorTicketRepository ticketRepository,
                            UserRepository userRepository,
                            WorkerProfileRepository workerProfileRepository,
                            EmployerProfileRepository employerProfileRepository,
                            OperatorSseService sseService) {
        this.callLogRepository = callLogRepository;
        this.ticketRepository = ticketRepository;
        this.userRepository = userRepository;
        this.workerProfileRepository = workerProfileRepository;
        this.employerProfileRepository = employerProfileRepository;
        this.sseService = sseService;
    }

    @Transactional
    public CallLogResponse handleIncomingCall(IncomingCallWebhookDto dto) {
        log.info("Yangi kiruvchi qo'ng'iroq qabul qilindi: callId={}, from={}, to={}",
                dto.callId(), dto.callerPhone(), dto.destinationNumber());

        CallLog call = callLogRepository.findByCallId(dto.callId())
                .orElseGet(() -> {
                    CallLog newCall = new CallLog();
                    newCall.setCallId(dto.callId());
                    return newCall;
                });

        call.setCallerPhone(dto.callerPhone());
        call.setDestinationNumber(dto.destinationNumber());
        call.setDirection(CallDirection.INBOUND);
        call.setStatus(CallStatus.RINGING);
        call.setStartTime(Instant.now());
        call.setUpdatedAt(Instant.now());

        CallLog saved = callLogRepository.save(call);

        // Mijoz ma'lumotlarini tekshirish
        String customerName = "Noma'lum mijoz";
        Long customerId = null;

        Optional<User> userOpt = userRepository.findByPhone(dto.callerPhone());
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            customerId = user.getId();
            Optional<EmployerProfile> empOpt = employerProfileRepository.findByUserId(user.getId());
            if (empOpt.isPresent()) {
                customerName = empOpt.get().getFirstName() +
                        (empOpt.get().getLastName() != null ? " " + empOpt.get().getLastName() : "");
            } else {
                Optional<WorkerProfile> workerOpt = workerProfileRepository.findByUserId(user.getId());
                if (workerOpt.isPresent()) {
                    customerName = workerOpt.get().getFirstName() +
                            (workerOpt.get().getLastName() != null ? " " + workerOpt.get().getLastName() : "");
                }
            }
        }

        // Real-time hodisa — operatorlar ekraniga uzatish
        LiveCallEvent event = new LiveCallEvent(
                "CALL_INCOMING",
                saved.getCallId(),
                saved.getCallerPhone(),
                customerName,
                customerId,
                CallStatus.RINGING,
                Instant.now()
        );
        sseService.broadcastCallEvent(event);

        return CallLogResponse.from(saved);
    }

    @Transactional
    public CallLogResponse handleCallAnswered(String callId, Long operatorId) {
        CallLog call = callLogRepository.findByCallId(callId)
                .orElseThrow(() -> new IllegalArgumentException("Qo'ng'iroq topilmadi: " + callId));

        call.setStatus(CallStatus.ANSWERED);
        call.setAnswerTime(Instant.now());
        call.setUpdatedAt(Instant.now());

        if (operatorId != null) {
            userRepository.findById(operatorId).ifPresent(call::setOperator);
        }

        CallLog saved = callLogRepository.save(call);

        sseService.broadcastCallEvent(new LiveCallEvent(
                "CALL_ANSWERED",
                saved.getCallId(),
                saved.getCallerPhone(),
                null,
                null,
                CallStatus.ANSWERED,
                Instant.now()
        ));

        return CallLogResponse.from(saved);
    }

    @Transactional
    public CallLogResponse handleCallEnd(CallEndWebhookDto dto) {
        CallLog call = callLogRepository.findByCallId(dto.callId())
                .orElseGet(() -> {
                    CallLog newCall = new CallLog();
                    newCall.setCallId(dto.callId());
                    newCall.setCallerPhone("unknown");
                    return newCall;
                });

        Instant now = Instant.now();
        call.setEndTime(now);
        call.setUpdatedAt(now);

        if (dto.durationSeconds() != null) {
            call.setDurationSeconds(dto.durationSeconds());
        }

        if (dto.recordingUrl() != null && !dto.recordingUrl().isBlank()) {
            call.setRecordingUrl(dto.recordingUrl());
        }

        if (dto.notes() != null) {
            call.setNotes(dto.notes());
        }

        if (dto.status() != null) {
            String s = dto.status().toUpperCase();
            if (s.contains("ANSWER")) {
                call.setStatus(CallStatus.COMPLETED);
            } else if (s.contains("BUSY")) {
                call.setStatus(CallStatus.BUSY);
            } else if (s.contains("NO ANSWER") || s.contains("CANCEL")) {
                call.setStatus(CallStatus.MISSED);
            } else {
                call.setStatus(CallStatus.FAILED);
            }
        } else {
            call.setStatus(CallStatus.COMPLETED);
        }

        CallLog saved = callLogRepository.save(call);

        sseService.broadcastCallEvent(new LiveCallEvent(
                "CALL_ENDED",
                saved.getCallId(),
                saved.getCallerPhone(),
                null,
                null,
                saved.getStatus(),
                now
        ));

        return CallLogResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public CustomerLookupResponse lookupCustomerByPhone(String phone) {
        if (phone == null || phone.isBlank()) {
            return new CustomerLookupResponse(phone, false, null, null, null, null, null, null, null, List.of());
        }

        String normalizedPhone = phone.trim();
        Optional<User> userOpt = userRepository.findByPhone(normalizedPhone);

        List<OperatorTicketResponse> previousTickets = ticketRepository
                .findTop10ByCustomerPhoneOrderByCreatedAtDesc(normalizedPhone)
                .stream()
                .map(OperatorTicketResponse::from)
                .toList();

        if (userOpt.isEmpty()) {
            return new CustomerLookupResponse(
                    normalizedPhone,
                    false,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    previousTickets
            );
        }

        User user = userOpt.get();
        String fullName = null;
        Long regionId = null;
        String regionName = null;
        Long districtId = null;
        String districtName = null;

        Optional<EmployerProfile> empOpt = employerProfileRepository.findByUserId(user.getId());
        if (empOpt.isPresent()) {
            EmployerProfile emp = empOpt.get();
            fullName = emp.getFirstName() + (emp.getLastName() != null ? " " + emp.getLastName() : "");
            if (emp.getRegion() != null) {
                regionId = emp.getRegion().getId();
                regionName = emp.getRegion().getName();
            }
            if (emp.getDistrict() != null) {
                districtId = emp.getDistrict().getId();
                districtName = emp.getDistrict().getName();
            }
        } else {
            Optional<WorkerProfile> workerOpt = workerProfileRepository.findByUserId(user.getId());
            if (workerOpt.isPresent()) {
                WorkerProfile worker = workerOpt.get();
                fullName = worker.getFirstName() + (worker.getLastName() != null ? " " + worker.getLastName() : "");
                if (worker.getRegion() != null) {
                    regionId = worker.getRegion().getId();
                    regionName = worker.getRegion().getName();
                }
                if (worker.getDistrict() != null) {
                    districtId = worker.getDistrict().getId();
                    districtName = worker.getDistrict().getName();
                }
            }
        }

        return new CustomerLookupResponse(
                normalizedPhone,
                true,
                user.getId(),
                fullName,
                user.getRole().name(),
                regionId,
                regionName,
                districtId,
                districtName,
                previousTickets
        );
    }

    @Transactional(readOnly = true)
    public Page<CallLogResponse> getCalls(CallStatus status, String phone, Pageable pageable) {
        org.springframework.data.jpa.domain.Specification<CallLog> spec = (root, query, cb) -> {
            var predicates = new java.util.ArrayList<jakarta.persistence.criteria.Predicate>();
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (phone != null && !phone.isBlank()) {
                predicates.add(cb.like(root.get("callerPhone"), "%" + phone.trim() + "%"));
            }
            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };
        return callLogRepository.findAll(spec, pageable).map(CallLogResponse::from);

    }
}
