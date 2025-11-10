import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAppContext } from '../../../context/AppContext.jsx';
import { Button } from '../../../components/ui/button.js';
import { Input } from '../../../components/ui/input.js';
import { Label } from '../../../components/ui/label.js';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card.js';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select.js';
import { Textarea } from '../../../components/ui/textarea.js';
import RefreshButton from '../../../components/ui/RefreshButton.jsx';
import {
  Search,
  Edit,
  Calendar,
  User,
  X,
  AlertCircle,
  Building,
  PlusCircle,
  Printer,
} from 'lucide-react';
import { toast } from 'sonner';

const AmendBooking = () => {
  const {
    bookings,
    guests,
    ratePlans,
    rooms,
    companies = [],
    fetchBookings,
    fetchGuests,
    fetchRatePlans,
    fetchRooms,
    fetchCompanies,
    amendBooking,
    updateRoomStatus
  } = useAppContext();

  const [searchTerm, setSearchTerm] = useState('');
  const [editingBooking, setEditingBooking] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Company autocomplete state (UI only, stores company_id in formData, sourced from booking)
  const [companyQuery, setCompanyQuery] = useState('');
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const companyFieldRef = useRef(null);

  // PAX handlers
  const addPax = () => {
    const defaultRoomId = (formData?.room_ids && formData.room_ids[0]) || '';
    const newPax = { full_name: '', gender: '', age: '', extra_pax_amount: 0, room_id: defaultRoomId };
    const updated = [...(formData?.extra_pax || []), newPax];
    setFormData(prev => ({ ...prev, extra_pax: updated }));
  };
  const updatePaxField = (index, field, value) => {
    const current = [...(formData?.extra_pax || [])];
    current[index] = { ...current[index], [field]: value };
    setFormData(prev => ({ ...prev, extra_pax: current }));
  };
  const removePax = (index) => {
    const current = [...(formData?.extra_pax || [])];
    current.splice(index, 1);
    setFormData(prev => ({ ...prev, extra_pax: current }));
  };

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      if (fetchBookings) await fetchBookings();
      if (fetchGuests) await fetchGuests();
      if (fetchRatePlans) await fetchRatePlans();
      if (fetchRooms) await fetchRooms();
      if (fetchCompanies) await fetchCompanies();
    };
    fetchData();
  }, []);

  // Refresh function
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await Promise.all([
        fetchBookings(),
        fetchGuests(),
        fetchRatePlans(),
        fetchRooms(),
        fetchCompanies()
      ]);
      toast.success("Data refreshed successfully");
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast.error("Failed to refresh data");
    } finally {
      setRefreshing(false);
    }
  };

  // Company helpers
  const getCompanyName = (c) => c?.name || c?.company_name || c?.companyName || '';
  const getCompanyId = (c) => c?.company_id || c?.id || c?.companyId;
  const getCompanyNameById = (id) => {
    if (!id) return '';
    const c = companies.find(cc => getCompanyId(cc) === id);
    return c ? getCompanyName(c) : '';
  };

  // Autocomplete filtering
  const filteredCompanies = useMemo(() => {
    const q = companyQuery.trim().toLowerCase();
    if (!q) return companies.slice(0, 8);
    return companies.filter(c => getCompanyName(c).toLowerCase().includes(q)).slice(0, 8);
  }, [companies, companyQuery]);

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e) => {
      if (companyFieldRef.current && !companyFieldRef.current.contains(e.target)) {
        setShowCompanyDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleCompanySelect = (company) => {
    setCompanyQuery(getCompanyName(company));
    setShowCompanyDropdown(false);
    const id = getCompanyId(company);
    setFormData(prev => ({ ...prev, company_id: id }));
  };
  const clearSelectedCompany = () => {
    setCompanyQuery('');
    setFormData(prev => ({ ...prev, company_id: '' }));
    setShowCompanyDropdown(false);
  };
  const handleCompanyInputChange = (value) => {
    setCompanyQuery(value);
    setShowCompanyDropdown(true);
    if (formData?.company_id) {
      setFormData(prev => ({ ...prev, company_id: '' }));
    }
  };

  // Check if check-in date is more than 24 hours old
  const isCheckinOld = (checkinDate) => {
    if (!checkinDate) return false;
    const checkinTimestamp = typeof checkinDate === 'number' ? checkinDate : new Date(checkinDate).getTime();
    const now = Date.now();
    const twentyFourHoursInMs = 24 * 60 * 60 * 1000;
    return (now - checkinTimestamp) > twentyFourHoursInMs;
  };

  // Get guest details for a booking
  const getGuestDetails = (booking) => {
    if (booking.source === 'offline' || booking.full_name) {
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
        marital_status: booking.marital_status || 'Unmarried',
        anniversary_date: booking.anniversary_date,
        gst_no: booking.gst_no,
        company_name: booking.company_name
      };
    }
    const guest = guests?.find(guest =>
      guest.guest_id === booking.guest_id ||
      guest.id === booking.guest_id ||
      guest._id === booking.guest_id
    ) || {};
    
    return {
      ...guest,
      marital_status: booking.marital_status || 'Unmarried'
    };
  };

  // Get room details for a room ID
  const getRoomDetails = (roomId) => {
    return rooms?.find(room =>
      room.room_id === roomId ||
      room.id === roomId ||
      room._id === roomId
    ) || {};
  };

  // Get available rooms (status = "Vacant") and current room
  const getAvailableRooms = (currentRoomId) => {
    const availableRooms = rooms?.filter(room => room.status === "Vacant") || [];
    const currentRoom = rooms?.find(room => room.room_id === currentRoomId);
    if (currentRoom && !availableRooms.find(room => room.room_id === currentRoomId)) {
      return [currentRoom, ...availableRooms];
    }
    return availableRooms;
  };

  // Get array of room IDs from booking
  const getCurrentRoomIds = (booking) => {
    if (Array.isArray(booking.room_id)) {
      return booking.room_id;
    }
    return booking.room_id ? [booking.room_id] : [];
  };

  // Convert services object to use room numbers as keys instead of UUIDs
  const convertServicesToRoomNumbers = (services, roomId) => {
    if (!services || typeof services !== 'object') return {};
    const room = getRoomDetails(roomId);
    const roomNumber = room.room_number || roomId;
    if (services[roomNumber]) {
      return services;
    }
    const convertedServices = {};
    Object.keys(services).forEach(key => {
      if (key === roomId) {
        convertedServices[roomNumber] = services[key];
      } else {
        convertedServices[key] = services[key];
      }
    });
    return convertedServices;
  };

  // Filter checked-in bookings
  const checkedInBookings = bookings?.filter(booking =>
    booking.status === 'Checked-in' || booking.status === 'checked-in'
  ) || [];

  // Filter bookings based on search
  const filteredBookings = checkedInBookings.filter(booking => {
    const guest = getGuestDetails(booking);
    const guestName = guest.full_name || guest.name || guest.guest_name || '';
    const searchLower = searchTerm.toLowerCase();
    const firstRoomId = getCurrentRoomIds(booking)[0];

    return (
      (booking.booking_id && booking.booking_id.toString().toLowerCase().includes(searchLower)) ||
      guestName.toLowerCase().includes(searchLower) ||
      (firstRoomId && firstRoomId.toString().toLowerCase().includes(searchLower)) ||
      (booking.room_type && booking.room_type.toLowerCase().includes(searchLower)) ||
      (booking.booking_source && booking.booking_source.toLowerCase().includes(searchLower))
    );
  });

  // Format date for display
  const formatDate = (dateValue) => {
    if (!dateValue) return 'N/A';
    const date = new Date(dateValue);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Format date for input
  const formatDateForInput = (dateValue) => {
    if (!dateValue) return '';
    const date = new Date(dateValue);
    return date.toISOString().split('T')[0];
  };

  // ----------- MULTI-ROOM DROPDOWN LOGIC START -----------

  // Helper: Get available rooms for a given dropdown index, removing rooms already picked in other dropdowns (except its own)
  const getAvailableRoomsForDropdown = (currentRoomIds, idx) => {
    const selectedRoomIds = currentRoomIds.filter((rid, i) => i !== idx);
    return rooms.filter(room => {
      if (room.room_id === currentRoomIds[idx]) return true;
      if (room.status === "Vacant" && !selectedRoomIds.includes(room.room_id)) return true;
      return false;
    });
  };

  // Change handler: update room_ids and ensure uniqueness
  const handleRoomIdChange = (index, value) => {
    setFormData(prev => {
      const newRoomIds = [...(prev.room_ids || [])];
      // Prevent duplicate selection
      if (newRoomIds.includes(value) && newRoomIds[index] !== value) return prev;
      newRoomIds[index] = value;
      const selectedRoom = getRoomDetails(value);
      // Adjust PAX room assignments if any PAX is linked to a room no longer selected
      const adjustedExtraPax = Array.isArray(prev.extra_pax)
        ? prev.extra_pax.map(p => {
            if (!p) return p;
            const paxRoomId = p.room_id;
            if (!paxRoomId || !newRoomIds.includes(paxRoomId)) {
              return { ...p, room_id: newRoomIds[0] || '' };
            }
            return p;
          })
        : prev.extra_pax;

      return {
        ...prev,
        room_ids: newRoomIds,
        room_type: selectedRoom.room_type || prev.room_type,
        extra_pax: adjustedExtraPax
      };
    });
  };

  // ----------- MULTI-ROOM DROPDOWN LOGIC END -----------

  // Handle other form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => {
      if (field === 'checkin_date' || field === 'checkout_date') {
        const timestamp = value ? new Date(value).getTime() : '';
        return { ...prev, [field]: timestamp };
      }
      return { ...prev, [field]: value };
    });
  };

  // Reset form to original booking data
  const resetForm = () => {
    if (!editingBooking) return;
    const guest = getGuestDetails(editingBooking);
    const currentRoomIds = getCurrentRoomIds(editingBooking);

    // Company init (from booking)
    const initialCompanyId = editingBooking.company_id || '';
    const initialCompanyName = getCompanyNameById(initialCompanyId) || '';
    setCompanyQuery(initialCompanyName);

  setFormData({
      full_name: guest.full_name || guest.name || '',
      mobile: guest.mobile || '',
      email: guest.email || '',
      gender: guest.gender || '',
      nationality: guest.nationality || '',
      id_proof_type: guest.id_proof_type || '',
      id_proof_number: guest.id_proof_number || '',
      address: guest.address || '',
      city: guest.city || '',
      state: guest.state || '',
      pincode: guest.pincode || '',
      country: guest.country || '',
      guest_category: guest.guest_category || '',
      marital_status: editingBooking.marital_status || 'Unmarried',
      anniversary_date: editingBooking.anniversary_date || '',
      gst_no: guest.gst_no || '',

      checkin_date: editingBooking.checkin_date ? Number(editingBooking.checkin_date) : '',
      checkout_date: editingBooking.checkout_date ? Number(editingBooking.checkout_date) : '',
      room_ids: currentRoomIds,
      room_type: getRoomDetails(currentRoomIds[0]).room_type || editingBooking.room_type || '',
      no_of_adults: editingBooking.no_of_adults || 1,
      no_of_children: editingBooking.no_of_children || 0,
      discount: editingBooking.discount || 0,
      booking_source: editingBooking.booking_source || 'Direct',
      rate_plan_id: editingBooking.rate_plan_id || '',
      remarks: editingBooking.remarks || '',
      special_requests: editingBooking.special_requests || '',
      services: convertServicesToRoomNumbers(editingBooking.services, currentRoomIds[0]),
      extra_pax: Array.isArray(editingBooking.extra_pax)
        ? editingBooking.extra_pax.map(p => ({
            ...p,
            room_id: p?.room_id ?? (currentRoomIds && currentRoomIds[0] ? currentRoomIds[0] : '')
          }))
        : [],
      company_id: initialCompanyId
    });

    toast.success('Form reset to original values');
  };

  // Open edit dialog
  const openEditDialog = (booking) => {
    const guest = getGuestDetails(booking);
    const currentRoomIds = getCurrentRoomIds(booking);

    // Company init (from booking)
    const initialCompanyId = booking.company_id || '';
    const initialCompanyName = getCompanyNameById(initialCompanyId) || '';
    setCompanyQuery(initialCompanyName);

    setEditingBooking(booking);
  setFormData({
      full_name: guest.full_name || guest.name || '',
      mobile: guest.mobile || '',
      email: guest.email || '',
      gender: guest.gender || '',
      nationality: guest.nationality || '',
      id_proof_type: guest.id_proof_type || '',
      id_proof_number: guest.id_proof_number || '',
      address: guest.address || '',
      city: guest.city || '',
      state: guest.state || '',
      pincode: guest.pincode || '',
      country: guest.country || '',
      guest_category: guest.guest_category || '',
      marital_status: booking.marital_status || 'Unmarried',
      anniversary_date: booking.anniversary_date || '',
      gst_no: guest.gst_no || '',

      checkin_date: booking.checkin_date ? Number(booking.checkin_date) : '',
      checkout_date: booking.checkout_date ? Number(booking.checkout_date) : '',
      room_ids: currentRoomIds,
      room_type: getRoomDetails(currentRoomIds[0]).room_type || booking.room_type || '',
      no_of_adults: booking.no_of_adults || 1,
      no_of_children: booking.no_of_children || 0,
      discount: booking.discount || 0,
      booking_source: booking.booking_source || 'Direct',
      rate_plan_id: booking.rate_plan_id || '',
      remarks: booking.remarks || '',
      special_requests: booking.special_requests || '',
      services: convertServicesToRoomNumbers(booking.services, currentRoomIds[0]),
      extra_pax: Array.isArray(booking.extra_pax)
        ? booking.extra_pax.map(p => ({
            ...p,
            room_id: p?.room_id ?? (currentRoomIds && currentRoomIds[0] ? currentRoomIds[0] : '')
          }))
        : [],
      company_id: initialCompanyId
    });
    setShowEditDialog(true);
  };

  // Print check-in form
  const printCheckinForm = (booking) => {
    const guest = getGuestDetails(booking);
    const currentRoomIds = getCurrentRoomIds(booking);
    const rooms = currentRoomIds.map(roomId => getRoomDetails(roomId));
    const companyName = getCompanyNameById(booking.company_id) || '';
    
    // Calculate stay duration
    const stayDuration = Math.ceil((new Date(booking.checkout_date) - new Date(booking.checkin_date)) / (1000 * 60 * 60 * 24));
    
    // Format dates
    const checkinDate = formatDate(booking.checkin_date);
    const checkoutDate = formatDate(booking.checkout_date);
    const bookingDate = formatDate(booking.booking_date);
    
    // Calculate room charges and taxes
    const roomCharges = booking.room_charges ? Object.values(booking.room_charges).reduce((sum, charge) => sum + parseFloat(charge || 0), 0) : 0;
    const roomChargesPerNight = stayDuration > 0 ? roomCharges / stayDuration : 0;
    
    // Calculate individual room charges for display
    const individualRoomCharges = currentRoomIds.map(roomId => {
      const roomObj = getRoomDetails(roomId);
      const roomNumber = roomObj.room_number || roomId;
      const charge = parseFloat(booking.room_charges?.[roomNumber] || 0);
      return { roomNumber, charge };
    });
    const cgst = Math.round((parseFloat(roomCharges) * 0.025) * 100) / 100;
    const sgst = Math.round((parseFloat(roomCharges) * 0.025) * 100) / 100;
    const cgstPerNight = Math.round((parseFloat(roomChargesPerNight) * 0.025) * 100) / 100;
    const sgstPerNight = Math.round((parseFloat(roomChargesPerNight) * 0.025) * 100) / 100;
    const totalAmount = parseFloat(roomCharges) + cgst + sgst;
    const totalAmountPerNight = parseFloat(roomChargesPerNight) + cgstPerNight + sgstPerNight;
    
    // Create print content
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Check-in Form - ${booking.booking_id}</title>
        <style>
          @media print {
            body { margin: 0; padding: 8px; font-family: Arial, sans-serif; }
            .no-print { display: none !important; }
            .print-break { page-break-before: always; }
            .section { page-break-inside: avoid; }
            .signature-section { page-break-inside: avoid; }
            /* Darker text for print */
            .form-title { color: #000 !important; }
            .section-title { color: #000 !important; border-bottom-color: #000 !important; }
            .info-label { color: #000 !important; font-weight: bold !important; }
            .info-value { color: #000 !important; }
            .terms-number { color: #000 !important; }
            .terms-text { color: #000 !important; }
            .signature-label { color: #000 !important; }
            .signature-date { color: #000 !important; }
            .footer { color: #000 !important; }
            /* Stronger borders for print */
            .header { border-bottom-color: #000 !important; }
            .section-title { border-bottom-color: #000 !important; }
            .charges-table th, .charges-table td { border-color: #000 !important; }
            .charges-table th { background-color: #f0f0f0 !important; }
            .signature-line { border-bottom-color: #000 !important; }
          }
          body { font-family: Arial, sans-serif; margin: 0; padding: 10px; line-height: 1.3; }
          .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 8px; margin-bottom: 15px; }
          .form-title { font-size: 22px; font-weight: bold; color: #333; text-transform: uppercase; letter-spacing: 0.5px; }
          .section { margin-bottom: 15px; }
          .section-title { font-size: 16px; font-weight: bold; color: #2563eb; border-bottom: 1px solid #2563eb; padding-bottom: 4px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
          .info-item { margin-bottom: 6px; }
          .info-label { font-weight: bold; color: #555; font-size: 13px; }
          .info-value { color: #333; font-size: 13px; }
          .room-details { background: #f8f9fa; padding: 8px; border: 1px solid #e9ecef; border-radius: 3px; margin: 5px 0; }
          .charges-table { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 13px; }
          .charges-table th, .charges-table td { border: 1px solid #ddd; padding: 4px; text-align: left; }
          .charges-table th { background-color: #f2f2f2; font-weight: bold; }
          .total-row { font-weight: bold; background-color: #e9ecef; }
          .footer { margin-top: 20px; text-align: center; font-size: 12px; color: #666; }
          .terms-content { margin: 8px 0; }
          .terms-item { display: flex; margin-bottom: 6px; align-items: flex-start; }
          .terms-number { font-weight: bold; color: #2563eb; margin-right: 6px; min-width: 15px; font-size: 13px; }
          .terms-text { flex: 1; line-height: 1.4; color: #333; font-size: 13px; }
          .signature-section { margin-top: 20px; display: flex; justify-content: space-between; gap: 15px; }
          .signature-box { flex: 1; text-align: center; max-width: 150px; }
          .signature-line { border-bottom: 1px dashed #333; margin-bottom: 4px; height: 30px; }
          .signature-label { font-weight: bold; color: #333; margin-bottom: 3px; font-size: 13px; }
          .signature-date { font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="form-title"> REGISTRATION FORM</div>
        </div>
        
        <div class="section">
          <div class="section-title">Check-in & Guest Information</div>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">GRC Number:</span>
              <span class="info-value">${booking?.grc_no}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Guest Name:</span>
              <span class="info-value">${guest.full_name || guest.name || 'N/A'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Mobile:</span>
              <span class="info-value">${guest.mobile || 'N/A'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Check-in:</span>
              <span class="info-value">${checkinDate}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Check-out:</span>
              <span class="info-value">${checkoutDate}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Duration:</span>
              <span class="info-value">${stayDuration} night${stayDuration !== 1 ? 's' : ''}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Room No:</span>
              <span class="info-value">${currentRoomIds.map(roomId => {
                const roomObj = getRoomDetails(roomId);
                return roomObj.room_number || roomId;
              }).join(', ')}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Room Type:</span>
              <span class="info-value">${currentRoomIds.map(roomId => {
                const roomObj = getRoomDetails(roomId);
                return roomObj.room_type || 'Standard';
              }).join(', ')}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Adults/Children:</span>
              <span class="info-value">${booking.no_of_adults || 1}/${booking.no_of_children || 0}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Gender:</span>
              <span class="info-value">${guest.gender || 'N/A'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Nationality:</span>
              <span class="info-value">${guest.nationality || 'N/A'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">ID Proof:</span>
              <span class="info-value">${guest.id_proof_type || 'N/A'} - ${guest.id_proof_number || 'N/A'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Category:</span>
              <span class="info-value">${guest.guest_category || 'N/A'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Marital Status:</span>
              <span class="info-value">${booking.marital_status || 'Unmarried'}</span>
            </div>
            ${booking.marital_status === 'Married' && booking.anniversary_date ? `
            <div class="info-item">
              <span class="info-label">Anniversary Date:</span>
              <span class="info-value">${formatDate(booking.anniversary_date)}</span>
            </div>
            ` : ''}
            <div class="info-item">
              <span class="info-label">Source:</span>
              <span class="info-value">${booking.booking_source || 'Direct'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Type:</span>
              <span class="info-value">${booking.booking_type || 'Walk-in'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Status:</span>
              <span class="info-value">${booking.status}</span>
            </div>
          </div>
          <div class="info-item">
            <span class="info-label">Address:</span>
            <span class="info-value">${guest.address || 'N/A'}, ${guest.city || 'N/A'}, ${guest.state || 'N/A'} - ${guest.pincode || 'N/A'}, ${guest.country || 'N/A'}</span>
          </div>
        </div>
        
        ${(companyName && companyName !== 'N/A') || (booking.gst_no && booking.gst_no !== 'N/A') ? `
        <div class="section">
          <div class="section-title">Company Information</div>
          <div class="info-grid">
            ${companyName && companyName !== 'N/A' ? `
            <div class="info-item">
              <span class="info-label">Company:</span>
              <span class="info-value">${companyName}</span>
            </div>
            ` : ''}
            ${booking.gst_no && booking.gst_no !== 'N/A' ? `
            <div class="info-item">
              <span class="info-label">GST:</span>
              <span class="info-value">${booking.gst_no}</span>
            </div>
            ` : ''}
          </div>
        </div>
        ` : ''}
        
        <div class="section">
          <div class="section-title">Room Charges</div>
          <div class="info-grid">
            ${individualRoomCharges.map(room => `
            <div class="info-item">
              <span class="info-label">Room ${room.roomNumber} (${stayDuration} night${stayDuration !== 1 ? 's' : ''}):</span>
              <span class="info-value">₹${room.charge.toFixed(2)}</span>
            </div>
            `).join('')}
            <div class="info-item">
              <span class="info-label">Total Room Rate (${stayDuration} night${stayDuration !== 1 ? 's' : ''}):</span>
              <span class="info-value">₹${roomCharges.toFixed(2)}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Room Rate (Per Night):</span>
              <span class="info-value">₹${roomChargesPerNight.toFixed(2)}</span>
            </div>
            <div class="info-item">
              <span class="info-label">CGST (2.5%):</span>
              <span class="info-value">₹${cgst.toFixed(2)}</span>
            </div>
            <div class="info-item">
              <span class="info-label">SGST (2.5%):</span>
              <span class="info-value">₹${sgst.toFixed(2)}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Total Amount:</span>
              <span class="info-value"><strong>₹${totalAmount.toFixed(2)}</strong></span>
            </div>
            <div class="info-item">
              <span class="info-label">Total Per Night:</span>
              <span class="info-value"><strong>₹${totalAmountPerNight.toFixed(2)}</strong></span>
            </div>
          </div>
        </div>
        
        ${booking.special_requests || booking.remarks ? `
        <div class="section">
          <div class="section-title">Additional Information</div>
          ${booking.special_requests ? `
          <div class="info-item">
            <span class="info-label">Special Requests:</span>
            <span class="info-value">${booking.special_requests}</span>
          </div>
          ` : ''}
          ${booking.remarks ? `
          <div class="info-item">
            <span class="info-label">Remarks:</span>
            <span class="info-value">${booking.remarks}</span>
          </div>
          ` : ''}
        </div>
        ` : ''}
        
        <div class="section">
          <div class="section-title">Terms & Conditions</div>
          <div class="terms-content">
            <div class="terms-item">
              <span class="terms-number">1.</span>
              <span class="terms-text">Management not responsible for loss of guest valuables</span>
            </div>
            <div class="terms-item">
              <span class="terms-number">2.</span>
              <span class="terms-text">Disputes subject to Odisha court jurisdiction (PIN:766100)</span>
            </div>
            <div class="terms-item">
              <span class="terms-number">3.</span>
              <span class="terms-text">Check out time: 24 hours</span>
            </div>
            <div class="terms-item">
              <span class="terms-number">4.</span>
              <span class="terms-text">Guest agrees to abide by hotel terms & conditions</span>
            </div>
          </div>
        </div>
        
        <div class="signature-section">
          <div class="signature-box">
            <div class="signature-line"></div>
            <div class="signature-label">Reception (Signature/Name)</div>
            <div class="signature-date">Date: _______________</div>
          </div>
          <div class="signature-box">
            <div class="signature-line"></div>
            <div class="signature-label">Manager (Signature/Name)</div>
            <div class="signature-date">Date: _______________</div>
          </div>
          <div class="signature-box">
            <div class="signature-line"></div>
            <div class="signature-label">Guest Signature</div>
            <div class="signature-date">Date: _______________</div>
          </div>
        </div>
        
        <div class="footer">
          <p><strong>HOTEL MANAGEMENT SYSTEM</strong></p>
          <p>This is a computer-generated check-in form. Please sign above to confirm agreement to terms & conditions.</p>
          <p>Printed on: ${new Date().toLocaleString()}</p>
          <p>For any queries, please contact the front desk.</p>
        </div>
      </body>
      </html>
    `;
    
    // Create a hidden iframe for printing
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.left = '-9999px';
    iframe.style.top = '-9999px';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    
    document.body.appendChild(iframe);
    
    // Flag to prevent duplicate print calls
    let hasPrinted = false;
    
    const printAndCleanup = () => {
      if (hasPrinted) return;
      hasPrinted = true;
      
      if (iframe.contentWindow) {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      }
      
      // Clean up after printing
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1000);
    };
    
    // Write content to iframe
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(printContent);
    iframeDoc.close();
    
    // Wait for content to load, then print
    iframe.onload = () => {
      printAndCleanup();
    };
    
    // Fallback: if onload doesn't fire, print after a short delay
    setTimeout(() => {
      printAndCleanup();
    }, 500);
  };

  // Save booking amendments
  const saveAmendments = async () => {
    if (!editingBooking) return;

    const isOldCheckin = isCheckinOld(editingBooking.checkin_date);

    if (!formData.room_ids || formData.room_ids.some(id => !id)) {
      toast.error('Please select all rooms');
      return;
    }

    // ...other validation logic as in your original code...

    const guestPayload = isOldCheckin ? {
      guest_id: editingBooking.guest_id,
      updated_at: Math.floor(Date.now())
    } : {
      guest_id: editingBooking.guest_id,
      full_name: formData.full_name.trim(),
      mobile: formData.mobile.trim(),
      email: formData.email?.trim() || '',
      gender: formData.gender,
      nationality: formData.nationality.trim(),
      id_proof_type: formData.id_proof_type,
      id_proof_number: formData.id_proof_number.trim(),
      address: formData.address.trim(),
      city: formData.city.trim(),
      state: formData.state.trim(),
      pincode: formData.pincode.trim(),
      country: formData.country.trim(),
      guest_category: formData.guest_category,
      marital_status: formData.marital_status,
      anniversary_date: formData.anniversary_date,
      gst_no: formData.gst_no?.trim() || '',
      updated_at: Math.floor(Date.now())
    };

    const bookingPayload = isOldCheckin ? {
      booking_id: editingBooking.booking_id,
      room_id: formData.room_ids,
      room_type: formData.room_type,
      rate_plan_id: formData.rate_plan_id,
      company_id: formData.company_id || '',
      services: formData.services || {},
      updated_at: Math.floor(Date.now())
    } : {
      booking_id: editingBooking.booking_id,
      checkout_date: Number(formData.checkout_date),
      room_id: formData.room_ids,
      room_type: formData.room_type,
      no_of_adults: parseInt(formData.no_of_adults) || 1,
      no_of_children: parseInt(formData.no_of_children) || 0,
      discount: Math.round((parseFloat(formData.discount) || 0) * 100) / 100,
      booking_source: formData.booking_source || 'Direct',
      rate_plan_id: formData.rate_plan_id,
      remarks: formData.remarks || '',
      special_requests: formData.special_requests || '',
      company_id: formData.company_id || '',
      services: formData.services || {},
      extra_pax: Array.isArray(formData.extra_pax) ? formData.extra_pax : [],
      updated_at: Math.floor(Date.now())
    };

    setLoading(true);
    try {
      await amendBooking({
        bookingId: editingBooking.booking_id,
        bookingData: bookingPayload,
        guestData: guestPayload
      });

      // Handle room status changes for all rooms
      const originalRoomIds = getCurrentRoomIds(editingBooking);
      const newRoomIds = formData.room_ids;
      if (updateRoomStatus) {
        for (let i = 0; i < originalRoomIds.length; i++) {
          if (originalRoomIds[i] !== newRoomIds[i]) {
            await updateRoomStatus(originalRoomIds[i], "Under Maintenance");
            await updateRoomStatus(newRoomIds[i], "Occupied");
          }
        }
        if (fetchRooms) await fetchRooms();
      }

      toast.success('Check-in amended successfully!');
      setShowEditDialog(false);
      setEditingBooking(null);
      setFormData({});
      setCompanyQuery('');

      if (fetchBookings) await fetchBookings();
      if (fetchGuests) await fetchGuests();
    } catch (error) {
      console.error('Failed to amend booking:', error);
      toast.error('Failed to amend check-in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pl-6 max-sm:p-4">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Amend Check-in</h2>
          <p className="text-gray-600">Modify checked-in guest details and stay information</p>
        </div>
        <RefreshButton
          onRefresh={handleRefresh}
          loading={refreshing}
          size="sm"
        />
      </div>

      {/* Search and Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search Checked-in Guests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by booking ID, guest name, room number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Checked-in Guests</p>
                <p className="text-2xl font-bold text-gray-900">{checkedInBookings.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bookings List */}
      <div className="overflow-x-auto">
        {filteredBookings.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">No Checked-in Guests Found</h3>
              <p className="text-gray-600">
                {searchTerm ? 'No guests match your search criteria' : 'No checked-in guests available for amendment'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <table className="min-w-full text-xs md:text-sm border border-gray-200 bg-white rounded-lg">
            <thead className="bg-blue-50">
            <tr>
              <th className="px-2 py-2 font-semibold text-left text-gray-700">Guest</th>
              <th className="px-2 py-2 font-semibold text-left text-gray-700">Room</th>
              <th className="px-2 py-2 font-semibold text-left text-gray-700">Check-in</th>
              <th className="px-2 py-2 font-semibold text-left text-gray-700">Check-out</th>
              <th className="px-2 py-2 font-semibold text-left text-gray-700">Duration</th>
              <th className="px-2 py-2 font-semibold text-left text-gray-700">Action</th>
            </tr>
            </thead>
            <tbody>
            {filteredBookings.map((booking) => {
              const guest = getGuestDetails(booking);
              const currentRoomIds = getCurrentRoomIds(booking);
              const room = getRoomDetails(currentRoomIds[0]);
              const stayDuration = Math.ceil((new Date(booking.checkout_date) - new Date(booking.checkin_date)) / (1000 * 60 * 60 * 24));
              const isOldCheckin = isCheckinOld(booking.checkin_date);
              const companyName = getCompanyNameById(booking.company_id) || '';

              return (
                <tr key={booking.booking_id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-2 py-2 whitespace-nowrap max-w-[14rem]">
                    <div className="flex flex-col">
                        <span className="truncate font-medium">
                          {guest.full_name || guest.name || guest.guest_name || 'Guest Name Not Available'}
                        </span>
                      {!!companyName && (
                        <span className="text-[11px] text-gray-500 truncate">
                            Company: {companyName}
                          </span>
                      )}
                    </div>
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap">
                    <div className="flex flex-col">
                      {currentRoomIds.map((roomId, idx) => {
                        const roomObj = getRoomDetails(roomId);
                        return (
                          <span key={idx} className="font-medium">
                            Room {roomObj.room_number || roomId}
                            <span className="text-xs text-gray-500 ml-1">{roomObj.room_type || booking.room_type || 'Standard'}</span>
                          </span>
                        );
                      })}
                    </div>
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap">
                    <div className="flex flex-col">
                      {formatDate(booking.checkin_date)}
                      {isOldCheckin && (
                        <span className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                            <AlertCircle className="h-3 w-3" />
                            Limited Edit
                          </span>
                      )}
                    </div>
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap">{formatDate(booking.checkout_date)}</td>
                  <td className="px-2 py-2 whitespace-nowrap">{stayDuration} night{stayDuration !== 1 ? 's' : ''}</td>
                  <td className="px-2 py-2 whitespace-nowrap">
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEditDialog(booking)}>
                        <Edit className="h-4 w-4 mr-1" /> Amend
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => printCheckinForm(booking)}>
                        <Printer className="h-4 w-4 mr-1" /> Print
                      </Button>
                    </div>

                    {showEditDialog && editingBooking?.booking_id === booking.booking_id && (
                      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg shadow-xl px-4 max-w-[95vw] max-h-[95vh] overflow-y-auto">
                          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                            <div>
                              <h2 className="text-xl font-semibold text-gray-900">Amend Check-in - {booking.booking_id}</h2>
                              {isOldCheckin && (
                                <p className="text-sm text-amber-600 flex items-center gap-1 mt-1">
                                  <AlertCircle className="h-4 w-4" />
                                  Check-in is more than 24 hours old. Only rate plan and room can be modified.
                                </p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowEditDialog(false)}
                              className="h-8 w-8 p-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {/* Guest Details Section */}
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2 text-sm">
                                <User className="h-3 w-3" />
                                Guest Information
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <Label className="text-sm font-medium text-gray-700">Full Name *</Label>
                                  <Input
                                    value={formData.full_name || ''}
                                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                                    placeholder="Enter full name"
                                    className="h-7 text-xs"
                                    disabled={isOldCheckin}
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs font-medium text-gray-700">Mobile Number *</Label>
                                  <Input
                                    value={formData.mobile || ''}
                                    onChange={(e) => handleInputChange('mobile', e.target.value)}
                                    placeholder="Enter mobile number"
                                    className="h-7 text-xs"
                                    disabled={isOldCheckin}
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs font-medium text-gray-700">Email</Label>
                                  <Input
                                    value={formData.email || ''}
                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                    placeholder="Enter email address"
                                    className="h-7 text-xs"
                                    disabled={isOldCheckin}
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs font-medium text-gray-700">Gender *</Label>
                                  <Select
                                    value={formData.gender || ''}
                                    onValueChange={(value) => handleInputChange('gender', value)}
                                    disabled={isOldCheckin}
                                  >
                                    <SelectTrigger className="h-7 text-xs">
                                      <SelectValue placeholder="Select gender" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Male">Male</SelectItem>
                                      <SelectItem value="Female">Female</SelectItem>
                                      <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label className="text-xs font-medium text-gray-700">Nationality *</Label>
                                  <Input
                                    value={formData.nationality || ''}
                                    onChange={(e) => handleInputChange('nationality', e.target.value)}
                                    placeholder="Enter nationality"
                                    className="h-7 text-xs"
                                    disabled={isOldCheckin}
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs font-medium text-gray-700">ID Proof Type *</Label>
                                  <Select
                                    value={formData.id_proof_type || ''}
                                    onValueChange={(value) => handleInputChange('id_proof_type', value)}
                                    disabled={isOldCheckin}
                                  >
                                    <SelectTrigger className="h-7 text-xs">
                                      <SelectValue placeholder="Select ID type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Aadhar">Aadhar Card</SelectItem>
                                      <SelectItem value="PAN">PAN Card</SelectItem>
                                      <SelectItem value="Passport">Passport</SelectItem>
                                      <SelectItem value="Driving License">Driving License</SelectItem>
                                      <SelectItem value="Voter ID">Voter ID</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label className="text-xs font-medium text-gray-700">ID Proof Number *</Label>
                                  <Input
                                    value={formData.id_proof_number || ''}
                                    onChange={(e) => handleInputChange('id_proof_number', e.target.value)}
                                    placeholder="Enter ID number"
                                    className="h-7 text-xs"
                                    disabled={isOldCheckin}
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs font-medium text-gray-700">Address *</Label>
                                  <Input
                                    value={formData.address || ''}
                                    onChange={(e) => handleInputChange('address', e.target.value)}
                                    placeholder="Enter full address"
                                    className="h-7 text-xs"
                                    disabled={isOldCheckin}
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs font-medium text-gray-700">City *</Label>
                                  <Input
                                    value={formData.city || ''}
                                    onChange={(e) => handleInputChange('city', e.target.value)}
                                    placeholder="Enter city"
                                    className="h-7 text-xs"
                                    disabled={isOldCheckin}
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs font-medium text-gray-700">State *</Label>
                                  <Input
                                    value={formData.state || ''}
                                    onChange={(e) => handleInputChange('state', e.target.value)}
                                    placeholder="Enter state"
                                    className="h-7 text-xs"
                                    disabled={isOldCheckin}
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs font-medium text-gray-700">Country *</Label>
                                  <Input
                                    value={formData.country || ''}
                                    onChange={(e) => handleInputChange('country', e.target.value)}
                                    placeholder="Enter country"
                                    className="h-7 text-xs"
                                    disabled={isOldCheckin}
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs font-medium text-gray-700">Pincode *</Label>
                                  <Input
                                    value={formData.pincode || ''}
                                    onChange={(e) => handleInputChange('pincode', e.target.value)}
                                    placeholder="Enter pincode"
                                    className="h-7 text-xs"
                                    disabled={isOldCheckin}
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs font-medium text-gray-700">Guest Category *</Label>
                                  <Select
                                    value={formData.guest_category || ''}
                                    onValueChange={(value) => handleInputChange('guest_category', value)}
                                    disabled={isOldCheckin}
                                  >
                                    <SelectTrigger className="h-7 text-xs">
                                      <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="VIP">VIP</SelectItem>
                                      <SelectItem value="Regular">Regular</SelectItem>
                                      <SelectItem value="New">New</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label className="text-xs font-medium text-gray-700">Marital Status *</Label>
                                  <Select
                                    value={formData.marital_status || ''}
                                    onValueChange={(value) => handleInputChange('marital_status', value)}
                                    disabled={isOldCheckin}
                                  >
                                    <SelectTrigger className="h-7 text-xs">
                                      <SelectValue placeholder="Select marital status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Married">Married</SelectItem>
                                      <SelectItem value="Unmarried">Unmarried</SelectItem>
                                      <SelectItem value="Divorced">Divorced</SelectItem>
                                      <SelectItem value="Widowed">Widowed</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                {formData.marital_status === "Married" && (
                                  <div>
                                    <Label className="text-xs font-medium text-gray-700 flex items-center gap-1">
                                      <Calendar className="h-3 w-3 text-gray-500" />
                                      Anniversary Date
                                    </Label>
                                    <Input
                                      type="date"
                                      value={formData.anniversary_date ? new Date(formData.anniversary_date).toISOString().split('T')[0] : ""}
                                      onChange={(e) => {
                                        const dateValue = e.target.value;
                                        if (dateValue) {
                                          const isoDate = new Date(dateValue + 'T00:00:00').toISOString();
                                          handleInputChange("anniversary_date", isoDate);
                                        } else {
                                          handleInputChange("anniversary_date", "");
                                        }
                                      }}
                                      className="h-7 text-xs"
                                      disabled={isOldCheckin}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Booking Details Section */}
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2 text-sm">
                                <Calendar className="h-3 w-3" />
                                Booking Information
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <Label className="text-xs font-medium text-gray-700">Check-in Date *</Label>
                                  <Input
                                    type="date"
                                    value={formData.checkin_date ? formatDateForInput(formData.checkin_date) : ''}
                                    className="h-7 text-xs bg-gray-100"
                                    readOnly
                                    disabled
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs font-medium text-gray-700">Check-out Date *</Label>
                                  <Input
                                    type="date"
                                    value={formData.checkout_date ? formatDateForInput(formData.checkout_date) : ''}
                                    onChange={(e) => handleInputChange('checkout_date', e.target.value)}
                                    className="h-7 text-xs"
                                    disabled={isCheckinOld(editingBooking?.checkin_date)}
                                  />
                                </div>
                                {formData.room_ids && formData.room_ids.map((roomId, idx) => (
                                  <div key={idx}>
                                    <Label className="text-xs font-medium text-gray-700">
                                      Room {idx + 1} *
                                    </Label>
                                    <Select
                                      value={roomId || ''}
                                      onValueChange={(value) => handleRoomIdChange(idx, value)}
                                    >
                                      <SelectTrigger className="h-7 text-xs">
                                        <SelectValue placeholder="Select room" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {getAvailableRoomsForDropdown(formData.room_ids, idx).length > 0 ? (
                                          getAvailableRoomsForDropdown(formData.room_ids, idx).map((room) => (
                                            <SelectItem key={room.room_id} value={room.room_id}>
                                              <div className="flex items-center justify-between">
                                                <span>Room {room.room_number}</span>
                                                <span className="text-xs text-gray-500 ml-2">({room.room_type})</span>
                                                {room.room_id === editingBooking?.room_id?.[idx] && (
                                                  <span className="text-xs text-blue-600 ml-2">(Current)</span>
                                                )}
                                              </div>
                                            </SelectItem>
                                          ))
                                        ) : (
                                          <SelectItem value="no-rooms" disabled>
                                            No available rooms
                                          </SelectItem>
                                        )}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                ))}
                                {/*<div>*/}
                                {/*  <Label className="text-xs font-medium text-gray-700">Room Type</Label>*/}
                                {/*  <Input*/}
                                {/*    value={formData.room_type || ''}*/}
                                {/*    placeholder="Auto-filled based on room selection"*/}
                                {/*    className="h-7 text-xs bg-gray-100"*/}
                                {/*    readOnly*/}
                                {/*  />*/}
                                {/*</div>*/}
                                {/*<div>*/}
                                {/*  <Label className="text-xs font-medium text-gray-700">Rate Plan *</Label>*/}
                                {/*  <Select value={formData.rate_plan_id || ''} onValueChange={(value) => handleInputChange('rate_plan_id', value)}>*/}
                                {/*    <SelectTrigger className="h-7 text-xs">*/}
                                {/*      <SelectValue placeholder="Select rate plan" />*/}
                                {/*    </SelectTrigger>*/}
                                {/*    <SelectContent>*/}
                                {/*      {ratePlans && ratePlans.length > 0 ? (*/}
                                {/*        ratePlans.map((plan) => (*/}
                                {/*          <SelectItem key={plan.plan_id} value={plan.plan_id}>*/}
                                {/*            {plan.name} - ₹{(plan.base_tariff).toLocaleString()}*/}
                                {/*            <span className="text-sm text-gray-500 ml-2">({plan.meal_plan})</span>*/}
                                {/*          </SelectItem>*/}
                                {/*        ))*/}
                                {/*      ) : (*/}
                                {/*        <SelectItem value="no-plans" disabled>*/}
                                {/*          No rate plans available*/}
                                {/*        </SelectItem>*/}
                                {/*      )}*/}
                                {/*    </SelectContent>*/}
                                {/*  </Select>*/}
                                {/*</div>*/}
                                <div ref={companyFieldRef}>
                                  <Label className="text-xs font-medium text-gray-700 flex items-center gap-1">
                                    <Building className="h-3 w-3 text-gray-500" />
                                    Company
                                  </Label>
                                  <div className="relative">
                                    <Input
                                      value={companyQuery}
                                      onChange={(e) => handleCompanyInputChange(e.target.value)}
                                      onFocus={() => setShowCompanyDropdown(true)}
                                      placeholder="Search company (optional)"
                                      className="h-7 text-xs pr-7"
                                      disabled={isCheckinOld(editingBooking?.checkin_date)}
                                    />
                                    {(companyQuery || formData?.company_id) && !isCheckinOld(editingBooking?.checkin_date) && (
                                      <button
                                        type="button"
                                        aria-label="Clear selected company"
                                        onClick={clearSelectedCompany}
                                        className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                      >
                                        <X className="h-4 w-4" />
                                      </button>
                                    )}
                                    {showCompanyDropdown && !isCheckinOld(editingBooking?.checkin_date) && (
                                      <div className="absolute z-20 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg">
                                        <ul className="max-h-56 overflow-auto py-1">
                                          {filteredCompanies.length > 0 ? (
                                            filteredCompanies.map((c) => {
                                              const name = getCompanyName(c);
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
                                                  {c?.gst_no && (
                                                    <div className="text-xs text-gray-500">
                                                      GST: {c.gst_no}
                                                    </div>
                                                  )}
                                                </li>
                                              );
                                            })
                                          ) : (
                                            <li className="px-3 py-2 text-sm text-gray-500">
                                              No companies found
                                            </li>
                                          )}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <Label className="text-xs font-medium text-gray-700">Booking Source</Label>
                                  <Select
                                    value={formData.booking_source || ''}
                                    onValueChange={(value) => handleInputChange('booking_source', value)}
                                    disabled={isCheckinOld(editingBooking?.checkin_date)}
                                  >
                                    <SelectTrigger className="h-7 text-xs">
                                      <SelectValue placeholder="Select source" />
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
                                <div>
                                  <Label className="text-xs font-medium text-gray-700">Adults (1-10)</Label>
                                  <Input
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={formData.no_of_adults || ''}
                                    onChange={(e) => handleInputChange('no_of_adults', e.target.value)}
                                    className="h-7 text-xs"
                                    disabled={isCheckinOld(editingBooking?.checkin_date)}
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs font-medium text-gray-700">Children (0-5)</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    max="5"
                                    value={formData.no_of_children || ''}
                                    onChange={(e) => handleInputChange('no_of_children', e.target.value)}
                                    className="h-7 text-xs"
                                    disabled={isCheckinOld(editingBooking?.checkin_date)}
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Additional Details Section - Full Width */}
                            <div className="lg:col-span-2 bg-gray-50 p-3 rounded-lg">
                              <div className="mb-3 flex items-center justify-between">
                                <h4 className="font-medium text-gray-900 flex items-center gap-2 text-sm">
                                  <Edit className="h-3 w-3" />
                                  Additional Information
                                </h4>
                                <Button
                                  type="button"
                                  onClick={addPax}
                                  className="h-9 md:h-10 px-3 md:px-4 text-xs md:text-sm bg-green-600 hover:bg-green-700 text-white shadow"
                                >
                                  <PlusCircle className="h-4 w-4 mr-2" />
                                  Add PAX
                                </Button>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="md:col-span-1">
                                  <Label className="text-xs font-medium text-gray-700">Special Requests</Label>
                                  <Textarea
                                    value={formData.special_requests || ''}
                                    onChange={(e) => handleInputChange('special_requests', e.target.value)}
                                    placeholder="Enter any special requests..."
                                    className="text-xs min-h-[60px]"
                                    disabled={isCheckinOld(editingBooking?.checkin_date)}
                                  />
                                </div>
                                <div className="md:col-span-1">
                                  <Label className="text-xs font-medium text-gray-700">Remarks</Label>
                                  <Textarea
                                    value={formData.remarks || ''}
                                    onChange={(e) => handleInputChange('remarks', e.target.value)}
                                    placeholder="Enter any remarks..."
                                    className="text-xs min-h-[60px]"
                                    disabled={isCheckinOld(editingBooking?.checkin_date)}
                                  />
                                </div>
                              </div>
                              {Array.isArray(formData?.extra_pax) && formData.extra_pax.length > 0 && (
                                <div className="mt-3 space-y-2">
                                  <h4 className="text-sm font-semibold text-gray-800">
                                    PAX Details
                                  </h4>
                                  {formData.extra_pax.map((p, idx) => (
                                    <div
                                      key={idx}
                                      className="rounded-md border border-gray-200 bg-white p-3"
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
                                            value={p.full_name || ''}
                                            onChange={(e) =>
                                              updatePaxField(idx, 'full_name', e.target.value)
                                            }
                                            placeholder="Enter full name"
                                            className="h-7 text-xs"
                                          />
                                        </div>
                                        <div className="space-y-1">
                                          <Label className="text-xs font-medium text-gray-700">
                                            Gender
                                          </Label>
                                          <Select
                                            onValueChange={(value) => updatePaxField(idx, 'gender', value)}
                                            value={p.gender || ''}
                                          >
                                            <SelectTrigger className="h-7 text-xs">
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
                                            value={p.age ?? ''}
                                            onChange={(e) =>
                                              updatePaxField(
                                                idx,
                                                'age',
                                                e.target.value === ''
                                                  ? ''
                                                  : Math.max(0, parseInt(e.target.value) || 0)
                                              )
                                            }
                                            placeholder="Age"
                                            className="h-7 text-xs"
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
                                                'extra_pax_amount',
                                                e.target.value === '' ? '' : parseFloat(e.target.value) || 0
                                              )
                                            }
                                            placeholder="Enter amount"
                                            className="h-7 text-xs"
                                          />
                                        </div>
                                        <div className="space-y-1">
                                          <Label className="text-xs font-medium text-gray-700">
                                            Room
                                          </Label>
                                          <Select
                                            value={p.room_id || ''}
                                            onValueChange={(value) => updatePaxField(idx, 'room_id', value)}
                                          >
                                            <SelectTrigger className="h-7 text-xs">
                                              <SelectValue placeholder="Select room" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {(formData?.room_ids || []).map((rid) => {
                                                const r = getRoomDetails(rid);
                                                return (
                                                  <SelectItem key={rid} value={rid}>
                                                    Room {r.room_number || rid}
                                                    <span className="text-xs text-gray-500 ml-1">({r.room_type || 'Room'})</span>
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
                          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-between">
                            <Button
                              variant="outline"
                              onClick={resetForm}
                              disabled={loading}
                            >
                              Reset
                            </Button>
                            <div className="flex items-center gap-3">
                              <Button
                                variant="outline"
                                onClick={() => printCheckinForm(editingBooking)}
                                disabled={loading}
                              >
                                <Printer className="h-4 w-4 mr-1" /> Print
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => setShowEditDialog(false)}
                                disabled={loading}
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={saveAmendments}
                                disabled={loading}
                              >
                                {loading ? 'Saving...' : 'Save Changes'}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AmendBooking;