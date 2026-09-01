alter table worker_profiles add column has_driver_license boolean not null default false;
alter table worker_profiles add column driver_license_categories varchar(50);

create table work_experiences (
    id bigserial primary key,
    worker_profile_id bigint not null references worker_profiles(id) on delete cascade,
    company_name varchar(150) not null,
    position_title varchar(150) not null,
    description varchar(1000),
    start_date date not null,
    end_date date,
    created_at timestamptz not null default now()
);
create index idx_work_experiences_worker on work_experiences(worker_profile_id);
