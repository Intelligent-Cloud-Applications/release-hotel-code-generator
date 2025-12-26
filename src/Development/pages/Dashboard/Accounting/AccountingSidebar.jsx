import React, { useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  DollarSign,
  FileText,
  CreditCard,
  Receipt,
  BookOpen,
  TrendingUp,
  Users,
  FileCheck,
  Clock,
  BarChart3,
  IndianRupee,
  LucideReceiptIndianRupee,
} from "lucide-react";
import { FaRupeeSign } from "react-icons/fa";
import { Link, useLocation } from "react-router";

const AccountingSidebar = () => {
  const [activeTab, setActiveTab] = useState();
  const pathName = useLocation();
  const [expandedSections, setExpandedSections] = useState({
    transactions: true,
    reports: true,
    management: false,
  });

  useEffect(() => {
    setActiveTab(pathName.pathname.split("/")[3]);
  }, [pathName]);

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const menuSections = [
    {
      id: "transactions",
      title: "Transactions",
      icon: DollarSign,
      items: [
        { id: "revenue-posting", label: "Revenue Posting", icon: TrendingUp },
        { id: "bill-posting", label: "Bill Posting", icon: FileText },
        {
          id: "payments-receipts",
          label: "Payments & Receipts",
          icon: CreditCard,
        },
        { id: "journal-entries", label: "Journal Entries", icon: BookOpen },
      ],
    },
    {
      id: "reports",
      title: "Reports & Analytics",
      icon: BarChart3,
      items: [
        {
          id: "financial-reports",
          label: "Financial Reports",
          icon: FileCheck,
        },
        { id: "daily-revenue", label: "Daily Revenue Report", icon: Receipt },
        { id: "audit-trail", label: "Audit Trail", icon: Clock },
      ],
    },
    {
      id: "management",
      title: "Account Management",
      icon: Users,
      items: [
        {
          id: "accounts-receivable",
          label: "Accounts Receivable",
          icon: TrendingUp,
        },
        { id: "accounts-payable", label: "Accounts Payable", icon: FileText },
        { id: "general-ledger", label: "General Ledger", icon: BookOpen },
      ],
    },
  ];

  const [selectedItem, setSelectedItem] = useState(null);

  const handleItemClick = (itemId) => {
    setSelectedItem(itemId);
  };
  return (
    <aside className="w-80 overflow-y-auto max-h-[93vh] ">
      <div className="p-6 border-b">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <LucideReceiptIndianRupee className="w-6 h-6" />
          Accounting
        </h2>
        <p className="text-sm text-gray-500 mt-1">Financial Management</p>
      </div>

      <nav className="p-4">
        {menuSections.map((section) => (
          <div key={section.id} className="mb-4">
            {/* Section Header */}
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <section.icon className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
                <span className="font-semibold text-gray-700 group-hover:text-blue-600">
                  {section.title}
                </span>
              </div>
              {expandedSections[section.id] ? (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              )}
            </button>

            {/* Section Items */}
            {expandedSections[section.id] && (
              <div className="ml-4 mt-2 space-y-1">
                {section.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                      activeTab === item.id
                        ? "bg-blue-50 text-blue-700 border-l-4 border-blue-600"
                        : "hover:bg-gray-50 text-gray-600 hover:text-gray-800 border-l-4 border-transparent"
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <Link
                      to={`/dashboard/accounting/${item.id}`}
                      className="flex-1 text-left"
                    >
                      {item.label}
                    </Link>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
};

export default AccountingSidebar;
