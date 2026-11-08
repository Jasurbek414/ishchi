import { useState, useEffect } from 'react';
import { api } from '../api/client.js';
import { useToast } from '../components/Toast.jsx';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Phone,
  FileText,
  ShieldCheck,
  Search,
  ExternalLink,
  Eye,
  RefreshCw,
  Zap,
} from 'lucide-react';

export default function EmergencyPage() {
  const toast = useToast();
  const [stats, setStats] = useState({ pendingCount: 0, approvedCount: 0, rejectedCount: 0, totalSpecialists: 0 });
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('PENDING'); // PENDING | APPROVED | REJECTED | ALL
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Review modal state
  const [rejectModalApp, setRejectModalApp] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Document photo preview modal
  const [previewImage, setPreviewImage] = useState(null);

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
      const query = { page, size: 20 };
      if (statusFilter !== 'ALL') query.status = statusFilter;
      const data = await api.get('/api/admin/emergency/applications', query);
      setApplications(data?.content || []);
      setTotalPages(data?.totalPages || 1);
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

  const handleApprove = async (app) => {
    if (!window.confirm(`${app.workerFullName} arizasini tasdiqlab, favqulodda mutaxassis maqomini berishni xohlaysizmi?`)) {
      return;
    }
    try {
      await api.post(`/api/admin/emergency/applications/${app.id}/approve`, {});
      toast.success(`${app.workerFullName} tasdiqlandi va favqulodda mutaxassislar ro'yxatiga qo'shildi!`);
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

  const handleToggleEmergency = async (app, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      await api.post(`/api/admin/emergency/workers/${app.workerId}/toggle?emergency=${newStatus}`);
      toast.success(newStatus ? "Favqulodda maqomi yoqildi" : "Favqulodda maqomi o'chirildi");
      fetchStats();
      fetchApplications();
    } catch (err) {
      toast.error(err.message || "Xatolik yuz berdi");
    }
  };

  return (
    <div className="page-container p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <span className="text-rose-600">🚨</span> Favqulodda mutaxassislar & Shartnomalar
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            24/7 tezkor xizmat ko'rsatish arizalari, hujjatlar tekshiruvi va shartnomalar monitoringi
          </p>
        </div>
        <button
          onClick={() => {
            fetchStats();
            fetchApplications();
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl shadow-sm transition"
        >
          <RefreshCw className="w-4 h-4" /> Yangilash
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-xl shadow-sm">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-amber-900">{stats.pendingCount}</div>
            <div className="text-xs font-semibold text-amber-700">Kutilayotgan arizalar</div>
          </div>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold text-xl shadow-sm">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-900">{stats.approvedCount}</div>
            <div className="text-xs font-semibold text-emerald-700">Tasdiqlangan arizalar</div>
          </div>
        </div>

        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-500 text-white flex items-center justify-center font-bold text-xl shadow-sm">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-rose-900">{stats.rejectedCount}</div>
            <div className="text-xs font-semibold text-rose-700">Rad etilgan arizalar</div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xl shadow-sm">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-blue-900">{stats.totalSpecialists}</div>
            <div className="text-xs font-semibold text-blue-700">Faol favqulodda ustalar</div>
          </div>
        </div>
      </div>

      {/* Tabs Filter */}
      <div className="flex gap-2 border-b border-slate-200 pb-3">
        {[
          { key: 'PENDING', label: `Kutilayotganlar (${stats.pendingCount})` },
          { key: 'APPROVED', label: `Tasdiqlanganlar (${stats.approvedCount})` },
          { key: 'REJECTED', label: `Rad etilganlar (${stats.rejectedCount})` },
          { key: 'ALL', label: 'Barchasi' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setStatusFilter(tab.key);
              setPage(0);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              statusFilter === tab.key
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Applications List */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
          <RefreshCw className="w-6 h-6 animate-spin text-rose-600" />
          <span className="text-sm font-medium">Arizalar yuklanmoqda...</span>
        </div>
      ) : applications.length === 0 ? (
        <div className="py-20 bg-white rounded-2xl border border-slate-200 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-2xl mb-3">
            📋
          </div>
          <h3 className="font-bold text-slate-800 text-base">Hozircha arizalar mavjud emas</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Ushbu bo'limda ishchilar tomonidan yuborilgan shartnoma arizalari va hujjatlar paydo bo'ladi.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {applications.map((app) => (
            <div
              key={app.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-slate-300 transition-all flex flex-col lg:flex-row gap-5"
            >
              {/* Left Column: Worker info */}
              <div className="flex-1 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
                      {app.workerAvatarUrl ? (
                        <img src={app.workerAvatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-slate-500">
                          {app.workerFullName?.slice(0, 2).toUpperCase() || 'U'}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-base text-slate-900">{app.workerFullName}</h3>
                        {app.workerCurrentlyEmergency && (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                            <Zap className="w-3 h-3" /> Faol
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                        <span className="font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                          {app.category}
                        </span>
                        {app.experienceYears && (
                          <span>• {app.experienceYears} yil staj</span>
                        )}
                        <span>• Ariza: {new Date(app.createdAt).toLocaleDateString('uz-UZ')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {app.status === 'PENDING' && (
                      <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Kutilmoqda
                      </span>
                    )}
                    {app.status === 'APPROVED' && (
                      <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Tasdiqlangan
                      </span>
                    )}
                    {app.status === 'REJECTED' && (
                      <span className="bg-rose-100 text-rose-800 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> Rad etilgan
                      </span>
                    )}
                  </div>
                </div>

                {/* Contacts & Passport metadata */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="font-medium text-slate-700">{app.phone}</span>
                  </div>
                  {app.telegramUsername && (
                    <div className="flex items-center gap-2">
                      <span className="text-blue-500 font-bold">@</span>
                      <span className="text-slate-700">@{app.telegramUsername.replace('@', '')}</span>
                    </div>
                  )}
                  {app.passportData && (
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="text-slate-700">Pasport: {app.passportData}</span>
                    </div>
                  )}
                </div>

                {/* Description or Rejection reason */}
                {app.description && (
                  <div className="text-xs text-slate-600 bg-white border border-slate-100 rounded-xl p-2.5">
                    <span className="font-bold text-slate-800 block mb-0.5">Usta izohi:</span>
                    {app.description}
                  </div>
                )}
                {app.rejectionReason && (
                  <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-2.5">
                    <span className="font-bold block mb-0.5">Rad etish sababi:</span>
                    {app.rejectionReason}
                  </div>
                )}
              </div>

              {/* Middle Column: Attached Documents */}
              <div className="lg:w-72 shrink-0 space-y-2 border-t lg:border-t-0 lg:border-l border-slate-100 pt-3 lg:pt-0 lg:pl-5">
                <span className="text-xs font-bold text-slate-700 block">Yuklangan hujjatlar:</span>
                <div className="grid grid-cols-2 gap-2">
                  {/* Passport Front */}
                  {app.passportPhotoUrl ? (
                    <div
                      onClick={() => setPreviewImage(app.passportPhotoUrl)}
                      className="group relative h-20 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 cursor-pointer"
                    >
                      <img src={app.passportPhotoUrl} alt="Pasport" className="w-full h-full object-cover group-hover:scale-105 transition" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[11px] font-bold gap-1">
                        <Eye className="w-3.5 h-3.5" /> Pasport
                      </div>
                    </div>
                  ) : (
                    <div className="h-20 bg-slate-50 border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 text-[10.5px]">
                      Pasport yo'q
                    </div>
                  )}

                  {/* Passport Back */}
                  {app.passportBackUrl ? (
                    <div
                      onClick={() => setPreviewImage(app.passportBackUrl)}
                      className="group relative h-20 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 cursor-pointer"
                    >
                      <img src={app.passportBackUrl} alt="Pasport orqasi" className="w-full h-full object-cover group-hover:scale-105 transition" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[11px] font-bold gap-1">
                        <Eye className="w-3.5 h-3.5" /> Orqa tomoni
                      </div>
                    </div>
                  ) : (
                    <div className="h-20 bg-slate-50 border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 text-[10.5px]">
                      Orqa tomoni yo'q
                    </div>
                  )}

                  {/* Certificate */}
                  {app.certificateUrl && (
                    <div
                      onClick={() => setPreviewImage(app.certificateUrl)}
                      className="group relative h-20 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 cursor-pointer"
                    >
                      <img src={app.certificateUrl} alt="Sertifikat" className="w-full h-full object-cover group-hover:scale-105 transition" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[11px] font-bold gap-1">
                        <Eye className="w-3.5 h-3.5" /> Sertifikat
                      </div>
                    </div>
                  )}

                  {/* Tools / Vehicle Photo */}
                  {app.toolsPhotoUrl && (
                    <div
                      onClick={() => setPreviewImage(app.toolsPhotoUrl)}
                      className="group relative h-20 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 cursor-pointer"
                    >
                      <img src={app.toolsPhotoUrl} alt="Asboblar" className="w-full h-full object-cover group-hover:scale-105 transition" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[11px] font-bold gap-1">
                        <Eye className="w-3.5 h-3.5" /> Asboblar
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Actions */}
              <div className="lg:w-48 shrink-0 flex flex-row lg:flex-col justify-end lg:justify-center gap-2 border-t lg:border-t-0 lg:border-l border-slate-100 pt-3 lg:pt-0 lg:pl-5">
                {app.status === 'PENDING' ? (
                  <>
                    <button
                      onClick={() => handleApprove(app)}
                      className="flex-1 lg:flex-none py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition active:scale-95"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Tasdiqlash
                    </button>
                    <button
                      onClick={() => {
                        setRejectModalApp(app);
                        setRejectionReason('');
                      }}
                      className="flex-1 lg:flex-none py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95"
                    >
                      <XCircle className="w-4 h-4" /> Rad etish
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleToggleEmergency(app, app.workerCurrentlyEmergency)}
                    className={`w-full py-2.5 px-3 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition ${
                      app.workerCurrentlyEmergency
                        ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    {app.workerCurrentlyEmergency ? "Maqomni o'chirish" : "Qayta yoqish"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rejection Modal */}
      {rejectModalApp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-xl animate-in fade-in duration-150">
            <h3 className="font-extrabold text-slate-900 text-base mb-1">
              Arizani rad etish: {rejectModalApp.workerFullName}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Ushbu sabab mutaxassis profiliga va unga yuboriladigan bildirishnomada ko'rinadi:
            </p>
            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <textarea
                required
                rows={3}
                placeholder="Rad etish sababini yozing (masalan: Pasport rasmi xira, malaka hujjati yetarli emas...)"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setRejectModalApp(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm disabled:opacity-50"
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
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl">
            <img src={previewImage} alt="Hujjat" className="w-full h-full object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}
