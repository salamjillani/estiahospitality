import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
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
import ClientBookings from "./components/ClientBookings";
import OwnerDashboard from "./components/OwnerDashboard";
import ReservationForm from "./components/ReservationForm";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import Notifications from "./components/Notifications";
import ErrorBoundary from "./components/ErrorBoundary";
import AdminBookings from "./components/AdminBookings";
import ClientRoute from "./components/ClientRoute";

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <ErrorBoundary>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth/*" element={<Auth />} />
            <Route path="/properties/:id" element={<PropertyDetails />} />

            {/* Protected User Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/properties" element={<Properties />} />
              <Route
                path="/properties/:propertyId/book"
                element={<ReservationForm />}
              />

              <Route element={<ClientRoute />}>
                <Route path="/my-bookings" element={<ClientBookings />} />
              </Route>

              {/* Owner-specific routes */}
              <Route path="/owner-dashboard" element={<OwnerDashboard />} />

              {/* Nested Admin Routes */}
              <Route element={<AdminRoute />}>
                <Route path="/agents" element={<Agents />} />
                <Route path="/properties/new" element={<PropertyForm />} />
                <Route path="/properties/:id/edit" element={<PropertyForm />} />
                <Route path="/all-bookings" element={<Bookings />} />
                <Route path="/notifications" element={<Notifications />} />
                {/* Add admin bookings route here */}
                <Route path="/admin/bookings" element={<AdminBookings />} />
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
