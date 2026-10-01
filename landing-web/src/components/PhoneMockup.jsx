import { BadgeCheck, Bell, Briefcase, Home, MapPin, Phone, Search, Star, User } from 'lucide-react';

// An illustration of the app's job feed, drawn in markup so it stays sharp and follows the brand
// colours. The listings are examples of what people post, not live data.
const JOBS = [
  { title: 'Santexnik kerak', place: 'Chilonzor tumani', when: 'Bugun', pay: "150 000 so'm", urgent: true },
  { title: '2 ta yuk tashuvchi', place: 'Yunusobod tumani', when: 'Ertaga, 09:00', pay: "200 000 so'm / kishi" },
  { title: 'Kafel yotqizish, 20 m²', place: "Mirzo Ulug'bek tumani", when: 'Shu hafta', pay: 'Kelishiladi' },
];

const CHIPS = ['Hammasi', 'Qurilish', 'Uy xizmatlari', 'Avto'];

function JobCard({ job }) {
  return (
    <div className="rounded-2xl border border-navy-900/6 bg-white p-3 shadow-[0_2px_10px_rgba(14,25,48,0.06)]">
      <div className="flex items-start justify-between gap-2">
        <div className="text-[13px] font-bold leading-snug text-navy-900">{job.title}</div>
        {job.urgent && (
          <span className="shrink-0 rounded-full bg-orange-100 px-2 py-0.5 text-[9px] font-bold uppercase text-orange-600">
            Shoshilinch
          </span>
        )}
      </div>
      <div className="mt-1.5 flex items-center gap-1 text-[11px] text-navy-700/60">
        <MapPin size={11} strokeWidth={2.4} />
        {job.place} · {job.when}
      </div>
      <div className="mt-2.5 flex items-center justify-between">
        <span className="text-[12.5px] font-extrabold text-brand-text">{job.pay}</span>
        <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-500 text-white">
          <Phone size={13} strokeWidth={2.6} />
        </span>
      </div>
    </div>
  );
}

function Floating({ className, icon: Icon, iconClass, title, sub }) {
  return (
    <div
      className={`absolute z-20 hidden w-[170px] items-center gap-2 whitespace-nowrap rounded-2xl border border-white/70 bg-white/90 px-3 py-2.5 shadow-xl shadow-navy-900/10 backdrop-blur sm:flex lg:hidden xl:flex ${className}`}
    >
      <span className={`grid h-[30px] w-[30px] shrink-0 place-items-center rounded-lg ${iconClass}`}>
        <Icon size={16} strokeWidth={2.4} />
      </span>
      <div className="min-w-0 leading-tight">
        <div className="text-[12px] font-bold text-navy-900">{title}</div>
        <div className="text-[10.5px] text-navy-700/60">{sub}</div>
      </div>
    </div>
  );
}

export default function PhoneMockup() {
  return (
    // Wide enough for the phone (270px) and two 170px chips that cross only its bezel.
    <div className="relative mx-auto w-full max-w-[340px] py-6 sm:max-w-[586px]">
      <div aria-hidden className="absolute inset-x-6 top-10 bottom-4 rounded-[3rem] bg-brand-400/25 blur-3xl" />

      <Floating
        className="left-0 top-[24%]"
        icon={BadgeCheck}
        iconClass="bg-brand-100 text-brand-500"
        title="Ishonchli usta"
        sub="Profili tekshirilgan"
      />
      <Floating
        className="right-0 top-[50%]"
        icon={Star}
        iconClass="bg-amber-100 text-amber-500"
        title="Reyting"
        sub="Ishdan so'ng baho"
      />
      <Floating
        className="left-0 bottom-[12%]"
        icon={Phone}
        iconClass="bg-emerald-100 text-emerald-600"
        title="Bevosita aloqa"
        sub="Vositachi va foizsiz"
      />

      <div
        role="img"
        aria-label="Ishchi ilovasi: yaqin atrofdagi ish e'lonlari ro'yxati"
        className="relative z-10 mx-auto w-[270px] rounded-[2.6rem] border-[10px] border-navy-900 bg-[#f5f7fb] shadow-2xl shadow-navy-900/30"
      >
        <div className="absolute left-1/2 top-2 h-5 w-24 -translate-x-1/2 rounded-full bg-navy-900" />

        <div className="rounded-t-[1.9rem] bg-brand-500 px-4 pb-4 pt-9 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] text-white/75">Assalomu alaykum 👋</div>
              <div className="font-display text-[17px] font-bold">Yaqin atrofdagi ishlar</div>
            </div>
            <span className="grid h-8 w-8 place-items-center rounded-full bg-white/15">
              <Bell size={15} />
            </span>
          </div>
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-[12px] text-navy-700/50">
            <Search size={13} />
            Kasb yoki ish nomi
          </div>
        </div>

        <div className="flex gap-1.5 overflow-hidden px-3 pt-3">
          {CHIPS.map((c, i) => (
            <span
              key={c}
              className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[10.5px] font-semibold ${
                i === 0 ? 'bg-navy-900 text-white' : 'bg-white text-navy-700/70'
              }`}
            >
              {c}
            </span>
          ))}
        </div>

        <div className="flex flex-col gap-2.5 px-3 pb-3 pt-3">
          {JOBS.map((j) => (
            <JobCard key={j.title} job={j} />
          ))}
        </div>

        <div className="flex items-center justify-around rounded-b-[1.9rem] border-t border-navy-900/6 bg-white px-2 py-2.5 text-navy-700/40">
          <Home size={18} className="text-brand-500" />
          <Briefcase size={18} />
          <MapPin size={18} />
          <User size={18} />
        </div>
      </div>
    </div>
  );
}
