import { useState, useEffect } from 'react';
import { api } from '../api/client.js';
import { useToast } from '../components/Toast.jsx';
import {
  Bell,
  Send,
  User,
  Users,
  Smartphone,
  MessageSquare,
  CheckCircle2,
  Clock,
  RefreshCw,
  Search,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Phone,
  AlertTriangle,
  Info,
  Tag,
  Radio,
} from 'lucide-react';

const NOTIFICATION_TYPES = [
  { value: 'SYSTEM', label: 'Tizim bildirishnomasi', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { value: 'JOB', label: 'Buyurtma & Ish', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'PROMO', label: 'Aksiya & Yangilik', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'WARNING', label: 'Ogohlantirish', badge: 'bg-rose-50 text-rose-700 border-rose-200' },
];

const TEMPLATES = [
  {
    title: 'Ishchi: Ilovangizni yangilang! 🚀',
    body: 'Hurmatli foydalanuvchi, Play Marketda ilovaning yangi va tezkor versiyasi chiqdi. Ilovangizni yangilab oling!',
    type: 'SYSTEM',
  },
  {
    title: 'Xush kelibsiz! 🎉',
    body: 'Ishchi platformasiga xush kelibsiz! Profilingizni to\'liq to\'ldiring va yangi buyurtmalarni birinchilardan bo\'lib qabul qiling.',
    type: 'SYSTEM',
  },
  {
    title: 'Profilingiz tasdiqlandi ✅',
    body: 'Siz yuborgan ma\'lumotlar muvaffaqiyatli tekshirildi va profilingiz faollashtirildi.',
    type: 'SYSTEM',
  },
  {
    title: 'Shartnoma tasdiqlandi 🚨',
    body: 'Tabriklaymiz! Favqulodda tezkor usta maqomi bo\'yicha arizangiz tasdiqlandi. Endi siz 24/7 tezkor xizmatlar ro\'yxatidasiz.',
    type: 'JOB',
  },
  {
    title: 'Muhim ogohlantirish ⚠️',
    body: 'Iltimos, ilovadan foydalanish qoidalariga rioya qiling. Savollar bo\'lsa, qo\'llab-quvvatlash xizmatiga murojaat qiling.',
    type: 'WARNING',
  },
];

export default function NotificationsPage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('single'); // 'single' | 'broadcast'

  // Single user form state
  const [singlePhone, setSinglePhone] = useState('');
  const [singleTitle, setSingleTitle] = useState('');
  const [singleBody, setSingleBody] = useState('');
  const [singleType, setSingleType] = useState('SYSTEM');
  const [singleLoading, setSingleLoading] = useState(false);

  // Broadcast form state
  const [broadcastTarget, setBroadcastTarget] = useState('ALL'); // 'ALL' | 'WORKER' | 'EMPLOYER'
  const [broadcastRegionId, setBroadcastRegionId] = useState('');
  const [broadcastChannel, setBroadcastChannel] = useState('app'); // 'app' | 'telegram'
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastBody, setBroadcastBody] = useState('');
  const [broadcastLoading, setBroadcastLoading] = useState(false);

  // Regions for filter
  const [regions, setRegions] = useState([]);

  // Recent notifications history
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  useEffect(() => {
    api.get('/api/regions').then(setRegions).catch(() => {});
  }, []);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const data = await api.get('/api/admin/notifications/recent', { page, size: 15 });
      setHistory(data?.content || []);
      setTotalPages(data?.totalPages || 1);
      setTotalElements(data?.totalElements || 0);
    } catch (err) {
      console.error('History error:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [page]);

  const handleApplyTemplate = (tpl) => {
    if (activeTab === 'single') {
      setSingleTitle(tpl.title);
      setSingleBody(tpl.body);
      setSingleType(tpl.type);
    } else {
      setBroadcastTitle(tpl.title);
      setBroadcastBody(tpl.body);
    }
    toast.success("Andoza matni yuklandi");
  };

  const handleSendSingle = async (e) => {
    e.preventDefault();
    if (!singlePhone.trim() || !singleTitle.trim() || !singleBody.trim()) {
      toast.error("Barcha maydonlarni to'ldiring");
      return;
    }

    setSingleLoading(true);
    try {
      await api.post('/api/admin/notifications/send-to-user', {
        phone: singlePhone.trim(),
        title: singleTitle.trim(),
        body: singleBody.trim(),
        type: singleType,
      });

      toast.success(`${singlePhone} raqamiga bildirishnoma yuborildi!`);
      setSingleTitle('');
      setSingleBody('');
      fetchHistory();
    } catch (err) {
      toast.error(err.message || "Yuborishda xatolik yuz berdi");
    } finally {
      setSingleLoading(false);
    }
  };

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastBody.trim()) {
      toast.error("Sarlavha va xabar matnini kiriting");
      return;
    }

    const confirmText = broadcastChannel === 'telegram'
      ? "Telegram bot orqali ommaviy xabar yuborishni tasdiqlaysizmi?"
      : "Barcha foydalanuvchilar ilovasiga push-bildirishnoma yuborishni tasdiqlaysizmi?";

    if (!window.confirm(confirmText)) return;

    setBroadcastLoading(true);
    try {
      const endpoint = broadcastChannel === 'telegram'
        ? '/api/admin/notifications/telegram-broadcast'
        : '/api/admin/notifications/broadcast';

      await api.post(endpoint, {
        title: broadcastTitle.trim(),
        body: broadcastBody.trim(),
        role: broadcastTarget === 'ALL' ? null : broadcastTarget,
        regionId: broadcastRegionId ? Number(broadcastRegionId) : null,
      });

      toast.success("Ommaviy bildirishnoma navbatga qo'yildi va yuborilmoqda!");
      setBroadcastTitle('');
      setBroadcastBody('');
      fetchHistory();
    } catch (err) {
      toast.error(err.message || "Ommaviy xabar yuborishda xatolik");
    } finally {
      setBroadcastLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                Bildirishnomalar
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  FCM Push & In-App
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Foydalanuvchilarga individual yoki ommaviy push-bildirishnomalar yuborish
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={fetchHistory}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl shadow-xs transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${historyLoading ? 'animate-spin text-indigo-600' : ''}`} />
          <span>Tarixni yangilash</span>
        </button>
      </div>

      {/* Main Grid: Left is Form, Right is Templates & Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Sending Form (2 cols) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
          {/* Tabs */}
          <div className="flex p-1 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => setActiveTab('single')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                activeTab === 'single'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-4 h-4 text-indigo-600" />
              <span>Bitta foydalanuvchiga (SMS/Push)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('broadcast')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                activeTab === 'broadcast'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4 text-emerald-600" />
              <span>Ommaviy yuborish (Broadcast)</span>
            </button>
          </div>

          {/* Form 1: Single User Notification */}
          {activeTab === 'single' && (
            <form onSubmit={handleSendSingle} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Foydalanuvchi telefon raqami
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="+998901234567 yoki 970504202"
                    value={singlePhone}
                    onChange={(e) => setSinglePhone(e.target.value)}
                    className="w-full text-xs font-mono pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Ilovada ro'yxatdan o'tgan istalgan ishchi yoki ish beruvchi raqamini kiriting.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Bildirishnoma sarlavhasi
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Masalan: Ishchi: Yangi xabarnoma! 🔔"
                    value={singleTitle}
                    onChange={(e) => setSingleTitle(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Xabar turi
                  </label>
                  <select
                    value={singleType}
                    onChange={(e) => setSingleType(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                  >
                    {NOTIFICATION_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Xabar matni
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Foydalanuvchi qurilmasiga yuboriladigan bildirishnoma matnini yozing..."
                  value={singleBody}
                  onChange={(e) => setSingleBody(e.target.value)}
                  className="w-full text-xs p-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Xabar ma'lumotlar bazasiga saqlanadi va qurilmaga push yuboriladi
                </span>

                <button
                  type="submit"
                  disabled={singleLoading}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2 disabled:opacity-50 active:scale-95"
                >
                  {singleLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Yuborilmoqda...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Bildirishnoma yuborish</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Form 2: Broadcast Notification */}
          {activeTab === 'broadcast' && (
            <form onSubmit={handleSendBroadcast} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Target Audience */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Kimlarga yuboriladi
                  </label>
                  <select
                    value={broadcastTarget}
                    onChange={(e) => setBroadcastTarget(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                  >
                    <option value="ALL">Barchaga (Ishchi + Ish beruvchi)</option>
                    <option value="WORKER">Faqat Ishchilarga (Ustalarga)</option>
                    <option value="EMPLOYER">Faqat Ish beruvchilarga</option>
                  </select>
                </div>

                {/* Region */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Hudud (Viloyat)
                  </label>
                  <select
                    value={broadcastRegionId}
                    onChange={(e) => setBroadcastRegionId(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                  >
                    <option value="">Barcha viloyatlar</option>
                    {regions.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Channel */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Yuborish kanali
                  </label>
                  <select
                    value={broadcastChannel}
                    onChange={(e) => setBroadcastChannel(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                  >
                    <option value="app">Mobil ilovaga (Push)</option>
                    <option value="telegram">Telegram Bot orqali</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Xabar sarlavhasi
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Ishchi platformasida yangilik!"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Xabar matni
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Barcha foydalanuvchilarga yuboriladigan e'lon yoki xabarnoma matnini yozing..."
                  value={broadcastBody}
                  onChange={(e) => setBroadcastBody(e.target.value)}
                  className="w-full text-xs p-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-amber-600 flex items-center gap-1 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Ushbu xabar tanlangan guruhdagi barcha faol qurilmalarga yetkaziladi
                </span>

                <button
                  type="submit"
                  disabled={broadcastLoading}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2 disabled:opacity-50 active:scale-95"
                >
                  {broadcastLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Yuborilmoqda...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Ommaviy yuborish</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Right Column: Quick Templates */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
                Tezkor andozalar (Templates)
              </h3>
            </div>
            <p className="text-[11px] text-slate-400">
              Tayyor matnni tanlash uchun ustiga bosing:
            </p>

            <div className="space-y-2">
              {TEMPLATES.map((tpl, i) => (
                <div
                  key={i}
                  onClick={() => handleApplyTemplate(tpl)}
                  className="p-3 rounded-2xl border border-slate-100 hover:border-indigo-300 hover:bg-indigo-50/30 transition cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-800 group-hover:text-indigo-600 transition">
                      {tpl.title}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                      {tpl.type}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                    {tpl.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* History Table Container */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              Yuborilgan so'nggi bildirishnomalar
            </h3>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Jami bazadagi bildirishnomalar: {totalElements} ta
            </span>
          </div>

          <button
            onClick={fetchHistory}
            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition"
            title="Yangilash"
          >
            <RefreshCw className={`w-4 h-4 ${historyLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="overflow-x-auto">
          {historyLoading ? (
            <div className="py-16 text-center text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
              <span className="text-xs">Tarix yuklanmoqda...</span>
            </div>
          ) : history.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              Hozircha yuborilgan bildirishnomalar mavjud emas
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4"># ID</th>
                  <th className="py-3 px-4">Qabul qiluvchi</th>
                  <th className="py-3 px-4">Sarlavha & Matn</th>
                  <th className="py-3 px-4">Turi</th>
                  <th className="py-3 px-4">Holat</th>
                  <th className="py-3 px-4">Sana</th>
                  <th className="py-3 px-4 text-right">Amal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4 font-mono text-slate-400">#{item.id}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 font-mono text-[12px]">
                        {item.phone || `User #${item.userId}`}
                      </div>
                      {item.role && (
                        <span className="text-[10px] text-slate-400">{item.role}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 max-w-md">
                      <div className="font-bold text-slate-800">{item.title}</div>
                      <div className="text-slate-500 text-[11px] line-clamp-1 mt-0.5">{item.body}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {item.type || 'SYSTEM'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {item.read ? (
                        <span className="text-emerald-600 font-semibold text-[11px] flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> O'qildi
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium text-[11px] flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> Yuborildi
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap text-[11px]">
                      {new Date(item.createdAt).toLocaleString('uz-UZ')}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setSinglePhone(item.phone || '');
                          setSingleTitle(item.title || '');
                          setSingleBody(item.body || '');
                          setActiveTab('single');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                          toast.success("Ma'lumotlar formaga nusxalandi");
                        }}
                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
                      >
                        Qayta yuborish
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Sahifa {page + 1} / {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 text-xs font-bold text-slate-700 transition flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> Oldingi
              </button>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 text-xs font-bold text-slate-700 transition flex items-center gap-1"
              >
                Keyingi <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
