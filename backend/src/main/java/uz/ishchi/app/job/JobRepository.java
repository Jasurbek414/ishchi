package uz.ishchi.app.job;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import uz.ishchi.app.common.JobStatus;

import java.time.Instant;
import java.util.List;

public interface JobRepository extends JpaRepository<Job, Long>, JpaSpecificationExecutor<Job> {

    /**
     * Job rows render employer, profession, region and district, each of which was lazy-loaded per
     * row. The images collection is left out on purpose: fetching it with a Pageable would page in
     * memory (see JobImage's batch size instead).
     */
    @Override
    @EntityGraph(attributePaths = {"employer", "employer.user", "profession", "region", "district"})
    Page<Job> findAll(Specification<Job> spec, Pageable pageable);

    @Modifying
    @Query("update Job j set j.status = uz.ishchi.app.common.JobStatus.EXPIRED " +
            "where j.status = uz.ishchi.app.common.JobStatus.ACTIVE and j.expiresAt is not null and j.expiresAt < :now")
    int expireOverdueJobs(Instant now);

    @Query("select j from Job j where j.status = uz.ishchi.app.common.JobStatus.ACTIVE " +
            "and j.expiryReminderSent = false and j.expiresAt is not null " +
            "and j.expiresAt between :now and :soon")
    List<Job> findExpiringSoonUnnotified(Instant now, Instant soon);

    long countByStatusAndBlockedFalse(JobStatus status);

    long countByStatus(JobStatus status);

    long countByCreatedAtAfter(Instant instant);

    @Query("select j.profession.id, count(j) from Job j group by j.profession.id")
    List<Object[]> countByProfessionGrouped();

    long countByProfessionId(Long professionId);

    long countByEmployerId(Long employerId);

    long countByEmployerIdAndStatus(Long employerId, uz.ishchi.app.common.JobStatus status);

    /**
     * Payment percentiles for comparable postings. Uses percentile_cont rather than loading the rows
     * so the whole answer is one indexed aggregate, and only counts postings of the same payment
     * type — a daily rate and a fixed price for the whole job are not comparable numbers.
     */
    @Query(value = """
            select count(*),
                   min(payment),
                   percentile_cont(0.25) within group (order by payment),
                   percentile_cont(0.50) within group (order by payment),
                   percentile_cont(0.75) within group (order by payment),
                   max(payment)
              from jobs
             where profession_id = :professionId
               and (:regionId is null or region_id = :regionId)
               and payment_type = :paymentType
               and blocked = false
               and created_at > now() - interval '180 days'
            """, nativeQuery = true)
    Object[] paymentPercentiles(@Param("professionId") Long professionId,
                                 @Param("regionId") Long regionId,
                                 @Param("paymentType") String paymentType);
}
