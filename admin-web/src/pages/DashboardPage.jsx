import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, ApiError } from '../api/client.js';
import { useAppSettings } from '../settings/AppSettingsContext.jsx';

const LABELS = {
  totalUsers: 'Jami foydalanuvchilar',
  totalWorkers: 'Ishchilar',
  totalEmployers: 'Ish beruvchilar',
  activeJobs: 'Faol buyurtmalar',
  newUsersToday: 'Bugungi yangi foydalanuvchilar',
  newJobsToday: 'Bugungi yangi buyurtmalar',
  blockedUsers: 'Bloklangan foydalanuvchilar',
  telegramLinkedUsers: 'Telegram botga ulangan',
};

const JOB_STATUS_LABELS = {
  ACTIVE: 'Faol',
  IN_PROGRESS: 'Jarayonda',
  COMPLETED: 'Yakunlangan',
  CANCELLED: 'Bekor qilingan',
  EXPIRED: 'Muddati tugagan',
};

const JOB_STATUS_ORDER = ['ACTIVE', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'EXPIRED'];

export default function DashboardPage() {
  const { walletEnabled } = useAppSettings();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/api/admin/stats')
      .then(setStats)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Statistikani yuklab bo'lmadi"));
  }, []);

  const maxJobsByStatus = stats ? Math.max(1, ...Object.values(stats.jobsByStatus || {})) : 1;

  return (
    <div>
      <h1>Statistika</h1>
      {error && <div className="error-text">{error}</div>}
      {!stats && !error && <p>Yuklanmoqda...</p>}
      {stats && (
        <>
          <div className="stat-grid">
            {Object.entries(LABELS).map(([key, label]) => (
              <div key={key} className="stat-card">
                <div className="stat-value">{stats[key]}</div>
                <div className="stat-label">{label}</div>
              </div>
            ))}
            <div
              className="stat-card"
              style={{ cursor: 'pointer', outline: stats.pendingFeedback > 0 ? '2px solid var(--danger, #dc2626)' : 'none' }}
              onClick={() => navigate('/telegram')}
              title="Telegram bo'limiga o'tish"
            >
              <div className="stat-value" style={{ color: stats.pendingFeedback > 0 ? 'var(--danger, #dc2626)' : undefined }}>
                {stats.pendingFeedback}
              </div>
              <div className="stat-label">Yangi fikr-mulohazalar</div>
            </div>
            {walletEnabled && (
              <div className="stat-card">
                <div className="stat-value">{Number(stats.walletTotalBalance || 0).toLocaleString('uz-UZ')}</div>
                <div className="stat-label">Hamyonlardagi umumiy summa (so'm)</div>
              </div>
            )}
          </div>

          <div className="card" style={{ marginTop: 24 }}>
            <h3 style={{ margin: '0 0 16px' }}>Buyurtmalar holati bo'yicha taqsimot</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {JOB_STATUS_ORDER.map((status) => {
                const count = stats.jobsByStatus?.[status] ?? 0;
                const pct = Math.round((count / maxJobsByStatus) * 100);
                return (
                  <div key={status}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                      <span>{JOB_STATUS_LABELS[status] || status}</span>
                      <strong>{count}</strong>
                    </div>
                    <div style={{ background: 'var(--border)', borderRadius: 6, height: 8, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, background: 'var(--primary)', height: '100%', borderRadius: 6 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
