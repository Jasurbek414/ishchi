import { Download, Send } from 'lucide-react';
import { APK_URL } from '../lib/links.js';
import Reveal from './Reveal.jsx';

export default function DownloadCta({ botUrl }) {
  return (
    <section className="px-5 py-20 sm:px-8 sm:py-24">
      <Reveal className="relative mx-auto max-w-5xl overflow-hidden rounded-[2rem] bg-navy-900 px-7 py-12 text-center text-white sm:px-12 sm:py-16">
        <div aria-hidden className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-brand-500/40 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-28 -right-20 h-72 w-72 rounded-full bg-brand-400/25 blur-3xl" />
        <div className="relative">
          <img src="/assets/brand/logo.png" alt="" className="mx-auto h-20 w-20 rounded-2xl bg-white object-contain p-1.5 shadow-xl" />
          <h2 className="mx-auto mt-6 max-w-2xl font-display text-3xl font-extrabold leading-tight sm:text-[2.6rem]">
            Ish ham, usta ham — bir telefonda
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[1.05rem] text-navy-100/75">
            Yuklab oling, ro'yxatdan o'ting va bugunoq ish yoki ishchi toping.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              href={APK_URL}
              className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-7 py-3.5 text-sm font-bold text-white shadow-xl shadow-brand-500/30 transition-transform hover:-translate-y-0.5"
            >
              <Download size={17} strokeWidth={2.5} /> Android uchun yuklab olish
            </a>
            <a
              href={botUrl}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-7 py-3.5 text-sm font-bold text-white transition-transform hover:-translate-y-0.5"
            >
              <Send size={16} strokeWidth={2.5} /> Telegram bot
            </a>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
