-- Extend emergency_applications table with document photos and rejection details
alter table emergency_applications add column if not exists passport_photo_url varchar(500);
alter table emergency_applications add column if not exists passport_back_url varchar(500);
alter table emergency_applications add column if not exists tools_photo_url varchar(500);
alter table emergency_applications add column if not exists description text;
alter table emergency_applications add column if not exists telegram_username varchar(100);
alter table emergency_applications add column if not exists rejection_reason text;
alter table emergency_applications add column if not exists updated_at timestamptz not null default now();
