import { useEffect, useState } from "react";
import { ChevronDown, User, Menu, X, Bell } from "lucide-react";
import { Button } from "./ui/button.js";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "./ui/select.js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu.js";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "./ui/popover.js"; // <-- Add these imports!
import { useLocation, useNavigate } from "react-router";
import { useAuthContext } from "@/Development/context/AuthContext.jsx";
import { useAppContext } from "@/Development/context/AppContext.jsx";
import { product } from "../../Operation/data.json";

const DashboardNavbar = () => {
  const { userData, setUserData } = useAuthContext();
  const { notifications } = useAppContext();
  const [activeTab, setActiveTab] = useState("");
  const [activeItem, setActiveItem] = useState("");
  const [activeNotifications, setActiveNotifications] = useState([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const navPath = location.pathname.split("/")[2] || "";
    const navItemPath = location.pathname.split("/")[3] || "";
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get("tab");

    if (navPath === "laundry") {
      setActiveTab(tabParam ? `laundry_${tabParam}` : "laundry_new_order");
    } else {
      setActiveTab(navPath);
    }
    setActiveItem(navItemPath);
  }, [location.pathname, location.search]);

  const hasLaundryAccess =
    userData?.userType === "laundry" ||
    (userData?.userTypes || []).includes("laundry") ||
    userData?.userType === "admin" ||
    (userData?.userTypes || []).includes("admin");

  const getLaundryOrderCount = () => {
    try {
      const saved = localStorage.getItem("hotel_laundry_orders");
      return saved ? JSON.parse(saved).length : 0;
    } catch (e) {
      return 0;
    }
  };

  // Define navigation items based on user type
  const getNavItems = () => {
    if (userData?.userType == 'frontdesk') {
      const items = [
        {
          id: "bookings",
          label: "Bookings",
          hasDropdown: false,
        },
        {
          id: "frontdesk",
          label: "Front Desk",
          hasDropdown: false,
        },
        { id: "dayend", label: "Day End Process", hasDropdown: false },
        { id: "guest_history", label: "Guest History", hasDropdown: false },
        { id: "company", label: "Company Details", hasDropdown: false },
        { id: "expenses", label: "Cash Drawer", hasDropdown: false },
        { id: "store", label: "Store", hasDropdown: false },
      ];

      // if (hasLaundryAccess) {
      //   items.push({ id: "laundry", tab: "new_order", label: "Laundry", hasDropdown: false });
      // }

      items.push({ id: "reports", label: "Reports", hasDropdown: false });
      return items;
    }
    if (userData?.userType == 'laundry') {
      const bagCount = getLaundryOrderCount();
      return [
        { id: "laundry_new_order", tab: "new_order", label: "New Order (Billing)", hasDropdown: false },
        { id: "laundry_deliveries", tab: "deliveries", label: "Deliveries", hasDropdown: false },
        { id: "laundry_tracker", tab: "tracker", label: bagCount > 0 ? `Order Tracker (${bagCount})` : "Order Tracker", hasDropdown: false },
        { id: "laundry_price_sheet", tab: "price_sheet", label: "Rate Sheet & Prices", hasDropdown: false },
        { id: "laundry_statistics", tab: "statistics", label: "Shift Stats & Revenue", hasDropdown: false },
        { id: "reports", label: "Reports", hasDropdown: false },
      ];
    }
    if (userData?.userType == 'store') {
      return [
        { id: "store", label: "Store", hasDropdown: false },
        { id: "reports", label: "Reports", hasDropdown: false },
      ];
    }
    // Return empty array for housekeeping and admin users
    return [];
  };

  const navItems = getNavItems();

  useEffect(() => {
    const nowMs = Date.now();
    const ns = notifications?.filter(
      n => n.show_time <= nowMs && nowMs <= n.expire_time
    ) || [];
    console.log(nowMs, notifications, ns);
    setActiveNotifications(ns);
  }, [notifications]);

  return (
    <nav className="bg-white h-[7vh] border-b border-gray-200 px-4 sm:px-6 py-3 sticky top-0 z-50">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center space-x-2 sm:space-x-4">
          <span className="text-blue-600 font-[900] text-lg sm:text-xl">
            Tekkzy
          </span>
          <div className="min-w-[140px]">
            <Select
              value={userData?.userType || (userData?.userTypes?.[0] || "")}
              onValueChange={(val) => {
                // Determine base route for selected user type
                let route = `/dashboard/${val}`;
                if (val === 'housekeeping') route = '/dashboard/housekeeping/room_status_list';
                if (val === 'frontdesk') route = '/dashboard/frontdesk';
                if (val === 'admin') route = '/dashboard/admin/room_list';
                if (val === 'accountant') route = '/dashboard/accounting/bill-posting';
                if (val === 'laundry') route = '/dashboard/laundry';
                if (val === 'store') route = '/dashboard/store';
                setActiveTab('');
                setActiveItem('');
                setUserData({ ...userData, userType: val });
                localStorage.setItem("userType", val);
                navigate(route);
              }}
            >
              <SelectTrigger className={`h-9 px-2 sm:px-3 text-xs sm:text-sm font-medium rounded-md border transition-colors duration-200 ${activeTab === userData?.userType || activeTab === ''
                  ? 'bg-blue-200 text-blue-900 border-blue-400'
                  : 'bg-gray-200 text-gray-900 border-gray-400'
                }`}>
                <SelectValue placeholder="Select Role" />
              </SelectTrigger>
              <SelectContent>
                {(() => {
                  const isAdmin =
                    userData?.userType === "admin" ||
                    (userData?.userTypes || []).includes("admin");
                  const allRoles = ["admin", "frontdesk", "housekeeping", "accountant", "laundry", "store"];
                  const displayRoles = isAdmin
                    ? allRoles
                    : Array.from(new Set([...(userData?.userTypes || []), userData?.userType].filter(Boolean)));
                  return displayRoles.map((ut) => (
                    <SelectItem key={ut} value={ut} className="text-sm capitalize">
                      {ut[0].toUpperCase() + ut.slice(1)}
                    </SelectItem>
                  ));
                })()}
              </SelectContent>
            </Select>
          </div>
          {/*{(userData?.userTypes || []).includes('frontdesk') && (*/}
          {/*  <Button*/}
          {/*    variant={"ghost"}*/}
          {/*    onClick={() => {*/}
          {/*      setActiveTab("housekeeping");*/}
          {/*      navigate("/dashboard/housekeeping/room_status_list");*/}
          {/*    }}*/}
          {/*    className={`px-2 sm:px-4 py-2 text-xs sm:text-sm cursor-pointer font-medium rounded-md border transition-colors duration-200 flex items-center gap-1 ${*/}
          {/*      activeTab === "housekeeping"*/}
          {/*        ? "bg-blue-200 text-blue-900 border-blue-400 hover:bg-blue-300 hover:text-blue-800"*/}
          {/*        : "bg-gray-200 text-gray-900 border-gray-400 hover:bg-gray-300 hover:text-gray-800"*/}
          {/*    }`}*/}
          {/*  >*/}
          {/*    Housekeeping*/}
          {/*  </Button>*/}
          {/*)}*/}
        </div>

        <div className="hidden md:flex items-center justify-center space-x-1 flex-1">
          {navItems
            .filter((item) => item.id !== "bookings" || product === "booking")
            .map((item) => (
              <div key={item.id} className="relative">
                {item.hasDropdown ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md flex items-center space-x-1 cursor-pointer ${activeTab === item.id
                            ? "bg-green-700 text-white hover:bg-green-800"
                            : "text-gray-700 hover:bg-green-800"
                          }`}
                      >
                        <span>{item.label}</span>
                        <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48">
                      {item.dropdownItems &&
                        item.dropdownItems.map((dropdownItem) => (
                          <DropdownMenuItem
                            key={dropdownItem.id}
                            className={`my-1 ${activeItem === dropdownItem.id
                                ? "bg-gray-200 hover:bg-gray-200"
                                : ""
                              } cursor-pointer`}
                            onClick={() => {
                              setActiveTab(item.id);
                              setActiveItem(dropdownItem.id);
                              navigate(
                                `/dashboard/reservations/${dropdownItem.id}`
                              );
                            }}
                          >
                            {dropdownItem.label}
                          </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <div
                    variant="ghost"
                    className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md cursor-pointer ${activeTab === item.id
                        ? "bg-green-800 text-white hover:bg-green-800"
                        : "text-gray-700 hover:bg-gray-400 hover:text-white"
                      }`}
                    onClick={() => {
                      if (item.tab) {
                        setActiveTab(item.id);
                        navigate(`/dashboard/laundry?tab=${item.tab}`);
                      } else {
                        setActiveTab(item.id);
                        navigate(`/dashboard/${item.id}`);
                      }
                    }}
                  >
                    {item.label}
                  </div>
                )}
              </div>
            ))}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <Button
            variant="ghost"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2"
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>

        {/* Profile & Notification Icons */}
        <div className="flex items-center space-x-2">
          {/* Show bell only for frontdesk */}
          {(userData?.userTypes || []).includes('frontdesk') && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className={`relative flex items-center gap-2 min-w-[48px] px-3 py-2 rounded-full transition-all
        ${activeNotifications.length > 0
                      ? "bg-pink-50 ring-2 ring-pink-400 ring-offset-2 shadow-lg"
                      : ""}
      `}
                  aria-label="Show notifications"
                >
                  <Bell
                    className={`h-5 w-5 sm:h-6 sm:w-6 transition-colors duration-300
          ${activeNotifications.length > 0
                        ? "text-pink-500 drop-shadow-[0_0_8px_pink]"
                        : "text-gray-600"}
        `}
                  />
                  {activeNotifications.length > 0 && (
                    <span className="ml-2 text-sm font-semibold text-pink-700">
                      Attention, {activeNotifications.length} notification{activeNotifications.length > 1 ? "s" : ""}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                className="min-w-[320px] max-w-[90vw] p-4 inter"
                side="bottom"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-gray-800">Notifications</h4>
                </div>
                {activeNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-gray-400">
                    <Bell className="w-8 h-8 mb-2" />
                    <span>No notifications</span>
                  </div>
                ) : (
                  <ul className="space-y-2 max-h-[320px] overflow-y-auto">
                    {activeNotifications.map((n) => {
                      // Calculate time to expiry
                      const nowMs = Date.now();
                      const timeRemaining = n.expire_time - nowMs;
                      let timeText = "";
                      if (timeRemaining > 0) {
                        const mins = Math.floor(timeRemaining / 60000);
                        const hours = Math.floor(mins / 60);
                        if (hours > 0) timeText = `Expires in ${hours}h ${mins % 60}m`;
                        else timeText = `Expires in ${mins}m`;
                      } else {
                        const minsAgo = Math.abs(Math.floor(timeRemaining / 60000));
                        if (minsAgo < 60) timeText = `Expired ${minsAgo}m ago`;
                        else timeText = `Expired ${Math.floor(minsAgo / 60)}h ago`;
                      }

                      return (
                        <li
                          key={n.notification_id}
                          className="flex items-start gap-3 bg-gradient-to-br from-gray-50 via-white to-gray-100 border border-gray-200 rounded-lg p-3 shadow-sm"
                        >
                          <div className="flex flex-col items-center justify-center pt-1">
                            {/* You can use different icons/colors for types if you have a type property */}
                            <Bell className="w-5 h-5 text-blue-500" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-800">{n.message}</div>
                            <div className="text-xs text-gray-500 mt-1">{timeText}</div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </PopoverContent>
            </Popover>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <User className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => navigate("/dashboard/profile")}>
                Profile
              </DropdownMenuItem>
              {(userData?.userTypes || []).includes('admin') && (
                <DropdownMenuItem
                  onClick={() => navigate("/dashboard/settings")}
                >
                  Settings
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => navigate("/logout")}>
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden mt-4 pb-4 border-t border-gray-200">
          <div className="flex flex-col space-y-2 pt-4">
            {navItems.map((item) => (
              <div key={item.id} className="relative">
                {item.hasDropdown ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className={`w-full justify-start px-4 py-2 text-sm font-medium rounded-md flex items-center space-x-1 cursor-pointer ${activeTab === item.id
                            ? "bg-green-700 text-white hover:bg-green-800"
                            : "text-gray-700 hover:bg-green-800"
                          }`}
                      >
                        <span>{item.label}</span>
                        <ChevronDown className="h-4 w-4 ml-auto" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-full">
                      {item.dropdownItems &&
                        item.dropdownItems.map((dropdownItem) => (
                          <DropdownMenuItem
                            key={dropdownItem.id}
                            className={`my-1 ${activeItem === dropdownItem.id
                                ? "bg-gray-200 hover:bg-gray-200"
                                : ""
                              } cursor-pointer`}
                            onClick={() => {
                              setActiveTab(item.id);
                              setActiveItem(dropdownItem.id);
                              navigate(
                                `/dashboard/reservations/${dropdownItem.id}`
                              );
                              setIsMobileMenuOpen(false);
                            }}
                          >
                            {dropdownItem.label}
                          </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <div
                    variant="ghost"
                    className={`px-4 py-2 text-sm font-medium rounded-md cursor-pointer ${activeTab === item.id
                        ? "bg-green-800 text-white hover:bg-green-800"
                        : "text-gray-700 hover:bg-gray-400 hover:text-white"
                      }`}
                    onClick={() => {
                      if (item.tab) {
                        setActiveTab(item.id);
                        navigate(`/dashboard/laundry?tab=${item.tab}`);
                      } else {
                        setActiveTab(item.id);
                        navigate(`/dashboard/${item.id}`);
                      }
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    {item.label}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default DashboardNavbar;