# Branding manbalari

Bu papkada ilova ikonkasi va logotipning **manba** fayllari saqlanadi. Ular build
jarayonida ishlatilmaydi — ishlatiladigan nusxalar quyidagi joylarda:

| Ishlatiladigan joy | Fayl |
|---|---|
| Mobil ilova ikonkasi | `mobile/assets/icon/icon.png`, `icon_foreground.png` (`flutter_launcher_icons` orqali) |
| Landing sahifa logotipi | `/uploads/branding/logo-icon.png`, `logo-wordmark.png` — **uploads volume'idan** xizmat qiladi, repodan emas |

> **Deploy eslatmasi:** landing sahifadagi logotiplar uploads volume'ida bo'lishi kerak
> (`ishchi_uploads` ichida `branding/logo-icon.png` va `branding/logo-wordmark.png`).
> Yangi muhitda volume bo'sh bo'lsa, logotiplar 404 qaytaradi.

## Nima saqlanadi, nima saqlanmaydi

Saqlanadi: SVG manbalar, tayyor ikonkalar (`app_icon_*`, `final_icon_*`), qirqilgan
logotip variantlari.

Saqlanmaydi: ikonka ustida ishlash paytida hosil bo'lgan oraliq va tekshiruv rasmlari
(`debug_*`, `zoom_*`, `ff_*`, `overlay_*` va shu kabilar). Ular `.gitignore`da —
avval ~100 ta shunday fayl (~10 MB) repoga tushib qolgan edi.
