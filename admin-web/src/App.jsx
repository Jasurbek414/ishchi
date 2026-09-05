import { HashRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext.jsx';
import { AppSettingsProvider } from './settings/AppSettingsContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Layout from './components/Layout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import UsersPage from './pages/UsersPage.jsx';
import JobsPage from './pages/JobsPage.jsx';
import ProfessionsPage from './pages/ProfessionsPage.jsx';
import PromoBannersPage from './pages/PromoBannersPage.jsx';
import TelegramPage from './pages/TelegramPage.jsx';
import WalletPage from './pages/WalletPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import LandingPage from './pages/LandingPage.jsx';

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppSettingsProvider>
                  <Layout />
                </AppSettingsProvider>
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="jobs" element={<JobsPage />} />
            <Route path="professions" element={<ProfessionsPage />} />
            <Route path="promo-banners" element={<PromoBannersPage />} />
            <Route path="telegram" element={<TelegramPage />} />
            <Route path="wallet" element={<WalletPage />} />
            <Route path="landing" element={<LandingPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}
