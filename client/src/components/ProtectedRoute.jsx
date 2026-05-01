import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getDashboardRoute } from '../utils/getDashboardRoute';

export default function ProtectedRoute({
  allowedRole,
  requireOwner = false,
  allowUnapprovedCoach = false,
  children,
}) {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="glass-panel px-6 py-4 text-slate-100">Restoring your session...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (requireOwner && !user.isOwner) {
    return <Navigate to={getDashboardRoute(user)} replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to={getDashboardRoute(user)} replace />;
  }

  if (
    allowedRole === 'coach' &&
    !allowUnapprovedCoach &&
    !user.isOwner &&
    user.coachApprovalStatus !== 'approved'
  ) {
    return <Navigate to="/coach/pending" replace />;
  }

  return children;
}
