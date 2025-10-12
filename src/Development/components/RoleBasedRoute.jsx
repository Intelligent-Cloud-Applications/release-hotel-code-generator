import { Navigate } from "react-router";
import { useAuthContext } from "@/Development/context/AuthContext.jsx";

const RoleBasedRoute = ({ children, allowedRoles = [] }) => {
  const { userData } = useAuthContext();

  // If no user data, this should be handled by ProtectedRoute
  if (!userData) {
    return <Navigate to="/login" replace />;
  }

  // If no roles specified, allow access to all authenticated users
  if (allowedRoles.length === 0) {
    return children;
  }

  // Check if user's role is in the allowed roles
  let allowed = false;
  for (const userType of userData.userTypes) {
    if (allowedRoles.includes(userType)) {
      allowed = true;
      break;
    }
  }
  if (!allowed) {
    // Redirect to appropriate dashboard based on user type
    const userTypeRoutes = {
      admin: "/dashboard/admin/room_list",
      frontdesk: "/dashboard/frontdesk",
      housekeeping: "/dashboard/housekeeping/room_status_list",
    };

    const redirectPath = userTypeRoutes[userData.userType] || "/dashboard";
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

export default RoleBasedRoute; 