import React from "react";

const LegalSignature = ({ billData, userData }) => {
  return (
    <div className="border-t-2 border-dashed border-black section-gap">
      <h3 className="font-bold text-black mb-3 text-base">
        Legal & Signature
      </h3>
      <div className="grid grid-cols-3 gap-8 text-xs">
        <div>
          <div className="space-y-1">
            <div>
              <span className="font-bold">GSTIN:</span>{" "}
              {billData.legalSignature.gstIn}
            </div>
            <div>
              <span className="font-bold">Room Stay SAC:</span>{" "}
              {billData.legalSignature.roomStaySac}
            </div>
            <div>
              <span className="font-bold">Room Service SAC:</span>{" "}
              {billData.legalSignature.roomServiceSac}
            </div>
            <div>
              <span className="font-bold">Food Service SAC:</span>{" "}
              {billData.legalSignature.foodServiceSac}
            </div>
          </div>
        </div>

        <div className="text-center">
          <div className="mb-16">
            <div className="font-bold">Guest Name:</div>
            <div className="text-sm mt-2">
              {billData.legalSignature.guestName}
            </div>
          </div>
          <div className="border-t border-black pt-2">
            <div className="font-bold">
              {billData.legalSignature.guestSignature}
            </div>
          </div>
        </div>

        <div className="text-center">
          <div className="mb-16">
            <div className="font-bold">
              {billData.legalSignature.cashierSignature}
            </div>
            <div className="text-sm mt-2">
              {userData?.userName || "Cashier Name"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegalSignature;
