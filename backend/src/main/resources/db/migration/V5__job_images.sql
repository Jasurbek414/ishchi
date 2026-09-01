create table job_images (
    id bigserial primary key,
    job_id bigint not null references jobs(id) on delete cascade,
    url varchar(500) not null,
    created_at timestamptz not null default now()
);
create index idx_job_images_job on job_images(job_id);
