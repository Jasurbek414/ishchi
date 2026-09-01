alter table app_settings
    add column job_posting_fee_enabled boolean not null default false,
    add column job_posting_fee numeric(12, 2) not null default 0,
    add column job_view_fee_enabled boolean not null default false,
    add column job_view_fee numeric(12, 2) not null default 0;

-- Tracks which worker has paid to unlock which job's contact details, so the
-- one-time unlock fee is never charged twice for the same worker+job pair.
create table job_unlocks (
    id bigserial primary key,
    job_id bigint not null references jobs(id) on delete cascade,
    worker_id bigint not null references users(id) on delete cascade,
    unlocked_at timestamp not null default now(),
    unique (job_id, worker_id)
);
