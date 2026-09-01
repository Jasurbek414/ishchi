# Ishchi — Ish topish va kunlik xizmatlar platformasi

## Texnik topshiriq (TZ) — v2, loyihaning haqiqiy holatiga mos yangilangan

> Ushbu hujjat loyihaning boshida yozilgan asl TZ o'rniga, loyiha rivojlanish jarayonida amalda qurilgan va ishlab turgan tizimni aniq tasvirlash uchun qayta yozildi. Barcha bo'limlar quyida sanab o'tilgan funksiyalar **allaqachon ishlab chiqilgan va production'da (`ishchi-api.ecos.uz`) ishlamoqda**, agar "Kelajakda" deb alohida belgilanmagan bo'lsa.

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
| Domen/tunnel | Cloudflare Tunnel — `https://ishchi-api.ecos.uz` |
| Konteynerlashtirish | Docker Compose (db + backend + cloudflared) |

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
- **app_settings** — bitta qatorli jadval, platforma darajasidagi feature-flag'lar (hozircha: `wallet_enabled`)
- **refresh_tokens, otp_codes** — auth uchun

---

## 4. Autentifikatsiya

- Telefon + parol bilan ro'yxatdan o'tish, JWT (access 30 daq. + refresh 30 kun)
- SMS tasdiqlash **hozircha mock** — kod doim `1234` (real SMS provider ulanmagan, kelajakda `OtpService` interfeysi orqali almashtiriladi)
- Parolni unutish — SMS orqali kod + yangi parol
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
- `GET/PATCH /api/admin/users/{id}/active`, `GET/PATCH/DELETE /api/admin/jobs`, `GET /api/admin/wallets/{userId}`, `POST /api/admin/wallets/{userId}/adjust`, `GET /api/admin/stats`

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

## 11. Web admin panel (`https://ishchi-api.ecos.uz/admin`)

Telefon brauzeridan ham qulay (responsive, pastki navigatsiya kichik ekranlarda avtomatik faollashadi):
- **Statistika** — asosiy ko'rsatkichlar + **hamyon funksiyasini yoqish/o'chirish** (darhol kuchga kiradi, yangi APK shart emas)
- **Foydalanuvchilar** — ro'yxat, rol bo'yicha filtr, bloklash/faollashtirish, (hamyon yoqilgan bo'lsa) balansni ko'rish/tuzatish
- **Buyurtmalar** — ro'yxat, status filtri, bloklash/o'chirish
- **Kasblar** — to'liq CRUD
- **Reklama** — banner CRUD, rasm yuklash, auditoriya/hudud/tartib sozlamalari

## 12. Xavfsizlik

- JWT stateless auth, rol bo'yicha `@PreAuthorize`, endpoint darajasida ham himoya
- Har bir modify-endpoint egalikni tekshiradi (masalan ish beruvchi faqat o'z buyurtmasini o'zgartira oladi)
- To'g'ri 401/403 status kodlari + tushunarli JSON xabar
- Fayl yuklashda content-type tekshiruvi (faqat JPEG/PNG/WEBP), hajm cheklovi

## 13. Ilovani yangilash (versiyalash)

- Release APK doimiy (persistent) keystore bilan imzolanadi — yangi versiya eski ilova ustidan o'rnatiladi, o'chirish shart emas
- Yuklab olish havolasi: `https://ishchi-api.ecos.uz/uploads/apk/ishchi.apk` (har doim bir xil, backend qayta ishga tushirilganda ham saqlanadi)

---

## 14. Kelajakda qo'shilishi mumkin bo'lgan funksiyalar (hozircha YO'Q)

- Chat / ichki xabar almashish
- Push-bildirishnoma (yangi mos buyurtma, javob va h.k.)
- Reyting va sharh tizimi
- Real SMS provider (hozir mock, kod doim 1234)
- Hamyon orqali haqiqiy to'lov/pul o'tkazish (hozir faqat admin qo'lda balans tuzatadi, hozircha o'chirilgan)
- Bir nechta til (hozircha faqat o'zbek tili)

---

*Hujjat yangilangan sana: loyihaning joriy holatiga mos ravishda amaliy ishlab chiqish jarayonida tuzildi.*
