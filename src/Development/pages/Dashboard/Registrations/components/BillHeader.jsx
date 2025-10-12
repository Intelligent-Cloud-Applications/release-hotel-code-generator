import React from "react";

const BillHeader = ({ billData }) => {
  return (
    <div className="text-center border-b-2 border-black border-dashed pb-4 mb-6">
      <h1 className="text-xl font-bold text-black mb-2 hotel-name">
        {billData.billHeader.hotelName}
      </h1>
      <p className="text-base text-black">
        {billData.billHeader.address}
      </p>
      <p className="text-base text-black">
        Contact: {billData.billHeader.contact} | Email:{" "}
        {billData.billHeader.email}
      </p>
      <div className="flex justify-between items-center mt-4 text-base">
        <div className="mt-2 text-base">
          <span className="font-semibold">Bill ID:</span>{" "}
          {billData.billHeader.bookingRef}
        </div>
        <div>
          <span className="font-semibold">GSTIN:</span>{" "}
          {billData.billHeader.gstIn}
        </div>
        <div>
          <span className="font-semibold">Bill Date:</span>{" "}
          {new Date(billData.billHeader.billDate).toLocaleDateString(
            "en-GB",
            {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            }
          )}{" "}
          {new Date(billData.billHeader.billDate).toLocaleTimeString(
            "en-US",
            {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: true,
            }
          )}
        </div>
      </div>
    </div>
  );
};

export default BillHeader;
