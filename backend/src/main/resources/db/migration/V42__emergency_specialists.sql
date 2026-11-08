-- Add emergency specialist flag to worker_profiles
alter table worker_profiles add column if not exists is_emergency boolean not null default false;
create index if not exists idx_worker_profiles_emergency on worker_profiles(is_emergency);

-- Emergency applications / contracts table
create table if not exists emergency_applications (
    id bigserial primary key,
    worker_id bigint not null references worker_profiles(id) on delete cascade,
    full_name varchar(200) not null,
    phone varchar(20) not null,
    category varchar(100) not null,
    passport_data varchar(100),
    certificate_url varchar(500),
    experience_years int,
    status varchar(20) not null default 'PENDING',
    admin_notes text,
    created_at timestamptz not null default now(),
    reviewed_at timestamptz
);

create index if not exists idx_emergency_applications_status on emergency_applications(status);

-- Seed additional emergency professions if not present
insert into professions (name, category, is_active)
select 'Qulf ustasi / Qulf ochish', 'Favqulodda xizmatlar', true
where not exists (select 1 from professions where name = 'Qulf ustasi / Qulf ochish');

insert into professions (name, category, is_active)
select 'Evakuator xizmati', 'Favqulodda xizmatlar', true
where not exists (select 1 from professions where name = 'Evakuator xizmati');

insert into professions (name, category, is_active)
select 'Gaz va isitish qozoni ustasi', 'Favqulodda xizmatlar', true
where not exists (select 1 from professions where name = 'Gaz va isitish qozoni ustasi');

-- Mark existing emergency-related workers as initial emergency specialists
update worker_profiles wp
set is_emergency = true
where exists (
    select 1 from worker_professions wpr
    join professions p on p.id = wpr.profession_id
    where wpr.worker_id = wp.id
    and (
        p.name ilike '%Santexnik%'
        or p.name ilike '%Elektrik%'
        or p.name ilike '%Konditsioner%'
        or p.name ilike '%Qulf%'
        or p.name ilike '%Evakuator%'
        or p.name ilike '%Gaz%'
        or p.name ilike '%Maishiy texnika%'
        or p.name ilike '%Avtomexanik%'
        or p.name ilike '%Shinomontaj%'
    )
);
