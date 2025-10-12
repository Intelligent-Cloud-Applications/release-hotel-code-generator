const SelectedBookingInfo = ({ selectedBooking, selectedGuest, formatDate }) => {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h3 className="font-semibold text-blue-800 mb-2">
        Selected Booking
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <p>
            <span className="font-medium">Guest:</span>{" "}
            {selectedGuest?.full_name}
          </p>
          <p>
            <span className="font-medium">Mobile:</span>{" "}
            {selectedGuest?.mobile}
          </p>
          <p>
            <span className="font-medium">Booking ID:</span>{" "}
            {selectedBooking.booking_id}
          </p>
        </div>
        <div>
          <p>
            <span className="font-medium">Room Type:</span>{" "}
            {selectedBooking.room_type}
          </p>
          <p>
            <span className="font-medium">Check-in:</span>{" "}
            {formatDate(selectedBooking.checkin_date)}
          </p>
          <p>
            <span className="font-medium">Check-out:</span>{" "}
            {formatDate(selectedBooking.checkout_date)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SelectedBookingInfo; 