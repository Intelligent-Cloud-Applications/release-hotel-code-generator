import React from "react";

const BookingDetails = ({ billData }) => {
  return (
    <div className="mb-4">
      <h3 className="font-bold text-black mb-2 text-base">
        Booking Details
      </h3>
      <div className="mt-1">
        <table className="w-full text-sm guest-booking-table">
          <tbody>
            <tr className="border-b border-black">
              <td className="border-r-1 border-black px-3 py-2 font-semibold bg-gray-100">
                Booking ID
              </td>
              <td className="border-r-1 border-black px-3 py-2">
                {billData.bookingDetails.bookingId}
              </td>
              <td className="border-r-1 border-black px-3 py-2 font-semibold bg-gray-100">
                Booking Type
              </td>
              <td className="px-3 py-2">
                {billData.bookingDetails?.bookingType}
              </td>
            </tr>
            <tr className="border-b border-black">
              <td className="border-r-1 border-black px-3 py-2 font-semibold bg-gray-100">
                Booking Source
              </td>
              <td className="border-r-1 border-black px-3 py-2">
                {billData.bookingDetails?.bookingSource}
              </td>
              <td className="border-r-1 border-black px-3 py-2 font-semibold bg-gray-100">
                Rate Plan
              </td>
              <td className="px-3 py-2">
                {billData.bookingDetails?.ratePlanName}
              </td>
            </tr>
            <tr className="border-b border-black">
              <td className="border-r-1 border-black px-3 py-2 font-semibold bg-gray-100">
                Check-in Date
              </td>
              <td className="border-r-1 border-black px-3 py-2">
                {new Date(
                  billData.bookingDetails?.checkIn
                ).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}{" "}
                {new Date(
                  billData.bookingDetails?.checkIn
                ).toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })}
              </td>
              <td className="border-r-1 border-black px-3 py-2 font-semibold bg-gray-100">
                Check-out Date
              </td>
              <td className="px-3 py-2">
                {new Date(
                  billData.bookingDetails?.checkOut
                ).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}{" "}
                {new Date(
                  billData.bookingDetails?.checkOut
                ).toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })}
              </td>
            </tr>
            <tr className={`${(billData.bookingDetails.companyName && 
              billData.bookingDetails.companyName !== "N/A" && 
              billData.bookingDetails.companyGstNo && 
              billData.bookingDetails.companyGstNo !== "N/A") ? "border-b border-black" : "border-black"}`}>
              <td className="border-r-1 border-black px-3 py-2 font-semibold bg-gray-100">
                Room Number
              </td>
              <td className="border-r-1 border-black px-3 py-2">
                {billData.bookingDetails?.roomNumber}
              </td>
              <td className="border-r-1 border-black px-3 py-2 font-semibold bg-gray-100">
                Room Type
              </td>
              <td className="px-3 py-2">
                {billData.bookingDetails?.roomType}
              </td>
            </tr>
            {(billData.bookingDetails.companyName && 
              billData.bookingDetails.companyName !== "N/A" && 
              billData.bookingDetails.companyGstNo && 
              billData.bookingDetails.companyGstNo !== "N/A") && (
              <tr className="border-black">
                <td className="border-r-1 border-black px-3 py-2 font-semibold bg-gray-100">
                  Company Name
                </td>
                <td className="border-r-1 border-black px-3 py-2">
                  {billData.bookingDetails.companyName}
                </td>
                <td className="border-r-1 border-black px-3 py-2 font-semibold bg-gray-100">
                  GST Number
                </td>
                <td className="px-3 py-2">
                  {billData.bookingDetails.companyGstNo}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BookingDetails;
