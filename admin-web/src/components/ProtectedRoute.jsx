import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

export default function ProtectedRoute({ children }) {
  const { status } = useAuth();

  if (status === 'unknown') {
    return <div style={{ padding: 40, textAlign: 'center' }}>Yuklanmoqda...</div>;
  }
  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace />;
  }
  return children;
}
