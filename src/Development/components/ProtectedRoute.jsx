import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router";
import { useAuthContext } from "@/Development/context/AuthContext.jsx";
import Login from "@/Development/pages/Auth/Login.jsx";

const ProtectedRoute = ({ children }) => {
  const { userData, isLoading } = useAuthContext();
  const location = useLocation();

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!userData) {
    return <Login />;
  }

  // If authenticated and trying to access /dashboard, redirect based on user type
  if (location.pathname === "/dashboard") {
    const userTypeRoutes = {
      admin: "/dashboard/admin/room_list",
      frontdesk: "/dashboard/frontdesk",
      housekeeping: "/dashboard/housekeeping/room_status_list",
    };

    const redirectPath = userTypeRoutes[userData.userType] || "/dashboard";
    return <Navigate to={redirectPath} replace />;
  }

  // If authenticated and accessing other dashboard routes, allow access
  return children;
};

export default ProtectedRoute; 