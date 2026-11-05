create table promo_requests (
    id bigserial primary key,
    user_id bigint not null references users(id) on delete cascade,
    title varchar(150) not null,
    subtitle varchar(300),
    image_url varchar(500),
    link_url varchar(300),
    audience varchar(20) not null default 'ALL',
    region_id bigint references regions(id) on delete set null,
    duration_days integer not null default 7,
    status varchar(20) not null default 'PENDING',
    rejection_reason varchar(300),
    price numeric(12, 2) not null default 0,
    is_paid boolean not null default true,
    promo_banner_id bigint references promo_banners(id) on delete set null,
    created_at timestamptz not null default now(),
    reviewed_at timestamptz
);

create index idx_promo_requests_user on promo_requests(user_id, created_at desc);
create index idx_promo_requests_status on promo_requests(status, created_at desc);
