import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

const LoadingScreen = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
  </div>
);

export default function ProtectedRoute({ fallback = <LoadingScreen /> }) {
  const { user, loading } = useAuth();

  if (loading) return fallback;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}
