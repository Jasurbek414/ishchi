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
  RefreshCw,
  Award,
  ToggleLeft,
  ToggleRight,
  Edit3,
  Lock,
  Check
} from 'lucide-react';

const API_BASE = '/api';

export default function App() {
  // Telegram WebApp
  const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : null;
  const tgUser = tg?.initDataUnsafe?.user;

  // Tabs: 'workers' | 'jobs' | 'post' | 'profile' | 'info'
  const [activeTab, setActiveTab] = useState('workers');

  // Auth & Profile
  const [authToken, setAuthToken] = useState(() => {
    try {
      return localStorage.getItem('tma_token') || '';
    } catch (_) {
      return '';
    }
  });
  const [userProfile, setUserProfile] = useState(null);
  const [isSwitchingRole, setIsSwitchingRole] = useState(false);
  const [showWorkerModal, setShowWorkerModal] = useState(false);

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

  // Worker Register / Edit Form State
  const [workerFormData, setWorkerFormData] = useState({
    firstName: tgUser?.first_name || '',
    lastName: tgUser?.last_name || '',
    professionId: '',
    regionId: '',
    districtId: '',
    experienceYears: 2,
    about: '',
    available: true
  });

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

  // Auth using Telegram initData
  useEffect(() => {
    if (tg?.initData) {
      fetch(`${API_BASE}/tma/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData: tg.initData })
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.accessToken) {
            setAuthToken(data.accessToken);
            try {
              localStorage.setItem('tma_token', data.accessToken);
            } catch (_) {}
            fetchProfile(data.accessToken);
          }
        })
        .catch((err) => console.warn('TMA auth error', err));
    }
  }, [tg?.initData]);

  // Load Bootstrap
  useEffect(() => {
    fetch(`${API_BASE}/tma/bootstrap`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setBootstrap(data);
          if (data.regions?.length > 0 && !selectedRegionId) {
            const defaultReg = data.regions.find((r) => r.name.toLowerCase().includes('toshkent')) || data.regions[0];
            setSelectedRegionId(String(defaultReg.id));
          }
        }
      })
      .catch((err) => console.error('Bootstrap error', err));
  }, []);

  // Fetch Profile
  const fetchProfile = (token = authToken) => {
    if (!token) return;
    fetch(`${API_BASE}/tma/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setUserProfile(data);
          setWorkerFormData({
            firstName: data.firstName || tgUser?.first_name || '',
            lastName: data.lastName || tgUser?.last_name || '',
            regionId: data.regionId ? String(data.regionId) : '',
            districtId: data.districtId ? String(data.districtId) : '',
            professionId: data.professionIds?.[0] ? String(data.professionIds[0]) : '',
            experienceYears: data.experienceYears || 2,
            about: data.about || '',
            available: data.available !== false
          });
        }
      })
      .catch((err) => console.warn('Fetch profile error', err));
  };

  useEffect(() => {
    if (authToken && !userProfile) {
      fetchProfile(authToken);
    }
  }, [authToken]);

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

  // Districts for worker form
  const workerFormRegion = useMemo(() => {
    return bootstrap.regions.find((r) => String(r.id) === String(workerFormData.regionId));
  }, [bootstrap.regions, workerFormData.regionId]);

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
      const headers = { 'Content-Type': 'application/json' };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      const res = await fetch(`${API_BASE}/tma/jobs`, {
        method: 'POST',
        headers,
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

  // Switch to Employer
  const handleSwitchToEmployer = async () => {
    if (!authToken) {
      alert("Telegram orqali tizimga kirilmoqda, biroz kuting...");
      return;
    }
    setIsSwitchingRole(true);
    triggerHaptic('medium');
    try {
      const res = await fetch(`${API_BASE}/tma/switch-role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          targetRole: 'EMPLOYER',
          firstName: userProfile?.firstName || tgUser?.first_name || 'Buyurtmachi'
        })
      });
      if (res.ok) {
        const authData = await res.json();
        if (authData?.accessToken) {
          setAuthToken(authData.accessToken);
          try {
            localStorage.setItem('tma_token', authData.accessToken);
          } catch (_) {}
          fetchProfile(authData.accessToken);
        }
        triggerHaptic('heavy');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSwitchingRole(false);
    }
  };

  // Switch to Worker (Save Worker Profile)
  const handleSaveWorkerProfile = async (e) => {
    e?.preventDefault();
    if (!authToken) {
      alert("Telegram orqali tizimga kirilmoqda, biroz kuting...");
      return;
    }
    if (!workerFormData.professionId) {
      alert("Iltimos, kasbingizni tanlang!");
      return;
    }
    setIsSwitchingRole(true);
    triggerHaptic('medium');
    try {
      const res = await fetch(`${API_BASE}/tma/switch-role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          targetRole: 'WORKER',
          firstName: workerFormData.firstName || tgUser?.first_name || 'Usta',
          lastName: workerFormData.lastName || tgUser?.last_name || '',
          professionIds: [Number(workerFormData.professionId)],
          regionId: workerFormData.regionId ? Number(workerFormData.regionId) : null,
          districtId: workerFormData.districtId ? Number(workerFormData.districtId) : null,
          experienceYears: Number(workerFormData.experienceYears) || 2,
          about: workerFormData.about || '',
          available: workerFormData.available
        })
      });

      if (res.ok) {
        const authData = await res.json();
        if (authData?.accessToken) {
          setAuthToken(authData.accessToken);
          try {
            localStorage.setItem('tma_token', authData.accessToken);
          } catch (_) {}
          fetchProfile(authData.accessToken);
        }
        setShowWorkerModal(false);
        triggerHaptic('heavy');
        fetchWorkers();
      } else {
        alert("Saqlashda xatolik yuz berdi");
      }
    } catch (e) {
      console.error(e);
      alert('Aloqa xatosi');
    } finally {
      setIsSwitchingRole(false);
    }
  };

  // Toggle Availability
  const handleToggleAvailability = async () => {
    if (!authToken) return;
    triggerHaptic('light');
    try {
      const res = await fetch(`${API_BASE}/tma/toggle-availability`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setUserProfile((prev) => (prev ? { ...prev, available: data.available } : prev));
        triggerHaptic('heavy');
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-24 text-slate-900">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          {/* User profile / greeting */}
          <div
            onClick={() => {
              triggerHaptic();
              setActiveTab('profile');
            }}
            className="flex items-center gap-2.5 min-w-0 cursor-pointer active:scale-95 transition-transform"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold text-base shadow-sm ring-2 ring-emerald-100 flex-shrink-0">
              {tgUser?.first_name ? tgUser.first_name[0].toUpperCase() : 'I'}
            </div>
            <div className="min-w-0">
              <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                <span>{userProfile?.role === 'WORKER' ? '🛠 Usta' : '👔 Buyurtmachi'}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              </div>
              <div className="text-sm font-bold text-slate-900 truncate">
                {tgUser?.first_name || 'Ishchi'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Quick role switch pill */}
            <button
              onClick={() => {
                triggerHaptic();
                setActiveTab('profile');
              }}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-full border transition-all flex items-center gap-1 ${
                userProfile?.role === 'WORKER'
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}
            >
              {userProfile?.role === 'WORKER' ? '🛠 Usta' : '👔 Ish beruvchi'}
            </button>

            {/* Region selector pill */}
            <button
              onClick={() => {
                triggerHaptic();
                setIsRegionModalOpen(true);
              }}
              className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-xs font-semibold rounded-full border border-slate-200/80 transition-all flex-shrink-0"
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span className="truncate max-w-[85px]">
                {currentRegion ? currentRegion.name : 'Viloyat'}
              </span>
            </button>
          </div>
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
                    setSelectedProfessionId(
                      String(prof.id) === selectedProfessionId ? '' : String(prof.id)
                    );
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

            {/* Sub-header info */}
            <div className="flex items-center justify-between text-xs text-slate-500 mb-3 px-1">
              <span>Topilgan mutaxassislar: <strong className="text-slate-800">{workers.length}</strong></span>
              <button
                onClick={() => {
                  setSelectedProfessionId('');
                  setSelectedDistrictId('');
                  setSearchQuery('');
                  fetchWorkers();
                }}
                className="text-emerald-600 font-semibold flex items-center gap-1 active:scale-95"
              >
                <RefreshCw className="w-3 h-3" /> Yangilash
              </button>
            </div>

            {/* Workers List */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs text-slate-400">Ustalar yuklanmoqda...</span>
              </div>
            ) : workers.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300 p-6">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <h3 className="font-bold text-slate-700 text-sm">Hozircha ustalar topilmadi</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  Tanlangan hudud yoki kasb bo'yicha usta yo'q. Qidiruv parametrlarini o'zgartirib ko'ring yoki birinchi bo'lib usta anketasini qo'shing.
                </p>
                <button
                  onClick={() => {
                    triggerHaptic();
                    setActiveTab('profile');
                    setShowWorkerModal(true);
                  }}
                  className="mt-4 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-sm hover:bg-emerald-700 transition-colors inline-flex items-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4" /> Usta sifatida ro'yxatdan o'tish
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {workers.map((worker) => (
                  <div
                    key={worker.id}
                    onClick={() => {
                      triggerHaptic();
                      setDetailWorker(worker);
                    }}
                    className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm hover:border-emerald-300 active:scale-[0.99] transition-all cursor-pointer relative"
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-base flex-shrink-0 relative overflow-hidden">
                        {worker.avatarUrl ? (
                          <img src={worker.avatarUrl} alt={worker.fullName} className="w-full h-full object-cover" />
                        ) : (
                          <span>{worker.fullName ? worker.fullName[0].toUpperCase() : 'U'}</span>
                        )}
                        {worker.available && (
                          <span className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h3 className="font-bold text-slate-900 text-sm truncate">{worker.fullName}</h3>
                          {worker.ratingAverage ? (
                            <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full text-xs font-bold flex-shrink-0">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              <span>{worker.ratingAverage.toFixed(1)}</span>
                            </div>
                          ) : null}
                        </div>

                        {/* Professions chips */}
                        <div className="flex flex-wrap gap-1 mt-1">
                          {worker.professions?.slice(0, 2).map((prof, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 bg-emerald-50 text-emerald-800 text-[11px] font-semibold rounded-md"
                            >
                              {prof}
                            </span>
                          ))}
                          {worker.professions?.length > 2 && (
                            <span className="text-[10px] text-slate-400 self-center">
                              +{worker.professions.length - 2}
                            </span>
                          )}
                        </div>

                        {/* Region & District */}
                        <div className="flex items-center gap-1 text-xs text-slate-500 mt-2">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span className="truncate">
                            {worker.regionName} {worker.districtName ? `• ${worker.districtName}` : ''}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Footer */}
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className={`font-semibold ${worker.available ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {worker.available ? '● Bugun bo\'sh' : '○ Hozir band'}
                      </span>
                      <div className="flex items-center gap-2">
                        {worker.phone && (
                          <a
                            href={`tel:${worker.phone}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              triggerHaptic('medium');
                            }}
                            className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-bold text-xs flex items-center gap-1 shadow-sm active:scale-95"
                          >
                            <Phone className="w-3 h-3" /> Bog'lanish
                          </a>
                        )}
                        <span className="text-slate-400 flex items-center">
                          <ChevronRight className="w-4 h-4" />
                        </span>
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
            {/* Top Stats Banner */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-4 rounded-2xl mb-4 shadow-sm relative overflow-hidden">
              <div className="relative z-10">
                <span className="text-[11px] uppercase tracking-wider font-semibold opacity-90">Tezkor buyurtmalar</span>
                <h3 className="font-extrabold text-lg mt-0.5">Yangi ishlar va buyurtmalar</h3>
                <p className="text-xs text-emerald-100 mt-1 max-w-xs">
                  Ish beruvchilar to'g'ridan-to'g'ri o'z e'lonlarini qoldirishgan. Darhol bog'laning!
                </p>
              </div>
              <Briefcase className="w-24 h-24 text-white/10 absolute -right-4 -bottom-4" />
            </div>

            {/* Jobs List */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs text-slate-400">Buyurtmalar yuklanmoqda...</span>
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300 p-6">
                <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <h3 className="font-bold text-slate-700 text-sm">Hozircha buyurtmalar yo'q</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  Tanlangan parametrlar bo'yicha buyurtma topilmadi. O'zingiz birinchi bo'lib e'lon bering.
                </p>
                <button
                  onClick={() => {
                    triggerHaptic();
                    setActiveTab('post');
                  }}
                  className="mt-4 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-sm hover:bg-emerald-700 transition-colors"
                >
                  Yangi e'lon berish
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    onClick={() => {
                      triggerHaptic();
                      setDetailJob(job);
                    }}
                    className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm hover:border-emerald-300 active:scale-[0.99] transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 text-[11px] font-bold rounded-md">
                            {job.professionName || 'Turli ishlar'}
                          </span>
                          {job.urgent && (
                            <span className="px-2 py-0.5 bg-red-50 text-red-600 text-[10px] font-bold rounded-md flex items-center gap-0.5">
                              <Flame className="w-3 h-3 fill-red-500 text-red-500" /> Shoshilinch
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-slate-900 text-sm line-clamp-1">{job.title}</h3>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{job.description}</p>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1 text-slate-500">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate max-w-[130px]">
                          {job.regionName} {job.districtName ? `• ${job.districtName}` : ''}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="font-extrabold text-emerald-600 text-sm">
                          {job.payment > 0 ? `${Number(job.payment).toLocaleString()} so'm` : 'Kelishilgan'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===================== TAB 3: POST JOB (E'LON BERISH) ===================== */}
        {activeTab === 'post' && (
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Yangi ish e'loni</h3>
                  <p className="text-xs text-slate-500">O'zingizga kerakli usta yoki ishchini tezda toping</p>
                </div>
              </div>

              {postSuccess ? (
                <div className="py-12 text-center">
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-base">E'lon muvaffaqiyatli qabul qilindi!</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    E'loningiz buyurtmalar ro'yxatida va Telegram kanalida e'lon qilinadi.
                  </p>
                </div>
              ) : (
                <form onSubmit={handlePostJob} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      E'lon sarlavhasi <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Masalan: Uyga santexnik usta kerak"
                      value={postForm.title}
                      onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Kasb / Mutaxassislik <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={postForm.professionId}
                      onChange={(e) => setPostForm({ ...postForm, professionId: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-emerald-500 focus:outline-none bg-white"
                    >
                      <option value="">Kasbni tanlang</option>
                      {bootstrap.professions.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Viloyat <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={postForm.regionId}
                        onChange={(e) => setPostForm({ ...postForm, regionId: e.target.value, districtId: '' })}
                        className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-emerald-500 focus:outline-none bg-white"
                      >
                        <option value="">Viloyat</option>
                        {bootstrap.regions.map((r) => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Tuman <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        disabled={!postForm.regionId}
                        value={postForm.districtId}
                        onChange={(e) => setPostForm({ ...postForm, districtId: e.target.value })}
                        className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-emerald-500 focus:outline-none bg-white disabled:opacity-50"
                      >
                        <option value="">Tuman</option>
                        {bootstrap.regions
                          .find((r) => String(r.id) === String(postForm.regionId))
                          ?.districts?.map((d) => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                          ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Taklif qilinadigan summa (so'm)</label>
                      <input
                        type="number"
                        placeholder="Masalan: 200000"
                        value={postForm.payment}
                        onChange={(e) => setPostForm({ ...postForm, payment: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Aloqa telefoni</label>
                      <input
                        type="tel"
                        placeholder="+998901234567"
                        value={postForm.contactPhone}
                        onChange={(e) => setPostForm({ ...postForm, contactPhone: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Ish tavsifi va talablar</label>
                    <textarea
                      rows={3}
                      placeholder="Ish nimalardan iborat, qachon boshlanadi..."
                      value={postForm.description}
                      onChange={(e) => setPostForm({ ...postForm, description: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-emerald-500 focus:outline-none resize-none"
                    ></textarea>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="urgentCheckbox"
                      checked={postForm.urgent}
                      onChange={(e) => setPostForm({ ...postForm, urgent: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded accent-emerald-600"
                    />
                    <label htmlFor="urgentCheckbox" className="text-xs font-bold text-slate-700 cursor-pointer">
                      🔥 Shoshilinch e'lon (ustalar tezroq e'tibor qaratadi)
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isPosting}
                    className="w-full mt-2 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-[0.99] text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isPosting ? 'E\'lon joylanmoqda...' : 'E\'lonni bepul joylash 🚀'}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* ===================== TAB 4: PROFILE & ROLE SWITCH ===================== */}
        {activeTab === 'profile' && (
          <div className="max-w-md mx-auto space-y-4">
            {/* User Main Card */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-extrabold text-xl shadow-md ring-4 ring-emerald-50 flex-shrink-0">
                  {userProfile?.fullName ? userProfile.fullName[0].toUpperCase() : (tgUser?.first_name ? tgUser.first_name[0].toUpperCase() : 'U')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-extrabold text-slate-900 text-base truncate">
                      {userProfile?.fullName || [tgUser?.first_name, tgUser?.last_name].filter(Boolean).join(' ') || 'Foydalanuvchi'}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    {tgUser?.username ? `@${tgUser.username}` : (userProfile?.phone ? userProfile.phone : 'Telegram hisob')}
                  </p>
                  <div className="mt-1.5 inline-flex items-center gap-1 px-2.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-full border border-blue-200">
                    <ShieldCheck className="w-3 h-3 text-blue-600" /> Telegram orqali tasdiqlangan
                  </div>
                </div>
              </div>

              {/* Role Switch Section */}
              <div className="mt-5 pt-4 border-t border-slate-100">
                <div className="text-xs font-bold text-slate-700 mb-2 flex items-center justify-between">
                  <span>Joriy rolingiz:</span>
                  <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                    userProfile?.role === 'WORKER' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {userProfile?.role === 'WORKER' ? '🛠 Usta / Ishchi' : '👔 Ish beruvchi / Buyurtmachi'}
                  </span>
                </div>

                {/* Role Switcher Tabs */}
                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-2xl">
                  <button
                    onClick={() => {
                      if (userProfile?.role === 'WORKER') {
                        handleSwitchToEmployer();
                      }
                    }}
                    disabled={isSwitchingRole}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      userProfile?.role !== 'WORKER'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <span>👔 Ish beruvchi</span>
                    {userProfile?.role !== 'WORKER' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                  </button>

                  <button
                    onClick={() => {
                      if (userProfile?.role !== 'WORKER') {
                        if (userProfile?.hasWorkerProfile) {
                          handleSaveWorkerProfile();
                        } else {
                          setShowWorkerModal(true);
                        }
                      }
                    }}
                    disabled={isSwitchingRole}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      userProfile?.role === 'WORKER'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <span>🛠 Usta / Ishchi</span>
                    {userProfile?.role === 'WORKER' && <Check className="w-3.5 h-3.5 text-amber-600" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Worker Status & Controls (when in WORKER role) */}
            {userProfile?.role === 'WORKER' && (
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm">Buyurtmalarni qabul qilish</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {userProfile.available ? '🟢 Siz "Bugun bo\'shman" ro\'yxatidasiz' : '⚪ Hozir yangi buyurtma qabul qilmaysiz'}
                    </p>
                  </div>
                  <button
                    onClick={handleToggleAvailability}
                    className={`p-1.5 rounded-full transition-colors ${
                      userProfile.available ? 'text-emerald-600' : 'text-slate-400'
                    }`}
                  >
                    {userProfile.available ? (
                      <ToggleRight className="w-9 h-9 fill-emerald-100" />
                    ) : (
                      <ToggleLeft className="w-9 h-9" />
                    )}
                  </button>
                </div>

                {/* Worker Details Card */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Kasb:</span>
                    <span className="font-bold text-slate-800">
                      {userProfile.professionNames?.join(', ') || 'Ko\'rsatilmagan'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Hudud:</span>
                    <span className="font-bold text-slate-800">
                      {userProfile.regionName} {userProfile.districtName ? `, ${userProfile.districtName}` : ''}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Tajriba:</span>
                    <span className="font-bold text-slate-800">
                      {userProfile.experienceYears || 1} yil
                    </span>
                  </div>
                  {userProfile.about && (
                    <div className="pt-2 border-t border-slate-200 text-xs">
                      <span className="text-slate-500 block mb-0.5">Tavsif:</span>
                      <p className="text-slate-700">{userProfile.about}</p>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setShowWorkerModal(true)}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Edit3 className="w-4 h-4 text-slate-600" /> Usta anketasini tahrirlash
                </button>
              </div>
            )}

            {/* Prompt to become a worker if in EMPLOYER role */}
            {userProfile?.role !== 'WORKER' && (
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-5 border border-amber-200">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold flex-shrink-0 shadow-sm">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-amber-900 text-sm">Usta sifatida pul toping</h4>
                    <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                      O'z kasbingiz va xizmatlaringiz bo'yicha anketani to'ldirib, minglab mijozlardan buyurtmalar qabul qiling!
                    </p>
                    <button
                      onClick={() => setShowWorkerModal(true)}
                      className="mt-3 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 active:scale-95 transition-transform"
                    >
                      <PlusCircle className="w-4 h-4" /> Usta bo'lish anketasi
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Security Info Card */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h4 className="font-extrabold text-slate-900 text-sm">Xavfsizlik va Himoya</h4>
              </div>

              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex items-start gap-2 p-2.5 bg-slate-50 rounded-xl">
                  <Lock className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-800">Telegram Kriptografik Himoyasi:</strong>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Sessiyangiz Telegram bot tokeni bilan HMAC-SHA256 algoritmi orqali tekshirilgan. Soxta profil ochish imkonsiz.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-2.5 bg-slate-50 rounded-xl">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-800">Bog'langan Telegram Chat ID:</strong>
                    <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                      ID: {userProfile?.telegramChatId || tgUser?.id || 'Mavjud'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 5: APP INFO ===================== */}
        {activeTab === 'info' && (
          <div className="max-w-md mx-auto space-y-4">
            <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-800 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden text-center">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
                <Sparkles className="w-9 h-9 text-emerald-200" />
              </div>
              <h2 className="text-xl font-extrabold">Ishchi Platformasi</h2>
              <p className="text-xs text-emerald-100 mt-1 max-w-xs mx-auto">
                O'zbekistondagi barcha ishchilar, ustalar va buyurtmachilar uchun qulay va tezkor ekotizim.
              </p>

              <div className="mt-5 flex flex-col gap-2">
                <a
                  href={bootstrap.appDownloadUrl}
                  onClick={() => triggerHaptic('medium')}
                  className="w-full py-3 bg-white hover:bg-emerald-50 active:scale-[0.99] text-emerald-800 font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all"
                >
                  <Download className="w-4 h-4" /> To'liq APK ilovani yuklab olish (v1.0.66)
                </a>

                <a
                  href={bootstrap.playStoreUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => triggerHaptic()}
                  className="w-full py-3 bg-emerald-950/40 hover:bg-emerald-950/60 active:scale-[0.99] text-white font-bold text-xs rounded-xl border border-white/20 flex items-center justify-center gap-2 transition-all"
                >
                  Google Play Store'da ko'rish
                </a>
              </div>
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

          {/* Profil va Rol almashtirish */}
          <button
            onClick={() => {
              triggerHaptic();
              setActiveTab('profile');
            }}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
              activeTab === 'profile' ? 'text-emerald-600 font-bold scale-105' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <User className="w-5 h-5" />
            <span className="text-[10px]">Profil</span>
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

      {/* ===================== WORKER REGISTER / EDIT MODAL ===================== */}
      {showWorkerModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl max-h-[90vh] overflow-y-auto p-5 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-slate-900 text-base">Usta anketasini to'ldirish</h3>
              </div>
              <button
                onClick={() => setShowWorkerModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveWorkerProfile} className="space-y-3.5 mt-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ism <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={workerFormData.firstName}
                    onChange={(e) => setWorkerFormData({ ...workerFormData, firstName: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Familiya</label>
                  <input
                    type="text"
                    value={workerFormData.lastName}
                    onChange={(e) => setWorkerFormData({ ...workerFormData, lastName: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Asosiy kasbingiz <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={workerFormData.professionId}
                  onChange={(e) => setWorkerFormData({ ...workerFormData, professionId: e.target.value })}
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-emerald-500 focus:outline-none bg-white"
                >
                  <option value="">Kasbni tanlang</option>
                  {bootstrap.professions.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Viloyat</label>
                  <select
                    value={workerFormData.regionId}
                    onChange={(e) => setWorkerFormData({ ...workerFormData, regionId: e.target.value, districtId: '' })}
                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-emerald-500 focus:outline-none bg-white"
                  >
                    <option value="">Tanlang</option>
                    {bootstrap.regions.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tuman</label>
                  <select
                    value={workerFormData.districtId}
                    disabled={!workerFormData.regionId}
                    onChange={(e) => setWorkerFormData({ ...workerFormData, districtId: e.target.value })}
                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-emerald-500 focus:outline-none bg-white disabled:opacity-50"
                  >
                    <option value="">Tanlang</option>
                    {workerFormRegion?.districts?.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tajribangiz (yil)</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={workerFormData.experienceYears}
                  onChange={(e) => setWorkerFormData({ ...workerFormData, experienceYears: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">O'zingiz haqingizda / Xizmatlar</label>
                <textarea
                  rows={3}
                  placeholder="Qanday ishlarni bajarasiz, qanday asboblaringiz bor..."
                  value={workerFormData.about}
                  onChange={(e) => setWorkerFormData({ ...workerFormData, about: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-emerald-500 focus:outline-none resize-none"
                ></textarea>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSwitchingRole}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                  {isSwitchingRole ? 'Saqlanmoqda...' : 'Usta anketasini tasdiqlash va saqlash ✅'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

            <div className="p-4 overflow-y-auto space-y-1">
              <button
                onClick={() => {
                  setSelectedRegionId('');
                  setSelectedDistrictId('');
                  setIsRegionModalOpen(false);
                  triggerHaptic();
                }}
                className={`w-full p-3 text-left rounded-xl text-xs font-semibold flex items-center justify-between ${
                  !selectedRegionId ? 'bg-emerald-50 text-emerald-800' : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <span>Barcha viloyatlar</span>
                {!selectedRegionId && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              </button>

              {bootstrap.regions.map((reg) => (
                <button
                  key={reg.id}
                  onClick={() => {
                    setSelectedRegionId(String(reg.id));
                    setSelectedDistrictId('');
                    setIsRegionModalOpen(false);
                    triggerHaptic();
                  }}
                  className={`w-full p-3 text-left rounded-xl text-xs font-semibold flex items-center justify-between ${
                    String(selectedRegionId) === String(reg.id)
                      ? 'bg-emerald-50 text-emerald-800'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span>{reg.name}</span>
                  {String(selectedRegionId) === String(reg.id) && (
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
                <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center text-white font-extrabold text-xl shadow-md">
                  {detailWorker.avatarUrl ? (
                    <img src={detailWorker.avatarUrl} alt="" className="w-full h-full object-cover rounded-2xl" />
                  ) : (
                    <span>{detailWorker.fullName ? detailWorker.fullName[0].toUpperCase() : 'U'}</span>
                  )}
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">{detailWorker.fullName}</h3>
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
