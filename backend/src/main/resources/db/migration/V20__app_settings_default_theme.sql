alter table app_settings
    add column default_theme_mode varchar(10) not null default 'LIGHT',
    add column default_seed_color varchar(9) not null default '#E8541F';
