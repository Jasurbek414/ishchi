create table app_settings (
    id bigint primary key check (id = 1),
    wallet_enabled boolean not null default false
);
insert into app_settings (id, wallet_enabled) values (1, false);
