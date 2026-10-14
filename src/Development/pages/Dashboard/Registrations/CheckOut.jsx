import { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "../../../components/ui/button.js";
import { Input } from "../../../components/ui/input.js";
import { Label } from "../../../components/ui/label.js";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card.js";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table.js";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select.js";
import { Badge } from "../../../components/ui/badge.js";
import { Textarea } from "../../../components/ui/textarea.js";
import {
  Calendar,
  Phone,
  Mail,
  Hotel,
  Search,
  LogOut,
  CheckCircle,
  Receipt,
  X,
  Lock,
  Building,
  Plus,
  PlusCircle,
  RefreshCw,
} from "lucide-react";
import { useAppContext } from "../../../context/AppContext.jsx";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useAuthContext } from "../../../context/AuthContext.jsx";

const CheckOut = () => {
  const navigate = useNavigate();
  const {
    loading,
    bookings,
    guests,
    rooms,
    staffs,
    companies = [],
    createCompany,
    calculateTotalBill,
    checkoutGuest,
    fetchBookings,
    fetchGuests,
    fetchRooms,
    addExpense,
  } = useAppContext();
  const { userData } = useAuthContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [billData, setBillData] = useState(null);
  const [pageLoading, setPageLoading] = useState(false);
  const [isBillLoading, setIsBillLoading] = useState(false);
  const [checkoutFormData, setCheckoutFormData] = useState({
    payment_mode: "",
    upi_platform: "",
    custom_upi_platform: "",
    received_by_staff_id: userData.cognitoId || "",
    notes: "",
    // Company fields for BTC payments
    company_id: "",
    gst_no: "",
  });
  console.log("userData 😂😂😂😂😂", userData);
  // Validation errors state
  const [validationErrors, setValidationErrors] = useState({
    payment_mode: "",
    upi_platform: "",
    custom_upi_platform: "",
    received_by_staff_id: userData.cognitoId || "",
    company_id: "",
    gst_no: "",
  });

  // Company autocomplete state
  const [companyQuery, setCompanyQuery] = useState("");
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const companyFieldRef = useRef(null);

  // Create Company Dialog state
  const [isCreateCompanyOpen, setIsCreateCompanyOpen] = useState(false);
  const [newCompany, setNewCompany] = useState({
    name: "",
    gst_no: "",
  });
  const [isCreatingCompany, setIsCreatingCompany] = useState(false);
  const [createCompanyError, setCreateCompanyError] = useState("");

  // Helper functions for company handling
  const getCompanyName = (c) =>
    c?.name || c?.company_name || c?.companyName || "";
  const getCompanyId = (c) => c?.company_id || c?.id || c?.companyId;
  const getCompanyGst = (c) => c?.gst_no || c?.gst_number || c?.gstNo || "";
  const getCompanyNameById = (id) => {
    if (!id) return "";
    const c = companies.find((cc) => getCompanyId(cc) === id);
    return c ? getCompanyName(c) : "";
  };
  const getCompanyGstById = (id) => {
    if (!id) return "";
    const c = companies.find((cc) => getCompanyId(cc) === id);
    return c ? getCompanyGst(c) : "";
  };

// Helper to format room numbers without stray commas or UUIDs
const formatBookingRoomNumbers = (booking, rooms = []) => {
  if (!booking) return "";
  const rawList = [];
  const collect = (val) => {
    if (!val) return;
    if (Array.isArray(val)) {
      val.forEach(collect);
    } else if (typeof val === "string") {
      val.split(",").forEach((s) => {
        const trimmed = s.trim();
        if (trimmed) rawList.push(trimmed);
      });
    } else if (typeof val === "number") {
      rawList.push(String(val));
    }
  };

  collect(booking.room_id);
  collect(booking.room_ids);
  collect(booking.room_number);
  collect(booking.room_numbers);
  collect(booking.roomNo);

  const resolved = [];
  rawList.forEach((item) => {
    const foundByRoomId = (rooms || []).find(
      (r) => String(r.room_id) === String(item) || String(r.id) === String(item)
    );
    if (foundByRoomId && foundByRoomId.room_number) {
      resolved.push(String(foundByRoomId.room_number).trim());
      return;
    }
    const foundByRoomNum = (rooms || []).find(
      (r) => String(r.room_number) === String(item)
    );
    if (foundByRoomNum && foundByRoomNum.room_number) {
      resolved.push(String(foundByRoomNum.room_number).trim());
      return;
    }
    const cleanItem = String(item).replace(/^,+|,+$/g, "").trim();
    if (cleanItem) {
      resolved.push(cleanItem);
    }
  });

  const unique = Array.from(new Set(resolved)).filter(Boolean);
  return unique.join(", ");
};

  // Get checked-in bookings
  const checkedInBookings =
    bookings?.filter((booking) => booking.status === "Checked-in") || [];

  // Filter bookings based on search
  const filteredBookings = checkedInBookings.filter((booking) => {
    const guest = guests?.find((g) => g.guest_id === booking.guest_id);
    const bookingRoomNumbers = formatBookingRoomNumbers(booking, rooms);
    const searchLower = searchTerm.toLowerCase();
    return (
      booking.booking_id?.toLowerCase().includes(searchLower) ||
      guest?.full_name?.toLowerCase().includes(searchLower) ||
      guest?.mobile?.includes(searchTerm) ||
      bookingRoomNumbers.toLowerCase().includes(searchLower) ||
      booking.room_type?.toLowerCase().includes(searchLower)
    );
  });

  // Company field autocomplete functionality
  const filteredCompanies = useMemo(() => {
    const q = companyQuery.trim().toLowerCase();
    if (!q) return companies.slice(0, 8);
    return companies
      .filter((c) => getCompanyName(c).toLowerCase().includes(q))
      .slice(0, 8);
  }, [companies, companyQuery]);

  useEffect(() => {
    // Fetch initial data
    const fetchData = async () => {
      try {
        setPageLoading(true);
        await fetchBookings();
        await fetchGuests();
        await fetchRooms();
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setPageLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleRefresh = async () => {
    try {
      setPageLoading(true);
      await fetchBookings();
      await fetchGuests();
      await fetchRooms();
      toast.success("Data refreshed successfully!");
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast.error("Failed to refresh data");
    } finally {
      setPageLoading(false);
    }
  };

  // Initialize company field when modal opens
  useEffect(() => {
    if (isCheckoutModalOpen && selectedBooking) {
      if (selectedBooking.company_id) {
        const name = getCompanyNameById(selectedBooking.company_id);
        const gst = getCompanyGstById(selectedBooking.company_id);

        setCompanyQuery(name);
        setCheckoutFormData((prev) => ({
          ...prev,
          company_id: selectedBooking.company_id,
          gst_no: gst || selectedBooking.gst_no || "",
        }));
      } else {
        // Clear company fields if no company in booking
        setCompanyQuery("");
        setCheckoutFormData((prev) => ({
          ...prev,
          company_id: "",
          gst_no: "",
        }));
      }
    }
  }, [isCheckoutModalOpen, selectedBooking, companies]);

  // Close company dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (
        companyFieldRef.current &&
        !companyFieldRef.current.contains(e.target)
      ) {
        setShowCompanyDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Extract all data from billData properly
  const extractBillData = () => {
    if (!billData) return {};

    // Extract room charges - calculate from serviceChargesByDate if available
    let totalRoomCharges = 0;
    let totalServiceCharges = 0;
    let services = {};
    let calculatedTaxAmount = 0; // Declare tax amount variable at function scope

    // Debug: Log the bill data structure
    console.log("=== BILL DATA STRUCTURE DEBUG ===");
    console.log("billData:", billData);
    console.log(
      "billData.serviceChargesByDate:",
      billData.serviceChargesByDate
    );
    console.log("billData.breakdown:", billData.breakdown);
    console.log("billData.summary:", billData.summary);

    // Use bill summary totals as they include grace period logic and all days
    if (billData?.summary) {
      console.log("Using bill summary totals (includes grace period logic)");
      console.log("Bill Summary Values:", {
        roomCharges: billData.summary.roomCharges,
        serviceCharges: billData.summary.serviceCharges,
        subTotal: billData.summary.subTotal,
        taxAmount: billData.summary.taxAmount,
        grandTotal: billData.summary.grandTotal,
        discountAmount: billData.summary.discountAmount,
        partialPayment: billData.summary.partialPayment,
      });

      totalRoomCharges = billData.summary.roomCharges || 0;
      totalServiceCharges = billData.summary.serviceCharges || 0;

      // Get discount amount from bill summary
      const discountAmount = billData.summary.discountAmount || 0;

      // Calculate tax from discounted room charges (2.5% CGST + 2.5% SGST = 5% total)
      const discountedRoomCharges = totalRoomCharges - discountAmount;
      const cgstAmount = Math.round((discountedRoomCharges * 2.5) / 100);
      const sgstAmount = Math.round((discountedRoomCharges * 2.5) / 100);
      calculatedTaxAmount = cgstAmount + sgstAmount;

      console.log("Tax calculation:", {
        totalRoomCharges,
        discountAmount,
        discountedRoomCharges,
        cgstAmount,
        sgstAmount,
        calculatedTaxAmount,
        billSummaryTaxAmount: billData.summary.taxAmount,
      });

      // Still populate services from serviceChargesByRoomAndDate for the dates that have data
      if (
        billData.breakdown?.charges?.serviceCharges?.serviceChargesByRoomAndDate
      ) {
        const serviceChargesByRoom =
          billData.breakdown.charges.serviceCharges.serviceChargesByRoomAndDate;

        Object.keys(serviceChargesByRoom).forEach((roomNumber) => {
          const roomServices = serviceChargesByRoom[roomNumber];
          services[roomNumber] = {};

          Object.keys(roomServices).forEach((date) => {
            const dayCharges = roomServices[date];

            // Add to services with proper date format
            services[roomNumber][date] = {
              room_charges: dayCharges.room_charges || 0,
              food_charges: dayCharges.food_charges || 0,
              laundry_charges: dayCharges.laundry_charges || 0,
              minibar_charges: dayCharges.minibar_charges || 0,
              extra_bed_charges: dayCharges.extra_bed_charges || 0,
              manual_charges: dayCharges.manual_charges || 0,
              extra_pax_charges: dayCharges.extra_pax_charges || 0, // Add extra pax charges
            };
          });
        });
      }
    } else if (
      billData.breakdown?.charges?.serviceCharges?.serviceChargesByRoomAndDate
    ) {
      console.log(
        "Using serviceChargesByRoomAndDate for calculation (fallback)"
      );
      const serviceChargesByRoom =
        billData.breakdown.charges.serviceCharges.serviceChargesByRoomAndDate;

      Object.keys(serviceChargesByRoom).forEach((roomNumber) => {
        const roomServices = serviceChargesByRoom[roomNumber];
        services[roomNumber] = {};

        Object.keys(roomServices).forEach((date) => {
          const dayCharges = roomServices[date];

          // Add to services with proper date format
          services[roomNumber][date] = {
            room_charges: dayCharges.room_charges || 0,
            food_charges: dayCharges.food_charges || 0,
            laundry_charges: dayCharges.laundry_charges || 0,
            minibar_charges: dayCharges.minibar_charges || 0,
            extra_bed_charges: dayCharges.extra_bed_charges || 0,
            manual_charges: dayCharges.manual_charges || 0,
          };

          // Add to totals
          totalRoomCharges += dayCharges.room_charges || 0;
          totalServiceCharges +=
            (dayCharges.food_charges || 0) +
            (dayCharges.laundry_charges || 0) +
            (dayCharges.minibar_charges || 0) +
            (dayCharges.extra_bed_charges || 0) +
            (dayCharges.manual_charges || 0);
        });
      });
    } else if (
      billData.serviceChargesByDate &&
      Array.isArray(billData.serviceChargesByDate)
    ) {
      console.log("Using serviceChargesByDate for calculation");
      billData.serviceChargesByDate.forEach((dayData) => {
        const date = Object.keys(dayData)[0];
        const roomEntries = dayData[date];

        roomEntries.forEach((roomEntry) => {
          const roomNumber = roomEntry.roomNumber;
          const charges = roomEntry.charges;

          // Initialize room services if not exists
          if (!services[roomNumber]) {
            services[roomNumber] = {};
          }

          // Add to services with proper date format
          services[roomNumber][date] = {
            room_charges: charges.roomCharges || 0,
            food_charges: charges.foodCharges || 0,
            laundry_charges: charges.laundryCharges || 0,
            minibar_charges: charges.minibarCharges || 0,
            extra_bed_charges: charges.extraBedCharges || 0,
            manual_charges: charges.manualCharges || 0,
            extra_pax_charges: charges.extraPaxCharges || 0, // Add extra pax charges
          };

          // Add to totals
          totalRoomCharges += charges.roomCharges || 0;
          totalServiceCharges +=
            (charges.foodCharges || 0) +
            (charges.laundryCharges || 0) +
            (charges.minibarCharges || 0) +
            (charges.extraBedCharges || 0) +
            (charges.manualCharges || 0) +
            (charges.extraPaxCharges || 0); // Include extra pax charges
        });
      });
    } else {
      console.log("Using breakdown data for calculation");
      // Fallback to breakdown data
      totalRoomCharges =
        billData?.breakdown?.charges?.roomCharges?.totalRoomCharges ||
        billData?.summary?.roomCharges ||
        0;
      totalServiceCharges =
        billData?.breakdown?.charges?.serviceCharges?.totalServiceCharges ||
        billData?.summary?.serviceCharges ||
        0;

      // If still no room charges, try to calculate from the bill summary
      if (totalRoomCharges === 0) {
        console.log(
          "No room charges found, trying to calculate from bill summary"
        );
        // Try to get room charges from the bill summary
        const billSummary = billData?.summary;
        if (billSummary) {
          totalRoomCharges = billSummary.roomCharges || 0;
          totalServiceCharges = billSummary.serviceCharges || 0;
        }
      }

      // If still no room charges, try to calculate manually from the bill data
      if (totalRoomCharges === 0) {
        console.log("Still no room charges, trying manual calculation");
        // Try to calculate from the bill data structure
        if (billData?.breakdown?.charges?.roomCharges) {
          const roomChargesData = billData.breakdown.charges.roomCharges;
          if (roomChargesData.roomChargesByDate) {
            // Calculate from room charges by date
            Object.values(roomChargesData.roomChargesByDate).forEach(
              (dayCharges) => {
                Object.values(dayCharges).forEach((roomCharge) => {
                  totalRoomCharges += roomCharge || 0;
                });
              }
            );
          }
        }
      }

      // If we still don't have the correct totals, use the bill summary (which includes grace period logic)
      if (
        totalRoomCharges === 0 ||
        totalRoomCharges < (billData?.summary?.roomCharges || 0)
      ) {
        console.log(
          "Using bill summary totals as they include grace period logic"
        );
        totalRoomCharges = billData?.summary?.roomCharges || 0;
        totalServiceCharges = billData?.summary?.serviceCharges || 0;
      }
    }

    // Extract other charges
    const foodCharges =
      billData?.breakdown?.charges?.serviceCharges?.overallServiceTotals
        ?.total_food_charges || 0;
    const laundryCharges =
      billData?.breakdown?.charges?.serviceCharges?.overallServiceTotals
        ?.total_laundry_charges || 0;
    const minibarCharges =
      billData?.breakdown?.charges?.serviceCharges?.overallServiceTotals
        ?.total_minibar_charges || 0;
    const manualCharges =
      billData?.breakdown?.charges?.serviceCharges?.overallServiceTotals
        ?.total_manual_charges || 0;
    const extraBedCharges =
      billData?.breakdown?.charges?.serviceCharges?.overallServiceTotals
        ?.total_extra_bed_charges || 0;

    // Extract discount and advance payment
    const discountAmount =
      billData?.breakdown?.charges?.discount?.discount_amount_calculated ||
      billData?.summary?.discountAmount ||
      0;
    const advanceReceived =
      billData?.breakdown?.charges?.partialPaymentFromBooking ||
      billData?.summary?.partialPayment ||
      0;

    // Calculate tax on discounted room charges (2.5% CGST + 2.5% SGST = 5% total)
    const discountedRoomCharges = totalRoomCharges - discountAmount;
    const cgstAmount = Math.round((discountedRoomCharges * 2.5) / 100);
    const sgstAmount = Math.round((discountedRoomCharges * 2.5) / 100);
    let totalTaxAmount = cgstAmount + sgstAmount;

    // Calculate totals
    const subTotal = totalRoomCharges + totalServiceCharges - discountAmount;
    const grandTotal = subTotal + totalTaxAmount - advanceReceived;

    // Final fallback: if grand total is still 0, use the bill summary grand total
    if (grandTotal === 0 && billData?.summary?.grandTotal) {
      console.log("Using bill summary grand total as final fallback");
      const billGrandTotal = billData.summary.grandTotal;
      const billSubTotal = billData.summary.subTotal || 0;
      const billTaxAmount = billData.summary.taxAmount || 0;
      const billAdvanceReceived = billData.summary.advanceReceived || 0;

      // Recalculate room charges from the bill summary
      totalRoomCharges = billSubTotal - totalServiceCharges + discountAmount;

      // Calculate tax from discounted room charges (2.5% CGST + 2.5% SGST = 5% total)
      const discountedRoomCharges = totalRoomCharges - discountAmount;
      const cgstAmount = Math.round((discountedRoomCharges * 2.5) / 100);
      const sgstAmount = Math.round((discountedRoomCharges * 2.5) / 100);
      calculatedTaxAmount = cgstAmount + sgstAmount;

      console.log("Final fallback tax calculation:", {
        totalRoomCharges,
        cgstAmount,
        sgstAmount,
        calculatedTaxAmount,
        billSummaryTaxAmount: billTaxAmount,
      });

      totalTaxAmount = calculatedTaxAmount;

      return {
        totalRoomCharges,
        totalServiceCharges,
        foodCharges,
        laundryCharges,
        minibarCharges,
        manualCharges,
        extraBedCharges,
        extraPaxCharges: 0, // Add extra pax charges
        discountAmount,
        advanceReceived: billAdvanceReceived,
        totalTaxAmount: calculatedTaxAmount,
        subTotal: billSubTotal,
        grandTotal: billGrandTotal,
        services,
      };
    }

    return {
      totalRoomCharges,
      totalServiceCharges,
      foodCharges,
      laundryCharges,
      minibarCharges,
      manualCharges,
      extraBedCharges,
      extraPaxCharges: 0, // Add extra pax charges
      discountAmount: billData?.summary
        ? billData.summary.discountAmount || 0
        : discountAmount,
      advanceReceived,
      totalTaxAmount: calculatedTaxAmount || totalTaxAmount,
      subTotal,
      grandTotal,
      services,
    };
  };

  // Note: Bill data is now fetched in handleCheckout function

  // Initialize checkout time when modal opens
  useEffect(() => {
    if (isCheckoutModalOpen) {
      const now = getCurrentIndianTime();
      const formattedTime = now.toISOString().slice(0, 16);
      setCheckoutFormData((prev) => ({
        ...prev,
        checkout_time: formattedTime,
      }));

      // Clear validation errors when modal opens
      setValidationErrors({
        payment_mode: "",
        upi_platform: "",
        custom_upi_platform: "",
        received_by_staff_id: userData.cognitoId || "",
        company_id: "",
        gst_no: "",
      });
    }
  }, [isCheckoutModalOpen]);

  // Helper function to convert date to Indian time
  const toIndianTime = (date) => {
    return new Date(date.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  };

  // Helper function to get current Indian time
  const getCurrentIndianTime = () => {
    return new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
    );
  };

  const formatDate = (timestamp) => {
    const date = toIndianTime(new Date(timestamp));
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();

    // Debug logging to verify the timestamp and conversion
    console.log("formatDate input:", timestamp, "converts to Indian time:", {
      year,
      month: month + 1,
      day,
    });

    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    return `${day.toString().padStart(2, "0")} ${monthNames[month]} ${year}`;
  };

  const formatDateTime = (timestamp) => {
    const date = toIndianTime(new Date(timestamp));
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();

    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    // Convert to 12-hour format with AM/PM
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    const ampm = hours >= 12 ? "PM" : "AM";

    return `${day.toString().padStart(2, "0")} ${
      monthNames[month]
    } ${year}, ${displayHours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")} ${ampm}`;
  };

  // Check if booking can be checked out (only when both holds are false)
  // If hold attribute is not present, treat it as housekeeping hold (true)
  const canCheckout = (booking) => {
    const hkHold = booking.hold !== false; // true if hold is true or undefined
    const rstHold = booking.restaurant_hold === true;
    return !hkHold && !rstHold;
  };

  // Helper function to check if booking is overdue (after 1.5 hours grace period)
  const isBookingOverdue = (checkoutDate) => {
    const now = getCurrentIndianTime();
    const checkout = toIndianTime(new Date(checkoutDate));
    const gracePeriodMs = 1.5 * 60 * 60 * 1000; // 1.5 hours in milliseconds
    const overdueThreshold = new Date(checkout.getTime() + gracePeriodMs);
    return now > overdueThreshold;
  };

  // Calculate checkout date with grace period logic
  const calculateCheckoutDateWithGracePeriod = (booking) => {
    const now = getCurrentIndianTime();
    const originalCheckoutDate = toIndianTime(new Date(booking.checkout_date));
    const gracePeriodMs = 1.5 * 60 * 60 * 1000; // 1.5 hours in milliseconds
    const gracePeriodEnd = new Date(
      originalCheckoutDate.getTime() + gracePeriodMs
    );

    // If current time is within grace period, use original checkout date
    // If current time is beyond grace period, use current time
    if (now <= gracePeriodEnd) {
      return originalCheckoutDate.toISOString();
    } else {
      return now.toISOString();
    }
  };

  // Check if company fields should be shown
  const shouldShowCompanyFields = () => {
    return (
      checkoutFormData.payment_mode === "BTC" && !selectedBooking?.company_id
    );
  };

  // Validation function for checkout form
  const validateCheckoutForm = () => {
    const errors = {
      payment_mode: "",
      upi_platform: "",
      custom_upi_platform: "",
      received_by_staff_id: "",
      company_id: "",
      gst_no: "",
    };

    if (!checkoutFormData.payment_mode.trim()) {
      errors.payment_mode = "Payment mode is required";
    }

    if (
      checkoutFormData.payment_mode === "UPI" &&
      !checkoutFormData.upi_platform.trim()
    ) {
      errors.upi_platform = "UPI platform selection is required";
    }

    // Validate custom UPI platform when "Others" is selected
    if (
      checkoutFormData.payment_mode === "UPI" &&
      checkoutFormData.upi_platform === "Others" &&
      !checkoutFormData.custom_upi_platform.trim()
    ) {
      errors.custom_upi_platform = "Please specify the UPI platform";
    }

    if (!checkoutFormData.received_by_staff_id.trim()) {
      errors.received_by_staff_id = "Staff selection is required";
    }

    // Validate company fields for BTC when no company_id in booking
    if (shouldShowCompanyFields()) {
      if (!checkoutFormData.company_id.trim()) {
        errors.company_id = "Company selection is required for BTC payments";
      }
      // GST is optional, so no validation needed
    }

    setValidationErrors(errors);
    return !Object.values(errors).some((error) => error !== "");
  };

  const getDaysStayed = (checkinDate, checkoutDate = Date.now()) => {
    const days = Math.ceil(
      (checkoutDate - checkinDate) / (1000 * 60 * 60 * 24)
    );
    return Math.max(1, days);
  };

  const handleCheckout = async (booking) => {
    // Check if booking can be checked out
    if (!canCheckout(booking)) {
      if (booking.hold !== false) {
        toast.error("Cannot checkout booking - Housekeeping has placed a hold");
      } else if (booking.restaurant_hold === true) {
        toast.error("Cannot checkout booking - Restaurant has placed a hold");
      } else {
        toast.error("Cannot checkout booking that is restricted");
      }
      return;
    }

    setIsBillLoading(true);
    setSelectedBooking(booking);
    setIsCheckoutModalOpen(true);

    // Fetch complete bill data and log it
    try {
      const bookingData = {
        booking_id: booking.booking_id,
        guest_id: booking.guest_id,
        room_id: Array.isArray(booking.room_id)
          ? booking.room_id
          : [booking.room_id],
        rate_plan_id: booking.rate_plan_id,
        checkin_date: booking.checkin_date,
        checkout_date: calculateCheckoutDateWithGracePeriod(booking),
        gst_type: booking.gst_type || "IGST",
      };

      console.log("=== FETCHING BILL DATA FOR CHECKOUT ===");
      console.log("Booking Data:", bookingData);

      if (calculateTotalBill) {
        const billData = await calculateTotalBill({
          bookingDetails: bookingData,
        });
        console.log("=== COMPLETE BILL DATA RECEIVED ===");
        console.log("Full Bill Data Object:", billData);
        console.log("Bill Data Keys:", Object.keys(billData || {}));

        // Log specific sections
        if (billData) {
          console.log("=== BILL DATA SECTIONS ===");
          console.log("serviceChargesByDate:", billData.serviceChargesByDate);
          console.log("breakdown:", billData.breakdown);
          console.log("summary:", billData.summary);
          console.log("bookingDetails:", billData.bookingDetails);
          console.log("billingSummary:", billData.billingSummary);

          // Log room charges specifically
          if (billData.breakdown?.charges?.roomCharges) {
            console.log("=== ROOM CHARGES BREAKDOWN ===");
            console.log(
              "totalRoomCharges:",
              billData.breakdown.charges.roomCharges.totalRoomCharges
            );
            console.log(
              "roomChargesByDate:",
              billData.breakdown.charges.roomCharges.roomChargesByDate
            );
          }

          // Log service charges specifically
          if (billData.breakdown?.charges?.serviceCharges) {
            console.log("=== SERVICE CHARGES BREAKDOWN ===");
            console.log(
              "totalServiceCharges:",
              billData.breakdown.charges.serviceCharges.totalServiceCharges
            );
            console.log(
              "overallServiceTotals:",
              billData.breakdown.charges.serviceCharges.overallServiceTotals
            );
            console.log(
              "serviceChargesByRoomAndDate:",
              billData.breakdown.charges.serviceCharges
                .serviceChargesByRoomAndDate
            );
          }

          // Log summary totals
          if (billData.summary) {
            console.log("=== BILL SUMMARY TOTALS ===");
            console.log("roomCharges:", billData.summary.roomCharges);
            console.log("serviceCharges:", billData.summary.serviceCharges);
            console.log("subTotal:", billData.summary.subTotal);
            console.log("taxAmount:", billData.summary.taxAmount);
            console.log("grandTotal:", billData.summary.grandTotal);
            console.log("discountAmount:", billData.summary.discountAmount);
            console.log("partialPayment:", billData.summary.partialPayment);
          }
        }

        setBillData(billData);
      }
    } catch (error) {
      console.error("Error fetching bill data:", error);
      setBillData(null);
    } finally {
      setTimeout(() => {
        setIsBillLoading(false);
      }, 1500);
    }
  };

  const processCheckout = () => {
    if (!selectedBooking) return;

    // Check if booking can be checked out
    if (!canCheckout(selectedBooking)) {
      if (selectedBooking.hold !== false) {
        toast.error("Cannot checkout booking - Housekeeping has placed a hold");
      } else if (selectedBooking.restaurant_hold === true) {
        toast.error("Cannot checkout booking - Restaurant has placed a hold");
      } else {
        toast.error("Cannot checkout booking that is restricted");
      }
      return;
    }

    // Validate form before processing
    if (!validateCheckoutForm()) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Determine the final UPI platform value
    const finalUpiPlatform =
      checkoutFormData.upi_platform === "Others"
        ? checkoutFormData.custom_upi_platform
        : checkoutFormData.upi_platform;

    const billDataExtracted = extractBillData();

    const checkoutData = {
      booking_id: selectedBooking.booking_id,
      guest_id: selectedBooking.guest_id,
      room_id: selectedBooking.room_id,
      payment_mode: checkoutFormData.payment_mode,
      upi_platform:
        checkoutFormData.payment_mode === "UPI" ? finalUpiPlatform : null,
      received_by_staff_id:
        userData.cognitoId || checkoutFormData.received_by_staff_id,
      notes: checkoutFormData.notes,
      room_charges: billDataExtracted.totalRoomCharges,
      laundry_charges: billDataExtracted.laundryCharges,
      food_charges: billDataExtracted.foodCharges,
      minibar_charges: billDataExtracted.minibarCharges,
      manual_charges: billDataExtracted.manualCharges,
      extra_bed_charges: billDataExtracted.extraBedCharges,
      extra_pax_charges: billDataExtracted.extraPaxCharges || 0, // Add extra pax charges
      discount_amount: billDataExtracted.discountAmount,
      discount_percent: selectedBooking.discount || 0,
      tax_type: selectedBooking.gst_type || "IGST",
      tax_amount: billDataExtracted.totalTaxAmount,
      advance_received: billDataExtracted.advanceReceived,
      total_amount: billDataExtracted.grandTotal,
      refund_amount: 0,
      services: billDataExtracted.services,
      // Always include company_id if available (from booking or form)
      company_id:
        selectedBooking.company_id || checkoutFormData.company_id || null,
      gst_no: selectedBooking.gst_no || checkoutFormData.gst_no || null,
      // Include complete bill summary
      bill_summary: {
        roomCharges: billDataExtracted.totalRoomCharges,
        serviceCharges: billDataExtracted.totalServiceCharges,
        foodCharges: billDataExtracted.foodCharges,
        laundryCharges: billDataExtracted.laundryCharges,
        minibarCharges: billDataExtracted.minibarCharges,
        manualCharges: billDataExtracted.manualCharges,
        extraBedCharges: billDataExtracted.extraBedCharges,
        extraPaxCharges: billDataExtracted.extraPaxCharges || 0,
        discountAmount: billDataExtracted.discountAmount,
        advanceReceived: billDataExtracted.advanceReceived,
        taxAmount: billDataExtracted.totalTaxAmount,
        subTotal: billDataExtracted.subTotal,
        grandTotal: billDataExtracted.grandTotal,
        services: billDataExtracted.services,
      },
      // Include original bill data for reference
      original_bill_data: billData,
    };

    // Debug logging to see what's being sent
    console.log("=== CHECKOUT DEBUG ===");
    console.log("Bill Data Extracted:", billDataExtracted);
    console.log("Checkout Data being sent:", checkoutData);
    console.log("Bill Data Summary:", billData?.summary);
    console.log("Bill Data Breakdown:", billData?.breakdown);
    console.log("ServiceChargesByDate:", billData?.serviceChargesByDate);
    console.log("=== AMOUNT COMPARISON ===");
    console.log("Bill Display Expected:", {
      roomCharges: 16028,
      serviceCharges: 1134,
      total: 17954,
    });
    console.log("Bill Summary Actual:", {
      roomCharges: billData?.summary?.roomCharges,
      serviceCharges: billData?.summary?.serviceCharges,
      grandTotal: billData?.summary?.grandTotal,
    });
    console.log("Checkout Payload:", {
      roomCharges: checkoutData.room_charges,
      serviceCharges:
        checkoutData.food_charges +
        checkoutData.laundry_charges +
        checkoutData.minibar_charges +
        checkoutData.extra_bed_charges +
        checkoutData.manual_charges,
      total: checkoutData.total_amount,
    });
    console.log("=== END DEBUG ===");

    // Call the checkout API
    checkoutGuest({ bookingDetails: checkoutData });

    // If payment is cash, add the amount to cash drawer as received
    if (checkoutFormData.payment_mode === "Cash") {
      try {
        // Get guest details for the description
        const guest = guests?.find(
          (g) => g.guest_id === selectedBooking.guest_id
        );

        const cashReceivedData = {
          date: new Date().toLocaleDateString("en-GB"), // DD/MM/YYYY format
          name: `${selectedBooking.booking_id}`,
          description: `Cash payment received for guest checkout - ${
            guest?.full_name || "Guest"
          }`,
          amount: checkoutData.total_amount || 0, // Use total_amount from checkout data
          bill_id: selectedBooking.booking_id, // Store bill_id for reference
          receivedId: Math.random().toString(36).substr(2, 9), // Generate unique ID
        };

        // Debug logging for cash received
        console.log("Cash received data being sent:", cashReceivedData);
        console.log("Checkout total_amount:", checkoutData.total_amount);
        console.log("Bill summary grandTotal:", billData?.summary?.grandTotal);

        // Add to cash drawer as received amount
        addExpense({ received: cashReceivedData });

        console.log("Cash received added to drawer:", cashReceivedData);
      } catch (error) {
        console.error("Error adding cash received to drawer:", error);
        // Don't block checkout if cash drawer update fails
      }
    }

    setIsCheckoutModalOpen(false);
    setSelectedBooking(null);
    setCheckoutFormData({
      payment_mode: "",
      upi_platform: "",
      custom_upi_platform: "",
      received_by_staff_id: userData.cognitoId || "",
      notes: "",
      company_id: "",
      gst_no: "",
    });
    setCompanyQuery("");
    // Clear validation errors
    setValidationErrors({
      payment_mode: "",
      upi_platform: "",
      custom_upi_platform: "",
      received_by_staff_id: userData.cognitoId || "",
      company_id: "",
      gst_no: "",
    });
    toast("Guest checked out successfully!");
  };

  const handleFieldChange = (field, value) => {
    setCheckoutFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear validation error when user starts typing/selecting
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }

    // Clear custom UPI platform when UPI platform changes from "Others"
    if (field === "upi_platform" && value !== "Others") {
      setCheckoutFormData((prev) => ({
        ...prev,
        custom_upi_platform: "",
      }));
      setValidationErrors((prev) => ({
        ...prev,
        custom_upi_platform: "",
      }));
    }

    // Clear UPI platform fields when payment mode changes from "UPI"
    if (field === "payment_mode" && value !== "UPI") {
      setCheckoutFormData((prev) => ({
        ...prev,
        upi_platform: "",
        custom_upi_platform: "",
      }));
      setValidationErrors((prev) => ({
        ...prev,
        upi_platform: "",
        custom_upi_platform: "",
      }));
    }

    // Clear company fields when payment mode changes from "BTC"
    if (field === "payment_mode" && value !== "BTC") {
      setCheckoutFormData((prev) => ({
        ...prev,
        company_id: "",
        gst_no: "",
      }));
      setCompanyQuery("");
      setValidationErrors((prev) => ({
        ...prev,
        company_id: "",
        gst_no: "",
      }));
    }
  };

  // Company autocomplete handlers
  const handleCompanySelect = (company) => {
    const name = getCompanyName(company);
    const id = getCompanyId(company);
    const gst = getCompanyGst(company);

    setCompanyQuery(name);
    setShowCompanyDropdown(false);
    handleFieldChange("company_id", id);

    // Auto-fill GST field when company is selected
    if (gst) {
      handleFieldChange("gst_no", gst);
    }
  };

  const clearSelectedCompany = () => {
    setCompanyQuery("");
    handleFieldChange("company_id", "");
    handleFieldChange("gst_no", "");
    setShowCompanyDropdown(false);
  };

  const handleCompanyInputChange = (value) => {
    setCompanyQuery(value);
    setShowCompanyDropdown(true);
    if (checkoutFormData?.company_id) {
      handleFieldChange("company_id", "");
      handleFieldChange("gst_no", "");
    }
  };

  // Create Company Dialog handlers
  const handleCreateCompany = async () => {
    setCreateCompanyError("");

    if (!newCompany.name.trim()) {
      setCreateCompanyError("Company name is required");
      return;
    }

    if (!createCompany || typeof createCompany !== "function") {
      setCreateCompanyError("Company creation is not available");
      return;
    }

    setIsCreatingCompany(true);

    try {
      const createdCompany = await createCompany({
        name: newCompany.name.trim(),
        gst_no: newCompany.gst_no.trim(),
      });

      if (createdCompany) {
        handleCompanySelect(createdCompany);
        setNewCompany({ name: "", gst_no: "" });
        setIsCreateCompanyOpen(false);
        setCreateCompanyError("");
        console.log("Company created successfully:", createdCompany);
      } else {
        setCreateCompanyError("Failed to create company. Please try again.");
      }
    } catch (error) {
      console.error("Error creating company:", error);
      setCreateCompanyError(
        error.message || "Failed to create company. Please try again."
      );
    } finally {
      setIsCreatingCompany(false);
    }
  };

  const openCreateCompanyDialog = () => {
    setNewCompany({ name: companyQuery, gst_no: "" });
    setCreateCompanyError("");
    setIsCreateCompanyOpen(true);
    setShowCompanyDropdown(false);
  };

  const closeCreateCompanyDialog = () => {
    setIsCreateCompanyOpen(false);
    setNewCompany({ name: "", gst_no: "" });
    setCreateCompanyError("");
  };

  const generateBill = () => {
    // Navigate to bill page or generate PDF
    navigate(
      `/dashboard/registrations/bill?booking_id=${
        selectedBooking.booking_id
      }&guest_id=${selectedBooking.guest_id}&room_id=${
        selectedBooking.room_id
      }&gst_type="IGST"&rate_plan_id=${
        selectedBooking.rate_plan_id
      }&checkin_date=${
        selectedBooking.checkin_date
      }&checkout_date=${getCurrentIndianTime().toISOString()}`
    );
  };

  const roomNumbers = formatBookingRoomNumbers(selectedBooking, rooms);

  const ErrorMessage = ({ error }) => {
    if (!error) return null;
    return (
      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
        <span className="w-1 h-1 bg-red-500 rounded-full"></span>
        {error}
      </p>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className={` mx-auto `}>
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Guest Check-Out
              </h1>
              <p className="text-gray-600">
                Manage guest departures and process check-outs
              </p>
            </div>

            {/* Refresh Button */}
            <div className="flex items-center gap-4">
              <Button
                onClick={handleRefresh}
                disabled={pageLoading}
                className="flex items-center gap-2"
                variant="outline"
              >
                <RefreshCw
                  className={`h-4 w-4 ${pageLoading ? "animate-spin" : ""}`}
                />
                {pageLoading ? "Refreshing..." : "Refresh"}
              </Button>
            </div>
          </div>
        </div>

        {/* Search and Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          {/* Search */}
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search by booking ID, guest name, phone, or room number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Quick Stats */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Hotel className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600">Checked In</p>
                  <p className="text-2xl font-bold">
                    {filteredBookings.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <LogOut className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600">Ready for Checkout</p>
                  <p className="text-2xl font-bold">
                    {
                      filteredBookings.filter(
                        (b) =>
                          isBookingOverdue(b.checkout_date) && canCheckout(b)
                      ).length
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bookings Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Hotel className="h-5 w-5" />
              <span>Checked-In Guests</span>
            </CardTitle>
            <CardDescription>
              All guests currently checked in and available for checkout
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Room Number</TableHead>
                    <TableHead>Guest Details</TableHead>
                    <TableHead>Check-in Date & Time</TableHead>
                    <TableHead>Check-out Date & Time</TableHead>
                    <TableHead>Days Stayed</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBookings.map((booking) => {
                    const guest = guests?.find(
                      (g) => g.guest_id === booking.guest_id
                    );
                    const isOverdue = isBookingOverdue(booking.checkout_date);
                    const daysStayed = getDaysStayed(booking.checkin_date);
                    const isCheckoutEnabled = canCheckout(booking);

                    return (
                      <TableRow key={booking.booking_id}>
                        <TableCell className="font-medium">
                          {formatBookingRoomNumbers(booking, rooms) || "N/A"}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {guest?.full_name}
                            </span>
                            <span className="text-sm text-gray-500 flex items-center">
                              <Phone className="h-3 w-3 mr-1" />
                              {guest?.mobile}
                            </span>
                            <span className="text-sm text-gray-500 flex items-center">
                              <Mail className="h-3 w-3 mr-1" />
                              {guest?.email}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDateTime(booking.checkin_date)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div
                            className={`flex items-center text-sm ${
                              isOverdue ? "text-red-600" : ""
                            }`}
                          >
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDateTime(booking.checkout_date)}
                            {isOverdue && (
                              <Badge
                                variant="destructive"
                                className="ml-2 text-xs text-white"
                              >
                                Overdue
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {daysStayed} {daysStayed === 1 ? "day" : "days"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="secondary">{booking.status}</Badge>
                            {booking.hold !== false && (
                              <Badge
                                variant="destructive"
                                className="flex items-center gap-1 text-white text-xs"
                              >
                                <Lock className="h-3 w-3" />
                                HK Hold
                              </Badge>
                            )}
                            {booking.restaurant_hold === true && (
                              <Badge
                                variant="destructive"
                                className="flex items-center gap-1 text-white text-xs"
                              >
                                <Lock className="h-3 w-3" />
                                RST Hold
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant={
                                isCheckoutEnabled ? "default" : "secondary"
                              }
                              onClick={() => {
                                navigate(
                                  `/dashboard/registrations/bill?booking_id=${
                                    booking.booking_id
                                  }&guest_id=${
                                    booking.guest_id
                                  }&room_id=${
                                    booking.room_id
                                  }&gst_type="IGST"&rate_plan_id=${
                                    booking.rate_plan_id
                                  }&checkin_date=${
                                    booking.checkin_date
                                  }&checkout_date=${getCurrentIndianTime().toISOString()}`
                                );
                              }}
                              disabled={!isCheckoutEnabled}
                              className="flex items-center space-x-1"
                            >
                              {!isCheckoutEnabled ? (
                                <Lock className="h-3 w-3" />
                              ) : (
                                <LogOut className="h-3 w-3" />
                              )}
                              <span>
                                {!isCheckoutEnabled
                                  ? booking.hold !== false &&
                                    booking.restaurant_hold === true
                                    ? "HK & RST Hold"
                                    : booking.hold !== false
                                    ? "HK Hold"
                                    : booking.restaurant_hold === true
                                    ? "RST Hold"
                                    : "Restricted"
                                  : "View Bill"}
                              </span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {filteredBookings.length === 0 && (
              <div className="text-center py-8">
                <Hotel className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No checked-in guests found
                </h3>
                <p className="text-gray-500">
                  {searchTerm
                    ? "Try adjusting your search terms"
                    : "All guests have been checked out"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Manual Checkout Modal */}
        {isCheckoutModalOpen && (
          <div className="fixed inset-0 bg-black/5 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white border border-gray-200 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              {/* Modal Header */}
              <div className="bg-gray-50 border-b p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <LogOut className="h-4 w-4 text-gray-600" />
                    <h2 className="text-base font-semibold text-gray-900">
                      Guest Check-Out
                    </h2>
                    {!canCheckout(selectedBooking) && (
                      <div className="flex items-center gap-1">
                        {selectedBooking?.hold !== false && (
                          <span className="bg-red-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                            <Lock className="h-3 w-3" />
                            HK Hold
                          </span>
                        )}
                        {selectedBooking?.restaurant_hold === true && (
                          <span className="bg-red-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                            <Lock className="h-3 w-3" />
                            RST Hold
                          </span>
                        )}
                        {selectedBooking?.hold === false &&
                          !selectedBooking?.restaurant_hold && (
                            <span className="bg-red-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                              <Lock className="h-3 w-3" />
                              Restricted
                            </span>
                          )}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setIsCheckoutModalOpen(false)}
                    className="h-7 w-7 p-0 hover:bg-gray-200 rounded flex items-center justify-center"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>

                {/* Grace Period Status */}
                {selectedBooking &&
                  (() => {
                    const now = getCurrentIndianTime();
                    const originalCheckoutDate = toIndianTime(
                      new Date(selectedBooking.checkout_date)
                    );
                    const gracePeriodMs = 1.5 * 60 * 60 * 1000; // 1.5 hours in milliseconds
                    const gracePeriodEnd = new Date(
                      originalCheckoutDate.getTime() + gracePeriodMs
                    );
                    const isWithinGracePeriod = now <= gracePeriodEnd;
                    const timeRemaining = gracePeriodEnd - now;
                    const hoursRemaining = Math.floor(
                      timeRemaining / (1000 * 60 * 60)
                    );
                    const minutesRemaining = Math.floor(
                      (timeRemaining % (1000 * 60 * 60)) / (1000 * 60)
                    );

                    return (
                      <div
                        className={`mt-2 p-2 rounded border ${
                          isWithinGracePeriod
                            ? "bg-green-50 border-green-200"
                            : "bg-orange-50 border-orange-200"
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${
                              isWithinGracePeriod
                                ? "bg-green-500"
                                : "bg-orange-500"
                            }`}
                          ></div>
                          <span
                            className={`text-xs font-medium ${
                              isWithinGracePeriod
                                ? "text-green-800"
                                : "text-orange-800"
                            }`}
                          >
                            {isWithinGracePeriod
                              ? `Grace Period Active - ${hoursRemaining}h ${minutesRemaining}m remaining`
                              : "Grace Period Expired - Extra day charges may apply"}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
              </div>

              {isBillLoading && (
                <div className="flex items-center justify-center h-48">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-gray-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">Calculating bill...</p>
                  </div>
                </div>
              )}

              {selectedBooking && !isBillLoading && (
                <div className="p-3 space-y-3 max-h-[calc(80vh-60px)] overflow-y-auto">
                  {/* Show warning message if booking cannot be checked out */}
                  {!canCheckout(selectedBooking) && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-red-800">
                        <Lock className="h-4 w-4" />
                        <div className="flex items-center gap-1">
                          {selectedBooking.hold !== false && (
                            <Badge variant="destructive" className="text-xs">
                              HK Hold
                            </Badge>
                          )}
                          {selectedBooking.restaurant_hold === true && (
                            <Badge variant="destructive" className="text-xs">
                              RST Hold
                            </Badge>
                          )}
                          {selectedBooking.hold === false &&
                            !selectedBooking.restaurant_hold && (
                              <span className="font-medium">
                                Booking Restricted
                              </span>
                            )}
                        </div>
                      </div>
                      <p className="text-red-700 text-sm mt-1">
                        {selectedBooking.hold !== false &&
                        selectedBooking.restaurant_hold === true
                          ? "This booking is currently on hold by both Housekeeping and Restaurant. Please contact both departments to release their holds before proceeding."
                          : selectedBooking.hold !== false
                          ? "This booking is currently on hold by Housekeeping and cannot be checked out. Please contact Housekeeping to release the hold before proceeding."
                          : selectedBooking.restaurant_hold === true
                          ? "This booking is currently on hold by Restaurant and cannot be checked out. Please contact Restaurant to release the hold before proceeding."
                          : "This booking is restricted and cannot be checked out at this time. Please contact management for assistance."}
                      </p>
                    </div>
                  )}

                  {/* Compact Bill Summary */}
                  {billData &&
                    (() => {
                      const billDataExtracted = extractBillData();

                      return (
                        <div className="bg-gray-50 border rounded-lg p-3 mb-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Receipt className="h-3 w-3 text-blue-600" />
                            <h3 className="text-xs font-semibold text-gray-900">
                              Bill Summary
                            </h3>
                          </div>

                          {/* Compact grid layout */}
                          <div className="grid grid-cols-4 gap-1 text-xs">
                            <div className="text-center">
                              <p className="text-gray-500">Room</p>
                              <p className="font-semibold">
                                ₹{billDataExtracted.totalRoomCharges.toFixed(0)}
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-gray-500">Services</p>
                              <p className="font-semibold">
                                ₹
                                {billDataExtracted.totalServiceCharges.toFixed(
                                  0
                                )}
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-gray-500">Tax</p>
                              <p className="font-semibold">
                                ₹{billDataExtracted.totalTaxAmount.toFixed(0)}
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-gray-500">Discount</p>
                              <p className="font-semibold text-red-600">
                                -₹{billDataExtracted.discountAmount.toFixed(0)}
                              </p>
                            </div>
                          </div>

                          {/* Grand Total */}
                          <div className="border-t mt-2 pt-2">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-medium text-gray-700">
                                Grand Total
                              </span>
                              <span className="text-sm font-bold text-blue-600">
                                ₹{billDataExtracted.grandTotal.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Guest Details */}
                    <Card className="border shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <Hotel className="h-3 w-3 text-blue-600" />
                          Guest Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {(() => {
                          const guest = guests?.find(
                            (g) => g.guest_id === selectedBooking.guest_id
                          );
                          const room = rooms?.find(
                            (r) =>
                              String(r.room_id) ===
                              String(selectedBooking.room_id)
                          );
                          return (
                            <>
                              <div className="bg-gray-50 p-2 rounded">
                                <p className="text-xs text-gray-500 mb-1">
                                  Guest Name
                                </p>
                                <p className="text-sm font-semibold text-gray-900">
                                  {guest?.full_name}
                                </p>
                              </div>
                              <div className="bg-gray-50 p-2 rounded">
                                <p className="text-xs text-gray-500 mb-1">
                                  Contact Information
                                </p>
                                <div className="space-y-1">
                                  <p className="text-xs font-medium flex items-center">
                                    <Phone className="h-3 w-3 mr-1 text-gray-500" />
                                    {guest?.mobile}
                                  </p>
                                  <p className="text-xs font-medium flex items-center">
                                    <Mail className="h-3 w-3 mr-1 text-gray-500" />
                                    {guest?.email}
                                  </p>
                                </div>
                              </div>
                              <div className="bg-gray-50 p-2 rounded">
                                <p className="text-xs text-gray-500 mb-1">
                                  Booking Details
                                </p>
                                <div className="space-y-1">
                                  <p className="text-xs font-medium font-mono">
                                    {selectedBooking.booking_id}
                                  </p>
                                  <p className="text-xs font-medium">
                                    Room {roomNumbers} -{" "}
                                    {selectedBooking.room_type}
                                  </p>
                                  <p className="text-xs font-medium">
                                    Stay Duration:{" "}
                                    {getDaysStayed(
                                      selectedBooking.checkin_date
                                    )}{" "}
                                    days
                                  </p>
                                </div>
                              </div>
                            </>
                          );
                        })()}
                      </CardContent>
                    </Card>

                    {/* Payment Method */}
                    <Card className="border shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <Receipt className="h-3 w-3 text-green-600" />
                          Payment Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="bg-gray-50 p-2 rounded">
                          <Label
                            htmlFor="payment_mode"
                            className="text-xs font-medium text-gray-700"
                          >
                            Payment Mode <span className="text-red-500">*</span>
                          </Label>
                          <Select
                            value={checkoutFormData.payment_mode}
                            onValueChange={(value) =>
                              handleFieldChange("payment_mode", value)
                            }
                            disabled={!canCheckout(selectedBooking)}
                          >
                            <SelectTrigger
                              className={`w-full mt-1 h-8 text-xs ${
                                validationErrors.payment_mode
                                  ? "border-red-500"
                                  : "border-gray-300"
                              }`}
                            >
                              <SelectValue placeholder="Select Payment Mode" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Cash">Cash</SelectItem>
                              <SelectItem value="QR">QR</SelectItem>
                              <SelectItem value="UPI">UPI</SelectItem>
                              <SelectItem value="Credit Card">
                                Credit Card
                              </SelectItem>
                              <SelectItem value="Debit Card">
                                Debit Card
                              </SelectItem>
                              <SelectItem value="BTC">BTC</SelectItem>
                            </SelectContent>
                          </Select>
                          <ErrorMessage error={validationErrors.payment_mode} />
                        </div>

                        {/* UPI Platform selection field (only visible if UPI is chosen) */}
                        {checkoutFormData.payment_mode === "UPI" && (
                          <div className="bg-gray-50 p-2 rounded">
                            <Label
                              htmlFor="upi_platform"
                              className="text-xs font-medium text-gray-700"
                            >
                              UPI Platform{" "}
                              <span className="text-red-500">*</span>
                            </Label>
                            <Select
                              value={checkoutFormData.upi_platform}
                              onValueChange={(value) =>
                                handleFieldChange("upi_platform", value)
                              }
                              disabled={!canCheckout(selectedBooking)}
                            >
                              <SelectTrigger
                                className={`w-full mt-1 h-8 text-xs ${
                                  validationErrors.upi_platform
                                    ? "border-red-500"
                                    : "border-gray-300"
                                }`}
                              >
                                <SelectValue placeholder="Select UPI Platform" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Google Pay">
                                  Google Pay
                                </SelectItem>
                                <SelectItem value="Amazon Pay">
                                  Amazon Pay
                                </SelectItem>
                                <SelectItem value="PhonePe">PhonePe</SelectItem>
                                <SelectItem value="BHIM">BHIM</SelectItem>
                                <SelectItem value="Paytm">Paytm</SelectItem>
                                <SelectItem value="Others">Others</SelectItem>
                              </SelectContent>
                            </Select>
                            <ErrorMessage
                              error={validationErrors.upi_platform}
                            />
                          </div>
                        )}

                        {/* Custom UPI Platform input (only visible if "Others" is selected) */}
                        {checkoutFormData.payment_mode === "UPI" &&
                          checkoutFormData.upi_platform === "Others" && (
                            <div className="bg-gray-50 p-2 rounded">
                              <Label
                                htmlFor="custom_upi_platform"
                                className="text-xs font-medium text-gray-700"
                              >
                                Specify UPI Platform{" "}
                                <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                id="custom_upi_platform"
                                type="text"
                                placeholder="Enter UPI platform name"
                                value={checkoutFormData.custom_upi_platform}
                                onChange={(e) =>
                                  handleFieldChange(
                                    "custom_upi_platform",
                                    e.target.value
                                  )
                                }
                                disabled={!canCheckout(selectedBooking)}
                                className={`mt-1 h-8 text-xs ${
                                  validationErrors.custom_upi_platform
                                    ? "border-red-500"
                                    : "border-gray-300"
                                }`}
                              />
                              <ErrorMessage
                                error={validationErrors.custom_upi_platform}
                              />
                            </div>
                          )}

                        {/* Company fields for BTC when no company_id exists */}
                        {shouldShowCompanyFields() && (
                          <>
                            <div
                              ref={companyFieldRef}
                              className="bg-gray-50 p-2 rounded"
                            >
                              <Label className="text-xs font-medium text-gray-700 flex items-center gap-1">
                                <Building className="h-3 w-3 text-gray-500" />
                                Company <span className="text-red-500">*</span>
                              </Label>
                              <div className="relative mt-1">
                                <Input
                                  value={companyQuery}
                                  onChange={(e) =>
                                    handleCompanyInputChange(e.target.value)
                                  }
                                  onFocus={() => setShowCompanyDropdown(true)}
                                  placeholder="Search company"
                                  disabled={!canCheckout(selectedBooking)}
                                  className={`h-8 text-xs pr-6 ${
                                    validationErrors.company_id
                                      ? "border-red-500"
                                      : "border-gray-300"
                                  }`}
                                />
                                {(companyQuery ||
                                  checkoutFormData?.company_id) && (
                                  <button
                                    type="button"
                                    aria-label="Clear selected company"
                                    onClick={clearSelectedCompany}
                                    className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    disabled={!canCheckout(selectedBooking)}
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                )}

                                {showCompanyDropdown && (
                                  <div className="absolute z-20 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg">
                                    <ul className="max-h-56 overflow-auto py-1">
                                      {filteredCompanies.length > 0 ? (
                                        filteredCompanies.map((c) => {
                                          const name = getCompanyName(c);
                                          const gst = getCompanyGst(c);
                                          return (
                                            <li
                                              key={getCompanyId(c)}
                                              onMouseDown={(e) => {
                                                e.preventDefault();
                                                handleCompanySelect(c);
                                              }}
                                              className="cursor-pointer px-3 py-2 hover:bg-gray-50"
                                            >
                                              <div className="text-sm text-gray-900">
                                                {name}
                                              </div>
                                              {gst && (
                                                <div className="text-xs text-gray-500">
                                                  GST: {gst}
                                                </div>
                                              )}
                                            </li>
                                          );
                                        })
                                      ) : (
                                        <>
                                          <li className="px-3 py-2 text-sm text-gray-500">
                                            No companies found
                                          </li>
                                          {companyQuery.trim() &&
                                            createCompany && (
                                              <li
                                                onMouseDown={(e) => {
                                                  e.preventDefault();
                                                  openCreateCompanyDialog();
                                                }}
                                                className="cursor-pointer px-3 py-2 hover:bg-blue-50 border-t border-gray-100"
                                              >
                                                <div className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700">
                                                  <Plus className="h-4 w-4" />
                                                  <span>
                                                    Create "{companyQuery}"
                                                  </span>
                                                </div>
                                              </li>
                                            )}
                                        </>
                                      )}
                                    </ul>
                                  </div>
                                )}
                              </div>
                              <ErrorMessage
                                error={validationErrors.company_id}
                              />
                            </div>

                            <div className="bg-gray-50 p-2 rounded">
                              <Label className="text-xs font-medium text-gray-700">
                                GST Number
                                {checkoutFormData?.company_id &&
                                  getCompanyGstById(
                                    checkoutFormData.company_id
                                  ) && (
                                    <span className="text-xs text-green-600 ml-1">
                                      (Auto-filled)
                                    </span>
                                  )}
                              </Label>
                              <Input
                                value={checkoutFormData.gst_no || ""}
                                onChange={(e) =>
                                  handleFieldChange("gst_no", e.target.value)
                                }
                                placeholder="Enter GST number (optional)"
                                disabled={!canCheckout(selectedBooking)}
                                className="h-8 text-xs mt-1 border-gray-300"
                              />
                            </div>
                          </>
                        )}

                        {/*<div className="bg-gray-50 p-2 rounded">*/}
                        {/*  <Label*/}
                        {/*    htmlFor="received_by_staff_id"*/}
                        {/*    className="text-xs font-medium text-gray-700"*/}
                        {/*  >*/}
                        {/*    Received By Staff{" "}*/}
                        {/*    <span className="text-red-500">*</span>*/}
                        {/*  </Label>*/}
                        {/*  <Select*/}
                        {/*    value={checkoutFormData.received_by_staff_id}*/}
                        {/*    onValueChange={(value) =>*/}
                        {/*      handleFieldChange("received_by_staff_id", value)*/}
                        {/*    }*/}
                        {/*    disabled={!canCheckout(selectedBooking)}*/}
                        {/*  >*/}
                        {/*    <SelectTrigger*/}
                        {/*      className={`w-full mt-1 h-8 text-xs ${*/}
                        {/*        validationErrors.received_by_staff_id*/}
                        {/*          ? "border-red-500"*/}
                        {/*          : "border-gray-300"*/}
                        {/*      }`}*/}
                        {/*    >*/}
                        {/*      <SelectValue placeholder="Select Front Desk Staff" />*/}
                        {/*    </SelectTrigger>*/}
                        {/*    <SelectContent>*/}
                        {/*      {staffs*/}
                        {/*        ?.filter((staff) => staff.role === "Frontdesk")*/}
                        {/*        .map((staff) => (*/}
                        {/*          <SelectItem*/}
                        {/*            key={staff.staff_id}*/}
                        {/*            value={staff.staff_id}*/}
                        {/*          >*/}
                        {/*            {staff.name} ({staff.role})*/}
                        {/*          </SelectItem>*/}
                        {/*        ))}*/}
                        {/*    </SelectContent>*/}
                        {/*  </Select>*/}
                        {/*  <ErrorMessage*/}
                        {/*    error={validationErrors.received_by_staff_id}*/}
                        {/*  />*/}
                        {/*</div>*/}

                        <div className="bg-gray-50 p-2 rounded">
                          <Label
                            htmlFor="notes"
                            className="text-xs font-medium text-gray-700"
                          >
                            Notes
                          </Label>
                          <Textarea
                            id="notes"
                            placeholder="Any additional notes or comments"
                            value={checkoutFormData.notes}
                            onChange={(e) =>
                              setCheckoutFormData((prev) => ({
                                ...prev,
                                notes: e.target.value,
                              }))
                            }
                            className="mt-1 h-16 text-xs resize-none border-gray-300"
                            disabled={!canCheckout(selectedBooking)}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-2 pt-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsCheckoutModalOpen(false)}
                      className="h-8 text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={generateBill}
                      className="flex items-center space-x-1 h-8 text-xs"
                    >
                      <Receipt className="h-3 w-3" />
                      <span>Generate Bill</span>
                    </Button>
                    <Button
                      size="sm"
                      className="flex items-center space-x-1 h-8 text-xs"
                      onClick={processCheckout}
                      disabled={loading || !canCheckout(selectedBooking)}
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-white"></div>
                      ) : !canCheckout(selectedBooking) ? (
                        <Lock className="h-3 w-3" />
                      ) : (
                        <CheckCircle className="h-3 w-3" />
                      )}
                      <span>
                        {!canCheckout(selectedBooking)
                          ? selectedBooking?.hold !== false &&
                            selectedBooking?.restaurant_hold === true
                            ? "HK & RST Hold"
                            : selectedBooking?.hold !== false
                            ? "HK Hold"
                            : selectedBooking?.restaurant_hold === true
                            ? "RST Hold"
                            : "Booking Restricted"
                          : "Complete Check-Out"}
                      </span>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Manual Create Company Modal */}
        {isCreateCompanyOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              {/* Modal Header */}
              <div className="bg-gray-50 border-b p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building className="h-5 w-5 text-blue-600" />
                    <h2 className="text-lg font-semibold text-gray-900">
                      Create New Company
                    </h2>
                  </div>
                  <button
                    onClick={closeCreateCompanyDialog}
                    className="h-7 w-7 p-0 hover:bg-gray-200 rounded flex items-center justify-center"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Add a new company to the system. This company will be
                  available for future bookings.
                </p>
              </div>

              {/* Modal Content */}
              <div className="p-4 space-y-4">
                {/* Show error message if any */}
                {createCompanyError && (
                  <div className="p-3 rounded-md bg-red-50 border border-red-200">
                    <p className="text-sm text-red-600">{createCompanyError}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="company-name" className="text-sm font-medium">
                    Company Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="company-name"
                    placeholder="Enter company name"
                    value={newCompany.name}
                    onChange={(e) =>
                      setNewCompany({ ...newCompany, name: e.target.value })
                    }
                    className="focus:border-blue-500 focus:ring-blue-500"
                    disabled={isCreatingCompany}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gst-number" className="text-sm font-medium">
                    GST Number
                  </Label>
                  <Input
                    id="gst-number"
                    placeholder="Enter GST number (optional)"
                    value={newCompany.gst_no}
                    onChange={(e) =>
                      setNewCompany({ ...newCompany, gst_no: e.target.value })
                    }
                    className="focus:border-blue-500 focus:ring-blue-500"
                    disabled={isCreatingCompany}
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-gray-50 border-t p-4 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeCreateCompanyDialog}
                  disabled={isCreatingCompany}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleCreateCompany}
                  disabled={isCreatingCompany || !newCompany.name.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isCreatingCompany ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Company
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckOut;
