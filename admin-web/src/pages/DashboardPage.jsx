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

/** Where each stat card should take the admin when clicked — optional pre-filter passed
 *  as router state, read once on mount by the target page. */
const LABEL_LINKS = {
  totalUsers: { to: '/users' },
  totalWorkers: { to: '/users', state: { role: 'WORKER' } },
  totalEmployers: { to: '/users', state: { role: 'EMPLOYER' } },
  activeJobs: { to: '/jobs', state: { status: 'ACTIVE' } },
  newUsersToday: { to: '/users' },
  newJobsToday: { to: '/jobs' },
  blockedUsers: { to: '/users', state: { status: 'blocked' } },
  telegramLinkedUsers: { to: '/telegram' },
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
            {Object.entries(LABELS).map(([key, label]) => {
              const link = LABEL_LINKS[key];
              return (
                <div
                  key={key}
                  className={link ? 'stat-card cursor-pointer' : 'stat-card'}
                  onClick={link ? () => navigate(link.to, { state: link.state }) : undefined}
                  title={link ? `${link.to.slice(1)} bo'limiga o'tish` : undefined}
                >
                  <div className="stat-value">{stats[key]}</div>
                  <div className="stat-label">{label}</div>
                </div>
              );
            })}
            <div
              className={`stat-card cursor-pointer ${stats.pendingFeedback > 0 ? 'outline outline-2 outline-danger' : ''}`}
              onClick={() => navigate('/telegram')}
              title="Telegram bo'limiga o'tish"
            >
              <div className={`stat-value ${stats.pendingFeedback > 0 ? 'text-danger' : ''}`}>
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

          <div className="card mt-6">
            <h3 className="mt-0 mx-0 mb-4">Buyurtmalar holati bo'yicha taqsimot</h3>
            <div className="flex flex-col gap-3">
              {JOB_STATUS_ORDER.map((status) => {
                const count = stats.jobsByStatus?.[status] ?? 0;
                const pct = Math.round((count / maxJobsByStatus) * 100);
                return (
                  <div key={status}>
                    <div className="flex justify-between text-[13px] mb-1">
                      <span>{JOB_STATUS_LABELS[status] || status}</span>
                      <strong>{count}</strong>
                    </div>
                    <div className="bg-line rounded-md h-2 overflow-hidden">
                      <div className="bg-primary h-full rounded-md" style={{ width: `${pct}%` }} />
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
