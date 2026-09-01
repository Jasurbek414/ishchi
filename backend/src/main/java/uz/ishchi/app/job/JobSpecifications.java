package uz.ishchi.app.job;

import org.springframework.data.jpa.domain.Specification;
import uz.ishchi.app.common.JobStatus;
import uz.ishchi.app.common.JobType;

import java.math.BigDecimal;

public final class JobSpecifications {

    private JobSpecifications() {
    }

    public static Specification<Job> notBlocked() {
        return (root, query, cb) -> cb.isFalse(root.get("blocked"));
    }

    public static Specification<Job> regionId(Long regionId) {
        return (root, query, cb) -> regionId == null ? null : cb.equal(root.get("region").get("id"), regionId);
    }

    public static Specification<Job> districtId(Long districtId) {
        return (root, query, cb) -> districtId == null ? null : cb.equal(root.get("district").get("id"), districtId);
    }

    public static Specification<Job> professionId(Long professionId) {
        return (root, query, cb) -> professionId == null ? null : cb.equal(root.get("profession").get("id"), professionId);
    }

    public static Specification<Job> jobType(JobType jobType) {
        return (root, query, cb) -> jobType == null ? null : cb.equal(root.get("jobType"), jobType);
    }

    public static Specification<Job> status(JobStatus status) {
        return (root, query, cb) -> status == null ? null : cb.equal(root.get("status"), status);
    }

    public static Specification<Job> employerId(Long employerId) {
        return (root, query, cb) -> employerId == null ? null : cb.equal(root.get("employer").get("id"), employerId);
    }

    public static Specification<Job> minPayment(BigDecimal min) {
        return (root, query, cb) -> min == null ? null : cb.greaterThanOrEqualTo(root.get("payment"), min);
    }

    public static Specification<Job> maxPayment(BigDecimal max) {
        return (root, query, cb) -> max == null ? null : cb.lessThanOrEqualTo(root.get("payment"), max);
    }

    public static Specification<Job> hasCoordinates() {
        return (root, query, cb) -> cb.and(
                cb.isNotNull(root.get("latitude")),
                cb.isNotNull(root.get("longitude"))
        );
    }

    public static Specification<Job> search(String keyword) {
        return (root, query, cb) -> {
            if (keyword == null || keyword.isBlank()) return null;
            String like = "%" + keyword.toLowerCase() + "%";
            return cb.or(
                    cb.like(cb.lower(root.get("title")), like),
                    cb.like(cb.lower(root.get("description")), like)
            );
        };
    }
}
