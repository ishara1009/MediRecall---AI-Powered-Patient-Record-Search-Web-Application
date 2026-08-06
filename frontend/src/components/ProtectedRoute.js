import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, token, loading } = useContext(AuthContext);
  const location = useLocation();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '80vh',
        color: 'var(--text-main)'
      }}>
        <div className="loading-spinner">Loading session...</div>
      </div>
    );
  }

  // Redirect to Login if not validated
  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Redirect first-login Doctors to change password view
  if (
    user.role === 'Doctor' &&
    user.isFirstLogin &&
    location.pathname !== '/doctor/change-password'
  ) {
    return <Navigate to="/doctor/change-password" replace />;
  }

  return children;
}
