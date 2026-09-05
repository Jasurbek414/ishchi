package uz.ishchi.app.common;

/** Steps of the Telegram bot's "post a job" conversational wizard, in order. */
public enum TelegramDraftStep {
    TITLE,
    DESCRIPTION,
    PROFESSION,
    REGION,
    DISTRICT,
    PAYMENT,
    PAYMENT_TYPE,
    JOB_TYPE,
    WORKERS_NEEDED,
    IMAGES,
    CONFIRM
}
