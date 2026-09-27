package uz.ishchi.app.search;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.ishchi.app.common.exception.ApiException;
import uz.ishchi.app.job.Job;
import uz.ishchi.app.location.DistrictRepository;
import uz.ishchi.app.location.RegionRepository;
import uz.ishchi.app.notification.DeviceTokenRepository;
import uz.ishchi.app.notification.NotificationService;
import uz.ishchi.app.profession.ProfessionRepository;
import uz.ishchi.app.search.dto.SavedSearchRequest;
import uz.ishchi.app.search.dto.SavedSearchResponse;
import uz.ishchi.app.user.User;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SavedSearchService {

    private static final Logger log = LoggerFactory.getLogger(SavedSearchService.class);

    /** Enough to cover the trades one person realistically works, without becoming a spam channel. */
    private static final int MAX_PER_USER = 10;

    private final SavedSearchRepository savedSearchRepository;
    private final ProfessionRepository professionRepository;
    private final RegionRepository regionRepository;
    private final DistrictRepository districtRepository;
    private final DeviceTokenRepository deviceTokenRepository;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public List<SavedSearchResponse> list(User user) {
        return savedSearchRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(SavedSearchResponse::from)
                .toList();
    }

    @Transactional
    public SavedSearchResponse create(User user, SavedSearchRequest request) {
        if (savedSearchRepository.countByUserId(user.getId()) >= MAX_PER_USER) {
            throw ApiException.badRequest("Ko'pi bilan " + MAX_PER_USER + " ta saqlangan qidiruv bo'lishi mumkin");
        }
        SavedSearch search = new SavedSearch();
        search.setUser(user);
        apply(search, request);
        return SavedSearchResponse.from(savedSearchRepository.save(search));
    }

    @Transactional
    public SavedSearchResponse update(User user, Long id, SavedSearchRequest request) {
        SavedSearch search = savedSearchRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> ApiException.notFound("Saqlangan qidiruv topilmadi"));
        apply(search, request);
        return SavedSearchResponse.from(search);
    }

    @Transactional
    public void delete(User user, Long id) {
        SavedSearch search = savedSearchRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> ApiException.notFound("Saqlangan qidiruv topilmadi"));
        savedSearchRepository.delete(search);
    }

    /**
     * Tells the people whose saved searches this job answers.
     *
     * <p>Each worker is notified at most once even when several of their searches match, and never
     * about their own posting. Matching is done in memory against the whole notifying set: the set is
     * small (one row per worker per trade they follow) and the alternative — a query per saved search
     * on every job posted — is the shape that does not scale.
     */
    @Transactional(readOnly = true)
    public void notifyMatching(Job job) {
        List<SavedSearch> searches = savedSearchRepository.findByNotifyTrue();
        if (searches.isEmpty()) {
            return;
        }
        Long employerUserId = job.getEmployer().getUser().getId();
        List<Long> userIds = searches.stream()
                .filter(s -> s.matches(job))
                .map(s -> s.getUser().getId())
                .filter(id -> !id.equals(employerUserId))
                .distinct()
                .toList();
        if (userIds.isEmpty()) {
            return;
        }

        List<String> tokens = deviceTokenRepository.findUserIdAndTokenByUserIdIn(userIds).stream()
                .map(row -> (String) row[1])
                .toList();
        log.debug("Saqlangan qidiruv bo'yicha {} foydalanuvchiga xabar", userIds.size());
        notificationService.send(tokens, "Siz kuzatayotgan ish paydo bo'ldi",
                job.getTitle() + " — " + job.getRegion().getName(),
                Map.of("type", "saved_search", "jobId", String.valueOf(job.getId())));
    }

    private void apply(SavedSearch search, SavedSearchRequest request) {
        search.setName(request.name());
        search.setProfession(request.professionId() == null ? null
                : professionRepository.findById(request.professionId())
                        .orElseThrow(() -> ApiException.badRequest("Kasb topilmadi")));
        search.setRegion(request.regionId() == null ? null
                : regionRepository.findById(request.regionId())
                        .orElseThrow(() -> ApiException.badRequest("Viloyat topilmadi")));
        search.setDistrict(request.districtId() == null ? null
                : districtRepository.findById(request.districtId())
                        .orElseThrow(() -> ApiException.badRequest("Tuman/shahar topilmadi")));
        search.setJobType(request.jobType());
        search.setMinPayment(request.minPayment());
        if (request.notifyEnabled() != null) {
            search.setNotify(request.notifyEnabled());
        }
    }
}
