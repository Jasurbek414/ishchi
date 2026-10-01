import { BadgeCheck, Clock, House, ListChecks, Map, MapPin, Phone, Star, User, Wallet, Zap } from 'lucide-react';

// A drawing of the app's real worker home screen (greeting, availability switch, profession chips,
// nearby jobs, floating tab bar), in markup so it stays sharp and follows the brand colours. The
// listings are examples of what people post, not live data.
const JOBS = [
  {
    title: 'Santexnik kerak',
    urgent: true,
    place: 'Toshkent, Chilonzor',
    text: 'Oshxonadagi kranni almashtirish kerak, material bor.',
    pay: "150 000 so'm",
    duration: '3 soat',
    ago: '5 daq. oldin',
  },
  {
    title: 'Kafel yotqizish',
    place: 'Toshkent, Yunusobod',
    text: 'Hammom devori va poli. Tajribali usta kerak.',
    pay: "1 200 000 so'm",
    duration: '2 kun',
    ago: '1 soat oldin',
  },
];

const CHIPS = ['Hammasi', 'Santexnik', 'Kafelchi', 'Elektrik'];

// Status-bar glyphs drawn as filled shapes, the way phones draw them, rather than line icons.
function SignalBars() {
  return (
    <svg aria-hidden viewBox="0 0 17 11" className="h-[10px] w-[15px]" fill="currentColor">
      <rect x="0" y="7.5" width="3" height="3.5" rx="0.8" />
      <rect x="4.6" y="5" width="3" height="6" rx="0.8" />
      <rect x="9.2" y="2.5" width="3" height="8.5" rx="0.8" />
      <rect x="13.8" y="0" width="3" height="11" rx="0.8" opacity="0.3" />
    </svg>
  );
}

function WifiGlyph() {
  return (
    <svg aria-hidden viewBox="0 0 16 12" className="h-[10px] w-[14px]" fill="currentColor">
      <path d="M8 11.6 0.3 3.9a10.9 10.9 0 0 1 15.4 0L8 11.6Z" />
    </svg>
  );
}

function Battery({ level = 0.82 }) {
  return (
    <span aria-hidden className="flex items-center gap-[3px]">
      <span className="text-[10px] font-semibold tabular-nums">{Math.round(level * 100)}</span>
      <svg viewBox="0 0 25 12" className="h-[11px] w-[23px]">
        <rect x="0.6" y="0.6" width="21.4" height="10.8" rx="3.2" fill="none" stroke="currentColor" strokeOpacity="0.4" strokeWidth="1.1" />
        <rect x="2.2" y="2.2" width={18.2 * level} height="7.6" rx="1.9" fill="currentColor" />
        <path d="M23.3 4.1v3.8c.8-.3 1.3-1.1 1.3-1.9s-.5-1.6-1.3-1.9Z" fill="currentColor" fillOpacity="0.45" />
      </svg>
    </span>
  );
}

/** The selfie camera: a small punch-hole with a lens inside, as on current Android phones. */
function FrontCamera() {
  return (
    <span aria-hidden className="absolute left-1/2 top-[9px] z-20 grid h-[13px] w-[13px] -translate-x-1/2 place-items-center rounded-full bg-[#06080c] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]">
      <span className="grid h-[7px] w-[7px] place-items-center rounded-full bg-[radial-gradient(circle_at_35%_35%,#2b3a5c_0%,#0d1424_55%,#05070b_100%)]">
        <span className="ml-[-2px] mt-[-2px] h-[2px] w-[2px] rounded-full bg-sky-200/60" />
      </span>
    </span>
  );
}

function StatusBar() {
  return (
    <div className="relative flex h-8 items-center justify-between px-5 pt-1.5 text-[11px] font-semibold text-navy-900">
      <span className="tabular-nums">9:41</span>
      <FrontCamera />
      <span className="flex items-center gap-[5px]">
        <SignalBars />
        <WifiGlyph />
        <Battery />
      </span>
    </div>
  );
}

function JobCard({ job }) {
  return (
    <div className="rounded-[14px] border border-navy-900/[0.06] bg-white p-3 shadow-[0_1px_3px_rgba(14,25,48,0.06)]">
      <div className="flex items-start justify-between gap-2">
        <div className="text-[12.5px] font-bold leading-snug text-navy-900">{job.title}</div>
        <span className="shrink-0 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[8.5px] font-bold text-emerald-700">Ochiq</span>
      </div>
      {job.urgent && (
        <span className="mt-1.5 inline-flex items-center gap-0.5 rounded-full bg-red-50 px-1.5 py-0.5 text-[8.5px] font-bold text-red-600">
          <Zap size={9} strokeWidth={2.8} fill="currentColor" />
          Shoshilinch
        </span>
      )}
      <div className="mt-1 flex items-center gap-1 whitespace-nowrap text-[10px] text-navy-700/60">
        <MapPin size={10} strokeWidth={2.4} className="shrink-0" />
        <span className="truncate">{job.place}</span>
        <span className="ml-auto shrink-0">{job.ago}</span>
      </div>
      <p className="mt-1.5 line-clamp-2 text-[10.5px] leading-snug text-navy-800/80">{job.text}</p>
      <div className="mt-2 flex items-center gap-2.5 whitespace-nowrap text-[10px] text-navy-700/60">
        <span className="flex items-center gap-1 text-[11px] font-bold text-brand-500">
          <Wallet size={11} strokeWidth={2.4} />
          {job.pay}
        </span>
        <span className="flex items-center gap-0.5">
          <Clock size={10} strokeWidth={2.4} />
          {job.duration}
        </span>
      </div>
    </div>
  );
}

function TabBar() {
  const tabs = [
    [House, 'Bosh sahifa', true],
    [ListChecks, 'Buyurtmalar', false],
    [User, 'Profil', false],
  ];
  return (
    <div className="absolute inset-x-3 bottom-5 z-10 flex h-[50px] items-center gap-1 rounded-[20px] border border-white/60 bg-white/80 px-1.5 shadow-[0_8px_20px_rgba(14,25,48,0.10)] backdrop-blur-md">
      {tabs.map(([Icon, label, active]) => (
        <span
          key={label}
          className={`flex flex-1 flex-col items-center gap-0.5 rounded-[14px] py-1.5 text-[8px] ${
            active ? 'bg-brand-500/12 font-bold text-brand-500' : 'font-medium text-navy-700/55'
          }`}
        >
          <Icon size={15} strokeWidth={active ? 2.6 : 2} fill={active ? 'currentColor' : 'none'} fillOpacity={0.15} />
          {label}
        </span>
      ))}
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
    // Wide enough for the phone (272px) and two 170px chips that cross only its frame.
    <div className="relative mx-auto w-full max-w-[340px] py-8 sm:max-w-[586px]">
      <div aria-hidden className="absolute inset-x-10 top-12 bottom-6 rounded-[3rem] bg-brand-400/25 blur-3xl" />
      {/* Contact shadow under the phone, so it sits on the page rather than floating on it. */}
      <div aria-hidden className="absolute bottom-3 left-1/2 h-6 w-56 -translate-x-1/2 rounded-[50%] bg-navy-900/25 blur-xl" />

      <Floating
        className="left-0 top-[22%]"
        icon={BadgeCheck}
        iconClass="bg-brand-100 text-brand-500"
        title="Ishonchli usta"
        sub="Profili tekshirilgan"
      />
      <Floating
        className="right-0 top-[48%]"
        icon={Star}
        iconClass="bg-amber-100 text-amber-500"
        title="Reyting"
        sub="Ishdan so'ng baho"
      />
      <Floating
        className="left-0 bottom-[14%]"
        icon={Phone}
        iconClass="bg-emerald-100 text-emerald-600"
        title="Bevosita aloqa"
        sub="Vositachi va foizsiz"
      />

      <div className="relative z-10 mx-auto w-[272px]">
        {/* Side buttons: volume on the left, power on the right. */}
        <span aria-hidden className="absolute -left-[2px] top-[110px] h-9 w-[2px] rounded-l bg-navy-800" />
        <span aria-hidden className="absolute -left-[2px] top-[156px] h-9 w-[2px] rounded-l bg-navy-800" />
        <span aria-hidden className="absolute -right-[2px] top-[130px] h-14 w-[2px] rounded-r bg-navy-800" />

        <div
          role="img"
          aria-label="Ishchi ilovasining bosh ekrani: yaqin atrofdagi buyurtmalar"
          className="rounded-[2.6rem] bg-gradient-to-br from-[#3a4356] via-[#141a26] to-[#2a3242] p-[2px] shadow-[0_30px_60px_-12px_rgba(14,25,48,0.45),0_18px_36px_-18px_rgba(14,25,48,0.5)]"
        >
          <div className="rounded-[2.5rem] bg-black p-[3px]">
            <div className="relative h-[540px] overflow-hidden rounded-[2.3rem] bg-[#f6f8fb] font-sans">
              <StatusBar />

              <div className="flex items-center justify-between px-4 pb-2 pt-1">
                <span className="text-[17px] font-bold text-navy-900">Ishchi</span>
                <Map size={17} strokeWidth={2} className="text-navy-700/70" />
              </div>

              <div className="px-4">
                <div className="text-[15px] font-extrabold text-navy-900">Xayrli kun, Jasur!</div>
                <div className="text-[10.5px] text-navy-700/60">Toshkent, Chilonzor tumani</div>

                <div className="mt-3 flex items-center gap-2.5 rounded-[14px] border border-emerald-500/25 bg-emerald-500/10 px-3 py-2.5">
                  <BadgeCheck size={18} className="shrink-0 text-emerald-600" fill="currentColor" stroke="white" />
                  <div className="min-w-0 flex-1 leading-tight">
                    <div className="truncate text-[10.5px] font-bold text-emerald-700">Ishga tayyorsiz</div>
                    <div className="truncate text-[9px] text-emerald-700/80">Sizni topa olishadi</div>
                  </div>
                  <span aria-hidden className="relative h-[18px] w-8 shrink-0 rounded-full bg-emerald-600">
                    <span className="absolute right-[3px] top-[3px] h-3 w-3 rounded-full bg-white" />
                  </span>
                </div>

                <div className="mt-3 flex gap-1.5 overflow-hidden">
                  {CHIPS.map((c, i) => (
                    <span
                      key={c}
                      className={`whitespace-nowrap rounded-lg border px-2.5 py-1 text-[10px] font-semibold ${
                        i === 0 ? 'border-brand-500/20 bg-brand-100 text-brand-text' : 'border-navy-900/10 bg-white text-navy-700/75'
                      }`}
                    >
                      {c}
                    </span>
                  ))}
                </div>

                <div className="mb-2 mt-3.5 flex items-center justify-between">
                  <span className="truncate text-[12px] font-bold text-navy-900">Yaqin buyurtmalar</span>
                  <span className="shrink-0 text-[9.5px] font-semibold text-brand-500">Barchasi</span>
                </div>

                <div className="flex flex-col gap-2">
                  {JOBS.map((j) => (
                    <JobCard key={j.title} job={j} />
                  ))}
                </div>
              </div>

              <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#f6f8fb] via-[#f6f8fb]/80 to-transparent" />
              <TabBar />
              <span aria-hidden className="absolute bottom-1.5 left-1/2 z-10 h-1 w-24 -translate-x-1/2 rounded-full bg-navy-900/80" />

              {/* A faint diagonal glare, as on real glass. */}
              <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.16)_0%,rgba(255,255,255,0)_26%)]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
