import Reveal from './Reveal.jsx';

const WORKER_STEPS = [
  ["Ro'yxatdan o'tish", 'Telefon raqami bilan, SMS kod orqali tasdiqlanadi.'],
  ["Profilni to'ldirish", "Kasblar, tajriba, hudud va qanday ish qidirayotganini belgilash."],
  ['Buyurtma qidirish', "Ro'yxat yoki xarita ko'rinishida, filtr va saralash bilan."],
  ["Bog'lanish", "Ish beruvchiga to'g'ridan-to'g'ri qo'ng'iroq qilish."],
];

const EMPLOYER_STEPS = [
  ["Ro'yxatdan o'tish", 'Telefon raqami bilan, SMS kod orqali tasdiqlanadi.'],
  ['Buyurtma joylashtirish', "Tavsif, to'lov, rasm va xaritadan aniq joy bilan."],
  ['Ishchi topish', "Mos ishchilarni qidirish yoki xaritada ko'rish."],
  ['Boshqarish', 'Buyurtma holatini kuzatish — faol, jarayonda, yakunlangan.'],
];

function StepColumn({ title, steps, delay }) {
  return (
    <Reveal delay={delay}>
      <h3 className="mb-7 flex items-center gap-2.5 text-lg font-bold text-navy-900">
        <span className="h-2.5 w-2.5 rounded-sm bg-brand-500" />
        {title}
      </h3>
      <ol className="flex flex-col">
        {steps.map(([h, p], i) => (
          <li key={h} className={`flex gap-4 py-4 ${i > 0 ? 'border-t border-navy-900/8' : 'pt-0'}`}>
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-navy-100 font-mono text-xs font-bold text-brand-500">
              {String(i + 1).padStart(2, '0')}
            </span>
            <div>
              <h4 className="text-[0.95rem] font-bold text-navy-900">{h}</h4>
              <p className="mt-0.5 text-sm text-navy-700/60">{p}</p>
            </div>
          </li>
        ))}
      </ol>
    </Reveal>
  );
}

export default function HowItWorks() {
  return (
    <section id="qanday-ishlaydi" className="py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-brand-500">
            Qanday ishlaydi
          </span>
          <h2 className="mt-5 font-display text-4xl font-extrabold text-navy-900">Ro'yxatdan tortib bog'lanishgacha</h2>
          <p className="mt-4 text-navy-700/60">Ikkala tomon uchun ham jarayon to'rt qadamdan iborat.</p>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-14 md:grid-cols-2 md:gap-10">
          <StepColumn title="Ishchi yo'li" steps={WORKER_STEPS} delay={0} />
          <StepColumn title="Ish beruvchi yo'li" steps={EMPLOYER_STEPS} delay={100} />
        </div>
      </div>
    </section>
  );
}
