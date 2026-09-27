package uz.ishchi.app.profile;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import uz.ishchi.app.common.FileStorageService;
import uz.ishchi.app.common.Role;
import uz.ishchi.app.common.exception.ApiException;
import uz.ishchi.app.location.District;
import uz.ishchi.app.location.DistrictRepository;
import uz.ishchi.app.location.Region;
import uz.ishchi.app.location.RegionRepository;
import uz.ishchi.app.profession.Profession;
import uz.ishchi.app.profession.ProfessionRepository;
import uz.ishchi.app.profession.dto.ProfessionResponse;
import uz.ishchi.app.profile.dto.ProfileResponse;
import uz.ishchi.app.profile.dto.ProfileUpdateRequest;
import uz.ishchi.app.profile.dto.WorkExperienceRequest;
import uz.ishchi.app.profile.dto.WorkExperienceResponse;
import uz.ishchi.app.user.User;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final WorkerProfileRepository workerProfileRepository;
    private final EmployerProfileRepository employerProfileRepository;
    private final WorkExperienceRepository workExperienceRepository;
    private final RegionRepository regionRepository;
    private final DistrictRepository districtRepository;
    private final ProfessionRepository professionRepository;
    private final FileStorageService fileStorageService;

    @Transactional(readOnly = true)
    public ProfileResponse getProfile(User user) {
        if (user.getRole() == Role.WORKER) {
            WorkerProfile p = workerProfileRepository.findByUserId(user.getId())
                    .orElseThrow(() -> ApiException.notFound("Profil topilmadi"));
            return toResponse(user, p);
        } else if (user.getRole() == Role.EMPLOYER) {
            EmployerProfile p = employerProfileRepository.findByUserId(user.getId())
                    .orElseThrow(() -> ApiException.notFound("Profil topilmadi"));
            return toResponse(user, p);
        }
        throw ApiException.badRequest("Administrator uchun profil mavjud emas");
    }

    @Transactional
    public ProfileResponse updateProfile(User user, ProfileUpdateRequest request) {
        Region region = null;
        District district = null;
        if (request.regionId() != null) {
            region = regionRepository.findById(request.regionId())
                    .orElseThrow(() -> ApiException.badRequest("Viloyat topilmadi"));
        }
        if (request.districtId() != null) {
            district = districtRepository.findById(request.districtId())
                    .orElseThrow(() -> ApiException.badRequest("Tuman/shahar topilmadi"));
        }

        if (user.getRole() == Role.WORKER) {
            WorkerProfile p = workerProfileRepository.findByUserId(user.getId())
                    .orElseThrow(() -> ApiException.notFound("Profil topilmadi"));

            Region targetRegion = region != null ? region : p.getRegion();
            District targetDistrict = district != null ? district : p.getDistrict();
            if (!targetDistrict.getRegion().getId().equals(targetRegion.getId())) {
                throw ApiException.badRequest("Tanlangan tuman ushbu viloyatga tegishli emas");
            }

            if (request.firstName() != null) p.setFirstName(request.firstName());
            if (request.lastName() != null) p.setLastName(request.lastName());
            if (region != null) p.setRegion(region);
            if (district != null) p.setDistrict(district);
            if (request.about() != null) p.setAbout(request.about());
            if (request.experienceYears() != null) p.setExperienceYears(request.experienceYears());
            if (request.available() != null) p.setAvailable(request.available());
            if (request.professionIds() != null) {
                p.setProfessions(new HashSet<>(resolveProfessions(request.professionIds())));
            }
            if (request.latitude() != null) p.setLatitude(request.latitude());
            if (request.longitude() != null) p.setLongitude(request.longitude());
            if (request.workPreference() != null) p.setWorkPreference(request.workPreference());
            if (request.hasDriverLicense() != null) p.setHasDriverLicense(request.hasDriverLicense());
            if (request.driverLicenseCategories() != null) p.setDriverLicenseCategories(request.driverLicenseCategories());
            return toResponse(user, p);
        } else if (user.getRole() == Role.EMPLOYER) {
            EmployerProfile p = employerProfileRepository.findByUserId(user.getId())
                    .orElseThrow(() -> ApiException.notFound("Profil topilmadi"));

            Region targetRegion = region != null ? region : p.getRegion();
            District targetDistrict = district != null ? district : p.getDistrict();
            if (!targetDistrict.getRegion().getId().equals(targetRegion.getId())) {
                throw ApiException.badRequest("Tanlangan tuman ushbu viloyatga tegishli emas");
            }

            if (request.firstName() != null) p.setFirstName(request.firstName());
            if (request.lastName() != null) p.setLastName(request.lastName());
            if (region != null) p.setRegion(region);
            if (district != null) p.setDistrict(district);
            if (request.about() != null) p.setAbout(request.about());
            if (request.latitude() != null) p.setLatitude(request.latitude());
            if (request.longitude() != null) p.setLongitude(request.longitude());
            return toResponse(user, p);
        }
        throw ApiException.badRequest("Administrator uchun profil mavjud emas");
    }

    @Transactional
    public ProfileResponse uploadAvatar(User user, MultipartFile file) {
        String url = fileStorageService.storeAvatar(file);
        if (user.getRole() == Role.WORKER) {
            WorkerProfile p = workerProfileRepository.findByUserId(user.getId())
                    .orElseThrow(() -> ApiException.notFound("Profil topilmadi"));
            fileStorageService.deleteAfterCommit(p.getAvatarUrl());
            p.setAvatarUrl(url);
            return toResponse(user, p);
        } else if (user.getRole() == Role.EMPLOYER) {
            EmployerProfile p = employerProfileRepository.findByUserId(user.getId())
                    .orElseThrow(() -> ApiException.notFound("Profil topilmadi"));
            fileStorageService.deleteAfterCommit(p.getAvatarUrl());
            p.setAvatarUrl(url);
            return toResponse(user, p);
        }
        throw ApiException.badRequest("Administrator uchun profil mavjud emas");
    }

    @Transactional
    public ProfileResponse addExperience(User user, WorkExperienceRequest request) {
        WorkerProfile p = requireOwnWorkerProfile(user);
        validateExperienceDates(request.startDate(), request.endDate());

        WorkExperience e = new WorkExperience();
        e.setWorker(p);
        e.setCompanyName(request.companyName());
        e.setPositionTitle(request.positionTitle());
        e.setDescription(request.description());
        e.setStartDate(request.startDate());
        e.setEndDate(request.endDate());
        workExperienceRepository.save(e);
        return toResponse(user, p);
    }

    @Transactional
    public ProfileResponse updateExperience(User user, Long experienceId, WorkExperienceRequest request) {
        WorkerProfile p = requireOwnWorkerProfile(user);
        validateExperienceDates(request.startDate(), request.endDate());

        WorkExperience e = workExperienceRepository.findByIdAndWorkerId(experienceId, p.getId())
                .orElseThrow(() -> ApiException.notFound("Ish tajribasi topilmadi"));
        e.setCompanyName(request.companyName());
        e.setPositionTitle(request.positionTitle());
        e.setDescription(request.description());
        e.setStartDate(request.startDate());
        e.setEndDate(request.endDate());
        return toResponse(user, p);
    }

    @Transactional
    public ProfileResponse deleteExperience(User user, Long experienceId) {
        WorkerProfile p = requireOwnWorkerProfile(user);
        WorkExperience e = workExperienceRepository.findByIdAndWorkerId(experienceId, p.getId())
                .orElseThrow(() -> ApiException.notFound("Ish tajribasi topilmadi"));
        workExperienceRepository.delete(e);
        return toResponse(user, p);
    }

    /**
     * findAllById() drops ids that do not exist without a word, so a typo used to be saved as
     * "no professions" instead of being rejected the way every other unknown id is.
     */
    private List<Profession> resolveProfessions(List<Long> professionIds) {
        List<Profession> professions = professionRepository.findAllById(professionIds);
        if (professions.size() != new HashSet<>(professionIds).size()) {
            throw ApiException.badRequest("Tanlangan kasblardan biri topilmadi");
        }
        return professions;
    }

    private void validateExperienceDates(java.time.LocalDate start, java.time.LocalDate end) {
        if (end != null && end.isBefore(start)) {
            throw ApiException.badRequest("Tugash sanasi boshlanish sanasidan oldin bo'lishi mumkin emas");
        }
    }

    private WorkerProfile requireOwnWorkerProfile(User user) {
        if (user.getRole() != Role.WORKER) {
            throw ApiException.badRequest("Faqat ishchilar ish tajribasi qo'sha oladi");
        }
        return workerProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> ApiException.notFound("Profil topilmadi"));
    }

    private ProfileResponse toResponse(User user, WorkerProfile p) {
        Set<Profession> professions = p.getProfessions();
        List<WorkExperienceResponse> experiences = workExperienceRepository
                .findByWorkerIdOrderByStartDateDesc(p.getId())
                .stream().map(WorkExperienceResponse::from).toList();
        return new ProfileResponse(
                user.getId(), user.getPhone(), user.getRole(),
                p.getFirstName(), p.getLastName(), p.getAvatarUrl(),
                p.getRegion().getId(), p.getRegion().getName(),
                p.getDistrict().getId(), p.getDistrict().getName(),
                p.getAbout(), p.getExperienceYears(), p.isAvailable(),
                professions.stream().map(ProfessionResponse::from).toList(),
                p.getLatitude(), p.getLongitude(), p.getWorkPreference(),
                p.isHasDriverLicense(), p.getDriverLicenseCategories(), experiences
        );
    }

    private ProfileResponse toResponse(User user, EmployerProfile p) {
        return new ProfileResponse(
                user.getId(), user.getPhone(), user.getRole(),
                p.getFirstName(), p.getLastName(), p.getAvatarUrl(),
                p.getRegion().getId(), p.getRegion().getName(),
                p.getDistrict().getId(), p.getDistrict().getName(),
                p.getAbout(), null, null, null,
                p.getLatitude(), p.getLongitude(), null,
                null, null, null
        );
    }
}
