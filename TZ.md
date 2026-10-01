# Ishchi — Ish topish va kunlik xizmatlar platformasi

## Texnik topshiriq (TZ) — v2, loyihaning haqiqiy holatiga mos yangilangan

> Ushbu hujjat loyihaning boshida yozilgan asl TZ o'rniga, loyiha rivojlanish jarayonida amalda qurilgan va ishlab turgan tizimni aniq tasvirlash uchun qayta yozildi. Barcha bo'limlar quyida sanab o'tilgan funksiyalar **allaqachon ishlab chiqilgan va production'da ishlamoqda**, agar "Kelajakda" deb alohida belgilanmagan bo'lsa.

---

## 1. Loyiha maqsadi

O'zbekiston bo'ylab **ishchi** (mardikor, kunlik ishchi, mutaxassis) va **ish beruvchi**ni bog'laydigan mobil platforma. Ish beruvchi buyurtma (vakansiya) joylaydi, ishchi uni qidiradi/ko'radi va to'g'ridan-to'g'ri telefon orqali bog'lanadi — vositachisiz.

**Muhim arxitektura qarori:** bitta akkaunt ikkala rolda ham ishlashi mumkin (rol almashtirish funksiyasi — 8-bo'limga qarang).

---

## 2. Texnik stack

| Qism | Texnologiya |
|---|---|
| Backend | Spring Boot 3.3.4 (Java 17), Spring Security + JWT, Spring Data JPA, Flyway |
| Ma'lumotlar bazasi | PostgreSQL 16 |
| Mobil ilova | Flutter 3.29.3, Riverpod, GoRouter, Dio |
| Web admin panel | React 18 + Vite, backend classpath'ga qurib joylashtiriladi (`/admin`) |
| Xarita | OpenStreetMap (flutter_map + latlong2), bepul, API kalitisiz |
| Joylashuv | geolocator (GPS/joriy joylashuv) |
| Fayl saqlash | Lokal disk, Docker named volume (`ishchi_uploads`) |
| Push-bildirishnoma | Firebase Cloud Messaging (sozlanmasa ilova baribir ishlaydi) |
| Telegram bot | Tasdiqlash kodlari, fikr-mulohaza, botdan buyurtma joylashtirish |
| Ko'p tillilik | O'zbek (lotin), O'zbek (kirill), Rus, Ingliz |
| Domen/tunnel | Cloudflare Tunnel — `APP_BASE_URL` orqali sozlanadi (`https://api.uzbishchi.uz`) |
| Konteynerlashtirish | Docker Compose (db + backend + cloudflared) |
| CI | GitHub Actions — backend testlari, migratsiyalar, frontend build, `flutter analyze` |

---

## 3. Ma'lumotlar modeli (asosiy jadvallar)

- **users** — telefon (unique), parol hash, rol (WORKER/EMPLOYER/ADMIN — bu "joriy faol rol", akkaunt ikkalasiga ham ega bo'lishi mumkin), faol/tasdiqlangan holat
- **worker_profiles** — ism, familiya, avatar, hudud/tuman, tajriba, o'zi haqida, mavjudlik, **latitude/longitude**, **work_preference** (PERMANENT/DAILY/SPECIALIST), kasblar (many-to-many)
- **employer_profiles** — ism, familiya, avatar, hudud/tuman, o'zi haqida, **latitude/longitude**
- **jobs** — sarlavha, tavsif, kasb, hudud/tuman, to'lov (summa+turi), ish turi, kerakli ishchilar soni, boshlanish sanasi, davomiylik, holat, **latitude/longitude**, rasmlar (bir nechta, `job_images`)
- **professions** — kasb nomi + kategoriya (admin CRUD orqali boshqariladi)
- **regions/districts** — O'zbekistonning barcha 14 hudud + tumanlari (seed qilingan)
- **promo_banners** — reklama karuseli: sarlavha, matn, rasm, havola, **auditoriya** (ALL/WORKER/EMPLOYER — qaysi karuselda ko'rinishi), **hudud** (belgilansa faqat o'sha viloyatga, bo'sh bo'lsa hammaga), tartib raqami, faol/nofaol
- **wallet_accounts / wallet_transactions** — hamyon tizimi (mavjud, lekin hozircha **admin panel orqali yoqilgan/o'chirilgan holat** — platforma hozircha tekin)
- **app_settings** — bitta qatorli jadval, platforma darajasidagi sozlamalar: `wallet_enabled`, buyurtma joylashtirish va kontakt ochish to'lovlari, standart mavzu/rang, qo'llab-quvvatlash kontaktlari, Telegram bot tokeni (**shifrlangan holda saqlanadi**) va webhook siri
- **refresh_tokens, otp_codes** — auth uchun (`otp_codes.attempts` — noto'g'ri urinishlar soni, 5 tadan keyin kod kuyadi)
- **job_unlocks** — qaysi ishchi qaysi buyurtma kontaktini ochish uchun to'lagani (`unique (job_id, worker_id)` — ikki marta hisoblanmaydi)
- **device_tokens** — push-bildirishnoma uchun qurilma tokenlari
- **telegram_feedback, telegram_job_drafts, telegram_awaiting_feedback** — bot orqali fikr-mulohaza va buyurtma joylashtirish ustasi holati
- **landing_content, landing_items** — landing sahifa matnlari (admin panelda tahrirlanadi)
- **work_experiences** — ishchining ish tajribasi yozuvlari

---

## 4. Autentifikatsiya

- Telefon + parol bilan ro'yxatdan o'tish, JWT (access 30 daq. + refresh 30 kun)
- **Tasdiqlash kodi Telegram bot orqali yuboriladi.** Bot tokeni admin panelda sozlanadi; sozlanmagan bo'lsa kod mock rejimda `1234` bo'ladi (real SMS provider `OtpService` interfeysi orqali ulanadi)
- **Telefon raqam egaligi Telegram tasdiqlagan kontakt orqali isbotlanadi.** Botga ulanish havolasi (`/start <token>`) o'zi hech narsani bog'lamaydi — bot raqamni so'raydi va faqat Telegram "bu yuboruvchining o'z raqami" deb kafolatlagan kontakt qabul qilinadi (`contact.user_id` yuboruvchi id'siga teng bo'lishi shart). Shu tufayli boshqa odamning raqamiga akkaunt ochib bo'lmaydi
- **Kodni taxmin qilish cheklangan**: 4 xonali kodga 5 tadan ko'p xato urinish bo'lsa kod kuyadi; login, kod tekshirish va kod so'rash endpointlariga IP bo'yicha rate-limit qo'yilgan
- **Parolni almashtirish** (ilova ichida) — `POST /api/profile/change-password`, **joriy parolni** tasdiqlashni talab qiladi va barcha refresh tokenlarni bekor qiladi
- **Parolni unutish** — Telegram orqali kod + yangi parol
- Mavjud bo'lmagan raqamga ham ro'yxatdan o'tgan raqam bilan bir xil javob qaytadi, ya'ni qaysi raqamlar ro'yxatda borligini aniqlab bo'lmaydi
- **401 vs 403 to'g'ri ajratilgan**: token yo'q/eskirgan → 401 (mobil ilova avtomatik yangilaydi yoki loginga qaytaradi); ruxsat yo'q (masalan boshqa rol) → 403

---

## 5. Backend API (asosiy guruhlar)

- `POST /api/auth/register|login|refresh|logout|verify-otp|resend-otp|forgot-password|reset-password`
- `GET/PATCH /api/profile`, `POST /api/profile/avatar`, **`POST /api/profile/switch-role`**
- `GET /api/regions`, `GET /api/regions/{id}/districts`
- `GET /api/professions` (ochiq), admin CRUD — `/api/admin/professions`
- `GET/POST/PATCH/DELETE /api/jobs`, `GET /api/jobs/my`, **`GET /api/jobs/map`**, `POST/DELETE /api/jobs/{id}/images`
- `GET /api/workers`, `GET /api/workers/{id}`, **`GET /api/workers/map`** (endi `workPreference` bo'yicha filtrlanadi)
- **`GET /api/employers/map`** — ish beruvchilarni xaritada ko'rsatish uchun
- `GET /api/promo-banners?audience=&regionId=` (ochiq), admin CRUD — `/api/admin/promo-banners` (rasm yuklash bilan)
- `GET /api/app-settings` (ochiq), `GET/PATCH /api/admin/settings`
- **`POST /api/profile/change-password`** — joriy parolni tasdiqlab yangisiga almashtirish
- `GET/PATCH /api/profile`, `POST /api/profile/avatar`, `POST /api/profile/experience` (+ `PATCH`/`DELETE` `/{id}`)
- **`POST /api/jobs/{id}/unlock`** — ishchi kontakt ma'lumotlarini ochish uchun to'laydi (to'lov yoqilgan bo'lsa)
- `POST /api/notifications/device-token`, `DELETE /api/notifications/device-token`
- `GET /api/wallet`, `GET /api/wallet/transactions`, `POST /api/wallet/topup`
- **`POST /api/telegram/webhook`** — Telegram yangilanishlari (sir `X-Telegram-Bot-Api-Secret-Token` sarlavhasida keladi)
- `GET/PATCH /api/admin/users/{id}/active`, `GET/PATCH/DELETE /api/admin/jobs`, `GET /api/admin/wallets/{userId}`, `POST /api/admin/wallets/{userId}/adjust`, `GET /api/admin/stats`, `GET/PATCH /api/admin/settings`, `POST /api/admin/notifications/broadcast`, `/api/admin/landing/**`, `/api/admin/telegram/feedback/**`

**Ruxsatlar:** `/api/workers*` — faqat `EMPLOYER`, `/api/employers/map` — faqat `WORKER`, `/api/admin/**` — faqat `ADMIN`.
Telefon raqam **faqat bitta ishchining tafsiloti** (`GET /api/workers/{id}`) va ochilgan buyurtmada qaytariladi — ro'yxat va xarita javoblarida berilmaydi.
Sahifa o'lchami serverda 50 ta bilan cheklangan.

---

## 6. Mobil ilova — Ishchi tomoni

- **Bosh sahifa**: tavsiya etilgan buyurtmalar (hudud bo'yicha yaqinlashtirilgan), tez kasb filtri, reklama karuseli, **ish beruvchilar xaritasiga o'tish tugmasi**
- **Buyurtmalar**: to'liq filtr/qidiruv/saralash, **xarita ko'rinishi** (buyurtmalarni pin sifatida ko'rish, joriy joylashuvni ko'rsatish)
- **Buyurtma tafsiloti**: rasmlar galereyasi (to'liq ekran ko'rish), ish beruvchi bilan bog'lanish (qo'ng'iroq)
- **Profil**: tahrirlash (ism, hudud, tajriba, kasblar, **qanday ish qidirayotgani — Doimiy ish/Kunlik ishchi/Mutaxassis**, **xaritadan joy belgilash**), parolni almashtirish, mavzu/rang sozlamalari, **rolni almashtirish (Ish beruvchi rejimiga o'tish)**, hamyon (agar admin yoqqan bo'lsa)

## 7. Mobil ilova — Ish beruvchi tomoni

- **Ishchi qidirish**: qidiruv + filtr sheet + **tezkor filtr bo'limlari (Doimiy ish / Kunlik ishchi / Mutaxassis)** qidiruv maydoni tagida, **xarita ko'rinishi** (ishchilarni pin sifatida ko'rish)
- **Ishchi profili**: to'liq ma'lumot, bog'lanish
- **Buyurtma berish/tahrirlash**: barcha maydonlar + **rasm yuklash (istalgancha)** + **xaritadan aniq joy belgilash**
- **Mening buyurtmalarim**: status bo'yicha tab (Faol/Jarayonda/Yakunlangan/Bekor qilingan), tahrirlash/yopish/bekor qilish
- **Profil**: tahrirlash (ism, hudud, o'zi haqida, **xaritadan manzil belgilash**), **rolni almashtirish (Ishchi rejimiga o'tish)**

## 8. Rol almashtirish (ikkala tomon uchun umumiy)

Bitta akkaunt istalgan vaqt **Ishchi ↔ Ish beruvchi** o'rtasida almashishi mumkin:
- Ikkala profil ham mustaqil saqlanadi — qaytadan almashtirilganda oldingi ma'lumotlar tiklanadi
- Birinchi marta boshqa rolga o'tilganda, umumiy maydonlar (ism, familiya, avatar, hudud, tuman, o'zi haqida, joylashuv) avtomatik ko'chiriladi
- Ishchi rejimiga birinchi o'tishda kasblarni tanlash ixtiyoriy taklif qilinadi
- Almashtirish darhol yangi JWT token qaytaradi, ilova avtomatik tegishli bosh sahifaga yo'naltiradi

## 9. Xarita funksiyalari (to'liq funksional, OpenStreetMap asosida)

- **Joy tanlash ekrani** (`LocationPickerScreen`) — xaritaga bosib yoki surib nuqta belgilash, "Joriy joylashuvim" tugmasi (GPS ruxsatini so'raydi, aniq koordinatani oladi)
- **Buyurtmalar xaritasi** (ishchi) — barcha joylashuvi belgilangan faol buyurtmalar pin sifatida, bosilganda qisqa ma'lumot + tafsilotga o'tish
- **Ishchilar xaritasi** (ish beruvchi) — xuddi shunday, ishchilar uchun
- **Ish beruvchilar xaritasi** (ishchi) — ish beruvchilarning joylashuvi, bosilganda buyurtmalariga o'tish havolasi
- Uchala xarita ekranida ham **"Mening joylashuvim" tugmasi** bor — foydalanuvchining haqiqiy GPS joyini xaritada ko'k nuqta bilan ko'rsatadi va xaritani o'sha joyga markazlashtiradi
- Android'da joylashuv ruxsati (`ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`) `AndroidManifest.xml`da to'g'ri belgilangan

## 10. Reklama karuseli (admin boshqaradigan)

Bosh sahifa (ishchi) va Ishchi qidirish (ish beruvchi) ekranlarining yuqorisida avtomatik aylanadigan reklama banneri:
- Admin panelda (`/admin` → "Reklama") rasm, sarlavha, matn, havola bilan yaratiladi
- **Auditoriya bo'yicha**: faqat ishchilarga, faqat ish beruvchilarga yoki hammaga
- **Hudud bo'yicha**: masalan Namangan uchun yaratilgan reklama faqat Namangan viloyatidagi foydalanuvchilarga ko'rinadi; hudud belgilanmasa — hammaga
- Admin hali reklama qo'shmagan bo'lsa, ilova o'zining standart (built-in) bannerlarini ko'rsatadi — karusel hech qachon bo'sh ko'rinmaydi

## 10a. Telegram bot

Bot bir vaqtning o'zida bir necha vazifani bajaradi:

- **Tasdiqlash kodlari** — ro'yxatdan o'tish va parolni tiklash kodlari shu botga keladi. Foydalanuvchi avval "📲 Telefon raqamni ulash" tugmasi bilan raqamini ulashadi; raqam Telegram tomonidan tasdiqlanadi, shuning uchun boshqa odamning raqamini ulab bo'lmaydi
- **Fikr-mulohaza** — "💬 Fikr-mulohaza / Muammo" orqali yozilgan xabar admin panelga tushadi, admin bot orqali javob qaytaradi
- **Botdan buyurtma joylashtirish** — ish beruvchi bot ichidagi qadamli usta (wizard) orqali buyurtma joylashtira oladi, rasm ham yuborishi mumkin
- **Ilova haqida / Bog'lanish / Ilovani yuklab olish** — matnlar va kontaktlar admin panelda tahrirlanadi
- **Ommaviy xabar** — admin rol va hudud bo'yicha bot orqali xabar tarqatishi mumkin

Bot tokeni admin panelda kiritiladi, bazada **shifrlangan** holda saqlanadi va API javoblarida hech qachon qaytarilmaydi. Webhook har safar ilova ishga tushganda qayta ro'yxatdan o'tadi.

## 11. Web admin panel (`<APP_BASE_URL>/admin`)

Telefon brauzeridan ham qulay (responsive, pastki navigatsiya kichik ekranlarda avtomatik faollashadi):
- **Statistika** — asosiy ko'rsatkichlar + **hamyon funksiyasini yoqish/o'chirish** (darhol kuchga kiradi, yangi APK shart emas)
- **Foydalanuvchilar** — ro'yxat, rol bo'yicha filtr, bloklash/faollashtirish, (hamyon yoqilgan bo'lsa) balansni ko'rish/tuzatish
- **Buyurtmalar** — ro'yxat, status filtri, bloklash/o'chirish
- **Kasblar** — to'liq CRUD
- **Reklama** — banner CRUD, rasm yuklash, auditoriya/hudud/tartib sozlamalari, ko'rsatish jadvali va statistika
- **Sozlamalar** — hamyon va to'lovlarni yoqish/o'chirish, to'lov summalari, standart mavzu va rang, qo'llab-quvvatlash kontaktlari, "Ilova haqida" matni, Telegram bot tokeni
- **Telegram** — foydalanuvchilardan kelgan fikr-mulohazalar, javob yozish va "hal qilindi" belgisi
- **Landing** — landing sahifa matnlari va bo'limlarini tahrirlash, tartibini o'zgartirish
- **Bildirishnoma** — rol va hudud bo'yicha push va Telegram orqali ommaviy xabar

## 12. Xavfsizlik

- JWT stateless auth, rol bo'yicha `@PreAuthorize`, endpoint darajasida ham himoya
- Har bir modify-endpoint egalikni tekshiradi (masalan ish beruvchi faqat o'z buyurtmasini o'zgartira oladi)
- To'g'ri 401/403 status kodlari + tushunarli JSON xabar
- Fayl yuklashda **faylning haqiqiy baytlari** tekshiriladi (JPEG/PNG/WEBP imzosi), mijoz yuborgan `Content-Type`ga ishonilmaydi; hajm cheklovi 5 MB
- Autentifikatsiya va kod tekshirish endpointlariga IP bo'yicha rate-limit
- Kontakt ma'lumotlari ommaviy javoblarda berilmaydi (yuqoridagi 5-bo'limga qarang)
- Telegram bot tokeni bazada shifrlangan, webhook siri tasodifiy va URL'da emas, sarlavhada uzatiladi
- Eskirgan OTP kodlari va refresh tokenlar avtomatik tozalanadi

## 13. Ilovani yangilash (versiyalash)

- Release APK doimiy (persistent) keystore bilan imzolanadi — yangi versiya eski ilova ustidan o'rnatiladi, o'chirish shart emas
- Yuklab olish havolasi: `<APP_BASE_URL>/uploads/apk/ishchi.apk` (har doim bir xil, backend qayta ishga tushirilganda ham saqlanadi)

---

## 14. Kelajakda qo'shilishi mumkin bo'lgan funksiyalar (hozircha YO'Q)

- Chat / ichki xabar almashish
- Reyting va sharh tizimi
- Real SMS provider (hozir kodlar Telegram orqali yuboriladi; bot sozlanmagan bo'lsa mock `1234`)
- Hamyon orqali haqiqiy to'lov/pul o'tkazish. Hozir to'lov shlyuzi mock: haqiqiy provider ulanganda uzilib qolgan to'lovni qayta tiklash uchun "kutilayotgan to'lov" yozuvi kerak bo'ladi
- Ishchi kontaktini ochish uchun ham to'lov/rozilik bosqichi (hozir buyurtma kontakti pullik, ishchi kontakti esa ish beruvchiga bittalab ochiq)
- Backendni bir nechta nusxada ishlatish. Buning uchun rate-limit va scheduler qulflarini Redis kabi umumiy saqlovga o'tkazish kerak (hozir rate-limit xotirada, scheduler Postgres advisory lock'dan foydalanadi)

---

*Hujjat yangilangan sana: 2026-09-27 — kodning joriy holatiga moslashtirildi.*
