# Ishchi — SIP / Asterisk Telephony & Call-Center Integratsiyasi

Ushbu qo'llanma Asterisk PBX serveringiz boshqa serverda (VPS/Cloud) bo'lganda ham, **"Ishchi"** backend'i va operator admin paneli bilan qanday bog'lanishini to'liq ko'rsatadi.

---

## 1. Integratsiya Sxemasi

1. **Mijoz qisqa raqamga qo'ng'iroq qiladi** (masalan `1055`).
2. Asterisk Dialplan ishga tushadi:
   - Backend API'ga kiruvchi qo'ng'iroq haqida Webhook yuboradi: `POST /api/telephony/webhook/call-incoming`.
3. Backend real-vaqtda (Server-Sent Events) orqali barcha faol **Operatorlar brauzeriga** bildirishnoma chiqaradi.
4. Operator kompyuterida mijozning raqami va ma'lumotlari avtomatik ochiladi ("Screen Pop").
5. Operator murojaatni yozib oladi, kerakli toifadagi usta/mutaxassisni tanlaydi va **"Saqlash va Usta yo'naltirish"** tugmasini bosadi.
6. Tizim tanlangan mutaxassisga darhol **Push bildirishnoma** yuboradi.
7. Qo'ng'iroq yakunlangach, Asterisk backend'ga qo'ng'iroq davomiyligi va audio yozuvini yuboradi.

---

## 2. Backend Webhook Endpointlari

| Endpoint | Method | Vazifasi | Kerakli Header |
|---|---|---|---|
| `/api/telephony/webhook/call-incoming` | POST | Yangi qo'ng'iroq boshlanganda | `X-Telephony-Secret-Token: <SECRET>` |
| `/api/telephony/webhook/call-answered` | POST | Operator go'shakni ko'targanda | `X-Telephony-Secret-Token: <SECRET>` |
| `/api/telephony/webhook/call-end` | POST | Qo'ng'iroq tugaganda | `X-Telephony-Secret-Token: <SECRET>` |
| `/api/operator/stream` | GET | Operator brauzeriga jonli SSE oqimi | `Authorization: Bearer <TOKEN>` |

*Maxfiy token backend `.env` faylida `TELEPHONY_WEBHOOK_SECRET` orqali sozlanadi.*

---

## 3. Asterisk Dialplan Konfiguratsiyasi (`extensions.conf`)

Asterisk serveringizdagi `/etc/asterisk/extensions.conf` fayliga quyidagi dialplanni qo'shing:

```ini
[general]
static=yes
writeprotect=no

[globals]
BACKEND_URL=https://api.uzbishchi.uz/api/telephony/webhook
WEBHOOK_SECRET=telephony-secret-change-in-prod

; Qisqa raqamga kelgan qo'ng'iroqlar konteksti
[from-trunk-shortnumber]
exten => 1055,1,NoOp(--- Yangi kiruvchi qo'ng'iroq: ${CALLERID(num)} ---)
 same => n,Set(CALL_ID=${UNIQUEID})
 same => n,Set(CALLER_NUM=${CALLERID(num)})

 ; 1. Audio yozib olishni boshlash (MixMonitor)
 same => n,Set(RECORDING_FILE=/var/spool/asterisk/monitor/ishchi-${CALL_ID}.wav)
 same => n,MixMonitor(${RECORDING_FILE},b)

 ; 2. Ishchi Backendiga Webhook yuborish (CURL orqali)
 same => n,Set(CURL_RESULT=${CURL(${BACKEND_URL}/call-incoming,{"callId":"${CALL_ID}","callerPhone":"${CALLER_NUM}","destinationNumber":"1055"},X-Telephony-Secret-Token: ${WEBHOOK_SECRET}&Content-Type: application/json)})

 ; 3. Qo'ng'iroqni operatorlar guruhiga yo'naltiramiz (masalan SIP 101, 102 yoki Queue)
 same => n,Dial(SIP/101&SIP/102,45,tTkK)

 ; 4. Agar javob berilmasa yoki band bo'lsa
 same => n,Goto(s-${DIALSTATUS},1)

; Qo'ng'iroq yakunlanganda (Hangup handler)
exten => h,1,NoOp(--- Qo'ng'iroq yakunlandi: ${CALL_ID} ---)
 same => n,Set(RECORD_URL=https://asterisk.uzbishchi.uz/recordings/ishchi-${CALL_ID}.wav)
 same => n,Set(CURL_END=${CURL(${BACKEND_URL}/call-end,{"callId":"${CALL_ID}","status":"${DIALSTATUS}","durationSeconds":${CDR(duration)},"recordingUrl":"${RECORD_URL}"},X-Telephony-Secret-Token: ${WEBHOOK_SECRET}&Content-Type: application/json)})
```

---

## 4. Operator Paneli Imkoniyatlari

Admin panelda (`https://api.uzbishchi.uz/admin#/call-center`) quyidagilar mavjud:

1. **Jonli Status (Online):**
   - Server-Sent Events orqali doimiy ulanish.
   - Kiruvchi qo'ng'iroq tushganda ekran tepasida animatsiyali banner chiqadi va mijozning telefon raqami avtomatik yoziladi.
2. **Mijozni Avtomatik Aniqlash (Lookup):**
   - Agar qo'ng'iroq qilgan raqam avval platformada ro'yxatdan o'tgan bo'lsa, uning ismi va yashash manzili formaga avtomatik joylanadi.
3. **Smart Mutaxassis Tanlash (Dispatch):**
   - Tanlangan viloyat, tuman va soha bo'yicha ayni paytda **bo'sh turgan faol mutaxassislar** ro'yxati chiqadi.
   - Operator tanlagan ustaga ariza biriktiriladi va ustaga mobil ilovada push-xabar jo'natiladi.
4. **Qo'ng'iroqlar Tarixi:**
   - Barcha o'tgan, o'tkazib yuborilgan va tugatilgan qo'ng'iroqlar.
   - Mavjud audio yozuvlarni to'g'ridan-to'g'ri brauzerda tinglash pleyeri.
