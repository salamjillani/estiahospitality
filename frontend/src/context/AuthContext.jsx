import { createContext, useContext, useState, useEffect } from "react";
import PropTypes from "prop-types";
import { api, setAuthToken } from "../utils/api"; 
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [user, setUser] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [loading, setLoading] = useState(true); // Add loading state
  const navigate = useNavigate();

  // Check authentication status on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      setLoading(true);
      try {
        const userData = await api.get("/api/auth/me");
        setUser(userData); // Only set user data, not the token
      } catch (err) {
        console.error("Auth check failed:", err);
        logout();
      } finally {
        setLoading(false);
      }
    };
    if (token) {
      setAuthToken(token); // Set token from localStorage
      checkAuthStatus();
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (credentials) => {
    try {
      const normalizedCredentials = {
        ...credentials,
        email: credentials.email.toLowerCase()
      };
      
      const response = await api.post("/api/auth/login", normalizedCredentials);
      const { token, user: userData } = response;
  
      localStorage.setItem("token", token);
      setAuthToken(token);
      setUser(userData);
      navigate(userData.role === 'admin' ? '/dashboard' : '/properties');
    } catch (error) {
      console.error('Login error:', error);
      setAuthError(error.message || "Failed to log in");
      throw error;
    }
  };


  const register = async (data) => {
    try {
      setAuthError(null);
      delete data.role;
      const response = await api.post("/api/auth/register", {
        ...data,
        role: 'owner'
      });

      setUser(response.user);
      setToken(response.token);
      localStorage.setItem("token", response.token);
      navigate("/dashboard");
    } catch (error) {
      setAuthError(error.message || "Failed to register");
    }
  };

  const logout = async () => {
    try {
      await api.post("/api/auth/logout");
    } catch (error) {
      console.error("Logout failed:", error.message);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem("token");
      navigate("/auth");
    }
  };

  const clearAuthError = () => setAuthError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        authError,
        loading,
        login,
        register,
        logout,
        clearAuthError,
      }}
    >
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
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;