import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AlertCircle, X, Loader2, Mail, Lock, User, Shield } from "lucide-react";
import PropTypes from "prop-types";

const AuthError = ({ message, onClose }) => (
  <div className="animate-fadeIn bg-red-50 border-l-4 border-red-400 rounded-r-lg p-4 mb-6 shadow-sm">
    <div className="flex items-start">
      <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
      <div className="ml-3 flex-grow">
        <h3 className="text-sm font-medium text-red-800">Authentication Error</h3>
        <div className="mt-1 text-sm text-red-700">{message}</div>
      </div>
      <button
        onClick={onClose}
        className="flex-shrink-0 ml-4 text-red-400 hover:text-red-500 transition-colors"
        aria-label="Dismiss error"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  </div>
);

AuthError.propTypes = {
  message: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};

const InputField = ({ icon: Icon, label, ...props }) => (
  <div className="space-y-2">
    {label && (
      <label className="block text-sm font-medium text-gray-700">{label}</label>
    )}
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Icon className="h-5 w-5 text-gray-400" />
      </div>
      <input
        {...props}
        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 ease-in-out placeholder-gray-400 shadow-sm"
      />
    </div>
  </div>
);

InputField.propTypes = {
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string,
};

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    secretKey: "",
  });
  const { user, login, register, authError, clearAuthError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user) navigate(user.role === "admin" ? "/dashboard" : "/properties");
  }, [user, navigate]);

  useEffect(() => {
    const path = location.pathname;
    setIsLogin(path.includes('/login'));
  }, [location.pathname]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    clearAuthError();

    try {
      if (isLogin) {
        await login(formData);
      } else {
        await register(formData);
      }
    } catch (error) {
      console.error("Auth error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-8 bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-center text-3xl font-extrabold mb-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            {isLogin ? "Welcome Back" : "Join Us Today"}
          </h2>
          <p className="text-gray-500 text-center max-w-xs">
            {isLogin 
              ? "Sign in to access your account" 
              : "Create an account to get started"}
          </p>
        </div>

        {authError && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg flex items-center gap-3 shadow-sm">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <p className="text-red-700 text-sm">{authError}</p>
            <button 
              onClick={clearAuthError}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 mt-8">
          <div className="space-y-5">
            {!isLogin && (
              <div className="space-y-5">
                <InputField
                  icon={User}
                  label="Full Name"
                  type="text"
                  required
                  placeholder="Your Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />

                <InputField
                  icon={Shield}
                  label="Registration Code (for admin/owner)"
                  type="password"
                  placeholder="Enter secret key if applicable"
                  value={formData.secretKey}
                  onChange={(e) => setFormData({ ...formData, secretKey: e.target.value })}
                />
              </div>
            )}

            <InputField
              icon={Mail}
              label="Email Address"
              type="email"
              required
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />

            <InputField
              icon={Lock}
              label="Password"
              type="password"
              required
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          {isLogin && (
            <div className="flex items-center justify-end">
              <Link
                to="/forgot-password"
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
              >
                Forgot your password?
              </Link>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 shadow-md hover:shadow-lg"
          >
            {loading ? (
              <Loader2 className="animate-spin h-5 w-5" />
            ) : (
              isLogin ? "Sign In" : "Create Account"
            )}
          </button>
        </form>

        <div className="pt-4 text-center border-t border-gray-100">
          <Link
            to={isLogin ? "/auth/register" : "/auth/login"}
            className="text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
          >
            {isLogin 
              ? "Need an account? Register here"
              : "Already have an account? Sign in"}
          </Link>
        </div>
        
      
        </div>
      </div>
   
  );
};

export default Auth;