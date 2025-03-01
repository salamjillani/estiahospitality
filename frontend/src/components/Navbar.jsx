import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { User, LogIn, LogOut, Shield, Calendar, Building, BookOpen, LayoutDashboard } from "lucide-react";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
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
  
  const isActiveLink = (path) => {
    return location.pathname === path;
  };

  const activeLinkStyle = "rounded-lg text-white bg-gradient-to-r from-blue-500 to-indigo-600 shadow-md";
  const inactiveLinkStyle = "rounded-lg text-gray-700 hover:text-blue-600 hover:bg-blue-50";

  return (
    <nav className="bg-white shadow-lg fixed w-full z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center space-x-2">
            <img src="/logo.png" alt="Logo" className="h-10 w-auto" />
          </Link>

          <div className="hidden md:flex items-center space-x-3">
            {user?.role === "admin" && (
              <Link
                to="/dashboard"
                className={`px-4 py-2 flex items-center transition-all duration-300 ${
                  isActiveLink("/dashboard") ? activeLinkStyle : inactiveLinkStyle
                }`}
              >
                <Calendar className="w-4 h-4 mr-2" /> Calendar
              </Link>
            )}
            
            <button
              onClick={handlePropertyNavigation}
              className={`px-4 py-2 flex items-center transition-all duration-300 ${
                isActiveLink("/properties") ? activeLinkStyle : inactiveLinkStyle
              }`}
            >
              <Building className="w-4 h-4 mr-2" /> Properties
            </button>

            {user?.role === "owner" && (
              <Link
                to="/owner-dashboard"
                className={`px-4 py-2 flex items-center transition-all duration-300 ${
                  isActiveLink("/owner-dashboard") ? activeLinkStyle : inactiveLinkStyle
                }`}
              >
                <LayoutDashboard className="w-4 h-4 mr-2" /> Owner Dashboard
              </Link>
            )}
            
            {user?.role === "client" && (
              <Link 
                to="/my-bookings" 
                className={`px-4 py-2 flex items-center transition-all duration-300 ${
                  isActiveLink("/my-bookings") ? activeLinkStyle : inactiveLinkStyle
                }`}
              >
                <BookOpen className="w-4 h-4 mr-2" /> My Bookings
              </Link>
            )}

            {user?.role === "admin" && (
              <>
                <Link 
                  to="/admin/dashboard" 
                  className={`px-4 py-2 flex items-center transition-all duration-300 ${
                    isActiveLink("/admin/dashboard") ? activeLinkStyle : inactiveLinkStyle
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 mr-2" /> Admin Dashboard
                </Link>
                <Link 
                  to="/admin/bookings" 
                  className={`px-4 py-2 flex items-center transition-all duration-300 ${
                    isActiveLink("/admin/bookings") ? activeLinkStyle : inactiveLinkStyle
                  }`}
                >
                  <BookOpen className="w-4 h-4 mr-2" /> New Bookings
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center">
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="bg-gray-50 rounded-full px-4 py-2 flex items-center shadow-sm border border-gray-200">
                  {user.role === "admin" ? (
                    <Shield className="w-5 h-5 text-indigo-600 mr-2" />
                  ) : (
                    <User className="w-5 h-5 text-blue-600 mr-2" />
                  )}
                  <span className="text-gray-800 font-medium">{user.name}</span>
                </div>
                <button
                  onClick={logout}
                  className="px-4 py-2 rounded-lg text-red-600 hover:text-white hover:bg-red-500 transition-all duration-300 flex items-center"
                >
                  <LogOut className="w-4 h-4 mr-2" /> Logout
                </button>
              </div>
            ) : (
              <Link
                to="#"
                onClick={handleAuthClick}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 flex items-center shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Become a Guest
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;