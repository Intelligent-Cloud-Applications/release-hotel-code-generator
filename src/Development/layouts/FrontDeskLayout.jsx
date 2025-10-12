import { useEffect, useState } from "react";
import { Button } from "../components/ui/button.js";
import { Outlet, useLocation, useNavigate } from "react-router";
import { useAppContext } from "../context/AppContext.jsx";

const FrontDeskLayout = () => {
  const { rooms, bookings, fetchRooms, fetchBookings } = useAppContext();
  const [activeTab, setActiveTab] = useState("");
  const [pageLoading, setPageLoading] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const topTabs = [
    { id: "room_list", label: "Room List" },
    { id: "new_booking", label: "New Booking" },
    { id: "cancel_booking", label: "Cancel Booking" },
    { id: "check_in", label: "Check In" },
    { id: "amend_booking", label: "Amend Checkin" },
    { id: "check_out", label: "Check Out" },
  ];

  useEffect(() => {
    const fetchData = async () => {
      setPageLoading(true);
      try {
        await fetchRooms();
        await fetchBookings();
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setPageLoading(false);
      }
    };

    fetchData();
  }, []);

  // Refresh data periodically to keep statistics up to date
  useEffect(() => {
    const interval = setInterval(() => {
      fetchRooms();
      fetchBookings();
    }, 300000); // Refresh every 5 minutes (300000ms)

    return () => clearInterval(interval);
  }, []);

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

  // Statistics data - using real-time room statuses
  const keyStats = {
    totalRooms: rooms?.length || 0,
    vacant: rooms?.filter((room) => room.status === "Vacant").length || 0,
    occupied: rooms?.filter((room) => room.status === "Occupied").length || 0,
    reserved: rooms?.filter((room) => room.status === "Reserved").length || 0,
    dirty: rooms?.filter((room) => room.status === "Dirty").length || 0,
    maintenance:
      rooms?.filter((room) => room.status === "Under Maintenance").length || 0,
    arrivals:
      bookings?.filter((booking) => booking.status === "Reserved").length || 0,
    departures:
      bookings?.filter(
        (booking) =>
          new Date(booking.checkout_date) <= new Date() &&
          booking.status === "Checked-in"
      ).length || 0,
    overdue:
      bookings?.filter(
        (booking) =>
          new Date(booking.checkout_date) < new Date() &&
          booking.status === "Checked-in"
      ).length || 0,
    currentGuests:
      bookings?.filter((booking) => booking.status === "Checked-in").length || 0,
  };

  // Debug logging for statistics
  console.log('FrontDeskLayout - Rooms data:', rooms);
  console.log('FrontDeskLayout - Bookings data:', bookings);
  console.log('FrontDeskLayout - Key Stats:', keyStats);

  return (
    <div className="p-2 bg-gray-50 min-h-[calc(100vh-4rem)] overflow-y-auto">
      
      <div className="flex flex-col lg:flex-row gap-3">
        {/* Left Panel - Room Management */}
        <div className="flex-1 gap-2 flex flex-col">
          <div className="bg-white rounded-lg p-3">
            <div className="flex flex-wrap gap-2">
              {topTabs.map((tab) => (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? "solid" : "ghost"}
                  className={`${
                    activeTab === tab.id
                      ? "bg-black text-white"
                      : "text-gray-700 bg-gray-100 hover:bg-gray-200"
                  } px-3 py-1.5 rounded-md text-sm font-medium cursor-pointer flex-shrink-0`}
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

        {/* Right Panel - Key Statistics */}
          {location.pathname !== '/dashboard/frontdesk/check_out' && (
            <div className={`lg:w-72 lg:h-fit bg-white rounded-lg shadow-sm p-4 ${
              showStats ? 'block' : 'hidden'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-gray-800">
            Key Statistics
                </h3>
                <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setShowStats(false)}
                >
            ×
                </Button>
              </div>
              <div className="space-y-3">
                {/* Room Status Grid */}
                <div className="grid grid-cols-2 gap-2">
            <StatCard
              label="Total Rooms"
              value={keyStats.totalRooms}
              bgColor="border border-black"
              textColor="text-[#0A0A0A]"
            />
            <StatCard
              label="Vacant"
              value={keyStats.vacant}
              bgColor="bg-[#065F46]"
              textColor="text-[#D1FAE5]"
            />
            <StatCard
              label="Occupied"
              value={keyStats.occupied}
              bgColor="bg-[#3730A3]"
              textColor="text-[#E0E7FF]"
            />
            <StatCard
              label="Reserved"
              value={keyStats.reserved}
              bgColor="bg-[#92400E]"
              textColor="text-[#FEF9C3]"
            />
            <StatCard
              label="Dirty"
              value={keyStats.dirty}
              bgColor="bg-[#B91C1C]"
              textColor="text-[#FEE2E2]"
            />
            <StatCard
              label="Maintenance"
              value={keyStats.maintenance}
              bgColor="bg-[#C2410C]"
              textColor="text-[#FFE4B5]"
            />
            <StatCard
              label="Departures"
              value={keyStats.departures}
              bgColor="bg-[#7E22CE]"
              textColor="text-[#F3E8FF]"
            />
            <StatCard
              label="Overdue"
              value={keyStats.overdue}
              bgColor="bg-[#DC2626]"
              textColor="text-[#FEE2E2]"
            />
                </div>
              </div>
            </div>
          )}

          {/* Mobile Stats Toggle Button */}
        {!showStats && (
          <div className="lg:hidden fixed bottom-4 right-4 z-50">
            <Button
              onClick={() => setShowStats(true)}
              className="bg-black text-white rounded-full w-12 h-12 shadow-lg"
            >
              📊
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

// Reusable Statistics Card Component
const StatCard = ({ label, value, bgColor, textColor, fullWidth = false }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 1000; // 2 seconds animation
    const steps = 60; // 60 frames for smooth animation
    const stepValue = value / steps;
    const stepDelay = duration / steps;

    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      setDisplayValue(Math.round(stepValue * currentStep));
      
      if (currentStep >= steps) {
        clearInterval(timer);
        setDisplayValue(value); // Ensure final value is exact
      }
    }, stepDelay);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <div
      className={`${bgColor} ${textColor} rounded-lg p-3 text-center ${
        fullWidth ? "col-span-2" : ""
      }`}
    >
      <div className="text-xs font-medium opacity-90">{label}</div>
      <div className="text-lg font-bold mt-1">{displayValue}</div>
    </div>
  );
};

export default FrontDeskLayout;
