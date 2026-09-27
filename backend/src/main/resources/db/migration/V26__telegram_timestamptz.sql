-- The Telegram tables were created with plain `timestamp`, unlike every other table in the schema
-- (job_unlocks had the same slip, fixed in V24). Aligning them keeps instants unambiguous.
alter table telegram_job_draft
    alter column created_at type timestamptz,
    alter column updated_at type timestamptz;

alter table telegram_awaiting_feedback alter column created_at type timestamptz;

-- Abandoned drafts and feedback prompts are cleaned up on a schedule now; an index keeps that
-- nightly sweep from scanning the whole table.
create index idx_telegram_job_draft_updated_at on telegram_job_draft(updated_at);
create index idx_telegram_awaiting_feedback_created_at on telegram_awaiting_feedback(created_at);
