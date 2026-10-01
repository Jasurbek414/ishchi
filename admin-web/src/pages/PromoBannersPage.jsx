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
  const [items, setItems] = useState(null);
  const [regions, setRegions] = useState([]);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [editing, setEditing] = useState(null); // null = closed, {} = new, {id,...} = edit
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
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { api.get('/api/regions').then(setRegions).catch(() => {}); }, []);

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
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div>
          <h1 className="mb-1!">Reklama karuseli</h1>
          <p className="text-[13px] text-text-secondary m-0">
            Mobil ilova bosh sahifasida aylanadigan reklama bannerlarini boshqaring.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setEditing({})}>+ Yangi reklama</button>
      </div>

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
            className="text-[12.5px] font-semibold text-danger px-2"
            onClick={() => { setSearch(''); setAudienceFilter('ALL'); setStatusFilter('ALL'); setRegionFilter('ALL'); }}
          >
            Tozalash
          </button>
        )}
        {!filtersActive && (
          <span className="text-[12px] text-text-secondary ml-auto flex items-center gap-1">
            <DragIcon className="w-3.5 h-3.5" /> Kartani sudrab tartibni o'zgartiring
          </span>
        )}
      </div>

      {error && <div className="error-text">{error}</div>}

      {visibleItems && visibleItems.length === 0 && (
        <div className="empty-state">
          {items.length === 0 ? 'Reklamalar topilmadi' : 'Filtrga mos reklama topilmadi'}
        </div>
      )}

      <div className={`grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 ${reordering ? 'opacity-60 pointer-events-none' : ''}`}>
        {visibleItems?.map((b) => {
          const status = bannerStatus(b);
          const draggable = !filtersActive;
          return (
            <div
              key={b.id}
              draggable={draggable}
              onDragStart={() => handleDragStart(b.id)}
              onDragOver={(e) => handleDragOver(e, b.id)}
              onDrop={() => handleDrop(b.id)}
              className={`card p-0! overflow-hidden flex flex-col transition-shadow ${dragOverId === b.id ? 'ring-2 ring-primary' : ''} ${draggable ? 'cursor-grab active:cursor-grabbing' : ''}`}
            >
              <BannerPreview banner={b} />
              <div className="p-4 flex flex-col gap-3 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-bold text-[14.5px] truncate">{b.title}</div>
                    {b.subtitle && <div className="text-[12.5px] text-text-secondary truncate">{b.subtitle}</div>}
                  </div>
                  <span className={`badge ${status.className} whitespace-nowrap`}>{status.label}</span>
                </div>

                <div className="flex flex-wrap gap-1.5 text-[11.5px]">
                  <span className="px-2 py-0.5 rounded-full bg-bg text-text-secondary font-medium">{AUDIENCE_LABELS[b.audience] || b.audience}</span>
                  <span className="px-2 py-0.5 rounded-full bg-bg text-text-secondary font-medium" title={b.regionNames?.join(', ')}>
                    {!b.regionNames || b.regionNames.length === 0
                      ? 'Barcha hududlar'
                      : b.regionNames.length <= 2
                        ? b.regionNames.join(', ')
                        : `${b.regionNames[0]} +${b.regionNames.length - 1}`}
                  </span>
                  {draggable && <span className="px-2 py-0.5 rounded-full bg-bg text-text-secondary font-medium">#{b.sortOrder}</span>}
                </div>

                {(b.startAt || b.endAt) && (
                  <div className="text-[11.5px] text-text-secondary flex items-center gap-1.5">
                    <CalendarIcon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">
                      {b.startAt ? formatDate(b.startAt) : 'Hozir'} → {b.endAt ? formatDate(b.endAt) : 'Muddatsiz'}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-4 text-[12.5px] text-text-secondary">
                  <span className="flex items-center gap-1"><EyeIcon className="w-4 h-4" /> {b.viewCount || 0}</span>
                  <span className="flex items-center gap-1"><CursorIcon className="w-4 h-4" /> {b.clickCount || 0}</span>
                  {b.linkUrl && (
                    <span className="flex items-center gap-1 truncate">
                      <LinkIcon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{b.linkUrl}</span>
                    </span>
                  )}
                </div>

                <div className="mt-auto pt-1 flex flex-wrap gap-2">
                  <button className="btn btn-outline" onClick={() => setEditing(b)}>Tahrirlash</button>
                  <button
                    className={b.active ? 'btn btn-outline-danger' : 'btn btn-primary'}
                    disabled={busyId === b.id}
                    onClick={() => toggleActive(b)}
                  >
                    {b.active ? 'Faolsizlantirish' : 'Faollashtirish'}
                  </button>
                  <button className="btn btn-outline-danger px-2!" disabled={busyId === b.id} onClick={() => remove(b)} title="O'chirish">
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {editing !== null && (
        <BannerModal
          banner={editing}
          regions={regions}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
    </div>
  );
}

function StatTile({ label, value, accent }) {
  return (
    <div className="stat-card">
      <div className={`stat-value ${accent || ''}`}>{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function BannerPreview({ banner, imagePreviewUrl }) {
  const imageUrl = imagePreviewUrl || banner.imageUrl;
  return (
    <div className="relative h-28 w-full bg-gradient-to-br from-primary-light to-primary overflow-hidden shrink-0">
      {imageUrl && (
        <img src={imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-55 mix-blend-multiply" />
      )}
      <div className="relative h-full flex flex-col justify-center px-4">
        <div className="text-white font-extrabold text-[15px] leading-tight truncate drop-shadow-sm">
          {banner.title || 'Sarlavha'}
        </div>
        {banner.subtitle && (
          <div className="text-white/90 text-[12px] leading-snug line-clamp-2 mt-1">{banner.subtitle}</div>
        )}
      </div>
    </div>
  );
}

function BannerModal({ banner, regions, onClose, onSaved }) {
  const isNew = !banner.id;
  const [title, setTitle] = useState(banner.title || '');
  const [subtitle, setSubtitle] = useState(banner.subtitle || '');
  const [linkUrl, setLinkUrl] = useState(banner.linkUrl || '');
  const [audience, setAudience] = useState(banner.audience || 'ALL');
  const [regionIds, setRegionIds] = useState(banner.regionIds ? banner.regionIds.map(String) : []);
  const [sortOrder, setSortOrder] = useState(banner.sortOrder ?? 0);
  const [active, setActive] = useState(banner.active ?? true);
  const [startAt, setStartAt] = useState(toLocalInputValue(banner.startAt));
  const [endAt, setEndAt] = useState(toLocalInputValue(banner.endAt));
  const [image, setImage] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!image) { setImagePreviewUrl(null); return; }
    const url = URL.createObjectURL(image);
    setImagePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  async function submit(e) {
    e.preventDefault();
    if (!title.trim()) {
      setError('Sarlavhani kiriting');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      if (subtitle.trim()) formData.append('subtitle', subtitle.trim());
      if (linkUrl.trim()) formData.append('linkUrl', linkUrl.trim());
      formData.append('audience', audience);
      formData.append('sortOrder', String(sortOrder || 0));
      formData.append('active', String(active));
      if (image) formData.append('image', image);

      if (startAt) formData.append('startAt', new Date(startAt).toISOString());
      if (endAt) formData.append('endAt', new Date(endAt).toISOString());

      regionIds.forEach((id) => formData.append('regionIds', id));

      if (isNew) {
        await api.postForm('/api/admin/promo-banners', formData);
      } else {
        formData.append('regionsProvided', 'true');
        if (!startAt && banner.startAt) formData.append('clearStartAt', 'true');
        if (!endAt && banner.endAt) formData.append('clearEndAt', 'true');
        await api.patchForm(`/api/admin/promo-banners/${banner.id}`, formData);
      }
      onSaved();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Saqlab bo'lmadi");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal onClose={onClose} ariaLabel="Bannerni tahrirlash" panelClassName="max-w-2xl! p-0! overflow-hidden">
      <BannerPreview banner={{ title, subtitle, imageUrl: banner.imageUrl }} imagePreviewUrl={imagePreviewUrl} />
      <div className="p-6">
        <h3>{isNew ? 'Yangi reklama' : 'Reklamani tahrirlash'}</h3>
        <form onSubmit={submit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <div className="field sm:col-span-2">
              <label>Sarlavha</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="masalan: Har kuni yangi ishlar" />
            </div>
            <div className="field sm:col-span-2">
              <label>Qo'shimcha matn (ixtiyoriy)</label>
              <textarea value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Qisqa tavsif" />
            </div>
            <div className="field">
              <label>Qayerda ko'rinsin</label>
              <select value={audience} onChange={(e) => setAudience(e.target.value)}>
                <option value="ALL">Hammaga (ikkala karusel ham)</option>
                <option value="WORKER">Faqat ishchilar (bosh sahifa)</option>
                <option value="EMPLOYER">Faqat ish beruvchilar (qidiruv)</option>
              </select>
            </div>
            <div className="field sm:col-span-2">
              <label>Hududlar (ixtiyoriy — hech biri belgilanmasa, barcha hududlarga ko'rinadi)</label>
              <div className="border border-line rounded-xl p-2.5 max-h-[160px] overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {regions.map((r) => {
                  const idStr = String(r.id);
                  const checked = regionIds.includes(idStr);
                  return (
                    <label key={r.id} className="flex items-center gap-1.5 text-[13px] cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-auto"
                        checked={checked}
                        onChange={(e) => {
                          setRegionIds((prev) => e.target.checked ? [...prev, idStr] : prev.filter((x) => x !== idStr));
                        }}
                      />
                      {r.name}
                    </label>
                  );
                })}
              </div>
            </div>
            <div className="field sm:col-span-2">
              <label>Bosilganda ochiladigan havola (ixtiyoriy)</label>
              <input type="text" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://... yoki bo'sh qoldiring" />
            </div>
            <div className="field">
              <label>Boshlanish vaqti (ixtiyoriy)</label>
              <input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
            </div>
            <div className="field">
              <label>Tugash vaqti (ixtiyoriy)</label>
              <input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
            </div>
            <div className="field">
              <label>Tartib raqami (kichigi birinchi ko'rinadi)</label>
              <input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
            </div>
            <div className="field">
              <label>Rasm {isNew ? '(ixtiyoriy)' : '(yangilash uchun tanlang)'}</label>
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setImage(e.target.files?.[0] || null)} />
            </div>
            <div className="field field-checkbox sm:col-span-2">
              <input type="checkbox" id="banner-active" checked={active} onChange={(e) => setActive(e.target.checked)} />
              <label htmlFor="banner-active" className="m-0">Faol (mobil ilovada ko'rinadi)</label>
            </div>
          </div>
          {!isNew && (
            <div className="flex items-center gap-4 text-[12.5px] text-text-secondary mb-3">
              <span className="flex items-center gap-1"><EyeIcon className="w-4 h-4" /> {banner.viewCount || 0} ko'rish</span>
              <span className="flex items-center gap-1"><CursorIcon className="w-4 h-4" /> {banner.clickCount || 0} bosish</span>
            </div>
          )}
          {error && <div className="error-text">{error}</div>}
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
