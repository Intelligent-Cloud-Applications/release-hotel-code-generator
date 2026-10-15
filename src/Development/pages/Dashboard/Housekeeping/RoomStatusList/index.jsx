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
import RoomServiceDialog from "@/Development/pages/Dashboard/Housekeeping/RoomStatusList/RoomServiceDialog.jsx";

const roomStatus = [
  "Vacant",
  "Occupied",
  "Dirty",
  "Reserved",
  "Out of Order",
  "Under Maintenance",
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

const RoomStatusCard = ({ room, booking, onCardClick }) => {
  const { updateRoomStatus, freeHold } = useAppContext();
  const [stat, setStat] = useState(room.status);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isFreeing, setIsFreeing] = useState(false);
  const [showServiceDialog, setShowServiceDialog] = useState(false);

  useEffect(() => {
    setStat(room.status);
  }, [room.status]);

  const handleStatusChange = async (value) => {
    setIsUpdating(true);
    setStat(value);
    try {
      await updateRoomStatus(room.room_id, value);
      toast.success(`Room ${room.room_number} status updated to ${value}`);
    } catch (error) {
      console.error("Error updating room status:", error);
      toast.error(`Failed to update Room ${room.room_number} status`);
      setStat(room.status);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleFreeHold = async () => {
    if (!booking?.booking_id) return;

    setIsFreeing(true);
    try {
      await freeHold(booking.booking_id);
      toast.success(`Hold released on Room ${room.room_number}`);
    } catch (error) {
      console.error("Error freeing hold:", error);
      toast.error(`Failed to release hold on Room ${room.room_number}`);
    } finally {
      setIsFreeing(false);
    }
  };

  const statusConfig = statusStyles[stat] || statusStyles["Vacant"];
  // Show hold controls when hold is not explicitly false (i.e., when hold is true or undefined)
  const shouldShowHoldControls = booking && booking.hold !== false && (stat === "Occupied" || stat === "Reserved");
  const isOnHold = booking?.hold === true;

  // Check if room has special requests for border styling
  const hasSpecialRequests =
    booking?.special_requests && booking.special_requests.trim() !== "";

  return (
    <div
      className={`bg-white border border-gray-200 rounded p-2 relative flex flex-col min-w-[240px] min-h-[140px] cursor-pointer hover:shadow-md transition-shadow`}
      onClick={() => onCardClick(room, booking)}
    >
      {/* Room Header - Compact */}
      <div className="flex items-center justify-between mb-1 gap-1 min-w-0">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-medium text-gray-900 truncate">
            Room {room.room_number}
          </h3>
          <p className="text-xs text-gray-500 truncate">
            {room.room_type} • Floor {room.floor}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <div
            className={`px-1.5 py-0.5 rounded text-xs font-medium flex-shrink-0 ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
          >
            {stat}
          </div>
          {shouldShowHoldControls && (
            <div
              className={`px-1.5 py-0.5 rounded text-xs font-medium flex-shrink-0 ${
                isOnHold
                  ? "bg-red-100 text-red-700 border border-red-200"
                  : "bg-orange-100 text-orange-700 border border-orange-200"
              }`}
            >
              {isOnHold ? "Hold" : "Restricted"}
            </div>
          )}
        </div>
      </div>

      {/* Guest Info - Ultra Compact (Only when Occupied or Reserved) */}
      {booking && (stat === "Occupied" || stat === "Reserved") && (
        <div className="mb-1 p-1 bg-gray-50 rounded text-xs flex items-start justify-between ">
          <div>
            <div className="flex items-center gap-1 mb-0.5">
              <Users className="w-3 h-3 text-gray-500 flex-shrink-0" />
              <span className="font-medium text-gray-700 truncate">
                {booking.guest_name || "Guest"}
              </span>
            </div>
            <div>
              <div className="text-gray-600 text-xs">
                <span className="block truncate">
                  Check-in: {formatEpochDate(booking.checkin_date)}
                </span>
                <span className="block truncate">
                  Check-out: {formatEpochDate(booking.checkout_date)}
                </span>
              </div>
            </div>
          </div>
          {hasSpecialRequests && (
            <div
              className="px-1.5 py-0.5 rounded text-xs font-medium flex-shrink-0 bg-yellow-100 text-yellow-700 border border-yellow-200 ml-2"
              title="Special Requests Available"
            >
              Requests
            </div>
          )}
        </div>
      )}

      {/* Controls: status dropdown and Free Hold button in a row */}
      <div
        className="flex flex-col gap-1 mt-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Status dropdown and Free Hold button in a row */}
        <div className="flex gap-1">
          <Select
            value={stat}
            onValueChange={handleStatusChange}
            disabled={isUpdating}
          >
            <SelectTrigger className="h-6 text-xs px-2 flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {roomStatus.map((status) => (
                <SelectItem
                  key={status}
                  value={status}
                  disabled={stat === "Occupied" && status !== "Dirty"}
                >
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Free Hold Button - show when hold is not explicitly false */}
          {shouldShowHoldControls && (
            <Button
              onClick={handleFreeHold}
              disabled={isFreeing}
              size="sm"
              variant="filled"
              className={`border border-green-500 text-xs px-2 flex-shrink-0 ${
                isOnHold
                  ? "bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                  : "bg-green-100 border-green-200 text-green-700 hover:bg-green-100"
              }`}
            >
              {isFreeing ? (
                <div
                  className={`animate-spin rounded-full h-3 w-3 border-b ${
                    isOnHold ? "border-red-600" : "border-orange-600"
                  }`}
                ></div>
              ) : (
                <>
                  <Unlock className="w-3 h-3 mr-1" />
                  {isOnHold ? "Free Hold" : "Release"}
                </>
              )}
            </Button>
          )}
        </div>

        <RoomServiceDialog
          roomNumber={room.room_number}
          booking={booking}
          open={showServiceDialog}
          setOpen={setShowServiceDialog}
        />
      </div>

      {/* Loading State */}
      {(isUpdating || isFreeing) && (
        <div className="absolute inset-0 bg-white/90 flex items-center justify-center rounded">
          <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-600"></div>
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
  const floors = [...new Set(rooms.map((room) => room.floor))].sort();

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

  // Filter rooms
  const filteredRooms = rooms.filter((room) => {
    const matchesSearch =
      room.room_number.toString().includes(searchTerm) ||
      room.room_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFloor =
      selectedFloor === "all" || room.floor.toString() === selectedFloor;
    const matchesStatus = filters[room.status];

    return matchesSearch && matchesFloor && matchesStatus;
  });

  // Compact statistics
  const stats = {
    total: rooms.length,
    vacant: rooms.filter((room) => room.status === "Vacant").length,
    occupied: rooms.filter((room) => room.status === "Occupied").length,
    dirty: rooms.filter((room) => room.status === "Dirty").length,
    reserved: rooms.filter((room) => room.status === "Reserved").length,
    maintenance: rooms.filter((room) => room.status === "Under Maintenance")
      .length,
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
                <SelectItem key={floor} value={floor.toString()}>
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
        <div className="bg-white border border-gray-200 rounded p-2 text-center">
          <div className="text-sm font-semibold text-gray-900">
            {stats.total}
          </div>
          <div className="text-xs text-gray-500">Total</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded p-2 text-center">
          <div className="text-sm font-semibold text-green-700">
            {stats.vacant}
          </div>
          <div className="text-xs text-green-600">Vacant</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded p-2 text-center">
          <div className="text-sm font-semibold text-blue-700">
            {stats.occupied}
          </div>
          <div className="text-xs text-blue-600">Occupied</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded p-2 text-center">
          <div className="text-sm font-semibold text-red-700">
            {stats.dirty}
          </div>
          <div className="text-xs text-red-600">Dirty</div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded p-2 text-center">
          <div className="text-sm font-semibold text-orange-700">
            {stats.reserved}
          </div>
          <div className="text-xs text-orange-600">Reserved</div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-center">
          <div className="text-sm font-semibold text-yellow-700">
            {stats.maintenance}
          </div>
          <div className="text-xs text-yellow-600">Maintenance</div>
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
