import {
  Armchair,
  Bike,
  BrickWall,
  Car,
  ChefHat,
  CircleDot,
  Droplets,
  Flame,
  Grid3x3,
  HardHat,
  House,
  Package,
  PaintRoller,
  Snowflake,
  Sparkles,
  Store,
  Truck,
  UtensilsCrossed,
  WashingMachine,
  Wrench,
  Zap,
} from 'lucide-react';
import Reveal from './Reveal.jsx';
import SectionHead from './SectionHead.jsx';

// Professions come from the admin-managed list; an icon is picked from words in the name, so a
// newly added profession still gets a sensible one.
const ICONS = [
  [/suvoq|bo'yoq|boyoq|malyar/i, PaintRoller],
  [/santex|suv/i, Droplets],
  [/elektr/i, Zap],
  [/payvand/i, Flame],
  [/kafel|plitka/i, Grid3x3],
  [/beton|g'isht|qurilish/i, BrickWall],
  [/^tom\b|tom yop/i, House],
  [/tozala/i, Sparkles],
  [/yuk|ko'chir/i, Truck],
  [/mebel/i, Armchair],
  [/konditsioner/i, Snowflake],
  [/maishiy|texnika/i, WashingMachine],
  [/shin/i, CircleDot],
  [/avto|mexanik|haydovchi/i, Car],
  [/kunlik|mardikor/i, HardHat],
  [/ombor/i, Package],
  [/sotuvchi/i, Store],
  [/oshpaz/i, ChefHat],
  [/ofitsiant/i, UtensilsCrossed],
  [/kuryer/i, Bike],
];

const iconFor = (name) => (ICONS.find(([re]) => re.test(name)) || [null, Wrench])[1];

// The everyday trades lead; the rest of the admin's list follows in its own order.
const POPULAR = ['santexnik', 'elektrik', 'kafelchi', 'suvoqchi', 'payvandchi', 'kunlik ishchi', 'yuk tashish', 'uy tozalash', 'konditsioner ustasi', 'avtomexanik', 'oshpaz', 'kuryer'];
const rank = (name) => {
  const i = POPULAR.indexOf(name.toLowerCase());
  return i < 0 ? POPULAR.length : i;
};

// Shown until the live list arrives, and if it cannot be loaded.
const FALLBACK = [
  'Santexnik',
  'Elektrik',
  'Kafelchi',
  'Suvoqchi',
  'Payvandchi',
  'Kunlik ishchi',
  'Yuk tashish',
  'Uy tozalash',
  'Konditsioner ustasi',
  'Avtomexanik',
  'Oshpaz',
  'Kuryer',
].map((name, id) => ({ id: `f${id}`, name }));

export default function Categories({ professions }) {
  const list = professions.length ? [...professions].sort((a, b) => rank(a.name) - rank(b.name)) : FALLBACK;
  const shown = list.slice(0, 11);
  const rest = Math.max(0, list.length - shown.length);

  return (
    <section id="ish-turlari" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHead
          eyebrow="Ish turlari"
          title="Uy ta'miridan yuk tashishgacha"
          text="Usta, mardikor yoki mutaxassis — kerakli odamni kasbi bo'yicha toping yoki o'zingiz bilgan ish bo'yicha e'lonlarni ko'ring."
        />

        <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {shown.map((p, i) => {
            const Icon = iconFor(p.name);
            return (
              <Reveal
                key={p.id}
                delay={(i % 4) * 60}
                className="group flex flex-col items-start gap-3 rounded-2xl border border-navy-900/7 bg-white p-4 transition-all sm:flex-row sm:items-center duration-300 hover:-translate-y-1 hover:border-brand-500/25 hover:shadow-lg hover:shadow-brand-500/10"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-100 text-brand-500 transition-colors group-hover:bg-brand-500 group-hover:text-white">
                  <Icon size={21} strokeWidth={2.2} />
                </span>
                <span className="min-w-0 break-words text-[15px] font-semibold leading-snug text-navy-900">{p.name}</span>
              </Reveal>
            );
          })}
          <Reveal
            delay={180}
            className="flex items-center justify-center rounded-2xl bg-navy-900 p-4 text-center text-[15px] font-bold text-white"
          >
            {rest > 0 ? `+ yana ${rest} ta kasb` : 'va boshqalar'}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
