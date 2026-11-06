ALTER TABLE users ADD COLUMN IF NOT EXISTS is_registered BOOLEAN NOT NULL DEFAULT FALSE;

-- Existing users with real phone numbers or existing workers are considered registered
UPDATE users SET is_registered = TRUE WHERE phone NOT LIKE '+998TG%';
UPDATE users SET is_registered = TRUE WHERE phone LIKE '+998TGR%';

-- Ensure all TMA users are verified so JwtAuthenticationFilter allows them to make requests
UPDATE users SET is_verified = TRUE WHERE phone LIKE '+998TG%';
