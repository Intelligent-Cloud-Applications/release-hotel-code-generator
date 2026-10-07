import React from "react";

const BillingSummary = ({
  billData,
  isAmountEditing,
  editingDiscount,
  setEditingDiscount,
  editingAdvancePayment,
  setEditingAdvancePayment,
}) => {
  return (
    <div className="grid grid-cols-2 gap-8 mb-6 section-gap">
      <div>
        <h3 className="font-bold text-black mb-3 text-base">
          Billing Summary
        </h3>
        <div className="text-sm space-y-1">
          {/* 1. Total tarrif */}
          <div className="flex justify-between">
            <span>Total tarrif :</span>
            <span>
              ₹
              {(
                billData?.billingSummary?.totalRoomServices || 0
              ).toFixed(2)}
            </span>
          </div>

          {/* 2. Total discount */}
          <div className="flex justify-between">
            <span>
              Total discount :
              {isAmountEditing && (
                <span className="ml-2 text-xs text-blue-600">
                  (Editable)
                </span>
              )}
            </span>
            <span>
              {isAmountEditing ? (
                <div className="flex items-center">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    max="100"
                    className="w-20 text-right border border-gray-300 rounded px-1 py-0.5 text-xs"
                    value={(() => {
                      if (editingDiscount === 0) return "";
                      let totalBeforeDiscount = 0;
                      if (billData?.serviceChargesByDate) {
                        billData.serviceChargesByDate.forEach((dayData) => {
                          const date = Object.keys(dayData)[0];
                          const roomEntries = dayData[date];
                          roomEntries.forEach((roomEntry) => {
                            const charges = roomEntry.charges;
                            totalBeforeDiscount +=
                              (charges.roomCharges || 0) +
                              (charges.foodCharges || 0) +
                              (charges.laundryCharges || 0) +
                              (charges.minibarCharges || 0) +
                              (charges.extraBedCharges || 0) +
                              (charges.manualCharges || 0) +
                              (charges.extraPaxCharges || 0);
                          });
                        });
                      }
                      
                      let totalRatePlanFromBreakdown = 0;
                      if (billData?.serviceChargesByDate) {
                        billData.serviceChargesByDate.forEach((dayData) => {
                          const date = Object.keys(dayData)[0];
                          const roomEntries = dayData[date];
                          roomEntries.forEach((roomEntry) => {
                            const charges = roomEntry.charges;
                            if (charges.ratePlanCharges) {
                              totalRatePlanFromBreakdown += charges.ratePlanCharges;
                            }
                          });
                        });
                      }
                      
                      totalBeforeDiscount += totalRatePlanFromBreakdown;
                      
                      if (totalBeforeDiscount > 0) {
                        return ((editingDiscount / totalBeforeDiscount) * 100).toFixed(1);
                      }
                      return "";
                    })()}
                    onChange={(e) => {
                      const inputValue = e.target.value;
                      if (inputValue === "") {
                        setEditingDiscount(0);
                        return;
                      }
                      
                      const percentageValue = parseFloat(inputValue);
                      if (isNaN(percentageValue)) {
                        return;
                      }
                      
                      const clampedPercentage = Math.min(Math.max(percentageValue, 0), 100);
                      
                      let totalBeforeDiscount = 0;
                      if (billData?.serviceChargesByDate) {
                        billData.serviceChargesByDate.forEach((dayData) => {
                          const date = Object.keys(dayData)[0];
                          const roomEntries = dayData[date];
                          roomEntries.forEach((roomEntry) => {
                            const charges = roomEntry.charges;
                            totalBeforeDiscount +=
                              (charges.roomCharges || 0) +
                              (charges.foodCharges || 0) +
                              (charges.laundryCharges || 0) +
                              (charges.minibarCharges || 0) +
                              (charges.extraBedCharges || 0) +
                              (charges.manualCharges || 0) +
                              (charges.extraPaxCharges || 0);
                          });
                        });
                      }
                      
                      let totalRatePlanFromBreakdown = 0;
                      if (billData?.serviceChargesByDate) {
                        billData.serviceChargesByDate.forEach((dayData) => {
                          const date = Object.keys(dayData)[0];
                          const roomEntries = dayData[date];
                          roomEntries.forEach((roomEntry) => {
                            const charges = roomEntry.charges;
                            if (charges.ratePlanCharges) {
                              totalRatePlanFromBreakdown += charges.ratePlanCharges;
                            }
                          });
                        });
                      }
                      
                      totalBeforeDiscount += totalRatePlanFromBreakdown;
                      
                      const discountAmount = totalBeforeDiscount > 0 
                        ? (clampedPercentage / 100) * totalBeforeDiscount
                        : 0;
                      
                      const formattedDiscountAmount = Math.round(discountAmount * 100) / 100;
                      setEditingDiscount(formattedDiscountAmount);
                    }}
                  />
                  <span className="text-sm ml-1">%</span>
                </div>
              ) : (
                (() => {
                  const discountAmount = billData?.billingSummary?.totalDiscount || 0;
                  if (discountAmount > 0) {
                    let totalBeforeDiscount = 0;
                    if (billData?.serviceChargesByDate) {
                      billData.serviceChargesByDate.forEach((dayData) => {
                        const date = Object.keys(dayData)[0];
                        const roomEntries = dayData[date];
                        roomEntries.forEach((roomEntry) => {
                          const charges = roomEntry.charges;
                          totalBeforeDiscount +=
                            (charges.roomCharges || 0) +
                            (charges.foodCharges || 0) +
                            (charges.laundryCharges || 0) +
                            (charges.minibarCharges || 0) +
                            (charges.extraBedCharges || 0) +
                            (charges.manualCharges || 0) +
                            (charges.extraPaxCharges || 0);
                        });
                      });
                    }
                    
                    let totalRatePlanFromBreakdown = 0;
                    if (billData?.serviceChargesByDate) {
                      billData.serviceChargesByDate.forEach((dayData) => {
                        const date = Object.keys(dayData)[0];
                        const roomEntries = dayData[date];
                        roomEntries.forEach((roomEntry) => {
                          const charges = roomEntry.charges;
                          if (charges.ratePlanCharges) {
                            totalRatePlanFromBreakdown += charges.ratePlanCharges;
                          }
                        });
                      });
                    }
                    
                    totalBeforeDiscount += totalRatePlanFromBreakdown;
                    
                    const discountPercentage = totalBeforeDiscount > 0 
                      ? ((discountAmount / totalBeforeDiscount) * 100).toFixed(1)
                      : 0;
                    
                    return `${discountPercentage}%`;
                  } else {
                    return `0%`;
                  }
                })()
              )}
            </span>
          </div>

          {/* Optional Service / Food Charges if present */}
          {(billData?.billingSummary?.totalServiceCharges || 0) > 0 && (
            <div className="flex justify-between">
              <span>SERVICE / FOOD CHARGES :</span>
              <span>
                + ₹
                {(
                  billData?.billingSummary?.totalServiceCharges || 0
                ).toFixed(2)}
              </span>
            </div>
          )}

          {/* 3. CGST @ 2.5% */}
          <div className="flex justify-between">
            <span>
              CGST @ 2.5%:
            </span>
            <span>
              + ₹
              {(billData?.billingSummary?.cgstAmount || 0).toFixed(
                2
              )}
            </span>
          </div>

          {/* 4. SGST @ 2.5% */}
          <div className="flex justify-between">
            <span>
              SGST @ 2.5%:
            </span>
            <span>
              + ₹
              {(
                billData?.billingSummary?.sgstAmount || 0
              ).toFixed(2)}
            </span>
          </div>

          {/* 5. TOTAL TAX AMOUNT */}
          <div className="flex justify-between">
            <span>TOTAL TAX AMOUNT:</span>
            <span>
              ₹
              {(billData?.billingSummary?.totalTaxAmount || 0).toFixed(
                2
              )}
            </span>
          </div>

          {/* 6. ADVANCE PAYMENT */}
          <div className="flex justify-between">
            <span>ADVANCE PAYMENT:</span>
            <span>
              {isAmountEditing ? (
                <div className="flex items-center">
                  <span className="text-sm mr-1">- ₹</span>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    className="w-20 text-right border border-gray-300 rounded px-1 py-0.5 text-xs"
                    value={editingAdvancePayment}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "") {
                        setEditingAdvancePayment("");
                      } else {
                        const numValue = parseFloat(value);
                        if (!isNaN(numValue)) {
                          const formattedAmount = Math.round(numValue * 100) / 100;
                          setEditingAdvancePayment(formattedAmount);
                        }
                      }
                    }}
                  />
                </div>
              ) : (
                `- ₹${(
                  billData?.billingSummary?.partialPayment || 0
                ).toFixed(2)}`
              )}
            </span>
          </div>

          {/* 7. SUB TOTAL */}
          <div className="flex justify-between">
            <span>SUB TOTAL:</span>
            <span>
              ₹{(billData?.billingSummary?.subTotal || 0).toFixed(2)}
            </span>
          </div>

          {/* 8. GRAND TOTAL */}
          <div className="flex justify-between">
            <span>GRAND TOTAL:</span>
            <span>
              ₹{(billData?.billingSummary?.grandTotal || 0).toFixed(2)}
            </span>
          </div>

          {/* 9. NET PAYABLE */}
          <div className="flex justify-between border-t pt-1 font-bold">
            <span>NET PAYABLE :</span>
            <span>
              ₹{Math.max(0, billData?.billingSummary?.balanceDue || 0).toFixed(2)}
            </span>
          </div>

          {/* Refund Due / Excess Advance when advance exceeds grand total */}
          {(billData?.billingSummary?.balanceDue || 0) < 0 && (
            <div className="flex justify-between text-emerald-700 font-semibold text-xs pt-1">
              <span>REFUND DUE / EXCESS ADVANCE :</span>
              <span>
                ₹{Math.abs(billData?.billingSummary?.balanceDue || 0).toFixed(2)}
              </span>
            </div>
          )}
        </div>
      </div>

      <div>
        <h3 className="font-bold text-black mb-3 text-base">
          Final Summary
        </h3>
        <div className="text-sm">
          <div className="font-bold mb-2">AMOUNT IN WORDS:</div>
          <div className="text-xs italic border-1 p-2">
            {(billData?.billingSummary?.balanceDue || 0) < 0
              ? "Zero Rupees Only"
              : (billData?.finalSummary?.amountInWords || "Zero Rupees Only")}
          </div>
          <div className="mt-4 text-center">
            <div className="font-bold text-lg"></div>
            TOTAL: ₹
            {Math.max(0, billData?.billingSummary?.balanceDue !== undefined ? billData.billingSummary.balanceDue : (billData?.finalSummary?.totalAmount || 0)).toFixed(2)}
            {(billData?.billingSummary?.balanceDue || 0) < 0 && (
              <div className="text-xs text-emerald-700 font-semibold mt-1">
                (Refund: ₹{Math.abs(billData.billingSummary.balanceDue).toFixed(2)} to return to guest)
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingSummary;
