import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import apiClient from '../api/apiClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  /**
   * Verify existing session on initial load or reload
   */
  const checkAuth = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/auth/me');
      if (res.data?.success && res.data?.user) {
        setUser(res.data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      // 401 or network error on checkAuth means unauthenticated, do not show error toast
      setUser(null);
    } finally {
      setLoading(false);
      setAuthChecked(true);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  /**
   * Register new user
   */
  const register = async ({ username, email, password }) => {
    try {
      const res = await apiClient.post('/auth/register', {
        username,
        email,
        password,
      });

      if (res.data?.success) {
        setUser(res.data.user);
        toast.success(`Welcome to HireNex, ${res.data.user.username}!`);
        return { success: true, user: res.data.user };
      }
    } catch (err) {
      const errorMsg = err.message || 'Registration failed. Please try again.';
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  /**
   * Authenticate user
   */
  const login = async ({ email, password }) => {
    try {
      const res = await apiClient.post('/auth/login', { email, password });

      if (res.data?.success) {
        setUser(res.data.user);
        toast.success(`Welcome back, ${res.data.user.username}!`);
        return { success: true, user: res.data.user };
      }
    } catch (err) {
      const errorMsg = err.message || 'Invalid credentials. Please try again.';
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  /**
   * Invalidate session and logout
   */
  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      toast.success('Successfully logged out.');
    }
  };

  const value = {
    user,
    loading,
    authChecked,
    register,
    login,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;

