import { useEffect, useState, useMemo } from "react";
import { useAppContext } from "../../../context/AppContext.jsx";
import { useNavigate, useLocation } from "react-router";
import { Wifi, RefreshCw, AlertCircle, Calendar, User, Phone, Mail, Clock, Bed, X } from "lucide-react";

import VacantIcon from "../../../assets/Icons/vacant-svg.svg";
import ReservedIcon from "../../../assets/Icons/rederved-svg.svg";
import OccupiedIcon from "../../../assets/Icons/occupied-svg.svg";
import DirtyIcon from "../../../assets/Icons/dirty_svg.svg";
import MaintenanceIcon from "../../../assets/Icons/maintanance-svg.svg";
import { Button } from "../../../components/ui/button.js";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select.js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../../components/ui/dialog.js";

const RoomList = () => {
  const { rooms, fetchRooms, bookings = [], fetchBookings, guests = [], fetchGuests, error } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [pageLoading, setPageLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [dataFetched, setDataFetched] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedBookingModal, setSelectedBookingModal] = useState(null);

  // Date selection directly in Room List top bar (local date to prevent timezone shift)
  const formatLocalDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };
  const todayStr = useMemo(() => formatLocalDate(new Date()), []);
  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return formatLocalDate(d);
  }, []);
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const isToday = selectedDate === todayStr;

  const normalizeDate = (d) => {
    if (!d) return 0;
    if (typeof d === "string") {
      const trimmed = d.trim();
      if (!trimmed.includes("T") && !trimmed.includes("Z")) {
        const dmyMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
        if (dmyMatch) {
          const day = parseInt(dmyMatch[1], 10);
          const month = parseInt(dmyMatch[2], 10) - 1;
          const year = parseInt(dmyMatch[3], 10);
          return new Date(year, month, day, 0, 0, 0, 0).getTime();
        }
        const ymdMatch = trimmed.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
        if (ymdMatch) {
          const year = parseInt(ymdMatch[1], 10);
          const month = parseInt(ymdMatch[2], 10) - 1;
          const day = parseInt(ymdMatch[3], 10);
          return new Date(year, month, day, 0, 0, 0, 0).getTime();
        }
      }
    }
    let num = typeof d === "string" && !isNaN(Number(d)) ? Number(d) : d;
    if (typeof num === "number" && num > 0 && num < 10000000000) {
      num = num * 1000;
    }
    const dateObj = new Date(num);
    if (isNaN(dateObj.getTime())) return 0;
    return new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 0, 0, 0, 0).getTime();
  };

  const selectedDayTs = useMemo(() => normalizeDate(selectedDate), [selectedDate]);

  const getGuestDetails = (booking) => {
    if (!booking) return {};
    if (booking.full_name) {
      return {
        full_name: booking.full_name,
        mobile: booking.mobile,
        email: booking.email,
        company_name: booking.company_name,
      };
    }
    const guestObj = (guests || []).find(
      (g) =>
        g.guest_id === booking.guest_id ||
        g.id === booking.guest_id ||
        g._id === booking.guest_id
    );
    return guestObj || {};
  };

  const isBookingActiveOnDate = (b, targetDayTs) => {
    if (!b || !targetDayTs) return false;
    const st = String(b.status || "").toLowerCase().trim();
    // Exclude cancelled and checked-out bookings completely
    if (
      st.includes("cancel") ||
      st.includes("checkout") ||
      st.includes("checked-out") ||
      st === "checked out"
    ) {
      return false;
    }
    // Only active bookings (Checked-in or Reserved) can occupy/reserve a room
    if (b.status !== "Checked-in" && b.status !== "Reserved") {
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
    const targetId = String(room.room_id || "").toLowerCase().trim();
    const targetNum = String(room.room_number || "").toLowerCase().trim();

    const checkValue = (val) => {
      if (val === undefined || val === null || val === "" || val === "none") return false;
      if (Array.isArray(val)) return val.some(checkValue);
      if (typeof val === "object") {
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

  // Map each room to its active booking on the selected date
  const roomOccupancyMap = useMemo(() => {
    const activeBookings = (bookings || []).filter((b) =>
      isBookingActiveOnDate(b, selectedDayTs)
    );

    const map = {};
    const assignedBookingIds = new Set();

    // 1. Explicit room matches (room_id, room_number, rooms_config, rooms)
    (rooms || []).forEach((room) => {
      // If room is under maintenance, dirty, or out of order on today's view, it cannot be occupied
      if (
        isToday &&
        (room.status === "Under Maintenance" ||
          room.status === "Dirty" ||
          room.status === "Out of Order")
      ) {
        return;
      }

      const matchedBooking = activeBookings.find((b) => doesBookingMatchRoom(b, room));

      if (matchedBooking) {
        assignedBookingIds.add(matchedBooking.booking_id);
        const guest = getGuestDetails(matchedBooking);
        map[room.room_id] = {
          booking: matchedBooking,
          guestName:
            guest.full_name ||
            matchedBooking.full_name ||
            matchedBooking.guest_name ||
            "Guest",
          guestMobile: guest.mobile || matchedBooking.mobile || "",
          guestEmail: guest.email || matchedBooking.email || "",
          status: matchedBooking.status || "Reserved",
          isExplicit: true,
        };
      }
    });

    // 2. Unallocated bookings matching room category/type (only candidate rooms that are clean/vacant)
    const unassigned = activeBookings.filter(
      (b) => !assignedBookingIds.has(b.booking_id)
    );
    const unassignedRooms = (rooms || []).filter(
      (r) =>
        !map[r.room_id] &&
        (r.status === "Vacant" || r.status === "Clean")
    );

    unassigned.forEach((b) => {
      const bCat = (b.room_category || b.room_type || "").trim().toLowerCase();
      const candidateRoom = unassignedRooms.find(
        (r) =>
          !map[r.room_id] &&
          (r.room_type || "").trim().toLowerCase() === bCat
      );
      if (candidateRoom) {
        const guest = getGuestDetails(b);
        map[candidateRoom.room_id] = {
          booking: b,
          guestName:
            guest.full_name ||
            b.full_name ||
            b.guest_name ||
            "Guest",
          guestMobile: guest.mobile || b.mobile || "",
          guestEmail: guest.email || b.email || "",
          status: b.status || "Reserved",
          isExplicit: false,
        };
      }
    });

    return map;
  }, [rooms, bookings, guests, selectedDayTs, isToday]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setDataFetched(false);
        setInitialLoad(true);

        await fetchRooms();
        if (fetchBookings) await fetchBookings();
        if (fetchGuests) await fetchGuests();

        await new Promise((resolve) => setTimeout(resolve, 600));

        setDataFetched(true);
        setInitialLoad(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        setDataFetched(true);
        setInitialLoad(false);
      }
    };

    fetchData();
  }, []);

  const handleRefresh = async () => {
    try {
      setPageLoading(true);
      setDataFetched(false);
      setInitialLoad(true);

      await fetchRooms();
      if (fetchBookings) await fetchBookings();
      if (fetchGuests) await fetchGuests();

      setDataFetched(true);
      setInitialLoad(false);
      setPageLoading(false);
    } catch (err) {
      console.error("Error refreshing data:", err);
      setDataFetched(true);
      setInitialLoad(false);
      setPageLoading(false);
    }
  };

  const getRoomStatus = (room) => {
    // If today, maintenance/dirty/out of order always take precedence
    if (isToday) {
      if (
        room.status === "Under Maintenance" ||
        room.status === "Dirty" ||
        room.status === "Out of Order"
      ) {
        return room.status;
      }
    }

    const bookingInfo = roomOccupancyMap[room.room_id];
    if (bookingInfo) {
      if (bookingInfo.status === "Checked-in") {
        return "Occupied";
      }
      if (bookingInfo.status === "Reserved") {
        return "Reserved";
      }
    }

    if (room.status === "Vacant" || room.status === "Clean") {
      return "Vacant";
    }

    return room.status || "Vacant";
  };

  // Filter and sort rooms based on selected status and room number
  const filteredAndSortedRooms = rooms
    .map((room) => {
      const status = getRoomStatus(room);
      const isOccupiedOrReserved = status === "Occupied" || status === "Reserved";
      return {
        ...room,
        status: status,
        bookingInfo: isOccupiedOrReserved ? (roomOccupancyMap[room.room_id] || null) : null,
      };
    })
    .filter((room) => {
      if (statusFilter === "all") return true;
      return room.status === statusFilter;
    })
    .sort((a, b) => parseInt(a.room_number) - parseInt(b.room_number));

  // Get room counts for each status
  const getRoomCounts = () => {
    const counts = {
      all: rooms.length,
      Vacant: 0,
      Reserved: 0,
      Occupied: 0,
      Dirty: 0,
      "Under Maintenance": 0,
    };

    rooms.forEach((room) => {
      const status = getRoomStatus(room);
      if (counts.hasOwnProperty(status)) {
        counts[status]++;
      }
    });

    return counts;
  };

  const roomCounts = getRoomCounts();

  return (
    <>
      {/* Header with date selector, filter, and refresh */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 px-2">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-800">Rooms</h2>

          {/* Online indicator */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-green-600">
              <Wifi className="h-4 w-4" />
              <span className="text-sm">Online</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Date Selector */}
          <div className="flex items-center gap-1.5 border border-gray-300 rounded-md px-2.5 py-1 bg-white h-9 text-sm shadow-2xs">
            <Calendar className="h-4 w-4 text-gray-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-sm border-0 bg-transparent focus:outline-none text-gray-700 cursor-pointer"
              title="Filter room status and view bookings by date"
            />
            <button
              type="button"
              onClick={() => setSelectedDate(todayStr)}
              className={`text-xs px-2 py-0.5 rounded font-medium transition-colors cursor-pointer ${
                isToday
                  ? "bg-gray-800 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
              title="View today's rooms"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setSelectedDate(tomorrowStr)}
              className={`text-xs px-2 py-0.5 rounded font-medium transition-colors cursor-pointer ${
                selectedDate === tomorrowStr
                  ? "bg-purple-600 text-white"
                  : "text-purple-700 hover:bg-purple-50"
              }`}
              title="View tomorrow's bookings"
            >
              Tomorrow
            </button>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Rooms ({roomCounts.all})</SelectItem>
                <SelectItem value="Vacant">Vacant ({roomCounts.Vacant})</SelectItem>
                <SelectItem value="Reserved">Reserved ({roomCounts.Reserved})</SelectItem>
                <SelectItem value="Occupied">Occupied ({roomCounts.Occupied})</SelectItem>
                <SelectItem value="Dirty">Dirty ({roomCounts.Dirty})</SelectItem>
                <SelectItem value="Under Maintenance">
                  Maintenance ({roomCounts["Under Maintenance"]})
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleRefresh}
            disabled={pageLoading}
            className="flex items-center gap-2 h-9"
          >
            <RefreshCw
              className={`h-4 w-4 ${pageLoading ? "animate-spin" : ""}`}
            />
            {pageLoading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 px-2">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-red-800 mb-1">
                  Error Loading Rooms
                </h4>
                <p className="text-sm text-red-700 mb-3">{error}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => window.location.reload()}
                    className="px-3 py-1.5 bg-red-600 text-white text-xs rounded-md hover:bg-red-700"
                  >
                    Retry
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Refreshing loader */}
      {pageLoading && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500"></div>
          <span className="ml-2 text-sm text-gray-600">Refreshing rooms...</span>
        </div>
      )}

      {/* Rooms Grid */}
      <div>
        <div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2 max-h-[calc(100vh-16rem)] overflow-y-auto px-2 custom-scrollbar"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "#9ca3af #f3f4f6",
          }}
        >
          <style
            dangerouslySetInnerHTML={{
              __html: `
              .custom-scrollbar::-webkit-scrollbar {
                width: 8px;
              }
              .custom-scrollbar::-webkit-scrollbar-track {
                background: #f3f4f6;
                border-radius: 4px;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb {
                background: #9ca3af;
                border-radius: 4px;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background: #6b7280;
              }
            `,
            }}
          />
          {filteredAndSortedRooms.map((room) => (
            <RoomCard
              key={room.room_id}
              room={room}
              bookingInfo={room.bookingInfo}
              isLoading={initialLoad}
              onClick={(roomId) => {
                const clickedRoom = rooms.find(
                  (r) =>
                    r.room_id === roomId || String(r.room_id) === String(roomId)
                );
                const info = roomOccupancyMap[roomId];
                if (info && info.booking) {
                  setSelectedBookingModal({
                    room: clickedRoom || room,
                    bookingInfo: info,
                  });
                }
              }}
              onDoubleClick={(roomId) => {
                const clickedRoom = rooms.find(
                  (r) =>
                    r.room_id === roomId || String(r.room_id) === String(roomId)
                );
                const currentStatus = getRoomStatus(clickedRoom || room);
                const info = roomOccupancyMap[roomId];

                if (info && info.booking) {
                  setSelectedBookingModal({
                    room: clickedRoom || room,
                    bookingInfo: info,
                  });
                } else if (
                  clickedRoom &&
                  (currentStatus === "Vacant" || currentStatus === "Clean")
                ) {
                  if (isToday) {
                    const isFrontDesk = location.pathname.includes("/frontdesk");
                    const checkInPath = isFrontDesk
                      ? `/dashboard/frontdesk/check_in?room_id=${roomId}`
                      : `/dashboard/registrations/check_in?room_id=${roomId}`;
                    navigate(checkInPath);
                  } else {
                    navigate(
                      `/dashboard/frontdesk/new_booking?checkin_date=${selectedDayTs}&room_number=${clickedRoom.room_number}`
                    );
                  }
                }
              }}
            />
          ))}
        </div>

        {/* No rooms message */}
        {filteredAndSortedRooms.length === 0 &&
          !pageLoading &&
          dataFetched &&
          !initialLoad && (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">
                {rooms.length === 0
                  ? "No rooms found"
                  : `No ${statusFilter.toLowerCase()} rooms found`}
              </p>
              <p className="text-sm">
                {rooms.length === 0
                  ? "No rooms are currently available."
                  : `No rooms with "${statusFilter}" status are currently available.`}
              </p>
            </div>
          )}

        {/* Skeleton rooms */}
        {rooms.length === 0 && initialLoad && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="bg-gray-200 h-20 sm:h-24 md:h-28 lg:h-[7rem] border border-gray-300 rounded-lg p-1 sm:p-2 animate-pulse"
              >
                <div className="h-full flex flex-col justify-between">
                  <div className="w-6 h-6 bg-gray-300 rounded-full ml-auto"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-300 rounded w-16"></div>
                    <div className="h-4 bg-gray-300 rounded w-20"></div>
                    <div className="h-3 bg-gray-300 rounded w-24"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Booking Details Modal on click */}
      {selectedBookingModal && (
        <Dialog
          open={Boolean(selectedBookingModal)}
          onOpenChange={(open) => !open && setSelectedBookingModal(null)}
        >
          <DialogContent className="max-w-md bg-white p-6 rounded-lg shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold flex items-center justify-between">
                <span>
                  Room {selectedBookingModal.room.room_number} ({selectedBookingModal.room.room_type})
                </span>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                    selectedBookingModal.bookingInfo.status === "Occupied" ||
                    selectedBookingModal.bookingInfo.status === "Checked-in"
                      ? "bg-indigo-100 text-indigo-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {selectedBookingModal.bookingInfo.status}
                </span>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 py-3 text-sm border-t border-b my-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 flex items-center gap-1.5">
                  <User className="h-4 w-4 text-gray-400" /> Guest Name:
                </span>
                <span className="font-semibold text-gray-800">
                  {selectedBookingModal.bookingInfo.guestName}
                </span>
              </div>

              {selectedBookingModal.bookingInfo.guestMobile && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 flex items-center gap-1.5">
                    <Phone className="h-4 w-4 text-gray-400" /> Phone:
                  </span>
                  <span className="font-medium text-gray-800">
                    {selectedBookingModal.bookingInfo.guestMobile}
                  </span>
                </div>
              )}

              {selectedBookingModal.bookingInfo.guestEmail && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 flex items-center gap-1.5">
                    <Mail className="h-4 w-4 text-gray-400" /> Email:
                  </span>
                  <span className="font-medium text-gray-800">
                    {selectedBookingModal.bookingInfo.guestEmail}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-gray-500 flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-gray-400" /> Check-in:
                </span>
                <span className="font-medium text-gray-800">
                  {selectedBookingModal.bookingInfo.booking?.checkin_date
                    ? new Date(
                        Number(
                          selectedBookingModal.bookingInfo.booking.checkin_date
                        ) ||
                          selectedBookingModal.bookingInfo.booking.checkin_date
                      ).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "N/A"}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-500 flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-gray-400" /> Check-out:
                </span>
                <span className="font-medium text-gray-800">
                  {selectedBookingModal.bookingInfo.booking?.checkout_date
                    ? new Date(
                        Number(
                          selectedBookingModal.bookingInfo.booking.checkout_date
                        ) ||
                          selectedBookingModal.bookingInfo.booking.checkout_date
                      ).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "N/A"}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-500">Booking ID:</span>
                <span className="font-mono text-xs text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                  {selectedBookingModal.bookingInfo.booking?.booking_id || "N/A"}
                </span>
              </div>
            </div>

            <DialogFooter className="flex flex-row justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const bId =
                    selectedBookingModal.bookingInfo.booking?.booking_id || "";
                  setSelectedBookingModal(null);
                  navigate(
                    `/dashboard/frontdesk/cancel_booking?search=${encodeURIComponent(
                      bId
                    )}`
                  );
                }}
              >
                View in Cancel/Amend
              </Button>
              <Button
                size="sm"
                onClick={() => setSelectedBookingModal(null)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

// Reusable Room Card (100% preserves original styling & dimensions)
const RoomCard = ({ room, bookingInfo, isLoading, onClick, onDoubleClick }) => {
  const getStatusIcon = (status, isLoading = false) => {
    const iconClass =
      "w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center font-bold relative";

    if (isLoading) {
      return (
        <div className={`${iconClass} bg-gray-300 animate-pulse`}>
          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-400 rounded"></div>
        </div>
      );
    }

    switch (status) {
      case "Vacant":
        return (
          <div className={`${iconClass} bg-[#065F46]`}>
            <img src={VacantIcon} alt="Vacant" className="w-3 h-3 sm:w-4 sm:h-4" />
          </div>
        );
      case "Reserved":
        return (
          <div className={`${iconClass} bg-[#92400E]`}>
            <img src={ReservedIcon} alt="Reserved" className="w-3 h-3 sm:w-4 sm:h-4" />
          </div>
        );
      case "Occupied":
        return (
          <div className={`${iconClass} bg-[#3730A3]`}>
            <img src={OccupiedIcon} alt="Occupied" className="w-3 h-3 sm:w-4 sm:h-4" />
          </div>
        );
      case "Dirty":
        return (
          <div className={`${iconClass} bg-[#B91C1C]`}>
            <img src={DirtyIcon} alt="Dirty" className="w-3 h-3 sm:w-4 sm:h-4" />
          </div>
        );
      case "Under Maintenance":
        return (
          <div className={`${iconClass} bg-[#C2410C]`}>
            <img
              src={MaintenanceIcon}
              alt="Under Maintenance"
              className="w-3 h-3 sm:w-4 sm:h-4"
            />
          </div>
        );
      default:
        return <div className={`${iconClass} bg-gray-400`}>?</div>;
    }
  };

  const getStatusBackground = (status) => {
    switch (status) {
      case "Vacant":
        return "bg-[#065F46] text-[#D1FAE5]";
      case "Reserved":
        return "bg-[#92400E] text-[#FEF9C3]";
      case "Occupied":
        return "bg-[#3730A3] text-[#E0E7FF]";
      case "Dirty":
        return "bg-[#B91C1C] text-[#FEE2E2]";
      case "Under Maintenance":
        return "bg-[#C2410C] text-[#FFE4B5]";
      default:
        return "bg-gray-400 text-white";
    }
  };

  const getStatusText = (status, isLoading = false) => {
    if (isLoading) return null;

    switch (status) {
      case "Vacant":
        return "Vacant & Clean";
      case "Reserved":
        return "Reserved";
      case "Occupied":
        return "Occupied";
      case "Under Maintenance":
        return "Under Maintenance";
      case "Dirty":
        return "Dirty";
      default:
        return status;
    }
  };

  const handleDoubleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDoubleClick) {
      onDoubleClick(room.room_id);
    }
  };

  const handleClick = (e) => {
    if (bookingInfo && onClick) {
      e.preventDefault();
      onClick(room.room_id);
    }
  };

  const bgClass = isLoading ? "bg-gray-100" : getStatusBackground(room.status);
  const cursorClass = !isLoading ? "cursor-pointer hover:shadow-lg" : "";
  const tooltipText = bookingInfo?.guestName
    ? `Booked by ${bookingInfo.guestName} (Click for details)`
    : !isLoading && (room.status === "Vacant" || room.status === "Clean")
    ? "Double-click to check-in / book"
    : "";

  return (
    <div
      className={`${bgClass} ${cursorClass} h-20 sm:h-24 md:h-28 lg:h-[7rem] border border-gray-300 rounded-lg p-1 sm:p-2 hover:shadow-md transition-shadow relative min-w-0`}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      title={tooltipText}
    >
      {/* Status Icon */}
      <div className="absolute top-1 right-1">
        {getStatusIcon(room.status, isLoading)}
      </div>

      {/* Room Number */}
      {isLoading ? (
        <div className="h-3 bg-gray-300 rounded animate-pulse w-16 mb-1"></div>
      ) : (
        <div className="text-xs mb-1 truncate">Room {room.room_number}</div>
      )}

      {/* Room Type */}
      {isLoading ? (
        <div className="h-4 bg-gray-300 rounded animate-pulse w-20 mb-1"></div>
      ) : (
        <div className="font-bold mb-1 text-xs sm:text-sm truncate">
          {room.room_type}
        </div>
      )}

      {/* Status / Guest Name and Floor */}
      <div className="text-xs flex items-center gap-1 flex-row flex-wrap">
        {isLoading ? (
          <div className="h-3 bg-gray-300 rounded animate-pulse w-16"></div>
        ) : (
          <div
            className="truncate text-xs font-semibold max-w-[85px]"
            title={bookingInfo?.guestName || getStatusText(room.status)}
          >
            {bookingInfo?.guestName
              ? bookingInfo.guestName
              : getStatusText(room.status)}
          </div>
        )}
        <span
          className={`h-1 w-1 rounded-full bg-gray-400 inline-block flex-shrink-0 ${
            isLoading ? "invisible" : ""
          }`}
        ></span>
        {isLoading ? (
          <div className="h-3 bg-gray-300 rounded animate-pulse w-12"></div>
        ) : (
          <div className="truncate text-xs">Floor {room.floor}</div>
        )}
      </div>
    </div>
  );
};

export default RoomList;