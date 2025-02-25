import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Home, User, LogIn, LogOut, Shield } from "lucide-react";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleAuthClick = () => {
    navigate(user ? "/dashboard" : "/auth");
  };

  const handlePropertyNavigation = () => {
    if (!user) {
      navigate("/auth", { state: { from: "/properties" } });
    } else {
      navigate("/properties");
    }
  };

  return (
    <nav className="bg-white shadow-sm fixed w-full z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center">
            <img src="/logo.png" alt="Logo" className="h-8 w-auto" />
          </Link>

          <div className="flex items-center space-x-4">
            {user && (
              <Link
                to="/dashboard"
                className="px-3 py-2 text-gray-700 hover:text-blue-600"
              >
                Calendar
              </Link>
            )}
            <button
              onClick={handlePropertyNavigation}
              className="px-3 py-2 text-gray-700 hover:text-blue-600"
            >
              Properties
            </button>

            {user?.role === "owner" && (
              <Link
                to="/owner-dashboard"
                className="px-3 py-2 text-gray-700 hover:text-blue-600"
              >
                Owner Dashboard
              </Link>
            )}
            {user?.role === "client" && (
              <Link to="/my-bookings" className="px-3 py-2">
                My Bookings
              </Link>
            )}

            {user?.role === "admin" && (
              <>
                <Link to="/admin/dashboard" className="px-3 py-2">
                  Admin Dashboard
                </Link>
                <Link to="/admin/bookings" className="px-3 py-2">
                  Bookings
                </Link>
              </>
            )}
            {user ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  {user.role === "admin" && (
                    <Shield className="w-4 h-4 text-blue-600" />
                  )}
                  <span className="text-gray-700">{user.name}</span>
                </div>
                <button
                  onClick={logout}
                  className="px-3 py-2 text-red-600 hover:text-red-800 flex items-center"
                >
                  <LogOut className="w-4 h-4 mr-1" /> Logout
                </button>
              </div>
            ) : (
              <Link
                to="#"
                onClick={handleAuthClick}
                className="px-3 py-2 text-blue-600 hover:text-blue-800 flex items-center"
              >
                <LogIn className="w-4 h-4 mr-1" />
                {user ? "Dashboard" : "Become a Guest"}
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
