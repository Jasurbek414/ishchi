package uz.ishchi.app.worker;

import org.springframework.data.jpa.domain.Specification;
import uz.ishchi.app.common.WorkPreference;
import uz.ishchi.app.profession.Profession;
import uz.ishchi.app.profile.WorkerProfile;

import jakarta.persistence.criteria.Join;

public final class WorkerSpecifications {

    private WorkerSpecifications() {
    }

    public static Specification<WorkerProfile> activeUser() {
        return (root, query, cb) -> cb.isTrue(root.get("user").get("active"));
    }

    public static Specification<WorkerProfile> regionId(Long regionId) {
        return (root, query, cb) -> regionId == null ? null : cb.equal(root.get("region").get("id"), regionId);
    }

    public static Specification<WorkerProfile> districtId(Long districtId) {
        return (root, query, cb) -> districtId == null ? null : cb.equal(root.get("district").get("id"), districtId);
    }

    public static Specification<WorkerProfile> minExperience(Integer years) {
        return (root, query, cb) -> years == null ? null : cb.greaterThanOrEqualTo(root.get("experienceYears"), years);
    }

    public static Specification<WorkerProfile> professionId(Long professionId) {
        return (root, query, cb) -> {
            if (professionId == null) return null;
            query.distinct(true);
            Join<WorkerProfile, Profession> join = root.join("professions");
            return cb.equal(join.get("id"), professionId);
        };
    }

    public static Specification<WorkerProfile> workPreference(WorkPreference workPreference) {
        return (root, query, cb) -> workPreference == null ? null : cb.equal(root.get("workPreference"), workPreference);
    }

    /** Workers who said they can work today, and whose "today" has not expired. */
    public static Specification<WorkerProfile> availableToday(Boolean availableToday) {
        return (root, query, cb) -> availableToday == null || !availableToday ? null
                : cb.greaterThan(root.get("availableUntil"), cb.literal(java.time.Instant.now()));
    }

    public static Specification<WorkerProfile> hasCoordinates() {
        return (root, query, cb) -> cb.and(
                cb.isNotNull(root.get("latitude")),
                cb.isNotNull(root.get("longitude"))
        );
    }

    /** Same rough viewport box as {@code JobSpecifications.withinBox}, so the map loads what is on screen. */
    public static Specification<WorkerProfile> withinBox(Double latitude, Double longitude, Double radiusDegrees) {
        return (root, query, cb) -> {
            if (latitude == null || longitude == null || radiusDegrees == null || radiusDegrees <= 0) {
                return null;
            }
            return cb.and(
                    cb.between(root.get("latitude"), latitude - radiusDegrees, latitude + radiusDegrees),
                    cb.between(root.get("longitude"), longitude - radiusDegrees, longitude + radiusDegrees)
            );
        };
    }

    public static Specification<WorkerProfile> search(String keyword) {
        return (root, query, cb) -> {
            if (keyword == null || keyword.isBlank()) return null;
            String like = "%" + keyword.toLowerCase() + "%";
            return cb.or(
                    cb.like(cb.lower(root.get("firstName")), like),
                    cb.like(cb.lower(root.get("lastName")), like)
            );
        };
    }
}
