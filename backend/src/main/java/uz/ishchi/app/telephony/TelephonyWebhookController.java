package uz.ishchi.app.telephony;

import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import uz.ishchi.app.telephony.dto.CallEndWebhookDto;
import uz.ishchi.app.telephony.dto.CallLogResponse;
import uz.ishchi.app.telephony.dto.IncomingCallWebhookDto;

import java.security.MessageDigest;

@RestController
@RequestMapping("/api/telephony/webhook")
public class TelephonyWebhookController {

    private static final Logger log = LoggerFactory.getLogger(TelephonyWebhookController.class);

    private final TelephonyService telephonyService;
    private final TelephonyProperties telephonyProperties;

    public TelephonyWebhookController(TelephonyService telephonyService,
                                      TelephonyProperties telephonyProperties) {
        this.telephonyService = telephonyService;
        this.telephonyProperties = telephonyProperties;
    }

    private boolean isAuthorized(String headerSecret) {
        String configured = telephonyProperties.getWebhookSecret();
        if (configured == null || configured.isBlank()) {
            return true;
        }
        if (headerSecret == null) {
            return false;
        }
        return MessageDigest.isEqual(configured.getBytes(), headerSecret.getBytes());
    }

    @PostMapping("/call-incoming")
    public ResponseEntity<?> onCallIncoming(
            @RequestHeader(value = "X-Telephony-Secret-Token", required = false) String secret,
            @Valid @RequestBody IncomingCallWebhookDto dto) {

        if (!isAuthorized(secret)) {
            log.warn("Telephony webhook ruxsatsiz so'rov: callId={}", dto.callId());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Noto'g'ri maxfiy token");
        }

        CallLogResponse res = telephonyService.handleIncomingCall(dto);
        return ResponseEntity.ok(res);
    }

    @PostMapping("/call-answered")
    public ResponseEntity<?> onCallAnswered(
            @RequestHeader(value = "X-Telephony-Secret-Token", required = false) String secret,
            @RequestParam String callId,
            @RequestParam(required = false) Long operatorId) {

        if (!isAuthorized(secret)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Noto'g'ri maxfiy token");
        }

        CallLogResponse res = telephonyService.handleCallAnswered(callId, operatorId);
        return ResponseEntity.ok(res);
    }

    @PostMapping("/call-end")
    public ResponseEntity<?> onCallEnd(
            @RequestHeader(value = "X-Telephony-Secret-Token", required = false) String secret,
            @Valid @RequestBody CallEndWebhookDto dto) {

        if (!isAuthorized(secret)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Noto'g'ri maxfiy token");
        }

        CallLogResponse res = telephonyService.handleCallEnd(dto);
        return ResponseEntity.ok(res);
    }
}
