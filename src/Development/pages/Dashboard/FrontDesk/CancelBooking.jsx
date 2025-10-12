import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { toast } from "sonner";
import { useAuthContext } from "../../../context/AuthContext.jsx";

const CancelBooking = () => {
  const { bookings, guests, fetchBookings, fetchGuests, cancelGuestBooking, updateBooking,amendBooking } =
    useAppContext();
    const {userData} = useAuthContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [sortOrder, setSortOrder] = useState("asc"); // "asc" or "desc"
  const [refreshing, setRefreshing] = useState(false);
  
  // Edit booking states
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [editFormData, setEditFormData] = useState({
    // Guest details
    full_name: "",
    mobile: "",
    email: "",
    // Booking details
    checkin_date: "",
    checkout_date: "",
  });

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
    // Guest data is embedded in the booking record
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
        company_name: booking.company_name
      };
    }
    
    // For online bookings, look up guest details from guests array
    return (
      guests?.find(
        (guest) =>
          guest.guest_id === booking.guest_id ||
          guest.id === booking.guest_id ||
          guest._id === booking.guest_id
      ) || {}
    );
  };
  // Filter cancellable bookings (Reserved only)
  const cancellableBookings =
    bookings?.filter(
      (booking) =>
        booking.status === "Reserved" || booking.status === "reserved"
    ) || [];

  // Filter bookings based on search and status
  const filteredBookings = cancellableBookings.filter((booking) => {
    const guest = getGuestDetails(booking);
    const guestName = guest.full_name || guest.name || guest.guest_name || "";
    const searchLower = searchTerm.toLowerCase();

    const matchesSearch =
      (booking.booking_id &&
        booking.booking_id.toString().toLowerCase().includes(searchLower)) ||
      guestName.toLowerCase().includes(searchLower) ||
      (booking.room_id &&
        booking.room_id.toString().toLowerCase().includes(searchLower)) ||
      (booking.room_type &&
        booking.room_type.toLowerCase().includes(searchLower));

    const matchesStatus =
      statusFilter === "all" ||
      booking.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  // Sort bookings by check-in date
  const sortedBookings = [...filteredBookings].sort((a, b) => {
    const dateA = new Date(a.checkin_date);
    const dateB = new Date(b.checkin_date);
    
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
    const date = new Date(dateValue);
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
    const stayDuration = Math.ceil(
      (new Date(booking.checkout_date) - new Date(booking.checkin_date)) /
        (1000 * 60 * 60 * 24)
    );
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
    setEditingBooking(booking);
    setEditFormData({
      full_name: guest.full_name || guest.name || guest.guest_name || "",
      mobile: guest.mobile || guest.phone || "",
      email: guest.email || "",
      checkin_date: booking.checkin_date ? new Date(booking.checkin_date).toISOString().split('T')[0] : "",
      checkout_date: booking.checkout_date ? new Date(booking.checkout_date).toISOString().split('T')[0] : "",
    });
    setShowEditDialog(true);
  };

  // Handle form input changes
  const handleEditFormChange = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
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

      // Prepare booking data
      const bookingData = {
        ...editingBooking,
        checkin_date: editFormData.checkin_date,
        checkout_date: editFormData.checkout_date,
        updated_at: Date.now(),
      };

      // Amend the booking using amendBooking function
      await amendBooking({
        bookingId: editingBooking.booking_id,
        bookingData,
        guestData
      });

      toast.success("Booking updated successfully!");
      setShowEditDialog(false);
      setEditingBooking(null);
      setEditFormData({
        full_name: "",
        mobile: "",
        email: "",
        checkin_date: "",
        checkout_date: "",
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

      {/* Search and Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search Bookings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by booking ID, guest name, room..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* <Card>
          <CardHeader>
            <CardTitle>Filter by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="reserved">Reserved</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card> */}

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Cancellable</p>
                <p className="text-2xl font-bold text-gray-900">
                  {cancellableBookings.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                        {booking.booking_id}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {guest.mobile || guest.phone || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Dates */}
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

                {/* Actions */}
                <div className="ml-3 flex-shrink-0 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(booking)}
                    className="h-7 px-3 text-xs"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
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
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5 text-blue-600" />
                Edit Booking Details
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Booking Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">
                  Booking ID: {editingBooking?.booking_id}
                </h4>
                <p className="text-sm text-gray-600">
                  Edit guest details and booking dates
                </p>
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

              {/* Current Booking Summary */}
              {editingBooking && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium">Current Booking Summary</p>
                      <p>Room: {editingBooking.room_id} | Type: {editingBooking.room_type}</p>
                      <p>Guests: {editingBooking.adults || 1} Adult(s), {editingBooking.children || 0} Child(ren)</p>
                      <p>Status: <Badge variant={getStatusBadgeVariant(editingBooking.status)}>{editingBooking.status}</Badge></p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter>
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
          <Card>
            <CardContent className="p-8 text-center">
              <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                No Bookings Found
              </h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== "all"
                  ? "No bookings match your search criteria"
                  : "No active bookings available for cancellation"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CancelBooking;
