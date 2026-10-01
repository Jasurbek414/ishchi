package uz.ishchi.app.worker;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.ishchi.app.common.WorkPreference;
import uz.ishchi.app.common.exception.ApiException;
import uz.ishchi.app.profile.WorkExperienceRepository;
import uz.ishchi.app.profile.WorkerProfile;
import uz.ishchi.app.profile.WorkerProfileRepository;
import uz.ishchi.app.profile.dto.WorkExperienceResponse;
import uz.ishchi.app.worker.dto.WorkerResponse;

import java.util.List;

@Service
@RequiredArgsConstructor
public class WorkerService {

    private final WorkerProfileRepository workerProfileRepository;
    private final WorkExperienceRepository workExperienceRepository;

    @Transactional(readOnly = true)
    public Page<WorkerResponse> search(Long regionId, Long districtId, Long professionId,
                                        Integer minExperience, String keyword, WorkPreference workPreference,
                                        Boolean availableToday, Pageable pageable) {
        Specification<WorkerProfile> spec = Specification.where(WorkerSpecifications.activeUser())
                .and(WorkerSpecifications.regionId(regionId))
                .and(WorkerSpecifications.districtId(districtId))
                .and(WorkerSpecifications.professionId(professionId))
                .and(WorkerSpecifications.minExperience(minExperience))
                .and(WorkerSpecifications.workPreference(workPreference))
                .and(WorkerSpecifications.search(keyword))
                .and(WorkerSpecifications.availableToday(availableToday));

        Pageable effective = pageable.getSort().isSorted() ? pageable
                : org.springframework.data.domain.PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(),
                        Sort.by(Sort.Direction.DESC, "updatedAt"));

        return workerProfileRepository.findAll(spec, effective).map(WorkerResponse::forList);
    }

    @Transactional(readOnly = true)
    public java.util.List<WorkerResponse> mapSearch(Long regionId, Long professionId,
                                                     Double latitude, Double longitude, Double radiusDegrees) {
        Specification<WorkerProfile> spec = Specification.where(WorkerSpecifications.activeUser())
                .and(WorkerSpecifications.hasCoordinates())
                .and(WorkerSpecifications.regionId(regionId))
                .and(WorkerSpecifications.professionId(professionId))
                .and(WorkerSpecifications.withinBox(latitude, longitude, radiusDegrees));
        Pageable limit = org.springframework.data.domain.PageRequest.of(0, 500,
                Sort.by(Sort.Direction.DESC, "updatedAt"));
        return workerProfileRepository.findAll(spec, limit).map(WorkerResponse::forMap).getContent();
    }

    @Transactional(readOnly = true)
    public WorkerResponse getById(Long id) {
        WorkerProfile profile = workerProfileRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Ishchi topilmadi"));
        List<WorkExperienceResponse> experiences = workExperienceRepository.findByWorkerIdOrderByStartDateDesc(id)
                .stream().map(WorkExperienceResponse::from).toList();
        return WorkerResponse.forDetail(profile, experiences);
    }
}
