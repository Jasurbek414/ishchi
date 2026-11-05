create table notifications (
    id bigserial primary key,
    user_id bigint not null references users(id) on delete cascade,
    title varchar(200) not null,
    body text not null,
    type varchar(50) not null default 'SYSTEM',
    data jsonb,
    is_read boolean not null default false,
    created_at timestamptz not null default now()
);

create index idx_notifications_user_id on notifications(user_id);
create index idx_notifications_user_created on notifications(user_id, created_at desc);
