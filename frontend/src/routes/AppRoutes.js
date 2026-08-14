import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';
import RoleRoute from '../components/RoleRoute';

// Public pages (original)
import Upload from '../pages/Upload/Upload';
import Chat from '../pages/Chat/Chat';
import About from '../pages/About/About';
import Documents from '../pages/Documents/Documents';

// Auth pages
import Login from '../pages/Auth/Login';
import Signup from '../pages/Auth/Signup';
import SetupAdmin from '../pages/Auth/SetupAdmin';
import ForgotPassword from '../pages/Auth/ForgotPassword';
import Profile from '../pages/Auth/Profile';

// Admin pages
import AdminDashboard from '../pages/Admin/AdminDashboard';
import CreateDoctor from '../pages/Admin/CreateDoctor';
import DoctorManagement from '../pages/Admin/DoctorManagement';
import SystemLogs from '../pages/Admin/SystemLogs';

// Doctor pages
import DoctorDashboard from '../pages/Doctor/DoctorDashboard';
import ChangePassword from '../pages/Doctor/ChangePassword';
import PatientRecordSearch from '../pages/Doctor/PatientRecordSearch';
import UserDashboard from '../pages/User/UserDashboard';

export default function AppRoutes() {
  const { adminExists, loading, user, token } = useContext(AuthContext);

  const getUserDashboardPath = () => {
    if (!user) return '/login';

    if (user.role === 'Admin') {
      return '/admin/dashboard';
    }

    if (user.role === 'Doctor') {
      return user.isFirstLogin ? '/doctor/change-password' : '/doctor/dashboard';
    }

    if (user.role === 'User') return '/user/dashboard';

    return '/login';
  };

  // Show nothing while session is being restored
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        color: '#a5b4fc',
        fontFamily: 'Outfit, sans-serif',
        fontSize: '16px',
        background: '#0a0a1a'
      }}>
        Loading MediRecall...
      </div>
    );
  }

  return (
    <Routes>
      {/* ─── Auth Routes ─────────────────────────────────────── */}
      {/* If no admin exists, redirect root to setup; otherwise show login */}
      <Route
        path="/"
        element={
          user && token
            ? <Navigate to={getUserDashboardPath()} replace />
            : adminExists
              ? <Navigate to="/login" replace />
              : <Navigate to="/setup" replace />
        }
      />
      <Route
        path="/login"
        element={
          user && token
            ? <Navigate to={getUserDashboardPath()} replace />
            : <Login />
        }
      />
      <Route
        path="/signup"
        element={user && token ? <Navigate to={getUserDashboardPath()} replace /> : <Signup />}
      />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      {/* Setup admin is only accessible if no admin exists yet */}
      <Route
        path="/setup"
        element={adminExists ? <Navigate to="/login" replace /> : <SetupAdmin />}
      />

      {/* ─── Shared Protected Routes ─────────────────────────── */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/user/profile"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRole="User"><Profile /></RoleRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/user/dashboard"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRole="User"><UserDashboard /></RoleRoute>
          </ProtectedRoute>
        }
      />

      {/* ─── Admin Routes ─────────────────────────────────────── */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRole="Admin">
              <AdminDashboard />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/create-doctor"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRole="Admin">
              <CreateDoctor />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/doctors"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRole="Admin">
              <DoctorManagement />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/logs"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRole="Admin">
              <SystemLogs />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      {/* Admin patient records management (uses existing Documents page) */}
      <Route
        path="/admin/patients"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRole="Admin">
              <Documents />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      {/* Admin PDF uploads */}
      <Route
        path="/admin/upload"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRole="Admin">
              <Upload />
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      {/* ─── Doctor Routes ────────────────────────────────────── */}
      <Route
        path="/doctor/dashboard"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRole="Doctor">
              <DoctorDashboard />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor/change-password"
        element={
          <ProtectedRoute>
            <ChangePassword />
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor/search"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRole="Doctor">
              <PatientRecordSearch />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      {/* Doctor's RAG chat interface */}
      <Route
        path="/doctor/chat"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRole="Doctor">
              <Chat />
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      {/* ─── Legacy / Fallback Routes ─────────────────────────── */}
      <Route path="/about" element={<About />} />
      {/* Catch-all: redirect to root */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
