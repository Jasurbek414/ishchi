package uz.ishchi.app.common;

/** Where a worker's response to a job stands. */
public enum ApplicationStatus {
    /** The worker put their hand up; the employer has not decided yet. */
    INTERESTED,
    /** The employer picked this worker for the job. */
    HIRED,
    /** The employer passed. */
    DECLINED
}
