import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AlertCircle, X, Loader2, Mail, Lock, User, Shield } from "lucide-react";
import PropTypes from "prop-types";

const AuthError = ({ message, onClose }) => (
  <div className="animate-fadeIn bg-red-50 border-l-4 border-red-400 rounded-r-lg p-4 mb-6">
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

const InputField = ({ icon: Icon, ...props }) => (
  <div className="relative">
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      <Icon className="h-5 w-5 text-gray-400" />
    </div>
    <input
      {...props}
      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ease-in-out placeholder-gray-400"
    />
  </div>
);

InputField.propTypes = {
  icon: PropTypes.elementType.isRequired,
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 bg-white rounded-2xl shadow-xl p-8">
        <div className="flex flex-col items-center">
          <h2 className="mt-2 text-center text-3xl font-extrabold mb-8 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            {isLogin ? "Welcome Back" : "Create Your Account"}
          </h2>
        </div>

        {authError && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <p className="text-red-700">{authError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {!isLogin && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="Your Name"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Registration Code (for admin/owner)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                      <Shield className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="password"
                      placeholder="Enter secret key if applicable"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                      value={formData.secretKey}
                      onChange={(e) => setFormData({ ...formData, secretKey: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? (
              <Loader2 className="animate-spin h-5 w-5" />
            ) : (
              isLogin ? "Sign In" : "Create Account"
            )}
          </button>
        </form>

        <div className="text-center">
          <Link
            to={isLogin ? "/auth/register" : "/auth/login"}
            className="text-blue-600 hover:text-blue-800 font-medium"
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