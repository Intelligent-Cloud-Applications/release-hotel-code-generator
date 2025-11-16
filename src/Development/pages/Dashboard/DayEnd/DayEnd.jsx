import React, { useState, useEffect } from "react";
import { useAppContext } from "../../../context/AppContext.jsx";
import SimpleApiButton from "../../../components/SimpleApiButton.jsx";
import { useLoading } from "../../../hooks/useLoading.js";
import { CompactLoader } from "../../../components/LoadingStates.jsx";
import {
  Calendar,
  Clock,
  Lock,
  AlertCircle,
  Info,
  CreditCard,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  UserCheck,
  UserX,
  BedDouble,
  Coins,
  MapPin,
  Building2,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/Development/components/ui/dialog.js";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/Development/components/ui/table.js";

import { Badge } from "@/Development/components/ui/badge.js";
import { Button } from "@/Development/components/ui/button.js";

/* ========= Date helpers ========= */

function toDate(value) {
  if (!value && value !== 0) return null;
  if (value instanceof Date) return value;
  if (typeof value === "number")
    return new Date(value > 1e10 ? value : value * 1000);
  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date(`${value}T00:00:00`);
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
      const [dd, mm, yyyy] = value.split("/").map(Number);
      return new Date(yyyy, mm - 1, dd);
    }
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function parseUSDateString(dateStr) {
  const parts = (dateStr || "").split("/").map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
  const [p1, p2, y] = parts;
  let d = new Date(y, p2 - 1, p1);
  if (!Number.isNaN(d.getTime())) return d;
  d = new Date(y, p1 - 1, p2);
  return Number.isNaN(d.getTime()) ? null : d;
}

function isSameDay(a, b) {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatDateForAPI(date) {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function toYMD(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function timestampToDate(ts) {
  return toDate(ts);
}

function daysBetween(start, end) {
  const a = toDate(start);
  const b = toDate(end);
  if (!a || !b) return 0;
  const a0 = new Date(a);
  a0.setHours(0, 0, 0, 0);
  const b0 = new Date(b);
  b0.setHours(0, 0, 0, 0);
  const diff = (b0 - a0) / (1000 * 60 * 60 * 24);
  return Math.max(1, Math.ceil(diff));
}

/* ========= Guest lookups from context.guests (guest_id) ========= */

function buildGuestIndex(guests = [], bills = []) {
  const idx = Object.create(null);

  // From guests array (primary source)
  guests.forEach((g) => {
    const id = g?.guest_id || g?.id;
    if (!id) return;
    idx[id] = {
      name: g?.full_name || g?.name || "",
      email: g?.email || "",
      mobile: g?.mobile || "",
    };
  });

  // Supplement with bills if they carry guestId (optional)
  bills.forEach((b) => {
    const bd = b?.bill;
    if (!bd) return;
    const gid = bd?.guestDetails?.guestId || bd?.bookingDetails?.guestId;
    if (!gid) return;
    idx[gid] = {
      ...(idx[gid] || {}),
      name: idx[gid]?.name || bd?.guestDetails?.guestName || "",
      email: idx[gid]?.email || bd?.guestDetails?.email || "",
      mobile:
        idx[gid]?.mobile ||
        bd?.guestDetails?.mobile ||
        bd?.billHeader?.contact ||
        "",
    };
  });

  return idx;
}

function getGuestIdFromBooking(b) {
  return (
    b?.guest_id ||
    b?.guestId ||
    b?.guest?.id ||
    b?.guestDetails?.guestId ||
    (Array.isArray(b?.guests) ? b.guests[0]?.id : "")
  );
}

function getGuestNameFromBooking(b, guestIndex) {
  const direct =
    b?.full_name ||
    b?.guestName ||
    b?.name ||
    b?.customer_name ||
    b?.primaryGuestName ||
    b?.guestDetails?.guestName ||
    b?.guest?.name ||
    (Array.isArray(b?.guests) ? b.guests[0]?.name : "");
  if (direct) return direct;
  const gid = getGuestIdFromBooking(b);
  if (gid && guestIndex?.[gid]?.name) return guestIndex[gid].name;
  return "Unknown Guest";
}

function getGuestEmailFromBooking(b, guestIndex) {
  const direct =
    b?.email ||
    b?.guestEmail ||
    b?.contact_email ||
    b?.customer_email ||
    b?.guestDetails?.email ||
    b?.guest?.email ||
    (Array.isArray(b?.guests) ? b.guests[0]?.email : "");
  if (direct) return direct;
  const gid = getGuestIdFromBooking(b);
  if (gid && guestIndex?.[gid]?.email) return guestIndex[gid].email;
  return "";
}

function getMobileFromBooking(b, guestIndex) {
  const direct =
    b?.mobile ||
    b?.phone ||
    b?.contact ||
    b?.guestMobile ||
    b?.customer_phone ||
    b?.guestDetails?.mobile ||
    b?.guest?.mobile ||
    (Array.isArray(b?.guests) ? b.guests[0]?.mobile : "");
  if (direct) return direct;
  const gid = getGuestIdFromBooking(b);
  if (gid && guestIndex?.[gid]?.mobile) return guestIndex[gid].mobile;
  return "";
}

/* ========= Booking field helpers ========= */

function getBookingIdFromBooking(b) {
  return (
    b?.booking_id ||
    b?.bookingId ||
    b?.bookingRef ||
    b?.id ||
    b?.referenceId ||
    ""
  );
}
function getRoomTypeFromBooking(b) {
  return (
    b?.room_type ||
    b?.roomType ||
    b?.room_category ||
    b?.bookingDetails?.roomType ||
    "Unknown"
  );
}
function getBookingTypeFromBooking(b) {
  return b?.booking_type || b?.bookingType || b?.type || "N/A";
}
function getBookingSourceFromBooking(b) {
  return b?.booking_source || b?.bookingSource || b?.source || "Unknown";
}
function getCheckInFromBooking(b) {
  return (
    b?.checkin_date ||
    b?.checkIn ||
    b?.check_in ||
    b?.dates?.checkIn ||
    b?.dates?.checkin ||
    b?.stay?.checkIn ||
    b?.stay?.checkin
  );
}
function getCheckOutFromBooking(b) {
  return (
    b?.checkout_date ||
    b?.checkOut ||
    b?.check_out ||
    b?.dates?.checkOut ||
    b?.dates?.checkout ||
    b?.stay?.checkOut ||
    b?.stay?.checkout
  );
}
function getAdultsFromBooking(b) {
  return (
    b?.no_of_adults ??
    b?.adults ??
    b?.guestDetails?.no_of_adults ??
    b?.guestDetails?.adults ??
    0
  );
}
function getChildrenFromBooking(b) {
  return (
    b?.no_of_children ??
    b?.children ??
    b?.guestDetails?.no_of_children ??
    b?.guestDetails?.children ??
    0
  );
}
function getBookingDateFromBooking(b) {
  return (
    b?.booking_date || b?.bookingDate || b?.created_at || b?.createdAt || ""
  );
}
function getRoomIdsFromBooking(b) {
  if (Array.isArray(b?.room_id)) return b.room_id;
  if (b?.room_id) return [b.room_id];
  if (Array.isArray(b?.roomIds)) return b.roomIds;
  if (b?.roomId) return [b.roomId];
  if (Array.isArray(b?.rooms)) {
    const ids = b.rooms
      .map(
        (r) => r?.room_id || r?.roomId || r?.id || r?.roomNumber || r?.number
      )
      .filter(Boolean);
    if (ids.length) return ids;
  }
  return [];
}
function getRoomNumbersFromBooking(b, rooms) {
  const direct =
    b?.roomNumbers ||
    b?.room_numbers ||
    b?.room_number ||
    b?.roomNumber ||
    (Array.isArray(b?.rooms)
      ? b.rooms
          .map((r) => r?.roomNumber || r?.number || r?.room_id || r?.id)
          .filter(Boolean)
      : null);
  if (Array.isArray(direct) && direct.length) return direct.map(String);
  if (direct && typeof direct === "string") return [direct];
  if (direct) return [String(direct)];
  const ids = getRoomIdsFromBooking(b);
  if (ids.length && Array.isArray(rooms)) {
    const nums = ids.map((roomId) => {
      const r = rooms.find(
        (rr) =>
          rr.room_id === roomId ||
          rr.id === roomId ||
          rr.room_number === roomId ||
          rr.number === roomId
      );
      return r ? r.room_number || r.number || String(roomId) : String(roomId);
    });
    return nums.filter(Boolean);
  }
  return [];
}
function getRoomNumberFromBill(bill) {
  return bill?.bill?.bookingDetails?.roomNumber || "";
}

/* ========= Range checks ========= */

function isDateInBookingRangeForOccupancy(date, checkin, checkout) {
  const d0 = new Date(date);
  d0.setHours(0, 0, 0, 0);
  const ci = toDate(checkin);
  const co = toDate(checkout);
  if (!ci || !co) return false;
  ci.setHours(0, 0, 0, 0);
  co.setHours(0, 0, 0, 0);
  return d0 >= ci && d0 <= co; // include checkout for occupancy
}

/* ========= Pagination ========= */

const usePagination = (data, itemsPerPage = 15) => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = data.slice(startIndex, endIndex);
  const goToPage = (page) =>
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  const nextPage = () => goToPage(currentPage + 1);
  const prevPage = () => goToPage(currentPage - 1);
  useEffect(() => {
    setCurrentPage(1);
  }, [data.length]);
  return {
    currentData,
    currentPage,
    totalPages,
    goToPage,
    nextPage,
    prevPage,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
    startIndex: startIndex + 1,
    endIndex: Math.min(endIndex, data.length),
    totalItems: data.length,
  };
};

const PaginationControls = React.memo(({ pagination }) => {
  const {
    currentPage,
    totalPages,
    goToPage,
    nextPage,
    prevPage,
    hasNext,
    hasPrev,
    startIndex,
    endIndex,
    totalItems,
  } = pagination;
  if (totalItems === 0) return null;
  return (
    <div className="flex items-center justify-between px-2 py-4">
      <div className="text-sm text-gray-700">
        Showing {startIndex} to {endIndex} of {totalItems} entries
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={prevPage}
          disabled={!hasPrev}
        >
          <ChevronLeft className="h-4 w-4" /> Previous
        </Button>
        <div className="flex items-center space-x-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) pageNum = i + 1;
            else if (currentPage <= 3) pageNum = i + 1;
            else if (currentPage >= totalPages - 2)
              pageNum = totalPages - 4 + i;
            else pageNum = currentPage - 2 + i;
            return (
              <Button
                key={pageNum}
                variant={currentPage === pageNum ? "default" : "outline"}
                size="sm"
                onClick={() => goToPage(pageNum)}
                className="w-8 h-8 p-0"
              >
                {pageNum}
              </Button>
            );
          })}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={nextPage}
          disabled={!hasNext}
        >
          Next <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
});

/* ========= Core calculation (now uses guests array via guest_id) ========= */

function calculateDayEndData(
  bookings,
  bills,
  rooms,
  guests,
  expenses,
  targetDate,
  institutionId
) {
  const targetDateStr = formatDateForAPI(targetDate);
  const targetYMD = toYMD(targetDate);

  // Build guest index from guests array (plus bills as fallback)
  const guestIndex = buildGuestIndex(guests, bills);

  // Summary counters
  let bookingCount = 0;
  let checkInCount = 0;
  let checkOutsCount = 0;
  let occupiedRoomCount = 0;
  let totalRevenue = 0;
  let roomRevenue = 0;
  let totalExpenses = 0;

  // Summary maps
  const occupiedRoomTypeCounts = {};
  const roomStatusCounts = {
    Vacant: 0,
    Occupied: 0,
    Dirty: 0,
    Reserved: 0,
    "Under Maintenance": 0,
  };

  // Detail collections
  const newBookingsDetails = [];
  const checkInsDetails = [];
  const checkOutsDetails = [];
  const occupiedRoomsDetails = [];
  const roomRevenueDetails = [];
  const roomStatusDetails = {
    Vacant: [],
    Occupied: [],
    Dirty: [],
    Reserved: [],
    "Under Maintenance": [],
  };
  const roomTypeDetails = {};

  // Revenue breakdown (mapped to bill sample)
  const revenueBreakdown = {
    roomCharges: 0,
    foodCharges: 0,
    laundryCharges: 0,
    extraBedCharges: 0,
    extraPaxCharges: 0,
    manualCharges: 0,
    minibarCharges: 0,
    ratePlanCharges: 0,
    dailyTotal: 0,
    serviceTaxAmount: 0,
    roomTaxAmount: 0,
    totalDiscount: 0,
  };

  // Part 1: Bookings-based metrics (new bookings, check-ins, check-outs)
  (bookings || []).forEach((b) => {
    const bookingDate = toDate(getBookingDateFromBooking(b));
    if (bookingDate) bookingDate.setHours(0, 0, 0, 0);

    const ciRaw = getCheckInFromBooking(b);
    const coRaw = getCheckOutFromBooking(b);
    const ci = toDate(ciRaw);
    const co = toDate(coRaw);
    if (ci) ci.setHours(0, 0, 0, 0);
    if (co) co.setHours(0, 0, 0, 0);

    const roomIds = getRoomIdsFromBooking(b);
    const roomNums = getRoomNumbersFromBooking(b, rooms);

    // New bookings (only for reserved status)
    if (bookingDate && isSameDay(bookingDate, targetDate)) {
      const bookingStatus = b?.status || "";
      const reservedStatuses = ["Reserved", "reserved"];

      if (reservedStatuses.includes(bookingStatus)) {
        bookingCount++;
        newBookingsDetails.push({
          guestName: getGuestNameFromBooking(b, guestIndex),
          bookingId: getBookingIdFromBooking(b),
          roomType: getRoomTypeFromBooking(b),
          bookingType: getBookingTypeFromBooking(b),
          bookingSource: getBookingSourceFromBooking(b),
          checkInDate: ci ? ci.toLocaleDateString() : "N/A",
          checkOutDate: co ? co.toLocaleDateString() : "N/A",
          roomNumbers: roomNums.length ? roomNums.join(", ") : "N/A",
          numberOfRooms: roomIds.length || roomNums.length || 1,
        });
      }
    }

    // Check-ins (only for checked-in status)
    // if (ci && isSameDay(ci, targetDate)) {
    //   const bookingStatus = b?.status || "";
    //   const checkedInStatuses = [
    //     "Checked-in",
    //     "checked-in",
    //     "CheckedIn",
    //     "In-House",
    //     "Inhouse",
    //     "In House",
    //   ];

    //   if (checkedInStatuses.includes(bookingStatus)) {
    //     checkInCount++;
    //     checkInsDetails.push({
    //       guestName: getGuestNameFromBooking(b, guestIndex),
    //       roomType: getRoomTypeFromBooking(b),
    //       bookingId: getBookingIdFromBooking(b),
    //       mobile: getMobileFromBooking(b, guestIndex),
    //       adults: getAdultsFromBooking(b),
    //       children: getChildrenFromBooking(b),
    //       checkOutDate: co ? co.toLocaleDateString() : "N/A",
    //       roomNumbers: roomNums.length ? roomNums.join(", ") : "N/A",
    //       numberOfRooms: roomIds.length || roomNums.length || 1,
    //     });
    //   }
    // }

    // Check-outs (only for checked-out status)
    // if (co && isSameDay(co, targetDate)) {
    //   const bookingStatus = b?.status || "";
    //   const checkedOutStatuses = [
    //     "Checked-out",
    //     "checked-out",
    //     "CheckedOut",
    //     "Checked Out",
    //   ];

    //   if (checkedOutStatuses.includes(bookingStatus)) {
    //     checkOutsCount++;
    //     checkOutsDetails.push({
    //       guestName: getGuestNameFromBooking(b, guestIndex),
    //       billNo: b?.bill_id || b?.billId || "N/A",
    //       roomType: getRoomTypeFromBooking(b),
    //       bookingId: getBookingIdFromBooking(b),
    //       mobile: getMobileFromBooking(b, guestIndex),
    //       checkInDate: ci ? ci.toLocaleDateString() : "N/A",
    //       stayDuration: daysBetween(ciRaw, coRaw),
    //       roomNumbers: roomNums.length ? roomNums.join(", ") : "N/A",
    //       numberOfRooms: roomIds.length || roomNums.length || 1,
    //     });
    //   }
    // }
  });

  //Checkins from bookings
  (bookings || []).forEach((b) => {
    const roomIds = getRoomIdsFromBooking(b);
    const roomNums = getRoomNumbersFromBooking(b, rooms);

    // Use helper to robustly parse various check-in formats
    const ciRaw = getCheckInFromBooking(b);
    let ci = new Date(ciRaw).toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
    });
    ci = new Date(ci);
    if (!ci) return;

    // Compare against the targetDate provided to this function (normalize both)
    const target = new Date(targetDate);
    target.setHours(0, 0, 0, 0);
    ci.setHours(0, 0, 0, 0);

    if (
      ci.getTime() === target.getTime() &&
      (b?.status === "Checked-in" ||
        b?.status === "checked-in" ||
        b?.status === "In-House" ||
        b?.status === "Inhouse" ||
        b?.status === "In House")
    ) {
      console.log(b);
      console.log(ci, b);

      const co = toDate(getCheckOutFromBooking(b));
      checkInCount++;
      checkInsDetails.push({
        grcNo: b?.grc_no || "N/A",
        guestName: getGuestNameFromBooking(b, guestIndex),
        roomType: getRoomTypeFromBooking(b),
        bookingId: getBookingIdFromBooking(b),
        mobile: getMobileFromBooking(b, guestIndex),
        adults: getAdultsFromBooking(b),
        children: getChildrenFromBooking(b),
        checkOutDate: co ? co.toLocaleDateString() : "N/A",
        isCheckedOut: false,
        roomNumbers: roomNums.length ? roomNums.join(", ") : "N/A",
        numberOfRooms: roomIds.length || roomNums.length || 1,
      });
    }
  });

  // Checkins from bills
  (bills || []).forEach((bill) => {
    const bd = bill?.bill;
    if (!bd) return;
    const ci = toDate(bd?.bookingDetails?.checkIn);
    if (!ci) return;
    ci.setHours(0, 0, 0, 0);
    const target = new Date(targetDate);
    target.setHours(0, 0, 0, 0);

    if (ci.getTime() === target.getTime()) {
      const co = toDate(bd?.bookingDetails?.checkOut);
      checkInCount++;
      checkInsDetails.push({
        grcNo: bd?.bookingDetails?.grc_no || "N/A",
        guestName: bd?.guestDetails?.guestName || "Unknown Guest",
        roomType: bd?.bookingDetails?.roomType || "Unknown",
        bookingId: bd?.bookingDetails?.bookingId || bill?.bill_id || "N/A",
        mobile: bd?.guestDetails?.mobile || "",
        adults: bd?.bookingDetails?.no_of_adults || 0,
        children: bd?.bookingDetails?.no_of_children || 0,
        checkOutDate: co ? co.toLocaleDateString() : "N/A",
        isCheckedOut: true,
        roomNumbers: bd?.bookingDetails?.roomNumber || "N/A",
        numberOfRooms: bd?.bookingDetails?.numberOfRooms || 1,
      });
    }
  });

  //checkouts from bills
  (bills || []).forEach((bill) => {
    const bd = bill?.bill;
    if (!bd) return;
    const co = toDate(bd?.bookingDetails?.checkOut);
    if (!co) return;
    co.setHours(0, 0, 0, 0);
    const target = new Date(targetDate);
    target.setHours(0, 0, 0, 0);
    if (co.getTime() === target.getTime()) {
      const ci = toDate(bd?.bookingDetails?.checkIn);

      checkOutsCount++;
      checkOutsDetails.push({
        grcNo: bd?.bookingDetails?.grc_no || "N/A",
        guestName: bd?.guestDetails?.guestName || "Unknown Guest",
        billNo: bd?.billHeader?.bill_no || "N/A",
        roomType: bd?.bookingDetails?.roomType || "Unknown",
        bookingId: bd?.bookingDetails?.bookingId || bill?.bill_id || "N/A",
        mobile: bd?.guestDetails?.mobile || "",
        checkInDate: ci ? ci.toLocaleDateString() : "N/A",
        stayDuration: daysBetween(
          bd?.bookingDetails?.checkIn,
          bd?.bookingDetails?.checkOut
        ),
        roomNumbers: bd?.bookingDetails?.roomNumber || "N/A",
        numberOfRooms: bd?.bookingDetails?.numberOfRooms || 1,
      });
    }
  });

  // Part 2: Rooms occupancy (rooms are primary; enrich with bookings)
  const checkedInStatuses = new Set([
    "Checked-in",
    "checked-in",
    "CheckedIn",
    "In-House",
    "Inhouse",
    "In House",
  ]);

  (rooms || []).forEach((room) => {
    const status = room?.status || "Vacant";
    console.log(status);

    roomStatusCounts[status] = (roomStatusCounts[status] || 0) + 1;

    const detail = {
      roomNumber: room?.room_number || room?.number || room?.id || "N/A",
      roomType: room?.room_type || room?.type || "Unknown",
      floor: room?.floor || "N/A",
      lastCleaned: room?.last_cleaned_at
        ? toDate(room.last_cleaned_at)?.toLocaleDateString()
        : "N/A",
      maintenanceNotes: room?.maintenance_notes || "None",
      tariff: room?.tariff || 0,
      ratePlan: room?.rate_plan || "N/A",
      roomId: room?.room_id || room?.id,
      status,
    };

    if (status === "Occupied") {
      occupiedRoomCount++;

      const match = (bookings || []).find((b) => {
        const byId = getRoomIdsFromBooking(b).some(
          (id) => id === room.room_id || id === room.id
        );
        const byNum = getRoomNumbersFromBooking(b, rooms).some(
          (n) => String(n) === String(detail.roomNumber)
        );
        if (!byId && !byNum) return false;

        const ci = getCheckInFromBooking(b);
        const co = getCheckOutFromBooking(b);
        const inRange = isDateInBookingRangeForOccupancy(targetDate, ci, co);
        const isCheckedIn = checkedInStatuses.has(b?.status);
        const ciD = toDate(ci);
        const checkedInByDate = ciD
          ? (ciD.setHours(0, 0, 0, 0), ciD <= targetDate)
          : false;
        return inRange && (isCheckedIn || checkedInByDate);
      });

      if (match) {
        const ci = getCheckInFromBooking(match);
        const co = getCheckOutFromBooking(match);
        const ciD = toDate(ci);
        const coD = toDate(co);

        detail.guestName = getGuestNameFromBooking(match, guestIndex);
        detail.bookingId = getBookingIdFromBooking(match);
        detail.checkInDate = ciD ? ciD.toLocaleDateString() : "N/A";
        detail.checkOutDate = coD ? coD.toLocaleDateString() : "N/A";
        detail.adults = getAdultsFromBooking(match);
        detail.children = getChildrenFromBooking(match);
        detail.bookingStatus = match?.status || "Checked-in";
        detail.guestMobile = getMobileFromBooking(match, guestIndex);
        detail.guestEmail = getGuestEmailFromBooking(match, guestIndex);
        detail.daysIntoStay = ciD
          ? Math.floor((new Date(targetDate) - ciD) / (1000 * 60 * 60 * 24)) + 1
          : 0;

        // Calculate daily tariff (per day rate, not total)
        // Priority: 1) Room tariff (base daily rate), 2) Booking daily rate, 3) Calculate from total as fallback
        const stayDuration = daysBetween(ci, co);
        const roomDailyTariff = room?.tariff || 0;

        const bookingDailyRate =
          match?.daily_rate ||
          match?.dailyRate ||
          match?.rate ||
          match?.bookingDetails?.dailyRate ||
          match?.bookingDetails?.rate ||
          0;

        const bookingTotalAmount =
          match?.total_amount ||
          match?.totalAmount ||
          match?.bookingDetails?.totalAmount ||
          match?.amount ||
          0;

        // Use room tariff (daily rate) as primary, then booking daily rate, then calculate from total if needed
        if (roomDailyTariff > 0) {
          detail.tariff = roomDailyTariff;
        } else if (bookingDailyRate > 0) {
          detail.tariff = bookingDailyRate;
        } else if (bookingTotalAmount > 0 && stayDuration > 0) {
          // Fallback: calculate daily rate from total (may not be accurate if discounts apply)
          detail.tariff = Math.round(bookingTotalAmount / stayDuration);
        } else {
          detail.tariff = 0;
        }

        const ids = getRoomIdsFromBooking(match);
        const nums = getRoomNumbersFromBooking(match, rooms);
        const total = ids.length || nums.length || 1;
        detail.isMultiRoom = total > 1;
        detail.totalRoomsInBooking = total;
        detail.allRoomsInBooking = nums.join(", ");
      } else {
        detail.guestName = "Unknown Guest";
        detail.bookingId = "N/A";
        detail.checkInDate = "N/A";
        detail.checkOutDate = "N/A";
        detail.adults = 0;
        detail.children = 0;
        detail.isMultiRoom = false;
        detail.bookingStatus = "No checked-in booking found";
        detail.daysIntoStay = 0;
      }

      occupiedRoomsDetails.push(detail);

      const type = detail.roomType || "Unknown";
      occupiedRoomTypeCounts[type] = (occupiedRoomTypeCounts[type] || 0) + 1;
      if (!roomTypeDetails[type]) roomTypeDetails[type] = [];
      roomTypeDetails[type].push(detail);
    }

    if (!roomStatusDetails[status]) {
      roomStatusDetails[status] = [];
    }
    roomStatusDetails[status].push(detail);
  });

  // Part 3: Bills for revenue (only checkout on target date)
  (bills || []).forEach((bill) => {
    const bd = bill?.bill;
    if (!bd) return;

    const co = timestampToDate(bd?.bookingDetails?.checkOut);
    if (!co) return;
    co.setHours(0, 0, 0, 0);
    if (!isSameDay(co, targetDate)) return;

    // Log bill data structure for debugging
    console.log("=== DAY END BILL PROCESSING ===");
    console.log("Bill ID:", bill?.bill_id);
    console.log("Full bill object:", bill);
    console.log("Bill details (bd):", bd);

    // Log all possible sources of total bill amount
    console.log("=== TOTAL BILL AMOUNT SOURCES ===");
    console.log(
      "1. bd?.billingSummary?.balanceDue:",
      bd?.billingSummary?.balanceDue
    );
    console.log(
      "2. bd?.finalSummary?.totalAmount:",
      bd?.finalSummary?.totalAmount
    );
    console.log(
      "3. bd?.billingSummary?.grandTotal:",
      bd?.billingSummary?.grandTotal
    );
    console.log(
      "4. bd?.billingSummary?.totalAmount:",
      bd?.billingSummary?.totalAmount
    );
    console.log("5. bd?.summary?.grandTotal:", bd?.summary?.grandTotal);
    console.log("6. bd?.summary?.totalAmount:", bd?.summary?.totalAmount);
    console.log("7. bd?.breakdown?.grandTotal:", bd?.breakdown?.grandTotal);
    console.log("8. bd?.breakdown?.totalAmount:", bd?.breakdown?.totalAmount);
    console.log("9. bd?.calculatedTotal:", bd?.calculatedTotal);
    console.log("10. bd?.remainingBalance:", bd?.remainingBalance);
    console.log("11. bill?.total_amount:", bill?.total_amount);
    console.log("12. bill?.grandTotal:", bill?.grandTotal);

    // Total revenue (bill-level)
    const billAmount = Number(
      bd?.billingSummary?.balanceDue ?? bd?.finalSummary?.totalAmount ?? 0
    );

    console.log("=== SELECTED BILL AMOUNT ===");
    console.log("Selected billAmount:", billAmount);
    console.log(
      "Source used:",
      bd?.billingSummary?.balanceDue
        ? "billingSummary.balanceDue"
        : "finalSummary.totalAmount"
    );

    totalRevenue += billAmount;

    // Room revenue KPI (bill-level)
    const roomSpecificRevenue = Number(
      bd?.billingSummary?.totalRoomServices ?? bd?.billingSummary?.subTotal ?? 0
    );

    console.log("=== ROOM REVENUE CALCULATION ===");
    console.log(
      "bd?.billingSummary?.totalRoomServices:",
      bd?.billingSummary?.totalRoomServices
    );
    console.log("bd?.billingSummary?.subTotal:", bd?.billingSummary?.subTotal);
    console.log("Selected roomSpecificRevenue:", roomSpecificRevenue);
    console.log(
      "Source used:",
      bd?.billingSummary?.totalRoomServices
        ? "billingSummary.totalRoomServices"
        : "billingSummary.subTotal"
    );

    roomRevenue += roomSpecificRevenue;

    const billBookingRef =
      bd?.billHeader?.bookingRef ||
      bd?.bookingDetails?.bookingId ||
      bill?.bill_id;
    const billGuestId =
      bd?.guestDetails?.guestId || bd?.bookingDetails?.guestId;

    const match = (bookings || []).find((bk) => {
      const bid = getBookingIdFromBooking(bk);
      const idMatch = billGuestId && billGuestId === getGuestIdFromBooking(bk);
      const nameMatch =
        getGuestNameFromBooking(bk, guestIndex) === bd?.guestDetails?.guestName;
      return (
        idMatch || bid === billBookingRef || bid === bill?.bill_id || nameMatch
      );
    });

    // Sum ALL-DAY charges across the stay (attribute them on checkout date)
    const allDays = {
      roomCharges: 0,
      foodCharges: 0,
      laundryCharges: 0,
      extraBedCharges: 0,
      extraPaxCharges: 0,
      manualCharges: 0,
      minibarCharges: 0,
      ratePlanCharges: 0,
      dailyTotal: 0,
    };

    // Also compute per-target-date for room-revenue per-room mapping (kept as-is)
    const roomRevenueMap = {};
    const ymdTarget = targetYMD;

    if (Array.isArray(bd?.serviceChargesByDate)) {
      bd.serviceChargesByDate.forEach((entryObj) => {
        Object.entries(entryObj || {}).forEach(([dateKey, list]) => {
          if (!Array.isArray(list)) return;
          list.forEach((ch) => {
            const c = ch?.charges || {};
            // Accumulate ALL days
            allDays.roomCharges += Number(c.roomCharges) || 0;
            allDays.foodCharges += Number(c.foodCharges) || 0;
            allDays.laundryCharges += Number(c.laundryCharges) || 0;
            allDays.extraBedCharges += Number(c.extraBedCharges) || 0;
            allDays.extraPaxCharges += Number(c.extraPaxCharges) || 0;
            allDays.manualCharges += Number(c.manualCharges) || 0;
            allDays.minibarCharges += Number(c.minibarCharges) || 0;
            allDays.ratePlanCharges += Number(c.ratePlanCharges) || 0;
            allDays.dailyTotal += Number(c.dailyTotal) || 0;

            // Build room revenue map for TARGET DAY only (UI shows room revenue contributors for the processed day)
            if (dateKey === ymdTarget) {
              const rn =
                ch?.roomNumber || bd?.bookingDetails?.roomNumber || "N/A";
              const amount = Number(c.roomCharges ?? c.dailyTotal ?? 0) || 0;
              roomRevenueMap[rn] = (roomRevenueMap[rn] || 0) + amount;
            }
          });
        });
      });
    }

    // Fallback if serviceChargesByDate missing: bookingDetails.services with snake_case keys
    // bookingDetails.services: { [roomNumber]: { [YYYY-MM-DD]: { food_charges, laundry_charges, ... } } }
    if (
      Object.keys(allDays).every((k) => allDays[k] === 0) &&
      bd?.bookingDetails?.services &&
      typeof bd.bookingDetails.services === "object"
    ) {
      Object.values(bd.bookingDetails.services || {}).forEach((dateMap) => {
        Object.values(dateMap || {}).forEach((charges) => {
          allDays.foodCharges += Number(charges?.food_charges) || 0;
          allDays.laundryCharges += Number(charges?.laundry_charges) || 0;
          allDays.extraBedCharges += Number(charges?.extra_bed_charges) || 0;
          allDays.manualCharges += Number(charges?.manual_charges) || 0;
          allDays.minibarCharges += Number(charges?.minibar_charges) || 0;
          // No explicit roomCharges/ratePlanCharges here; keep 0
        });
      });
    }

    // Apply ALL-DAY charges to breakdown (attribute them on checkout date)
    console.log("=== REVENUE BREAKDOWN CALCULATION ===");
    console.log("allDays object:", allDays);
    console.log(
      "bd?.billingSummary?.totalRoomServices:",
      bd?.billingSummary?.totalRoomServices
    );

    const roomChargesToAdd =
      allDays.roomCharges > 0
        ? allDays.roomCharges
        : Number(bd?.billingSummary?.totalRoomServices) || 0;

    console.log("Room charges to add:", roomChargesToAdd);
    console.log(
      "Source used:",
      allDays.roomCharges > 0
        ? "allDays.roomCharges"
        : "billingSummary.totalRoomServices"
    );

    revenueBreakdown.roomCharges += roomChargesToAdd;
    revenueBreakdown.foodCharges += allDays.foodCharges;
    revenueBreakdown.laundryCharges += allDays.laundryCharges;
    revenueBreakdown.extraBedCharges += allDays.extraBedCharges;
    revenueBreakdown.extraPaxCharges += allDays.extraPaxCharges;
    revenueBreakdown.manualCharges += allDays.manualCharges;
    revenueBreakdown.minibarCharges += allDays.minibarCharges;
    revenueBreakdown.ratePlanCharges += allDays.ratePlanCharges;
    revenueBreakdown.dailyTotal += allDays.dailyTotal;

    // Taxes and discounts (once per bill)
    console.log("=== TAXES AND DISCOUNTS ===");
    console.log(
      "bd?.billingSummary?.serviceTaxAmount:",
      bd?.billingSummary?.serviceTaxAmount
    );
    console.log(
      "bd?.billingSummary?.roomTaxAmount:",
      bd?.billingSummary?.roomTaxAmount
    );
    console.log(
      "bd?.billingSummary?.totalDiscount:",
      bd?.billingSummary?.totalDiscount
    );
    console.log(
      "bd?.billingSummary?.discountAmount:",
      bd?.billingSummary?.discountAmount
    );

    const serviceTax = Number(bd?.billingSummary?.serviceTaxAmount) || 0;
    const roomTax = Number(bd?.billingSummary?.roomTaxAmount) || 0;
    const discount =
      Number(
        bd?.billingSummary?.totalDiscount ??
          bd?.billingSummary?.discountAmount ??
          0
      ) || 0;

    console.log("Calculated serviceTax:", serviceTax);
    console.log("Calculated roomTax:", roomTax);
    console.log("Calculated discount:", discount);

    revenueBreakdown.serviceTaxAmount += serviceTax;
    revenueBreakdown.roomTaxAmount += roomTax;
    revenueBreakdown.totalDiscount += discount;

    // Build room-revenue contributor rows
    const pushRevenueDetail = (roomNumber, perRoomRevenue) => {
      const found = rooms?.find(
        (r) =>
          r.room_number === roomNumber ||
          r.number === roomNumber ||
          r.room_id === roomNumber ||
          r.id === roomNumber
      );
      const checkIn = bd?.bookingDetails?.checkIn;
      const checkOut = bd?.bookingDetails?.checkOut;
      const resolvedGuestName =
        bd?.guestDetails?.guestName ||
        (billGuestId && guestIndex?.[billGuestId]?.name) ||
        "Unknown Guest";

      roomRevenueDetails.push({
        roomNumber: roomNumber || "N/A",
        roomType: found?.room_type || bd?.bookingDetails?.roomType || "Unknown",
        guestName: resolvedGuestName,
        bookingId: billBookingRef,
        billId: bill?.bill_id,
        roomRevenue: Number(perRoomRevenue) || 0,
        totalBillAmount: Number(billAmount) || 0,
        isMultiRoom: !!(
          match &&
          (getRoomIdsFromBooking(match).length > 1 ||
            getRoomNumbersFromBooking(match, rooms).length > 1)
        ),
        totalRoomsInBill: match
          ? getRoomIdsFromBooking(match).length ||
            getRoomNumbersFromBooking(match, rooms).length ||
            1
          : 1,
        floor: found?.floor || "N/A",
        ratePlan: found?.rate_plan || bd?.bookingDetails?.ratePlanName || "N/A",
        tariff: found?.tariff || 0,
        checkInDate: toDate(checkIn)?.toLocaleDateString() || "N/A",
        checkOutDate: toDate(checkOut)?.toLocaleDateString() || "N/A",
        stayDuration: daysBetween(checkIn, checkOut),
      });
    };

    if (Object.keys(roomRevenueMap).length > 0) {
      Object.entries(roomRevenueMap).forEach(([rn, amt]) =>
        pushRevenueDetail(rn, amt)
      );
    } else if (match) {
      // Fall back: split room revenue KPI across matched rooms
      const ids = getRoomIdsFromBooking(match);
      const nums = getRoomNumbersFromBooking(match, rooms);
      const total = ids.length || nums.length || 1;
      const per = (Number(roomSpecificRevenue) || 0) / (total || 1);

      if (nums.length) {
        nums.forEach((rn) => pushRevenueDetail(rn, per));
      } else if (ids.length) {
        ids.forEach((id) => {
          const r = rooms?.find((x) => x.room_id === id || x.id === id);
          const rn = r ? r.room_number || r.number || String(id) : String(id);
          pushRevenueDetail(rn, per);
        });
      } else {
        const rn = bd?.bookingDetails?.roomNumber || "N/A";
        pushRevenueDetail(rn, roomSpecificRevenue);
      }
    } else {
      const rn = bd?.bookingDetails?.roomNumber || "N/A";
      pushRevenueDetail(rn, roomSpecificRevenue);
    }

    // Attach bill amounts to checkout details (or synthesize row)
    const idx = checkOutsDetails.findIndex(
      (coRow) =>
        coRow.bookingId === billBookingRef ||
        coRow.bookingId === bill?.bill_id ||
        coRow.guestName === bd?.guestDetails?.guestName
    );
    const synthesizedName =
      bd?.guestDetails?.guestName ||
      (billGuestId && guestIndex?.[billGuestId]?.name) ||
      "Unknown Guest";

    if (idx > -1) {
      checkOutsDetails[idx].billAmount = Number(billAmount) || 0;
      checkOutsDetails[idx].roomRevenue = Number(roomSpecificRevenue) || 0;
      if (
        !checkOutsDetails[idx].guestName ||
        checkOutsDetails[idx].guestName === "Unknown Guest"
      ) {
        checkOutsDetails[idx].guestName = synthesizedName;
      }
      if (
        !checkOutsDetails[idx].mobile ||
        checkOutsDetails[idx].mobile === "N/A"
      ) {
        checkOutsDetails[idx].mobile =
          bd?.guestDetails?.mobile ||
          bd?.billHeader?.contact ||
          (billGuestId && guestIndex?.[billGuestId]?.mobile) ||
          "N/A";
      }
    } else {
      checkOutsDetails.push({
        guestName: synthesizedName,
        roomType: bd?.bookingDetails?.roomType || "Unknown",
        bookingId: billBookingRef,
        mobile:
          bd?.guestDetails?.mobile ||
          bd?.billHeader?.contact ||
          (billGuestId && guestIndex?.[billGuestId]?.mobile) ||
          "N/A",
        checkInDate:
          toDate(bd?.bookingDetails?.checkIn)?.toLocaleDateString() || "N/A",
        stayDuration: daysBetween(
          bd?.bookingDetails?.checkIn,
          bd?.bookingDetails?.checkOut
        ),
        roomNumbers: bd?.bookingDetails?.roomNumber || "N/A",
        numberOfRooms: 1,
        billAmount: Number(billAmount) || 0,
        roomRevenue: Number(roomSpecificRevenue) || 0,
      });
      checkOutsCount += 1;
    }
  });

  // Part 4: Expenses for the target date
  const expensesDetails = [];
  (expenses || []).forEach((expense) => {
    const expenseDate = parseUSDateString(expense?.date);
    if (!expenseDate) return;
    expenseDate.setHours(0, 0, 0, 0);

    if (isSameDay(expenseDate, targetDate)) {
      const expenseAmount = Number(expense?.amount) || 0;
      totalExpenses += expenseAmount;

      expensesDetails.push({
        name: expense?.name || "Unnamed Expense",
        description: expense?.description || "No description",
        amount: expenseAmount,
        date: expense?.date || targetDateStr,
      });
    }
  });

  // Note: Expenses are tracked separately, not included in revenue breakdown

  // Return assembled result
  return {
    institutionId,
    date: targetDateStr,
    bookingCount,
    checkInCount,
    checkOutsCount,
    occupiedRoomCount,
    occupiedRoomTypeCounts,
    roomRevenue,
    roomStatusCounts,
    totalRevenue,
    totalExpenses,
    details: {
      newBookings: newBookingsDetails,
      checkIns: checkInsDetails,
      checkOuts: checkOutsDetails,
      occupiedRooms: occupiedRoomsDetails,
      roomRevenue: roomRevenueDetails,
      roomStatus: roomStatusDetails,
      roomTypes: roomTypeDetails,
      revenueBreakdown,
      expenses: expensesDetails,
    },
  };
}

/* ========= Timer Component ========= */

const TimerDisplay = React.memo(() => {
  const [timeToMidnight, setTimeToMidnight] = useState("");

  // Timer effect to show time until midnight
  useEffect(() => {
    const getIndianTime = () => {
      const now = new Date();
      const indianTime = new Date(
        now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
      );
      return indianTime;
    };

    const updateTimer = () => {
      const indianTime = getIndianTime();

      // Calculate time until next midnight (Indian time)
      const midnight = new Date(indianTime);
      midnight.setHours(24, 0, 0, 0);

      const diff = midnight.getTime() - indianTime.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const newTimeString = `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

      // Only update state if the time string has actually changed
      setTimeToMidnight((prev) =>
        prev !== newTimeString ? newTimeString : prev
      );
    };

    updateTimer(); // Initial update
    const interval = setInterval(updateTimer, 1000); // Update every second

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mx-auto max-w-md">
      <div className="flex items-center justify-center gap-2 text-blue-800">
        <Clock className="h-5 w-5" />
        <span className="text-sm font-medium">Auto-processing in:</span>
      </div>
      <div className="text-2xl font-bold text-blue-900 mt-2 font-mono">
        {timeToMidnight}
      </div>
    </div>
  );
});

/* ========= Component ========= */

const DayEnd = () => {
  const {
    processdayEnd,
    fetchAllReports,
    bookings = [],
    bills = [],
    rooms = [],
    guests = [], // <- now sourced from context
    loading,
    listExpenses,
    expenses: allExpenses,
    institutionId = "HOTEL001",
    handleDailyEnd,
  } = useAppContext();

  useEffect(() => {
    const checkinsToday = bookings.filter((b) => {
      const rawCi = getCheckInFromBooking(b);
      let ci = new Date(
        rawCi.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
      );
      const now = new Date();
      ci.setHours(0, 0, 0, 0);
      now.setHours(0, 0, 0, 0);
      return ci.getTime() === now.getTime();
    });

    const checkingsFromBills = bills.filter((bill) => {
      const ci = new Date(
        bill.bill.bookingDetails.checkIn.toLocaleString("en-US", {
          timeZone: "Asia/Kolkata",
        })
      );
      const now = new Date();
      if (!ci) return false;
      ci.setHours(0, 0, 0, 0);
      now.setHours(0, 0, 0, 0);
      return ci.getTime() === now.getTime();
    });

    console.log(checkingsFromBills);

    console.log(checkinsToday);
  }, [bills, bookings]);

  const { withLoading, isKeyLoading } = useLoading();
  useEffect(() => {
    listExpenses();
  }, []);
  const [status, setStatus] = useState({ type: "", message: "", icon: null });
  const [showCloseButton, setShowCloseButton] = useState(false);
  const [buttonDay, setButtonDay] = useState("");
  const [buttonLabel, setButtonLabel] = useState("");
  const [dateToProcess, setDateToProcess] = useState(null);
  const [dayEndData, setDayEndData] = useState(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [recentDateReport, setRecentDateReport] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [autoProcessTriggered, setAutoProcessTriggered] = useState(false);
  const [lastProcessedDate, setLastProcessedDate] = useState(null);
  const [todayDayEndClosed, setTodayDayEndClosed] = useState(false);
  useEffect(() => {
    setExpenses(allExpenses.expenses || []);
  }, [allExpenses]);

  // -------------- Auto day-end processing logic --------------

  // Get Indian Standard Time
  const getIndianTime = () => {
    const now = new Date();
    const indianTime = new Date(
      now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
    );
    return indianTime;
  };

  const handleAutoProcessDayEnd = React.useCallback(
    async (dateToProcess) => {
      try {
        // Show processing notification
        setStatus({
          type: "info",
          message: `Automatic day-end processing for ${dateToProcess.toLocaleDateString(
            "en-US",
            {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            }
          )}...`,
          icon: <Clock className="h-5 w-5 text-blue-500" />,
        });

        // Calculate day-end data for the date
        const autoData = calculateDayEndData(
          bookings,
          bills,
          rooms,
          guests,
          expenses,
          dateToProcess,
          institutionId
        );

        // Set the data temporarily for processing
        setDayEndData(autoData);
        setDateToProcess(dateToProcess);

        // Process the day-end
        const dateForAPI = formatDateForAPI(dateToProcess);
        await processDayEndInternal(dateForAPI);

        // Show success notification
        setStatus({
          type: "success",
          message: `Automatic day-end completed successfully for ${dateToProcess.toLocaleDateString(
            "en-US",
            {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            }
          )}`,
          icon: <Lock className="h-5 w-5 text-green-500" />,
        });

        // Set today's day-end as closed
        setTodayDayEndClosed(true);

        // Page will reload after processDayEndInternal completes
      } catch (error) {
        // Show error notification
        setStatus({
          type: "error",
          message: `Automatic day-end failed for ${dateToProcess.toLocaleDateString(
            "en-US",
            {
              month: "short",
              day: "numeric",
            }
          )}. Please process manually.`,
          icon: <AlertCircle className="h-5 w-5 text-red-500" />,
        });
      }
    },
    [
      processdayEnd,
      bookings,
      bills,
      rooms,
      guests,
      expenses,
      institutionId,
      dayEndData,
      dateToProcess,
    ]
  );

  // Auto day-end process at 11:59:30 PM or 12:00 AM Indian time
  useEffect(() => {
    const checkAutoProcessing = () => {
      const indianTime = getIndianTime();
      const currentHour = indianTime.getHours();
      const currentMinute = indianTime.getMinutes();
      const currentSecond = indianTime.getSeconds();

      // Trigger at 11:59:30 PM (23:59:30) or 12:00 AM (00:00:00)
      const isTriggerTime =
        (currentHour === 23 && currentMinute === 59 && currentSecond >= 30) ||
        (currentHour === 0 && currentMinute === 0 && currentSecond < 5);

      if (!isTriggerTime) return;

      // Always use today's date for processing
      const todayStr = formatDateForAPI(indianTime);
      if (lastProcessedDate === todayStr) {
        return;
      }

      // For midnight processing, check if recent date report doesn't have dayEndStatus: true
      if (recentDateReport && recentDateReport.dayEndStatus) {
        return; // Already processed
      }

      setLastProcessedDate(todayStr);

      // Auto-trigger day-end for today
      setTimeout(() => {
        handleAutoProcessDayEnd(indianTime);
      }, 2000);
    };

    // Check every 5 seconds for precise timing
    const interval = setInterval(() => {
      checkAutoProcessing();
    }, 5000);

    // Initial check when component mounts
    checkAutoProcessing();

    return () => clearInterval(interval);
  }, [recentDateReport, lastProcessedDate, handleAutoProcessDayEnd]);

  // -------------- End of auto day-end processing logic --------------

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const now = new Date();
  const todayFormatted = today.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Recalculate snapshot when date or data changes
  useEffect(() => {
    const run = async () => {
      if (!dateToProcess || !showCloseButton) {
        setDayEndData(null);
        return;
      }
      setDataLoading(true);
      try {
        const data = await withLoading(
          "calculate-day-end-data",
          () =>
            calculateDayEndData(
              bookings,
              bills,
              rooms,
              guests,
              expenses,
              dateToProcess,
              institutionId
            ),
          "DATA_LOADING",
          "overlay"
        );
        setDayEndData(data);
      } catch (e) {
        console.error("Error calculating day end:", e);
        setDayEndData(null);
      } finally {
        setDataLoading(false);
      }
    };
    run();
  }, [
    dateToProcess,
    showCloseButton,
    bookings,
    bills,
    rooms,
    guests,
    institutionId,
  ]);

  // Decide which date can be closed
  useEffect(() => {
    const fetchReports = async () => {
      try {
        const result = await withLoading(
          "fetch-reports",
          () => fetchAllReports(),
          "DATA_LOADING",
          "overlay"
        );
        if (result?.success && result?.data?.data?.recentDateReport?.date) {
          const recentDateReportData = result.data.data.recentDateReport;
          setRecentDateReport(recentDateReportData);

          const recentDateStr = recentDateReportData.date;
          const recentDate = parseUSDateString(recentDateStr);

          if (!recentDate) return;
          recentDate.setHours(0, 0, 0, 0);

          const yesterday = new Date(today);
          yesterday.setDate(today.getDate() - 1);
          yesterday.setHours(0, 0, 0, 0);

          const dayBeforeYesterday = new Date(today);
          dayBeforeYesterday.setDate(today.getDate() - 2);
          dayBeforeYesterday.setHours(0, 0, 0, 0);

          const yesterdayFormatted = yesterday.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          });
          const diffDays = Math.floor(
            (today.getTime() - recentDate.getTime()) / (1000 * 60 * 60 * 24)
          );

          // Check if day end is already closed for the recent date
          const isDayEndClosed = recentDateReportData?.dayEndStatus;

          // Check if today's day-end is already closed
          const isTodayClosed = isSameDay(recentDate, today) && isDayEndClosed;
          setTodayDayEndClosed(isTodayClosed);

          // Always show close button for today, but check if previous day's day-end is completed
          if (isDayEndClosed) {
            // Previous day's day-end is completed, show close button for today
            setStatus({
              type: "info",
              message: `You can close the business day for ${todayFormatted}`,
              icon: <Calendar className="h-5 w-5 text-blue-500" />,
            });
          } else {
            // Previous day's day-end is not completed, wait for automatic processing
            setStatus({
              type: "info",
              message: `Waiting for previous day's day-end to complete automatically at 11:59:30 PM`,
              icon: <Clock className="h-5 w-5 text-blue-500" />,
            });
          }

          // Always show close button for today
          setShowCloseButton(true);
          setButtonDay(todayFormatted);
          setButtonLabel("Close The Day");
          setDateToProcess(today);
        }
      } catch (e) {
        console.error("Error fetching reports:", e);
      }
    };
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDayEnd = async () => {
    if (!dateToProcess) return;
    const dateForAPI = formatDateForAPI(dateToProcess);
    await withLoading(
      "day-end-process",
      async () => {
        await handleDailyEnd();

        // await processDayEndInternal(dateForAPI);
        // Set today's day-end as closed after manual processing
        setTodayDayEndClosed(true);
      },
      "SUBMITTING",
      "overlay"
    );
  };

  // const processDayEndInternal = async () => {

  //   try {
  //     await processdayEnd();
  //     setTimeout(() => window.location.reload(), 1000);
  //   } catch (e) {
  //     console.error("Error processing day end:", e);
  //   }
  // };

  /* ========= UI helpers/components ========= */

  // Create a separate isolated dialog component outside the main component
  const IsolatedDialog = React.memo(({ title, children }) => {
    const [isOpen, setIsOpen] = React.useState(false);

    const handleOpenChange = React.useCallback((open) => {
      setIsOpen(open);
    }, []);

    const handleButtonClick = React.useCallback((e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsOpen(true);
    }, []);

    return (
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <button
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            title="View details"
            onClick={handleButtonClick}
          >
            <Info className="h-4 w-4 text-gray-400 hover:text-gray-600" />
          </button>
        </DialogTrigger>
        <DialogContent className="min-w-[95vw] max-w-[95vw] max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{title} Details</DialogTitle>
            <DialogDescription>
              Detailed breakdown for {title.toLowerCase()}
            </DialogDescription>
          </DialogHeader>
          {children}
        </DialogContent>
      </Dialog>
    );
  });

  const DataCard = React.memo(
    ({
      title,
      value,
      subtitle,
      icon,
      colorClass = "text-blue-600",
      dialogContent,
      hasDetails = false,
    }) => (
      <div className="bg-white rounded border-2 border-gray-100 p-3">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1">
            <div className={colorClass}>{icon}</div>
            <h3 className="font-medium text-gray-700 text-xs">{title}</h3>
          </div>
          {hasDetails && (
            <IsolatedDialog title={title}>{dialogContent}</IsolatedDialog>
          )}
        </div>
        <div className="text-xl font-semibold text-gray-900 mb-1">
          {dataLoading ? (
            <div className="animate-pulse bg-gray-200 h-6 w-12 rounded"></div>
          ) : (
            value
          )}
        </div>
        {subtitle && <div className="text-xs text-gray-400">{subtitle}</div>}
      </div>
    )
  );

  const DetailCard = React.memo(
    ({ title, data, icon, colorClass = "text-blue-500" }) => (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className={colorClass}>{icon}</div>
          <h3 className="font-semibold text-gray-800">{title}</h3>
        </div>
        {dataLoading ? (
          <div className="animate-pulse space-y-2">
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        ) : (
          <div className="space-y-1 text-sm text-gray-600">
            {data && typeof data === "object" ? (
              Object.entries(data).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center">
                  <span className="capitalize">
                    {key.replace(/([A-Z])/g, " $1").trim()}:
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{value}</span>
                    {value > 0 && (
                      <IsolatedDialog title={key}>
                        {title.includes("Room Status") ? (
                          <IndividualStatusModal status={key} />
                        ) : (
                          <IndividualRoomTypeModal roomType={key} />
                        )}
                      </IsolatedDialog>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <span>{data || "No data available"}</span>
            )}
          </div>
        )}
      </div>
    )
  );

  const BookingsModal = React.useMemo(() => {
    const data = dayEndData?.details?.newBookings || [];
    console.log("data", data);

    return (
      <div className="space-y-4">
        {data.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Guest Name</TableHead>
                  <TableHead className="w-[160px]">Booking ID</TableHead>
                  <TableHead className="w-[120px]">Room Type</TableHead>
                  <TableHead className="w-[140px]">Booking Type</TableHead>
                  <TableHead className="w-[120px]">Source</TableHead>
                  <TableHead className="w-[80px]">Rooms</TableHead>
                  <TableHead className="w-[160px]">Room Numbers</TableHead>
                  <TableHead className="w-[110px]">Check-in</TableHead>
                  <TableHead className="w-[110px]">Check-out</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.slice(0, 15).map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">
                      {row.guestName}
                    </TableCell>
                    <TableCell>{row.bookingId}</TableCell>
                    <TableCell>{row.roomType}</TableCell>
                    <TableCell>{row.bookingType}</TableCell>
                    <TableCell>{row.bookingSource}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{row.numberOfRooms}</Badge>
                    </TableCell>
                    <TableCell className="text-xs">{row.roomNumbers}</TableCell>
                    <TableCell>{row.checkInDate}</TableCell>
                    <TableCell>{row.checkOutDate}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {data.length > 15 && (
              <div className="text-center text-sm text-gray-500 py-2">
                Showing first 15 of {data.length} bookings
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <BookOpen className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>No new bookings for this date</p>
          </div>
        )}
      </div>
    );
  }, [dayEndData?.details?.newBookings]);

  // Pagination hooks for modals
  const checkInsData = dayEndData?.details?.checkIns || [];
  const checkInsPagination = usePagination(checkInsData, 15);

  const occupiedRoomsData = dayEndData?.details?.occupiedRooms || [];
  const occupiedRoomsPagination = usePagination(occupiedRoomsData, 15);

  const roomRevenueData = dayEndData?.details?.roomRevenue || [];
  const roomRevenuePagination = usePagination(roomRevenueData, 15);

  const checkOutsData = dayEndData?.details?.checkOuts || [];
  const checkOutsPagination = usePagination(checkOutsData, 15);

  const expensesData = dayEndData?.details?.expenses || [];
  const expensesPagination = usePagination(expensesData, 15);

  const CheckInsModal = React.useMemo(() => {
    return (
      <div className="space-y-4">
        {checkInsData.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Guest Name</TableHead>
                  <TableHead className="w-[160px]">GRC ID</TableHead>
                  <TableHead className="w-[120px]">Room Type</TableHead>
                  <TableHead className="w-[120px]">Mobile</TableHead>
                  <TableHead className="w-[160px]">Room Numbers</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {checkInsPagination.currentData.map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">
                      {row.guestName}
                    </TableCell>
                    <TableCell>{row.grcNo}</TableCell>
                    <TableCell>{row.roomType}</TableCell>
                    <TableCell>{row.mobile}</TableCell>
                    <TableCell className="text-xs">{row.roomNumbers}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <PaginationControls pagination={checkInsPagination} />
          </>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <UserCheck className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>No check-ins for this date</p>
          </div>
        )}
      </div>
    );
  }, [checkInsData, checkInsPagination]);

  const OccupiedRoomsModal = React.useMemo(() => {
    return (
      <div className="space-y-4">
        {occupiedRoomsData.length > 0 ? (
          <>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 text-blue-800 text-sm">
                <Info className="h-4 w-4" />
                <span>
                  Shows ALL occupied rooms with checked-in guests (regardless of
                  check-in date)
                </span>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Room</TableHead>

                  <TableHead className="w-[140px]">Room Type</TableHead>
                  <TableHead className="w-[100px]">Floor</TableHead>

                  <TableHead className="w-[130px] text-right">
                    Day Tariff
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {occupiedRoomsPagination.currentData.map((room, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">
                      {room.roomNumber}
                    </TableCell>

                    <TableCell>{room.roomType}</TableCell>
                    <TableCell>{room.floor}</TableCell>

                    <TableCell className="text-right">
                      ₹{(room.tariff || 0).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <PaginationControls pagination={occupiedRoomsPagination} />
          </>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <BedDouble className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>No occupied rooms with checked-in guests</p>
          </div>
        )}
      </div>
    );
  }, [occupiedRoomsData, occupiedRoomsPagination]);

  const RoomRevenueModal = React.useMemo(() => {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <Coins className="h-6 w-6 text-indigo-500" />
          <h4 className="text-lg font-semibold text-gray-800">
            Room Revenue Details
          </h4>
          <div className="ml-auto text-sm text-gray-500 bg-blue-50 px-2 py-1 rounded">
            From checkout bills
          </div>
        </div>

        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <div className="text-center">
            <div className="text-sm text-indigo-600 mb-1">
              Total Room Revenue
            </div>
            <div className="text-3xl font-bold text-indigo-700">
              ₹{(dayEndData?.roomRevenue || 0).toLocaleString()}
            </div>
            <div className="text-xs text-indigo-500 mt-1">
              From {roomRevenueData.length} room
              {roomRevenueData.length !== 1 ? "s" : ""} that checked out today
            </div>
          </div>
        </div>

        {roomRevenueData.length > 0 ? (
          <>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-blue-800 text-sm">
                <Info className="h-4 w-4" />
                <span>
                  Room revenue breakdown by individual rooms that contributed to
                  today's revenue
                </span>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Room</TableHead>
                  <TableHead className="w-[180px]">Guest Name</TableHead>
                  <TableHead className="w-[160px]">Bill ID</TableHead>
                  <TableHead className="w-[120px]">Room Type</TableHead>
                  <TableHead className="w-[100px]">Floor</TableHead>
                  <TableHead className="w-[120px]">Stay Duration</TableHead>
                  <TableHead className="w-[130px] text-right">
                    Room Revenue
                  </TableHead>
                  <TableHead className="w-[130px] text-right">
                    Total Bill
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roomRevenuePagination.currentData.map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">
                      {row.roomNumber}
                    </TableCell>
                    <TableCell>{row.guestName}</TableCell>
                    <TableCell>{row.billId}</TableCell>
                    <TableCell>{row.roomType}</TableCell>
                    <TableCell>{row.floor}</TableCell>
                    <TableCell>{row.stayDuration} days</TableCell>
                    <TableCell className="text-right font-medium text-indigo-600">
                      ₹{Number(row.roomRevenue || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-medium text-green-600">
                      ₹{Number(row.totalBillAmount || 0).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-indigo-800">
                    Total Room Revenue:
                  </span>
                  <span className="text-lg font-bold text-indigo-600">
                    ₹
                    {roomRevenueData
                      .reduce((s, r) => s + (Number(r.roomRevenue) || 0), 0)
                      .toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-green-800">
                    Total Bill Revenue:
                  </span>
                  <span className="text-lg font-bold text-green-600">
                    ₹
                    {roomRevenueData
                      .reduce((s, r) => s + (Number(r.totalBillAmount) || 0), 0)
                      .toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <PaginationControls pagination={roomRevenuePagination} />
          </>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Coins className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>No room revenue for this date</p>
            <p className="text-xs mt-1">
              Revenue is only counted when guests check out and bills are
              finalized
            </p>
          </div>
        )}
      </div>
    );
  }, [roomRevenueData, roomRevenuePagination, dayEndData?.roomRevenue]);

  const CheckOutsModal = React.useMemo(() => {
    console.log("Checkout: ", checkOutsData);

    return (
      <div className="space-y-4">
        {checkOutsData.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Guest Name</TableHead>
                  <TableHead className="w-[160px]">Bill ID</TableHead>
                  <TableHead className="w-[120px]">Room Type</TableHead>
                  <TableHead className="w-[120px]">Mobile</TableHead>
                  <TableHead className="w-[110px]">Check-in Date</TableHead>
                  <TableHead className="w-[100px]">Stay Duration</TableHead>
                  <TableHead className="w-[110px] text-right">
                    Room Revenue
                  </TableHead>
                  <TableHead className="w-[110px] text-right">
                    Total Bill
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {checkOutsPagination.currentData.map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">
                      {row.guestName}
                    </TableCell>
                    <TableCell>{row.billNo}</TableCell>
                    <TableCell>{row.roomType}</TableCell>
                    <TableCell>{row.mobile}</TableCell>
                    <TableCell>{row.checkInDate}</TableCell>
                    <TableCell>{row.stayDuration} days</TableCell>
                    <TableCell className="text-right font-medium text-blue-600">
                      {row.roomRevenue
                        ? `₹${Number(row.roomRevenue || 0).toLocaleString()}`
                        : "N/A"}
                    </TableCell>
                    <TableCell className="text-right font-medium text-green-600">
                      {row.billAmount
                        ? `₹${Number(row.billAmount || 0).toLocaleString()}`
                        : "N/A"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-blue-800">
                    Total Room Revenue:
                  </span>
                  <span className="text-lg font-bold text-blue-600">
                    ₹
                    {checkOutsData
                      .reduce((s, r) => s + (Number(r.roomRevenue) || 0), 0)
                      .toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-green-800">
                    Total Bill Revenue:
                  </span>
                  <span className="text-lg font-bold text-green-600">
                    ₹
                    {checkOutsData
                      .reduce((s, r) => s + (Number(r.billAmount) || 0), 0)
                      .toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
            <PaginationControls pagination={checkOutsPagination} />
          </>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <UserX className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>No check-outs for this date</p>
          </div>
        )}
      </div>
    );
  }, [checkOutsData, checkOutsPagination]);

  const IndividualStatusModal = React.memo(({ status }) => {
    const data = dayEndData?.details?.roomStatus?.[status] || [];
    const pagination = usePagination(data, 15);
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <div
            className={`w-4 h-4 rounded-full ${
              status === "Occupied"
                ? "bg-red-500"
                : status === "Vacant"
                ? "bg-green-500"
                : status === "Dirty"
                ? "bg-orange-500"
                : status === "Reserved"
                ? "bg-blue-500"
                : "bg-gray-500"
            }`}
          />
          <h4 className="text-lg font-semibold text-gray-800">
            {status} Rooms ({data.length})
          </h4>
        </div>
        {data.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">Room Number</TableHead>
                  <TableHead className="w-[150px]">Room Type</TableHead>
                  <TableHead className="w-[100px]">Floor</TableHead>
                  {status === "Occupied" && (
                    <TableHead className="w-[200px]">Guest</TableHead>
                  )}
                  {status === "Occupied" && (
                    <TableHead className="w-[140px]">Check-out</TableHead>
                  )}
                  {status === "Under Maintenance" && (
                    <TableHead className="w-[250px]">Notes</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagination.currentData.map((room, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">
                      {room.roomNumber}
                    </TableCell>
                    <TableCell>{room.roomType}</TableCell>
                    <TableCell>{room.floor}</TableCell>
                    {status === "Occupied" && (
                      <TableCell>{room.guestName || "N/A"}</TableCell>
                    )}
                    {status === "Occupied" && (
                      <TableCell>{room.checkOutDate || "N/A"}</TableCell>
                    )}
                    {status === "Under Maintenance" && (
                      <TableCell>{room.maintenanceNotes}</TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <PaginationControls pagination={pagination} />
          </>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <MapPin className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>No {status.toLowerCase()} rooms</p>
          </div>
        )}
      </div>
    );
  });

  const IndividualRoomTypeModal = React.memo(({ roomType }) => {
    const data = dayEndData?.details?.roomTypes?.[roomType] || [];
    const pagination = usePagination(data, 15);
    console.log(pagination);

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="h-5 w-5 text-purple-500" />
          <h4 className="text-lg font-semibold text-gray-800">
            {roomType} Rooms ({data.length} occupied)
          </h4>
        </div>
        {data.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">Room Number</TableHead>
                  <TableHead className="w-[140px]">Room Type</TableHead>
                  <TableHead className="w-[120px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagination.currentData.map((room, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">
                      {room.roomNumber}
                    </TableCell>
                    <TableCell>{room.roomType}</TableCell>

                    <TableCell>{room.status || "Occupied"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <PaginationControls pagination={pagination} />
          </>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Building2 className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>No occupied {roomType.toLowerCase()} rooms</p>
          </div>
        )}
      </div>
    );
  });

  const ExpensesModal = React.useMemo(() => {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-6 w-6 text-red-500" />
          <h4 className="text-lg font-semibold text-gray-800">
            Expenses Details
          </h4>
          <div className="ml-auto text-sm text-gray-500 bg-red-50 px-2 py-1 rounded">
            For {dayEndData?.date}
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-center">
            <div className="text-sm text-red-600 mb-1">
              Total Expenses for {dayEndData?.date}
            </div>
            <div className="text-3xl font-bold text-red-700">
              ₹{(dayEndData?.totalExpenses || 0).toLocaleString()}
            </div>
            <div className="text-xs text-red-500 mt-1">
              From {expensesData.length} expense
              {expensesData.length !== 1 ? "s" : ""} recorded on this date
            </div>
          </div>
        </div>

        {expensesData.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Expense Name</TableHead>
                  <TableHead className="w-[300px]">Description</TableHead>
                  <TableHead className="w-[120px]">Date</TableHead>
                  <TableHead className="w-[130px] text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expensesPagination.currentData.map((expense, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">
                      {expense.name}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {expense.description}
                    </TableCell>
                    <TableCell>{expense.date}</TableCell>
                    <TableCell className="text-right font-medium text-red-600">
                      ₹{Number(expense.amount || 0).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <PaginationControls pagination={expensesPagination} />
          </>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <TrendingUp className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>No expenses recorded for this date</p>
          </div>
        )}
      </div>
    );
  }, [
    expensesData,
    expensesPagination,
    dayEndData?.totalExpenses,
    dayEndData?.date,
  ]);

  return (
    <div className="min-h-[calc(100vh-100px)] bg-gray-50 px-4 py-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <div className="flex flex-col items-center gap-2">
            <Calendar className="h-14 w-14 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Day End Process
            </h1>
          </div>
        </div>

        {showCloseButton && dateToProcess && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Day End Report Summary for {buttonDay}
              </h2>
              <p className="text-sm text-gray-600">
                Review the business metrics that will be finalized in the day
                end report
              </p>
            </div>

            {dataLoading && (
              <div className="flex justify-center py-8">
                <CompactLoader message="Calculating day end data..." />
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2">
              <DataCard
                title="Bookings"
                value={dayEndData?.bookingCount || 0}
                subtitle="From Bookings"
                icon={<BookOpen className="h-5 w-5" />}
                colorClass="text-blue-600"
                hasDetails={
                  !dataLoading && dayEndData?.details?.newBookings?.length > 0
                }
                dialogContent={BookingsModal}
              />
              <DataCard
                title="Check-ins"
                value={dayEndData?.checkInCount || 0}
                subtitle="From Bookings"
                icon={<UserCheck className="h-5 w-5" />}
                colorClass="text-green-600"
                hasDetails={
                  !dataLoading && dayEndData?.details?.checkIns?.length > 0
                }
                dialogContent={CheckInsModal}
              />
              <DataCard
                title="Check-outs"
                value={dayEndData?.checkOutsCount || 0}
                subtitle="From Bookings/Bills"
                icon={<UserX className="h-5 w-5" />}
                colorClass="text-orange-600"
                hasDetails={
                  !dataLoading && dayEndData?.details?.checkOuts?.length > 0
                }
                dialogContent={CheckOutsModal}
              />
              <DataCard
                title="Occupied Rooms"
                value={dayEndData?.occupiedRoomCount || 0}
                subtitle="From Rooms"
                icon={<BedDouble className="h-5 w-5" />}
                colorClass="text-purple-600"
                hasDetails={
                  !dataLoading && dayEndData?.details?.occupiedRooms?.length > 0
                }
                dialogContent={OccupiedRoomsModal}
              />
              <DataCard
                title="Room Revenue"
                value={`₹${(dayEndData?.roomRevenue || 0).toLocaleString()}`}
                subtitle="From Bills"
                icon={<Coins className="h-5 w-5" />}
                colorClass="text-indigo-600"
                hasDetails={!dataLoading && dayEndData?.roomRevenue > 0}
                dialogContent={RoomRevenueModal}
              />
              <DataCard
                title="Total Revenue"
                value={`₹${(dayEndData?.totalRevenue || 0).toLocaleString()}`}
                subtitle="From Bills"
                icon={<CreditCard className="h-5 w-5" />}
                colorClass="text-green-600"
                hasDetails={!dataLoading && dayEndData?.totalRevenue > 0}
                dialogContent={
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-4">
                      <CreditCard className="h-6 w-6 text-green-500" />
                      <h4 className="text-lg font-semibold text-gray-800">
                        Revenue Breakdown
                      </h4>
                      <div className="ml-auto text-sm text-gray-500 bg-blue-50 px-2 py-1 rounded">
                        Source: Bills (Checkout Date)
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(
                        dayEndData?.details?.revenueBreakdown || {}
                      ).map(([key, val]) => (
                        <div key={key} className="bg-gray-50 rounded-lg p-3">
                          <div className="text-sm text-gray-600 capitalize">
                            {key.replace(/([A-Z])/g, " $1").trim()}
                          </div>
                          <div className="text-lg font-semibold text-gray-900">
                            ₹{Number(val || 0).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="border-t pt-4">
                      <div className="text-center">
                        <div className="text-sm text-gray-600">
                          Total Revenue (from checked-out bills)
                        </div>
                        <div className="text-2xl font-bold text-green-600">
                          ₹{(dayEndData?.totalRevenue || 0).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                }
              />
              <DataCard
                title="Total Expenses"
                value={`₹${(dayEndData?.totalExpenses || 0).toLocaleString()}`}
                subtitle="For Current Date"
                icon={<TrendingUp className="h-5 w-5" />}
                colorClass="text-red-600"
                hasDetails={!dataLoading && dayEndData?.totalExpenses > 0}
                dialogContent={ExpensesModal}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DetailCard
                title="Room Status Overview"
                data={dayEndData?.roomStatusCounts}
                icon={<MapPin className="h-5 w-5" />}
                colorClass="text-blue-500"
              />
              <DetailCard
                title="Occupied Room Types"
                data={dayEndData?.occupiedRoomTypeCounts}
                icon={<Building2 className="h-5 w-5" />}
                colorClass="text-purple-500"
              />
            </div>
          </div>
        )}

        <div className="text-center pt-4">
          {showCloseButton && (
            <div className="space-y-4">
              {/* Timer Display */}
              <TimerDisplay />

              <p className="text-sm text-gray-600">
                Ready to close the business day for{" "}
                <span className="font-semibold text-gray-800">{buttonDay}</span>
              </p>
              <SimpleApiButton
                onClick={handleDayEnd}
                disabled={
                  loading ||
                  dataLoading ||
                  isKeyLoading("day-end-process") ||
                  todayDayEndClosed
                }
                size="lg"
                className="px-8 py-3 text-lg font-semibold"
              >
                {isKeyLoading("day-end-process") ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </div>
                ) : (
                  buttonLabel
                )}
              </SimpleApiButton>

              {/* Show day end closed status below button */}
              {todayDayEndClosed && (
                <div className="flex items-center justify-center gap-2 text-green-600">
                  <Lock className="h-4 w-4" />
                  <span className="text-sm font-medium">Day end closed</span>
                </div>
              )}

              {dayEndData && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 max-w-md mx-auto">
                    This will finalize all transactions, update room statuses,
                    and generate reports for the selected date.
                  </p>
                  <div className="text-xs text-gray-400 bg-gray-50 rounded px-3 py-2 max-w-lg mx-auto">
                    <div className="font-medium mb-1">
                      Processing Method: Hybrid Data Approach
                    </div>
                    <div>
                      Bookings: {bookings?.length || 0} • Bills:{" "}
                      {bills?.length || 0} • Rooms: {rooms?.length || 0} •
                      Guests: {guests?.length || 0} • Expenses:{" "}
                      {expenses?.length || 0}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* {process.env.NODE_ENV === "development" && dayEndData && (
          <div className="mt-8 p-4 bg-gray-100 rounded-lg border">
            <details className="cursor-pointer">
              <summary className="font-medium text-gray-700 mb-2">
                Debug Information
              </summary>
              <div className="text-xs text-gray-600 space-y-2">
                <div>
                  <strong>Data Processed:</strong>
                  <ul className="ml-4 list-disc">
                    <li>Bookings: {bookings?.length || 0}</li>
                    <li>Bills: {bills?.length || 0}</li>
                    <li>Rooms: {rooms?.length || 0}</li>
                    <li>Guests: {guests?.length || 0}</li>
                    <li>Expenses: {expenses?.length || 0}</li>
                  </ul>
                </div>
                <div>
                  <strong>Results:</strong>
                  <ul className="ml-4 list-disc">
                    <li>New bookings: {dayEndData.bookingCount}</li>
                    <li>Check-ins: {dayEndData.checkInCount}</li>
                    <li>Check-outs: {dayEndData.checkOutsCount}</li>
                    <li>Occupied rooms: {dayEndData.occupiedRoomCount}</li>
                    <li>Total revenue: ₹{dayEndData.totalRevenue}</li>
                    <li>Total expenses: ₹{dayEndData.totalExpenses}</li>
                  </ul>
                </div>
              </div>
            </details>
          </div>
        )} */}
      </div>
    </div>
  );
};

export default DayEnd;
