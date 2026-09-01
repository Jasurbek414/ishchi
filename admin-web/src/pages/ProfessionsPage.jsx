import { useEffect, useState, useCallback } from 'react';
import { api, ApiError } from '../api/client.js';

export default function ProfessionsPage() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [editing, setEditing] = useState(null); // null = closed, {} = new, {id,...} = edit

  const load = useCallback(() => {
    setError(null);
    api.get('/api/admin/professions')
      .then(setItems)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Yuklab bo'lmadi"));
  }, []);

  useEffect(() => { load(); }, [load]);

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
    if (!confirm(`"${p.name}" kasbini butunlay o'chirmoqchimisiz?`)) return;
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
      <h1>Kasblar</h1>

      <div className="toolbar">
        <button className="btn btn-primary" onClick={() => setEditing({})}>+ Yangi kasb</button>
      </div>

      {error && <div className="error-text">{error}</div>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nomi</th>
              <th>Kategoriya</th>
              <th>Holat</th>
              <th>Amallar</th>
            </tr>
          </thead>
          <tbody>
            {items?.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.category}</td>
                <td>
                  <span className={`badge ${p.active ? 'badge-success' : 'badge-neutral'}`}>
                    {p.active ? 'Faol' : 'Faol emas'}
                  </span>
                </td>
                <td style={{ display: 'flex', gap: 8 }}>
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
        {items && items.length === 0 && <div className="empty-state">Kasblar topilmadi</div>}
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
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{isNew ? 'Yangi kasb' : 'Kasbni tahrirlash'}</h3>
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
      </div>
    </div>
  );
}
