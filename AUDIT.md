# Ishchi — xavfsizlik va kod auditi

Sana: 2026-09-27 · Branch: `claude/ishchi-loyihasini-toliq-fjmd87` · Commit: `b67dc6d`

> Bu hujjat faqat **aniqlangan muammolar ro'yxati**. Hech qanday kod o'zgartirilmagan.
> Tartib: og'irlik darajasi bo'yicha.

---

## 🔴 KRITIK

### K-1. Telefon raqam egaligi hech qachon tekshirilmaydi → istalgan raqamga akkaunt ochish va akkaunt egallash

**Fayllar:** `telegram/TelegramService.java:181` (`/start <token>` tarmog'i), `:274` (`linkUser`),
`auth/AuthService.java:191-207` (`dispatchOtp`)

**Sabab.** `dispatchOtp` Telegram ulanmagan foydalanuvchi uchun `telegramLinkToken` yaratadi va
uni **autentifikatsiyasiz API javobida** (`OtpDispatchResponse.linkUrl`) chaqiruvchining o'ziga
qaytaradi. Bot `/start <token>` qabul qilganda `linkUser(user, chatId)` chaqiriladi va u
`telegramChatId`ni **Telegram akkauntining haqiqiy raqamini `user.getPhone()` bilan
solishtirmasdan** bog'laydi. Ya'ni token "bu raqamning egasiman" emas, balki "bu tokenni
ushlab turaman" degan ma'noni bildiradi — tokenni esa hujumchining o'zi olgan.

**Hujum 1 — istalgan raqamga akkaunt ochish:**
1. Boshqa odamning raqami bilan `POST /api/auth/register`
2. Javobdagi `linkUrl`ni **o'z** Telegramida ochish
3. Kod hujumchining Telegramiga keladi → `verify-otp` → akkaunt tasdiqlangan

**Hujum 2 — mavjud foydalanuvchini to'liq egallash** (Telegramini hali ulamagan har bir
foydalanuvchi zaif):
1. `POST /api/auth/forgot-password` — jabrlanuvchining raqami bilan
2. Javobdagi `linkUrl`ni o'z Telegramida ochish → `linkUser` hujumchining chat'ini
   jabrlanuvchi akkauntiga bog'laydi
3. RESET_PASSWORD kodi hujumchiga keladi → `POST /api/auth/reset-password`
4. Akkaunt egallandi; haqiqiy egasi tizimga kira olmaydi

**Muhim:** to'g'ri yechim kodda allaqachon mavjud — `handleContact` (`:256`) Telegram
tasdiqlagan raqamni `normalizePhone` + `findByPhone` bilan solishtiradi va uni aldash mumkin
emas. Metod javadoc'idagi "spoof qilib bo'lmaydi" izohi **faqat contact yo'liga** taalluqli,
ro'yxatdan o'tish esa `/start <token>` yo'lidan boradi.

**Qo'shimcha:** `linkUser` eski egasining bog'lanishini uzib tashlaydi
(`existing.setTelegramChatId(null)`) — ya'ni hujum jabrlanuvchini botdan ham uzadi.
`telegramLinkToken` muddati ham cheklanmagan.

---

### K-2. Barcha ishchilarning telefon raqami va GPS koordinatalari ochiq

**Fayllar:** `worker/WorkerController.java:18`, `worker/dto/WorkerResponse.java:45`

`GET /api/workers` hech qanday rol cheklovisiz (`@PreAuthorize` yo'q) **telefon raqam + aniq
latitude/longitude** qaytaradi. `spring.data.web.pageable.max-page-size` sozlanmagan →
`?size=2000` ishlaydi. Bitta bepul akkaunt bilan butun ishchilar bazasini (ism, telefon, GPS)
yuklab olish mumkin. `GET /api/workers/map` bir so'rovda 500 yozuv beradi.

### K-3. Pullik paywall butunlay chetlab o'tiladi

**Fayllar:** `employer/EmployerMapController.java:25`, `employer/dto/EmployerMapResponse.java`

`job_view_fee` tizimi ish beruvchi telefonini yashiradi (`JobService.mapWithUnlockState`),
**lekin** `GET /api/employers/map` xuddi shu telefonlarni 500 tagacha, tekinga, tekshiruvsiz
beradi. Pulli funksiya amalda ishlamaydi.

### K-4. OTP kodini brute-force qilish mumkin

**Fayl:** `auth/AuthService.java:240`

Kod 4 xonali (9000 variant), TTL 10 daqiqa, **urinishlar soni cheklanmagan**, rate-limit yo'q.
`reset-password`ni takroran chaqirib istalgan foydalanuvchining parolini almashtirish mumkin.
`login` ham brute-force'ga ochiq.

### K-5. CORS sozlamasi butunlay e'tiborsiz

**Fayl:** `security/SecurityConfig.java:85`

`setAllowedOriginPatterns(List.of("*"))` qattiq yozilgan. `application.yml:39`dagi
`app.cors.allowed-origins` va `.env`dagi `CORS_ALLOWED_ORIGINS` **hech qayerda o'qilmaydi** —
o'lik konfiguratsiya, yolg'on xavfsizlik hissi.

---

## 🟠 YUQORI

**Y-1.** `banner/PromoBannerController.java:23,28` — `POST /{id}/view` va `/click` `permitAll`,
autentifikatsiya va rate-limit yo'q. V21 banner statistikasi soxtalashtiriladi.

**Y-2.** `wallet/WalletService.java:63` — `topUp()` avval tashqi gateway'ni chaqiradi, keyin
bazani yangilaydi. DB rollback bo'lsa **pul yechiladi, balans to'lmaydi**. Idempotency kaliti
yo'q. Hozir mock gateway, real gateway ulansa pul yo'qoladi.

**Y-3.** `common/FileStorageService.java:53` — fayl turi faqat mijoz yuborgan `Content-Type`ga
qarab tekshiriladi, magic-byte tekshiruvi yo'q. Istalgan baytni yuklab `/uploads/**`
(`permitAll`) orqali o'z domenidan tarqatish mumkin. `storeJobImageFromBytes` tekshiruvni
umuman o'tkazib yuboradi. Admin tokeni `localStorage`da (`admin-web/src/api/client.js:1-5`)
bo'lgani bilan birga zanjir xavfli.

**Y-4.** `job/JobSortSpecifications.java:32` — `query.orderBy()` Specification ichida,
`if (query.getResultType() != Long.class)` himoyasi yo'q. Spring Data bu Specification'ni
**count so'rovga ham** qo'llaydi → `ORDER BY` count'da → Hibernate xatosi yoki noto'g'ri SQL.
`sort=nearest` bilan sahifalashni sinash shart.

**Y-5.** Rate limiting umuman yo'q: `register`, `resend-otp`, `forgot-password` cheksiz
chaqiriladi → Telegram flood, baza to'ldirish.

**Y-6.** Foydalanuvchi enumeratsiyasi: `auth/AuthController.java:35`
(`/telegram-link-status?phone=`, ochiq endpoint), `forgot-password`, `resend-otp` — mavjud
raqamga 200, mavjud bo'lmaganiga 404.

---

## 🟡 O'RTA

**O-1.** `docker-compose.yml:44` — `./backend/secrets/firebase-service-account.json`
bind-mount qilinadi, ammo bu papka `.gitignore`da. Toza klonda `docker compose up` ishlamaydi
(Docker fayl o'rniga papka yaratadi).

**O-2.** `APP_BASE_URL` va `UPLOAD_DIR` `docker-compose.yml`da ham, `.env.example`da ham yo'q →
`application.yml:25`dagi qattiq yozilgan `https://api.uzbishchi.uz` ishlatiladi. Telegram
webhook va link URL shu qiymatdan quriladi → boshqa domenda deploy qilinsa bot buziladi.

**O-3.** `settings/AppSettingsService.java:92` — webhook siri `SHA-256(bot_token)[0:32]`
sifatida **tokendan keltirib chiqariladi** va URL yo'lida uzatiladi → access-log'larga tushadi.
Telegram'ning `X-Telegram-Bot-Api-Secret-Token` sarlavhasi tekshirilmaydi.

**O-4.** `V11__telegram_otp.sql:6` — bot tokeni `app_settings.telegram_bot_token`da **ochiq
matnda**. Baza zaxirasi sizsa bot to'liq egallanadi.

**O-5.** Orfan fayllar: `profile/ProfileService.java:117` — avatar almashtirilganda eski fayl
diskdan o'chirilmaydi. `JobService.removeImage`/`delete`da ham. Disk cheksiz o'sadi.

**O-6.** `ProfileService` — `professionRepository.findAllById(...)` mavjud bo'lmagan ID'larni
jimgina tashlab yuboradi (boshqa joyda 400 qaytariladi), `isActive` tekshirilmaydi, soni
cheklanmagan.

**O-7.** Bloklangan buyurtmani egasi baribir tahrirlay oladi — `JobService.getOwnedJob`
`isBlocked()`ni tekshirmaydi, `update`/`changeStatus` ham.

**O-8.** N+1 so'rovlar: `WorkerResponse.from()` har qator uchun `user`, `region`, `district`,
`professions` lazy yuklaydi (20 qator ≈ 80 so'rov); `WalletService.resolveFullName` har
tranzaksiya qatori uchun alohida so'rov; `JobExpiryScheduler.remindExpiringSoon` har buyurtma
uchun alohida token so'rovi.

**O-9.** `mobile/lib/core/api_client.dart:14` — `_refreshDio`da timeout yo'q. Refresh osilib
qolsa `_refreshInFlight` ortidagi barcha so'rovlar cheksiz kutadi.

**O-10.** `api_client.dart:50` — 401 dan keyin `_dio.fetch(options)` bilan qayta urinish:
`FormData` oqimi allaqachon iste'mol qilingan → token muddati tugagan paytda rasm/avatar
yuklash ishlamaydi.

**O-11.** Joriy parolni so'ramasdan parol almashtirish — `change_password_screen.dart` ochiq
`reset-password` oqimidan foydalanadi; backendda "eski parolni tasdiqlang" endpointi yo'q.

**O-12.** Yetishmayotgan indekslar: `jobs(created_at)` (har qidiruvdagi default saralash),
`jobs(expires_at)` (scheduler), `employer_profiles(region_id)` (`/employers/map`).
`job_unlocks.unlocked_at` — `timestamp`, qolgan jadvallarda `timestamptz` (nomuvofiqlik).

**O-13.** `@Scheduled` metodlarida distributed lock yo'q — backend 2 nusxaga ko'paytirilsa
push-bildirishnomalar ikki marta yuboriladi.

---

## ⚪ TEXNIK QARZ

**T-1.** **Test yo'q** — backendda 0 ta, mobil'da faqat default `widget_test.dart`.
~21 000 satr kod qoplamasiz.

**T-2.** **CI yo'q** — `.github/` papkasi mavjud emas.

**T-3.** Frontend build natijalari repoga commit qilingan va eskilari qolib ketgan:
`static/assets/index-BTa8OkTM.js` va `index-DWMw8GlC.css` hech qayerdan chaqirilmaydi
(`index.html` faqat `index-Dc7YSvhN.js` + `index-Dg8HBMJI.css`ga murojaat qiladi) — JAR ichida
keraksiz yuk, manba va build osongina ajralib ketadi.

**T-4.** `branding/` ~22 MB, ~100 ta `debug_*.png`. Ildizda `rasm.png`, `lagativ.jpg`,
`logotive1.jpg` dublikatlari.

**T-5.** `auth/AuthService.java:54` — `OTP_TTL_MINUTES = 10` qattiq yozilgan,
`application.yml:32`dagi `app.otp.ttl-minutes` o'qilmaydi (K-5 bilan bir xil muammo).

**T-6.** `otp_codes` va `refresh_tokens` jadvallarini tozalash mexanizmi yo'q — cheksiz o'sadi.

**T-7.** `TZ.md` eskirgan: "hozircha YO'Q" deb yozilgan push-bildirishnoma va ko'p tillilik
allaqachon bor; Telegram bot moduli (webhook, ish e'loni wizard'i, feedback) umuman
hujjatlashtirilmagan; domen `ishchi-api.ecos.uz` deb ko'rsatilgan, kodda `api.uzbishchi.uz`.
