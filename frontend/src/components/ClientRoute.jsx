// ClientRoute.jsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ClientRoute = () => {
  const { user } = useAuth();
  return user?.role === "client" ? <Outlet /> : <Navigate to="/" replace />;
};

export default ClientRoute;