import React from "react";

const BillingSummary = ({ 
  billData, 
  isAmountEditing, 
  editingDiscount, 
  setEditingDiscount,
  editingAdvancePayment,
  setEditingAdvancePayment,
  editingChargeAmounts 
}) => {
  // Local state for percentage input
  const [editingDiscountPercentage, setEditingDiscountPercentage] = React.useState('');

  // Calculate percentage from discount amount when editing starts
  React.useEffect(() => {
    if (isAmountEditing && editingDiscount > 0) {
      // Calculate total before discount
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
      
      // Add rate plan charges
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
      
      const percentage = totalBeforeDiscount > 0 
        ? ((editingDiscount / totalBeforeDiscount) * 100)
        : 0;
      
      setEditingDiscountPercentage(percentage.toString());
    } else if (isAmountEditing && editingDiscount === 0) {
      setEditingDiscountPercentage('');
    }
  }, [isAmountEditing, editingDiscount, billData?.serviceChargesByDate]);
  return (
    <div className="grid grid-cols-2 gap-8 mb-6 section-gap">
      <div>
        <h3 className="font-bold text-black mb-3 text-base">
          Billing Summary
        </h3>
        <div className="text-sm space-y-1">
          {billData?.bookingDetails?.ratePlanBaseTariff > 0 && (
            <div className="flex justify-between">
              <span>RATE PLAN CHARGES:</span>
              <span>
                +₹
                {(() => {
                  // Calculate total rate plan charges from breakdown
                  let totalRatePlanFromBreakdown = 0;
                  if (billData?.serviceChargesByDate) {
                    billData.serviceChargesByDate.forEach((dayData) => {
                      const date = Object.keys(dayData)[0];
                      const roomEntries = dayData[date];
                      roomEntries.forEach((roomEntry) => {
                        const charges = roomEntry.charges;
                        if (charges.ratePlanCharges) {
                          totalRatePlanFromBreakdown +=
                            charges.ratePlanCharges;
                        }
                      });
                    });
                  }
                  return totalRatePlanFromBreakdown.toFixed(2);
                })()}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span>TOTAL ROOM SERVICES:</span>
            <span>
              +₹
              {(() => {
                // Calculate total room charges from breakdown
                let totalRoomFromBreakdown = 0;
                if (billData?.serviceChargesByDate) {
                  billData.serviceChargesByDate.forEach((dayData, dayIndex) => {
                    const date = Object.keys(dayData)[0];
                    const roomEntries = dayData[date];
                    roomEntries.forEach((roomEntry, roomIndex) => {
                      const chargeKey = `${dayIndex}-${roomIndex}`;
                      const editingData = editingChargeAmounts[chargeKey];
                      
                      if (isAmountEditing && editingData) {
                        totalRoomFromBreakdown += editingData.roomCharges || 0;
                      } else {
                        const charges = roomEntry.charges;
                        if (charges.roomCharges) {
                          totalRoomFromBreakdown += charges.roomCharges;
                        }
                      }
                    });
                  });
                }
                return Number(totalRoomFromBreakdown).toFixed(2);
              })()}
            </span>
          </div>
          <div className="flex justify-between">
            <span>TOTAL SERVICE CHARGES:</span>
            <span>
              +₹
              {(() => {
                // Calculate total service charges from breakdown
                let totalServiceFromBreakdown = 0;
                if (billData?.serviceChargesByDate) {
                  billData.serviceChargesByDate.forEach((dayData, dayIndex) => {
                    const date = Object.keys(dayData)[0];
                    const roomEntries = dayData[date];
                    roomEntries.forEach((roomEntry, roomIndex) => {
                      const chargeKey = `${dayIndex}-${roomIndex}`;
                      const editingData = editingChargeAmounts[chargeKey];
                      
                      if (isAmountEditing && editingData) {
                        totalServiceFromBreakdown += 
                          (editingData.foodCharges || 0) +
                          (editingData.laundryCharges || 0) +
                          (editingData.minibarCharges || 0) +
                          (editingData.extraBedCharges || 0) +
                          (editingData.manualCharges || 0);
                      } else {
                        const charges = roomEntry.charges;
                        totalServiceFromBreakdown +=
                          (charges.foodCharges || 0) +
                          (charges.laundryCharges || 0) +
                          (charges.minibarCharges || 0) +
                          (charges.extraBedCharges || 0) +
                          (charges.manualCharges || 0);
                      }
                    });
                  });
                }
                return Number(totalServiceFromBreakdown).toFixed(2);
              })()}
            </span>
          </div>
          {(() => {
            // Calculate total extra pax charges from breakdown
            let totalExtraPaxFromBreakdown = 0;
            if (billData?.serviceChargesByDate) {
              billData.serviceChargesByDate.forEach((dayData, dayIndex) => {
                const date = Object.keys(dayData)[0];
                const roomEntries = dayData[date];
                roomEntries.forEach((roomEntry, roomIndex) => {
                  const chargeKey = `${dayIndex}-${roomIndex}`;
                  const editingData = editingChargeAmounts[chargeKey];
                  
                  if (isAmountEditing && editingData) {
                    if (editingData.extraPaxCharges) {
                      totalExtraPaxFromBreakdown += editingData.extraPaxCharges;
                    }
                  } else {
                    const charges = roomEntry.charges;
                    if (charges.extraPaxCharges) {
                      totalExtraPaxFromBreakdown += charges.extraPaxCharges;
                    }
                  }
                });
              });
            }
            return totalExtraPaxFromBreakdown > 0 ? (
              <div className="flex justify-between">
                <span>EXTRA PAX CHARGES:</span>
                <span>
                  + ₹{totalExtraPaxFromBreakdown.toFixed(2)}
                </span>
              </div>
            ) : null;
          })()}
          <div className="flex justify-between">
            <span>
              TOTAL DISCOUNT:
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
                    value={editingDiscountPercentage || ''}
                    onChange={(e) => {
                      const inputValue = e.target.value;
                      // Allow empty string for better UX
                      if (inputValue === '') {
                        setEditingDiscountPercentage('');
                        setEditingDiscount(0);
                        return;
                      }
                      
                      const percentageValue = parseFloat(inputValue);
                      if (isNaN(percentageValue)) return;
                      
                      // Ensure percentage doesn't exceed 100
                      const clampedPercentage = Math.min(Math.max(percentageValue, 0), 100);
                      setEditingDiscountPercentage(clampedPercentage);
                      
                      // Calculate total before discount
                      let totalBeforeDiscount = 0;
                      if (billData?.serviceChargesByDate) {
                        billData.serviceChargesByDate.forEach((dayData, dayIndex) => {
                          const date = Object.keys(dayData)[0];
                          const roomEntries = dayData[date];
                          roomEntries.forEach((roomEntry, roomIndex) => {
                            const chargeKey = `${dayIndex}-${roomIndex}`;
                            const editingData = editingChargeAmounts[chargeKey];
                            
                            if (editingData) {
                              totalBeforeDiscount += 
                                (editingData.roomCharges || 0) +
                                (editingData.foodCharges || 0) +
                                (editingData.laundryCharges || 0) +
                                (editingData.minibarCharges || 0) +
                                (editingData.extraBedCharges || 0) +
                                (editingData.manualCharges || 0) +
                                (editingData.extraPaxCharges || 0);
                            } else {
                              const charges = roomEntry.charges;
                              totalBeforeDiscount +=
                                (charges.roomCharges || 0) +
                                (charges.foodCharges || 0) +
                                (charges.laundryCharges || 0) +
                                (charges.minibarCharges || 0) +
                                (charges.extraBedCharges || 0) +
                                (charges.manualCharges || 0) +
                                (charges.extraPaxCharges || 0);
                            }
                          });
                        });
                      }
                      
                      // Add rate plan charges
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
                      
                      // Convert percentage to amount
                      const discountAmount = totalBeforeDiscount > 0 
                        ? (clampedPercentage / 100) * totalBeforeDiscount
                        : 0;
                      
                      // Format the discount amount to avoid floating-point precision issues
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
                    // Calculate total before discount
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
                    
                    // Add rate plan charges
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
          <div className="flex justify-between">
            <span>TOTAL TAX AMOUNT:</span>
            <span>
              ₹
              {(billData?.billingSummary?.totalTaxAmount || 0).toFixed(
                2
              )}
            </span>
          </div>
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
                          // Format the advance payment amount to avoid floating-point precision issues
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
          <div className="flex justify-between">
            <span>SUB TOTAL:</span>
            <span>
              ₹{(billData?.billingSummary?.subTotal || 0).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>GRAND TOTAL:</span>
            <span>
              ₹{(billData?.finalSummary?.totalAmount || 0).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between border-t pt-1 font-bold">
            <span>BALANCE DUE:</span>
            <span>
              ₹{(billData?.billingSummary?.balanceDue || 0).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-bold text-black mb-3 text-base">
          Final Summary
        </h3>
        <div className="text-sm">
          <div className="font-bold mb-2">AMOUNT IN WORDS:</div>
          <div className="text-xs italic border-1 p-2">
            {billData.finalSummary.amountInWords}
          </div>
          <div className="mt-4 text-center">
            <div className="font-bold text-lg"></div>
            TOTAL: ₹
            {(billData?.finalSummary?.totalAmount || 0).toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingSummary;
