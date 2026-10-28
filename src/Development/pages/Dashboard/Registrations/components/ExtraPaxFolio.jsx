import React, { useState, useMemo } from "react";
import { Input } from "../../../../components/ui/input.js";
import logo from "../assets/logo.png";
import { institutionId } from "../../../../../Operation/data.json";

const ExtraPaxFolio = ({
  billData,
  booking,
  guestData,
  userData,
  institutionData,
  bills,
  extraPaxSettings,
  setExtraPaxSettings,
  isAmountEditing,
  editingChargeAmounts,
  setEditingChargeAmounts,
  editingDiscount,
  setEditingDiscount,
  editingAdvancePayment,
  setEditingAdvancePayment,
  bookings,
  rooms,
  selectedPaxIndex,
  setSelectedPaxIndex,
}) => {
  const showLogo = institutionId === "DISH5877";

  // Comprehensive extraction of all extra occupants
  const extraPaxList = useMemo(() => {
    const targetBookingId = String(
      booking?.booking_id ||
      booking?.breakdown?.booking?.booking_id ||
      billData?.bookingDetails?.bookingId ||
      ""
    ).trim();

    const matchedBooking = bookings?.find(
      (b) => String(b.booking_id || "").trim() === targetBookingId
    );

    const candidates = [
      billData?.extraPaxList,
      billData?.bookingDetails?.extra_pax,
      matchedBooking?.extra_pax,
      booking?.extra_pax,
      booking?.breakdown?.booking?.extra_pax,
      matchedBooking?.additional_guests,
      booking?.breakdown?.booking?.additional_guests,
      booking?.additional_guests,
    ];

    for (const cand of candidates) {
      if (Array.isArray(cand) && cand.length > 0) {
        return cand
          .map((p, idx) => ({
            id: p.id || p.pax_id || idx + 1,
            full_name: (p.full_name || p.name || p.guest_name || "").trim(),
            gender: p.gender || "",
            age: p.age !== undefined && p.age !== null ? String(p.age) : "",
            mobile: (p.mobile || p.phone || p.contact || "").trim(),
            room_id: p.room_id || "",
            room_number:
              p.room_number ||
              (rooms?.find((r) => r.room_id === p.room_id)?.room_number) ||
              "",
            extra_pax_amount: Number(p.extra_pax_amount || p.amount || 0),
          }))
          .filter((p) => p.full_name || p.extra_pax_amount > 0);
      }
      if (typeof cand === "string" && cand.trim().startsWith("[")) {
        try {
          const parsed = JSON.parse(cand);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed
              .map((p, idx) => ({
                id: p.id || p.pax_id || idx + 1,
                full_name: (p.full_name || p.name || p.guest_name || "").trim(),
                gender: p.gender || "",
                age: p.age !== undefined && p.age !== null ? String(p.age) : "",
                mobile: (p.mobile || p.phone || p.contact || "").trim(),
                room_id: p.room_id || "",
                room_number:
                  p.room_number ||
                  (rooms?.find((r) => r.room_id === p.room_id)?.room_number) ||
                  "",
                extra_pax_amount: Number(p.extra_pax_amount || p.amount || 0),
              }))
              .filter((p) => p.full_name || p.extra_pax_amount > 0);
          }
        } catch (e) {}
      }
    }

    return [];
  }, [booking, billData, bookings, rooms]);

  // Handle active Pax selection: index (0, 1, ...) or "all"
  const [internalSelectedPaxIndex, setInternalSelectedPaxIndex] = useState("all");
  const activePaxIndex =
    selectedPaxIndex !== undefined ? selectedPaxIndex : internalSelectedPaxIndex;
  const handleSelectPax = (idx) => {
    if (setSelectedPaxIndex) {
      setSelectedPaxIndex(idx);
    }
    setInternalSelectedPaxIndex(idx);
  };

  const isAllSelected = activePaxIndex === "all" || extraPaxList.length <= 1;
  const currentPax =
    !isAllSelected && typeof activePaxIndex === "number" && extraPaxList[activePaxIndex]
      ? extraPaxList[activePaxIndex]
      : (extraPaxList.length === 1 ? extraPaxList[0] : null);

  // Default occupant names - handles single occupant or multiple occupants
  const resolvedOccupantNames = useMemo(() => {
    if (!isAllSelected && currentPax) {
      return currentPax.full_name || `Pax ${Number(activePaxIndex) + 1}`;
    }
    if (extraPaxSettings?.occupantName) return extraPaxSettings.occupantName;
    if (extraPaxList.length > 0) {
      return extraPaxList.map((p) => p.full_name).filter(Boolean).join(", ");
    }
    return (
      booking?.breakdown?.booking?.extra_pax?.[0]?.full_name ||
      booking?.extra_pax?.[0]?.full_name ||
      booking?.additional_guests?.[0]?.name ||
      "Additional Guest"
    );
  }, [isAllSelected, currentPax, activePaxIndex, extraPaxList, extraPaxSettings?.occupantName, booking]);

  const resolvedOccupantPhones = useMemo(() => {
    if (!isAllSelected && currentPax) {
      return currentPax.mobile || guestData?.mobile || "";
    }
    if (extraPaxSettings?.occupantPhone) return extraPaxSettings.occupantPhone;
    if (extraPaxList.length > 0) {
      const phones = extraPaxList.map((p) => p.mobile).filter(Boolean).join(", ");
      if (phones) return phones;
    }
    return (
      booking?.breakdown?.booking?.extra_pax?.[0]?.mobile ||
      booking?.extra_pax?.[0]?.mobile ||
      booking?.extra_pax?.[0]?.phone ||
      guestData?.mobile ||
      ""
    );
  }, [isAllSelected, currentPax, extraPaxList, extraPaxSettings?.occupantPhone, booking, guestData]);

  const [occupantName, setOccupantName] = useState(resolvedOccupantNames);
  const [occupantPhone, setOccupantPhone] = useState(resolvedOccupantPhones);

  // Sync state if resolved names update or active pax changes
  React.useEffect(() => {
    if (resolvedOccupantNames) {
      setOccupantName(resolvedOccupantNames);
    }
  }, [resolvedOccupantNames]);

  React.useEffect(() => {
    if (resolvedOccupantPhones) {
      setOccupantPhone(resolvedOccupantPhones);
    }
  }, [resolvedOccupantPhones]);

  // Sync details to parent settings
  React.useEffect(() => {
    if (setExtraPaxSettings) {
      setExtraPaxSettings((prev) => ({
        ...prev,
        occupantName,
        occupantPhone,
        extraPaxList,
        activePaxIndex,
      }));
    }
  }, [occupantName, occupantPhone, extraPaxList, activePaxIndex, setExtraPaxSettings]);

  // Helper for number to words
  const numberToWords = (amount) => {
    if (!amount || amount <= 0) return "Zero Rupees Only";
    const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
    const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

    const convertTwoDigit = (num) => {
      if (num < 10) return ones[num];
      if (num >= 10 && num < 20) return teens[num - 10];
      return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? " " + ones[num % 10] : "");
    };

    const convertThreeDigit = (num) => {
      let result = "";
      if (Math.floor(num / 100) > 0) {
        result += ones[Math.floor(num / 100)] + " Hundred";
        if (num % 100 !== 0) result += " ";
      }
      result += convertTwoDigit(num % 100);
      return result;
    };

    let rupees = Math.floor(amount);
    const paise = Math.round((amount - rupees) * 100);
    let result = "";

    if (rupees >= 10000000) {
      result += convertThreeDigit(Math.floor(rupees / 10000000)) + " Crore ";
      rupees %= 10000000;
    }
    if (rupees >= 100000) {
      result += convertTwoDigit(Math.floor(rupees / 100000)) + " Lakh ";
      rupees %= 100000;
    }
    if (rupees >= 1000) {
      result += convertTwoDigit(Math.floor(rupees / 1000)) + " Thousand ";
      rupees %= 1000;
    }
    if (rupees > 0) {
      result += convertThreeDigit(rupees) + " ";
    }
    result += "Rupees";
    if (paise > 0) {
      result += " and " + convertTwoDigit(paise) + " Paise";
    }
    result += " Only";
    return result.trim();
  };

  // Resolve Arrival & Departure dates reliably
  const checkInRaw =
    billData?.bookingDetails?.checkIn ||
    billData?.bookingDetails?.checkin ||
    billData?.bookingDetails?.checkInDate ||
    booking?.breakdown?.stayDetails?.checkin_date ||
    booking?.breakdown?.booking?.checkin_date ||
    booking?.checkin_date;

  const checkOutRaw =
    billData?.bookingDetails?.checkOut ||
    billData?.bookingDetails?.checkout ||
    billData?.bookingDetails?.checkOutDate ||
    new Date().toISOString();

  const formatDateTime = (val) => {
    if (!val) return "---";
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    return `${d.toLocaleDateString("en-GB")} ${d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })}`;
  };

  const checkInFormatted = formatDateTime(checkInRaw);
  const checkOutFormatted = formatDateTime(checkOutRaw);

  const defaultRoomNumber =
    billData?.bookingDetails?.roomNumber ||
    booking?.breakdown?.rooms?.map((r) => r.room_number).join(", ") ||
    "N/A";

  const roomNumberDisplay =
    (!isAllSelected && currentPax?.room_number)
      ? currentPax.room_number
      : defaultRoomNumber;

  const roomCategoryDisplay =
    billData?.bookingDetails?.roomType ||
    billData?.bookingDetails?.roomCategory ||
    booking?.breakdown?.rooms?.[0]?.room_type ||
    "Standard";

  // Compile day-wise items for Extra Occupant & Services (with live editing support)
  const extraPaxItems = useMemo(() => {
    const items = [];
    let sNo = 1;

    (billData?.serviceChargesByDate || []).forEach((dayData, dayIndex) => {
      const date = Object.keys(dayData)[0];
      const roomEntries = dayData[date] || [];

      roomEntries.forEach((entry, roomIndex) => {
        const chargeKey = `${dayIndex}-${roomIndex}`;
        const c =
          isAmountEditing && editingChargeAmounts?.[chargeKey]
            ? editingChargeAmounts[chargeKey]
            : entry.charges || {};

        const roomNo = entry.roomNumber || "N/A";

        // Extra Guest Charges - personalized with occupant name(s)
        if (Number(c.extraPaxCharges || 0) > 0 || isAmountEditing) {
          const matchingPax = extraPaxList.filter(
            (p) =>
              !p.room_number ||
              String(p.room_number) === String(roomNo) ||
              String(p.room_id) === String(roomNo)
          );

          if (!isAllSelected && currentPax) {
            // Check if current pax matches this room (or if room unassigned/matches)
            const matchesThisRoom =
              !currentPax.room_number ||
              String(currentPax.room_number) === String(roomNo) ||
              String(currentPax.room_id) === String(roomNo) ||
              matchingPax.length === 0;

            if (matchesThisRoom) {
              let paxAmount = 0;
              if (currentPax.extra_pax_amount > 0) {
                paxAmount = Number(currentPax.extra_pax_amount);
              } else if (Number(c.extraPaxCharges || 0) > 0) {
                const count = matchingPax.length > 0 ? matchingPax.length : (extraPaxList.length || 1);
                paxAmount = Math.round(Number(c.extraPaxCharges || 0) / count);
              }

              items.push({
                sNo: sNo++,
                chargeKey,
                fieldKey: "extraPaxCharges",
                date,
                roomNo,
                particulars: `Extra Guest Tariff - ${currentPax.full_name}${
                  currentPax.age ? ` (Age: ${currentPax.age})` : ""
                }${currentPax.gender ? ` [${currentPax.gender}]` : ""}`,
                type: "extraPax",
                amount: paxAmount,
              });
            }
          } else {
            // Combined mode (All Pax)
            if (
              !isAmountEditing &&
              matchingPax.length > 1 &&
              matchingPax.some((p) => p.extra_pax_amount > 0)
            ) {
              matchingPax.forEach((pax) => {
                items.push({
                  sNo: sNo++,
                  chargeKey,
                  fieldKey: "extraPaxCharges",
                  date,
                  roomNo,
                  particulars: `Extra Guest - ${pax.full_name}${
                    pax.age ? ` (Age: ${pax.age})` : ""
                  }${pax.gender ? ` [${pax.gender}]` : ""}`,
                  type: "extraPax",
                  amount: Number(pax.extra_pax_amount || 0),
                });
              });
            } else {
              const occupantLabel =
                matchingPax.map((p) => p.full_name).filter(Boolean).join(", ") ||
                extraPaxList.map((p) => p.full_name).filter(Boolean).join(", ");
              const desc = occupantLabel
                ? `Extra Guest Charges - ${occupantLabel}`
                : "Extra Guest Charges";

              items.push({
                sNo: sNo++,
                chargeKey,
                fieldKey: "extraPaxCharges",
                date,
                roomNo,
                particulars: desc,
                type: "extraPax",
                amount: Number(c.extraPaxCharges || 0),
              });
            }
          }
        }

        // Incidentals
        const paxShare = !isAllSelected && extraPaxList.length > 1 ? (1 / extraPaxList.length) : 1;
        const shareNote = !isAllSelected && extraPaxList.length > 1 ? ` (Share)` : "";

        // Extra Bed
        if (Number(c.extraBedCharges || 0) > 0 || isAmountEditing) {
          items.push({
            sNo: sNo++,
            chargeKey,
            fieldKey: "extraBedCharges",
            date,
            roomNo,
            particulars: `Extra Bed Facility${shareNote}`,
            type: "incidental",
            amount: Math.round(Number(c.extraBedCharges || 0) * paxShare),
          });
        }

        // Food & Room Service
        if (Number(c.foodCharges || 0) > 0 || isAmountEditing) {
          items.push({
            sNo: sNo++,
            chargeKey,
            fieldKey: "foodCharges",
            date,
            roomNo,
            particulars: `Food & Room Service${shareNote}`,
            type: "incidental",
            amount: Math.round(Number(c.foodCharges || 0) * paxShare),
          });
        }

        // Laundry Service
        if (Number(c.laundryCharges || 0) > 0 || isAmountEditing) {
          items.push({
            sNo: sNo++,
            chargeKey,
            fieldKey: "laundryCharges",
            date,
            roomNo,
            particulars: `Laundry Service${shareNote}`,
            type: "incidental",
            amount: Math.round(Number(c.laundryCharges || 0) * paxShare),
          });
        }

        // Bar / Minibar
        if (Number(c.minibarCharges || 0) > 0 || isAmountEditing) {
          items.push({
            sNo: sNo++,
            chargeKey,
            fieldKey: "minibarCharges",
            date,
            roomNo,
            particulars: `Bar / Beverage Charges${shareNote}`,
            type: "incidental",
            amount: Math.round(Number(c.minibarCharges || 0) * paxShare),
          });
        }

        // Miscellaneous Charges
        if (Number(c.manualCharges || 0) > 0 || isAmountEditing) {
          items.push({
            sNo: sNo++,
            chargeKey,
            fieldKey: "manualCharges",
            date,
            roomNo,
            particulars: `Miscellaneous Service Charges${shareNote}`,
            type: "incidental",
            amount: Math.round(Number(c.manualCharges || 0) * paxShare),
          });
        }
      });
    });

    // Fallback if no extra pax charges in daily breakdown yet but extraPaxList defined on booking
    if (
      items.filter((i) => i.type === "extraPax").length === 0 &&
      extraPaxList.length > 0
    ) {
      if (!isAllSelected && currentPax) {
        const pDate = checkInRaw
          ? new Date(checkInRaw).toLocaleDateString("en-GB")
          : new Date().toLocaleDateString("en-GB");
        items.push({
          sNo: sNo++,
          chargeKey: null,
          fieldKey: "extraPaxCharges",
          date: pDate,
          roomNo: currentPax.room_number || roomNumberDisplay || "All",
          particulars: `Extra Guest Tariff - ${currentPax.full_name}${
            currentPax.age ? ` (Age: ${currentPax.age})` : ""
          }${currentPax.gender ? ` [${currentPax.gender}]` : ""}`,
          type: "extraPax",
          amount: Number(currentPax.extra_pax_amount || 0),
        });
      } else {
        extraPaxList.forEach((pax) => {
          const pDate = checkInRaw
            ? new Date(checkInRaw).toLocaleDateString("en-GB")
            : new Date().toLocaleDateString("en-GB");
          items.push({
            sNo: sNo++,
            chargeKey: null,
            fieldKey: "extraPaxCharges",
            date: pDate,
            roomNo: pax.room_number || roomNumberDisplay || "All",
            particulars: `Extra Guest - ${pax.full_name}${
              pax.age ? ` (Age: ${pax.age})` : ""
            }${pax.gender ? ` [${pax.gender}]` : ""}`,
            type: "extraPax",
            amount: Number(pax.extra_pax_amount || 0),
          });
        });
      }
    }

    return items;
  }, [
    billData?.serviceChargesByDate,
    isAmountEditing,
    editingChargeAmounts,
    extraPaxList,
    isAllSelected,
    currentPax,
    checkInRaw,
    roomNumberDisplay,
  ]);

  // Totals calculations
  const totalExtraPaxTariff = useMemo(() => {
    return extraPaxItems
      .filter((i) => i.type === "extraPax")
      .reduce((sum, item) => sum + item.amount, 0);
  }, [extraPaxItems]);

  const totalIncidentals = useMemo(() => {
    return extraPaxItems
      .filter((i) => i.type === "incidental")
      .reduce((sum, item) => sum + item.amount, 0);
  }, [extraPaxItems]);

  const discountAmount = useMemo(() => {
    if (isAmountEditing && editingDiscount !== undefined && editingDiscount !== "") {
      return Number(editingDiscount) || 0;
    }
    const rawDisc = Number(extraPaxSettings?.discount || 0);
    if (!isAllSelected && extraPaxList.length > 1) {
      return Math.round(rawDisc / extraPaxList.length);
    }
    return rawDisc;
  }, [isAmountEditing, editingDiscount, extraPaxSettings?.discount, isAllSelected, extraPaxList.length]);

  const advancePaymentAmount = useMemo(() => {
    if (isAmountEditing && editingAdvancePayment !== undefined && editingAdvancePayment !== "") {
      return Number(editingAdvancePayment) || 0;
    }
    const rawAdv = Number(extraPaxSettings?.advance || 0);
    if (!isAllSelected && extraPaxList.length > 1) {
      return Math.round(rawAdv / extraPaxList.length);
    }
    return rawAdv;
  }, [isAmountEditing, editingAdvancePayment, extraPaxSettings?.advance, isAllSelected, extraPaxList.length]);

  const subtotalBeforeTax = Math.max(
    0,
    totalExtraPaxTariff + totalIncidentals - discountAmount
  );

  // Standard SAC hospitality tax (CGST 2.5% + SGST 2.5% = 5%)
  const cgstAmount = Math.round((subtotalBeforeTax * 2.5) / 100);
  const sgstAmount = Math.round((subtotalBeforeTax * 2.5) / 100);
  const totalTaxAmount = cgstAmount + sgstAmount;
  const grandTotal = subtotalBeforeTax + totalTaxAmount;
  const netPayable = Math.max(0, grandTotal - advancePaymentAmount);

  const billNumberDisplay =
    !isAllSelected && typeof activePaxIndex === "number"
      ? `${bills || 1}-B${activePaxIndex + 1}`
      : `${bills || 1}-B`;

  return (
    <div className="space-y-4">
      {/* Individual Pax Folio Selector (Screen Only) when multiple extra guests exist */}
      {extraPaxList.length > 1 && (
        <div className="print:hidden bg-white border border-gray-200 rounded-lg p-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Select Extra Guest Bill:
            </span>
            <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1 gap-1 flex-wrap">
              <button
                type="button"
                onClick={() => handleSelectPax("all")}
                className={`flex items-center gap-1 px-3 py-1.5 text-xs rounded-md font-medium transition-all ${
                  activePaxIndex === "all"
                    ? "bg-gray-900 text-white font-semibold shadow-xs"
                    : "text-gray-700 hover:bg-gray-200 cursor-pointer"
                }`}
              >
                <span>All Extra Guests (Combined)</span>
              </button>
              {extraPaxList.map((pax, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectPax(idx)}
                  className={`flex items-center gap-1 px-3 py-1.5 text-xs rounded-md font-medium transition-all ${
                    activePaxIndex === idx
                      ? "bg-gray-900 text-white font-semibold shadow-xs"
                      : "text-gray-700 hover:bg-gray-200 cursor-pointer"
                  }`}
                >
                  <span>Bill {idx + 1}: {pax.full_name || `Pax ${idx + 1}`}</span>
                  {pax.room_number && (
                    <span
                      className={`text-[10px] px-1 py-0.2 rounded ${
                        activePaxIndex === idx
                          ? "bg-white/20 text-white"
                          : "bg-gray-200 text-gray-800"
                      }`}
                    >
                      Rm {pax.room_number}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="text-xs text-gray-600">
            {!isAllSelected && currentPax ? (
              <span>
                Viewing separate bill for <strong>{currentPax.full_name || `Pax ${activePaxIndex + 1}`}</strong> (Bill #{billNumberDisplay}). Use <strong>"Print Bill"</strong> above to print.
              </span>
            ) : (
              <span>
                Viewing consolidated folio for all {extraPaxList.length} extra guests (Bill #{billNumberDisplay}).
              </span>
            )}
          </div>
        </div>
      )}

      {/* Editing Mode Notice */}
      {isAmountEditing && (
        <div className="print:hidden bg-yellow-50 border border-yellow-300 text-yellow-900 p-2.5 rounded-lg text-xs flex items-center justify-between shadow-xs">
          <span>
            ✏️ <strong>Editing Mode:</strong> You can edit the guest name, phone, charge amounts, discount, and advance directly in the tables below. Click <strong>"Submit"</strong> in the top bar when done.
          </span>
        </div>
      )}

      {/* Printable Bill Area - Exact match with standard bill styling */}
      <div
        id="printable-bill"
        className="relative bg-white print:shadow-none print:border-none border shadow-lg print:bg-white"
      >
        <div className="p-8 print:p-6">
          {/* Header - Identical layout to BillHeader.jsx */}
          <div className="border-b-2 border-black border-dashed pb-4 mb-6">
            <div className="flex justify-between items-start mb-4 print:mb-2">
              <div className="absolute top-2">
                {showLogo && logo && (
                  <img
                    src={logo}
                    alt="Hotel Logo"
                    className="h-[5.50rem] w-auto print:h-[5.50rem] object-contain"
                  />
                )}
              </div>

              <div className="flex-grow text-center">
                <h1 className="text-xl font-bold text-black mb-2 hotel-name print:text-lg">
                  {billData?.billHeader?.hotelName || "Hotel"}
                </h1>
                <p className="text-base text-black print:text-sm mb-1">
                  {billData?.billHeader?.address || ""}
                </p>
                <p className="text-base text-black print:text-sm mb-2">
                  Contact: {billData?.billHeader?.contact || ""} | Email:{" "}
                  {billData?.billHeader?.email || ""}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 w-full text-base print:text-sm gap-2 items-start">
              <div className="mt-1">
                <span className="font-semibold">Bill Number:</span> {billNumberDisplay}
              </div>

              <div className="text-center">
                <span className="font-semibold">GSTIN:</span>{" "}
                {billData?.billHeader?.gstIn || "N/A"}
              </div>

              <div className="text-right">
                <span className="font-semibold">Bill Date:</span>{" "}
                {new Date(billData?.billHeader?.billDate || Date.now()).toLocaleDateString(
                  "en-GB",
                  { day: "2-digit", month: "2-digit", year: "numeric" }
                )}{" "}
                {new Date(billData?.billHeader?.billDate || Date.now()).toLocaleTimeString(
                  "en-US",
                  { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }
                )}
              </div>
            </div>
          </div>

          {/* Guest & Stay Details - Identical to GuestDetails.jsx table */}
          <div className="mb-4 mt-2">
            <h3 className="font-bold text-black mb-2 text-base">
              Guest & Booking Details
            </h3>

            <table className="w-full text-sm border border-black border-collapse">
              <tbody>
                <tr className="border-b border-black">
                  <td className="bg-gray-100 px-3 py-2 font-semibold border-r border-black w-1/4">
                    Guest Name
                  </td>
                  <td className="px-3 py-2 border-r border-black font-semibold text-gray-900 w-1/4">
                    {isAmountEditing ? (
                      <Input
                        type="text"
                        value={occupantName}
                        onChange={(e) => setOccupantName(e.target.value)}
                        placeholder="Extra Guest Name"
                        className="h-7 text-xs border-gray-300"
                      />
                    ) : (
                      <div>
                        <div>{occupantName}</div>
                        {!isAllSelected && currentPax ? (
                          <div className="text-[11px] text-gray-600 font-normal mt-0.5">
                            Extra Occupant {Number(activePaxIndex) + 1} of {extraPaxList.length}
                            {currentPax.age ? ` • Age: ${currentPax.age}` : ""}
                            {currentPax.gender ? ` • ${currentPax.gender}` : ""}
                          </div>
                        ) : extraPaxList.length > 1 ? (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {extraPaxList.map((pax, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center text-[10px] bg-gray-100 border border-gray-300 px-1.5 py-0.5 rounded text-gray-800"
                              >
                                <strong className="mr-0.5">{idx + 1}.</strong> {pax.full_name}
                                {pax.age ? `, ${pax.age}y` : ""}
                                {pax.gender ? ` (${pax.gender})` : ""}
                                {pax.room_number ? ` - Rm ${pax.room_number}` : ""}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    )}
                  </td>
                  <td className="bg-gray-100 px-3 py-2 font-semibold border-r border-black w-1/4">
                    Bill Type
                  </td>
                  <td className="px-3 py-2 font-semibold text-black w-1/4">
                    {!isAllSelected && currentPax
                      ? `Individual Extra Guest Bill (Pax ${Number(activePaxIndex) + 1})`
                      : "Extra Guest & Room Services (Combined)"}
                  </td>
                </tr>

                <tr className="border-b border-black">
                  <td className="bg-gray-100 px-3 py-2 font-semibold border-r border-black">
                    Master Reservation
                  </td>
                  <td className="px-3 py-2 border-r border-black">
                    {guestData?.full_name || "Primary Guest"} (#{booking?.booking_id || billData?.bookingDetails?.bookingId})
                  </td>
                  <td className="bg-gray-100 px-3 py-2 font-semibold border-r border-black">
                    Mobile / Contact
                  </td>
                  <td className="px-3 py-2">
                    {isAmountEditing ? (
                      <Input
                        type="text"
                        value={occupantPhone}
                        onChange={(e) => setOccupantPhone(e.target.value)}
                        placeholder="Mobile number"
                        className="h-7 text-xs border-gray-300"
                      />
                    ) : (
                      occupantPhone || "---"
                    )}
                  </td>
                </tr>

                <tr className="border-b border-black">
                  <td className="bg-gray-100 px-3 py-2 font-semibold border-r border-black">
                    Room No.
                  </td>
                  <td className="px-3 py-2 border-r border-black font-semibold">
                    {roomNumberDisplay}
                  </td>
                  <td className="bg-gray-100 px-3 py-2 font-semibold border-r border-black">
                    Room Category
                  </td>
                  <td className="px-3 py-2">
                    {roomCategoryDisplay}
                  </td>
                </tr>

                <tr>
                  <td className="bg-gray-100 px-3 py-2 font-semibold border-r border-black">
                    Arrival Date & Time
                  </td>
                  <td className="px-3 py-2 border-r border-black">
                    {checkInFormatted}
                  </td>
                  <td className="bg-gray-100 px-3 py-2 font-semibold border-r border-black">
                    Departure Date & Time
                  </td>
                  <td className="px-3 py-2">
                    {checkOutFormatted}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Charges Breakdown (Day-wise) - Identical to ChargesBreakdown.jsx */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2 mt-2">
              <h3 className="font-bold text-black text-base">
                Charges Breakdown (Day-wise)
              </h3>
            </div>

            <table className="w-full text-xs breakdown-table border border-black border-collapse">
              <thead>
                <tr className="border-b-1 border-black">
                  <th className="border-r-1 border-black px-2 py-2 text-left font-bold bg-gray-100">
                    S.No
                  </th>
                  <th className="border-r-1 border-black px-2 py-2 text-left font-bold bg-gray-100">
                    Date
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
                {extraPaxItems.length > 0 ? (
                  extraPaxItems.map((item, idx) => (
                    <tr key={idx} className="border-b border-gray-200">
                      <td className="border-r border-black px-2 py-1.5 text-left">
                        {item.sNo}
                      </td>
                      <td className="border-r border-black px-2 py-1.5 text-left">
                        {item.date}
                      </td>
                      <td className="border-r border-black px-2 py-1.5 text-left">
                        {item.roomNo}
                      </td>
                      <td className="border-r border-black px-2 py-1.5 text-left">
                        {item.particulars}
                      </td>
                      <td className="px-2 py-1.5 text-right font-medium">
                        {isAmountEditing && item.chargeKey && setEditingChargeAmounts ? (
                          <div className="flex items-center justify-end">
                            <span className="text-xs mr-1">₹</span>
                            <input
                              type="number"
                              step="any"
                              min="0"
                              className="w-20 text-right border border-gray-300 rounded px-1 py-0.5 text-xs font-semibold"
                              value={item.amount === 0 ? "" : item.amount}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setEditingChargeAmounts((prev) => ({
                                  ...prev,
                                  [item.chargeKey]: {
                                    ...(prev[item.chargeKey] || {}),
                                    [item.fieldKey]: val,
                                  },
                                }));
                              }}
                            />
                          </div>
                        ) : (
                          `₹${item.amount.toFixed(2)}`
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-4 py-6 text-center text-gray-500">
                      No extra occupant or service charges recorded.
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-black font-bold bg-gray-50">
                  <td colSpan="4" className="border-r border-black px-2 py-2 text-right">
                    TOTAL CHARGES:
                  </td>
                  <td className="px-2 py-2 text-right font-bold">
                    ₹{(totalExtraPaxTariff + totalIncidentals).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Billing Summary - Identical to BillingSummary.jsx layout */}
          <div className="grid grid-cols-2 gap-8 mb-6 section-gap">
            <div>
              <h3 className="font-bold text-black mb-3 text-base">
                Billing Summary
              </h3>
              <div className="text-sm space-y-1">
                {/* 1. Total tariff */}
                <div className="flex justify-between">
                  <span>Total tariff :</span>
                  <span>₹{totalExtraPaxTariff.toFixed(2)}</span>
                </div>

                {/* Room service if applicable */}
                {totalIncidentals > 0 && (
                  <div className="flex justify-between">
                    <span>Total room service :</span>
                    <span>₹{totalIncidentals.toFixed(2)}</span>
                  </div>
                )}

                {/* 2. Total discount */}
                <div className="flex justify-between">
                  <span>
                    Total discount :
                    {isAmountEditing && (
                      <span className="ml-1 text-xs text-blue-600">(Editable)</span>
                    )}
                  </span>
                  <span>
                    {isAmountEditing && setEditingDiscount ? (
                      <div className="flex items-center">
                        <span className="text-xs mr-1">- ₹</span>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          className="w-20 text-right border border-gray-300 rounded px-1 py-0.5 text-xs font-semibold"
                          value={editingDiscount === 0 ? "" : editingDiscount}
                          onChange={(e) => setEditingDiscount(parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    ) : (
                      `- ₹${discountAmount.toFixed(2)}`
                    )}
                  </span>
                </div>

                {/* 3. CGST */}
                <div className="flex justify-between">
                  <span>CGST @ 2.5%:</span>
                  <span>+ ₹{cgstAmount.toFixed(2)}</span>
                </div>

                {/* 4. SGST */}
                <div className="flex justify-between">
                  <span>SGST @ 2.5%:</span>
                  <span>+ ₹{sgstAmount.toFixed(2)}</span>
                </div>

                {/* 5. Total tax */}
                <div className="flex justify-between font-medium">
                  <span>TOTAL TAX AMOUNT:</span>
                  <span>₹{totalTaxAmount.toFixed(2)}</span>
                </div>

                {/* 6. Advance payment */}
                <div className="flex justify-between">
                  <span>
                    ADVANCE PAYMENT:
                    {isAmountEditing && (
                      <span className="ml-1 text-xs text-blue-600">(Editable)</span>
                    )}
                  </span>
                  <span>
                    {isAmountEditing && setEditingAdvancePayment ? (
                      <div className="flex items-center">
                        <span className="text-xs mr-1">- ₹</span>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          className="w-20 text-right border border-gray-300 rounded px-1 py-0.5 text-xs font-semibold"
                          value={editingAdvancePayment === 0 ? "" : editingAdvancePayment}
                          onChange={(e) => setEditingAdvancePayment(parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    ) : (
                      `- ₹${advancePaymentAmount.toFixed(2)}`
                    )}
                  </span>
                </div>

                {/* 7. Sub total */}
                <div className="flex justify-between">
                  <span>SUB TOTAL:</span>
                  <span>₹{subtotalBeforeTax.toFixed(2)}</span>
                </div>

                {/* 8. Grand total */}
                <div className="flex justify-between">
                  <span>GRAND TOTAL:</span>
                  <span>₹{grandTotal.toFixed(2)}</span>
                </div>

                {/* 9. Net payable */}
                <div className="flex justify-between border-t pt-1 font-bold">
                  <span>NET PAYABLE :</span>
                  <span>₹{netPayable.toFixed(2)}</span>
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
                  {numberToWords(netPayable)}
                </div>
                <div className="mt-4 text-center font-bold text-lg">
                  TOTAL: ₹{netPayable.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Legal Signatures - Identical layout to LegalSignature.jsx */}
          <div className="border-t-2 border-dashed border-black pt-4 section-gap">
            <h3 className="font-bold text-black mb-3 text-base">
              Legal & Signature
            </h3>
            <div className="grid grid-cols-3 gap-8 text-xs">
              <div>
                <div className="space-y-1">
                  <div>
                    <span className="font-bold">GSTIN:</span>{" "}
                    {billData?.legalSignature?.gstIn || "N/A"}
                  </div>
                  <div>
                    <span className="font-bold">Room Stay SAC:</span>{" "}
                    {billData?.legalSignature?.roomStaySac || "996311"}
                  </div>
                  <div>
                    <span className="font-bold">Room Service SAC:</span>{" "}
                    {billData?.legalSignature?.roomServiceSac || "996331"}
                  </div>
                </div>
              </div>

              <div className="text-center">
                <div className="mb-14">
                  <div className="font-bold">Guest Name:</div>
                  <div className="text-sm mt-2">{occupantName}</div>
                </div>
                <div className="border-t border-black pt-2">
                  <div className="font-bold">Guest Signature</div>
                </div>
              </div>

              <div className="text-center">
                <div className="mb-14">
                  <div className="font-bold">Cashier Name:</div>
                  <div className="text-sm mt-2">
                    {userData?.userName || "Cashier"}
                  </div>
                </div>
                <div className="border-t border-black pt-2">
                  <div className="font-bold">Cashier Signature</div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer - Identical to BillFooter.jsx */}
          <div className="border-t-2 border-dashed text-center border-black pt-4 mt-6 text-xs text-gray-600">
            <div className="text-sm font-bold text-black mb-1">
              Thank you for staying with us!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExtraPaxFolio;
