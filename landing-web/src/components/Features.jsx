import Reveal from './Reveal.jsx';

export default function Features({ features }) {
  if (!features.length) return null;
  return (
    <section id="imkoniyatlar" className="bg-navy-100/40 py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-brand-500">
            Imkoniyatlar
          </span>
          <h2 className="mt-5 font-display text-4xl font-extrabold text-navy-900">
            Ishlab chiqilgan va ishlayotgan funksiyalar
          </h2>
          <p className="mt-4 text-navy-700/60">
            Quyidagilarning barchasi allaqachon ishlab turgan production tizimda mavjud.
          </p>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <Reveal
              key={f.id}
              delay={(i % 3) * 90}
              className="group rounded-3xl border border-navy-900/8 bg-white p-7 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-navy-900/8"
            >
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-brand-300 to-brand-500 font-mono text-sm font-bold text-white shadow-lg shadow-brand-500/25 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110">
                {String(i + 1).padStart(2, '0')}
              </div>
              <h3 className="mt-5 text-lg font-bold text-navy-900">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-navy-700/60">{f.description}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
