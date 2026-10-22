import { useEffect, useState, useMemo } from "react";
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
    const matchingTab = topTabs.find(
      (tab) =>
        tab.id === path ||
        (tab.id === "availability" && (path === "forecaster" || path === "availability"))
    );

    if (matchingTab) {
      setActiveTab(matchingTab.id);
    } else {
      setActiveTab("");
    }
  }, [location.pathname]);

  // Statistics data - using real-time room statuses based on today's active bookings
  const keyStats = useMemo(() => {
    const totalRooms = rooms?.length || 0;
    if (!rooms || rooms.length === 0) {
      return {
        totalRooms: 0,
        vacant: 0,
        occupied: 0,
        reserved: 0,
        dirty: 0,
        maintenance: 0,
        arrivals: 0,
        departures: 0,
        overdue: 0,
        currentGuests: 0,
      };
    }

    const normalizeDate = (dt) => {
      if (!dt) return 0;
      if (typeof dt === 'string') {
        const trimmed = dt.trim();
        if (!trimmed.includes('T') && !trimmed.includes('Z')) {
          const dmy = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
          if (dmy) {
            return new Date(parseInt(dmy[3], 10), parseInt(dmy[2], 10) - 1, parseInt(dmy[1], 10), 0, 0, 0, 0).getTime();
          }
          const ymd = trimmed.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
          if (ymd) {
            return new Date(parseInt(ymd[1], 10), parseInt(ymd[2], 10) - 1, parseInt(ymd[3], 10), 0, 0, 0, 0).getTime();
          }
        }
      }
      let num = typeof dt === 'string' && !isNaN(Number(dt)) ? Number(dt) : dt;
      if (typeof num === 'number' && num > 0 && num < 10000000000) {
        num = num * 1000;
      }
      const obj = new Date(num);
      if (isNaN(obj.getTime())) return 0;
      return new Date(obj.getFullYear(), obj.getMonth(), obj.getDate(), 0, 0, 0, 0).getTime();
    };

    const now = new Date();
    const todayTs = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();

    const isBookingActiveOnDate = (b, targetDayTs) => {
      if (!b || !targetDayTs) return false;
      const st = String(b.status || '').toLowerCase().trim();
      if (
        st.includes('cancel') ||
        st.includes('checkout') ||
        st.includes('checked-out') ||
        st === 'checked out'
      ) {
        return false;
      }
      if (b.status !== 'Checked-in' && b.status !== 'Reserved') {
        return false;
      }
      const cin = normalizeDate(b.checkin_date);
      const cout = normalizeDate(b.checkout_date);
      if (!cin) return false;
      if (!cout || cin === cout) return targetDayTs === cin;
      return targetDayTs >= cin && targetDayTs <= cout;
    };

    const doesBookingMatchRoom = (b, room) => {
      if (!b || !room) return false;
      const targetId = String(room.room_id || '').toLowerCase().trim();
      const targetNum = String(room.room_number || '').toLowerCase().trim();
      const checkValue = (val) => {
        if (val === undefined || val === null || val === '' || val === 'none') return false;
        if (Array.isArray(val)) return val.some(checkValue);
        if (typeof val === 'object') {
          return (
            checkValue(val.room_id) ||
            checkValue(val.room_number) ||
            checkValue(val.id) ||
            checkValue(val.number)
          );
        }
        const str = String(val).toLowerCase().trim();
        return (targetId && str === targetId) || (targetNum && str === targetNum);
      };
      return (
        checkValue(b.room_id) ||
        checkValue(b.room_number) ||
        checkValue(b.room_numbers) ||
        checkValue(b.roomNumber) ||
        checkValue(b.rooms_config) ||
        checkValue(b.rooms) ||
        checkValue(b.allocated_room) ||
        checkValue(b.allocated_rooms)
      );
    };

    const activeBookings = (bookings || []).filter((b) => isBookingActiveOnDate(b, todayTs));
    const assignedBookingIds = new Set();
    const roomStatusMap = {};

    rooms.forEach((room) => {
      if (
        room.status === 'Under Maintenance' ||
        room.status === 'Dirty' ||
        room.status === 'Out of Order'
      ) {
        roomStatusMap[room.room_id] = room.status;
        return;
      }

      const matchedBooking = activeBookings.find((b) => doesBookingMatchRoom(b, room));
      if (matchedBooking) {
        assignedBookingIds.add(matchedBooking.booking_id);
        roomStatusMap[room.room_id] = matchedBooking.status === 'Checked-in' ? 'Occupied' : 'Reserved';
      }
    });

    // Handle unassigned rooms matching category/type
    const unassigned = activeBookings.filter((b) => !assignedBookingIds.has(b.booking_id));
    const unassignedRooms = rooms.filter(
      (r) => !roomStatusMap[r.room_id] && (r.status === 'Vacant' || r.status === 'Clean')
    );

    unassigned.forEach((b) => {
      const bCat = (b.room_category || b.room_type || '').trim().toLowerCase();
      const candidateRoom = unassignedRooms.find(
        (r) => !roomStatusMap[r.room_id] && (r.room_type || '').trim().toLowerCase() === bCat
      );
      if (candidateRoom) {
        roomStatusMap[candidateRoom.room_id] = b.status === 'Checked-in' ? 'Occupied' : 'Reserved';
      }
    });

    // Default remaining rooms to Vacant
    rooms.forEach((room) => {
      if (!roomStatusMap[room.room_id]) {
        roomStatusMap[room.room_id] = room.status === 'Clean' ? 'Vacant' : room.status || 'Vacant';
      }
    });

    let vacant = 0;
    let occupied = 0;
    let reserved = 0;
    let dirty = 0;
    let maintenance = 0;

    Object.values(roomStatusMap).forEach((st) => {
      if (st === 'Occupied') occupied++;
      else if (st === 'Reserved') reserved++;
      else if (st === 'Dirty') dirty++;
      else if (st === 'Under Maintenance' || st === 'Out of Order') maintenance++;
      else vacant++;
    });

    const arrivals = (bookings || []).filter((b) => {
      if (b.status !== 'Reserved') return false;
      const cin = normalizeDate(b.checkin_date);
      return cin === todayTs;
    }).length;

    const departures = (bookings || []).filter((b) => {
      if (b.status !== 'Checked-in') return false;
      const cout = normalizeDate(b.checkout_date);
      return cout === todayTs;
    }).length;

    const overdue = (bookings || []).filter((b) => {
      if (b.status !== 'Checked-in') return false;
      const cout = normalizeDate(b.checkout_date);
      return cout > 0 && cout < todayTs;
    }).length;

    return {
      totalRooms,
      vacant,
      occupied,
      reserved,
      dirty,
      maintenance,
      arrivals,
      departures,
      overdue,
      currentGuests: occupied,
    };
  }, [rooms, bookings]);

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
