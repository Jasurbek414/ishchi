import { useState, useEffect, useRef } from 'react';
import { api, getAccessToken } from '../api/client.js';
import { useToast } from '../components/Toast.jsx';
import {
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneOff,
  PhoneMissed,
  User,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Search,
  Plus,
  RefreshCw,
  Send,
  Wrench,
  ChevronRight,
  Filter,
  Play,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Calendar,
  X,
  Radio,
  Headphones,
  Delete,
  Hash,
  Square,
  Sparkles,
} from 'lucide-react';

// DTMF audio generator for keypad click sounds
const DTMF_FREQS = {
  '1': [697, 1209], '2': [697, 1336], '3': [697, 1477],
  '4': [770, 1209], '5': [770, 1336], '6': [770, 1477],
  '7': [852, 1209], '8': [852, 1336], '9': [852, 1477],
  '*': [941, 1209], '0': [941, 1336], '#': [941, 1477],
};

function playDtmfTone(key) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const freqs = DTMF_FREQS[key] || [440, 480];
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.frequency.value = freqs[0];
    osc2.frequency.value = freqs[1];
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + 0.12);
    osc2.stop(ctx.currentTime + 0.12);
  } catch (e) {}
}

export default function CallCenterPage() {
  const toast = useToast();
  const inputRef = useRef(null);

  // Main area tab: 'tickets' | 'calls'
  const [activeTab, setActiveTab] = useState('tickets');

  // Real-time Active Call state
  // { callId, phone, customerName, customerId, direction: 'INBOUND'|'OUTBOUND', status: 'RINGING'|'ANSWERED', startTime }
  const [activeCall, setActiveCall] = useState(null);
  const [callTimer, setCallTimer] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(true);

  // Softphone Dialer state
  const [dialPhone, setDialPhone] = useState('+998');
  const [dialLookup, setDialLookup] = useState(null);
  const [dialLookupLoading, setDialLookupLoading] = useState(false);

  // SSE connection status
  const [sseConnected, setSseConnected] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    totalCallsToday: 0,
    answeredCallsToday: 0,
    missedCallsToday: 0,
    activeTickets: 0,
    completedTicketsToday: 0,
    emergencyTicketsCount: 0,
  });

  // Tickets state
  const [tickets, setTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Calls history state
  const [calls, setCalls] = useState([]);
  const [callsLoading, setCallsLoading] = useState(false);
  const [callStatusFilter, setCallStatusFilter] = useState('');
  const [callSearchPhone, setCallSearchPhone] = useState('');
  const [callsPage, setCallsPage] = useState(0);

  // New Ticket / Quick Dispatch Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTicket, setNewTicket] = useState({
    callId: '',
    customerPhone: '',
    customerName: '',
    regionId: '',
    districtId: '',
    addressLine: '',
    category: 'Santexnika',
    problemDescription: '',
    urgency: 'NORMAL',
    priceAgreed: '',
    paymentType: 'CASH',
    notes: '',
    assignedWorkerId: null,
  });

  // Regions & Districts
  const [regions, setRegions] = useState([]);
  const [districts, setDistricts] = useState([]);

  // Available Workers for dispatch
  const [availableWorkers, setAvailableWorkers] = useState([]);
  const [workersLoading, setWorkersLoading] = useState(false);
  const [workerSearch, setWorkerSearch] = useState('');
  const [selectedWorker, setSelectedWorker] = useState(null);

  // Selected Ticket Detail & Action Modal
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);

  // Audio player state
  const [playingAudioUrl, setPlayingAudioUrl] = useState(null);

  // 1. Initial Data
  useEffect(() => {
    fetchStats();
    fetchRegions();
  }, []);

  // 2. Fetch Tickets or Calls on filter change
  useEffect(() => {
    if (activeTab === 'tickets') {
      fetchTickets();
    } else if (activeTab === 'calls') {
      fetchCalls();
    }
  }, [activeTab, statusFilter, urgencyFilter, searchQuery, page, callStatusFilter, callSearchPhone, callsPage]);

  // 3. Live call timer
  useEffect(() => {
    let interval = null;
    if (activeCall && activeCall.status === 'ANSWERED') {
      interval = setInterval(() => {
        setCallTimer((prev) => prev + 1);
      }, 1000);
    } else {
      setCallTimer(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeCall?.status]);

  // 4. Global keyboard listener for instant typing into softphone
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      const tag = e.target.tagName?.toLowerCase();
      if (tag === 'textarea' || tag === 'select') return;
      if (tag === 'input' && e.target !== inputRef.current) return;
      if (showCreateModal || showAssignModal) return;

      if ((e.key >= '0' && e.key <= '9') || e.key === '*' || e.key === '#' || e.key === '+') {
        playDtmfTone(e.key);
        if (e.target !== inputRef.current) {
          setDialPhone((prev) => (prev || '') + e.key);
          inputRef.current?.focus();
        }
      } else if (e.key === 'Backspace' && e.target !== inputRef.current) {
        handleKeypadBackspace();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleDial();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [dialPhone, showCreateModal, showAssignModal]);

  // 5. SSE Subscription for Real-time Call Events
  useEffect(() => {
    let eventSource = null;
    try {
      const token = getAccessToken();
      const streamUrl = '/api/operator/stream' + (token ? '?token=' + encodeURIComponent(token) : '');
      eventSource = new EventSource(streamUrl);

      eventSource.onopen = () => {
        setSseConnected(true);
      };

      eventSource.addEventListener('CALL_INCOMING', (e) => {
        try {
          const data = JSON.parse(e.data);
          setActiveCall({
            callId: data.callId,
            phone: data.callerPhone,
            customerName: data.customerName || "Noma'lum mijoz",
            customerId: data.customerId,
            direction: 'INBOUND',
            status: 'RINGING',
            startTime: new Date(),
          });
          toast.info(`Kiruvchi qo'ng'iroq: ${data.callerPhone}`);
          playDtmfTone('1');

          setNewTicket((prev) => ({
            ...prev,
            callId: data.callId,
            customerPhone: data.callerPhone,
            customerName: data.customerName || '',
          }));
        } catch (err) {}
      });

      eventSource.addEventListener('CALL_OUTGOING', (e) => {
        try {
          const data = JSON.parse(e.data);
          setActiveCall({
            callId: data.callId,
            phone: data.callerPhone,
            customerName: data.customerName || "Chiqish qo'ng'irog'i",
            customerId: data.customerId,
            direction: 'OUTBOUND',
            status: 'RINGING',
            startTime: new Date(),
          });
        } catch (err) {}
      });

      eventSource.addEventListener('CALL_ANSWERED', (e) => {
        try {
          const data = JSON.parse(e.data);
          setActiveCall((prev) => (prev && prev.callId === data.callId ? { ...prev, status: 'ANSWERED' } : prev));
          fetchStats();
        } catch (err) {}
      });

      eventSource.addEventListener('CALL_ENDED', (e) => {
        try {
          const data = JSON.parse(e.data);
          if (activeCall && activeCall.callId === data.callId) {
            setActiveCall(null);
          }
          fetchStats();
          fetchCalls();
        } catch (err) {}
      });

      eventSource.onerror = () => {
        setSseConnected(false);
      };
    } catch (e) {
      console.warn('SSE not supported or failed to connect:', e);
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, [activeCall?.callId]);

  // 6. Customer Lookup on dial phone change
  useEffect(() => {
    const raw = dialPhone.replace(/\D/g, '');
    if (raw.length >= 9) {
      setDialLookupLoading(true);
      api.get('/api/operator/lookup', { phone: dialPhone.trim() })
        .then((res) => setDialLookup(res))
        .catch(() => setDialLookup(null))
        .finally(() => setDialLookupLoading(false));
    } else {
      setDialLookup(null);
    }
  }, [dialPhone]);

  // 7. Load districts when region changes
  useEffect(() => {
    if (newTicket.regionId) {
      api.get(`/api/regions/${newTicket.regionId}/districts`).then(setDistricts).catch(() => setDistricts([]));
    } else {
      setDistricts([]);
    }
  }, [newTicket.regionId]);

  // 8. Search available workers when modal is opened
  useEffect(() => {
    if (showCreateModal || showAssignModal) {
      fetchWorkers();
    }
  }, [newTicket.regionId, newTicket.districtId, newTicket.category, workerSearch, showAssignModal]);

  const fetchStats = async () => {
    try {
      const data = await api.get('/api/operator/stats');
      setStats(data);
    } catch (e) {}
  };

  const fetchRegions = async () => {
    try {
      const data = await api.get('/api/regions');
      setRegions(data || []);
    } catch (e) {}
  };

  const fetchTickets = async () => {
    setTicketsLoading(true);
    try {
      const query = {
        page,
        size: 15,
        status: statusFilter || undefined,
        urgency: urgencyFilter || undefined,
        search: searchQuery || undefined,
      };
      const data = await api.get('/api/operator/tickets', query);
      setTickets(data?.content || []);
      setTotalPages(data?.totalPages || 1);
    } catch (err) {
      toast.error("Arizalarni yuklashda xatolik");
    } finally {
      setTicketsLoading(false);
    }
  };

  const fetchCalls = async () => {
    setCallsLoading(true);
    try {
      const query = {
        page: callsPage,
        size: 15,
        status: callStatusFilter || undefined,
        phone: callSearchPhone || undefined,
      };
      const data = await api.get('/api/operator/calls', query);
      setCalls(data?.content || []);
    } catch (err) {
      toast.error("Qo'ng'iroqlarni yuklashda xatolik");
    } finally {
      setCallsLoading(false);
    }
  };

  const fetchWorkers = async () => {
    setWorkersLoading(true);
    try {
      const regId = selectedTicket ? selectedTicket.regionId : newTicket.regionId;
      const distId = selectedTicket ? selectedTicket.districtId : newTicket.districtId;
      const data = await api.get('/api/operator/workers', {
        regionId: regId || undefined,
        districtId: distId || undefined,
        search: workerSearch || undefined,
      });
      setAvailableWorkers(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setWorkersLoading(false);
    }
  };

  // --- Call Actions ---

  // 1. Dial Outbound Call
  const handleDial = async (targetPhone) => {
    const phone = (targetPhone || dialPhone).trim();
    if (!phone || phone.replace(/\D/g, '').length < 9) {
      toast.error("Iltimos, to'liq telefon raqamini kiriting");
      inputRef.current?.focus();
      return;
    }
    try {
      playDtmfTone('#');
      const res = await api.post('/api/operator/call/dial', { phone });
      setActiveCall({
        callId: res.callId,
        phone: res.destinationNumber || phone,
        customerName: dialLookup?.fullName || "Chiqish qo'ng'irog'i",
        direction: 'OUTBOUND',
        status: 'RINGING',
        startTime: new Date(),
      });
      setCallTimer(0);
      toast.info(`${phone} raqamiga chaqiruv yo'llanmoqda...`);
    } catch (e) {
      toast.error(e.message || "Qo'ng'iroqni amalga oshirib bo'lmadi");
    }
  };

  // 2. Answer Incoming Call
  const handleAnswerCall = async () => {
    if (!activeCall) return;
    try {
      await api.post(`/api/operator/call/${activeCall.callId}/answer`);
      setActiveCall((prev) => prev ? { ...prev, status: 'ANSWERED' } : null);
      toast.success("Qo'ng'iroq qabul qilindi — aloqa o'rnatildi");
    } catch (e) {
      toast.error("Qo'ng'iroqni qabul qilishda xatolik");
    }
  };

  // 3. Hangup / End Call
  const handleHangupCall = async () => {
    if (!activeCall) return;
    try {
      await api.post(`/api/operator/call/${activeCall.callId}/hangup`, {
        durationSeconds: callTimer,
        notes: "Operator tomonidan yakunlandi",
      });
      toast.info(`Qo'ng'iroq yakunlandi (${formatTimer(callTimer)})`);
      setActiveCall(null);
      setCallTimer(0);
      fetchStats();
      fetchCalls();
    } catch (e) {
      setActiveCall(null);
      setCallTimer(0);
    }
  };

  // 4. Simulate Incoming Call (Test purpose)
  const handleSimulateIncoming = async () => {
    try {
      const testPhones = ['+998901234567', '+998935552020', '+998971110099', '+998998887766'];
      const randomPhone = testPhones[Math.floor(Math.random() * testPhones.length)];
      await api.post(`/api/operator/call/simulate-incoming?phone=${encodeURIComponent(randomPhone)}`);
      toast.info(`Sinov qo'ng'irog'i yuborildi: ${randomPhone}`);
    } catch (e) {
      toast.error("Sinov qo'ng'irog'ini yuborishda xatolik");
    }
  };

  // Dialpad helpers
  const handleKeypadPress = (val) => {
    playDtmfTone(val);
    setDialPhone((prev) => (prev || '') + val);
    inputRef.current?.focus();
  };

  const handleKeypadBackspace = () => {
    setDialPhone((prev) => (prev ? prev.slice(0, -1) : ''));
    inputRef.current?.focus();
  };

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Create Ticket from Active Call
  const handleOpenTicketFromCall = () => {
    if (!activeCall) return;
    setNewTicket({
      callId: activeCall.callId,
      customerPhone: activeCall.phone,
      customerName: activeCall.customerName !== "Noma'lum mijoz" ? activeCall.customerName : '',
      regionId: dialLookup?.regionId ? String(dialLookup.regionId) : '',
      districtId: dialLookup?.districtId ? String(dialLookup.districtId) : '',
      addressLine: '',
      category: 'Santexnika',
      problemDescription: '',
      urgency: 'NORMAL',
      priceAgreed: '',
      paymentType: 'CASH',
      notes: `Qo'ng'iroq orqali qabul qilindi. Davomiyligi: ${formatTimer(callTimer)}`,
      assignedWorkerId: null,
    });
    setShowCreateModal(true);
  };

  // Submit Create Ticket
  const handleCreateTicket = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        callId: newTicket.callId || undefined,
        customerPhone: newTicket.customerPhone,
        customerName: newTicket.customerName,
        regionId: newTicket.regionId ? Number(newTicket.regionId) : undefined,
        districtId: newTicket.districtId ? Number(newTicket.districtId) : undefined,
        addressLine: newTicket.addressLine,
        category: newTicket.category,
        problemDescription: newTicket.problemDescription,
        urgency: newTicket.urgency,
        priceAgreed: newTicket.priceAgreed ? Number(newTicket.priceAgreed) : undefined,
        paymentType: newTicket.paymentType,
        notes: newTicket.notes,
        assignedWorkerId: selectedWorker ? selectedWorker.id : undefined,
      };

      await api.post('/api/operator/tickets', payload);
      toast.success("Murojaat muvaffaqiyatli saqlandi va mutaxassisga yo'naltirildi!");
      setShowCreateModal(false);
      setSelectedWorker(null);
      fetchTickets();
      fetchStats();
    } catch (err) {
      toast.error(err.message || "Arizani saqlashda xatolik");
    }
  };

  // Assign Worker to Ticket
  const handleAssignWorkerToExisting = async (workerId) => {
    if (!selectedTicket) return;
    try {
      await api.post(`/api/operator/tickets/${selectedTicket.id}/assign`, {
        workerId,
        dispatchNotes: "Dispetcher tomonidan biriktirildi",
      });
      toast.success("Mutaxassis muvaffaqiyatli biriktirildi va unga xabar yuborildi!");
      setShowAssignModal(false);
      fetchTickets();
      fetchStats();
    } catch (err) {
      toast.error(err.message || "Mutaxassisni biriktirishda xatolik");
    }
  };

  const handleUpdateStatus = async (ticketId, newStatus) => {
    try {
      await api.patch(`/api/operator/tickets/${ticketId}`, { status: newStatus });
      toast.success("Status yangilandi!");
      fetchTickets();
      fetchStats();
    } catch (e) {
      toast.error("Statusni yangilashda xatolik");
    }
  };

  const getUrgencyBadge = (urgency) => {
    switch (urgency) {
      case 'EMERGENCY':
        return <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-red-100 text-red-700 border border-red-300 animate-pulse">SHOSHILINCH (SOS)</span>;
      case 'URGENT':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-300">Tezkor</span>;
      default:
        return <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-700">Oddiy</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'NEW':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-blue-100 text-blue-800">Yangi</span>;
      case 'ASSIGNED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-purple-100 text-purple-800">Usta biriktirildi</span>;
      case 'IN_PROGRESS':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-amber-100 text-amber-800">Jarayonda</span>;
      case 'COMPLETED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-emerald-100 text-emerald-800">Bajarildi</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-200 text-slate-700">Bekor qilindi</span>;
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center">
            <Headphones size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">Call-Center & Dispetcherlik</h1>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                sseConnected ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-slate-100 text-slate-500'
              }`}>
                <span className={`w-2 h-2 rounded-full ${sseConnected ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`}></span>
                {sseConnected ? 'Telefoniya Faol (1055)' : 'Ulanmoqda...'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Qisqa raqam qo'ng'iroqlarini qabul qilish, doimiy softphone orqali raqam terish va ustalarni yo'naltirish
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick Focus Dialer Button */}
          <button
            onClick={() => {
              inputRef.current?.focus();
              toast.info("Raqam terish klaviaturasi faollashtirildi");
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            <PhoneCall size={15} />
            Raqam terish (Fokus)
          </button>

          {/* Simulate Call Button */}
          <button
            onClick={handleSimulateIncoming}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-medium transition cursor-pointer"
            title="Sinov tariqasida kiruvchi qo'ng'iroqni tekshirish"
          >
            <Sparkles size={14} className="text-amber-500" />
            Sinov qo'ng'irog'i
          </button>

          {/* New Ticket Button */}
          <button
            onClick={() => {
              setNewTicket({
                callId: '',
                customerPhone: '',
                customerName: '',
                regionId: '',
                districtId: '',
                addressLine: '',
                category: 'Santexnika',
                problemDescription: '',
                urgency: 'NORMAL',
                priceAgreed: '',
                paymentType: 'CASH',
                notes: '',
                assignedWorkerId: null,
              });
              setShowCreateModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition shadow-sm cursor-pointer"
          >
            <Plus size={17} />
            Yangi ariza ochish
          </button>
        </div>
      </div>

      {/* 2. ACTIVE LIVE CALL TOP BANNER (Visible on Incoming or Outgoing Call) */}
      {activeCall && (
        <div className={`p-5 rounded-2xl shadow-xl text-white transition-all duration-300 ${
          activeCall.status === 'ANSWERED'
            ? 'bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 border-2 border-emerald-400'
            : activeCall.direction === 'OUTBOUND'
            ? 'bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-800 border-2 border-indigo-400'
            : 'bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 border-2 border-blue-400 animate-pulse'
        }`}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
                {activeCall.status === 'ANSWERED' ? (
                  <Headphones size={36} className="text-emerald-200 animate-bounce" />
                ) : activeCall.direction === 'OUTBOUND' ? (
                  <PhoneOutgoing size={36} className="text-purple-200 animate-pulse" />
                ) : (
                  <PhoneIncoming size={36} className="text-blue-200 animate-bounce" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full bg-white/20">
                    {activeCall.status === 'ANSWERED'
                      ? 'Aloqa o‘rnatilgan (Gaplashilmoqda)'
                      : activeCall.direction === 'OUTBOUND'
                      ? 'Chiquvchi qo‘ng‘iroq terilmoqda...'
                      : 'Kiruvchi qo‘ng‘iroq (1055)'}
                  </span>
                  {activeCall.status === 'ANSWERED' && (
                    <span className="text-sm font-mono font-bold bg-black/30 px-2 py-0.5 rounded-md text-emerald-300 flex items-center gap-1.5">
                      <Clock size={14} /> {formatTimer(callTimer)}
                    </span>
                  )}
                </div>

                <div className="text-3xl font-black tracking-tight mt-1 font-mono">
                  {activeCall.phone}
                </div>
                <div className="text-sm text-blue-100 flex items-center gap-2 mt-0.5">
                  <User size={14} />
                  {activeCall.customerName}
                </div>
              </div>
            </div>

            {/* In-Call Controls */}
            <div className="flex flex-wrap items-center gap-3">
              {activeCall.status === 'RINGING' && activeCall.direction === 'INBOUND' && (
                <>
                  <button
                    onClick={handleAnswerCall}
                    className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm rounded-xl transition shadow-lg cursor-pointer transform hover:scale-105"
                  >
                    <PhoneIncoming size={18} />
                    Qabul qilish (Javob berish)
                  </button>

                  <button
                    onClick={handleHangupCall}
                    className="flex items-center gap-2 px-5 py-3 bg-red-500 hover:bg-red-600 text-white font-bold text-sm rounded-xl transition shadow cursor-pointer"
                  >
                    <PhoneOff size={18} />
                    Rad etish
                  </button>
                </>
              )}

              {activeCall.status === 'RINGING' && activeCall.direction === 'OUTBOUND' && (
                <>
                  <button
                    onClick={handleAnswerCall}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
                  >
                    <CheckCircle2 size={16} />
                    Ulandi (Test)
                  </button>
                  <button
                    onClick={handleHangupCall}
                    className="flex items-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold text-sm rounded-xl transition shadow cursor-pointer"
                  >
                    <PhoneOff size={18} />
                    Bekor qilish
                  </button>
                </>
              )}

              {activeCall.status === 'ANSWERED' && (
                <>
                  <button
                    onClick={() => {
                      setIsMuted(!isMuted);
                      toast.info(isMuted ? "Mikrofon yoqildi" : "Mikrofon o'chirildi");
                    }}
                    className={`p-3 rounded-xl transition cursor-pointer ${
                      isMuted ? 'bg-amber-500 text-white' : 'bg-white/20 hover:bg-white/30 text-white'
                    }`}
                  >
                    {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                  </button>

                  <button
                    onClick={() => {
                      setIsSpeaker(!isSpeaker);
                      toast.info(isSpeaker ? "Karnay o'chirildi" : "Karnay yoqildi");
                    }}
                    className={`p-3 rounded-xl transition cursor-pointer ${
                      !isSpeaker ? 'bg-amber-500 text-white' : 'bg-white/20 hover:bg-white/30 text-white'
                    }`}
                  >
                    {!isSpeaker ? <VolumeX size={20} /> : <Volume2 size={20} />}
                  </button>

                  <button
                    onClick={handleOpenTicketFromCall}
                    className="flex items-center gap-2 px-5 py-3 bg-white text-emerald-800 hover:bg-emerald-50 font-bold text-sm rounded-xl transition shadow-lg cursor-pointer"
                  >
                    <Plus size={18} />
                    Ushbu qo'ng'iroqqa ariza ochish
                  </button>

                  <button
                    onClick={handleHangupCall}
                    className="flex items-center gap-2 px-5 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl transition shadow-lg cursor-pointer transform hover:scale-105"
                  >
                    <PhoneOff size={18} />
                    Tugatish
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. TWO-COLUMN SPLIT LAYOUT: MAIN TABLES (LEFT) + ALWAYS OPEN SOFTPHONE (RIGHT) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (xl:col-span-8): Stats, Tabs and Tables */}
        <div className="xl:col-span-8 space-y-5">
          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="text-xs text-slate-500 dark:text-slate-400">Bugungi qo'ng'iroqlar</div>
              <div className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{stats.totalCallsToday}</div>
              <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">Javob berildi: {stats.answeredCallsToday}</div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="text-xs text-slate-500 dark:text-slate-400">O'tkazib yuborilgan</div>
              <div className="text-2xl font-bold text-red-600 mt-1">{stats.missedCallsToday}</div>
              <div className="text-xs text-slate-400 mt-1">Qayta aloqa talab qilinadi</div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="text-xs text-slate-500 dark:text-slate-400">Faol arizalar</div>
              <div className="text-2xl font-bold text-blue-600 mt-1">{stats.activeTickets}</div>
              <div className="text-xs text-purple-600 font-medium mt-1">Usta yo'naltirilgan</div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="text-xs text-slate-500 dark:text-slate-400">Bugun bajarildi</div>
              <div className="text-2xl font-bold text-emerald-600 mt-1">{stats.completedTicketsToday}</div>
              <div className="text-xs text-slate-400 mt-1">Yopilgan arizalar</div>
            </div>
          </div>

          {/* Navigation Tabs for Main Area */}
          <div className="flex border-b border-slate-200 dark:border-slate-700 gap-6">
            <button
              onClick={() => setActiveTab('tickets')}
              className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 cursor-pointer transition ${
                activeTab === 'tickets'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Wrench size={18} />
              Murojaatlar & Dispetcherlik ({stats.activeTickets})
            </button>

            <button
              onClick={() => setActiveTab('calls')}
              className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 cursor-pointer transition ${
                activeTab === 'calls'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Clock size={18} />
              Qo'ng'iroqlar jurnali (SIP Asterisk)
            </button>
          </div>

          {/* TAB 1: TICKETS */}
          {activeTab === 'tickets' && (
            <div className="space-y-4">
              {/* Filters Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 text-slate-400" size={17} />
                  <input
                    type="text"
                    placeholder="Raqam, ism, ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="py-2 px-3 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                >
                  <option value="">Barcha statuslar</option>
                  <option value="NEW">Yangi</option>
                  <option value="ASSIGNED">Usta biriktirilgan</option>
                  <option value="IN_PROGRESS">Jarayonda</option>
                  <option value="COMPLETED">Bajarildi</option>
                  <option value="CANCELLED">Bekor qilindi</option>
                </select>

                <select
                  value={urgencyFilter}
                  onChange={(e) => setUrgencyFilter(e.target.value)}
                  className="py-2 px-3 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                >
                  <option value="">Barcha darajalar</option>
                  <option value="NORMAL">Oddiy</option>
                  <option value="URGENT">Tezkor</option>
                  <option value="EMERGENCY">Shoshilinch (SOS)</option>
                </select>

                <button
                  onClick={() => {
                    setStatusFilter('');
                    urgencyFilter('');
                    setSearchQuery('');
                    fetchTickets();
                  }}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-medium transition cursor-pointer"
                >
                  <RefreshCw size={14} />
                  Tozalash
                </button>
              </div>

              {/* Tickets Table */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700 text-xs">
                      <tr>
                        <th className="py-3 px-3.5">ID / Daraja</th>
                        <th className="py-3 px-3.5">Mijoz / Telefon</th>
                        <th className="py-3 px-3.5">Kategoriya / Muammo</th>
                        <th className="py-3 px-3.5">Manzil</th>
                        <th className="py-3 px-3.5">Biriktirilgan Usta</th>
                        <th className="py-3 px-3.5">Status</th>
                        <th className="py-3 px-3.5 text-right">Amal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
                      {ticketsLoading ? (
                        <tr>
                          <td colSpan="7" className="py-8 text-center text-slate-400">
                            Arizalar yuklanmoqda...
                          </td>
                        </tr>
                      ) : tickets.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="py-8 text-center text-slate-400">
                            Hech qanday ariza topilmadi
                          </td>
                        </tr>
                      ) : (
                        tickets.map((t) => (
                          <tr key={t.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition">
                            <td className="py-3 px-3.5 font-mono font-medium text-blue-600">
                              {t.ticketNumber}
                              <div className="mt-1">{getUrgencyBadge(t.urgency)}</div>
                            </td>
                            <td className="py-3 px-3.5">
                              <div className="font-semibold text-slate-900 dark:text-white">
                                {t.customerName || "Noma'lum mijoz"}
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                                <span>{t.customerPhone}</span>
                                <button
                                  onClick={() => {
                                    setDialPhone(t.customerPhone);
                                    handleDial(t.customerPhone);
                                  }}
                                  className="p-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded transition cursor-pointer"
                                  title="Mijozga qo'ng'iroq qilish"
                                >
                                  <PhoneCall size={12} />
                                </button>
                              </div>
                            </td>
                            <td className="py-3 px-3.5">
                              <span className="font-medium text-slate-800 dark:text-slate-200">{t.category}</span>
                              <div className="text-slate-500 max-w-[180px] truncate mt-0.5">
                                {t.problemDescription}
                              </div>
                            </td>
                            <td className="py-3 px-3.5 text-slate-600 dark:text-slate-300">
                              <div className="font-medium">{t.regionName} {t.districtName ? `, ${t.districtName}` : ''}</div>
                              <div className="text-slate-400 truncate max-w-[160px]">{t.addressLine || '—'}</div>
                            </td>
                            <td className="py-3 px-3.5">
                              {t.assignedWorkerName ? (
                                <div>
                                  <div className="font-medium text-slate-900 dark:text-white flex items-center gap-1">
                                    <User size={12} className="text-emerald-600" />
                                    {t.assignedWorkerName}
                                  </div>
                                  <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                                    <span>{t.assignedWorkerPhone}</span>
                                    {t.assignedWorkerPhone && (
                                      <button
                                        onClick={() => {
                                          setDialPhone(t.assignedWorkerPhone);
                                          handleDial(t.assignedWorkerPhone);
                                        }}
                                        className="p-0.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded transition cursor-pointer"
                                        title="Ustaga qo'ng'iroq qilish"
                                      >
                                        <PhoneCall size={10} />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setSelectedTicket(t);
                                    setShowAssignModal(true);
                                  }}
                                  className="px-2 py-0.5 text-[11px] bg-blue-50 text-blue-700 hover:bg-blue-100 rounded font-medium transition cursor-pointer"
                                >
                                  + Usta biriktirish
                                </button>
                              )}
                            </td>
                            <td className="py-3 px-3.5">
                              {getStatusBadge(t.status)}
                            </td>
                            <td className="py-3 px-3.5 text-right space-x-1">
                              <button
                                onClick={() => {
                                  setSelectedTicket(t);
                                  setShowAssignModal(true);
                                }}
                                className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 rounded transition"
                                title="Tahrirlash / Usta biriktirish"
                              >
                                <Wrench size={15} />
                              </button>
                              {t.status === 'ASSIGNED' && (
                                <button
                                  onClick={() => handleUpdateStatus(t.id, 'IN_PROGRESS')}
                                  className="px-2 py-0.5 text-[11px] bg-amber-500 text-white hover:bg-amber-600 rounded transition font-medium"
                                >
                                  Boshlandi
                                </button>
                              )}
                              {t.status === 'IN_PROGRESS' && (
                                <button
                                  onClick={() => handleUpdateStatus(t.id, 'COMPLETED')}
                                  className="px-2 py-0.5 text-[11px] bg-emerald-600 text-white hover:bg-emerald-700 rounded transition font-medium"
                                >
                                  Tugatildi
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CALLS HISTORY */}
          {activeTab === 'calls' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row gap-3 shadow-sm">
                <input
                  type="text"
                  placeholder="Telefon raqam bo'yicha qidirish..."
                  value={callSearchPhone}
                  onChange={(e) => setCallSearchPhone(e.target.value)}
                  className="py-1.5 px-3 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg flex-1"
                />
                <select
                  value={callStatusFilter}
                  onChange={(e) => setCallStatusFilter(e.target.value)}
                  className="py-1.5 px-3 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                >
                  <option value="">Barcha qo'ng'iroqlar</option>
                  <option value="RINGING">Jiringlayotgan</option>
                  <option value="ANSWERED">Ko'tarilgan</option>
                  <option value="COMPLETED">Tugallangan</option>
                  <option value="MISSED">O'tkazib yuborilgan</option>
                  <option value="BUSY">Band</option>
                </select>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700 text-xs">
                    <tr>
                      <th className="py-3 px-3.5">ID</th>
                      <th className="py-3 px-3.5">Raqam</th>
                      <th className="py-3 px-3.5">Vaqt</th>
                      <th className="py-3 px-3.5">Davomiyligi</th>
                      <th className="py-3 px-3.5">Status</th>
                      <th className="py-3 px-3.5 text-right">Qayta terish / Yozuv</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
                    {callsLoading ? (
                      <tr>
                        <td colSpan="6" className="py-8 text-center text-slate-400">
                          Qo'ng'iroqlar yuklanmoqda...
                        </td>
                      </tr>
                    ) : calls.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-8 text-center text-slate-400">
                          Qo'ng'iroqlar tarixi mavjud emas
                        </td>
                      </tr>
                    ) : (
                      calls.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition">
                          <td className="py-3 px-3.5 font-mono text-slate-500">{c.callId}</td>
                          <td className="py-3 px-3.5 font-semibold text-slate-900 dark:text-white font-mono">
                            <div className="flex items-center gap-1.5">
                              {c.direction === 'OUTBOUND' ? (
                                <PhoneOutgoing size={13} className="text-purple-500" />
                              ) : (
                                <PhoneIncoming size={13} className="text-blue-500" />
                              )}
                              {c.callerPhone}
                            </div>
                          </td>
                          <td className="py-3 px-3.5 text-slate-500">
                            {new Date(c.startTime).toLocaleString('uz-UZ')}
                          </td>
                          <td className="py-3 px-3.5 font-mono">
                            {c.durationSeconds ? `${c.durationSeconds} sek` : '0 sek'}
                          </td>
                          <td className="py-3 px-3.5">
                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                              c.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                              c.status === 'MISSED' ? 'bg-red-100 text-red-800' :
                              c.status === 'RINGING' ? 'bg-blue-100 text-blue-800 animate-pulse' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {c.status}
                            </span>
                          </td>
                          <td className="py-3 px-3.5 text-right space-x-2">
                            <button
                              onClick={() => {
                                setDialPhone(c.callerPhone);
                                handleDial(c.callerPhone);
                              }}
                              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg inline-flex items-center gap-1 text-[11px] cursor-pointer"
                              title="Qayta qo'ng'iroq qilish"
                            >
                              <PhoneCall size={12} /> Qayta terish
                            </button>

                            {c.recordingUrl && (
                              <button
                                onClick={() => setPlayingAudioUrl(c.recordingUrl)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg inline-flex items-center gap-1 text-[11px] cursor-pointer"
                              >
                                <Play size={12} /> Eshitish
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN (xl:col-span-4): ALWAYS OPEN SOFTPHONE (Doim ochiq) */}
        <div className="xl:col-span-4 space-y-3.5 xl:sticky xl:top-4">
          {/* Smartphone Frame Container - Compact & Clean */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 shadow-xl border border-slate-200/90 dark:border-slate-800 flex flex-col max-w-[340px] mx-auto xl:max-w-none">
            {/* Header: Label & Status */}
            <div className="flex items-center justify-between mb-3 px-1">
              <div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                  WEB SOFTPHONE
                </span>
                <span className="text-sm font-extrabold text-slate-800 dark:text-white">
                  Raqam terish paneli
                </span>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                SIP 1055
              </span>
            </div>

            {/* KATTALASHTIRILGAN RAQAM TERISH JOYI (Enlarged Number Display Box) */}
            <div className="w-full bg-slate-50 dark:bg-slate-800/90 border-2 border-slate-200 dark:border-slate-700 rounded-2xl px-3.5 py-3 flex items-center justify-between gap-2 shadow-inner focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
              <input
                ref={inputRef}
                type="text"
                value={dialPhone}
                onChange={(e) => setDialPhone(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleDial();
                  }
                }}
                placeholder="+998"
                className="w-full text-left text-2xl sm:text-3xl font-extrabold tracking-wider text-slate-900 dark:text-white bg-transparent font-mono focus:outline-none border-none p-0 cursor-text"
              />
              {dialPhone.length > 0 && (
                <button
                  type="button"
                  onClick={handleKeypadBackspace}
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer active:scale-95 shrink-0"
                  title="O'chirish (Backspace)"
                >
                  <Delete size={22} />
                </button>
              )}
            </div>

            {/* Preset Quick Buttons */}
            <div className="grid grid-cols-3 gap-1.5 my-2.5">
              <button
                type="button"
                onClick={() => {
                  setDialPhone('+998');
                  inputRef.current?.focus();
                }}
                className="py-1 px-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition text-center border border-slate-200/60 dark:border-slate-700 cursor-pointer"
              >
                +998
              </button>
              <button
                type="button"
                onClick={() => {
                  setDialPhone('1055');
                  inputRef.current?.focus();
                }}
                className="py-1 px-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition text-center border border-slate-200/60 dark:border-slate-700 cursor-pointer truncate"
              >
                1055 (Dispet.)
              </button>
              <button
                type="button"
                onClick={() => {
                  setDialPhone('');
                  inputRef.current?.focus();
                }}
                className="py-1 px-2 text-xs font-semibold rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 transition text-center border border-red-200/60 dark:border-red-900/40 cursor-pointer"
              >
                Tozalash
              </button>
            </div>

            {/* IXCHAM TUZILISH: Keypad Grid (1-9, *, 0, #) */}
            <div className="grid grid-cols-3 gap-2 my-1 w-full">
              {[
                { key: '1', sub: '' },
                { key: '2', sub: 'ABC' },
                { key: '3', sub: 'DEF' },
                { key: '4', sub: 'GHI' },
                { key: '5', sub: 'JKL' },
                { key: '6', sub: 'MNO' },
                { key: '7', sub: 'PQRS' },
                { key: '8', sub: 'TUV' },
                { key: '9', sub: 'WXYZ' },
                { key: '*', sub: '' },
                { key: '0', sub: '+' },
                { key: '#', sub: '' },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => handleKeypadPress(item.key)}
                  className="h-12 w-full rounded-2xl flex flex-col items-center justify-center bg-slate-50 hover:bg-blue-50 active:bg-blue-100 hover:border-blue-300 active:scale-95 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-800 dark:text-white border border-slate-200/80 dark:border-slate-700 shadow-xs transition cursor-pointer select-none"
                >
                  <span className="text-xl font-bold leading-none">{item.key}</span>
                  {item.sub ? (
                    <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 tracking-wider mt-0.5 uppercase leading-none">
                      {item.sub}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>

            {/* Call Action Button */}
            <button
              type="button"
              onClick={() => handleDial()}
              className="w-full mt-2.5 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
            >
              <PhoneCall size={18} />
              <span>Qo'ng'iroq qilish</span>
            </button>
          </div>

          {/* Real-time Customer Card under Softphone */}
          {dialLookup && dialLookup.registered && (
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full">
                  Mijoz topildi
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  {dialLookup.role === 'WORKER' ? 'Usta' : 'Buyurtmachi'}
                </span>
              </div>
              <div className="font-bold text-sm text-slate-900 dark:text-white">
                {dialLookup.fullName || "Ismsiz mijoz"}
              </div>
              <div className="text-xs text-slate-500">
                {dialLookup.regionName || ''} {dialLookup.districtName ? `(${dialLookup.districtName})` : ''}
              </div>
              {dialLookup.previousTickets?.length > 0 && (
                <div className="text-[11px] text-blue-600 font-medium pt-1 border-t dark:border-slate-700">
                  Oldingi arizalari soni: {dialLookup.previousTickets.length} ta
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 4. MODAL: Create Ticket */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b pb-3 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                  <PhoneIncoming size={18} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Yangi murojaatni qayd qilish</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Mijoz telefoni *</label>
                  <input
                    type="text"
                    required
                    value={newTicket.customerPhone}
                    onChange={(e) => {
                      setNewTicket({ ...newTicket, customerPhone: e.target.value });
                    }}
                    placeholder="+998901234567"
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Mijoz ismi</label>
                  <input
                    type="text"
                    value={newTicket.customerName}
                    onChange={(e) => setNewTicket({ ...newTicket, customerName: e.target.value })}
                    placeholder="Mijoz ismi va familiyasi"
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Viloyat / Hudud</label>
                  <select
                    value={newTicket.regionId}
                    onChange={(e) => setNewTicket({ ...newTicket, regionId: e.target.value, districtId: '' })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border rounded-lg"
                  >
                    <option value="">Tanlang...</option>
                    {regions.map((r) => (
                      <option key={r.id} value={r.id}>{r.name || r.nameUz}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Tuman</label>
                  <select
                    value={newTicket.districtId}
                    onChange={(e) => setNewTicket({ ...newTicket, districtId: e.target.value })}
                    disabled={!districts.length}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border rounded-lg disabled:opacity-50"
                  >
                    <option value="">Tanlang...</option>
                    {districts.map((d) => (
                      <option key={d.id} value={d.id}>{d.name || d.nameUz}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Aniq manzil</label>
                <input
                  type="text"
                  value={newTicket.addressLine}
                  onChange={(e) => setNewTicket({ ...newTicket, addressLine: e.target.value })}
                  placeholder="Mahalla, ko'cha, uy raqami, mo'ljal..."
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border rounded-lg"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Kategoriya / Usta sohasini tanlang *</label>
                  <select
                    value={newTicket.category}
                    onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border rounded-lg font-medium"
                  >
                    <option value="Santexnika">Santexnika (Quvurlar, kranlar)</option>
                    <option value="Elektr">Elektr montaj va ta'mirlash</option>
                    <option value="Konditsioner">Konditsioner & Sovitkich ustasi</option>
                    <option value="Maishiy texnika">Maishiy texnika (Kir yuvish, gaz plita)</option>
                    <option value="Qurilish va ta'mirlash">Qurilish va ta'mirlash ustasi</option>
                    <option value="Yuk tashish">Yuk tashish va ko'chirish</option>
                    <option value="Tozalash (Klining)">Tozalash va klining xizmati</option>
                    <option value="Boshqa">Boshqa mutaxassis</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Shoshilinchlik darajasi</label>
                  <select
                    value={newTicket.urgency}
                    onChange={(e) => setNewTicket({ ...newTicket, urgency: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border rounded-lg"
                  >
                    <option value="NORMAL">Oddiy (Kun davomida)</option>
                    <option value="URGENT">Tezkor (1-2 soatda)</option>
                    <option value="EMERGENCY">Shoshilinch (Darhol - SOS)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Muammo tavsifi *</label>
                <textarea
                  required
                  rows="3"
                  value={newTicket.problemDescription}
                  onChange={(e) => setNewTicket({ ...newTicket, problemDescription: e.target.value })}
                  placeholder="Mijoz qanday nosozlik yoki ehtiyoj haqida murojaat qildi..."
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Worker Dispatch Section within modal */}
              <div className="border-t pt-4 dark:border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Wrench size={14} className="text-blue-600" />
                    Mos mutaxassisni tanlang (Hozir bo'sh bo'lganlar):
                  </label>
                  <span className="text-xs text-slate-400">Jami: {availableWorkers.length} ta usta</span>
                </div>

                <div className="max-h-44 overflow-y-auto space-y-1.5 border rounded-lg p-2 bg-slate-50 dark:bg-slate-900/50">
                  {workersLoading ? (
                    <div className="text-center py-4 text-xs text-slate-400">Mutaxassislar qidirilmoqda...</div>
                  ) : availableWorkers.length === 0 ? (
                    <div className="text-center py-4 text-xs text-slate-400">Ushbu hududda bo'sh mutaxassis topilmadi</div>
                  ) : (
                    availableWorkers.map((w) => (
                      <div
                        key={w.id}
                        onClick={() => setSelectedWorker(selectedWorker?.id === w.id ? null : w)}
                        className={`p-2 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition ${
                          selectedWorker?.id === w.id
                            ? 'bg-blue-100 border-blue-500 dark:bg-blue-900/40 text-blue-900 dark:text-blue-200'
                            : 'bg-white dark:bg-slate-800 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div>
                          <div className="font-bold flex items-center gap-1.5">
                            {w.fullName}
                            <span className="text-[10px] px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded font-normal">Faol</span>
                          </div>
                          <div className="text-slate-500 text-[11px] mt-0.5">
                            {w.regionName} {w.districtName ? `(${w.districtName})` : ''} · Tajriba: {w.experienceYears || 0} yil
                          </div>
                          <div className="text-blue-600 font-mono text-[11px] flex items-center gap-1">
                            <span>{w.phone}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDialPhone(w.phone);
                                handleDial(w.phone);
                              }}
                              className="p-1 hover:bg-blue-200 rounded text-blue-700"
                              title="Ustaga qo'ng'iroq qilish"
                            >
                              <PhoneCall size={11} />
                            </button>
                          </div>
                        </div>
                        <div>
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            selectedWorker?.id === w.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {selectedWorker?.id === w.id ? 'Tanlandi' : 'Tanlash'}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 dark:text-slate-400 font-medium cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-sm transition cursor-pointer"
                >
                  Saqlash va Usta yo'naltirish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL: Assign Worker to Existing Ticket */}
      {showAssignModal && selectedTicket && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3 dark:border-slate-700">
              <div>
                <h3 className="text-lg font-bold">Usta biriktirish</h3>
                <p className="text-xs text-slate-500">{selectedTicket.ticketNumber} · {selectedTicket.category}</p>
              </div>
              <button onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Usta ismini qidirish..."
                value={workerSearch}
                onChange={(e) => setWorkerSearch(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border rounded-lg"
              />

              <div className="max-h-60 overflow-y-auto space-y-2">
                {availableWorkers.map((w) => (
                  <div
                    key={w.id}
                    className="p-3 border rounded-xl flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition"
                  >
                    <div>
                      <div className="font-semibold text-sm">{w.fullName}</div>
                      <div className="text-xs text-slate-500 font-mono flex items-center gap-1.5">
                        <span>{w.phone}</span>
                        <button
                          onClick={() => {
                            setDialPhone(w.phone);
                            handleDial(w.phone);
                          }}
                          className="p-1 hover:bg-blue-100 text-blue-600 rounded"
                          title="Ustaga qo'ng'iroq qilish"
                        >
                          <PhoneCall size={12} />
                        </button>
                      </div>
                      <div className="text-xs text-slate-400">{w.regionName} {w.districtName ? `, ${w.districtName}` : ''}</div>
                    </div>
                    <button
                      onClick={() => handleAssignWorkerToExisting(w.id)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition cursor-pointer"
                    >
                      Biriktirish
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. AUDIO PLAYER MODAL */}
      {playingAudioUrl && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3">
          <Volume2 size={24} className="text-blue-400 animate-pulse" />
          <div>
            <div className="text-xs text-slate-400 font-medium">Qo'ng'iroq audio yozuvi</div>
            <audio src={playingAudioUrl} controls autoPlay className="h-8 mt-1" />
          </div>
          <button onClick={() => setPlayingAudioUrl(null)} className="text-slate-400 hover:text-white p-1">
            <X size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
