import { useEffect, useState } from 'react';
import { api, ApiError } from '../api/client.js';
import { useAppSettings } from '../settings/AppSettingsContext.jsx';

export default function SettingsPage() {
  return (
    <div>
      <h1>Sozlamalar</h1>
      <AppInfoSettingsCard />
      <BroadcastNotificationCard />
    </div>
  );
}

function AppInfoSettingsCard() {
  const { settings, refresh } = useAppSettings();
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [telegram, setTelegram] = useState('');
  const [aboutText, setAboutText] = useState('');
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [busy, setBusy] = useState(false);

  if (settings && !initialized) {
    setPhone(settings.supportPhone ?? '');
    setEmail(settings.supportEmail ?? '');
    setTelegram(settings.supportTelegram ?? '');
    setAboutText(settings.aboutText ?? '');
    setInitialized(true);
  }

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      await api.patch('/api/admin/settings', {
        supportPhone: phone.trim(),
        supportEmail: email.trim(),
        supportTelegram: telegram.trim(),
        aboutText: aboutText.trim(),
      });
      await refresh();
      setSuccess('Saqlandi — mobil ilovada darhol yangilanadi');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Saqlab bo'lmadi");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card" style={{ marginTop: 24 }}>
      <h3 style={{ margin: '0 0 4px' }}>Ilova haqida ma'lumotlar</h3>
      <p style={{ margin: '0 0 16px', color: 'var(--text-secondary)', fontSize: 13 }}>
        Mobil ilovadagi "Ilova haqida" sahifasida ko'rsatiladi — o'zgartirish darhol kuchga kiradi, yangi versiya kerak emas.
      </p>
      {!settings && <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Yuklanmoqda...</p>}
      {settings && (
        <form onSubmit={save}>
          <div className="field">
            <label>Aloqa uchun telefon</label>
            <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+998901234567" disabled={busy} />
          </div>
          <div className="field">
            <label>Elektron pochta</label>
            <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="support@example.com" disabled={busy} />
          </div>
          <div className="field">
            <label>Telegram (foydalanuvchi nomi, @ belgisiz)</label>
            <input type="text" value={telegram} onChange={(e) => setTelegram(e.target.value)} placeholder="username" disabled={busy} />
          </div>
          <div className="field">
            <label>Platforma haqida matn</label>
            <textarea
              value={aboutText}
              onChange={(e) => setAboutText(e.target.value)}
              placeholder="Platforma haqida batafsil ma'lumot..."
              rows={8}
            />
          </div>
          {error && <div className="error-text">{error}</div>}
          {success && <div style={{ color: 'var(--success)', fontSize: 13, marginBottom: 14 }}>{success}</div>}
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? 'Saqlanmoqda...' : 'Saqlash'}
          </button>
        </form>
      )}
    </div>
  );
}

function BroadcastNotificationCard() {
  const [regions, setRegions] = useState([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [role, setRole] = useState('');
  const [regionId, setRegionId] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [sending, setSending] = useState(false);

  useEffect(() => { api.get('/api/regions').then(setRegions).catch(() => {}); }, []);

  async function send(e) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      setError("Sarlavha va matnni to'ldiring");
      return;
    }
    const audience = !role
      ? 'HAMMA foydalanuvchiga'
      : `${role === 'WORKER' ? 'ishchilarga' : 'ish beruvchilarga'}${regionId ? ' (tanlangan hududda)' : ''}`;
    if (!confirm(`Ushbu bildirishnoma ${audience} yuboriladi. Buni orqaga qaytarib bo'lmaydi. Davom etasizmi?`)) return;
    setSending(true);
    setError(null);
    setSuccess(null);
    try {
      await api.post('/api/admin/notifications/broadcast', {
        title: title.trim(),
        body: body.trim(),
        role: role || undefined,
        regionId: role && regionId ? Number(regionId) : undefined,
      });
      setSuccess("Bildirishnoma yuborildi");
      setTitle('');
      setBody('');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Yuborib bo'lmadi");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="card" style={{ marginTop: 24 }}>
      <h3 style={{ margin: '0 0 4px' }}>Push-bildirishnoma yuborish</h3>
      <p style={{ margin: '0 0 16px', color: 'var(--text-secondary)', fontSize: 13 }}>
        Push-bildirishnoma qurilmasida ilovani o'rnatgan va ro'yxatdan o'tgan foydalanuvchilarga yuboriladi.
      </p>
      <form onSubmit={send}>
        <div className="field">
          <label>Sarlavha</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="masalan: Yangilik" />
        </div>
        <div className="field">
          <label>Matn</label>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Xabar matni" />
        </div>
        <div className="field">
          <label>Kimga</label>
          <select value={role} onChange={(e) => { setRole(e.target.value); setRegionId(''); }}>
            <option value="">Hammaga</option>
            <option value="WORKER">Faqat ishchilar</option>
            <option value="EMPLOYER">Faqat ish beruvchilar</option>
          </select>
        </div>
        {role && (
          <div className="field">
            <label>Hudud (ixtiyoriy)</label>
            <select value={regionId} onChange={(e) => setRegionId(e.target.value)}>
              <option value="">Barcha hududlar</option>
              {regions.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
        )}
        {error && <div className="error-text">{error}</div>}
        {success && <div style={{ color: 'var(--success)', fontSize: 13, marginBottom: 14 }}>{success}</div>}
        <button type="submit" className="btn btn-primary" disabled={sending}>
          {sending ? 'Yuborilmoqda...' : 'Yuborish'}
        </button>
      </form>
    </div>
  );
}
