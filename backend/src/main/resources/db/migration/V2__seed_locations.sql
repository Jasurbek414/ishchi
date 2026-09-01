insert into regions (name) values
    ('Qoraqalpog''iston Respublikasi'),
    ('Andijon viloyati'),
    ('Buxoro viloyati'),
    ('Jizzax viloyati'),
    ('Qashqadaryo viloyati'),
    ('Navoiy viloyati'),
    ('Namangan viloyati'),
    ('Samarqand viloyati'),
    ('Surxondaryo viloyati'),
    ('Sirdaryo viloyati'),
    ('Toshkent viloyati'),
    ('Farg''ona viloyati'),
    ('Xorazm viloyati'),
    ('Toshkent shahri');

insert into districts (region_id, name)
select (select id from regions where name = 'Qoraqalpog''iston Respublikasi'), d
from (values
    ('Nukus shahri'),('Amudaryo tumani'),('Beruniy tumani'),('Chimboy tumani'),
    ('Ellikqal''a tumani'),('Kegeyli tumani'),('Mo''ynoq tumani'),('Nukus tumani'),
    ('Qanliko''l tumani'),('Qo''ng''irot tumani'),('Qorao''zak tumani'),('Shumanay tumani'),
    ('Taxtako''pir tumani'),('To''rtko''l tumani'),('Xo''jayli tumani')
) as t(d);

insert into districts (region_id, name)
select (select id from regions where name = 'Andijon viloyati'), d
from (values
    ('Andijon shahri'),('Xonobod shahri'),('Andijon tumani'),('Asaka tumani'),
    ('Baliqchi tumani'),('Bo''z tumani'),('Buloqboshi tumani'),('Izboskan tumani'),
    ('Jalaquduq tumani'),('Xo''jaobod tumani'),('Qo''rg''ontepa tumani'),('Marhamat tumani'),
    ('Oltinko''l tumani'),('Paxtaobod tumani'),('Shahrixon tumani'),('Ulug''nor tumani')
) as t(d);

insert into districts (region_id, name)
select (select id from regions where name = 'Buxoro viloyati'), d
from (values
    ('Buxoro shahri'),('Kogon shahri'),('Buxoro tumani'),('G''ijduvon tumani'),
    ('Jondor tumani'),('Kogon tumani'),('Qorako''l tumani'),('Qorovulbozor tumani'),
    ('Peshku tumani'),('Romitan tumani'),('Shofirkon tumani'),('Vobkent tumani'),
    ('Olot tumani')
) as t(d);

insert into districts (region_id, name)
select (select id from regions where name = 'Jizzax viloyati'), d
from (values
    ('Jizzax shahri'),('Arnasoy tumani'),('Baxmal tumani'),('Do''stlik tumani'),
    ('Forish tumani'),('G''allaorol tumani'),('Jizzax tumani'),('Mirzacho''l tumani'),
    ('Paxtakor tumani'),('Yangiobod tumani'),('Zomin tumani'),('Zarbdor tumani'),
    ('Sharof Rashidov tumani')
) as t(d);

insert into districts (region_id, name)
select (select id from regions where name = 'Qashqadaryo viloyati'), d
from (values
    ('Qarshi shahri'),('Shahrisabz shahri'),('Chiroqchi tumani'),('Dehqonobod tumani'),
    ('G''uzor tumani'),('Kasbi tumani'),('Kitob tumani'),('Koson tumani'),
    ('Mirishkor tumani'),('Muborak tumani'),('Nishon tumani'),('Qamashi tumani'),
    ('Qarshi tumani'),('Shahrisabz tumani'),('Yakkabog'' tumani')
) as t(d);

insert into districts (region_id, name)
select (select id from regions where name = 'Navoiy viloyati'), d
from (values
    ('Navoiy shahri'),('Zarafshon shahri'),('Karmana tumani'),('Konimex tumani'),
    ('Navbahor tumani'),('Nurota tumani'),('Qiziltepa tumani'),('Tomdi tumani'),
    ('Uchquduq tumani'),('Xatirchi tumani')
) as t(d);

insert into districts (region_id, name)
select (select id from regions where name = 'Namangan viloyati'), d
from (values
    ('Namangan shahri'),('Chortoq tumani'),('Chust tumani'),('Kosonsoy tumani'),
    ('Mingbuloq tumani'),('Namangan tumani'),('Norin tumani'),('Pop tumani'),
    ('To''raqo''rg''on tumani'),('Uchqo''rg''on tumani'),('Uychi tumani'),
    ('Yangiqo''rg''on tumani'),('Davlatobod tumani')
) as t(d);

insert into districts (region_id, name)
select (select id from regions where name = 'Samarqand viloyati'), d
from (values
    ('Samarqand shahri'),('Kattaqo''rg''on shahri'),('Bulung''ur tumani'),('Ishtixon tumani'),
    ('Jomboy tumani'),('Kattaqo''rg''on tumani'),('Qo''shrabot tumani'),('Narpay tumani'),
    ('Nurobod tumani'),('Oqdaryo tumani'),('Pastdarg''om tumani'),('Paxtachi tumani'),
    ('Payariq tumani'),('Samarqand tumani'),('Toyloq tumani'),('Urgut tumani')
) as t(d);

insert into districts (region_id, name)
select (select id from regions where name = 'Surxondaryo viloyati'), d
from (values
    ('Termiz shahri'),('Angor tumani'),('Bandixon tumani'),('Boysun tumani'),
    ('Denov tumani'),('Jarqo''rg''on tumani'),('Muzrabot tumani'),('Oltinsoy tumani'),
    ('Qiziriq tumani'),('Qumqo''rg''on tumani'),('Sariosiyo tumani'),('Sherobod tumani'),
    ('Shorchi tumani'),('Termiz tumani'),('Uzun tumani')
) as t(d);

insert into districts (region_id, name)
select (select id from regions where name = 'Sirdaryo viloyati'), d
from (values
    ('Guliston shahri'),('Boyovut tumani'),('Guliston tumani'),('Mirzaobod tumani'),
    ('Oqoltin tumani'),('Sardoba tumani'),('Sayxunobod tumani'),('Sirdaryo tumani'),
    ('Xovos tumani')
) as t(d);

insert into districts (region_id, name)
select (select id from regions where name = 'Toshkent viloyati'), d
from (values
    ('Nurafshon shahri'),('Angren shahri'),('Olmaliq shahri'),('Bekobod shahri'),
    ('Chirchiq shahri'),('Yangiyo''l shahri'),('Ohangaron shahri'),
    ('Bekobod tumani'),('Bo''ka tumani'),('Chinoz tumani'),('Qibray tumani'),
    ('Ohangaron tumani'),('Oqqo''rg''on tumani'),('Parkent tumani'),('Piskent tumani'),
    ('Quyi Chirchiq tumani'),('O''rta Chirchiq tumani'),('Yuqori Chirchiq tumani'),
    ('Zangiota tumani'),('Toshkent tumani'),('Yangiyo''l tumani')
) as t(d);

insert into districts (region_id, name)
select (select id from regions where name = 'Farg''ona viloyati'), d
from (values
    ('Farg''ona shahri'),('Qo''qon shahri'),('Marg''ilon shahri'),('Bag''dod tumani'),
    ('Beshariq tumani'),('Buvayda tumani'),('Dang''ara tumani'),('Farg''ona tumani'),
    ('Furqat tumani'),('Qo''shtepa tumani'),('Quva tumani'),('Rishton tumani'),
    ('So''x tumani'),('Toshloq tumani'),('Uchko''prik tumani'),('O''zbekiston tumani'),
    ('Yozyovon tumani'),('Oltiariq tumani')
) as t(d);

insert into districts (region_id, name)
select (select id from regions where name = 'Xorazm viloyati'), d
from (values
    ('Urganch shahri'),('Xiva shahri'),('Bog''ot tumani'),('Gurlan tumani'),
    ('Hazorasp tumani'),('Xonqa tumani'),('Xiva tumani'),('Qo''shko''pir tumani'),
    ('Shovot tumani'),('Urganch tumani'),('Yangiariq tumani'),('Yangibozor tumani'),
    ('Tuproqqal''a tumani')
) as t(d);

insert into districts (region_id, name)
select (select id from regions where name = 'Toshkent shahri'), d
from (values
    ('Bektemir tumani'),('Chilonzor tumani'),('Mirobod tumani'),('Mirzo Ulug''bek tumani'),
    ('Olmazor tumani'),('Sergeli tumani'),('Shayxontohur tumani'),('Uchtepa tumani'),
    ('Yakkasaroy tumani'),('Yashnobod tumani'),('Yunusobod tumani'),('Yangihayot tumani')
) as t(d);
