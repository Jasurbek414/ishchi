import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { api, ApiError } from '../api/client.js';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast.jsx';

const AUDIENCE_LABELS = { ALL: 'Hammaga', WORKER: 'Ishchilar (bosh sahifa)', EMPLOYER: 'Ish beruvchilar (qidiruv)' };
const STATUS_FILTERS = [
  { value: 'ALL', label: 'Barchasi' },
  { value: 'ACTIVE', label: 'Faol' },
  { value: 'SCHEDULED', label: 'Rejalashtirilgan' },
  { value: 'EXPIRED', label: 'Muddati tugagan' },
  { value: 'INACTIVE', label: 'Nofaol' },
];

function bannerStatus(b) {
  if (!b.active) return { key: 'INACTIVE', label: 'Nofaol', className: 'bg-zinc-100 text-zinc-500' };
  const now = Date.now();
  if (b.startAt && new Date(b.startAt).getTime() > now) {
    return { key: 'SCHEDULED', label: 'Rejalashtirilgan', className: 'bg-sky-100 text-sky-700' };
  }
  if (b.endAt && new Date(b.endAt).getTime() < now) {
    return { key: 'EXPIRED', label: 'Muddati tugagan', className: 'bg-amber-100 text-amber-700' };
  }
  return { key: 'ACTIVE', label: 'Faol', className: 'bg-emerald-100 text-emerald-700' };
}

function formatDate(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function toLocalInputValue(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function PromoBannersPage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('banners'); // 'banners' | 'requests'
  const [items, setItems] = useState(null);
  const [requests, setRequests] = useState([]);
  const [regions, setRegions] = useState([]);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [editing, setEditing] = useState(null); // null = closed, {} = new, {id,...} = edit
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [search, setSearch] = useState('');
  const [audienceFilter, setAudienceFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [regionFilter, setRegionFilter] = useState('ALL');
  const [reordering, setReordering] = useState(false);
  const dragId = useRef(null);
  const [dragOverId, setDragOverId] = useState(null);

  const load = useCallback(() => {
    setError(null);
    api.get('/api/admin/promo-banners')
      .then(setItems)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Yuklab bo'lmadi"));

    api.get('/api/admin/promo-requests')
      .then(setRequests)
      .catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { api.get('/api/regions').then(setRegions).catch(() => {}); }, []);

  const pendingRequestsCount = useMemo(() => {
    return requests.filter((r) => r.status === 'PENDING').length;
  }, [requests]);

  const filtersActive = search.trim() !== '' || audienceFilter !== 'ALL' || statusFilter !== 'ALL' || regionFilter !== 'ALL';

  const visibleItems = useMemo(() => {
    if (!items) return null;
    const q = search.trim().toLowerCase();
    return items.filter((b) => {
      if (q && !b.title.toLowerCase().includes(q) && !(b.subtitle || '').toLowerCase().includes(q)) return false;
      if (audienceFilter !== 'ALL' && b.audience !== audienceFilter) return false;
      if (statusFilter !== 'ALL' && bannerStatus(b).key !== statusFilter) return false;
      if (regionFilter !== 'ALL') {
        const runsEverywhere = !b.regionIds || b.regionIds.length === 0;
        if (!runsEverywhere && !b.regionIds.includes(Number(regionFilter))) return false;
      }
      return true;
    });
  }, [items, search, audienceFilter, statusFilter, regionFilter]);

  const stats = useMemo(() => {
    if (!items) return null;
    return {
      total: items.length,
      active: items.filter((b) => bannerStatus(b).key === 'ACTIVE').length,
      views: items.reduce((sum, b) => sum + (b.viewCount || 0), 0),
      clicks: items.reduce((sum, b) => sum + (b.clickCount || 0), 0),
    };
  }, [items]);

  async function toggleActive(b) {
    setBusyId(b.id);
    try {
      await api.patch(`/api/admin/promo-banners/${b.id}/active`, { active: !b.active });
      load();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Amalni bajarib bo'lmadi");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(b) {
    if (!confirm(`"${b.title}" bannerini butunlay o'chirmoqchimisiz?`)) return;
    setBusyId(b.id);
    try {
      await api.del(`/api/admin/promo-banners/${b.id}`);
      load();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "O'chirib bo'lmadi");
    } finally {
      setBusyId(null);
    }
  }

  async function approveRequest(reqId) {
    setBusyId(reqId);
    try {
      await api.post(`/api/admin/promo-requests/${reqId}/approve`);
      toast.success("Ariza tasdiqlandi va reklama bosh sahifadagi karuselga joylandi!");
      load();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Tasdiqlashda xatolik yuz berdi");
    } finally {
      setBusyId(null);
    }
  }

  async function submitReject() {
    if (!rejectingId) return;
    setBusyId(rejectingId);
    try {
      await api.post(`/api/admin/promo-requests/${rejectingId}/reject`, { reason: rejectReason });
      toast.success("Ariza rad etildi");
      setRejectingId(null);
      setRejectReason('');
      load();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Rad etishda xatolik");
    } finally {
      setBusyId(null);
    }
  }

  function handleDragStart(id) {
    dragId.current = id;
  }

  function handleDragOver(e, id) {
    e.preventDefault();
    if (id !== dragOverId) setDragOverId(id);
  }

  async function handleDrop(targetId) {
    const sourceId = dragId.current;
    dragId.current = null;
    setDragOverId(null);
    if (!sourceId || sourceId === targetId || !items) return;

    const next = [...items];
    const from = next.findIndex((b) => b.id === sourceId);
    const to = next.findIndex((b) => b.id === targetId);
    if (from === -1 || to === -1) return;
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);

    setItems(next);
    setReordering(true);
    try {
      await api.patch('/api/admin/promo-banners/reorder', { ids: next.map((b) => b.id) });
      load();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Tartibni saqlab bo'lmadi");
      load();
    } finally {
      setReordering(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div>
          <h1 className="mb-1!">Reklama va Ommaviy e'lonlar</h1>
          <p className="text-[13px] text-text-secondary m-0">
            Mobil ilova bosh sahifasidagi reklama karuseli va foydalanuvchilar e'lon arizalarini boshqaring.
          </p>
        </div>
        {activeTab === 'banners' && (
          <button className="btn btn-primary" onClick={() => setEditing({})}>+ Yangi reklama</button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border mb-5 gap-1">
        <button
          className={`px-4 py-2.5 font-semibold text-sm border-b-2 transition-colors cursor-pointer ${
            activeTab === 'banners'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
          onClick={() => setActiveTab('banners')}
        >
          Faol reklamalar ({items?.length || 0})
        </button>
        <button
          className={`px-4 py-2.5 font-semibold text-sm border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'requests'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
          onClick={() => setActiveTab('requests')}
        >
          <span>Foydalanuvchilar arizalari ({requests?.length || 0})</span>
          {pendingRequestsCount > 0 && (
            <span className="bg-amber-500 text-white text-[11px] px-2 py-0.5 rounded-full font-bold">
              {pendingRequestsCount} yangi
            </span>
          )}
        </button>
      </div>

      {activeTab === 'banners' ? (
        <div>
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              <StatTile label="Jami reklamalar" value={stats.total} />
              <StatTile label="Hozir faol" value={stats.active} accent="text-emerald-600!" />
              <StatTile label="Jami ko'rishlar" value={stats.views.toLocaleString('uz-UZ')} />
              <StatTile label="Jami bosishlar" value={stats.clicks.toLocaleString('uz-UZ')} />
            </div>
          )}

          <div className="flex flex-wrap gap-2 mb-4 items-center">
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
              <input
                className="input w-full pl-9!"
                placeholder="Sarlavha bo'yicha qidirish..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select className="select" value={audienceFilter} onChange={(e) => setAudienceFilter(e.target.value)}>
              <option value="ALL">Barcha auditoriya</option>
              {Object.entries(AUDIENCE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select className="select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              {STATUS_FILTERS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <select className="select" value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)}>
              <option value="ALL">Barcha hududlar</option>
              {regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            {filtersActive && (
              <button
                className="text-[12.5px] font-semibold text-danger px-2 cursor-pointer"
                onClick={() => { setSearch(''); setAudienceFilter('ALL'); setStatusFilter('ALL'); setRegionFilter('ALL'); }}
              >
                Tozalash
              </button>
            )}
          </div>

          {error && <div className="card text-danger text-[13.5px] mb-4">{error}</div>}

          {!items ? (
            <div className="card text-center text-text-secondary py-12">Yuklanmoqda...</div>
          ) : visibleItems.length === 0 ? (
            <div className="card text-center text-text-secondary py-12">
              {filtersActive ? "Mos keladigan reklama topilmadi." : "Hali hech qanday reklama qo'shilmagan."}
            </div>
          ) : (
            <div className="space-y-3">
              {visibleItems.map((b) => {
                const status = bannerStatus(b);
                const isOver = dragOverId === b.id;
                const canDrag = !filtersActive && visibleItems.length > 1;
                return (
                  <div
                    key={b.id}
                    draggable={canDrag}
                    onDragStart={() => handleDragStart(b.id)}
                    onDragOver={(e) => handleDragOver(e, b.id)}
                    onDrop={() => handleDrop(b.id)}
                    className={`card p-4! transition-all flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between ${
                      isOver ? 'border-primary ring-2 ring-primary/20' : ''
                    } ${!b.active ? 'opacity-70' : ''}`}
                  >
                    <div className="flex gap-3 items-center min-w-0 flex-1">
                      {canDrag && (
                        <div className="text-text-secondary cursor-grab active:cursor-grabbing p-1 -ml-1">
                          <DragIcon className="w-4 h-4" />
                        </div>
                      )}
                      {b.imageUrl ? (
                        <img
                          src={b.imageUrl}
                          alt={b.title}
                          className="w-20 h-14 object-cover rounded-lg border border-border shrink-0 bg-surface-alt"
                        />
                      ) : (
                        <div className="w-20 h-14 rounded-lg border border-dashed border-border flex items-center justify-center text-text-secondary text-[11px] shrink-0 bg-surface-alt">
                          Rasmsiz
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-semibold text-sm truncate">{b.title}</span>
                          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${status.className}`}>
                            {status.label}
                          </span>
                        </div>
                        {b.subtitle && (
                          <p className="text-[12.5px] text-text-secondary truncate m-0 mb-1">{b.subtitle}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-text-secondary">
                          <span>Auditoriya: <strong>{AUDIENCE_LABELS[b.audience] || b.audience}</strong></span>
                          <span>•</span>
                          <span>Hudud: <strong>{b.regionNames?.length ? b.regionNames.join(', ') : 'Barcha hududlar'}</strong></span>
                          {b.linkUrl && (
                            <>
                              <span>•</span>
                              <a href={b.linkUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                                <LinkIcon className="w-3 h-3" /> Havola
                              </a>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-border">
                      <button
                        className={`btn btn-sm ${b.active ? 'btn-outline text-amber-600 border-amber-300' : 'btn-outline text-emerald-600 border-emerald-300'}`}
                        disabled={busyId === b.id}
                        onClick={() => toggleActive(b)}
                      >
                        {b.active ? "Nofaol qilish" : "Faollashtirish"}
                      </button>
                      <button className="btn btn-sm btn-outline" onClick={() => setEditing(b)}>
                        Tahrirlash
                      </button>
                      <button
                        className="btn btn-sm btn-outline text-danger border-danger/30 hover:bg-danger/10"
                        disabled={busyId === b.id}
                        onClick={() => remove(b)}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Requests Tab */
        <div>
          {requests.length === 0 ? (
            <div className="card text-center text-text-secondary py-12">
              Hali foydalanuvchilardan hech qanday e'lon arizasi kelib tushmagan.
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((r) => {
                const isPending = r.status === 'PENDING';
                const isApproved = r.status === 'APPROVED';
                const isRejected = r.status === 'REJECTED';

                return (
                  <div key={r.id} className="card p-5!">
                    <div className="flex flex-col md:flex-row gap-5 items-start justify-between">
                      <div className="flex gap-4 items-start flex-1">
                        {r.imageUrl ? (
                          <img
                            src={r.imageUrl}
                            alt={r.title}
                            className="w-28 h-20 object-cover rounded-xl border border-border shrink-0 bg-surface-alt shadow-sm"
                          />
                        ) : (
                          <div className="w-28 h-20 rounded-xl border border-dashed border-border flex items-center justify-center text-text-secondary text-xs shrink-0 bg-surface-alt">
                            Rasmsiz
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <span className="font-bold text-base">{r.title}</span>
                            <span
                              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                                isPending
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                  : isApproved
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : isRejected
                                  ? 'bg-red-100 text-red-800 border border-red-300'
                                  : 'bg-zinc-100 text-zinc-600'
                              }`}
                            >
                              {isPending ? '⏳ Kutilmoqda' : isApproved ? '✓ Tasdiqlangan' : isRejected ? '✕ Rad etilgan' : r.status}
                            </span>
                          </div>
                          {r.subtitle && (
                            <p className="text-[13px] text-text-secondary m-0 mb-2 leading-relaxed">
                              {r.subtitle}
                            </p>
                          )}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-text-secondary bg-surface-alt p-2.5 rounded-lg border border-border">
                            <div>
                              Arizachi: <strong className="text-text-primary">{r.userPhone || `#${r.userId}`}</strong>
                            </div>
                            <div>
                              Muddat: <strong className="text-text-primary">{r.durationDays} kun</strong>
                            </div>
                            <div>
                              Auditoriya: <strong className="text-text-primary">{AUDIENCE_LABELS[r.audience] || r.audience}</strong>
                            </div>
                            <div>
                              Hudud: <strong className="text-text-primary">{r.regionName || 'Butun O\'zbekiston'}</strong>
                            </div>
                          </div>
                          {r.linkUrl && (
                            <div className="mt-2 text-xs flex items-center gap-1.5 text-primary">
                              <LinkIcon className="w-3.5 h-3.5" />
                              <span>Havola / Kontakt: <strong>{r.linkUrl}</strong></span>
                            </div>
                          )}
                          {isRejected && r.rejectionReason && (
                            <div className="mt-2 text-xs text-danger bg-danger/10 p-2 rounded border border-danger/20">
                              Rad etish sababi: <strong>{r.rejectionReason}</strong>
                            </div>
                          )}
                          <div className="mt-2 text-[11px] text-text-secondary">
                            Yuborilgan sana: {formatDate(r.createdAt)}
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      {isPending && (
                        <div className="flex md:flex-col gap-2 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-border">
                          <button
                            className="btn btn-sm btn-primary bg-emerald-600! hover:bg-emerald-700! border-none text-white font-semibold flex-1 md:flex-initial"
                            disabled={busyId === r.id}
                            onClick={() => approveRequest(r.id)}
                          >
                            ✓ Tasdiqlash
                          </button>
                          <button
                            className="btn btn-sm btn-outline text-danger border-danger/30 hover:bg-danger/10 flex-1 md:flex-initial"
                            disabled={busyId === r.id}
                            onClick={() => {
                              setRejectingId(r.id);
                              setRejectReason('');
                            }}
                          >
                            ✕ Rad etish
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Edit Banner Modal */}
      {editing && (
        <BannerModal
          banner={editing}
          regions={regions}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}

      {/* Reject Request Modal */}
      {rejectingId && (
        <Modal onClose={() => setRejectingId(null)} title="Arizani rad etish">
          <div className="p-4">
            <p className="text-sm text-text-secondary mb-3">
              Ixtiyoriy: arizani nima sababdan rad etayotganingizni yozing (foydalanuvchiga ko'rinadi).
            </p>
            <textarea
              className="input w-full min-h-[90px] mb-4"
              placeholder="Masalan: Banner sifati talabga javob bermaydi..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button className="btn btn-outline" onClick={() => setRejectingId(null)}>Bekor qilish</button>
              <button
                className="btn btn-primary bg-danger! border-none text-white"
                disabled={busyId === rejectingId}
                onClick={submitReject}
              >
                Rad etish
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function StatTile({ label, value, accent }) {
  return (
    <div className="card p-3!">
      <div className="text-[11.5px] text-text-secondary mb-1">{label}</div>
      <div className={`text-xl font-bold ${accent || 'text-text-primary'}`}>{value}</div>
    </div>
  );
}

function BannerModal({ banner, regions, onClose, onSaved }) {
  const isNew = !banner.id;
  const [title, setTitle] = useState(banner.title || '');
  const [subtitle, setSubtitle] = useState(banner.subtitle || '');
  const [linkUrl, setLinkUrl] = useState(banner.linkUrl || '');
  const [audience, setAudience] = useState(banner.audience || 'ALL');
  const [regionIds, setRegionIds] = useState(banner.regionIds || []);
  const [sortOrder, setSortOrder] = useState(banner.sortOrder ?? 0);
  const [active, setActive] = useState(banner.active ?? true);
  const [startAt, setStartAt] = useState(toLocalInputValue(banner.startAt));
  const [endAt, setEndAt] = useState(toLocalInputValue(banner.endAt));
  const [image, setImage] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const toast = useToast();

  function toggleRegion(id) {
    setRegionIds((prev) => prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]);
  }

  async function submit(e) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Sarlavha kiritilishi shart");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('subtitle', subtitle.trim());
      formData.append('linkUrl', linkUrl.trim());
      formData.append('audience', audience);
      formData.append('regionsProvided', 'true');
      regionIds.forEach((id) => formData.append('regionIds', id));
      formData.append('sortOrder', sortOrder);
      formData.append('active', active);
      if (startAt) formData.append('startAt', new Date(startAt).toISOString());
      else formData.append('clearStartAt', 'true');
      if (endAt) formData.append('endAt', new Date(endAt).toISOString());
      else formData.append('clearEndAt', 'true');
      if (image) formData.append('image', image);

      if (isNew) {
        await api.postForm('/api/admin/promo-banners', formData);
        toast.success("Reklama yaratildi");
      } else {
        await api.patchForm(`/api/admin/promo-banners/${banner.id}`, formData);
        toast.success("Reklama yangilandi");
      }
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Saqlab bo'lmadi");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal onClose={onClose} title={isNew ? "Yangi reklama" : "Reklamani tahrirlash"}>
      <div className="p-4 max-h-[80vh] overflow-y-auto">
        <form onSubmit={submit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div className="field sm:col-span-2">
              <label>Sarlavha *</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="field sm:col-span-2">
              <label>Qisqa tavsif</label>
              <input type="text" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
            </div>
            <div className="field sm:col-span-2">
              <label>Havola URL (bosganda ochiladigan sayt yoki havola)</label>
              <input type="text" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div className="field">
              <label>Mo'ljallangan auditoriya</label>
              <select value={audience} onChange={(e) => setAudience(e.target.value)}>
                {Object.entries(AUDIENCE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Tartib raqami</label>
              <input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
            </div>
            <div className="field">
              <label>Boshlanish vaqti</label>
              <input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
            </div>
            <div className="field">
              <label>Tugash vaqti</label>
              <input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
            </div>
            <div className="field sm:col-span-2">
              <label>Rasm {isNew ? '(ixtiyoriy)' : '(yangilash uchun tanlang)'}</label>
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setImage(e.target.files?.[0] || null)} />
            </div>
            <div className="field field-checkbox sm:col-span-2">
              <input type="checkbox" id="banner-active" checked={active} onChange={(e) => setActive(e.target.checked)} />
              <label htmlFor="banner-active" className="m-0">Faol (mobil ilovada ko'rinadi)</label>
            </div>
          </div>
          {error && <div className="error-text mb-3">{error}</div>}
          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>Bekor qilish</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>Saqlash</button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

function SearchIcon(props) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...props}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>;
}
function EyeIcon(props) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" /><circle cx="12" cy="12" r="3" /></svg>;
}
function CursorIcon(props) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M4 4l7.07 17 2.51-7.39L21 11.07Z" /></svg>;
}
function LinkIcon(props) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 0 0-7.07-7.07L11.5 4.5" /><path d="M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 0 0 7.07 7.07L12.5 19.5" /></svg>;
}
function CalendarIcon(props) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>;
}
function TrashIcon(props) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16Z" /></svg>;
}
function DragIcon(props) {
  return <svg viewBox="0 0 24 24" fill="currentColor" {...props}><circle cx="8" cy="6" r="1.5" /><circle cx="8" cy="12" r="1.5" /><circle cx="8" cy="18" r="1.5" /><circle cx="16" cy="6" r="1.5" /><circle cx="16" cy="12" r="1.5" /><circle cx="16" cy="18" r="1.5" /></svg>;
}
