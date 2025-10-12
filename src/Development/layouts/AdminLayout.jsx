import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import { useAppContext } from "../context/AppContext.jsx";
import { Button } from "../components/ui/button.js";

const AdminLayout = () => {
  const { rooms, bookings, fetchRooms, fetchBookings } = useAppContext();
  const [activeTab, setActiveTab] = useState("");
  const [pageLoading, setPageLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Responsive state for mobile tab
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );
  const [mobileTab, setMobileTab] = useState("main");

  // Listen for resize to update isMobile immediately
  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 768);
      // If switching to desktop, always show main tab
      if (window.innerWidth >= 768) setMobileTab("main");
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const topTabs = [
    { id: "room_list", label: "Room List" },
    { id: "guest_list", label: "Guest List" },
    { id: "staff_list", label: "Staff List" },
    { id: "revenue", label: "Revenue" },
    { id: "reports", label: "Reports" },
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
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const path = location.pathname.split("/").pop();
    const matchingTab = topTabs.find((tab) => tab.id === path);
    setActiveTab(matchingTab ? matchingTab.id : "");
    if (matchingTab) setMobileTab("main");
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
    currentGuests:
      bookings?.filter((booking) => booking.status === "Checked-in").length || 0,
  };

  // Debug logging
  console.log('AdminLayout - Rooms data:', rooms);
  console.log('AdminLayout - Bookings data:', bookings);
  console.log('AdminLayout - Key Stats:', keyStats);

  return (
    <div className="p-2 sm:p-4 bg-gray-50 min-h-[calc(100vh-4rem)]">
      {/* Loading Spinner */}
      <div
        className={`flex items-center justify-center h-screen ${
          pageLoading ? "" : "hidden"
        }`}
      >
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-blue-500"></div>
      </div>

      {/* Tabs (top) - mobile and desktop */}
      <div className="bg-white rounded-lg p-3 sm:p-4 mb-4">
        <div className="flex flex-wrap gap-2 sm:gap-4">
          {topTabs.map((tab) => (
            <Button
              key={tab.id}
              variant={
                activeTab === tab.id && mobileTab === "main" ? "solid" : "ghost"
              }
              className={`${
                activeTab === tab.id && mobileTab === "main"
                  ? "bg-black text-white"
                  : "text-gray-700 bg-gray-100 hover:bg-gray-200"
              } px-3 sm:px-4 py-2 rounded-md text-sm sm:text-base font-semibold cursor-pointer flex-shrink-0`}
              onClick={() => {
                setMobileTab("main");
                setActiveTab(tab.id);
                navigate(tab.id);
              }}
            >
              {tab.label}
            </Button>
          ))}
          {/* Manually add Key Statistics tab for mobile */}
          {isMobile && (
            <Button
              key="key_stats"
              variant={mobileTab === "key_stats" ? "solid" : "ghost"}
              className={`${
                mobileTab === "key_stats"
                  ? "bg-black text-white"
                  : "text-gray-700 bg-gray-100 hover:bg-gray-200"
              } px-3 sm:px-4 py-2 rounded-md text-sm sm:text-base font-semibold cursor-pointer flex-shrink-0`}
              onClick={() => {
                setMobileTab("key_stats");
                setActiveTab("key_stats");
              }}
            >
              Key Statistics
            </Button>
          )}
        </div>
      </div>

      {/* Main Layout: Responsive */}
      <div
        className={`flex flex-col lg:flex-row gap-4 ${
          pageLoading ? "hidden" : ""
        }`}
      >
        {/* Main Content (Tabs + Outlet) */}
        <div
          className={`flex-1 flex flex-col gap-4 ${
            isMobile && mobileTab === "key_stats" ? "hidden" : ""
          }`}
        >
          <div className="flex-1">
            <Outlet />
          </div>
        </div>

        {/* Desktop Sidebar */}
        <aside className="hidden lg:block lg:w-80 flex-shrink-0">
          <SidebarContent keyStats={keyStats} />
        </aside>

        {/* Mobile: Show stats as a tab panel */}
        {isMobile && mobileTab === "key_stats" && (
          <div className="lg:hidden">
            <SidebarContent keyStats={keyStats} />
          </div>
        )}


      </div>
    </div>
  );
};

// Sidebar content for desktop and mobile tab
function SidebarContent({ keyStats }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4 lg:mb-0">
      <h3 className="text-base sm:text-lg font-semibold mb-4 sm:mb-6 text-gray-800">
        Key Statistics
      </h3>
      <SidebarStats keyStats={keyStats} />
    </div>
  );
}

function SidebarStats({ keyStats }) {
  return (
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
          label="Arrivals"
          value={keyStats.arrivals}
          bgColor="bg-[#7E22CE]"
          textColor="text-[#F3E8FF]"
        />
        <StatCard
          label="Departures"
          value={keyStats.departures}
          bgColor="bg-[#DC2626]"
          textColor="text-[#FEE2E2]"
        />
      </div>
    </div>
  );
}

const StatCard = ({ label, value, bgColor, textColor, fullWidth = false }) => (
  <div
    className={`${bgColor} ${textColor} rounded-lg p-3 sm:p-4 text-center ${
      fullWidth ? "col-span-2" : ""
    }`}
  >
    <div className="text-xs sm:text-sm font-medium opacity-90">{label}</div>
    <div className="text-lg sm:text-2xl font-bold mt-1">{value}</div>
  </div>
);

export default AdminLayout;
