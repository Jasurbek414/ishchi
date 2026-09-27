import { useCallback, useEffect, useState } from 'react';
import { api, ApiError } from '../api/client.js';
import { useAppSettings } from '../settings/AppSettingsContext.jsx';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast.jsx';

export default function TelegramPage() {
  const toast = useToast();
  return (
    <div>
      <h1>Telegram bot</h1>
      <TelegramBotSettingsCard />
      <FeedbackCard />
      <TelegramBroadcastCard />
    </div>
  );
}

function FeedbackCard() {
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(0);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [replyTarget, setReplyTarget] = useState(null);

  const load = useCallback(() => {
    setError(null);
    api.get('/api/admin/telegram/feedback', { resolved: filter || undefined, page, size: 10, sort: 'id,desc' })
      .then(setData)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Yuklab bo'lmadi"));
  }, [filter, page]);

  useEffect(() => { load(); }, [load]);

  async function toggleResolved(item) {
    try {
      await api.patch(`/api/admin/telegram/feedback/${item.id}/resolved`, { resolved: !item.resolved });
      load();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Amalni bajarib bo'lmadi");
    }
  }

  return (
    <div className="card mt-6">
      <h3 className="mt-0 mx-0 mb-1">Fikr-mulohazalar va muammolar</h3>
      <p className="mt-0 mx-0 mb-4 text-text-secondary text-[13px]">
        Foydalanuvchilar botdagi "💬 Fikr-mulohaza / Muammo" tugmasi orqali yozgan xabarlar shu yerda ko'rinadi.
      </p>
      <div className="toolbar mb-3.5">
        <select className="select" value={filter} onChange={(e) => { setFilter(e.target.value); setPage(0); }}>
          <option value="">Barchasi</option>
          <option value="false">Yangi</option>
          <option value="true">Hal qilingan</option>
        </select>
      </div>
      {error && <div className="error-text">{error}</div>}
      {!data && !error && <p className="text-[13px] text-text-secondary">Yuklanmoqda...</p>}
      {data && data.content.length === 0 && <div className="empty-state">Xabarlar topilmadi</div>}
      <div className="flex flex-col gap-3">
        {data?.content.map((f) => (
          <div key={f.id} className="border border-line rounded-xl p-3.5">
            <div className="flex justify-between gap-2.5 mb-2 flex-wrap">
              <div>
                <strong>{f.userName || f.userPhone || `Noma'lum (chat ${f.chatId})`}</strong>
                {f.userPhone && f.userName && (
                  <span className="text-text-secondary text-[12px]"> · {f.userPhone}</span>
                )}
              </div>
              <span className={`badge ${f.resolved ? 'badge-success' : 'badge-danger'}`}>
                {f.resolved ? 'Hal qilingan' : 'Yangi'}
              </span>
            </div>
            <p className="mt-0 mx-0 mb-2 text-[14px] whitespace-pre-wrap">{f.message}</p>
            <div className="text-[12px] text-text-secondary mb-2.5">
              {new Date(f.createdAt).toLocaleString('uz-UZ')}
            </div>
            {f.adminReply && (
              <div className="bg-[rgba(127,127,127,0.08)] rounded-lg p-2.5 mb-2.5 text-[13px]">
                <strong className="text-[12px]">Javob:</strong> {f.adminReply}
              </div>
            )}
            <div className="flex gap-2 flex-wrap">
              <button className="btn btn-outline" onClick={() => setReplyTarget(f)}>Javob yozish</button>
              <button className="btn btn-outline" onClick={() => toggleResolved(f)}>
                {f.resolved ? "Qayta ochish" : "Hal qilindi deb belgilash"}
              </button>
            </div>
          </div>
        ))}
      </div>
      {data && data.totalPages > 1 && (
        <div className="pagination">
          <button className="btn btn-outline" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Oldingi</button>
          <span className="self-center text-[13px]">{page + 1} / {data.totalPages}</span>
          <button className="btn btn-outline" disabled={data.last} onClick={() => setPage((p) => p + 1)}>Keyingi</button>
        </div>
      )}
      {replyTarget && (
        <ReplyModal feedback={replyTarget} onClose={() => setReplyTarget(null)} onSent={() => { setReplyTarget(null); load(); }} />
      )}
    </div>
  );
}

function ReplyModal({ feedback, onClose, onSent }) {
  const [text, setText] = useState('');
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);

  async function send(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    setError(null);
    try {
      await api.post(`/api/admin/telegram/feedback/${feedback.id}/reply`, { text: text.trim() });
      onSent();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Yuborib bo'lmadi");
    } finally {
      setSending(false);
    }
  }

  return (
    <Modal title={<>Javob yozish</>} onClose={onClose}>
      <p className="mt-0 mx-0 mb-3.5 text-text-secondary text-[13px]">{feedback.message}</p>
      <form onSubmit={send}>
        <div className="field">
          <label>Javob matni</label>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} placeholder="Javobingizni yozing..." />
        </div>
        {error && <div className="error-text">{error}</div>}
        <div className="modal-actions">
          <button type="button" className="btn btn-outline" onClick={onClose}>Bekor qilish</button>
          <button type="submit" className="btn btn-primary" disabled={sending || !text.trim()}>
            {sending ? 'Yuborilmoqda...' : 'Yuborish va hal qilingan deb belgilash'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function TelegramBotSettingsCard() {
  const { settings, refresh } = useAppSettings();
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [busy, setBusy] = useState(false);

  async function save(e) {
    e.preventDefault();
    if (!token.trim()) return;
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      await api.patch('/api/admin/settings', { telegramBotToken: token.trim() });
      await refresh();
      setToken('');
      setSuccess('Bot muvaffaqiyatli ulandi');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Bot tokenini saqlab bo'lmadi");
    } finally {
      setBusy(false);
    }
  }

  async function disconnect() {
    if (!window.confirm("Telegram botini uzasizmi? SMS tasdiqlash kodlari qayta test rejimiga (1234) o'tadi.")) return;
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      await api.patch('/api/admin/settings', { telegramBotToken: '' });
      await refresh();
      setSuccess("Bot uzildi");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Amalni bajarib bo'lmadi");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card mt-6">
      <h3 className="mt-0 mx-0 mb-1">Bot ulanishi (SMS tasdiqlash)</h3>
      <p className="mt-0 mx-0 mb-4 text-text-secondary text-[13px]">
        Ro'yxatdan o'tish va parolni tiklashda tasdiqlash kodi shu bot orqali yuboriladi.
        Bog'lanmagan bo'lsa, kod avtomatik "1234" bo'lib qoladi (test rejimi).
      </p>
      {!settings && <p className="text-[13px] text-text-secondary">Yuklanmoqda...</p>}
      {settings && (
        <>
          <p className="text-[13.5px] mb-3.5">
            Holati:{' '}
            {settings.telegramConfigured ? (
              <span className="text-success">
                Ulangan — @{settings.telegramBotUsername}
              </span>
            ) : (
              <span className="text-text-secondary">Ulanmagan (test rejimi)</span>
            )}
          </p>
          <form onSubmit={save}>
            <div className="field">
              <label>Bot tokeni (BotFather'dan olinadi)</label>
              <div className="flex gap-2">
              <input
                type={showToken ? 'text' : 'password'}
                autoComplete="off"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="123456789:AAExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                disabled={busy}
                className="flex-1"
              />
              <button type="button" className="btn btn-outline" onClick={() => setShowToken((v) => !v)}>
                {showToken ? 'Yashirish' : "Ko'rsatish"}
              </button>
              </div>
            </div>
            {error && <div className="error-text">{error}</div>}
            {success && <div className="text-success text-[13px] mb-3.5">{success}</div>}
            <div className="flex gap-2.5">
              <button type="submit" className="btn btn-primary" disabled={busy || !token.trim()}>
                {busy ? 'Saqlanmoqda...' : settings.telegramConfigured ? 'Tokenni almashtirish' : 'Ulash'}
              </button>
              {settings.telegramConfigured && (
                <button type="button" className="btn" onClick={disconnect} disabled={busy}>
                  Uzish
                </button>
              )}
            </div>
          </form>
        </>
      )}
    </div>
  );
}

function TelegramBroadcastCard() {
  const { settings } = useAppSettings();
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
      ? 'HAMMA Telegram botga ulangan foydalanuvchiga'
      : `${role === 'WORKER' ? 'ishchilarga' : 'ish beruvchilarga'}${regionId ? ' (tanlangan hududda)' : ''} (Telegram botga ulanganlarga)`;
    if (!confirm(`Ushbu xabar ${audience} yuboriladi. Buni orqaga qaytarib bo'lmaydi. Davom etasizmi?`)) return;
    setSending(true);
    setError(null);
    setSuccess(null);
    try {
      await api.post('/api/admin/notifications/telegram-broadcast', {
        title: title.trim(),
        body: body.trim(),
        role: role || undefined,
        regionId: role && regionId ? Number(regionId) : undefined,
      });
      setSuccess('Xabar yuborishga navbatga qo\'yildi');
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
      <h3 className="mt-0 mx-0 mb-1">Botga xabar yuborish</h3>
      <p className="mt-0 mx-0 mb-4 text-text-secondary text-[13px]">
        Faqat botga ulangan (raqamini ulashgan) foydalanuvchilarga yuboriladi — ilovani o'rnatmagan bo'lsa ham yetadi.
        {!settings?.telegramConfigured && (
          <>
            {' '}
            <strong className="text-danger">
              Diqqat: Telegram bot hozir ulanmagan (yuqoridagi bo'limdan ulang).
            </strong>
          </>
        )}
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
        <button type="submit" className="btn btn-primary" disabled={sending || !settings?.telegramConfigured}>
          {sending ? 'Yuborilmoqda...' : 'Yuborish'}
        </button>
      </form>
    </div>
  );
}
