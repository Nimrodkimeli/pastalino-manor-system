import { Navigate, useLocation } from "react-router-dom";
import { getSession } from "../api";

export default function ProtectedRoute({ component: Component }) {
  const session = getSession();
  const location = useLocation();
  if (!session) {
    return <Navigate to="/login" replace />;
  }
  if (session.mustResetPassword && location.pathname !== "/reset-required") {
    return <Navigate to="/reset-required" replace />;
  }
  if (!session.mustResetPassword && location.pathname === "/reset-required") {
    return <Navigate to="/" replace />;
  }
  return <Component />;
}
