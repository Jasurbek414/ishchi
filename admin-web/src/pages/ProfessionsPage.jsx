import { useEffect, useState, useCallback, useMemo } from 'react';
import { api, ApiError } from '../api/client.js';
import Modal from '../components/Modal';

export default function ProfessionsPage() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [editing, setEditing] = useState(null); // null = closed, {} = new, {id,...} = edit
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  const load = useCallback(() => {
    setError(null);
    api.get('/api/admin/professions')
      .then(setItems)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Yuklab bo'lmadi"));
  }, []);

  useEffect(() => { load(); }, [load]);

  const categories = useMemo(() => {
    if (!items) return [];
    return [...new Set(items.map((p) => p.category))].sort((a, b) => a.localeCompare(b));
  }, [items]);

  const visibleItems = useMemo(() => {
    if (!items) return null;
    const q = search.trim().toLowerCase();
    return items.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q)) return false;
      if (category && p.category !== category) return false;
      return true;
    });
  }, [items, search, category]);

  const stats = useMemo(() => {
    if (!items) return null;
    return {
      total: items.length,
      active: items.filter((p) => p.active).length,
      categories: categories.length,
      inUse: items.filter((p) => p.jobCount > 0).length,
    };
  }, [items, categories]);

  async function toggleActive(p) {
    setBusyId(p.id);
    try {
      await api.patch(`/api/admin/professions/${p.id}/active`, { active: !p.active });
      load();
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "Amalni bajarib bo'lmadi");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(p) {
    const warn = p.jobCount > 0
      ? `"${p.name}" kasbi ${p.jobCount} ta buyurtmada ishlatilgan. Baribir butunlay o'chirmoqchimisiz?`
      : `"${p.name}" kasbini butunlay o'chirmoqchimisiz?`;
    if (!confirm(warn)) return;
    setBusyId(p.id);
    try {
      await api.del(`/api/admin/professions/${p.id}`);
      load();
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "O'chirib bo'lmadi (foydalanilayotgan bo'lishi mumkin)");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div>
          <h1 className="mb-1">Kasblar</h1>
          <p className="text-[13px] text-text-secondary m-0">
            Mobil ilovadagi kasb ro'yxati — ishchilar profilida va buyurtma yaratishda ishlatiladi.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setEditing({})}>+ Yangi kasb</button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <div className="stat-card">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Jami kasblar</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.active}</div>
            <div className="stat-label">Faol</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.categories}</div>
            <div className="stat-label">Kategoriyalar</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.inUse}</div>
            <div className="stat-label">Buyurtmalarda ishlatilgan</div>
          </div>
        </div>
      )}

      <div className="toolbar">
        <input
          type="text"
          className="input min-w-[200px]"
          placeholder="Kasb nomi bo'yicha qidirish..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="select" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">Barcha kategoriyalar</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {error && <div className="error-text">{error}</div>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nomi</th>
              <th>Kategoriya</th>
              <th>Buyurtmalarda</th>
              <th>Holat</th>
              <th>Amallar</th>
            </tr>
          </thead>
          <tbody>
            {visibleItems?.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.category}</td>
                <td>
                  {p.jobCount > 0
                    ? <span className="badge bg-text-secondary/12 text-text-secondary">{p.jobCount} ta</span>
                    : <span className="text-text-secondary text-[12.5px]">—</span>}
                </td>
                <td>
                  <span className={`badge ${p.active ? 'badge-success' : 'badge-neutral'}`}>
                    {p.active ? 'Faol' : 'Faol emas'}
                  </span>
                </td>
                <td className="flex gap-2">
                  <button className="btn btn-outline" onClick={() => setEditing(p)}>Tahrirlash</button>
                  <button
                    className={p.active ? 'btn btn-outline-danger' : 'btn btn-primary'}
                    disabled={busyId === p.id}
                    onClick={() => toggleActive(p)}
                  >
                    {p.active ? 'Faolsizlantirish' : 'Faollashtirish'}
                  </button>
                  <button className="btn btn-outline-danger" disabled={busyId === p.id} onClick={() => remove(p)}>
                    O'chirish
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {visibleItems && visibleItems.length === 0 && (
          <div className="empty-state">{items.length === 0 ? 'Kasblar topilmadi' : 'Filtrga mos kasb topilmadi'}</div>
        )}
      </div>

      {editing !== null && (
        <ProfessionModal profession={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />
      )}
    </div>
  );
}

function ProfessionModal({ profession, onClose, onSaved }) {
  const isNew = !profession.id;
  const [name, setName] = useState(profession.name || '');
  const [category, setCategory] = useState(profession.category || '');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!name.trim() || !category.trim()) {
      setError("Kasb nomi va kategoriyasini kiriting");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (isNew) {
        await api.post('/api/admin/professions', { name: name.trim(), category: category.trim() });
      } else {
        await api.patch(`/api/admin/professions/${profession.id}`, { name: name.trim(), category: category.trim() });
      }
      onSaved();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Saqlab bo'lmadi");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={isNew ? 'Yangi kasb' : 'Kasbni tahrirlash'} onClose={onClose}>
      <form onSubmit={submit}>
        <div className="field">
          <label>Kasb nomi</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="masalan: Elektrik" />
        </div>
        <div className="field">
          <label>Kategoriya</label>
          <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="masalan: Qurilish" />
        </div>
        {error && <div className="error-text">{error}</div>}
        <div className="modal-actions">
          <button type="button" className="btn btn-outline" onClick={onClose}>Bekor qilish</button>
          <button type="submit" className="btn btn-primary" disabled={busy}>Saqlash</button>
        </div>
      </form>
    </Modal>
  );
}
