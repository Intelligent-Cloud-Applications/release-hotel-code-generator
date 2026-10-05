import { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "../../../../components/ui/button.js";
import { useAppContext } from "../../../../context/AppContext.jsx";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { Hotel } from "lucide-react";
import RefreshButton from "../../../../components/ui/RefreshButton.jsx";
import BookingSelector from "./components/BookingSelector.jsx";
import CheckInForm from "./components/CheckInForm.jsx";
import PriceSummary from "./components/PriceSummary.jsx";
import ValidationSummary from "./components/ValidationSummary.jsx";
import SelectedBookingInfo from "./components/SelectedBookingInfo.jsx";
import ActionButtons from "./components/ActionButtons.jsx";
import EmptyState from "./components/EmptyState.jsx";
import LoadingState from "./components/LoadingState.jsx";

const CheckIn = () => {
  const {
    loading,
    rooms,
    bookings,
    ratePlans,
    checkInGuest,
    guests,
    bills,
    staffs,
    fetchGuests,
    fetchBookings,
    fetchRooms,
    fetchStaffs,
    addExpense,
    companies,
    createCompany,
    fetchCompanies,
    listTotalBill,
  } = useAppContext();
  
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [pageLoading, setPageLoading] = useState(true);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [finalPrice, setFinalPrice] = useState(0);
  const [baseTariff, setBaseTariff] = useState(0);
  const [roomTariff, setRoomTariff] = useState(0);
  const [extraPaxAmount, setExtraPaxAmount] = useState(0);
  const [numberOfNights, setNumberOfNights] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isProcessingRef = useRef(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [roomAutoSelected, setRoomAutoSelected] = useState(false);

  const formatToLocalDateTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60 * 1000);
    return localDate.toISOString().slice(0, 16);
  };

  const parseLocalDateTime = (dateTimeString) => {
    if (!dateTimeString) return null;
    return new Date(dateTimeString).getTime();
  };

  const [checkInData, setCheckInData] = useState({
    // Guest Details
    full_name: "",
    mobile: "",
    email: "",
    gender: "",
    id_proof_type: "",
    id_proof_number: "",
    id_proof_image_url: "",
    nationality: "Indian",
    guest_category: "Regular",
    marital_status: "Unmarried",
    address: "",
    city: "",
    state: "",
    country: "India",
    pincode: "",
    
    // Booking Details
    booking_id: "",
    guest_id: "",
    booking_type: "Walk-in",
    booking_date: Date.now(),
    checkin_date: Date.now(),
    checkout_date: new Date(Date.now() + 24 * 60 * 60 * 1000).getTime(), // Tomorrow
    room_type: "",
    room_id: [],
    no_of_adults: 1,
    no_of_children: 0,
    company_id: "",
    company_name: "",
    gst_no: "",
    discount: 0,
    partial_payment_amount: null,
    advance_payment_mode: "",
    advance_payment_upi_mode: "",
    booking_source: "Direct",
    remarks: "",
    special_requests: "",
    status: "Reserved",
    assigned_staff_id: "",
    rate_plan_id: "",
    grc_no: "",
  });

  const checkedInBookingsCount = useMemo(() => {
    if (!Array.isArray(bookings)) return 0;
    return bookings.filter((booking) => booking.status === "Checked-in").length;
  }, [bookings]);

  const totalBillsCount = useMemo(
    () => (Array.isArray(bills) ? bills.length : 0),
    [bills]
  );

  const nextGrcNumber = useMemo(
    () => totalBillsCount + checkedInBookingsCount + 1,
    [totalBillsCount, checkedInBookingsCount]
  );

  const nextCheckInNumber = useMemo(
    () => checkedInBookingsCount + 1,
    [checkedInBookingsCount]
  );

  const nextBillNumber = useMemo(
    () => totalBillsCount + 1,
    [totalBillsCount]
  );

  useEffect(() => {
    console.log("Next identifiers:", {
      grcNumber: nextGrcNumber,
      checkInNumber: nextCheckInNumber,
      billNumber: nextBillNumber,
    });
  }, [nextGrcNumber, nextCheckInNumber, nextBillNumber]);
  // Initialize data on component mount
  useEffect(() => {
    const fetchData = async () => {
      // Only fetch if data is not already loaded
      if (rooms.length === 0 || staffs.length === 0) {
        console.log("Fetching initial data (rooms, staffs, bills)...");
        setPageLoading(true);
        try {
          await fetchRooms();
          await fetchStaffs();
          // Fetch bills for guest auto-suggestion
          if (!bills || bills.length === 0) {
            await listTotalBill();
          }
        } catch (error) {
          console.error("Error fetching initial data:", error);
          toast.error("Failed to load initial data");
        } finally {
          setPageLoading(false);
        }
      } else {
        console.log("Data already loaded, skipping fetch");
        // Still fetch bills if not loaded
        if (!bills || bills.length === 0) {
          listTotalBill().catch(err => console.error("Error fetching bills:", err));
        }
        setPageLoading(false);
      }
    };
    fetchData();

    return () => {
      isProcessingRef.current = false;
      setIsSubmitting(false);
    };
  }, []); // Empty dependency array - only run once on mount

  // Set default rate plan when rate plans are loaded
  useEffect(() => {
    if (ratePlans && ratePlans.length > 0 && !checkInData.rate_plan_id) {
      // Set the first rate plan as default (European Plan)
      const firstPlan = ratePlans[0];
      if (firstPlan) {
        setCheckInData(prev => ({
          ...prev,
          rate_plan_id: firstPlan.plan_id
        }));
      }
    }
  }, [ratePlans, checkInData.rate_plan_id]);

  // Auto-select room from URL parameter (when navigating from RoomList)
  // Note: This effect must be after getVacantRooms is defined, or we inline the filter logic
  useEffect(() => {
    const roomIdFromUrl = searchParams.get('room_id');
    
    // Only auto-select if:
    // 1. room_id is in URL
    // 2. rooms are loaded and page is not loading
    // 3. room hasn't been auto-selected yet
    // 4. no room is currently selected
    if (
      roomIdFromUrl && 
      rooms.length > 0 && 
      !pageLoading &&
      !roomAutoSelected && 
      (!checkInData.room_id || checkInData.room_id.length === 0)
    ) {
      // Filter vacant/clean rooms inline (to avoid dependency on getVacantRooms)
      const vacantRooms = rooms.filter(
        (room) => room.status === "Clean" || room.status === "Vacant"
      );
      
      // Find the room in the vacant rooms list
      const roomToSelect = vacantRooms.find(room => {
        const roomIdStr = String(room.room_id);
        const urlRoomIdStr = String(roomIdFromUrl);
        return roomIdStr === urlRoomIdStr;
      });

      if (roomToSelect) {
        // Room is already validated as Vacant or Clean by the filter above
        // Auto-select the room by updating state directly (avoid dependency on handleInputChange)
        setCheckInData(prev => ({
          ...prev,
          room_id: [roomToSelect.room_id]
        }));
        
        // Mark as auto-selected to prevent re-selection
        setRoomAutoSelected(true);
        
        // Clear the URL parameter after a short delay to allow state updates
        setTimeout(() => {
          const newSearchParams = new URLSearchParams(searchParams);
          newSearchParams.delete('room_id');
          setSearchParams(newSearchParams, { replace: true });
        }, 100);
        
        // Show success message
        toast.success(`Room ${roomToSelect.room_number} has been auto-selected for check-in`);
      } else {
        // Room not found in vacant rooms, clear URL parameter
        toast.error("Room not found or not available for check-in");
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.delete('room_id');
        setSearchParams(newSearchParams, { replace: true });
      }
    }
  }, [searchParams, rooms, roomAutoSelected, checkInData.room_id, pageLoading, setSearchParams]);

  // Refresh function
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await Promise.all([
        fetchRooms(),
        fetchBookings(),
        fetchGuests(),
        fetchStaffs()
      ]);
      toast.success("Data refreshed successfully");
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast.error("Failed to refresh data");
    } finally {
      setRefreshing(false);
    }
  };

  // Get guest details when booking is selected
  useEffect(() => {
    if (selectedBooking) {
      const guest = guests.find((g) => g.guest_id === selectedBooking.guest_id);
      setSelectedGuest(guest);

      const now = new Date();
      const currentDateTime = now.getTime();

      const rawPhone = String(guest?.mobile || "").trim();
      const phoneDigits = rawPhone.replace(/\D/g, "");
      const cleanPhone =
        phoneDigits.length === 12 && phoneDigits.startsWith("91")
          ? phoneDigits.slice(2)
          : phoneDigits.length === 11 && phoneDigits.startsWith("0")
          ? phoneDigits.slice(1)
          : phoneDigits.length > 10
          ? phoneDigits.slice(-10)
          : (phoneDigits.length === 10 ? phoneDigits : rawPhone);

      const rawEmail = String(guest?.email || "").trim();
      const isPlaceholderEmail = ["n/a", "na", "-", "--", "none", "nil"].includes(rawEmail.toLowerCase());
      const cleanEmail = isPlaceholderEmail ? "" : rawEmail;

      const rawPin = String(guest?.pincode || "").trim();
      const isPlaceholderPin = ["n/a", "na", "-", "--", "none", "nil"].includes(rawPin.toLowerCase());
      const cleanPinDigits = rawPin.replace(/\D/g, "");
      const cleanPin = isPlaceholderPin ? "" : (cleanPinDigits.length === 6 ? cleanPinDigits : rawPin);

      let checkoutDate = selectedBooking.checkout_date;
      if (!checkoutDate || new Date(checkoutDate) <= new Date(currentDateTime)) {
        checkoutDate = new Date(currentDateTime + 24 * 60 * 60 * 1000).getTime();
      }

      setCheckInData({
        // Guest Details
        full_name: guest?.full_name || "",
        mobile: cleanPhone || "",
        email: cleanEmail || "",
        gender: guest?.gender || "Male",
        id_proof_type: guest?.id_proof_type || "",
        id_proof_number: guest?.id_proof_number || "",
        id_proof_image_url: guest?.id_proof_image_url || "",
        nationality: guest?.nationality || "Indian",
        guest_category: guest?.guest_category || "Regular",
        marital_status: guest?.marital_status || "Unmarried",
        address: guest?.address || "",
        city: guest?.city || "",
        state: guest?.state || "",
        country: guest?.country || "India",
        pincode: cleanPin || "",
        
        // Booking Details
        booking_id: selectedBooking.booking_id,
        guest_id: selectedBooking.guest_id,
        booking_type: selectedBooking.booking_type || "Walk-in",
        booking_date: selectedBooking.booking_date,
        checkin_date: currentDateTime,
        checkout_date: checkoutDate,
        room_type: selectedBooking.room_category || selectedBooking.room_type || "",
        room_id: selectedBooking.room_id || [],
        no_of_adults: selectedBooking.no_of_persons || selectedBooking.no_of_adults || 1,
        no_of_children: selectedBooking.no_of_children || 0,
        company_id: selectedBooking.company_id || "",
        company_name: selectedBooking.company_name || "",
        gst_no: selectedBooking.gst_no || "",
        discount: selectedBooking.discount || 0,
        partial_payment_amount: selectedBooking.partial_payment_amount || 0,
        advance_payment_mode: selectedBooking.advance_payment_mode || "",
        advance_payment_upi_mode: selectedBooking.advance_payment_upi_mode || "",
        booking_source: selectedBooking.booking_source || "Direct",
        remarks: selectedBooking.remarks || "",
        special_requests: selectedBooking.special_requests || "",
        status: selectedBooking.status || "Checked-in",
        assigned_staff_id: selectedBooking.assigned_staff_id || "",
        rate_plan_id: selectedBooking.rate_plan_id || (ratePlans?.[0]?.plan_id || ""),
        grc_no: "",
      });
    }
  }, [selectedBooking, guests, ratePlans]);

  // Get vacant rooms for assignment - memoized to prevent unnecessary recalculations
  const getVacantRooms = useMemo(() => {
    return rooms.filter(
      (room) => room.status === "Clean" || room.status === "Vacant"
    );
  }, [rooms]);

  const reservedBookings = useMemo(() => 
    bookings.filter((booking) => booking.status === "Reserved"),
    [bookings]
  );

  // Filter bookings based on search - memoized to prevent unnecessary recalculations
  const filteredBookings = useMemo(() => {
    return reservedBookings.filter((booking) => {
      const guest = guests.find((g) => g.guest_id === booking.guest_id);
      const searchLower = searchTerm.toLowerCase();
      return (
        booking.booking_id.toLowerCase().includes(searchLower) ||
        guest?.full_name.toLowerCase().includes(searchLower) ||
        guest?.mobile.includes(searchTerm) ||
        booking.room_type.toLowerCase().includes(searchLower)
      );
    });
  }, [reservedBookings, guests, searchTerm]);

  const handleBookingSelect = (booking) => {
    setSelectedBooking(booking);
    setIsModalOpen(false);
    setValidationErrors({});
    setHasAttemptedSubmit(false);
  };

  const handleBookingUpdated = (updatedBooking, updatedGuest) => {
    setSelectedBooking(updatedBooking);
    if (updatedGuest) {
      setSelectedGuest(updatedGuest);
    }
    setCheckInData((prev) => ({
      ...prev,
      full_name: updatedGuest?.full_name || updatedBooking?.full_name || prev.full_name,
      mobile: updatedGuest?.mobile || updatedBooking?.mobile || prev.mobile,
      email: updatedGuest?.email || updatedBooking?.email || prev.email,
      room_type: updatedBooking?.room_category || updatedBooking?.room_type || prev.room_type,
      no_of_adults: updatedBooking?.no_of_persons || updatedBooking?.no_of_adults || prev.no_of_adults,
      checkin_date: updatedBooking?.checkin_date || prev.checkin_date,
      checkout_date: updatedBooking?.checkout_date || prev.checkout_date,
    }));
  };

  const handleDialogOpen = async (open) => {
    setIsModalOpen(open);
    
    // Only fetch data when opening the dialog, not when closing
    if (open) {
      setDialogLoading(true);
      try {
        // Only fetch if data is not already loaded
        if (guests.length === 0) {
          console.log("Fetching guests data...");
          await fetchGuests();
        }
        if (bookings.length === 0) {
          console.log("Fetching bookings data...");
          await fetchBookings();
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load booking data");
      } finally {
        setDialogLoading(false);
      }
    }
  };

  const handleInputChange = (field, value) => {
    // Set user interaction flag when user starts typing
    if (!hasUserInteracted) {
      setHasUserInteracted(true);
    }
    
    // Support object for batch updating multiple fields
    if (typeof field === "object" && field !== null) {
      setCheckInData((prev) => ({
        ...prev,
        ...field,
      }));
      return;
    }

    // Input validation
    if (field === "discount") {
      // Allow empty string for clearing the field
      if (value === '') {
        // Keep empty string to allow clearing
      } else if (value < 0) {
        value = 0;
      }
      // Removed upper limit constraint - discount can now be any positive amount
    }
    if (field === "partial_payment_amount" && value < 0) {
      value = 0;
    }

    setCheckInData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Pure validation calculation
  const getValidationErrors = (data = checkInData) => {
    const errors = {};

    // 1. Full Name *
    if (!data.full_name || !String(data.full_name).trim()) {
      errors.full_name = "Full name is required";
    }

    // 2. Mobile *
    const rawMobile = String(data.mobile || "").trim();
    const cleanDigits = rawMobile.replace(/\D/g, "");
    const normalizedMobile =
      cleanDigits.length === 12 && cleanDigits.startsWith("91")
        ? cleanDigits.slice(2)
        : cleanDigits.length === 11 && cleanDigits.startsWith("0")
        ? cleanDigits.slice(1)
        : cleanDigits.length > 10
        ? cleanDigits.slice(-10)
        : cleanDigits;

    if (!rawMobile) {
      errors.mobile = "Mobile number is required";
    } else if (normalizedMobile.length !== 10) {
      errors.mobile = "Mobile number must be 10 digits";
    }

    // 3. Gender *
    if (!data.gender || !String(data.gender).trim()) {
      errors.gender = "Gender is required";
    }

    // 4. ID Proof Type *
    if (!data.id_proof_type || !String(data.id_proof_type).trim()) {
      errors.id_proof_type = "ID proof type is required";
    }

    // 5. ID Proof Number *
    if (!data.id_proof_number || !String(data.id_proof_number).trim()) {
      errors.id_proof_number = "ID proof number is required";
    }

    // 6. Nationality *
    if (!data.nationality || !String(data.nationality).trim()) {
      errors.nationality = "Nationality is required";
    }

    // 7. Address *
    if (!data.address || !String(data.address).trim()) {
      errors.address = "Address is required";
    }

    // 8. City *
    if (!data.city || !String(data.city).trim()) {
      errors.city = "City is required";
    }

    // 9. State *
    if (!data.state || !String(data.state).trim()) {
      errors.state = "State is required";
    }

    // 10. Country *
    if (!data.country || !String(data.country).trim()) {
      errors.country = "Country is required";
    }

    // 11. Pincode *
    const pinStr = String(data.pincode || "").trim();
    const isPlaceholderPin = ["n/a", "na", "-", "--", "none", "nil"].includes(pinStr.toLowerCase());
    const cleanPin = pinStr.replace(/\D/g, "");
    if (!pinStr || isPlaceholderPin) {
      errors.pincode = "Pincode is required";
    } else if (cleanPin.length !== 6) {
      errors.pincode = "Pincode must be 6 digits";
    }

    // 12. Guest Category *
    if (!data.guest_category || !String(data.guest_category).trim()) {
      errors.guest_category = "Guest category is required";
    }

    // 13. Marital Status *
    if (!data.marital_status || !String(data.marital_status).trim()) {
      errors.marital_status = "Marital status is required";
    }

    // 14. Check-in Type *
    if (!data.booking_type || !String(data.booking_type).trim()) {
      errors.booking_type = "Check-in type is required";
    }

    // 15. Number of Adults *
    if (!data.no_of_adults || data.no_of_adults < 1) {
      errors.no_of_adults = "At least 1 adult is required";
    } else if (data.no_of_adults > 10) {
      errors.no_of_adults = "Maximum 10 adults allowed";
    }

    if (data.no_of_children && data.no_of_children > 5) {
      errors.no_of_children = "Maximum 5 children allowed";
    }

    // 16. Rate Plan *
    if (!data.rate_plan_id || !String(data.rate_plan_id).trim()) {
      errors.rate_plan_id = "Please select a rate plan";
    }

    // 17. Check-in Date *
    if (!data.checkin_date) {
      errors.checkin_date = "Check-in date is required";
    }

    // 18. Check-out Date *
    if (!data.checkout_date) {
      errors.checkout_date = "Check-out date is required";
    } else if (data.checkin_date && new Date(data.checkout_date) <= new Date(data.checkin_date)) {
      errors.checkout_date = "Check-out date must be after check-in date";
    }

    // 19. Room(s) *
    if (!data.room_id || (Array.isArray(data.room_id) && data.room_id.length === 0)) {
      errors.room_id = "Please assign at least one room";
    }

    if (
      data.discount !== undefined && data.discount !== null &&
      (isNaN(data.discount) || data.discount < 0)
    ) {
      errors.discount = "Discount must be 0 or greater";
    }

    if (
      data.partial_payment_amount &&
      (isNaN(data.partial_payment_amount) || data.partial_payment_amount < 0)
    ) {
      errors.partial_payment_amount = "Partial payment amount must be 0 or greater";
    }

    // 20. Advance Payment Mode * (if partial payment > 0)
    if (
      data.partial_payment_amount &&
      data.partial_payment_amount > 0 &&
      !data.advance_payment_mode
    ) {
      errors.advance_payment_mode = "Please select advance payment mode";
    }

    // 21. UPI Platform * (if UPI selected)
    if (
      data.partial_payment_amount > 0 &&
      data.advance_payment_mode === "UPI" &&
      !data.advance_payment_upi_mode
    ) {
      errors.advance_payment_upi_mode = "Please select UPI platform";
    }

    return errors;
  };

  // Validation function
  const validateForm = (forceShow = false) => {
    const errors = getValidationErrors(checkInData);
    if (forceShow || hasAttemptedSubmit) {
      setValidationErrors(errors);
    }
    return Object.keys(errors).length === 0;
  };

  // Run validation whenever form data changes, but ONLY after user has attempted submit
  useEffect(() => {
    if (hasAttemptedSubmit) {
      const errors = getValidationErrors(checkInData);
      setValidationErrors(errors);
    }
  }, [checkInData, hasAttemptedSubmit]);

  // Calculate final price when rate plan, room, or discount changes
  useEffect(() => {
    let basePrice = 0;
    let roomPrice = 0;

    if (checkInData.rate_plan_id && ratePlans) {
      const selectedPlan = ratePlans.find(
        (plan) => plan.plan_id === checkInData.rate_plan_id
      );
      if (selectedPlan) {
        basePrice = selectedPlan.base_tariff;
        setBaseTariff(basePrice);
      }
    }

    // Calculate room price for multiple selected rooms
    if (checkInData.room_id && checkInData.room_id.length > 0 && rooms) {
      const selectedRooms = rooms.filter(room => 
        checkInData.room_id.includes(room.room_id)
      );
      roomPrice = selectedRooms.reduce((total, room) => total + (room.tariff || 0), 0);
    }
    // Always set room tariff, even when no rooms are selected (set to 0)
    setRoomTariff(roomPrice);

    let nights = 0;
    if (checkInData.checkin_date && checkInData.checkout_date) {
      const checkinDate = new Date(checkInData.checkin_date);
      const checkoutDate = new Date(checkInData.checkout_date);
      const timeDiff = checkoutDate.getTime() - checkinDate.getTime();
      nights = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

      if (nights < 1) {
        nights = 1;
      }
    } else {
      nights = 1;
    }
    setNumberOfNights(nights);

    // Calculate extra PAX amount
    const calculatedExtraPaxAmount = checkInData.manual_extra_pax_amount !== undefined 
      ? checkInData.manual_extra_pax_amount
      : Array.isArray(checkInData.extra_pax) 
        ? checkInData.extra_pax.reduce((total, pax) => total + (parseFloat(pax.extra_pax_amount) || 0), 0)
        : 0;
    
    setExtraPaxAmount(calculatedExtraPaxAmount);

    const finalBasePrice = basePrice + roomPrice + calculatedExtraPaxAmount;
    const discount = checkInData.discount === '' || checkInData.discount === null || checkInData.discount === undefined ? 0 : parseFloat(checkInData.discount) || 0;
    const discountAmount = discount; // Discount is now in rupees, not percentage
    const pricePerNight = finalBasePrice - discountAmount;
    const totalAmount = pricePerNight * nights;
    
    setFinalPrice(totalAmount);
  }, [
    checkInData.rate_plan_id,
    checkInData.room_id,
    checkInData.checkin_date,
    checkInData.checkout_date,
    checkInData.extra_pax,
    checkInData.manual_extra_pax_amount,
    ratePlans,
    rooms,
  ]);

  const handleRoomSelectionChange = (selectedRoomIds, totalTariff) => {
    // This callback can be used to update any additional state if needed
    // The main calculation is already handled in the useEffect
    console.log('Room selection changed:', selectedRoomIds, 'Total tariff:', totalTariff);
  };

  // Helper function to calculate total room tariff
  const getTotalRoomTariff = () => {
    if (!checkInData.room_id || !Array.isArray(checkInData.room_id)) return 0;
    
    return rooms
      .filter(room => checkInData.room_id.includes(room.room_id))
      .reduce((total, room) => {
        const roomTariff = checkInData.manual_room_tariffs && 
          checkInData.manual_room_tariffs[room.room_id] !== undefined 
          ? checkInData.manual_room_tariffs[room.room_id] 
          : room.tariff;
        return total + roomTariff;
      }, 0);
  };

  const handleAmountChange = (field, value) => {
    console.log('Amount changed:', field, value);
    
    switch (field) {
      case 'baseTariff':
        // Update base tariff - this would need to be handled by updating the rate plan
        console.log('Base tariff changed to:', value);
        // For now, we'll store this in a custom field for manual override
        setCheckInData(prev => ({
          ...prev,
          manual_base_tariff: value
        }));
        break;
      case 'roomTariff':
        // Update room tariff - this would need to be handled by updating room selection
        console.log('Room tariff changed to:', value);
        // For now, we'll store this in a custom field for manual override
        setCheckInData(prev => ({
          ...prev,
          manual_room_tariff: value
        }));
        break;
      case 'individualRoomTariff':
        // Handle individual room tariff updates
        console.log('Individual room tariff changed:', value);
        const { roomId, newTariff } = value;
        // Store the manual room tariff override in checkInData
        setCheckInData(prev => {
          const updatedManualRoomTariffs = {
            ...prev.manual_room_tariffs,
            [roomId]: newTariff
          };
          
          // Calculate the total room tariff from all manual overrides and original tariffs
          const selectedRoomIds = prev.room_id || [];
          const totalRoomTariff = rooms
            .filter(room => selectedRoomIds.includes(room.room_id))
            .reduce((total, room) => {
              const roomTariff = updatedManualRoomTariffs[room.room_id] !== undefined 
                ? updatedManualRoomTariffs[room.room_id] 
                : room.tariff;
              return total + roomTariff;
            }, 0);
          
          return {
            ...prev,
            manual_room_tariffs: updatedManualRoomTariffs,
            manual_room_tariff: totalRoomTariff // Update the total room tariff
          };
        });
        break;
      case 'discount':
        // Update both discount and discount_input fields
        handleInputChange('discount', value);
        
        // Also update discount_input based on current discount type
        if (checkInData.discount_type === "percentage") {
          // Convert rupees to percentage
          const totalRoomCost = getTotalRoomTariff();
          if (totalRoomCost > 0) {
            const percentage = (value / totalRoomCost) * 100;
            handleInputChange('discount_input', percentage);
          }
        } else {
          // For rupees, discount_input should match discount
          handleInputChange('discount_input', value);
        }
        break;
      case 'partialPaymentAmount':
        handleInputChange('partial_payment_amount', value);
        break;
      case 'extraPaxAmount':
        // Handle extra PAX amount changes - this would need to be distributed across PAX entries
        console.log('Extra PAX amount changed to:', value);
        // For now, we'll store this as a manual override
        setCheckInData(prev => ({
          ...prev,
          manual_extra_pax_amount: value
        }));
        break;
      default:
        console.log('Unknown field:', field);
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const handleCheckIn = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }

    if (isSubmitting || loading || isProcessingRef.current) {
      return;
    }

    // Force show validation errors when user tries to submit
    setHasAttemptedSubmit(true);
    const errors = getValidationErrors(checkInData);
    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      const errorList = Object.values(errors);
      toast.error(
        `Please fill all required star (*) marked fields: ${errorList.slice(0, 3).join(", ")}${errorList.length > 3 ? ` and ${errorList.length - 3} more` : ''}`,
        { duration: 6000 }
      );
      return;
    }

    setIsSubmitting(true);
    isProcessingRef.current = true;

    try {
      // --- PATCH: Check if we need to auto-create company before continuing ---
      const companyName = (checkInData.company_name || "").trim();
      const gst = (checkInData.gst_no || "").trim();
      let companyId = checkInData.company_id;
      const existCompany = companies && companies.find(c => {
        const n = (c.name || c.company_name || c.companyName || "").trim().toLowerCase();
        return n === companyName.toLowerCase();
      });

      if (!companyId && companyName && gst && !existCompany && typeof createCompany === 'function') {
        toast.info("Creating company... Please wait");
        const created = await createCompany({ name: companyName, gst_no: gst });
        let resolvedId = created && (created.company_id || created.id);
        if (!resolvedId && typeof fetchCompanies === 'function') {
          // Refresh and try to resolve by name + gst
          await fetchCompanies();
          const match = (companies || []).concat([]).find((c) => {
            const n = (c.name || c.company_name || c.companyName || "").trim().toLowerCase();
            const g = (c.gst_no || c.gst_number || c.gstNo || "").trim().toLowerCase();
            return n === companyName.toLowerCase() && g === gst.toLowerCase();
          });
          if (match) {
            resolvedId = match.company_id || match.id;
          }
        }
        if (!resolvedId) {
          // Proceed without blocking; keep name/gst set, but warn
          toast.warning("Company created but ID missing; proceeding without company link.");
        } else {
          companyId = resolvedId;
          setCheckInData(prev => ({ ...prev, company_id: companyId }));
          toast.success("Company created and selected.");
        }
      } else if (!companyId && existCompany) {
        companyId = existCompany.company_id || existCompany.id;
        setCheckInData(prev => ({ ...prev, company_id: companyId }));
      }
      // --- END PATCH ---

      // Generate services data for each selected room
      const services = {};
      const selectedRoomIds = checkInData.room_id || [];
      
      selectedRoomIds.forEach(roomId => {
        const room = rooms.find(r => r.room_id === roomId);
        if (room) {
          services[room.room_number] = {};
          
          // Generate services for each day of stay
          const checkinDate = new Date(checkInData.checkin_date);
          const checkoutDate = new Date(checkInData.checkout_date);
          
          for (let d = new Date(checkinDate); d < checkoutDate; d.setDate(d.getDate() + 1)) {
            const dateKey = d.toISOString().split('T')[0]; // Format: YYYY-MM-DD
            services[room.room_number][dateKey] = {
              extra_bed_charges: 0,
              food_charges: 0,
              laundry_charges: 0,
              manual_charges: 0,
              minibar_charges: 0
            };
          }
        }
      });

      // Generate room charges data
      const room_charges = {};
      selectedRoomIds.forEach(roomId => {
        const room = rooms.find(r => r.room_id === roomId);
        if (room) {
          // Use manual override if available, otherwise use original tariff
          const roomTariff = checkInData.manual_room_tariffs && 
            checkInData.manual_room_tariffs[roomId] !== undefined 
            ? checkInData.manual_room_tariffs[roomId] 
            : room.tariff;
          
          room_charges[room.room_number] = roomTariff;
        }
      });

      console.log(checkInData.mobile)

      const now = new Date();
      const day = String(now.getDate()).padStart(2, "0");
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const year = now.getFullYear();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const rawMobile = String(checkInData.mobile || "").trim();
      const cleanDigits = rawMobile.replace(/\D/g, "");
      const normalizedMobile =
        cleanDigits.length === 12 && cleanDigits.startsWith("91")
          ? cleanDigits.slice(2)
          : cleanDigits.length === 11 && cleanDigits.startsWith("0")
          ? cleanDigits.slice(1)
          : cleanDigits.length > 10
          ? cleanDigits.slice(-10)
          : (cleanDigits.length === 10 ? cleanDigits : checkInData.mobile);

      const phoneNumber = normalizedMobile || "0000000000";
      const customBookingId = `${phoneNumber}_${day}${month}${year}_${hours}${minutes}`;

      const grcNo = nextGrcNumber;
      const checkInSequenceNumber = nextCheckInNumber;
      const billSequenceNumber = nextBillNumber;

      const finalCheckInData = {
        ...checkInData,
        mobile: normalizedMobile || checkInData.mobile,
        status: "Checked-in",
        room_type: checkInData.room_type || selectedBooking?.room_category || selectedBooking?.room_type || "",
        room_category: checkInData.room_type || selectedBooking?.room_category || selectedBooking?.room_type || "",
        no_of_rooms: Array.isArray(checkInData.room_id) && checkInData.room_id.length > 0 ? checkInData.room_id.length : (selectedBooking?.no_of_rooms || 1),
        no_of_persons: checkInData.no_of_adults || selectedBooking?.no_of_persons || 1,
        company_id: companyId || checkInData.company_id || "",
        company_name: checkInData.company_name || "N/A",
        gst_no: checkInData.gst_no || "N/A",
        // Generate booking ID if not from existing booking
        booking_id: checkInData.booking_id || customBookingId,
        // Set booking type to Walk-in if no existing booking
        booking_type: selectedBooking ? checkInData.booking_type : "Walk-in",
        // Add services and room charges
        services: services,
        room_charges: room_charges,
        grc_no: grcNo,
        check_in_number: checkInSequenceNumber,
        bill_no: billSequenceNumber,
      };

      console.log("Check-in identifiers:", {
        grcNo,
        checkInNumber: checkInSequenceNumber,
        billNo: billSequenceNumber,
        bookingId: finalCheckInData.booking_id,
      });

      setCheckInData(finalCheckInData);
      
      // Wait for the API call to complete
      await checkInGuest({ checkInData: finalCheckInData });
      
      // If payment is cash and partial payment amount > 0, add to cash drawer as received
      if (finalCheckInData.advance_payment_mode === "Cash" && finalCheckInData.partial_payment_amount > 0) {
        try {
          const cashReceivedData = {
            date: new Date().toLocaleDateString("en-GB"), // DD/MM/YYYY format
            name: finalCheckInData.booking_id,
            description: `Advance payment received during check-in - ${finalCheckInData.full_name || 'Guest'}`,
            amount: finalCheckInData.partial_payment_amount,
            bill_id: finalCheckInData.booking_id, // Store bill_id for reference
            receivedId: Math.random().toString(36).substr(2, 9), // Generate unique ID
          };

          // Add to cash drawer as received amount
          addExpense({ received: cashReceivedData });
          console.log("Advance cash payment added to expenses:", cashReceivedData);
        } catch (expenseError) {
          console.error("Error adding advance payment to expenses:", expenseError);
          // Don't fail the check-in if expense tracking fails
        }
      }
      
      // If we reach here, the API call was successful
      toast.success(selectedBooking ? "Booking Successfully Checked-in!" : "Guest Successfully Checked-in!");
      navigate("/dashboard/frontdesk/room_list");
      
    } catch (error) {
      console.error("Error checking in guest:", error);
      
      // Check if this is a network error or actual API failure
      if (error.name === 'TypeError' || error.message.includes('fetch')) {
        toast.error("Network error. Please check your connection and try again.");
      } else {
      toast.error("Failed to check in guest. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
      isProcessingRef.current = false;
    }
  };

  const handleClearSelection = () => {
    setSelectedBooking(null);
    setSelectedGuest(null);
    setCheckInData({
      // Guest Details
      full_name: "",
      mobile: "",
      email: "",
      gender: "",
      id_proof_type: "",
      id_proof_number: "",
      id_proof_image_url: "",
      nationality: "Indian",
      guest_category: "Regular",
      marital_status: "Unmarried",
      address: "",
      city: "",
      state: "",
      country: "India",
      pincode: "",
      
      // Booking Details
      booking_id: "",
      guest_id: "",
      booking_type: "Walk-in",
      booking_date: Date.now(),
      checkin_date: Date.now(),
      checkout_date: new Date(Date.now() + 24 * 60 * 60 * 1000).getTime(), // Tomorrow
      room_type: "",
      room_id: [],
      no_of_adults: 1,
      no_of_children: 0,
      company_id: "",
      company_name: "",
      gst_no: "",
      discount: 0,
      partial_payment_amount: null,
      advance_payment_mode: "",
      advance_payment_upi_mode: "",
      booking_source: "Direct",
      remarks: "",
      special_requests: "",
      status: "Reserved",
      assigned_staff_id: "",
      rate_plan_id: "",
      grc_no: "",
    });
    setValidationErrors({});
    setHasAttemptedSubmit(false);
    setHasUserInteracted(false);
  };

  const hasValidationErrors = hasAttemptedSubmit && Object.keys(validationErrors).length > 0;
  const isFormValid = Object.keys(getValidationErrors(checkInData)).length === 0;

  if (pageLoading) {
    return <LoadingState message="Loading check-in system..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 max-sm:p-0">
        <div className="bg-white rounded-lg shadow-sm">
          {/* Header */}
          <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-800">
              Check-In Process
            </h2>
            
            <div className="flex items-center gap-3">
              <RefreshButton
                onRefresh={handleRefresh}
                loading={refreshing}
                size="sm"
              />
              <BookingSelector
                isModalOpen={isModalOpen}
                handleDialogOpen={handleDialogOpen}
                dialogLoading={dialogLoading}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                filteredBookings={filteredBookings}
                guests={guests}
                handleBookingSelect={handleBookingSelect}
                formatDate={formatDate}
                validationErrors={hasAttemptedSubmit ? validationErrors : {}}
              />
            </div>
          </div>

          {/* Main Content */}
          <div className="p-6">
            <div className="space-y-6">
              {hasAttemptedSubmit && Object.keys(validationErrors).length > 0 && (
                <ValidationSummary validationErrors={validationErrors} />
              )}

              {selectedBooking && (
                <SelectedBookingInfo 
                  selectedBooking={selectedBooking}
                  selectedGuest={selectedGuest}
                  formatDate={formatDate}
                  onBookingUpdated={handleBookingUpdated}
                />
              )}

              <CheckInForm
                checkInData={checkInData}
                handleInputChange={handleInputChange}
                validationErrors={hasAttemptedSubmit ? validationErrors : {}}
                formatToLocalDateTime={formatToLocalDateTime}
                parseLocalDateTime={parseLocalDateTime}
                getVacantRooms={getVacantRooms}
                staffs={staffs}
                ratePlans={ratePlans}
                numberOfNights={numberOfNights}
                onRoomSelectionChange={handleRoomSelectionChange}
                nextGrcNumber={nextGrcNumber}
                nextCheckInNumber={nextCheckInNumber}
                nextBillNumber={nextBillNumber}
                bills={bills}
                guests={guests}
                selectedBooking={selectedBooking}
              />

              {(checkInData.rate_plan_id || (checkInData.room_id && checkInData.room_id.length > 0)) && (
                <PriceSummary
                  baseTariff={checkInData.manual_base_tariff !== undefined ? checkInData.manual_base_tariff : baseTariff}
                  roomTariff={checkInData.manual_room_tariff !== undefined ? checkInData.manual_room_tariff : roomTariff}
                  extraPaxAmount={extraPaxAmount}
                  numberOfNights={numberOfNights}
                  discount={checkInData.discount}
                  finalPrice={finalPrice}
                  partialPaymentAmount={checkInData.partial_payment_amount}
                  selectedRoomsCount={checkInData.room_id ? checkInData.room_id.length : 0}
                  selectedRooms={rooms ? rooms.filter(room => checkInData.room_id && checkInData.room_id.includes(room.room_id)).map(room => ({
                    ...room,
                    tariff: checkInData.manual_room_tariffs && checkInData.manual_room_tariffs[room.room_id] !== undefined 
                      ? checkInData.manual_room_tariffs[room.room_id] 
                      : room.tariff
                  })) : []}
                  onAmountChange={handleAmountChange}
                />
              )}

              <ActionButtons
                loading={loading}
                isSubmitting={isSubmitting}
                hasValidationErrors={hasValidationErrors}
                isFormValid={isFormValid}
                selectedBooking={selectedBooking}
                handleCheckIn={handleCheckIn}
                handleClearSelection={handleClearSelection}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckIn; 