import { useEffect, useState } from "react";
import { Button } from "../components/ui/button.js";
import { Outlet, useLocation, useNavigate } from "react-router";

const RegistrationsLayout = () => {
  const [activeTab, setActiveTab] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  const topTabs = [
    { id: "new_booking", label: "New Booking" },
    { id: "check_in", label: "Check In" },
    { id: "check_out", label: "Check Out" },
  ];

  useEffect(() => {
    // Set active tab based on current path
    const path = location.pathname.split("/").pop();

    // Check if the path matches any of the topTabs ids
    const matchingTab = topTabs.find((tab) => tab.id === path);

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
                  navigate(tab.id);
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
