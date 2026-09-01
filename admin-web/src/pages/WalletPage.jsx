import { useState } from 'react';
import { api, ApiError } from '../api/client.js';
import { useAppSettings } from '../settings/AppSettingsContext.jsx';

export default function WalletPage() {
  return (
    <div>
      <h1>Hamyon</h1>
      <WalletFeatureToggle />
      <PaidServicesSettingsCard />
    </div>
  );
}

function WalletFeatureToggle() {
  const { settings, refresh } = useAppSettings();
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (!settings) return;
    setBusy(true);
    setError(null);
    try {
      await api.patch('/api/admin/settings', { walletEnabled: !settings.walletEnabled });
      await refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Amalni bajarib bo'lmadi");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card" style={{ marginTop: 24 }}>
      <h3 style={{ margin: '0 0 4px' }}>Mobil ilova funksiyalari</h3>
      <p style={{ margin: '0 0 16px', color: 'var(--text-secondary)', fontSize: 13 }}>
        Bu yerdagi sozlama darhol mobil ilovaga ta'sir qiladi — yangi versiya chiqarish shart emas.
      </p>
      {error && <div className="error-text">{error}</div>}
      {!settings && !error && <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Yuklanmoqda...</p>}
      {settings && (
        <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: busy ? 'default' : 'pointer' }}>
          <input type="checkbox" checked={settings.walletEnabled} disabled={busy} onChange={toggle} style={{ width: 18, height: 18 }} />
          <span>
            <strong>Hamyon (wallet) funksiyasi</strong>
            <br />
            <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
              {settings.walletEnabled
                ? 'Faol — foydalanuvchilar profilida hamyon ko\'rinadi'
                : "O'chirilgan — profilda hamyon yashirilgan (platforma hozircha tekin)"}
            </span>
          </span>
        </label>
      )}
    </div>
  );
}

function PaidServicesSettingsCard() {
  const { settings, refresh, walletEnabled } = useAppSettings();
  const [postingEnabled, setPostingEnabled] = useState(false);
  const [postingFee, setPostingFee] = useState('0');
  const [viewEnabled, setViewEnabled] = useState(false);
  const [viewFee, setViewFee] = useState('0');
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [busy, setBusy] = useState(false);

  if (settings && !initialized) {
    setPostingEnabled(settings.jobPostingFeeEnabled ?? false);
    setPostingFee(String(settings.jobPostingFee ?? 0));
    setViewEnabled(settings.jobViewFeeEnabled ?? false);
    setViewFee(String(settings.jobViewFee ?? 0));
    setInitialized(true);
  }

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      await api.patch('/api/admin/settings', {
        jobPostingFeeEnabled: postingEnabled,
        jobPostingFee: Number(postingFee) || 0,
        jobViewFeeEnabled: viewEnabled,
        jobViewFee: Number(viewFee) || 0,
      });
      await refresh();
      setSuccess('Saqlandi — mobil ilovada darhol kuchga kiradi');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Saqlab bo'lmadi");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card" style={{ marginTop: 24 }}>
      <h3 style={{ margin: '0 0 4px' }}>Pullik xizmatlar</h3>
      <p style={{ margin: '0 0 16px', color: 'var(--text-secondary)', fontSize: 13 }}>
        Har bir xizmatning narxi va yoqilgan/o'chirilganligi mustaqil sozlanadi.
        {!walletEnabled && (
          <>
            {' '}
            <strong style={{ color: 'var(--danger, #dc2626)' }}>
              Diqqat: "Hamyon" funksiyasi hozir o'chirilgan — yuqoridagi bo'limdan yoqmaguningizcha, bu yerdagi sozlamalar amalda ishlamaydi.
            </strong>
          </>
        )}
      </p>
      {!settings && <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Yuklanmoqda...</p>}
      {settings && (
        <form onSubmit={save}>
          <div className="field field-checkbox">
            <input type="checkbox" id="posting-fee-enabled" checked={postingEnabled} onChange={(e) => setPostingEnabled(e.target.checked)} />
            <label htmlFor="posting-fee-enabled" style={{ margin: 0 }}>Buyurtma joylashtirish pullik</label>
          </div>
          <div className="field">
            <label>Buyurtma joylashtirish narxi (so'm)</label>
            <input type="number" min="0" value={postingFee} onChange={(e) => setPostingFee(e.target.value)} disabled={!postingEnabled} />
          </div>
          <div className="field field-checkbox" style={{ marginTop: 18 }}>
            <input type="checkbox" id="view-fee-enabled" checked={viewEnabled} onChange={(e) => setViewEnabled(e.target.checked)} />
            <label htmlFor="view-fee-enabled" style={{ margin: 0 }}>Buyurtmani ochish (kontakt ko'rish) pullik</label>
          </div>
          <div className="field">
            <label>Buyurtmani ochish narxi (so'm)</label>
            <input type="number" min="0" value={viewFee} onChange={(e) => setViewFee(e.target.value)} disabled={!viewEnabled} />
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
