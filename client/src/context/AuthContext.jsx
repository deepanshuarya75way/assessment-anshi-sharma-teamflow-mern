import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('teamflow_token') || null);
  const [loading, setLoading] = useState(true);

  // Initialize and verify user on mount
  useEffect(() => {
    const fetchUser = async () => {
      const storedToken = localStorage.getItem('teamflow_token');
      if (storedToken) {
        try {
          const res = await api.get('/auth/me');
          if (res.data.success) {
            setUser(res.data.data);
          }
        } catch (err) {
          console.error('Failed to load user session:', err);
          logout();
        }
      }
      setLoading(false);
    };

    fetchUser();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        const { token: receivedToken, ...userData } = res.data.data;
        localStorage.setItem('teamflow_token', receivedToken);
        setToken(receivedToken);
        setUser(userData);
        return { success: true };
      }
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Login failed. Please check credentials.',
      };
    }
  };

  const register = async (name, email, password, role, department) => {
    try {
      const res = await api.post('/auth/register', {
        name,
        email,
        password,
        role,
        department,
      });
      if (res.data.success) {
        const { token: receivedToken, ...userData } = res.data.data;
        localStorage.setItem('teamflow_token', receivedToken);
        setToken(receivedToken);
        setUser(userData);
        return { success: true };
      }
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Registration failed.',
      };
    }
  };

  // Instant 1-click role switcher for interview demo
  const quickLogin = async (roleType) => {
    let email = 'admin@teamflow.io';
    let password = 'Admin@123';

    if (roleType === 'manager') {
      email = 'manager@teamflow.io';
      password = 'Manager@123';
    } else if (roleType === 'member') {
      email = 'member@teamflow.io';
      password = 'Member@123';
    }

    return await login(email, password);
  };

  const logout = () => {
    localStorage.removeItem('teamflow_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        loading,
        login,
        register,
        quickLogin,
        logout,
        isAdmin: user?.role === 'admin',
        isManager: user?.role === 'manager',
        isMember: user?.role === 'member',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
