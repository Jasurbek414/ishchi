-- Fikr-mulohaza / muammo xabarlari: foydalanuvchi Telegram bot orqali yuboradi,
-- admin panelda ko'rib chiqiladi va javob yozilishi mumkin.
create table telegram_feedback (
    id bigserial primary key,
    chat_id bigint not null,
    user_id bigint references users(id) on delete set null,
    message text not null,
    resolved boolean not null default false,
    admin_reply text,
    replied_at timestamp,
    created_at timestamp not null default now()
);

create index idx_telegram_feedback_resolved on telegram_feedback(resolved);
create index idx_telegram_feedback_user on telegram_feedback(user_id);
