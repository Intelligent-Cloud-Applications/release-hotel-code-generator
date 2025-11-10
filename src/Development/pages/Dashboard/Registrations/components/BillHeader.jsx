import React from "react";
import logo from "../assets/logo.png";
import { institutionId } from "../../../../../Operation/data.json";
const BillHeader = ({ bills, billData }) => {
  const showLogo = institutionId === "DISH5877";
  console.log("BillHeader Rendered with bills:", institutionId);
  return (
    <div className="border-b-2 border-black border-dashed pb-4 mb-6">
      <div className="flex justify-between items-start mb-4 print:mb-2">
        {/* Left side: Logo (conditional) */}
        <div className="absolute">
          {showLogo && logo && (
            <img
              src={logo}
              alt="Hotel Logo"
              className="h-16 w-auto print:h-12 object-contain"
            />
          )}
        </div>

        {/* Center: Hotel details */}
        <div className="flex-grow text-center">
          <h1 className="text-xl font-bold text-black mb-2 hotel-name print:text-lg">
            {billData.billHeader.hotelName}
          </h1>
          <p className="text-base text-black print:text-sm mb-1">
            {billData.billHeader.address}
          </p>
          <p className="text-base text-black print:text-sm mb-2">
            Contact: {billData.billHeader.contact} | Email:{" "}
            {billData.billHeader.email}
          </p>
        </div>
      </div>

      {/* Bill info row - full width below */}
      <div className="grid grid-cols-3 w-full text-base print:text-sm gap-2 items-start">
        <div className="mt-1">
          <span className="font-semibold">Bill Number:</span> {bills}
        </div>

        <div className="text-center">
          <span className="font-semibold ">GSTIN:</span>{" "}
          {billData.billHeader.gstIn}
        </div>

        <div className="text-right">
          <span className="font-semibold">Bill Date:</span>{" "}
          {new Date(billData.billHeader.billDate).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })}{" "}
          {new Date(billData.billHeader.billDate).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
          })}
        </div>
      </div>
    </div>
  );
};

export default BillHeader;