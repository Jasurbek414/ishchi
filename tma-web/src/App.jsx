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
  Check,
  Camera,
  Trash2,
  Image as ImageIcon
} from 'lucide-react';

const API_BASE = '/api';

export default function App() {
  // Telegram WebApp
  const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : null;
  const tgUser = tg?.initDataUnsafe?.user;

  // Tabs: 'workers' | 'jobs' | 'post' | 'profile' | 'info'
  const [activeTab, setActiveTab] = useState('workers');

  // Auth & Profile
  const storageKey = tgUser?.id ? `tma_token_${tgUser.id}` : 'tma_token';

  const [authToken, setAuthToken] = useState(() => {
    try {
      const key = tgUser?.id ? `tma_token_${tgUser.id}` : 'tma_token';
      return localStorage.getItem(key) || '';
    } catch (_) {
      return '';
    }
  });
  const [userProfile, setUserProfile] = useState(null);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);

  const PRESET_AVATARS = [
    { id: 'worker_1', name: 'Quruvchi / Usta', url: '/assets/avatars/avatar_worker_1.png' },
    { id: 'worker_2', name: 'Usta / Duradgor', url: '/assets/avatars/avatar_worker_2.png' },
    { id: 'electrician', name: 'Elektrik', url: '/assets/avatars/avatar_electrician.png' },
    { id: 'painter', name: 'Pardozchi', url: '/assets/avatars/avatar_painter.png' },
    { id: 'mechanic', name: 'Avtochilanar', url: '/assets/avatars/avatar_mechanic.png' },
    { id: 'driver', name: 'Haydovchi', url: '/assets/avatars/avatar_driver.png' },
    { id: 'chef', name: 'Oshpaz', url: '/assets/avatars/avatar_chef.png' },
    { id: 'tailor', name: 'Tikuvchi', url: '/assets/avatars/avatar_tailor.png' },
    { id: 'businessman', name: 'Ish beruvchi (Erkak)', url: '/assets/avatars/avatar_businessman.png' },
    { id: 'businesswoman', name: 'Ish beruvchi (Ayol)', url: '/assets/avatars/avatar_businesswoman.png' },
    { id: 'young_man', name: 'Yordamchi', url: '/assets/avatars/avatar_young_man.png' },
    { id: 'neutral', name: 'Neytral', url: '/assets/avatars/avatar_neutral.png' },
  ];
  const [isSwitchingRole, setIsSwitchingRole] = useState(false);
  const [showWorkerModal, setShowWorkerModal] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [emergencyWorkers, setEmergencyWorkers] = useState([]);
  const [emergencyLoading, setEmergencyLoading] = useState(false);
  const [emergencyCategory, setEmergencyCategory] = useState('');

  // Onboarding state
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1); // 1=phone/otp/password, 2=role, 3=location/profile
  const [onboardingRole, setOnboardingRole] = useState('EMPLOYER'); // 'WORKER' | 'EMPLOYER'
  const [otpSent, setOtpSent] = useState(false);
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [onboardingForm, setOnboardingForm] = useState({
    phone: '+998',
    code: '',
    password: '',
    firstName: tgUser?.first_name || '',
    lastName: tgUser?.last_name || '',
    regionId: '',
    districtId: '',
    professionId: '',
    experienceYears: 2,
    about: ''
  });
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    if (otpCountdown > 0) {
      const timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCountdown]);

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
              localStorage.setItem(storageKey, data.accessToken);
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
      .then((res) => {
        if (res.status === 401) {
          try { localStorage.removeItem(storageKey); } catch (_) {}
          setAuthToken('');
          setUserProfile(null);
          return null;
        }
        return res.ok ? res.json() : null;
      })
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
          // Show onboarding for new users
          if (!data.isRegistered) {
            setOnboardingForm((prev) => ({
              ...prev,
              phone: prev.phone && prev.phone.length > 4 ? prev.phone : (data.phone && !data.phone.startsWith('+998TG') ? data.phone : '+998'),
              firstName: prev.firstName || data.firstName || tgUser?.first_name || '',
              lastName: prev.lastName || data.lastName || tgUser?.last_name || '',
              regionId: prev.regionId || (data.regionId ? String(data.regionId) : ''),
              districtId: prev.districtId || (data.districtId ? String(data.districtId) : ''),
              professionId: prev.professionId || (data.professionIds?.[0] ? String(data.professionIds[0]) : ''),
              experienceYears: prev.experienceYears || 2,
              about: prev.about || ''
            }));
            setOnboardingStep(1);
            setShowOnboarding(true);
          } else {
            setShowOnboarding(false);
          }
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

  // Fetch Emergency Workers
  const fetchEmergencyWorkers = (categoryKeyword = '') => {
    setEmergencyLoading(true);
    setEmergencyCategory(categoryKeyword);
    const params = new URLSearchParams();
    params.append('emergency', 'true');
    if (categoryKeyword) params.append('search', categoryKeyword);
    params.append('size', '50');

    fetch(`${API_BASE}/tma/workers?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setEmergencyWorkers(data?.content || []);
      })
      .catch((err) => console.error('Emergency workers error', err))
      .finally(() => setEmergencyLoading(false));
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
            localStorage.setItem(storageKey, authData.accessToken);
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

  // Upload avatar from device gallery
  const handleUploadAvatarFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !authToken) return;
    setIsUpdatingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_BASE}/tma/avatar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setUserProfile(data);
        setShowAvatarModal(false);
        triggerHaptic('heavy');
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || 'Rasm yuklashda xatolik yuz berdi');
      }
    } catch (err) {
      alert('Rasm yuklashda xatolik yuz berdi');
    } finally {
      setIsUpdatingAvatar(false);
      if (e.target) e.target.value = '';
    }
  };

  // Select preset avatar
  const handleSelectPresetAvatar = async (presetUrl) => {
    if (!authToken) return;
    setIsUpdatingAvatar(true);
    try {
      const res = await fetch(`${API_BASE}/tma/avatar/preset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ avatarUrl: presetUrl }),
      });
      if (res.ok) {
        const data = await res.json();
        setUserProfile(data);
        setShowAvatarModal(false);
        triggerHaptic('medium');
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || 'Avatar tanlashda xatolik');
      }
    } catch (err) {
      alert('Avatar tanlashda xatolik');
    } finally {
      setIsUpdatingAvatar(false);
    }
  };

  // Delete avatar
  const handleDeleteAvatar = async () => {
    if (!authToken) return;
    setIsUpdatingAvatar(true);
    try {
      const res = await fetch(`${API_BASE}/tma/avatar`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUserProfile(data);
        setShowAvatarModal(false);
        triggerHaptic('medium');
      }
    } catch (err) {
      console.warn('Delete avatar error', err);
    } finally {
      setIsUpdatingAvatar(false);
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
            localStorage.setItem(storageKey, authData.accessToken);
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

  // ===== ONBOARDING HANDLERS =====
  const handleSendOtp = async () => {
    let raw = onboardingForm.phone.trim();
    if (!raw.startsWith('+')) raw = '+' + raw;
    if (!/^\+998\d{9}$/.test(raw)) {
      alert("Iltimos, telefon raqamni to'g'ri kiriting (+998XXXXXXXXX)");
      return;
    }
    setIsSendingOtp(true);
    triggerHaptic('medium');
    try {
      const res = await fetch(`${API_BASE}/tma/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ phone: raw })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        if (data.existingUser) {
          setIsExistingUser(true);
          alert(data.message || "Ushbu raqam allaqachon mavjud. Parolingizni kiriting.");
        } else {
          setOtpSent(true);
          setIsExistingUser(false);
          setOtpCountdown(60);
          triggerHaptic('heavy');
          alert(data.message || "Tasdiqlash kodi Telegram botingizga yuborildi!");
        }
      } else {
        alert(data.message || "Kodni yuborishda xatolik yuz berdi");
      }
    } catch (e) {
      console.error(e);
      alert('Aloqa xatosi yuz berdi');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleLinkExisting = async () => {
    if (!onboardingForm.password || onboardingForm.password.length < 6) {
      alert("Iltimos, parolingizni kiriting (kamida 6 ta belgi)");
      return;
    }
    setIsRegistering(true);
    triggerHaptic('medium');
    try {
      let raw = onboardingForm.phone.trim();
      if (!raw.startsWith('+')) raw = '+' + raw;
      const res = await fetch(`${API_BASE}/tma/link-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ phone: raw, password: onboardingForm.password })
      });
      if (res.ok) {
        const authData = await res.json();
        if (authData?.accessToken) {
          setAuthToken(authData.accessToken);
          try { localStorage.setItem(storageKey, authData.accessToken); } catch (_) {}
          fetchProfile(authData.accessToken);
        }
        setShowOnboarding(false);
        triggerHaptic('heavy');
        alert("Akkountingiz muvaffaqiyatli ulandi!");
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || "Parol noto'g'ri");
      }
    } catch (e) {
      console.error(e);
      alert('Aloqa xatosi yuz berdi');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleCompleteOnboarding = async () => {
    if (!authToken) return;
    if (!onboardingForm.phone || !onboardingForm.code || !onboardingForm.password) {
      alert("Telefon raqam, tasdiqlash kodi va parolni to'ldiring!");
      setOnboardingStep(1);
      return;
    }
    if (!onboardingForm.regionId || !onboardingForm.districtId) {
      alert("Iltimos, viloyat va tumanni tanlang!");
      return;
    }
    if (onboardingRole === 'WORKER' && !onboardingForm.professionId) {
      alert("Iltimos, kasbingizni tanlang!");
      return;
    }
    setIsRegistering(true);
    triggerHaptic('medium');
    try {
      let raw = onboardingForm.phone.trim();
      if (!raw.startsWith('+')) raw = '+' + raw;
      const body = {
        role: onboardingRole,
        phone: raw,
        password: onboardingForm.password,
        code: onboardingForm.code.trim(),
        firstName: onboardingForm.firstName || tgUser?.first_name || '',
        lastName: onboardingForm.lastName || tgUser?.last_name || '',
        regionId: Number(onboardingForm.regionId),
        districtId: Number(onboardingForm.districtId),
        professionIds: onboardingRole === 'WORKER' && onboardingForm.professionId
          ? [Number(onboardingForm.professionId)]
          : null,
        experienceYears: onboardingRole === 'WORKER' ? Number(onboardingForm.experienceYears) || 2 : null,
        about: onboardingForm.about || null
      };
      const res = await fetch(`${API_BASE}/tma/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        const authData = await res.json();
        if (authData?.accessToken) {
          setAuthToken(authData.accessToken);
          try { localStorage.setItem(storageKey, authData.accessToken); } catch (_) {}
          fetchProfile(authData.accessToken);
        }
        setShowOnboarding(false);
        triggerHaptic('heavy');
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err?.message || "Ro'yxatdan o'tishda xatolik yuz berdi");
      }
    } catch (e) {
      console.error(e);
      alert('Aloqa xatosi yuz berdi');
    } finally {
      setIsRegistering(false);
    }
  };

  // Onboarding: districts for selected region
  const onboardingRegionDistricts = useMemo(() => {
    const reg = bootstrap.regions.find(r => String(r.id) === String(onboardingForm.regionId));
    return reg?.districts || [];
  }, [bootstrap.regions, onboardingForm.regionId]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-28 text-slate-900 font-sans">

      {/* ========== ONBOARDING MODAL ========== */}
      {showOnboarding && (
        <div className="fixed inset-0 z-[200] bg-white flex flex-col overflow-hidden">
          {/* Progress bar */}
          <div className="h-1 bg-slate-100">
            <div
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${(onboardingStep / 3) * 100}%` }}
            />
          </div>

          <div className="flex-1 overflow-y-auto">

            {/* STEP 1: Phone, OTP, Password */}
            {onboardingStep === 1 && (
              <div className="flex flex-col px-6 py-8 min-h-full">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-extrabold text-2xl flex items-center justify-center mx-auto mb-3 shadow-md ring-4 ring-emerald-50">
                    {onboardingForm.firstName ? onboardingForm.firstName[0].toUpperCase() : 'I'}
                  </div>
                  <h1 className="text-xl font-extrabold text-slate-900">
                    Ro'yxatdan o'tish
                  </h1>
                  <p className="text-slate-500 text-xs mt-1">
                    Telefon raqamingizni tasdiqlang va akkauntingiz uchun parol o'rnating
                  </p>
                </div>

                <div className="space-y-3.5 max-w-sm mx-auto w-full">
                  {/* Name fields */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Ism *</label>
                      <input
                        type="text"
                        value={onboardingForm.firstName}
                        onChange={e => setOnboardingForm(p => ({...p, firstName: e.target.value}))}
                        placeholder="Ismingiz"
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Familiya</label>
                      <input
                        type="text"
                        value={onboardingForm.lastName}
                        onChange={e => setOnboardingForm(p => ({...p, lastName: e.target.value}))}
                        placeholder="Familiyangiz"
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* Phone number */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Telefon raqam *</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="tel"
                          value={onboardingForm.phone}
                          onChange={e => setOnboardingForm(p => ({...p, phone: e.target.value}))}
                          placeholder="+998901234567"
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={isSendingOtp || otpCountdown > 0}
                        className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold rounded-xl whitespace-nowrap active:scale-95 transition-all shadow-sm"
                      >
                        {isSendingOtp ? "..." : (otpCountdown > 0 ? `${otpCountdown}s` : (otpSent ? "Qayta" : "Kodni olish"))}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Tasdiqlash kodi ushbu Telegram botingizga yuboriladi</p>
                  </div>

                  {/* If existing user: ask password only */}
                  {isExistingUser && (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-left">
                      <p className="text-xs text-amber-900 font-semibold mb-2">
                        Bu raqam bilan avval ro'yxatdan o'tilgan. Akkauntingizni ushbu Telegramga ulash uchun parolni kiriting:
                      </p>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Parol</label>
                      <input
                        type="password"
                        value={onboardingForm.password}
                        onChange={e => setOnboardingForm(p => ({...p, password: e.target.value}))}
                        placeholder="Parolingizni kiriting"
                        className="w-full px-3 py-2.5 rounded-xl border border-amber-300 bg-white text-xs focus:outline-none focus:border-amber-500"
                      />
                      <button
                        onClick={handleLinkExisting}
                        disabled={isRegistering || !onboardingForm.password}
                        className="mt-3 w-full py-2.5 bg-amber-600 text-white font-bold text-xs rounded-xl shadow hover:bg-amber-700 active:scale-95 transition-all"
                      >
                        {isRegistering ? "Ulanmoqda..." : "Akkauntni ulash va kirish"}
                      </button>
                    </div>
                  )}

                  {/* If new user & OTP sent: show code and password fields */}
                  {!isExistingUser && otpSent && (
                    <div className="space-y-3 pt-1 border-t border-slate-100">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Tasdiqlash kodi * (Botdan kelgan 4 xonali kod)
                        </label>
                        <input
                          type="text"
                          maxLength={4}
                          value={onboardingForm.code}
                          onChange={e => setOnboardingForm(p => ({...p, code: e.target.value}))}
                          placeholder="1234"
                          className="w-full px-3 py-2.5 text-center text-lg tracking-widest font-extrabold rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-emerald-500 focus:bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Parol yarating * (kamida 6 ta belgi)
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="password"
                            value={onboardingForm.password}
                            onChange={e => setOnboardingForm(p => ({...p, password: e.target.value}))}
                            placeholder="••••••••"
                            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white"
                          />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">Bu parol bilan keyinchalik mobil ilovaga ham kira olasiz</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (!onboardingForm.firstName.trim()) {
                            alert("Iltimos, ismingizni kiriting!");
                            return;
                          }
                          if (!onboardingForm.code || onboardingForm.code.trim().length !== 4) {
                            alert("Iltimos, 4 xonali tasdiqlash kodini kiriting!");
                            return;
                          }
                          if (!onboardingForm.password || onboardingForm.password.length < 6) {
                            alert("Iltimos, kamida 6 ta belgidan iborat parol kiriting!");
                            return;
                          }
                          triggerHaptic();
                          setOnboardingStep(2);
                        }}
                        className="mt-2 w-full py-3.5 bg-emerald-600 text-white font-extrabold rounded-2xl text-sm shadow-md hover:bg-emerald-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                      >
                        Davom etish: Rol tanlash <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {!isExistingUser && !otpSent && (
                    <div className="pt-4 text-center">
                      <p className="text-xs text-slate-400">
                        Davom etish uchun avval telefon raqamingizni kiritib <strong>"Kodni olish"</strong> tugmasini bosing
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 2: Role Choice */}
            {onboardingStep === 2 && (
              <div className="flex flex-col px-6 py-8 min-h-full">
                <button
                  onClick={() => { triggerHaptic(); setOnboardingStep(1); }}
                  className="self-start text-slate-400 text-xs font-semibold mb-4 flex items-center gap-1 active:opacity-70"
                >
                  ← Orqaga
                </button>
                <div className="text-center mb-6">
                  <h2 className="text-xl font-extrabold text-slate-900">Siz kimsiz?</h2>
                  <p className="text-slate-500 text-xs mt-1">Ilovadan foydalanish maqsadingizni tanlang</p>
                </div>

                <div className="space-y-3.5 max-w-sm mx-auto w-full">
                  {/* Employer card */}
                  <button
                    onClick={() => { triggerHaptic(); setOnboardingRole('EMPLOYER'); }}
                    className={`w-full p-4 rounded-2xl border-2 text-left transition-all active:scale-[0.98] ${
                      onboardingRole === 'EMPLOYER'
                        ? 'border-emerald-500 bg-emerald-50/70 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-emerald-200'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-2xl flex-shrink-0">
                        👔
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-extrabold text-slate-900 text-sm">Ish beruvchi / Buyurtmachi</h3>
                          {onboardingRole === 'EMPLOYER' && (
                            <Check className="w-4 h-4 text-emerald-600 font-bold" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">Usta va ishchilarni topish, ish e'lonlari berish</p>
                      </div>
                    </div>
                  </button>

                  {/* Worker card */}
                  <button
                    onClick={() => { triggerHaptic(); setOnboardingRole('WORKER'); }}
                    className={`w-full p-4 rounded-2xl border-2 text-left transition-all active:scale-[0.98] ${
                      onboardingRole === 'WORKER'
                        ? 'border-amber-500 bg-amber-50/70 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-amber-200'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-2xl flex-shrink-0">
                        🛠
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-extrabold text-slate-900 text-sm">Usta / Mutaxassis / Ishchi</h3>
                          {onboardingRole === 'WORKER' && (
                            <Check className="w-4 h-4 text-amber-600 font-bold" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">Buyurtmalar olish, xizmat ko'rsatish va ish topish</p>
                      </div>
                    </div>
                  </button>
                </div>

                <div className="mt-auto pt-6 max-w-sm mx-auto w-full">
                  <button
                    onClick={() => { triggerHaptic(); setOnboardingStep(3); }}
                    className={`w-full py-3.5 font-extrabold rounded-2xl text-sm shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-white ${
                      onboardingRole === 'WORKER' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                  >
                    Davom etish: Hudud tanlash <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Location & Details */}
            {onboardingStep === 3 && (
              <div className="flex flex-col px-6 py-8 min-h-full">
                <button
                  onClick={() => { triggerHaptic(); setOnboardingStep(2); }}
                  className="self-start text-slate-400 text-xs font-semibold mb-4 flex items-center gap-1 active:opacity-70"
                >
                  ← Orqaga
                </button>
                <div className="text-center mb-6">
                  <h2 className="text-xl font-extrabold text-slate-900">
                    {onboardingRole === 'WORKER' ? "🛠 Usta ma'lumotlari" : "👔 Manzilingiz"}
                  </h2>
                  <p className="text-slate-500 text-xs mt-1">Hududingizni tanlang va ro'yxatdan o'tishni yakunlang</p>
                </div>

                <div className="space-y-3.5 max-w-sm mx-auto w-full">
                  {/* Profession if Worker */}
                  {onboardingRole === 'WORKER' && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Kasb / Mutaxassislik *</label>
                      <select
                        value={onboardingForm.professionId}
                        onChange={e => setOnboardingForm(p => ({...p, professionId: e.target.value}))}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:border-amber-500 focus:bg-white"
                      >
                        <option value="">— Kasb tanlang —</option>
                        {bootstrap.professions.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Region */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Viloyat *</label>
                    <select
                      value={onboardingForm.regionId}
                      onChange={e => setOnboardingForm(p => ({...p, regionId: e.target.value, districtId: ''}))}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white"
                    >
                      <option value="">— Viloyat tanlang —</option>
                      {bootstrap.regions.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* District */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Tuman / Shahar *</label>
                    <select
                      value={onboardingForm.districtId}
                      disabled={!onboardingForm.regionId}
                      onChange={e => setOnboardingForm(p => ({...p, districtId: e.target.value}))}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white disabled:opacity-50"
                    >
                      <option value="">— Tuman tanlang —</option>
                      {onboardingRegionDistricts.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Experience if Worker */}
                  {onboardingRole === 'WORKER' && (
                    <>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Ish tajribasi: <span className="text-amber-600 font-extrabold">{onboardingForm.experienceYears} yil</span>
                        </label>
                        <input
                          type="range"
                          min={1} max={30}
                          value={onboardingForm.experienceYears}
                          onChange={e => setOnboardingForm(p => ({...p, experienceYears: Number(e.target.value)}))}
                          className="w-full accent-amber-500"
                        />
                        <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                          <span>1 yil</span><span>30 yil</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">O'zingiz haqingizda (ixtiyoriy)</label>
                        <textarea
                          rows={2}
                          value={onboardingForm.about}
                          onChange={e => setOnboardingForm(p => ({...p, about: e.target.value}))}
                          placeholder="Bajaradigan ishlaringiz haqida qisqacha..."
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:border-amber-500 focus:bg-white resize-none"
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="mt-auto pt-6 max-w-sm mx-auto w-full">
                  <button
                    onClick={handleCompleteOnboarding}
                    disabled={isRegistering || !onboardingForm.regionId || !onboardingForm.districtId || (onboardingRole === 'WORKER' && !onboardingForm.professionId)}
                    className={`w-full py-3.5 text-white font-extrabold rounded-2xl text-sm shadow-md active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2 ${
                      onboardingRole === 'WORKER' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                  >
                    {isRegistering ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>✅ Ro'yxatdan o'tishni yakunlash</>
                    )}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
      {/* ========== END ONBOARDING MODAL ========== */}
      {/* Top Header - Clean, spacious, uncluttered */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-2.5">
        <div className="flex items-center justify-between gap-2.5">
          {/* Left: User profile & greeting */}
          <div
            onClick={() => {
              triggerHaptic();
              setActiveTab('profile');
            }}
            className="flex items-center gap-2.5 min-w-0 cursor-pointer active:opacity-75 transition-opacity"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-extrabold text-base shadow-sm ring-2 ring-emerald-100 flex-shrink-0">
              {tgUser?.first_name ? tgUser.first_name[0].toUpperCase() : 'I'}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-extrabold text-slate-900 truncate">
                  {tgUser?.first_name || 'Foydalanuvchi'}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-0.5 flex-shrink-0 ${
                    userProfile?.role === 'WORKER'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {userProfile?.role === 'WORKER' ? '🛠 Usta' : '👔 Buyurtmachi'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Bosh sahifa</p>
            </div>
          </div>

          {/* Right: Region selector pill */}
          <button
            onClick={() => {
              triggerHaptic();
              setIsRegionModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-xs font-semibold rounded-full border border-slate-200/80 transition-all flex-shrink-0 max-w-[140px]"
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
            <span className="truncate">
              {currentRegion ? currentRegion.name : 'Barcha hududlar'}
            </span>
          </button>
        </div>

        {/* Search bar (visible in Workers and Jobs tabs) */}
        {(activeTab === 'workers' || activeTab === 'jobs') && (
          <div className="mt-2.5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeTab === 'workers' ? "Kasb yoki usta izlash..." : "Buyurtma yoki ish izlash..."}
              className="w-full pl-9 pr-8 py-2 bg-slate-100/90 text-xs rounded-xl border border-transparent focus:border-emerald-500 focus:bg-white focus:outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 p-0.5 hover:text-slate-600"
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
            {/* Favqulodda Mutaxassis Card */}
            <div 
              onClick={() => {
                triggerHaptic('light');
                setShowEmergencyModal(true);
                fetchEmergencyWorkers('');
              }}
              className="mb-3 bg-gradient-to-r from-rose-50 to-orange-50 border border-rose-300 rounded-2xl p-3.5 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center text-white shadow-md shadow-rose-500/20 shrink-0 text-xl">
                  🚨
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h3 className="font-extrabold text-sm text-slate-800 truncate">Favqulodda mutaxassis</h3>
                    <span className="bg-rose-500 text-white text-[9.5px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 flex items-center gap-0.5">
                      ⚡ 24/7 TEZKOR
                    </span>
                  </div>
                  <p className="text-[11.5px] text-slate-600 truncate mt-0.5">
                    Santexnik, elektrik, qulf ochish va boshqa tezkor ustalar
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-rose-500 shrink-0" />
              </div>
              <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto no-scrollbar">
                <span className="text-[11px] bg-white/90 text-slate-700 px-2 py-0.5 rounded border border-rose-200 font-medium shrink-0">💧 Santexnik</span>
                <span className="text-[11px] bg-white/90 text-slate-700 px-2 py-0.5 rounded border border-rose-200 font-medium shrink-0">⚡ Elektrik</span>
                <span className="text-[11px] bg-white/90 text-slate-700 px-2 py-0.5 rounded border border-rose-200 font-medium shrink-0">🔑 Qulf ustasi</span>
                <span className="text-[11px] bg-white/90 text-slate-700 px-2 py-0.5 rounded border border-rose-200 font-medium shrink-0">🚗 Avto SOS</span>
              </div>
            </div>
            {/* Horizontal Profession Chips */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1.5 -mx-4 px-4 mb-2.5">
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
                      {/* Avatar with cleanly positioned online dot */}
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-100 to-slate-200 border border-slate-200 flex items-center justify-center text-slate-700 font-extrabold text-base flex-shrink-0 relative">
                        {worker.avatarUrl ? (
                          <img src={worker.avatarUrl} alt={worker.fullName} className="w-full h-full object-cover rounded-2xl" />
                        ) : (
                          <span>{worker.fullName ? worker.fullName[0].toUpperCase() : 'U'}</span>
                        )}
                        {worker.available && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full shadow-sm"></span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h3 className="font-extrabold text-slate-900 text-sm truncate">{worker.fullName}</h3>
                          {worker.ratingAverage ? (
                            <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full text-xs font-bold flex-shrink-0">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              <span>{worker.ratingAverage.toFixed(1)}</span>
                            </div>
                          ) : null}
                        </div>

                        {/* Professions chips */}
                        <div className="flex flex-wrap gap-1 mt-1">
                          {worker.professions && worker.professions.length > 0 ? (
                            worker.professions.slice(0, 2).map((prof, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 bg-emerald-50 text-emerald-800 text-[11px] font-semibold rounded-md"
                              >
                                {prof}
                              </span>
                            ))
                          ) : (
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[11px] font-medium rounded-md">
                              Usta
                            </span>
                          )}
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
                      <span className={`font-semibold flex items-center gap-1.5 ${worker.available ? 'text-emerald-600' : 'text-slate-400'}`}>
                        <span className={`w-2 h-2 rounded-full ${worker.available ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
                        {worker.available ? "Bugun bo'sh" : "Hozir band"}
                      </span>

                      {worker.phone ? (
                        <a
                          href={`tel:${worker.phone}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerHaptic('medium');
                          }}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                        >
                          <Phone className="w-3 h-3" /> Bog'lanish
                        </a>
                      ) : (
                        <span className="text-slate-400 flex items-center gap-0.5">
                          Tafsilotlar <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      )}
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
                <div className="relative group cursor-pointer" onClick={() => setShowAvatarModal(true)}>
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-extrabold text-2xl shadow-md ring-4 ring-emerald-50 flex-shrink-0 overflow-hidden">
                    {userProfile?.avatarUrl ? (
                      <img src={userProfile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span>{userProfile?.fullName ? userProfile.fullName[0].toUpperCase() : (tgUser?.first_name ? tgUser.first_name[0].toUpperCase() : 'U')}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAvatarModal(true);
                    }}
                    className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md border-2 border-white hover:bg-emerald-700 active:scale-95 transition-all"
                    title="Rasmni o'zgartirish"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
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
                <div className="text-xs font-bold text-slate-700 mb-2.5 flex items-center justify-between">
                  <span>Joriy rolingiz:</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${
                    userProfile?.role === 'WORKER' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {userProfile?.role === 'WORKER' ? '🛠 Usta / Ishchi' : '👔 Buyurtmachi'}
                  </span>
                </div>

                {/* Role Switcher Tabs */}
                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl">
                  <button
                    onClick={() => {
                      if (userProfile?.role === 'WORKER') {
                        handleSwitchToEmployer();
                      }
                    }}
                    disabled={isSwitchingRole}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
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
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
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
                    <h4 className="font-extrabold text-amber-900 text-sm">Usta sifatida daromad qiling</h4>
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

      {/* ===================== BOTTOM NAVIGATION (5 EQUAL COLUMNS) ===================== */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/80 pt-1.5 pb-4"
        style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))' }}
      >
        <div className="grid grid-cols-5 items-end max-w-md mx-auto w-full px-1">
          {/* 1. Ustalar */}
          <button
            onClick={() => {
              triggerHaptic();
              setActiveTab('workers');
            }}
            className={`flex flex-col items-center justify-center py-1 w-full transition-all ${
              activeTab === 'workers' ? 'text-emerald-600 font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <div className={`p-1 rounded-xl transition-all ${activeTab === 'workers' ? 'scale-110' : ''}`}>
              <Users className="w-5 h-5" />
            </div>
            <span className="text-[10px] leading-tight">Ustalar</span>
          </button>

          {/* 2. Buyurtmalar */}
          <button
            onClick={() => {
              triggerHaptic();
              setActiveTab('jobs');
            }}
            className={`flex flex-col items-center justify-center py-1 w-full transition-all ${
              activeTab === 'jobs' ? 'text-emerald-600 font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <div className={`p-1 rounded-xl transition-all ${activeTab === 'jobs' ? 'scale-110' : ''}`}>
              <Briefcase className="w-5 h-5" />
            </div>
            <span className="text-[10px] leading-tight">Buyurtmalar</span>
          </button>

          {/* 3. E'lon berish (Center elevated button) */}
          <button
            onClick={() => {
              triggerHaptic('medium');
              setActiveTab('post');
            }}
            className="flex flex-col items-center justify-center w-full -mt-6 group"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 active:scale-95 transition-transform ring-4 ring-white mb-0.5">
              <PlusCircle className="w-6 h-6" />
            </div>
            <span className={`text-[10px] leading-tight font-semibold ${
              activeTab === 'post' ? 'text-emerald-600 font-bold' : 'text-slate-500'
            }`}>
              E'lon berish
            </span>
          </button>

          {/* 4. Profil */}
          <button
            onClick={() => {
              triggerHaptic();
              setActiveTab('profile');
            }}
            className={`flex flex-col items-center justify-center py-1 w-full transition-all ${
              activeTab === 'profile' ? 'text-emerald-600 font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <div className={`p-1 rounded-xl transition-all ${activeTab === 'profile' ? 'scale-110' : ''}`}>
              <User className="w-5 h-5" />
            </div>
            <span className="text-[10px] leading-tight">Profil</span>
          </button>

          {/* 5. Ilova */}
          <button
            onClick={() => {
              triggerHaptic();
              setActiveTab('info');
            }}
            className={`flex flex-col items-center justify-center py-1 w-full transition-all ${
              activeTab === 'info' ? 'text-emerald-600 font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <div className={`p-1 rounded-xl transition-all ${activeTab === 'info' ? 'scale-110' : ''}`}>
              <Download className="w-5 h-5" />
            </div>
            <span className="text-[10px] leading-tight">Ilova</span>
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

      {/* ===================== EMERGENCY SPECIALISTS MODAL ===================== */}
      {showEmergencyModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
            {/* Modal Header */}
            <div className="p-4 bg-gradient-to-r from-rose-500 to-orange-500 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">🚨</span>
                <div>
                  <h3 className="font-extrabold text-base leading-tight">Favqulodda mutaxassislar</h3>
                  <p className="text-xs text-rose-100">24/7 Shoshilinch ta'mirlash va xizmatlar</p>
                </div>
              </div>
              <button
                onClick={() => setShowEmergencyModal(false)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Category Quick Chips */}
            <div className="p-3 bg-slate-50 border-b border-slate-100 shrink-0">
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                {[
                  { id: '', label: '🚨 Barchasi' },
                  { id: 'santexnik', label: '💧 Santexnik' },
                  { id: 'elektrik', label: '⚡ Elektrik' },
                  { id: 'qulf', label: '🔑 Qulf ustasi' },
                  { id: 'gaz', label: '🔥 Gaz / Isitish' },
                  { id: 'evakuator', label: '🚗 Evakuator' },
                  { id: 'konditsioner', label: '❄️ Konditsioner' },
                  { id: 'maishiy', label: '🧰 Maishiy texnika' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      triggerHaptic('light');
                      fetchEmergencyWorkers(cat.id);
                    }}
                    className={`px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                      emergencyCategory === cat.id
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Emergency Workers List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {emergencyLoading ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-rose-500" />
                  <span className="text-xs font-medium">Ustalar yuklanmoqda...</span>
                </div>
              ) : emergencyWorkers.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="w-14 h-14 mx-auto rounded-full bg-rose-50 flex items-center justify-center text-rose-400 text-2xl mb-2">
                    🔍
                  </div>
                  <h4 className="font-bold text-sm text-slate-800">Mutaxassis topilmadi</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    Tanlangan toifa bo'yicha favqulodda mutaxassis topilmadi. Boshqa toifani tanlab ko'ring.
                  </p>
                  <button
                    onClick={() => fetchEmergencyWorkers('')}
                    className="mt-3 px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-lg border border-rose-200 inline-flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Barchasini ko'rish
                  </button>
                </div>
              ) : (
                emergencyWorkers.map((w) => (
                  <div
                    key={w.id}
                    className="p-3.5 bg-white border border-rose-200/80 rounded-2xl shadow-sm flex flex-col gap-2.5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                        {w.avatarUrl ? (
                          <img src={w.avatarUrl} alt={w.fullName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-rose-100 text-rose-700 font-bold text-sm">
                            {w.fullName?.slice(0, 2).toUpperCase() || 'U'}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <h4 className="font-extrabold text-sm text-slate-900 truncate">{w.fullName}</h4>
                          {w.verified && <CheckCircle2 className="w-4 h-4 text-sky-500 shrink-0" />}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[11px] bg-rose-50 text-rose-700 font-bold px-2 py-0.5 rounded border border-rose-100 truncate">
                            {w.professions?.[0]?.name || 'Mutaxassis'}
                          </span>
                          <span className="text-[10.5px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded">
                            ⚡ Tezkor
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">
                            {w.region?.name ? `${w.region.name}${w.district?.name ? ', ' + w.district.name : ''}` : "O'zbekiston"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Direct Contact Button */}
                    <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                      {w.phone ? (
                        <a
                          href={`tel:${w.phone}`}
                          onClick={() => triggerHaptic('medium')}
                          className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition text-center"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Qo'ng'iroq qilish ({w.phone})</span>
                        </a>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedWorker(w);
                            setShowWorkerModal(true);
                          }}
                          className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5"
                        >
                          Profilni ko'rish
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}

              {/* Join Banner */}
              <div className="mt-4 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                <div className="flex items-center gap-2 font-bold text-slate-800 mb-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Siz ham tezkor mutaxassis bo'lmoqchimisiz?</span>
                </div>
                <p className="text-slate-600 text-[11.5px] leading-relaxed">
                  Ishchi profilida "Ishchi bilan shartnoma" bo'limida ariza qoldiring. Admin tekshiruvidan so'ng ushbu ro'yxatda chiqasiz.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== AVATAR PICKER MODAL ===================== */}
      {showAvatarModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl max-h-[85vh] overflow-y-auto p-5 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-base">Profil rasmini tanlash</h3>
              <button
                onClick={() => setShowAvatarModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Actions: Gallery upload & Delete */}
            <div className="mt-4 flex gap-2">
              <label className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-xs rounded-xl shadow cursor-pointer flex items-center justify-center gap-2 transition-all">
                <ImageIcon className="w-4 h-4" />
                <span>Galereyadan tanlash</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleUploadAvatarFile}
                  disabled={isUpdatingAvatar}
                  className="hidden"
                />
              </label>

              {userProfile?.avatarUrl && (
                <button
                  type="button"
                  onClick={handleDeleteAvatar}
                  disabled={isUpdatingAvatar}
                  className="py-3 px-3.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-xl border border-red-200 flex items-center gap-1.5 transition-all"
                  title="Rasmni o'chirish"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>O'chirish</span>
                </button>
              )}
            </div>

            {/* Loading indicator */}
            {isUpdatingAvatar && (
              <div className="mt-3 p-2 bg-emerald-50 text-emerald-700 text-xs rounded-lg flex items-center justify-center gap-2 font-medium">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Rasm saqlanmoqda...</span>
              </div>
            )}

            {/* Built-in Presets */}
            <div className="mt-5">
              <h4 className="text-xs font-bold text-slate-700 mb-3">Yoki tayyor avatarlardan tanlang:</h4>
              <div className="grid grid-cols-3 gap-2.5">
                {PRESET_AVATARS.map((preset) => {
                  const isSelected = userProfile?.avatarUrl === preset.url;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      disabled={isUpdatingAvatar}
                      onClick={() => handleSelectPresetAvatar(preset.url)}
                      className={`p-2 rounded-2xl flex flex-col items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-emerald-50 ring-2 ring-emerald-600 shadow-sm'
                          : 'bg-slate-50 hover:bg-slate-100 active:scale-95'
                      }`}
                    >
                      <div className="w-16 h-16 rounded-full overflow-hidden relative shadow-sm">
                        <img
                          src={preset.url}
                          alt={preset.name}
                          className="w-full h-full object-cover"
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-emerald-600/20 flex items-center justify-center">
                            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">✓</span>
                          </div>
                        )}
                      </div>
                      <span className={`text-[11px] mt-1.5 font-bold truncate max-w-full ${
                        isSelected ? 'text-emerald-700' : 'text-slate-700'
                      }`}>
                        {preset.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
