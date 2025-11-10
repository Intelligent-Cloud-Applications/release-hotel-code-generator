import React from "react";

const LegalSignature = ({ billData, userData }) => {
  return (
    <>
    <div className="border-t-2 border-dashed border-black section-gap">
      <h3 className="font-bold text-black mb-3 text-base">
        Legal & Signature
      </h3>
      <div className="grid grid-cols-3 gap-8 text-xs">
        {/* Left Column - Legal Info */}
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
           <p className="text-[12px] text-gray-700 mb-4 leading-tight
  ">
            I agree that my liability for this bill is not waived and I agree to be held
            personally liable in the event that the indicated person, company,
            or association fails to pay the amount of this bill. All disputes
            are subject to the jurisdiction of the local court.
          </p>
          </>
  );
};

export default LegalSignature;
