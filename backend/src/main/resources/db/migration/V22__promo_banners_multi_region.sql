create table promo_banner_regions (
    promo_banner_id bigint not null references promo_banners(id) on delete cascade,
    region_id bigint not null references regions(id) on delete cascade,
    primary key (promo_banner_id, region_id)
);

insert into promo_banner_regions (promo_banner_id, region_id)
select id, region_id from promo_banners where region_id is not null;

alter table promo_banners drop column region_id;
