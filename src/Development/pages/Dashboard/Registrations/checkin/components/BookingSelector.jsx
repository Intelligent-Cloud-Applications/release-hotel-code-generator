import { Button } from "../../../../../components/ui/button.js";
import { Input } from "../../../../../components/ui/input.js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../../../components/ui/dialog.js";
import { Search } from "lucide-react";

const BookingSelector = ({
  isModalOpen,
  handleDialogOpen,
  dialogLoading,
  searchTerm,
  setSearchTerm,
  filteredBookings,
  guests,
  handleBookingSelect,
  formatDate,
  validationErrors,
}) => {
  return (
    <Dialog open={isModalOpen} onOpenChange={handleDialogOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Search className="w-4 h-4 mr-2" />
          Select Booking
        </Button>
      </DialogTrigger>
      {validationErrors.booking_id && (
        <div className="mt-2">
          <p className="text-red-500 text-sm">{validationErrors.booking_id}</p>
        </div>
      )}
      <DialogContent className="max-w-6xl w-[90vw] max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Select Reserved Booking</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1">
          {dialogLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
              <span className="text-gray-600">Loading bookings...</span>
            </div>
          ) : (
            <>
              <div className="mb-4 flex-shrink-0">
                <div className="relative">
                  <Input
                    placeholder="Search by booking ID, guest name, mobile, or room type..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                </div>
              </div>

              <div className="space-y-3 pb-4">
                {filteredBookings.length > 0 ? (
                  filteredBookings.map((booking) => {
                    const guest = guests.find(
                      (g) => g.guest_id === booking.guest_id
                    );
                    return (
                      <div
                        key={booking.booking_id}
                        className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => handleBookingSelect(booking)}
                      >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <h3 className="font-semibold text-gray-800 truncate">
                              {guest?.full_name || "Unknown Guest"}
                            </h3>
                            <p className="text-sm text-gray-600 truncate">
                              {guest?.mobile || "No mobile"}
                            </p>
                            <p className="text-sm text-gray-600 truncate">
                              {guest?.email || "No email"}
                            </p>
                          </div>

                          <div className="space-y-1">
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Booking ID:</span>{" "}
                              <span className="break-all">
                                {booking.booking_id.slice(0, 8)}...
                              </span>
                            </p>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Room Type:</span>{" "}
                              {booking.room_type}
                            </p>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Source:</span>{" "}
                              {booking.booking_source}
                            </p>
                          </div>

                          <div className="space-y-1">
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Check-in:</span>{" "}
                              {formatDate(booking.checkin_date)}
                            </p>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Check-out:</span>{" "}
                              {formatDate(booking.checkout_date)}
                            </p>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Guests:</span>{" "}
                              {booking.no_of_adults} Adults,{" "}
                              {booking.no_of_children} Children
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No reserved bookings found</p>
                    {searchTerm && (
                      <p className="text-sm text-gray-400 mt-2">
                        Try adjusting your search terms
                      </p>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookingSelector; 