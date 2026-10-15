import React, { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "../../../components/ui/button.js";
import {
  Printer,
  Download,
  ArrowLeft,
  X,
  Edit2,
  CheckCircle,
  LogOut,
  Building,
  Calendar,
  Hotel,
  Users,
  Sparkles,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router";
import { useAppContext } from "../../../context/AppContext.jsx";
import { useInstitutionContext } from "../../../context/InstitutionContext.jsx";
import { useAuthContext } from "../../../context/AuthContext.jsx";
import RefreshButton from "../../../components/ui/RefreshButton.jsx";
import HotelLoader from "../../../components/HotelLoader.jsx";
import {
  BillHeader,
  GuestDetails,
  BookingDetails,
  ChargesBreakdown,
  BillingSummary,
  LegalSignature,
  BillFooter,
  RestaurantBill,
  ExtraPaxFolio,
} from "./components/index.js";
import SplitBill from "./components/SplitBill.jsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select.tsx";
import { Input } from "../../../components/ui/input.tsx";
import { Label } from "../../../components/ui/label.tsx";
import { Textarea } from "../../../components/ui/textarea.tsx";
import { toast } from "sonner";
const Bill = () => {
  const navigate = useNavigate();
  const {
    fetchTotalBill,
    guests,
    fetchGuests,
    fetchBookings,
    fetchRooms,
    updateBill,
    bookings,
    updateGuest,
    addExpense,
    updateBooking,
    calculateTotalBill,
    companies,
    bills,
    rooms,
    checkoutGuest,
    createCompany,
    listTotalBill,
    updateRoomStatus,
  } = useAppContext();
  const { userData } = useAuthContext();
  const { institutionData } = useInstitutionContext();

  const [searchParams] = useSearchParams();
  // Helper functions for Indian time conversion
  const toIndianTime = (date) => {
    // The date parameter is a timestamp, just return it as is for comparison
    // We'll handle timezone conversion in the display, not in the calculation
    return new Date(date);
  };

  const getCurrentIndianTime = () => {
    // Get current time in IST
    const now = new Date();
    // Convert to IST by adding 5.5 hours to UTC time
    const istTime = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
    return istTime;
  };
  const [billData, setBillData] = useState(null);
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [isAmountEditing, setIsAmountEditing] = useState(false);
  const [editingAmounts, setEditingAmounts] = useState({});
  const [editingDiscount, setEditingDiscount] = useState(0);
  const [editingRoomCharges, setEditingRoomCharges] = useState(); // New state to track which room charges are being edited
  const [editingAdvancePayment, setEditingAdvancePayment] = useState(0);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);

  // New state for editing individual charge amounts
  const [editingChargeAmounts, setEditingChargeAmounts] = useState({});

  // New state for exclusions and extra pax
  const [excludedCharges, setExcludedCharges] = useState([]);
  const [showExcludePanel, setShowExcludePanel] = useState(false);
  const [extraPaxTotal, setExtraPaxTotal] = useState(0);

  // New state for split bill functionality
  const [showSplitBill, setShowSplitBill] = useState(false);

  // New states for Standalone Extra Pax Folio functionality
  const [activeFolioMode, setActiveFolioMode] = useState("master"); // "master", "primary", "extrapax"
  const [selectedPaxIndex, setSelectedPaxIndex] = useState("all"); // "all" = Combined (default), 0 = Pax 1, 1 = Pax 2, etc.
  const [checkoutWithSeparateExtraPax, setCheckoutWithSeparateExtraPax] = useState(false);
  const [extraPaxSettings, setExtraPaxSettings] = useState({
    occupantName: "",
    occupantPhone: "",
    includedIncidentals: {
      extraPaxCharges: true,
      extraBedCharges: true,
      foodCharges: true,
      laundryCharges: true,
      minibarCharges: true,
      manualCharges: true,
    },
    advance: 0,
    discount: 0,
  });
  const [extraPaxPaymentMode, setExtraPaxPaymentMode] = useState("Same as Room Bill");

  // Partial billing state (multi-room selection)
  const [selectedTargetRooms, setSelectedTargetRooms] = useState([]);

  // Ref to prevent the big useEffect from overwriting bill data during/after a save
  const isSaving = React.useRef(false);

  // Removed autoUpdateRun state - auto-update will run every time bill is opened

  const [companyQuery, setCompanyQuery] = useState("");
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const companyFieldRef = useRef(null);
  const getCompanyName = (c) =>
    c?.name || c?.company_name || c?.companyName || "";
  const getCompanyId = (c) => c?.company_id || c?.id || c?.companyId;
  const getCompanyGst = (c) => c?.gst_no || c?.gst_number || c?.gstNo || "";
  // Keep hooks (useMemo) before any early returns to preserve hook order across renders
  const filteredCompanies = useMemo(() => {
    const q = (companyQuery || "").trim().toLowerCase();
    if (!q) return [];
    return (companies || []).filter((c) =>
      getCompanyName(c).toLowerCase().includes(q),
    );
  }, [companies, companyQuery]);

  // State to force refresh bill data
  const [forceRefresh, setForceRefresh] = useState(0);

  // New State for editing guest info
  const [isEditingGuest, setIsEditingGuest] = useState(false);
  const [versionHistory, setVersionHistory] = useState(null); // State to track version history
  const [guestData, setGuestData] = useState({
    guestName: "",
    mobile: "",
    email: "",
    gender: "",
    nationality: "",
    address: "",
    idProofType: "",
    idProofNumber: "",
    city: "",
    state: "",
    pinCode: "",
    country: "",
  });

  // Checkout modal state
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [checkoutFormData, setCheckoutFormData] = useState({
    payment_mode: "",
    upi_platform: "",
    custom_upi_platform: "",
    received_by_staff_id: userData.cognitoId || "",
    notes: "",
  });
  const [validationErrors, setValidationErrors] = useState({
    payment_mode: "",
    upi_platform: "",
    custom_upi_platform: "",
    received_by_staff_id: "",
  });

  // Charge type definitions (removed roomCharges)
  const CHARGE_TYPES = [
    { key: "foodCharges", label: "Food Charges" },
    { key: "laundryCharges", label: "Laundry Charges" },
    { key: "minibarCharges", label: "Bar Charges" },
    { key: "extraBedCharges", label: "Extra Bed Charges" },
    { key: "manualCharges", label: "Miscellaneous Charges" },
  ];

  const CHARGES = {
    foodCharges: 0,
    laundryCharges: 0,
    minibarCharges: 0,
    extraBedCharges: 0,
    manualCharges: 0,
  };

  // Extract query parameters
  const bookingId = searchParams.get("booking_id");
  const guestId = searchParams.get("guest_id");
  const roomId = searchParams.get("room_id");
  const ratePlanId = searchParams.get("rate_plan_id");
  const checkInDate = searchParams.get("checkin_date");
  const checkoutDate = searchParams.get("checkout_date");

  // Function to check if a charge should be excluded
  const isChargeExcluded = (chargeType) => {
    return excludedCharges.includes(chargeType);
  };

  // Validation function for checkout form
  const validateCheckoutForm = () => {
    const errors = {
      payment_mode: "",
      upi_platform: "",
      custom_upi_platform: "",
      received_by_staff_id: "",
    };

    if (!checkoutFormData.payment_mode.trim()) {
      errors.payment_mode = "Payment mode is required";
    }

    if (
      checkoutFormData.payment_mode === "UPI" &&
      !checkoutFormData.upi_platform.trim()
    ) {
      errors.upi_platform = "UPI platform is required";
    }

    if (
      checkoutFormData.payment_mode === "UPI" &&
      checkoutFormData.upi_platform === "Others" &&
      !checkoutFormData.custom_upi_platform.trim()
    ) {
      errors.custom_upi_platform = "Custom UPI platform is required";
    }

    if (!checkoutFormData.received_by_staff_id.trim()) {
      errors.received_by_staff_id = "Staff ID is required";
    }

    setValidationErrors(errors);
    return !Object.values(errors).some((error) => error !== "");
  };

  // Extract bill data for checkout
  const extractBillDataForCheckout = () => {
    if (!billData) return null;

    return {
      totalRoomCharges: billData.billingSummary?.totalRoomServices || 0,
      totalServiceCharges: billData.billingSummary?.totalServiceCharges || 0,
      discountAmount: billData.billingSummary?.totalDiscount || 0,
      advanceReceived: billData.billingSummary?.partialPayment || 0,
      totalTaxAmount: billData.billingSummary?.totalTaxAmount || 0,
      grandTotal: billData.finalSummary?.totalAmount || 0,
      balanceDue: billData.billingSummary?.balanceDue || 0,
    };
  };

  // Handle room toggle for multi-room partial billing
  const handleToggleTargetRoom = (targetRoomId) => {
    setSelectedTargetRooms((prev) => {
      const allRoomIds = (booking?.breakdown?.rooms || []).map((r) => r.room_id);
      const currentSelection = prev.length > 0 ? prev : allRoomIds;
      if (currentSelection.includes(targetRoomId)) {
        if (currentSelection.length <= 1) {
          toast.warning("At least one room must be selected for the bill");
          return currentSelection;
        }
        return currentSelection.filter((id) => id !== targetRoomId);
      } else {
        return [...currentSelection, targetRoomId];
      }
    });
  };

  const handleSelectAllTargetRooms = () => {
    if (booking?.breakdown?.rooms) {
      setSelectedTargetRooms(booking.breakdown.rooms.map((r) => r.room_id));
    }
  };

  // Handle checkout button click
  const handleCheckoutClick = () => {
    if (!booking) {
      toast.error("Booking data not available");
      return;
    }
    setIsCheckoutModalOpen(true);
  };

  // Helper getters for company details (non-hook)
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

  useEffect(() => {
    const bookingData = bookings.find((b) => b.booking_id === bookingId);
    if (bookingData?.company_id) {
      const name = getCompanyNameById(bookingData.company_id);
      const gst = getCompanyGstById(bookingData.company_id);

      setCompanyQuery(name);
      setCheckoutFormData((prev) => ({
        ...prev,
        company_id: bookingData.company_id,
        gst_no: gst || bookingData.gst_no || "",
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
  }, []);

  // Process checkout
  const processCheckout = async () => {
    if (!booking || !validateCheckoutForm()) {
      return;
    }

    setIsProcessingCheckout(true);

    // If BTC and a new company is typed with GST, auto-create the company first
    if (
      checkoutFormData.payment_mode === "BTC" &&
      !checkoutFormData.company_id &&
      (companyQuery || "").trim() &&
      (checkoutFormData.gst_no || "").trim()
    ) {
      try {
        if (typeof createCompany === "function") {
          const created = await createCompany({
            name: (companyQuery || "").trim(),
            gst_no: (checkoutFormData.gst_no || "").trim(),
          });
          const newId = created?.company_id || created?.id || created?._id;
          if (newId) {
            // Update local state so downstream uses the id
            setCheckoutFormData((prev) => ({
              ...prev,
              company_id: newId,
              gst_no: created?.gst_no || prev.gst_no,
            }));
          }
        }
      } catch (e) {
        console.error("Auto-create company (checkout) failed:", e);
        // Continue without blocking checkout
      }
    }

    const billDataExtracted = extractBillDataForCheckout();
    const finalUpiPlatform =
      checkoutFormData.upi_platform === "Others"
        ? checkoutFormData.custom_upi_platform
        : checkoutFormData.upi_platform;

    // Build services object from billData
    const services = {};
    if (billData?.serviceChargesByDate) {
      billData.serviceChargesByDate.forEach((dayData) => {
        const date = Object.keys(dayData)[0];
        const roomEntries = dayData[date];

        roomEntries.forEach((roomEntry) => {
          const roomNumber = roomEntry.roomNumber;

          if (!services[roomNumber]) {
            services[roomNumber] = {};
          }

          services[roomNumber][date] = {
            room_charges: roomEntry.charges.roomCharges || 0,
            food_charges: roomEntry.charges.foodCharges || 0,
            laundry_charges: roomEntry.charges.laundryCharges || 0,
            minibar_charges: roomEntry.charges.minibarCharges || 0,
            extra_bed_charges: roomEntry.charges.extraBedCharges || 0,
            manual_charges: roomEntry.charges.manualCharges || 0,
            extra_pax_charges: roomEntry.charges.extraPaxCharges || 0,
          };
        });
      });
    }

    // Calculate total service charges
    let totalFoodCharges = 0;
    let totalLaundryCharges = 0;
    let totalMinibarCharges = 0;
    let totalExtraBedCharges = 0;
    let totalManualCharges = 0;
    let totalExtraPaxCharges = 0;

    Object.values(services).forEach((roomDates) => {
      Object.values(roomDates).forEach((charges) => {
        totalFoodCharges += charges.food_charges || 0;
        totalLaundryCharges += charges.laundry_charges || 0;
        totalMinibarCharges += charges.minibar_charges || 0;
        totalExtraBedCharges += charges.extra_bed_charges || 0;
        totalManualCharges += charges.manual_charges || 0;
        totalExtraPaxCharges += charges.extra_pax_charges || 0;
      });
    });

    const totalServiceCharges =
      totalFoodCharges +
      totalLaundryCharges +
      totalMinibarCharges +
      totalExtraBedCharges +
      totalManualCharges +
      totalExtraPaxCharges;

    // Calculate discount percent
    const roomCharges = billDataExtracted.totalRoomCharges || 0;
    const discountAmount = billDataExtracted.discountAmount || 0;
    const discountPercent =
      roomCharges > 0 ? ((discountAmount / roomCharges) * 100).toFixed(2) : 0;

    // Get tax type from booking or default to IGST
    const taxType = booking?.breakdown?.booking?.gst_type || "IGST";

    // Build bill_summary
    const billSummary = {
      roomCharges: roomCharges,
      serviceCharges: totalServiceCharges,
      foodCharges: totalFoodCharges,
      laundryCharges: totalLaundryCharges,
      minibarCharges: totalMinibarCharges,
      manualCharges: totalManualCharges,
      extraBedCharges: totalExtraBedCharges,
      extraPaxCharges: totalExtraPaxCharges,
      discountAmount: discountAmount,
      advanceReceived: billDataExtracted.advanceReceived || 0,
      taxAmount: billDataExtracted.totalTaxAmount || 0,
      subTotal: roomCharges + totalServiceCharges - discountAmount,
      grandTotal: billDataExtracted.grandTotal || 0,
      services: services,
    };

    const activeCheckoutRooms =
      selectedTargetRooms && selectedTargetRooms.length > 0
        ? selectedTargetRooms
        : (booking?.breakdown?.rooms || []).map((r) => r.room_id);

    const isPartial =
      booking?.breakdown?.rooms &&
      activeCheckoutRooms.length < booking.breakdown.rooms.length;

    const checkoutData = {
      booking_id: booking.breakdown.booking.booking_id,
      guest_id: booking.breakdown.booking.guest_id,
      room_id: activeCheckoutRooms,
      target_rooms: activeCheckoutRooms,
      payment_mode: checkoutFormData.payment_mode,
      upi_platform:
        checkoutFormData.payment_mode === "UPI" ? finalUpiPlatform : null,
      received_by_staff_id:
        userData.cognitoId || checkoutFormData.received_by_staff_id,
      notes: checkoutFormData.notes,
      room_charges: roomCharges,
      laundry_charges: totalLaundryCharges,
      food_charges: totalFoodCharges,
      minibar_charges: totalMinibarCharges,
      manual_charges: totalManualCharges,
      extra_bed_charges: totalExtraBedCharges,
      extra_pax_charges: totalExtraPaxCharges,
      discount_amount: discountAmount,
      discount_percent: parseFloat(discountPercent),
      tax_type: taxType,
      tax_amount: billDataExtracted.totalTaxAmount || 0,
      advance_received: billDataExtracted.advanceReceived || 0,
      total_amount: billDataExtracted.balanceDue || 0,
      refund_amount: 0,
      services: services,
      company_id: checkoutFormData.company_id || null,
      gst_no: checkoutFormData.gst_no || "N/A",
      bill_summary: billSummary,
      original_bill_data: booking,
      bill_no: bills?.length + 1,
    };

    try {
      await checkoutGuest({ bookingDetails: checkoutData });

      // If separate Extra Guest bill is enabled, persist folio metadata
      if (checkoutWithSeparateExtraPax && hasExtraPaxCharges) {
        try {
          const actualExtraPaxPaymentMode =
            extraPaxPaymentMode === "Same as Room Bill"
              ? checkoutFormData.payment_mode
              : extraPaxPaymentMode;

          const extraPaxRecord = {
            id: `EP-${bookingId || Date.now()}`,
            bookingId: bookingId || booking?.breakdown?.booking?.booking_id,
            roomNumber: booking?.breakdown?.rooms?.[0]?.room_number || "All",
            guestName: extraPaxSettings.occupantName || booking?.extra_pax?.[0]?.full_name || "Additional Guest",
            occupantPhone: extraPaxSettings.occupantPhone || "",
            settledAt: new Date().toISOString(),
            amount: extraPaxStandaloneTotal || extraPaxGrandTotal,
            subtotal: extraPaxGrandTotal,
            paymentMode: actualExtraPaxPaymentMode,
            roomPaymentMode: checkoutFormData.payment_mode,
            folioType: "EXTRA_GUEST_BILL",
            primaryReservationAmount: primaryReservationTotal,
          };
          const existingFolios = JSON.parse(localStorage.getItem("hotel_extra_pax_folios") || "[]");
          existingFolios.unshift(extraPaxRecord);
          localStorage.setItem("hotel_extra_pax_folios", JSON.stringify(existingFolios.slice(0, 100)));

          // If extra guest paid in Cash separately from room, record cash in drawer
          if (
            actualExtraPaxPaymentMode === "Cash" &&
            checkoutFormData.payment_mode !== "Cash" &&
            extraPaxStandaloneTotal > 0
          ) {
            try {
              const cashReceivedData = {
                date: new Date().toLocaleDateString("en-GB"),
                name: `${booking.breakdown.booking.booking_id}-EP`,
                description: `Cash payment received for Extra Guest Bill - ${extraPaxRecord.guestName}`,
                amount: extraPaxStandaloneTotal || 0,
                bill_id: `${booking.breakdown.booking.booking_id}-EP`,
                receivedId: Math.random().toString(36).substr(2, 9),
              };
              await addExpense({ received: cashReceivedData });
            } catch (err) {
              console.error("Error adding extra pax cash received to drawer:", err);
            }
          }
        } catch (e) {
          console.error("Error archiving extra pax folio:", e);
        }
      }

      if (checkoutFormData.payment_mode === "Cash") {
        try {
          // Get guest details for the description
          const guest = guests?.find(
            (g) => g.guest_id === booking.breakdown.booking.guest_id,
          );

          const cashReceivedData = {
            date: new Date().toLocaleDateString("en-GB"), // DD/MM/YYYY format
            name: `${booking.breakdown.booking.booking_id}`,
            description: `Cash payment received for guest checkout - ${
              guest?.full_name || "Guest"
            }`,
            amount: checkoutData.total_amount || 0, // Use total_amount from checkout data
            bill_id: booking.breakdown.booking.booking_id, // Store bill_id for reference
            receivedId: Math.random().toString(36).substr(2, 9), // Generate unique ID
          };

          // Add to cash drawer as received amount
          await addExpense({ received: cashReceivedData });
        } catch (error) {
          console.error("Error adding cash received to drawer:", error);
          // Don't block checkout if cash drawer update fails
        }
      }

      if (isPartial) {
        const remainingRooms = (booking?.breakdown?.rooms || []).filter(
          (r) => !activeCheckoutRooms.includes(r.room_id)
        );
        const checkedOutRoomNumbers = (booking?.breakdown?.rooms || [])
          .filter((r) => activeCheckoutRooms.includes(r.room_id))
          .map((r) => r.room_number)
          .join(", ");

        // 1. Mark checked-out room(s) as "Dirty" in the rooms table
        if (typeof updateRoomStatus === "function") {
          for (const rid of activeCheckoutRooms) {
            try {
              await updateRoomStatus(rid, "Dirty");
            } catch (statusErr) {
              console.warn("Could not update room status to Dirty:", statusErr);
            }
          }
        }

        // 2. Remove the checked-out room(s) from the booking table (reservation)
        const remainingRoomIds = remainingRooms.map((r) => r.room_id);
        const remainingRoomNumbers = remainingRooms.map((r) => r.room_number);
        const remainingRoomsConfig = Array.isArray(booking?.rooms_config)
          ? booking.rooms_config.filter(
              (rc) =>
                !activeCheckoutRooms.includes(rc.room_id) &&
                !activeCheckoutRooms.includes(rc.id)
            )
          : remainingRooms.map((r) => ({
              room_id: r.room_id,
              room_number: r.room_number,
              room_type: r.room_type,
            }));

        const updatedServices = { ...(booking?.services || {}) };
        activeCheckoutRooms.forEach((rid) => {
          const rObj = (rooms || []).find((r) => r.room_id === rid);
          delete updatedServices[rid];
          if (rObj?.room_number) {
            delete updatedServices[rObj.room_number];
          }
        });

        const targetBookingId =
          booking?.breakdown?.booking?.booking_id || bookingId;
        if (targetBookingId && typeof updateBooking === "function") {
          try {
            await updateBooking({
              bookingId: targetBookingId,
              bookingData: {
                ...(booking?.breakdown?.booking || {}),
                status: "Checked-in", // Remaining rooms stay checked in!
                room_id: remainingRoomIds,
                room_ids: remainingRoomIds,
                room_number: remainingRoomNumbers.join(", "),
                room_numbers: remainingRoomNumbers,
                no_of_rooms: remainingRoomIds.length,
                number_of_rooms: remainingRoomIds.length,
                rooms_config: remainingRoomsConfig,
                services: updatedServices,
              },
            });
          } catch (updateErr) {
            console.warn(
              "Could not update booking to remove checked-out rooms:",
              updateErr
            );
          }
        }

        // 3. Update localStorage metadata cache
        try {
          const rawStore = localStorage.getItem("hotel_bookings_meta") || "{}";
          const store = JSON.parse(rawStore);
          if (store[targetBookingId]) {
            store[targetBookingId] = {
              ...store[targetBookingId],
              room_id: remainingRoomIds,
              room_ids: remainingRoomIds,
              no_of_rooms: remainingRoomIds.length,
              number_of_rooms: remainingRoomIds.length,
              rooms_config: remainingRoomsConfig,
            };
            localStorage.setItem("hotel_bookings_meta", JSON.stringify(store));
          }
        } catch (e) {}

        toast.success(
          checkoutWithSeparateExtraPax
            ? `Room ${checkedOutRoomNumbers} checked out with separate Extra Guest Bill!`
            : `Room ${checkedOutRoomNumbers} checked out & bill settled successfully! Remaining rooms stay checked-in.`
        );
        if (typeof fetchBookings === "function") await fetchBookings();
        if (typeof fetchRooms === "function") await fetchRooms();
        if (typeof listTotalBill === "function") await listTotalBill();
        setIsCheckoutModalOpen(false);
        setCheckoutFormData({
          payment_mode: "",
          upi_platform: "",
          custom_upi_platform: "",
          received_by_staff_id: userData.cognitoId || "",
          notes: "",
        });
        setSelectedTargetRooms(remainingRooms.map((r) => r.room_id));
        setForceRefresh((prev) => prev + 1);
      } else {
        // Full checkout: Mark all rooms as Dirty
        if (typeof updateRoomStatus === "function") {
          const allRooms = booking?.breakdown?.rooms || [];
          for (const r of allRooms) {
            try {
              await updateRoomStatus(r.room_id, "Dirty");
            } catch (statusErr) {
              console.warn("Could not update room status to Dirty:", statusErr);
            }
          }
        }

        toast.success(
          checkoutWithSeparateExtraPax
            ? "Guest checked out successfully with separate Extra Guest Bill!"
            : "Guest checked out successfully!"
        );
        if (typeof fetchBookings === "function") await fetchBookings();
        if (typeof fetchRooms === "function") await fetchRooms();
        if (typeof listTotalBill === "function") await listTotalBill();
        setIsCheckoutModalOpen(false);
        setCheckoutFormData({
          payment_mode: "",
          upi_platform: "",
          custom_upi_platform: "",
          received_by_staff_id: userData.cognitoId || "",
          notes: "",
        });
        navigate("/dashboard/frontdesk/check_out");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Failed to checkout guest");
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  // Handle form field changes
  const handleFieldChange = (field, value) => {
    setCheckoutFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (validationErrors[field]) {
      setValidationErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }

    if (field === "upi_platform" && value !== "Others") {
      setCheckoutFormData((prev) => ({
        ...prev,
        custom_upi_platform: "",
      }));
    }

    if (field === "payment_mode" && value !== "UPI") {
      setCheckoutFormData((prev) => ({
        ...prev,
        upi_platform: "",
        custom_upi_platform: "",
      }));
    }
  };

  // Function to toggle charge exclusion (only in edit mode)
  const toggleChargeExclusion = (chargeType) => {
    if (!isAmountEditing) return; // Only allow changes in edit mode

    setExcludedCharges((prev) => {
      if (prev.includes(chargeType)) {
        return prev.filter((type) => type !== chargeType);
      } else {
        return [...prev, chargeType];
      }
    });
  };

  // Function to get filtered charges for a room entry
  const getFilteredCharges = (charges) => {
    const filtered = { ...charges };
    let totalReduction = 0;

    CHARGE_TYPES.forEach(({ key }) => {
      if (isChargeExcluded(key)) {
        totalReduction += filtered[key] || 0;
        filtered[key] = 0;
      }
    });

    filtered.dailyTotal = (filtered.dailyTotal || 0) - totalReduction;
    return filtered;
  };

  // Function to check if there are splitable department charges (F&B, Laundry, Minibar, Housekeeping, Excluded)
  const hasSplitableCharges = () => {
    // 1. Any service charges in summary
    if (Number(billData?.billingSummary?.totalServiceCharges) > 0) return true;
    if (Number(billData?.summary?.serviceCharges) > 0) return true;

    // 2. Check detailed services from booking
    const services = getDetailedServices();
    if (services && typeof services === "object") {
      for (const room in services) {
        for (const date in services[room]) {
          if (Array.isArray(services[room][date]) && services[room][date].length > 0) {
            const hasAny = services[room][date].some(
              (s) =>
                Number(s.food_charges) > 0 ||
                Number(s.laundry_charges) > 0 ||
                Number(s.minibar_charges) > 0 ||
                Number(s.extra_bed_charges) > 0 ||
                Number(s.manual_charges) > 0 ||
                s.order_id
            );
            if (hasAny) return true;
          }
        }
      }
    }

    // 3. Check serviceChargesByDate in billData
    if (billData?.serviceChargesByDate && Array.isArray(billData.serviceChargesByDate)) {
      const hasAnyDate = billData.serviceChargesByDate.some((dayData) => {
        const date = Object.keys(dayData)[0];
        const roomEntries = dayData[date];
        return (
          Array.isArray(roomEntries) &&
          roomEntries.some(
            (entry) =>
              Number(entry.charges?.foodCharges || entry.charges?.food_charges) > 0 ||
              Number(entry.charges?.laundryCharges || entry.charges?.laundry_charges) > 0 ||
              Number(entry.charges?.minibarCharges || entry.charges?.minibar_charges) > 0 ||
              Number(entry.charges?.extraBedCharges || entry.charges?.extra_bed_charges) > 0 ||
              Number(entry.charges?.manualCharges || entry.charges?.manual_charges) > 0
          )
        );
      });
      if (hasAnyDate) return true;
    }

    // 4. Check if any charges are excluded
    if (excludedCharges && Object.keys(excludedCharges).length > 0) return true;

    // 5. Check if booking has any orderDetails
    if (booking?.breakdown?.charges?.serviceCharges?.orderDetails?.length > 0) return true;

    return false;
  };

  const hasFoodCharges = hasSplitableCharges;

  // Function to get detailed services data from booking
  const getDetailedServices = () => {
    const bookingData = bookings.find((b) => b.booking_id === bookingId) || booking;
    return (
      bookingData?.detailedServices ||
      bookingData?.services ||
      bookingData?.breakdown?.bookingDetails?.services ||
      booking?.detailedServices ||
      booking?.services ||
      booking?.breakdown?.bookingDetails?.services ||
      {}
    );
  };

  // Refresh function
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await Promise.all([
        fetchGuests(),
        fetchBookings ? fetchBookings() : Promise.resolve(),
        calculateTotalBill({
          booking_id: bookingId,
          guest_id: guestId,
          room_id: roomId,
          rate_plan_id: ratePlanId,
          checkin_date: checkInDate,
          checkout_date: checkoutDate,
        }),
      ]);
      toast.success("Bill data refreshed successfully");
    } catch (error) {
      toast.error("Failed to refresh bill data");
    } finally {
      setRefreshing(false);
    }
  };

  const numberToWords = (amount) => {
    const ones = [
      "",
      "One",
      "Two",
      "Three",
      "Four",
      "Five",
      "Six",
      "Seven",
      "Eight",
      "Nine",
    ];
    const teens = [
      "Ten",
      "Eleven",
      "Twelve",
      "Thirteen",
      "Fourteen",
      "Fifteen",
      "Sixteen",
      "Seventeen",
      "Eighteen",
      "Nineteen",
    ];
    const tens = [
      "",
      "",
      "Twenty",
      "Thirty",
      "Forty",
      "Fifty",
      "Sixty",
      "Seventy",
      "Eighty",
      "Ninety",
    ];

    const convertTwoDigit = (num) => {
      if (num < 10) return ones[num];
      if (num >= 10 && num < 20) return teens[num - 10];
      return (
        tens[Math.floor(num / 10)] +
        (num % 10 !== 0 ? " " + ones[num % 10] : "")
      );
    };

    const convertThreeDigit = (num) => {
      let result = "";
      if (Math.floor(num / 100) > 0) {
        result += ones[Math.floor(num / 100)] + " Hundred";
        if (num % 100 !== 0) result += " ";
      }
      result += convertTwoDigit(num % 100);
      return result;
    };

    if (amount === 0) return "Zero Rupees Only";

    // Convert to integer (remove decimal part for simplicity)
    let rupees = Math.floor(amount);
    const paise = Math.round((amount - rupees) * 100);

    let result = "";

    // Handle crores
    if (rupees >= 10000000) {
      const crores = Math.floor(rupees / 10000000);
      result += convertThreeDigit(crores) + " Crore ";
      rupees %= 10000000;
    }

    // Handle lakhs
    if (rupees >= 100000) {
      const lakhs = Math.floor(rupees / 100000);
      result += convertTwoDigit(lakhs) + " Lakh ";
      rupees %= 100000;
    }

    // Handle thousands
    if (rupees >= 1000) {
      const thousands = Math.floor(rupees / 1000);
      result += convertTwoDigit(thousands) + " Thousand ";
      rupees %= 1000;
    }

    // Handle hundreds, tens, and ones
    if (rupees > 0) {
      result += convertThreeDigit(rupees) + " ";
    }

    result += "Rupees";

    // Handle paise
    if (paise > 0) {
      result += " and " + convertTwoDigit(paise) + " Paise";
    }

    result += " Only";

    return result.trim();
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchGuests();
      if (fetchBookings) await fetchBookings();
    };
    loadData();
  }, []);

  useEffect(() => {
    const fetchBillData = async () => {
      try {
        setLoading(true);
        setError(null);
        const bookingData = {
          booking_id: bookingId,
          guest_id: guestId,
          room_id: roomId ? roomId.split(",").map((id) => id.trim()) : [],
          rate_plan_id: ratePlanId,
          checkin_date: Number(checkInDate),
          checkout_date: checkoutDate,
          gst_type: "IGST",
        };

        const bookingDetails = {
          booking_id: bookingId,
          guest_id: guestId,
          room_id: roomId ? roomId.split(",").map((id) => id.trim()) : [],
          rate_plan_id: ratePlanId,
          checkin_date: Number(checkInDate),
          checkout_date: checkoutDate,
          gst_type: "IGST",
        };

        const data = await calculateTotalBill({
          bookingDetails,
        });
        setBooking(data);
      } catch (err) {
        setError("Failed to load bill data");
      } finally {
        setLoading(false);
      }
    };

    fetchBillData();
  }, []);

  // Initialize target rooms from booking rooms
  useEffect(() => {
    if (booking?.breakdown?.rooms && booking.breakdown.rooms.length > 0) {
      setSelectedTargetRooms((prev) => {
        if (prev.length === 0) {
          return booking.breakdown.rooms.map((r) => r.room_id);
        }
        return prev;
      });
    }
  }, [booking]);

  useEffect(() => {
    // Skip rebuild if a save is in progress to prevent overwriting edited values
    if (isSaving.current) return;

    if (booking && guests && guests.length > 0) {
      const rawBookingData = bookings?.find(
        (b) =>
          String(b.booking_id || "").trim() ===
          String(booking?.breakdown?.booking?.booking_id || bookingId || "").trim()
      );
      const allServicesObj =
        rawBookingData?.services ||
        booking?.breakdown?.bookingDetails?.services ||
        booking?.breakdown?.booking?.services ||
        booking?.services ||
        {};

      // Collect all rooms involved in this stay (current rooms + any historical rooms from room transfer)
      const knownBookingRooms = [...(booking?.breakdown?.rooms || [])];
      const knownRoomNumbers = new Set(
        knownBookingRooms.map((r) => String(r.room_number).trim())
      );
      const knownRoomIds = new Set(
        knownBookingRooms.map((r) => String(r.room_id).trim())
      );

      // Check services for historical rooms (e.g., Room 104 before transfer to Room 202)
      Object.keys(allServicesObj).forEach((rKey) => {
        const cleanKey = String(rKey).trim();
        if (!cleanKey) return;
        if (!knownRoomNumbers.has(cleanKey) && !knownRoomIds.has(cleanKey)) {
          const found = (rooms || []).find(
            (rm) =>
              String(rm.room_number).trim() === cleanKey ||
              String(rm.room_id).trim() === cleanKey
          );
          const newRoomObj = {
            room_id: found ? found.room_id : cleanKey,
            room_number: found ? String(found.room_number) : cleanKey,
            room_type: found?.room_type || rawBookingData?.room_type || "Standard",
            floor: found?.floor || "1",
            baseTariff: found?.tariff || 0,
            finalRoomTariff: found?.tariff || 0,
            averageTariffPerNight: found?.tariff || 0,
            storedCharge: false,
            isTransferredOrHistorical: true,
          };
          knownBookingRooms.push(newRoomObj);
          knownRoomNumbers.add(newRoomObj.room_number);
          knownRoomIds.add(String(newRoomObj.room_id));
        }
      });

      const allBookingRooms = knownBookingRooms;
      const activeRooms =
        selectedTargetRooms && selectedTargetRooms.length > 0
          ? allBookingRooms.filter(
              (r) =>
                selectedTargetRooms.includes(r.room_id) ||
                selectedTargetRooms.includes(String(r.room_number)) ||
                r.isTransferredOrHistorical
            )
          : allBookingRooms;
      const activeRoomIds = new Set(activeRooms.map((r) => String(r.room_id)));
      const activeRoomNumbers = new Set(
        activeRooms.map((r) => String(r.room_number))
      );

      // Calculate stay timestamps and dates
      const checkinTimestamp =
        typeof booking?.breakdown?.stayDetails?.checkin_date === "string"
          ? parseInt(booking.breakdown.stayDetails.checkin_date)
          : booking?.breakdown?.stayDetails?.checkin_date || rawBookingData?.checkin_date;

      let checkoutTimestamp;
      const rawCheckoutVal =
        booking?.breakdown?.stayDetails?.checkout_date || rawBookingData?.checkout_date;
      if (typeof rawCheckoutVal === "string") {
        if (rawCheckoutVal.includes("T")) {
          checkoutTimestamp = new Date(rawCheckoutVal).getTime();
        } else {
          checkoutTimestamp = parseInt(rawCheckoutVal);
        }
      } else {
        checkoutTimestamp = rawCheckoutVal;
      }

      const allStayDates = [];
      const getIndianDate = (ts) => {
        if (!ts) return new Date();
        const d = new Date(ts);
        return new Date(d.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
      };
      const formatIndianYMD = (dt) => {
        const y = dt.getFullYear();
        const m = String(dt.getMonth() + 1).padStart(2, "0");
        const d = String(dt.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
      };

      const cinIndian = getIndianDate(checkinTimestamp);
      const checkinDateStr = formatIndianYMD(cinIndian);
      const cinDayStart = new Date(cinIndian.getFullYear(), cinIndian.getMonth(), cinIndian.getDate());

      const nowIndian = getIndianDate(Date.now());
      const todayDayStart = new Date(nowIndian.getFullYear(), nowIndian.getMonth(), nowIndian.getDate());

      const coutIndian = getIndianDate(rawBookingData?.checkout_date || checkoutTimestamp);
      const coutDayStart = new Date(coutIndian.getFullYear(), coutIndian.getMonth(), coutIndian.getDate());

      const isStillCheckedIn =
        rawBookingData?.status === "Checked-in" ||
        booking?.breakdown?.booking?.status === "Checked-in";
      const effectiveEnd =
        isStillCheckedIn && todayDayStart > coutDayStart
          ? todayDayStart
          : coutDayStart;

      let curr = new Date(cinDayStart);
      if (cinDayStart >= effectiveEnd) {
        allStayDates.push(checkinDateStr);
      } else {
        while (curr < effectiveEnd) {
          allStayDates.push(formatIndianYMD(curr));
          curr.setDate(curr.getDate() + 1);
        }
      }

      if (todayDayStart > coutDayStart && isStillCheckedIn) {
        const todayStr = formatIndianYMD(todayDayStart);
        if (!allStayDates.includes(todayStr)) {
          allStayDates.push(todayStr);
        }
      }

      // Ensure all dates present in services are in allStayDates,
      // ignoring erroneous dates strictly before the check-in date
      Object.keys(allServicesObj).forEach((rKey) => {
        if (allServicesObj[rKey] && typeof allServicesObj[rKey] === "object") {
          Object.keys(allServicesObj[rKey]).forEach((d) => {
            if (d && !allStayDates.includes(d)) {
              if (checkinDateStr && d < checkinDateStr) {
                // Ignore dates before arrival (e.g. UTC shift artifacts like 14/10 when arrived on 15/10)
                return;
              }
              allStayDates.push(d);
            }
          });
        }
      });

      const allDates = Array.from(new Set(allStayDates)).sort();

      const diffStayDays = Math.max(
        1,
        Math.round((coutDayStart.getTime() - cinDayStart.getTime()) / (1000 * 60 * 60 * 24))
      );
      const numberOfNights = allDates.length > 0 ? allDates.length : Math.max(1, diffStayDays);

      // Calculate extra pax charges if present (supporting multiple sources & multiple pax per room)
      const targetBId = String(
        booking?.breakdown?.booking?.booking_id || bookingId || ""
      ).trim();
      const matchedB = bookings?.find(
        (b) => String(b.booking_id || "").trim() === targetBId
      );
      const rawExtraPax =
        matchedB?.extra_pax ||
        booking?.breakdown?.booking?.extra_pax ||
        booking?.extra_pax ||
        matchedB?.additional_guests ||
        booking?.breakdown?.booking?.additional_guests ||
        booking?.additional_guests;

      let extra_pax = [];
      if (Array.isArray(rawExtraPax)) {
        extra_pax = rawExtraPax;
      } else if (typeof rawExtraPax === "string" && rawExtraPax.trim()) {
        try {
          const parsed = JSON.parse(rawExtraPax);
          if (Array.isArray(parsed)) extra_pax = parsed;
        } catch (e) {
          extra_pax = [];
        }
      }

      let calculatedExtraPaxTotal = 0;
      if (extra_pax && Array.isArray(extra_pax)) {
        calculatedExtraPaxTotal = extra_pax
          .filter(
            (pax) =>
              !pax.room_id ||
              activeRoomIds.has(String(pax.room_id)) ||
              activeRoomNumbers.has(String(pax.room_number))
          )
          .reduce((total, pax) => {
            return total + (Number(pax.extra_pax_amount) || 0);
          }, 0);
      }
      setExtraPaxTotal(calculatedExtraPaxTotal);

      // Create a map of room_id to extra pax charges for specific room allocation
      const extraPaxByRoomId = {};
      if (extra_pax && Array.isArray(extra_pax)) {
        extra_pax.forEach((pax) => {
          const rKey = pax.room_id || pax.room_number;
          const amt = Number(pax.extra_pax_amount) || 0;
          if (rKey && amt > 0) {
            extraPaxByRoomId[rKey] = (extraPaxByRoomId[rKey] || 0) + amt;
          }
        });
      }

      const guestData = guests?.find((guest) => {
        return guest.guest_id === booking?.breakdown?.booking?.guest_id;
      });

      setGuestData(guestData);

      if (!guestData) {
        setError("Guest data not found");
        return;
      }

      // Load existing excluded charges
      const bookingData = bookings.find((b) => b.booking_id === bookingId);
      if (bookingData?.excluded) {
        setExcludedCharges(bookingData.excluded);
      }

      // Check if booking has the expected structure
      if (
        !booking.breakdown ||
        !booking.breakdown.booking ||
        !booking.breakdown.charges
      ) {
        setError("Invalid booking data structure");
        return;
      }

      // Find the company details from the companies array
      // Try to get company_id from either the processed booking or raw booking data
      const companyIdToUse = booking?.company_id || rawBookingData?.company_id;
      const grcNo = rawBookingData?.grc_no || "N/A";
      const no_of_adults = rawBookingData?.no_of_adults || 0;
      const companyDetails =
        companies?.find((company) => {
          return company.company_id === companyIdToUse;
        }) || {};
      setBillData((prev) => {
        return {
          ...prev,
          billHeader: {
            hotelName: institutionData?.companyName,
            address: institutionData?.contactDetails?.address,
            contact: institutionData?.contactDetails?.phone,
            email: institutionData?.contactDetails?.email,
            bookingRef: booking?.breakdown?.booking?.booking_id,
            gstIn: institutionData?.taxNumber,
            billDate: Date.now(),
          },
          guestDetails: {
            full_name: guestData.full_name,
            mobile: guestData.mobile,
            email: guestData.email || "---",
            gender: guestData.gender,
            nationality: guestData.nationality,
            id_proof_type: guestData.id_proof_type,
            id_proof_number: guestData.id_proof_number,
            address: guestData.address,
            city: guestData.city,
            state: guestData.state,
            pincode: guestData.pincode,
            country: guestData.country,
          },
          bookingDetails: {
            bookingId: booking.breakdown.booking.booking_id,
            bookingType: booking.breakdown.booking.booking_type,
            bookingSource: booking.breakdown.booking.booking_source,
            roomNumber: activeRooms
              .map((room) => room.room_number)
              .join(", "),
            roomType: [...new Set(activeRooms.map((room) => room.room_type))].join(", "),
            ratePlanId: booking.breakdown.ratePlan.plan_id,
            ratePlanName: booking.breakdown.ratePlan.name,
            ratePlanBaseTariff: booking.breakdown.ratePlan.base_tariff,
            ratePlanTariffVariation:
              booking.breakdown.ratePlan.tariff_variation,
            checkIn: booking.breakdown.stayDetails.checkin_date,
            checkOut: booking.breakdown.stayDetails.checkout_date,
            numberOfNights: numberOfNights,
            companyName: companyDetails.name || "N/A",
            companyGstNo: companyDetails.gst_no || "N/A",
            grc_no: grcNo,
            no_of_adults: no_of_adults,
            extra_pax: extra_pax,
          },
          extraPaxList: extra_pax,
          billingSummary: {
            // Use the breakdown data for more accurate calculations
            totalRoomServices:
              booking.breakdown?.charges?.roomCharges?.totalRoomCharges ||
              booking.summary?.roomCharges ||
              0,
            totalServiceCharges:
              booking.breakdown?.charges?.serviceCharges?.totalServiceCharges ||
              booking.summary?.serviceCharges ||
              0,
            extraPaxCharges: calculatedExtraPaxTotal,
            discountAmount: booking.breakdown?.booking?.discount || 0,
            totalDiscount:
              rawBookingData?.discount ??
              (booking.breakdown?.charges?.discount
                ?.discount_amount_calculated ||
              booking.summary?.discountAmount ||
              0),
            roomTaxRate: booking.breakdown?.charges?.tax?.roomTaxRate || 0,
            roomTaxAmount:
              booking.breakdown?.charges?.tax?.roomTaxAmount ||
              booking.summary?.roomTaxAmount ||
              0,
            serviceTaxRate:
              booking.breakdown?.charges?.tax?.serviceTaxRate || 0,
            serviceTaxAmount:
              booking.breakdown?.charges?.tax?.serviceTaxAmount ||
              booking.summary?.serviceTaxAmount ||
              0,
            totalTaxAmount:
              booking.breakdown?.charges?.tax?.totalTaxAmount ||
              booking.summary?.totalTaxAmount ||
              0,
            partialPayment:
              rawBookingData?.partial_payment_amount ??
              (booking.breakdown?.charges?.partialPaymentFromBooking ||
              booking.summary?.partialPayment ||
              0),
            // Use the subtotal from the breakdown, which is calculated correctly by the API
            subTotal:
              booking.breakdown?.charges?.subtotal ||
              (booking.breakdown?.charges?.roomCharges?.totalRoomCharges ||
                booking.summary?.roomCharges ||
                0) +
                (booking.breakdown?.charges?.serviceCharges
                  ?.totalServiceCharges ||
                  booking.summary?.serviceCharges ||
                  0) -
                (booking.breakdown?.charges?.discount
                  ?.discount_amount_calculated ||
                  booking.summary?.discountAmount ||
                  0),
            balanceDue: booking.summary?.balanceDue || 0,
          },
          finalSummary: {
            amountInWords: numberToWords(booking.summary?.grandTotal || 0),
            totalAmount: booking.summary?.grandTotal || 0,
          },

          legalSignature: {
            gstIn: institutionData?.taxNumber,
            roomStaySac: "996311",
            roomServiceSac: "996312",
            foodServiceSac: "996313",
            laundryClause:
              "Subject to Aimer jurisdiction. No claim for loss of valuables unless deposited.",
            guestName: guestData.full_name,
            guestSignature: "Guest Signature",
            cashierSignature: "Cashier Signature & Seal",
          },

          footer: {
            thankYou: "Thank You",
            tagline: `We appreciate your stay at ${institutionData?.companyName}`,
          },
        };
      });
      const checkinDate = new Date(checkinTimestamp);
      const checkoutDate = new Date(checkoutTimestamp);

      const serviceChargesByRoom =
        booking.breakdown?.charges?.serviceCharges?.serviceChargesByRoomAndDate ||
        {};

      const detailedServicesData = getDetailedServices();

      // Get all dates from room usage and service charges
      const roomUsageByDate =
        booking.breakdown?.stayDetails?.roomUsageByDate || {};

      const stayDates = new Set(Object.keys(roomUsageByDate));
      if (stayDates.size === 0) {
        stayDates.clear();
        allDates.forEach((date) => stayDates.add(date));
      }

      // Helper function to check if checkout time is within grace period of current time
      const shouldExcludeTodayFromCharges = (checkoutTimestamp) => {
        const now = new Date();
        const checkoutDate = new Date(checkoutTimestamp);
        const timeDifferenceMs = now.getTime() - checkoutDate.getTime();
        const timeDifferenceHours = timeDifferenceMs / (1000 * 60 * 60);
        return timeDifferenceHours <= 2;
      };

      // Helper function to check if today should be added due to late checkout (after grace period)
      const shouldAddTodayForLateCheckout = (checkoutTimestamp) => {
        const now = new Date();
        const checkoutDate = new Date(checkoutTimestamp);
        const timeDifferenceMs = now.getTime() - checkoutDate.getTime();
        const timeDifferenceHours = timeDifferenceMs / (1000 * 60 * 60);
        return timeDifferenceHours > 2;
      };

      const toIndianYMD = (val) => {
        if (!val) return "";
        if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
        const d = new Date(val);
        if (isNaN(d.getTime())) return String(val);
        const ind = new Date(d.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
        const y = ind.getFullYear();
        const m = String(ind.getMonth() + 1).padStart(2, "0");
        const day = String(ind.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
      };

      // Helper to compute service charges for a room on a date, deduplicating any duplicate order folio entries
      const getServiceChargesForRoomDate = (roomNumber, dateStr) => {
        const roomServices = serviceChargesByRoom[roomNumber] || allServicesObj[roomNumber] || {};
        const formattedDate = toIndianYMD(dateStr);
        const rawServicesFromAll =
          allServicesObj[roomNumber]?.[formattedDate] ||
          allServicesObj[roomNumber]?.[dateStr] ||
          {};
        const raw =
          roomServices[formattedDate] ||
          roomServices[dateStr] ||
          rawServicesFromAll || {
            food_charges: 0,
            laundry_charges: 0,
            minibar_charges: 0,
            extra_bed_charges: 0,
            manual_charges: 0,
            extra_pax_charges: 0,
            daily_total: 0,
          };

        const detailed = getDetailedServices();
        const roomKey = String(roomNumber).trim();
        const dRoom =
          detailed && typeof detailed === "object"
            ? detailed[roomKey] || detailed[roomNumber]
            : null;

        if (dRoom && typeof dRoom === "object") {
          const items = dRoom[formattedDate] || dRoom[dateStr];
          if (Array.isArray(items) && items.length > 0) {
            let food = 0,
              laundry = 0,
              minibar = 0,
              extraBed = 0,
              manual = 0;
            let hasFood = false,
              hasLaundry = false,
              hasMinibar = false,
              hasExtraBed = false,
              hasManual = false;
            let extraPax = Number(raw.extra_pax_charges || rawServicesFromAll.extra_pax_charges || 0);
            const seenIds = new Set();

            items.forEach((it) => {
              const id =
                it.order_id || it.token || it.barcode || it.service_id;
              if (id) {
                const key = String(id).trim();
                if (seenIds.has(key)) {
                  return; // Skip duplicate order/folio entry
                }
                seenIds.add(key);
              }

              if (it.food_charges !== undefined) {
                food += Number(it.food_charges || 0);
                hasFood = true;
              } else if (it.service_type === "food" || it.service_type === "restaurant") {
                food += Number(it.total_amount || 0);
                hasFood = true;
              }

              if (it.laundry_charges !== undefined) {
                laundry += Number(it.laundry_charges || 0);
                hasLaundry = true;
              } else if (it.service_type === "laundry") {
                laundry += Number(it.total_amount || 0);
                hasLaundry = true;
              }

              if (it.minibar_charges !== undefined) {
                minibar += Number(it.minibar_charges || 0);
                hasMinibar = true;
              } else if (it.service_type === "minibar") {
                minibar += Number(it.total_amount || 0);
                hasMinibar = true;
              }

              if (it.extra_bed_charges !== undefined) {
                extraBed += Number(it.extra_bed_charges || 0);
                hasExtraBed = true;
              } else if (it.service_type === "extra_bed") {
                extraBed += Number(it.total_amount || 0);
                hasExtraBed = true;
              }

              if (it.manual_charges !== undefined) {
                manual += Number(it.manual_charges || 0);
                hasManual = true;
              } else if (it.service_type === "manual" || it.service_type === "housekeeping") {
                manual += Number(it.total_amount || 0);
                hasManual = true;
              }

              if (it.extra_pax_charges !== undefined) {
                extraPax += Number(it.extra_pax_charges || 0);
              }
            });

            const finalFood = hasFood ? food : Number(raw.food_charges ?? rawServicesFromAll.food_charges ?? 0);
            const finalLaundry = hasLaundry ? laundry : Number(raw.laundry_charges ?? rawServicesFromAll.laundry_charges ?? 0);
            const finalMinibar = hasMinibar ? minibar : Number(raw.minibar_charges ?? rawServicesFromAll.minibar_charges ?? 0);
            const finalExtraBed = hasExtraBed ? extraBed : Number(raw.extra_bed_charges ?? rawServicesFromAll.extra_bed_charges ?? 0);
            const finalManual = hasManual ? manual : Number(raw.manual_charges ?? rawServicesFromAll.manual_charges ?? 0);

            return {
              food_charges: finalFood,
              laundry_charges: finalLaundry,
              minibar_charges: finalMinibar,
              extra_bed_charges: finalExtraBed,
              manual_charges: finalManual,
              extra_pax_charges: extraPax,
              daily_total:
                finalFood +
                finalLaundry +
                finalMinibar +
                finalExtraBed +
                finalManual +
                extraPax,
            };
          }
        }

        const food = Number(raw.food_charges ?? rawServicesFromAll.food_charges ?? 0);
        const laundry = Number(raw.laundry_charges ?? rawServicesFromAll.laundry_charges ?? 0);
        const minibar = Number(raw.minibar_charges ?? rawServicesFromAll.minibar_charges ?? 0);
        const extraBed = Number(raw.extra_bed_charges ?? rawServicesFromAll.extra_bed_charges ?? 0);
        const manual = Number(raw.manual_charges ?? rawServicesFromAll.manual_charges ?? 0);
        const extraPax = Number(raw.extra_pax_charges ?? rawServicesFromAll.extra_pax_charges ?? 0);

        return {
          food_charges: food,
          laundry_charges: laundry,
          minibar_charges: minibar,
          extra_bed_charges: extraBed,
          manual_charges: manual,
          extra_pax_charges: extraPax,
          daily_total: food + laundry + minibar + extraBed + manual + extraPax,
        };
      };

      // Construct daily charges mapping, reconstructing per-room allocation from services or room usage
      const dailyCharges = allDates.map((date) => {
        const formattedDate = toIndianYMD(date);

        // 1. Check if services has rooms with entries for this date
        // In room transfer cases, services[oldRoom][date] has room_charges from checkin to transfer date,
        // and services[newRoom][date] has room_charges from transfer date onwards!
        const servicesRoomsOnDate = Object.keys(allServicesObj).filter((rNum) => {
          const roomRecord = allServicesObj[rNum];
          return (
            roomRecord &&
            (roomRecord[formattedDate] !== undefined || roomRecord[date] !== undefined) &&
            activeRoomNumbers.has(String(rNum))
          );
        });

        // 2. Check roomUsageByDate from API
        const roomsForDate = (roomUsageByDate[date] || []).filter(
          (r) =>
            activeRoomIds.has(String(r.room_id)) ||
            activeRoomNumbers.has(String(r.room_number))
        );

        let roomEntries = [];

        if (servicesRoomsOnDate.length > 0) {
          // Room allocation directly from services (accurately reflects room transfer history)
          roomEntries = servicesRoomsOnDate.map((roomNumber) => {
            const serviceDayData =
              allServicesObj[roomNumber]?.[formattedDate] ||
              allServicesObj[roomNumber]?.[date] ||
              {};

            const roomDetails =
              activeRooms.find(
                (r) => String(r.room_number).trim() === String(roomNumber).trim()
              ) ||
              (rooms || []).find(
                (r) => String(r.room_number).trim() === String(roomNumber).trim()
              ) || {
                room_number: roomNumber,
                room_type: rawBookingData?.room_type || "Standard",
                finalRoomTariff: 0,
                baseTariff: 0,
              };

            const dateServices = getServiceChargesForRoomDate(roomNumber, date);

            let dailyRoomCharges = 0;
            if (serviceDayData.room_charges !== undefined && serviceDayData.room_charges !== null) {
              dailyRoomCharges = Number(serviceDayData.room_charges);
            } else if (roomDetails.finalRoomTariff || roomDetails.tariff) {
              dailyRoomCharges = Number(roomDetails.finalRoomTariff || roomDetails.tariff || 0);
            }

            const dailyServiceCharges = dateServices.daily_total;

            let roomSpecificExtraPax = dateServices.extra_pax_charges || 0;
            if (roomSpecificExtraPax === 0) {
              const rServices = serviceChargesByRoom[roomNumber] || {};
              for (const avDate of Object.keys(rServices)) {
                if (rServices[avDate]?.extra_pax_charges > 0) {
                  roomSpecificExtraPax = rServices[avDate].extra_pax_charges;
                  break;
                }
              }
            }

            if (roomSpecificExtraPax === 0 && extra_pax && Array.isArray(extra_pax)) {
              const roomExtraPax = extra_pax.find(
                (pax) =>
                  String(pax.room_id) === String(roomDetails.room_id) ||
                  String(pax.room_number) === String(roomNumber)
              );
              if (roomExtraPax?.extra_pax_amount) {
                roomSpecificExtraPax = Number(roomExtraPax.extra_pax_amount);
              }
            }

            return {
              roomNumber: roomNumber,
              roomType: roomDetails.room_type,
              date: date,
              charges: {
                foodCharges: dateServices.food_charges || 0,
                laundryCharges: dateServices.laundry_charges || 0,
                minibarCharges: dateServices.minibar_charges || 0,
                extraBedCharges: dateServices.extra_bed_charges || 0,
                manualCharges: dateServices.manual_charges || 0,
                roomCharges: dailyRoomCharges,
                ratePlanCharges:
                  booking?.breakdown?.ratePlan?.base_tariff ||
                  billData?.bookingDetails?.ratePlanBaseTariff ||
                  0,
                extraPaxCharges: roomSpecificExtraPax,
                dailyTotal:
                  dailyRoomCharges +
                  dailyServiceCharges +
                  (booking?.breakdown?.ratePlan?.base_tariff ||
                    billData?.bookingDetails?.ratePlanBaseTariff ||
                    0) +
                  roomSpecificExtraPax,
              },
            };
          });
        } else if (roomsForDate.length > 0) {
          // Room allocation from roomUsageByDate
          roomEntries = roomsForDate.map((roomUsage) => {
            const roomNumber = roomUsage.room_number;
            const dateServices = getServiceChargesForRoomDate(roomNumber, date);

            let dailyRoomCharges = roomUsage.tariff || 0;
            const servicesRoomCharges =
              allServicesObj?.[roomNumber]?.[formattedDate]?.room_charges ??
              allServicesObj?.[roomNumber]?.[date]?.room_charges;
            if (servicesRoomCharges !== undefined) {
              dailyRoomCharges = Number(servicesRoomCharges);
            }

            const dailyServiceCharges = dateServices.daily_total;
            let roomSpecificExtraPax = dateServices.extra_pax_charges || 0;
            if (roomSpecificExtraPax === 0) {
              const rServices = serviceChargesByRoom[roomNumber] || {};
              for (const avDate of Object.keys(rServices)) {
                if (rServices[avDate]?.extra_pax_charges > 0) {
                  roomSpecificExtraPax = rServices[avDate].extra_pax_charges;
                  break;
                }
              }
            }

            if (roomSpecificExtraPax === 0 && extra_pax && Array.isArray(extra_pax)) {
              const roomExtraPax = extra_pax.find(
                (pax) =>
                  String(pax.room_id) === String(roomUsage.room_id) ||
                  String(pax.room_number) === String(roomNumber)
              );
              if (roomExtraPax?.extra_pax_amount) {
                roomSpecificExtraPax = Number(roomExtraPax.extra_pax_amount);
              }
            }

            return {
              roomNumber: roomNumber,
              roomType: roomUsage.room_type,
              date: date,
              charges: {
                foodCharges: dateServices.food_charges || 0,
                laundryCharges: dateServices.laundry_charges || 0,
                minibarCharges: dateServices.minibar_charges || 0,
                extraBedCharges: dateServices.extra_bed_charges || 0,
                manualCharges: dateServices.manual_charges || 0,
                roomCharges: dailyRoomCharges,
                ratePlanCharges:
                  booking?.breakdown?.ratePlan?.base_tariff ||
                  billData?.bookingDetails?.ratePlanBaseTariff ||
                  0,
                extraPaxCharges: roomSpecificExtraPax,
                dailyTotal:
                  dailyRoomCharges +
                  dailyServiceCharges +
                  (booking?.breakdown?.ratePlan?.base_tariff ||
                    billData?.bookingDetails?.ratePlanBaseTariff ||
                    0) +
                  roomSpecificExtraPax,
              },
            };
          });
        } else {
          // Fallback to active current rooms
          let allRoomsData = activeRooms.filter((r) => !r.isTransferredOrHistorical);
          if (allRoomsData.length === 0) allRoomsData = activeRooms;

          roomEntries = allRoomsData.map((room) => {
            const roomNumber = room.room_number;
            const dateServices = getServiceChargesForRoomDate(roomNumber, date);

            let dailyRoomCharges =
              room.finalRoomTariff ||
              room.baseTariff ||
              room.averageTariffPerNight ||
              0;

            const servicesRoomCharges =
              allServicesObj?.[roomNumber]?.[formattedDate]?.room_charges ??
              allServicesObj?.[roomNumber]?.[date]?.room_charges;
            if (servicesRoomCharges !== undefined) {
              dailyRoomCharges = Number(servicesRoomCharges);
            }

            const dailyServiceCharges = dateServices.daily_total;
            let roomSpecificExtraPax = dateServices.extra_pax_charges || 0;
            if (roomSpecificExtraPax === 0) {
              const rServices = serviceChargesByRoom[roomNumber] || {};
              for (const avDate of Object.keys(rServices)) {
                if (rServices[avDate]?.extra_pax_charges > 0) {
                  roomSpecificExtraPax = rServices[avDate].extra_pax_charges;
                  break;
                }
              }
            }

            if (roomSpecificExtraPax === 0 && extra_pax && Array.isArray(extra_pax)) {
              const roomExtraPax = extra_pax.find(
                (pax) =>
                  String(pax.room_id) === String(room.room_id) ||
                  String(pax.room_number) === String(roomNumber)
              );
              if (roomExtraPax?.extra_pax_amount) {
                roomSpecificExtraPax = Number(roomExtraPax.extra_pax_amount);
              }
            }

            return {
              roomNumber: roomNumber,
              roomType: room.room_type,
              date: date,
              charges: {
                foodCharges: dateServices.food_charges || 0,
                laundryCharges: dateServices.laundry_charges || 0,
                minibarCharges: dateServices.minibar_charges || 0,
                extraBedCharges: dateServices.extra_bed_charges || 0,
                manualCharges: dateServices.manual_charges || 0,
                roomCharges: dailyRoomCharges,
                ratePlanCharges:
                  booking?.breakdown?.ratePlan?.base_tariff ||
                  billData?.bookingDetails?.ratePlanBaseTariff ||
                  0,
                extraPaxCharges: roomSpecificExtraPax,
                dailyTotal:
                  dailyRoomCharges +
                  dailyServiceCharges +
                  (booking?.breakdown?.ratePlan?.base_tariff ||
                    billData?.bookingDetails?.ratePlanBaseTariff ||
                    0) +
                  roomSpecificExtraPax,
              },
            };
          });
        }

        // Always check for additional rooms that have incidental service charges on this date
        const additionalServiceCharges = [];
        const currentDate = new Date().toISOString().split("T")[0];
        if (date <= currentDate) {
          const allServiceRoomKeys = Array.from(
            new Set([
              ...Object.keys(serviceChargesByRoom),
              ...Object.keys(allServicesObj),
              ...(detailedServicesData ? Object.keys(detailedServicesData) : []),
            ])
          );
          allServiceRoomKeys.forEach((roomNumber) => {
            if (!activeRoomNumbers.has(String(roomNumber))) {
              return;
            }

            const alreadyProcessed = roomEntries.some(
              (entry) => String(entry.roomNumber).trim() === String(roomNumber).trim(),
            );

            if (!alreadyProcessed) {
              const dateServices = getServiceChargesForRoomDate(roomNumber, date);
              const hasServices =
                (dateServices.food_charges || 0) > 0 ||
                (dateServices.laundry_charges || 0) > 0 ||
                (dateServices.minibar_charges || 0) > 0 ||
                (dateServices.extra_bed_charges || 0) > 0 ||
                (dateServices.manual_charges || 0) > 0 ||
                (dateServices.extra_pax_charges || 0) > 0;

              if (hasServices) {
                const roomDetails = activeRooms.find(
                  (r) => String(r.room_number) === String(roomNumber),
                ) || (rooms || []).find(
                  (r) => String(r.room_number) === String(roomNumber),
                ) || {
                  room_number: roomNumber,
                  room_type: "Standard",
                  finalRoomTariff: 0,
                  baseTariff: 0,
                };

                const servicesRoomCharges =
                  allServicesObj?.[roomNumber]?.[formattedDate]?.room_charges;
                const dailyRoomCharges = servicesRoomCharges !== undefined ? Number(servicesRoomCharges) : 0;
                const dailyServiceCharges = dateServices.daily_total;
                const roomSpecificExtraPax = dateServices.extra_pax_charges || 0;

                additionalServiceCharges.push({
                  roomNumber: roomNumber,
                  roomType: roomDetails.room_type,
                  date: date,
                  charges: {
                    foodCharges: dateServices.food_charges || 0,
                    laundryCharges: dateServices.laundry_charges || 0,
                    minibarCharges: dateServices.minibar_charges || 0,
                    extraBedCharges: dateServices.extra_bed_charges || 0,
                    manualCharges: dateServices.manual_charges || 0,
                    roomCharges: dailyRoomCharges,
                    ratePlanCharges: 0,
                    extraPaxCharges: roomSpecificExtraPax,
                    dailyTotal:
                      dailyRoomCharges +
                      dailyServiceCharges +
                      roomSpecificExtraPax,
                  },
                });
              }
            }
          });
        }

        // Combine room entries with additional service charges
        roomEntries = [...roomEntries, ...additionalServiceCharges];

        return {
          [date]: roomEntries,
        };
      });

      let totalRoomCharges = 0;
      let totalServiceCharges = 0;

      dailyCharges.forEach((dayData) => {
        const date = Object.keys(dayData)[0];
        const roomEntries = dayData[date];

        roomEntries.forEach((entry) => {
          totalRoomCharges += entry.charges.roomCharges || 0;
          totalServiceCharges += entry.charges.foodCharges || 0;
          totalServiceCharges += entry.charges.laundryCharges || 0;
          totalServiceCharges += entry.charges.minibarCharges || 0;
          totalServiceCharges += entry.charges.extraBedCharges || 0;
          totalServiceCharges += entry.charges.manualCharges || 0;
          totalServiceCharges += entry.charges.extraPaxCharges || 0;
        });
      });

      setBillData((prev) => {
        // Calculate tax amounts based on new totals (CGST 2.5% + SGST 2.5% = 5% total)
        const cgstAmount = Math.round((totalRoomCharges * 2.5) / 100);
        const sgstAmount = Math.round((totalRoomCharges * 2.5) / 100);
        const totalTaxAmount = cgstAmount + sgstAmount;

        // Calculate totals from breakdown data
        let totalRatePlanFromBreakdown = 0;
        let totalRoomFromBreakdown = 0;
        let totalServiceFromBreakdown = 0;
        let totalExtraPaxFromBreakdown = 0;

        if (dailyCharges) {
          dailyCharges.forEach((dayData) => {
            const date = Object.keys(dayData)[0];
            const roomEntries = dayData[date];
            roomEntries.forEach((roomEntry) => {
              const charges = roomEntry.charges;
              totalRatePlanFromBreakdown += charges.ratePlanCharges || 0;
              totalRoomFromBreakdown += charges.roomCharges || 0;
              totalServiceFromBreakdown +=
                (charges.foodCharges || 0) +
                (charges.laundryCharges || 0) +
                (charges.minibarCharges || 0) +
                (charges.extraBedCharges || 0) +
                (charges.manualCharges || 0);
              totalExtraPaxFromBreakdown += charges.extraPaxCharges || 0;
            });
          });
        }

        const isSubset =
          activeRooms.length < allBookingRooms.length && allBookingRooms.length > 0;
        const roomRatio = isSubset
          ? activeRooms.length / allBookingRooms.length
          : 1;

        // Calculate the correct totals based on our calculations
        // Prefer rawBookingData (updated by saves) over old billingSummary values
        const rawDiscount =
          rawBookingData?.discount ?? (prev.billingSummary?.totalDiscount || 0);
        const rawAdvance =
          rawBookingData?.partial_payment_amount ??
          (prev.billingSummary?.partialPayment || 0);

        const discountAmount = Math.round(rawDiscount * roomRatio);
        const advanceReceived = Math.round(rawAdvance * roomRatio);

        const effectiveTariff =
          totalRoomCharges + totalRatePlanFromBreakdown + totalExtraPaxFromBreakdown;

        // Calculate subtotal: effective room charges + service charges - discount
        const calculatedSubTotal =
          effectiveTariff + totalServiceCharges - discountAmount;

        // Calculate tax on the discounted amount (room charges after discount)
        const discountedRoomCharges = Math.max(0, effectiveTariff - discountAmount);
        const cgstAmountOnDiscounted = Math.round(
          (discountedRoomCharges * 2.5) / 100,
        );
        const sgstAmountOnDiscounted = Math.round(
          (discountedRoomCharges * 2.5) / 100,
        );
        const totalTaxAmountOnDiscounted =
          cgstAmountOnDiscounted + sgstAmountOnDiscounted;

        // Calculate grand total: subtotal + tax on discounted amount
        const calculatedGrandTotal =
          calculatedSubTotal + totalTaxAmountOnDiscounted;

        // Calculate balance due: grand total - advance payment
        const calculatedBalanceDue = calculatedGrandTotal - advanceReceived;

        return {
          ...prev,
          serviceChargesByDate: dailyCharges,
          billingSummary: {
            ...prev.billingSummary,
            totalRoomServices: effectiveTariff,
            totalServiceCharges: totalServiceCharges,
            extraPaxCharges: calculatedExtraPaxTotal,
            totalDiscount: discountAmount,
            partialPayment: advanceReceived,
            // Use calculated values for consistency
            subTotal: calculatedSubTotal,
            cgstAmount: cgstAmountOnDiscounted, // Use CGST amount calculated on discounted room charges
            sgstAmount: sgstAmountOnDiscounted, // Use SGST amount calculated on discounted room charges
            totalTaxAmount: totalTaxAmountOnDiscounted, // Use total tax amount calculated on discounted room charges
            balanceDue: calculatedBalanceDue,
            grandTotal: calculatedGrandTotal,
          },
          finalSummary: {
            ...prev.finalSummary,
            // Use calculated values for consistency
            amountInWords: numberToWords(calculatedGrandTotal),
            totalAmount: calculatedGrandTotal,
          },
        };
      });

      setEditingDiscount(
        formatNumber(billData?.billingSummary?.totalDiscount || 0),
      );
      setEditingAdvancePayment(
        formatNumber(billData?.billingSummary?.partialPayment || 0),
      );
      setEditingRoomCharges(
        formatNumber(billData?.billingSummary?.totalRoomServices || 0),
      );
    }
  }, [booking, guests, companies, forceRefresh, bookings, selectedTargetRooms]);

  useEffect(() => {
    setGuestData();
  }, []);

  // Recalculate billing summary when discount or advance payment changes
  useEffect(() => {
    if (isAmountEditing && billData) {
      recalculateBillingSummaryFromDiscounts();
    }
  }, [
    editingDiscount,
    editingAdvancePayment,
    isAmountEditing,
    editingChargeAmounts,
  ]);

  // Helper function to format numbers and avoid floating-point precision issues
  const formatNumber = (value) => {
    if (value === null || value === undefined || value === "") return 0;
    const num = parseFloat(value);
    return isNaN(num) ? 0 : Math.round(num * 100) / 100; // Round to 2 decimal places
  };

  // Recalculate totals when exclusions change
  useEffect(() => {
    if (billData?.serviceChargesByDate) {
      let totalRoomCharges = 0;
      let totalServiceCharges = 0;

      billData.serviceChargesByDate.forEach((dayData) => {
        const date = Object.keys(dayData)[0];
        const roomEntries = dayData[date];

        roomEntries.forEach((entry) => {
          const filteredCharges = getFilteredCharges(entry.charges);
          totalRoomCharges += filteredCharges.roomCharges || 0; // Room charges are never excluded
          totalServiceCharges += filteredCharges.foodCharges || 0;
          totalServiceCharges += filteredCharges.laundryCharges || 0;
          totalServiceCharges += filteredCharges.minibarCharges || 0;
          totalServiceCharges += filteredCharges.extraBedCharges || 0;
          totalServiceCharges += filteredCharges.manualCharges || 0;
        });
      });

      const cgstAmount = Math.round((totalRoomCharges * 2.5) / 100);
      const sgstAmount = Math.round((totalRoomCharges * 2.5) / 100);
      const totalTaxAmount = cgstAmount + sgstAmount;

      // Calculate totals from breakdown data
      let totalRatePlanFromBreakdown = 0;
      let totalRoomFromBreakdown = 0;
      let totalServiceFromBreakdown = 0;
      let totalExtraPaxFromBreakdown = 0;

      if (billData?.serviceChargesByDate) {
        billData.serviceChargesByDate.forEach((dayData) => {
          const date = Object.keys(dayData)[0];
          const roomEntries = dayData[date];
          roomEntries.forEach((roomEntry) => {
            const charges = roomEntry.charges;
            totalRatePlanFromBreakdown += charges.ratePlanCharges || 0;
            totalRoomFromBreakdown += charges.roomCharges || 0;
            totalServiceFromBreakdown +=
              (charges.foodCharges || 0) +
              (charges.laundryCharges || 0) +
              (charges.minibarCharges || 0) +
              (charges.extraBedCharges || 0) +
              (charges.manualCharges || 0);
            totalExtraPaxFromBreakdown += charges.extraPaxCharges || 0;
          });
        });
      }

      // Calculate the correct totals based on our calculations
      const discountAmount = billData?.billingSummary?.totalDiscount || 0;
      const advanceReceived = billData?.billingSummary?.partialPayment || 0;

      // Include rate plan base tariff and extra pax in effective tariff
      const effectiveTariff = totalRoomCharges + totalRatePlanFromBreakdown + totalExtraPaxFromBreakdown;

      // Calculate subtotal: effective room charges + service charges - discount
      const calculatedSubTotal =
        effectiveTariff + totalServiceCharges - discountAmount;

      // Calculate tax on the discounted amount (room charges after discount)
      const discountedRoomCharges = Math.max(0, effectiveTariff - discountAmount);
      const cgstAmountOnDiscounted = Math.round(
        (discountedRoomCharges * 2.5) / 100,
      );
      const sgstAmountOnDiscounted = Math.round(
        (discountedRoomCharges * 2.5) / 100,
      );
      const totalTaxAmountOnDiscounted =
        cgstAmountOnDiscounted + sgstAmountOnDiscounted;

      // Calculate grand total: subtotal + tax on discounted amount
      const calculatedGrandTotal =
        calculatedSubTotal + totalTaxAmountOnDiscounted;

      // Calculate balance due: grand total - advance payment
      const calculatedBalanceDue = calculatedGrandTotal - advanceReceived;

      setBillData((prev) => ({
        ...prev,
        billingSummary: {
          ...prev.billingSummary,
          totalRoomServices: effectiveTariff,
          totalServiceCharges: totalServiceCharges,
          // Use calculated values for consistency
          subTotal: calculatedSubTotal,
          cgstAmount: cgstAmountOnDiscounted,
          sgstAmount: sgstAmountOnDiscounted,
          totalTaxAmount: totalTaxAmountOnDiscounted,
          balanceDue: calculatedBalanceDue,
          grandTotal: calculatedGrandTotal,
        },
        finalSummary: {
          ...prev.finalSummary,
          // Use calculated values for consistency
          amountInWords: numberToWords(Math.max(0, calculatedGrandTotal)),
          totalAmount: calculatedGrandTotal,
        },
      }));
    }
  }, [
    excludedCharges,
    billData?.serviceChargesByDate,
    billData?.billingSummary?.totalDiscount,
    billData?.billingSummary?.partialPayment,
    extraPaxTotal,
  ]);

  // Comprehensive extraction of all extra occupants
  const extraPaxList = useMemo(() => {
    const targetBookingId = String(
      booking?.booking_id ||
      booking?.breakdown?.booking?.booking_id ||
      billData?.bookingDetails?.bookingId ||
      bookingId ||
      ""
    ).trim();

    const matchedBooking = bookings?.find(
      (b) => String(b.booking_id || "").trim() === targetBookingId
    );

    const candidates = [
      billData?.extraPaxList,
      billData?.bookingDetails?.extra_pax,
      matchedBooking?.extra_pax,
      booking?.extra_pax,
      booking?.breakdown?.booking?.extra_pax,
      matchedBooking?.additional_guests,
      booking?.breakdown?.booking?.additional_guests,
      booking?.additional_guests,
    ];

    for (const cand of candidates) {
      if (Array.isArray(cand) && cand.length > 0) {
        return cand
          .map((p, idx) => ({
            id: p.id || p.pax_id || idx + 1,
            full_name: (p.full_name || p.name || p.guest_name || "").trim(),
            gender: p.gender || "",
            age: p.age !== undefined && p.age !== null ? String(p.age) : "",
            mobile: (p.mobile || p.phone || p.contact || "").trim(),
            room_id: p.room_id || "",
            room_number:
              p.room_number ||
              (rooms?.find((r) => r.room_id === p.room_id)?.room_number) ||
              "",
            extra_pax_amount: Number(p.extra_pax_amount || p.amount || 0),
          }))
          .filter((p) => p.full_name || p.extra_pax_amount > 0);
      }
      if (typeof cand === "string" && cand.trim().startsWith("[")) {
        try {
          const parsed = JSON.parse(cand);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed
              .map((p, idx) => ({
                id: p.id || p.pax_id || idx + 1,
                full_name: (p.full_name || p.name || p.guest_name || "").trim(),
                gender: p.gender || "",
                age: p.age !== undefined && p.age !== null ? String(p.age) : "",
                mobile: (p.mobile || p.phone || p.contact || "").trim(),
                room_id: p.room_id || "",
                room_number:
                  p.room_number ||
                  (rooms?.find((r) => r.room_id === p.room_id)?.room_number) ||
                  "",
                extra_pax_amount: Number(p.extra_pax_amount || p.amount || 0),
              }))
              .filter((p) => p.full_name || p.extra_pax_amount > 0);
          }
        } catch (e) {}
      }
    }

    return [];
  }, [booking, billData, bookings, rooms, bookingId]);

  // Helper to compute Extra Pax Standalone and Primary Reservation totals
  const { extraPaxStandaloneTotal, extraPaxGrandTotal, primaryReservationTotal, hasExtraPaxCharges } = useMemo(() => {
    let extraPaxTariff = 0;
    let incidentals = 0;

    (billData?.serviceChargesByDate || []).forEach((dayData) => {
      const date = Object.keys(dayData)[0];
      (dayData[date] || []).forEach((entry) => {
        const c = entry.charges || {};
        extraPaxTariff += Number(c.extraPaxCharges || 0);
        if (extraPaxSettings?.includedIncidentals?.extraBedCharges) incidentals += Number(c.extraBedCharges || 0);
        if (extraPaxSettings?.includedIncidentals?.foodCharges) incidentals += Number(c.foodCharges || 0);
        if (extraPaxSettings?.includedIncidentals?.laundryCharges) incidentals += Number(c.laundryCharges || 0);
        if (extraPaxSettings?.includedIncidentals?.minibarCharges) incidentals += Number(c.minibarCharges || 0);
        if (extraPaxSettings?.includedIncidentals?.manualCharges) incidentals += Number(c.manualCharges || 0);
      });
    });

    if (extraPaxTariff === 0 && extraPaxList.length > 0) {
      extraPaxTariff = extraPaxList.reduce((sum, p) => sum + (Number(p.extra_pax_amount) || 0), 0);
    }
    if (extraPaxTariff === 0 && extraPaxTotal > 0) {
      extraPaxTariff = extraPaxTotal;
    }

    const extraPaxSubtotal = Math.max(0, extraPaxTariff + incidentals - Number(extraPaxSettings?.discount || 0));
    const extraPaxTax = Math.round((extraPaxSubtotal * 5) / 100);
    const extraPaxGrand = extraPaxSubtotal + extraPaxTax;
    const extraPaxNet = Math.max(0, extraPaxGrand - Number(extraPaxSettings?.advance || 0));

    const fullBalance = billData?.billingSummary?.balanceDue || 0;
    const primaryBal = Math.max(0, fullBalance - extraPaxNet);

    const hasPax = extraPaxTariff > 0 || incidentals > 0 || extraPaxList.length > 0 || extraPaxTotal > 0;

    return {
      extraPaxStandaloneTotal: extraPaxNet,
      extraPaxGrandTotal: extraPaxGrand,
      primaryReservationTotal: primaryBal,
      hasExtraPaxCharges: hasPax,
    };
  }, [billData?.serviceChargesByDate, extraPaxList, extraPaxTotal, extraPaxSettings, billData?.billingSummary?.balanceDue]);

  // Primary Reservation Bill Data (with Extra Pax and separated incidentals cleanly excluded)
  const primaryBillData = useMemo(() => {
    if (!billData) return null;

    const filteredDailyCharges = (billData.serviceChargesByDate || []).map((dayData) => {
      const date = Object.keys(dayData)[0];
      const roomEntries = (dayData[date] || []).map((entry) => {
        const c = { ...(entry.charges || {}) };
        const removedAmount = (c.extraPaxCharges || 0);
        return {
          ...entry,
          charges: {
            ...c,
            extraPaxCharges: 0,
            dailyTotal: Math.max(0, (c.dailyTotal || 0) - removedAmount),
          },
        };
      });
      return { [date]: roomEntries };
    });

    let totalRoom = 0;
    let totalServices = 0;
    let totalRatePlan = 0;

    filteredDailyCharges.forEach((dayData) => {
      const date = Object.keys(dayData)[0];
      (dayData[date] || []).forEach((entry) => {
        const c = entry.charges || {};
        totalRoom += c.roomCharges || 0;
        totalRatePlan += c.ratePlanCharges || 0;
        totalServices +=
          (c.foodCharges || 0) +
          (c.laundryCharges || 0) +
          (c.minibarCharges || 0) +
          (c.extraBedCharges || 0) +
          (c.manualCharges || 0);
      });
    });

    const discount = billData.billingSummary?.totalDiscount || 0;
    const advance = billData.billingSummary?.partialPayment || 0;
    const effectiveTariff = totalRoom + totalRatePlan;
    const subtotal = Math.max(0, effectiveTariff + totalServices - discount);
    const discountedRoom = Math.max(0, effectiveTariff - discount);
    const cgst = Math.round((discountedRoom * 2.5) / 100);
    const sgst = Math.round((discountedRoom * 2.5) / 100);
    const totalTax = cgst + sgst;
    const grandTotal = subtotal + totalTax;
    const balanceDue = grandTotal - advance;

    return {
      ...billData,
      serviceChargesByDate: filteredDailyCharges,
      billingSummary: {
        ...billData.billingSummary,
        totalRoomServices: effectiveTariff,
        totalServiceCharges: totalServices,
        extraPaxCharges: 0,
        subTotal: subtotal,
        cgstAmount: cgst,
        sgstAmount: sgst,
        totalTaxAmount: totalTax,
        grandTotal: grandTotal,
        balanceDue: balanceDue,
      },
      finalSummary: {
        ...billData.finalSummary,
        totalAmount: grandTotal,
        amountInWords: numberToWords(Math.max(0, balanceDue)),
      },
    };
  }, [billData]);

  // Current display data according to active folio mode
  const currentDisplayBillData = activeFolioMode === "primary" ? (primaryBillData || billData) : billData;

  // Show loading state
  if (loading || !guests || guests.length === 0 || !billData) {
    return (
      <HotelLoader
        message={loading ? "Generating bill..." : "Loading guest data..."}
      />
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg
              className="h-12 w-12 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    window.print(); // For now, use print for download as well
  };

  // Function to start editing amounts
  const startAmountEditing = () => {
    setIsAmountEditing(true);
    // Initialize editing amounts with current values
    const amounts = {};
    const chargeAmounts = {};

    if (billData?.serviceChargesByDate) {
      billData.serviceChargesByDate.forEach((dayData, dayIndex) => {
        const date = Object.keys(dayData)[0];
        const roomEntries = dayData[date];
        roomEntries.forEach((roomEntry, roomIndex) => {
          const charges = roomEntry.charges;
          const roomNumber = roomEntry.roomNumber;

          // Initialize editing amounts for each charge type
          const chargeKey = `${dayIndex}-${roomIndex}`;
          chargeAmounts[chargeKey] = {
            roomCharges: charges.roomCharges || 0,
            foodCharges: charges.foodCharges || 0,
            laundryCharges: charges.laundryCharges || 0,
            minibarCharges: charges.minibarCharges || 0,
            extraBedCharges: charges.extraBedCharges || 0,
            manualCharges: charges.manualCharges || 0,
            extraPaxCharges: charges.extraPaxCharges || 0,
            roomNumber: roomNumber,
            date: date,
          };
        });
      });
    }

    setEditingAmounts(amounts);
    setEditingChargeAmounts(chargeAmounts);
    // Initialize discount and advance payment editing values
    setEditingDiscount(
      formatNumber(billData?.billingSummary?.totalDiscount || 0),
    );
    setEditingAdvancePayment(
      formatNumber(billData?.billingSummary?.partialPayment || 0),
    );
  };

  // Function to save amount changes (now includes excluded charges)
  const saveAmountChanges = async () => {
    const bookingData = bookings.find((b) => b.booking_id === bookingId);

    // Update service charges with edited amounts
    const updatedServiceChargesByDate = billData.serviceChargesByDate.map(
      (dayData, dayIndex) => {
        const date = Object.keys(dayData)[0];
        const roomEntries = dayData[date];

        const updatedRoomEntries = roomEntries.map((roomEntry, roomIndex) => {
          const charges = { ...roomEntry.charges };
          const chargeKey = `${dayIndex}-${roomIndex}`;
          const editingData = editingChargeAmounts[chargeKey];

          // Update charges with edited values if they exist
          if (editingData) {
            charges.roomCharges = editingData.roomCharges || 0;
            charges.foodCharges = editingData.foodCharges || 0;
            charges.laundryCharges = editingData.laundryCharges || 0;
            charges.minibarCharges = editingData.minibarCharges || 0;
            charges.extraBedCharges = editingData.extraBedCharges || 0;
            charges.manualCharges = editingData.manualCharges || 0;
            charges.extraPaxCharges = editingData.extraPaxCharges || 0;
          }

          // Recalculate daily total including rate plan charges and extra pax
          const ratePlanCharges =
            billData?.bookingDetails?.ratePlanBaseTariff || 0;
          charges.ratePlanCharges = ratePlanCharges;
          charges.dailyTotal =
            charges.roomCharges +
            charges.foodCharges +
            charges.laundryCharges +
            charges.minibarCharges +
            charges.extraBedCharges +
            charges.manualCharges +
            ratePlanCharges +
            charges.extraPaxCharges;

          return {
            ...roomEntry,
            charges,
          };
        });

        return {
          [date]: updatedRoomEntries,
        };
      },
    );

    const updatedServices = {};

    // Get the actual room numbers from the booking to limit service entries
    const actualRoomNumbers = booking.breakdown.rooms.map(
      (room) => room.room_number,
    );

    // Build updatedServices object with the required format
    updatedServiceChargesByDate.forEach((dayData) => {
      const date = Object.keys(dayData)[0];
      const roomEntries = dayData[date];

      roomEntries.forEach((roomEntry, roomIndex) => {
        const charges = roomEntry.charges;
        const roomNumber = roomEntry.roomNumber;

        // Only add rooms that actually exist in the booking and have valid room numbers
        if (roomNumber && actualRoomNumbers.includes(roomNumber)) {
          if (!updatedServices[roomNumber]) {
            updatedServices[roomNumber] = {};
          }

          // Update services with edited amounts including room charges
          updatedServices[roomNumber][date] = {
            room_charges: charges.roomCharges || 0,
            extra_bed_charges: charges.extraBedCharges || 0,
            food_charges: charges.foodCharges || 0,
            laundry_charges: charges.laundryCharges || 0,
            manual_charges: charges.manualCharges || 0,
            minibar_charges: charges.minibarCharges || 0,
            extra_pax_charges: charges.extraPaxCharges || 0, // Add extra pax charges
          };
        }
      });
    });

    const updatedBooking = {
      ...bookingData,
      services: updatedServices,
      discount: formatNumber(editingDiscount),
      partial_payment_amount: formatNumber(editingAdvancePayment),
      excluded: excludedCharges, // Add excluded charges here
    };

    // Block the big useEffect from overwriting these changes while we save
    isSaving.current = true;

    // Update the bill data with new service charges
    setBillData((prev) => ({
      ...prev,
      serviceChargesByDate: updatedServiceChargesByDate,
      billingSummary: {
        ...prev.billingSummary,
        totalDiscount: formatNumber(editingDiscount),
        partialPayment: formatNumber(editingAdvancePayment),
      },
    }));

    // Recalculate billing summary with updated amounts
    recalculateBillingSummary(updatedServiceChargesByDate, formatNumber(editingDiscount), formatNumber(editingAdvancePayment));

    // Create version history to track changes (now includes excluded charges)
    const newVersionHistory = {
      changes: {
        oldValues: {},
        newValues: {},
      },
      updated_at: Date.now(),
      changed_by: userData.userName, // You can replace this with actual user ID or name
    };

    // Only add changed values to version history

    // Service charges are not editable, so no need to track service charge changes

    // Track discount changes
    if (editingDiscount !== (billData?.billingSummary?.totalDiscount || 0)) {
      newVersionHistory.changes.oldValues.discount =
        billData?.billingSummary?.totalDiscount || 0;
      newVersionHistory.changes.newValues.discount = editingDiscount;
    }

    // Track advance payment changes
    if (
      editingAdvancePayment !== (billData?.billingSummary?.partialPayment || 0)
    ) {
      newVersionHistory.changes.oldValues.partial_payment_amount =
        billData?.billingSummary?.partialPayment || 0;
      newVersionHistory.changes.newValues.partial_payment_amount =
        editingAdvancePayment;
    }

    // Track excluded charges changes
    const currentExcluded = bookingData?.excluded || [];
    if (
      JSON.stringify(currentExcluded.sort()) !==
      JSON.stringify(excludedCharges.sort())
    ) {
      newVersionHistory.changes.oldValues.excluded = currentExcluded;
      newVersionHistory.changes.newValues.excluded = excludedCharges;
    }

    // Track guest information changes
    const currentGuestData = billData.guestDetails || {};

    let hasGuestChanges = false;
    const guestChanges = { old: {}, new: {} };

    // Check for changes in each guest field
    const guestFields = [
      "full_name",
      "gender",
      "mobile",
      "id_proof_type",
      "email",
      "id_proof_number",
      "address",
      "city",
      "state",
      "pincode",
      "nationality",
    ];

    guestFields.forEach((field) => {
      const oldValue = currentGuestData[field] || "";
      const newValue = guestData[field] || "";

      if (oldValue !== newValue) {
        hasGuestChanges = true;
        guestChanges.old[field] = oldValue;
        guestChanges.new[field] = newValue;
      }
    });

    if (hasGuestChanges) {
      newVersionHistory.changes.oldValues.guest_info = guestChanges.old;
      newVersionHistory.changes.newValues.guest_info = guestChanges.new;
    }

    // Set the version history state
    setVersionHistory(newVersionHistory);

    try {
      await updateBooking({
        bookingData: updatedBooking,
        guestData: guestData,
        bookingId: bookingId,
        versionHistory: newVersionHistory,
      });
      setBillData((prev) => ({
        ...prev,
        guestDetails: {
          ...prev.guestDetails,
          ...guestData,
        },
      }));

      // Clear version history after successful submission
      setVersionHistory(null);
    } catch (error) {
      // Keep version history for debugging in case of error
    } finally {
      // Release the save lock after a short delay to let any pending
      // context updates (from updateBooking) settle without triggering a rebuild
      setTimeout(() => {
        isSaving.current = false;
      }, 500);
    }

    setIsAmountEditing(false);
    setEditingAmounts({});
    setEditingDiscount(0);
    setEditingAdvancePayment(0);
  };

  // Function to cancel amount editing
  const cancelAmountEditing = () => {
    setIsAmountEditing(false);
    setEditingAmounts({});
    setEditingChargeAmounts({});
    setEditingDiscount(
      formatNumber(billData?.billingSummary?.totalDiscount || 0),
    );
    setEditingAdvancePayment(
      formatNumber(billData?.billingSummary?.partialPayment || 0),
    );
    // Clear version history on cancel
    setVersionHistory(null);
  };

  // Function to recalculate billing summary after amount changes
  const recalculateBillingSummary = (serviceChargesByDate, discountOverride, advancePaymentOverride) => {
    let totalRoomCharges = 0;
    let totalServiceCharges = 0;

    serviceChargesByDate.forEach((dayData) => {
      const date = Object.keys(dayData)[0];
      const roomEntries = dayData[date];

      roomEntries.forEach((entry) => {
        totalRoomCharges += entry.charges.roomCharges || 0;
        totalServiceCharges += entry.charges.foodCharges || 0;
        totalServiceCharges += entry.charges.laundryCharges || 0;
        totalServiceCharges += entry.charges.minibarCharges || 0;
        totalServiceCharges += entry.charges.extraBedCharges || 0;
        totalServiceCharges += entry.charges.manualCharges || 0;
      });
    });

    // Calculate totals from breakdown data using the passed serviceChargesByDate
    let totalRatePlanFromBreakdown = 0;
    let totalRoomFromBreakdown = 0;
    let totalServiceFromBreakdown = 0;
    let totalExtraPaxFromBreakdown = 0;

    serviceChargesByDate.forEach((dayData) => {
      const date = Object.keys(dayData)[0];
      const roomEntries = dayData[date];
      roomEntries.forEach((roomEntry) => {
        const charges = roomEntry.charges;
        totalRatePlanFromBreakdown += charges.ratePlanCharges || 0;
        totalRoomFromBreakdown += charges.roomCharges || 0;
        totalServiceFromBreakdown +=
          (charges.foodCharges || 0) +
          (charges.laundryCharges || 0) +
          (charges.minibarCharges || 0) +
          (charges.extraBedCharges || 0) +
          (charges.manualCharges || 0);
        totalExtraPaxFromBreakdown += charges.extraPaxCharges || 0;
      });
    });

    // Use override values when provided (from saveAmountChanges), otherwise fall back to billData
    const discountAmount = discountOverride !== undefined ? discountOverride : (billData?.billingSummary?.totalDiscount || 0);
    const advanceReceived = advancePaymentOverride !== undefined ? advancePaymentOverride : (billData?.billingSummary?.partialPayment || 0);

    const effectiveTariff = totalRoomCharges + totalRatePlanFromBreakdown + totalExtraPaxFromBreakdown;

    // Calculate subtotal: effective room charges + service charges - discount
    const calculatedSubTotal =
      effectiveTariff + totalServiceCharges - discountAmount;

    // Calculate tax on the discounted amount (room charges after discount)
    const discountedRoomCharges = Math.max(0, effectiveTariff - discountAmount);
    const cgstAmountOnDiscounted = Math.round(
      (discountedRoomCharges * 2.5) / 100,
    );
    const sgstAmountOnDiscounted = Math.round(
      (discountedRoomCharges * 2.5) / 100,
    );
    const totalTaxAmountOnDiscounted =
      cgstAmountOnDiscounted + sgstAmountOnDiscounted;

    // Calculate grand total: subtotal + tax on discounted amount
    const calculatedGrandTotal =
      calculatedSubTotal + totalTaxAmountOnDiscounted;

    // Calculate balance due: grand total - advance payment
    const calculatedBalanceDue = calculatedGrandTotal - advanceReceived;

    setBillData((prev) => ({
      ...prev,
      billingSummary: {
        ...prev.billingSummary,
        totalDiscount: discountAmount,
        partialPayment: advanceReceived,
        totalRoomServices: effectiveTariff,
        totalServiceCharges: totalServiceCharges,
        // Use calculated values for consistency
        subTotal: calculatedSubTotal,
        cgstAmount: cgstAmountOnDiscounted,
        sgstAmount: sgstAmountOnDiscounted,
        totalTaxAmount: totalTaxAmountOnDiscounted,
        balanceDue: calculatedBalanceDue,
        grandTotal: calculatedGrandTotal,
      },
      finalSummary: {
        ...prev.finalSummary,
        // Use calculated values for consistency
        amountInWords: numberToWords(Math.max(0, calculatedGrandTotal)),
        totalAmount: calculatedGrandTotal,
      },
    }));
  };

  // Function to recalculate billing summary when discount or advance payment changes
  const recalculateBillingSummaryFromDiscounts = () => {
    if (!billData?.serviceChargesByDate) return;

    let totalRoomCharges = 0;
    let totalServiceCharges = 0;

    billData.serviceChargesByDate.forEach((dayData, dayIndex) => {
      const date = Object.keys(dayData)[0];
      const roomEntries = dayData[date];

      roomEntries.forEach((entry, roomIndex) => {
        const chargeKey = `${dayIndex}-${roomIndex}`;
        const editingData = editingChargeAmounts[chargeKey];

        if (isAmountEditing && editingData) {
          totalRoomCharges += editingData.roomCharges || 0;
          totalServiceCharges += editingData.foodCharges || 0;
          totalServiceCharges += editingData.laundryCharges || 0;
          totalServiceCharges += editingData.minibarCharges || 0;
          totalServiceCharges += editingData.extraBedCharges || 0;
          totalServiceCharges += editingData.manualCharges || 0;
        } else {
          totalRoomCharges += entry.charges.roomCharges || 0;
          totalServiceCharges += entry.charges.foodCharges || 0;
          totalServiceCharges += entry.charges.laundryCharges || 0;
          totalServiceCharges += entry.charges.minibarCharges || 0;
          totalServiceCharges += entry.charges.extraBedCharges || 0;
          totalServiceCharges += entry.charges.manualCharges || 0;
        }
      });
    });

    // Calculate totals from breakdown data
    let totalRatePlanFromBreakdown = 0;
    let totalRoomFromBreakdown = 0;
    let totalServiceFromBreakdown = 0;
    let totalExtraPaxFromBreakdown = 0;

    if (billData?.serviceChargesByDate) {
      billData.serviceChargesByDate.forEach((dayData, dayIndex) => {
        const date = Object.keys(dayData)[0];
        const roomEntries = dayData[date];
        roomEntries.forEach((roomEntry, roomIndex) => {
          const chargeKey = `${dayIndex}-${roomIndex}`;
          const editingData = editingChargeAmounts[chargeKey];

          if (isAmountEditing && editingData) {
            totalRatePlanFromBreakdown +=
              billData?.bookingDetails?.ratePlanBaseTariff || 0;
            totalRoomFromBreakdown += editingData.roomCharges || 0;
            totalServiceFromBreakdown +=
              (editingData.foodCharges || 0) +
              (editingData.laundryCharges || 0) +
              (editingData.minibarCharges || 0) +
              (editingData.extraBedCharges || 0) +
              (editingData.manualCharges || 0);
            totalExtraPaxFromBreakdown += editingData.extraPaxCharges || 0;
          } else {
            const charges = roomEntry.charges;
            totalRatePlanFromBreakdown += charges.ratePlanCharges || 0;
            totalRoomFromBreakdown += charges.roomCharges || 0;
            totalServiceFromBreakdown +=
              (charges.foodCharges || 0) +
              (charges.laundryCharges || 0) +
              (charges.minibarCharges || 0) +
              (charges.extraBedCharges || 0) +
              (charges.manualCharges || 0);
            totalExtraPaxFromBreakdown += charges.extraPaxCharges || 0;
          }
        });
      });
    }

    // Calculate the correct totals based on our calculations
    const discountAmount = billData?.billingSummary?.totalDiscount || 0;
    const advanceReceived = billData?.billingSummary?.partialPayment || 0;

    const effectiveTariff =
      totalRoomCharges + totalRatePlanFromBreakdown + totalExtraPaxFromBreakdown;

    // Calculate subtotal: effective room charges + service charges - discount
    const calculatedSubTotal =
      effectiveTariff + totalServiceCharges - discountAmount;

    // Calculate tax on the discounted amount (room charges after discount)
    const discountedRoomCharges = Math.max(0, effectiveTariff - discountAmount);
    const cgstAmountOnDiscounted = Math.round(
      (discountedRoomCharges * 2.5) / 100,
    );
    const sgstAmountOnDiscounted = Math.round(
      (discountedRoomCharges * 2.5) / 100,
    );
    const totalTaxAmountOnDiscounted =
      cgstAmountOnDiscounted + sgstAmountOnDiscounted;

    // Calculate grand total: subtotal + tax on discounted amount
    const calculatedGrandTotal =
      calculatedSubTotal + totalTaxAmountOnDiscounted;

    // Calculate balance due: grand total - advance payment
    const calculatedBalanceDue = calculatedGrandTotal - advanceReceived;

    setBillData((prev) => ({
      ...prev,
      billingSummary: {
        ...prev.billingSummary,
        totalRoomServices: effectiveTariff,
        totalServiceCharges: totalServiceCharges,
        // Use calculated values for consistency
        subTotal: calculatedSubTotal,
        cgstAmount: cgstAmountOnDiscounted, // Use CGST amount calculated on discounted room charges
        sgstAmount: sgstAmountOnDiscounted, // Use SGST amount calculated on discounted room charges
        totalTaxAmount: totalTaxAmountOnDiscounted, // Use total tax amount calculated on discounted room charges
        balanceDue: calculatedBalanceDue,
        grandTotal: calculatedGrandTotal,
      },
      finalSummary: {
        ...prev.finalSummary,
        // Use calculated values for consistency
        amountInWords: numberToWords(calculatedGrandTotal),
        totalAmount: calculatedGrandTotal,
      },
    }));
  };

  // Show split bill if requested
  if (showSplitBill) {
    return (
      <SplitBill
        billData={billData}
        guestData={guestData}
        booking={booking}
        institutionData={institutionData}
        userData={userData}
        detailedServices={getDetailedServices()}
        excludedCharges={excludedCharges}
        isChargeExcluded={isChargeExcluded}
        getFilteredCharges={getFilteredCharges}
        editingChargeAmounts={editingChargeAmounts}
        setEditingChargeAmounts={setEditingChargeAmounts}
        isAmountEditing={isAmountEditing}
        editingDiscount={editingDiscount}
        setEditingDiscount={setEditingDiscount}
        editingAdvancePayment={editingAdvancePayment}
        setEditingAdvancePayment={setEditingAdvancePayment}
      />
    );
  }

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
    setShowCompanyDropdown(!!value.trim());
    if (checkoutFormData?.company_id) {
      handleFieldChange("company_id", "");
      handleFieldChange("gst_no", "");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Checkout Modal */}
      <Dialog open={isCheckoutModalOpen} onOpenChange={setIsCheckoutModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogOut className="h-5 w-5 text-green-600" />
              Guest Check-Out
            </DialogTitle>
            <DialogDescription>
              Complete the checkout process and process payment
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Payment Mode */}
            <div className="space-y-2">
              <Label htmlFor="payment_mode">
                Payment Mode <span className="text-red-500">*</span>
              </Label>
              <Select
                value={checkoutFormData.payment_mode}
                onValueChange={(value) =>
                  handleFieldChange("payment_mode", value)
                }
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
                  <SelectItem value="Credit Card">Credit Card</SelectItem>
                  <SelectItem value="Debit Card">Debit Card</SelectItem>
                  <SelectItem value="BTC">BTC</SelectItem>
                </SelectContent>
              </Select>
              {validationErrors.payment_mode && (
                <p className="text-red-500 text-xs">
                  {validationErrors.payment_mode}
                </p>
              )}
            </div>

            {/* UPI Platform */}
            {checkoutFormData.payment_mode === "UPI" && (
              <div className="space-y-2">
                <Label htmlFor="upi_platform">
                  UPI Platform <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={checkoutFormData.upi_platform}
                  onValueChange={(value) =>
                    handleFieldChange("upi_platform", value)
                  }
                >
                  <SelectTrigger
                    className={
                      validationErrors.upi_platform ? "border-red-500" : ""
                    }
                  >
                    <SelectValue placeholder="Select UPI Platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Google Pay">Google Pay</SelectItem>
                    <SelectItem value="Amazon Pay">Amazon Pay</SelectItem>
                    <SelectItem value="PhonePe">PhonePe</SelectItem>
                    <SelectItem value="BHIM">BHIM</SelectItem>
                    <SelectItem value="Paytm">Paytm</SelectItem>
                    <SelectItem value="Others">Others</SelectItem>
                  </SelectContent>
                </Select>
                {validationErrors.upi_platform && (
                  <p className="text-red-500 text-xs">
                    {validationErrors.upi_platform}
                  </p>
                )}
              </div>
            )}

            {/* Custom UPI Platform */}
            {checkoutFormData.payment_mode === "UPI" &&
              checkoutFormData.upi_platform === "Others" && (
                <div className="space-y-2">
                  <Label htmlFor="custom_upi_platform">
                    Specify UPI Platform <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="custom_upi_platform"
                    placeholder="Enter UPI platform name"
                    value={checkoutFormData.custom_upi_platform}
                    onChange={(e) =>
                      handleFieldChange("custom_upi_platform", e.target.value)
                    }
                    className={
                      validationErrors.custom_upi_platform
                        ? "border-red-500"
                        : ""
                    }
                  />
                  {validationErrors.custom_upi_platform && (
                    <p className="text-red-500 text-xs">
                      {validationErrors.custom_upi_platform}
                    </p>
                  )}
                </div>
              )}

            {checkoutFormData.payment_mode === "BTC" &&
              !bookings.find((b) => b.booking_id === bookingId).company_id && (
                <>
                  <div ref={companyFieldRef} className="bg-gray-50 p-2 rounded">
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
                        onFocus={() =>
                          setShowCompanyDropdown(!!companyQuery.trim())
                        }
                        placeholder="Search company"
                        className={`h-8 text-xs pr-6 ${
                          validationErrors.company_id
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                      {(companyQuery || checkoutFormData?.company_id) && (
                        <button
                          type="button"
                          aria-label="Clear selected company"
                          onClick={clearSelectedCompany}
                          className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}

                      {showCompanyDropdown && (
                        <div className="absolute z-20 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg">
                          <ul className="max-h-56 overflow-auto py-1">
                            {filteredCompanies.length > 0 &&
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
                              })}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-2 rounded">
                    <Label className="text-xs font-medium text-gray-700">
                      GST Number
                      {checkoutFormData?.company_id &&
                        getCompanyGstById(checkoutFormData.company_id) && (
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
                      className="h-8 text-xs mt-1 border-gray-300"
                    />
                  </div>
                </>
              )}

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
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
                className="resize-none"
                rows={3}
              />
            </div>

            {/* Separate Bill Option at Checkout */}
            {hasExtraPaxCharges && (
              <div className="border border-gray-200 bg-gray-50/80 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-900 select-none">
                    <input
                      type="checkbox"
                      checked={checkoutWithSeparateExtraPax}
                      onChange={(e) =>
                        setCheckoutWithSeparateExtraPax(e.target.checked)
                      }
                      className="rounded border-gray-300 text-gray-900 focus:ring-gray-400 h-4 w-4"
                    />
                    <Users className="h-4 w-4 text-gray-700" />
                    <span>Generate Separate Bill for Extra Guest / Services</span>
                  </label>
                  <span className="text-[10px] bg-gray-200 text-gray-800 px-2 py-0.5 rounded font-medium">
                    Separate Bill
                  </span>
                </div>
                <p className="text-[11px] text-gray-600 leading-tight">
                  Settle extra occupant charges and incidental services on a separate bill. The master reservation remains consolidated in history.
                </p>

                {checkoutWithSeparateExtraPax && (
                  <div className="space-y-2.5 mt-2 pt-2 border-t border-gray-200">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-white p-2 rounded border border-gray-200 shadow-xs">
                        <div className="text-[10px] text-gray-500 font-medium">Room Bill</div>
                        <div className="font-bold text-gray-900 text-sm">
                          ₹{(primaryReservationTotal || 0).toLocaleString()}
                        </div>
                      </div>
                      <div className="bg-white p-2 rounded border border-gray-200 shadow-xs">
                        <div className="text-[10px] text-gray-700 font-medium">
                          Extra Guest Bill{extraPaxList.length > 1 ? ` (${extraPaxList.length} Guests)` : ""}
                        </div>
                        <div className="font-bold text-gray-900 text-sm">
                          ₹{(extraPaxStandaloneTotal || 0).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="extrapax_payment_mode" className="text-xs font-medium text-gray-700 block mb-1">
                        Extra Guest Payment Mode:
                      </Label>
                      <Select
                        value={extraPaxPaymentMode}
                        onValueChange={(val) => setExtraPaxPaymentMode(val)}
                      >
                        <SelectTrigger className="w-full h-8 text-xs border-gray-300">
                          <SelectValue placeholder="Select Payment Mode" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Same as Room Bill">
                            Same as Room Bill ({checkoutFormData.payment_mode || "Selected Mode"})
                          </SelectItem>
                          <SelectItem value="Cash">Cash</SelectItem>
                          <SelectItem value="QR">QR</SelectItem>
                          <SelectItem value="UPI">UPI</SelectItem>
                          <SelectItem value="Credit Card">Credit Card</SelectItem>
                          <SelectItem value="Debit Card">Debit Card</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Bill Summary */}
            {billData && (
              <div className="border-t pt-3 space-y-2">
                {checkoutWithSeparateExtraPax && hasExtraPaxCharges ? (
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-gray-600">
                      <span>Room Bill Due:</span>
                      <span className="font-semibold text-gray-800">
                        ₹{(primaryReservationTotal || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-700">
                      <span>Extra Guest Bill Due:</span>
                      <span className="font-semibold text-gray-900">
                        ₹{(extraPaxStandaloneTotal || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm border-t pt-1.5 font-medium">
                      <span>Combined Balance Due:</span>
                      <span className="font-bold text-lg text-green-600">
                        ₹{(billData.billingSummary?.balanceDue || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Amount to Pay:</span>
                    <span className="font-bold text-lg text-green-600">
                      ₹
                      {billData.billingSummary?.balanceDue?.toLocaleString() || 0}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 pt-3 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCheckoutModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={processCheckout}
                disabled={isProcessingCheckout}
                className={
                  isProcessingCheckout
                    ? "bg-green-600 text-white hover:bg-green-600"
                    : "bg-green-600 text-white hover:bg-green-700"
                }
              >
                {isProcessingCheckout ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Complete Check-Out
                  </div>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Print/Download Controls - Hidden in print */}
      <style>{`
        @media print {
          @page {
              margin: 0;
          }
          body * {
            visibility: hidden !important;
          }
          #printable-bill, #printable-bill * {
            visibility: visible !important;
          }
          #printable-bill {
            position: absolute !important;
            left: 0;
            top: 0;
            width: 100vw !important;
            min-width: 0 !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            background: white !important;
          }
          #printable-bill, #printable-bill table, #printable-bill th, #printable-bill td {
            font-size: 10px !important;
            padding: 2px 4px !important;
            margin: 0 !important;
            line-height: 1.1 !important;
          }
          #printable-bill table {
            border-spacing: 0 !important;
            border-collapse: collapse !important;
            page-break-inside: avoid !important;
          }
          #printable-bill tr {
            page-break-inside: avoid !important;
            page-break-after: auto !important;
          }
          #printable-bill th, #printable-bill td {
            padding: 2px 4px !important;
            margin: 0 !important;
            vertical-align: top !important;
          }
          #printable-bill .pb-4, #printable-bill .mb-6, #printable-bill .mb-3, #printable-bill .mb-2, #printable-bill .mt-4, #printable-bill .mt-8, #printable-bill .pt-4, #printable-bill .pt-1, #printable-bill .pt-2 {
            margin: 0 !important;
            padding: 0 !important;
          }
          #printable-bill h1, #printable-bill .text-2xl, #printable-bill .text-xl {
            font-size: 12px !important;
            margin-bottom: 2px !important;
            padding-bottom: 0 !important;
          }
          #printable-bill h3, #printable-bill .text-base, #printable-bill .font-bold {
            font-size: 11px !important;
            margin-bottom: 2px !important;
            padding-bottom: 0 !important;
          }
          #printable-bill th {
            font-size: 10px !important;
            padding: 2px 4px !important;
          }
          #printable-bill table, #printable-bill th, #printable-bill td {
            border: 1px solid #e0e0e0 !important;
          }
          #printable-bill .section-gap {
            margin-top: 18px !important;
          }
          #printable-bill .hotel-name {
            font-size: 16px !important;
            font-weight: 600 !important;
            margin-bottom: 2px !important;
          }
        }
        /* Compact headings and header for screen as well */
        #printable-bill h1, #printable-bill .text-2xl, #printable-bill .text-xl {
          font-size: 17px;
          margin-bottom: 3px;
          padding-bottom: 0;
        }
        #printable-bill h3, #printable-bill .text-base, #printable-bill .font-bold {
          font-size: 12px;
          margin-bottom: 3px;
          padding-bottom: 0;
        }
        #printable-bill th {
          font-size: 11px;
          padding: 3px 6px;
        }
        #printable-bill .pb-4, #printable-bill .mb-6, #printable-bill .mb-3, #printable-bill .mb-2, #printable-bill .mt-4, #printable-bill .mt-8, #printable-bill .pt-4, #printable-bill .pt-1, #printable-bill .pt-2 {
          margin: 0;
          padding: 0;
        }
        #printable-bill table, #printable-bill th, #printable-bill td {
          border: 1px solid #e0e0e0 !important;
        }
        #printable-bill .section-gap {
          margin-top: 18px !important;
        }
        #printable-bill .hotel-name {
          font-size: 16px !important;
          font-weight: 600 !important;
          margin-bottom: 2px !important;
        }
      `}</style>

      <div className="print:hidden bg-white shadow-sm border-b px-6 py-4">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>

          <div className="flex space-x-3">
            {/* <RefreshButton
              onRefresh={handleRefresh}
              loading={refreshing}
              size="sm"
            /> */}
            <Button
              variant="outline"
              onClick={() => setShowExcludePanel(!showExcludePanel)}
              className={`flex items-center space-x-2 ${
                showExcludePanel ? "bg-blue-100 border-blue-300" : ""
              }`}
            >
              <span>Exclude Charges</span>
              {excludedCharges.length > 0 && (
                <span className="bg-red-500 text-white rounded-full px-2 py-0.5 text-xs">
                  {excludedCharges.length}
                </span>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleDownload}
              className="flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Download PDF</span>
            </Button>

            {/* Split Bills Button - Multi-Department Billing Separation */}
            {hasSplitableCharges() && (
              <Button
                variant="outline"
                onClick={() => setShowSplitBill(true)}
                className="flex items-center space-x-2 bg-green-50 border-green-300 text-green-700 hover:bg-green-100"
              >
                <span>Split Bills</span>
              </Button>
            )}

            {/* Split Bill Button - Show only if there are restaurant orders */}
            {booking?.breakdown?.charges?.serviceCharges?.orderDetails &&
              booking.breakdown.charges.serviceCharges.orderDetails.length >
                0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Split Bills:</span>
                  <RestaurantBill
                    orderDetails={
                      booking.breakdown.charges.serviceCharges.orderDetails
                    }
                    institutionData={institutionData}
                    billData={billData}
                  />
                  <Button
                    variant="outline"
                    onClick={handlePrint}
                    className="flex items-center space-x-2"
                  >
                    <Printer className="h-4 w-4" />
                    <span>Hotel Bill</span>
                  </Button>
                </div>
              )}

            <Button
              variant={isAmountEditing ? "destructive" : "outline"}
              onClick={
                isAmountEditing ? cancelAmountEditing : startAmountEditing
              }
              className="flex items-center space-x-2"
            >
              {isAmountEditing ? (
                <>
                  <X className="h-4 w-4" />
                  <span>Cancel Edit</span>
                </>
              ) : (
                <>
                  <Edit2 className="h-4 w-4" />
                  <span>Edit</span>
                </>
              )}
            </Button>
            {isAmountEditing && (
              <Button onClick={saveAmountChanges}>Submit</Button>
            )}

            {/* Sync Data Button for testing */}
            {/* <Button
              onClick={triggerAutoUpdate}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <span>Sync Data</span>
            </Button> */}

            {/* Main Print Bill Button - Show when no restaurant orders or as fallback */}
            {(!booking?.breakdown?.charges?.serviceCharges?.orderDetails ||
              booking.breakdown.charges.serviceCharges.orderDetails.length ===
                0) && (
              <Button
                onClick={handlePrint}
                className="flex items-center space-x-2"
              >
                <Printer className="h-4 w-4" />
                <span>Print Bill</span>
              </Button>
            )}

            {/* Add a checkout button here */}
            <Button
              onClick={handleCheckoutClick}
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white"
            >
              <LogOut className="h-4 w-4" />
              <span>Checkout & Settle</span>
            </Button>
          </div>
        </div>

        {/* Exclude Panel - Updated without separate save button */}
        {showExcludePanel && (
          <div className="max-w-5xl mx-auto mt-4 p-4 bg-gray-50 border rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-800">
                Exclude Charge Types
              </h4>
              <div className="text-sm text-gray-600">
                {isAmountEditing
                  ? "Changes will be saved when you click 'Submit'"
                  : "Enable edit mode to make changes"}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {CHARGE_TYPES.map(({ key, label }) => (
                <label
                  key={key}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={isChargeExcluded(key)}
                    onChange={() => toggleChargeExclusion(key)}
                    disabled={!isAmountEditing} // Only allow changes in edit mode
                    className="form-checkbox h-4 w-4 text-blue-600 disabled:opacity-50"
                  />
                  <span
                    className={`text-sm ${
                      isChargeExcluded(key)
                        ? "line-through text-gray-500"
                        : "text-gray-700"
                    } ${!isAmountEditing ? "opacity-50" : ""}`}
                  >
                    {label}
                  </span>
                </label>
              ))}
            </div>
            {excludedCharges.length > 0 && (
              <div className="mt-3 p-2 bg-yellow-100 border border-yellow-300 rounded text-sm text-yellow-800">
                <strong>Note:</strong> {excludedCharges.length} charge type(s)
                are currently excluded from the bill calculation.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bill Content - This section will be printed */}
      <div className=" max-w-5xl mx-auto p-6 print:p-0 print:max-w-none print:m-0">
        {/* Multi-Room Billing Controls (Screen Only) */}
        {booking?.breakdown?.rooms && booking.breakdown.rooms.length > 1 && (
          <div className="print:hidden mb-4 bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Hotel className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-800 text-sm">
                    Multi-Room Booking: Select Room(s) to Bill & Settle
                  </h3>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Uncheck any room to generate and settle the bill for specific room(s) only. Unselected rooms remain checked-in.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {selectedTargetRooms.length < booking.breakdown.rooms.length && (
                  <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-xs font-semibold rounded-full border border-amber-300">
                    Partial Bill ({selectedTargetRooms.length} of {booking.breakdown.rooms.length} rooms)
                  </span>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSelectAllTargetRooms}
                  className="text-xs h-7"
                >
                  Select All Rooms
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {booking.breakdown.rooms.map((room) => {
                const isChecked = selectedTargetRooms.includes(room.room_id);
                return (
                  <label
                    key={room.room_id}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                      isChecked
                        ? "bg-blue-50/70 border-blue-400 text-blue-900 shadow-xs"
                        : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleTargetRoom(room.room_id)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <div>
                        <div className="font-semibold text-sm">
                          Room {room.room_number}
                        </div>
                        <div className="text-xs text-gray-500">
                          {room.room_type}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-medium text-gray-700">
                        ₹{(room.tariff || room.baseTariff || 0).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-gray-400">/ night</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Bill View Switcher (Screen Only) */}
        {hasExtraPaxCharges && (
          <div className="print:hidden mb-4 bg-white border border-gray-200 rounded-lg p-2.5 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Bill View:
              </span>
              <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
                <button
                  type="button"
                  onClick={() => setActiveFolioMode("master")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    activeFolioMode === "master"
                      ? "bg-gray-900 text-white shadow-xs font-semibold"
                      : "text-gray-700 hover:text-gray-900 cursor-pointer"
                  }`}
                >
                  <Hotel className="h-3.5 w-3.5" />
                  <span>Master Bill (All Charges)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFolioMode("primary")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    activeFolioMode === "primary"
                      ? "bg-gray-900 text-white shadow-xs font-semibold"
                      : "text-gray-700 hover:text-gray-900 cursor-pointer"
                  }`}
                >
                  <Building className="h-3.5 w-3.5" />
                  <span>Room Bill</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFolioMode("extrapax")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    activeFolioMode === "extrapax"
                      ? "bg-gray-900 text-white shadow-xs font-semibold"
                      : "text-gray-700 hover:text-gray-900 cursor-pointer"
                  }`}
                >
                  <Users className="h-3.5 w-3.5" />
                  <span>Extra Guest Bill</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                      activeFolioMode === "extrapax"
                        ? "bg-white/20 text-white"
                        : "bg-gray-200 text-gray-800"
                    }`}
                  >
                    Separate Bill
                  </span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs">
              {activeFolioMode === "master" && (
                <span className="text-gray-500 text-[11px]">
                  Consolidated bill with all charges (₹
                  {(billData?.billingSummary?.balanceDue || 0).toLocaleString()} due).
                </span>
              )}
              {activeFolioMode === "primary" && (
                <span className="text-gray-700 text-[11px] font-medium bg-gray-100 px-2 py-1 rounded border border-gray-200">
                  Room accommodation only (₹
                  {(primaryReservationTotal || 0).toLocaleString()} due).
                </span>
              )}
              {activeFolioMode === "extrapax" && (
                <span className="text-gray-800 text-[11px] font-medium bg-gray-100 px-2 py-1 rounded border border-gray-200">
                  Extra occupant & services only (₹
                  {(extraPaxStandaloneTotal || 0).toLocaleString()} due).
                </span>
              )}
            </div>
          </div>
        )}

        {activeFolioMode === "extrapax" ? (
          <ExtraPaxFolio
            billData={billData}
            booking={booking}
            guestData={guestData}
            userData={userData}
            institutionData={institutionData}
            bills={bills?.length + 1}
            extraPaxSettings={extraPaxSettings}
            setExtraPaxSettings={setExtraPaxSettings}
            isAmountEditing={isAmountEditing}
            editingChargeAmounts={editingChargeAmounts}
            setEditingChargeAmounts={setEditingChargeAmounts}
            editingDiscount={editingDiscount}
            setEditingDiscount={setEditingDiscount}
            editingAdvancePayment={editingAdvancePayment}
            setEditingAdvancePayment={setEditingAdvancePayment}
            bookings={bookings}
            rooms={rooms}
            selectedPaxIndex={selectedPaxIndex}
            setSelectedPaxIndex={setSelectedPaxIndex}
          />
        ) : (
          <div
            id="printable-bill"
            className="relative bg-white print:shadow-none print:border-none border shadow-lg print:bg-white"
          >
            <div className="p-8 print:p-6">
              {activeFolioMode === "primary" && (
                <div className="print:hidden mb-4 bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs text-gray-800 flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-gray-700" />
                    <span>
                      Viewing <strong>Room Bill</strong> (Extra occupant and room services separated).
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveFolioMode("master")}
                    className="underline text-gray-900 font-semibold hover:text-black cursor-pointer"
                  >
                    Switch to Master Bill
                  </button>
                </div>
              )}
              <BillHeader
                billData={currentDisplayBillData}
                institutionData={institutionData}
                bills={bills?.length + 1}
              />
              <GuestDetails
                billData={currentDisplayBillData}
                guestData={guestData}
                isAmountEditing={isAmountEditing}
                setGuestData={setGuestData}
              />
              {/* <BookingDetails billData={currentDisplayBillData} /> */}
              <ChargesBreakdown
                billData={currentDisplayBillData}
                isAmountEditing={isAmountEditing}
                editingChargeAmounts={editingChargeAmounts}
                setEditingChargeAmounts={setEditingChargeAmounts}
                isChargeExcluded={isChargeExcluded}
                getFilteredCharges={getFilteredCharges}
              />
              <BillingSummary
                billData={currentDisplayBillData}
                isAmountEditing={isAmountEditing}
                editingDiscount={editingDiscount}
                setEditingDiscount={setEditingDiscount}
                editingAdvancePayment={editingAdvancePayment}
                setEditingAdvancePayment={setEditingAdvancePayment}
                editingChargeAmounts={editingChargeAmounts}
              />

              <LegalSignature billData={currentDisplayBillData} userData={userData} />
              <BillFooter billData={currentDisplayBillData} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Bill;