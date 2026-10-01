# Ishchi — xavfsizlik va kod auditi

Audit: 2026-09-27 · Tuzatildi: 2026-09-27 · Branch: `claude/ishchi-loyihasini-toliq-fjmd87`

Jami **32 topilma** (31 audit + bittasi tuzatish jarayonida topildi). Holati: **32/32 tuzatildi.**

Tekshiruv: backend `mvn verify` — 41 test o'tadi. Flutter bu muhitda o'rnatilmagan, shuning uchun
Dart o'zgarishlari kompilyator bilan tekshirilmagan — ularni CI (`flutter analyze` + `flutter test`)
tasdiqlaydi.

---

## 🔴 KRITIK

### K-1. Telefon raqam egaligi tekshirilmaydi → istalgan raqamga akkaunt ochish va akkaunt egallash

**Muammo.** `dispatchOtp` Telegram ulanmagan foydalanuvchi uchun `telegramLinkToken` yaratib, uni
**autentifikatsiyasiz API javobida** chaqiruvchining o'ziga qaytaradi. Bot `/start <token>` qabul
qilganda `linkUser` `telegramChatId`ni Telegram akkauntining haqiqiy raqamini `user.getPhone()`
bilan solishtirmasdan bog'laydi.

Natijada: (1) boshqa odamning raqami bilan ro'yxatdan o'tib, kodni o'z Telegramiga olish;
(2) `forgot-password` orqali Telegramini hali ulamagan **istalgan mavjud foydalanuvchini to'liq
egallash** — haqiqiy egasi tizimdan chiqib qoladi.

**Tuzatildi.** `/start <token>` endi hech narsani bog'lamaydi — raqam so'raydi. Bog'lash faqat
Telegram tasdiqlagan kontakt orqali amalga oshadi (`handleContact`). Bu mantiq kodda allaqachon
mavjud edi; `/start` yo'li uni chetlab o'tardi.
`TelegramService.java`, `TelegramWebhookController.java`

### K-1b. Kontakt kartasini forward qilish orqali xuddi shu egallash *(tuzatish jarayonida topildi)*

**Muammo.** `handleContact` `contact.user_id`ni tekshirmasdi. Telegram'da manzillar kitobidan
**boshqa odamning kontakt kartasini** yuborish mumkin — u holda `contact.phone_number` jabrlanuvchining
raqami bo'ladi va hujumchining chat'i o'sha akkauntga bog'lanadi. Ya'ni K-1ni tuzatish teshikni
shunchaki ikkinchi yo'lga ko'chirardi.

**Tuzatildi.** `contact.user_id` yuboruvchining `from.id`siga teng bo'lishi talab qilinadi — bu
`request_contact` tugmasi beradigan yagona holat. DTO'ga `from` maydoni qo'shildi.
`TelegramService.java`, `dto/TelegramUpdate.java`

### K-2. Barcha ishchilarning telefon raqami va GPS koordinatalari ochiq

**Muammo.** `GET /api/workers` rol cheklovisiz, sahifa o'lchami cheklanmagan holda har qator uchun
telefon + aniq koordinata qaytarardi. Bitta bepul akkaunt butun ishchilar bazasini yuklab olishi mumkin.

**Tuzatildi.** Kontakt ma'lumotlari ommaviy javoblardan olib tashlandi (telefon **bo'sh satr** —
`null` emas, chunki chiqarilgan ilova uni null-chidamsiz `String` deb o'qiydi va crash beradi);
koordinatalar faqat xarita javobida qoldi; `@PreAuthorize("hasRole('EMPLOYER')")`; sahifa o'lchami
50 ta bilan cheklandi; `/api/workers`ga rate-limit.
`WorkerResponse.java`, `WorkerController.java`, `application.yml`, `RateLimitFilter.java`

### K-3. Pullik paywall butunlay chetlab o'tiladi

**Muammo.** `job_view_fee` ish beruvchi telefonini yashiradi, lekin `GET /api/employers/map` xuddi
shu telefonlarni 500 tagacha tekinga berardi.

**Tuzatildi.** Telefon xarita javobidan olib tashlandi, endpoint faqat `WORKER` roliga.
`EmployerMapResponse.java`, `EmployerMapController.java`

### K-4. OTP kodini brute-force qilish

**Muammo.** 4 xonali kod (9000 variant), urinishlar cheklanmagan, rate-limit yo'q.

**Tuzatildi.** 5 urinishdan keyin kod kuyadi. Hisoblagich **alohida tranzaksiyada** saqlanadi —
aks holda rad etish exception'i rollback qilib, cheklov hech qachon ishlamas edi. Qo'shimcha:
IP bo'yicha rate-limit.
`OtpAttemptTracker.java`, `AuthService.java`, `V24__otp_attempts.sql`, `RateLimitFilter.java`

### K-5. CORS sozlamasi e'tiborsiz qoldirilgan

**Muammo.** `setAllowedOriginPatterns(List.of("*"))` qattiq yozilgan; `app.cors.allowed-origins`
va `CORS_ALLOWED_ORIGINS` hech qayerda o'qilmasdi.

**Tuzatildi.** `CorsProperties` yaratildi va ulandi.
`CorsProperties.java`, `SecurityConfig.java`

---

## 🟠 YUQORI

| # | Muammo | Tuzatish |
|---|---|---|
| Y-1 | Banner `view`/`click` autentifikatsiyasiz — statistika soxtalashtiriladi | Faqat `GET` ochiq qoldi; hisoblagichlar autentifikatsiya + rate-limit talab qiladi |
| Y-2 | `topUp` avval gateway'ni chaqirardi → DB rollback bo'lsa pul yo'qoladi | Tekshiruvlar oldinga o'tdi, summa cheklovi, muvaffaqiyatli to'lov yozilmasa reference bilan `ERROR` log |
| Y-3 | Fayl turi mijoz yuborgan `Content-Type`ga qarab aniqlanardi | Haqiqiy baytlar (JPEG/PNG/WEBP imzosi) tekshiriladi; Telegram rasmlari ham shu yo'ldan o'tadi |
| Y-4 | `nearest` saralash `count` so'rovga `ORDER BY` qo'shardi | `getResultType()` himoyasi qo'shildi |
| Y-5 | Rate limiting umuman yo'q | `RateLimitFilter` — login/OTP/parol/banner/ishchi endpointlari uchun |
| Y-6 | Foydalanuvchi enumeratsiyasi (404 vs 200) | Javoblar birxillashtirildi; Telegram sozlangan bo'lsa saqlanmaydigan decoy havola qaytadi |

## 🟡 O'RTA

| # | Muammo | Tuzatish |
|---|---|---|
| O-1 | Firebase fayl bind-mount'i toza klonda `docker compose up`ni buzardi | Katalog mount qilinadi (`backend/secrets` → `/app/secrets`) + `.gitkeep` |
| O-2 | `APP_BASE_URL` compose va `.env.example`da yo'q edi | Majburiy qilindi; healthcheck ham qo'shildi |
| O-3 | Webhook siri tokendan keltirilgan va URL yo'lida (loglarga tushardi) | Tasodifiy sir, `X-Telegram-Bot-Api-Secret-Token` sarlavhasida, doimiy vaqtda solishtiriladi; startup'da qayta ro'yxatdan o'tadi |
| O-4 | Bot tokeni bazada ochiq matnda | AES-GCM shifrlash (kalit `JWT_SECRET`dan); eski qiymat o'qilishda davom etadi |
| O-5 | Avatar/rasm almashtirilganda eski fayl diskda qolardi | Commit'dan keyin o'chiriladi; upload katalogidan tashqariga chiqish rad etiladi |
| O-6 | Mavjud bo'lmagan kasb ID'lari jimgina tashlanardi | 400 qaytaradi (profil va rol almashtirishda) |
| O-7 | Bloklangan buyurtmani egasi tahrirlay olardi | `getOwnedJob` bloklanganini rad etadi (o'chirishga ruxsat qoldi) |
| O-8 | N+1: ishchi/buyurtma ro'yxati, admin tranzaksiyalari, kechalik eslatma | `@EntityGraph` (to-one), `@BatchSize` (kolleksiya), paketli so'rovlar |
| O-9 | `_refreshDio`da timeout yo'q — osilib qolsa butun ilova kutadi | Asosiy mijoz bilan bir xil timeout |
| O-10 | 401'dan keyin `FormData` qayta yuborilmaydi — upload uzilardi | Chaqiruvchi builder beradi, qayta urinish yangi body quradi |
| O-11 | Parolni almashtirish joriy parolni so'ramasdi | `POST /api/profile/change-password` + ekran 4 tilda qayta yozildi |
| O-12 | Yetishmayotgan indekslar, `timestamp` nomuvofiqligi | `V25__performance_indexes.sql` |
| O-13 | Scheduler'larda qulf yo'q — 2 nusxada ikki marta yuborardi | Postgres advisory lock (tranzaksiyaga bog'langan) |

## ⚪ TEXNIK QARZ

| # | Muammo | Tuzatish |
|---|---|---|
| T-1 | Test yo'q (backendda 0 ta) | 41 test — asosan tuzatishlarni qo'riqlaydigan regressiya testlari |
| T-2 | CI yo'q | GitHub Actions: backend test, migratsiyalar real Postgres'da, frontend build, `flutter analyze`/`test` |
| T-3 | Eskirgan build artefaktlari JAR ichida | 2 orfan bundle o'chirildi |
| T-4 | `branding/` ~22 MB, ~100 debug fayl | 71 fayl (~10 MB) o'chirildi, `.gitignore` qoidasi va `branding/README.md` |
| T-5 | `app.otp.ttl-minutes` o'qilmasdi | `OtpProperties` |
| T-6 | `otp_codes` / `refresh_tokens` cheksiz o'sardi | `DataRetentionScheduler` (kunlik tozalash) |
| T-7 | `TZ.md` eskirgan | Kodning joriy holatiga moslashtirildi |

---

## Deploy paytida e'tibor berish kerak

1. **`APP_BASE_URL` endi majburiy** — `.env`ga qo'shilmasa `docker compose up` ishga tushmaydi.
   Bu ataylab: avval u hech qayerda berilmagani uchun Telegram havolalari qattiq yozilgan
   domendan qurilardi.
2. **`backend/secrets/` katalogi** — Firebase fayli shu yerga qo'yiladi (ilgari fayl to'g'ridan-to'g'ri
   mount qilinardi). Fayl bo'lmasa push shunchaki o'chadi.
3. **Telegram webhook o'zi qayta ro'yxatdan o'tadi** — ilova ishga tushganda. Agar bot jim qolsa,
   admin panelda bot tokenini qayta saqlash kifoya.
4. **`JWT_SECRET`ni o'zgartirmang** — bot tokeni shifri shundan keltiriladi. O'zgartirilsa
   admin panelda bot tokenini qayta kiritish kerak bo'ladi.
5. **Landing logotiplari** `uploads` volume'ida bo'lishi kerak
   (`branding/logo-icon.png`, `branding/logo-wordmark.png`) — repoda yo'q. Bu ilgari hech qayerda
   yozilmagan edi, endi `branding/README.md`da.

## Ataylab hal qilinmagan, chunki mahsulot qarori kerak

- **Ishchi kontaktini bittalab yig'ish.** `GET /api/workers/{id}` ish beruvchiga telefon beradi;
  ish beruvchi akkaunt esa bepul. Endi bu faqat bittalab va rate-limit bilan, lekin to'liq yechim —
  buyurtma kontaktidagidek to'lov yoki ishchining roziligi bosqichi. Bu ilovaga ham o'zgarish talab
  qiladi.
- **Haqiqiy to'lov shlyuzi.** Hozir mock. Uzilib qolgan to'lovni tiklash uchun "kutilayotgan to'lov"
  yozuvi kerak — mock ustiga bunday tuzilma qurish ortiqcha bo'lardi, shuning uchun provider
  ulaganda qilinadi. Hozirgi holatda gateway o'tib DB yozilmasa, reference bilan `ERROR` log qoladi.
- **Bir nechta backend nusxasi.** Rate-limit xotirada — bu bitta konteyner uchun to'g'ri va
  ortiqcha qismlarsiz. Nusxa ko'paytirilsa Redis'ga o'tkazish kerak (scheduler qulfi allaqachon
  bazada, u ishlaydi).
