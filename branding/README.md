# Branding manbalari

Loyihada **bitta** logotip va **bitta** logotip fayli bor — "Uzb Ishchi" (kaska, qo'l siqish,
xarita belgisi). Boshqa logotip variantlari o'chirilgan.

| Fayl | Nima |
|---|---|
| `uzb-ishchi-logo.png` | Asl nusxa, 4096×4096, oq fon |

Asl 1024 px fayl xira edi; bu nusxa uni Real-ESRGAN (`realesrgan-x4plus-anime`) bilan 4 barobar
kattalashtirib olingan — shakl va ranglar o'zgartirilmagan.

## Ishlatiladigan nusxalar

Har bir qism (ilova, sayt, admin) o'z build'i bilan birga keladigan bitta nusxani ishlatadi —
hammasi yuqoridagi fayldan kichraytirilgan. Logotip almashsa, shularni qayta chiqarish kerak.

| Joy | Fayl |
|---|---|
| Mobil ilova (ikonka ham, ilova ichi ham) | `mobile/assets/icon/logo.png` (1024 px). Android `mipmap-*`/`drawable-*` va iOS `AppIcon.appiconset` ikonkalari shundan chiqariladi (`flutter_launcher_icons`) |
| Landing sahifa (menyu, favicon, og:image) | `landing-web/public/assets/brand/logo.png` (512 px) |
| Admin panel (favicon, kirish, yuqori panel) | `admin-web/public/logo.png` (256 px) |

## Rang

Brend rangi — osmon ko'k `#0284C7` (`design-tokens.json`). Logotipning o'z ranglari (to'q ko'k va
to'q sariq) o'zgarmaydi; ilova, sayt va admin panel interfeysi shu brend rangida.

Ikonka ustida ishlash paytidagi oraliq rasmlar (`debug_*`, `zoom_*`, `ff_*`, `overlay_*` va shu kabilar)
repoga qo'shilmaydi — ular `.gitignore`da.
