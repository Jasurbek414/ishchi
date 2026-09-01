alter table app_settings add column support_phone varchar(20);
alter table app_settings add column support_email varchar(200);
alter table app_settings add column support_telegram varchar(100);
alter table app_settings add column about_text text;

update app_settings set
    support_phone = '+998970504202',
    support_email = 'muminovjasurbek12@gmail.com',
    support_telegram = 'khorowiy_malchik',
    about_text = 'Ishchi — O''zbekiston bo''ylab ish beruvchi va ishchini bevosita bog''laydigan zamonaviy platforma. Qurilish, uy-ro''zg''or xizmatlari, avtomobil, oshxona va yana ko''plab sohalarda tezkor va ishonchli hamkorlik imkoniyatini yaratadi.

Platformada nima bor:
• Kunlik va doimiy ish e''lonlari — hudud va kasb bo''yicha qidiring
• Ishchi va ish beruvchi bevosita, hech qanday vositachisiz bog''lanadi
• Ro''yxatdan o''tish va foydalanish butunlay bepul
• Har bir ustaning tajribasi va kasbi profilida aniq ko''rsatiladi

Maqsadimiz — mehnat bozorini soddalashtirish, har bir insonga munosib ish yoki ishonchli xodim topishda yordam berish.'
where id = 1;
