-- Caps how many times a single code may be guessed. Without this the 4-digit code (9000
-- possibilities) could be brute-forced, which let an attacker reset any account's password.
alter table otp_codes add column attempts int not null default 0;
