package uz.ishchi.app.common;

/** Why something was reported. Kept short and concrete so the admin queue is triageable. */
public enum ReportReason {
    /** The job does not exist, or the details are made up. */
    FAKE_JOB,
    /** Asked for money, documents or anything else a legitimate employer would not. */
    SCAM,
    /** Agreed pay was not handed over. */
    NOT_PAID,
    /** Abusive or threatening behaviour. */
    ABUSE,
    /** Contact details that do not work, or belong to somebody else. */
    WRONG_CONTACT,
    OTHER
}
