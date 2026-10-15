import React from "react";
import { Button } from "../../../components/ui/button.js";
import { Download, Printer } from "lucide-react";
import { useAppContext } from "../../../context/AppContext.jsx";
import { useAuthContext } from "../../../context/AuthContext.jsx";
// Import your new components
import BillHeader from "./components/BillHeader.jsx";
import GuestDetails from "./components/GuestDetails.jsx";
import LegalSignature from "./components/LegalSignature.jsx";
import ChargesBreakdown from "./components/ChargesBreakdown.jsx";
import BillingSummary from "./components/BillingSummary.jsx";
import BillFooter from "./components/BillFooter.jsx";

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

    const resolvedRoomNumber = (() => {
      const rn = rawBillData?.bookingDetails?.roomNumber || rawBillData?.bookingDetails?.room_number;
      if (rn && rn !== "---" && rn !== "N/A" && String(rn).trim() !== "") return rn;
      const rids = rawBillData?.room_ids || rawBillData?.bookingDetails?.room_id || rawBillData?.bookingDetails?.room_ids;
      if (rids) {
        const idArray = Array.isArray(rids) ? rids : [rids];
        const matched = idArray.map((rid) => {
          const r = rooms?.find((rm) => rm.room_id === rid || String(rm.room_number) === String(rid));
          return r ? r.room_number : rid;
        });
        if (matched.length > 0) return matched.join(", ");
      }
      return rawBookingData?.rooms?.map((room) => room.room_number).join(", ") || "---";
    })();

    const resolvedRoomType = (() => {
      const rt = rawBillData?.bookingDetails?.roomType || rawBillData?.bookingDetails?.room_type;
      if (rt && rt !== "---" && rt !== "N/A" && String(rt).trim() !== "") return rt;
      const rids = rawBillData?.room_ids || rawBillData?.bookingDetails?.room_id || rawBillData?.bookingDetails?.room_ids;
      if (rids) {
        const idArray = Array.isArray(rids) ? rids : [rids];
        const matched = idArray.map((rid) => {
          const r = rooms?.find((rm) => rm.room_id === rid || String(rm.room_number) === String(rid));
          return r ? r.room_type : "Standard";
        });
        if (matched.length > 0) return matched.join(", ");
      }
      return rawBookingData?.rooms?.map((room) => room.room_type).join(", ") || "---";
    })();

    // Build bookingDetails similar to Bill.jsx
    const bookingDetails = {
      ...rawBillData?.bookingDetails,
      bookingId: rawBillData?.bookingDetails?.bookingId || bookingId || "N/A",
      bookingType: rawBillData?.bookingDetails?.bookingType || rawBookingData?.booking_type || "",
      bookingSource: rawBillData?.bookingDetails?.bookingSource || rawBookingData?.booking_source || "",
      roomNumber: resolvedRoomNumber,
      roomType: resolvedRoomType,
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
    // Compute billingSummary values for BillingSummary component
    let totalRoomCharges = 0;
    let totalServiceCharges = 0;
    let totalExtraPaxCharges = 0;
    let totalRatePlanCharges = 0;

    if (rawBillData?.serviceChargesByDate) {
      rawBillData.serviceChargesByDate.forEach((dayData) => {
        const date = Object.keys(dayData)[0];
        const roomEntries = dayData[date];
        roomEntries.forEach((roomEntry) => {
          const charges = roomEntry.charges;
          totalRatePlanCharges += charges.ratePlanCharges || 0;
          totalRoomCharges += charges.roomCharges || 0;
          totalServiceCharges +=
            (charges.foodCharges || 0) +
            (charges.laundryCharges || 0) +
            (charges.minibarCharges || 0) +
            (charges.extraBedCharges || 0) +
            (charges.manualCharges || 0);
          totalExtraPaxCharges += charges.extraPaxCharges || 0;
        });
      });
    }

    if (totalRoomCharges === 0 && (rawBillData?.billingSummary?.totalRoomServices || rawBillData?.billingSummary?.roomCharges)) {
      totalRoomCharges = Number(rawBillData.billingSummary.totalRoomServices || rawBillData.billingSummary.roomCharges || 0);
    }
    if (totalServiceCharges === 0 && (rawBillData?.billingSummary?.totalServiceCharges || rawBillData?.billingSummary?.serviceCharges)) {
      totalServiceCharges = Number(rawBillData.billingSummary.totalServiceCharges || rawBillData.billingSummary.serviceCharges || 0);
    }
    if (totalExtraPaxCharges === 0 && rawBillData?.billingSummary?.extraPaxCharges) {
      totalExtraPaxCharges = Number(rawBillData.billingSummary.extraPaxCharges || 0);
    }

    let finalServiceChargesByDate = rawBillData?.serviceChargesByDate || [];
    const hasAnyChargesInBreakdown = finalServiceChargesByDate.some((dayData) => {
      const date = Object.keys(dayData)[0];
      return (dayData[date] || []).some(
        (re) => (re.charges?.roomCharges || 0) > 0 || (re.charges?.dailyTotal || 0) > 0
      );
    });

    if (!hasAnyChargesInBreakdown && totalRoomCharges > 0) {
      const checkinDateVal = rawBillData?.bookingDetails?.checkIn || rawBookingData?.checkin_date || Date.now();
      const numNights = Math.max(1, rawBillData?.bookingDetails?.numberOfNights || 1);
      const dailyTariff = totalRoomCharges / numNights;
      const roomNum = resolvedRoomNumber || "---";
      const roomTyp = resolvedRoomType || "Standard";

      const synthDates = [];
      const cur = new Date(typeof checkinDateVal === "number" ? checkinDateVal : new Date(checkinDateVal).getTime());
      for (let i = 0; i < numNights; i++) {
        const dateStr = cur.toISOString().split("T")[0];
        synthDates.push({
          [dateStr]: [
            {
              roomNumber: roomNum,
              roomType: roomTyp,
              date: dateStr,
              charges: {
                roomCharges: dailyTariff,
                foodCharges: 0,
                laundryCharges: 0,
                minibarCharges: 0,
                extraBedCharges: 0,
                manualCharges: 0,
                extraPaxCharges: 0,
                dailyTotal: dailyTariff,
              },
            },
          ],
        });
        cur.setDate(cur.getDate() + 1);
      }
      finalServiceChargesByDate = synthDates;
    }

    const discountAmount = rawBillData?.billingSummary?.totalDiscount || 0;
    const partialPayment = rawBillData?.billingSummary?.partialPayment || 0;
    const subTotal = totalRoomCharges + totalServiceCharges + totalRatePlanCharges + totalExtraPaxCharges - discountAmount;
    const discountedRoomCharges = totalRoomCharges - discountAmount;
    const cgstAmount = Math.round((discountedRoomCharges * 2.5) / 100);
    const sgstAmount = Math.round((discountedRoomCharges * 2.5) / 100);
    const totalTaxAmount = cgstAmount + sgstAmount;
    const grandTotal = subTotal + totalTaxAmount;
    const balanceDue = grandTotal - partialPayment;

    const billingSummary = {
      ...(rawBillData?.billingSummary || {}),
      totalRoomServices: totalRoomCharges,
      totalServiceCharges: totalServiceCharges,
      extraPaxCharges: totalExtraPaxCharges,
      totalDiscount: discountAmount,
      partialPayment: partialPayment,
      subTotal: subTotal,
      cgstAmount: cgstAmount,
      sgstAmount: sgstAmount,
      totalTaxAmount: totalTaxAmount,
      grandTotal: grandTotal,
      balanceDue: balanceDue,
    };

    const finalSummary = {
      ...(rawBillData?.finalSummary || {}),
      amountInWords: numberToWords(Math.floor(grandTotal)),
      totalAmount: grandTotal,
    };

    return {
      ...rawBillData,
      billHeader,
      bookingDetails,
      legalSignature,
      billingSummary,
      finalSummary,
      serviceChargesByDate: finalServiceChargesByDate,
    };
  }, [rawBillData, institutionData, bookings, companies, rooms]);
 

  if (!billData) {
    return <div>No bill data available</div>;
  }

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
    pincode: billData?.guestDetails?.pinCode || "",
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

            {/* Charges Breakdown - Using shared ChargesBreakdown component (read-only) */}
            <ChargesBreakdown
              billData={billData}
              isAmountEditing={false}
              editingChargeAmounts={{}}
              setEditingChargeAmounts={() => {}}
              isChargeExcluded={() => false}
              getFilteredCharges={getFilteredCharges}
            />

            {/* Billing Summary - Using shared BillingSummary component (read-only) */}
            <BillingSummary
              billData={billData}
              isAmountEditing={false}
              editingDiscount={0}
              setEditingDiscount={() => {}}
              editingAdvancePayment={0}
              setEditingAdvancePayment={() => {}}
              editingChargeAmounts={{}}
            />

            {/* Use the new LegalSignature component */}
            <LegalSignature billData={billData} userData={userData} />

            {/* Footer - Using shared BillFooter component */}
            <BillFooter billData={billData} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillReport;