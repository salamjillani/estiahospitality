import { createContext, useContext, useState, useEffect } from "react";
import PropTypes from "prop-types";
import { api, setAuthToken } from "../utils/api";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { websocketService } from "../services/websocketService";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [user, setUser] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const refreshToken = async () => {
    try {
      const response = await api.post("/api/auth/refresh");
      const newToken = response.token;
      localStorage.setItem("token", newToken);
      setAuthToken(newToken);
      setToken(newToken);
      return newToken;
    } catch (error) {
      console.error("Token refresh failed:", error);
      logout();
      throw error;
    }
  };

  // Check authentication status on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      setLoading(true);
      try {
        const userData = await api.get("/api/auth/me");
        const decoded = jwtDecode(localStorage.getItem("token"));
        if (decoded.exp * 1000 < Date.now() + 300000) {
          const newToken = await refreshToken();
          localStorage.setItem("token", newToken);
        }
        setUser(userData);
      } catch (err) {
        console.error("Auth check failed:", err);
        logout();
      } finally {
        setLoading(false);
      }
    };
    if (token) {
      setAuthToken(token);
      checkAuthStatus();
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (credentials) => {
    try {
      const normalizedCredentials = {
        ...credentials,
        email: credentials.email.toLowerCase(),
      };

      const response = await api.post("/api/auth/login", normalizedCredentials);
      const { token, user: userData } = response;

      localStorage.setItem("token", token);
      setAuthToken(token);
      setUser(userData);
      navigate(userData.role === "admin" ? "/dashboard" : "/properties");
      websocketService.connect();
    } catch (error) {
      console.error("Login error:", error);
      setAuthError(error.message || "Failed to log in");
      throw error;
    }
  };

  const register = async (data) => {
    try {
      setAuthError(null);
      const response = await api.post("/api/auth/register", data);
      setUser(response.user);
      setToken(response.token);
      localStorage.setItem("token", response.token);
      navigate("/properties");
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
