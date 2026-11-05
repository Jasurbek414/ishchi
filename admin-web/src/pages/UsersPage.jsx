import { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { api, ApiError } from '../api/client.js';
import { useAppSettings } from '../settings/AppSettingsContext.jsx';

const ROLE_LABELS = { WORKER: 'Ishchi', EMPLOYER: 'Ish beruvchi', ADMIN: 'Administrator' };

const STATUS_OPTIONS = [
  { value: '', label: 'Barcha holatlar' },
  { value: 'active', label: 'Faol' },
  { value: 'blocked', label: 'Bloklangan' },
  { value: 'unverified', label: 'Tasdiqlanmagan' },
];

export default function UsersPage() {
  const { walletEnabled } = useAppSettings();
  const location = useLocation();
  // Dashboard stat cards link here with an optional pre-filter in router state.
  const [role, setRole] = useState(location.state?.role || '');
  const [status, setStatus] = useState(location.state?.status || '');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [walletUser, setWalletUser] = useState(null);
  const [detailUser, setDetailUser] = useState(null);
  const [messageUser, setMessageUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput.trim()); setPage(0); }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const load = useCallback(() => {
    setError(null);
    api.get('/api/admin/users', {
      role: role || undefined,
      active: status === 'active' ? true : status === 'blocked' ? false : undefined,
      verified: status === 'unverified' ? false : undefined,
      search: search || undefined,
      page, size: 20, sort: 'id,desc',
    })
      .then(setData)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Yuklab bo'lmadi"));
  }, [role, status, search, page]);

  useEffect(() => { load(); }, [load]);

  async function toggleActive(user) {
    setBusyId(user.id);
    try {
      await api.patch(`/api/admin/users/${user.id}/active`, { active: !user.active });
      load();
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "Amalni bajarib bo'lmadi");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div>
          <h1 className="mb-1">Foydalanuvchilar</h1>
          {data && <p className="text-[13px] text-text-secondary m-0">{data.totalElements.toLocaleString('uz-UZ')} ta natija topildi</p>}
        </div>
      </div>

      <div className="toolbar">
        <input
          type="text"
          className="input min-w-[220px]"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Ism yoki telefon raqami bo'yicha qidirish..."
        />
        <select className="select" value={role} onChange={(e) => { setRole(e.target.value); setPage(0); }}>
          <option value="">Barcha rollar</option>
          <option value="WORKER">Ishchi</option>
          <option value="EMPLOYER">Ish beruvchi</option>
          <option value="ADMIN">Administrator</option>
        </select>
        <select className="select" value={status} onChange={(e) => { setStatus(e.target.value); setPage(0); }}>
          {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {error && <div className="error-text">{error}</div>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Foydalanuvchi</th>
              <th>Rol</th>
              <th>Holat</th>
              <th>Ro'yxatdan o'tgan</th>
              <th>Amallar</th>
            </tr>
          </thead>
          <tbody>
            {data?.content.map((u) => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>
                  <div className="whitespace-normal">{u.fullName || '—'}</div>
                  <div className="text-text-secondary text-[12px]">{u.phone}</div>
                  {u.regionName && <div className="text-text-secondary text-[12px]">{u.regionName}</div>}
                </td>
                <td>{ROLE_LABELS[u.role] || u.role}</td>
                <td>
                  <div className="flex gap-1.5 flex-wrap">
                    <span className={`badge ${u.active ? 'badge-success' : 'badge-danger'}`}>
                      {u.active ? 'Faol' : 'Bloklangan'}
                    </span>
                    {!u.verified && <span className="badge badge-neutral">Tasdiqlanmagan</span>}
                    <span className={`badge ${u.telegramLinked ? 'badge-success' : 'badge-neutral'}`}>
                      {u.telegramLinked ? 'Telegram' : 'Telegram yoʻq'}
                    </span>
                  </div>
                </td>
                <td>{new Date(u.createdAt).toLocaleDateString('uz-UZ')}</td>
                <td className="flex gap-2 flex-wrap">
                  {u.role !== 'ADMIN' && (
                    <button className="btn btn-outline" onClick={() => setDetailUser(u)}>Batafsil</button>
                  )}
                  {u.role !== 'ADMIN' && (
                    <button
                      className={u.active ? 'btn btn-outline-danger' : 'btn btn-primary'}
                      disabled={busyId === u.id}
                      onClick={() => toggleActive(u)}
                    >
                      {u.active ? 'Bloklash' : 'Faollashtirish'}
                    </button>
                  )}
                  {walletEnabled && u.role !== 'ADMIN' && (
                    <button className="btn btn-outline" onClick={() => setWalletUser(u)}>Hamyon</button>
                  )}
                  {u.telegramLinked && (
                    <button className="btn btn-outline" onClick={() => setMessageUser(u)}>Xabar yuborish</button>
                  )}
                  {u.role !== 'ADMIN' && (
                    <button className="btn btn-outline-danger" onClick={() => setDeletingUser(u)}>O'chirish</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data && data.content.length === 0 && <div className="empty-state">Foydalanuvchilar topilmadi</div>}
      </div>

      {data && data.totalPages > 1 && (
        <div className="pagination">
          <button className="btn btn-outline" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Oldingi</button>
          <span className="self-center text-[13px]">{page + 1} / {data.totalPages}</span>
          <button className="btn btn-outline" disabled={data.last} onClick={() => setPage((p) => p + 1)}>Keyingi</button>
        </div>
      )}

      {walletUser && (
        <WalletModal user={walletUser} onClose={() => setWalletUser(null)} />
      )}
      {detailUser && (
        <UserDetailModal user={detailUser} onClose={() => setDetailUser(null)} />
      )}
      {messageUser && (
        <SendMessageModal user={messageUser} onClose={() => setMessageUser(null)} />
      )}
      {deletingUser && (
        <DeleteUserModal
          user={deletingUser}
          walletEnabled={walletEnabled}
          onClose={() => setDeletingUser(null)}
          onDeleted={() => {
            setDeletingUser(null);
            // Deleting the only row on the last page would otherwise leave an empty page.
            if (data && data.content.length === 1 && page > 0) setPage((p) => p - 1);
            else load();
          }}
        />
      )}
    </div>
  );
}

function DeleteUserModal({ user, walletEnabled, onClose, onDeleted }) {
  const [confirmText, setConfirmText] = useState('');
  const [balance, setBalance] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  // Deleting an account also deletes its wallet, so show what is about to be lost.
  useEffect(() => {
    if (!walletEnabled) return;
    api.get(`/api/admin/wallets/${user.id}`)
      .then((w) => setBalance(Number(w.balance)))
      .catch(() => setBalance(null));
  }, [user.id, walletEnabled]);

  // Typing the phone number is the confirmation: this cannot be undone, and a misclick on a
  // plain "Are you sure?" dialog is far too easy next to the Block button.
  const confirmed = confirmText.trim() === user.phone;

  async function remove(e) {
    e.preventDefault();
    if (!confirmed) return;
    setBusy(true);
    setError(null);
    try {
      await api.del(`/api/admin/users/${user.id}`);
      onDeleted();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "O'chirib bo'lmadi");
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={busy ? undefined : onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Foydalanuvchini o'chirish</h3>
        <p className="mt-0 mx-0 mb-3 text-[14px]">
          <strong>{user.fullName || user.phone}</strong> ({ROLE_LABELS[user.role] || user.role}) akkaunti
          butunlay o'chiriladi. Bu amalni <strong>qaytarib bo'lmaydi</strong>.
        </p>
        <ul className="mt-0 mx-0 mb-3.5 pl-[18px] text-[13px] text-text-secondary">
          <li>Profil va yuklangan rasmlari</li>
          {user.role === 'EMPLOYER' && <li>U joylashtirgan barcha buyurtmalar va ularning rasmlari</li>}
          {user.role === 'WORKER' && <li>Ish tajribasi va ochilgan buyurtmalar tarixi</li>}
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
            <label>Tasdiqlash uchun telefon raqamini kiriting: <strong>{user.phone}</strong></label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={user.phone}
              autoFocus
            />
          </div>
          {error && <div className="error-text">{error}</div>}
          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={busy}>Bekor qilish</button>
            <button type="submit" className="btn bg-danger text-white" disabled={!confirmed || busy}>
              {busy ? "O'chirilmoqda..." : "Butunlay o'chirish"}
            </button>
          </div>
        </form>
      </div>
    </div>
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
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Telegram xabar — {user.fullName || user.phone}</h3>
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
      </div>
    </div>
  );
}

function UserDetailModal({ user, onClose }) {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get(`/api/admin/users/${user.id}/profile`)
      .then(setProfile)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Yuklab bo'lmadi"));
  }, [user.id]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal max-w-[560px] max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h3>Foydalanuvchi profili</h3>
        {error && <div className="error-text">{error}</div>}
        {!profile && !error && <p className="text-[13px] text-text-secondary">Yuklanmoqda...</p>}
        {profile && (
          <div className="flex flex-col gap-3 text-[14px]">
            {profile.avatarUrl && (
              <img src={profile.avatarUrl} alt="" className="w-[72px] h-[72px] rounded-full object-cover" />
            )}
            <DetailRow label="Ism-familiya" value={`${profile.firstName} ${profile.lastName}`} />
            <DetailRow label="Telefon" value={profile.phone} />
            <DetailRow label="Rol" value={ROLE_LABELS[profile.role] || profile.role} />
            <DetailRow label="Hudud" value={`${profile.regionName}, ${profile.districtName}`} />
            <DetailRow label="Holat" value={user.active ? 'Faol' : 'Bloklangan'} />
            <DetailRow label="Tasdiqlangan" value={user.verified ? 'Ha' : "Yo'q"} />
            <DetailRow label="Telegram" value={user.telegramLinked ? 'Ulangan' : 'Ulanmagan'} />
            <DetailRow label="Ro'yxatdan o'tgan" value={new Date(user.createdAt).toLocaleString('uz-UZ')} />
            {profile.about && <DetailRow label="O'zi haqida" value={profile.about} />}
            {profile.role === 'WORKER' && (
              <>
                <DetailRow label="Tajriba" value={profile.experienceYears != null ? `${profile.experienceYears} yil` : "Ko'rsatilmagan"} />
                <DetailRow label="Mavjudligi" value={profile.available ? 'Ish qidirmoqda' : 'Band'} />
                <DetailRow label="Ish turi" value={profile.workPreference || "Ko'rsatilmagan"} />
                <DetailRow label="Kasblar" value={profile.professions?.length ? profile.professions.map((p) => p.name).join(', ') : '—'} />
                <DetailRow
                  label="Haydovchilik guvohnomasi"
                  value={profile.hasDriverLicense ? (profile.driverLicenseCategories || 'Bor') : "Yo'q"}
                />
                {profile.experiences?.length > 0 && (
                  <div>
                    <span className="text-text-secondary text-[12px]">Ish tajribasi</span>
                    <ul className="mt-1.5 mx-0 mb-0 pl-[18px]">
                      {profile.experiences.map((e) => (
                        <li key={e.id}>
                          <strong>{e.positionTitle}</strong> — {e.companyName}
                          <br />
                          <span className="text-[12px] text-text-secondary">
                            {e.startDate} — {e.endDate || 'hozirgacha'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        )}
        <div className="modal-actions">
          <button type="button" className="btn btn-outline" onClick={onClose}>Yopish</button>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div>
      <span className="text-text-secondary text-[12px]">{label}</span>
      <div>{value}</div>
    </div>
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
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Hamyon — {user.phone}</h3>
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
      </div>
    </div>
  );
}
