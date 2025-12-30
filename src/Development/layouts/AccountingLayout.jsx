import React from "react";
import { Outlet } from "react-router";
import AccountingSidebar from "../pages/Dashboard/Accounting/AccountingSidebar";

const AccountingLayout = () => {
  return (
    <div className="flex flex-1 h-full">
      <AccountingSidebar />
      <div className="bg-gray-100 rounded-lg flex-1 overflow-y-auto max-h-[93vh]">
        <Outlet />
      </div>

      
    </div>
  );
};

export default AccountingLayout;
