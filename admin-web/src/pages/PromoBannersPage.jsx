import { useEffect, useState, useCallback } from 'react';
import { api, ApiError } from '../api/client.js';

const AUDIENCE_LABELS = { ALL: 'Hammaga', WORKER: 'Ishchilar (bosh sahifa)', EMPLOYER: 'Ish beruvchilar (qidiruv)' };

export default function PromoBannersPage() {
  const [items, setItems] = useState(null);
  const [regions, setRegions] = useState([]);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [editing, setEditing] = useState(null); // null = closed, {} = new, {id,...} = edit

  const load = useCallback(() => {
    setError(null);
    api.get('/api/admin/promo-banners')
      .then(setItems)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Yuklab bo'lmadi"));
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { api.get('/api/regions').then(setRegions).catch(() => {}); }, []);

  async function toggleActive(b) {
    setBusyId(b.id);
    try {
      await api.patch(`/api/admin/promo-banners/${b.id}/active`, { active: !b.active });
      load();
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "Amalni bajarib bo'lmadi");
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
      alert(e instanceof ApiError ? e.message : "O'chirib bo'lmadi");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <h1>Reklama karuseli</h1>

      <div className="toolbar">
        <button className="btn btn-primary" onClick={() => setEditing({})}>+ Yangi reklama</button>
      </div>

      {error && <div className="error-text">{error}</div>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Rasm</th>
              <th>Sarlavha</th>
              <th>Qayerda ko'rinadi</th>
              <th>Hudud</th>
              <th>Tartib</th>
              <th>Holat</th>
              <th>Amallar</th>
            </tr>
          </thead>
          <tbody>
            {items?.map((b) => (
              <tr key={b.id}>
                <td>
                  {b.imageUrl
                    ? <img className="banner-thumb" src={b.imageUrl} alt="" />
                    : <div className="banner-thumb" />}
                </td>
                <td>{b.title}</td>
                <td>{AUDIENCE_LABELS[b.audience] || b.audience}</td>
                <td>{b.regionName || 'Barcha hududlar'}</td>
                <td>{b.sortOrder}</td>
                <td>
                  <span className={`badge ${b.active ? 'badge-success' : 'badge-neutral'}`}>
                    {b.active ? 'Faol' : 'Faol emas'}
                  </span>
                </td>
                <td style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-outline" onClick={() => setEditing(b)}>Tahrirlash</button>
                  <button
                    className={b.active ? 'btn btn-outline-danger' : 'btn btn-primary'}
                    disabled={busyId === b.id}
                    onClick={() => toggleActive(b)}
                  >
                    {b.active ? 'Faolsizlantirish' : 'Faollashtirish'}
                  </button>
                  <button className="btn btn-outline-danger" disabled={busyId === b.id} onClick={() => remove(b)}>
                    O'chirish
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items && items.length === 0 && <div className="empty-state">Reklamalar topilmadi</div>}
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

function BannerModal({ banner, regions, onClose, onSaved }) {
  const isNew = !banner.id;
  const [title, setTitle] = useState(banner.title || '');
  const [subtitle, setSubtitle] = useState(banner.subtitle || '');
  const [linkUrl, setLinkUrl] = useState(banner.linkUrl || '');
  const [audience, setAudience] = useState(banner.audience || 'ALL');
  const [regionId, setRegionId] = useState(banner.regionId ? String(banner.regionId) : '');
  const [sortOrder, setSortOrder] = useState(banner.sortOrder ?? 0);
  const [active, setActive] = useState(banner.active ?? true);
  const [image, setImage] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

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

      if (isNew) {
        if (regionId) formData.append('regionId', regionId);
        await api.postForm('/api/admin/promo-banners', formData);
      } else {
        if (regionId) {
          formData.append('regionId', regionId);
        } else {
          formData.append('clearRegion', 'true');
        }
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
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{isNew ? 'Yangi reklama' : 'Reklamani tahrirlash'}</h3>
        <form onSubmit={submit}>
          <div className="field">
            <label>Sarlavha</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="masalan: Har kuni yangi ishlar" />
          </div>
          <div className="field">
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
          <div className="field">
            <label>Hudud (ixtiyoriy)</label>
            <select value={regionId} onChange={(e) => setRegionId(e.target.value)}>
              <option value="">Barcha hududlar</option>
              {regions.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Bosilganda ochiladigan havola (ixtiyoriy)</label>
            <input type="text" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://... yoki bo'sh qoldiring" />
          </div>
          <div className="field">
            <label>Tartib raqami (kichigi birinchi ko'rinadi)</label>
            <input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
          </div>
          <div className="field">
            <label>Rasm {isNew ? '(ixtiyoriy)' : '(yangilash uchun tanlang)'}</label>
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setImage(e.target.files?.[0] || null)} />
            {!isNew && banner.imageUrl && !image && (
              <img className="banner-thumb" src={banner.imageUrl} alt="" style={{ marginTop: 8 }} />
            )}
          </div>
          <div className="field field-checkbox">
            <input type="checkbox" id="banner-active" checked={active} onChange={(e) => setActive(e.target.checked)} />
            <label htmlFor="banner-active" style={{ margin: 0 }}>Faol (mobil ilovada ko'rinadi)</label>
          </div>
          {error && <div className="error-text">{error}</div>}
          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>Bekor qilish</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>Saqlash</button>
          </div>
        </form>
      </div>
    </div>
  );
}
