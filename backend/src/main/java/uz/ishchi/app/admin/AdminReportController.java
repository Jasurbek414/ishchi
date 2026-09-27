package uz.ishchi.app.admin;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import uz.ishchi.app.common.dto.PageResponse;
import uz.ishchi.app.report.ReportService;
import uz.ishchi.app.report.dto.ReportResponse;

@RestController
@RequestMapping("/api/admin/reports")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminReportController {

    private final ReportService reportService;

    @GetMapping
    public PageResponse<ReportResponse> list(@RequestParam(required = false) Boolean resolved,
                                              Pageable pageable) {
        return PageResponse.of(reportService.list(resolved, pageable));
    }

    @PatchMapping("/{id}/resolved")
    public ReportResponse resolve(@PathVariable Long id,
                                   @RequestParam boolean resolved,
                                   @RequestParam(required = false) String note) {
        return reportService.resolve(id, resolved, note);
    }
}
