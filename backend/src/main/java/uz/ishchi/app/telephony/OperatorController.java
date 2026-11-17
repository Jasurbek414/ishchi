package uz.ishchi.app.telephony;

import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import uz.ishchi.app.security.UserPrincipal;
import uz.ishchi.app.telephony.dto.*;

import java.util.List;

@RestController
@RequestMapping("/api/operator")
@PreAuthorize("hasAnyRole('OPERATOR', 'ADMIN')")
public class OperatorController {

    private final TelephonyService telephonyService;
    private final OperatorTicketService ticketService;
    private final OperatorSseService sseService;

    public OperatorController(TelephonyService telephonyService,
                              OperatorTicketService ticketService,
                              OperatorSseService sseService) {
        this.telephonyService = telephonyService;
        this.ticketService = ticketService;
        this.sseService = sseService;
    }

    /**
     * Operator konsoli uchun real-time SSE oqimi (kiruvchi qo'ng'iroqlar, arizalar)
     */
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamEvents(@AuthenticationPrincipal UserPrincipal principal) {
        Long opId = principal != null ? principal.getId() : null;
        return sseService.subscribe(opId);
    }

    /**
     * Yangi chiquvchi qo'ng'iroqni boshlash (Raqam terish)
     */
    @PostMapping("/call/dial")
    public ResponseEntity<CallLogResponse> initiateCall(
            @Valid @RequestBody InitiateCallRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        Long opId = principal != null ? principal.getId() : null;
        return ResponseEntity.ok(telephonyService.initiateOutboundCall(request, opId));
    }

    /**
     * Qo'ng'iroqqa javob berish (Qabul qilish)
     */
    @PostMapping("/call/{callId}/answer")
    public ResponseEntity<CallLogResponse> answerCall(
            @PathVariable String callId,
            @AuthenticationPrincipal UserPrincipal principal) {
        Long opId = principal != null ? principal.getId() : null;
        return ResponseEntity.ok(telephonyService.answerCall(callId, opId));
    }

    /**
     * Qo'ng'iroqni tugatish (Trubkani qo'yish)
     */
    @PostMapping("/call/{callId}/hangup")
    public ResponseEntity<CallLogResponse> hangupCall(
            @PathVariable String callId,
            @RequestBody(required = false) HangupCallRequest request) {
        return ResponseEntity.ok(telephonyService.hangupCall(callId, request));
    }

    /**
     * Kiruvchi qo'ng'iroqni sinov tariqasida simulyatsiya qilish
     */
    @PostMapping("/call/simulate-incoming")
    public ResponseEntity<CallLogResponse> simulateIncoming(
            @RequestParam(required = false) String phone) {
        return ResponseEntity.ok(telephonyService.simulateIncomingCall(phone));
    }

    /**
     * Telefon orqali mijoz ma'lumotlarini tezkor tekshirish
     */
    @GetMapping("/lookup")
    public ResponseEntity<CustomerLookupResponse> lookupCustomer(@RequestParam String phone) {
        return ResponseEntity.ok(telephonyService.lookupCustomerByPhone(phone));
    }

    /**
     * Qo'ng'iroqlar jurnali
     */
    @GetMapping("/calls")
    public ResponseEntity<Page<CallLogResponse>> getCalls(
            @RequestParam(required = false) CallStatus status,
            @RequestParam(required = false) String phone,
            Pageable pageable) {
        return ResponseEntity.ok(telephonyService.getCalls(status, phone, pageable));
    }

    /**
     * Arizalar ro'yxati (filtrlash bilan)
     */
    @GetMapping("/tickets")
    public ResponseEntity<Page<OperatorTicketResponse>> getTickets(
            @RequestParam(required = false) TicketStatus status,
            @RequestParam(required = false) TicketUrgency urgency,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search,
            Pageable pageable) {
        return ResponseEntity.ok(ticketService.getTickets(status, urgency, category, search, pageable));
    }

    /**
     * Yangi ariza ochish
     */
    @PostMapping("/tickets")
    public ResponseEntity<OperatorTicketResponse> createTicket(
            @Valid @RequestBody CreateTicketRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ticketService.createTicket(request, principal));
    }

    /**
     * Ariza tafsiloti
     */
    @GetMapping("/tickets/{id}")
    public ResponseEntity<OperatorTicketResponse> getTicketById(@PathVariable Long id) {
        return ResponseEntity.ok(ticketService.getTicketById(id));
    }

    /**
     * Arizani yangilash / status o'zgartirish
     */
    @PatchMapping("/tickets/{id}")
    public ResponseEntity<OperatorTicketResponse> updateTicket(
            @PathVariable Long id,
            @RequestBody UpdateTicketRequest request) {
        return ResponseEntity.ok(ticketService.updateTicket(id, request));
    }

    /**
     * Arizaga mutaxassis biriktirish
     */
    @PostMapping("/tickets/{id}/assign")
    public ResponseEntity<OperatorTicketResponse> assignWorker(
            @PathVariable Long id,
            @Valid @RequestBody AssignWorkerRequest request) {
        return ResponseEntity.ok(ticketService.assignWorker(id, request));
    }

    /**
     * Hudud va kasb bo'yicha mos bo'sh mutaxassislar ro'yxati
     */
    @GetMapping("/workers")
    public ResponseEntity<List<AvailableWorkerDto>> getAvailableWorkers(
            @RequestParam(required = false) Long regionId,
            @RequestParam(required = false) Long districtId,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(ticketService.getAvailableWorkers(regionId, districtId, search));
    }

    /**
     * Operator boshqaruv paneli uchun umumiy ko'rsatkichlar (statistika)
     */
    @GetMapping("/stats")
    public ResponseEntity<OperatorStatsResponse> getStats() {
        return ResponseEntity.ok(ticketService.getStats());
    }
}
