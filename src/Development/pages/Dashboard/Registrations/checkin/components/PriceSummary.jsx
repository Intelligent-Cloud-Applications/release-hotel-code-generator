import { Input } from "../../../../../components/ui/input.js";
import { Label } from "../../../../../components/ui/label.js";

const PriceSummary = ({
  baseTariff,
  roomTariff,
  extraPaxAmount = 0,
  numberOfNights,
  discount,
  finalPrice,
  partialPaymentAmount,
  selectedRoomsCount = 1,
  onAmountChange, // New prop for handling amount changes
  selectedRooms = [], // New prop for individual room details
}) => {
  // Calculate the correct total amount
  const subtotal = (baseTariff + roomTariff + extraPaxAmount) * numberOfNights;
  const discountAmount = discount > 0 ? parseFloat(discount) : 0; // Discount is now in rupees
  const calculatedTotal = subtotal - discountAmount;

  const handleInputChange = (field, value) => {
    if (onAmountChange) {
      if (field === 'individualRoomTariff') {
        // For individual room tariff, pass the object directly
        onAmountChange(field, value);
      } else {
        // For other fields, convert string to number only if it's a valid number
        const numericValue = value === '' ? 0 : parseFloat(value);
        onAmountChange(field, isNaN(numericValue) ? 0 : numericValue);
      }
    }
  };

  return (
    <div className="border-t pt-6">
      <h3 className="text-lg font-medium text-gray-800 mb-4">
        Price Summary
      </h3>
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-medium text-blue-700">
              <span>Stay Duration:</span>
              <span>
                {numberOfNights} night
                {numberOfNights > 1 ? "s" : ""}
              </span>
            </div>

            {baseTariff > 0 && (
              <div className="flex justify-between text-sm items-center">
                <span>Rate Plan Tariff (per night):</span>
                <div className="flex items-center gap-2">
                  <span>₹</span>
                  <Input
                    type="text"
                    value={baseTariff || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow only numbers and decimal point
                      if (value === '' || /^\d*\.?\d*$/.test(value)) {
                        handleInputChange('baseTariff', value);
                      }
                    }}
                    placeholder="0"
                    className="w-28 h-7 text-sm"
                  />
                </div>
              </div>
            )}
            
            {roomTariff > 0 && selectedRoomsCount === 1 && (
              <div className="flex justify-between text-sm items-center">
                <span>Room Tariff (per night):</span>
                <div className="flex items-center gap-2">
                  <span>₹</span>
                  <Input
                    type="text"
                    value={roomTariff || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow only numbers and decimal point
                      if (value === '' || /^\d*\.?\d*$/.test(value)) {
                        handleInputChange('roomTariff', value);
                      }
                    }}
                    placeholder="0"
                    className="w-28 h-7 text-sm"
                  />
                </div>
              </div>
            )}

            {selectedRoomsCount > 1 && selectedRooms.length > 0 && (
              <div className="space-y-2 border-t pt-2 border-dashed border-gray-400">
                <div className="text-sm font-medium text-gray-700">
                  Room Details ({selectedRoomsCount} rooms):
                </div>
                {selectedRooms.map((room, index) => (
                  <div key={room.room_id || index} className="flex justify-between text-sm items-center">
                    <span>Room {room.room_number} ({room.room_type}):</span>
                    <div className="flex items-center gap-2">
                      <span>₹</span>
                      <Input
                        type="text"
                        value={room.tariff || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Allow only numbers and decimal point
                          if (value === '' || /^\d*\.?\d*$/.test(value)) {
                            // Update individual room tariff
                            const newTariff = parseFloat(value) || 0;
                            // Send individual room update to parent
                            handleInputChange('individualRoomTariff', {
                              roomId: room.room_id,
                              newTariff: newTariff
                            });
                          }
                        }}
                        placeholder="0"
                        className="w-28 h-7 text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {extraPaxAmount > 0 && (
              <div className="flex justify-between text-sm items-center text-purple-600">
                <span>Extra PAX Amount (per night):</span>
                <div className="flex items-center gap-2">
                  <span>₹</span>
                  <Input
                    type="text"
                    value={extraPaxAmount || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow only numbers and decimal point
                      if (value === '' || /^\d*\.?\d*$/.test(value)) {
                        handleInputChange('extraPaxAmount', value);
                      }
                    }}
                    placeholder="0"
                    className="w-28 h-7 text-sm"
                  />
                </div>
              </div>
            )}
            
            <div className="flex justify-between text-sm items-center">
              <span>Base Amount (per night):</span>
              <div className="flex items-center gap-2">
                <span>₹</span>
                                  <Input
                    type="text"
                    value={baseTariff + roomTariff + extraPaxAmount || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow only numbers and decimal point
                      if (value === '' || /^\d*\.?\d*$/.test(value)) {
                        const newBaseAmount = parseFloat(value) || 0;
                        const newRoomTariff = newBaseAmount - baseTariff - extraPaxAmount;
                        handleInputChange('roomTariff', newRoomTariff);
                      }
                    }}
                    placeholder="0"
                    className="w-28 h-7 text-sm"
                  />
              </div>
            </div>

            <div className="flex justify-between text-sm items-center text-green-600">
              <span>Discount (₹):</span>
              <div className="flex items-center gap-2">
                <span>₹</span>
                                  <Input
                    type="text"
                    value={discount || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow only numbers and decimal point
                      if (value === '' || /^\d*\.?\d*$/.test(value)) {
                        handleInputChange('discount', value);
                      }
                    }}
                    className="w-28 h-7 text-sm"
                    placeholder="0"
                  />
              </div>
            </div>

            <hr className="my-2" />

            <div className="flex justify-between text-base font-semibold items-center">
              <span>Total Amount:</span>
              <div className="flex items-center gap-2">
                <span className="text-blue-600">₹</span>
                <Input
                  type="text"
                  value={calculatedTotal || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Allow only numbers and decimal point
                    if (value === '' || /^\d*\.?\d*$/.test(value)) {
                      const newTotal = parseFloat(value) || 0;
                      const newDiscount = subtotal - newTotal;
                      handleInputChange('discount', newDiscount);
                    }
                  }}
                  placeholder="0"
                  className="w-28 h-7 text-sm font-semibold text-blue-600"
                />
              </div>
            </div>
            
            <div className="flex justify-between text-sm items-center text-orange-600">
              <span>Partial Payment:</span>
              <div className="flex items-center gap-2">
                <span>₹</span>
                <Input
                  type="text"
                  value={partialPaymentAmount || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Allow only numbers and decimal point
                    if (value === '' || /^\d*\.?\d*$/.test(value)) {
                      handleInputChange('partialPaymentAmount', value);
                    }
                  }}
                  className="w-28 h-7 text-sm"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="flex justify-between text-base font-semibold items-center text-red-600">
              <span>Remaining Balance:</span>
              <div className="flex items-center gap-2">
                <span>₹</span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={Math.max(0, calculatedTotal - (partialPaymentAmount || 0))}
                  readOnly
                  disabled
                  className="w-28 h-7 text-sm font-semibold text-red-600 bg-gray-100 cursor-not-allowed"
                />
              </div>
            </div>
          </div>
          
          <div className="md:border-l md:pl-4">
            <div className="text-sm text-gray-600">
              <p className="mb-2">
                <strong>Calculation Method:</strong>
              </p>
              <p>• Uses Rate Plan tariff as base amount</p>
              <p>• {selectedRoomsCount > 1 ? `Adds tariff for ${selectedRoomsCount} selected rooms` : 'Adds room tariff'}</p>
              <p>• {extraPaxAmount > 0 ? 'Adds extra PAX charges' : 'Includes extra PAX charges (if any)'}</p>
              <p>• Applies discount amount in rupees</p>
              <p>• Partial payment reduces the remaining balance</p>
              <p>• GST will be calculated separately at checkout</p>
              <p className="mt-2 text-xs text-blue-600">
                💡 You can edit any amount above to adjust the pricing
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriceSummary; 