import { useEffect, useRef } from 'react';
import { useCounter } from '../hooks/useCounter.js';

function Stat({ value, label }) {
  const [ref, text] = useCounter(value);
  return (
    <div ref={ref}>
      <div className="font-mono text-2xl font-bold text-brand-500">{text}</div>
      <div className="mt-0.5 text-xs text-navy-700/60">{label}</div>
    </div>
  );
}

export default function Hero({ data, botUrl }) {
  const cardRef = useRef(null);
  const stageRef = useRef(null);

  useEffect(() => {
    const stage = stageRef.current;
    const card = cardRef.current;
    if (!stage || !card) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!window.matchMedia('(hover: hover)').matches) return;

    function onMove(e) {
      const rect = stage.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(1200px) rotateY(${(px * 10).toFixed(2)}deg) rotateX(${(-py * 10).toFixed(2)}deg)`;
    }
    function onLeave() {
      card.style.transform = 'perspective(1200px) rotateY(0deg) rotateX(0deg)';
    }
    stage.addEventListener('mousemove', onMove);
    stage.addEventListener('mouseleave', onLeave);
    return () => {
      stage.removeEventListener('mousemove', onMove);
      stage.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return (
    <section id="top" className="relative overflow-hidden pb-20 pt-14 sm:pb-28 sm:pt-20">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 right-[-10%] h-[520px] w-[520px] rounded-full bg-gradient-to-br from-brand-300/30 to-brand-500/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 top-40 h-96 w-96 rounded-full bg-navy-800/5 blur-3xl"
      />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 px-5 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/20 bg-brand-100/60 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-brand-500">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
            O'zbekiston bo'ylab · 14 viloyat
          </div>

          <h1 className="mt-6 font-display text-[2.6rem] font-extrabold leading-[1.04] tracking-tight text-navy-900 sm:text-6xl">
            {data.heroTitle.split(/(bevosita)/i).map((part, i) =>
              /^bevosita$/i.test(part) ? (
                <span key={i} className="bg-gradient-to-r from-brand-500 to-brand-300 bg-clip-text text-transparent">
                  {part}
                </span>
              ) : (
                <span key={i}>{part}</span>
              ),
            )}
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-navy-700/70">{data.heroSubtitle}</p>

          <div className="mt-9 flex flex-wrap gap-3">
            <a
              href="/uploads/apk/ishchi.apk"
              className="rounded-full bg-navy-900 px-7 py-3.5 text-sm font-bold text-white shadow-xl shadow-navy-900/20 transition-all hover:-translate-y-0.5 hover:bg-brand-500 hover:shadow-brand-500/30"
            >
              Android uchun yuklab olish
            </a>
            <a
              href={botUrl}
              className="rounded-full border border-navy-900/15 bg-white px-7 py-3.5 text-sm font-bold text-navy-900 transition-all hover:-translate-y-0.5 hover:border-brand-500 hover:text-brand-500"
            >
              Telegram bot
            </a>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-6 sm:grid-cols-4">
            {data.stats.map((s, i) => (
              <Stat key={i} value={s.value} label={s.label} />
            ))}
          </div>
        </div>

        <div ref={stageRef} className="[perspective:1200px]">
          <div
            ref={cardRef}
            className="relative rounded-[2rem] bg-gradient-to-br from-navy-800 to-navy-900 p-8 text-white shadow-2xl shadow-navy-900/30 transition-transform duration-150 ease-out will-change-transform"
          >
            <div className="flex items-center justify-between text-[0.68rem] font-semibold uppercase tracking-wider text-navy-100/50">
              <span>Ishchi · App</span>
              <span>v.1.0</span>
            </div>

            <div className="mx-auto mt-7 grid h-32 w-32 place-items-center rounded-full border-4 border-brand-500 bg-white shadow-lg shadow-brand-500/30">
              <img src="/assets/brand/logo.png" alt="" className="h-[80%] w-[80%] object-contain" />
            </div>
            <div className="mt-5 text-center font-display text-2xl font-extrabold tracking-wide">ISHCHI</div>
            <div className="text-center text-xs font-medium tracking-wide text-navy-100/50">
              ISH BERUVCHI ⇄ ISHCHI
            </div>

            <div className="mt-7 grid grid-cols-2 gap-4 border-t border-dashed border-white/15 pt-6">
              {[
                ['GPS', 'Aniq joylashuv belgilash'],
                ['OSM', 'OpenStreetMap xarita'],
                ['JWT', 'Xavfsiz autentifikatsiya'],
                ['24/7', 'Doimiy ishlaydigan tizim'],
              ].map(([k, v]) => (
                <div key={k}>
                  <div className="font-mono text-base font-bold text-brand-300">{k}</div>
                  <div className="text-[0.7rem] text-navy-100/50">{v}</div>
                </div>
              ))}
            </div>

            <div
              aria-hidden
              className="absolute -right-3 -top-3 grid h-14 w-14 rotate-6 place-items-center rounded-2xl bg-brand-500 text-xs font-bold shadow-lg shadow-brand-500/40"
            >
              Bepul
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
