import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import ThemeToggle from './ThemeToggle.jsx';

const NAV_ITEMS = [
  { to: '/', label: 'Statistika', end: true },
  { to: '/users', label: 'Foydalanuvchilar' },
  { to: '/jobs', label: 'Buyurtmalar' },
  { to: '/professions', label: 'Kasblar' },
  { to: '/promo-banners', label: 'Reklama' },
  { to: '/reports', label: 'Shikoyatlar' },
  { to: '/telegram', label: 'Telegram bot' },
  { to: '/wallet', label: 'Hamyon' },
  { to: '/landing', label: 'Landing sahifa' },
  { to: '/settings', label: 'Sozlamalar' },
];

export default function Layout() {
  const { logout } = useAuth();

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-title">
          <img className="topbar-badge" src={`${import.meta.env.BASE_URL}logo.png`} alt="" />
          Ishchi — Admin
        </div>
        <div className="topbar-actions">
          <ThemeToggle />
          <button className="logout-btn" onClick={logout}>Chiqish</button>
        </div>
      </header>
      <div className="layout-body">
        <nav className="sidebar">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <main className="content">
          <Outlet />
        </main>
      </div>
      <nav className="bottom-nav">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
