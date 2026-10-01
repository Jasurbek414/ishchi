import { ArrowRight, Download, Hammer, Search, Send } from 'lucide-react';
import { useCounter } from '../hooks/useCounter.js';
import { APK_URL } from '../lib/links.js';
import PhoneMockup from './PhoneMockup.jsx';

function Stat({ value, label }) {
  const [ref, text] = useCounter(value);
  return (
    <div ref={ref} className="min-w-0">
      <div className="font-display text-2xl font-extrabold text-navy-900 sm:text-[1.7rem]">{text}</div>
      <div className="mt-0.5 text-[13px] leading-snug text-navy-700/60">{label}</div>
    </div>
  );
}

// The two reasons people arrive — each card says what happens next in plain words.
const ROLES = [
  {
    icon: Search,
    title: 'Ish izlayapman',
    text: "Yaqin atrofdagi kunlik va doimiy ishlarni ko'ring",
    tint: 'bg-brand-100 text-brand-500',
  },
  {
    icon: Hammer,
    title: 'Usta kerak',
    text: "E'lon bering — ustalar o'zi qo'ng'iroq qiladi",
    tint: 'bg-orange-100 text-orange-500',
  },
];

/** Highlights one word of the admin-edited headline: "bevosita" if present, else the last word. */
function Headline({ text }) {
  const words = text.trim().split(/\s+/);
  let at = words.findIndex((w) => /^bevosita$/i.test(w));
  if (at < 0) at = words.length - 1;
  return (
    <>
      {words.map((w, i) => (
        <span key={i}>
          {i > 0 && ' '}
          {i === at ? (
            <span className="relative whitespace-nowrap text-brand-500">
              {w}
              <svg
                aria-hidden
                viewBox="0 0 200 12"
                preserveAspectRatio="none"
                className="absolute -bottom-1.5 left-0 h-2.5 w-full text-brand-300/70"
              >
                <path d="M2 9 C 50 2, 150 2, 198 8" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
              </svg>
            </span>
          ) : (
            w
          )}
        </span>
      ))}
    </>
  );
}

export default function Hero({ data, botUrl }) {
  return (
    <section id="top" className="relative overflow-hidden bg-gradient-to-b from-brand-100/70 via-white to-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 [background-image:radial-gradient(rgba(2,132,199,0.13)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_at_top,black_35%,transparent_75%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 -top-40 h-[560px] w-[560px] rounded-full bg-brand-300/25 blur-3xl"
      />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-5 pb-16 pt-10 sm:px-8 sm:pb-24 sm:pt-16 lg:grid-cols-2 lg:gap-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/15 bg-white/80 px-3.5 py-1.5 text-[12.5px] font-semibold text-navy-800 shadow-sm backdrop-blur">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60 motion-reduce:hidden" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            O'zbekiston bo'ylab ishlaydi · 14 hudud
          </div>

          <h1 className="mt-6 font-display text-[2.4rem] font-extrabold leading-[1.08] tracking-tight text-navy-900 sm:text-[3.6rem]">
            <Headline text={data.heroTitle} />
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-navy-700/70">{data.heroSubtitle}</p>

          <div className="mt-8 grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {ROLES.map(({ icon: Icon, title, text, tint }) => (
              <a
                key={title}
                href={APK_URL}
                className="group flex items-center gap-3.5 rounded-2xl border border-navy-900/8 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-500/30 hover:shadow-lg hover:shadow-brand-500/10"
              >
                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${tint}`}>
                  <Icon size={21} strokeWidth={2.3} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold text-navy-900">{title}</span>
                  <span className="block text-[13px] leading-snug text-navy-700/60">{text}</span>
                </span>
                <ArrowRight size={18} className="shrink-0 text-navy-700/30 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-500" />
              </a>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <a
              href={APK_URL}
              className="inline-flex items-center gap-2 rounded-full bg-navy-900 px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-navy-900/20 transition-all hover:-translate-y-0.5 hover:bg-brand-500"
            >
              <Download size={17} strokeWidth={2.5} />
              Android uchun yuklab olish
            </a>
            <a
              href={botUrl}
              className="inline-flex items-center gap-2 rounded-full border border-navy-900/12 bg-white px-6 py-3.5 text-sm font-bold text-navy-900 transition-all hover:-translate-y-0.5 hover:border-brand-500 hover:text-brand-500"
            >
              <Send size={16} strokeWidth={2.5} />
              Telegram bot
            </a>
          </div>

          <div className="mt-10 grid max-w-xl grid-cols-2 gap-x-6 gap-y-5 border-t border-navy-900/8 pt-7 sm:grid-cols-4">
            {data.stats.map((s, i) => (
              <Stat key={i} value={s.value} label={s.label} />
            ))}
          </div>
        </div>

        <PhoneMockup />
      </div>
    </section>
  );
}
