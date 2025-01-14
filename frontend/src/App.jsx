import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { AuthProvider } from './context/AuthContext';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import { useAuth } from './context/AuthContext';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/auth" />;
  }
  
  return children;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;