import Reveal from './Reveal.jsx';

export default function Roadmap({ items }) {
  if (!items.length) return null;
  return (
    <section id="yol-xaritasi" className="py-24 sm:py-28">
      <div className="mx-auto max-w-4xl px-5 sm:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-brand-500">
            Yo'l xaritasi
          </span>
          <h2 className="mt-5 font-display text-4xl font-extrabold text-navy-900">Keyingi bosqichda nima kutilmoqda</h2>
          <p className="mt-4 text-navy-700/60">Quyidagilar hali ishlab chiqilmagan — rivojlanish rejasining ochiq ro'yxati.</p>
        </Reveal>

        <div className="relative mt-14 flex flex-col">
          <div aria-hidden className="absolute left-[7px] top-2 bottom-2 w-px bg-navy-900/10" />
          {items.map((item, i) => (
            <Reveal key={item.id} delay={i * 70} className="relative flex gap-5 pb-9 last:pb-0">
              <span className="relative z-10 mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-brand-500 bg-white" />
              <div>
                <span className="font-mono text-[0.65rem] font-bold uppercase tracking-wide text-brand-500">
                  Kelajakda
                </span>
                <h4 className="mt-0.5 text-base font-bold text-navy-900">{item.title}</h4>
                <p className="mt-1 text-sm text-navy-700/60">{item.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
