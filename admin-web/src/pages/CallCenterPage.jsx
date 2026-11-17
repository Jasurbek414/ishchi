import { useState, useEffect, useRef } from 'react';
import { api } from '../api/client.js';
import { useToast } from '../components/Toast.jsx';
import {
  PhoneCall,
  PhoneIncoming,
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
  Calendar,
  X,
  Radio,
  Headphones,
} from 'lucide-react';

export default function CallCenterPage() {
  const toast = useToast();

  // Tab: 'tickets' | 'calls'
  const [activeTab, setActiveTab] = useState('tickets');

  // Live Call state (from SSE)
  const [liveCall, setLiveCall] = useState(null);
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

  // 1. Load Initial Stats & Regions
  useEffect(() => {
    fetchStats();
    fetchRegions();
  }, []);

  // 2. Fetch Tickets on filter change
  useEffect(() => {
    if (activeTab === 'tickets') {
      fetchTickets();
    } else {
      fetchCalls();
    }
  }, [activeTab, statusFilter, urgencyFilter, searchQuery, page, callStatusFilter, callSearchPhone, callsPage]);

  // 3. Setup SSE for Real-time Call Popups
  useEffect(() => {
    let eventSource = null;
    try {
      eventSource = new EventSource('/api/operator/stream');

      eventSource.onopen = () => {
        setSseConnected(true);
      };

      eventSource.addEventListener('CALL_INCOMING', (e) => {
        try {
          const data = JSON.parse(e.data);
          setLiveCall(data);
          toast.info(`Kiruvchi qo'ng'iroq: ${data.callerPhone}`);
          // Auto lookup and prefill create form
          setNewTicket((prev) => ({
            ...prev,
            callId: data.callId,
            customerPhone: data.callerPhone,
            customerName: data.customerName || '',
          }));
        } catch (err) {
          console.error('SSE parse error:', err);
        }
      });

      eventSource.addEventListener('CALL_ANSWERED', (e) => {
        try {
          const data = JSON.parse(e.data);
          if (liveCall && liveCall.callId === data.callId) {
            setLiveCall((prev) => ({ ...prev, status: 'ANSWERED' }));
          }
        } catch (err) {}
      });

      eventSource.addEventListener('CALL_ENDED', (e) => {
        try {
          const data = JSON.parse(e.data);
          if (liveCall && liveCall.callId === data.callId) {
            setLiveCall(null);
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
  }, []);

  // 4. Load districts when region changes
  useEffect(() => {
    if (newTicket.regionId) {
      api.get(`/api/regions/${newTicket.regionId}/districts`).then(setDistricts).catch(() => setDistricts([]));
    } else {
      setDistricts([]);
    }
  }, [newTicket.regionId]);

  // 5. Search available workers when modal is opened or filters change
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
    } catch (e) {
      setAvailableWorkers([]);
    } finally {
      setWorkersLoading(false);
    }
  };

  const handleLookupPhone = async (phone) => {
    if (!phone || phone.length < 9) return;
    try {
      const res = await api.get('/api/operator/lookup', { phone });
      if (res && res.exists) {
        setNewTicket((prev) => ({
          ...prev,
          customerName: res.fullName || prev.customerName,
          regionId: res.regionId || prev.regionId,
          districtId: res.districtId || prev.districtId,
        }));
        toast.success(`Mijoz topildi: ${res.fullName || res.phone}`);
      }
    } catch (e) {}
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!newTicket.customerPhone || !newTicket.problemDescription) {
      toast.error("Mijoz telefoni va muammo tavsifi majburiy");
      return;
    }

    try {
      await api.post('/api/operator/tickets', {
        ...newTicket,
        assignedWorkerId: selectedWorker ? selectedWorker.id : null,
        priceAgreed: newTicket.priceAgreed ? Number(newTicket.priceAgreed) : null,
      });
      toast.success("Murojaat muvaffaqiyatli ro'yxatga olindi!");
      setShowCreateModal(false);
      setSelectedWorker(null);
      setLiveCall(null);
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
      fetchTickets();
      fetchStats();
    } catch (err) {
      toast.error(err.message || "Arizani saqlashda xatolik");
    }
  };

  const handleAssignWorkerToExisting = async (workerId) => {
    if (!selectedTicket) return;
    try {
      await api.post(`/api/operator/tickets/${selectedTicket.id}/assign`, {
        workerId,
      });
      toast.success("Mutaxassis muvaffaqiyatli biriktirildi va unga bildirishnoma yuborildi!");
      setShowAssignModal(false);
      setSelectedTicket(null);
      fetchTickets();
      fetchStats();
    } catch (err) {
      toast.error("Biriktirishda xatolik: " + err.message);
    }
  };

  const handleUpdateStatus = async (ticketId, newStatus) => {
    try {
      await api.patch(`/api/operator/tickets/${ticketId}`, { status: newStatus });
      toast.success(`Status yangilandi: ${newStatus}`);
      fetchTickets();
      fetchStats();
      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket((prev) => ({ ...prev, status: newStatus }));
      }
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
      {/* 1. Header with Live Status & Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center">
            <Headphones size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">Call-Center & Dispetcherlik</h1>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                sseConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
              }`}>
                <span className={`w-2 h-2 rounded-full ${sseConnected ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`}></span>
                {sseConnected ? 'Jonli efirda (Online)' : 'Ulanmoqda...'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Qisqa raqam orqali kelayotgan qo'ng'iroqlarni qabul qilish va ustalarni yo'naltirish
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
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
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition shadow-sm cursor-pointer"
          >
            <Plus size={18} />
            Yangi ariza ochish
          </button>
        </div>
      </div>

      {/* 2. Live Incoming Call Alert (Banner) */}
      {liveCall && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-5 rounded-2xl shadow-lg flex flex-col md:flex-row items-center justify-between gap-4 animate-bounce duration-1000">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
              <PhoneIncoming size={32} />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-blue-200 font-semibold">Kiruvchi qo'ng'iroq (Qisqa raqam)</div>
              <div className="text-2xl font-black">{liveCall.callerPhone}</div>
              <div className="text-sm text-blue-100">
                {liveCall.customerName ? `Mijoz: ${liveCall.customerName}` : "Yangi murojaat"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setShowCreateModal(true);
              }}
              className="px-5 py-2.5 bg-white text-blue-700 hover:bg-blue-50 font-semibold text-sm rounded-xl transition shadow cursor-pointer"
            >
              Arizani to'ldirish
            </button>
            <button
              onClick={() => setLiveCall(null)}
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition cursor-pointer"
              title="Yopish"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      {/* 3. Top Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="text-xs text-slate-500">Bugungi qo'ng'iroqlar</div>
          <div className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{stats.totalCallsToday}</div>
          <div className="text-xs text-emerald-600 font-medium mt-1">Javob berildi: {stats.answeredCallsToday}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="text-xs text-slate-500">O'tkazib yuborilgan</div>
          <div className="text-2xl font-bold text-red-600 mt-1">{stats.missedCallsToday}</div>
          <div className="text-xs text-slate-400 mt-1">Qayta aloqa kerak</div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="text-xs text-slate-500">Faol arizalar</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{stats.activeTickets}</div>
          <div className="text-xs text-purple-600 font-medium mt-1">Usta yo'naltirilgan</div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="text-xs text-slate-500">Bugun bajarildi</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{stats.completedTicketsToday}</div>
          <div className="text-xs text-slate-400 mt-1">Yopilgan arizalar</div>
        </div>
      </div>

      {/* 4. Tab Navigation */}
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
          Murojaatlar & Arizalar ({stats.activeTickets})
        </button>
        <button
          onClick={() => setActiveTab('calls')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 cursor-pointer transition ${
            activeTab === 'calls'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <PhoneCall size={18} />
          Qo'ng'iroqlar tarixi (SIP Asterisk)
        </button>
      </div>

      {/* 5. Content Section */}
      {activeTab === 'tickets' ? (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Raqam, ism yoki chipta ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-2 px-3 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
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
              className="py-2 px-3 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
            >
              <option value="">Barcha shoshilinchlik darajalari</option>
              <option value="NORMAL">Oddiy</option>
              <option value="URGENT">Tezkor</option>
              <option value="EMERGENCY">Shoshilinch (SOS)</option>
            </select>

            <button
              onClick={() => {
                setStatusFilter('');
                setUrgencyFilter('');
                setSearchQuery('');
                fetchTickets();
              }}
              className="flex items-center justify-center gap-2 py-2 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium transition cursor-pointer"
            >
              <RefreshCw size={16} />
              Tozalash
            </button>
          </div>

          {/* Tickets Table */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-3 px-4">Chipta ID</th>
                    <th className="py-3 px-4">Mijoz / Telefon</th>
                    <th className="py-3 px-4">Kategoriya / Muammo</th>
                    <th className="py-3 px-4">Manzil</th>
                    <th className="py-3 px-4">Biriktirilgan Usta</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Amal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
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
                        <td className="py-3.5 px-4 font-mono font-medium text-blue-600">
                          {t.ticketNumber}
                          <div className="mt-1">{getUrgencyBadge(t.urgency)}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {t.customerName || "Noma'lum mijoz"}
                          </div>
                          <div className="text-xs text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                            <PhoneIncoming size={12} /> {t.customerPhone}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-medium text-slate-800 dark:text-slate-200">{t.category}</span>
                          <div className="text-xs text-slate-500 max-w-xs truncate mt-0.5">
                            {t.problemDescription}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-300">
                          <div className="font-medium">{t.regionName} {t.districtName ? `, ${t.districtName}` : ''}</div>
                          <div className="text-slate-400 truncate max-w-xs">{t.addressLine || '—'}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          {t.assignedWorkerName ? (
                            <div>
                              <div className="font-medium text-slate-900 dark:text-white flex items-center gap-1">
                                <User size={13} className="text-emerald-600" />
                                {t.assignedWorkerName}
                              </div>
                              <div className="text-xs text-slate-500 font-mono">{t.assignedWorkerPhone}</div>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedTicket(t);
                                setShowAssignModal(true);
                              }}
                              className="px-2.5 py-1 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md font-medium transition cursor-pointer"
                            >
                              + Usta biriktirish
                            </button>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {getStatusBadge(t.status)}
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-1">
                          <button
                            onClick={() => {
                              setSelectedTicket(t);
                              setShowAssignModal(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg transition"
                            title="Tahrirlash / Usta biriktirish"
                          >
                            <Wrench size={16} />
                          </button>
                          {t.status === 'ASSIGNED' && (
                            <button
                              onClick={() => handleUpdateStatus(t.id, 'IN_PROGRESS')}
                              className="px-2 py-1 text-xs bg-amber-500 text-white hover:bg-amber-600 rounded-md transition font-medium"
                            >
                              Boshlandi
                            </button>
                          )}
                          {t.status === 'IN_PROGRESS' && (
                            <button
                              onClick={() => handleUpdateStatus(t.id, 'COMPLETED')}
                              className="px-2 py-1 text-xs bg-emerald-600 text-white hover:bg-emerald-700 rounded-md transition font-medium"
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
      ) : (
        /* Calls History Tab */
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row gap-3">
            <input
              type="text"
              placeholder="Telefon raqam bo'yicha qidirish..."
              value={callSearchPhone}
              onChange={(e) => setCallSearchPhone(e.target.value)}
              className="py-2 px-3 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg flex-1"
            />
            <select
              value={callStatusFilter}
              onChange={(e) => setCallStatusFilter(e.target.value)}
              className="py-2 px-3 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
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
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-4">Qo'ng'iroq ID</th>
                  <th className="py-3 px-4">Raqam</th>
                  <th className="py-3 px-4">Qisqa raqam</th>
                  <th className="py-3 px-4">Vaqt</th>
                  <th className="py-3 px-4">Davomiyligi</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Ovoz yozuvi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {callsLoading ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-400">
                      Qo'ng'iroqlar yuklanmoqda...
                    </td>
                  </tr>
                ) : calls.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-400">
                      Qo'ng'iroqlar tarixi mavjud emas
                    </td>
                  </tr>
                ) : (
                  calls.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition">
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-500">{c.callId}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white font-mono">
                        {c.callerPhone}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs">{c.destinationNumber || '1055'}</td>
                      <td className="py-3.5 px-4 text-xs text-slate-500">
                        {new Date(c.startTime).toLocaleString('uz-UZ')}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-mono">
                        {c.durationSeconds ? `${c.durationSeconds} sek` : '0 sek'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          c.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                          c.status === 'MISSED' ? 'bg-red-100 text-red-800' :
                          c.status === 'RINGING' ? 'bg-blue-100 text-blue-800 animate-pulse' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {c.recordingUrl ? (
                          <button
                            onClick={() => setPlayingAudioUrl(c.recordingUrl)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg inline-flex items-center gap-1 text-xs cursor-pointer"
                          >
                            <Play size={14} /> Eshitish
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
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

      {/* 6. Modal: Create Ticket (Ariza ochish & Dispatch) */}
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
                      handleLookupPhone(e.target.value);
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
                      <option key={r.id} value={r.id}>{r.nameUz}</option>
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
                      <option key={d.id} value={d.id}>{d.nameUz}</option>
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
                          <div className="text-blue-600 font-mono text-[11px]">{w.phone}</div>
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

      {/* 7. Modal: Assign Worker to Existing Ticket */}
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
                      <div className="text-xs text-slate-500 font-mono">{w.phone}</div>
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

      {/* 8. Audio Player Modal */}
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
