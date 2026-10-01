import { MapPin } from 'lucide-react';
import Reveal from './Reveal.jsx';
import SectionHead from './SectionHead.jsx';

export default function Coverage({ regions }) {
  return (
    <section id="hududlar" className="py-20 sm:py-28">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-5 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <SectionHead
          align="left"
          eyebrow="Hududlar"
          title="Toshkentdan Nukusgacha"
          text="O'zbekistonning barcha viloyatlari va Qoraqalpog'iston — tuman darajasigacha. Ish va ustalar avvalo o'zingizga yaqin joydan ko'rsatiladi."
        />
        <Reveal delay={100} className="rounded-3xl border border-navy-900/7 bg-gradient-to-br from-white to-brand-100/50 p-6 sm:p-8">
          <div className="flex flex-wrap gap-2.5">
            {regions.map((r) => (
              <span
                key={r.id}
                className="inline-flex items-center gap-1.5 rounded-full border border-navy-900/8 bg-white px-3.5 py-2 text-sm font-medium text-navy-800 shadow-sm"
              >
                <MapPin size={14} className="text-brand-500" />
                {r.name}
              </span>
            ))}
            {!regions.length && <span className="text-navy-700/50">14 ta hudud</span>}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
