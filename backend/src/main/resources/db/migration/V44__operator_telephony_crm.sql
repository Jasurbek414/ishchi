-- V44: Operator CRM & Telephony Call Center integration
-- Stores calls dispatched from Asterisk and service request tickets handled by operators

create table if not exists operator_calls (
    id bigserial primary key,
    call_id varchar(100) not null unique,
    caller_phone varchar(30) not null,
    destination_number varchar(30),
    direction varchar(20) not null default 'INBOUND',
    status varchar(30) not null default 'RINGING',
    operator_id bigint references users(id) on delete set null,
    start_time timestamptz not null default now(),
    answer_time timestamptz,
    end_time timestamptz,
    duration_seconds integer default 0,
    recording_url varchar(500),
    notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_operator_calls_caller on operator_calls(caller_phone);
create index if not exists idx_operator_calls_status on operator_calls(status);
create index if not exists idx_operator_calls_start_time on operator_calls(start_time desc);
create index if not exists idx_operator_calls_operator_id on operator_calls(operator_id);

create table if not exists operator_tickets (
    id bigserial primary key,
    ticket_number varchar(50) not null unique,
    call_id bigint references operator_calls(id) on delete set null,
    customer_phone varchar(30) not null,
    customer_name varchar(200),
    customer_user_id bigint references users(id) on delete set null,
    region_id bigint references regions(id) on delete set null,
    district_id bigint references districts(id) on delete set null,
    address_line text,
    latitude double precision,
    longitude double precision,
    category varchar(100) not null,
    problem_description text not null,
    urgency varchar(30) not null default 'NORMAL',
    status varchar(30) not null default 'NEW',
    operator_id bigint references users(id) on delete set null,
    assigned_worker_id bigint references worker_profiles(id) on delete set null,
    price_agreed numeric(12, 2),
    payment_type varchar(50) default 'CASH',
    notes text,
    cancellation_reason text,
    created_at timestamptz not null default now(),
    assigned_at timestamptz,
    completed_at timestamptz,
    updated_at timestamptz not null default now()
);

create index if not exists idx_operator_tickets_status on operator_tickets(status);
create index if not exists idx_operator_tickets_phone on operator_tickets(customer_phone);
create index if not exists idx_operator_tickets_assigned_worker on operator_tickets(assigned_worker_id);
create index if not exists idx_operator_tickets_operator on operator_tickets(operator_id);
create index if not exists idx_operator_tickets_created_at on operator_tickets(created_at desc);
create index if not exists idx_operator_tickets_region on operator_tickets(region_id, district_id);
