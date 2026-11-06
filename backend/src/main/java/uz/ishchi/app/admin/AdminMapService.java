package uz.ishchi.app.admin;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.ishchi.app.admin.dto.*;
import uz.ishchi.app.common.JobStatus;
import uz.ishchi.app.common.exception.ApiException;
import uz.ishchi.app.job.Job;
import uz.ishchi.app.job.JobRepository;
import uz.ishchi.app.location.District;
import uz.ishchi.app.location.DistrictRepository;
import uz.ishchi.app.location.Region;
import uz.ishchi.app.location.RegionRepository;
import uz.ishchi.app.location.dto.DistrictResponse;
import uz.ishchi.app.profile.EmployerProfileRepository;
import uz.ishchi.app.profile.WorkerProfileRepository;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminMapService {

    private final RegionRepository regionRepository;
    private final DistrictRepository districtRepository;
    private final JobRepository jobRepository;
    private final WorkerProfileRepository workerProfileRepository;
    private final EmployerProfileRepository employerProfileRepository;

    @Transactional(readOnly = true)
    public AdminMapStatsResponse getStats() {
        List<Region> regions = regionRepository.findAll();
        long totalRegions = regions.size();
        long activeRegions = regions.stream().filter(Region::isActive).count();
        long restrictedRegions = totalRegions - activeRegions;

        long totalDistricts = districtRepository.count();
        long totalJobs = jobRepository.countByStatusAndBlockedFalse(JobStatus.ACTIVE);
        long jobsWithCoordinates = jobRepository.countByLatitudeIsNotNullAndLongitudeIsNotNull();
        long totalWorkers = workerProfileRepository.count();
        long totalEmployers = employerProfileRepository.count();

        return new AdminMapStatsResponse(
                totalRegions,
                activeRegions,
                restrictedRegions,
                totalDistricts,
                totalJobs,
                jobsWithCoordinates,
                totalWorkers,
                totalEmployers
        );
    }

    @Transactional(readOnly = true)
    public List<AdminRegionDetailResponse> getRegions() {
        List<Region> regions = regionRepository.findAll().stream()
                .sorted(Comparator.comparing(Region::getName, String.CASE_INSENSITIVE_ORDER))
                .toList();

        Map<Long, Long> jobsByRegion = jobRepository.countActiveJobsByRegionGrouped().stream()
                .collect(Collectors.toMap(r -> ((Number) r[0]).longValue(), r -> ((Number) r[1]).longValue()));

        Map<Long, Long> workersByRegion = workerProfileRepository.countWorkersByRegionGrouped().stream()
                .collect(Collectors.toMap(r -> ((Number) r[0]).longValue(), r -> ((Number) r[1]).longValue()));

        Map<Long, Long> employersByRegion = employerProfileRepository.countEmployersByRegionGrouped().stream()
                .collect(Collectors.toMap(r -> ((Number) r[0]).longValue(), r -> ((Number) r[1]).longValue()));

        Map<Long, Long> jobsByDistrict = jobRepository.countActiveJobsByDistrictGrouped().stream()
                .collect(Collectors.toMap(r -> ((Number) r[0]).longValue(), r -> ((Number) r[1]).longValue()));

        Map<Long, Long> workersByDistrict = workerProfileRepository.countWorkersByDistrictGrouped().stream()
                .collect(Collectors.toMap(r -> ((Number) r[0]).longValue(), r -> ((Number) r[1]).longValue()));

        List<District> allDistricts = districtRepository.findAll();
        Map<Long, List<District>> districtsByRegion = allDistricts.stream()
                .collect(Collectors.groupingBy(d -> d.getRegion().getId()));

        return regions.stream().map(region -> {
            List<District> regionDistricts = districtsByRegion.getOrDefault(region.getId(), List.of())
                    .stream()
                    .sorted(Comparator.comparing(District::getName, String.CASE_INSENSITIVE_ORDER))
                    .toList();

            List<AdminRegionDetailResponse.AdminDistrictSummary> districtSummaries = regionDistricts.stream()
                    .map(d -> new AdminRegionDetailResponse.AdminDistrictSummary(
                            d.getId(),
                            d.getName(),
                            jobsByDistrict.getOrDefault(d.getId(), 0L),
                            workersByDistrict.getOrDefault(d.getId(), 0L)
                    ))
                    .toList();

            return new AdminRegionDetailResponse(
                    region.getId(),
                    region.getName(),
                    region.getCenterLat(),
                    region.getCenterLng(),
                    region.getRadiusKm() != null ? region.getRadiusKm() : 45.0,
                    region.isActive(),
                    region.isAllowJobs(),
                    region.isAllowWorkers(),
                    region.getMinSalaryRate(),
                    region.getNotes(),
                    districtSummaries.size(),
                    jobsByRegion.getOrDefault(region.getId(), 0L),
                    workersByRegion.getOrDefault(region.getId(), 0L),
                    employersByRegion.getOrDefault(region.getId(), 0L),
                    districtSummaries
            );
        }).toList();
    }

    @Transactional
    public AdminRegionDetailResponse updateRegion(Long id, AdminRegionUpdateRequest request) {
        Region region = regionRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Viloyat topilmadi: " + id));

        if (request.name() != null && !request.name().isBlank()) {
            region.setName(request.name().trim());
        }
        if (request.centerLat() != null) {
            region.setCenterLat(request.centerLat());
        }
        if (request.centerLng() != null) {
            region.setCenterLng(request.centerLng());
        }
        if (request.radiusKm() != null) {
            region.setRadiusKm(request.radiusKm());
        }
        if (request.active() != null) {
            region.setActive(request.active());
        }
        if (request.allowJobs() != null) {
            region.setAllowJobs(request.allowJobs());
        }
        if (request.allowWorkers() != null) {
            region.setAllowWorkers(request.allowWorkers());
        }
        if (request.minSalaryRate() != null) {
            region.setMinSalaryRate(request.minSalaryRate() <= 0 ? null : request.minSalaryRate());
        }
        if (request.notes() != null) {
            region.setNotes(request.notes().trim());
        }

        regionRepository.save(region);
        log.info("Region ID {} updated by admin: name={}, active={}, radius={}km",
                region.getId(), region.getName(), region.isActive(), region.getRadiusKm());

        List<District> regionDistricts = districtRepository.findByRegionIdOrderByNameAsc(region.getId());
        List<AdminRegionDetailResponse.AdminDistrictSummary> districtSummaries = regionDistricts.stream()
                .map(d -> new AdminRegionDetailResponse.AdminDistrictSummary(d.getId(), d.getName(), 0L, 0L))
                .toList();

        return new AdminRegionDetailResponse(
                region.getId(),
                region.getName(),
                region.getCenterLat(),
                region.getCenterLng(),
                region.getRadiusKm() != null ? region.getRadiusKm() : 45.0,
                region.isActive(),
                region.isAllowJobs(),
                region.isAllowWorkers(),
                region.getMinSalaryRate(),
                region.getNotes(),
                districtSummaries.size(),
                0L,
                0L,
                0L,
                districtSummaries
        );
    }

    @Transactional(readOnly = true)
    public List<AdminMapJobMarkerResponse> getMapJobs() {
        List<Job> jobs = jobRepository.findActiveJobsWithCoordinates();
        return jobs.stream().map(job -> new AdminMapJobMarkerResponse(
                job.getId(),
                job.getTitle(),
                job.getLatitude(),
                job.getLongitude(),
                job.getPayment(),
                job.getPaymentType() != null ? job.getPaymentType().name() : null,
                job.getJobType() != null ? job.getJobType().name() : null,
                job.getStatus() != null ? job.getStatus().name() : null,
                job.isUrgent(),
                job.getProfession() != null ? job.getProfession().getName() : null,
                job.getEmployer() != null ? job.getEmployer().getFullName() : null,
                job.getEmployer() != null && job.getEmployer().getUser() != null ? job.getEmployer().getUser().getPhone() : null,
                job.getRegion() != null ? job.getRegion().getName() : null,
                job.getDistrict() != null ? job.getDistrict().getName() : null,
                job.getCreatedAt()
        )).toList();
    }

    @Transactional
    public DistrictResponse addDistrict(Long regionId, AdminDistrictRequest request) {
        Region region = regionRepository.findById(regionId)
                .orElseThrow(() -> ApiException.notFound("Viloyat topilmadi: " + regionId));

        String name = request.name().trim();
        districtRepository.findByRegionIdAndNameIgnoreCase(regionId, name).ifPresent(d -> {
            throw ApiException.badRequest("Bu viloyatda bunday tuman allaqachon mavjud: " + name);
        });

        District district = new District();
        district.setRegion(region);
        district.setName(name);
        districtRepository.save(district);

        log.info("District created: {} in region {}", name, region.getName());
        return DistrictResponse.from(district);
    }

    @Transactional
    public DistrictResponse updateDistrict(Long districtId, AdminDistrictRequest request) {
        District district = districtRepository.findById(districtId)
                .orElseThrow(() -> ApiException.notFound("Tuman topilmadi: " + districtId));

        String name = request.name().trim();
        districtRepository.findByRegionIdAndNameIgnoreCase(district.getRegion().getId(), name)
                .filter(d -> !d.getId().equals(districtId))
                .ifPresent(d -> {
                    throw ApiException.badRequest("Bu viloyatda bunday tuman allaqachon mavjud: " + name);
                });

        district.setName(name);
        districtRepository.save(district);
        return DistrictResponse.from(district);
    }

    @Transactional
    public void deleteDistrict(Long districtId) {
        District district = districtRepository.findById(districtId)
                .orElseThrow(() -> ApiException.notFound("Tuman topilmadi: " + districtId));

        districtRepository.delete(district);
        log.info("District deleted: ID {}", districtId);
    }
}
