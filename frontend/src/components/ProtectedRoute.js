import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children, requireAdmin = false, allowedRoles = null }) {
  const { user, loading, hasRole } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    // Redirect to login page, but save the current location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Compute effective allowed roles: use allowedRoles if provided, or ['admin'] if requireAdmin is true
  const effectiveRoles = allowedRoles || (requireAdmin ? ['admin'] : null);

  if (effectiveRoles && !hasRole(effectiveRoles)) {
    // User doesn't have required role, redirect to home
    return <Navigate to="/" replace />;
  }

  return children;
}
