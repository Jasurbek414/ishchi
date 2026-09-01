create table device_tokens (
    id bigserial primary key,
    user_id bigint not null references users(id) on delete cascade,
    token varchar(300) not null unique,
    platform varchar(20) not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
create index idx_device_tokens_user on device_tokens(user_id);

alter table jobs add column expiry_reminder_sent boolean not null default false;
