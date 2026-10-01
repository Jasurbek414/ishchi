package uz.ishchi.app.report;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.ishchi.app.common.exception.ApiException;
import uz.ishchi.app.job.JobRepository;
import uz.ishchi.app.report.dto.ReportRequest;
import uz.ishchi.app.report.dto.ReportResponse;
import uz.ishchi.app.user.User;
import uz.ishchi.app.user.UserRepository;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
public class ReportService {

    /** One complaint per target per day from the same account is plenty. */
    private static final int DUPLICATE_WINDOW_HOURS = 24;

    private final ReportRepository reportRepository;
    private final JobRepository jobRepository;
    private final UserRepository userRepository;

    @Transactional
    public ReportResponse submit(User reporter, ReportRequest request) {
        boolean hasJob = request.jobId() != null;
        boolean hasUser = request.reportedUserId() != null;
        if (hasJob == hasUser) {
            throw ApiException.badRequest("Buyurtma yoki foydalanuvchidan bittasini ko'rsating");
        }

        Report report = new Report();
        report.setReporter(reporter);
        report.setReason(request.reason());
        report.setDetails(request.details());

        Instant since = Instant.now().minus(DUPLICATE_WINDOW_HOURS, ChronoUnit.HOURS);
        if (hasJob) {
            report.setJob(jobRepository.findById(request.jobId())
                    .orElseThrow(() -> ApiException.notFound("Buyurtma topilmadi")));
            if (reportRepository.existsByReporterIdAndJobIdAndCreatedAtAfter(
                    reporter.getId(), request.jobId(), since)) {
                throw ApiException.conflict("Bu buyurtma haqida shikoyatingiz allaqachon qabul qilingan");
            }
        } else {
            if (request.reportedUserId().equals(reporter.getId())) {
                throw ApiException.badRequest("O'zingiz haqida shikoyat qilib bo'lmaydi");
            }
            report.setReportedUser(userRepository.findById(request.reportedUserId())
                    .orElseThrow(() -> ApiException.notFound("Foydalanuvchi topilmadi")));
            if (reportRepository.existsByReporterIdAndReportedUserIdAndCreatedAtAfter(
                    reporter.getId(), request.reportedUserId(), since)) {
                throw ApiException.conflict("Bu foydalanuvchi haqida shikoyatingiz allaqachon qabul qilingan");
            }
        }

        return ReportResponse.from(reportRepository.save(report));
    }

    @Transactional(readOnly = true)
    public Page<ReportResponse> list(Boolean resolved, Pageable pageable) {
        Page<Report> page = resolved == null
                ? reportRepository.findAllByOrderByCreatedAtDesc(pageable)
                : reportRepository.findByResolvedOrderByCreatedAtDesc(resolved, pageable);
        return page.map(ReportResponse::from);
    }

    @Transactional
    public ReportResponse resolve(Long id, boolean resolved, String note) {
        Report report = reportRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Shikoyat topilmadi"));
        report.setResolved(resolved);
        report.setResolutionNote(note);
        report.setResolvedAt(resolved ? Instant.now() : null);
        return ReportResponse.from(report);
    }
}
