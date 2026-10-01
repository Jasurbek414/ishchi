import { BadgeCheck, Camera, Handshake, Languages, MapPinned, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import Reveal from './Reveal.jsx';
import SectionHead from './SectionHead.jsx';

// The cards are edited in the admin panel; an icon is matched from the title so an edited card
// keeps a fitting one, falling back to the card's position.
const BY_WORD = [
  [/vositachi/i, Handshake],
  [/xarita|yaqin|joy/i, MapPinned],
  [/reyting|tasdiq|ishonch/i, BadgeCheck],
  [/shoshilinch|tez/i, Zap],
  [/rasm|galereya/i, Camera],
  [/til/i, Languages],
  [/xavfsiz/i, ShieldCheck],
];
const BY_POSITION = [Handshake, MapPinned, BadgeCheck, Zap, Camera, Languages];

const iconFor = (title, i) => (BY_WORD.find(([re]) => re.test(title)) || [null, BY_POSITION[i] || Sparkles])[1];

export default function Features({ features }) {
  if (!features.length) return null;
  return (
    <section id="afzalliklar" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHead
          eyebrow="Nega Ishchi"
          title="Oddiy, tez va hech kimga foiz bermasdan"
          text="Ishchi ham, ish beruvchi ham bir-birini topib, o'zaro to'g'ridan-to'g'ri kelishadi."
        />

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => {
            const Icon = iconFor(f.title, i);
            return (
              <Reveal
                key={f.id}
                delay={(i % 3) * 90}
                className="group rounded-3xl border border-navy-900/7 bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:border-brand-500/20 hover:shadow-xl hover:shadow-brand-500/10"
              >
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-100 text-brand-500 transition-all duration-300 group-hover:-rotate-6 group-hover:bg-brand-500 group-hover:text-white">
                  <Icon size={23} strokeWidth={2.2} />
                </span>
                <h3 className="mt-5 font-display text-lg font-bold text-navy-900">{f.title}</h3>
                <p className="mt-2 leading-relaxed text-navy-700/65">{f.description}</p>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
