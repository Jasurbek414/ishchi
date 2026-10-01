-- Day labour is a same-day decision, but `available` was a permanent boolean: a worker who set it
-- once stayed "available" for months. This is an explicit "I can work today", with an expiry.
alter table worker_profiles add column available_until timestamptz;
create index idx_worker_profiles_available_until on worker_profiles(available_until)
    where available_until is not null;

-- Urgent postings, so "kerak bugun" does not sit in the same undifferentiated list as a job
-- starting next month.
alter table jobs add column urgent boolean not null default false;
create index idx_jobs_urgent on jobs(urgent) where urgent = true;

-- There was no way for anyone to report a fake posting or an abusive employer; the only lever was
-- an admin noticing it themselves.
create table reports (
    id bigserial primary key,
    reporter_id bigint not null references users(id) on delete cascade,
    -- Exactly one of these is set, depending on what is being reported.
    job_id bigint references jobs(id) on delete cascade,
    reported_user_id bigint references users(id) on delete cascade,
    reason varchar(30) not null,
    details varchar(1000),
    resolved boolean not null default false,
    resolution_note varchar(500),
    created_at timestamptz not null default now(),
    resolved_at timestamptz,
    constraint reports_target_check check (
        (job_id is not null and reported_user_id is null)
        or (job_id is null and reported_user_id is not null)
    )
);
create index idx_reports_resolved on reports(resolved, created_at desc);

-- Workers were notified about every job matching their profession and region, which is a blunt
-- instrument: a saved search lets them say what they actually want to hear about.
create table saved_searches (
    id bigserial primary key,
    user_id bigint not null references users(id) on delete cascade,
    name varchar(100) not null,
    profession_id bigint references professions(id) on delete cascade,
    region_id bigint references regions(id) on delete cascade,
    district_id bigint references districts(id) on delete cascade,
    job_type varchar(20),
    min_payment numeric(14, 2),
    notify boolean not null default true,
    created_at timestamptz not null default now()
);
create index idx_saved_searches_user on saved_searches(user_id);
-- The matching sweep reads every notifying search, so keep that path indexed.
create index idx_saved_searches_notify on saved_searches(notify) where notify = true;
