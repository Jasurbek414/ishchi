import { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { api, ApiError } from '../api/client.js';

const STATUS_LABELS = {
  ACTIVE: 'Faol',
  IN_PROGRESS: 'Jarayonda',
  COMPLETED: 'Yakunlangan',
  CANCELLED: 'Bekor qilingan',
  EXPIRED: 'Muddati tugagan',
};

const PAYMENT_TYPE_LABELS = { FIXED: "Belgilangan narx", DAILY_RATE: 'Kunlik' };
const JOB_TYPE_LABELS = { DAILY: 'Bir kunlik', TEMPORARY: 'Vaqtinchalik', PERMANENT: 'Doimiy' };
const DURATION_UNIT_LABELS = { DAY: 'kun', WEEK: 'hafta', MONTH: 'oy' };

function formatPayment(job) {
  const amount = Number(job.payment).toLocaleString('uz-UZ');
  return job.paymentType === 'DAILY_RATE' ? `${amount} so'm/kun` : `${amount} so'm`;
}

export default function JobsPage() {
  const location = useLocation();
  // Dashboard stat cards link here with an optional pre-filter in router state.
  const [status, setStatus] = useState(location.state?.status || '');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [detailJob, setDetailJob] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput.trim()); setPage(0); }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const load = useCallback(() => {
    setError(null);
    api.get('/api/admin/jobs', { status: status || undefined, search: search || undefined, page, size: 20, sort: 'id,desc' })
      .then(setData)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Yuklab bo'lmadi"));
  }, [status, search, page]);

  useEffect(() => { load(); }, [load]);

  async function toggleBlocked(job) {
    setBusyId(job.id);
    try {
      await api.patch(`/api/admin/jobs/${job.id}/blocked`, { blocked: !job.blocked });
      load();
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "Amalni bajarib bo'lmadi");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(job) {
    if (!confirm(`"${job.title}" buyurtmasini butunlay o'chirmoqchimisiz?`)) return;
    setBusyId(job.id);
    try {
      await api.del(`/api/admin/jobs/${job.id}`);
      load();
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "O'chirib bo'lmadi");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <h1>Buyurtmalar</h1>

      <div className="toolbar">
        <input
          type="text"
          className="input min-w-[220px]"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Sarlavha, ish beruvchi yoki telefon bo'yicha qidirish..."
        />
        <select className="select" value={status} onChange={(e) => { setStatus(e.target.value); setPage(0); }}>
          <option value="">Barcha holatlar</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {error && <div className="error-text">{error}</div>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Buyurtma</th>
              <th>Narx</th>
              <th>Ish beruvchi</th>
              <th>Holat</th>
              <th>Amallar</th>
            </tr>
          </thead>
          <tbody>
            {data?.content.map((j) => (
              <tr key={j.id}>
                <td>{j.id}</td>
                <td>
                  <div className="whitespace-normal">{j.title}</div>
                  <div className="text-text-secondary text-[12px]">
                    {j.professionName} · {j.regionName}, {j.districtName}
                  </div>
                </td>
                <td>{formatPayment(j)}</td>
                <td>{j.employerName}<br /><span className="text-text-secondary text-[12px]">{j.employerPhone}</span></td>
                <td>
                  <div className="flex gap-1.5 flex-wrap">
                    <span className="badge badge-neutral">{STATUS_LABELS[j.status] || j.status}</span>
                    {j.blocked && <span className="badge badge-danger">Bloklangan</span>}
                  </div>
                </td>
                <td className="flex gap-2 flex-wrap">
                  <button className="btn btn-outline" onClick={() => setDetailJob(j)}>Batafsil</button>
                  <button
                    className={j.blocked ? 'btn btn-primary' : 'btn btn-outline-danger'}
                    disabled={busyId === j.id}
                    onClick={() => toggleBlocked(j)}
                  >
                    {j.blocked ? 'Blokdan chiqarish' : 'Bloklash'}
                  </button>
                  <button className="btn btn-outline-danger" disabled={busyId === j.id} onClick={() => remove(j)}>
                    O'chirish
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data && data.content.length === 0 && <div className="empty-state">Buyurtmalar topilmadi</div>}
      </div>

      {data && data.totalPages > 1 && (
        <div className="pagination">
          <button className="btn btn-outline" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Oldingi</button>
          <span className="self-center text-[13px]">{page + 1} / {data.totalPages}</span>
          <button className="btn btn-outline" disabled={data.last} onClick={() => setPage((p) => p + 1)}>Keyingi</button>
        </div>
      )}

      {detailJob && (
        <JobDetailModal job={detailJob} onClose={() => setDetailJob(null)} />
      )}
    </div>
  );
}

function JobDetailModal({ job, onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal max-w-[600px] max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h3>{job.title}</h3>
        <div className="flex flex-col gap-3 text-[14px]">
          <DetailRow label="Tavsif" value={job.description} />
          <DetailRow label="Kasb" value={job.professionName} />
          <DetailRow label="Hudud" value={`${job.regionName}, ${job.districtName}`} />
          <DetailRow label="To'lov" value={formatPayment(job)} />
          <DetailRow label="Ish turi" value={JOB_TYPE_LABELS[job.jobType] || job.jobType} />
          <DetailRow label="Kerakli ishchilar soni" value={job.workersNeeded} />
          <DetailRow label="Boshlanish sanasi" value={job.startDate || "Ko'rsatilmagan"} />
          <DetailRow
            label="Davomiyligi"
            value={job.durationValue ? `${job.durationValue} ${DURATION_UNIT_LABELS[job.durationUnit] || job.durationUnit}` : "Ko'rsatilmagan"}
          />
          <DetailRow label="Ish beruvchi" value={`${job.employerName} — ${job.employerPhone}`} />
          <DetailRow label="Holat" value={STATUS_LABELS[job.status] || job.status} />
          <DetailRow label="Bloklangan" value={job.blocked ? 'Ha' : "Yo'q"} />
          <DetailRow label="Yaratilgan" value={new Date(job.createdAt).toLocaleString('uz-UZ')} />
          {job.expiresAt && <DetailRow label="Muddati tugaydi" value={new Date(job.expiresAt).toLocaleString('uz-UZ')} />}
          {job.latitude != null && job.longitude != null && (
            <DetailRow label="Manzil (koordinata)" value={`${job.latitude}, ${job.longitude}`} />
          )}
          {job.images?.length > 0 && (
            <div>
              <span className="text-text-secondary text-[12px]">Rasmlar</span>
              <div className="flex gap-2 flex-wrap mt-1.5">
                {job.images.map((url) => (
                  <img key={url} src={url} alt="" className="w-[90px] h-[90px] object-cover rounded-lg" />
                ))}
              </div>
            </div>
          )}
        </div>
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
