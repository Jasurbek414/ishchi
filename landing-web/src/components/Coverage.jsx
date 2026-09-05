import { useMemo } from 'react';
import Reveal from './Reveal.jsx';
import { useReveal } from '../hooks/useReveal.js';

function CategoryBar({ name, count, max, delay }) {
  const [ref, visible] = useReveal(0.3);
  const pct = Math.round((count / max) * 100);
  return (
    <div ref={ref}>
      <div className="mb-1.5 flex justify-between text-sm">
        <span className="text-navy-800">{name}</span>
        <span className="font-mono text-navy-700/50">{count} kasb</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-navy-900/8">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-300 transition-[width] duration-1000 ease-out"
          style={{ width: visible ? `${pct}%` : '0%', transitionDelay: `${delay}ms` }}
        />
      </div>
    </div>
  );
}

export default function Coverage({ regions, professions }) {
  const byCategory = useMemo(() => {
    const map = {};
    professions.forEach((p) => {
      const cat = p.category || 'Boshqa';
      map[cat] = (map[cat] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [professions]);
  const max = Math.max(1, ...byCategory.map(([, c]) => c));

  return (
    <section id="qamrov" className="bg-navy-100/40 py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-brand-500">
            Qamrov
          </span>
          <h2 className="mt-5 font-display text-4xl font-extrabold text-navy-900">O'zbekistonning barcha 14 hududi</h2>
          <p className="mt-4 text-navy-700/60">
            Har bir viloyat va Qoraqalpog'iston Respublikasi tuman darajasigacha qamrab olingan.
          </p>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-12 md:grid-cols-2">
          <Reveal className="flex flex-wrap content-start gap-2.5">
            {regions.map((r) => (
              <span
                key={r.id}
                className="rounded-full border border-navy-900/10 bg-white px-4 py-2 text-sm text-navy-800 shadow-sm transition-colors hover:border-brand-500 hover:text-brand-500"
              >
                {r.name}
              </span>
            ))}
          </Reveal>

          <Reveal delay={120}>
            <div className="flex flex-col gap-5">
              {byCategory.map(([name, count], i) => (
                <CategoryBar key={name} name={name} count={count} max={max} delay={i * 100} />
              ))}
            </div>
            <div className="mt-7 flex flex-wrap gap-2">
              {professions.slice(0, 10).map((p) => (
                <span
                  key={p.id}
                  className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-navy-700/70 shadow-sm"
                >
                  {p.name}
                </span>
              ))}
              {professions.length > 10 && (
                <span className="rounded-lg bg-navy-900 px-3 py-1.5 text-xs font-medium text-white">
                  + yana ko'plab
                </span>
              )}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
