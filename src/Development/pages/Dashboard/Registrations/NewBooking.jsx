import { useState, useMemo, useEffect } from "react";
import { Button } from "../../../components/ui/button.js";
import { Input } from "../../../components/ui/input.js";
import { Label } from "../../../components/ui/label.js";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select.js";
import { Calendar, User, Phone, Mail, Bed, Users, Building, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router";
import { useAppContext } from "../../../context/AppContext.jsx";
import RefreshButton from "../../../components/ui/RefreshButton.jsx";

const NewBooking = () => {
  const { createBooking, rooms, bookings, fetchRooms, fetchBookings } = useAppContext();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const toTimestamp = (val) => {
    if (!val) return null;
    if (typeof val === "number") {
      return val < 10000000000 ? val * 1000 : val;
    }
    const num = Number(val);
    if (!isNaN(num) && num > 0) {
      return num < 10000000000 ? num * 1000 : num;
    }
    const parsed = new Date(val).getTime();
    return isNaN(parsed) ? null : parsed;
  };

  // Helper to determine if a room is occupied or booked for the specified dates
  // Allows booking occupied rooms for upcoming future dates after current checkout
  const isRoomOccupiedForDates = (roomOrId, targetCheckin, targetCheckout) => {
    if (!roomOrId) return false;
    const room = typeof roomOrId === "object"
      ? roomOrId
      : (rooms || []).find((r) =>
          String(r.room_id || "").trim() === String(roomOrId).trim() ||
          String(r.id || "").trim() === String(roomOrId).trim() ||
          String(r.room_number || "").trim() === String(roomOrId).trim()
        ) || { room_id: roomOrId, room_number: roomOrId };

    const roomIdStr = String(room?.room_id || room?.id || roomOrId || "").trim();
    const roomNumStr = String(room?.room_number || roomOrId || "").trim();

    // Maintenance / blocked rooms cannot be booked
    const s = String(room?.status || "").toLowerCase().trim();
    if (s.includes("maintenance") || s.includes("block") || s.includes("order")) {
      return true;
    }

    const tIn = toTimestamp(targetCheckin);
    const tOut = toTimestamp(targetCheckout);

    // If target dates are not yet chosen, allow room selection for advance bookings
    if (!tIn || !tOut) return false;

    // Check overlap with active bookings (both Checked-in and Reserved)
    return (bookings || []).some((b) => {
      if (b.status !== "Checked-in" && b.status !== "Reserved") return false;

      const checkMatch = (val) => {
        if (!val) return false;
        if (Array.isArray(val)) return val.some(checkMatch);
        const str = String(val).trim();
        return (
          (roomIdStr && str === roomIdStr) ||
          (roomNumStr && str === roomNumStr)
        );
      };

      const matchesRoom =
        checkMatch(b.room_id) ||
        checkMatch(b.room_ids) ||
        checkMatch(b.room_number) ||
        checkMatch(b.room_numbers) ||
        checkMatch(b.roomNo) ||
        (Array.isArray(b.rooms) && b.rooms.some((r) => checkMatch(r?.room_id) || checkMatch(r?.room_number))) ||
        (Array.isArray(b.rooms_config) && b.rooms_config.some((r) => checkMatch(r?.room_id) || checkMatch(r?.room_number)));

      if (!matchesRoom) return false;

      const bIn = toTimestamp(b.checkin_date);
      const bOut = toTimestamp(b.checkout_date);
      if (!bIn || !bOut) return true;

      // Intervals [tIn, tOut] and [bIn, bOut] overlap if:
      // (tIn < bOut) and (tOut > bIn)
      return tIn < bOut && tOut > bIn;
    });
  };

  const [guestData, setGuestData] = useState({
    name_prefix: "Mr",
    full_name: "",
    booked_by: "",
    mobile: "",
    email: "",
    // All other guest details will be collected during check-in
    address: "",
    city: "",
    state: "",
    country: "India",
    pincode: "",
    id_proof_type: "",
    id_proof_number: "",
    id_proof_image_url: "https://via.placeholder.com/150",
    gender: "",
    nationality: "Indian",
    guest_category: "New",
  });

  const [bookingData, setBookingData] = useState({
    booking_type: "Advance", // Default to Advance booking
    booking_date: Date.now(),
    checkin_date: "",
    checkout_date: "",
    guest_id: "",
    room_category: "",
    room_type: "",
    no_of_rooms: 1,
    number_of_rooms: 1,
    no_of_persons: 1,
    no_of_adults: 1,
    no_of_children: 0,
    discount: 0,
    booking_source: "Direct",
    remarks: "",
    pickup_details: "",
    dropoff_details: "",
    special_requests: "",
    status: "Reserved",
    rate_plan_id: "",
  });

  const [roomsConfig, setRoomsConfig] = useState([
    { room_index: 1, room_category: "", room_id: "", room_number: "" },
  ]);

  // Validation states
  const [validationErrors, setValidationErrors] = useState({});
  const [isValidating, setIsValidating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (fetchRooms && (!rooms || rooms.length === 0)) {
      fetchRooms();
    }
  }, [fetchRooms, rooms]);

  const availableCategories = useMemo(() => {
    const dynamicCategories = (rooms || [])
      .map((r) => r.room_type)
      .filter((t) => Boolean(t && typeof t === "string" && t.trim().length > 0));
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
    const categoryParam = searchParams.get("room_category");
    const currentCat = bookingData?.room_category;
    const combined = [...dynamicCategories, ...standardCategories];
    if (categoryParam) combined.push(categoryParam);
    if (currentCat) combined.push(currentCat);
    return Array.from(new Set(combined.filter(Boolean)));
  }, [rooms, searchParams, bookingData?.room_category]);

  // Helper function to format timestamp or date string to local datetime-local string
  const formatToLocalDateTime = (timestamp) => {
    if (!timestamp) return "";
    const numeric =
      typeof timestamp === "string" && !isNaN(Number(timestamp))
        ? Number(timestamp)
        : timestamp;
    const date = new Date(numeric);
    if (isNaN(date.getTime())) return "";
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60 * 1000);
    return localDate.toISOString().slice(0, 16);
  };

  // Helper function to convert local datetime-local string to timestamp
  const parseLocalDateTime = (dateTimeString) => {
    if (!dateTimeString) return null;
    const date = new Date(dateTimeString);
    return isNaN(date.getTime()) ? null : date.getTime();
  };

  // Validation functions
  const validateEmail = (email) => {
    if (!email) return true; // Email is optional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateMobile = (mobile) => {
    if (!mobile) return false;
    const clean = mobile.replace(/[\s\-\+\(\)]/g, "");
    return clean.length >= 10 && /^\d+$/.test(clean);
  };

  const validateName = (name) => {
    if (!name) return false;
    return name.trim().length >= 2;
  };

  const validateBookingDates = () => {
    if (!bookingData.checkin_date || !bookingData.checkout_date) {
      return {
        isValid: false,
        error: "Both check-in and check-out dates are required",
      };
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const checkinDate = new Date(
      typeof bookingData.checkin_date === "number"
        ? bookingData.checkin_date
        : Number(bookingData.checkin_date) || bookingData.checkin_date
    );
    const checkoutDate = new Date(
      typeof bookingData.checkout_date === "number"
        ? bookingData.checkout_date
        : Number(bookingData.checkout_date) || bookingData.checkout_date
    );

    if (isNaN(checkinDate.getTime()) || isNaN(checkoutDate.getTime())) {
      return {
        isValid: false,
        error: "Invalid check-in or check-out date",
      };
    }

    // Allow bookings for today and future dates
    if (checkinDate < startOfToday) {
      return {
        isValid: false,
        error: "Check-in date cannot be in the past",
      };
    }

    // Check if check-out date is before or equal to check-in date
    if (checkoutDate <= checkinDate) {
      return {
        isValid: false,
        error: "Check-out date must be after check-in date",
      };
    }

    return { isValid: true };
  };

  // Real-time validation
  const validateField = (fieldName, value) => {
    let error = "";

    switch (fieldName) {
      case "full_name":
        if (!validateName(value)) {
          error =
            "Name should be 2-50 characters and contain only letters and spaces";
        }
        break;
      case "mobile":
        if (!validateMobile(value)) {
          error = "Please enter a valid 10-digit Indian mobile number";
        }
        break;
      case "email":
        if (value && !validateEmail(value)) {
          error = "Please enter a valid email address";
        }
        break;
      case "room_category":
      case "room_type":
        if (!value || !value.toString().trim()) {
          error = "Please select a room category";
        }
        break;
      case "no_of_rooms":
      case "number_of_rooms":
        if (!value || parseInt(value, 10) < 1) {
          error = "Number of rooms must be at least 1";
        }
        break;
      case "no_of_persons":
      case "no_of_adults":
        if (!value || parseInt(value, 10) < 1) {
          error = "Number of persons must be at least 1";
        }
        break;
      default:
        break;
    }

    setValidationErrors((prev) => ({
      ...prev,
      [fieldName]: error,
    }));

    return !error;
  };

  // Refresh function
  const handleRefresh = () => {
    // For NewBooking, refresh means resetting the form
    setGuestData({
      name_prefix: "Mr",
    full_name: "",
    booked_by: "",
      mobile: "",
      email: "",
      address: "",
      city: "",
      state: "",
      country: "India",
      pincode: "",
      id_proof_type: "",
      id_proof_number: "",
      id_proof_image_url: "https://via.placeholder.com/150",
      gender: "",
      nationality: "Indian",
      guest_category: "New",
    });
    
    setBookingData({
      booking_type: "Advance",
      booking_date: Date.now(),
      checkin_date: "",
      checkout_date: "",
      guest_id: "",
      room_category: "",
      room_type: "",
      no_of_rooms: 1,
      number_of_rooms: 1,
      no_of_persons: 1,
      no_of_adults: 1,
      no_of_children: 0,
      discount: 0,
      booking_source: "Direct",
      remarks: "",
      special_requests: "",
      status: "Reserved",
      rate_plan_id: "",
    });
    
    setRoomsConfig([
      { room_index: 1, room_category: "", room_id: "", room_number: "" },
    ]);
    
    setValidationErrors({});
    toast.success("Form refreshed successfully");
  };

  // Support pre-filling from Availability Forecaster URL search params
  useEffect(() => {
    const checkinParam = searchParams.get("checkin_date");
    const categoryParam = searchParams.get("room_category");
    if (checkinParam || categoryParam) {
      setBookingData((prev) => {
        const next = { ...prev };
        if (checkinParam) {
          let checkinTimestamp = null;
          const num = Number(checkinParam);
          if (!isNaN(num) && num > 1000000000) {
            checkinTimestamp = num;
          } else if (checkinParam) {
            const parsed = new Date(checkinParam);
            if (!isNaN(parsed.getTime())) {
              checkinTimestamp = parsed.getTime();
            }
          }

          if (checkinTimestamp) {
            next.checkin_date = checkinTimestamp;
            const nextDay = new Date(checkinTimestamp + 24 * 60 * 60 * 1000);
            next.checkout_date = nextDay.getTime();
          }
        }
        if (categoryParam) {
          next.room_category = categoryParam;
          next.room_type = categoryParam;
        }
        return next;
      });

      if (categoryParam) {
        setRoomsConfig((prev) =>
          prev.map((r, i) => (i === 0 ? { ...r, room_category: categoryParam } : r))
        );
      }
    }
  }, [searchParams]);

  const vacantRooms = useMemo(() => {
    return (rooms || []).filter((r) => {
      const s = String(r.status || "").toLowerCase().trim();
      if (s.includes("maintenance") || s.includes("block") || s.includes("order")) {
        return false;
      }
      return !isRoomOccupiedForDates(r, bookingData.checkin_date, bookingData.checkout_date);
    });
  }, [rooms, bookings, bookingData.checkin_date, bookingData.checkout_date]);

  const getVacantRoomsForCategory = (category) => {
    if (!category) return [];
    return vacantRooms.filter(
      (r) => (r.room_type || "").toLowerCase() === category.toLowerCase()
    );
  };

  const getAvailableRoomsForRoomIndex = (index, category) => {
    const matching = getVacantRoomsForCategory(category);
    const assignedOtherRoomIds = roomsConfig
      .filter((_, i) => i !== index)
      .map((r) => r.room_id)
      .filter(Boolean);
    return matching.filter((r) => !assignedOtherRoomIds.includes(r.room_id));
  };

  const handleRoomsCountChange = (value) => {
    const rawVal = value === "" ? "" : parseInt(value, 10);
    handleBookingDataChange("no_of_rooms", rawVal);

    if (rawVal && rawVal >= 1) {
      setRoomsConfig((prev) => {
        const next = [...prev];
        if (rawVal > next.length) {
          const defaultCat = next[0]?.room_category || availableCategories[0] || "";
          for (let i = next.length; i < rawVal; i++) {
            next.push({
              room_index: i + 1,
              room_category: defaultCat,
              room_id: "",
              room_number: "",
            });
          }
        } else if (rawVal < next.length) {
          return next.slice(0, rawVal);
        }
        return next;
      });
    }
  };

  const handleRoomConfigChange = (index, field, value) => {
    setRoomsConfig((prev) => {
      const next = [...prev];
      if (field === "room_category") {
        next[index] = {
          ...next[index],
          room_category: value,
          room_id: "",
          room_number: "",
        };
      } else if (field === "room_id") {
        if (value === "none" || !value) {
          next[index] = {
            ...next[index],
            room_id: "",
            room_number: "",
          };
        } else {
          const selectedRoom = (rooms || []).find((r) => r.room_id === value);
          next[index] = {
            ...next[index],
            room_id: value,
            room_number: selectedRoom ? selectedRoom.room_number : "",
          };
        }
      }
      return next;
    });

    if (field === "room_category") {
      setBookingData((prev) => {
        const categories = roomsConfig
          .map((r, i) => (i === index ? value : r.room_category))
          .filter(Boolean);
        const combined = categories.join(", ");
        return {
          ...prev,
          room_category: combined || value,
          room_type: combined || value,
        };
      });
    }
  };

  const handleGuestDataChange = (field, value) => {
    setGuestData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Validate field on change
    validateField(field, value);
  };

  const handleBookingDataChange = (field, value) => {
    let updatedBookingData = {
      ...bookingData,
      [field]: value,
    };

    if (field === "room_category" || field === "room_type") {
      updatedBookingData.room_category = value;
      updatedBookingData.room_type = value;
      validateField("room_category", value);
    }

    if (field === "no_of_rooms" || field === "number_of_rooms") {
      const parsedVal = value === "" ? "" : parseInt(value, 10);
      updatedBookingData.no_of_rooms = parsedVal;
      updatedBookingData.number_of_rooms = parsedVal;
      validateField("no_of_rooms", parsedVal);
    }

    if (field === "no_of_persons" || field === "no_of_adults") {
      const parsedVal = value === "" ? "" : parseInt(value, 10);
      updatedBookingData.no_of_persons = parsedVal;
      updatedBookingData.no_of_adults = parsedVal;
      validateField("no_of_persons", parsedVal);
    }
    
    // If check-in date is changed, update check-out date to have the same time
    if (field === "checkin_date" && value) {
      const checkinDate = new Date(value);
      const checkoutDate = new Date(bookingData.checkout_date || value);
      
      // Set checkout date to same time as check-in date, but one day later
      checkoutDate.setFullYear(checkinDate.getFullYear());
      checkoutDate.setMonth(checkinDate.getMonth());
      checkoutDate.setDate(checkinDate.getDate() + 1);
      checkoutDate.setHours(checkinDate.getHours());
      checkoutDate.setMinutes(checkinDate.getMinutes());
      checkoutDate.setSeconds(checkinDate.getSeconds());
      
      updatedBookingData = {
        ...updatedBookingData,
        checkout_date: checkoutDate.getTime(),
      };
    }
    
    setBookingData(updatedBookingData);

    // Validate dates when either date changes
    if (field === "checkin_date" || field === "checkout_date") {
      // Use a temporary validation function with updated data
      const validateDatesWithData = (data) => {
        if (!data.checkin_date || !data.checkout_date) {
          return {
            isValid: false,
            error: "Both check-in and check-out dates are required",
          };
        }

        const now = new Date();
        const checkinDate = new Date(data.checkin_date);
        const checkoutDate = new Date(data.checkout_date);

        // Check if check-in date is in the past
        if (checkinDate < now) {
          return {
            isValid: false,
            error: "Check-in date cannot be in the past",
          };
        }

        // Check if check-out date is before or equal to check-in date
        if (checkoutDate <= checkinDate) {
          return {
            isValid: false,
            error: "Check-out date must be after check-in date",
          };
        }

        // Check if check-out date is in the past
        if (checkoutDate < now) {
          return {
            isValid: false,
            error: "Check-out date cannot be in the past",
          };
        }

        return { isValid: true };
      };
      
      setTimeout(() => {
        const dateValidation = validateDatesWithData(updatedBookingData);
        if (!dateValidation.isValid) {
          setValidationErrors((prev) => ({
            ...prev,
            dates: dateValidation.error,
          }));
        } else {
          setValidationErrors((prev) => {
            const { dates, ...rest } = prev;
            return rest;
          });
        }
      }, 100);
    }
  };

  const handleSubmit = async () => {
    setIsValidating(true);

    // Validate all guest fields before submission
    const fieldsToValidate = [
      { field: "full_name", value: guestData.full_name },
      { field: "mobile", value: guestData.mobile },
      { field: "email", value: guestData.email },
    ];

    let hasErrors = false;
    fieldsToValidate.forEach(({ field, value }) => {
      const isValid = validateField(field, value);
      if (!isValid) hasErrors = true;
    });

    // Validate dates
    const dateValidation = validateBookingDates();
    if (!dateValidation.isValid) {
      toast.error(dateValidation.error, { duration: 5000 });
      setValidationErrors((prev) => ({ ...prev, dates: dateValidation.error }));
      setIsValidating(false);
      return;
    }

    // Check required guest fields
    const requiredFields = ["full_name", "mobile"];
    const missingFields = requiredFields.filter(
      (field) => !guestData[field] || !guestData[field].trim()
    );

    if (missingFields.length > 0) {
      toast.error(
        `Please fill in all required fields: ${missingFields.join(", ")}`,
        { duration: 5000 }
      );
      setIsValidating(false);
      return;
    }

    // Check room category for each configured room
    for (let i = 0; i < roomsConfig.length; i++) {
      if (!roomsConfig[i].room_category || !roomsConfig[i].room_category.trim()) {
        toast.error(`Please select a room category for Room ${i + 1}`, { duration: 5000 });
        setValidationErrors((prev) => ({
          ...prev,
          room_category: `Please select a room category for Room ${i + 1}`,
        }));
        setIsValidating(false);
        return;
      }
    }

    // Check number of rooms
    const roomsCount = parseInt(bookingData.no_of_rooms, 10);
    if (!roomsCount || roomsCount < 1) {
      toast.error("Number of rooms must be at least 1", { duration: 5000 });
      setValidationErrors((prev) => ({
        ...prev,
        no_of_rooms: "Number of rooms must be at least 1",
      }));
      setIsValidating(false);
      return;
    }

    // Check number of persons
    const personsCount = parseInt(bookingData.no_of_persons, 10);
    if (!personsCount || personsCount < 1) {
      toast.error("Number of persons must be at least 1", { duration: 5000 });
      setValidationErrors((prev) => ({
        ...prev,
        no_of_persons: "Number of persons must be at least 1",
      }));
      setIsValidating(false);
      return;
    }

    // Check if any assigned room is occupied for the requested dates
    const occupiedAssignedRooms = [];
    roomsConfig.forEach((rc, i) => {
      if (rc.room_id) {
        if (isRoomOccupiedForDates(rc.room_id, bookingData.checkin_date, bookingData.checkout_date)) {
          const rObj = (rooms || []).find(
            (r) =>
              String(r.room_id || "").trim() === String(rc.room_id).trim() ||
              String(r.id || "").trim() === String(rc.room_id).trim() ||
              String(r.room_number || "").trim() === String(rc.room_id).trim()
          );
          occupiedAssignedRooms.push(rObj?.room_number || rc.room_number || `Room ${i + 1}`);
        }
      }
    });

    if (occupiedAssignedRooms.length > 0) {
      toast.error(
        `Room ${occupiedAssignedRooms.join(", ")} is already booked or occupied for the selected dates. Please choose another room.`,
        { duration: 5000 }
      );
      setIsValidating(false);
      return;
    }

    if (hasErrors) {
      toast.error("Please fix all validation errors before proceeding", {
        duration: 5000,
      });
      setIsValidating(false);
      return;
    }

    try {
      setLoading(true);
      
      // Add institutionId to guest data
      const guestDataWithInstitution = {
        ...guestData,
        institutionId: "HOTEL001",
      };

      // Add institutionId to booking data
      const bookingDataWithInstitution = {
        ...bookingData,
        institutionId: "HOTEL001",
      };

      const now = new Date();
      const day = String(now.getDate()).padStart(2, "0");
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const year = now.getFullYear();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const phoneNumber = guestData.mobile || "0000000000";
      const customBookingId = `${phoneNumber}_${day}${month}${year}_${hours}${minutes}`;

      const finalRooms = Math.max(
        1,
        parseInt(bookingData.no_of_rooms || bookingData.number_of_rooms, 10) || roomsConfig.length || 1
      );
      const finalPersons = Math.max(
        1,
        parseInt(bookingData.no_of_persons || bookingData.no_of_adults, 10) || 1
      );

      const allCategories = roomsConfig
        .map((r) => r.room_category.trim())
        .filter(Boolean);
      const combinedCategory =
        allCategories.length > 0
          ? allCategories.join(", ")
          : (bookingData.room_category || "Standard").trim();

      const assignedRoomIds = roomsConfig
        .map((r) => r.room_id)
        .filter((id) => id && id !== "none");

      const metaPayload = {
        no_of_rooms: finalRooms,
        number_of_rooms: finalRooms,
        no_of_persons: finalPersons,
        no_of_adults: finalPersons,
        room_category: combinedCategory,
        room_type: combinedCategory,
        rooms_config: roomsConfig,
        room_id: assignedRoomIds,
      };

      try {
        const rawStore = localStorage.getItem("hotel_bookings_meta") || "{}";
        const store = JSON.parse(rawStore);
        store[customBookingId] = metaPayload;
        localStorage.setItem("hotel_bookings_meta", JSON.stringify(store));
      } catch (storageErr) {
        console.error("Error writing booking metadata to localStorage:", storageErr);
      }

      const metaString = "__BOOKING_META__=" + encodeURIComponent(JSON.stringify(metaPayload)) + ";";
      const userRemarks = (bookingData.remarks || "").trim();
      const finalRemarks = userRemarks ? `${userRemarks} ${metaString}` : metaString;
      const userRequests = (bookingData.special_requests || "").trim();
      const finalSpecialRequests = userRequests ? `${userRequests} ${metaString}` : metaString;

      // Create booking using AppContext
      const result = await createBooking({
        bookingData: {
          ...guestDataWithInstitution,
          ...bookingDataWithInstitution,
          booking_id: customBookingId,
          guest_id: `GUEST_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`,
          booking_date: Date.now(),
          checkin_date:
            typeof bookingDataWithInstitution.checkin_date === "number"
              ? bookingDataWithInstitution.checkin_date
              : !isNaN(Number(bookingDataWithInstitution.checkin_date))
              ? Number(bookingDataWithInstitution.checkin_date)
              : new Date(bookingDataWithInstitution.checkin_date).getTime(),
          checkout_date:
            typeof bookingDataWithInstitution.checkout_date === "number"
              ? bookingDataWithInstitution.checkout_date
              : !isNaN(Number(bookingDataWithInstitution.checkout_date))
              ? Number(bookingDataWithInstitution.checkout_date)
              : new Date(bookingDataWithInstitution.checkout_date).getTime(),
          room_type: combinedCategory,
          room_category: combinedCategory,
          no_of_rooms: finalRooms,
          number_of_rooms: finalRooms,
          no_of_persons: finalPersons,
          no_of_adults: finalPersons,
          rooms_config: roomsConfig,
          room_id: assignedRoomIds,
          name_prefix: guestData.name_prefix || "Mr",
          booked_by: (guestData.booked_by || "").trim(),
          pickup_details: (bookingData.pickup_details || "").trim(),
          dropoff_details: (bookingData.dropoff_details || "").trim(),
          remarks: finalRemarks,
          special_requests: finalSpecialRequests,
          status: "Reserved",
          created_at: Date.now(),
          updated_at: Date.now(),
        },
      });

      if (result) {
        if (fetchBookings) {
          try {
            await fetchBookings();
          } catch (e) {
            console.error("Error refreshing bookings after creation:", e);
          }
        }
        toast.success("Booking created successfully!");
        navigate("/dashboard/frontdesk/room_list");
      } else {
        toast.error("Failed to create booking");
      }
    } catch (error) {
      console.error("Error creating booking:", error);
      toast.error("An error occurred while creating the booking", {
        duration: 5000,
      });
    } finally {
      setLoading(false);
      setIsValidating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 max-sm:p-0">
        <div className="bg-white rounded-lg shadow-sm">
          {/* Form Header */}
          <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-start">
            <div>
              <h2 className="text-lg font-medium text-gray-800">
                Create New Booking
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Enter basic guest information. Complete details will be collected
                during check-in.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <RefreshButton
                onRefresh={handleRefresh}
                loading={refreshing}
                size="sm"
              />
            </div>
          </div>

          {/* Form Content */}
          <div className="p-6">
            {/* Basic Guest Information */}
            <div className="mb-8">
              <h3 className="text-base font-medium text-gray-800 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                Basic Guest Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label
                    htmlFor="full_name"
                    className="text-sm font-medium text-gray-700"
                  >
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      id="full_name"
                      placeholder="Enter full name"
                      value={guestData.full_name}
                      onChange={(e) =>
                        handleGuestDataChange("full_name", e.target.value)
                      }
                      className={`pl-10 ${
                        validationErrors.full_name
                          ? "border-red-500 focus:border-red-500"
                          : ""
                      }`}
                      required
                    />
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  </div>
                  {validationErrors.full_name && (
                    <p className="mt-1 text-sm text-red-600">
                      {validationErrors.full_name}
                    </p>
                  )}
                </div>

                <div>
                  <Label
                    htmlFor="mobile"
                    className="text-sm font-medium text-gray-700"
                  >
                    Mobile Number <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      id="mobile"
                      placeholder="Enter mobile number"
                      value={guestData.mobile}
                      onChange={(e) =>
                        handleGuestDataChange("mobile", e.target.value)
                      }
                      className={`pl-10 ${
                        validationErrors.mobile
                          ? "border-red-500 focus:border-red-500"
                          : ""
                      }`}
                      required
                    />
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  </div>
                  {validationErrors.mobile && (
                    <p className="mt-1 text-sm text-red-600">
                      {validationErrors.mobile}
                    </p>
                  )}
                </div>

                <div>
                  <Label
                    htmlFor="email"
                    className="text-sm font-medium text-gray-700"
                  >
                    Email (Optional)
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter email address"
                      value={guestData.email}
                      onChange={(e) =>
                        handleGuestDataChange("email", e.target.value)
                      }
                      className={`pl-10 ${
                        validationErrors.email
                          ? "border-red-500 focus:border-red-500"
                          : ""
                      }`}
                    />
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  </div>
                  {validationErrors.email && (
                    <p className="mt-1 text-sm text-red-600">
                      {validationErrors.email}
                    </p>
                  )}
                </div>

                <div>
                  <Label
                    htmlFor="booking_type"
                    className="text-sm font-medium text-gray-700"
                  >
                    Booking Type
                  </Label>
                  <div className="mt-1">
                    <Select
                      onValueChange={(value) =>
                        handleBookingDataChange("booking_type", value)
                      }
                      value={bookingData.booking_type}
                    >
                      <SelectTrigger id="booking_type">
                        <SelectValue placeholder="Select booking type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Advance">Advance</SelectItem>
                        <SelectItem value="Walk-in">Walk-in</SelectItem>
                        <SelectItem value="OTA">OTA</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* Booking & Room Requirements */}
            <div className="mb-8">
              <h3 className="text-base font-medium text-gray-800 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
                <Bed className="w-4 h-4 text-blue-600" />
                Booking & Room Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label
                    htmlFor="checkin_date"
                    className="text-sm font-medium text-gray-700"
                  >
                    Check-in Date & Time <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      id="checkin_date"
                      type="datetime-local"
                      value={formatToLocalDateTime(bookingData.checkin_date)}
                      onChange={(e) =>
                        handleBookingDataChange(
                          "checkin_date",
                          parseLocalDateTime(e.target.value)
                        )
                      }
                      className="pl-10"
                      min={formatToLocalDateTime(new Date().setHours(0, 0, 0, 0))}
                      required
                    />
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Check-in date cannot be in the past
                  </p>
                </div>

                <div>
                  <Label
                    htmlFor="checkout_date"
                    className="text-sm font-medium text-gray-700"
                  >
                    Check-out Date & Time{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      id="checkout_date"
                      type="datetime-local"
                      value={formatToLocalDateTime(bookingData.checkout_date)}
                      onChange={(e) =>
                        handleBookingDataChange(
                          "checkout_date",
                          parseLocalDateTime(e.target.value)
                        )
                      }
                      className="pl-10"
                      min={
                        bookingData.checkin_date
                          ? formatToLocalDateTime(bookingData.checkin_date)
                          : formatToLocalDateTime(new Date().setHours(0, 0, 0, 0))
                      }
                      required
                    />
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Check-out date must be after check-in date
                  </p>
                  {validationErrors.dates && (
                    <p className="mt-1 text-sm text-red-600">
                      {validationErrors.dates}
                    </p>
                  )}
                </div>

                <div>
                  <Label
                    htmlFor="no_of_rooms"
                    className="text-sm font-medium text-gray-700"
                  >
                    Number of Rooms <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      id="no_of_rooms"
                      type="number"
                      min="1"
                      placeholder="1"
                      value={bookingData.no_of_rooms}
                      onChange={(e) => handleRoomsCountChange(e.target.value)}
                      onBlur={() => {
                        if (
                          !bookingData.no_of_rooms ||
                          parseInt(bookingData.no_of_rooms, 10) < 1
                        ) {
                          handleRoomsCountChange(1);
                        }
                      }}
                      className={`pl-10 ${
                        validationErrors.no_of_rooms
                          ? "border-red-500 focus:border-red-500"
                          : ""
                      }`}
                      required
                    />
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  </div>
                  {validationErrors.no_of_rooms && (
                    <p className="mt-1 text-sm text-red-600">
                      {validationErrors.no_of_rooms}
                    </p>
                  )}
                </div>

                <div>
                  <Label
                    htmlFor="no_of_persons"
                    className="text-sm font-medium text-gray-700"
                  >
                    Number of Persons <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      id="no_of_persons"
                      type="number"
                      min="1"
                      placeholder="1"
                      value={bookingData.no_of_persons}
                      onChange={(e) =>
                        handleBookingDataChange("no_of_persons", e.target.value)
                      }
                      onBlur={() => {
                        if (
                          !bookingData.no_of_persons ||
                          parseInt(bookingData.no_of_persons, 10) < 1
                        ) {
                          handleBookingDataChange("no_of_persons", 1);
                        }
                      }}
                      className={`pl-10 ${
                        validationErrors.no_of_persons
                          ? "border-red-500 focus:border-red-500"
                          : ""
                      }`}
                      required
                    />
                    <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  </div>
                  {validationErrors.no_of_persons && (
                    <p className="mt-1 text-sm text-red-600">
                      {validationErrors.no_of_persons}
                    </p>
                  )}
                </div>

                <div>
                  <Label
                    htmlFor="remarks"
                    className="text-sm font-medium text-gray-700"
                  >
                    Booking Remarks
                  </Label>
                  <div className="mt-1">
                    <Input
                      id="remarks"
                      placeholder="Special instructions, dietary, or room preferences"
                      value={bookingData.remarks || ""}
                      onChange={(e) =>
                        handleBookingDataChange("remarks", e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label
                      htmlFor="pickup_details"
                      className="text-sm font-medium text-gray-700"
                    >
                      Pick Up Details <span className="text-gray-400 text-xs font-normal">(Optional)</span>
                    </Label>
                    <div className="mt-1">
                      <Input
                        id="pickup_details"
                        placeholder="Airport/Station, Flight/Train No, Time"
                        value={bookingData.pickup_details || ""}
                        onChange={(e) =>
                          handleBookingDataChange("pickup_details", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <Label
                      htmlFor="dropoff_details"
                      className="text-sm font-medium text-gray-700"
                    >
                      Drop Off Details <span className="text-gray-400 text-xs font-normal">(Optional)</span>
                    </Label>
                    <div className="mt-1">
                      <Input
                        id="dropoff_details"
                        placeholder="Drop destination, Departure time"
                        value={bookingData.dropoff_details || ""}
                        onChange={(e) =>
                          handleBookingDataChange("dropoff_details", e.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Per-Room Categories & Room Number Configuration */}
                <div className="md:col-span-2 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-1 pb-1 border-b border-gray-100">
                    <Label className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                      <Bed className="h-4 w-4 text-blue-600" />
                      {roomsConfig.length > 1
                        ? `Configure Categories & Room Numbers for ${roomsConfig.length} Rooms`
                        : "Room Details"}
                    </Label>
                    {roomsConfig.length > 1 && (
                      <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        Each room can have a different category
                      </span>
                    )}
                  </div>

                  <div className="space-y-3">
                    {roomsConfig.map((roomItem, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 bg-blue-50/40 border border-blue-200 rounded-lg space-y-2.5 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-blue-900 bg-blue-200/70 px-2.5 py-0.5 rounded">
                            Room {idx + 1}
                          </span>
                          {roomItem.room_id ? (
                            <span className="text-xs text-green-700 font-semibold bg-green-50 px-2 py-0.5 rounded border border-green-200">
                              ✓ Assigned: Room {roomItem.room_number}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-500">
                              Unassigned (Will assign at Check-In)
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs font-medium text-gray-700">
                              Room Category <span className="text-red-500">*</span>
                            </Label>
                            <div className="relative mt-1">
                              <Select
                                value={roomItem.room_category || ""}
                                onValueChange={(val) =>
                                  handleRoomConfigChange(idx, "room_category", val)
                                }
                              >
                                <SelectTrigger className="pl-9 h-9 bg-white">
                                  <SelectValue placeholder="Select category for this room" />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableCategories.map((cat) => (
                                    <SelectItem key={cat} value={cat}>
                                      {cat}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Bed className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                            </div>
                          </div>

                          <div>
                            <Label className="text-xs font-medium text-gray-700">
                              Assign Room Number{" "}
                              <span className="text-gray-400 font-normal">
                                (Optional)
                              </span>
                            </Label>
                            <div className="mt-1">
                              <Select
                                value={roomItem.room_id || "none"}
                                onValueChange={(val) =>
                                  handleRoomConfigChange(idx, "room_id", val)
                                }
                                disabled={!roomItem.room_category}
                              >
                                <SelectTrigger className="h-9 bg-white">
                                  <SelectValue
                                    placeholder={
                                      roomItem.room_category
                                        ? "Assign later at Check-In"
                                        : "Select category first"
                                    }
                                  />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">
                                    Assign later at Check-In
                                  </SelectItem>
                                  {getAvailableRoomsForRoomIndex(
                                    idx,
                                    roomItem.room_category
                                  ).map((r) => (
                                    <SelectItem key={r.room_id} value={r.room_id}>
                                      Room {r.room_number} - ₹{r.tariff} (
                                      {r.room_type})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {validationErrors.room_category && (
                    <p className="mt-1 text-sm text-red-600">
                      {validationErrors.room_category}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">
                What happens next?
              </h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>
                  • A basic booking will be created with room category, room count, and guest requirements
                </li>
                <li>
                  • Complete guest details will be collected during check-in
                </li>
                <li>
                  • Specific room number assignment and rate plan selection will be finalized at check-in
                </li>
                <li>
                  • Payment details and additional preferences will be processed
                </li>
              </ul>
            </div>

              {/* Action Button */}
              <div className="flex justify-end mt-6">
                <Button
                  onClick={handleSubmit}
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={loading || isValidating}
                >
                  {loading || isValidating ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      {isValidating ? "Validating..." : "Creating Booking..."}
                    </div>
                  ) : (
                    "Create Basic Booking"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
};

export default NewBooking;
