import Reveal from './Reveal.jsx';

const POINTS = [
  "Kunlik va doimiy ish e'lonlari — hudud va kasb bo'yicha qidiriladi",
  'Ishchi va ish beruvchi bevosita, hech qanday vositachisiz bog‘lanadi',
  "Ro'yxatdan o'tish va foydalanish butunlay bepul",
  "Har bir ustaning tajribasi va kasbi profilida aniq ko'rsatiladi",
];

export default function About({ aboutText }) {
  // The admin edits this as one free-form block (often with its own paragraph breaks
  // and a bullet list embedded as plain "•" lines). This section already renders a
  // curated bullet list below, so only the lead paragraph is shown here — otherwise the
  // same points appear twice: once as squashed run-on text, once as the styled list.
  const intro = aboutText.split(/\n{2,}/)[0];

  return (
    <section id="loyiha" className="bg-navy-900 py-24 text-white sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-300/30 bg-white/5 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-brand-300">
          Loyiha haqida
        </Reveal>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <Reveal>
            <p className="font-display text-3xl font-bold leading-tight text-white sm:text-4xl">
              Mehnat bozorini soddalashtirish, har bir insonga munosib ish yoki ishonchli xodim topishda yordam
              berish.
            </p>
          </Reveal>

          <Reveal delay={120}>
            <p className="whitespace-pre-line text-lg leading-relaxed text-navy-100/70">{intro}</p>
            <ul className="mt-7 flex flex-col gap-4">
              {POINTS.map((p) => (
                <li key={p} className="flex items-start gap-3 text-[0.95rem] text-white/90">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                  {p}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
