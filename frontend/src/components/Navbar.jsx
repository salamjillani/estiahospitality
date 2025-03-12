import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { User, LogIn, LogOut, Shield, Calendar, Building, BookOpen, LayoutDashboard, Menu, X } from "lucide-react";
import { useState } from "react";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const handleAuthClick = () => {
    navigate(user ? "/dashboard" : "/auth");
    setIsMenuOpen(false);
  };

  const handlePropertyNavigation = () => {
    if (!user) {
      navigate("/auth", { state: { from: "/properties" } });
    } else {
      navigate("/properties");
    }
    setIsMenuOpen(false);
  };
  
  const isActiveLink = (path) => {
    return location.pathname === path;
  };

  const activeLinkStyle = "rounded-full text-white bg-gradient-to-r from-blue-600 to-indigo-700 shadow-lg font-medium";
  const inactiveLinkStyle = "rounded-full text-gray-700 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 font-medium";

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <nav className="bg-white backdrop-blur-sm bg-opacity-90 shadow-lg fixed w-full z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center space-x-3 group">
            <img src="/logo.png" alt="Logo" className="h-12 w-auto transition-transform duration-300 group-hover:scale-105" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              to="/dashboard"
              className={`px-5 py-2.5 flex items-center transition-all duration-300 ${
                isActiveLink("/dashboard") ? activeLinkStyle : inactiveLinkStyle
              }`}
            >
              <Calendar className={`w-4 h-4 mr-2 ${isActiveLink("/dashboard") ? "text-white" : "text-blue-500"}`} /> 
              Calendar
            </Link>
            
            <button
              onClick={handlePropertyNavigation}
              className={`px-5 py-2.5 flex items-center transition-all duration-300 ${
                isActiveLink("/properties") ? activeLinkStyle : inactiveLinkStyle
              }`}
            >
              <Building className={`w-4 h-4 mr-2 ${isActiveLink("/properties") ? "text-white" : "text-blue-500"}`} /> 
              Properties
            </button>

            {user?.role === "owner" && (
              <Link
                to="/owner-dashboard"
                className={`px-5 py-2.5 flex items-center transition-all duration-300 ${
                  isActiveLink("/owner-dashboard") ? activeLinkStyle : inactiveLinkStyle
                }`}
              >
                <LayoutDashboard className={`w-4 h-4 mr-2 ${isActiveLink("/owner-dashboard") ? "text-white" : "text-blue-500"}`} /> 
                Owner Dashboard
              </Link>
            )}
            
            {user?.role === "client" && (
              <Link 
                to="/my-bookings" 
                className={`px-5 py-2.5 flex items-center transition-all duration-300 ${
                  isActiveLink("/my-bookings") ? activeLinkStyle : inactiveLinkStyle
                }`}
              >
                <BookOpen className={`w-4 h-4 mr-2 ${isActiveLink("/my-bookings") ? "text-white" : "text-blue-500"}`} /> 
                My Bookings
              </Link>
            )}

            {user?.role === "admin" && (
              <>
                <Link 
                  to="/admin/dashboard" 
                  className={`px-5 py-2.5 flex items-center transition-all duration-300 ${
                    isActiveLink("/admin/dashboard") ? activeLinkStyle : inactiveLinkStyle
                  }`}
                >
                  <LayoutDashboard className={`w-4 h-4 mr-2 ${isActiveLink("/admin/dashboard") ? "text-white" : "text-blue-500"}`} /> 
                  Admin Dashboard
                </Link>
                <Link 
                  to="/admin/bookings" 
                  className={`px-5 py-2.5 flex items-center transition-all duration-300 ${
                    isActiveLink("/admin/bookings") ? activeLinkStyle : inactiveLinkStyle
                  }`}
                >
                  <BookOpen className={`w-4 h-4 mr-2 ${isActiveLink("/admin/bookings") ? "text-white" : "text-blue-500"}`} /> 
                  New Bookings
                </Link>
              </>
            )}
          </div>

          {/* Desktop Auth Button */}
          <div className="hidden md:flex items-center">
            {user ? (
              <div className="flex items-center space-x-4">
                <div className="bg-gray-50 rounded-full px-5 py-2.5 flex items-center shadow-md border border-gray-200 hover:border-blue-200 hover:bg-blue-50 transition-all duration-300">
                  {user.role === "admin" ? (
                    <Shield className="w-5 h-5 text-indigo-600 mr-2" />
                  ) : (
                    <User className="w-5 h-5 text-blue-600 mr-2" />
                  )}
                  <span className="text-gray-800 font-medium">{user.name}</span>
                </div>
                <button
                  onClick={logout}
                  className="px-5 py-2.5 rounded-full text-red-600 hover:text-white hover:bg-red-500 border border-transparent hover:border-red-600 transition-all duration-300 flex items-center font-medium"
                >
                  <LogOut className="w-4 h-4 mr-2" /> Logout
                </button>
              </div>
            ) : (
              <Link
                to="#"
                onClick={handleAuthClick}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-full hover:from-blue-700 hover:to-indigo-800 transition-all duration-300 flex items-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Become a Guest
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMenu}
              className="p-2 rounded-full text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-300"
            >
              {isMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white shadow-lg border-t border-gray-100 overflow-hidden transition-all duration-300">
          <div className="px-4 pt-2 pb-6 space-y-3">
            <Link
              to="/dashboard"
              onClick={closeMenu}
              className={`px-4 py-3 flex items-center w-full transition-all duration-300 ${
                isActiveLink("/dashboard") 
                  ? "bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg shadow-md" 
                  : "text-gray-700 hover:bg-blue-50 rounded-lg"
              }`}
            >
              <Calendar className={`w-5 h-5 mr-3 ${isActiveLink("/dashboard") ? "text-white" : "text-blue-500"}`} /> 
              Calendar
            </Link>
            
            <button
              onClick={handlePropertyNavigation}
              className={`px-4 py-3 flex items-center w-full transition-all duration-300 ${
                isActiveLink("/properties") 
                  ? "bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg shadow-md" 
                  : "text-gray-700 hover:bg-blue-50 rounded-lg text-left"
              }`}
            >
              <Building className={`w-5 h-5 mr-3 ${isActiveLink("/properties") ? "text-white" : "text-blue-500"}`} /> 
              Properties
            </button>

            {user?.role === "owner" && (
              <Link
                to="/owner-dashboard"
                onClick={closeMenu}
                className={`px-4 py-3 flex items-center w-full transition-all duration-300 ${
                  isActiveLink("/owner-dashboard") 
                    ? "bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg shadow-md" 
                    : "text-gray-700 hover:bg-blue-50 rounded-lg"
                }`}
              >
                <LayoutDashboard className={`w-5 h-5 mr-3 ${isActiveLink("/owner-dashboard") ? "text-white" : "text-blue-500"}`} /> 
                Owner Dashboard
              </Link>
            )}
            
            {user?.role === "client" && (
              <Link 
                to="/my-bookings"
                onClick={closeMenu}
                className={`px-4 py-3 flex items-center w-full transition-all duration-300 ${
                  isActiveLink("/my-bookings") 
                    ? "bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg shadow-md" 
                    : "text-gray-700 hover:bg-blue-50 rounded-lg"
                }`}
              >
                <BookOpen className={`w-5 h-5 mr-3 ${isActiveLink("/my-bookings") ? "text-white" : "text-blue-500"}`} /> 
                My Bookings
              </Link>
            )}

            {user?.role === "admin" && (
              <>
                <Link 
                  to="/admin/dashboard"
                  onClick={closeMenu}
                  className={`px-4 py-3 flex items-center w-full transition-all duration-300 ${
                    isActiveLink("/admin/dashboard") 
                      ? "bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg shadow-md" 
                      : "text-gray-700 hover:bg-blue-50 rounded-lg"
                  }`}
                >
                  <LayoutDashboard className={`w-5 h-5 mr-3 ${isActiveLink("/admin/dashboard") ? "text-white" : "text-blue-500"}`} /> 
                  Admin Dashboard
                </Link>
                <Link 
                  to="/admin/bookings"
                  onClick={closeMenu}
                  className={`px-4 py-3 flex items-center w-full transition-all duration-300 ${
                    isActiveLink("/admin/bookings") 
                      ? "bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg shadow-md" 
                      : "text-gray-700 hover:bg-blue-50 rounded-lg"
                  }`}
                >
                  <BookOpen className={`w-5 h-5 mr-3 ${isActiveLink("/admin/bookings") ? "text-white" : "text-blue-500"}`} /> 
                  New Bookings
                </Link>
              </>
            )}

            {/* Mobile Auth Buttons */}
            <div className="pt-2 border-t border-gray-100">
              {user ? (
                <div className="space-y-3">
                  <div className="bg-gray-50 rounded-lg px-4 py-3 flex items-center shadow-sm border border-gray-200">
                    {user.role === "admin" ? (
                      <Shield className="w-5 h-5 text-indigo-600 mr-3" />
                    ) : (
                      <User className="w-5 h-5 text-blue-600 mr-3" />
                    )}
                    <span className="text-gray-800 font-medium">{user.name}</span>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      closeMenu();
                    }}
                    className="w-full px-4 py-3 rounded-lg text-red-600 hover:text-white hover:bg-red-500 border border-transparent hover:border-red-600 transition-all duration-300 flex items-center font-medium"
                  >
                    <LogOut className="w-5 h-5 mr-3" /> Logout
                  </button>
                </div>
              ) : (
                <Link
                  to="#"
                  onClick={handleAuthClick}
                  className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg hover:from-blue-700 hover:to-indigo-800 transition-all duration-300 flex items-center justify-center shadow-md font-medium"
                >
                  <LogIn className="w-5 h-5 mr-3" />
                  Become a Guest
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;