alter table promo_banners
    add column start_at timestamptz,
    add column end_at timestamptz,
    add column view_count bigint not null default 0,
    add column click_count bigint not null default 0;
