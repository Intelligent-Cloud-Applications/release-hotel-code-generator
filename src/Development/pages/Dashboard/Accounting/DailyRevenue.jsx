import React, { useState, useMemo, useRef } from "react";
import { useAppContext } from "../../../context/AppContext.jsx";
import { Button } from "../../../components/ui/button.js";
import { Input } from "../../../components/ui/input.js";
import { Badge } from "../../../components/ui/badge.js";
import {
  Calendar,
  CreditCard,
  Building2,
  Wifi,
  Banknote,
  Hotel,
  UtensilsCrossed,
  Wine,
  TrendingUp,
  Printer,
  ChevronLeft,
  ChevronRight,
  IndianRupee,
  FileText,
  Search,
  Download,
  Percent,
} from "lucide-react";
import * as XLSX from "xlsx";

const DailyRevenue = () => {
  const { bills, bookings, rooms, guests } = useAppContext();
  const printRef = useRef(null);

  // Single date for daily report
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all"); // 'all' | 'Checkout' | 'Advance'

  // Format date for display
  const formatDate = (dateValue) => {
    if (!dateValue) return "N/A";
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return "Invalid Date";
    return date.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Format date for display (long format)
  const formatDateLong = (dateValue) => {
    if (!dateValue) return "N/A";
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return "Invalid Date";
    return date.toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  // Navigate to previous/next day
  const navigateDay = (direction) => {
    const currentDate = new Date(selectedDate);
    currentDate.setDate(currentDate.getDate() + direction);
    setSelectedDate(currentDate.toISOString().split("T")[0]);
  };

  // Categorize payment method into collection type
  const getCollectionType = (paymentMode) => {
    if (!paymentMode) return "offline";
    const mode = paymentMode.toLowerCase().trim();

    if (
      mode.includes("btc") ||
      mode.includes("bill to company") ||
      mode.includes("company")
    ) {
      return "btc";
    }

    if (mode === "cash") {
      return "offline";
    }

    return "online";
  };

  // Calculate service charges from the services object
  const calculateServicesFromData = (bookingDetails) => {
    let roomCharges = 0;
    let foodCharges = 0;
    let laundryCharges = 0;
    let minibarCharges = 0;
    let extraBedCharges = 0;
    let manualCharges = 0;

    const services = bookingDetails?.services || {};

    Object.keys(services).forEach((roomNumber) => {
      const roomServices = services[roomNumber] || {};
      Object.keys(roomServices).forEach((date) => {
        const dailyServices = roomServices[date] || {};
        roomCharges += dailyServices.room_charges || 0;
        foodCharges += dailyServices.food_charges || 0;
        laundryCharges += dailyServices.laundry_charges || 0;
        minibarCharges += dailyServices.minibar_charges || 0;
        extraBedCharges += dailyServices.extra_bed_charges || 0;
        manualCharges += dailyServices.manual_charges || 0;
      });
    });

    return {
      roomCharges,
      foodCharges,
      laundryCharges,
      minibarCharges,
      extraBedCharges,
      manualCharges,
    };
  };

  // Process bills data for selected date
  const dailyCheckoutData = useMemo(() => {
    if (!bills || bills.length === 0) return [];

    const selectedDateObj = new Date(selectedDate);
    selectedDateObj.setHours(0, 0, 0, 0);
    const nextDayObj = new Date(selectedDate);
    nextDayObj.setDate(nextDayObj.getDate() + 1);
    nextDayObj.setHours(0, 0, 0, 0);

    return bills
      .filter((bill) => {
        const checkoutDate = bill?.bill?.bookingDetails?.checkOut;
        if (!checkoutDate) return false;
        const checkoutDateObj = new Date(checkoutDate);
        return (
          checkoutDateObj >= selectedDateObj && checkoutDateObj < nextDayObj
        );
      })
      .map((bill) => {
        const billData = bill?.bill || {};
        const bookingDetails = billData?.bookingDetails || {};
        const billingSummary = billData?.billingSummary || {};
        const guestDetails = billData?.guestDetails || {};
        const finalSummary = billData?.finalSummary || {};

        const servicesCalculated = calculateServicesFromData(bookingDetails);

        const hotelAmount =
          (billingSummary?.totalRoomServices ||
            billingSummary?.roomChargesTotal ||
            billingSummary?.totalRoomCharges ||
            servicesCalculated.roomCharges ||
            0) - (billingSummary?.partialPayment || 0);

        const restaurantAmount = servicesCalculated.foodCharges || 0;
        const barAmount = servicesCalculated.minibarCharges || 0;
        const otherServicesAmount =
          servicesCalculated.laundryCharges +
          servicesCalculated.extraBedCharges +
          servicesCalculated.manualCharges;

        const partialPayment = billingSummary?.partialPayment || 0;
        const grossTotal =
          finalSummary?.totalAmount ||
          billingSummary?.grandTotal ||
          billingSummary?.totalAmount ||
          0;

        const totalAmount = grossTotal - partialPayment;

        return {
          bookingId: bookingDetails?.bookingId || bill?.bill_id,
          guestName: guestDetails?.guestName,
          roomNumber: bookingDetails?.roomNumber,
          checkoutDate: bookingDetails?.checkOut,
          paymentMode: bill?.payment_mode || "N/A",
          collectionType: getCollectionType(bill?.payment_mode),
          totalAmount,
          grossTotal,
          hotelAmount,
          restaurantAmount,
          barAmount,
          otherServicesAmount,
          partialPayment,
          taxAmount:
            billingSummary?.totalTaxAmount ||
            billingSummary?.roomTaxAmount ||
            0,
          transactionType: "Checkout",
        };
      });
  }, [bills, selectedDate]);

  // Calculate advance payments for selected date
  const dailyAdvanceData = useMemo(() => {
    if (!bookings || bookings.length === 0) return [];

    const selectedDateObj = new Date(selectedDate);
    selectedDateObj.setHours(0, 0, 0, 0);
    const nextDayObj = new Date(selectedDate);
    nextDayObj.setDate(nextDayObj.getDate() + 1);
    nextDayObj.setHours(0, 0, 0, 0);

    const advancePayments = [];

    bookings.forEach((booking) => {
      const partialPayment =
        booking?.partial_payment_amount ||
        booking?.advance_payment ||
        booking?.partialPayment ||
        0;

      if (partialPayment > 0) {
        const bookingDate =
          booking?.booking_date ||
          booking?.created_at ||
          booking?.check_in ||
          booking?.checkIn ||
          booking?.checkin_date;

        if (bookingDate) {
          const bookingDateObj = new Date(bookingDate);
          bookingDateObj.setHours(0, 0, 0, 0);

          if (
            bookingDateObj >= selectedDateObj &&
            bookingDateObj < nextDayObj
          ) {
            const advancePaymentMode =
              booking?.advance_payment_mode || booking?.payment_mode || "Cash";
            const collectionType = getCollectionType(advancePaymentMode);

            const guestId = booking?.guest_id || booking?.guestId;
            const guest = guests?.find((g) => g?.guest_id === guestId);
            const guestName =
              guest?.full_name ||
              guest?.name ||
              booking?.guest_name ||
              booking?.guestName ||
              "N/A";

            let roomNumber = "N/A";
            if (booking?.room_id) {
              if (Array.isArray(booking.room_id)) {
                roomNumber = booking.room_id
                  .map((rid) => {
                    return (
                      rooms?.find((room) => room.room_id === rid)?.room_number ||
                      "N/A"
                    );
                  })
                  .join(", ");
              } else {
                const room = rooms?.find((r) => r.room_id === booking.room_id);
                roomNumber = room?.room_number || booking.room_id;
              }
            } else if (booking?.room_number || booking?.roomNumber) {
              roomNumber = booking?.room_number || booking?.roomNumber;
            }

            advancePayments.push({
              bookingId: booking?.booking_id || booking?.id,
              guestName,
              roomNumber,
              checkoutDate: bookingDate,
              paymentMode: advancePaymentMode,
              collectionType,
              totalAmount: partialPayment,
              grossTotal: partialPayment,
              hotelAmount: partialPayment,
              restaurantAmount: 0,
              barAmount: 0,
              otherServicesAmount: 0,
              partialPayment: 0,
              taxAmount: 0,
              transactionType: "Advance",
            });
          }
        }
      }
    });

    return advancePayments;
  }, [bookings, selectedDate, guests, rooms]);

  // Combined transactions
  const allTransactions = useMemo(() => {
    return [...dailyCheckoutData, ...dailyAdvanceData];
  }, [dailyCheckoutData, dailyAdvanceData]);

  // Filtered transactions for display
  const filteredTransactions = useMemo(() => {
    return allTransactions.filter((item) => {
      const matchesType =
        filterType === "all" || item.transactionType === filterType;
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        (item.bookingId || "").toLowerCase().includes(q) ||
        (item.guestName || "").toLowerCase().includes(q) ||
        (item.roomNumber || "").toLowerCase().includes(q) ||
        (item.paymentMode || "").toLowerCase().includes(q);
      return matchesType && matchesSearch;
    });
  }, [allTransactions, filterType, search]);

  // Daily Summary calculations
  const dailySummary = useMemo(() => {
    const summary = {
      totalCollection: 0,
      onlineCollection: 0,
      offlineCollection: 0,
      btcCollection: 0,
      checkoutCollection: 0,
      advanceCollection: 0,
      hotelRevenue: 0,
      restaurantRevenue: 0,
      barRevenue: 0,
      otherRevenue: 0,
      taxCollection: 0,
      totalCheckouts: dailyCheckoutData.length,
      totalAdvances: dailyAdvanceData.length,
    };

    dailyCheckoutData.forEach((item) => {
      summary.checkoutCollection += item.totalAmount;
      summary.hotelRevenue += item.hotelAmount;
      summary.restaurantRevenue += item.restaurantAmount;
      summary.barRevenue += item.barAmount;
      summary.otherRevenue += item.otherServicesAmount;
      summary.taxCollection += item.taxAmount;

      if (item.collectionType === "online") {
        summary.onlineCollection += item.totalAmount;
      } else if (item.collectionType === "btc") {
        summary.btcCollection += item.totalAmount;
      } else {
        summary.offlineCollection += item.totalAmount;
      }
    });

    dailyAdvanceData.forEach((item) => {
      summary.advanceCollection += item.totalAmount;
      summary.hotelRevenue += item.hotelAmount;

      if (item.collectionType === "online") {
        summary.onlineCollection += item.totalAmount;
      } else if (item.collectionType === "btc") {
        summary.btcCollection += item.totalAmount;
      } else {
        summary.offlineCollection += item.totalAmount;
      }
    });

    summary.totalCollection =
      summary.checkoutCollection + summary.advanceCollection;

    return summary;
  }, [dailyCheckoutData, dailyAdvanceData]);

  // Export to Excel
  const handleExportExcel = () => {
    const sheetData = filteredTransactions.map((item) => ({
      "Transaction Type": item.transactionType,
      "Booking / Bill ID": item.bookingId || "-",
      "Guest Name": item.guestName || "-",
      "Room #": item.roomNumber || "-",
      "Payment Mode": item.paymentMode,
      "Channel": item.collectionType?.toUpperCase(),
      "Lodging (Hotel) ₹": item.hotelAmount || 0,
      "Restaurant (F&B) ₹": item.restaurantAmount || 0,
      "Bar / Minibar ₹": item.barAmount || 0,
      "Other Services ₹": item.otherServicesAmount || 0,
      "Total Amount ₹": item.totalAmount || 0,
    }));

    const ws = XLSX.utils.json_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Daily Revenue");
    XLSX.writeFile(wb, `Daily_Revenue_${selectedDate}.xlsx`);
  };

  // Print function
  const handlePrint = () => {
    const printWindow = window.open("");
    printWindow.document.write(`
      <html>
        <head>
          <title>Daily Revenue Report - ${formatDateLong(selectedDate)}</title>
          <style>
            * { box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; padding: 24px; margin: 0; color: #111827; }
            .print-header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #2563eb; padding-bottom: 12px; }
            .print-header h1 { margin: 0 0 4px 0; font-size: 22px; color: #1e3a8a; }
            .print-header p { margin: 0; font-size: 13px; color: #6b7280; font-weight: 500; }
            .section-title { font-size: 12px; font-weight: 700; margin: 16px 0 8px 0; color: #374151; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
            .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px; }
            .summary-card { border: 1px solid #e5e7eb; padding: 10px; border-radius: 8px; background: #f9fafb; }
            .summary-card .label { font-size: 11px; color: #6b7280; font-weight: 600; text-transform: uppercase; }
            .summary-card .value { font-size: 15px; font-weight: 700; color: #111827; margin-top: 2px; }
            .summary-card .sub { font-size: 10px; color: #9ca3af; margin-top: 2px; }
            table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 11px; }
            th, td { border: 1px solid #e5e7eb; padding: 6px 8px; text-align: left; }
            th { background-color: #f3f4f6; font-weight: 700; color: #374151; }
            .text-right { text-align: right; }
            tfoot { background-color: #f9fafb; font-weight: 700; }
            .footer { margin-top: 24px; text-align: center; font-size: 10px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 8px; }
          </style>
        </head>
        <body>
          <div class="print-header">
            <h1>Daily Financial Revenue Report</h1>
            <p>${formatDateLong(selectedDate)}</p>
          </div>
          
          <div class="section-title">Collection Summary</div>
          <div class="summary-grid">
            <div class="summary-card">
              <div class="label">Total Collection</div>
              <div class="value">${formatCurrency(dailySummary.totalCollection)}</div>
              <div class="sub">${dailySummary.totalCheckouts + dailySummary.totalAdvances} transactions</div>
            </div>
            <div class="summary-card">
              <div class="label">Online / Bank</div>
              <div class="value">${formatCurrency(dailySummary.onlineCollection)}</div>
              <div class="sub">UPI, Cards, POS</div>
            </div>
            <div class="summary-card">
              <div class="label">Physical Cash</div>
              <div class="value">${formatCurrency(dailySummary.offlineCollection)}</div>
              <div class="sub">Cash Drawer Inflow</div>
            </div>
            <div class="summary-card">
              <div class="label">Bill to Company (BTC)</div>
              <div class="value">${formatCurrency(dailySummary.btcCollection)}</div>
              <div class="sub">Corporate Credit</div>
            </div>
          </div>

          <div class="section-title">Service-Wise Revenue Inflow</div>
          <div class="summary-grid">
            <div class="summary-card">
              <div class="label">Hotel Lodging</div>
              <div class="value">${formatCurrency(dailySummary.hotelRevenue)}</div>
            </div>
            <div class="summary-card">
              <div class="label">Restaurant (F&B)</div>
              <div class="value">${formatCurrency(dailySummary.restaurantRevenue)}</div>
            </div>
            <div class="summary-card">
              <div class="label">Bar / Minibar</div>
              <div class="value">${formatCurrency(dailySummary.barRevenue)}</div>
            </div>
            <div class="summary-card">
              <div class="label">Laundry & Other</div>
              <div class="value">${formatCurrency(dailySummary.otherRevenue)}</div>
            </div>
          </div>
          
          <div class="section-title">Transaction Audit Log (${filteredTransactions.length} Records)</div>
          <table>
            <thead>
              <tr>
                <th>Booking / Bill ID</th>
                <th>Guest Name</th>
                <th>Room #</th>
                <th>Type</th>
                <th>Channel</th>
                <th>Payment Mode</th>
                <th class="text-right">Hotel</th>
                <th class="text-right">Restaurant</th>
                <th class="text-right">Bar</th>
                <th class="text-right">Other</th>
                <th class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${filteredTransactions
                .map(
                  (item) => `
                <tr>
                  <td>${item.bookingId || "N/A"}</td>
                  <td>${item.guestName || "N/A"}</td>
                  <td>${item.roomNumber || "N/A"}</td>
                  <td>${item.transactionType}</td>
                  <td>${item.collectionType?.toUpperCase()}</td>
                  <td>${item.paymentMode}</td>
                  <td class="text-right">${item.hotelAmount > 0 ? formatCurrency(item.hotelAmount) : "-"}</td>
                  <td class="text-right">${item.restaurantAmount > 0 ? formatCurrency(item.restaurantAmount) : "-"}</td>
                  <td class="text-right">${item.barAmount > 0 ? formatCurrency(item.barAmount) : "-"}</td>
                  <td class="text-right">${item.otherServicesAmount > 0 ? formatCurrency(item.otherServicesAmount) : "-"}</td>
                  <td class="text-right"><strong>${formatCurrency(item.totalAmount)}</strong></td>
                </tr>
              `
                )
                .join("")}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="6" class="text-right">Daily Totals:</td>
                <td class="text-right">${formatCurrency(dailySummary.hotelRevenue)}</td>
                <td class="text-right">${formatCurrency(dailySummary.restaurantRevenue)}</td>
                <td class="text-right">${formatCurrency(dailySummary.barRevenue)}</td>
                <td class="text-right">${formatCurrency(dailySummary.otherRevenue)}</td>
                <td class="text-right">${formatCurrency(dailySummary.totalCollection)}</td>
              </tr>
            </tfoot>
          </table>
          
          <div class="footer">
            <p>Generated by Hotel Accounting System on ${new Date().toLocaleString("en-IN")}</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="flex flex-col h-full min-h-[92vh] bg-gray-50/60 p-4 sm:p-6 space-y-4">
      {/* -------------------- TOP METRIC STRIP -------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Collection */}
        <div className="bg-white border border-blue-200/80 rounded-xl p-3.5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-blue-700 tracking-wide uppercase">
              Total Day Collection
            </div>
            <div className="text-xl font-bold text-gray-900 mt-0.5">
              {formatCurrency(dailySummary.totalCollection)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {dailySummary.totalCheckouts + dailySummary.totalAdvances} transactions
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Online / Digital */}
        <div className="bg-white border border-emerald-200/80 rounded-xl p-3.5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-emerald-700 tracking-wide uppercase">
              Online / Digital Inflow
            </div>
            <div className="text-xl font-bold text-emerald-700 mt-0.5">
              {formatCurrency(dailySummary.onlineCollection)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              UPI, Card & Bank Transfers
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <Wifi className="w-5 h-5" />
          </div>
        </div>

        {/* Physical Cash */}
        <div className="bg-white border border-amber-200/80 rounded-xl p-3.5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-amber-700 tracking-wide uppercase">
              Cash Drawer Inflow
            </div>
            <div className="text-xl font-bold text-amber-700 mt-0.5">
              {formatCurrency(dailySummary.offlineCollection)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Physical Currency Received
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
            <Banknote className="w-5 h-5" />
          </div>
        </div>

        {/* Bill to Company (BTC) */}
        <div className="bg-white border border-purple-200/80 rounded-xl p-3.5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-purple-700 tracking-wide uppercase">
              Corporate / BTC Ledger
            </div>
            <div className="text-xl font-bold text-purple-700 mt-0.5">
              {formatCurrency(dailySummary.btcCollection)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Bill to Company Accounts
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
            <Building2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* -------------------- DEPARTMENT REVENUE STRIP -------------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        <div className="bg-white border border-gray-200 rounded-lg p-2.5 flex items-center gap-2.5 shadow-2xs">
          <div className="p-2 rounded-md bg-blue-50 text-blue-600">
            <Hotel className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-semibold text-gray-500">Lodging / Rooms</div>
            <div className="text-xs font-bold text-gray-900">{formatCurrency(dailySummary.hotelRevenue)}</div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-2.5 flex items-center gap-2.5 shadow-2xs">
          <div className="p-2 rounded-md bg-amber-50 text-amber-600">
            <UtensilsCrossed className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-semibold text-gray-500">Restaurant (F&B)</div>
            <div className="text-xs font-bold text-gray-900">{formatCurrency(dailySummary.restaurantRevenue)}</div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-2.5 flex items-center gap-2.5 shadow-2xs">
          <div className="p-2 rounded-md bg-purple-50 text-purple-600">
            <Wine className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-semibold text-gray-500">Bar / Minibar</div>
            <div className="text-xs font-bold text-gray-900">{formatCurrency(dailySummary.barRevenue)}</div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-2.5 flex items-center gap-2.5 shadow-2xs">
          <div className="p-2 rounded-md bg-teal-50 text-teal-600">
            <CreditCard className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-semibold text-gray-500">Laundry & Services</div>
            <div className="text-xs font-bold text-gray-900">{formatCurrency(dailySummary.otherRevenue)}</div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-2.5 flex items-center gap-2.5 shadow-2xs col-span-2 sm:col-span-1">
          <div className="p-2 rounded-md bg-rose-50 text-rose-600">
            <Percent className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-semibold text-gray-500">Taxes (GST)</div>
            <div className="text-xs font-bold text-gray-900">{formatCurrency(dailySummary.taxCollection)}</div>
          </div>
        </div>
      </div>

      {/* -------------------- CONTROL & FILTER BAR -------------------- */}
      <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Left: Date Navigation Controller */}
        <div className="flex items-center gap-1.5 bg-gray-50 p-1 rounded-lg border border-gray-200">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateDay(-1)}
            className="h-7 w-7 text-gray-600 hover:bg-white"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <div className="flex items-center gap-2 px-1">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="h-7 text-xs border-0 bg-transparent p-0 focus-visible:ring-0 w-28 font-medium text-gray-800"
            />
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateDay(1)}
            className="h-7 w-7 text-gray-600 hover:bg-white"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedDate(new Date().toISOString().split("T")[0])}
            className="h-7 px-2 text-[11px] font-semibold bg-white border-gray-200 hover:bg-gray-100"
          >
            Today
          </Button>
        </div>

        {/* Center: Type Segment Filter */}
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg border border-gray-200/80">
          <button
            onClick={() => setFilterType("all")}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
              filterType === "all"
                ? "bg-white text-blue-700 shadow-xs border border-gray-200/70"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            All ({allTransactions.length})
          </button>
          <button
            onClick={() => setFilterType("Checkout")}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
              filterType === "Checkout"
                ? "bg-white text-blue-700 shadow-xs border border-gray-200/70"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Checkouts ({dailyCheckoutData.length})
          </button>
          <button
            onClick={() => setFilterType("Advance")}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
              filterType === "Advance"
                ? "bg-white text-teal-700 shadow-xs border border-gray-200/70"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Advances ({dailyAdvanceData.length})
          </button>
        </div>

        {/* Right: Search & Export actions */}
        <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end">
          <div className="relative w-full sm:w-60">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search guest, room, id..."
              className="pl-8 h-8 text-xs bg-gray-50/50 border-gray-200"
            />
          </div>

          <Button
            onClick={handleExportExcel}
            variant="outline"
            size="sm"
            className="h-8 px-2.5 text-xs gap-1 border-gray-200 text-gray-700 hover:bg-gray-50"
            title="Download Excel Spreadsheet"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            Excel
          </Button>

          <Button
            onClick={handlePrint}
            size="sm"
            className="h-8 px-3 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Report
          </Button>
        </div>
      </div>

      {/* -------------------- AUDIT TRANSACTIONS TABLE -------------------- */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/80 sticky top-0 z-10 border-b border-gray-200">
              <tr>
                <th className="text-[11px] font-bold text-gray-700 uppercase tracking-wider px-3.5 py-2.5">
                  ID / Bill #
                </th>
                <th className="text-[11px] font-bold text-gray-700 uppercase tracking-wider px-3.5 py-2.5">
                  Guest Name
                </th>
                <th className="text-[11px] font-bold text-gray-700 uppercase tracking-wider px-3.5 py-2.5">
                  Room
                </th>
                <th className="text-[11px] font-bold text-gray-700 uppercase tracking-wider px-3.5 py-2.5">
                  Type
                </th>
                <th className="text-[11px] font-bold text-gray-700 uppercase tracking-wider px-3.5 py-2.5">
                  Channel
                </th>
                <th className="text-[11px] font-bold text-gray-700 uppercase tracking-wider px-3.5 py-2.5">
                  Payment Mode
                </th>
                <th className="text-[11px] font-bold text-gray-700 uppercase tracking-wider px-3.5 py-2.5 text-right">
                  Lodging
                </th>
                <th className="text-[11px] font-bold text-gray-700 uppercase tracking-wider px-3.5 py-2.5 text-right">
                  Restaurant
                </th>
                <th className="text-[11px] font-bold text-gray-700 uppercase tracking-wider px-3.5 py-2.5 text-right">
                  Bar
                </th>
                <th className="text-[11px] font-bold text-gray-700 uppercase tracking-wider px-3.5 py-2.5 text-right">
                  Other
                </th>
                <th className="text-[11px] font-bold text-gray-700 uppercase tracking-wider px-3.5 py-2.5 text-right">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={11} className="h-32 text-center text-gray-400">
                    <TrendingUp className="w-6 h-6 text-gray-300 mx-auto mb-1.5" />
                    No transactions recorded for {formatDate(selectedDate)}
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((item, index) => (
                  <tr
                    key={`${item.bookingId}-${item.transactionType}-${index}`}
                    className={`hover:bg-blue-50/20 transition-colors ${
                      item.transactionType === "Advance" ? "bg-teal-50/20" : ""
                    }`}
                  >
                    <td className="px-3.5 py-2.5 font-mono text-gray-900 font-semibold">
                      {item.bookingId || "N/A"}
                    </td>
                    <td className="px-3.5 py-2.5 font-medium text-gray-900 max-w-[180px] truncate">
                      {item.guestName || "N/A"}
                    </td>
                    <td className="px-3.5 py-2.5 font-semibold text-gray-800">
                      {item.roomNumber || "-"}
                    </td>
                    <td className="px-3.5 py-2.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                          item.transactionType === "Advance"
                            ? "bg-teal-50 text-teal-700 border border-teal-200"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}
                      >
                        {item.transactionType}
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                          item.collectionType === "online"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : item.collectionType === "btc"
                            ? "bg-purple-50 text-purple-700 border border-purple-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {item.collectionType === "btc"
                          ? "BTC"
                          : item.collectionType.charAt(0).toUpperCase() +
                            item.collectionType.slice(1)}
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5 text-gray-600">
                      {item.paymentMode}
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-medium">
                      {item.hotelAmount > 0 ? formatCurrency(item.hotelAmount) : "-"}
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-medium">
                      {item.restaurantAmount > 0 ? formatCurrency(item.restaurantAmount) : "-"}
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-medium">
                      {item.barAmount > 0 ? formatCurrency(item.barAmount) : "-"}
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-medium">
                      {item.otherServicesAmount > 0 ? formatCurrency(item.otherServicesAmount) : "-"}
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-bold text-gray-900">
                      {formatCurrency(item.totalAmount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredTransactions.length > 0 && (
              <tfoot className="bg-gray-50 border-t-2 border-gray-200 text-xs font-bold text-gray-900">
                <tr>
                  <td colSpan={6} className="px-3.5 py-2.5 text-right text-gray-500 uppercase tracking-wider">
                    Daily Totals:
                  </td>
                  <td className="px-3.5 py-2.5 text-right">
                    {formatCurrency(dailySummary.hotelRevenue)}
                  </td>
                  <td className="px-3.5 py-2.5 text-right">
                    {formatCurrency(dailySummary.restaurantRevenue)}
                  </td>
                  <td className="px-3.5 py-2.5 text-right">
                    {formatCurrency(dailySummary.barRevenue)}
                  </td>
                  <td className="px-3.5 py-2.5 text-right">
                    {formatCurrency(dailySummary.otherRevenue)}
                  </td>
                  <td className="px-3.5 py-2.5 text-right text-blue-700 font-extrabold">
                    {formatCurrency(dailySummary.totalCollection)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

export default DailyRevenue;
