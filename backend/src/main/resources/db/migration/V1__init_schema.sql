create table users (
    id bigserial primary key,
    phone varchar(20) not null unique,
    password_hash varchar(255) not null,
    role varchar(20) not null,
    is_active boolean not null default true,
    is_verified boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table refresh_tokens (
    id bigserial primary key,
    user_id bigint not null references users(id) on delete cascade,
    token_hash varchar(128) not null unique,
    expires_at timestamptz not null,
    revoked boolean not null default false,
    created_at timestamptz not null default now()
);
create index idx_refresh_tokens_user on refresh_tokens(user_id);

create table otp_codes (
    id bigserial primary key,
    phone varchar(20) not null,
    code varchar(10) not null,
    purpose varchar(20) not null,
    expires_at timestamptz not null,
    is_used boolean not null default false,
    created_at timestamptz not null default now()
);
create index idx_otp_codes_lookup on otp_codes(phone, purpose, is_used);

create table regions (
    id bigserial primary key,
    name varchar(100) not null unique
);

create table districts (
    id bigserial primary key,
    region_id bigint not null references regions(id) on delete cascade,
    name varchar(100) not null,
    unique (region_id, name)
);
create index idx_districts_region on districts(region_id);

create table professions (
    id bigserial primary key,
    name varchar(100) not null unique,
    category varchar(100) not null,
    is_active boolean not null default true,
    created_at timestamptz not null default now()
);

create table worker_profiles (
    id bigserial primary key,
    user_id bigint not null unique references users(id) on delete cascade,
    first_name varchar(100) not null,
    last_name varchar(100) not null,
    avatar_url varchar(500),
    region_id bigint not null references regions(id),
    district_id bigint not null references districts(id),
    experience_years int,
    about text,
    is_available boolean not null default true,
    updated_at timestamptz not null default now()
);
create index idx_worker_profiles_region on worker_profiles(region_id);
create index idx_worker_profiles_district on worker_profiles(district_id);

create table worker_professions (
    worker_id bigint not null references worker_profiles(id) on delete cascade,
    profession_id bigint not null references professions(id) on delete cascade,
    primary key (worker_id, profession_id)
);
create index idx_worker_professions_profession on worker_professions(profession_id);

create table employer_profiles (
    id bigserial primary key,
    user_id bigint not null unique references users(id) on delete cascade,
    first_name varchar(100) not null,
    last_name varchar(100) not null,
    avatar_url varchar(500),
    region_id bigint not null references regions(id),
    district_id bigint not null references districts(id),
    about text,
    updated_at timestamptz not null default now()
);

create table jobs (
    id bigserial primary key,
    employer_id bigint not null references employer_profiles(id) on delete cascade,
    title varchar(200) not null,
    description text not null,
    profession_id bigint not null references professions(id),
    region_id bigint not null references regions(id),
    district_id bigint not null references districts(id),
    payment numeric(14,2) not null,
    payment_type varchar(20) not null,
    job_type varchar(20) not null,
    workers_needed int not null default 1,
    start_date date,
    duration_value int,
    duration_unit varchar(20),
    status varchar(20) not null default 'ACTIVE',
    is_blocked boolean not null default false,
    expires_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
create index idx_jobs_region on jobs(region_id);
create index idx_jobs_district on jobs(district_id);
create index idx_jobs_profession on jobs(profession_id);
create index idx_jobs_status on jobs(status);
create index idx_jobs_employer on jobs(employer_id);
