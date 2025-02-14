import { Link } from "react-router-dom";
import {
  Bell,
  Settings,
  User,
  X,
  Menu,
  CalendarClock,
  Building2,
  UsersRound,
  CalendarCheck,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import PropTypes from 'prop-types';

const Navbar = ({ isSidebarOpen, setIsSidebarOpen }) => {
  const { user } = useAuth();

  const navLinks = [
    { 
      to: "/dashboard", 
      icon: CalendarClock, 
      label: "Calendar",
      color: "text-purple-600",
      hoverBg: "hover:bg-purple-50/50",
      activeBg: "active:bg-purple-100/50",
      underlineColor: "bg-purple-600"
    },
    { 
      to: "/properties", 
      icon: Building2, 
      label: "Properties",
      color: "text-emerald-600",
      hoverBg: "hover:bg-emerald-50/50",
      activeBg: "active:bg-emerald-100/50",
      underlineColor: "bg-emerald-600"
    },
    { 
      to: "/agents", 
      icon: UsersRound, 
      label: "Agents",
      color: "text-amber-600",
      hoverBg: "hover:bg-amber-50/50",
      activeBg: "active:bg-amber-100/50",
      underlineColor: "bg-amber-600"
    },
    { 
      to: "/bookings", 
      icon: CalendarCheck, 
      label: "Bookings",
      color: "text-rose-600",
      hoverBg: "hover:bg-rose-50/50",
      activeBg: "active:bg-rose-100/50",
      underlineColor: "bg-rose-600"
    },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-sm z-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between h-16 px-4 lg:px-6">
          {/* Left section */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => setIsSidebarOpen?.(!isSidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100/80 active:bg-gray-200/80 transition-all duration-200"
            >
              {isSidebarOpen ? (
                <X className="w-5 h-5 text-gray-700" />
              ) : (
                <Menu className="w-5 h-5 text-gray-700" />
              )}
            </button>
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="Logo"
                className="h-8 w-auto transition-all duration-300 hover:scale-105"
              />
            </div>
          </div>

          {/* Center navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map(({ to, icon: Icon, label, color, hoverBg, activeBg, underlineColor }) => (
              <Link
                key={to}
                to={to}
                className={`group flex items-center px-4 py-2 text-sm font-medium text-gray-600 hover:${color} ${hoverBg} ${activeBg} rounded-lg transition-all duration-200`}
              >
                <Icon className={`w-4 h-4 mr-2 transition-transform duration-200 group-hover:scale-110 group-hover:${color}`} />
                <span className="relative">
                  {label}
                  <span className={`absolute inset-x-0 -bottom-1 h-0.5 ${underlineColor} scale-x-0 group-hover:scale-x-100 transition-transform duration-200`} />
                </span>
              </Link>
            ))}
          </div>

          {/* Right section */}
          <div className="flex items-center gap-2">
            <button className="relative p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50/50 active:bg-blue-100/50 rounded-lg transition-all duration-200 group">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full group-hover:animate-pulse" />
            </button>

            <button className="hidden sm:block p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50/50 active:bg-blue-100/50 rounded-lg transition-all duration-200">
              <Settings className="w-5 h-5 transition-transform duration-300 hover:rotate-90" />
            </button>

            <div className="hidden sm:block h-6 w-px bg-gray-200 mx-2" />

            <button className="flex items-center gap-3 pl-2 pr-3 py-1.5 rounded-lg hover:bg-gray-50/80 active:bg-gray-100/80 transition-all duration-200">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full ring-2 ring-green-500/20" />
              </div>
              <span className="hidden sm:inline text-sm font-medium text-gray-700">
                {user?.name || "Admin"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

Navbar.propTypes = {
  isSidebarOpen: PropTypes.bool.isRequired,
  setIsSidebarOpen: PropTypes.func.isRequired,
};

export default Navbar;