import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Development/components/ui/select.tsx";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/Development/components/ui/popover.tsx";
import { Label } from "@/Development/components/ui/label.tsx";
import { Checkbox } from "@/Development/components/ui/checkbox.tsx";
import { Filter, Search, Users, ClipboardList, Unlock, X, RefreshCw } from "lucide-react";
import { useAppContext } from "@/Development/context/AppContext.jsx";
import { useEffect, useState } from "react";
import { Button } from "@/Development/components/ui/button.tsx";
import { toast } from "sonner";
import VacantIcon from "@/Development/assets/Icons/vacant-svg.svg";
import ReservedIcon from "@/Development/assets/Icons/rederved-svg.svg";
import OccupiedIcon from "@/Development/assets/Icons/occupied-svg.svg";
import DirtyIcon from "@/Development/assets/Icons/dirty_svg.svg";
import MaintenanceIcon from "@/Development/assets/Icons/maintanance-svg.svg";
import RoomServiceDialog from "@/Development/pages/Dashboard/Housekeeping/RoomStatusList/RoomServiceDialog.jsx";

const roomStatus = [
  "Vacant",
  "Occupied",
  "Dirty",
  "Reserved",
  "Out of Order",
  "Under Maintenance",
  "Maintenance",
  "Direct",
];

const statusStyles = {
  Vacant: {
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
  },
  Occupied: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  Dirty: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  Reserved: {
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
  },
  "Out of Order": {
    bg: "bg-gray-50",
    text: "text-gray-700",
    border: "border-gray-200",
  },
  // Support aliases from notes: "Direct" -> "Dirty", "Maintenance" -> "Under Maintenance"
  "Direct": { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  "Maintenance": {
    bg: "bg-yellow-50",
    text: "text-yellow-700",
    border: "border-yellow-200",
  },
  "Under Maintenance": {
    bg: "bg-yellow-50",
    text: "text-yellow-700",
    border: "border-yellow-200",
  },
};

// Helper to convert epoch to YYYY-MM-DD
function formatEpochDate(epoch) {
  if (!epoch) return "N/A";
  const num = Number(epoch);
  if (isNaN(num) || num < 1000000000) return "N/A";
  try {
    // If epoch is in seconds, convert to ms
    const date = new Date(num > 1e12 ? num : num * 1000);
    if (isNaN(date.getTime())) return "N/A";
    return date.toISOString().slice(0, 10);
  } catch {
    return "N/A";
  }
}


const getStatusTheme = (status) => {
  switch (status) {
    case "Vacant":
      return {
        cardBg: "bg-[#065F46]",
        cardText: "text-white",
        cardBorder: "border-[#054c38]",
        subText: "text-[#D1FAE5]",
      };
    case "Reserved":
      return {
        cardBg: "bg-[#92400E]",
        cardText: "text-white",
        cardBorder: "border-[#78350f]",
        subText: "text-[#FEF9C3]",
      };
    case "Occupied":
      return {
        cardBg: "bg-[#3730A3]",
        cardText: "text-white",
        cardBorder: "border-[#2d2682]",
        subText: "text-[#E0E7FF]",
      };
    case "Dirty":
    case "Direct":
      return {
        cardBg: "bg-[#B91C1C]",
        cardText: "text-white",
        cardBorder: "border-[#991b1b]",
        subText: "text-[#FEE2E2]",
      };
    case "Under Maintenance":
    case "Maintenance":
      return {
        cardBg: "bg-[#C2410C]",
        cardText: "text-white",
        cardBorder: "border-[#9a3412]",
        subText: "text-[#FFE4B5]",
      };
    case "Out of Order":
      return {
        cardBg: "bg-gray-700",
        cardText: "text-white",
        cardBorder: "border-gray-800",
        subText: "text-gray-200",
      };
    default:
      return {
        cardBg: "bg-gray-600",
        cardText: "text-white",
        cardBorder: "border-gray-700",
        subText: "text-gray-200",
      };
  }
};

const getStatusIcon = (status) => {
  const iconClass =
    "w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center font-bold relative flex-shrink-0";

  switch (status) {
    case "Vacant":
      return (
        <div className={`${iconClass} bg-[#065F46]`}>
          <img src={VacantIcon} alt="Vacant" className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        </div>
      );
    case "Reserved":
      return (
        <div className={`${iconClass} bg-[#92400E]`}>
          <img src={ReservedIcon} alt="Reserved" className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        </div>
      );
    case "Occupied":
      return (
        <div className={`${iconClass} bg-[#3730A3]`}>
          <img src={OccupiedIcon} alt="Occupied" className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        </div>
      );
    case "Dirty":
    case "Direct":
      return (
        <div className={`${iconClass} bg-[#B91C1C]`}>
          <img src={DirtyIcon} alt="Dirty" className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        </div>
      );
    case "Under Maintenance":
    case "Maintenance":
      return (
        <div className={`${iconClass} bg-[#C2410C]`}>
          <img
            src={MaintenanceIcon}
            alt="Under Maintenance"
            className="w-3 h-3 sm:w-3.5 sm:h-3.5"
          />
        </div>
      );
    default:
      return <div className={`${iconClass} bg-gray-600 text-white text-xs`}>?</div>;
  }
};

const RoomStatusCard = ({ room = {}, booking, onCardClick }) => {
  const { updateRoomStatus, freeHold } = useAppContext();
  const [stat, setStat] = useState(room?.status || "Vacant");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isFreeing, setIsFreeing] = useState(false);
  const [showServiceDialog, setShowServiceDialog] = useState(false);

  const rawRoomNum = (room?.room_number ?? room?.roomNumber ?? room?.number ?? "").toString().trim();
  const roomNum = rawRoomNum || (room?.room_id ? String(room.room_id).slice(-4) : "N/A");
  const roomType = room?.room_type ?? room?.roomType ?? room?.type ?? "Standard";
  const roomFloor = room?.floor != null && String(room.floor).trim() !== "" ? `Floor ${room.floor}` : "";

  useEffect(() => {
    setStat(room?.status || "Vacant");
  }, [room?.status]);

  const handleStatusChange = async (value) => {
    setIsUpdating(true);
    setStat(value);
    try {
      await updateRoomStatus(room.room_id, value);
      toast.success(`Room ${roomNum} status updated to ${value}`);
    } catch (error) {
      console.error("Error updating room status:", error);
      toast.error(`Failed to update Room ${roomNum} status`);
      setStat(room?.status || "Vacant");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleFreeHold = async () => {
    if (!booking?.booking_id) return;

    setIsFreeing(true);
    try {
      await freeHold(booking.booking_id);
      toast.success(`Hold released on Room ${roomNum}`);
    } catch (error) {
      console.error("Error freeing hold:", error);
      toast.error(`Failed to release hold on Room ${roomNum}`);
    } finally {
      setIsFreeing(false);
    }
  };

  const theme = getStatusTheme(stat);
  const shouldShowHoldControls = booking && booking.hold !== false && (stat === "Occupied" || stat === "Reserved");
  const isOnHold = booking?.hold === true;
  const hasSpecialRequests = booking?.special_requests && booking.special_requests.trim() !== "";

  return (
    <div
      className={`${theme.cardBg} ${theme.cardBorder} border-2 rounded-lg p-2.5 relative flex flex-col min-w-[240px] min-h-[145px] cursor-pointer hover:shadow-xl transition-all shadow-md`}
      onClick={() => onCardClick(room, booking)}
    >
      {/* Room Header - High Contrast Title & Badges */}
      <div className="flex items-center justify-between mb-2 gap-1 min-w-0">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-extrabold text-white truncate leading-tight tracking-tight">
            Room {roomNum}
          </h3>
          <p className={`text-xs ${theme.subText} truncate font-semibold mt-0.5`}>
            {roomType}{roomFloor ? ` • ${roomFloor}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div
            className="px-2.5 py-0.5 rounded-full text-xs font-bold flex-shrink-0 shadow-xs border"
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.35)",
              color: "#ffffff",
              borderColor: "rgba(255, 255, 255, 0.35)"
            }}
          >
            {stat}
          </div>
          {getStatusIcon(stat)}
          {shouldShowHoldControls && (
            <div
              className="px-2 py-0.5 rounded-full text-xs font-bold flex-shrink-0 shadow-xs text-white"
              style={{
                backgroundColor: isOnHold ? "#ef4444" : "#f59e0b",
                borderColor: "rgba(255, 255, 255, 0.4)"
              }}
            >
              {isOnHold ? "Hold" : "Restricted"}
            </div>
          )}
        </div>
      </div>

      {/* Guest Info - Clear Semi-Transparent Panel (Only when Occupied or Reserved) */}
      {booking && (stat === "Occupied" || stat === "Reserved") && (
        <div 
          className="mb-2 p-2 rounded text-xs flex items-start justify-between border border-white/20 shadow-2xs"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.25)" }}
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-1">
              <Users className="w-3.5 h-3.5 text-white/90 flex-shrink-0" />
              <span className="font-bold text-white text-xs truncate">
                {booking.guest_name || "Guest"}
              </span>
            </div>
            <div className="text-white/90 text-[11px] space-y-0.5">
              <span className="block truncate font-medium">
                Check-in: {formatEpochDate(booking.checkin_date)}
              </span>
              <span className="block truncate font-medium">
                Check-out: {formatEpochDate(booking.checkout_date)}
              </span>
            </div>
          </div>
          {hasSpecialRequests && (
            <div
              className="px-2 py-0.5 rounded text-xs font-bold flex-shrink-0 bg-amber-300 text-amber-950 shadow-xs ml-1.5"
              title="Special Requests Available"
            >
              Requests
            </div>
          )}
        </div>
      )}

      {/* Controls: status dropdown and buttons */}
      <div
        className="flex flex-col gap-1.5 mt-auto pt-1"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Status dropdown and Free Hold button in a row */}
        <div className="flex gap-1.5 items-center">
          <div className="flex-1 min-w-0">
            <Select
              value={stat}
              onValueChange={handleStatusChange}
              disabled={isUpdating}
            >
              <SelectTrigger 
                className="h-8 text-xs px-2.5 w-full !bg-white !text-gray-900 border border-white font-bold rounded shadow-sm hover:!bg-gray-50 focus:ring-2 focus:ring-white"
                style={{ backgroundColor: "#ffffff", color: "#111827" }}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white text-gray-900 z-50 shadow-xl border border-gray-200">
                {roomStatus.map((status) => (
                  <SelectItem
                    key={status}
                    value={status}
                    disabled={stat === "Occupied" && status !== "Dirty"}
                    className="text-gray-900 font-semibold cursor-pointer py-1.5"
                  >
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Free Hold Button - show when hold is not explicitly false */}
          {shouldShowHoldControls && (
            <Button
              onClick={handleFreeHold}
              disabled={isFreeing}
              size="sm"
              variant="filled"
              className="text-xs px-2.5 h-8 flex-shrink-0 font-bold shadow-xs text-white border border-white/30"
              style={{
                backgroundColor: isOnHold ? "#dc2626" : "#059669",
                color: "#ffffff"
              }}
            >
              {isFreeing ? (
                <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
              ) : (
                <>
                  <Unlock className="w-3.5 h-3.5 mr-1 text-white" />
                  {isOnHold ? "Free Hold" : "Release"}
                </>
              )}
            </Button>
          )}
        </div>

        <RoomServiceDialog
          roomNumber={roomNum}
          booking={booking}
          open={showServiceDialog}
          setOpen={setShowServiceDialog}
        />
      </div>

      {/* Loading State */}
      {(isUpdating || isFreeing) && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-2xs flex items-center justify-center rounded-lg">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
        </div>
      )}
    </div>
  );
};

const RoomStatusList = () => {
  const { rooms, bookings, fetchRooms, fetchBookings } = useAppContext();
  const [roomBookingMap, setRoomBookingMap] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFloor, setSelectedFloor] = useState("all");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Ensure rooms and bookings are loaded on component mount
  useEffect(() => {
    fetchRooms();
    if (fetchBookings) fetchBookings();
  }, []);

  useEffect(() => {
    let map = {};
    for (let booking of (bookings || [])) {
      if (booking.status === "Checked-in") {
        const rawIds = Array.isArray(booking.room_id)
          ? booking.room_id
          : booking.room_id
          ? [booking.room_id]
          : [];
        rawIds.forEach((id) => {
          if (!id) return;
          const cleanId = String(id).trim();
          map[cleanId] = booking;
          const rObj = (rooms || []).find(
            (r) =>
              String(r.room_id).trim() === cleanId ||
              String(r.room_number).trim() === cleanId
          );
          if (rObj) {
            map[String(rObj.room_id).trim()] = booking;
            map[String(rObj.room_number).trim()] = booking;
          }
        });
        if (booking.room_number) {
          map[String(booking.room_number).trim()] = booking;
        }
      }
    }
    setRoomBookingMap(map);
  }, [bookings, rooms]);

  const [filters, setFilters] = useState({
    Vacant: true,
    Occupied: true,
    Dirty: true,
    Reserved: true,
    "Out of Order": true,
    "Under Maintenance": true,
  });

  // Get unique floors
  const safeList = Array.isArray(rooms) ? rooms.filter(Boolean) : [];
  const floors = [...new Set(safeList.map((room) => room?.floor).filter((f) => f !== undefined && f !== null && f !== ""))].sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }));

  // Handle room card click
  const handleRoomCardClick = (room, booking) => {
    setSelectedRoom(room);
    setSelectedBooking(booking);
    setSidebarOpen(true);
  };

  // Close sidebar
  const closeSidebar = () => {
    setSidebarOpen(false);
    setSelectedRoom(null);
    setSelectedBooking(null);
  };

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Refresh both rooms and bookings data
      await Promise.all([
        fetchRooms(),
        fetchBookings ? fetchBookings() : Promise.resolve(),
      ]);
      toast.success("Room statuses refreshed successfully");
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast.error("Failed to refresh room statuses");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Filter and sort rooms serially by room number
  const safeRooms = Array.isArray(rooms) ? rooms.filter(Boolean) : [];
  const filteredRooms = safeRooms
    .filter((room) => {
      if (!room) return false;
      const roomNumStr = String(room.room_number ?? room.roomNumber ?? room.number ?? "").trim();
      const roomTypeStr = String(room.room_type ?? room.roomType ?? room.type ?? "").toLowerCase().trim();
      const search = (searchTerm || "").toLowerCase().trim();

      const matchesSearch =
        !search ||
        roomNumStr.toLowerCase().includes(search) ||
        roomTypeStr.includes(search);

      const roomFloorStr = room.floor != null ? String(room.floor).trim() : "";
      const matchesFloor =
        selectedFloor === "all" || roomFloorStr === String(selectedFloor).trim();

      const roomStatusVal = room.status || "Vacant";
      const matchesStatus = filters[roomStatusVal] ?? true;

      return matchesSearch && matchesFloor && matchesStatus;
    })
    .sort((a, b) => {
      const numA = parseInt(String(a?.room_number ?? a?.roomNumber ?? a?.number ?? "").replace(/\D/g, ""), 10) || 0;
      const numB = parseInt(String(b?.room_number ?? b?.roomNumber ?? b?.number ?? "").replace(/\D/g, ""), 10) || 0;
      if (numA !== numB) return numA - numB;
      const strA = String(a?.room_number ?? a?.roomNumber ?? a?.number ?? "");
      const strB = String(b?.room_number ?? b?.roomNumber ?? b?.number ?? "");
      return strA.localeCompare(strB, undefined, { numeric: true });
    });

  // Compact statistics
  const stats = {
    total: safeRooms.length,
    vacant: safeRooms.filter((room) => (room?.status || "Vacant") === "Vacant").length,
    occupied: safeRooms.filter((room) => room?.status === "Occupied").length,
    dirty: safeRooms.filter((room) => room?.status === "Dirty" || room?.status === "Direct").length,
    reserved: safeRooms.filter((room) => room?.status === "Reserved").length,
    maintenance: safeRooms.filter(
      (room) => room?.status === "Under Maintenance" || room?.status === "Maintenance"
    ).length,
  };

  return (
    <div className="space-y-3 relative">
      {/* Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-base font-semibold text-gray-900">Room Status</h1>
          <p className="text-xs text-gray-500">
            Manage room statuses and services
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-8 px-3 text-xs flex items-center gap-1.5 font-medium border-gray-300 hover:bg-gray-100 shadow-2xs transition-all active:scale-95 cursor-pointer"
            title="Refresh room statuses and bookings"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                isRefreshing ? "animate-spin text-blue-600" : "text-gray-600"
              }`}
            />
            <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
          </Button>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search rooms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-6 pr-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Floor Filter */}
          <Select value={selectedFloor} onValueChange={setSelectedFloor}>
            <SelectTrigger className="w-20 h-7 text-xs">
              <SelectValue placeholder="Floor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {floors.map((floor) => (
                <SelectItem key={String(floor)} value={String(floor)}>
                  {floor}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
                <Filter className="w-3 h-3 mr-1" />
                Filter
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-40 p-2">
              <div className="space-y-1">
                <h4 className="text-xs font-medium text-gray-900">
                  Status Filter
                </h4>
                {roomStatus.map((status) => (
                  <div key={status} className="flex items-center gap-1">
                    <Checkbox
                      id={status}
                      checked={filters[status]}
                      onCheckedChange={(value) =>
                        setFilters({ ...filters, [status]: value })
                      }
                    />
                    <Label htmlFor={status} className="text-xs cursor-pointer">
                      {status}
                    </Label>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Responsive Compact Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
        <div className="bg-white border border-gray-200 rounded p-2 text-center shadow-xs">
          <div className="text-base font-extrabold text-gray-900">
            {stats.total}
          </div>
          <div className="text-xs text-gray-500 font-medium">Total</div>
        </div>
        <div className="bg-[#065F46] border border-emerald-800 rounded p-2 text-center shadow-xs text-white">
          <div className="text-base font-extrabold text-white">
            {stats.vacant}
          </div>
          <div className="text-xs text-[#D1FAE5] font-semibold">Vacant</div>
        </div>
        <div className="bg-[#3730A3] border border-indigo-800 rounded p-2 text-center shadow-xs text-white">
          <div className="text-base font-extrabold text-white">
            {stats.occupied}
          </div>
          <div className="text-xs text-[#E0E7FF] font-semibold">Occupied</div>
        </div>
        <div className="bg-[#B91C1C] border border-red-800 rounded p-2 text-center shadow-xs text-white">
          <div className="text-base font-extrabold text-white">
            {stats.dirty}
          </div>
          <div className="text-xs text-[#FEE2E2] font-semibold">Dirty</div>
        </div>
        <div className="bg-[#92400E] border border-amber-800 rounded p-2 text-center shadow-xs text-white">
          <div className="text-base font-extrabold text-white">
            {stats.reserved}
          </div>
          <div className="text-xs text-[#FEF9C3] font-semibold">Reserved</div>
        </div>
        <div className="bg-[#C2410C] border border-orange-800 rounded p-2 text-center shadow-xs text-white">
          <div className="text-base font-extrabold text-white">
            {stats.maintenance}
          </div>
          <div className="text-xs text-[#FFE4B5] font-semibold">Maintenance</div>
        </div>
      </div>

      {/* Rooms Grid - Dense */}
      <div className="bg-white border border-gray-200 rounded p-3">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-medium text-gray-900">
            Rooms ({filteredRooms.length})
          </h2>
          <p className="text-xs text-gray-500">
            {filteredRooms.length} of {rooms.length}
          </p>
        </div>

        {filteredRooms.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-xs text-gray-500">No rooms found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
            {filteredRooms.map((room) => (
              <RoomStatusCard
                key={room.room_id}
                room={room}
                booking={roomBookingMap[room.room_id]}
                onCardClick={handleRoomCardClick}
              />
            ))}
          </div>
        )}
      </div>

      {/* Right Sidebar for Room Details */}
      <div
        className={`fixed inset-0 z-50 overflow-hidden transition-all duration-300 ${
          sidebarOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/20 transition-opacity duration-300 ${
            sidebarOpen ? "bg-opacity-50" : "bg-opacity-0"
          }`}
          onClick={closeSidebar}
        />

        {/* Sidebar */}
        <div
          className={`absolute right-0 top-0 h-full w-96 bg-white shadow-xl transform transition-transform duration-300 ease-out ${
            sidebarOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Room {selectedRoom?.room_number} Details
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={closeSidebar}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Content */}
            <div
              className={`flex-1 overflow-y-auto p-4 space-y-4 transition-all duration-500 delay-100 ${
                sidebarOpen
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-4"
              }`}
            >
              {/* Room Info */}
              <div
                className={`bg-gray-50 rounded-lg p-3 transition-all duration-300 delay-200 ${
                  sidebarOpen
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-4"
                }`}
              >
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  Room Information
                </h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Room Number:</span>
                    <span className="font-medium">
                      {selectedRoom?.room_number}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Room Type:</span>
                    <span className="font-medium">
                      {selectedRoom?.room_type}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Floor:</span>
                    <span className="font-medium">{selectedRoom?.floor}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        statusStyles[selectedRoom?.status]?.bg || "bg-gray-50"
                      } ${
                        statusStyles[selectedRoom?.status]?.text ||
                        "text-gray-700"
                      }`}
                    >
                      {selectedRoom?.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Guest Info */}
              {selectedBooking && (
                <div
                  className={`bg-blue-50 rounded-lg p-3 transition-all duration-300 delay-300 ${
                    sidebarOpen
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-4"
                  }`}
                >
                  <h3 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    Guest Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Check-in:</span>
                      <span className="font-medium">
                        {formatEpochDate(selectedBooking.checkin_date)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Check-out:</span>
                      <span className="font-medium">
                        {formatEpochDate(selectedBooking.checkout_date)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Booking Type:</span>
                      <span className="font-medium">
                        {selectedBooking.booking_type}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Adults:</span>
                      <span className="font-medium">
                        {selectedBooking.no_of_adults}
                      </span>
                    </div>
                    {selectedBooking.no_of_children > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Children:</span>
                        <span className="font-medium">
                          {selectedBooking.no_of_children}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Special Requests */}
              {selectedBooking?.special_requests && (
                <div
                  className={`bg-yellow-50 border border-yellow-200 rounded-lg p-3 transition-all duration-300 delay-400 ${
                    sidebarOpen
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-4"
                  }`}
                >
                  <h3 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-yellow-600" />
                    Special Requests
                  </h3>
                  <div className="bg-white border border-yellow-200 rounded p-3">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {selectedBooking.special_requests}
                    </p>
                  </div>
                </div>
              )}

              {/* Additional Booking Details */}
              {selectedBooking && (
                <div
                  className={`bg-green-50 rounded-lg p-3 transition-all duration-300 delay-500 ${
                    sidebarOpen
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-4"
                  }`}
                >
                  <h3 className="text-sm font-medium text-gray-900 mb-2">
                    Additional Details
                  </h3>
                  <div className="space-y-1 text-sm">
                    {selectedBooking.remarks && (
                      <div>
                        <span className="text-gray-600 block">Remarks:</span>
                        <span className="text-gray-700">
                          {selectedBooking.remarks}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Booking Source:</span>
                      <span className="font-medium">
                        {selectedBooking.booking_source}
                      </span>
                    </div>
                    {selectedBooking.email && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email:</span>
                        <span className="font-medium">
                          {selectedBooking.email}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomStatusList;
