import { Mail, Phone, Send } from 'lucide-react';
import { APK_URL, PRIVACY_URL } from '../lib/links.js';

export default function Footer({ settings, botUrl }) {
  const linkCls = 'mb-2.5 flex w-fit items-center gap-2 text-sm transition-colors hover:text-white';
  return (
    <footer className="bg-navy-950 pt-16 pb-8 text-navy-100/60">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid grid-cols-1 gap-10 border-b border-white/10 pb-10 sm:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <div className="mb-3 flex items-center gap-2.5">
              <img src="/assets/brand/logo.png" alt="" className="h-10 w-10 rounded-xl bg-white object-contain p-0.5" />
              <span className="font-display text-lg font-extrabold text-white">Ishchi</span>
            </div>
            <p className="max-w-xs text-sm leading-relaxed">
              O'zbekiston bo'ylab ishchi va ish beruvchini vositachisiz bog'laydigan ilova.
            </p>
          </div>

          <div>
            <h5 className="mb-4 text-xs font-bold uppercase tracking-wide text-brand-300">Ilova</h5>
            <a href={APK_URL} className={linkCls}>Android uchun yuklab olish</a>
            <a href={botUrl} className={linkCls}>Telegram bot</a>
            <a href={PRIVACY_URL} className={linkCls}>Maxfiylik siyosati</a>
          </div>

          <div>
            <h5 className="mb-4 text-xs font-bold uppercase tracking-wide text-brand-300">Aloqa</h5>
            {settings?.supportPhone && (
              <a href={`tel:${settings.supportPhone}`} className={linkCls}>
                <Phone size={15} /> {settings.supportPhone}
              </a>
            )}
            {settings?.supportTelegram && (
              <a href={`https://t.me/${settings.supportTelegram}`} className={linkCls}>
                <Send size={15} /> @{settings.supportTelegram}
              </a>
            )}
            {settings?.supportEmail && (
              <a href={`mailto:${settings.supportEmail}`} className={linkCls}>
                <Mail size={15} /> {settings.supportEmail}
              </a>
            )}
          </div>
        </div>

        <div className="pt-6 text-sm">© {new Date().getFullYear()} Ishchi. Barcha huquqlar himoyalangan.</div>
      </div>
    </footer>
  );
}
