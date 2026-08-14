import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function RoleRoute({ children, allowedRole }) {
  const { user, token } = useContext(AuthContext);

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // Check role authorization
  if (user.role !== allowedRole) {
    console.warn(`Unauthorized access attempt. Role "${user.role}" tried to access a page restricted to "${allowedRole}". Redirecting to dashboard.`);
    
    // Redirect to correct dashboard
    if (user.role === 'Admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (user.role === 'Doctor') {
      // If first login is still true, ProtectedRoute will intercept and redirect to change password
      return <Navigate to="/doctor/dashboard" replace />;
    } else if (user.role === 'User') {
      return <Navigate to="/user/dashboard" replace />;
    }
  }

  return children;
}
