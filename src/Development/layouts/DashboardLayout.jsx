import React from "react";
import DashboardNavbar from "../components/DashboardNavbar.jsx";
import { Outlet, useLocation } from "react-router";

const DashboardLayout = () => {
  const { pathname } = useLocation();

  console.log(pathname.split("/")[2]);

  return (
    <div className="min-h-screen max-h-screen overflow-y-auto inter">
      <DashboardNavbar />
      <Outlet />
    </div>
  );
};

export default DashboardLayout;
