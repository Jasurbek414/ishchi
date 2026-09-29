# Branding manbalari

Loyihada **bitta** logotip ishlatiladi — "Uzb Ishchi" (kaska, qo'l siqish, xarita belgisi).
Boshqa logotip variantlari o'chirilgan; yangi joyga logotip kerak bo'lsa, shu fayllardan olinadi.

| Fayl | Nima |
|---|---|
| `uzb-ishchi-logo.png` | Asl nusxa, 4096×4096, oq fon |
| `uzb-ishchi-logo-shaffof.png` | Asl nusxa, 4096×4096, shaffof fon |

Asl 1024 px fayl xira edi; bu nusxalar uni Real-ESRGAN (`realesrgan-x4plus-anime`) bilan 4 barobar
kattalashtirib olingan — shakl va ranglar o'zgartirilmagan.

## Ishlatiladigan nusxalar

Hammasi yuqoridagi ikki fayldan kichraytirib olingan. Logotip almashsa, shularni qayta chiqarish kerak.

| Joy | Fayl |
|---|---|
| Mobil ilova ikonkasi | `mobile/assets/icon/icon.png`, `icon_foreground.png` va ulardan chiqqan Android `mipmap-*`/`drawable-*`, iOS `AppIcon.appiconset` |
| Mobil ilova ichida (ochilish ekrani, "Ilova haqida") | `mobile/assets/icon/logo.png` (`AppAssets.logo`) |
| Landing sahifa | `landing-web/public/assets/brand/` — `logo.png`, `logo-1024.png` (og:image), `favicon.png`, `apple-touch-icon.png` |
| Admin panel | `admin-web/public/logo.png`, `favicon.png` |

Landing logotiplari endi build bilan birga keladi (`/assets/brand/...`), uploads volume'iga bog'liq emas.

Ikonka ustida ishlash paytidagi oraliq rasmlar (`debug_*`, `zoom_*`, `ff_*`, `overlay_*` va shu kabilar)
repoga qo'shilmaydi — ular `.gitignore`da.
