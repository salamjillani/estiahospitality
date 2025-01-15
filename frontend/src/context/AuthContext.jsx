// frontend/src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { api } from '../utils/api';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const userData = await api.get('/api/auth/me');
      setUser(userData);
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    const userData = await api.post('/api/auth/login', credentials);
    setUser(userData.user);
    navigate('/dashboard');
  };

  const register = async (userData) => {
    const response = await api.post('/api/auth/register', userData);
    setUser(response.user);
    navigate('/dashboard');
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
      setUser(null);
      navigate('/auth');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };
  const hasAccess = (requiredRoles) => {
    return user && requiredRoles.includes(user.role);
  };
  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, hasAccess }}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;