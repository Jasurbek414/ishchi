-- Ommaviy landing sahifasi uchun admin panelda boshqariladigan matn.
create table landing_content (
    id bigint primary key default 1,
    hero_title varchar(300) not null,
    hero_subtitle varchar(600) not null,
    stat1_value varchar(40) not null,
    stat1_label varchar(100) not null,
    stat2_value varchar(40) not null,
    stat2_label varchar(100) not null,
    stat3_value varchar(40) not null,
    stat3_label varchar(100) not null,
    stat4_value varchar(40) not null,
    stat4_label varchar(100) not null
);

insert into landing_content (
    id, hero_title, hero_subtitle,
    stat1_value, stat1_label, stat2_value, stat2_label,
    stat3_value, stat3_label, stat4_value, stat4_label
) values (
    1,
    'Ishchi va ish beruvchini bevosita bog''laydi',
    'Mardikor, usta va mutaxassisni ish beruvchi bilan vositachisiz uchrashtiradigan mobil platforma. Buyurtma joylashtirasiz yoki qidirasiz — telefon orqali to''g''ridan-to''g''ri bog''lanasiz.',
    '14', 'viloyat qamrovi',
    '26+', 'kasb toifasi',
    '2', 'rol — bitta akkaunt',
    '0 so''m', 'ro''yxatdan o''tish'
);

-- Landing sahifadagi takrorlanuvchi bloklar: imkoniyatlar va yo'l xaritasi.
-- Ikkalasi bir xil shaklga ega (sarlavha + tavsif + tartib), shuning uchun bitta
-- jadval + `type` ustuni bilan boshqariladi, alohida ikkita jadval o'rniga.
create table landing_items (
    id bigserial primary key,
    type varchar(20) not null,
    title varchar(150) not null,
    description varchar(500) not null,
    sort_order integer not null default 0,
    created_at timestamp not null default now()
);

create index idx_landing_items_type on landing_items(type, sort_order);

insert into landing_items (type, title, description, sort_order) values
('FEATURE', 'Xarita asosida qidiruv', 'OpenStreetMap asosida — buyurtmalar, ishchilar va ish beruvchilar xaritada pin sifatida, "mening joylashuvim" GPS tugmasi bilan.', 1),
('FEATURE', 'Aniq joy belgilash', 'Har bir buyurtma va profil uchun xaritaga bosib yoki GPS orqali aniq koordinata belgilanadi.', 2),
('FEATURE', 'Rasmlar galereyasi', 'Buyurtmaga istalgancha rasm yuklanadi, to''liq ekran ko''rish rejimi bilan.', 3),
('FEATURE', 'Hududiy reklama karuseli', 'Admin tomonidan boshqariladi — auditoriya (ishchi/ish beruvchi) va hudud bo''yicha moslashtiriladi.', 4),
('FEATURE', 'Xavfsiz autentifikatsiya', 'JWT asosidagi kirish, SMS tasdiqlash, to''g''ri ajratilgan xatolik boshqaruvi.', 5),
('FEATURE', 'Hamyon infratuzilmasi', 'Admin panel orqali yoqiladigan hamyon tizimi — platforma hozircha to''liq bepul.', 6),
('ROADMAP', 'Chat / ichki xabar almashish', 'Foydalanuvchilar ilova ichida to''g''ridan-to''g''ri yozishishi.', 1),
('ROADMAP', 'Push-bildirishnoma', 'Yangi mos buyurtma yoki javob haqida darhol xabar.', 2),
('ROADMAP', 'Reyting va sharh tizimi', 'Ishchi va ish beruvchi bir-birini baholay oladi.', 3),
('ROADMAP', 'Real SMS provayder', 'Hozir tasdiqlash kodi test rejimida — real SMS xizmati ulanadi.', 4),
('ROADMAP', 'Ko''p tillilik', 'Hozircha faqat o''zbek tili — rus va boshqa tillar qo''shiladi.', 5);
