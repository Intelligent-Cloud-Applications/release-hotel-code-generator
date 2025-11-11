import React from "react";
import { Button } from "../../../components/ui/button.js";
import { Download, Printer } from "lucide-react";
import { useAppContext } from "../../../context/AppContext.jsx";
import { useAuthContext } from "../../../context/AuthContext.jsx";
// Import your new components
import BillHeader from "./components/BillHeader.jsx";
import GuestDetails from "./components/GuestDetails.jsx";
import LegalSignature from "./components/LegalSignature.jsx";

const handlePrint = () => {
  window.print();
};

const handleDownload = () => {
  window.print(); // For now, use print for download as well
};

const isChargeExcluded = (type) => {
  return false; // Simplified - show all charges
};

const CHARGE_TYPES = [
  { key: "foodCharges", label: "Food Charges" },
  { key: "laundryCharges", label: "Laundry Charges" },
  { key: "minibarCharges", label: "Bar Charges" },
  { key: "extraBedCharges", label: "Extra Bed Charges" },
  { key: "manualCharges", label: "Miscellaneous Charges" },
];

const getFilteredCharges = (charges) => {
  const filtered = { ...charges };
  let totalReduction = 0;
  CHARGE_TYPES.forEach(({ key }) => {
    if (isChargeExcluded(key)) {
      totalReduction += filtered[key] || 0;
      filtered[key] = 0;
    }
  });
  filtered.dailyTotal = (filtered.dailyTotal || 0) - totalReduction;
  return filtered;
};

// Function to convert number to words
const numberToWords = (num) => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  
  const convertHundreds = (n) => {
    let result = '';
   
    if (n > 99) {
      result += ones[Math.floor(n / 100)] + ' Hundred';
      n %= 100;
      if (n > 0) result += ' ';
    }
   
    if (n > 19) {
      result += tens[Math.floor(n / 10)];
      n %= 10;
      if (n > 0) result += ' ' + ones[n];
    } else if (n > 9) {
      result += teens[n - 10];
    } else if (n > 0) {
      result += ones[n];
    }
   
    return result;
  };

  if (num === 0) return 'Zero';
 
  let result = '';
 
  if (num >= 10000000) {
    result += convertHundreds(Math.floor(num / 10000000)) + ' Crore ';
    num %= 10000000;
  }
 
  if (num >= 100000) {
    result += convertHundreds(Math.floor(num / 100000)) + ' Lakh ';
    num %= 100000;
  }
 
  if (num >= 1000) {
    result += convertHundreds(Math.floor(num / 1000)) + ' Thousand ';
    num %= 1000;
  }
 
  if (num > 0) {
    result += convertHundreds(num);
  }
 
  return result.trim() + ' Rupees Only';
};

const BillReport = ({ billData: rawBillData }) => {
  const { rooms, institutionData, bills, bookings, companies } = useAppContext();
 const { userData } = useAuthContext();
  // Process and prepare billData similar to Bill.jsx
  const billData = React.useMemo(() => {
    if (!rawBillData) return null;
 console.log("GRC Number in BillReport:",rawBillData);

    // Extract booking ID for lookups (assuming it's in rawBillData)
    const bookingId = rawBillData?.bookingDetails?.bookingId || rawBillData?.billHeader?.bookingRef;

    // Find raw booking data
    const rawBookingData = bookings?.find((b) => b.booking_id === bookingId);

    // Find company details from companies list (not bookings)
    const companyIdToUse = rawBillData?.company_id || rawBookingData?.company_id;
    const companyDetails = companies?.find((company) => company.company_id === companyIdToUse) || {};
    
    const grcNo = rawBookingData?.grc_no || "N/A";
    const noOfAdults = rawBookingData?.no_of_adults || 0;

    // Build billHeader similar to Bill.jsx
    const billHeader = {
      hotelName: institutionData?.companyName || rawBillData?.billHeader?.hotelName || "",
      address: institutionData?.contactDetails?.address || rawBillData?.billHeader?.address || "",
      contact: institutionData?.contactDetails?.phone || rawBillData?.billHeader?.contact || "",
      email: institutionData?.contactDetails?.email || rawBillData?.billHeader?.email || "",
      bookingRef: rawBillData?.billHeader?.bookingRef || bookingId || "N/A",
      gstIn: institutionData?.taxNumber,
      billDate: rawBillData?.billHeader?.billDate || Date.now(),
      bill_no: rawBillData?.billHeader?.bill_no || "N/A",
    };

    // Build bookingDetails similar to Bill.jsx
    const bookingDetails = {
      ...rawBillData?.bookingDetails,
      bookingId: rawBillData?.bookingDetails?.bookingId || bookingId || "N/A",
      bookingType: rawBillData?.bookingDetails?.bookingType || rawBookingData?.booking_type || "",
      bookingSource: rawBillData?.bookingDetails?.bookingSource || rawBookingData?.booking_source || "",
      roomNumber: rawBillData?.bookingDetails?.roomNumber || rawBookingData?.rooms?.map((room) => room.room_number).join(", ") || "",
      roomType: rawBillData?.bookingDetails?.roomType || rawBookingData?.rooms?.map((room) => room.room_type).join(", ") || "",
      ratePlanId: rawBillData?.bookingDetails?.ratePlanId || rawBookingData?.rate_plan_id || "",
      ratePlanName: rawBillData?.bookingDetails?.ratePlanName || rawBookingData?.rate_plan_name || "",
      ratePlanBaseTariff: rawBillData?.bookingDetails?.ratePlanBaseTariff || rawBookingData?.base_tariff || 0,
      ratePlanTariffVariation: rawBillData?.bookingDetails?.ratePlanTariffVariation || rawBookingData?.tariff_variation || 0,
      checkIn: rawBillData?.bookingDetails?.checkIn || rawBookingData?.checkin_date || "",
      checkOut: rawBillData?.bookingDetails?.checkOut || rawBookingData?.checkout_date || "",
      numberOfNights: rawBillData?.bookingDetails?.numberOfNights || rawBookingData?.number_of_nights || 0,
      companyName: companyDetails.name || rawBillData?.bookingDetails?.companyName || "N/A",
      companyGstNo: companyDetails.gst_no || rawBillData?.bookingDetails?.gstNo || "N/A",
      grc_no: grcNo,
      no_of_adults: noOfAdults,
    };
    const legalSignature= {
      gstIn: institutionData?.taxNumber,
      roomStaySac: "996311",
      roomServiceSac: "996312",
      foodServiceSac: "996313",
      laundryClause:
              "Subject to Aimer jurisdiction. No claim for loss of valuables unless deposited.",
              guestName: rawBillData?.guestDetails?.guestName || "",
            guestSignature: "Guest Signature",
            cashierSignature: "Cashier Signature & Seal",
          };
    return {
      ...rawBillData,
      billHeader,
      bookingDetails,
      legalSignature
    };
  }, [rawBillData, institutionData, bookings, companies]);
 

  if (!billData) {
    return <div>No bill data available</div>;
  }

  // Create a map of room_id to extra pax charges for specific room allocation
  const extraPaxByRoomId = {};
  const extra_pax = billData?.bookingDetails?.extra_pax;
  if (extra_pax && Array.isArray(extra_pax)) {
    extra_pax.forEach((pax) => {
      if (pax.room_id && pax.extra_pax_amount) {
        extraPaxByRoomId[pax.room_id] = (extraPaxByRoomId[pax.room_id] || 0) + pax.extra_pax_amount;
      }
    });
  }

  // Calculate the final amount dynamically
  const calculateFinalAmount = () => {
    let totalRatePlanFromBreakdown = 0;
    let totalRoomFromBreakdown = 0;
    let totalServiceFromBreakdown = 0;
    let totalExtraPaxFromBreakdown = 0;
   
    if (billData?.serviceChargesByDate) {
      billData.serviceChargesByDate.forEach((dayData) => {
        const date = Object.keys(dayData)[0];
        const roomEntries = dayData[date];
        roomEntries.forEach((roomEntry) => {
          const charges = roomEntry.charges;
          const roomNumber = roomEntry.roomNumber;
         
          // Check if room charges exist in services object
          const servicesRoomCharges = billData?.bookingDetails?.services?.[roomNumber]?.[date]?.room_charges;
          const roomChargesToUse = servicesRoomCharges !== undefined ? servicesRoomCharges : charges.roomCharges;
         
          totalRatePlanFromBreakdown += billData?.bookingDetails?.ratePlanBaseTariff || 0;
          totalRoomFromBreakdown += roomChargesToUse || 0;
          totalServiceFromBreakdown +=
            (charges.foodCharges || 0) +
            (charges.laundryCharges || 0) +
            (charges.minibarCharges || 0) +
            (charges.extraBedCharges || 0) +
            (charges.manualCharges || 0);
         
          // Get room-specific extra pax charges
          const roomDetails = rooms?.find(r => r.room_number === roomNumber);
          const roomIdForExtraPax = roomDetails?.room_id;
          const roomSpecificExtraPax = extraPaxByRoomId[roomIdForExtraPax] || 0;
          totalExtraPaxFromBreakdown += roomSpecificExtraPax;
        });
      });
    }
   
    const discountAmount = billData?.billingSummary?.totalDiscount || 0;
    const subTotal = totalRatePlanFromBreakdown + totalRoomFromBreakdown + totalServiceFromBreakdown + totalExtraPaxFromBreakdown - discountAmount;
   
    // Calculate tax on discounted room charges (2.5% CGST + 2.5% SGST = 5% total)
    const discountedRoomCharges = totalRoomFromBreakdown - discountAmount;
    const cgstAmount = Math.round((discountedRoomCharges * 2.5) / 100);
    const sgstAmount = Math.round((discountedRoomCharges * 2.5) / 100);
    const totalTaxAmount = cgstAmount + sgstAmount;
    const grandTotal = subTotal + totalTaxAmount;
    return grandTotal;
  };

  const finalAmount = calculateFinalAmount();
  const amountInWords = numberToWords(Math.floor(finalAmount));

  // Prepare guest data for GuestDetails component
  const guestData = {
    full_name: billData?.guestDetails?.guestName || "",
    mobile: billData?.guestDetails?.mobile || "",
    email: billData?.guestDetails?.email || "",
    gender: billData?.guestDetails?.gender || "",
    nationality: billData?.guestDetails?.nationality || "",
    address: billData?.guestDetails?.address || "",
    id_proof_type: billData?.guestDetails?.idProofType || "",
    id_proof_number: billData?.guestDetails?.idProofNumber || "",
    city: billData?.guestDetails?.city || "",
    state: billData?.guestDetails?.state || "",
    pincode: billData?.guestDetails?.pincode || "",
    country: billData?.guestDetails?.country || "",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Print/Download Controls - Hidden in print */}
      <style>{`
        @media print {
          @page {
              margin: 0;
          }
          body * {
            visibility: hidden !important;
          }
          #printable-bill, #printable-bill * {
            visibility: visible !important;
          }
          #printable-bill {
            position: absolute !important;
            left: 0;
            top: 0;
            width: 100vw !important;
            min-width: 0 !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            background: white !important;
          }
          #printable-bill, #printable-bill table, #printable-bill th, #printable-bill td {
            font-size: 10px !important;
            padding: 2px 4px !important;
            margin: 0 !important;
            line-height: 1.1 !important;
          }
          #printable-bill table {
            border-spacing: 0 !important;
            border-collapse: collapse !important;
            page-break-inside: avoid !important;
          }
          #printable-bill tr {
            page-break-inside: avoid !important;
            page-break-after: auto !important;
          }
          #printable-bill th, #printable-bill td {
            padding: 2px 4px !important;
            margin: 0 !important;
            vertical-align: top !important;
          }
          #printable-bill .pb-4, #printable-bill .mb-6, #printable-bill .mb-3, #printable-bill .mb-2, #printable-bill .mt-4, #printable-bill .mt-8, #printable-bill .pt-4, #printable-bill .pt-1, #printable-bill .pt-2 {
            margin: 0 !important;
            padding: 0 !important;
          }
          #printable-bill h1, #printable-bill .text-2xl, #printable-bill .text-xl {
            font-size: 12px !important;
            margin-bottom: 2px !important;
            padding-bottom: 0 !important;
          }
          #printable-bill h3, #printable-bill .text-base, #printable-bill .font-bold {
            font-size: 11px !important;
            margin-bottom: 2px !important;
            padding-bottom: 0 !important;
          }
          #printable-bill th {
            font-size: 10px !important;
            padding: 2px 4px !important;
          }
          #printable-bill table, #printable-bill th, #printable-bill td {
            border: 1px solid #e0e0e0 !important;
          }
          #printable-bill .section-gap {
            margin-top: 18px !important;
          }
          #printable-bill .hotel-name {
            font-size: 16px !important;
            font-weight: 600 !important;
            margin-bottom: 2px !important;
          }
        }
        /* Compact headings and header for screen as well */
        #printable-bill h1, #printable-bill .text-2xl, #printable-bill .text-xl {
          font-size: 17px;
          margin-bottom: 3px;
          padding-bottom: 0;
        }
        #printable-bill h3, #printable-bill .text-base, #printable-bill .font-bold {
          font-size: 12px;
          margin-bottom: 3px;
          padding-bottom: 0;
        }
        #printable-bill th {
          font-size: 11px;
          padding: 3px 6px;
        }
        #printable-bill .pb-4, #printable-bill .mb-6, #printable-bill .mb-3, #printable-bill .mb-2, #printable-bill .mt-4, #printable-bill .mt-8, #printable-bill .pt-4, #printable-bill .pt-1, #printable-bill .pt-2 {
          margin: 0;
          padding: 0;
        }
        #printable-bill table, #printable-bill th, #printable-bill td {
          border: 1px solid #e0e0e0 !important;
        }
        #printable-bill .section-gap {
          margin-top: 18px !important;
        }
        #printable-bill .hotel-name {
          font-size: 16px !important;
          font-weight: 600 !important;
          margin-bottom: 2px !important;
        }
      `}</style>

      <div className="print:hidden bg-white shadow-sm border-b px-6 py-4">
        <div className="flex w-full items-center justify-end max-w-5xl mx-auto">
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={handleDownload}
              className="flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Download PDF</span>
            </Button>
            <Button
              onClick={handlePrint}
              className="flex items-center space-x-2"
            >
              <Printer className="h-4 w-4" />
              <span>Print Bill</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Bill Content - This section will be printed */}
      <div className="max-w-5xl mx-auto p-6 print:p-0 print:max-w-none print:m-0">
        <div
          id="printable-bill"
          className="relative bg-white print:shadow-none print:border-none border shadow-lg print:bg-white"
        >
          <div className="p-8 print:p-6">
            {/* Use the new BillHeader component - matching Bill.jsx structure */}
            <BillHeader 
              bills={billData.billHeader.bill_no}
              billData={billData} 
            />

            {/* Use the new GuestDetails component - Combined Guest & Booking Details */}
            <GuestDetails
              billData={billData}
              guestData={guestData}
              isAmountEditing={false}
              setGuestData={() => {}}
            />

            {/* Charges Breakdown (Day-wise) - Keep original structure */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2 mt-2">
                <h3 className="font-bold text-black text-base">
                  Charges Breakdown (Day-wise)
                </h3>
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
                      <th className="border-r-1 border-black px-2 py-2 text-left font-bold bg-gray-100">
                        HSN/SAC
                      </th>
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
                              // Check if room charges exist in services object for this room and date
                              const servicesRoomCharges = billData?.bookingDetails?.services?.[roomNumber]?.[date]?.room_charges;
                              const roomChargesToUse = servicesRoomCharges !== undefined ? servicesRoomCharges : charges.roomCharges;
                             
                              // Get room-specific extra pax charges
                              const roomDetails = rooms?.find(r => r.room_number === roomNumber);
                              const roomIdForExtraPax = roomDetails?.room_id;
                              const roomSpecificExtraPax = extraPaxByRoomId[roomIdForExtraPax] || 0;
                             
                              const particulars = [
                                {
                                  description: `Rate Plan Base Tariff`,
                                  amount:
                                    billData?.bookingDetails
                                      ?.ratePlanBaseTariff || 0,
                                  type: "ratePlanBaseTariff",
                                },
                                {
                                  description: `Room Charges`,
                                  amount: roomChargesToUse,
                                  type: "roomCharges",
                                },
                                ...(roomSpecificExtraPax > 0
                                  ? [
                                      {
                                        description: `Extra Pax Charges`,
                                        amount: roomSpecificExtraPax,
                                        type: "extraPaxCharges",
                                      },
                                    ]
                                  : []),
                                ...(charges.foodCharges > 0
                                  ? [
                                      {
                                        description: `Food Charges`,
                                        amount: charges.foodCharges,
                                        type: "foodCharges",
                                      },
                                    ]
                                  : []),
                                ...(charges.laundryCharges > 0
                                  ? [
                                      {
                                        description: `Laundry Charges`,
                                        amount: charges.laundryCharges,
                                        type: "laundryCharges",
                                      },
                                    ]
                                  : []),
                                ...(charges.minibarCharges > 0
                                  ? [
                                      {
                                        description: `Bar Charges`,
                                        amount: charges.minibarCharges,
                                        type: "minibarCharges",
                                      },
                                    ]
                                  : []),
                                ...(charges.extraBedCharges > 0
                                  ? [
                                      {
                                        description: `Extra Bed Charges`,
                                        amount: charges.extraBedCharges,
                                        type: "extraBedCharges",
                                      },
                                    ]
                                  : []),
                                ...(charges.manualCharges > 0
                                  ? [
                                      {
                                        description: `Miscellaneous Charges`,
                                        amount: charges.manualCharges,
                                        type: "manualCharges",
                                      },
                                    ]
                                  : []),
                              ].filter(
                                (particular) =>
                                  !isChargeExcluded(particular.type)
                              );
                              // Get filtered charges for display - update with correct room charges and room-specific extra pax
                              const updatedCharges = {
                                ...charges,
                                roomCharges: roomChargesToUse,
                                extraPaxCharges: roomSpecificExtraPax,
                                dailyTotal: roomChargesToUse +
                                  (charges.foodCharges || 0) +
                                  (charges.laundryCharges || 0) +
                                  (charges.minibarCharges || 0) +
                                  (charges.extraBedCharges || 0) +
                                  (charges.manualCharges || 0) +
                                  roomSpecificExtraPax +
                                  (billData?.bookingDetails?.ratePlanBaseTariff || 0)
                              };
                              const filteredCharges = getFilteredCharges(updatedCharges);
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
                                          <td
                                            className="border-r-1 border-black px-2 py-1 text-center align-top"
                                            rowSpan={rowspan}
                                          >
                                            996311
                                          </td>
                                          <td
                                            className="border-r-1 border-black px-2 py-1 text-center align-top"
                                            rowSpan={rowspan}
                                          >
                                            {roomNumber}
                                          </td>
                                        </>
                                      )}
                                      {particular.amount > 0 && (
                                        <>
                                          <td className="border-r-1 border-black px-2 py-1">
                                            {particular.description}
                                          </td>
                                          <td className="px-2 py-1 text-right">
                                            {isChargeExcluded(
                                              particular.type
                                            ) ? (
                                              <span className="line-through text-gray-400">
                                                ₹{particular.amount.toFixed(2)}
                                              </span>
                                            ) : (
                                              `₹${particular.amount.toFixed(2)}`
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
                                    <td className="border-r-1 border-black px-2 py-1"></td>
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

            {/* Billing Summary */}
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
                        // Calculate total room charges from breakdown - prioritize services data
                        let totalRoomFromBreakdown = 0;
                        if (billData?.serviceChargesByDate) {
                          billData.serviceChargesByDate.forEach((dayData) => {
                            const date = Object.keys(dayData)[0];
                            const roomEntries = dayData[date];
                            roomEntries.forEach((roomEntry) => {
                              const charges = roomEntry.charges;
                              const roomNumber = roomEntry.roomNumber;
                             
                              // Check if room charges exist in services object
                              const servicesRoomCharges = billData?.bookingDetails?.services?.[roomNumber]?.[date]?.room_charges;
                              const roomChargesToUse = servicesRoomCharges !== undefined ? servicesRoomCharges : charges.roomCharges;
                             
                              if (roomChargesToUse) {
                                totalRoomFromBreakdown += roomChargesToUse;
                              }
                            });
                          });
                        }
                        return totalRoomFromBreakdown.toFixed(2);
                      })()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>TOTAL SERVICE COST:</span>
                    <span>
                      +₹
                      {(() => {
                        // Calculate total service charges from breakdown
                        let totalServiceFromBreakdown = 0;
                        if (billData?.serviceChargesByDate) {
                          billData.serviceChargesByDate.forEach((dayData) => {
                            const date = Object.keys(dayData)[0];
                            const roomEntries = dayData[date];
                            roomEntries.forEach((roomEntry) => {
                              const charges = roomEntry.charges;
                              totalServiceFromBreakdown +=
                                (charges.foodCharges || 0) +
                                (charges.laundryCharges || 0) +
                                (charges.minibarCharges || 0) +
                                (charges.extraBedCharges || 0) +
                                (charges.manualCharges || 0);
                            });
                          });
                        }
                        return totalServiceFromBreakdown.toFixed(2);
                      })()}
                    </span>
                  </div>
                  {billData?.billingSummary?.extraPaxCharges > 0 && (
                    <div className="flex justify-between">
                      <span>EXTRA PAX CHARGES:</span>
                      <span>
                        + ₹
                        {(() => {
                          // Calculate total extra pax charges from breakdown - use room-specific amounts
                          let totalExtraPaxFromBreakdown = 0;
                          if (billData?.serviceChargesByDate) {
                            billData.serviceChargesByDate.forEach((dayData) => {
                              const date = Object.keys(dayData)[0];
                              const roomEntries = dayData[date];
                              roomEntries.forEach((roomEntry) => {
                                const charges = roomEntry.charges;
                                const roomNumber = roomEntry.roomNumber;
                               
                                // Get room-specific extra pax charges
                                const roomDetails = rooms?.find(r => r.room_number === roomNumber);
                                const roomIdForExtraPax = roomDetails?.room_id;
                                const roomSpecificExtraPax = extraPaxByRoomId[roomIdForExtraPax] || 0;
                               
                                if (roomSpecificExtraPax) {
                                  totalExtraPaxFromBreakdown += roomSpecificExtraPax;
                                }
                              });
                            });
                          }
                          return totalExtraPaxFromBreakdown.toFixed(2);
                        })()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>TOTAL DISCOUNT:</span>
                    <span>
                      {(() => {
                        const discountAmount = billData?.billingSummary?.totalDiscount || 0;
                        const totalRoomCharges = (() => {
                          let totalRoomFromBreakdown = 0;
                          if (billData?.serviceChargesByDate) {
                            billData.serviceChargesByDate.forEach((dayData) => {
                              const date = Object.keys(dayData)[0];
                              const roomEntries = dayData[date];
                              roomEntries.forEach((roomEntry) => {
                                const charges = roomEntry.charges;
                                const roomNumber = roomEntry.roomNumber;
                               
                                // Check if room charges exist in services object
                                const servicesRoomCharges = billData?.bookingDetails?.services?.[roomNumber]?.[date]?.room_charges;
                                const roomChargesToUse = servicesRoomCharges !== undefined ? servicesRoomCharges : charges.roomCharges;
                               
                                if (roomChargesToUse) {
                                  totalRoomFromBreakdown += roomChargesToUse;
                                }
                              });
                            });
                          }
                          return totalRoomFromBreakdown;
                        })();
                       
                        if (discountAmount > 0 && totalRoomCharges > 0) {
                          const discountPercentage = ((discountAmount / totalRoomCharges) * 100).toFixed(1);
                          return `${discountPercentage}%`;
                        } else {
                          return `0%`;
                        }
                      })()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>
                      CGST @ 2.5%:
                    </span>
                    <span>
                      + ₹
                      {(() => {
                        // Calculate total room charges from breakdown for tax calculation
                        let totalRoomChargesForTax = 0;
                        if (billData?.serviceChargesByDate) {
                          billData.serviceChargesByDate.forEach((dayData) => {
                            const date = Object.keys(dayData)[0];
                            const roomEntries = dayData[date];
                            roomEntries.forEach((roomEntry) => {
                              const charges = roomEntry.charges;
                              const roomNumber = roomEntry.roomNumber;
                             
                              // Check if room charges exist in services object
                              const servicesRoomCharges = billData?.bookingDetails?.services?.[roomNumber]?.[date]?.room_charges;
                              const roomChargesToUse = servicesRoomCharges !== undefined ? servicesRoomCharges : charges.roomCharges;
                             
                              if (roomChargesToUse) {
                                totalRoomChargesForTax += roomChargesToUse;
                              }
                            });
                          });
                        }
                        const discountAmount = billData?.billingSummary?.totalDiscount || 0;
                        const discountedRoomCharges = totalRoomChargesForTax - discountAmount;
                        const cgstAmount = Math.round((discountedRoomCharges * 2.5) / 100);
                        return cgstAmount.toFixed(2);
                      })()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>
                      SGST @ 2.5%:
                    </span>
                    <span>
                      + ₹
                      {(() => {
                        // Calculate total room charges from breakdown for tax calculation
                        let totalRoomChargesForTax = 0;
                        if (billData?.serviceChargesByDate) {
                          billData.serviceChargesByDate.forEach((dayData) => {
                            const date = Object.keys(dayData)[0];
                            const roomEntries = dayData[date];
                            roomEntries.forEach((roomEntry) => {
                              const charges = roomEntry.charges;
                              const roomNumber = roomEntry.roomNumber;
                             
                              // Check if room charges exist in services object
                              const servicesRoomCharges = billData?.bookingDetails?.services?.[roomNumber]?.[date]?.room_charges;
                              const roomChargesToUse = servicesRoomCharges !== undefined ? servicesRoomCharges : charges.roomCharges;
                             
                              if (roomChargesToUse) {
                                totalRoomChargesForTax += roomChargesToUse;
                              }
                            });
                          });
                        }
                        const discountAmount = billData?.billingSummary?.totalDiscount || 0;
                        const discountedRoomCharges = totalRoomChargesForTax - discountAmount;
                        const sgstAmount = Math.round((discountedRoomCharges * 2.5) / 100);
                        return sgstAmount.toFixed(2);
                      })()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>TOTAL TAX AMOUNT:</span>
                    <span>
                      ₹
                      {(() => {
                        // Calculate total room charges from breakdown for tax calculation
                        let totalRoomChargesForTax = 0;
                        if (billData?.serviceChargesByDate) {
                          billData.serviceChargesByDate.forEach((dayData) => {
                            const date = Object.keys(dayData)[0];
                            const roomEntries = dayData[date];
                            roomEntries.forEach((roomEntry) => {
                              const charges = roomEntry.charges;
                              const roomNumber = roomEntry.roomNumber;
                             
                              // Check if room charges exist in services object
                              const servicesRoomCharges = billData?.bookingDetails?.services?.[roomNumber]?.[date]?.room_charges;
                              const roomChargesToUse = servicesRoomCharges !== undefined ? servicesRoomCharges : charges.roomCharges;
                             
                              if (roomChargesToUse) {
                                totalRoomChargesForTax += roomChargesToUse;
                              }
                            });
                          });
                        }
                        const discountAmount = billData?.billingSummary?.totalDiscount || 0;
                        const discountedRoomCharges = totalRoomChargesForTax - discountAmount;
                        const cgstAmount = Math.round((discountedRoomCharges * 2.5) / 100);
                        const sgstAmount = Math.round((discountedRoomCharges * 2.5) / 100);
                        const totalTaxAmount = cgstAmount + sgstAmount;
                        return totalTaxAmount.toFixed(2);
                      })()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>ADVANCE PAYMENT:</span>
                    <span>
                      - ₹
                      {(billData?.billingSummary?.partialPayment || 0).toFixed(
                        2
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>SUB TOTAL:</span>
                    <span>
                      ₹{(() => {
                        // Calculate subtotal from breakdown data
                        let totalRatePlanFromBreakdown = 0;
                        let totalRoomFromBreakdown = 0;
                        let totalServiceFromBreakdown = 0;
                        let totalExtraPaxFromBreakdown = 0;
                       
                        if (billData?.serviceChargesByDate) {
                          billData.serviceChargesByDate.forEach((dayData) => {
                            const date = Object.keys(dayData)[0];
                            const roomEntries = dayData[date];
                            roomEntries.forEach((roomEntry) => {
                              const charges = roomEntry.charges;
                              const roomNumber = roomEntry.roomNumber;
                             
                              // Check if room charges exist in services object
                              const servicesRoomCharges = billData?.bookingDetails?.services?.[roomNumber]?.[date]?.room_charges;
                              const roomChargesToUse = servicesRoomCharges !== undefined ? servicesRoomCharges : charges.roomCharges;
                             
                              totalRatePlanFromBreakdown += billData?.bookingDetails?.ratePlanBaseTariff || 0;
                              totalRoomFromBreakdown += roomChargesToUse || 0;
                              totalServiceFromBreakdown +=
                                (charges.foodCharges || 0) +
                                (charges.laundryCharges || 0) +
                                (charges.minibarCharges || 0) +
                                (charges.extraBedCharges || 0) +
                                (charges.manualCharges || 0);
                             
                              // Get room-specific extra pax charges
                              const roomDetails = rooms?.find(r => r.room_number === roomNumber);
                              const roomIdForExtraPax = roomDetails?.room_id;
                              const roomSpecificExtraPax = extraPaxByRoomId[roomIdForExtraPax] || 0;
                              totalExtraPaxFromBreakdown += roomSpecificExtraPax;
                            });
                          });
                        }
                       
                        const discountAmount = billData?.billingSummary?.totalDiscount || 0;
                        const subTotal = totalRatePlanFromBreakdown + totalRoomFromBreakdown + totalServiceFromBreakdown + totalExtraPaxFromBreakdown - discountAmount;
                        return subTotal.toFixed(2);
                      })()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>GRAND TOTAL:</span>
                    <span>
                      ₹{(() => {
                        // Calculate grand total with proper tax calculation
                        let totalRatePlanFromBreakdown = 0;
                        let totalRoomFromBreakdown = 0;
                        let totalServiceFromBreakdown = 0;
                        let totalExtraPaxFromBreakdown = 0;
                       
                        if (billData?.serviceChargesByDate) {
                          billData.serviceChargesByDate.forEach((dayData) => {
                            const date = Object.keys(dayData)[0];
                            const roomEntries = dayData[date];
                            roomEntries.forEach((roomEntry) => {
                              const charges = roomEntry.charges;
                              const roomNumber = roomEntry.roomNumber;
                             
                              // Check if room charges exist in services object
                              const servicesRoomCharges = billData?.bookingDetails?.services?.[roomNumber]?.[date]?.room_charges;
                              const roomChargesToUse = servicesRoomCharges !== undefined ? servicesRoomCharges : charges.roomCharges;
                             
                              totalRatePlanFromBreakdown += billData?.bookingDetails?.ratePlanBaseTariff || 0;
                              totalRoomFromBreakdown += roomChargesToUse || 0;
                              totalServiceFromBreakdown +=
                                (charges.foodCharges || 0) +
                                (charges.laundryCharges || 0) +
                                (charges.minibarCharges || 0) +
                                (charges.extraBedCharges || 0) +
                                (charges.manualCharges || 0);
                             
                              // Get room-specific extra pax charges
                              const roomDetails = rooms?.find(r => r.room_number === roomNumber);
                              const roomIdForExtraPax = roomDetails?.room_id;
                              const roomSpecificExtraPax = extraPaxByRoomId[roomIdForExtraPax] || 0;
                              totalExtraPaxFromBreakdown += roomSpecificExtraPax;
                            });
                          });
                        }
                       
                        const discountAmount = billData?.billingSummary?.totalDiscount || 0;
                        const subTotal = totalRatePlanFromBreakdown + totalRoomFromBreakdown + totalServiceFromBreakdown + totalExtraPaxFromBreakdown - discountAmount;
                       
                        // Calculate tax on discounted room charges (2.5% CGST + 2.5% SGST = 5% total)
                        const discountedRoomCharges = totalRoomFromBreakdown - discountAmount;
                        const cgstAmount = Math.round((discountedRoomCharges * 2.5) / 100);
                        const sgstAmount = Math.round((discountedRoomCharges * 2.5) / 100);
                        const totalTaxAmount = cgstAmount + sgstAmount;
                        const grandTotal = subTotal + totalTaxAmount;
                        return grandTotal.toFixed(2);
                      })()}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-1 font-bold">
                    <span>BALANCE DUE:</span>
                    <span>
                      ₹{(() => {
                        // Calculate balance due with proper tax calculation
                        let totalRatePlanFromBreakdown = 0;
                        let totalRoomFromBreakdown = 0;
                        let totalServiceFromBreakdown = 0;
                        let totalExtraPaxFromBreakdown = 0;
                       
                        if (billData?.serviceChargesByDate) {
                          billData.serviceChargesByDate.forEach((dayData) => {
                            const date = Object.keys(dayData)[0];
                            const roomEntries = dayData[date];
                            roomEntries.forEach((roomEntry) => {
                              const charges = roomEntry.charges;
                              const roomNumber = roomEntry.roomNumber;
                             
                              // Check if room charges exist in services object
                              const servicesRoomCharges = billData?.bookingDetails?.services?.[roomNumber]?.[date]?.room_charges;
                              const roomChargesToUse = servicesRoomCharges !== undefined ? servicesRoomCharges : charges.roomCharges;
                             
                              totalRatePlanFromBreakdown += billData?.bookingDetails?.ratePlanBaseTariff || 0;
                              totalRoomFromBreakdown += roomChargesToUse || 0;
                              totalServiceFromBreakdown +=
                                (charges.foodCharges || 0) +
                                (charges.laundryCharges || 0) +
                                (charges.minibarCharges || 0) +
                                (charges.extraBedCharges || 0) +
                                (charges.manualCharges || 0);
                             
                              // Get room-specific extra pax charges
                              const roomDetails = rooms?.find(r => r.room_number === roomNumber);
                              const roomIdForExtraPax = roomDetails?.room_id;
                              const roomSpecificExtraPax = extraPaxByRoomId[roomIdForExtraPax] || 0;
                              totalExtraPaxFromBreakdown += roomSpecificExtraPax;
                            });
                          });
                        }
                       
                        const discountAmount = billData?.billingSummary?.totalDiscount || 0;
                        const subTotal = totalRatePlanFromBreakdown + totalRoomFromBreakdown + totalServiceFromBreakdown + totalExtraPaxFromBreakdown - discountAmount;
                       
                        // Calculate tax on discounted room charges (2.5% CGST + 2.5% SGST = 5% total)
                        const discountedRoomCharges = totalRoomFromBreakdown - discountAmount;
                        const cgstAmount = Math.round((discountedRoomCharges * 2.5) / 100);
                        const sgstAmount = Math.round((discountedRoomCharges * 2.5) / 100);
                        const totalTaxAmount = cgstAmount + sgstAmount;
                        const grandTotal = subTotal + totalTaxAmount;
                        const balanceDue = grandTotal - (billData?.billingSummary?.partialPayment || 0);
                        return balanceDue.toFixed(2);
                      })()}
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
                    {amountInWords}
                  </div>
                  <div className="mt-4 text-center">
                    <div className="font-bold text-lg"></div>
                    TOTAL: ₹{finalAmount.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            {/* Use the new LegalSignature component */}
            <LegalSignature billData={billData} userData={userData} />

            {/* Footer */}
            <div className="border-t-2 border-dashed text-center border-black section-gap">
              <div className="text-xl font-bold mt-2">
                {billData.footer.thankYou}, {billData.footer.tagline}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillReport;