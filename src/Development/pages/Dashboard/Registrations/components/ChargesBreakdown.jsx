import React from "react";

const ChargesBreakdown = ({ 
  billData, 
  isAmountEditing, 
  editingChargeAmounts, 
  setEditingChargeAmounts,
  isChargeExcluded,
  getFilteredCharges 
}) => {
  // Track which fields are currently being edited (have focus or are empty but being typed in)
  const [activeEditingFields, setActiveEditingFields] = React.useState(new Set());
  // Helper to extract granular laundry care types if available
  const getLaundryDescription = (roomNum, serviceDate) => {
    try {
      const saved = localStorage.getItem("hotel_laundry_orders");
      if (!saved) return "Laundry Charges";
      const parsedOrders = JSON.parse(saved);
      const matched = parsedOrders.filter(
        (o) =>
          String(o.roomNumber) === String(roomNum) &&
          (o.createdAt ? o.createdAt.startsWith(serviceDate) : true)
      );
      if (matched.length > 0) {
        const allItems = matched.flatMap((o) => o.items || []);
        const careLabels = Array.from(
          new Set(
            allItems.map((i) =>
              i.careType === "wash_and_press"
                ? "Wash & Press"
                : i.careType === "press_only"
                ? "Iron Only"
                : i.careType === "dry_clean"
                ? "Dry Clean"
                : "Care"
            )
          )
        );
        const totalPcs = matched.reduce((sum, o) => sum + (o.totalGarments || 0), 0);
        if (careLabels.length > 0) {
          return `Laundry Charges (${totalPcs > 0 ? `${totalPcs} pcs: ` : ""}${careLabels.join(", ")})`;
        }
      }
    } catch (e) {}
    return "Laundry Charges";
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2 mt-2">
        <h3 className="font-bold text-black text-base">
          Charges Breakdown (Day-wise)
        </h3>
        {isAmountEditing && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-3 py-1 rounded text-sm">
            ✏️ Editing Mode - Modify amounts and click "Submit"
          </div>
        )}
      </div>
      <div className="mt-1">
        <table className="w-full text-xs breakdown-table">
          <thead>
            <tr className="border-b-1 border-black">
              <th className="border-r-1 border-black px-2 py-2 text-left font-bold bg-gray-100">
                S.No
              </th>
              <th className="border-r-1 border-black px-2 py-2 text-left font-bold bg-gray-100">
                Date
              </th>
              {/* <th className="border-r-1 border-black px-2 py-2 text-left font-bold bg-gray-100">
                HSN/SAC
              </th> */}
              <th className="border-r-1 border-black px-2 py-2 text-left font-bold bg-gray-100">
                Room No.
              </th>
              <th className="border-r-1 border-black px-2 py-2 text-left font-bold bg-gray-100">
                Particulars
              </th>
              <th className="px-2 py-2 text-right font-bold bg-gray-100">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {billData.serviceChargesByDate &&
            billData.serviceChargesByDate.length > 0 ? (
              (() => {
                let serialNumber = 1; // Global counter for serial numbers

                return billData.serviceChargesByDate.map(
                  (dayData, dayIndex) => {
                    const date = Object.keys(dayData)[0];
                    const roomEntries = dayData[date];

                    return roomEntries.map((roomEntry, roomIndex) => {
                      const charges = roomEntry.charges;
                      const roomNumber = roomEntry.roomNumber;
                      const roomType = roomEntry.roomType;

                      const chargeKey = `${dayIndex}-${roomIndex}`;
                      const editingData = editingChargeAmounts[chargeKey];

                      const particulars = [
                        {
                          description: `Rate Plan Base Tariff`,
                          amount: Number(
                            billData?.bookingDetails
                              ?.ratePlanBaseTariff || 0
                          ),
                          type: "ratePlanBaseTariff",
                        },
                        {
                          description: `Room Charges`,
                          amount: Number(isAmountEditing && editingData
                            ? editingData.roomCharges
                            : charges.roomCharges) || 0,
                          type: "roomCharges",
                        },
                        // Show charge types that have values OR are being actively edited
                        ...(() => {
                          const chargeTypes = [
                            {
                              key: "extraPaxCharges",
                              description:
                                Array.isArray(billData?.extraPaxList) && billData.extraPaxList.length > 0
                                  ? `Extra Pax Charges (${billData.extraPaxList.map((p) => p.full_name).filter(Boolean).join(", ")})`
                                  : "Extra Pax Charges",
                            },
                            { key: "foodCharges", description: "Food Charges" },
                            {
                              key: "laundryCharges",
                              description: getLaundryDescription(roomNumber, date),
                            },
                            { key: "minibarCharges", description: "Bar Charges" },
                            { key: "extraBedCharges", description: "Extra Bed Charges" },
                            { key: "manualCharges", description: "Miscellaneous Charges" },
                          ];
                          
                          return chargeTypes
                            .filter(chargeType => {
                              const fieldKey = `${chargeKey}-${chargeType.key}`;
                              const isActivelyEditing = activeEditingFields.has(fieldKey);
                              const currentAmount = editingData ? editingData[chargeType.key] : (Number(charges[chargeType.key]) || 0);
                              const hasAmount = (Number(currentAmount) || 0) > 0;
                              
                              // Check if this field had an original amount > 0 (before editing)
                              const originalAmount = Number(charges[chargeType.key]) || 0;
                              const hadOriginalAmount = originalAmount > 0;
                              
                              // Show if it has amount OR is being actively edited OR had original amount > 0
                              return hasAmount || isActivelyEditing || (isAmountEditing && hadOriginalAmount);
                            })
                            .map(chargeType => ({
                              description: chargeType.description,
                              amount: editingData ? editingData[chargeType.key] : (Number(charges[chargeType.key]) || 0),
                              type: chargeType.key,
                            }));
                        })(),
                      ].filter(
                        (particular) =>
                          !isChargeExcluded(particular.type)
                      );

                      // Get filtered charges for display
                      const filteredCharges = isAmountEditing && editingData ? 
                        getFilteredCharges({
                          ...charges,
                          roomCharges: editingData.roomCharges || 0,
                          foodCharges: editingData.foodCharges || 0,
                          laundryCharges: editingData.laundryCharges || 0,
                          minibarCharges: editingData.minibarCharges || 0,
                          extraBedCharges: editingData.extraBedCharges || 0,
                          manualCharges: editingData.manualCharges || 0,
                          extraPaxCharges: editingData.extraPaxCharges || 0,
                          dailyTotal: (editingData.roomCharges || 0) + 
                            (editingData.foodCharges || 0) + 
                            (editingData.laundryCharges || 0) + 
                            (editingData.minibarCharges || 0) + 
                            (editingData.extraBedCharges || 0) + 
                            (editingData.manualCharges || 0) + 
                            (editingData.extraPaxCharges || 0) + 
                            (billData?.bookingDetails?.ratePlanBaseTariff || 0)
                        }) : 
                        getFilteredCharges(charges);

                      // Rowspan for this room (only particulars, not including total row)
                      const rowspan = particulars.length;

                      const currentSerialNumber = serialNumber;
                      serialNumber++; // Increment for next room entry

                      return (
                        <React.Fragment
                          key={`${dayIndex}-${roomIndex}`}
                        >
                          {particulars.map((particular, pIndex) => (
                            <tr
                              key={`${dayIndex}-${roomIndex}-${pIndex}`}
                              className="border-b border-black"
                            >
                              {pIndex === 0 && (
                                <>
                                  <td
                                    className="border-r-1 border-black px-2 py-1 text-center align-top"
                                    rowSpan={rowspan}
                                  >
                                    {currentSerialNumber}
                                  </td>
                                  <td
                                    className="border-r-1 border-black px-2 py-1 text-center align-top"
                                    rowSpan={rowspan}
                                  >
                                    {new Date(date).toLocaleDateString(
                                      "en-IN",
                                      {
                                        day: "2-digit",
                                        month: "2-digit",
                                        year: "numeric",
                                      }
                                    )}
                                  </td>
                                  {/* <td
                                    className="border-r-1 border-black px-2 py-1 text-center align-top"
                                    rowSpan={rowspan}
                                  >
                                    996311
                                  </td> */}
                                  <td
                                    className="border-r-1 border-black px-2 py-1 text-center align-top"
                                    rowSpan={rowspan}
                                  >
                                    {roomNumber}
                                  </td>
                                </>
                              )}
                              {/* Show rows if: 
                                  1. Amount > 0, OR 
                                  2. In editing mode AND this field is being actively edited, OR
                                  3. In editing mode AND this field was previously visible (had original amount > 0) */}
                              {(() => {
                                const fieldKey = `${chargeKey}-${particular.type}`;
                                const isActivelyEditing = activeEditingFields.has(fieldKey);
                                const hasAmount = (Number(particular.amount) || 0) > 0;
                                
                                // Check if this field had an original amount > 0 (before editing)
                                const originalAmount = editingData ? 
                                  (Number(charges[particular.type]) || 0) : 
                                  (Number(particular.amount) || 0);
                                const hadOriginalAmount = originalAmount > 0;
                                
                                // Always show room charges, even if they're 0
                                const isRoomCharges = particular.type === "roomCharges";
                                
                                return isRoomCharges || 
                                       hasAmount || 
                                       (isAmountEditing && isActivelyEditing) || 
                                       (isAmountEditing && hadOriginalAmount);
                              })() && (
                                <>
                                  <td className="border-r-1 border-black px-2 py-1">
                                    {particular.description}
                                  </td>
                                  <td className="px-2 py-1 text-right">
                                    {isChargeExcluded(
                                        particular.type
                                      ) ? (
                                      <span className="line-through text-gray-400">
                                        ₹{(Number(particular.amount) || 0).toFixed(2)}
                                      </span>
                                    ) : isAmountEditing && editingData && particular.type !== "ratePlanBaseTariff" ? (
                                      <div className="flex items-center justify-end">
                                        <span className="text-xs mr-1">₹</span>
                                        <input
                                          type="number"
                                          step="any"
                                          min="0"
                                          className="w-16 text-right border border-gray-300 rounded px-1 py-0.5 text-xs"
                                          value={particular.amount === '' ? '' : (particular.amount === 0 ? '0' : String(particular.amount))}
                                          onChange={(e) => {
                                            let value = e.target.value;
                                            const fieldKey = `${chargeKey}-${particular.type}`;
                                            
                                            // Mark this field as actively being edited
                                            setActiveEditingFields(prev => new Set(prev).add(fieldKey));
                                            
                                            // Allow empty input temporarily while typing
                                            if (value === '') {
                                              setEditingChargeAmounts(prev => ({
                                                ...prev,
                                                [chargeKey]: {
                                                  ...prev[chargeKey],
                                                  [particular.type]: ''
                                                }
                                              }));
                                              return;
                                            }
                                            
                                            // Parse the value and ensure it's not negative
                                            const numericValue = Math.max(0, parseFloat(value) || 0);
                                            
                                            setEditingChargeAmounts(prev => ({
                                              ...prev,
                                              [chargeKey]: {
                                                ...prev[chargeKey],
                                                [particular.type]: numericValue
                                              }
                                            }));
                                          }}
                                          onBlur={(e) => {
                                            const fieldKey = `${chargeKey}-${particular.type}`;
                                            
                                            // Set to 0 if empty on blur
                                            if (e.target.value === '' || e.target.value.trim() === '') {
                                              setEditingChargeAmounts(prev => ({
                                                ...prev,
                                                [chargeKey]: {
                                                  ...prev[chargeKey],
                                                  [particular.type]: 0
                                                }
                                              }));
                                            }
                                            
                                            // Remove from actively editing fields after a short delay
                                            // This allows the row to stay visible briefly
                                            setTimeout(() => {
                                              setActiveEditingFields(prev => {
                                                const newSet = new Set(prev);
                                                newSet.delete(fieldKey);
                                                return newSet;
                                              });
                                            }, 100);
                                          }}
                                          onFocus={(e) => {
                                            const fieldKey = `${chargeKey}-${particular.type}`;
                                            
                                            // Mark this field as actively being edited
                                            setActiveEditingFields(prev => new Set(prev).add(fieldKey));
                                            
                                            // Allow editing by selecting all text
                                            e.target.select();
                                          }}
                                        />
                                      </div>
                                    ) : (
                                      `₹${(Number(particular.amount) || 0).toFixed(2)}`
                                    )}
                                  </td>
                                </>
                              )}
                            </tr>
                          ))}
                          <tr className="border-b-1 border-black bg-gray-100">
                            <td className="border-r-1 border-black px-2 py-1"></td>
                            <td className="border-r-1 border-black px-2 py-1"></td>
                            <td className="border-r-1 border-black px-2 py-1"></td>
                            {/* <td className="border-r-1 border-black px-2 py-1"></td> */}
                            <td className="border-r-1 border-black px-2 py-1 font-bold">
                              ROOM {roomNumber} TOTAL:
                            </td>
                            <td className="px-2 py-1 font-bold text-right">
                              ₹
                              {(
                                filteredCharges.dailyTotal || 0
                              ).toFixed(2)}
                            </td>
                          </tr>
                        </React.Fragment>
                      );
                    });
                  }
                );
              })()
            ) : (
              <tr>
                <td
                  colSpan="6"
                  className="text-center py-4 text-gray-500"
                >
                  No charges breakdown data available
                  <br />
                  <small>
                    Debug: serviceChargesByDate ={" "}
                    {JSON.stringify(billData?.serviceChargesByDate)}
                  </small>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ChargesBreakdown;
