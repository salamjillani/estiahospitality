import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AlertCircle, X, Loader2, Mail, Lock, User } from "lucide-react";
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
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    adminSecret: "",
  });
  const { user, login, register, authError, clearAuthError } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate(user.role === "admin" ? "/dashboard" : "/properties");
  }, [user, navigate]);

  useEffect(() => {
    if (user) {
      const redirectPath =
        location.state?.from ||
        (user.role === "admin" ? "/dashboard" : "/properties");
      navigate(redirectPath);
    }
  }, [user, navigate, location.state]);

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
        await register({ ...formData, role: "owner" });
      }
    } catch (error) {
      console.error("Auth error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="fixed top-0 left-0 w-full h-screen bg-[url('https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?ixlib=rb-1.2.1&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center opacity-[0.04] z-0"></div>
      
      <div className="max-w-md w-full space-y-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 relative z-10">
        <div className="flex flex-col items-center">
          <img
            src="/logo.png"
            alt="Logo"
            className="h-16 w-auto mb-6"
          />
          <h2 className="mt-2 text-center text-3xl font-extrabold mb-8 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent drop-shadow-sm">
            {isLogin ? "Welcome Back" : "Create Your Account"}
          </h2>
        </div>

        {authError && <AuthError message={authError} onClose={clearAuthError} />}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <InputField
                  icon={User}
                  type="text"
                  required
                  placeholder="Your Name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email address
              </label>
              <InputField
                icon={Mail}
                type="email"
                required
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <InputField
                icon={Lock}
                type="password"
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Secret Key (optional)
                </label>
                <InputField
                  icon={Lock}
                  type="password"
                  placeholder="Enter admin secret key"
                  value={formData.adminSecret}
                  onChange={(e) =>
                    setFormData({ ...formData, adminSecret: e.target.value })
                  }
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 ease-in-out disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="animate-spin h-5 w-5" />
            ) : (
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <Lock className="h-5 w-5 text-blue-200 group-hover:text-blue-100" />
              </span>
            )}
            <span>{isLogin ? "Sign in" : "Create account"}</span>
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            to={isLogin ? "/auth/register" : "/auth/login"}
            onClick={() => setIsLogin(!isLogin)}
            className="font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200"
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