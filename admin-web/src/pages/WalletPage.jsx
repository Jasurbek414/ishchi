import { useCallback, useEffect, useState } from 'react';
import { api, ApiError } from '../api/client.js';
import { useAppSettings } from '../settings/AppSettingsContext.jsx';

const TX_TYPE_LABELS = {
  TOPUP: "To'ldirish",
  WITHDRAWAL: 'Yechish',
  ADMIN_CREDIT: 'Admin qo\'shdi',
  ADMIN_DEBIT: 'Admin ayirdi',
  BONUS: 'Bonus',
  PREMIUM_PAYMENT: "Premium to'lov",
  JOB_POSTING_FEE: 'Buyurtma joylashtirish',
  JOB_VIEW_FEE: 'Buyurtma ochish',
};

export default function WalletPage() {
  return (
    <div>
      <h1>Hamyon</h1>
      <WalletFeatureToggle />
      <PaidServicesSettingsCard />
      <TransactionsLedgerCard />
    </div>
  );
}

function TransactionsLedgerCard() {
  const [type, setType] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput.trim()); setPage(0); }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const load = useCallback(() => {
    setError(null);
    api.get('/api/admin/wallets/transactions', { type: type || undefined, search: search || undefined, page, size: 20, sort: 'createdAt,desc' })
      .then(setData)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Yuklab bo'lmadi"));
  }, [type, search, page]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="card mt-6">
      <h3 className="mt-0 mx-0 mb-1">Tranzaksiyalar tarixi</h3>
      <p className="mt-0 mx-0 mb-4 text-text-secondary text-[13px]">
        Barcha foydalanuvchilarning hamyon harakatlari — to'ldirish, yechish, admin tuzatishlari va pullik xizmatlar uchun yechimlar.
      </p>

      <div className="toolbar">
        <input
          type="text"
          className="input min-w-[200px]"
          placeholder="Ism yoki telefon bo'yicha qidirish..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <select className="select" value={type} onChange={(e) => { setType(e.target.value); setPage(0); }}>
          <option value="">Barcha turlar</option>
          {Object.entries(TX_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        {data && <span className="text-[12.5px] text-text-secondary ml-auto self-center">{data.totalElements.toLocaleString('uz-UZ')} ta tranzaksiya</span>}
      </div>

      {error && <div className="error-text">{error}</div>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Sana</th>
              <th>Foydalanuvchi</th>
              <th>Turi</th>
              <th>Summa</th>
              <th>Balans</th>
              <th>Izoh</th>
            </tr>
          </thead>
          <tbody>
            {data?.content.map((tx) => (
              <tr key={tx.id}>
                <td>{new Date(tx.createdAt).toLocaleString('uz-UZ')}</td>
                <td>
                  <div>{tx.userFullName || '—'}</div>
                  <div className="text-text-secondary text-[12px]">{tx.userPhone}</div>
                </td>
                <td>{TX_TYPE_LABELS[tx.type] || tx.type}</td>
                <td className={tx.amount < 0 ? 'text-danger' : 'text-success'}>
                  {tx.amount > 0 ? '+' : ''}{Number(tx.amount).toLocaleString('uz-UZ')}
                </td>
                <td>{Number(tx.balanceAfter).toLocaleString('uz-UZ')}</td>
                <td className="whitespace-normal">{tx.note || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {data && data.content.length === 0 && <div className="empty-state">Tranzaksiyalar topilmadi</div>}
      </div>

      {data && data.totalPages > 1 && (
        <div className="pagination">
          <button className="btn btn-outline" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Oldingi</button>
          <span className="self-center text-[13px]">{page + 1} / {data.totalPages}</span>
          <button className="btn btn-outline" disabled={data.last} onClick={() => setPage((p) => p + 1)}>Keyingi</button>
        </div>
      )}
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
    <div className="card mt-6">
      <h3 className="mt-0 mx-0 mb-1">Mobil ilova funksiyalari</h3>
      <p className="mt-0 mx-0 mb-4 text-text-secondary text-[13px]">
        Bu yerdagi sozlama darhol mobil ilovaga ta'sir qiladi — yangi versiya chiqarish shart emas.
      </p>
      {error && <div className="error-text">{error}</div>}
      {!settings && !error && <p className="text-[13px] text-text-secondary">Yuklanmoqda...</p>}
      {settings && (
        <label className={`flex items-center gap-3 ${busy ? 'cursor-default' : 'cursor-pointer'}`}>
          <input type="checkbox" checked={settings.walletEnabled} disabled={busy} onChange={toggle} className="w-[18px] h-[18px]" />
          <span>
            <strong>Hamyon (wallet) funksiyasi</strong>
            <br />
            <span className="text-[12.5px] text-text-secondary">
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
    <div className="card mt-6">
      <h3 className="mt-0 mx-0 mb-1">Pullik xizmatlar</h3>
      <p className="mt-0 mx-0 mb-4 text-text-secondary text-[13px]">
        Har bir xizmatning narxi va yoqilgan/o'chirilganligi mustaqil sozlanadi.
        {!walletEnabled && (
          <>
            {' '}
            <strong className="text-danger">
              Diqqat: "Hamyon" funksiyasi hozir o'chirilgan — yuqoridagi bo'limdan yoqmaguningizcha, bu yerdagi sozlamalar amalda ishlamaydi.
            </strong>
          </>
        )}
      </p>
      {!settings && <p className="text-[13px] text-text-secondary">Yuklanmoqda...</p>}
      {settings && (
        <form onSubmit={save}>
          <div className="field field-checkbox">
            <input type="checkbox" id="posting-fee-enabled" checked={postingEnabled} onChange={(e) => setPostingEnabled(e.target.checked)} />
            <label htmlFor="posting-fee-enabled" className="m-0">Buyurtma joylashtirish pullik</label>
          </div>
          <div className="field">
            <label>Buyurtma joylashtirish narxi (so'm)</label>
            <input type="number" min="0" value={postingFee} onChange={(e) => setPostingFee(e.target.value)} disabled={!postingEnabled} />
          </div>
          <div className="field field-checkbox mt-[18px]">
            <input type="checkbox" id="view-fee-enabled" checked={viewEnabled} onChange={(e) => setViewEnabled(e.target.checked)} />
            <label htmlFor="view-fee-enabled" className="m-0">Buyurtmani ochish (kontakt ko'rish) pullik</label>
          </div>
          <div className="field">
            <label>Buyurtmani ochish narxi (so'm)</label>
            <input type="number" min="0" value={viewFee} onChange={(e) => setViewFee(e.target.value)} disabled={!viewEnabled} />
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
