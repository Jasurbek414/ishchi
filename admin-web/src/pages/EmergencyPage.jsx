import { useState, useEffect, useMemo } from 'react';
import { api } from '../api/client.js';
import { useToast } from '../components/Toast.jsx';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Phone,
  FileText,
  FileCheck,
  Search,
  ExternalLink,
  Eye,
  RefreshCw,
  Zap,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  X,
  User,
  Calendar,
  Award,
  Wrench,
  AlertTriangle,
  Send,
} from 'lucide-react';

export default function EmergencyPage() {
  const toast = useToast();
  const [stats, setStats] = useState({ pendingCount: 0, approvedCount: 0, rejectedCount: 0, totalSpecialists: 0 });
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('PENDING'); // PENDING | APPROVED | REJECTED | ALL
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Review modal state
  const [rejectModalApp, setRejectModalApp] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Detail modal state
  const [detailApp, setDetailApp] = useState(null);

  // Document photo preview lightbox modal
  const [previewImage, setPreviewImage] = useState(null);
  const [copiedPhone, setCopiedPhone] = useState(null);

  const fetchStats = async () => {
    try {
      const data = await api.get('/api/admin/emergency/stats');
      if (data) setStats(data);
    } catch (err) {
      console.error('Stats error:', err);
    }
  };

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const query = { page, size: 25 };
      if (statusFilter !== 'ALL') query.status = statusFilter;
      const data = await api.get('/api/admin/emergency/applications', query);
      setApplications(data?.content || []);
      setTotalPages(data?.totalPages || 1);
      setTotalElements(data?.totalElements || (data?.content ? data.content.length : 0));
    } catch (err) {
      toast.error("Arizalarni yuklashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [statusFilter, page]);

  const handleCopyPhone = (phone, e) => {
    e?.stopPropagation();
    if (!phone) return;
    navigator.clipboard.writeText(phone);
    setCopiedPhone(phone);
    toast.success(`Nusxalandi: ${phone}`);
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  const handleApprove = async (app, e) => {
    e?.stopPropagation();
    if (!window.confirm(`${app.workerFullName} arizasini tasdiqlab, shartnomani rasmiylashtirish va favqulodda mutaxassis maqomini berishni tasdiqlaysizmi?`)) {
      return;
    }
    try {
      await api.post(`/api/admin/emergency/applications/${app.id}/approve`, {});
      toast.success(`${app.workerFullName} shartnomasi tasdiqlandi!`);
      if (detailApp?.id === app.id) {
        setDetailApp((prev) => (prev ? { ...prev, status: 'APPROVED', workerCurrentlyEmergency: true } : null));
      }
      fetchStats();
      fetchApplications();
    } catch (err) {
      toast.error(err.message || "Tasdiqlashda xatolik");
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectModalApp) return;
    setIsSubmittingReview(true);
    try {
      await api.post(`/api/admin/emergency/applications/${rejectModalApp.id}/reject`, {
        reason: rejectionReason.trim(),
      });
      toast.success("Ariza rad etildi va mutaxassisga bildirishnoma yuborildi");
      if (detailApp?.id === rejectModalApp.id) {
        setDetailApp((prev) => (prev ? { ...prev, status: 'REJECTED', rejectionReason: rejectionReason.trim() } : null));
      }
      setRejectModalApp(null);
      setRejectionReason('');
      fetchStats();
      fetchApplications();
    } catch (err) {
      toast.error(err.message || "Rad etishda xatolik");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleToggleEmergency = async (app, currentStatus, e) => {
    e?.stopPropagation();
    try {
      const newStatus = !currentStatus;
      await api.post(`/api/admin/emergency/workers/${app.workerId}/toggle?emergency=${newStatus}`);
      toast.success(newStatus ? "Favqulodda maqomi faollashtirildi" : "Favqulodda maqomi o'chirildi");
      if (detailApp?.id === app.id) {
        setDetailApp((prev) => (prev ? { ...prev, workerCurrentlyEmergency: newStatus } : null));
      }
      fetchStats();
      fetchApplications();
    } catch (err) {
      toast.error(err.message || "Xatolik yuz berdi");
    }
  };

  // Filter applications by search query client-side
  const filteredApplications = useMemo(() => {
    if (!searchQuery.trim()) return applications;
    const q = searchQuery.toLowerCase().trim();
    return applications.filter((app) => {
      const name = (app.workerFullName || '').toLowerCase();
      const phone = (app.phone || '').toLowerCase();
      const category = (app.category || '').toLowerCase();
      const passport = (app.passportData || '').toLowerCase();
      const tg = (app.telegramUsername || '').toLowerCase();
      return name.includes(q) || phone.includes(q) || category.includes(q) || passport.includes(q) || tg.includes(q);
    });
  }, [applications, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <FileCheck className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                Shartnomalar
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  24/7 Shartnoma & Hujjatlar
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Ishchilarning shartnoma arizalari, shaxsini tasdiqlovchi hujjatlar ekspertizasi va mutaxassislik maqomini boshqarish
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            fetchStats();
            fetchApplications();
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl shadow-xs transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          <span>Yangilash</span>
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div
          onClick={() => { setStatusFilter('PENDING'); setPage(0); }}
          className={`cursor-pointer rounded-2xl p-4 transition-all border ${
            statusFilter === 'PENDING'
              ? 'bg-amber-500/10 border-amber-300 ring-2 ring-amber-400/40 shadow-sm'
              : 'bg-white border-slate-200 hover:border-amber-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700">Kutilmoqda</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{stats.pendingCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Tekshirilishi kerak bo'lgan arizalar</div>
        </div>

        <div
          onClick={() => { setStatusFilter('APPROVED'); setPage(0); }}
          className={`cursor-pointer rounded-2xl p-4 transition-all border ${
            statusFilter === 'APPROVED'
              ? 'bg-emerald-500/10 border-emerald-300 ring-2 ring-emerald-400/40 shadow-sm'
              : 'bg-white border-slate-200 hover:border-emerald-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700">Tasdiqlangan</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{stats.approvedCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Faol shartnomalar soni</div>
        </div>

        <div
          onClick={() => { setStatusFilter('REJECTED'); setPage(0); }}
          className={`cursor-pointer rounded-2xl p-4 transition-all border ${
            statusFilter === 'REJECTED'
              ? 'bg-rose-500/10 border-rose-300 ring-2 ring-rose-400/40 shadow-sm'
              : 'bg-white border-slate-200 hover:border-rose-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700">Rad etilgan</span>
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{stats.rejectedCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Hujjatlari qanoatlantirmagan</div>
        </div>

        <div
          onClick={() => { setStatusFilter('ALL'); setPage(0); }}
          className={`cursor-pointer rounded-2xl p-4 transition-all border ${
            statusFilter === 'ALL'
              ? 'bg-indigo-500/10 border-indigo-300 ring-2 ring-indigo-400/40 shadow-sm'
              : 'bg-white border-slate-200 hover:border-indigo-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-700">Faol ustalar</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{stats.totalSpecialists}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">24/7 xizmat ko'rsatishga tayyor</div>
        </div>
      </div>

      {/* Table Container Card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {/* Filters and Search Bar */}
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { key: 'PENDING', label: 'Kutilayotgan', count: stats.pendingCount },
              { key: 'APPROVED', label: 'Tasdiqlangan', count: stats.approvedCount },
              { key: 'REJECTED', label: 'Rad etilgan', count: stats.rejectedCount },
              { key: 'ALL', label: 'Barchasi', count: null },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setStatusFilter(tab.key);
                  setPage(0);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                  statusFilter === tab.key
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <span
                    className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                      statusFilter === tab.key ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Qidiruv: ism, telefon, yo'nalish..."
              className="w-full text-xs pl-9 pr-8 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Modern Structured Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-3">
              <RefreshCw className="w-7 h-7 animate-spin text-indigo-600" />
              <span className="text-xs font-semibold text-slate-600">Arizalar yuklanmoqda...</span>
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="py-20 text-center px-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl mb-3">
                <FileText className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">Arizalar topilmadi</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {searchQuery
                  ? "Qidiruv bo'yicha hech qanday ariza mos kelmadi. Filterni o'zgartirib ko'ring."
                  : "Ushbu bo'limda hozircha arizalar mavjud emas."}
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Mutaxassis</th>
                  <th className="py-3.5 px-4">Yo'nalish & Tajriba</th>
                  <th className="py-3.5 px-4">Aloqa</th>
                  <th className="py-3.5 px-4">Hujjatlar</th>
                  <th className="py-3.5 px-4">Sana & Holat</th>
                  <th className="py-3.5 px-4 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredApplications.map((app) => (
                  <tr
                    key={app.id}
                    onClick={() => setDetailApp(app)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    {/* Mutaxassis */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 relative">
                          {app.workerAvatarUrl ? (
                            <img src={app.workerAvatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-bold text-slate-500 bg-gradient-to-br from-indigo-50 to-slate-100 text-xs">
                              {app.workerFullName?.slice(0, 2).toUpperCase() || 'U'}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition text-[13px]">
                              {app.workerFullName || 'Noma\'lum mutaxassis'}
                            </span>
                            {app.workerCurrentlyEmergency && (
                              <span
                                title="Favqulodda tezkor buyurtmalarni qabul qiladi"
                                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black border border-emerald-200"
                              >
                                <Zap className="w-2.5 h-2.5 fill-emerald-500 text-emerald-500" /> Faol
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                            ID: #{app.workerId || app.id}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Yo'nalish & Tajriba */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <div className="inline-block px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-[11px] border border-indigo-100">
                          {app.category || 'Belgilanmagan'}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Award className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{app.experienceYears ? `${app.experienceYears} yil staj` : 'Staj ko\'rsatilmagan'}</span>
                        </div>
                        {app.passportData && (
                          <div className="text-[10.5px] text-slate-400 font-mono flex items-center gap-1">
                            <FileText className="w-2.5 h-2.5" />
                            <span>{app.passportData}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Aloqa */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-semibold text-slate-800 font-mono text-[12px]">{app.phone}</span>
                          <button
                            type="button"
                            onClick={(e) => handleCopyPhone(app.phone, e)}
                            title="Telefon raqamni nusxalash"
                            className="p-1 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-slate-100 transition"
                          >
                            {copiedPhone === app.phone ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        {app.telegramUsername ? (
                          <a
                            href={`https://t.me/${app.telegramUsername.replace('@', '')}`}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-[11px] text-sky-600 hover:text-sky-700 font-medium hover:underline"
                          >
                            <Send className="w-3 h-3" />
                            <span>@{app.telegramUsername.replace('@', '')}</span>
                          </a>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Telegram yo'q</span>
                        )}
                      </div>
                    </td>

                    {/* Hujjatlar */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {/* Pasport Oldi */}
                        {app.passportPhotoUrl ? (
                          <div
                            onClick={() => setPreviewImage({ url: app.passportPhotoUrl, title: `${app.workerFullName} - Pasport (Oldi)` })}
                            title="Pasport (Oldi) - Ko'rish uchun bosing"
                            className="group/doc relative w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden cursor-pointer hover:border-indigo-400 transition"
                          >
                            <img src={app.passportPhotoUrl} alt="Pasport oldi" className="w-full h-full object-cover group-hover/doc:scale-110 transition" />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/doc:opacity-100 transition flex items-center justify-center text-white">
                              <Eye className="w-3 h-3" />
                            </div>
                          </div>
                        ) : (
                          <div
                            title="Pasport oldi yuklanmagan"
                            className="w-9 h-9 rounded-lg border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-[9px] text-slate-400 text-center font-semibold"
                          >
                            P1-
                          </div>
                        )}

                        {/* Pasport Orqasi */}
                        {app.passportBackUrl ? (
                          <div
                            onClick={() => setPreviewImage({ url: app.passportBackUrl, title: `${app.workerFullName} - Pasport (Orqasi)` })}
                            title="Pasport (Orqasi) - Ko'rish uchun bosing"
                            className="group/doc relative w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden cursor-pointer hover:border-indigo-400 transition"
                          >
                            <img src={app.passportBackUrl} alt="Pasport orqasi" className="w-full h-full object-cover group-hover/doc:scale-110 transition" />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/doc:opacity-100 transition flex items-center justify-center text-white">
                              <Eye className="w-3 h-3" />
                            </div>
                          </div>
                        ) : (
                          <div
                            title="Pasport orqasi yuklanmagan"
                            className="w-9 h-9 rounded-lg border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-[9px] text-slate-400 text-center font-semibold"
                          >
                            P2-
                          </div>
                        )}

                        {/* Sertifikat */}
                        {app.certificateUrl ? (
                          <div
                            onClick={() => setPreviewImage({ url: app.certificateUrl, title: `${app.workerFullName} - Sertifikat / Diplom` })}
                            title="Sertifikat / Diplom - Ko'rish uchun bosing"
                            className="group/doc relative w-9 h-9 rounded-lg bg-slate-100 border border-emerald-200 overflow-hidden cursor-pointer hover:border-emerald-400 transition"
                          >
                            <img src={app.certificateUrl} alt="Sertifikat" className="w-full h-full object-cover group-hover/doc:scale-110 transition" />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/doc:opacity-100 transition flex items-center justify-center text-white">
                              <Award className="w-3 h-3" />
                            </div>
                          </div>
                        ) : null}

                        {/* Asboblar fotosurati */}
                        {app.toolsPhotoUrl ? (
                          <div
                            onClick={() => setPreviewImage({ url: app.toolsPhotoUrl, title: `${app.workerFullName} - Asboblar va Avtomobil` })}
                            title="Asboblar / Jihozlar - Ko'rish uchun bosing"
                            className="group/doc relative w-9 h-9 rounded-lg bg-slate-100 border border-amber-200 overflow-hidden cursor-pointer hover:border-amber-400 transition"
                          >
                            <img src={app.toolsPhotoUrl} alt="Asboblar" className="w-full h-full object-cover group-hover/doc:scale-110 transition" />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/doc:opacity-100 transition flex items-center justify-center text-white">
                              <Wrench className="w-3 h-3" />
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </td>

                    {/* Sana & Holat */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <div>
                          {app.status === 'PENDING' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[11px] font-bold border border-amber-200">
                              <Clock className="w-3 h-3" /> Kutilmoqda
                            </span>
                          )}
                          {app.status === 'APPROVED' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" /> Tasdiqlangan
                            </span>
                          )}
                          {app.status === 'REJECTED' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[11px] font-bold border border-rose-200">
                              <XCircle className="w-3 h-3" /> Rad etilgan
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(app.createdAt).toLocaleDateString('uz-UZ')}</span>
                        </div>
                      </div>
                    </td>

                    {/* Amallar */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setDetailApp(app)}
                          title="Batafsil ma'lumotni ko'rish"
                          className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition border border-transparent hover:border-indigo-200"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {app.status === 'PENDING' ? (
                          <>
                            <button
                              type="button"
                              onClick={(e) => handleApprove(app, e)}
                              title="Arizani tasdiqlash"
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 transition shadow-xs active:scale-95"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Tasdiqlash</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setRejectModalApp(app);
                                setRejectionReason('');
                              }}
                              title="Arizani rad etish"
                              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-bold text-[11px] flex items-center gap-1 transition active:scale-95"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Rad etish</span>
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => handleToggleEmergency(app, app.workerCurrentlyEmergency, e)}
                            title={app.workerCurrentlyEmergency ? "Favqulodda maqomini o'chirish" : "Favqulodda maqomini yoqish"}
                            className={`px-2.5 py-1.5 rounded-lg font-bold text-[11px] flex items-center gap-1 transition border ${
                              app.workerCurrentlyEmergency
                                ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                            }`}
                          >
                            <Zap className="w-3.5 h-3.5" />
                            <span>{app.workerCurrentlyEmergency ? "O'chirish" : "Yoqish"}</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50/50">
            <span className="text-xs text-slate-500 font-medium">
              Jami <strong>{totalElements}</strong> ta arizadan sahifa {page + 1} / {totalPages}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={page <= 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none text-xs font-bold text-slate-700 transition flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> Oldingi
              </button>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none text-xs font-bold text-slate-700 transition flex items-center gap-1"
              >
                Keyingi <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Slideout / Modal */}
      {detailApp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div
            className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-6 my-auto max-h-[90vh] overflow-y-auto border border-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 overflow-hidden shrink-0">
                  {detailApp.workerAvatarUrl ? (
                    <img src={detailApp.workerAvatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-black text-indigo-700 text-lg">
                      {detailApp.workerFullName?.slice(0, 2).toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-slate-900">{detailApp.workerFullName}</h2>
                    {detailApp.workerCurrentlyEmergency && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black border border-emerald-200">
                        <Zap className="w-3 h-3 fill-emerald-500" /> Faol
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                    <span className="font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {detailApp.category}
                    </span>
                    <span>• ID: #{detailApp.workerId || detailApp.id}</span>
                    <span>• {new Date(detailApp.createdAt).toLocaleDateString('uz-UZ')}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setDetailApp(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Applicant Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-slate-400 font-semibold block text-[11px]">Telefon raqami</span>
                <div className="flex items-center justify-between font-bold text-slate-800 text-[13px]">
                  <span>{detailApp.phone}</span>
                  <button
                    type="button"
                    onClick={(e) => handleCopyPhone(detailApp.phone, e)}
                    className="p-1 hover:bg-slate-200 rounded text-slate-500"
                    title="Nusxalash"
                  >
                    {copiedPhone === detailApp.phone ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-slate-400 font-semibold block text-[11px]">Telegram akkaunt</span>
                <div className="font-bold text-slate-800 text-[13px]">
                  {detailApp.telegramUsername ? (
                    <a
                      href={`https://t.me/${detailApp.telegramUsername.replace('@', '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sky-600 hover:underline inline-flex items-center gap-1"
                    >
                      <Send className="w-3 h-3" /> @{detailApp.telegramUsername.replace('@', '')}
                    </a>
                  ) : (
                    <span className="text-slate-400 font-normal">Kiritilmagan</span>
                  )}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-slate-400 font-semibold block text-[11px]">Pasport ma'lumotlari</span>
                <div className="font-bold text-slate-800 text-[13px] font-mono">
                  {detailApp.passportData || <span className="text-slate-400 font-normal">Kiritilmagan</span>}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-slate-400 font-semibold block text-[11px]">Ish tajribasi</span>
                <div className="font-bold text-slate-800 text-[13px]">
                  {detailApp.experienceYears ? `${detailApp.experienceYears} yil` : <span className="text-slate-400 font-normal">Ko'rsatilmagan</span>}
                </div>
              </div>
            </div>

            {/* Description or Notes */}
            {detailApp.description && (
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                <span className="font-bold text-slate-700 block mb-1">Mutaxassisning arizaga izohi:</span>
                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{detailApp.description}</p>
              </div>
            )}

            {/* Rejection Reason if any */}
            {detailApp.rejectionReason && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs">
                <span className="font-bold text-rose-800 block mb-1">Rad etish sababi:</span>
                <p className="text-rose-700 leading-relaxed">{detailApp.rejectionReason}</p>
              </div>
            )}

            {/* Document Gallery */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 block">Yuklangan hujjatlar:</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {/* Passport Front */}
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold text-slate-400 block">Pasport (Oldi)</span>
                  {detailApp.passportPhotoUrl ? (
                    <div
                      onClick={() => setPreviewImage({ url: detailApp.passportPhotoUrl, title: 'Pasport (Oldi tomoni)' })}
                      className="group relative h-28 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 cursor-pointer hover:border-indigo-400 transition"
                    >
                      <img src={detailApp.passportPhotoUrl} alt="Pasport" className="w-full h-full object-cover group-hover:scale-105 transition" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[11px] font-bold gap-1">
                        <Eye className="w-3.5 h-3.5" /> Kattalashtirish
                      </div>
                    </div>
                  ) : (
                    <div className="h-28 bg-slate-50 border border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400 text-xs text-center p-2">
                      Yuklanmagan
                    </div>
                  )}
                </div>

                {/* Passport Back */}
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold text-slate-400 block">Pasport (Orqasi)</span>
                  {detailApp.passportBackUrl ? (
                    <div
                      onClick={() => setPreviewImage({ url: detailApp.passportBackUrl, title: 'Pasport (Orqa tomoni)' })}
                      className="group relative h-28 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 cursor-pointer hover:border-indigo-400 transition"
                    >
                      <img src={detailApp.passportBackUrl} alt="Pasport orqasi" className="w-full h-full object-cover group-hover:scale-105 transition" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[11px] font-bold gap-1">
                        <Eye className="w-3.5 h-3.5" /> Kattalashtirish
                      </div>
                    </div>
                  ) : (
                    <div className="h-28 bg-slate-50 border border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400 text-xs text-center p-2">
                      Yuklanmagan
                    </div>
                  )}
                </div>

                {/* Certificate */}
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold text-slate-400 block">Sertifikat / Diplom</span>
                  {detailApp.certificateUrl ? (
                    <div
                      onClick={() => setPreviewImage({ url: detailApp.certificateUrl, title: 'Sertifikat / Malaka hujjati' })}
                      className="group relative h-28 bg-slate-100 rounded-xl overflow-hidden border border-emerald-200 cursor-pointer hover:border-emerald-400 transition"
                    >
                      <img src={detailApp.certificateUrl} alt="Sertifikat" className="w-full h-full object-cover group-hover:scale-105 transition" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[11px] font-bold gap-1">
                        <Eye className="w-3.5 h-3.5" /> Kattalashtirish
                      </div>
                    </div>
                  ) : (
                    <div className="h-28 bg-slate-50 border border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400 text-xs text-center p-2">
                      Mavjud emas
                    </div>
                  )}
                </div>

                {/* Tools Photo */}
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold text-slate-400 block">Asboblar & Avto</span>
                  {detailApp.toolsPhotoUrl ? (
                    <div
                      onClick={() => setPreviewImage({ url: detailApp.toolsPhotoUrl, title: 'Asboblar va Avtomobil' })}
                      className="group relative h-28 bg-slate-100 rounded-xl overflow-hidden border border-amber-200 cursor-pointer hover:border-amber-400 transition"
                    >
                      <img src={detailApp.toolsPhotoUrl} alt="Asboblar" className="w-full h-full object-cover group-hover:scale-105 transition" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[11px] font-bold gap-1">
                        <Eye className="w-3.5 h-3.5" /> Kattalashtirish
                      </div>
                    </div>
                  ) : (
                    <div className="h-28 bg-slate-50 border border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400 text-xs text-center p-2">
                      Mavjud emas
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDetailApp(null)}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
              >
                Yopish
              </button>

              {detailApp.status === 'PENDING' ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setRejectModalApp(detailApp);
                      setRejectionReason('');
                    }}
                    className="w-full sm:w-auto px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95"
                  >
                    <XCircle className="w-4 h-4" /> Rad etish
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApprove(detailApp)}
                    className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Tasdiqlash
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => handleToggleEmergency(detailApp, detailApp.workerCurrentlyEmergency)}
                  className={`w-full sm:w-auto px-5 py-2.5 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition border ${
                    detailApp.workerCurrentlyEmergency
                      ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                  }`}
                >
                  <Zap className="w-4 h-4" />
                  <span>{detailApp.workerCurrentlyEmergency ? "Favqulodda maqomini o'chirish" : "Favqulodda maqomini yoqish"}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {rejectModalApp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in fade-in duration-150 border border-slate-100 space-y-4">
            <div>
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-base">
                Arizani rad etish: {rejectModalApp.workerFullName}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Rad etish sababi mutaxassis ilovasida ko'rinadi va unga bildirishnoma yuboriladi:
              </p>
            </div>

            {/* Quick preset reasons */}
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 block">Tezkor andozalar:</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Pasport fotosurati xira yoki noaniq",
                  "Mutaxassislik sertifikati yoki diplomi talab qilinadi",
                  "Kiritilgan ma'lumotlar pasport bilan mos kelmadi",
                  "Telefon orqali bog'lanish imkoni bo'lmadi",
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setRejectionReason(preset)}
                    className="text-[10.5px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <textarea
                required
                rows={3}
                placeholder="Rad etish sababini batafsil yozing..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
              />

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setRejectModalApp(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReview || !rejectionReason.trim()}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs disabled:opacity-50 transition"
                >
                  {isSubmittingReview ? "Rad etilmoqda..." : "Rad etish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Preview Lightbox */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-4 cursor-pointer animate-in fade-in duration-150"
        >
          <div className="max-w-4xl max-h-[85vh] w-full flex flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
            <div className="w-full flex items-center justify-between text-white text-xs font-semibold px-2">
              <span className="truncate">{previewImage.title || 'Hujjat fotosurati'}</span>
              <div className="flex items-center gap-2">
                <a
                  href={previewImage.url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-white transition flex items-center gap-1 text-[11px]"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Asl o'lchamda
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewImage(null)}
                  className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-white transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="relative rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-black/40 max-h-[80vh] flex items-center justify-center">
              <img
                src={previewImage.url}
                alt={previewImage.title || "Hujjat"}
                className="max-w-full max-h-[80vh] object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}