import { useCallback, useEffect, useState } from 'react';
import { api, ApiError } from '../api/client.js';
import Modal from '../components/Modal.jsx';
import { useToast } from '../components/Toast.jsx';

const REASON_LABELS = {
  FAKE_JOB: "Yolg'on e'lon",
  SCAM: 'Firibgarlik',
  NOT_PAID: "To'lov qilinmadi",
  ABUSE: "Qo'pol munosabat",
  WRONG_CONTACT: "Kontakt noto'g'ri",
  OTHER: 'Boshqa',
};

/**
 * The moderation queue. Nothing like it existed: reports had nowhere to arrive, so the only way a
 * fake posting got taken down was an admin happening to scroll past it.
 */
export default function ReportsPage() {
  const toast = useToast();
  const [resolved, setResolved] = useState(false);
  const [page, setPage] = useState(0);
  const [data, setData] = useState({ content: [], totalPages: 0, totalElements: 0 });
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await api.get('/api/admin/reports', { resolved, page, size: 20 }));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Ro'yxatni yuklab bo'lmadi");
    } finally {
      setLoading(false);
    }
  }, [resolved, page, toast]);

  useEffect(() => { load(); }, [load]);

  const target = (report) =>
    report.jobId ? `Buyurtma: ${report.jobTitle ?? `#${report.jobId}`}` : `Foydalanuvchi: ${report.reportedUserPhone}`;

  return (
    <>
      <h1>Shikoyatlar</h1>

      <div className="toolbar">
        <select
          className="select"
          value={String(resolved)}
          onChange={(e) => { setResolved(e.target.value === 'true'); setPage(0); }}
          aria-label="Holat bo'yicha filtr"
        >
          <option value="false">Ko'rilmagan</option>
          <option value="true">Hal qilingan</option>
        </select>
        <span className="text-text-secondary text-[13px]">Jami: {data.totalElements}</span>
      </div>

      {loading ? (
        <div className="empty-state">Yuklanmoqda...</div>
      ) : data.content.length === 0 ? (
        <div className="empty-state">
          {resolved ? 'Hal qilingan shikoyat yo‘q' : 'Ko‘rilmagan shikoyat yo‘q — yaxshi belgi'}
        </div>
      ) : (
        <div className="table-wrap cards">
          <table>
            <thead>
              <tr>
                <th>Sabab</th>
                <th>Nima haqida</th>
                <th>Kim yozgan</th>
                <th>Izoh</th>
                <th>Sana</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.content.map((report) => (
                <tr key={report.id}>
                  <td data-label="Sabab">
                    <span className="badge badge-danger">{REASON_LABELS[report.reason] ?? report.reason}</span>
                  </td>
                  <td data-label="Nima haqida">{target(report)}</td>
                  <td data-label="Kim yozgan">{report.reporterPhone}</td>
                  <td data-label="Izoh" className="max-w-[280px] truncate" title={report.details ?? ''}>
                    {report.details || '—'}
                  </td>
                  <td data-label="Sana">{new Date(report.createdAt).toLocaleDateString('uz-UZ')}</td>
                  <td>
                    <button className="btn btn-outline" onClick={() => setActive(report)}>
                      {report.resolved ? 'Ko‘rish' : 'Hal qilish'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data.totalPages > 1 && (
        <div className="pagination">
          <button className="btn btn-outline" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
            Oldingi
          </button>
          <span className="text-text-secondary text-[13px] self-center">{page + 1} / {data.totalPages}</span>
          <button
            className="btn btn-outline"
            disabled={page + 1 >= data.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Keyingi
          </button>
        </div>
      )}

      {active && (
        <ResolveModal
          report={active}
          onClose={() => setActive(null)}
          onDone={() => { setActive(null); load(); }}
        />
      )}
    </>
  );
}

function ResolveModal({ report, onClose, onDone }) {
  const toast = useToast();
  const [note, setNote] = useState(report.resolutionNote ?? '');
  const [busy, setBusy] = useState(false);

  const setResolved = async (resolved) => {
    setBusy(true);
    try {
      await api.patch(`/api/admin/reports/${report.id}/resolved?resolved=${resolved}`
        + (note.trim() ? `&note=${encodeURIComponent(note.trim())}` : ''));
      toast.success(resolved ? 'Hal qilingan deb belgilandi' : 'Qaytadan ochildi');
      onDone();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Saqlab bo‘lmadi');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Shikoyat" onClose={onClose}>
      <dl className="text-[13.5px] m-0 mb-4 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5">
        <dt className="text-text-secondary">Sabab</dt>
        <dd className="m-0 font-semibold">{REASON_LABELS[report.reason] ?? report.reason}</dd>
        <dt className="text-text-secondary">Nima haqida</dt>
        <dd className="m-0">
          {report.jobId ? (report.jobTitle ?? `Buyurtma #${report.jobId}`) : report.reportedUserPhone}
        </dd>
        <dt className="text-text-secondary">Kim yozgan</dt>
        <dd className="m-0">{report.reporterPhone}</dd>
        <dt className="text-text-secondary">Sana</dt>
        <dd className="m-0">{new Date(report.createdAt).toLocaleString('uz-UZ')}</dd>
      </dl>

      {report.details && (
        <p className="bg-bg border border-line rounded-xl p-3 text-[13.5px] whitespace-pre-wrap mt-0 mb-4">
          {report.details}
        </p>
      )}

      <div className="field">
        <label htmlFor="resolution-note">Qaror izohi</label>
        <textarea
          id="resolution-note"
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Masalan: e'lon o'chirildi, foydalanuvchi bloklandi"
        />
      </div>

      <div className="modal-actions">
        <button type="button" className="btn btn-outline" onClick={onClose}>Yopish</button>
        {report.resolved ? (
          <button type="button" className="btn btn-outline-danger" disabled={busy} onClick={() => setResolved(false)}>
            Qaytadan ochish
          </button>
        ) : (
          <button type="button" className="btn btn-primary" disabled={busy} onClick={() => setResolved(true)}>
            Hal qilindi
          </button>
        )}
      </div>
    </Modal>
  );
}
