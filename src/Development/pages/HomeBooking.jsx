import { useState } from "react";
import { Button } from "../components/ui/button.js";
import { Input } from "../components/ui/input.js";
import { Label } from "../components/ui/label.js";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select.js";
import { Calendar, User, Phone, Mail, ArrowLeft } from "lucide-react";
import { useAppContext } from "../context/AppContext.jsx";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { product } from "../../Operation/data.json";

const HomeBooking = () => {
  const {
    createGuest,
    createBooking,
    loading,
    error,
    setError,
    fetchBookings,
    fetchGuests,
  } = useAppContext();
  const navigate = useNavigate();

  // Validation states
  const [validationErrors, setValidationErrors] = useState({});
  const [isValidating, setIsValidating] = useState(false);

  // Helper function to format timestamp to local datetime-local string
  const formatToLocalDateTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60 * 1000);
    return localDate.toISOString().slice(0, 16);
  };

  // Helper function to convert local datetime-local string to timestamp
  const parseLocalDateTime = (dateTimeString) => {
    if (!dateTimeString) return null;
    return new Date(dateTimeString).getTime();
  };

  // Validation functions
  const validateEmail = (email) => {
    if (!email) return true; // Email is optional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateMobile = (mobile) => {
    if (!mobile) return false; // Mobile is required
    const mobileRegex = /^[6-9]\d{9}$/; // Indian mobile number format
    return mobileRegex.test(mobile.replace(/\s+/g, ""));
  };

  const validateName = (name) => {
    if (!name) return false;
    const nameRegex = /^[a-zA-Z\s.]{2,50}$/;
    return nameRegex.test(name.trim());
  };

  const validateBookingDates = () => {
    if (!bookingData.checkin_date || !bookingData.checkout_date) {
      return {
        isValid: false,
        error: "Both check-in and check-out dates are required",
      };
    }

    const now = new Date();
    const checkinDate = new Date(bookingData.checkin_date);
    const checkoutDate = new Date(bookingData.checkout_date);

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
      default:
        break;
    }

    setValidationErrors((prev) => ({
      ...prev,
      [fieldName]: error,
    }));

    return !error;
  };

  const [guestData, setGuestData] = useState({
    full_name: "",
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
    room_type: "",
    no_of_adults: 1,
    no_of_children: 0,
    discount: 0,
    booking_source: "Direct",
    remarks: "",
    special_requests: "",
    status: "Reserved",
    rate_plan_id: "",
  });

  const handleGuestDataChange = (field, value) => {
    setGuestData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Validate field on change
    validateField(field, value);
  };

  const handleBookingDataChange = (field, value) => {
    setBookingData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Validate dates when either date changes
    if (field === "checkin_date" || field === "checkout_date") {
      setTimeout(() => {
        const dateValidation = validateBookingDates();
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

    // Validate all fields before submission
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

    // Check required fields
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

    if (hasErrors) {
      toast.error("Please fix all validation errors before proceeding", {
        duration: 5000,
      });
      setIsValidating(false);
      return;
    }

    try {
      // Create guest with basic information
      const guestId = await createGuest({ guestData });
      if (!guestId) {
        toast.error("Failed to create guest. Please try again.", {
          duration: 5000,
        });
        return;
      }

      // Create booking with basic information
      const bookingWithGuestId = {
        ...bookingData,
        guest_id: guestId,
        remarks:
          bookingData.remarks ||
          "Basic booking - details to be completed during check-in",
        special_requests: bookingData.special_requests || "Pending",
      };

      await createBooking({ bookingData: bookingWithGuestId });
      toast.success(
        "Booking created successfully! Guest can now be checked in."
      );
      navigate("/");
    } catch (error) {
      toast.error("An error occurred while creating the booking", {
        duration: 5000,
      });
    } finally {
      fetchBookings();
      fetchGuests();
      setIsValidating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-8 inter">
      <Button onClick={() => navigate(-1)} className="cursor-pointer">
        <ArrowLeft />
        Back
      </Button>
      <div className="p-6 max-sm:p-0">
        <div className="bg-white rounded-lg shadow-sm">
          {/* Form Header */}
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-medium text-gray-800">
              Create New Booking
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Enter basic guest information. Complete details will be collected
              during check-in.
            </p>
          </div>

          {/* Form Content */}
          <div className="p-6">
            <div className="mb-8">
              <h3 className="text-base font-medium text-gray-800 mb-4">
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
                  <Select
                    onValueChange={(value) =>
                      handleBookingDataChange("booking_type", value)
                    }
                    value={bookingData.booking_type}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select booking type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Advance">Advance</SelectItem>
                      <SelectItem value="Walk-in">Walk-in</SelectItem>
                      <SelectItem value="OTA">OTA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

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
                      min={new Date().toISOString().slice(0, 16)}
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
                          : new Date().toISOString().slice(0, 16)
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
              </div>

              {/* Info Box */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">
                  What happens next?
                </h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>
                    • A basic booking will be created with the provided
                    information
                  </li>
                  <li>
                    • Complete guest details will be collected during check-in
                  </li>
                  <li>
                    • Room assignment and rate plan selection will be done at
                    check-in
                  </li>
                  <li>
                    • Payment details and additional preferences will be
                    finalized
                  </li>
                </ul>
              </div>

              {/* Action Button */}
              <div className="flex justify-end mt-6">
                <Button
                  onClick={handleSubmit}
                  className="bg-blue-600 hover:bg-blue-700 cursor-pointer"
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
    </div>
  );
};

export default HomeBooking;
