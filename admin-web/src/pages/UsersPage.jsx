import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  BadgeCheck,
  Ban,
  Briefcase,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Eye,
  HardHat,
  MapPin,
  MoreHorizontal,
  Phone,
  PhoneOff,
  Search,
  Send,
  ShieldCheck,
  Star,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { api, ApiError } from '../api/client.js';
import { useAppSettings } from '../settings/AppSettingsContext.jsx';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast.jsx';

const ROLE_LABELS = { WORKER: 'Ishchi', EMPLOYER: 'Ish beruvchi', ADMIN: 'Administrator' };

/** One accent per role, used for the pill, the avatar and the tab. */
const ROLE_STYLE = {
  WORKER: { pill: 'bg-primary/12 text-primary-text', avatar: 'bg-primary/15 text-primary-text', icon: HardHat },
  EMPLOYER: { pill: 'bg-warning/14 text-warning', avatar: 'bg-warning/15 text-warning', icon: Briefcase },
  ADMIN: { pill: 'bg-violet-500/14 text-violet-600', avatar: 'bg-violet-500/15 text-violet-600', icon: ShieldCheck },
};

const ROLE_TABS = [
  { value: '', label: 'Hammasi' },
  { value: 'WORKER', label: 'Ishchilar' },
  { value: 'EMPLOYER', label: 'Ish beruvchilar' },
  { value: 'ADMIN', label: 'Adminlar' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'Barcha holatlar' },
  { value: 'active', label: 'Faol' },
  { value: 'blocked', label: 'Bloklangan' },
  { value: 'unverified', label: 'Telefon tasdiqlanmagan' },
];

const WORK_PREFERENCE_LABELS = { PERMANENT: 'Doimiy ish', DAILY: 'Kunlik ish', SPECIALIST: 'Mutaxassis' };

const PAGE_SIZE = 20;

const fmt = (n) => Number(n ?? 0).toLocaleString('uz-UZ');

/** "bugun", "kecha", "5 kun oldin", "3 oy oldin". */
function timeAgo(iso) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return 'bugun';
  if (days === 1) return 'kecha';
  if (days < 30) return `${days} kun oldin`;
  if (days < 365) return `${Math.floor(days / 30)} oy oldin`;
  return `${Math.floor(days / 365)} yil oldin`;
}

function initials(user) {
  const parts = (user.fullName || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length) return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
  return user.phone?.slice(-2) ?? '?';
}

function Avatar({ user, size = 40 }) {
  const style = ROLE_STYLE[user.role] ?? ROLE_STYLE.WORKER;
  const [broken, setBroken] = useState(false);
  const box = { width: size, height: size, fontSize: Math.round(size * 0.36) };
  if (user.avatarUrl && !broken) {
    return (
      <img
        src={user.avatarUrl}
        alt=""
        style={box}
        onError={() => setBroken(true)}
        className="rounded-full object-cover shrink-0 bg-bg"
      />
    );
  }
  return (
    <span style={box} className={`rounded-full shrink-0 grid place-items-center font-extrabold ${style.avatar}`}>
      {initials(user)}
    </span>
  );
}

function RolePill({ role }) {
  const style = ROLE_STYLE[role] ?? ROLE_STYLE.WORKER;
  const Icon = style.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-[3px] rounded-full text-[11.5px] font-bold ${style.pill}`}>
      <Icon size={12} strokeWidth={2.5} />
      {ROLE_LABELS[role] || role}
    </span>
  );
}

function StatusDot({ active }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-[12.5px] font-semibold ${active ? 'text-success' : 'text-danger'}`}>
      <span className={`w-2 h-2 rounded-full ${active ? 'bg-success' : 'bg-danger'}`} />
      {active ? 'Faol' : 'Bloklangan'}
    </span>
  );
}

/** Small icon flags after the status: phone not confirmed, documents checked, Telegram linked. */
function Flags({ user }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {!user.verified && (
        <span title="Telefon raqami tasdiqlanmagan" className="grid place-items-center w-6 h-6 rounded-md bg-warning/14 text-warning">
          <PhoneOff size={13} />
        </span>
      )}
      {user.workerVerified && (
        <span title="Hujjatlari tekshirilgan" className="grid place-items-center w-6 h-6 rounded-md bg-success/12 text-success">
          <BadgeCheck size={13} />
        </span>
      )}
      {user.telegramLinked && (
        <span title="Telegram botga ulangan" className="grid place-items-center w-6 h-6 rounded-md bg-primary/12 text-primary">
          <Send size={12} />
        </span>
      )}
    </span>
  );
}

function Rating({ user }) {
  if (!user.ratingCount) return <span className="text-text-secondary text-[12.5px]">—</span>;
  return (
    <span className="inline-flex items-center gap-1 text-[12.5px] font-semibold">
      <Star size={13} className="text-amber-500" fill="currentColor" />
      {user.ratingAverage?.toFixed(1)}
      <span className="text-text-secondary font-normal">({user.ratingCount})</span>
    </span>
  );
}

function CopyPhone({ phone }) {
  const toast = useToast();
  return (
    <button
      type="button"
      title="Nusxa olish"
      onClick={(e) => {
        e.stopPropagation();
        navigator.clipboard?.writeText(phone).then(() => toast.success('Telefon raqam nusxalandi'), () => {});
      }}
      className="bg-transparent border-0 p-0.5 rounded cursor-pointer text-text-secondary hover:text-primary"
    >
      <Copy size={12} />
    </button>
  );
}

function SummaryCard({ icon: Icon, label, value, tone, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 min-w-[150px] md:min-w-0 flex md:block items-center gap-3 text-left bg-surface border rounded-[14px] p-3 md:p-4 cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md ${
        active ? 'border-primary ring-2 ring-primary/20' : 'border-line'
      }`}
    >
      <span className={`grid place-items-center w-9 h-9 shrink-0 rounded-xl md:mb-3 ${tone}`}>
        <Icon size={18} />
      </span>
      <span className="block">
        <span className="block text-[20px] md:text-[24px] font-extrabold text-text leading-none">{value}</span>
        <span className="block text-[12.5px] text-text-secondary mt-1 md:mt-1.5 whitespace-nowrap">{label}</span>
      </span>
    </button>
  );
}

/** The "⋯" menu with the less frequent actions of a row. */
function RowMenu({ user, walletEnabled, busy, onToggleActive, onToggleVerified, onWallet, onMessage, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const esc = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  if (user.role === 'ADMIN') return null;
  const item = 'w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-left bg-transparent border-0 rounded-lg cursor-pointer hover:bg-bg disabled:opacity-50';
  const run = (fn) => () => {
    setOpen(false);
    fn(user);
  };

  return (
    <div ref={ref} className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        aria-label="Boshqa amallar"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="grid place-items-center w-8 h-8 rounded-lg border border-line bg-surface cursor-pointer text-text-secondary hover:text-text"
      >
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-9 z-20 w-56 bg-surface border border-line rounded-xl shadow-xl p-1.5">
          {user.role === 'WORKER' && (
            <button role="menuitem" className={`${item} text-text`} disabled={busy} onClick={run(onToggleVerified)}>
              <BadgeCheck size={15} className="text-success" />
              {user.workerVerified ? 'Tasdiqni olib tashlash' : 'Hujjatlarini tasdiqlash'}
            </button>
          )}
          {walletEnabled && (
            <button role="menuitem" className={`${item} text-text`} onClick={run(onWallet)}>
              <Wallet size={15} className="text-primary" />
              Hamyon
            </button>
          )}
          {user.telegramLinked && (
            <button role="menuitem" className={`${item} text-text`} onClick={run(onMessage)}>
              <Send size={15} className="text-primary" />
              Telegram xabar yuborish
            </button>
          )}
          <div className="h-px bg-line my-1" />
          <button
            role="menuitem"
            className={`${item} ${user.active ? 'text-danger' : 'text-success'}`}
            disabled={busy}
            onClick={run(onToggleActive)}
          >
            {user.active ? <Ban size={15} /> : <UserCheck size={15} />}
            {user.active ? 'Bloklash' : 'Blokdan chiqarish'}
          </button>
          <button role="menuitem" className={`${item} text-danger`} disabled={busy} onClick={run(onDelete)}>
            <Trash2 size={15} />
            O'chirish
          </button>
        </div>
      )}
    </div>
  );
}

function SkeletonRows() {
  return Array.from({ length: 6 }, (_, i) => (
    <div key={i} className="flex items-center gap-3 px-4 py-3.5 border-b border-line last:border-b-0 animate-pulse">
      <span className="w-10 h-10 rounded-full bg-line" />
      <span className="flex-1 space-y-2">
        <span className="block h-3 w-40 rounded bg-line" />
        <span className="block h-2.5 w-28 rounded bg-line" />
      </span>
      <span className="hidden md:block h-5 w-20 rounded-full bg-line" />
      <span className="hidden md:block h-3 w-24 rounded bg-line" />
    </div>
  ));
}

export default function UsersPage() {
  const toast = useToast();
  const { walletEnabled } = useAppSettings();
  const location = useLocation();
  // Dashboard stat cards link here with an optional pre-filter in router state.
  const [role, setRole] = useState(location.state?.role || '');
  const [status, setStatus] = useState(location.state?.status || '');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [walletUser, setWalletUser] = useState(null);
  const [detailUser, setDetailUser] = useState(null);
  const [messageUser, setMessageUser] = useState(null);
  const [confirmBlock, setConfirmBlock] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(0);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const loadStats = useCallback(() => {
    api.get('/api/admin/stats').then(setStats).catch(() => {});
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const load = useCallback(() => {
    setError(null);
    setLoading(true);
    api
      .get('/api/admin/users', {
        role: role || undefined,
        active: status === 'active' ? true : status === 'blocked' ? false : undefined,
        verified: status === 'unverified' ? false : undefined,
        search: search || undefined,
        page,
        size: PAGE_SIZE,
        sort: 'id,desc',
      })
      .then((d) => {
        setData(d);
        // Keep an open detail panel in step with the refreshed row.
        setDetailUser((cur) => (cur ? d.content.find((u) => u.id === cur.id) ?? cur : cur));
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Yuklab bo'lmadi"))
      .finally(() => setLoading(false));
  }, [role, status, search, page]);

  useEffect(() => {
    load();
  }, [load]);

  function applyFilter(nextRole, nextStatus) {
    setRole(nextRole);
    setStatus(nextStatus);
    setPage(0);
  }

  async function setActive(user, active) {
    setBusyId(user.id);
    try {
      await api.patch(`/api/admin/users/${user.id}/active`, { active });
      toast.success(active ? 'Foydalanuvchi blokdan chiqarildi' : 'Foydalanuvchi bloklandi');
      load();
      loadStats();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Amalni bajarib bo'lmadi");
    } finally {
      setBusyId(null);
    }
  }

  function toggleActive(user) {
    if (user.active) setConfirmBlock(user);
    else setActive(user, true);
  }

  /** The documents-checked badge — deliberately separate from phone verification. */
  async function toggleWorkerVerified(user) {
    setBusyId(user.id);
    try {
      await api.patch(`/api/admin/users/${user.id}/verified?verified=${!user.workerVerified}`);
      toast.success(user.workerVerified ? 'Tasdiq olib tashlandi' : 'Ishchi tasdiqlandi');
      load();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Amalni bajarib bo'lmadi");
    } finally {
      setBusyId(null);
    }
  }

  const hasFilters = role || status || searchInput;
  const total = data?.totalElements ?? 0;
  const from = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const to = Math.min(total, (page + 1) * PAGE_SIZE);

  const actions = {
    walletEnabled,
    onToggleActive: toggleActive,
    onToggleVerified: toggleWorkerVerified,
    onWallet: setWalletUser,
    onMessage: setMessageUser,
    onDelete: setDeletingUser,
  };

  return (
    <div className="max-w-[1200px]">
      <div className="mb-5">
        <h1 className="mb-1">Foydalanuvchilar</h1>
        <p className="m-0 text-[13.5px] text-text-secondary">Ilovadagi ishchi va ish beruvchilar — qidiring, tekshiring, kerak bo'lsa bloklang.</p>
      </div>

      <div className="flex md:grid md:grid-cols-5 gap-3 mb-5 overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 pb-1 md:pb-0">
        <SummaryCard
          icon={Users}
          label="Jami"
          value={stats ? fmt(stats.totalUsers) : '…'}
          tone="bg-primary/12 text-primary"
          active={!role && !status}
          onClick={() => applyFilter('', '')}
        />
        <SummaryCard
          icon={HardHat}
          label="Ishchilar"
          value={stats ? fmt(stats.totalWorkers) : '…'}
          tone="bg-primary/12 text-primary"
          active={role === 'WORKER' && !status}
          onClick={() => applyFilter('WORKER', '')}
        />
        <SummaryCard
          icon={Briefcase}
          label="Ish beruvchilar"
          value={stats ? fmt(stats.totalEmployers) : '…'}
          tone="bg-warning/14 text-warning"
          active={role === 'EMPLOYER' && !status}
          onClick={() => applyFilter('EMPLOYER', '')}
        />
        <SummaryCard
          icon={Ban}
          label="Bloklangan"
          value={stats ? fmt(stats.blockedUsers) : '…'}
          tone="bg-danger/12 text-danger"
          active={status === 'blocked'}
          onClick={() => applyFilter('', 'blocked')}
        />
        <SummaryCard
          icon={UserPlus}
          label="Bugun qo'shilgan"
          value={stats ? fmt(stats.newUsersToday) : '…'}
          tone="bg-success/12 text-success"
          active={false}
          onClick={() => applyFilter('', '')}
        />
      </div>

      <div className="bg-surface border border-line rounded-[14px] overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 p-3.5 border-b border-line">
          <div role="tablist" className="flex max-w-full overflow-x-auto p-1 rounded-xl bg-bg border border-line">
            {ROLE_TABS.map((t) => (
              <button
                key={t.value}
                role="tab"
                aria-selected={role === t.value}
                onClick={() => applyFilter(t.value, status)}
                className={`shrink-0 whitespace-nowrap border-0 px-3.5 py-1.5 rounded-lg text-[13px] font-semibold cursor-pointer ${
                  role === t.value ? 'bg-surface text-primary-text shadow-sm' : 'bg-transparent text-text-secondary hover:text-text'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="relative flex-1 min-w-[220px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
            <input
              type="text"
              className="input w-full !pl-9 !pr-8"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Ism yoki telefon raqami..."
            />
            {searchInput && (
              <button
                type="button"
                aria-label="Tozalash"
                onClick={() => setSearchInput('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 grid place-items-center w-6 h-6 bg-transparent border-0 cursor-pointer text-text-secondary"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <select className="select w-full sm:w-auto" value={status} onChange={(e) => applyFilter(role, e.target.value)}>
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          {hasFilters && (
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                setSearchInput('');
                applyFilter('', '');
              }}
            >
              Filtrlarni tozalash
            </button>
          )}
        </div>

        {error && <div className="error-text !m-3.5">{error}</div>}

        {/* Column titles, on wide screens only; rows stack into cards on phones. */}
        <div className="hidden lg:grid grid-cols-[minmax(240px,2.2fr)_130px_minmax(140px,1.3fr)_150px_90px_130px_96px] gap-3 px-4 py-2.5 text-[11.5px] uppercase tracking-[0.4px] font-semibold text-text-secondary border-b border-line bg-bg/60">
          <span>Foydalanuvchi</span>
          <span>Rol</span>
          <span>Hudud</span>
          <span>Holat</span>
          <span>Reyting</span>
          <span>Qo'shilgan</span>
          <span className="text-right">Amallar</span>
        </div>

        {loading && !data ? (
          <SkeletonRows />
        ) : (
          <div className={loading ? 'opacity-60 transition-opacity' : ''}>
            {data?.content.map((u) => (
              <div
                key={u.id}
                onClick={() => u.role !== 'ADMIN' && setDetailUser(u)}
                className={`grid grid-cols-[1fr_auto] lg:grid-cols-[minmax(240px,2.2fr)_130px_minmax(140px,1.3fr)_150px_90px_130px_96px] gap-x-3 gap-y-2 items-center px-4 py-3 border-b border-line last:border-b-0 ${
                  u.role !== 'ADMIN' ? 'cursor-pointer hover:bg-bg/70' : ''
                } ${!u.active ? 'bg-danger/[0.03]' : ''}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar user={u} />
                  <div className="min-w-0">
                    <div className="font-semibold text-[14px] truncate">{u.fullName || 'Ism kiritilmagan'}</div>
                    <div className="flex items-center gap-1 text-[12.5px] text-text-secondary">
                      <span className="tabular-nums">{u.phone}</span>
                      <CopyPhone phone={u.phone} />
                      <span className="lg:hidden">· #{u.id}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 lg:hidden">
                  <RowMenu user={u} busy={busyId === u.id} {...actions} />
                </div>

                <div className="col-span-2 lg:col-span-1 flex flex-wrap items-center gap-2 lg:block">
                  <RolePill role={u.role} />
                  <span className="lg:hidden"><StatusDot active={u.active} /></span>
                  <span className="lg:hidden"><Flags user={u} /></span>
                </div>

                <div className="hidden lg:flex items-center gap-1 text-[13px] text-text-secondary min-w-0">
                  {u.regionName ? (
                    <>
                      <MapPin size={13} className="shrink-0" />
                      <span className="truncate" title={[u.regionName, u.districtName].filter(Boolean).join(', ')}>
                        {u.regionName}
                        {u.districtName && <span className="text-text-secondary/80">, {u.districtName}</span>}
                      </span>
                    </>
                  ) : (
                    '—'
                  )}
                </div>

                <div className="hidden lg:flex items-center gap-2">
                  <StatusDot active={u.active} />
                  <Flags user={u} />
                </div>

                <div className="hidden lg:block"><Rating user={u} /></div>

                <div className="hidden lg:block text-[13px]">
                  <div>{new Date(u.createdAt).toLocaleDateString('uz-UZ')}</div>
                  <div className="text-[11.5px] text-text-secondary">{timeAgo(u.createdAt)}</div>
                </div>

                <div className="hidden lg:flex items-center justify-end gap-1.5">
                  {u.role !== 'ADMIN' && (
                    <button
                      type="button"
                      title="Batafsil"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDetailUser(u);
                      }}
                      className="grid place-items-center w-8 h-8 rounded-lg border border-line bg-surface cursor-pointer text-text-secondary hover:text-primary"
                    >
                      <Eye size={16} />
                    </button>
                  )}
                  <RowMenu user={u} busy={busyId === u.id} {...actions} />
                </div>
              </div>
            ))}
            {data && data.content.length === 0 && (
              <div className="empty-state">
                <Users size={36} className="mx-auto mb-2 opacity-40" />
                <div className="font-semibold text-text">Foydalanuvchilar topilmadi</div>
                <div className="text-[13px] mt-1">Qidiruv so'zini yoki filtrlarni o'zgartirib ko'ring.</div>
              </div>
            )}
          </div>
        )}

        {data && total > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-line">
            <span className="text-[13px] text-text-secondary">
              {fmt(from)}–{fmt(to)} / {fmt(total)} ta
            </span>
            {data.totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  className="btn btn-outline inline-flex items-center gap-1"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft size={15} /> Oldingi
                </button>
                <span className="text-[13px] px-2 tabular-nums">
                  {page + 1} / {data.totalPages}
                </span>
                <button
                  className="btn btn-outline inline-flex items-center gap-1"
                  disabled={data.last}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Keyingi <ChevronRight size={15} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {detailUser && (
        <UserDrawer
          user={detailUser}
          busy={busyId === detailUser.id}
          onClose={() => setDetailUser(null)}
          {...actions}
        />
      )}
      {confirmBlock && (
        <Modal title="Foydalanuvchini bloklash" onClose={() => setConfirmBlock(null)}>
          <p className="mt-0 text-[14px]">
            <strong>{confirmBlock.fullName || confirmBlock.phone}</strong> bloklansa, ilovaga kira olmaydi va e'lonlari
            ko'rinmay qoladi. Keyinroq blokdan chiqarish mumkin.
          </p>
          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={() => setConfirmBlock(null)}>Bekor qilish</button>
            <button
              type="button"
              className="btn bg-danger text-white"
              onClick={() => {
                const u = confirmBlock;
                setConfirmBlock(null);
                setActive(u, false);
              }}
            >
              Bloklash
            </button>
          </div>
        </Modal>
      )}
      {deletingUser && (
        <DeleteUserModal
          user={deletingUser}
          walletEnabled={walletEnabled}
          onClose={() => setDeletingUser(null)}
          onDeleted={() => {
            const gone = deletingUser;
            setDeletingUser(null);
            setDetailUser((cur) => (cur && cur.id === gone.id ? null : cur));
            // Deleting the only row on a later page would otherwise leave that page empty.
            if (data && data.content.length === 1 && page > 0) setPage((p) => p - 1);
            else load();
            loadStats();
          }}
        />
      )}
      {walletUser && <WalletModal user={walletUser} onClose={() => setWalletUser(null)} />}
      {messageUser && <SendMessageModal user={messageUser} onClose={() => setMessageUser(null)} />}
    </div>
  );
}

/** The selected user's full profile, sliding in from the right. */
function UserDrawer({ user, busy, onClose, walletEnabled, onToggleActive, onToggleVerified, onWallet, onMessage, onDelete }) {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const panelRef = useRef(null);

  useEffect(() => {
    setProfile(null);
    setError(null);
    api
      .get(`/api/admin/users/${user.id}/profile`)
      .then(setProfile)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Yuklab bo'lmadi"));
  }, [user.id]);

  useEffect(() => {
    const previous = document.activeElement;
    panelRef.current?.focus();
    const esc = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('keydown', esc);
      previous?.focus?.();
    };
  }, [onClose]);

  const action = 'inline-flex items-center justify-center gap-1.5 flex-1 min-w-[120px] px-3 py-2 rounded-xl border text-[12.5px] font-semibold cursor-pointer disabled:opacity-50';

  return (
    <div className="fixed inset-0 z-[90] flex justify-end" role="dialog" aria-modal="true" aria-label="Foydalanuvchi profili">
      <div className="absolute inset-0 bg-black/35" onClick={onClose} />
      <aside
        ref={panelRef}
        tabIndex={-1}
        className="relative h-full w-full max-w-[460px] bg-surface shadow-2xl overflow-y-auto outline-none"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-3.5 bg-surface border-b border-line">
          <span className="font-bold">Foydalanuvchi #{user.id}</span>
          <button type="button" aria-label="Yopish" onClick={onClose} className="grid place-items-center w-8 h-8 rounded-lg bg-transparent border border-line cursor-pointer">
            <X size={16} />
          </button>
        </div>

        <div className="px-5 pt-5 pb-4 flex items-start gap-4">
          <Avatar user={{ ...user, avatarUrl: profile?.avatarUrl ?? user.avatarUrl }} size={64} />
          <div className="min-w-0">
            <div className="text-[18px] font-extrabold leading-tight">{user.fullName || 'Ism kiritilmagan'}</div>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <RolePill role={user.role} />
              <StatusDot active={user.active} />
              {user.workerVerified && (
                <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-success">
                  <BadgeCheck size={14} /> Tasdiqlangan
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-2 text-[13.5px]">
              <a href={`tel:${user.phone}`} className="inline-flex items-center gap-1 no-underline text-primary-text font-semibold">
                <Phone size={14} /> {user.phone}
              </a>
              <CopyPhone phone={user.phone} />
            </div>
          </div>
        </div>

        <div className="px-5 pb-4 flex flex-wrap gap-2">
          {user.role === 'WORKER' && (
            <button type="button" disabled={busy} onClick={() => onToggleVerified(user)} className={`${action} bg-success/10 border-success/30 text-success`}>
              <BadgeCheck size={15} /> {user.workerVerified ? 'Tasdiqni olish' : 'Tasdiqlash'}
            </button>
          )}
          {user.telegramLinked && (
            <button type="button" onClick={() => onMessage(user)} className={`${action} bg-primary/10 border-primary/30 text-primary-text`}>
              <Send size={14} /> Xabar
            </button>
          )}
          {walletEnabled && (
            <button type="button" onClick={() => onWallet(user)} className={`${action} bg-surface border-line text-text`}>
              <Wallet size={15} /> Hamyon
            </button>
          )}
          <button
            type="button"
            disabled={busy}
            onClick={() => onToggleActive(user)}
            className={`${action} ${user.active ? 'bg-danger/8 border-danger/30 text-danger' : 'bg-success/10 border-success/30 text-success'}`}
          >
            {user.active ? <Ban size={15} /> : <Check size={15} />} {user.active ? 'Bloklash' : 'Blokdan chiqarish'}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => onDelete(user)}
            className={`${action} bg-danger/8 border-danger/30 text-danger`}
          >
            <Trash2 size={15} /> O'chirish
          </button>
        </div>

        {error && <div className="error-text mx-5">{error}</div>}
        {!profile && !error && (
          <div className="px-5 space-y-3 animate-pulse">
            {Array.from({ length: 5 }, (_, i) => <div key={i} className="h-10 rounded-lg bg-line" />)}
          </div>
        )}

        {profile && (
          <div className="px-5 pb-8 space-y-4">
            <Section title="Asosiy">
              <Info label="Hudud" value={[profile.regionName, profile.districtName].filter(Boolean).join(', ') || '—'} />
              <Info label="Ro'yxatdan o'tgan" value={`${new Date(user.createdAt).toLocaleDateString('uz-UZ')} · ${timeAgo(user.createdAt)}`} />
              <Info label="Telefon" value={user.verified ? 'Tasdiqlangan' : 'Tasdiqlanmagan'} tone={user.verified ? 'text-success' : 'text-warning'} />
              <Info label="Telegram" value={user.telegramLinked ? 'Ulangan' : 'Ulanmagan'} />
              {user.ratingCount > 0 && <Info label="Reyting" value={<Rating user={user} />} />}
            </Section>

            {profile.role === 'WORKER' && (
              <Section title="Ish">
                <div className="py-2">
                  <div className="text-[12px] text-text-secondary mb-1.5">Kasblar</div>
                  {profile.professions?.length ? (
                    <div className="flex flex-wrap gap-1.5">
                      {profile.professions.map((p) => (
                        <span key={p.id} className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary-text text-[12.5px] font-semibold">{p.name}</span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[13.5px]">—</span>
                  )}
                </div>
                <Info label="Tajriba" value={profile.experienceYears != null ? `${profile.experienceYears} yil` : "Ko'rsatilmagan"} />
                <Info label="Holati" value={profile.available ? 'Ish qidirmoqda' : 'Band'} tone={profile.available ? 'text-success' : 'text-text-secondary'} />
                <Info label="Ish turi" value={WORK_PREFERENCE_LABELS[profile.workPreference] || "Ko'rsatilmagan"} />
                <Info
                  label="Haydovchilik guvohnomasi"
                  value={profile.hasDriverLicense ? profile.driverLicenseCategories || 'Bor' : "Yo'q"}
                />
              </Section>
            )}

            {profile.about && (
              <Section title="O'zi haqida">
                <p className="m-0 py-2 text-[13.5px] leading-relaxed whitespace-pre-line">{profile.about}</p>
              </Section>
            )}

            {profile.experiences?.length > 0 && (
              <Section title="Ish tajribasi">
                <ol className="m-0 py-2 pl-0 list-none space-y-3">
                  {profile.experiences.map((e) => (
                    <li key={e.id} className="relative pl-5">
                      <span className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-primary" />
                      <div className="font-semibold text-[13.5px]">{e.positionTitle}</div>
                      <div className="text-[13px]">{e.companyName}</div>
                      <div className="text-[12px] text-text-secondary">{e.startDate} — {e.endDate || 'hozirgacha'}</div>
                    </li>
                  ))}
                </ol>
              </Section>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section>
      <h4 className="m-0 mb-1 text-[11.5px] uppercase tracking-[0.5px] font-bold text-text-secondary">{title}</h4>
      <div className="rounded-xl border border-line px-3.5 divide-y divide-line">{children}</div>
    </section>
  );
}

function Info({ label, value, tone = '' }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <span className="text-[12.5px] text-text-secondary shrink-0">{label}</span>
      <span className={`text-[13.5px] text-right font-medium ${tone}`}>{value}</span>
    </div>
  );
}

function DeleteUserModal({ user, walletEnabled, onClose, onDeleted }) {
  const toast = useToast();
  const [confirmText, setConfirmText] = useState('');
  const [balance, setBalance] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  // Deleting an account also deletes its wallet, so show what is about to be lost.
  useEffect(() => {
    if (!walletEnabled) return;
    api
      .get(`/api/admin/wallets/${user.id}`)
      .then((w) => setBalance(Number(w.balance)))
      .catch(() => setBalance(null));
  }, [user.id, walletEnabled]);

  // Typing the phone number is the confirmation: this cannot be undone, and a plain "Are you
  // sure?" is far too easy to click through next to the Block action.
  const confirmed = confirmText.trim() === user.phone;

  async function remove(e) {
    e.preventDefault();
    if (!confirmed || busy) return;
    setBusy(true);
    setError(null);
    try {
      await api.del(`/api/admin/users/${user.id}`);
      toast.success("Foydalanuvchi o'chirildi");
      onDeleted();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "O'chirib bo'lmadi");
      setBusy(false);
    }
  }

  return (
    <Modal title="Foydalanuvchini o'chirish" onClose={busy ? () => {} : onClose}>
      <p className="mt-0 mb-3 text-[14px]">
        <strong>{user.fullName || user.phone}</strong> akkaunti butunlay o'chiriladi. Bu amalni{' '}
        <strong>qaytarib bo'lmaydi</strong>. Faqat vaqtincha to'xtatmoqchi bo'lsangiz, "Bloklash"dan foydalaning.
      </p>
      <ul className="mt-0 mx-0 mb-3.5 pl-[18px] text-[13px] text-text-secondary">
        <li>Profil va yuklangan rasmlari</li>
        {user.role === 'EMPLOYER' && <li>U joylashtirgan barcha buyurtmalar, rasmlari va arizalari</li>}
        {user.role === 'WORKER' && <li>Ish tajribasi, arizalari va ochilgan buyurtmalar tarixi</li>}
        <li>Baholari, shikoyatlari va saqlangan qidiruvlari</li>
        {walletEnabled && <li>Hamyon va uning tranzaksiya tarixi</li>}
        <li>Tizimga kirish huquqi (barcha qurilmalarda)</li>
      </ul>
      {walletEnabled && balance > 0 && (
        <div className="error-text">
          Diqqat: hamyonda {balance.toLocaleString('uz-UZ')} so'm qoldiq bor, u ham yo'qoladi.
        </div>
      )}
      <form onSubmit={remove}>
        <div className="field">
          <label>
            Tasdiqlash uchun telefon raqamini kiriting: <strong>{user.phone}</strong>
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={user.phone}
            autoComplete="off"
          />
        </div>
        {error && <div className="error-text">{error}</div>}
        <div className="modal-actions">
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={busy}>
            Bekor qilish
          </button>
          <button type="submit" className="btn bg-danger text-white" disabled={!confirmed || busy}>
            {busy ? "O'chirilmoqda..." : "Butunlay o'chirish"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function SendMessageModal({ user, onClose }) {
  const [text, setText] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [sending, setSending] = useState(false);

  async function send(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    setError(null);
    setSuccess(null);
    try {
      await api.post(`/api/admin/users/${user.id}/telegram-message`, { text: text.trim() });
      setSuccess('Xabar yuborildi');
      setText('');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Yuborib bo'lmadi");
    } finally {
      setSending(false);
    }
  }

  return (
    <Modal title={<>Telegram xabar — {user.fullName || user.phone}</>} onClose={onClose}>
      <p className="mt-0 mx-0 mb-3.5 text-text-secondary text-[13px]">
        Xabar to'g'ridan-to'g'ri shu foydalanuvchining Telegram botiga yuboriladi.
      </p>
      <form onSubmit={send}>
        <div className="field">
          <label>Xabar matni</label>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} placeholder="Xabar matnini kiriting..." />
        </div>
        {error && <div className="error-text">{error}</div>}
        {success && <div className="text-success text-[13px] mb-3.5">{success}</div>}
        <div className="modal-actions">
          <button type="button" className="btn btn-outline" onClick={onClose}>Yopish</button>
          <button type="submit" className="btn btn-primary" disabled={sending || !text.trim()}>
            {sending ? 'Yuborilmoqda...' : 'Yuborish'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function WalletModal({ user, onClose }) {
  const [wallet, setWallet] = useState(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api.get(`/api/admin/wallets/${user.id}`)
      .then(setWallet)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Hamyonni yuklab bo'lmadi"));
  }, [user.id]);

  useEffect(() => { load(); }, [load]);

  async function submit(e) {
    e.preventDefault();
    const parsed = Number(amount);
    if (!parsed) {
      setError("To'g'ri summa kiriting (musbat — qo'shish, manfiy — ayirish)");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api.post(`/api/admin/wallets/${user.id}/adjust`, { amount: parsed, note: note || null });
      setAmount('');
      setNote('');
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Amalni bajarib bo'lmadi");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={<>Hamyon — {user.fullName || user.phone}</>} onClose={onClose}>
      {wallet && (
        <p className="text-[22px] font-extrabold text-primary mt-0 mx-0 mb-4">
          {Number(wallet.balance).toLocaleString('uz-UZ')} so'm
        </p>
      )}
      <form onSubmit={submit}>
        <div className="field">
          <label>Summa (musbat — qo'shish, manfiy — ayirish)</label>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="masalan: 50000 yoki -20000" />
        </div>
        <div className="field">
          <label>Izoh (ixtiyoriy)</label>
          <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Sabab" />
        </div>
        {error && <div className="error-text">{error}</div>}
        <div className="modal-actions">
          <button type="button" className="btn btn-outline" onClick={onClose}>Yopish</button>
          <button type="submit" className="btn btn-primary" disabled={busy}>Qo'llash</button>
        </div>
      </form>
    </Modal>
  );
}
