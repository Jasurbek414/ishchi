import { useEffect, useState } from 'react';

const LINKS = [
  { href: '#loyiha', label: 'Loyiha haqida' },
  { href: '#ikki-tomon', label: 'Ikki tomon' },
  { href: '#imkoniyatlar', label: 'Imkoniyatlar' },
  { href: '#qanday-ishlaydi', label: 'Qanday ishlaydi' },
  { href: '#qamrov', label: 'Qamrov' },
  { href: '#yol-xaritasi', label: "Yo'l xaritasi" },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/85 backdrop-blur-lg shadow-sm shadow-navy-900/5 border-b border-navy-900/5' : 'bg-white/0'
      }`}
    >
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 sm:px-8">
        <a href="#top" className="flex items-center gap-2.5 group">
          <img
            src="/assets/brand/logo.png"
            alt="Ishchi"
            className="h-10 w-10 object-contain transition-transform duration-300 group-hover:-rotate-6"
          />
          <span className="font-display text-lg font-extrabold tracking-tight text-navy-900">ISHCHI</span>
        </a>

        <nav className="hidden items-center gap-8 text-sm font-semibold text-navy-700/70 lg:flex">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="relative transition-colors hover:text-navy-900">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href="/uploads/apk/ishchi.apk"
            className="hidden rounded-full bg-navy-900 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-navy-900/15 transition-all hover:-translate-y-0.5 hover:bg-brand-500 hover:shadow-brand-500/25 sm:inline-block"
          >
            APK yuklab olish
          </a>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label="Menyu"
            className="grid h-11 w-11 place-items-center rounded-xl border border-navy-900/10 bg-white lg:hidden"
          >
            <div className="relative h-3.5 w-5">
              <span
                className={`absolute left-0 top-0 h-0.5 w-5 rounded-full bg-navy-900 transition-all duration-300 ${open ? 'top-1/2 -translate-y-1/2 rotate-45' : ''}`}
              />
              <span
                className={`absolute left-0 top-1/2 h-0.5 w-5 -translate-y-1/2 rounded-full bg-navy-900 transition-opacity duration-200 ${open ? 'opacity-0' : ''}`}
              />
              <span
                className={`absolute bottom-0 left-0 h-0.5 w-5 rounded-full bg-navy-900 transition-all duration-300 ${open ? 'bottom-1/2 translate-y-1/2 -rotate-45' : ''}`}
              />
            </div>
          </button>
        </div>
      </div>

      <div
        className={`overflow-hidden border-b border-navy-900/5 bg-white transition-[max-height] duration-300 ease-out lg:hidden ${open ? 'max-h-96' : 'max-h-0'}`}
      >
        <nav className="flex flex-col gap-1 px-5 pb-5 pt-2">
          <a
            href="/uploads/apk/ishchi.apk"
            className="mb-2 rounded-xl bg-brand-500 px-4 py-3 text-center text-sm font-bold text-white"
          >
            APK yuklab olish
          </a>
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-3 text-sm font-semibold text-navy-800 hover:bg-navy-100"
            >
              {l.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
