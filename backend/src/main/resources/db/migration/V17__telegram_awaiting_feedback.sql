-- "Fikr-mulohaza" tugmasi bosilgandan keyin, botning keyingi xabarni fikr-mulohaza
-- sifatida kutayotganini bazada saqlaydi — backend qayta ishga tushirilsa ham
-- (xotiradagi holatdan farqli o'laroq) yo'qolmaydi.
create table telegram_awaiting_feedback (
    chat_id bigint primary key,
    created_at timestamp not null default now()
);
