package uz.ishchi.app.job;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.test.util.ReflectionTestUtils;
import uz.ishchi.app.common.ApplicationStatus;
import uz.ishchi.app.common.JobStatus;
import uz.ishchi.app.common.Role;
import uz.ishchi.app.common.exception.ApiException;
import uz.ishchi.app.notification.DeviceTokenRepository;
import uz.ishchi.app.notification.NotificationService;
import uz.ishchi.app.profile.EmployerProfile;
import uz.ishchi.app.profile.WorkerProfileRepository;
import uz.ishchi.app.user.User;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class JobApplicationServiceTest {

    @Mock private JobApplicationRepository applicationRepository;
    @Mock private JobRepository jobRepository;
    @Mock private WorkerProfileRepository workerProfileRepository;
    @Mock private DeviceTokenRepository deviceTokenRepository;
    @Mock private NotificationService notificationService;
    @InjectMocks private JobApplicationService applicationService;

    private User employerUser;
    private User workerUser;
    private Job job;

    @BeforeEach
    void setUp() {
        employerUser = user(1L, Role.EMPLOYER);
        workerUser = user(2L, Role.WORKER);

        EmployerProfile employer = new EmployerProfile();
        employer.setUser(employerUser);
        job = new Job();
        ReflectionTestUtils.setField(job, "id", 10L);
        job.setEmployer(employer);
        job.setTitle("Kafel yotqizish");
        job.setStatus(JobStatus.ACTIVE);

        when(jobRepository.findById(10L)).thenReturn(Optional.of(job));
        when(applicationRepository.save(any(JobApplication.class))).thenAnswer(inv -> inv.getArgument(0));
        when(workerProfileRepository.findByUserId(any())).thenReturn(Optional.empty());
        when(deviceTokenRepository.findTokensByUserId(any())).thenReturn(List.of("token"));
    }

    private User user(long id, Role role) {
        User u = new User("+99890000000" + id, "hash", role);
        ReflectionTestUtils.setField(u, "id", id);
        return u;
    }

    @Test
    void respondingIsFreeAndTellsTheEmployer() {
        when(applicationRepository.findByJobIdAndWorkerId(10L, 2L)).thenReturn(Optional.empty());

        var response = applicationService.apply(workerUser, 10L);

        assertThat(response.status()).isEqualTo(ApplicationStatus.INTERESTED);
        verify(notificationService).send(anyList(), anyString(), anyString(), any());
    }

    @Test
    void respondingTwiceIsNotAnError() {
        JobApplication existing = new JobApplication(job, workerUser);
        when(applicationRepository.findByJobIdAndWorkerId(10L, 2L)).thenReturn(Optional.of(existing));

        applicationService.apply(workerUser, 10L);

        verify(applicationRepository, never()).save(any());
    }

    @Test
    void anEmployerCannotRespondToTheirOwnJob() {
        assertThatThrownBy(() -> applicationService.apply(employerUser, 10L))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("O'z buyurtmangizga");
    }

    @Test
    void aClosedJobTakesNoMoreResponses() {
        job.setStatus(JobStatus.COMPLETED);

        assertThatThrownBy(() -> applicationService.apply(workerUser, 10L))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("faol emas");
    }

    @Test
    void aBlockedJobIsInvisibleRatherThanRejected() {
        job.setBlocked(true);

        assertThatThrownBy(() -> applicationService.apply(workerUser, 10L))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("topilmadi");
    }

    @Test
    void aHiredWorkerCannotQuietlyWithdraw() {
        JobApplication hired = new JobApplication(job, workerUser);
        hired.setStatus(ApplicationStatus.HIRED);
        when(applicationRepository.findByJobIdAndWorkerId(10L, 2L)).thenReturn(Optional.of(hired));

        assertThatThrownBy(() -> applicationService.withdraw(workerUser, 10L))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("tanlagan");
        verify(applicationRepository, never()).delete(any());
    }

    @Test
    void onlyTheJobOwnerSeesTheShortlist() {
        User otherEmployer = user(9L, Role.EMPLOYER);

        assertThatThrownBy(() -> applicationService.listForEmployer(otherEmployer, 10L))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("sizga tegishli emas");
    }

    @Test
    void decidingTellsTheWorker() {
        JobApplication application = new JobApplication(job, workerUser);
        when(applicationRepository.findByJobIdAndWorkerId(10L, 2L)).thenReturn(Optional.of(application));

        var response = applicationService.decide(employerUser, 10L, 2L, ApplicationStatus.HIRED);

        assertThat(response.status()).isEqualTo(ApplicationStatus.HIRED);
        verify(notificationService).send(anyList(), anyString(), anyString(), any());
    }

    @Test
    void theShortlistServesThePhoneBecauseTheseWorkersAskedToBeCalled() {
        JobApplication application = new JobApplication(job, workerUser);
        when(applicationRepository.findByJobIdOrderByCreatedAtDesc(10L)).thenReturn(List.of(application));

        var shortlist = applicationService.listForEmployer(employerUser, 10L);

        assertThat(shortlist).singleElement()
                .satisfies(entry -> assertThat(entry.workerPhone()).isEqualTo(workerUser.getPhone()));
    }
}
