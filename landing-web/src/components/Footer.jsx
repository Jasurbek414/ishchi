export default function Footer({ settings, botUrl }) {
  return (
    <footer className="bg-navy-900 pt-16 pb-8 text-navy-100/60">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid grid-cols-1 gap-10 border-b border-white/10 pb-10 sm:grid-cols-[1.3fr_1fr_1fr]">
          <div>
            <div className="mb-3 flex items-center gap-2.5">
              <img src="/assets/brand/logo.png" alt="Ishchi" className="h-9 w-9 rounded-lg bg-white object-contain p-0.5" />
              <span className="font-display text-lg font-extrabold text-white">ISHCHI</span>
            </div>
            <p className="max-w-xs text-sm">
              O'zbekiston bo'ylab ish beruvchi va ishchini bevosita bog'laydigan mobil platforma.
            </p>
          </div>

          <div>
            <h5 className="mb-4 font-mono text-xs font-bold uppercase tracking-wide text-brand-300">Ilova</h5>
            <a href="/uploads/apk/ishchi.apk" className="mb-2.5 block w-fit text-sm transition-colors hover:text-white">
              Android uchun yuklab olish
            </a>
            <a href={botUrl} className="block w-fit text-sm transition-colors hover:text-white">
              Telegram bot
            </a>
          </div>

          <div>
            <h5 className="mb-4 font-mono text-xs font-bold uppercase tracking-wide text-brand-300">Aloqa</h5>
            {settings?.supportPhone && (
              <a href={`tel:${settings.supportPhone}`} className="mb-2.5 block w-fit text-sm transition-colors hover:text-white">
                {settings.supportPhone}
              </a>
            )}
            {settings?.supportTelegram && (
              <a
                href={`https://t.me/${settings.supportTelegram}`}
                className="mb-2.5 block w-fit text-sm transition-colors hover:text-white"
              >
                @{settings.supportTelegram}
              </a>
            )}
            {settings?.supportEmail && (
              <a href={`mailto:${settings.supportEmail}`} className="block w-fit text-sm transition-colors hover:text-white">
                {settings.supportEmail}
              </a>
            )}
          </div>
        </div>

        <div className="pt-6 text-sm">© {new Date().getFullYear()} Ishchi. Barcha huquqlar himoyalangan.</div>
      </div>
    </footer>
  );
}
