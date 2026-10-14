import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { toast } from "sonner";
import { Input } from "../../../../../components/ui/input.js";
import { Label } from "../../../../../components/ui/label.js";
import { Button } from "../../../../../components/ui/button.js";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../../components/ui/select.js";
import { Checkbox } from "../../../../../components/ui/checkbox.js";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../../../components/ui/dialog.js";
import {
  User,
  Phone,
  Upload,
  X,
  Calendar,
  Users,
  Building,
  CreditCard as CreditCardIcon,
  Clock,
  Bed,
  PlusCircle,
  Plus,
  Search,
} from "lucide-react";
import { useAppContext } from "../../../../../context/AppContext.jsx";

const CheckInForm = ({
  checkInData,
  handleInputChange,
  validationErrors,
  formatToLocalDateTime,
  parseLocalDateTime,
  getVacantRooms,
  staffs,
  ratePlans,
  numberOfNights,
  onRoomSelectionChange,
  nextGrcNumber,
  nextCheckInNumber,
  nextBillNumber,
  bills = [],
  guests: propGuests = [],
  selectedBooking,
}) => {
  const {
    companies = [],
    createCompany,
    guests: contextGuests = [],
    rooms = [],
  } = useAppContext?.() || {
    companies: [],
    createCompany: null,
    guests: [],
    rooms: [],
  };

  // Auto-create company control
  const [isAutoCreatingCompany, setIsAutoCreatingCompany] = useState(false);

  // Create Company Dialog state
  const [isCreateCompanyOpen, setIsCreateCompanyOpen] = useState(false);
  const [newCompany, setNewCompany] = useState({
    name: "",
    gst_no: "",
  });
  const [isCreatingCompany, setIsCreatingCompany] = useState(false);
  const [createCompanyError, setCreateCompanyError] = useState("");

  // Helpers to sanitize guest data from history/bills
  const cleanMobileNumber = useCallback((val) => {
    if (!val) return "";
    const d = String(val).replace(/\D/g, "");
    if (d.length === 12 && d.startsWith("91")) return d.slice(2);
    if (d.length === 11 && d.startsWith("0")) return d.slice(1);
    if (d.length > 10) return d.slice(-10);
    return d;
  }, []);

  const cleanEmail = useCallback((val) => {
    if (!val) return "";
    const str = String(val).trim();
    if (["n/a", "na", "-", "--", "none", "nil", "null", "undefined"].includes(str.toLowerCase())) {
      return "";
    }
    return str;
  }, []);

  const cleanPincode = useCallback((val) => {
    if (!val) return "";
    const str = String(val).trim();
    if (["n/a", "na", "-", "--", "none", "nil", "null", "undefined"].includes(str.toLowerCase())) {
      return "";
    }
    const match = str.match(/\b\d{6}\b/);
    if (match) return match[0];
    const d = str.replace(/\D/g, "");
    if (d.length === 6) return d;
    return str;
  }, []);

  // ── Guest auto-suggestion from bills and existing guest records ──
  const [guestQuery, setGuestQuery] = useState("");
  const [showGuestSuggestions, setShowGuestSuggestions] = useState(false);
  const guestSuggestionRef = useRef(null);

  // Extract unique guests from both database guests and bills data for auto-suggestion
  const billGuests = useMemo(() => {
    const guestMap = new Map();

    const dbGuests = (propGuests && propGuests.length > 0) ? propGuests : (contextGuests || []);
    if (Array.isArray(dbGuests)) {
      dbGuests.forEach((g) => {
        const name = g.full_name || g.guest_name || "";
        const mobile = g.mobile || g.phone || "";
        if (!name.trim()) return;
        const cleanPhone = cleanMobileNumber(mobile);
        const key = `${name.trim().toLowerCase()}_${cleanPhone}`;
        if (!guestMap.has(key)) {
          guestMap.set(key, {
            guest_id: g.guest_id || g.id || "",
            full_name: name.trim(),
            mobile: cleanPhone || (mobile ? String(mobile).trim() : ""),
            email: cleanEmail(g.email),
            gender: g.gender || "",
            id_proof_type: g.id_proof_type || g.idProofType || "",
            id_proof_number: g.id_proof_number || g.idProofNumber || "",
            nationality: g.nationality || "Indian",
            address: g.address || "",
            city: g.city || "",
            state: g.state || "",
            country: g.country || "India",
            pincode: cleanPincode(g.pincode || g.pinCode),
            guest_category: g.guest_category || g.guestCategory || "Regular",
            marital_status: g.marital_status || g.maritalStatus || "Unmarried",
          });
        }
      });
    }

    if (Array.isArray(bills)) {
      bills.forEach((billWrapper) => {
        const bill = billWrapper?.bill || billWrapper;
        const gd = bill?.guestDetails || {};
        const name = gd.guestName || gd.full_name || gd.guest_name || "";
        const mobile = gd.mobile || gd.phone || "";
        if (!name.trim()) return;
        const cleanPhone = cleanMobileNumber(mobile);
        const key = `${name.trim().toLowerCase()}_${cleanPhone}`;
        if (!guestMap.has(key)) {
          guestMap.set(key, {
            guest_id: gd.guest_id || gd.guestId || "",
            full_name: name.trim(),
            mobile: cleanPhone || (mobile ? String(mobile).trim() : ""),
            email: cleanEmail(gd.email),
            gender: gd.gender || "",
            id_proof_type: gd.idProofType || gd.id_proof_type || "",
            id_proof_number: gd.idProofNumber || gd.id_proof_number || "",
            nationality: gd.nationality || "Indian",
            address: gd.address || "",
            city: gd.city || "",
            state: gd.state || "",
            country: gd.country || "India",
            pincode: cleanPincode(gd.pinCode || gd.pincode),
            guest_category: gd.guest_category || gd.guestCategory || "Regular",
            marital_status: gd.marital_status || gd.maritalStatus || "Unmarried",
          });
        }
      });
    }

    return Array.from(guestMap.values());
  }, [bills, propGuests, contextGuests, cleanMobileNumber, cleanEmail, cleanPincode]);

  // Filter guest suggestions based on query
  const filteredGuestSuggestions = useMemo(() => {
    const q = guestQuery.trim().toLowerCase();
    if (!q || q.length < 2) return [];
    return billGuests
      .filter(
        (g) =>
          g.full_name.toLowerCase().includes(q) ||
          g.mobile.includes(q)
      )
      .slice(0, 8);
  }, [billGuests, guestQuery]);

  // Handle selecting a guest suggestion – auto-fill all details
  const handleGuestSuggestionSelect = useCallback((guest) => {
    setGuestQuery(guest.full_name);
    setShowGuestSuggestions(false);

    const cleanedMobile = cleanMobileNumber(guest.mobile) || guest.mobile || "";
    const cleanedEmail = cleanEmail(guest.email) || guest.email || "";
    const cleanedPincode = cleanPincode(guest.pincode) || guest.pincode || "";

    // Auto-fill all guest fields in one batch update
    handleInputChange({
      full_name: guest.full_name || "",
      mobile: cleanedMobile,
      email: cleanedEmail || "",
      gender: guest.gender || "Male",
      id_proof_type: guest.id_proof_type || "",
      id_proof_number: guest.id_proof_number || "",
      nationality: guest.nationality || "Indian",
      address: guest.address || "",
      city: guest.city || "",
      state: guest.state || "",
      country: guest.country || "India",
      pincode: cleanedPincode || "",
      guest_category: guest.guest_category || "Regular",
      marital_status: guest.marital_status || "Unmarried",
      ...(guest.guest_id ? { guest_id: guest.guest_id } : {}),
    });
  }, [handleInputChange, cleanMobileNumber, cleanEmail, cleanPincode]);

  // Handle name input change for guest suggestion
  const handleNameInputChange = useCallback((value) => {
    setGuestQuery(value);
    handleInputChange("full_name", value);
    setShowGuestSuggestions(value.trim().length >= 2);
  }, [handleInputChange]);

  // Close guest suggestions on outside click
  useEffect(() => {
    const handler = (e) => {
      if (
        guestSuggestionRef.current &&
        !guestSuggestionRef.current.contains(e.target)
      ) {
        setShowGuestSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Keep guestQuery in sync if full_name changes externally (e.g. booking selection)
  useEffect(() => {
    if (checkInData?.full_name !== undefined) {
      setGuestQuery(checkInData.full_name || "");
    }
  }, [checkInData?.full_name]);

  const ErrorMessage = ({ error }) => {
    if (!error) return null;
    return (
      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
        <span className="w-1 h-1 bg-red-500 rounded-full"></span>
        {error}
      </p>
    );
  };

  // Helper to extract date from timestamp (YYYY-MM-DD format)
  const getDateFromTimestamp = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Helper to extract time from timestamp (HH:MM format)
  const getTimeFromTimestamp = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  // Helper to combine date and time into timestamp
  const combineDateAndTime = (dateString, timeString) => {
    if (!dateString || !timeString) return null;
    const dateTimeString = `${dateString}T${timeString}`;
    return new Date(dateTimeString).getTime();
  };

  // Helper to normalize company object properties
  const getCompanyName = (c) =>
    c?.name || c?.company_name || c?.companyName || "";
  const getCompanyId = (c) => c?.company_id || c?.id || c?.companyId;
  const getCompanyGst = (c) => c?.gst_no || c?.gst_number || c?.gstNo || "";
  const findCompanyByName = (name) => {
    if (!name) return null;
    const q = String(name).trim().toLowerCase();
    return companies.find((cc) => getCompanyName(cc)?.toLowerCase() === q) || null;
  };
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

  // Company field (autocomplete) state/behavior
  const [companyQuery, setCompanyQuery] = useState("");
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const companyFieldRef = useRef(null);

  // Initialize/keep input text in sync when company_id changes
  useEffect(() => {
    if (checkInData?.company_id) {
      const name = getCompanyNameById(checkInData.company_id);
      const gst = getCompanyGstById(checkInData.company_id);

      if (name) setCompanyQuery(name);
      if (name) handleInputChange("company_name", name);

      // Auto-fill GST field if company has GST number and current GST field is empty
      if (gst && !checkInData.gst_no) {
        handleInputChange("gst_no", gst);
      }
    }
  }, [checkInData?.company_id, companies]);

  // Close suggestions on outside click
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

  const filteredCompanies = useMemo(() => {
    const q = companyQuery.trim().toLowerCase();
    if (!q) return []; // don't show anything when empty
    return companies
      .filter((c) => getCompanyName(c).toLowerCase().includes(q))
      .slice(0, 8);
  }, [companies, companyQuery]);

  const handleCompanySelect = (company) => {
    const name = getCompanyName(company);
    const id = getCompanyId(company);
    const gst = getCompanyGst(company);

    setCompanyQuery(name);
    setShowCompanyDropdown(false);
    handleInputChange("company_id", id);
    handleInputChange("company_name", name);

    // Auto-fill GST field when company is selected
    if (gst) {
      handleInputChange("gst_no", gst);
    }
  };

  const attemptAutoCreateCompany = async () => {
    const typedName = (companyQuery || "").trim();
    const gst = (checkInData?.gst_no || "").trim();
    if (!typedName || !gst) return;
    // Already selected a company id
    if (checkInData?.company_id) return;
    // If a matching company by name already exists, select it instead
    const existing = findCompanyByName(typedName);
    if (existing) {
      handleCompanySelect(existing);
      return;
    }
    // Only proceed if API available and not already running
    if (typeof createCompany !== "function" || isAutoCreatingCompany) return;
    try {
      setIsAutoCreatingCompany(true);
      const created = await createCompany({ name: typedName, gst_no: gst });
      if (created) {
        handleCompanySelect(created);
      }
    } catch (e) {
      // Silent fail: keep user input as-is
      console.error("Auto-create company (check-in) failed:", e);
    } finally {
      setIsAutoCreatingCompany(false);
    }
  };

  const clearSelectedCompany = () => {
    setCompanyQuery("");
    handleInputChange("company_id", "");
    handleInputChange("company_name", "");
    // Optionally clear GST field when company is cleared
    handleInputChange("gst_no", "");
    setShowCompanyDropdown(false);
  };

  const handleCompanyInputChange = (value) => {
    setCompanyQuery(value);
    setShowCompanyDropdown(!!value.trim());
    handleInputChange("company_name", value);
    if (checkInData?.company_id) {
      handleInputChange("company_id", "");
      // Clear GST when user starts typing a new company
      handleInputChange("gst_no", "");
    }
  };

  const formatIdentifierValue = (value) => {
    if (value === null || value === undefined) return "—";
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : "—";
  };

  // Create Company Dialog handlers
  const handleCreateCompany = async () => {
    // Reset any previous errors
    setCreateCompanyError("");

    // Validate required fields
    if (!newCompany.name.trim()) {
      setCreateCompanyError("Company name is required");
      return;
    }

    // Check if createCompany function is available
    if (!createCompany || typeof createCompany !== 'function') {
      setCreateCompanyError("Company creation is not available");
      return;
    }

    setIsCreatingCompany(true);

    try {
      // Call createCompany from AppContext with the company data
      const createdCompany = await createCompany({
        name: newCompany.name.trim(),
        gst_no: newCompany.gst_no.trim(),
      });

      // Check if company was created successfully
      if (createdCompany) {
        // Automatically select the newly created company (this will auto-fill GST too)
        handleCompanySelect(createdCompany);

        // Reset form and close dialog
        setNewCompany({ name: "", gst_no: "" });
        setIsCreateCompanyOpen(false);
        setCreateCompanyError("");

        // Optional: Show success message
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
    // Pre-fill with search query and reset error
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

  // ... (rest of your existing handlers remain the same)
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      handleInputChange("id_proof_image_url", url);
    }
  };

  const handleRoomSelection = (roomId) => {
    const currentSelectedRoomIds = checkInData.room_id || [];
    const targetRoom = (rooms || []).find(
      (r) => String(r.room_id) === String(roomId) || String(r.id) === String(roomId)
    );

    if (targetRoom && targetRoom.status === "Dirty") {
      toast.warning(
        `Room ${targetRoom.room_number || ""} is currently Dirty. Please mark it as Vacant / Clean first before check-in.`
      );
      return;
    }

    if (!currentSelectedRoomIds.includes(roomId)) {
      const updatedRoomIds = [...currentSelectedRoomIds, roomId];
      handleInputChange("room_id", updatedRoomIds);

      if (onRoomSelectionChange) {
        const allKnownRooms = rooms && rooms.length > 0 ? rooms : getVacantRooms;
        const selectedRooms = allKnownRooms.filter((room) =>
          updatedRoomIds.includes(room.room_id)
        );
        const totalTariff = selectedRooms.reduce(
          (total, room) => total + (room.tariff || 0),
          0
        );
        onRoomSelectionChange(updatedRoomIds, totalTariff);
      }
    }
  };

  const removeRoom = (roomId) => {
    const currentSelectedRoomIds = checkInData.room_id || [];
    const updatedRoomIds = currentSelectedRoomIds.filter((id) => id !== roomId);
    handleInputChange("room_id", updatedRoomIds);

    if (onRoomSelectionChange) {
      const allKnownRooms = rooms && rooms.length > 0 ? rooms : getVacantRooms;
      const selectedRooms = allKnownRooms.filter((room) =>
        updatedRoomIds.includes(room.room_id)
      );
      const totalTariff = selectedRooms.reduce(
        (total, room) => total + (room.tariff || 0),
        0
      );
      onRoomSelectionChange(updatedRoomIds, totalTariff);
    }
  };

  const isRoomSelected = (roomId) => {
    const selectedRoomIds = checkInData.room_id || [];
    return selectedRoomIds.includes(roomId);
  };

  const getSelectedRooms = () => {
    const selectedRoomIds = checkInData.room_id || [];
    const allKnownRooms = rooms && rooms.length > 0 ? rooms : getVacantRooms;
    return allKnownRooms.filter((room) =>
      selectedRoomIds.includes(room.room_id)
    );
  };

  const getAvailableRooms = () => {
    const selectedRoomIds = checkInData.room_id || [];
    return getVacantRooms.filter(
      (room) => !selectedRoomIds.includes(room.room_id)
    );
  };

  const getTotalRoomTariff = () => {
    const selectedRooms = getSelectedRooms();
    return selectedRooms.reduce((total, room) => total + (room.tariff || 0), 0);
  };

  const getSelectedRoomsCount = () => {
    return checkInData.room_id ? checkInData.room_id.length : 0;
  };

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
    return Array.from(new Set([...dynamicCategories, ...standardCategories]));
  }, [rooms]);

  const targetCategory = useMemo(() => {
    return (
      selectedBooking?.room_category ||
      selectedBooking?.room_type ||
      checkInData?.room_type ||
      ""
    ).trim();
  }, [selectedBooking, checkInData?.room_type]);

  const targetCategories = useMemo(() => {
    const list = [];
    if (selectedBooking?.rooms_config && Array.isArray(selectedBooking.rooms_config)) {
      selectedBooking.rooms_config.forEach((r) => {
        if (r.room_category && typeof r.room_category === "string" && !list.includes(r.room_category.trim())) {
          list.push(r.room_category.trim());
        }
      });
    }
    if (targetCategory) {
      targetCategory.split(",").forEach((c) => {
        const trimmed = c.trim();
        if (trimmed && !list.includes(trimmed)) {
          list.push(trimmed);
        }
      });
    }
    return list;
  }, [selectedBooking, targetCategory]);

  const bookedRoomsCount = useMemo(() => {
    return (
      selectedBooking?.no_of_rooms ||
      selectedBooking?.number_of_rooms ||
      (selectedBooking?.rooms_config ? selectedBooking.rooms_config.length : 1) ||
      1
    );
  }, [selectedBooking]);

  const bookedPersonsCount = useMemo(() => {
    return (
      selectedBooking?.no_of_persons ||
      selectedBooking?.no_of_adults ||
      checkInData?.no_of_adults ||
      1
    );
  }, [selectedBooking, checkInData?.no_of_adults]);

  const matchingVacantRooms = useMemo(() => {
    if (!targetCategories.length || !getVacantRooms) return [];
    return getVacantRooms.filter((room) =>
      targetCategories.some(
        (cat) => (room.room_type || "").toLowerCase() === cat.toLowerCase()
      )
    );
  }, [getVacantRooms, targetCategories]);

  const getSortedAvailableRooms = () => {
    const available = getAvailableRooms();
    if (!targetCategories.length) return available;
    return [...available].sort((a, b) => {
      const aMatch = targetCategories.some(
        (cat) => (a.room_type || "").toLowerCase() === cat.toLowerCase()
      );
      const bMatch = targetCategories.some(
        (cat) => (b.room_type || "").toLowerCase() === cat.toLowerCase()
      );
      if (aMatch && !bMatch) return -1;
      if (!aMatch && bMatch) return 1;
      return 0;
    });
  };

  // PAX management for Check-In form
  const addPax = () => {
    const defaultRoomId = (checkInData?.room_id && checkInData.room_id[0]) || "";
    const newPax = { full_name: "", gender: "", age: "", extra_pax_amount: 0, room_id: defaultRoomId };
    const updated = [...(checkInData?.extra_pax || []), newPax];
    handleInputChange("extra_pax", updated);
  };
  const updatePaxField = (index, field, value) => {
    const current = [...(checkInData?.extra_pax || [])];
    current[index] = { ...current[index], [field]: value };
    handleInputChange("extra_pax", current);
  };

  // Auto-adjust PAX room assignment when room selection changes
  useEffect(() => {
    if (!Array.isArray(checkInData?.extra_pax)) return;
    const validRoomIds = checkInData?.room_id || [];
    const adjusted = checkInData.extra_pax.map(p => {
      if (!p) return p;
      const paxRoomId = p.room_id;
      if (!paxRoomId || !validRoomIds.includes(paxRoomId)) {
        return { ...p, room_id: validRoomIds[0] || "" };
      }
      return p;
    });
    // Only update if changed
    if (JSON.stringify(adjusted) !== JSON.stringify(checkInData.extra_pax)) {
      handleInputChange("extra_pax", adjusted);
    }
  }, [checkInData?.room_id]);

  // Recalculate discount when discount type changes or room selection changes
  useEffect(() => {
    if (checkInData.discount_type === "percentage" && checkInData.discount_input > 0) {
      const totalRoomCost = getTotalRoomTariff();
      const discountInRupees = (totalRoomCost * parseFloat(checkInData.discount_input || 0)) / 100;
      handleInputChange("discount", discountInRupees);
    }
  }, [checkInData?.discount_type, checkInData?.discount_input, checkInData?.room_id]);
  const removePax = (index) => {
    const current = [...(checkInData?.extra_pax || [])];
    current.splice(index, 1);
    handleInputChange("extra_pax", current);
  };

  return (
    <form autoComplete="off" onSubmit={(e) => e.preventDefault()}>
    <div className="space-y-8">
      {/* Guest Details Section */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <User className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">
                Guest Details
              </h3>
              <p className="text-xs text-gray-600">
                Enter the guest's personal information
              </p>
            </div>
          </div>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1 relative" ref={guestSuggestionRef}>
              <Label className="text-xs font-medium text-gray-700 flex items-center gap-1">
                <User className="h-3 w-3 text-gray-500" />
                Full Name <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                  <Input
                    name="guest_fullname_nop"
                    placeholder="Enter full name"
                    value={guestQuery}
                    onChange={(e) => handleNameInputChange(e.target.value)}
                    onFocus={() => {
                      if (guestQuery.trim().length >= 2) {
                        setShowGuestSuggestions(true);
                      }
                    }}
                    className={`h-8 text-sm pr-8 ${validationErrors.full_name
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                        : "focus:border-blue-500 focus:ring-blue-500"
                      } transition-colors duration-200`}
                    required
                    autoComplete="new-password"
                  />
                {billGuests.length > 0 && (
                  <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                )}
              </div>
              {/* Guest Auto-Suggestion Dropdown */}
              {showGuestSuggestions && filteredGuestSuggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                  <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100 bg-gray-50/60">
                    Past Guests
                  </div>
                  {filteredGuestSuggestions.map((guest, index) => (
                    <button
                      key={`${guest.full_name}_${guest.mobile}_${index}`}
                      type="button"
                      className="w-full px-3 py-2 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none transition-colors duration-150 border-b border-gray-50 last:border-b-0 flex items-center gap-3"
                      onClick={() => handleGuestSuggestionSelect(guest)}
                    >
                      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="h-3.5 w-3.5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {guest.full_name}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Phone className="h-2.5 w-2.5" />
                          {guest.mobile || "No phone"}
                          {guest.city && (
                            <span className="text-gray-300"> • {guest.city}</span>
                          )}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              <ErrorMessage error={validationErrors.full_name} />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium text-gray-700 flex items-center gap-1">
                <Phone className="h-3 w-3 text-gray-500" />
                Mobile Number <span className="text-red-500">*</span>
              </Label>
              <Input
                name="guest_mobile_nop"
                placeholder="Enter mobile number"
                value={checkInData.mobile || ""}
                onChange={(e) => handleInputChange("mobile", e.target.value)}
                className={`h-8 text-sm ${validationErrors.mobile
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                    : "focus:border-blue-500 focus:ring-blue-500"
                  } transition-colors duration-200`}
                required
                autoComplete="new-password"
              />
              <ErrorMessage error={validationErrors.mobile} />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium text-gray-700 flex items-center gap-1">
                <Users className="h-3 w-3 text-gray-500" />
                Gender <span className="text-red-500">*</span>
              </Label>
              <Select
                onValueChange={(value) => handleInputChange("gender", value)}
                value={checkInData.gender || ""}
              >
                <SelectTrigger
                  className={`h-8 text-sm ${validationErrors.gender
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : "focus:border-blue-500 focus:ring-blue-500"
                    } transition-colors duration-200`}
                >
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              <ErrorMessage error={validationErrors.gender} />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium text-gray-700 flex items-center gap-1">
                <CreditCardIcon className="h-3 w-3 text-gray-500" />
                ID Proof Type <span className="text-red-500">*</span>
              </Label>
              <Select
                onValueChange={(value) =>
                  handleInputChange("id_proof_type", value)
                }
                value={checkInData.id_proof_type || ""}
              >
                <SelectTrigger
                  className={`h-8 text-sm ${validationErrors.id_proof_type
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : "focus:border-blue-500 focus:ring-blue-500"
                    } transition-colors duration-200`}
                >
                  <SelectValue placeholder="Select ID type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Aadhar">Aadhar Card</SelectItem>
                  <SelectItem value="PAN">PAN Card</SelectItem>
                  <SelectItem value="Passport">Passport</SelectItem>
                  <SelectItem value="Driving License">
                    Driving License
                  </SelectItem>
                  <SelectItem value="Voter ID">Voter ID</SelectItem>
                </SelectContent>
              </Select>
              <ErrorMessage error={validationErrors.id_proof_type} />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium text-gray-700">
                ID Proof Number <span className="text-red-500">*</span>
              </Label>
              <Input
                name="guest_idproof_nop"
                placeholder="Enter ID number"
                value={checkInData.id_proof_number || ""}
                onChange={(e) =>
                  handleInputChange("id_proof_number", e.target.value)
                }
                className={`h-8 text-sm ${validationErrors.id_proof_number
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                    : "focus:border-blue-500 focus:ring-blue-500"
                  } transition-colors duration-200`}
                autoComplete="new-password"
                required
              />
              <ErrorMessage error={validationErrors.id_proof_number} />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium text-gray-700 flex items-center gap-1">
                <Upload className="h-3 w-3 text-gray-500" />
                ID Proof Image
              </Label>
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="h-8 text-sm focus:border-blue-500 focus:ring-blue-500 transition-colors duration-200"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium text-gray-700">
                Nationality <span className="text-red-500">*</span>
              </Label>
              <Input
                name="guest_nation_nop"
                placeholder="Nationality"
                value={checkInData.nationality || ""}
                onChange={(e) => handleInputChange("nationality", e.target.value)}
                className={`h-8 text-sm ${
                  validationErrors.nationality
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                    : "focus:border-blue-500 focus:ring-blue-500"
                } transition-colors duration-200`}
                autoComplete="new-password"
              />
              <ErrorMessage error={validationErrors.nationality} />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium text-gray-700">
                Address <span className="text-red-500">*</span>
              </Label>
              <Input
                name="guest_address_nop"
                placeholder="Enter full address"
                value={checkInData.address || ""}
                onChange={(e) => handleInputChange("address", e.target.value)}
                className={`h-8 text-sm ${
                  validationErrors.address
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                    : "focus:border-blue-500 focus:ring-blue-500"
                } transition-colors duration-200`}
                autoComplete="new-password"
              />
              <ErrorMessage error={validationErrors.address} />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium text-gray-700">
                City <span className="text-red-500">*</span>
              </Label>
              <Input
                name="guest_city_nop"
                placeholder="Enter city"
                value={checkInData.city || ""}
                onChange={(e) => handleInputChange("city", e.target.value)}
                className={`h-8 text-sm ${
                  validationErrors.city
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                    : "focus:border-blue-500 focus:ring-blue-500"
                } transition-colors duration-200`}
                autoComplete="new-password"
              />
              <ErrorMessage error={validationErrors.city} />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium text-gray-700">
                State <span className="text-red-500">*</span>
              </Label>
              <Input
                name="guest_state_nop"
                placeholder="Enter state"
                value={checkInData.state || ""}
                onChange={(e) => handleInputChange("state", e.target.value)}
                className={`h-8 text-sm ${
                  validationErrors.state
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                    : "focus:border-blue-500 focus:ring-blue-500"
                } transition-colors duration-200`}
                autoComplete="new-password"
              />
              <ErrorMessage error={validationErrors.state} />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium text-gray-700">
                Country <span className="text-red-500">*</span>
              </Label>
              <Input
                name="guest_country_nop"
                placeholder="Enter country"
                value={checkInData.country || ""}
                onChange={(e) => handleInputChange("country", e.target.value)}
                className={`h-8 text-sm ${
                  validationErrors.country
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                    : "focus:border-blue-500 focus:ring-blue-500"
                } transition-colors duration-200`}
                autoComplete="new-password"
              />
              <ErrorMessage error={validationErrors.country} />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium text-gray-700">
                Pincode <span className="text-red-500">*</span>
              </Label>
              <Input
                name="guest_pincode_nop"
                placeholder="Enter pincode"
                value={checkInData.pincode || ""}
                onChange={(e) => handleInputChange("pincode", e.target.value)}
                className={`h-8 text-sm ${validationErrors.pincode
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                    : "focus:border-blue-500 focus:ring-blue-500"
                  } transition-colors duration-200`}
                autoComplete="new-password"
              />
              <ErrorMessage error={validationErrors.pincode} />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium text-gray-700">
                Guest Category <span className="text-red-500">*</span>
              </Label>
              <Select
                onValueChange={(value) =>
                  handleInputChange("guest_category", value)
                }
                value={checkInData.guest_category || ""}
              >
                <SelectTrigger
                  className={`h-8 text-sm ${validationErrors.guest_category
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : "focus:border-blue-500 focus:ring-blue-500"
                    } transition-colors duration-200`}
                >
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VIP">VIP</SelectItem>
                  <SelectItem value="Regular">Regular</SelectItem>
                  <SelectItem value="New">New</SelectItem>
                </SelectContent>
              </Select>
              <ErrorMessage error={validationErrors.guest_category} />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium text-gray-700">
                Marital Status <span className="text-red-500">*</span>
              </Label>
              <Select
                onValueChange={(value) =>
                  handleInputChange("marital_status", value)
                }
                value={checkInData.marital_status || "Unmarried"}
              >
                <SelectTrigger
                  className={`h-8 text-sm ${validationErrors.marital_status
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : "focus:border-blue-500 focus:ring-blue-500"
                    } transition-colors duration-200`}
                >
                  <SelectValue placeholder="Select marital status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Married">Married</SelectItem>
                  <SelectItem value="Unmarried">Unmarried</SelectItem>
                  <SelectItem value="Divorced">Divorced</SelectItem>
                  <SelectItem value="Widowed">Widowed</SelectItem>
                </SelectContent>
              </Select>
              <ErrorMessage error={validationErrors.marital_status} />
            </div>

            {checkInData.marital_status === "Married" && (
              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-700 flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-gray-500" />
                  Anniversary Date
                </Label>
                <Input
                  type="date"
                  value={checkInData.anniversary_date ? checkInData.anniversary_date.split('T')[0] : ""}
                  onChange={(e) => {
                    const dateValue = e.target.value;
                    if (dateValue) {
                      // Convert to ISO string format
                      const isoDate = new Date(dateValue + 'T00:00:00').toISOString();
                      handleInputChange("anniversary_date", isoDate);
                    } else {
                      handleInputChange("anniversary_date", "");
                    }
                  }}
                  className="h-8 text-sm focus:border-blue-500 focus:ring-blue-500 transition-colors duration-200"
                />
                <ErrorMessage error={validationErrors.anniversary_date} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Check-In Details Section */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-green-100 rounded-lg">
              <Calendar className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">
                Check-In Details
              </h3>
              <p className="text-xs text-gray-600">
                Configure booking and room information
              </p>
            </div>
          </div>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label className="text-xs font-medium text-gray-700">
                Check-in Type <span className="text-red-500">*</span>
              </Label>
              <Select
                onValueChange={(value) =>
                  handleInputChange("booking_type", value)
                }
                value={checkInData.booking_type}
              >
                <SelectTrigger
                  className={`h-8 text-sm ${validationErrors.booking_type
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : "focus:border-green-500 focus:ring-green-500"
                    } transition-colors duration-200`}
                >
                  <SelectValue placeholder="Select booking type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Walk-in">Walk-in</SelectItem>
                  <SelectItem value="Advance">Advance</SelectItem>
                </SelectContent>
              </Select>
              <ErrorMessage error={validationErrors.booking_type} />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium text-gray-700">
                Booking Source
              </Label>
              <Select
                onValueChange={(value) =>
                  handleInputChange("booking_source", value)
                }
                value={checkInData.booking_source}
              >
                <SelectTrigger className="h-8 text-sm focus:border-green-500 focus:ring-green-500 transition-colors duration-200">
                  <SelectValue placeholder="Select booking source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Direct">Direct</SelectItem>
                  <SelectItem value="MakemyTrip">MakemyTrip</SelectItem>
                  <SelectItem value="Booking.com">Booking.com</SelectItem>
                  <SelectItem value="Agoda">Agoda</SelectItem>
                  <SelectItem value="Goibibo">Goibibo</SelectItem>
                  <SelectItem value="Yatra">Yatra</SelectItem>
                  <SelectItem value="Cleartrip">Cleartrip</SelectItem>
                  <SelectItem value="OYO">OYO</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium text-gray-700 flex items-center gap-1">
                <Bed className="h-3 w-3 text-gray-500" />
                Room Category {selectedBooking && (selectedBooking.room_category || selectedBooking.room_type) && (
                  <span className="text-[10px] text-blue-600 font-normal">
                    (Booked: {selectedBooking.room_category || selectedBooking.room_type})
                  </span>
                )}
              </Label>
              <Select
                value={checkInData.room_type || targetCategory || ""}
                onValueChange={(value) => handleInputChange("room_type", value)}
              >
                <SelectTrigger className="h-8 text-sm focus:border-green-500 focus:ring-green-500 transition-colors duration-200">
                  <SelectValue placeholder="Select room category" />
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

            <div className="space-y-1">
              <Label className="text-xs font-medium text-gray-700 flex items-center gap-1">
                <Users className="h-3 w-3 text-gray-500" />
                Number of Adults <span className="text-red-500">*</span>
              </Label>
              <Input
                type="number"
                min="1"
                max="10"
                value={checkInData.no_of_adults || ""}
                onChange={(e) =>
                  handleInputChange("no_of_adults", parseInt(e.target.value) || 0)
                }
                className={`h-8 text-sm ${
                  validationErrors.no_of_adults
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                    : "focus:border-green-500 focus:ring-green-500"
                } transition-colors duration-200`}
              />
              <ErrorMessage error={validationErrors.no_of_adults} />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium text-gray-700">
                Number of Children
              </Label>
              <Input
                type="number"
                min="0"
                max="5"
                value={checkInData.no_of_children || 0}
                onChange={(e) =>
                  handleInputChange(
                    "no_of_children",
                    parseInt(e.target.value) || 0
                  )
                }
                className="h-8 text-sm focus:border-green-500 focus:ring-green-500 transition-colors duration-200"
              />
            </div>

            {/* Company - Autocomplete, stores company_id, displays name from AppContext */}
            <div className="space-y-1" ref={companyFieldRef}>
              <Label className="text-xs font-medium text-gray-700 flex items-center gap-1">
                <Building className="h-3 w-3 text-gray-500" />
                Company
              </Label>
              <div className="relative">
                <Input
                  value={companyQuery}
                  onChange={(e) => handleCompanyInputChange(e.target.value)}
                  onFocus={() => setShowCompanyDropdown(!!companyQuery.trim())}
                  placeholder="Search company (optional)"
                  className="h-8 text-sm pr-7 focus:border-green-500 focus:ring-green-500 transition-colors duration-200"
                />
                {(companyQuery || checkInData?.company_id) && (
                  <button
                    type="button"
                    aria-label="Clear selected company"
                    onClick={clearSelectedCompany}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
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
              <ErrorMessage error={validationErrors.company_id} />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium text-gray-700">
                GST Number
                {checkInData?.company_id && getCompanyGstById(checkInData.company_id) && (
                  <span className="text-xs text-green-600 ml-1">(Auto-filled)</span>
                )}
              </Label>
              <Input
                value={checkInData.gst_no || ""}
                onChange={(e) => handleInputChange("gst_no", e.target.value)}
                placeholder="Enter GST number (optional)"
                className="h-8 text-sm focus:border-green-500 focus:ring-green-500 transition-colors duration-200"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium text-gray-700">
                Rate Plan <span className="text-red-500">*</span>
              </Label>
              <Select
                onValueChange={(value) => handleInputChange("rate_plan_id", value)}
                value={checkInData.rate_plan_id}
              >
                <SelectTrigger
                  className={`h-8 text-sm ${validationErrors.rate_plan_id
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : "focus:border-green-500 focus:ring-green-500"
                    } transition-colors duration-200`}
                >
                  <SelectValue placeholder="Select rate plan" />
                </SelectTrigger>
                <SelectContent>
                  {ratePlans && ratePlans.length > 0 ? (
                    ratePlans.map((plan) => (
                      <SelectItem key={plan.plan_id} value={plan.plan_id}>
                        {plan.name} - ₹
                        {(plan.base_tariff).toLocaleString()}
                        <span className="text-sm text-gray-500 ml-2">
                          ({plan.meal_plan})
                        </span>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-plans" disabled>
                      No rate plans available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <ErrorMessage error={validationErrors.rate_plan_id} />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium text-gray-700 flex items-center gap-1">
                <Clock className="h-3 w-3 text-gray-500" />
                Check-in Date & Time <span className="text-red-500">*</span>
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">Date</Label>
                  <Input
                    type="date"
                    value={getDateFromTimestamp(checkInData.checkin_date)}
                    disabled
                    className="h-8 text-sm opacity-70 bg-gray-50 cursor-not-allowed"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">Time</Label>
                  <Input
                    type="time"
                    value={getTimeFromTimestamp(checkInData.checkin_date)}
                    onChange={(e) => {
                      const dateString = getDateFromTimestamp(checkInData.checkin_date);
                      const timeString = e.target.value;
                      if (dateString && timeString) {
                        const newTimestamp = combineDateAndTime(dateString, timeString);
                        if (newTimestamp) {
                          handleInputChange("checkin_date", newTimestamp);
                        }
                      }
                    }}
                    className="h-8 text-sm focus:border-green-500 focus:ring-green-500 transition-colors duration-200"
                  />
                </div>
              </div>
              <ErrorMessage error={validationErrors.checkin_date} />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium text-gray-700 flex items-center gap-1">
                <Clock className="h-3 w-3 text-gray-500" />
                Check-out Date & Time <span className="text-red-500">*</span>
              </Label>
              <Input
                type="datetime-local"
                value={formatToLocalDateTime(checkInData.checkout_date)}
                onChange={(e) => {
                  const timestamp = parseLocalDateTime(e.target.value);
                  handleInputChange("checkout_date", timestamp);
                }}
                min={new Date().toISOString().slice(0, 16)}
                className={`h-8 text-sm ${
                  validationErrors.checkout_date
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                    : "focus:border-green-500 focus:ring-green-500"
                } transition-colors duration-200`}
              />
              <ErrorMessage error={validationErrors.checkout_date} />
              {numberOfNights > 0 && (
                <p className="text-xs text-green-600 font-medium">
                  Duration: {numberOfNights} night
                  {numberOfNights > 1 ? "s" : ""}
                </p>
              )}
            </div>

            <div className="md:col-span-2 lg:col-span-3">
              {(targetCategories.length > 0 || targetCategory) && (
                <div className="mb-4 rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50/90 to-indigo-50/70 p-3 shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs text-white font-bold">
                        ★
                      </span>
                      <div>
                        <div className="text-xs font-semibold text-blue-900">
                          Booking Preference:{" "}
                          <span className="text-blue-700 underline underline-offset-2">
                            {targetCategories.length > 0 ? targetCategories.join(" + ") : targetCategory}
                          </span>
                          {bookedRoomsCount > 0 ? ` • ${bookedRoomsCount} Room${bookedRoomsCount > 1 ? "s" : ""}` : ""}
                          {bookedPersonsCount > 0 ? ` • ${bookedPersonsCount} Guest${bookedPersonsCount > 1 ? "s" : ""}` : ""}
                        </div>
                        <p className="text-[11px] text-blue-700">
                          {matchingVacantRooms.length > 0
                            ? `${matchingVacantRooms.length} vacant matching room${matchingVacantRooms.length > 1 ? "s" : ""} available. Click below to quickly assign:`
                            : `No vacant matching rooms currently available. You can assign any other vacant room below.`}
                        </p>
                      </div>
                    </div>
                    {bookedRoomsCount > 0 && (
                      <span className="text-[11px] font-medium text-blue-800 bg-blue-100/90 px-2.5 py-0.5 rounded-full border border-blue-200">
                        Assigned: {getSelectedRoomsCount()} / {bookedRoomsCount}
                      </span>
                    )}
                  </div>

                  {matchingVacantRooms.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-2 pt-2 border-t border-blue-200/60">
                      {matchingVacantRooms.map((room) => {
                        const selected = isRoomSelected(room.room_id);
                        return (
                          <button
                            key={room.room_id}
                            type="button"
                            onClick={() => {
                              if (selected) {
                                removeRoom(room.room_id);
                              } else {
                                handleRoomSelection(room.room_id);
                              }
                            }}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all shadow-xs ${
                              selected
                                ? "bg-green-600 text-white hover:bg-green-700 border border-green-700"
                                : "bg-white text-blue-900 hover:bg-blue-100 hover:text-blue-950 border border-blue-300"
                            }`}
                          >
                            <span>Room {room.room_number}</span>
                            <span className={`text-[10px] font-medium ${selected ? "text-green-200" : "text-blue-600"}`}>
                              ({room.room_type})
                            </span>
                            <span className={`text-[11px] ${selected ? "text-green-100" : "text-gray-500"}`}>
                              (₹{room.tariff})
                            </span>
                            <span
                              className={`text-[10px] px-1 py-0.2 rounded font-semibold ${
                                selected ? "bg-white/20 text-white" : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {selected ? "✓ Assigned" : "+ Assign"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-700 flex items-center gap-1">
                    <Bed className="h-3 w-3 text-gray-500" />
                    Select Rooms <span className="text-red-500">*</span>
                  </Label>

                  <div className="relative">
                    <Select onValueChange={handleRoomSelection}>
                      <SelectTrigger
                        className={`h-8 text-sm ${
                          validationErrors.room_id
                            ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                            : "focus:border-green-500 focus:ring-green-500"
                        } transition-colors duration-200`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span
                            className={
                              checkInData.room_id && checkInData.room_id.length > 0
                                ? "text-gray-900"
                                : "text-gray-500"
                            }
                          >
                            {checkInData.room_id && checkInData.room_id.length > 0
                              ? "Assign More Rooms"
                              : "Select rooms..."}
                          </span>
                        </div>
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {getSortedAvailableRooms().length > 0 ? (
                          getSortedAvailableRooms().map((room) => {
                            const isSuggested = targetCategories.some(
                              (cat) => (room.room_type || "").toLowerCase() === cat.toLowerCase()
                            );
                            return (
                              <SelectItem key={room.room_id} value={room.room_id}>
                                <div className="flex items-center justify-between w-full gap-2">
                                  <div className="flex items-center gap-2">
                                    <Checkbox
                                      checked={isRoomSelected(room.room_id)}
                                      className="mr-2"
                                    />
                                    <span>
                                      Room {room.room_number} - {room.room_type} (₹
                                      {room.tariff})
                                    </span>
                                  </div>
                                  {isSuggested && (
                                    <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-1.5 py-0.5 rounded border border-amber-300">
                                      ★ Suggested
                                    </span>
                                  )}
                                </div>
                              </SelectItem>
                            );
                          })
                        ) : (
                          <SelectItem value="no-rooms" disabled>
                            {checkInData.room_id && checkInData.room_id.length > 0
                              ? "All available rooms selected"
                              : "No vacant rooms available"}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {checkInData.room_id && checkInData.room_id.length > 0 && (
                    <div className="mt-1">
                      <p className="text-xs text-gray-600 mb-1">
                        Selected: {checkInData.room_id.length} room
                        {checkInData.room_id.length > 1 ? "s" : ""}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {getSelectedRooms().map((room) => {
                          const s = String(room.status || "").toLowerCase().trim();
                          const isUnready =
                            s === "dirty" ||
                            s.includes("dirty") ||
                            s.includes("maintenance") ||
                            s.includes("order") ||
                            s.includes("block");
                          return (
                            <div
                              key={room.room_id}
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${
                                isUnready
                                  ? "bg-amber-100 text-amber-900 border border-amber-300"
                                  : "bg-green-100 text-green-800"
                              }`}
                            >
                              <span>Room {room.room_number}</span>
                              {isUnready && (
                                <span className="ml-1 px-1 py-0.2 bg-amber-200 text-amber-900 text-[10px] font-semibold rounded">
                                  {room.status || "Dirty"}
                                </span>
                              )}
                              <span
                                className={`ml-1 ${
                                  isUnready ? "text-amber-800 font-medium" : "text-green-700"
                                }`}
                              >
                                (₹{room.tariff || 0})
                              </span>
                              <button
                                type="button"
                                onClick={() => removeRoom(room.room_id)}
                                className={`ml-1 ${
                                  isUnready
                                    ? "text-amber-700 hover:text-amber-900"
                                    : "text-green-600 hover:text-green-800"
                                }`}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                      {getSelectedRoomsCount() > 1 && (
                        <div className="mt-1 text-xs text-green-700 font-medium">
                          Total Room Cost: ₹{getTotalRoomTariff().toLocaleString()}
                        </div>
                      )}
                    </div>
                  )}

                  <ErrorMessage error={validationErrors.room_id} />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-700">
                    Discount Type
                  </Label>
                  <Select
                    onValueChange={(value) => {
                      handleInputChange("discount_type", value);

                      // When switching discount types, preserve the current discount amount
                      if (checkInData.discount > 0) {
                        if (value === "percentage") {
                          // Convert rupees to percentage
                          const totalRoomCost = getTotalRoomTariff();
                          if (totalRoomCost > 0) {
                            const percentage = (parseFloat(checkInData.discount || 0) / totalRoomCost) * 100;
                            handleInputChange("discount_input", percentage);
                          }
                        } else {
                          // Convert percentage to rupees (already stored in discount)
                          handleInputChange("discount_input", parseFloat(checkInData.discount || 0));
                        }
                      }
                    }}
                    value={checkInData.discount_type || "rupees"}
                  >
                    <SelectTrigger className="h-8 text-sm focus:border-green-500 focus:ring-green-500 transition-colors duration-200">
                      <SelectValue placeholder="Select discount type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rupees">Rupees (₹)</SelectItem>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-700">
                    Discount {checkInData.discount_type === "percentage" ? "(%)" : "(₹)"}
                  </Label>
                  <Input
                    type="text"
                    value={
                      checkInData.discount_input !== undefined &&
                        checkInData.discount_input !== null
                        ? checkInData.discount_input
                        : ""
                    }
                    onChange={(e) => {
                      const inputValue = e.target.value;
                      // Allow only numbers and decimal point
                      if (inputValue === "" || /^\d*\.?\d*$/.test(inputValue)) {
                        if (inputValue === "") {
                          handleInputChange("discount_input", "");
                          handleInputChange("discount", 0);
                        } else {
                          const value = parseFloat(inputValue) || 0;
                          handleInputChange("discount_input", value);

                          // Calculate actual discount in rupees based on type
                          let discountInRupees = 0;
                          if (checkInData.discount_type === "percentage") {
                            const totalRoomCost = getTotalRoomTariff();
                            discountInRupees = (totalRoomCost * value) / 100;
                          } else {
                            discountInRupees = value;
                          }
                          handleInputChange("discount", discountInRupees);
                        }
                      }
                    }}
                    placeholder={
                      checkInData.discount_type === "percentage"
                        ? "Enter discount percentage"
                        : "Enter discount amount in rupees"
                    }
                    className={`h-8 text-sm ${validationErrors.discount
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                        : "focus:border-green-500 focus:ring-green-500"
                      } transition-colors duration-200`}
                  />
                  <ErrorMessage error={validationErrors.discount} />
                  <p className="text-xs text-gray-500">
                    {checkInData.discount_type === "percentage"
                      ? "Enter discount percentage (0-100%)"
                      : "Enter discount amount in rupees"
                    }
                  </p>
                  {checkInData.discount_type === "percentage" && checkInData.discount_input > 0 && (
                    <p className="text-xs text-green-600 font-medium">
                      Discount Amount: ₹{parseFloat(checkInData.discount || 0).toFixed(2)}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-700">
                    Partial Payment Amount
                  </Label>
                  <Input
                    type="text"
                    value={checkInData.partial_payment_amount || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow only numbers and decimal point
                      if (value === "" || /^\d*\.?\d*$/.test(value)) {
                        handleInputChange(
                          "partial_payment_amount",
                          value === "" ? 0 : parseFloat(value) || 0
                        );
                      }
                    }}
                    placeholder="Enter partial payment amount..."
                    className="h-8 text-sm focus:border-green-500 focus:ring-green-500 transition-colors duration-200"
                  />
                  <ErrorMessage error={validationErrors.partial_payment_amount} />
                </div>

                {/* Payment Mode Dropdown - Only show when partial payment amount > 0 */}
                {checkInData.partial_payment_amount > 0 && (
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-700 flex items-center gap-1">
                      <CreditCardIcon className="h-3 w-3 text-gray-500" />
                      Advance Payment Mode <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      onValueChange={(value) =>
                        handleInputChange("advance_payment_mode", value)
                      }
                      value={checkInData.advance_payment_mode || ""}
                    >
                      <SelectTrigger
                        className={`h-8 text-sm ${validationErrors.advance_payment_mode
                            ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                            : "focus:border-green-500 focus:ring-green-500"
                          } transition-colors duration-200`}
                      >
                        <SelectValue placeholder="Select payment mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="UPI">UPI</SelectItem>
                        <SelectItem value="Credit Card">Credit Card</SelectItem>
                        <SelectItem value="Debit Card">Debit Card</SelectItem>
                        <SelectItem value="Net Banking">Net Banking</SelectItem>
                        <SelectItem value="Wallet">Wallet</SelectItem>
                      </SelectContent>
                    </Select>
                    <ErrorMessage error={validationErrors.advance_payment_mode} />
                  </div>
                )}

                {/* UPI Platform Dropdown - Only show when UPI is selected */}
                {checkInData.partial_payment_amount > 0 && checkInData.advance_payment_mode === "UPI" && (
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-700 flex items-center gap-1">
                      <CreditCardIcon className="h-3 w-3 text-gray-500" />
                      UPI Platform <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      onValueChange={(value) =>
                        handleInputChange("advance_payment_upi_mode", value)
                      }
                      value={checkInData.advance_payment_upi_mode || ""}
                    >
                      <SelectTrigger
                        className={`h-8 text-sm ${validationErrors.advance_payment_upi_mode
                            ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                            : "focus:border-green-500 focus:ring-green-500"
                          } transition-colors duration-200`}
                      >
                        <SelectValue placeholder="Select UPI platform" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Paytm">Paytm</SelectItem>
                        <SelectItem value="PhonePe">PhonePe</SelectItem>
                        <SelectItem value="Google Pay">Google Pay</SelectItem>
                        <SelectItem value="Amazon Pay">Amazon Pay</SelectItem>
                        <SelectItem value="BHIM">BHIM</SelectItem>
                        <SelectItem value="Mobikwik">Mobikwik</SelectItem>
                        <SelectItem value="Freecharge">Freecharge</SelectItem>
                        <SelectItem value="Others">Others</SelectItem>
                      </SelectContent>
                    </Select>
                    <ErrorMessage error={validationErrors.advance_payment_upi_mode} />
                  </div>
                )}
              </div>
            </div>

            {/* Special Requests with big Add PAX button taking part of the row */}
            <div className="md:col-span-2 lg:col-span-3">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                <div className="md:col-span-3">
                  <Label className="text-xs font-medium text-gray-700">
                    Special Requests
                  </Label>
                  <Input
                    value={checkInData.special_requests || ""}
                    onChange={(e) =>
                      handleInputChange("special_requests", e.target.value)
                    }
                    placeholder="Any special requests or notes..."
                    className="h-10 text-sm focus:border-green-500 focus:ring-green-500 transition-colors duration-200"
                  />
                </div>
                <div className="md:col-span-1">
                  <Label className="text-transparent select-none">.</Label>
                  <Button
                    type="button"
                    onClick={addPax}
                    className="w-full h-10 md:h-11 bg-gray-900 hover:bg-gray-800 cursor-pointer text-white shadow font-medium"
                  >
                    <PlusCircle className="h-5 w-5 mr-2" />
                    Add Extra PAX
                  </Button>
                </div>
              </div>
            </div>

            {/* PAX details list */}
            {Array.isArray(checkInData?.extra_pax) && checkInData.extra_pax.length > 0 && (
              <div className="md:col-span-2 lg:col-span-3 mt-2 space-y-2">
                <h4 className="text-sm font-semibold text-gray-800">
                  PAX Details
                </h4>
                {checkInData.extra_pax.map((p, idx) => (
                  <div
                    key={idx}
                    className="rounded-md border border-gray-200 bg-gray-50 p-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-700">
                        PAX {idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removePax(idx)}
                        className="text-gray-500 hover:text-red-600"
                        aria-label={`Remove PAX ${idx + 1}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-gray-700">
                          Full Name
                        </Label>
                        <Input
                          value={p.full_name || ""}
                          onChange={(e) =>
                            updatePaxField(idx, "full_name", e.target.value)
                          }
                          placeholder="Enter full name"
                          className="h-8 text-sm focus:border-green-500 focus:ring-green-500 transition-colors duration-200"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-gray-700">
                          Gender
                        </Label>
                        <Select
                          onValueChange={(value) =>
                            updatePaxField(idx, "gender", value)
                          }
                          value={p.gender || ""}
                        >
                          <SelectTrigger className="h-8 text-sm focus:border-green-500 focus:ring-green-500 transition-colors duration-200">
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-gray-700">
                          Age
                        </Label>
                        <Input
                          type="number"
                          min="0"
                          max="120"
                          value={p.age ?? ""}
                          onChange={(e) =>
                            updatePaxField(
                              idx,
                              "age",
                              e.target.value === ""
                                ? ""
                                : Math.max(0, parseInt(e.target.value) || 0)
                            )
                          }
                          placeholder="Age"
                          className="h-8 text-sm focus:border-green-500 focus:ring-green-500 transition-colors duration-200"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-gray-700">
                          PAX Amount (₹)
                        </Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={p.extra_pax_amount ?? 0}
                          onChange={(e) =>
                            updatePaxField(
                              idx,
                              "extra_pax_amount",
                              e.target.value === ""
                                ? ""
                                : parseFloat(e.target.value) || 0
                            )
                          }
                          placeholder="Enter amount"
                          className="h-8 text-sm focus:border-green-500 focus:ring-green-500 transition-colors duration-200"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-gray-700">
                          Room
                        </Label>
                        <Select
                          value={p.room_id || ""}
                          onValueChange={(value) => updatePaxField(idx, "room_id", value)}
                        >
                          <SelectTrigger className="h-8 text-sm focus:border-green-500 focus:ring-green-500 transition-colors duration-200">
                            <SelectValue placeholder="Select room" />
                          </SelectTrigger>
                          <SelectContent>
                            {(checkInData?.room_id || []).map((rid) => {
                              const r = getSelectedRooms().find(room => room.room_id === rid) || {};
                              return (
                                <SelectItem key={rid} value={rid}>
                                  Room {r.room_number || rid}
                                  <span className="text-xs text-gray-500 ml-1">({r.room_type || "Room"})</span>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Company Dialog */}
      <Dialog open={isCreateCompanyOpen} onOpenChange={setIsCreateCompanyOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building className="h-5 w-5 text-blue-600" />
              Create New Company
            </DialogTitle>
            <DialogDescription>
              Add a new company to the system. This company will be available for future bookings.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
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
          <DialogFooter>
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
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </form>
  );
};

export default CheckInForm;