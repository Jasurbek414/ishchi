package uz.ishchi.app.report;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import uz.ishchi.app.report.dto.ReportRequest;
import uz.ishchi.app.report.dto.ReportResponse;
import uz.ishchi.app.security.UserPrincipal;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @PostMapping
    public ReportResponse submit(@AuthenticationPrincipal UserPrincipal principal,
                                  @Valid @RequestBody ReportRequest request) {
        return reportService.submit(principal.getUser(), request);
    }
}
