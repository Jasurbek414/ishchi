-- Telegram bot orqali "Buyurtma joylashtirish" ketma-ket savol-javob oqimining
-- oraliq holati. Foydalanuvchiga bog'liq (chat_id bo'yicha bitta faol qoralama),
-- bazada saqlanadi — backend qayta ishga tushirilsa ham yo'qolmaydi.
create table telegram_job_draft (
    chat_id bigint primary key,
    step varchar(30) not null,
    title varchar(200),
    description text,
    profession_id bigint references professions(id),
    region_id bigint references regions(id),
    district_id bigint references districts(id),
    payment numeric(14, 2),
    payment_type varchar(20),
    job_type varchar(20),
    workers_needed integer,
    created_at timestamp not null default now(),
    updated_at timestamp not null default now()
);

create table telegram_job_draft_images (
    draft_chat_id bigint not null references telegram_job_draft(chat_id) on delete cascade,
    url varchar(500) not null
);
