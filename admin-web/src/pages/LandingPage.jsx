import { useEffect, useState, useCallback, useRef } from 'react';
import { api, ApiError } from '../api/client.js';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast.jsx';

export default function LandingPage() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setError(null);
    api.get('/api/admin/landing')
      .then(setData)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Yuklab bo'lmadi"));
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <h1>Landing sahifa</h1>
      <p className="text-text-secondary text-[13px] -mt-2 mb-6">
        Bu yerdagi o'zgarishlar <strong>uzbishchi.uz</strong> ochiladigan ommaviy tanishtiruv sahifasida darhol ko'rinadi.
      </p>
      {error && <div className="error-text">{error}</div>}
      {!data && !error && <p>Yuklanmoqda...</p>}
      {data && (
        <>
          <HeroCard data={data} onSaved={setData} />
          <ItemsCard title="Imkoniyatlar bo'limi" hint="Bosh sahifadagi 'Imkoniyatlar' katakchalari — har biri sarlavha va qisqa tavsifdan iborat." type="FEATURE" items={data.features} onChanged={load} />
          <ItemsCard title="Yo'l xaritasi bo'limi" hint="Bosh sahifadagi 'Kelajakda' rejalar ro'yxati." type="ROADMAP" items={data.roadmap} onChanged={load} />
        </>
      )}
    </div>
  );
}

function HeroCard({ data, onSaved }) {
  const [heroTitle, setHeroTitle] = useState(data.heroTitle);
  const [heroSubtitle, setHeroSubtitle] = useState(data.heroSubtitle);
  const [stats, setStats] = useState(data.stats.map((s) => ({ ...s })));
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [busy, setBusy] = useState(false);

  function setStat(i, field, value) {
    setStats((prev) => prev.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)));
  }

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const body = { heroTitle, heroSubtitle };
      stats.forEach((s, i) => {
        body[`stat${i + 1}Value`] = s.value;
        body[`stat${i + 1}Label`] = s.label;
      });
      const updated = await api.patch('/api/admin/landing', body);
      onSaved((prev) => ({ ...prev, ...updated }));
      setSuccess('Saqlandi — landing sahifada darhol yangilanadi');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Saqlab bo'lmadi");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card mt-0">
      <h3 className="mt-0 mx-0 mb-1">Hero bo'limi</h3>
      <p className="mt-0 mx-0 mb-4 text-text-secondary text-[13px]">
        Sahifaning eng yuqorisidagi sarlavha, qisqa matn va 4 ta ko'rsatkich.
      </p>
      <form onSubmit={save}>
        <div className="field">
          <label>Sarlavha</label>
          <input type="text" value={heroTitle} onChange={(e) => setHeroTitle(e.target.value)} />
        </div>
        <div className="field">
          <label>Qisqa tavsif</label>
          <textarea value={heroSubtitle} onChange={(e) => setHeroSubtitle(e.target.value)} rows={3} />
        </div>
        <div className="field">
          <label>Ko'rsatkichlar (4 ta)</label>
          <div className="grid grid-cols-2 gap-2.5">
            {stats.map((s, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  value={s.value}
                  onChange={(e) => setStat(i, 'value', e.target.value)}
                  placeholder="14"
                  className="w-[38%]"
                />
                <input
                  type="text"
                  value={s.label}
                  onChange={(e) => setStat(i, 'label', e.target.value)}
                  placeholder="viloyat qamrovi"
                  className="flex-1"
                />
              </div>
            ))}
          </div>
        </div>
        {error && <div className="error-text">{error}</div>}
        {success && <div className="text-success text-[13px] mb-3.5">{success}</div>}
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? 'Saqlanmoqda...' : 'Saqlash'}
        </button>
      </form>
    </div>
  );
}

function ItemsCard({ title, hint, type, items, onChanged }) {
  const [editing, setEditing] = useState(null); // null = closed, {} = new, {id,...} = edit
  const [busyId, setBusyId] = useState(null);
  const [localItems, setLocalItems] = useState(items);
  const [reordering, setReordering] = useState(false);
  const dragId = useRef(null);
  const [dragOverId, setDragOverId] = useState(null);

  useEffect(() => { setLocalItems(items); }, [items]);

  async function remove(item) {
    if (!confirm(`"${item.title}" elementini o'chirmoqchimisiz?`)) return;
    setBusyId(item.id);
    try {
      await api.del(`/api/admin/landing/items/${item.id}`);
      onChanged();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "O'chirib bo'lmadi");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDrop(targetId) {
    const sourceId = dragId.current;
    dragId.current = null;
    setDragOverId(null);
    if (!sourceId || sourceId === targetId) return;

    const next = [...localItems];
    const from = next.findIndex((it) => it.id === sourceId);
    const to = next.findIndex((it) => it.id === targetId);
    if (from === -1 || to === -1) return;
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);

    setLocalItems(next);
    setReordering(true);
    try {
      await api.patch('/api/admin/landing/items/reorder', { ids: next.map((it) => it.id) });
      onChanged();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Tartibni saqlab bo'lmadi");
      onChanged();
    } finally {
      setReordering(false);
    }
  }

  return (
    <div className="card mt-6">
      <div className="flex justify-between items-start gap-3">
        <div>
          <h3 className="mt-0 mx-0 mb-1">{title}</h3>
          <p className="mt-0 mx-0 mb-1 text-text-secondary text-[13px]">{hint}</p>
          {localItems.length > 1 && <p className="mt-0 mx-0 mb-4 text-text-secondary text-[12px]">Kartani sudrab tartibni o'zgartirishingiz mumkin.</p>}
        </div>
        <button className="btn btn-primary" onClick={() => setEditing({})}>+ Qo'shish</button>
      </div>

      <div className={`flex flex-col gap-2.5 ${reordering ? 'opacity-60 pointer-events-none' : ''}`}>
        {localItems.length === 0 && <div className="empty-state">Hali element yo'q</div>}
        {localItems.map((item) => (
          <div
            key={item.id}
            draggable
            onDragStart={() => { dragId.current = item.id; }}
            onDragOver={(e) => { e.preventDefault(); if (dragOverId !== item.id) setDragOverId(item.id); }}
            onDrop={() => handleDrop(item.id)}
            className={`border border-line rounded-[10px] p-3.5 flex justify-between gap-3 cursor-grab active:cursor-grabbing ${dragOverId === item.id ? 'ring-2 ring-primary' : ''}`}
          >
            <div>
              <strong className="text-[14px]">{item.title}</strong>
              <p className="mt-1 mx-0 mb-0 text-[13px] text-text-secondary">{item.description}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button className="btn btn-outline" onClick={() => setEditing(item)}>Tahrirlash</button>
              <button className="btn btn-outline-danger" disabled={busyId === item.id} onClick={() => remove(item)}>O'chirish</button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <ItemFormModal
          type={type}
          item={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); onChanged(); }}
        />
      )}
    </div>
  );
}

function ItemFormModal({ type, item, onClose, onSaved }) {
  const isNew = !item.id;
  const [title, setTitle] = useState(item.title || '');
  const [description, setDescription] = useState(item.description || '');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    setBusy(true);
    setError(null);
    try {
      if (isNew) {
        await api.post('/api/admin/landing/items', { type, title: title.trim(), description: description.trim() });
      } else {
        await api.patch(`/api/admin/landing/items/${item.id}`, { title: title.trim(), description: description.trim() });
      }
      onSaved();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Saqlab bo'lmadi");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={isNew ? 'Yangi element' : 'Elementni tahrirlash'} onClose={onClose}>
      <form onSubmit={submit}>
        <div className="field">
          <label>Sarlavha</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="masalan: Xarita asosida qidiruv" />
        </div>
        <div className="field">
          <label>Tavsif</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Qisqa tavsif matni..." />
        </div>
        {error && <div className="error-text">{error}</div>}
        <div className="modal-actions">
          <button type="button" className="btn btn-outline" onClick={onClose}>Bekor qilish</button>
          <button type="submit" className="btn btn-primary" disabled={busy || !title.trim() || !description.trim()}>
            {busy ? 'Saqlanmoqda...' : 'Saqlash'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
