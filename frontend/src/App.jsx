import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import LandingPage from "./components/LandingPage";
import Dashboard from "./components/Dashboard";
import Properties from "./components/Properties";
import PropertyDetails from "./components/PropertyDetails";
import PropertyForm from "./components/PropertyForm";
import Bookings from "./components/Bookings";
import Agents from "./components/Agents";
import Auth from "./components/Auth";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import Notifications from "./components/Notifications";
import ErrorBoundary from "./components/ErrorBoundary";

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <ErrorBoundary>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth/*" element={<Auth />} />
            <Route path="/properties/:id" element={<PropertyDetails />} />

            {/* Protected User Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/properties" element={<Properties />} />
              <Route path="/bookings" element={<Bookings />} />
              <Route path="/dashboard" element={<Dashboard />} />

              {/* Nested Admin Routes */}
              <Route element={<AdminRoute />}>
                <Route path="/agents" element={<Agents />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/properties/new" element={<PropertyForm />} />
                <Route path="/properties/:id/edit" element={<PropertyForm />} />
              </Route>
            </Route>

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ErrorBoundary>
      </AuthProvider>
    </Router>
  );
};

export default App;