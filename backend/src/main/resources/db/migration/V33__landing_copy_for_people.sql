-- The landing page's seeded copy read like a technical spec ("JWT asosidagi kirish", "Hamyon
-- infratuzilmasi", "OpenStreetMap asosida ..."). It is rewritten for the people the page is for.
-- Each row is only touched while it still holds the original seed text, so anything an admin has
-- already edited in the panel is left as it is.

update landing_items set title = 'Vositachisiz',
    description = 'Ishchi va ish beruvchi to''g''ridan-to''g''ri gaplashadi. Orada hech kim foiz olmaydi.'
where type = 'FEATURE' and title = 'Xarita asosida qidiruv';

update landing_items set title = 'Yaqin atrofdagi ishlar',
    description = 'Ish va ustalar avvalo sizga yaqin joydan ko''rsatiladi — xaritada ham ko''rish mumkin.'
where type = 'FEATURE' and title = 'Aniq joy belgilash';

update landing_items set title = 'Reyting va tasdiqlangan ustalar',
    description = 'Ish tugagach, ikkala tomon bir-birini baholaydi. Tekshirilgan ustalar alohida belgi bilan ajralib turadi.'
where type = 'FEATURE' and title = 'Rasmlar galereyasi';

update landing_items set title = 'Shoshilinch ishlar',
    description = 'Odam bugunoq kerakmi? E''lonni «shoshilinch» deb belgilang — u ro''yxatda birinchi ko''rinadi.'
where type = 'FEATURE' and title = 'Hududiy reklama karuseli';

update landing_items set title = 'Rasm bilan e''lon',
    description = 'Ishni rasmda ko''rsating — usta nima qilish kerakligini kelmasdan oldin biladi.'
where type = 'FEATURE' and title = 'Xavfsiz autentifikatsiya';

update landing_items set title = 'Bir necha tilda',
    description = 'Ilova o''zbek (lotin va kirill), rus va ingliz tillarida ishlaydi.'
where type = 'FEATURE' and title = 'Hamyon infratuzilmasi';

update landing_content set stat3_value = '0', stat3_label = 'vositachi'
where id = 1 and stat3_value = '2' and stat3_label = 'rol — bitta akkaunt';
