import React, { useEffect, useState } from "react";
import { useAppContext } from "../../context/AppContext.jsx";
import { Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog.js";

const Bookings = () => {
  const { bookings, guests, fetchBookings, fetchGuests, loading } = useAppContext();
  const [reservedBookings, setReservedBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchBookings();
        await fetchGuests();
      } catch (error) {
        console.error("Error fetching bookings or guests:", error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (bookings && bookings.length > 0) {
      // Filter bookings with status "Reserved"
      const filtered = bookings.filter(booking => booking.status === "Reserved");
      setReservedBookings(filtered);
    }
  }, [bookings]);

  const getGuestName = (guestId) => {
    const guest = guests?.find(g => g.guest_id === guestId);
    return guest ? guest.full_name : "Unknown Guest";
  };

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
    const guest = guests?.find(g => g.guest_id === booking.guest_id);
    return guest || null;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = new Date(timestamp);
    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const handleViewBooking = (booking) => {
    setSelectedBooking(booking);
    setOpen(true);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2">Loading bookings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 px-20">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Reserved Bookings</h1>
        <p className="text-gray-600">Showing all bookings with status "Reserved"</p>
      </div>

      {reservedBookings.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No reserved bookings found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border border-gray-200 rounded-lg">
            <thead>
              <tr className="bg-gray-50">
                <th className="border-b border-gray-200 px-4 py-3 text-left text-sm font-semibold">
                  Guest Name
                </th>
                <th className="border-b border-gray-200 px-4 py-3 text-left text-sm font-semibold">
                  Contact
                </th>
                <th className="border-b border-gray-200 px-4 py-3 text-left text-sm font-semibold">
                  Booking Date
                </th>
                <th className="border-b border-gray-200 px-4 py-3 text-left text-sm font-semibold">
                  Check-in Date
                </th>
                <th className="border-b border-gray-200 px-4 py-3 text-left text-sm font-semibold">
                  Check-out Date
                </th>
                <th className="border-b border-gray-200 px-4 py-3 text-left text-sm font-semibold">
                  Guests
                </th>
                <th className="border-b border-gray-200 px-4 py-3 text-left text-sm font-semibold">
                  Booking Type
                </th>
                <th className="border-b border-gray-200 px-4 py-3 text-left text-sm font-semibold">
                  Source
                </th>
                <th className="border-b border-gray-200 px-4 py-3 text-left text-sm font-semibold">
                  Status
                </th>
                <th className="border-b border-gray-200 px-4 py-3 text-left text-sm font-semibold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {reservedBookings.map((booking, index) => {
                const guestDetails = getGuestDetails(booking);
                return (
                  <tr key={booking.booking_id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="border-b border-gray-200 px-4 py-3 text-sm font-medium">
                      {getGuestName(booking.guest_id)}
                    </td>
                    <td className="border-b border-gray-200 px-4 py-3 text-sm">
                      {guestDetails ? (
                        <div>
                          <div>{guestDetails.mobile}</div>
                          <div className="text-xs text-gray-500">{guestDetails.email}</div>
                        </div>
                      ) : (
                        "N/A"
                      )}
                    </td>
                    <td className="border-b border-gray-200 px-4 py-3 text-sm">
                      {formatDate(booking.booking_date)}
                    </td>
                    <td className="border-b border-gray-200 px-4 py-3 text-sm">
                      {formatDateTime(booking.checkin_date)}
                    </td>
                    <td className="border-b border-gray-200 px-4 py-3 text-sm">
                      {formatDateTime(booking.checkout_date)}
                    </td>
                    <td className="border-b border-gray-200 px-4 py-3 text-sm">
                      <div>
                        <span>Adults: {booking.no_of_adults}</span>
                        <br />
                        <span>Children: {booking.no_of_children}</span>
                      </div>
                    </td>
                    <td className="border-b border-gray-200 px-4 py-3 text-sm">
                      <span className="inline-block px-2 py-1 text-xs rounded" 
                            style={{backgroundColor: booking.booking_type === 'Advance' ? '#e3f2fd' : '#f3e5f5'}}>
                        {booking.booking_type}
                      </span>
                    </td>
                    <td className="border-b border-gray-200 px-4 py-3 text-sm">
                      {booking.booking_source}
                    </td>
                    <td className="border-b border-gray-200 px-4 py-3 text-sm">
                      <span className="inline-block px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-800">
                        {booking.status}
                      </span>
                    </td>
                    <td className="border-b border-gray-200 px-4 py-3 text-sm">
                      <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                          <button
                            onClick={() => handleViewBooking(booking)}
                            className="inline-flex items-center px-3 py-1 text-xs border rounded hover:bg-gray-50"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </button>
                        </DialogTrigger>
                      </Dialog>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 text-sm text-gray-500">
        Total Reserved Bookings: {reservedBookings.length}
      </div>

      {/* Shadcn Dialog for viewing booking details */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
            <DialogDescription>
              Complete information about the selected booking
            </DialogDescription>
          </DialogHeader>

          {selectedBooking && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              {/* Booking Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Booking Information</h3>
                <div>
                  <span className="font-medium text-sm text-gray-600">Booking ID:</span>
                  <p className="text-sm font-mono bg-gray-50 p-2 rounded mt-1 break-all">{selectedBooking.booking_id}</p>
                </div>
                <div>
                  <span className="font-medium text-sm text-gray-600">Guest ID:</span>
                  <p className="text-sm font-mono bg-gray-50 p-2 rounded mt-1 break-all">{selectedBooking.guest_id}</p>
                </div>
                <div>
                  <span className="font-medium text-sm text-gray-600">Booking Date:</span>
                  <p className="text-sm">{formatDateTime(selectedBooking.booking_date)}</p>
                </div>
                <div>
                  <span className="font-medium text-sm text-gray-600">Check-in Date:</span>
                  <p className="text-sm">{formatDateTime(selectedBooking.checkin_date)}</p>
                </div>
                <div>
                  <span className="font-medium text-sm text-gray-600">Check-out Date:</span>
                  <p className="text-sm">{formatDateTime(selectedBooking.checkout_date)}</p>
                </div>
                <div>
                  <span className="font-medium text-sm text-gray-600">Status:</span>
                  <div className="mt-1">
                    <span className="inline-block px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-800">
                      {selectedBooking.status}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="font-medium text-sm text-gray-600">Booking Type:</span>
                  <p className="text-sm">{selectedBooking.booking_type}</p>
                </div>
                <div>
                  <span className="font-medium text-sm text-gray-600">Booking Source:</span>
                  <p className="text-sm">{selectedBooking.booking_source}</p>
                </div>
              </div>

              {/* Guest Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Guest Information</h3>
                {(() => {
                  const guestDetails = getGuestDetails(selectedBooking);
                  return guestDetails ? (
                    <>
                      <div>
                        <span className="font-medium text-sm text-gray-600">Name:</span>
                        <p className="text-sm">{(guestDetails.name_prefix ? guestDetails.name_prefix + " " : "") + guestDetails.full_name}</p>
                      </div>
                      <div>
                        <span className="font-medium text-sm text-gray-600">Mobile:</span>
                        <p className="text-sm">{guestDetails.mobile}</p>
                      </div>
                      <div>
                        <span className="font-medium text-sm text-gray-600">Email:</span>
                        <p className="text-sm">{guestDetails.email}</p>
                      </div>
                      <div>
                        <span className="font-medium text-sm text-gray-600">Gender:</span>
                        <p className="text-sm">{guestDetails.gender}</p>
                      </div>
                      <div>
                        <span className="font-medium text-sm text-gray-600">Nationality:</span>
                        <p className="text-sm">{guestDetails.nationality}</p>
                      </div>
                      <div>
                        <span className="font-medium text-sm text-gray-600">Address:</span>
                        <p className="text-sm">{guestDetails.address}, {guestDetails.city}, {guestDetails.state}, {guestDetails.country} - {guestDetails.pincode}</p>
                      </div>
                      <div>
                        <span className="font-medium text-sm text-gray-600">ID Proof:</span>
                        <p className="text-sm">{guestDetails.id_proof_type}: {guestDetails.id_proof_number}</p>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-gray-500">Guest information not available</p>
                  );
                })()}
              </div>

              {/* Additional Details */}
              <div className="space-y-4 md:col-span-2">
                <h3 className="font-semibold text-lg border-b pb-2">Additional Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="font-medium text-sm text-gray-600">Number of Adults:</span>
                    <p className="text-sm">{selectedBooking.no_of_adults}</p>
                  </div>
                  <div>
                    <span className="font-medium text-sm text-gray-600">Number of Children:</span>
                    <p className="text-sm">{selectedBooking.no_of_children}</p>
                  </div>
                  <div>
                    <span className="font-medium text-sm text-gray-600">Rate Plan ID:</span>
                    <p className="text-sm">{selectedBooking.rate_plan_id}</p>
                  </div>
                  <div>
                    <span className="font-medium text-sm text-gray-600">Discount:</span>
                    <p className="text-sm">{selectedBooking.discount}%</p>
                  </div>
                  <div>
                    <span className="font-medium text-sm text-gray-600">Partial Payment:</span>
                    <p className="text-sm">₹{selectedBooking.partial_payment_amount}</p>
                  </div>
                  <div>
                    <span className="font-medium text-sm text-gray-600">Room IDs:</span>
                    <p className="text-xs font-mono bg-gray-50 p-2 rounded break-all">{selectedBooking.room_id?.join(", ")}</p>
                  </div>
                </div>
                <div>
                  <span className="font-medium text-sm text-gray-600">Special Requests:</span>
                  <p className="text-sm mt-1 p-3 bg-gray-50 rounded">{selectedBooking.special_requests || "None"}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="font-medium text-sm text-gray-600">Booked By:</span>
                    <p className="text-sm">{selectedBooking.booked_by || "Direct / Self"}</p>
                  </div>
                  <div>
                    <span className="font-medium text-sm text-gray-600">Pick Up Details:</span>
                    <p className="text-sm">{selectedBooking.pickup_details || "None"}</p>
                  </div>
                  <div>
                    <span className="font-medium text-sm text-gray-600">Drop Off Details:</span>
                    <p className="text-sm">{selectedBooking.dropoff_details || "None"}</p>
                  </div>
                </div>
                <div>
                  <span className="font-medium text-sm text-gray-600">Remarks:</span>
                  <p className="text-sm mt-1 p-3 bg-gray-50 rounded">{selectedBooking.remarks || "None"}</p>
                </div>
                {Array.isArray(selectedBooking.id_proofs) && selectedBooking.id_proofs.length > 0 && (
                  <div>
                    <span className="font-medium text-sm text-gray-600">Accompanying ID Proofs ({selectedBooking.id_proofs.length}):</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                      {selectedBooking.id_proofs.map((proof, i) => (
                        <div key={i} className="text-xs bg-gray-50 p-2 rounded border border-gray-200">
                          <p className="font-semibold text-gray-800">{proof.guest_name || "Guest"}</p>
                          <p className="text-gray-600">{proof.id_type}: {proof.id_number || "N/A"}</p>
                          {proof.file_name && <p className="text-[10px] text-blue-600 truncate">{proof.file_name}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <span className="font-medium text-sm text-gray-600">Assigned Staff ID:</span>
                  <p className="text-sm">{selectedBooking.assigned_staff_id || "Not assigned"}</p>
                </div>
                <div>
                  <span className="font-medium text-sm text-gray-600">Last Updated:</span>
                  <p className="text-sm">{formatDateTime(selectedBooking.updated_at)}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Bookings;
