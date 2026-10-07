import { useEffect, useState } from "react";
import { Button } from "../components/ui/button.js";
import { Outlet, useLocation, useNavigate } from "react-router";

const RegistrationsLayout = () => {
  const [activeTab, setActiveTab] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  const topTabs = [
    { id: "room_list", label: "Room List", path: "/dashboard/frontdesk/room_list" },
    { id: "new_booking", label: "New Booking", path: "/dashboard/frontdesk/new_booking" },
    { id: "cancel_booking", label: "Cancel Booking", path: "/dashboard/frontdesk/cancel_booking" },
    { id: "availability", label: "Room Availability", path: "/dashboard/frontdesk/availability" },
    { id: "check_in", label: "Check In", path: "/dashboard/frontdesk/check_in" },
    { id: "amend_booking", label: "Amend Checkin", path: "/dashboard/frontdesk/amend_booking" },
    { id: "check_out", label: "Check Out", path: "/dashboard/frontdesk/check_out" },
  ];

  useEffect(() => {
    // Set active tab based on current path
    const path = location.pathname;
    const matchingTab = topTabs.find((tab) => path.includes(tab.id));

    if (matchingTab) {
      setActiveTab(matchingTab.id);
    } else {
      setActiveTab("");
    }
  }, [location.pathname]);

  return (
    <div className="p-2 sm:p-4 bg-gray-50 min-h-[calc(100vh-4rem)] overflow-y-auto">

      <div className="flex-1 gap-2 flex flex-col">
        <div className="bg-white rounded-lg p-3 sm:p-4">
          <div className="flex flex-wrap gap-2 sm:gap-4">
            {topTabs.map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "solid" : "ghost"}
                className={`${
                  activeTab === tab.id
                    ? "bg-black text-white"
                    : "text-gray-700 bg-gray-100 hover:bg-gray-200"
                } px-3 sm:px-4 py-2 rounded-md text-sm sm:text-base font-semibold cursor-pointer flex-shrink-0`}
                onClick={() => {
                  setActiveTab(tab.id);
                  navigate(tab.path);
                }}
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </div>
        <Outlet />
      </div>
    </div>
  );
};

export default RegistrationsLayout;
