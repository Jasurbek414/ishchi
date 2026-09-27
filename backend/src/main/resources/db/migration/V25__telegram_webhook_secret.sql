-- The webhook secret used to be derived from the bot token (the first 32 hex chars of its
-- SHA-256) and carried in the webhook URL path, so it leaked into every proxy access log and was
-- only ever as separate as the token it came from. It is now a random value of its own, and
-- travels in Telegram's X-Telegram-Bot-Api-Secret-Token header instead of the URL.
alter table app_settings add column telegram_webhook_secret varchar(100);
