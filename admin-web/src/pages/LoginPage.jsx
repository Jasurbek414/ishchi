import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

export default function LoginPage() {
  const { status, login } = useAuth();
  const navigate = useNavigate();
  const [phone, setPhone] = useState('+998');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  if (status === 'authenticated') {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(phone.trim(), password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Kirishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={handleSubmit}>
        <img className="login-logo" src={`${import.meta.env.BASE_URL}logo.png`} alt="Ishchi" />
        <h1 className="text-center mb-1">Admin panel</h1>
        <p className="text-center text-text-secondary mt-0 mb-6 text-[13.5px]">
          Administrator hisobingiz bilan kiring
        </p>

        <div className="field">
          <label>Telefon raqam</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+998901234567"
            autoComplete="tel"
            required
          />
        </div>
        <div className="field">
          <label>Parol</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>

        {error && <div className="error-text">{error}</div>}

        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          {loading ? 'Kirilmoqda...' : 'Kirish'}
        </button>
      </form>
    </div>
  );
}
