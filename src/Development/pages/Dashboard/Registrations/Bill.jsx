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
    updateBill,
    bookings,
    updateGuest,
    addExpense,
    updateBooking,
    calculateTotalBill,
    companies,
    checkoutGuest,
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

  // New state for editing individual charge amounts
  const [editingChargeAmounts, setEditingChargeAmounts] = useState({});

  // New state for exclusions and extra pax
  const [excludedCharges, setExcludedCharges] = useState([]);
  const [showExcludePanel, setShowExcludePanel] = useState(false);
  const [extraPaxTotal, setExtraPaxTotal] = useState(0);

  // New state for split bill functionality
  const [showSplitBill, setShowSplitBill] = useState(false);

  // Removed autoUpdateRun state - auto-update will run every time bill is opened

  const [companyQuery, setCompanyQuery] = useState("");
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const companyFieldRef = useRef(null);

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
    };
  };

  // Handle checkout button click
  const handleCheckoutClick = () => {
    if (!booking) {
      toast.error("Booking data not available");
      return;
    }
    setIsCheckoutModalOpen(true);
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

    console.log(checkoutFormData);
  }, []);

  // Process checkout
  const processCheckout = async () => {
    if (!booking || !validateCheckoutForm()) {
      return;
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

    const checkoutData = {
      booking_id: booking.breakdown.booking.booking_id,
      guest_id: booking.breakdown.booking.guest_id,
      room_id: booking.breakdown.rooms.map((r) => r.room_id),
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
      total_amount: billDataExtracted.grandTotal || 0,
      refund_amount: 0,
      services: services,
      company_id: checkoutFormData.company_id  || null,
      gst_no: checkoutFormData.gst_no || "N/A",
      bill_summary: billSummary,
      original_bill_data: booking,
    };

    try {
      await checkoutGuest({ bookingDetails: checkoutData });

      if (checkoutFormData.payment_mode === "Cash") {
        try {
          // Get guest details for the description
          const guest = guests?.find(
            (g) => g.guest_id === booking.breakdown.booking.guest_id
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

          // Debug logging for cash received
          console.log("Cash received data being sent:", cashReceivedData);
          console.log("Checkout total_amount:", checkoutData.total_amount);
          console.log(
            "Bill summary grandTotal:",
            billData?.summary?.grandTotal
          );

          // Add to cash drawer as received amount
          await addExpense({ received: cashReceivedData });

          console.log("Cash received added to drawer:", cashReceivedData);
        } catch (error) {
          console.error("Error adding cash received to drawer:", error);
          // Don't block checkout if cash drawer update fails
        }
      }

      toast.success("Guest checked out successfully!");
      setIsCheckoutModalOpen(false);
      setCheckoutFormData({
        payment_mode: "",
        upi_platform: "",
        custom_upi_platform: "",
        received_by_staff_id: userData.cognitoId || "",
        notes: "",
      });
      navigate("/dashboard/frontdesk/check_out");
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Failed to checkout guest");
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

  // Function to check if there are food charges that can be split
  const hasFoodCharges = () => {
    if (!billData?.serviceChargesByDate) return false;

    return billData.serviceChargesByDate.some((dayData) => {
      const date = Object.keys(dayData)[0];
      const roomEntries = dayData[date];
      return roomEntries.some((entry) => entry.charges.foodCharges > 0);
    });
  };

  // Function to get detailed services data from booking
  const getDetailedServices = () => {
    const bookingData = bookings.find((b) => b.booking_id === bookingId);
    return bookingData?.detailedServices || {};
  };

  // Function to manually trigger auto-update (for testing)
  // const triggerAutoUpdate = async () => {
  //   console.log("Manual trigger of auto-update...");
  //   try {
  //     const billData = await calculateTotalBill({
  //       bookingDetails: {
  //         booking_id: bookingId,
  //         guest_id: guestId,
  //         room_id: roomId ? roomId.split(",").map((id) => id.trim()) : [],
  //         rate_plan_id: ratePlanId,
  //         checkin_date: Number(checkInDate),
  //         checkout_date: checkoutDate,
  //         gst_type: "IGST",
  //       },
  //     });
  //     console.log("Manual trigger - bill data received:", billData);
  //     console.log(
  //       "Manual trigger - serviceChargesByDate:",
  //       billData?.serviceChargesByDate
  //     );
  //     await autoUpdateBookingData(billData);
  //   } catch (error) {
  //     console.error("Error in manual trigger:", error);
  //   }
  // };

  // Function to automatically update booking data to match bill display
  // const autoUpdateBookingData = async (billData) => {
  //   try {
  //     console.log("=== AUTO UPDATING BOOKING DATA ===");
  //     console.log(
  //       "📞 autoUpdateBookingData function called with billData:",
  //       billData
  //     );

  //     // Find the current booking data
  //     const currentBookingData = bookings.find(
  //       (b) => b.booking_id === bookingId
  //     );
  //     if (!currentBookingData) {
  //       console.log("No booking data found for auto-update");
  //       return;
  //     }

  //     // Calculate the correct totals from the bill data
  //     let totalRoomCharges = 0;
  //     let totalServiceCharges = 0;
  //     let services = {};

  //     // Wait for billData to be fully processed before updating
  //     if (!billData?.serviceChargesByDate) {
  //       console.log("Bill data not ready for auto-update, skipping...");
  //       return;
  //     }

  //     // Use the API response data for extra pax charges instead of static booking data
  //     console.log("Using API response data for extra pax charges");

  //     console.log("Bill serviceChargesByDate:", billData.serviceChargesByDate);

  //     // Calculate from serviceChargesByDate - this contains all the dates from charges breakdown
  //     billData.serviceChargesByDate.forEach((dayData) => {
  //       const date = Object.keys(dayData)[0];
  //       const roomEntries = dayData[date];

  //       console.log(
  //         `Processing date ${date} with ${roomEntries.length} room entries`
  //       );

  //       roomEntries.forEach((roomEntry) => {
  //         const roomNumber = roomEntry.roomNumber;
  //         const charges = roomEntry.charges;

  //         // Initialize room services if not exists
  //         if (!services[roomNumber]) {
  //           services[roomNumber] = {};
  //         }

  //         // Add to services with proper date format (YYYY-MM-DD)
  //         const formattedDate = new Date(date).toISOString().split("T")[0];
  //         services[roomNumber][formattedDate] = {
  //           room_charges: charges.roomCharges || 0,
  //           food_charges: charges.foodCharges || 0,
  //           laundry_charges: charges.laundryCharges || 0,
  //           minibar_charges: charges.minibarCharges || 0,
  //           extra_bed_charges: charges.extraBedCharges || 0,
  //           manual_charges: charges.manualCharges || 0,
  //           extra_pax_charges: charges.extraPaxCharges || 0, // Add extra pax charges
  //         };

  //         console.log(
  //           `Added services for room ${roomNumber} on ${formattedDate}:`,
  //           services[roomNumber][formattedDate]
  //         );
  //         console.log(`Charges breakdown for room ${roomNumber}:`, {
  //           roomCharges: charges.roomCharges,
  //           foodCharges: charges.foodCharges,
  //           laundryCharges: charges.laundryCharges,
  //           minibarCharges: charges.minibarCharges,
  //           extraBedCharges: charges.extraBedCharges,
  //           manualCharges: charges.manualCharges,
  //           extraPaxCharges: charges.extraPaxCharges,
  //         });

  //         // Add to totals
  //         totalRoomCharges += charges.roomCharges || 0;
  //         totalServiceCharges +=
  //           (charges.foodCharges || 0) +
  //           (charges.laundryCharges || 0) +
  //           (charges.minibarCharges || 0) +
  //           (charges.extraBedCharges || 0) +
  //           (charges.manualCharges || 0) +
  //           (charges.extraPaxCharges || 0); // Include extra pax charges
  //       });
  //     });

  //     // Calculate discount and advance payment from bill data
  //     const discountAmount =
  //       billData?.breakdown?.charges?.discount?.discount_amount_calculated ||
  //       billData?.summary?.discountAmount ||
  //       billData?.billingSummary?.totalDiscount ||
  //       0;
  //     const advanceReceived =
  //       billData?.breakdown?.charges?.partialPaymentFromBooking ||
  //       billData?.summary?.partialPayment ||
  //       billData?.billingSummary?.partialPayment ||
  //       0;

  //     // Calculate tax on discounted room charges (2.5% CGST + 2.5% SGST = 5% total)
  //     const discountedRoomCharges = totalRoomCharges - discountAmount;
  //     const cgstAmount = Math.round((discountedRoomCharges * 2.5) / 100);
  //     const sgstAmount = Math.round((discountedRoomCharges * 2.5) / 100);
  //     const totalTaxAmount = cgstAmount + sgstAmount;

  //     // Calculate totals
  //     const subTotal = totalRoomCharges + totalServiceCharges - discountAmount;
  //     const grandTotal = subTotal + totalTaxAmount - advanceReceived;

  //     console.log("Calculated totals for auto-update:", {
  //       totalRoomCharges,
  //       totalServiceCharges,
  //       discountAmount,
  //       discountedRoomCharges,
  //       advanceReceived,
  //       cgstAmount,
  //       sgstAmount,
  //       totalTaxAmount,
  //       subTotal,
  //       grandTotal,
  //     });

  //     console.log("Services data to be updated:", services);

  //     // Log extra pax charges specifically
  //     let totalExtraPaxInServices = 0;
  //     Object.keys(services).forEach((roomNumber) => {
  //       Object.keys(services[roomNumber]).forEach((date) => {
  //         const extraPax = services[roomNumber][date].extra_pax_charges || 0;
  //         if (extraPax > 0) {
  //           console.log(
  //             `Extra pax charges for room ${roomNumber} on ${date}: ₹${extraPax}`
  //           );
  //           totalExtraPaxInServices += extraPax;
  //         }
  //       });
  //     });
  //     console.log(
  //       `Total extra pax charges in services: ₹${totalExtraPaxInServices}`
  //     );

  //     // Create updated booking data
  //     const updatedBooking = {
  //       ...currentBookingData,
  //       services: services,
  //       discount: discountAmount,
  //       partial_payment_amount: advanceReceived,
  //       // Add any other fields that need to be updated
  //     };

  //     // Create version history for the auto-update
  //     const versionHistory = {
  //       changes: {
  //         oldValues: {
  //           services: currentBookingData.services || {},
  //           discount: currentBookingData.discount || 0,
  //           partial_payment_amount:
  //             currentBookingData.partial_payment_amount || 0,
  //         },
  //         newValues: {
  //           services: services,
  //           discount: discountAmount,
  //           partial_payment_amount: advanceReceived,
  //         },
  //       },
  //       updated_at: Date.now(),
  //       changed_by: "System Auto-Update",
  //       reason:
  //         "Bill data synchronization - ensuring checkout data matches bill display",
  //     };

  //     console.log("Auto-updating booking with data:", updatedBooking);
  //     console.log("Version history:", versionHistory);

  //     // Update the booking data
  //     await updateBooking({
  //       bookingData: updatedBooking,
  //       bookingId: bookingId,
  //       versionHistory: versionHistory,
  //     });

  //     console.log("✅ Booking data auto-updated successfully");
  //   } catch (error) {
  //     console.error("❌ Error auto-updating booking data:", error);
  //     // Don't show error to user as this is a background operation
  //   }
  // };

  // Refresh function
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await Promise.all([
        fetchGuests(),
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

  useEffect(() => {
    if (booking && guests && guests.length > 0) {
      // Calculate extra pax charges if present
      let calculatedExtraPaxTotal = 0;
      const extra_pax = bookings?.find(
        (b) => booking?.breakdown?.booking?.booking_id === b.booking_id
      )?.extra_pax;
      if (extra_pax && Array.isArray(extra_pax)) {
        calculatedExtraPaxTotal = extra_pax.reduce((total, pax) => {
          return total + (pax.extra_pax_amount || 0);
        }, 0);
      }
      setExtraPaxTotal(calculatedExtraPaxTotal);

      // Create a map of room_id to extra pax charges for specific room allocation
      const extraPaxByRoomId = {};
      if (extra_pax && Array.isArray(extra_pax)) {
        extra_pax.forEach((pax) => {
          if (pax.room_id && pax.extra_pax_amount) {
            extraPaxByRoomId[pax.room_id] =
              (extraPaxByRoomId[pax.room_id] || 0) + pax.extra_pax_amount;
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
      const rawBookingData = bookings.find((b) => b.booking_id === bookingId);

      // Try to get company_id from either the processed booking or raw booking data
      const companyIdToUse = booking?.company_id || rawBookingData?.company_id;

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
            roomNumber: booking.breakdown.rooms
              .map((room) => room.room_number)
              .join(", "),
            roomType: booking.breakdown.rooms
              .map((room) => room.room_type)
              .join(", "),
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
          },
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
              booking.breakdown?.charges?.discount
                ?.discount_amount_calculated ||
              booking.summary?.discountAmount ||
              0,
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
              booking.breakdown?.charges?.partialPaymentFromBooking ||
              booking.summary?.partialPayment ||
              0,
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

      // Handle both string and number timestamps for date generation
      const checkinTimestamp =
        typeof booking.breakdown.stayDetails.checkin_date === "string"
          ? parseInt(booking.breakdown.stayDetails.checkin_date)
          : booking.breakdown.stayDetails.checkin_date;

      // Handle checkout date which might be in ISO string format
      let checkoutTimestamp;
      if (typeof booking.breakdown.stayDetails.checkout_date === "string") {
        // If it's already an ISO string, parse it directly
        if (booking.breakdown.stayDetails.checkout_date.includes("T")) {
          checkoutTimestamp = new Date(
            booking.breakdown.stayDetails.checkout_date
          ).getTime();
        } else {
          // If it's a timestamp string, parse it
          checkoutTimestamp = parseInt(
            booking.breakdown.stayDetails.checkout_date
          );
        }
      } else {
        checkoutTimestamp = booking.breakdown.stayDetails.checkout_date;
      }

      const checkinDate = new Date(checkinTimestamp);
      const checkoutDate = new Date(checkoutTimestamp);

      const serviceChargesByRoom =
        booking.breakdown.charges.serviceCharges.serviceChargesByRoomAndDate ||
        {};

      console.log("=== API SERVICE CHARGES DEBUG ===");
      console.log("serviceChargesByRoom:", serviceChargesByRoom);
      console.log("Room 301 data:", serviceChargesByRoom["301"]);
      console.log(
        "Room 301 - 2025-09-22:",
        serviceChargesByRoom["301"]?.["2025-09-22"]
      );
      console.log(
        "Room 301 - 2025-09-21:",
        serviceChargesByRoom["301"]?.["2025-09-21"]
      );
      console.log(
        "Room 301 - 2025-09-20:",
        serviceChargesByRoom["301"]?.["2025-09-20"]
      );

      // Get all dates from room usage and service charges
      const roomUsageByDate =
        booking.breakdown.stayDetails.roomUsageByDate || {};

      const datesFromRoomUsage = new Set(Object.keys(roomUsageByDate));

      // Get dates from service charges
      const datesFromServiceCharges = new Set();
      Object.keys(serviceChargesByRoom).forEach((roomNum) => {
        Object.keys(serviceChargesByRoom[roomNum]).forEach((date) => {
          datesFromServiceCharges.add(date);
        });
      });

      // Use the actual room usage dates from API response (these already respect grace period)
      const stayDates = new Set(Object.keys(roomUsageByDate));

      console.log("=== GRACE PERIOD DEBUG ===");
      console.log(
        "Room usage dates from API (already filtered by grace period):",
        Array.from(stayDates).sort()
      );
      console.log(
        "Service charges dates:",
        Array.from(datesFromServiceCharges).sort()
      );

      // If no room usage dates, fall back to service charges dates
      if (stayDates.size === 0) {
        console.log(
          "No room usage dates, using service charges dates as fallback"
        );
        stayDates.clear();
        datesFromServiceCharges.forEach((date) => stayDates.add(date));
      }

      // Helper function to check if checkout time is within grace period of current time
      const shouldExcludeTodayFromCharges = (checkoutTimestamp) => {
        // Get current time
        const now = new Date();

        // Get checkout time
        const checkoutDate = new Date(checkoutTimestamp);

        // Calculate the difference in hours (using UTC times for accurate comparison)
        const timeDifferenceMs = now.getTime() - checkoutDate.getTime();
        const timeDifferenceHours = timeDifferenceMs / (1000 * 60 * 60);

        // Grace period is 2 hours - if checkout time is within 2 hours of current time, exclude today's date
        return timeDifferenceHours <= 2;
      };

      // Helper function to check if today should be added due to late checkout (after grace period)
      const shouldAddTodayForLateCheckout = (checkoutTimestamp) => {
        // Get current time
        const now = new Date();

        // Get checkout time
        const checkoutDate = new Date(checkoutTimestamp);

        // Calculate the difference in hours (using UTC times for accurate comparison)
        const timeDifferenceMs = now.getTime() - checkoutDate.getTime();
        const timeDifferenceHours = timeDifferenceMs / (1000 * 60 * 60);

        // If current time is more than 2 hours past checkout time, add today's date
        return timeDifferenceHours > 2;
      };

      // Generate all dates from checkin to checkout (inclusive) for bill display
      const allStayDates = [];
      const checkinDateObj = new Date(checkinTimestamp);
      const checkoutDateObj = new Date(checkoutTimestamp);

      // Generate dates from checkin to checkout (inclusive)
      let currentDateObj = new Date(checkinDateObj);
      while (currentDateObj <= checkoutDateObj) {
        const dateStr = currentDateObj.toISOString().split("T")[0];
        allStayDates.push(dateStr);
        currentDateObj.setDate(currentDateObj.getDate() + 1);
      }

      // Use all stay dates for bill display (grace period logic will be handled in room charges calculation)
      let allDates = allStayDates.sort();

      console.log("=== FINAL DATE SELECTION ===");
      console.log("All stay dates (checkin to checkout):", allStayDates);
      console.log("Room usage dates from API:", Object.keys(roomUsageByDate));
      console.log("Final dates to display in bill:", allDates);
      console.log(
        "Showing all stay dates - grace period handled in room charges"
      );

      // For dates not in roomUsageByDate, we still want to show them but with 0 room charges
      // This ensures the bill shows the complete stay period

      // Use the number of nights from API response (already calculated with grace period)
      let numberOfNights = booking.breakdown.stayDetails.numberOfNights;

      console.log("Number of nights from API:", numberOfNights);
      console.log("This already accounts for grace period logic");

      // Handle the new API structure with room usage by date
      const dailyCharges = allDates.map((date) => {
        // Get rooms used on this specific date
        const roomsForDate = roomUsageByDate[date] || [];

        let roomEntries = [];

        // Get all rooms from the booking to ensure we show all rooms for all dates
        const allRooms = booking.breakdown.rooms || [];

        if (roomsForDate.length > 0) {
          // If we have specific room usage data for this date, use it
          roomEntries = roomsForDate.map((roomUsage) => {
            const roomNumber = roomUsage.room_number;
            const roomServices = serviceChargesByRoom[roomNumber] || {};

            // Convert date format to match the API response format (YYYY-MM-DD)cal
            const formattedDate = new Date(date).toISOString().split("T")[0];

            // Also try the original date format in case there's a mismatch
            const dateServices = roomServices[formattedDate] ||
              roomServices[date] || {
                food_charges: 0,
                laundry_charges: 0,
                minibar_charges: 0,
                extra_bed_charges: 0,
                manual_charges: 0,
                extra_pax_charges: 0, // Add extra_pax_charges to default object
                daily_total: 0,
              };

            // Calculate daily room charges - prioritize from services object if available
            let dailyRoomCharges = roomUsage.tariff || 0;

            // Check if room charges exist in services object for this room and date
            const servicesRoomCharges =
              booking?.breakdown?.bookingDetails?.services?.[roomNumber]?.[
                formattedDate
              ]?.room_charges;
            if (servicesRoomCharges !== undefined) {
              dailyRoomCharges = servicesRoomCharges;
            }

            // Show room charges for all dates in the bill display
            // Grace period logic is handled by the API in the final totals
            console.log(
              `Bill display: Showing room charges for ${date} (${roomNumber}): ₹${dailyRoomCharges}`
            );
            console.log(`Room data: tariff=${roomUsage.tariff}`);

            const dailyServiceCharges = dateServices.daily_total;

            // Get extra pax charges from API response data instead of static booking data
            let roomSpecificExtraPax = dateServices.extra_pax_charges || 0;

            // If no extra pax charges for this date, use the extra pax from the first available date
            if (roomSpecificExtraPax === 0) {
              // Find extra pax charges from any date for this room
              const roomServices = serviceChargesByRoom[roomNumber] || {};
              const availableDates = Object.keys(roomServices);
              for (const availableDate of availableDates) {
                const availableExtraPax =
                  roomServices[availableDate]?.extra_pax_charges || 0;
                if (availableExtraPax > 0) {
                  roomSpecificExtraPax = availableExtraPax;
                  console.log(
                    `Using extra pax charges from ${availableDate} (${availableExtraPax}) for ${date}`
                  );
                  break;
                }
              }
            }

            // If still no extra pax charges, apply extra pax from booking data
            if (roomSpecificExtraPax === 0) {
              // Get extra pax from booking data as fallback
              const bookingExtraPax = bookings?.find(
                (b) => booking?.breakdown?.booking?.booking_id === b.booking_id
              )?.extra_pax;

              if (bookingExtraPax && Array.isArray(bookingExtraPax)) {
                const roomExtraPax = bookingExtraPax.find(
                  (pax) =>
                    pax.room_id === roomUsage.room_id ||
                    pax.room_number === roomNumber
                );
                if (roomExtraPax?.extra_pax_amount) {
                  roomSpecificExtraPax = roomExtraPax.extra_pax_amount;
                  console.log(
                    `Using extra pax charges from booking data (${roomSpecificExtraPax}) for ${date}`
                  );
                }
              }
            }

            console.log(`=== DATE ${date} DEBUG ===`);
            console.log("dateServices:", dateServices);
            console.log("roomSpecificExtraPax:", roomSpecificExtraPax);

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
                  billData?.bookingDetails?.ratePlanBaseTariff || 0,
                extraPaxCharges: roomSpecificExtraPax,
                dailyTotal:
                  dailyRoomCharges +
                  dailyServiceCharges +
                  (billData?.bookingDetails?.ratePlanBaseTariff || 0) +
                  roomSpecificExtraPax,
              },
            };
          });
        } else {
          // If no room usage data for this date, create entries for all rooms
          // This ensures we show all dates in the bill, even if grace period excludes them
          roomEntries = allRooms.map((room) => {
            const roomNumber = room.room_number;
            const roomServices = serviceChargesByRoom[roomNumber] || {};

            // Convert date format to match the API response format (YYYY-MM-DD)
            const formattedDate = new Date(date).toISOString().split("T")[0];

            // Get service charges for this date
            const dateServices = roomServices[formattedDate] ||
              roomServices[date] || {
                food_charges: 0,
                laundry_charges: 0,
                minibar_charges: 0,
                extra_bed_charges: 0,
                manual_charges: 0,
                extra_pax_charges: 0, // Add extra_pax_charges to default object
                daily_total: 0,
              };

            // For dates without room usage, use the room's base tariff
            // Show full room charges for all dates in bill display
            let dailyRoomCharges =
              room.finalRoomTariff ||
              room.baseTariff ||
              room.averageTariffPerNight ||
              0;

            // Check if room charges exist in services object for this room and date
            const servicesRoomCharges =
              booking?.breakdown?.bookingDetails?.services?.[roomNumber]?.[
                formattedDate
              ]?.room_charges;
            if (servicesRoomCharges !== undefined) {
              dailyRoomCharges = servicesRoomCharges;
            }

            // Show room charges for all dates in the bill display
            // Grace period logic is handled by the API in the final totals
            console.log(
              `Bill display: Showing room charges for ${date} (${roomNumber}): ₹${dailyRoomCharges}`
            );
            console.log(
              `Room data: finalRoomTariff=${room.finalRoomTariff}, baseTariff=${room.baseTariff}, averageTariffPerNight=${room.averageTariffPerNight}`
            );

            const dailyServiceCharges = dateServices.daily_total;

            // Get extra pax charges from API response data instead of static booking data
            let roomSpecificExtraPax = dateServices.extra_pax_charges || 0;

            // If no extra pax charges for this date, use the extra pax from the first available date
            if (roomSpecificExtraPax === 0) {
              // Find extra pax charges from any date for this room
              const roomServices = serviceChargesByRoom[roomNumber] || {};
              const availableDates = Object.keys(roomServices);
              for (const availableDate of availableDates) {
                const availableExtraPax =
                  roomServices[availableDate]?.extra_pax_charges || 0;
                if (availableExtraPax > 0) {
                  roomSpecificExtraPax = availableExtraPax;
                  console.log(
                    `Using extra pax charges from ${availableDate} (${availableExtraPax}) for ${date}`
                  );
                  break;
                }
              }
            }

            // If still no extra pax charges, apply extra pax from booking data
            if (roomSpecificExtraPax === 0) {
              // Get extra pax from booking data as fallback
              const bookingExtraPax = bookings?.find(
                (b) => booking?.breakdown?.booking?.booking_id === b.booking_id
              )?.extra_pax;

              if (bookingExtraPax && Array.isArray(bookingExtraPax)) {
                const roomExtraPax = bookingExtraPax.find(
                  (pax) =>
                    pax.room_id === roomUsage.room_id ||
                    pax.room_number === roomNumber
                );
                if (roomExtraPax?.extra_pax_amount) {
                  roomSpecificExtraPax = roomExtraPax.extra_pax_amount;
                  console.log(
                    `Using extra pax charges from booking data (${roomSpecificExtraPax}) for ${date}`
                  );
                }
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
                  billData?.bookingDetails?.ratePlanBaseTariff || 0,
                extraPaxCharges: roomSpecificExtraPax,
                dailyTotal:
                  dailyRoomCharges +
                  dailyServiceCharges +
                  (billData?.bookingDetails?.ratePlanBaseTariff || 0) +
                  roomSpecificExtraPax,
              },
            };
          });
        }

        // Always check for additional rooms that have service charges on this date
        // but are not in the room usage data (like Room 401)
        const additionalServiceCharges = [];

        // Only process dates up to current date
        const currentDate = new Date().toISOString().split("T")[0];
        if (date <= currentDate) {
          Object.keys(serviceChargesByRoom).forEach((roomNumber) => {
            // Skip rooms that are already processed in roomEntries
            const alreadyProcessed = roomEntries.some(
              (entry) => entry.roomNumber === roomNumber
            );

            if (!alreadyProcessed) {
              const roomServices = serviceChargesByRoom[roomNumber];
              const formattedDate = new Date(date).toISOString().split("T")[0];

              if (roomServices[formattedDate] || roomServices[date]) {
                // Find the room details from booking rooms or create a default entry
                const roomDetails = booking.breakdown.rooms.find(
                  (r) => r.room_number === roomNumber
                ) || {
                  room_number: roomNumber,
                  room_type: "Standard", // Default room type
                  finalRoomTariff: 0,
                  baseTariff: 0,
                };

                const dateServices = roomServices[formattedDate] ||
                  roomServices[date] || {
                    food_charges: 0,
                    laundry_charges: 0,
                    minibar_charges: 0,
                    extra_bed_charges: 0,
                    manual_charges: 0,
                    extra_pax_charges: 0, // Add extra_pax_charges to default object
                    daily_total: 0,
                  };

                // Show full room charges for all dates in bill display
                // Use the room's tariff for this date
                let dailyRoomCharges =
                  roomDetails.finalRoomTariff || roomDetails.baseTariff || 0;

                // Check if room charges exist in services object for this room and date
                const servicesRoomCharges =
                  booking?.breakdown?.bookingDetails?.services?.[roomNumber]?.[
                    formattedDate
                  ]?.room_charges;
                if (servicesRoomCharges !== undefined) {
                  dailyRoomCharges = servicesRoomCharges;
                }

                const dailyServiceCharges = dateServices.daily_total;

                // Get extra pax charges from API response data instead of static booking data
                const roomSpecificExtraPax =
                  dateServices.extra_pax_charges || 0;

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
                      (billData?.bookingDetails?.ratePlanBaseTariff || 0) +
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

        // Calculate the correct totals based on our calculations
        const discountAmount = prev.billingSummary?.totalDiscount || 0;
        const advanceReceived = prev.billingSummary?.partialPayment || 0;

        // Calculate subtotal: room charges + service charges - discount
        const calculatedSubTotal =
          totalRoomCharges + totalServiceCharges - discountAmount;

        // Calculate tax on the discounted amount (room charges after discount)
        const discountedRoomCharges = totalRoomCharges - discountAmount;
        const cgstAmountOnDiscounted = Math.round(
          (discountedRoomCharges * 2.5) / 100
        );
        const sgstAmountOnDiscounted = Math.round(
          (discountedRoomCharges * 2.5) / 100
        );
        const totalTaxAmountOnDiscounted =
          cgstAmountOnDiscounted + sgstAmountOnDiscounted;

        // Calculate grand total: subtotal + tax on discounted amount - advance payment
        const calculatedGrandTotal =
          calculatedSubTotal + totalTaxAmountOnDiscounted - advanceReceived;

        // Calculate balance due: grand total (same as grand total since no advance payment)
        const calculatedBalanceDue = calculatedGrandTotal;

        return {
          ...prev,
          serviceChargesByDate: dailyCharges,
          billingSummary: {
            ...prev.billingSummary,
            totalRoomServices: totalRoomCharges,
            totalServiceCharges: totalServiceCharges,
            extraPaxCharges: calculatedExtraPaxTotal,
            // Use calculated values for consistency
            subTotal: calculatedSubTotal,
            cgstAmount: cgstAmountOnDiscounted, // Use CGST amount calculated on discounted room charges
            sgstAmount: sgstAmountOnDiscounted, // Use SGST amount calculated on discounted room charges
            totalTaxAmount: totalTaxAmountOnDiscounted, // Use total tax amount calculated on discounted room charges
            balanceDue: calculatedBalanceDue,
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
        formatNumber(billData?.billingSummary?.totalDiscount || 0)
      );
      setEditingAdvancePayment(
        formatNumber(billData?.billingSummary?.partialPayment || 0)
      );
      setEditingRoomCharges(
        formatNumber(billData?.billingSummary?.totalRoomServices || 0)
      );

      // Auto-update booking data automatically without any checks
      // console.log("🚀 Auto-updating booking data automatically...");
      // setTimeout(async () => {
      //   // Use the current billData state for auto-update
      //   const currentBillData = {
      //     serviceChargesByDate: billData?.serviceChargesByDate || [],
      //     breakdown: booking?.breakdown,
      //     summary: booking?.summary,
      //     billingSummary: billData?.billingSummary,
      //   };
      //   console.log("📞 Calling autoUpdateBookingData with:", currentBillData);
      //   await autoUpdateBookingData(currentBillData);
      //}, 1000);
    }
  }, [booking, guests, companies, forceRefresh]);

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

      // Calculate subtotal: room charges + service charges - discount
      const calculatedSubTotal =
        totalRoomCharges + totalServiceCharges - discountAmount;

      // Calculate tax on the discounted amount (room charges after discount)
      const discountedRoomCharges = totalRoomCharges - discountAmount;
      const cgstAmountOnDiscounted = Math.round(
        (discountedRoomCharges * 2.5) / 100
      );
      const sgstAmountOnDiscounted = Math.round(
        (discountedRoomCharges * 2.5) / 100
      );
      const totalTaxAmountOnDiscounted =
        cgstAmountOnDiscounted + sgstAmountOnDiscounted;

      // Calculate grand total: subtotal + tax on discounted amount - advance payment
      const calculatedGrandTotal =
        calculatedSubTotal + totalTaxAmountOnDiscounted - advanceReceived;

      // Calculate balance due: grand total (same as grand total since no advance payment)
      const calculatedBalanceDue = calculatedGrandTotal;

      setBillData((prev) => ({
        ...prev,
        billingSummary: {
          ...prev.billingSummary,
          totalRoomServices: totalRoomCharges,
          totalServiceCharges: totalServiceCharges,
          // Use calculated values for consistency
          subTotal: calculatedSubTotal,
          cgstAmount: cgstAmountOnDiscounted, // Use CGST amount calculated on discounted room charges
          sgstAmount: sgstAmountOnDiscounted, // Use SGST amount calculated on discounted room charges
          totalTaxAmount: totalTaxAmountOnDiscounted, // Use total tax amount calculated on discounted room charges
          balanceDue: calculatedBalanceDue,
        },
        finalSummary: {
          ...prev.finalSummary,
          // Use calculated values for consistency
          amountInWords: numberToWords(calculatedGrandTotal),
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
      formatNumber(billData?.billingSummary?.totalDiscount || 0)
    );
    setEditingAdvancePayment(
      formatNumber(billData?.billingSummary?.partialPayment || 0)
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
      }
    );

    const updatedServices = {};

    // Get the actual room numbers from the booking to limit service entries
    const actualRoomNumbers = booking.breakdown.rooms.map(
      (room) => room.room_number
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
    recalculateBillingSummary(updatedServiceChargesByDate);

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
      formatNumber(billData?.billingSummary?.totalDiscount || 0)
    );
    setEditingAdvancePayment(
      formatNumber(billData?.billingSummary?.partialPayment || 0)
    );
    // Clear version history on cancel
    setVersionHistory(null);
  };

  // Function to recalculate billing summary after amount changes
  const recalculateBillingSummary = (serviceChargesByDate) => {
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

    // Calculate subtotal: room charges + service charges - discount
    const calculatedSubTotal =
      totalRoomCharges + totalServiceCharges - discountAmount;

    // Calculate tax on the discounted amount (room charges after discount)
    const discountedRoomCharges = totalRoomCharges - discountAmount;
    const cgstAmountOnDiscounted = Math.round(
      (discountedRoomCharges * 2.5) / 100
    );
    const sgstAmountOnDiscounted = Math.round(
      (discountedRoomCharges * 2.5) / 100
    );
    const totalTaxAmountOnDiscounted =
      cgstAmountOnDiscounted + sgstAmountOnDiscounted;

    // Calculate grand total: subtotal + tax on discounted amount - advance payment
    const calculatedGrandTotal =
      calculatedSubTotal + totalTaxAmountOnDiscounted - advanceReceived;

    // Calculate balance due: grand total (same as grand total since no advance payment)
    const calculatedBalanceDue = calculatedGrandTotal;

    setBillData((prev) => ({
      ...prev,
      billingSummary: {
        ...prev.billingSummary,
        totalRoomServices: totalRoomCharges,
        totalServiceCharges: totalServiceCharges,
        // Use calculated values for consistency
        subTotal: calculatedSubTotal,
        cgstAmount: cgstAmountOnDiscounted, // Use CGST amount calculated on discounted room charges
        sgstAmount: sgstAmountOnDiscounted, // Use SGST amount calculated on discounted room charges
        totalTaxAmount: totalTaxAmountOnDiscounted, // Use total tax amount calculated on discounted room charges
        balanceDue: calculatedBalanceDue,
      },
      finalSummary: {
        ...prev.finalSummary,
        // Use calculated values for consistency
        amountInWords: numberToWords(calculatedGrandTotal),
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

    // Calculate subtotal: room charges + service charges - discount
    const calculatedSubTotal =
      totalRoomCharges + totalServiceCharges - discountAmount;

    // Calculate tax on the discounted amount (room charges after discount)
    const discountedRoomCharges = totalRoomCharges - discountAmount;
    const cgstAmountOnDiscounted = Math.round(
      (discountedRoomCharges * 2.5) / 100
    );
    const sgstAmountOnDiscounted = Math.round(
      (discountedRoomCharges * 2.5) / 100
    );
    const totalTaxAmountOnDiscounted =
      cgstAmountOnDiscounted + sgstAmountOnDiscounted;

    // Calculate grand total: subtotal + tax on discounted amount - advance payment
    const calculatedGrandTotal =
      calculatedSubTotal + totalTaxAmountOnDiscounted - advanceReceived;

    // Calculate balance due: grand total (same as grand total since no advance payment)
    const calculatedBalanceDue = calculatedGrandTotal;

    setBillData((prev) => ({
      ...prev,
      billingSummary: {
        ...prev.billingSummary,
        totalRoomServices: totalRoomCharges,
        totalServiceCharges: totalServiceCharges,
        // Use calculated values for consistency
        subTotal: calculatedSubTotal,
        cgstAmount: cgstAmountOnDiscounted, // Use CGST amount calculated on discounted room charges
        sgstAmount: sgstAmountOnDiscounted, // Use SGST amount calculated on discounted room charges
        totalTaxAmount: totalTaxAmountOnDiscounted, // Use total tax amount calculated on discounted room charges
        balanceDue: calculatedBalanceDue,
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
                        onFocus={() => setShowCompanyDropdown(true)}
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
                            {companies.length > 0 ? (
                              companies.map((c) => {
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
                                {companyQuery.trim() && createCompany && (
                                  <li
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      openCreateCompanyDialog();
                                    }}
                                    className="cursor-pointer px-3 py-2 hover:bg-blue-50 border-t border-gray-100"
                                  >
                                    <div className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700">
                                      <Plus className="h-4 w-4" />
                                      <span>Create "{companyQuery}"</span>
                                    </div>
                                  </li>
                                )}
                              </>
                            )}
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

            {/* Bill Summary */}
            {billData && (
              <div className="border-t pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Total Amount:</span>
                  <span className="font-bold text-lg text-green-600">
                    ₹{billData.finalSummary?.totalAmount?.toLocaleString() || 0}
                  </span>
                </div>
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
              <Button size="sm" onClick={processCheckout}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Complete Check-Out
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

            {/* Split Bill Button - Show only if there are food charges */}
            {hasFoodCharges() && (
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
            <Button
              onClick={triggerAutoUpdate}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <span>Sync Data</span>
            </Button>

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
              className="flex items-center space-x-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Checkout</span>
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
        <div
          id="printable-bill"
          className="relative bg-white print:shadow-none print:border-none border shadow-lg print:bg-white"
        >
          <div className="p-8 print:p-6">
            <BillHeader billData={billData} />
            <GuestDetails
              billData={billData}
              guestData={guestData}
              isAmountEditing={isAmountEditing}
              setGuestData={setGuestData}
            />
            <BookingDetails billData={billData} />
            <ChargesBreakdown
              billData={billData}
              isAmountEditing={isAmountEditing}
              editingChargeAmounts={editingChargeAmounts}
              setEditingChargeAmounts={setEditingChargeAmounts}
              isChargeExcluded={isChargeExcluded}
              getFilteredCharges={getFilteredCharges}
            />
            <BillingSummary
              billData={billData}
              isAmountEditing={isAmountEditing}
              editingDiscount={editingDiscount}
              setEditingDiscount={setEditingDiscount}
              editingAdvancePayment={editingAdvancePayment}
              setEditingAdvancePayment={setEditingAdvancePayment}
              editingChargeAmounts={editingChargeAmounts}
            />

            <LegalSignature billData={billData} userData={userData} />
            <BillFooter billData={billData} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Bill;