import { Navigate } from 'react-router-dom';
import { useAuth } from '@context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // // Redirect to first allowed page based on role
    // const redirectMap = {
    //   operator: '/measurement',
    //   supervisor: '/add-product',
    //   admin: '/manager-user',
    // };
    // return <Navigate to={redirectMap[user.role] || '/'} replace />;
    return <Navigate to="/measurement" replace />;
  }

  return children;
}
