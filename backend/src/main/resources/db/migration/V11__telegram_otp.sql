alter table users add column telegram_chat_id bigint;
alter table users add column telegram_link_token varchar(64);
alter table users add column telegram_link_purpose varchar(20);
create unique index idx_users_telegram_link_token on users(telegram_link_token) where telegram_link_token is not null;

alter table app_settings add column telegram_bot_token varchar(300);
alter table app_settings add column telegram_bot_username varchar(100);
