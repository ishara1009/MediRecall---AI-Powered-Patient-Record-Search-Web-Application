import React, { createContext, useState, useEffect } from 'react';
import { loginUser, logoutUser, getMe, getSetupStatus } from '../api/api';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const [adminExists, setAdminExists] = useState(true);

  // Verify setup status (check if at least one Admin exists)
  const checkSetupStatus = async () => {
    try {
      const res = await getSetupStatus();
      setAdminExists(res.data.adminExists);
      return res.data.adminExists;
    } catch (err) {
      console.error('Failed to retrieve setup status:', err.message);
      return true; // Safe default: assume admin exists to prevent public setup route hijack
    }
  };

  // Restore session on boot
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const savedToken = localStorage.getItem('token');
        if (savedToken) {
          try {
            const res = await getMe();
            if (res.success && res.data) {
              setUser({
                id: res.data._id,
                email: res.data.email,
                fullName: res.data.fullName,
                employeeId: res.data.employeeId,
                phoneNumber: res.data.phoneNumber,
                role: res.data.role,
                profilePicture: res.data.profilePicture,
                status: res.data.status,
                isFirstLogin: res.data.isFirstLogin,
                medicalLicenseNumber: res.data.medicalLicenseNumber,
                department: res.data.department
              });
              setToken(savedToken);
            } else {
              handleSessionCleanup();
            }
          } catch (err) {
            console.warn('Restore session failed (backend may be down):', err.message);
            handleSessionCleanup();
          }
        } else {
          setUser(null);
        }

        // Check setup status — swallow errors gracefully
        try {
          await checkSetupStatus();
        } catch (err) {
          console.warn('Setup status check failed:', err.message);
          // Default: assume admin exists so login page is shown, not setup
          setAdminExists(true);
        }
      } catch (err) {
        console.error('Unexpected error during session restore:', err.message);
      } finally {
        // CRITICAL: always clear the loading state so the app renders
        setLoading(false);
      }
    };

    restoreSession();
  }, []);


  const handleSessionCleanup = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
  };

  // Login handler
  const login = async (email, password) => {
    try {
      const res = await loginUser(email, password);
      if (res.success && res.data) {
        const { token, user: loggedUser } = res.data;
        
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(loggedUser));
        
        setToken(token);
        setUser(loggedUser);
        
        // Refresh admin setup status
        await checkSetupStatus();
        
        return { success: true, user: loggedUser };
      }
      return { success: false, message: res.message || 'Login failed' };
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Login failed';
      return { success: false, message: errorMessage };
    }
  };

  // Logout handler
  const logout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error('Logout error on backend:', err.message);
    } finally {
      handleSessionCleanup();
    }
  };

  // Sync profile edits to React state
  const syncProfile = (updatedUser) => {
    if (updatedUser) {
      const formattedUserObj = {
        id: updatedUser.id || updatedUser._id,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        employeeId: updatedUser.employeeId,
        phoneNumber: updatedUser.phoneNumber,
        role: updatedUser.role,
        profilePicture: updatedUser.profilePicture,
        status: updatedUser.status,
        isFirstLogin: updatedUser.isFirstLogin,
        medicalLicenseNumber: updatedUser.medicalLicenseNumber,
        department: updatedUser.department
      };
      setUser(formattedUserObj);
      localStorage.setItem('user', JSON.stringify(formattedUserObj));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        adminExists,
        setAdminExists,
        checkSetupStatus,
        login,
        logout,
        syncProfile,
        isAuthenticated: !!token
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
