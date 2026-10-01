import { ChevronDown } from 'lucide-react';
import { PRIVACY_URL } from '../lib/links.js';
import Reveal from './Reveal.jsx';
import SectionHead from './SectionHead.jsx';

const QUESTIONS = [
  ["Ilova pullikmi?", "Yo'q. Ilovani yuklab olish va ro'yxatdan o'tish bepul."],
  [
    "Ustaning ishonchli ekanini qanday bilaman?",
    "Har bir ishchining profilida kasbi va tajribasi ko'rinadi. Bajarilgan ishlardan keyin qo'yilgan reyting, tekshirilgan ustalardagi «tasdiqlangan» belgisi ham tanlashga yordam beradi. Muammo bo'lsa, e'lon yoki foydalanuvchi ustidan shikoyat qilish mumkin.",
  ],
  ["Qaysi shaharlarda ishlaydi?", "O'zbekistonning barcha 14 hududida — viloyat va tuman bo'yicha qidirish mumkin."],
  [
    "Ilovani o'rnatmasdan e'lon bera olamanmi?",
    "Ha, Telegram botimiz orqali. Bot savollar berib, e'loningizni o'zi tuzib chiqadi.",
  ],
  ["iPhone uchun ham bormi?", "Hozircha ilova Android telefonlar uchun."],
  ['Bitta akkauntda ham ishchi, ham ish beruvchi bo\'lsa bo\'ladimi?', "Ha. Rolni ilova ichida istalgan payt almashtirasiz, ikkala profil ma'lumotlari alohida saqlanadi."],
];

export default function Faq() {
  return (
    <section id="savollar" className="bg-navy-100/50 py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-5 sm:px-8">
        <SectionHead eyebrow="Savollar" title="Ko'p so'raladigan savollar" />
        <div className="mt-10 flex flex-col gap-3">
          {QUESTIONS.map(([q, a], i) => (
            <Reveal key={q} delay={i * 50}>
              <details className="group rounded-2xl border border-navy-900/7 bg-white px-5 py-4 open:shadow-md open:shadow-navy-900/5 sm:px-6">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold text-navy-900 [&::-webkit-details-marker]:hidden">
                  {q}
                  <ChevronDown size={20} className="shrink-0 text-navy-700/40 transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-3 leading-relaxed text-navy-700/70">{a}</p>
              </details>
            </Reveal>
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-navy-700/60">
          Shaxsiy ma'lumotlar va hisobni o'chirish haqida —{' '}
          <a href={PRIVACY_URL} className="font-semibold text-brand-text underline underline-offset-2">
            maxfiylik siyosati
          </a>
          .
        </p>
      </div>
    </section>
  );
}
