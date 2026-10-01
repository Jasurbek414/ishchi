package uz.ishchi.app.config;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Makes a {@code @Scheduled} job run on one instance only.
 *
 * <p>Nothing stopped the nightly jobs from running on every replica, so scaling the backend past a
 * single container would have sent each employer their expiry reminder once per instance. Uses a
 * Postgres advisory lock scoped to the current transaction, which releases itself on commit or
 * rollback — there is no cleanup path left to get wrong.
 */
@Component
@RequiredArgsConstructor
public class SchedulerLock {

    private final JdbcTemplate jdbcTemplate;

    /** @return true when this instance may run the job; false when another one already holds it. */
    public boolean tryAcquire(long key) {
        return Boolean.TRUE.equals(
                jdbcTemplate.queryForObject("select pg_try_advisory_xact_lock(?)", Boolean.class, key));
    }
}
