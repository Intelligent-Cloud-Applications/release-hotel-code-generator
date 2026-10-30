import React, { useState, useEffect, useRef, useMemo } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select.js";
import { Badge } from "../../../components/ui/badge.js";
import { Separator } from "../../../components/ui/separator.js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "../../../components/ui/dialog.js";
import { Textarea } from "../../../components/ui/textarea.js";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table.js";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../../../components/ui/alert-dialog.js";
import RefreshButton from "../../../components/ui/RefreshButton.jsx";
import {
  Search,
  X,
  Calendar,
  User,
  Bed,
  CreditCard,
  AlertTriangle,
  Users,
  Phone,
  Mail,
  Clock,
  DollarSign,
  FileText,
  ArrowUpDown,
  Edit,
  TrendingUp,
  Sparkles,
  ChevronDown,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthContext } from "../../../context/AuthContext.jsx";

// Clean, searchable, and responsive room selector dropdown
const SearchableRoomSelect = ({ value, onChange, rooms = [], categoryFilter = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all"); // "all", "preferred", "vacant"
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const selectedRoom = useMemo(() => {
    if (!value) return null;
    const strVal = String(value).trim().toLowerCase();
    const found = (rooms || []).find(
      (r) =>
        String(r.room_id || "").toLowerCase() === strVal ||
        String(r.room_number || "").toLowerCase() === strVal ||
        String(r.id || "").toLowerCase() === strVal ||
        String(r._id || "").toLowerCase() === strVal
    );
    if (found) return found;
    const s = String(value).trim();
    if (s && !s.includes("-") && s.length <= 6) {
      return { room_number: s, room_type: categoryFilter || "Standard", floor: 1, status: "Assigned" };
    }
    return null;
  }, [value, rooms, categoryFilter]);

  const preferredCount = useMemo(() => {
    if (!categoryFilter) return 0;
    return (rooms || []).filter(
      (r) => String(r.room_type || "").toLowerCase() === categoryFilter.toLowerCase()
    ).length;
  }, [rooms, categoryFilter]);

  const filteredRooms = useMemo(() => {
    return (rooms || [])
      .filter((r) => {
        const q = search.toLowerCase().trim();
        const numMatch = String(r.room_number || "").toLowerCase().includes(q);
        const typeMatch = String(r.room_type || "").toLowerCase().includes(q);
        const floorMatch = String(r.floor || "").toLowerCase().includes(q);
        const matchesQuery = !q || numMatch || typeMatch || floorMatch;

        if (!matchesQuery) return false;

        if (filterType === "preferred" && categoryFilter) {
          return String(r.room_type || "").toLowerCase() === categoryFilter.toLowerCase();
        }
        if (filterType === "vacant") {
          return (
            String(r.status || "").toLowerCase() === "vacant" ||
            String(r.status || "").toLowerCase() === "clean"
          );
        }
        return true;
      })
      .sort((a, b) => parseInt(a.room_number || 0) - parseInt(b.room_number || 0));
  }, [rooms, search, filterType, categoryFilter]);

  return (
    <div className={`relative ${isOpen ? "z-50" : "z-10"}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full text-left bg-white border ${
          isOpen ? "border-blue-500 ring-2 ring-blue-100 shadow-sm" : "border-gray-300 hover:border-gray-400 shadow-xs"
        } rounded-lg p-2.5 text-xs flex items-center justify-between transition-all cursor-pointer`}
      >
        {selectedRoom ? (
          <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
            <span className="font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded text-xs shrink-0 border border-gray-200">
              Room {selectedRoom.room_number}
            </span>
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <span className="font-semibold text-gray-800 truncate">
                {selectedRoom.room_type}
              </span>
              <span className="text-gray-400 text-[11px] shrink-0">
                • Fl {selectedRoom.floor || 1}
              </span>
            </div>
            <span
              className={`text-[10px] px-2 py-0.5 rounded font-semibold shrink-0 ${
                String(selectedRoom.status).toLowerCase() === "vacant"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {selectedRoom.status}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-gray-500 min-w-0 flex-1">
            <Bed className="h-4 w-4 text-gray-400 shrink-0" />
            <span className="font-normal text-xs truncate">Select room number (or leave unassigned)...</span>
          </div>
        )}
        <ChevronDown
          className={`h-4 w-4 text-gray-400 transition-transform shrink-0 ${
            isOpen ? "rotate-180 text-blue-600" : ""
          }`}
        />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-2xl p-2.5 space-y-2.5 animate-in fade-in-50 zoom-in-95 duration-100">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              autoFocus
              placeholder="Search room number (e.g. 307) or type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-800 placeholder:text-gray-400"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Quick Filter Tags */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] pb-1.5 border-b border-gray-100">
            <button
              type="button"
              onClick={() => setFilterType("all")}
              className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                filterType === "all"
                  ? "bg-gray-900 text-white font-semibold"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              All ({rooms.length})
            </button>
            {categoryFilter && preferredCount > 0 && (
              <button
                type="button"
                onClick={() => setFilterType("preferred")}
                className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                  filterType === "preferred"
                    ? "bg-blue-600 text-white font-semibold"
                    : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                }`}
              >
                {categoryFilter} ({preferredCount})
              </button>
            )}
            <button
              type="button"
              onClick={() => setFilterType("vacant")}
              className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                filterType === "vacant"
                  ? "bg-emerald-600 text-white font-semibold"
                  : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              }`}
            >
              Vacant Only
            </button>
          </div>

          {/* Scrollable Room List */}
          <div className="max-h-56 overflow-y-auto space-y-1 pr-0.5">
            {/* Option to unassign */}
            <div
              onClick={() => {
                onChange("");
                setIsOpen(false);
              }}
              className={`p-2 rounded-lg cursor-pointer flex items-center justify-between text-xs hover:bg-gray-100 transition-colors ${
                !value ? "bg-blue-50 text-blue-900 font-semibold" : "text-gray-600"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-bold">
                  —
                </span>
                <span>Unallocated / Auto Assign Later</span>
              </div>
              {!value && <Check className="h-4 w-4 text-blue-600" />}
            </div>

            {filteredRooms.length === 0 ? (
              <div className="p-4 text-center text-xs text-gray-500">
                No rooms found matching "{search}"
              </div>
            ) : (
              filteredRooms.map((r) => {
                const isSelected =
                  String(value) === String(r.room_id) || String(value) === String(r.room_number);
                const isPreferred =
                  categoryFilter &&
                  String(r.room_type || "").toLowerCase() === categoryFilter.toLowerCase();

                return (
                  <div
                    key={r.room_id || r.room_number}
                    onClick={() => {
                      onChange(r.room_id || r.room_number);
                      setIsOpen(false);
                    }}
                    className={`p-2 rounded-lg cursor-pointer flex items-center justify-between text-xs transition-colors ${
                      isSelected
                        ? "bg-blue-50 border border-blue-400 text-blue-950 font-medium"
                        : "hover:bg-gray-100 border border-transparent text-gray-800"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                      <span className="font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded text-xs min-w-[55px] text-center shrink-0 border border-gray-200">
                        Room {r.room_number}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-medium text-gray-800 truncate">
                            {r.room_type}
                          </span>
                          {isPreferred && (
                            <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded font-semibold shrink-0">
                              ★ Match
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          Floor {r.floor || 1}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                          String(r.status).toLowerCase() === "vacant"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {r.status}
                      </span>
                      {isSelected && <Check className="h-4 w-4 text-blue-600 shrink-0" />}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const CancelBooking = () => {
  const { bookings, guests, rooms, fetchBookings, fetchGuests, cancelGuestBooking, updateBooking, amendBooking } =
    useAppContext();
    const {userData} = useAuthContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dayFilter, setDayFilter] = useState("all"); // "all", "today", "tomorrow", "upcoming", "custom"
  const [customDateFilter, setCustomDateFilter] = useState("");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [sortOrder, setSortOrder] = useState("asc"); // "asc" or "desc"
  const [refreshing, setRefreshing] = useState(false);

  // Helper: Normalize date across all formats (DD/MM/YYYY, YYYY-MM-DD, timestamps, ISO)
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

  // Helper to get YYYY-MM-DD for <input type="date" /> in local time
  const toInputDate = (d) => {
    const ts = normalizeDate(d);
    if (!ts) return "";
    const dt = new Date(ts);
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    const day = String(dt.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const todayTs = React.useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0).getTime();
  }, []);

  const tomorrowTs = React.useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0).getTime();
  }, []);

  // Edit booking states
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [assignedRooms, setAssignedRooms] = useState([]); // array of room_ids for each room slot
  const [editFormData, setEditFormData] = useState({
    // Guest details
    full_name: "",
    mobile: "",
    email: "",
    // Booking details
    checkin_date: "",
    checkout_date: "",
    room_category: "",
    no_of_rooms: 1,
    no_of_persons: 1,
  });

  const availableCategories = React.useMemo(() => {
    const dynamicCategories = (rooms || [])
      .map((r) => r.room_type)
      .filter((t) => Boolean(t && typeof t === "string" && t.trim().length > 0));
    const fromBooking = [
      editingBooking?.room_category,
      editingBooking?.room_type,
      editFormData?.room_category,
      ...(editingBooking?.rooms_config?.map((rc) => rc.room_category || rc.room_type) || []),
    ].filter((t) => Boolean(t && typeof t === "string" && t.trim().length > 0));
    const standardCategories = [
      "Standard",
      "Deluxe",
      "Super Deluxe",
      "Executive",
      "Suite",
      "Single",
      "Double",
      "Family",
    ];
    return Array.from(new Set([...fromBooking, ...dynamicCategories, ...standardCategories]));
  }, [rooms, editingBooking, editFormData?.room_category]);

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      if (fetchBookings) await fetchBookings();
      if (fetchGuests) await fetchGuests();
    };
    fetchData();
  }, []);

  // Refresh function
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await Promise.all([
        fetchBookings(),
        fetchGuests()
      ]);
      toast.success("Data refreshed successfully");
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast.error("Failed to refresh data");
    } finally {
      setRefreshing(false);
    }
  };

  // Get guest details for a booking
  const getGuestDetails = (booking) => {
    if (booking.full_name) {
      return {
        full_name: booking.full_name,
        mobile: booking.mobile,
        email: booking.email,
        gender: booking.gender,
        nationality: booking.nationality,
        id_proof_type: booking.id_proof_type,
        id_proof_number: booking.id_proof_number,
        address: booking.address,
        city: booking.city,
        state: booking.state,
        pincode: booking.pincode,
        country: booking.country,
        guest_category: booking.guest_category,
        gst_no: booking.gst_no,
        company_name: booking.company_name,
        booked_by: booking.booked_by,
        pickup_details: booking.pickup_details,
        dropoff_details: booking.dropoff_details
      };
    }
    
    return (
      guests?.find(
        (guest) =>
          guest.guest_id === booking.guest_id ||
          guest.id === booking.guest_id ||
          guest._id === booking.guest_id
      ) || {}
    );
  };

  // Filter cancellable bookings (Reserved only), merged with local metadata cache
  const cancellableBookings = React.useMemo(() => {
    let localMeta = {};
    try {
      localMeta = JSON.parse(localStorage.getItem("hotel_bookings_meta") || "{}");
    } catch (_) {}

    return (bookings || [])
      .filter(
        (booking) =>
          booking.status === "Reserved" || booking.status === "reserved"
      )
      .map((b) => {
        const meta = localMeta[b.booking_id];
        if (meta) {
          return { ...b, ...meta };
        }
        return b;
      });
  }, [bookings]);

  // Prediction and daily statistics
  const bookingPredictions = React.useMemo(() => {
    let arrivingToday = 0;
    let arrivingTomorrow = 0;
    let departuresToday = 0;

    (cancellableBookings || []).forEach((b) => {
      const cin = normalizeDate(b.checkin_date);
      const cout = normalizeDate(b.checkout_date);
      if (cin === todayTs) arrivingToday++;
      if (cin === tomorrowTs) arrivingTomorrow++;
      if (cout === todayTs) departuresToday++;
    });

    return {
      total: cancellableBookings.length,
      arrivingToday,
      arrivingTomorrow,
      departuresToday,
    };
  }, [cancellableBookings, todayTs, tomorrowTs]);

  // Helper to convert room_id or room_number to actual human-readable room number (e.g. "307")
  const getRoomDisplayNumber = (val) => {
    if (!val || val === "none") return "";
    const strVal = String(val).trim().toLowerCase();
    const matched = (rooms || []).find(
      (r) =>
        String(r.room_id || "").toLowerCase() === strVal ||
        String(r.room_number || "").toLowerCase() === strVal ||
        String(r.id || "").toLowerCase() === strVal ||
        String(r._id || "").toLowerCase() === strVal
    );
    if (matched && matched.room_number) return String(matched.room_number);
    const s = String(val).trim();
    if (s.length <= 6 && !s.includes("-") && !s.toLowerCase().includes("room_")) return s;
    return "";
  };

  // Helper to get clean assigned room numbers for a booking
  const getBookingAssignedRoomNumbers = (b) => {
    if (!b) return [];
    const numbers = [];

    if (Array.isArray(b.rooms_config)) {
      b.rooms_config.forEach((rc) => {
        const num = getRoomDisplayNumber(rc.room_number) || getRoomDisplayNumber(rc.room_id);
        if (num && !numbers.includes(String(num))) numbers.push(String(num));
      });
    }

    if (b.room_number) {
      const num = getRoomDisplayNumber(b.room_number);
      if (num && !numbers.includes(num)) numbers.push(num);
    }

    if (b.allocated_room) {
      const num = getRoomDisplayNumber(b.allocated_room);
      if (num && !numbers.includes(num)) numbers.push(num);
    }

    const rawIds = Array.isArray(b.room_id)
      ? b.room_id
      : typeof b.room_id === "string" && b.room_id.trim() && b.room_id !== "none"
      ? [b.room_id.trim()]
      : [];

    rawIds.forEach((id) => {
      const num = getRoomDisplayNumber(id);
      if (num && !numbers.includes(num)) numbers.push(num);
    });

    return numbers;
  };

  // Filter bookings based on search, status, and day-wise selection
  const filteredBookings = cancellableBookings.filter((booking) => {
    const guest = getGuestDetails(booking);
    const guestName = guest.full_name || guest.name || guest.guest_name || "";
    const searchLower = searchTerm.toLowerCase();

    const assignedNums = getBookingAssignedRoomNumbers(booking);
    const matchesRoomNum = assignedNums.some((num) => num.toLowerCase().includes(searchLower));

    const matchesSearch =
      (booking.booking_id &&
        booking.booking_id.toString().toLowerCase().includes(searchLower)) ||
      guestName.toLowerCase().includes(searchLower) ||
      matchesRoomNum ||
      (booking.room_type &&
        booking.room_type.toLowerCase().includes(searchLower)) ||
      (booking.room_category &&
        booking.room_category.toLowerCase().includes(searchLower));

    const matchesStatus =
      statusFilter === "all" ||
      booking.status.toLowerCase() === statusFilter.toLowerCase();

    // Day-wise filtering
    let matchesDay = true;
    const cin = normalizeDate(booking.checkin_date);
    const cout = normalizeDate(booking.checkout_date);

    if (dayFilter === "today") {
      matchesDay = cin === todayTs || (cin <= todayTs && cout && todayTs <= cout);
    } else if (dayFilter === "tomorrow") {
      matchesDay = cin === tomorrowTs || (cin <= tomorrowTs && cout && tomorrowTs <= cout);
    } else if (dayFilter === "upcoming") {
      const in7Days = todayTs + 7 * 24 * 60 * 60 * 1000;
      matchesDay = (cin >= todayTs && cin <= in7Days) || (cin <= todayTs && cout && cout >= todayTs);
    } else if (dayFilter === "custom" && customDateFilter) {
      const targetTs = normalizeDate(customDateFilter);
      if (targetTs > 0) {
        if (cout && cout > cin) {
          matchesDay = cin === targetTs || (cin <= targetTs && targetTs <= cout);
        } else {
          matchesDay = cin === targetTs;
        }
      }
    }

    return matchesSearch && matchesStatus && matchesDay;
  });

  // Sort bookings by check-in date
  const sortedBookings = [...filteredBookings].sort((a, b) => {
    const dateA = normalizeDate(a.checkin_date);
    const dateB = normalizeDate(b.checkin_date);
    
    if (sortOrder === "asc") {
      return dateA - dateB;
    } else {
      return dateB - dateA;
    }
  });

  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  // Format date for display
  const formatDate = (dateValue) => {
    if (!dateValue) return "N/A";
    const ts = normalizeDate(dateValue);
    if (!ts) return String(dateValue);
    const date = new Date(ts);
    return date.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount || 0);
  };

  // Calculate estimated booking value
  const calculateBookingValue = (booking) => {
    const cin = normalizeDate(booking.checkin_date);
    const cout = normalizeDate(booking.checkout_date);
    const stayDuration = cout > cin ? Math.ceil((cout - cin) / (1000 * 60 * 60 * 24)) : 1;
    const baseRate = 2000; // Assuming base room rate
    let totalValue = baseRate * stayDuration;

    // Add service charges if any
    if (booking.services) {
      Object.keys(booking.services).forEach((date) => {
        if (Array.isArray(booking.services[date])) {
          booking.services[date].forEach((service) => {
            totalValue +=
              (service.food_charges || 0) +
              (service.minibar_charges || 0) +
              (service.laundry_charges || 0) +
              (service.extra_bed_charges || 0) +
              (service.manual_charges || 0);
          });
        }
      });
    }

    // Apply discount (now in rupees)
    if (booking.discount > 0) {
      totalValue = totalValue - booking.discount;
    }

    return totalValue;
  };

  // Open cancel dialog
  const openCancelDialog = (booking) => {
    setSelectedBooking(booking);
    setCancellationReason("");
    setShowCancelDialog(true);
  };

  // Open edit dialog
  const openEditDialog = (booking) => {
    const guest = getGuestDetails(booking);
    const category =
      booking.room_category ||
      booking.room_type ||
      booking?.rooms_config?.[0]?.room_category ||
      booking?.rooms_config?.[0]?.room_type ||
      "";

    // Extract assigned room ids or numbers
    const assignedIds = (
      Array.isArray(booking.room_id)
        ? booking.room_id
        : typeof booking.room_id === "string" && booking.room_id.trim() && booking.room_id !== "none"
        ? [booking.room_id.trim()]
        : (booking.rooms_config || []).map((r) => r.room_id || r.room_number).filter(Boolean)
    ).slice();

    if (assignedIds.length === 0 && (booking.room_number || booking.allocated_room)) {
      const singleNum = booking.room_number || booking.allocated_room;
      if (singleNum && singleNum !== "none") assignedIds.push(String(singleNum));
    }

    const roomCount = Math.max(
      1,
      parseInt(booking.no_of_rooms || booking.number_of_rooms || (booking?.rooms_config ? booking.rooms_config.length : 1), 10) || 1
    );

    const initialAssigned = Array.from({ length: roomCount }).map((_, i) => {
      const existingConfig = booking.rooms_config?.[i];
      const val = assignedIds[i] || existingConfig?.room_id || existingConfig?.room_number || "";
      return val ? String(val) : "";
    });

    setAssignedRooms(initialAssigned);
    setEditingBooking(booking);
    setEditFormData({
      full_name: guest.full_name || guest.name || guest.guest_name || "",
      mobile: guest.mobile || guest.phone || "",
      email: guest.email || "",
      checkin_date: toInputDate(booking.checkin_date),
      checkout_date: toInputDate(booking.checkout_date),
      room_category: category,
      no_of_rooms: roomCount,
      no_of_persons: booking.no_of_persons || booking.no_of_adults || 1,
    });
    setShowEditDialog(true);
  };

  // Handle form input changes
  const handleEditFormChange = (field, value) => {
    setEditFormData((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "no_of_rooms") {
        const count = Math.max(1, parseInt(value, 10) || 1);
        setAssignedRooms((prevAssigned) => {
          const next = [...prevAssigned];
          if (next.length < count) {
            while (next.length < count) next.push("");
          } else if (next.length > count) {
            next.length = count;
          }
          return next;
        });
      }
      return updated;
    });
  };

  const handleRoomAssignmentChange = (slotIndex, selectedRoomId) => {
    setAssignedRooms((prev) => {
      const next = [...prev];
      next[slotIndex] = selectedRoomId === "none" ? "" : selectedRoomId;
      return next;
    });
  };

  // Save edited booking
  const saveEditedBooking = async () => {
    if (!editingBooking || !editFormData.full_name.trim() || !editFormData.mobile.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!editFormData.checkin_date || !editFormData.checkout_date) {
      toast.error("Please select both check-in and check-out dates");
      return;
    }

    const checkinDate = new Date(editFormData.checkin_date);
    const checkoutDate = new Date(editFormData.checkout_date);
    
    if (checkinDate >= checkoutDate) {
      toast.error("Check-out date must be after check-in date");
      return;
    }

    setLoading(true);
    try {
      const guest = getGuestDetails(editingBooking);
      
      // Prepare guest data
      const guestData = {
        ...guest,
        full_name: editFormData.full_name,
        mobile: editFormData.mobile,
        email: editFormData.email,
        updated_at: Date.now(),
      };

      const finalCategory = (editFormData.room_category || editingBooking.room_category || editingBooking.room_type || "").trim();
      const finalRooms = Math.max(1, parseInt(editFormData.no_of_rooms, 10) || 1);
      const finalPersons = Math.max(1, parseInt(editFormData.no_of_persons, 10) || 1);

      // Prepare room assignment metadata
      const assignedRoomIds = assignedRooms.filter((id) => id && id !== "none");
      const assignedRoomsConfig = Array.from({ length: finalRooms }).map((_, i) => {
        const assignedId = assignedRooms[i];
        const matchedRoom = rooms?.find(
          (r) =>
            String(r.room_id) === String(assignedId) ||
            String(r.room_number) === String(assignedId)
        );
        return {
          room_index: i + 1,
          room_category: matchedRoom?.room_type || finalCategory,
          room_type: matchedRoom?.room_type || finalCategory,
          room_id: matchedRoom ? String(matchedRoom.room_id) : (assignedId || ""),
          room_number: matchedRoom ? String(matchedRoom.room_number) : (assignedId || ""),
        };
      });

      // Save to localStorage cache so other views update immediately
      try {
        const rawStore = localStorage.getItem("hotel_bookings_meta") || "{}";
        const store = JSON.parse(rawStore);
        store[editingBooking.booking_id] = {
          ...(store[editingBooking.booking_id] || {}),
          no_of_rooms: finalRooms,
          number_of_rooms: finalRooms,
          no_of_persons: finalPersons,
          no_of_adults: finalPersons,
          room_category: finalCategory,
          room_type: finalCategory,
          room_id: assignedRoomIds,
          rooms_config: assignedRoomsConfig,
        };
        localStorage.setItem("hotel_bookings_meta", JSON.stringify(store));
      } catch (err) {
        console.error("Error saving booking meta to localStorage:", err);
      }

      // Prepare booking data
      const bookingData = {
        ...editingBooking,
        checkin_date: editFormData.checkin_date,
        checkout_date: editFormData.checkout_date,
        room_category: finalCategory,
        room_type: finalCategory,
        no_of_rooms: finalRooms,
        number_of_rooms: finalRooms,
        no_of_persons: finalPersons,
        no_of_adults: finalPersons,
        room_id: assignedRoomIds.length > 0 ? assignedRoomIds : editingBooking.room_id,
        rooms_config: assignedRoomsConfig,
        updated_at: Date.now(),
      };

      // Amend the booking using amendBooking function
      await amendBooking({
        bookingId: editingBooking.booking_id,
        bookingData,
        guestData
      });

      toast.success("Booking and room assignments updated successfully!");
      setShowEditDialog(false);
      setEditingBooking(null);
      setAssignedRooms([]);
      setEditFormData({
        full_name: "",
        mobile: "",
        email: "",
        checkin_date: "",
        checkout_date: "",
        room_category: "",
        no_of_rooms: 1,
        no_of_persons: 1,
      });
    } catch (error) {
      console.error("Error amending booking:", error);
      toast.error("Failed to update booking");
    } finally {
      setLoading(false);
    }
  };


  // Cancel booking
  const cancelBooking = async () => {
    if (!selectedBooking || !cancellationReason.trim()) {
      toast.error("Please provide a cancellation reason");
      return;
    }

    setLoading(true);
    try {
      // Simulate API call to cancel booking
    

      // Here you would make the actual API call to cancel the booking
      const cancelledBooking = {
        ...selectedBooking,
        status: "Cancelled",
        cancellation_reason: cancellationReason,
        cancelled_at: new Date().getTime(),
        updated_at: new Date().getTime(),
      };

      await cancelGuestBooking({
        bookingId: selectedBooking.booking_id,
        cancellationData: {
          cancellation_reason: cancellationReason,
          cancelled_by: userData?.name // You can get this from user context if available
        }
      });


      toast.success(
        `Booking ${selectedBooking.booking_id} cancelled successfully!`
      );
      setShowCancelDialog(false);
      setSelectedBooking(null);
      setCancellationReason("");
    } catch (error) {
      toast.error("Failed to cancel booking");
    } finally {
      setLoading(false);
    }
  };
  // Get status badge color
  const getStatusBadgeVariant = (status) => {
    switch (status.toLowerCase()) {
      case "reserved":
        return "default";
      default:
        return "outline";
    }
  };

  return (
    <div className="pl-6 max-sm:p-4">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Cancel Booking
          </h2>
          <p className="text-gray-600">
            Cancel reserved bookings and process refunds
          </p>
        </div>
        <RefreshButton
          onRefresh={handleRefresh}
          loading={refreshing}
          size="sm"
        />
      </div>

      {/* Day-Wise Prediction & Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {/* Total Cancellable / Reserved */}
        <div
          onClick={() => { setDayFilter("all"); setCustomDateFilter(""); }}
          className={`cursor-pointer p-4 rounded-xl border transition-all shadow-sm ${
            dayFilter === "all"
              ? "bg-blue-50/60 border-blue-400 ring-2 ring-blue-200"
              : "bg-white border-gray-200 hover:border-blue-300 hover:bg-gray-50"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Reserved</span>
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Bed className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">{bookingPredictions.total}</span>
            <span className="text-xs text-gray-500">Active Bookings</span>
          </div>
        </div>

        {/* Arriving Today */}
        <div
          onClick={() => { setDayFilter("today"); setCustomDateFilter(""); }}
          className={`cursor-pointer p-4 rounded-xl border transition-all shadow-sm ${
            dayFilter === "today"
              ? "bg-amber-50/70 border-amber-400 ring-2 ring-amber-200"
              : "bg-white border-gray-200 hover:border-amber-300 hover:bg-gray-50"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">Arriving Today</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-900">{bookingPredictions.arrivingToday}</span>
            <span className="text-xs text-amber-700 font-medium">Check-ins today</span>
          </div>
        </div>

        {/* Tomorrow's Arrivals (Prediction) */}
        <div
          onClick={() => { setDayFilter("tomorrow"); setCustomDateFilter(""); }}
          className={`cursor-pointer p-4 rounded-xl border transition-all shadow-sm ${
            dayFilter === "tomorrow"
              ? "bg-purple-50/70 border-purple-400 ring-2 ring-purple-200"
              : "bg-white border-gray-200 hover:border-purple-300 hover:bg-gray-50"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-700">Tomorrow's Arrivals</span>
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-purple-900">{bookingPredictions.arrivingTomorrow}</span>
            <span className="text-xs text-purple-700 font-medium">Prediction</span>
          </div>
        </div>

        {/* Departures Today */}
        <div className="p-4 rounded-xl border bg-white border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Departures Today</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-900">{bookingPredictions.departuresToday}</span>
            <span className="text-xs text-emerald-700 font-medium">Check-outs</span>
          </div>
        </div>
      </div>

      {/* Search and Day-Wise Filters */}
      <Card className="mb-6 border-gray-200 shadow-sm">
        <CardContent className="p-4 space-y-3">
          {/* Day-Wise Filter Pills */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-gray-500 mr-1">Filter by Day:</span>
              <button
                type="button"
                onClick={() => { setDayFilter("all"); setCustomDateFilter(""); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  dayFilter === "all"
                    ? "bg-gray-900 text-white shadow-xs"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All Dates ({cancellableBookings.length})
              </button>
              <button
                type="button"
                onClick={() => { setDayFilter("today"); setCustomDateFilter(""); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  dayFilter === "today"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100"
                }`}
              >
                Today ({bookingPredictions.arrivingToday})
              </button>
              <button
                type="button"
                onClick={() => { setDayFilter("tomorrow"); setCustomDateFilter(""); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  dayFilter === "tomorrow"
                    ? "bg-purple-600 text-white shadow-xs"
                    : "bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100"
                }`}
              >
                Tomorrow ({bookingPredictions.arrivingTomorrow})
              </button>
              <button
                type="button"
                onClick={() => { setDayFilter("upcoming"); setCustomDateFilter(""); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  dayFilter === "upcoming"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100"
                }`}
              >
                Next 7 Days
              </button>

              {/* Active Custom Date Pill */}
              {customDateFilter && (
                <button
                  type="button"
                  onClick={() => setDayFilter("custom")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    dayFilter === "custom"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100"
                  }`}
                >
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Date: {formatDate(customDateFilter)}</span>
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      setCustomDateFilter("");
                      setDayFilter("all");
                    }}
                    className="ml-1 text-sm font-bold leading-none hover:text-red-200 cursor-pointer"
                    title="Remove custom date"
                  >
                    ×
                  </span>
                </button>
              )}
            </div>

            {/* Pick Date Calendar Input */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-gray-600 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-blue-600" />
                <span>Pick Date:</span>
              </label>
              <input
                type="date"
                value={customDateFilter}
                onChange={(e) => {
                  const val = e.target.value;
                  setCustomDateFilter(val);
                  if (val) {
                    setDayFilter("custom");
                  } else {
                    setDayFilter("all");
                  }
                }}
                className="text-xs px-2.5 py-1.5 border border-gray-300 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs cursor-pointer font-medium"
              />
              {(dayFilter !== "all" || customDateFilter || searchTerm) && (
                <button
                  type="button"
                  onClick={() => {
                    setDayFilter("all");
                    setCustomDateFilter("");
                    setSearchTerm("");
                  }}
                  className="text-xs text-red-600 hover:text-red-800 hover:underline font-semibold ml-1 cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by booking ID, guest name, room number or type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Bookings List */}
      <div className="space-y-4">
        {/* Sort Header */}
        {sortedBookings.length > 0 && (
          <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSortOrder}
              className="h-7 px-2 text-xs"
            >
              <ArrowUpDown className="h-3 w-3 mr-1" />
              {sortOrder === "asc" ? "Earliest First" : "Latest First"}
            </Button>
            <span className="text-xs text-gray-500">
              {sortedBookings.length} booking{sortedBookings.length !== 1 ? "s" : ""}
            </span>
          </div>
        )}

        {/* Bookings List */}
        <div className="space-y-2">
          {sortedBookings.map((booking) => {
            const guest = getGuestDetails(booking);
            const bookingValue = calculateBookingValue(booking);
            const cin = normalizeDate(booking.checkin_date);
            const isToday = cin === todayTs;
            const isTomorrow = cin === tomorrowTs;

            return (
              <div key={booking.booking_id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                {/* Guest Info */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-gray-900 truncate">
                      {guest.full_name || guest.name || guest.guest_name || "Guest Name Not Available"}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mt-0.5">
                      <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                        {booking.booking_id}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {guest.mobile || guest.phone || "N/A"}
                      </span>
                      {(booking.booked_by || guest.booked_by) && (
                        <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded text-[10px] font-medium">
                          Booked by: {booking.booked_by || guest.booked_by}
                        </span>
                      )}
                      {(booking.pickup_details || guest.pickup_details) && (
                        <span className="bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded text-[10px]">
                          Pickup: {booking.pickup_details || guest.pickup_details}
                        </span>
                      )}
                      {(booking.dropoff_details || guest.dropoff_details) && (
                        <span className="bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded text-[10px]">
                          Drop: {booking.dropoff_details || guest.dropoff_details}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Dates */}
                <div className="flex flex-col items-center justify-center gap-1">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-xs text-gray-500">Check-in</div>
                      <div className="font-medium text-gray-900">
                        {formatDate(booking.checkin_date)}
                      </div>
                    </div>
                    <div className="w-px h-6 bg-gray-300"></div>
                    <div className="text-center">
                      <div className="text-xs text-gray-500">Check-out</div>
                      <div className="font-medium text-gray-900">
                        {formatDate(booking.checkout_date)}
                      </div>
                    </div>
                  </div>
                  {isToday && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                      Arriving Today
                    </span>
                  )}
                  {isTomorrow && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-300">
                      Tomorrow's Arrival
                    </span>
                  )}
                </div>

                {/* Room Requirement & Allocation Details */}
                <div className="hidden md:flex flex-col text-right justify-center px-2 gap-1">
                  <div className="flex items-center justify-end gap-1.5">
                    <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {booking.room_category || booking.room_type || "Standard"}
                    </span>
                    {(() => {
                      const assignedNums = getBookingAssignedRoomNumbers(booking);

                      if (assignedNums.length > 0) {
                        return (
                          <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300 flex items-center gap-1">
                            <Bed className="h-3 w-3 text-emerald-600" />
                            Room {assignedNums.join(", ")}
                          </span>
                        );
                      }
                      return (
                        <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          Unassigned
                        </span>
                      );
                    })()}
                  </div>
                  <span className="text-[11px] text-gray-500">
                    {booking.no_of_rooms || booking.number_of_rooms || 1} Room(s) • {booking.no_of_persons || booking.no_of_adults || 1} Person(s)
                  </span>
                </div>

                {/* Actions */}
                <div className="ml-3 flex-shrink-0 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(booking)}
                    className="h-7 px-2.5 text-xs text-blue-700 border-blue-200 hover:bg-blue-50 font-medium flex items-center gap-1"
                  >
                    <Bed className="h-3 w-3 text-blue-600" />
                    Assign / Edit
                  </Button>
                  
                  <Dialog
                    open={
                      showCancelDialog &&
                      selectedBooking?.booking_id === booking.booking_id
                    }
                    onOpenChange={setShowCancelDialog}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => openCancelDialog(booking)}
                        className="h-7 px-3 text-xs"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Cancel
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-red-600" />
                          Cancel Booking
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        {/* Booking Summary */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium text-gray-900 mb-2">
                            Booking Summary
                          </h4>
                          <div className="space-y-1 text-sm">
                            <p>
                              <span className="font-medium">
                                Booking ID:
                              </span>{" "}
                              {booking.booking_id}
                            </p>
                            <p>
                              <span className="font-medium">Guest:</span>{" "}
                              {guest.full_name || guest.name || "Guest"}
                            </p>
                            <p>
                              <span className="font-medium">
                                Total Value:
                              </span>{" "}
                              {formatCurrency(bookingValue)}
                            </p>
                            {(() => {
                              const assigned = getBookingAssignedRoomNumbers(booking);
                              return assigned.length > 0 ? (
                                <p>
                                  <span className="font-medium">Room:</span> Room {assigned.join(", ")}
                                </p>
                              ) : null;
                            })()}
                            {(booking.booked_by || guest.booked_by) && (
                              <p>
                                <span className="font-medium">Booked By:</span>{" "}
                                {booking.booked_by || guest.booked_by}
                              </p>
                            )}
                            {(booking.pickup_details || guest.pickup_details) && (
                              <p>
                                <span className="font-medium">Pickup:</span>{" "}
                                {booking.pickup_details || guest.pickup_details}
                              </p>
                            )}
                            {(booking.dropoff_details || guest.dropoff_details) && (
                              <p>
                                <span className="font-medium">Drop-off:</span>{" "}
                                {booking.dropoff_details || guest.dropoff_details}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Cancellation Details */}
                        <div>
                          <Label>Cancellation Reason *</Label>
                          <Textarea
                            value={cancellationReason}
                            onChange={(e) =>
                              setCancellationReason(e.target.value)
                            }
                            placeholder="Please provide reason for cancellation..."
                            className="mt-1"
                          />
                        </div>


                        {/* Warning */}
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                            <div className="text-sm text-red-800">
                              <p className="font-medium">Warning</p>
                              <p>
                                This action cannot be undone. The booking
                                will be permanently cancelled.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setShowCancelDialog(false)}
                          disabled={loading}
                        >
                          Keep Booking
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={cancelBooking}
                          disabled={loading || !cancellationReason.trim()}
                        >
                          {loading ? "Cancelling..." : "Cancel Booking"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            );
          })}
        </div>

        {/* Edit Booking Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-xl w-[95vw] max-h-[85vh] p-0 flex flex-col overflow-hidden">
            <DialogHeader className="p-4 pb-3 border-b flex-shrink-0">
              <DialogTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5 text-blue-600" />
                Edit Booking Details
              </DialogTitle>
            </DialogHeader>
            <div className="p-4 pb-12 overflow-y-auto flex-1 space-y-4">
              {/* Booking & Room Summary Banner */}
              <div className="bg-blue-50 border border-blue-200 p-3.5 rounded-lg text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-blue-900 text-sm">
                    Booking #{editingBooking?.booking_id}
                  </h4>
                  <Badge className="bg-blue-600 text-white font-semibold text-xs">
                    {editingBooking?.room_category || editingBooking?.room_type || editFormData.room_category || "N/A"}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-blue-800">
                  <span>
                    <strong>Rooms:</strong> {editFormData.no_of_rooms || editingBooking?.no_of_rooms || 1} Room(s)
                  </span>
                  <span>
                    <strong>Persons:</strong> {editFormData.no_of_persons || editingBooking?.no_of_persons || editingBooking?.no_of_adults || 1} Person(s)
                  </span>
                  {(() => {
                    const currentAssignedNums = assignedRooms
                      .map((id) => getRoomDisplayNumber(id))
                      .filter(Boolean);
                    const displayNums = currentAssignedNums.length > 0
                      ? currentAssignedNums
                      : getBookingAssignedRoomNumbers(editingBooking);

                    if (displayNums.length > 0) {
                      return (
                        <span>
                          <strong>Assigned Room:</strong> Room {displayNums.join(", ")}
                        </span>
                      );
                    }
                    return (
                      <span className="text-amber-800 font-medium">
                        <strong>Assigned Room:</strong> Unassigned
                      </span>
                    );
                  })()}
                </div>
                {editingBooking?.rooms_config && editingBooking.rooms_config.length > 0 && (
                  <div className="pt-1.5 border-t border-blue-200/60 flex flex-wrap gap-1">
                    {editingBooking.rooms_config.map((r, i) => {
                      const displayNum = getRoomDisplayNumber(r.room_number) || getRoomDisplayNumber(r.room_id);
                      return (
                        <span
                          key={i}
                          className="bg-white border border-blue-200 text-blue-900 px-1.5 py-0.5 rounded text-[11px] font-medium"
                        >
                          Room {r.room_index || i + 1}: <strong>{r.room_category || r.room_type || "Standard"}</strong>
                          {displayNum ? ` (No. ${displayNum})` : ""}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Guest Details */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Guest Details</h4>
                
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="full_name">Full Name *</Label>
                    <Input
                      id="full_name"
                      value={editFormData.full_name}
                      onChange={(e) => handleEditFormChange("full_name", e.target.value)}
                      placeholder="Enter guest full name"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="mobile">Mobile Number *</Label>
                    <Input
                      id="mobile"
                      value={editFormData.mobile}
                      onChange={(e) => handleEditFormChange("mobile", e.target.value)}
                      placeholder="Enter mobile number"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={editFormData.email}
                      onChange={(e) => handleEditFormChange("email", e.target.value)}
                      placeholder="Enter email address"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Booking Dates */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Booking Dates</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="checkin_date">Check-in Date *</Label>
                    <Input
                      id="checkin_date"
                      type="date"
                      value={editFormData.checkin_date}
                      onChange={(e) => handleEditFormChange("checkin_date", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="checkout_date">Check-out Date *</Label>
                    <Input
                      id="checkout_date"
                      type="date"
                      value={editFormData.checkout_date}
                      onChange={(e) => handleEditFormChange("checkout_date", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Room & Guest Requirements */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Room & Guest Requirements</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="edit_room_category">Room Category *</Label>
                    <Select
                      value={editFormData.room_category}
                      onValueChange={(val) => handleEditFormChange("room_category", val)}
                    >
                      <SelectTrigger id="edit_room_category" className="mt-1">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCategories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="edit_no_of_rooms">Number of Rooms *</Label>
                    <Input
                      id="edit_no_of_rooms"
                      type="number"
                      min="1"
                      value={editFormData.no_of_rooms}
                      onChange={(e) => handleEditFormChange("no_of_rooms", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="edit_no_of_persons">Number of Persons *</Label>
                    <Input
                      id="edit_no_of_persons"
                      type="number"
                      min="1"
                      value={editFormData.no_of_persons}
                      onChange={(e) => handleEditFormChange("edit_no_of_persons", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Room Assignment Section */}
              <div className="space-y-3 pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Bed className="h-4 w-4 text-blue-600" />
                    Assign Room(s)
                  </h4>
                  <span className="text-xs text-gray-500">
                    Select room numbers to allocate to this booking
                  </span>
                </div>

                <div className="space-y-3">
                  {Array.from({ length: Math.max(1, parseInt(editFormData.no_of_rooms, 10) || 1) }).map((_, slotIndex) => {
                    const currentAssignedId = assignedRooms[slotIndex] || "";
                    const categoryFilter = editFormData.room_category || editingBooking?.room_category || "";

                    return (
                      <div key={slotIndex} className="p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-semibold text-gray-700">
                            Room #{slotIndex + 1} Assignment
                          </Label>
                          {(() => {
                            const displayNum = getRoomDisplayNumber(currentAssignedId);
                            return displayNum ? (
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded border border-emerald-300">
                                Allocated: Room {displayNum}
                              </span>
                            ) : (
                              <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded border border-amber-300">
                                Unallocated
                              </span>
                            );
                          })()}
                        </div>

                        <SearchableRoomSelect
                          value={currentAssignedId}
                          onChange={(selectedId) => handleRoomAssignmentChange(slotIndex, selectedId)}
                          rooms={rooms}
                          categoryFilter={categoryFilter}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Current Booking Summary */}
              {editingBooking && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium">Current Booking Summary</p>
                      <p>
                        Category: {editingBooking.room_category || editingBooking.room_type || "N/A"}
                        {(() => {
                          const assigned = getBookingAssignedRoomNumbers(editingBooking);
                          return assigned.length > 0 ? ` | Assigned: Room ${assigned.join(", ")}` : " | Room: Unassigned";
                        })()}
                      </p>
                      <p>
                        Requirements: {editingBooking.no_of_rooms || 1} Room(s) • {editingBooking.no_of_persons || editingBooking.no_of_adults || 1} Person(s)
                      </p>
                      <p>Status: <Badge variant={getStatusBadgeVariant(editingBooking.status)}>{editingBooking.status}</Badge></p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter className="p-3 border-t bg-gray-50 flex-shrink-0 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowEditDialog(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={saveEditedBooking}
                disabled={loading}
              >
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {sortedBookings.length === 0 && (
          <Card className="border border-dashed border-gray-300">
            <CardContent className="p-10 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
                <Calendar className="h-6 w-6" />
              </div>
              <h3 className="text-base font-semibold text-gray-800 mb-1">
                No Bookings Found
              </h3>
              <p className="text-xs text-gray-500 mb-4 max-w-sm mx-auto">
                {searchTerm || dayFilter !== "all" || customDateFilter
                  ? `No bookings match your current filter ${dayFilter !== "all" ? `(${dayFilter})` : ""} ${customDateFilter ? `(${formatDate(customDateFilter)})` : ""} or search query.`
                  : "No active reserved bookings available to cancel or amend."}
              </p>
              {(searchTerm || dayFilter !== "all" || customDateFilter) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDayFilter("all");
                    setCustomDateFilter("");
                    setSearchTerm("");
                  }}
                  className="text-xs"
                >
                  Clear All Filters
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CancelBooking;
