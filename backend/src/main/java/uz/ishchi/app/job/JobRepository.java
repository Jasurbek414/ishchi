package uz.ishchi.app.job;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import uz.ishchi.app.common.JobStatus;

import java.time.Instant;
import java.util.List;

public interface JobRepository extends JpaRepository<Job, Long>, JpaSpecificationExecutor<Job> {

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
}
