import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Briefcase,
  PlusCircle,
  MapPin,
  Search,
  Phone,
  Send,
  Star,
  CheckCircle2,
  SlidersHorizontal,
  ChevronRight,
  Download,
  Info,
  X,
  Share2,
  Sparkles,
  Flame,
  Calendar,
  DollarSign,
  User,
  ArrowRight,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

const API_BASE = '/api';

export default function App() {
  // Telegram WebApp
  const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : null;
  const tgUser = tg?.initDataUnsafe?.user;

  // Tabs: 'workers' | 'jobs' | 'post' | 'map' | 'info'
  const [activeTab, setActiveTab] = useState('workers');

  // Bootstrap data
  const [bootstrap, setBootstrap] = useState({
    professions: [],
    regions: [],
    totalWorkers: 0,
    totalJobs: 0,
    botUsername: '',
    appDownloadUrl: 'https://uzbishchi.uz/uploads/apk/ishchi.apk',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=uz.ecos.ishchi.app'
  });

  // Filters
  const [selectedRegionId, setSelectedRegionId] = useState('');
  const [selectedDistrictId, setSelectedDistrictId] = useState('');
  const [selectedProfessionId, setSelectedProfessionId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRegionModalOpen, setIsRegionModalOpen] = useState(false);

  // Data lists
  const [workers, setWorkers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);

  // Detail modals
  const [detailWorker, setDetailWorker] = useState(null);
  const [detailJob, setDetailJob] = useState(null);

  // Post Job Form State
  const [postForm, setPostForm] = useState({
    title: '',
    description: '',
    professionId: '',
    regionId: '',
    districtId: '',
    payment: '',
    contactPhone: tgUser?.phone_number || '',
    employerName: [tgUser?.first_name, tgUser?.last_name].filter(Boolean).join(' ') || '',
    urgent: false
  });
  const [isPosting, setIsPosting] = useState(false);
  const [postSuccess, setPostSuccess] = useState(false);

  // Haptic feedback helper
  const triggerHaptic = (type = 'light') => {
    try {
      tg?.HapticFeedback?.impactOccurred(type);
    } catch (_) {}
  };

  // Initialize Telegram WebApp
  useEffect(() => {
    if (tg) {
      try {
        tg.ready();
        tg.expand();
        tg.enableClosingConfirmation?.();
        if (tg.themeParams?.bg_color) {
          document.body.style.backgroundColor = tg.themeParams.bg_color;
        }
      } catch (e) {
        console.warn('Telegram WebApp init error', e);
      }
    }
  }, [tg]);

  // Load Bootstrap
  useEffect(() => {
    fetch(`${API_BASE}/tma/bootstrap`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setBootstrap(data);
          if (data.regions?.length > 0 && !selectedRegionId) {
            // Default to Tashkent or first region
            const defaultReg = data.regions.find((r) => r.name.toLowerCase().includes('toshkent')) || data.regions[0];
            setSelectedRegionId(String(defaultReg.id));
          }
        }
      })
      .catch((err) => console.error('Bootstrap error', err));
  }, []);

  // Fetch Workers
  const fetchWorkers = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedRegionId) params.append('regionId', selectedRegionId);
    if (selectedDistrictId) params.append('districtId', selectedDistrictId);
    if (selectedProfessionId) params.append('professionId', selectedProfessionId);
    if (searchQuery.trim()) params.append('search', searchQuery.trim());
    params.append('size', '30');

    fetch(`${API_BASE}/tma/workers?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setWorkers(data?.content || []);
      })
      .catch((err) => console.error('Workers error', err))
      .finally(() => setLoading(false));
  };

  // Fetch Jobs
  const fetchJobs = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedRegionId) params.append('regionId', selectedRegionId);
    if (selectedDistrictId) params.append('districtId', selectedDistrictId);
    if (selectedProfessionId) params.append('professionId', selectedProfessionId);
    if (searchQuery.trim()) params.append('search', searchQuery.trim());
    params.append('size', '30');

    fetch(`${API_BASE}/tma/jobs?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setJobs(data?.content || []);
      })
      .catch((err) => console.error('Jobs error', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (activeTab === 'workers') fetchWorkers();
    if (activeTab === 'jobs') fetchJobs();
  }, [activeTab, selectedRegionId, selectedDistrictId, selectedProfessionId, searchQuery]);

  // Selected Region Object
  const currentRegion = useMemo(() => {
    return bootstrap.regions.find((r) => String(r.id) === String(selectedRegionId));
  }, [bootstrap.regions, selectedRegionId]);

  // Handle Post Job Submit
  const handlePostJob = async (e) => {
    e.preventDefault();
    if (!postForm.title || !postForm.professionId || !postForm.regionId || !postForm.districtId) {
      alert("Iltimos, barcha majburiy maydonlarni to'ldiring!");
      return;
    }
    setIsPosting(true);
    triggerHaptic('medium');

    try {
      const res = await fetch(`${API_BASE}/tma/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...postForm,
          payment: postForm.payment ? Number(postForm.payment) : 0,
          professionId: Number(postForm.professionId),
          regionId: Number(postForm.regionId),
          districtId: Number(postForm.districtId)
        })
      });

      if (res.ok) {
        setPostSuccess(true);
        triggerHaptic('heavy');
        setPostForm({
          title: '',
          description: '',
          professionId: '',
          regionId: '',
          districtId: '',
          payment: '',
          contactPhone: tgUser?.phone_number || '',
          employerName: [tgUser?.first_name, tgUser?.last_name].filter(Boolean).join(' ') || '',
          urgent: false
        });
        setTimeout(() => {
          setPostSuccess(false);
          setActiveTab('jobs');
        }, 2000);
      } else {
        alert("E'lonni joylashda xatolik yuz berdi. Qaytadan urinib ko'ring.");
      }
    } catch (err) {
      console.error(err);
      alert('Aloqa xatosi yuz berdi.');
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-24 text-slate-900">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          {/* User profile / greeting */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-base shadow-sm ring-2 ring-emerald-100 flex-shrink-0">
              {tgUser?.first_name ? tgUser.first_name[0].toUpperCase() : 'I'}
            </div>
            <div className="min-w-0">
              <div className="text-xs text-slate-500 font-medium">Xush kelibsiz</div>
              <div className="text-sm font-bold text-slate-900 truncate">
                {tgUser?.first_name || 'Ishchi Foydalanuvchisi'}
              </div>
            </div>
          </div>

          {/* Region selector pill */}
          <button
            onClick={() => {
              triggerHaptic();
              setIsRegionModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-xs font-semibold rounded-full border border-slate-200/80 transition-all flex-shrink-0"
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            <span className="truncate max-w-[110px]">
              {currentRegion ? currentRegion.name : 'Barcha hududlar'}
            </span>
          </button>
        </div>

        {/* Search bar (visible in Workers and Jobs tabs) */}
        {(activeTab === 'workers' || activeTab === 'jobs') && (
          <div className="mt-3 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeTab === 'workers' ? "Usta, santexnik, kasb izlash..." : "Buyurtma, ish izlash..."}
              className="w-full pl-9 pr-8 py-2 bg-slate-100/90 text-sm rounded-xl border border-transparent focus:border-emerald-500 focus:bg-white focus:outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 px-4 pt-3">
        {/* ===================== TAB 1: WORKERS (USTALAR) ===================== */}
        {activeTab === 'workers' && (
          <div>
            {/* Horizontal Profession Chips */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 mb-3">
              <button
                onClick={() => {
                  triggerHaptic();
                  setSelectedProfessionId('');
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedProfessionId === ''
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                Barchasi ({bootstrap.totalWorkers})
              </button>
              {bootstrap.professions.map((prof) => (
                <button
                  key={prof.id}
                  onClick={() => {
                    triggerHaptic();
                    setSelectedProfessionId(selectedProfessionId === String(prof.id) ? '' : String(prof.id));
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedProfessionId === String(prof.id)
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {prof.name}
                </button>
              ))}
            </div>

            {/* Workers Count & Quick Refresh */}
            <div className="flex items-center justify-between mb-3 text-xs text-slate-500 px-1 font-medium">
              <span>Topilgan mutaxassislar: {workers.length} nafar</span>
              <button
                onClick={fetchWorkers}
                className="flex items-center gap-1 text-emerald-600 font-semibold hover:underline"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Yangilash
              </button>
            </div>

            {/* Workers List */}
            {loading && workers.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-sm">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-emerald-600" />
                Mutaxassislar yuklanmoqda...
              </div>
            ) : workers.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-slate-200/80 shadow-sm my-6">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h4 className="text-base font-bold text-slate-800">Mutaxassislar topilmadi</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Tanlangan hudud yoki kasb bo'yicha hozircha ishchilar yo'q. Filtrni o'zgartirib ko'ring.
                </p>
                <button
                  onClick={() => {
                    setSelectedProfessionId('');
                    setSelectedDistrictId('');
                    setSearchQuery('');
                  }}
                  className="mt-4 px-4 py-2 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl hover:bg-emerald-100 transition-colors"
                >
                  Filtrlarni tozalash
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {workers.map((w) => (
                  <div
                    key={w.id}
                    onClick={() => {
                      triggerHaptic();
                      setDetailWorker(w);
                    }}
                    className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-sm active:scale-[0.99] transition-all hover:border-emerald-200 cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white font-extrabold text-lg shadow-sm flex-shrink-0">
                        {w.avatarUrl ? (
                          <img src={w.avatarUrl} alt={w.fullName} className="w-full h-full rounded-2xl object-cover" />
                        ) : (
                          w.fullName?.[0]?.toUpperCase() || 'U'
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h3 className="font-bold text-slate-900 text-sm truncate flex items-center gap-1">
                            {w.fullName}
                            {w.verified && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 fill-blue-50 flex-shrink-0" />
                            )}
                          </h3>
                          {w.ratingAverage && (
                            <span className="flex items-center gap-0.5 text-xs font-bold text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded-md">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              {w.ratingAverage.toFixed(1)}
                            </span>
                          )}
                        </div>

                        {/* Professions tags */}
                        <div className="flex flex-wrap gap-1 mt-1">
                          {w.professions?.slice(0, 2).map((p, idx) => (
                            <span
                              key={idx}
                              className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md"
                            >
                              {p}
                            </span>
                          ))}
                          {w.professions?.length > 2 && (
                            <span className="text-[10px] text-slate-400 self-center">
                              +{w.professions.length - 2}
                            </span>
                          )}
                        </div>

                        {/* Location and experience */}
                        <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                          <span className="flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {w.regionName} {w.districtName ? `, ${w.districtName}` : ''}
                          </span>
                          {w.experienceYears && (
                            <span>{w.experienceYears} yil tajriba</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="text-xs text-slate-500">
                        {w.available ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Bugun bo'sh
                          </span>
                        ) : (
                          <span className="text-slate-400">Band</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {w.phone && (
                          <a
                            href={`tel:${w.phone}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              triggerHaptic('medium');
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-sm active:bg-emerald-700 transition-colors"
                          >
                            <Phone className="w-3 h-3" /> Qo'ng'iroq
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===================== TAB 2: JOBS (BUYURTMALAR) ===================== */}
        {activeTab === 'jobs' && (
          <div>
            {/* Header info */}
            <div className="flex items-center justify-between mb-3 text-xs text-slate-500 px-1 font-medium">
              <span>Faol e'lonlar: {jobs.length} ta</span>
              <button
                onClick={fetchJobs}
                className="flex items-center gap-1 text-emerald-600 font-semibold hover:underline"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Yangilash
              </button>
            </div>

            {loading && jobs.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-sm">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-emerald-600" />
                Buyurtmalar yuklanmoqda...
              </div>
            ) : jobs.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-slate-200/80 shadow-sm my-6">
                <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h4 className="text-base font-bold text-slate-800">Buyurtmalar topilmadi</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Hozircha ushbu hududda yangi ishlar yo'q. Birinchi bo'lib o'zingiz buyurtma qo'shishingiz mumkin!
                </p>
                <button
                  onClick={() => {
                    triggerHaptic();
                    setActiveTab('post');
                  }}
                  className="mt-4 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-sm hover:bg-emerald-700 transition-colors"
                >
                  + E'lon joylashtirish
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    onClick={() => {
                      triggerHaptic();
                      setDetailJob(job);
                    }}
                    className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-sm active:scale-[0.99] transition-all hover:border-emerald-200 cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-1">
                          {job.urgent && (
                            <span className="flex items-center gap-0.5 px-2 py-0.5 bg-rose-50 text-rose-600 font-bold text-[10px] rounded-md">
                              <Flame className="w-3 h-3 text-rose-500" /> Tezkor
                            </span>
                          )}
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-semibold text-[11px] rounded-md truncate max-w-[140px]">
                            {job.professionName || 'Turli ishlar'}
                          </span>
                        </div>
                        <h3 className="font-bold text-slate-900 text-sm line-clamp-1">{job.title}</h3>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1">{job.description}</p>
                      </div>

                      {/* Payment */}
                      <div className="text-right flex-shrink-0">
                        <div className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg">
                          {job.payment > 0 ? `${Number(job.payment).toLocaleString()} so'm` : 'Kelishilgan'}
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center gap-1 truncate max-w-[200px]">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {job.regionName} {job.districtName ? `, ${job.districtName}` : ''}
                      </span>
                      {job.contactPhone && (
                        <a
                          href={`tel:${job.contactPhone}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerHaptic('medium');
                          }}
                          className="flex items-center gap-1 text-emerald-600 font-bold hover:underline"
                        >
                          <Phone className="w-3 h-3" /> Bog'lanish
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===================== TAB 3: POST JOB (E'LON BERISH) ===================== */}
        {activeTab === 'post' && (
          <div className="max-w-lg mx-auto bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <PlusCircle className="w-5 h-5 text-emerald-600" />
              <div>
                <h2 className="font-bold text-slate-900 text-base">Buyurtma / Ish joylashtirish</h2>
                <p className="text-xs text-slate-500">Usta yoki ishchi topish uchun ma'lumotlarni kiriting</p>
              </div>
            </div>

            {postSuccess ? (
              <div className="py-12 text-center">
                <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-3 animate-bounce" />
                <h3 className="text-lg font-bold text-slate-900">E'loningiz qabul qilindi!</h3>
                <p className="text-xs text-slate-500 mt-1">
                  E'lon platformada chop etildi va tez orada ustalar siz bilan bog'lanishadi.
                </p>
              </div>
            ) : (
              <form onSubmit={handlePostJob} className="space-y-3.5">
                {/* Profession */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kerakli kasb / Mutaxassislik <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={postForm.professionId}
                    onChange={(e) => setPostForm({ ...postForm, professionId: e.target.value })}
                    required
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">Kasbni tanlang...</option>
                    {bootstrap.professions.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Region & District */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Viloyat <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={postForm.regionId}
                      onChange={(e) => {
                        setPostForm({ ...postForm, regionId: e.target.value, districtId: '' });
                      }}
                      required
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="">Viloyat...</option>
                      {bootstrap.regions.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tuman / Shahar <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={postForm.districtId}
                      onChange={(e) => setPostForm({ ...postForm, districtId: e.target.value })}
                      required
                      disabled={!postForm.regionId}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                    >
                      <option value="">Tuman...</option>
                      {bootstrap.regions
                        .find((r) => String(r.id) === String(postForm.regionId))
                        ?.districts?.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Buyurtma sarlavhasi <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={postForm.title}
                    onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                    placeholder="Masalan: Kafel yotqizish kerak, 40 kv.m"
                    required
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Qo'shimcha tavsif</label>
                  <textarea
                    rows={3}
                    value={postForm.description}
                    onChange={(e) => setPostForm({ ...postForm, description: e.target.value })}
                    placeholder="Ish haqida batafsil ma'lumot, manzil mo'ljali..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Payment & Phone */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Taklif narxi (so'm)</label>
                    <input
                      type="number"
                      value={postForm.payment}
                      onChange={(e) => setPostForm({ ...postForm, payment: e.target.value })}
                      placeholder="Masalan: 300000"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Telefon raqamingiz <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={postForm.contactPhone}
                      onChange={(e) => setPostForm({ ...postForm, contactPhone: e.target.value })}
                      placeholder="+998 90 123 45 67"
                      required
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Urgent toggle */}
                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={postForm.urgent}
                    onChange={(e) => setPostForm({ ...postForm, urgent: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                  />
                  <span className="text-xs font-bold text-rose-600 flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5" /> Shoshilinch buyurtma (tezkor ijrochi kerak)
                  </span>
                </label>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isPosting}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
                >
                  {isPosting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Joylanmoqda...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" /> E'lonni joylashtirish
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {/* ===================== TAB 4: MAP & REGIONS (XARITA) ===================== */}
        {activeTab === 'map' && (
          <div>
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-4 text-white shadow-md mb-4">
              <h2 className="text-base font-bold flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-200" /> O'zbekiston viloyatlari
              </h2>
              <p className="text-xs text-emerald-100 mt-1">
                Kerakli viloyatni tanlang va o'sha yerdagi barcha ishchilar va buyurtmalarni ko'ring.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {bootstrap.regions.map((reg) => (
                <div
                  key={reg.id}
                  onClick={() => {
                    triggerHaptic();
                    setSelectedRegionId(String(reg.id));
                    setSelectedDistrictId('');
                    setActiveTab('workers');
                  }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    String(selectedRegionId) === String(reg.id)
                      ? 'bg-emerald-50/80 border-emerald-500 shadow-sm'
                      : 'bg-white border-slate-200/80 hover:border-emerald-300'
                  }`}
                >
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-900 text-sm truncate">{reg.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {reg.districts?.length || 0} ta tuman va shahar
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===================== TAB 5: APP INFO & DOWNLOAD ===================== */}
        {activeTab === 'info' && (
          <div className="space-y-4 max-w-lg mx-auto">
            {/* Promo Card */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-5 text-white shadow-lg relative overflow-hidden">
              <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-emerald-500/20 blur-2xl"></div>
              <div className="relative z-10">
                <span className="px-2.5 py-1 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[11px] font-bold rounded-full">
                  Mobil Ilova
                </span>
                <h2 className="text-lg font-extrabold mt-2">Ishchi Android Ilovasi</h2>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  To'liq xarita, tezkor bildirishnomalar va barcha imkoniyatlardan foydalanish uchun rasmiy ilovani yuklab oling.
                </p>

                <div className="mt-4 flex flex-col gap-2">
                  <a
                    href={bootstrap.appDownloadUrl}
                    download="ishchi.apk"
                    onClick={() => triggerHaptic('medium')}
                    className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.99] text-white text-xs font-bold rounded-xl shadow flex items-center justify-center gap-2 transition-all"
                  >
                    <Download className="w-4 h-4" /> APK faylni to'g'ridan-to'g'ri yuklab olish
                  </a>
                  <a
                    href={bootstrap.playStoreUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => triggerHaptic('light')}
                    className="w-full py-2.5 bg-white/10 hover:bg-white/20 active:scale-[0.99] text-white text-xs font-bold rounded-xl border border-white/20 flex items-center justify-center gap-2 transition-all"
                  >
                    Google Play Market orqali ochish
                  </a>
                </div>
              </div>
            </div>

            {/* About platform */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-3">
              <h3 className="font-bold text-slate-900 text-sm">Platforma haqida</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                "Ishchi" — O'zbekiston bo'ylab ish beruvchi va ishchini bevosita, vositachisiz bog'laydigan bepul platforma.
                Kunlik ishlar, malakali ustalar, santexnik, elektrik, quruvchilar va barcha xizmatlar.
              </p>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-center">
                <div className="p-2.5 bg-slate-50 rounded-xl">
                  <div className="text-lg font-black text-emerald-600">{bootstrap.totalWorkers}+</div>
                  <div className="text-[11px] text-slate-500 font-medium">Ustalar</div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl">
                  <div className="text-lg font-black text-teal-600">{bootstrap.totalJobs}+</div>
                  <div className="text-[11px] text-slate-500 font-medium">Buyurtmalar</div>
                </div>
              </div>
            </div>

            {/* Support */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900">Yordam va Aloqa</h4>
                <p className="text-[11px] text-slate-500">Savollar yoki takliflar bo'yicha bog'laning</p>
              </div>
              <a
                href="https://t.me/uzbishchi_support"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                Telegram Support
              </a>
            </div>
          </div>
        )}
      </main>

      {/* ===================== BOTTOM NAVIGATION ===================== */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/80 px-2 py-1.5 safe-area-pb">
        <div className="flex items-center justify-around max-w-md mx-auto">
          {/* Ustalar */}
          <button
            onClick={() => {
              triggerHaptic();
              setActiveTab('workers');
            }}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
              activeTab === 'workers' ? 'text-emerald-600 font-bold scale-105' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[10px]">Ustalar</span>
          </button>

          {/* Buyurtmalar */}
          <button
            onClick={() => {
              triggerHaptic();
              setActiveTab('jobs');
            }}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
              activeTab === 'jobs' ? 'text-emerald-600 font-bold scale-105' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Briefcase className="w-5 h-5" />
            <span className="text-[10px]">Buyurtmalar</span>
          </button>

          {/* E'lon berish (Center Accent) */}
          <button
            onClick={() => {
              triggerHaptic('medium');
              setActiveTab('post');
            }}
            className="flex flex-col items-center gap-0.5 -mt-4"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 active:scale-95 transition-transform">
              <PlusCircle className="w-6 h-6" />
            </div>
            <span className={`text-[10px] ${activeTab === 'post' ? 'text-emerald-600 font-bold' : 'text-slate-500'}`}>
              E'lon berish
            </span>
          </button>

          {/* Xarita */}
          <button
            onClick={() => {
              triggerHaptic();
              setActiveTab('map');
            }}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
              activeTab === 'map' ? 'text-emerald-600 font-bold scale-105' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <MapPin className="w-5 h-5" />
            <span className="text-[10px]">Viloyatlar</span>
          </button>

          {/* Ilova */}
          <button
            onClick={() => {
              triggerHaptic();
              setActiveTab('info');
            }}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
              activeTab === 'info' ? 'text-emerald-600 font-bold scale-105' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Download className="w-5 h-5" />
            <span className="text-[10px]">Ilova</span>
          </button>
        </div>
      </nav>

      {/* ===================== REGION SELECT MODAL ===================== */}
      {isRegionModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">Hududni tanlang</h3>
              <button
                onClick={() => setIsRegionModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-2 overflow-y-auto flex-1 space-y-1">
              <button
                onClick={() => {
                  setSelectedRegionId('');
                  setSelectedDistrictId('');
                  setIsRegionModalOpen(false);
                  triggerHaptic();
                }}
                className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                  selectedRegionId === '' ? 'bg-emerald-50 text-emerald-700' : 'hover:bg-slate-50 text-slate-800'
                }`}
              >
                Barcha O'zbekiston hududlari
              </button>

              {bootstrap.regions.map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    setSelectedRegionId(String(r.id));
                    setSelectedDistrictId('');
                    setIsRegionModalOpen(false);
                    triggerHaptic();
                  }}
                  className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                    String(selectedRegionId) === String(r.id)
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <span>{r.name}</span>
                  {String(selectedRegionId) === String(r.id) && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===================== WORKER DETAIL MODAL ===================== */}
      {detailWorker && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl max-h-[90vh] overflow-y-auto p-5 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white font-extrabold text-xl shadow-md">
                  {detailWorker.avatarUrl ? (
                    <img src={detailWorker.avatarUrl} alt="" className="w-full h-full rounded-2xl object-cover" />
                  ) : (
                    detailWorker.fullName?.[0]?.toUpperCase() || 'U'
                  )}
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-1.5">
                    {detailWorker.fullName}
                    {detailWorker.verified && (
                      <CheckCircle2 className="w-4 h-4 text-blue-500 fill-blue-50" />
                    )}
                  </h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {detailWorker.regionName} {detailWorker.districtName ? `, ${detailWorker.districtName}` : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDetailWorker(null)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-1.5 mt-4">
              {detailWorker.professions?.map((p, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-lg"
                >
                  {p}
                </span>
              ))}
              {detailWorker.experienceYears && (
                <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-lg">
                  {detailWorker.experienceYears} yil tajriba
                </span>
              )}
            </div>

            {/* Bio */}
            {detailWorker.about && (
              <div className="mt-4 pt-3 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-700 mb-1">Mutaxassis haqida:</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{detailWorker.about}</p>
              </div>
            )}

            {/* Direct contact action */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex gap-2">
              {detailWorker.phone ? (
                <a
                  href={`tel:${detailWorker.phone}`}
                  onClick={() => triggerHaptic('medium')}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-xs rounded-xl shadow flex items-center justify-center gap-2"
                >
                  <Phone className="w-4 h-4" /> Qo'ng'iroq qilish ({detailWorker.phone})
                </a>
              ) : (
                <div className="text-center w-full text-xs text-slate-400">Raqam ko'rsatilmagan</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================== JOB DETAIL MODAL ===================== */}
      {detailJob && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl max-h-[90vh] overflow-y-auto p-5 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 text-[11px] font-bold rounded-md">
                  {detailJob.professionName || 'Turli ishlar'}
                </span>
                <h3 className="font-extrabold text-slate-900 text-base mt-2">{detailJob.title}</h3>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {detailJob.regionName} {detailJob.districtName ? `, ${detailJob.districtName}` : ''}
                </p>
              </div>
              <button
                onClick={() => setDetailJob(null)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Price badge */}
            <div className="mt-4 p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl flex items-center justify-between">
              <span className="text-xs text-emerald-800 font-semibold">Taklif qilinayotgan summa:</span>
              <span className="text-base font-extrabold text-emerald-700">
                {detailJob.payment > 0 ? `${Number(detailJob.payment).toLocaleString()} so'm` : 'Kelishilgan'}
              </span>
            </div>

            {/* Description */}
            <div className="mt-4">
              <h4 className="text-xs font-bold text-slate-700 mb-1">Batafsil tavsif:</h4>
              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{detailJob.description}</p>
            </div>

            {/* Contact Action */}
            <div className="mt-6 pt-4 border-t border-slate-100">
              {detailJob.contactPhone ? (
                <a
                  href={`tel:${detailJob.contactPhone}`}
                  onClick={() => triggerHaptic('medium')}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-xs rounded-xl shadow flex items-center justify-center gap-2"
                >
                  <Phone className="w-4 h-4" /> Ish beruvchiga qo'ng'iroq ({detailJob.contactPhone})
                </a>
              ) : (
                <div className="text-center text-xs text-slate-400">Aloqa ma'lumoti mavjud emas</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
