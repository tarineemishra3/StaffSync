import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * Wraps a route and redirects unauthenticated users to /login.
 * If `roles` is provided, also checks role authorization.
 */
export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }} />
          <div className="text-muted">Loading StaffSync…</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    // Redirect to role's home dashboard
    const homeMap = { employee: '/dashboard', manager: '/manager', hr: '/hr' };
    return <Navigate to={homeMap[user.role] || '/dashboard'} replace />;
  }

  return children;
}
