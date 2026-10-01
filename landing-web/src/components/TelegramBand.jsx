import { ArrowRight, MessageCircle, Send } from 'lucide-react';
import Reveal from './Reveal.jsx';

const STEPS = ['Botni oching', 'Bir necha savolga javob bering', "E'lon tayyor — ustalar ko'radi"];

export default function TelegramBand({ botUrl }) {
  return (
    <section className="px-5 sm:px-8">
      <Reveal className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#2aabee] to-[#1c8ad6] px-7 py-10 text-white sm:px-12 sm:py-14">
        <Send aria-hidden size={260} strokeWidth={1.2} className="pointer-events-none absolute -bottom-16 -right-10 text-white/10" />
        <div className="relative grid grid-cols-1 items-center gap-8 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide">
              <MessageCircle size={14} /> Ilovasiz ham bo'ladi
            </span>
            <h2 className="mt-4 font-display text-3xl font-extrabold leading-tight sm:text-4xl">
              Telegram bot orqali e'lon bering
            </h2>
            <p className="mt-3 max-w-lg text-[1.05rem] leading-relaxed text-white/85">
              Ilovani o'rnatish shart emas: botimiz savollar berib, e'loningizni o'zi tuzib chiqadi.
            </p>
            <a
              href={botUrl}
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-bold text-[#1c8ad6] shadow-lg shadow-navy-900/15 transition-transform hover:-translate-y-0.5"
            >
              Botni ochish <ArrowRight size={16} strokeWidth={2.6} />
            </a>
          </div>
          <ol className="flex flex-col gap-3">
            {STEPS.map((s, i) => (
              <li key={s} className="flex items-center gap-3.5 rounded-2xl bg-white/12 px-4 py-3.5 backdrop-blur-sm">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white font-display text-sm font-bold text-[#1c8ad6]">
                  {i + 1}
                </span>
                <span className="font-semibold">{s}</span>
              </li>
            ))}
          </ol>
        </div>
      </Reveal>
    </section>
  );
}
