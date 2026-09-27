-- Until now the platform lost sight of a job the moment a worker read it: the whole flow ended with
-- "call this number", so nothing recorded who was interested, who actually worked, or whether a
-- posting went anywhere. That gap is why there can be no ratings, no trust signals and no way to
-- tell a real employer from a fake one. This table is the missing link.
create table job_applications (
    id bigserial primary key,
    job_id bigint not null references jobs(id) on delete cascade,
    worker_id bigint not null references users(id) on delete cascade,
    -- INTERESTED (the worker responded), HIRED / DECLINED (the employer decided)
    status varchar(20) not null default 'INTERESTED',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (job_id, worker_id)
);

create index idx_job_applications_job on job_applications(job_id, created_at desc);
create index idx_job_applications_worker on job_applications(worker_id, created_at desc);
