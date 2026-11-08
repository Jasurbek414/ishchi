package uz.ishchi.app.emergency;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import uz.ishchi.app.emergency.dto.ContractApplicationRequest;
import uz.ishchi.app.emergency.dto.ContractStatusResponse;
import uz.ishchi.app.security.UserPrincipal;

@RestController
@RequestMapping("/api/worker/contract")
@PreAuthorize("hasRole('WORKER')")
public class WorkerContractController {

    private final EmergencyService emergencyService;

    public WorkerContractController(EmergencyService emergencyService) {
        this.emergencyService = emergencyService;
    }

    @GetMapping
    public ResponseEntity<ContractStatusResponse> getStatus(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(emergencyService.getWorkerContractStatus(principal.getUser()));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ContractStatusResponse> submitApplication(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) String fullName,
            @RequestParam(required = false) String phone,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String passportData,
            @RequestParam(required = false) Integer experienceYears,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) String telegramUsername,
            @RequestParam(defaultValue = "false") boolean agreedToTerms,
            @RequestParam(value = "passportPhoto", required = false) MultipartFile passportPhoto,
            @RequestParam(value = "passportBack", required = false) MultipartFile passportBack,
            @RequestParam(value = "certificate", required = false) MultipartFile certificate,
            @RequestParam(value = "toolsPhoto", required = false) MultipartFile toolsPhoto
    ) {
        var request = new ContractApplicationRequest(
                fullName, phone, category, passportData,
                experienceYears, description, telegramUsername, agreedToTerms
        );
        return ResponseEntity.ok(emergencyService.submitApplication(
                principal.getUser(),
                request,
                passportPhoto,
                passportBack,
                certificate,
                toolsPhoto
        ));
    }
}
