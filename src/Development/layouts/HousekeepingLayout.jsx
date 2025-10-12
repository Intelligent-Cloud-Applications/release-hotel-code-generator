import { useEffect, useState } from "react";
import { Button } from "../components/ui/button.js";
import { Outlet, useLocation, useNavigate } from "react-router";

const HousekeepingLayout = () => {
  const [activeTab, setActiveTab] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  const topTabs = [
    { id: "room_status_list", label: "Room Status List" },
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

  // Statistics data
  const keyStats = {
    totalRooms: 120,
    vacant: 38,
    occupied: 65,
    reserved: 10,
    dirty: 4,
    maintenance: 3,
    arrivals: 12,
    departures: 9,
    currentGuests: 110,
  };

  return (
    <div className="p-2 sm:p-4 bg-gray-50 min-h-[calc(100vh-4rem)] overflow-y-auto">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Left Panel - Room Management */}
        <div className="flex-1 gap-4 flex flex-col">
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

        {/* Right Panel - Key Statistics (Hidden for now) */}
        {/*<div className="w-80 bg-white rounded-lg shadow-sm p-6">*/}
        {/*  <h3 className="text-lg font-semibold mb-6 text-gray-800">*/}
        {/*    Key Statistics*/}
        {/*  </h3>*/}
        {/*  <div className="space-y-4">*/}
        {/*    /!* Room Status Grid *!/*/}
        {/*    <div className="grid grid-cols-2 gap-3">*/}
        {/*      <StatCard*/}
        {/*        label="Total Rooms"*/}
        {/*        value={keyStats.totalRooms}*/}
        {/*        bgColor="bg-gray-100"*/}
        {/*        textColor="text-gray-800"*/}
        {/*      />*/}
        {/*      <StatCard*/}
        {/*        label="Vacant"*/}
        {/*        value={keyStats.vacant}*/}
        {/*        bgColor="bg-green-600"*/}
        {/*        textColor="text-white"*/}
        {/*      />*/}
        {/*      <StatCard*/}
        {/*        label="Occupied"*/}
        {/*        value={keyStats.occupied}*/}
        {/*        bgColor="bg-blue-600"*/}
        {/*        textColor="text-white"*/}
        {/*      />*/}
        {/*      <StatCard*/}
        {/*        label="Reserved"*/}
        {/*        value={keyStats.reserved}*/}
        {/*        bgColor="bg-orange-700"*/}
        {/*        textColor="text-white"*/}
        {/*      />*/}
        {/*      <StatCard*/}
        {/*        label="Dirty"*/}
        {/*        value={keyStats.dirty}*/}
        {/*        bgColor="bg-red-600"*/}
        {/*        textColor="text-white"*/}
        {/*      />*/}
        {/*      <StatCard*/}
        {/*        label="Maintenance"*/}
        {/*        value={keyStats.maintenance}*/}
        {/*        bgColor="bg-orange-600"*/}
        {/*        textColor="text-white"*/}
        {/*      />*/}
        {/*      <StatCard*/}
        {/*        label="Arrivals"*/}
        {/*        value={keyStats.arrivals}*/}
        {/*        bgColor="bg-blue-500"*/}
        {/*        textColor="text-white"*/}
        {/*      />*/}
        {/*      <StatCard*/}
        {/*        label="Departures"*/}
        {/*        value={keyStats.departures}*/}
        {/*        bgColor="bg-purple-600"*/}
        {/*        textColor="text-white"*/}
        {/*      />*/}
        {/*    </div>*/}

        {/*    /!* Current Guests *!/*/}
        {/*    <div className="mt-6">*/}
        {/*      <StatCard*/}
        {/*        label="Current Guests"*/}
        {/*        value={keyStats.currentGuests}*/}
        {/*        bgColor="bg-green-700"*/}
        {/*        textColor="text-white"*/}
        {/*        fullWidth={true}*/}
        {/*      />*/}
        {/*    </div>*/}
        {/*  </div>*/}
        {/*</div>*/}
      </div>
    </div>
  );
};

// Reusable Statistics Card Component
const StatCard = ({ label, value, bgColor, textColor, fullWidth = false }) => {
  return (
    <div
      className={`${bgColor} ${textColor} rounded-lg p-3 sm:p-4 text-center ${
        fullWidth ? "col-span-2" : ""
      }`}
    >
      <div className="text-xs sm:text-sm font-medium opacity-90">{label}</div>
      <div className="text-lg sm:text-2xl font-bold mt-1">{value}</div>
    </div>
  );
};

export default HousekeepingLayout;
