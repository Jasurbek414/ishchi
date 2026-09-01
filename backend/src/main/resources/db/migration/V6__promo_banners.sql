create table promo_banners (
    id bigserial primary key,
    title varchar(150) not null,
    subtitle varchar(300),
    image_url varchar(500),
    link_url varchar(300),
    audience varchar(20) not null default 'ALL',
    region_id bigint references regions(id) on delete set null,
    sort_order integer not null default 0,
    is_active boolean not null default true,
    created_at timestamptz not null default now()
);
create index idx_promo_banners_audience on promo_banners(audience);
create index idx_promo_banners_region on promo_banners(region_id);
