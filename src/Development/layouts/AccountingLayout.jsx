import React from "react";
import { Outlet, Link, useLocation } from "react-router";
import {
  Banknote,
  TrendingUp,
  FileText,
  Receipt,
  LucideReceiptIndianRupee,
  Layers,
} from "lucide-react";

const AccountingLayout = () => {
  return (
    <div className="flex flex-col flex-1 h-full min-h-[93vh] bg-gray-50">
      {/* -------------------- FULL-WIDTH VIEWPORT CONTENT -------------------- */}
      <main className="flex-1 overflow-y-auto max-h-[93vh]">
        <Outlet />
      </main>
    </div>
  );
};

export default AccountingLayout;
