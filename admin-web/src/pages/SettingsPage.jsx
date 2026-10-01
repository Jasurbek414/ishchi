import { useEffect, useState } from 'react';
import { api, ApiError } from '../api/client.js';
import { useAppSettings } from '../settings/AppSettingsContext.jsx';

export default function SettingsPage() {
  return (
    <div>
      <h1>Sozlamalar</h1>
      <AppThemeSettingsCard />
      <AppInfoSettingsCard />
      <MapSettingsCard />
      <BroadcastNotificationCard />
    </div>
  );
}

const THEME_PALETTES = [
  { id: 'sky', color: '#0284C7', label: 'Osmon ko\'k' },
  { id: 'burntOrange', color: '#E8541F', label: 'Qizg\'ish-to\'q sariq' },
  { id: 'blue', color: '#2563EB', label: "Ko'k" },
  { id: 'green', color: '#16A34A', label: 'Yashil' },
  { id: 'violet', color: '#7C3AED', label: 'Binafsha' },
  { id: 'red', color: '#DC2626', label: 'Qizil' },
  { id: 'amber', color: '#D97706', label: 'Amber' },
  { id: 'cyan', color: '#0891B2', label: 'Moviy-yashil' },
  { id: 'brown', color: '#92400E', label: "Jigarrang" },
];

const THEME_MODES = [
  { value: 'LIGHT', label: "Yorug'" },
  { value: 'DARK', label: "Qorong'i" },
  { value: 'SYSTEM', label: "Qurilma bo'yicha (avtomatik)" },
];

function AppThemeSettingsCard() {
  const { settings, refresh } = useAppSettings();
  const [themeMode, setThemeMode] = useState('LIGHT');
  const [seedColor, setSeedColor] = useState('#0284C7');
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [busy, setBusy] = useState(false);

  if (settings && !initialized) {
    setThemeMode(settings.defaultThemeMode ?? 'LIGHT');
    setSeedColor(settings.defaultSeedColor ?? '#0284C7');
    setInitialized(true);
  }

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      await api.patch('/api/admin/settings', {
        defaultThemeMode: themeMode,
        defaultSeedColor: seedColor,
      });
      await refresh();
      setSuccess('Saqlandi — yangi o\'rnatilgan ilovalarda darhol qo\'llanadi');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Saqlab bo'lmadi");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card mt-6">
      <h3 className="mt-0 mx-0 mb-1">Mobil ilovaning standart dizayni</h3>
      <p className="mt-0 mx-0 mb-4 text-text-secondary text-[13px]">
        Foydalanuvchi ilovani birinchi marta ochganda ko'radigan mavzu — o'zi Profil → Mavzu orqali
        keyinchalik o'zgartirmaguncha shu qo'llanadi. Yangi o'rnatilgan ilovalarga tegishli.
      </p>
      {!settings && <p className="text-[13px] text-text-secondary">Yuklanmoqda...</p>}
      {settings && (
        <form onSubmit={save}>
          <div className="field">
            <label>Yorug'lik rejimi</label>
            <select value={themeMode} onChange={(e) => setThemeMode(e.target.value)} disabled={busy}>
              {THEME_MODES.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Asosiy rang</label>
            <div className="flex gap-2.5 flex-wrap mt-1">
              {THEME_PALETTES.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  title={p.label}
                  onClick={() => setSeedColor(p.color)}
                  disabled={busy}
                  className="w-9 h-9 rounded-full cursor-pointer p-0"
                  style={{
                    background: p.color,
                    border: seedColor.toLowerCase() === p.color.toLowerCase()
                      ? '3px solid var(--text-primary)'
                      : '3px solid transparent',
                    outline: seedColor.toLowerCase() === p.color.toLowerCase()
                      ? '1px solid ' + p.color
                      : 'none',
                  }}
                />
              ))}
            </div>
          </div>
          <div className="field flex items-center gap-3">
            <span className="inline-block w-11 h-11 rounded-xl border border-line" style={{ background: seedColor }} />
            <div className="text-[13px] text-text-secondary">
              Tanlangan rejim: <strong>{THEME_MODES.find((m) => m.value === themeMode)?.label}</strong>
              <br />Rang kodi: <strong>{seedColor}</strong>
            </div>
          </div>
          {error && <div className="error-text">{error}</div>}
          {success && <div className="text-success text-[13px] mb-3.5">{success}</div>}
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? 'Saqlanmoqda...' : 'Saqlash'}
          </button>
        </form>
      )}
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
    <div className="card mt-6">
      <h3 className="mt-0 mx-0 mb-1">Ilova haqida ma'lumotlar</h3>
      <p className="mt-0 mx-0 mb-4 text-text-secondary text-[13px]">
        Mobil ilovadagi "Ilova haqida" sahifasida ko'rsatiladi — o'zgartirish darhol kuchga kiradi, yangi versiya kerak emas.
      </p>
      {!settings && <p className="text-[13px] text-text-secondary">Yuklanmoqda...</p>}
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
          {success && <div className="text-success text-[13px] mb-3.5">{success}</div>}
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? 'Saqlanmoqda...' : 'Saqlash'}
          </button>
        </form>
      )}
    </div>
  );
}

// Ready-made choices: the built-in OpenStreetMap tiles, or providers that hand out a key for app
// use. {key} is left for the admin to replace with their own.
const MAP_PRESETS = [
  { label: 'OpenStreetMap (standart)', url: '', attribution: '' },
  {
    label: 'MapTiler Streets (kalit kerak)',
    url: 'https://api.maptiler.com/maps/streets-v2/256/{z}/{x}/{y}.png?key={key}',
    attribution: 'MapTiler © OpenStreetMap',
  },
  {
    label: 'Stadia Maps (kalit kerak)',
    url: 'https://tiles.stadiamaps.com/tiles/osm_bright/{z}/{x}/{y}.png?api_key={key}',
    attribution: 'Stadia Maps © OpenStreetMap',
  },
];

function MapSettingsCard() {
  const { settings, refresh } = useAppSettings();
  const [url, setUrl] = useState('');
  const [attribution, setAttribution] = useState('');
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [busy, setBusy] = useState(false);

  if (settings && !initialized) {
    setUrl(settings.mapTileUrl ?? '');
    setAttribution(settings.mapAttribution ?? '');
    setInitialized(true);
  }

  async function save(e) {
    e.preventDefault();
    const trimmed = url.trim();
    if (trimmed.includes('{key}')) {
      setError("Manzildagi {key} o'rniga xizmatdan olingan kalitni qo'ying");
      return;
    }
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      await api.patch('/api/admin/settings', { mapTileUrl: trimmed, mapAttribution: attribution.trim() });
      await refresh();
      setSuccess("Saqlandi — ilova xaritalari keyingi ochilishda yangi manzildan yuklanadi");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Saqlab bo'lmadi");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card mt-6">
      <h3 className="mt-0 mx-0 mb-1">Xarita</h3>
      <p className="mt-0 mx-0 mb-4 text-text-secondary text-[13px]">
        Mobil ilovadagi barcha xaritalar shu manzildan chiziladi. Bo'sh qoldirilsa, OpenStreetMap ishlatiladi. Foydalanuvchilar
        ko'payganda kalitli xizmatga (MapTiler, Stadia) o'tish tavsiya etiladi — OpenStreetMap serverlari katta yuklama uchun
        mo'ljallanmagan.
      </p>
      {!settings && <p className="text-[13px] text-text-secondary">Yuklanmoqda...</p>}
      {settings && (
        <form onSubmit={save}>
          <div className="field">
            <label>Tayyor variant</label>
            <select
              value=""
              onChange={(e) => {
                const preset = MAP_PRESETS[Number(e.target.value)];
                if (!preset) return;
                setUrl(preset.url);
                setAttribution(preset.attribution);
              }}
              disabled={busy}
            >
              <option value="">Tanlang...</option>
              {MAP_PRESETS.map((p, i) => (
                <option key={p.label} value={i}>{p.label}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Plitkalar manzili ({'{z}'}, {'{x}'}, {'{y}'} bilan)</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              disabled={busy}
            />
          </div>
          <div className="field">
            <label>Mualliflik yozuvi (xarita burchagida ko'rinadi)</label>
            <input
              type="text"
              value={attribution}
              onChange={(e) => setAttribution(e.target.value)}
              placeholder="OpenStreetMap"
              disabled={busy}
            />
          </div>
          {error && <div className="error-text">{error}</div>}
          {success && <div className="text-success text-[13px] mb-3.5">{success}</div>}
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
    <div className="card mt-6">
      <h3 className="mt-0 mx-0 mb-1">Push-bildirishnoma yuborish</h3>
      <p className="mt-0 mx-0 mb-4 text-text-secondary text-[13px]">
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
        {success && <div className="text-success text-[13px] mb-3.5">{success}</div>}
        <button type="submit" className="btn btn-primary" disabled={sending}>
          {sending ? 'Yuborilmoqda...' : 'Yuborish'}
        </button>
      </form>
    </div>
  );
}
