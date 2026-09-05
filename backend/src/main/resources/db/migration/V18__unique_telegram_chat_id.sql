-- Bitta Telegram chat faqat bitta akkauntga bog'lanishi kerak. Bu cheklov bo'lmagani
-- uchun bir chat ikkita foydalanuvchiga bog'lanib qolgan edi (ma'lumot qo'lda tuzatildi),
-- va bu findByTelegramChatId() so'rovini NonUniqueResultException bilan buzgan edi
-- (bot fikr-mulohaza xabarlariga umuman javob bermay qolgan edi).
create unique index idx_users_telegram_chat_id_unique on users(telegram_chat_id) where telegram_chat_id is not null;
