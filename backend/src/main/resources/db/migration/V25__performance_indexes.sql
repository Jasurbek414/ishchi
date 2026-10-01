-- Every job search sorts by created_at desc by default; the expiry scheduler scans
-- expires_at nightly. Employer profiles are filtered by region on the /employers/map screen
-- (worker_profiles already had these two, employer_profiles did not).
create index idx_jobs_created_at on jobs(created_at desc);
create index idx_jobs_expires_at on jobs(expires_at) where expires_at is not null;
create index idx_employer_profiles_region on employer_profiles(region_id);
create index idx_employer_profiles_district on employer_profiles(district_id);

-- job_unlocks.unlocked_at was the only timestamp column created without a time zone.
alter table job_unlocks alter column unlocked_at type timestamptz;

-- The bot token is stored encrypted from now on (see TelegramTokenCipher); the ciphertext
-- envelope is longer than the raw token.
alter table app_settings alter column telegram_bot_token type varchar(500);
