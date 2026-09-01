package uz.ishchi.app.job;

import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Order;
import org.springframework.data.jpa.domain.Specification;

import java.util.List;

public final class JobSortSpecifications {

    private JobSortSpecifications() {
    }

    /** Orders results: same district first, then same region, then everything else; newest first within each group. */
    public static Specification<Job> nearestFirst(Long regionId, Long districtId) {
        return (root, query, cb) -> {
            List<Order> orders = new java.util.ArrayList<>();
            if (districtId != null) {
                Expression<Integer> districtRank = cb.<Integer>selectCase()
                        .when(cb.equal(root.get("district").get("id"), districtId), 0)
                        .otherwise(1);
                orders.add(cb.asc(districtRank));
            }
            if (regionId != null) {
                Expression<Integer> regionRank = cb.<Integer>selectCase()
                        .when(cb.equal(root.get("region").get("id"), regionId), 0)
                        .otherwise(1);
                orders.add(cb.asc(regionRank));
            }
            orders.add(cb.desc(root.get("createdAt")));
            query.orderBy(orders);
            return cb.conjunction();
        };
    }
}
