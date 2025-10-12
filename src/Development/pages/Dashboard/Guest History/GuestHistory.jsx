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
  Search,
  Calendar,
  Users,
  MapPin,
  CreditCard,
  FileText,
  Filter,
  Download,
  Eye,
  X,
} from "lucide-react";
import { OrderDetailsDialog } from "@/Development/pages/Dashboard/Guest History/OrderDetailsDialog.jsx";
import BillReport from "../Registrations/BillReport.jsx";

const GuestHistory = () => {
  const { bookings, guests, bills, orders, fetchBookings, fetchGuests } =
    useAppContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [checkinFilter, setCheckinFilter] = useState("");
  const [checkoutFilter, setCheckoutFilter] = useState("");
  const [roomNoFilter, setRoomNoFilter] = useState("");
  const [roomTypeFilter, setRoomTypeFilter] = useState("");
  const [advancePaymentFilter, setAdvancePaymentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [selectedVersionHistory, setSelectedVersionHistory] = useState(null);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [isBillDialogOpen, setIsBillDialogOpen] = useState(false);
  console.log("bills", bills);
  const filteredBills = bills;
  const filteredBills2 = filteredBills;

  // Format date
  const formatDate = (dateValue) => {
    if (!dateValue) return "N/A";

    // Handle string dates (YYYY-MM-DD format) or timestamps
    let date;
    if (typeof dateValue === "string") {
      date = new Date(dateValue);
    } else {
      date = new Date(dateValue);
    }

    if (isNaN(date.getTime())) return "Invalid Date";

    return date.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const guestHistoryData = bills.map((bill) => {
    console.log("bill", bill);

    const guestDetails = bill?.bill?.guestDetails || {};
    const bookingDetails = bill?.bill?.bookingDetails || {};
    const billData = bill?.bill || {};

    return {
      guestName: guestDetails?.guestName,
      bookingId: bookingDetails?.bookingId,
      checkinDate: bookingDetails?.checkIn,
      checkoutDate: bookingDetails?.checkOut,
      roomNumber: bookingDetails?.roomNumber,
      roomType: bookingDetails?.roomType,
      duration: bookingDetails?.numberOfNights,
      no_of_adults: bookingDetails?.no_of_adults || 1,
      no_of_children: bookingDetails?.no_of_children || 0,
      payment_mode: bill?.payment_mode || "N/A",
      bill: billData,
      versionHistory: bill.version_history || [],
      detailedServices: bookingDetails?.detailedServices,
    };
  });

  // Filter the guest history data based on all filters
  const filteredGuestHistory = guestHistoryData.filter((guest) => {
    const searchLower = searchTerm.toLowerCase();
    
    // Search filter
    const matchesSearch = !searchTerm || 
      (guest.guestName && guest.guestName.toLowerCase().includes(searchLower)) ||
      (guest.bookingId && guest.bookingId.toString().toLowerCase().includes(searchLower)) ||
      (guest.roomNumber && guest.roomNumber.toString().toLowerCase().includes(searchLower)) ||
      (guest.roomType && guest.roomType.toLowerCase().includes(searchLower));

    // Date filters
    const matchesCheckin = !checkinFilter || 
      (guest.checkinDate && formatDate(guest.checkinDate) === formatDate(new Date(checkinFilter)));
    
    const matchesCheckout = !checkoutFilter || 
      (guest.checkoutDate && formatDate(guest.checkoutDate) === formatDate(new Date(checkoutFilter)));

    // Legacy date filter (keeping for backward compatibility)
    const matchesDate = !dateFilter ||
      (guest.checkoutDate && formatDate(guest.checkoutDate) === formatDate(new Date(dateFilter)));

    // Room number filter
    const matchesRoomNo = !roomNoFilter ||
      (guest.roomNumber && guest.roomNumber.toString().includes(roomNoFilter));

    // Room type filter
    const matchesRoomType = !roomTypeFilter ||
      (guest.roomType && guest.roomType.toLowerCase().includes(roomTypeFilter.toLowerCase()));

    // Advance payment filter
    const advancePayment = guest.bill?.billingSummary?.partialPayment || 0;
    const matchesAdvancePayment = advancePaymentFilter === "all" ||
      (advancePaymentFilter === "with" && advancePayment > 0) ||
      (advancePaymentFilter === "without" && advancePayment === 0);

    return matchesSearch && matchesCheckin && matchesCheckout && matchesDate && 
           matchesRoomNo && matchesRoomType && matchesAdvancePayment;
  });

  // Format date and time for version history
  const formatDateTime = (timestamp) => {
    if (!timestamp) return "N/A";

    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return "Invalid Date";

    return date.toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // Format changes for better readability
  const formatChanges = (changes) => {
    if (!changes) return null;

    const formatValue = (obj, prefix = "") => {
      const items = [];

      Object.keys(obj).forEach((key) => {
        const fullKey = prefix ? `${prefix}.${key}` : key;

        if (obj[key] && typeof obj[key] === "object") {
          items.push(...formatValue(obj[key], fullKey));
        } else {
          items.push({
            field: fullKey,
            value: obj[key],
          });
        }
      });

      return items;
    };

    return {
      oldValues: changes.oldValues ? formatValue(changes.oldValues) : [],
      newValues: changes.newValues ? formatValue(changes.newValues) : [],
    };
  };

  // Get field label for display
  const getFieldLabel = (field) => {
    const labels = {
      discount: "Discount Amount",
      partial_payment_amount: "Partial Payment",
      "guest_info.email": "Guest Email",
      "guest_info.id_proof_number": "ID Proof Number",
      "guest_info.mobile": "Mobile Number",
      "guest_info.full_name": "Guest Name",
      "guest_info.address": "Address",
      "guest_info.city": "City",
      "guest_info.state": "State",
      "guest_info.pincode": "Pin Code",
      "guest_info.nationality": "Nationality",
      "guest_info.gender": "Gender",
      "guest_info.id_proof_type": "ID Proof Type",
    };

    return (
      labels[field] ||
      field.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
    );
  };

  // Handle opening version history modal
  const handleViewVersionHistory = (versionHistory, guestName) => {
    setSelectedVersionHistory({ history: versionHistory, guestName });
    setIsVersionHistoryOpen(true);
  };

  // Handle opening bill dialog
  const handleViewBill = (billData, guestName) => {
    setSelectedBill({ bill: billData, guestName });
    setIsBillDialogOpen(true);
  };

  if (loading || !guests || !bookings) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading guest history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Guest History</h1>
        <p className="text-gray-600">
          View all checked-out guests and their stay details
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <Label className="text-sm font-medium text-gray-700">
                Search
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by booking ID, guest name, or room..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Check-in Date Filter */}
            <div>
              <Label className="text-sm font-medium text-gray-700">
                Check-in Date
              </Label>
              <Input
                type="date"
                value={checkinFilter}
                onChange={(e) => setCheckinFilter(e.target.value)}
              />
            </div>

            {/* Check-out Date Filter */}
            <div>
              <Label className="text-sm font-medium text-gray-700">
                Check-out Date
              </Label>
              <Input
                type="date"
                value={checkoutFilter}
                onChange={(e) => setCheckoutFilter(e.target.value)}
              />
            </div>

            {/* Room Number Filter */}
            <div>
              <Label className="text-sm font-medium text-gray-700">
                Room Number
              </Label>
              <Input
                placeholder="Enter room number..."
                value={roomNoFilter}
                onChange={(e) => setRoomNoFilter(e.target.value)}
              />
            </div>

            {/* Room Type Filter */}
            <div>
              <Label className="text-sm font-medium text-gray-700">
                Room Type
              </Label>
              <Input
                placeholder="Enter room type..."
                value={roomTypeFilter}
                onChange={(e) => setRoomTypeFilter(e.target.value)}
              />
            </div>

            {/* Advance Payment Filter */}
            <div>
              <Label className="text-sm font-medium text-gray-700">
                Advance Payment
              </Label>
              <Select value={advancePaymentFilter} onValueChange={setAdvancePaymentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by advance payment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Bookings</SelectItem>
                  <SelectItem value="with">With Advance Payment</SelectItem>
                  <SelectItem value="without">Without Advance Payment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Legacy Date Filter (keeping for backward compatibility) */}
            <div>
              <Label className="text-sm font-medium text-gray-700">
                Legacy Checkout Date
              </Label>
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setDateFilter("");
                  setCheckinFilter("");
                  setCheckoutFilter("");
                  setRoomNoFilter("");
                  setRoomTypeFilter("");
                  setAdvancePaymentFilter("all");
                }}
                className="w-full"
              >
                Clear All Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">
                  Total Checked-out
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {guestHistoryData.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>{" "}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">
                  Today's Checkouts
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {
                    filteredGuestHistory.filter((bill) => {
                      const today = new Date().toDateString();
                      const checkoutDate = new Date(
                        bill.checkoutDate
                      ).toDateString();
                      return checkoutDate === today;
                    }).length
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>{" "}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <CreditCard className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">
                  With Partial Payments
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {
                    filteredGuestHistory.filter((bill) => {
                      return (
                        bill.bill.billingSummary?.partialPayment &&
                        bill.bill.billingSummary.partialPayment > 0
                      );
                    }).length
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <MapPin className="h-8 w-8 text-orange-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">
                  Currently Filtered
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredGuestHistory.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Guest History List */}
      <div className="overflow-x-auto">
        {filteredGuestHistory.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                No Guest History Found
              </h3>
              <p className="text-gray-600">
                {searchTerm || dateFilter || checkinFilter || checkoutFilter || roomNoFilter || roomTypeFilter || advancePaymentFilter !== "all"
                  ? "Try adjusting your filters"
                  : "No checked-out guests yet"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <table className="min-w-full text-xs md:text-sm border border-gray-200 bg-white rounded-lg">
            <thead className="bg-blue-50">
              <tr>
                <th className="px-2 py-2 font-semibold text-left text-gray-700">
                  Guest Name
                </th>
                <th className="px-2 py-2 font-semibold text-left text-gray-700">
                  Booking ID
                </th>
                <th className="px-2 py-2 font-semibold text-left text-gray-700">
                  Check-in
                </th>
                <th className="px-2 py-2 font-semibold text-left text-gray-700">
                  Check-out
                </th>
                <th className="px-2 py-2 font-semibold text-left text-gray-700">
                  Room No.
                </th>
                <th className="px-2 py-2 font-semibold text-left text-gray-700">
                  Room Type
                </th>
                <th className="px-2 py-2 font-semibold text-left text-gray-700">
                  Duration
                </th>
                <th className="px-2 py-2 font-semibold text-left text-gray-700">
                  Guests
                </th>
                <th className="px-2 py-2 font-semibold text-left text-gray-700">
                  Advance Payment
                </th>
                <th className="px-2 py-2 font-semibold text-left text-gray-700">
                  Payment Mode
                </th>
                <th className="px-2 py-2 font-semibold text-left text-gray-700">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredGuestHistory?.map((guest) => {
                console.log("guest 😭😭😭😭😭", guest );

                return (
                  <tr
                    key={guest.bookingId}
                    className="border-t border-gray-100 hover:bg-gray-50"
                  >
                    <td className="px-2 py-2 whitespace-nowrap max-w-[12rem] truncate">
                      {guest.guestName}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-xs">
                      {guest.bookingId}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      {formatDate(guest.checkinDate)}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      {formatDate(guest.checkoutDate)}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      {guest.roomNumber || "N/A"}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      {guest.roomType || "N/A"}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      {guest.duration === 0 ? 1 : guest.duration} night
                      {guest.duration !== 1 ? "s" : ""}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      {guest.no_of_adults || 1} Adult
                      {(guest.no_of_adults || 1) !== 1 ? "s" : ""}
                      {(guest.no_of_children || 0) > 0 &&
                        `, ${guest.no_of_children || 0} Child${
                          (guest.no_of_children || 0) !== 1 ? "ren" : ""
                        }`}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      {guest.bill?.billingSummary?.partialPayment > 0 ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          ₹{guest.bill.billingSummary.partialPayment.toFixed(2)}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-500">
                          No Advance
                        </Badge>
                      )}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      <Badge variant="outline" className="text-gray-700">
                        {guest.payment_mode}
                      </Badge>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap flex items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() =>
                          handleViewBill(guest.bill, guest.guestName)
                        }
                        size="sm"
                      >
                        <FileText className="h-4 w-4 mr-1" /> Reprint Bill
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleViewVersionHistory(
                            guest.versionHistory,
                            guest.guestName
                          )
                        }
                        disabled={
                          !guest.versionHistory ||
                          guest.versionHistory.length === 0
                        }
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <OrderDetailsDialog
                        servicesData={guest.detailedServices}
                        orders={orders}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Version History Modal */}
      {isVersionHistoryOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50 p-2"
          onClick={() => setIsVersionHistoryOpen(false)}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[85vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">
                Version History - {selectedVersionHistory?.guestName}
              </h2>
              <button
                onClick={() => setIsVersionHistoryOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="p-3 overflow-y-auto max-h-[calc(85vh-60px)]">
              {selectedVersionHistory?.history &&
              selectedVersionHistory.history.length > 0 ? (
                <div className="space-y-3">
                  {selectedVersionHistory.history.map((version, index) => {
                    const formattedChanges = formatChanges(version.changes);
                    if (!formattedChanges) return null;

                    // Get all unique fields that were changed
                    const allFields = new Set([
                      ...formattedChanges.oldValues.map((item) => item.field),
                      ...formattedChanges.newValues.map((item) => item.field),
                    ]);

                    return (
                      <div
                        key={index}
                        className="border border-gray-200 rounded-lg overflow-hidden"
                      >
                        {/* Version Header */}
                        <div className="bg-slate-50 px-3 py-2 border-b border-slate-200">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-3">
                              <span className="bg-slate-600 text-white text-xs font-medium px-2 py-0.5 rounded">
                                v{selectedVersionHistory.history.length - index}
                              </span>
                              <span className="text-xs font-medium text-slate-700">
                                {version.changed_by || "Unknown"}
                              </span>
                            </div>
                            <span className="text-xs text-slate-500">
                              {formatDateTime(version.updated_at)}
                            </span>
                          </div>
                        </div>

                        {/* Changes Content - Horizontal Layout */}
                        <div className="p-3">
                          <div className="space-y-2">
                            {Array.from(allFields).map((field) => {
                              const oldValue = formattedChanges.oldValues.find(
                                (item) => item.field === field
                              );
                              const newValue = formattedChanges.newValues.find(
                                (item) => item.field === field
                              );

                              return (
                                <div
                                  key={field}
                                  className="bg-gray-50 rounded p-2"
                                >
                                  <h4 className="font-medium text-xs text-slate-700 mb-2">
                                    {getFieldLabel(field)}
                                  </h4>

                                  {/* Horizontal Before/After */}
                                  <div className="flex items-center space-x-2">
                                    {/* Previous Value */}
                                    <div className="flex-1">
                                      <div className="flex items-center mb-1">
                                        <div className="w-2 h-2 bg-slate-400 rounded-full mr-1"></div>
                                        <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                                          Old
                                        </span>
                                      </div>
                                      <div className="bg-slate-50 border-l-2 border-slate-300 p-2 rounded">
                                        <span className="text-xs text-slate-700 font-mono">
                                          {oldValue ? (
                                            oldValue.value === null ||
                                            oldValue.value === undefined ? (
                                              "Not set"
                                            ) : (
                                              String(oldValue.value)
                                            )
                                          ) : (
                                            <span className="text-slate-400 italic">
                                              No previous value
                                            </span>
                                          )}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Arrow */}
                                    <div className="flex-shrink-0 px-1">
                                      <svg
                                        className="w-4 h-4 text-slate-500"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                                        />
                                      </svg>
                                    </div>

                                    {/* New Value */}
                                    <div className="flex-1">
                                      <div className="flex items-center mb-1">
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full mr-1"></div>
                                        <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">
                                          New
                                        </span>
                                      </div>
                                      <div className="bg-emerald-50 border-l-2 border-emerald-400 p-2 rounded">
                                        <span className="text-xs text-emerald-800 font-mono">
                                          {newValue ? (
                                            newValue.value === null ||
                                            newValue.value === undefined ? (
                                              "Not set"
                                            ) : (
                                              String(newValue.value)
                                            )
                                          ) : (
                                            <span className="text-slate-400 italic">
                                              No new value
                                            </span>
                                          )}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-3">
                    <svg
                      className="w-12 h-12 mx-auto"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm">
                    No version history available
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bill Report Dialog */}
      {isBillDialogOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setIsBillDialogOpen(false)}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[95vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">
                Bill Report - {selectedBill?.guestName}
              </h2>
              <X
                onClick={() => setIsBillDialogOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold cursor-pointer"
              />
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(95vh-80px)]">
              {selectedBill?.bill && (
                <BillReport billData={selectedBill.bill} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuestHistory;
