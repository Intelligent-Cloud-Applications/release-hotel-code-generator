import React, { useState, useMemo, useEffect } from "react";
import { useAppContext } from "../../../context/AppContext.jsx";
import { Button } from "../../../components/ui/button.js";
import { Input } from "../../../components/ui/input.js";
import { Label } from "../../../components/ui/label.js";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card.js";
import { Badge } from "../../../components/ui/badge.js";
import {
  Calendar,
  User,
  Phone,
  Bed,
  Users,
  Building,
  PlusCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Eye,
} from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

const AvailabilityForecaster = () => {
  const navigate = useNavigate();
  const {
    rooms = [],
    bookings = [],
    guests = [],
    fetchRooms,
    fetchBookings,
    fetchGuests,
  } = useAppContext();

  const [forecastDays, setForecastDays] = useState(14); // 7, 14, 30
  const [selectedClass, setSelectedClass] = useState("ALL");
  const [selectedDateStr, setSelectedDateStr] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Initial fetch
  useEffect(() => {
    if (fetchRooms) fetchRooms();
    if (fetchBookings) fetchBookings();
    if (fetchGuests) fetchGuests();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (fetchRooms) await fetchRooms();
      if (fetchBookings) await fetchBookings();
      if (fetchGuests) await fetchGuests();
      toast.success("Room availability and bookings refreshed");
    } catch (e) {
      toast.error("Failed to refresh data");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Distinct room classes available in the hotel
  const roomClasses = useMemo(() => {
    const dynamicTypes = (rooms || [])
      .map((r) => r.room_type)
      .filter((t) => Boolean(t && typeof t === "string" && t.trim().length > 0));
    const set = new Set(dynamicTypes);
    if (set.size === 0) {
      return ["Standard", "Deluxe", "Suite", "Executive"];
    }
    return Array.from(set);
  }, [rooms]);

  // Compute total inventory capacity per room class
  const classInventoryCounts = useMemo(() => {
    const map = {};
    roomClasses.forEach((cls) => {
      map[cls] = 0;
    });

    (rooms || []).forEach((r) => {
      const type = r.room_type || "Standard";
      map[type] = (map[type] || 0) + 1;
    });

    return map;
  }, [rooms, roomClasses]);

  const totalPhysicalRooms = rooms?.length || 0;

  // Helper: Normalize any date representation to start of day in milliseconds
  const normalizeDate = (d) => {
    if (!d) return 0;
    const numeric = typeof d === "string" && !isNaN(Number(d)) ? Number(d) : d;
    const dateObj = new Date(numeric);
    if (isNaN(dateObj.getTime())) return 0;
    dateObj.setHours(0, 0, 0, 0);
    return dateObj.getTime();
  };

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const numeric =
      typeof dateString === "string" && !isNaN(Number(dateString))
        ? Number(dateString)
        : dateString;
    const date = new Date(numeric);
    if (isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Get guest details for a booking
  const getGuestDetails = (booking) => {
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

  // Check if a booking is active on a specific target date
  const isBookingActiveOnDate = (b, targetDayTimestamp) => {
    const st = String(b.status || "").toLowerCase();
    if (st.includes("cancel") || st === "checked-out") {
      return false;
    }

    const cinTime = normalizeDate(b.checkin_date);
    const coutTime = normalizeDate(b.checkout_date);

    if (!cinTime) return false;
    if (cinTime === coutTime) {
      return targetDayTimestamp === cinTime;
    }
    return targetDayTimestamp >= cinTime && targetDayTimestamp < coutTime;
  };

  // Date navigation helpers
  const handleDayShift = (days) => {
    const d = new Date(selectedDateStr);
    d.setDate(d.getDate() + days);
    setSelectedDateStr(d.toISOString().split("T")[0]);
  };

  const handleSetToday = () => {
    const today = new Date();
    setSelectedDateStr(today.toISOString().split("T")[0]);
  };

  const handleSetTomorrow = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSelectedDateStr(tomorrow.toISOString().split("T")[0]);
  };

  // Generate future date slots starting today
  const forecastDateList = useMemo(() => {
    const list = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < forecastDays; i++) {
      const d = new Date(today.getTime() + i * 24 * 60 * 60 * 1000);
      const isoStr = d.toISOString().split("T")[0];
      list.push({
        dateObj: d,
        isoStr,
        timestamp: d.getTime(),
        dayName: d.toLocaleDateString("en-IN", { weekday: "short" }),
        formatted: d.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
        }),
      });
    }
    return list;
  }, [forecastDays]);

  // Calculate forecast metrics per date and room class
  const forecastMetrics = useMemo(() => {
    const results = [];

    forecastDateList.forEach((dateSlot) => {
      const activeBookings = bookings.filter((b) =>
        isBookingActiveOnDate(b, dateSlot.timestamp)
      );

      const targetClasses =
        selectedClass === "ALL" ? roomClasses : [selectedClass];

      targetClasses.forEach((cls) => {
        const physicalCapacity = classInventoryCounts[cls] || 0;

        const classBookings = activeBookings.filter((b) => {
          const bClass = b.room_category || b.room_type || "Standard";
          return bClass.toLowerCase() === cls.toLowerCase();
        });

        let totalRoomsBooked = 0;
        let groupRoomsBooked = 0;

        classBookings.forEach((b) => {
          const numRooms = Math.max(
            1,
            parseInt(b.no_of_rooms || b.number_of_rooms, 10) ||
              (Array.isArray(b.room_id) ? b.room_id.length : 1)
          );
          totalRoomsBooked += numRooms;

          if (numRooms > 1 || Boolean(b.company_id || b.company_name)) {
            groupRoomsBooked += numRooms;
          }
        });

        const netAvailable = Math.max(0, physicalCapacity - totalRoomsBooked);

        let statusBadgeColor = "bg-green-100 text-green-800 border-green-300";
        let statusLabel = "Available";

        if (totalRoomsBooked > physicalCapacity) {
          statusBadgeColor = "bg-red-100 text-red-800 border-red-300";
          statusLabel = "Overbooked";
        } else if (totalRoomsBooked === physicalCapacity && physicalCapacity > 0) {
          statusBadgeColor = "bg-orange-100 text-orange-800 border-orange-300";
          statusLabel = "Fully Booked";
        } else if (netAvailable <= 2 && physicalCapacity > 2) {
          statusBadgeColor = "bg-amber-100 text-amber-800 border-amber-300";
          statusLabel = "Fast Filling";
        }

        results.push({
          dateSlot,
          roomClass: cls,
          physicalCapacity,
          totalRoomsBooked,
          groupRoomsBooked,
          netAvailable,
          statusBadgeColor,
          statusLabel,
        });
      });
    });

    return results;
  }, [
    forecastDateList,
    bookings,
    selectedClass,
    roomClasses,
    classInventoryCounts,
  ]);

  // Selected date inspector
  const selectedDateInspector = useMemo(() => {
    const targetSlot = forecastDateList.find(
      (slot) => slot.isoStr === selectedDateStr
    ) || {
      dateObj: new Date(selectedDateStr),
      isoStr: selectedDateStr,
      timestamp: normalizeDate(selectedDateStr),
      dayName: new Date(selectedDateStr).toLocaleDateString("en-IN", {
        weekday: "short",
      }),
      formatted: new Date(selectedDateStr).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      }),
    };

    const itemsForDate = forecastMetrics.filter(
      (m) => m.dateSlot.isoStr === selectedDateStr
    );

    const totalCap =
      itemsForDate.length > 0
        ? itemsForDate.reduce((s, m) => s + m.physicalCapacity, 0)
        : selectedClass === "ALL"
        ? totalPhysicalRooms
        : classInventoryCounts[selectedClass] || 0;

    const totalBooked = itemsForDate.reduce((s, m) => s + m.totalRoomsBooked, 0);
    const totalGroup = itemsForDate.reduce((s, m) => s + m.groupRoomsBooked, 0);
    const totalNetAvail = itemsForDate.reduce((s, m) => s + m.netAvailable, 0);

    return {
      slot: targetSlot,
      items: itemsForDate,
      totalCap,
      totalBooked,
      totalGroup,
      totalNetAvail,
    };
  }, [
    selectedDateStr,
    forecastDateList,
    forecastMetrics,
    selectedClass,
    totalPhysicalRooms,
    classInventoryCounts,
  ]);

  // Active bookings on the selected target date
  const bookingsOnSelectedDate = useMemo(() => {
    const targetTs = normalizeDate(selectedDateStr);
    return (bookings || []).filter((b) => {
      const isActive = isBookingActiveOnDate(b, targetTs);
      if (!isActive) return false;
      if (selectedClass === "ALL") return true;
      const bClass = b.room_category || b.room_type || "Standard";
      return bClass.toLowerCase() === selectedClass.toLowerCase();
    });
  }, [bookings, selectedDateStr, selectedClass]);

  // Room-by-room status on selected date (Which Room is What)
  const roomOccupancyOnDate = useMemo(() => {
    const targetTs = normalizeDate(selectedDateStr);
    const activeOnDate = (bookings || []).filter((b) =>
      isBookingActiveOnDate(b, targetTs)
    );

    // Map room_id to booking details
    const roomBookingMap = {};
    activeOnDate.forEach((b) => {
      const guest = getGuestDetails(b);
      const guestName =
        guest.full_name || guest.name || guest.guest_name || "Guest";
      const guestMobile = guest.mobile || guest.phone || "";

      // Assigned room IDs
      const assignedIds = Array.isArray(b.room_id)
        ? b.room_id
        : b.room_id
        ? [b.room_id]
        : [];

      if (Array.isArray(b.rooms_config)) {
        b.rooms_config.forEach((rc) => {
          if (rc.room_id && rc.room_id !== "none") {
            assignedIds.push(rc.room_id);
          }
        });
      }

      assignedIds.forEach((rid) => {
        if (rid && rid !== "none") {
          roomBookingMap[rid] = {
            booking: b,
            guestName,
            guestMobile,
          };
        }
      });
    });

    const filteredRooms = (rooms || []).filter((r) => {
      if (selectedClass === "ALL") return true;
      return (r.room_type || "").toLowerCase() === selectedClass.toLowerCase();
    });

    return filteredRooms.map((r) => {
      const bookingInfo = roomBookingMap[r.room_id];
      return {
        room: r,
        isBooked: Boolean(bookingInfo),
        booking: bookingInfo?.booking,
        guestName: bookingInfo?.guestName,
        guestMobile: bookingInfo?.guestMobile,
      };
    });
  }, [rooms, bookings, guests, selectedDateStr, selectedClass]);

  const handleBookDate = (timestamp, roomCategory) => {
    const cat =
      roomCategory && roomCategory !== "ALL"
        ? roomCategory
        : roomClasses[0] || "Standard";
    navigate(
      `/dashboard/frontdesk/new_booking?checkin_date=${timestamp}&room_category=${encodeURIComponent(
        cat
      )}`
    );
  };

  return (
    <div className="space-y-4 p-3 sm:p-5 bg-gray-50 min-h-screen">
      {/* Top Banner & Control Bar */}
      <div className="bg-white border rounded-xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Room Availability
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">
                  Check available rooms, see who has booked on which date, and view room status.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="text-xs h-9 flex items-center gap-1.5"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`}
              />
              <span>Refresh</span>
            </Button>
            <Button
              size="sm"
              onClick={() => navigate("/dashboard/frontdesk/new_booking")}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-9 flex items-center gap-1.5"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>Create Booking</span>
            </Button>
          </div>
        </div>

        {/* Date Selector & Room Class Filter */}
        <div className="pt-3 border-t flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Quick Date Stepper & Picker */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-700">Date:</span>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleDayShift(-1)}
                className="h-8 w-8 p-0"
                title="Previous Day"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleSetToday}
                className="h-8 px-2 text-xs text-blue-600 hover:bg-blue-50"
              >
                Today
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleSetTomorrow}
                className="h-8 px-2 text-xs text-gray-600 hover:bg-gray-100"
              >
                Tomorrow
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleDayShift(1)}
                className="h-8 w-8 p-0"
                title="Next Day"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-1.5">
              <Input
                type="date"
                value={selectedDateStr}
                onChange={(e) => setSelectedDateStr(e.target.value)}
                className="h-8 text-xs w-36 bg-white font-medium"
              />
            </div>
          </div>

          {/* Room Class Quick Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-gray-700 mr-1">
              Category:
            </span>
            <Button
              type="button"
              variant={selectedClass === "ALL" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedClass("ALL")}
              className={`h-7 text-xs px-2.5 rounded-full ${
                selectedClass === "ALL"
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              All ({totalPhysicalRooms})
            </Button>
            {roomClasses.map((cls) => (
              <Button
                key={cls}
                type="button"
                variant={selectedClass === cls ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedClass(cls)}
                className={`h-7 text-xs px-2.5 rounded-full ${
                  selectedClass === cls
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                {cls} ({classInventoryCounts[cls] || 0})
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Selected Date Summary & Bookings (Direct & Visible) */}
      <div className="space-y-4">
        {/* Simple 3-Stat Summary Bar for the Selected Date */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white border rounded-lg p-3.5 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-xs text-gray-500 font-medium">Total Rooms ({selectedClass === "ALL" ? "All" : selectedClass})</span>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">
                {selectedDateInspector.totalCap}
              </p>
            </div>
            <Building className="h-6 w-6 text-gray-400" />
          </div>

          <div className="bg-white border rounded-lg p-3.5 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-xs text-gray-500 font-medium">Booked Rooms</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-2xl font-bold text-blue-700">
                  {selectedDateInspector.totalBooked}
                </span>
                {selectedDateInspector.totalGroup > 0 && (
                  <span className="text-xs text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded font-medium">
                    ({selectedDateInspector.totalGroup} group)
                  </span>
                )}
              </div>
            </div>
            <Users className="h-6 w-6 text-blue-500" />
          </div>

          <div className="bg-white border rounded-lg p-3.5 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-xs text-gray-500 font-medium">Available Rooms</span>
              <p
                className={`text-2xl font-bold mt-0.5 ${
                  selectedDateInspector.totalNetAvail > 0
                    ? "text-green-700"
                    : "text-red-600"
                }`}
              >
                {selectedDateInspector.totalNetAvail}
              </p>
            </div>
            <CheckCircle2 className="h-6 w-6 text-green-500" />
          </div>
        </div>

        {/* SECTION 1: ACTIVE BOOKINGS ON THIS DATE (Like Cancel Booking) */}
        <Card className="border bg-white shadow-xs">
          <CardHeader className="p-4 pb-3 flex flex-row items-center justify-between border-b">
            <div>
              <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                <span>
                  Bookings on{" "}
                  {selectedDateInspector.slot.dateObj.toLocaleDateString("en-IN", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
                <span className="text-xs text-gray-500 font-normal">
                  ({bookingsOnSelectedDate.length} {bookingsOnSelectedDate.length === 1 ? "reservation" : "reservations"})
                </span>
              </CardTitle>
            </div>

            <Button
              size="sm"
              onClick={() =>
                handleBookDate(
                  selectedDateInspector.slot.timestamp,
                  selectedClass === "ALL" ? roomClasses[0] : selectedClass
                )
              }
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 gap-1.5"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>Book for this Date</span>
            </Button>
          </CardHeader>

          <CardContent className="p-4 pt-3">
            {bookingsOnSelectedDate.length === 0 ? (
              <div className="py-8 text-center text-gray-500 space-y-2">
                <p className="text-sm font-medium">
                  No bookings found on this date.
                </p>
                <p className="text-xs text-gray-400">
                  All {selectedDateInspector.totalCap} rooms are vacant and ready to reserve.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    handleBookDate(
                      selectedDateInspector.slot.timestamp,
                      selectedClass === "ALL" ? roomClasses[0] : selectedClass
                    )
                  }
                  className="text-xs text-blue-600 border-blue-200 mt-2"
                >
                  + Create Booking for this Date
                </Button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {bookingsOnSelectedDate.map((booking) => {
                  const guest = getGuestDetails(booking);

                  // Extract assigned room numbers
                  const assignedRooms = [];
                  if (Array.isArray(booking.rooms_config)) {
                    booking.rooms_config.forEach((rc) => {
                      if (rc.room_number) assignedRooms.push(rc.room_number);
                      else if (rc.room_id) {
                        const r = rooms.find((rm) => rm.room_id === rc.room_id);
                        if (r?.room_number) assignedRooms.push(r.room_number);
                      }
                    });
                  }
                  if (assignedRooms.length === 0) {
                    const ids = Array.isArray(booking.room_id)
                      ? booking.room_id
                      : booking.room_id
                      ? [booking.room_id]
                      : [];
                    ids.forEach((id) => {
                      const r = rooms.find((rm) => rm.room_id === id);
                      if (r?.room_number) assignedRooms.push(r.room_number);
                    });
                  }

                  return (
                    <div
                      key={booking.booking_id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50/70 border border-gray-200 rounded-lg hover:bg-white hover:shadow-2xs transition-all gap-3"
                    >
                      {/* Guest Info */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-gray-900 text-xs truncate">
                            {guest.full_name ||
                              guest.name ||
                              guest.guest_name ||
                              "Guest Name Not Available"}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-500 mt-0.5">
                            <span className="font-mono bg-gray-200/70 px-1.5 py-0.2 rounded text-[10px] text-gray-700">
                              {booking.booking_id}
                            </span>
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3 text-gray-400" />
                              {guest.mobile || "N/A"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Stay Dates */}
                      <div className="flex items-center gap-3 text-xs">
                        <div className="text-left sm:text-center">
                          <div className="text-[10px] text-gray-400">Check-in</div>
                          <div className="font-medium text-gray-800">
                            {formatDate(booking.checkin_date)}
                          </div>
                        </div>
                        <span className="text-gray-300">→</span>
                        <div className="text-left sm:text-center">
                          <div className="text-[10px] text-gray-400">Check-out</div>
                          <div className="font-medium text-gray-800">
                            {formatDate(booking.checkout_date)}
                          </div>
                        </div>
                      </div>

                      {/* Room & Allocation */}
                      <div className="flex flex-col sm:text-right justify-center px-1 min-w-[130px]">
                        <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 inline-block w-fit sm:ml-auto">
                          {booking.room_category || booking.room_type || "Standard"}
                        </span>
                        <span className="text-[11px] text-gray-600 mt-0.5">
                          {assignedRooms.length > 0 ? (
                            <strong className="text-green-700">
                              Room {assignedRooms.join(", ")}
                            </strong>
                          ) : (
                            <span className="text-gray-400 italic">
                              Unassigned
                            </span>
                          )}{" "}
                          • {booking.no_of_rooms || 1} Room(s)
                        </span>
                      </div>

                      {/* Status & Actions */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <Badge
                          variant={
                            booking.status === "Reserved" ? "default" : "outline"
                          }
                          className="text-[11px]"
                        >
                          {booking.status || "Reserved"}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            navigate("/dashboard/frontdesk/amend_booking")
                          }
                          className="h-7 text-xs px-2 text-gray-700"
                        >
                          Amend
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* SECTION 2: WHICH ROOM IS WHAT (Room-by-Room Grid) */}
        <Card className="border bg-white shadow-xs">
          <CardHeader className="p-4 pb-2 border-b flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Bed className="h-4 w-4 text-blue-600" />
              <span>Room Status on this Date (Which Room is What)</span>
            </CardTitle>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-green-700">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block"></span>
                Available
              </span>
              <span className="flex items-center gap-1 text-red-700">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span>
                Booked
              </span>
            </div>
          </CardHeader>

          <CardContent className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
              {roomOccupancyOnDate.map(
                ({ room, isBooked, guestName, guestMobile }) => (
                  <div
                    key={room.room_id}
                    className={`p-2.5 rounded-lg border text-xs flex flex-col justify-between transition-all ${
                      isBooked
                        ? "bg-red-50/50 border-red-200"
                        : "bg-green-50/40 border-green-200 hover:bg-green-50"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-900 text-sm">
                          Room {room.room_number}
                        </span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-semibold border ${
                            isBooked
                              ? "bg-red-100 text-red-800 border-red-200"
                              : "bg-green-100 text-green-800 border-green-200"
                          }`}
                        >
                          {isBooked ? "Booked" : "Available"}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-500 mt-0.5 truncate font-medium">
                        {room.room_type || "Standard"}
                      </div>
                    </div>

                    {isBooked ? (
                      <div className="mt-2 pt-1.5 border-t border-red-100 text-[11px]">
                        <div className="font-semibold text-gray-800 truncate">
                          {guestName}
                        </div>
                        {guestMobile && (
                          <div className="text-gray-500 text-[10px] truncate">
                            {guestMobile}
                          </div>
                        )}
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          handleBookDate(
                            selectedDateInspector.slot.timestamp,
                            room.room_type || "Standard"
                          )
                        }
                        className="mt-2 h-6 text-[10px] text-green-700 hover:text-green-900 hover:bg-green-100 p-0 font-medium w-full justify-start"
                      >
                        + Book Room
                      </Button>
                    )}
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>

        {/* SECTION 3: UPCOMING DATES SCHEDULE */}
        <Card className="border bg-white shadow-xs">
          <CardHeader className="p-4 pb-2 border-b flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold text-gray-900">
              Upcoming {forecastDays}-Day Availability Schedule
            </CardTitle>
            <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg border">
              {[7, 14, 30].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setForecastDays(days)}
                  className={`px-2 py-0.5 text-xs rounded font-medium transition-colors ${
                    forecastDays === days
                      ? "bg-white text-blue-700 shadow-2xs font-semibold"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {days} Days
                </button>
              ))}
            </div>
          </CardHeader>

          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-gray-100/80 border-b text-[11px] font-semibold text-gray-700 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Room Category</th>
                  <th className="py-2.5 px-3 text-center">Total Rooms</th>
                  <th className="py-2.5 px-3 text-center">Booked</th>
                  <th className="py-2.5 px-3 text-center">Available</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {forecastMetrics.map((row, idx) => {
                  const isTargetDate = row.dateSlot.isoStr === selectedDateStr;

                  return (
                    <tr
                      key={idx}
                      className={`hover:bg-blue-50/40 transition-colors ${
                        isTargetDate ? "bg-blue-50/60 font-medium" : ""
                      }`}
                    >
                      {/* Date */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-gray-900">
                            {row.dateSlot.formatted}
                          </span>
                          <span className="text-gray-500 text-[11px]">
                            ({row.dateSlot.dayName})
                          </span>
                        </div>
                      </td>

                      {/* Room Category */}
                      <td className="py-2.5 px-3 whitespace-nowrap font-medium text-gray-800">
                        {row.roomClass}
                      </td>

                      {/* Total Rooms */}
                      <td className="py-2.5 px-3 text-center text-gray-700">
                        {row.physicalCapacity}
                      </td>

                      {/* Booked Rooms */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span className="font-semibold text-blue-700">
                          {row.totalRoomsBooked}
                        </span>
                        {row.groupRoomsBooked > 0 && (
                          <span className="ml-1 text-[10px] text-purple-700 bg-purple-50 px-1 py-0.2 rounded font-medium">
                            ({row.groupRoomsBooked} group)
                          </span>
                        )}
                      </td>

                      {/* Available to Sell */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-xs ${
                            row.netAvailable > 0
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {row.netAvailable}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${row.statusBadgeColor}`}
                        >
                          {row.statusLabel}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedDateStr(row.dateSlot.isoStr);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                            className="h-7 text-xs text-gray-600 hover:text-blue-700 hover:bg-blue-50"
                            title="View bookings for this date"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            <span>View</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              handleBookDate(row.dateSlot.timestamp, row.roomClass)
                            }
                            className="h-7 text-xs text-blue-600 hover:text-blue-900 hover:bg-blue-50 font-semibold"
                          >
                            Book Now
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AvailabilityForecaster;
