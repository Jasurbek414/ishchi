import Reveal from './Reveal.jsx';

const WORKER_POINTS = [
  "Hudud bo'yicha yaqinlashtirilgan tavsiya etilgan buyurtmalar",
  "To'liq filtr, qidiruv va saralash + xarita ko'rinishi",
  "Buyurtma rasmlari galereyasi va to'liq tavsif",
  "Ish beruvchi bilan bir tugma bosib qo'ng'iroq qilish",
  "Qanday ish qidirayotganini belgilash — doimiy, kunlik yoki mutaxassis",
];

const EMPLOYER_POINTS = [
  'Qidiruv + filtr, tezkor bo‘limlar (doimiy / kunlik / mutaxassis)',
  "Xaritada ishchilarni pin sifatida ko'rish",
  'Buyurtma berish: istalgancha rasm + xaritadan aniq joy belgilash',
  '"Mening buyurtmalarim" — holat bo\'yicha boshqarish',
  "Ishchi profilini to'liq ko'rish va bog'lanish",
];

function SideCard({ tag, title, points, align }) {
  return (
    <Reveal
      delay={align === 'right' ? 120 : 0}
      className={`rounded-3xl border border-navy-900/8 bg-white p-9 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-navy-900/10`}
    >
      <span className="inline-block rounded-full bg-brand-100 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide text-brand-500">
        {tag}
      </span>
      <h3 className="mt-5 font-display text-2xl font-extrabold text-navy-900">{title}</h3>
      <ul className="mt-5 flex flex-col gap-3.5">
        {points.map((p) => (
          <li key={p} className="flex items-start gap-3 text-[0.94rem] text-navy-700/70">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
            {p}
          </li>
        ))}
      </ul>
    </Reveal>
  );
}

export default function TwoSides() {
  return (
    <section id="ikki-tomon" className="py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-brand-500">
            Bitta akkaunt, ikkala rol
          </span>
          <h2 className="mt-5 font-display text-4xl font-extrabold text-navy-900">Ishchi va ish beruvchi — bir ilovada</h2>
          <p className="mt-4 text-navy-700/60">
            Har bir foydalanuvchi istalgan vaqt ikki rol o'rtasida almashishi mumkin — profil ma'lumotlari mustaqil
            saqlanadi, qayta almashtirilganda tiklanadi.
          </p>
        </Reveal>

        <div className="relative mt-14 grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-6">
          <SideCard tag="Ishchi uchun" title="Ish qidirish" points={WORKER_POINTS} align="left" />

          <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 md:block">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-brand-300 to-brand-500 text-center text-[0.6rem] font-bold leading-tight text-white shadow-xl shadow-brand-500/40 ring-8 ring-white">
              ROL
              <br />
              ALMASH.
            </div>
          </div>

          <SideCard tag="Ish beruvchi uchun" title="Ishchi topish" points={EMPLOYER_POINTS} align="right" />
        </div>
      </div>
    </section>
  );
}
