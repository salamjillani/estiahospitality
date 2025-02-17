import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AlertCircle, X, Loader2 } from "lucide-react";
import PropTypes from "prop-types";

const AuthError = ({ message, onClose }) => (
  <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
    <div className="flex items-start">
      <div className="flex-shrink-0">
        <AlertCircle className="h-5 w-5 text-red-400" />
      </div>
      <div className="ml-3 w-full">
        <h3 className="text-sm font-medium text-red-800">
          Authentication Error
        </h3>
        <div className="mt-1 text-sm text-red-700">{message}</div>
      </div>
      <button
        onClick={onClose}
        className="ml-auto pl-3"
        aria-label="Dismiss error"
      >
        <X className="h-5 w-5 text-red-500" />
      </button>
    </div>
  </div>
);

AuthError.propTypes = {
  message: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
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
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md p-8">
        <h2 className="text-2xl font-bold text-center mb-8">
          {isLogin ? "Sign In" : "Create Owner Account"}
        </h2>

        {authError && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center">
            <AlertCircle className="mr-2" /> {authError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block mb-1">Full Name</label>
              <input
                type="text"
                required
                className="w-full p-2 border rounded"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
          )}

          <div>
            <label className="block mb-1">Email</label>
            <input
              type="email"
              required
              className="w-full p-2 border rounded"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block mb-1">Password</label>
            <input
              type="password"
              required
              className="w-full p-2 border rounded"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="animate-spin mx-auto" />
            ) : isLogin ? (
              "Sign In"
            ) : (
              "Register"
            )}
          </button>
        </form>

        <div className="mt-4 text-center">
          <Link
            to={isLogin ? "/auth/register" : "/auth/login"}
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-600 hover:text-blue-800"
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
