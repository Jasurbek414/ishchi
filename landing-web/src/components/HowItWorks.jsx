import { useState } from 'react';
import { BadgeCheck, ClipboardList, MapPinned, PhoneCall, Smartphone, UserRoundCheck } from 'lucide-react';
import Reveal from './Reveal.jsx';
import SectionHead from './SectionHead.jsx';

const FLOWS = {
  worker: {
    label: 'Ish izlayman',
    steps: [
      [Smartphone, "Ro'yxatdan o'ting", 'Ilovani yuklab oling va telefon raqamingiz bilan kiring.'],
      [MapPinned, 'Kasb va hududni belgilang', "Nima ish qila olishingiz va qayerda ishlashni xohlashingizni ko'rsating."],
      [PhoneCall, 'Ishni oling', "Mos e'lonni tanlang, ish beruvchiga qo'ng'iroq qiling yoki «Javob berdim» tugmasini bosing."],
    ],
  },
  employer: {
    label: 'Usta kerak',
    steps: [
      [Smartphone, "Ro'yxatdan o'ting", 'Ilovani yuklab oling yoki Telegram bot orqali boshlang.'],
      [ClipboardList, "E'lon bering", "Qanday ish, qayerda va qancha to'lov — xohlasangiz rasm ham qo'shing."],
      [UserRoundCheck, 'Ustani tanlang', "Javob berganlarning reytingi va tajribasiga qarab tanlang, so'ng qo'ng'iroq qiling."],
    ],
  },
};

export default function HowItWorks() {
  const [side, setSide] = useState('worker');
  const flow = FLOWS[side];

  return (
    <section id="qanday-ishlaydi" className="bg-navy-100/50 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHead
          eyebrow="Qanday ishlaydi"
          title="Uch qadam — va ish boshlandi"
          text="Bitta akkaunt bilan ham ish izlash, ham usta topish mumkin. Kerak bo'lsa, rolni ilova ichida almashtirasiz."
        />

        <Reveal className="mt-10 flex justify-center">
          <div role="tablist" aria-label="Kim sifatida" className="inline-flex rounded-full border border-navy-900/8 bg-white p-1.5 shadow-sm">
            {Object.entries(FLOWS).map(([key, f]) => (
              <button
                key={key}
                role="tab"
                aria-selected={side === key}
                onClick={() => setSide(key)}
                className={`rounded-full px-5 py-2.5 text-sm font-bold transition-all sm:px-7 ${
                  side === key ? 'bg-brand-500 text-white shadow-md shadow-brand-500/30' : 'text-navy-700/70 hover:text-navy-900'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </Reveal>

        <ol key={side} className="relative mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
          <div aria-hidden className="absolute left-[16%] right-[16%] top-11 hidden border-t-2 border-dashed border-brand-300/60 md:block" />
          {flow.steps.map(([Icon, title, text], i) => (
            <Reveal
              as="li"
              key={title}
              delay={i * 110}
              className="relative rounded-3xl border border-navy-900/6 bg-white p-7 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <span className="relative grid h-16 w-16 place-items-center rounded-2xl bg-brand-500 text-white shadow-lg shadow-brand-500/25">
                  <Icon size={28} strokeWidth={2.1} />
                  <span className="absolute -right-2 -top-2 grid h-7 w-7 place-items-center rounded-full bg-navy-900 font-display text-xs font-bold text-white ring-4 ring-white">
                    {i + 1}
                  </span>
                </span>
              </div>
              <h3 className="mt-5 font-display text-xl font-bold text-navy-900">{title}</h3>
              <p className="mt-2 leading-relaxed text-navy-700/65">{text}</p>
            </Reveal>
          ))}
        </ol>

        <p className="mt-8 flex items-center justify-center gap-2 text-center text-sm text-navy-700/60">
          <BadgeCheck size={17} className="shrink-0 text-brand-500" />
          Ish tugagach, ikkala tomon bir-birini baholaydi — keyingi odamlar uchun ishonch shundan yig'iladi.
        </p>
      </div>
    </section>
  );
}
