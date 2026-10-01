import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import {
  Briefcase,
  Flag,
  LayoutDashboard,
  LayoutTemplate,
  Megaphone,
  Send,
  Settings,
  Tags,
  Users,
  Wallet,
} from 'lucide-react';
import ThemeToggle from './ThemeToggle.jsx';

const NAV_ITEMS = [
  { to: '/', label: 'Statistika', icon: LayoutDashboard, end: true },
  { to: '/users', label: 'Foydalanuvchilar', icon: Users },
  { to: '/jobs', label: 'Buyurtmalar', icon: Briefcase },
  { to: '/professions', label: 'Kasblar', icon: Tags },
  { to: '/promo-banners', label: 'Reklama', icon: Megaphone },
  { to: '/reports', label: 'Shikoyatlar', icon: Flag },
  { to: '/telegram', label: 'Telegram bot', icon: Send },
  { to: '/wallet', label: 'Hamyon', icon: Wallet },
  { to: '/landing', label: 'Landing sahifa', icon: LayoutTemplate },
  { to: '/settings', label: 'Sozlamalar', icon: Settings },
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
              <item.icon size={17} strokeWidth={2.1} />
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
            <item.icon size={18} strokeWidth={2.1} />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
