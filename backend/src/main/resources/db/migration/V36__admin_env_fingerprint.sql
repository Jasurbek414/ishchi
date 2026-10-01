-- Remembers which ADMIN_PHONE/ADMIN_PASSWORD pair was last applied (as a salted hash), so the
-- seeder applies .env once per change instead of on every start — a login changed in the admin
-- panel then survives restarts.
alter table app_settings add column admin_env_fingerprint varchar(100);
