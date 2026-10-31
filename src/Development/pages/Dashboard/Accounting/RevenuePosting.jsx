import React, { useState, useMemo } from "react";
import { useAppContext } from "../../../context/AppContext.jsx";
import { Button } from "../../../components/ui/button.js";
import { Input } from "../../../components/ui/input.js";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select.js";
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
  Filter,
  Download,
  RefreshCw,
  Search,
  Percent,
  FileSpreadsheet,
} from "lucide-react";
import * as XLSX from "xlsx";

const RevenuePosting = () => {
  const { bills, bookings, guests } = useAppContext();

  // Date filters
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [collectionTypeFilter, setCollectionTypeFilter] = useState("all");
  const [serviceTypeFilter, setServiceTypeFilter] = useState("all");
  const [search, setSearch] = useState("");

  // Format date
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

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount || 0);
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

  // Helper to extract and format payment mode / multi-payment breakdown
  const parsePaymentModeAndSplits = (record, defaultMode = "Cash") => {
    // Check possible locations for multi-payments
    const splits =
      record?.multi_payments ||
      record?.bill?.multi_payments ||
      record?.bookingDetails?.multi_payments ||
      record?.breakdown?.booking?.multi_payments ||
      record?.payment_history ||
      [];

    const rawMode =
      record?.payment_mode ||
      record?.advance_payment_mode ||
      record?.bill?.payment_mode ||
      defaultMode ||
      "N/A";

    const validSplits = Array.isArray(splits)
      ? splits.filter((s) => s && (s.mode || s.paymentMode) && parseFloat(s.amount || 0) > 0)
      : [];

    if (validSplits.length > 0) {
      const splitText = validSplits
        .map((s) => `${s.mode || s.paymentMode}: ₹${parseFloat(s.amount).toLocaleString("en-IN")}`)
        .join(", ");
      return {
        paymentMode: `Multi (${splitText})`,
        isMultiPayment: true,
        splits: validSplits,
        displayMode: "Multi-Payment",
        collectionType: validSplits.some((s) => (s.mode || s.paymentMode).toLowerCase() === "cash") &&
          validSplits.some((s) => (s.mode || s.paymentMode).toLowerCase() !== "cash")
          ? "multi"
          : getCollectionType(validSplits[0]?.mode || validSplits[0]?.paymentMode),
      };
    }

    return {
      paymentMode: rawMode,
      isMultiPayment: false,
      splits: [],
      displayMode: rawMode,
      collectionType: getCollectionType(rawMode),
    };
  };

  // Process bills data to get revenue summary
  const revenueData = useMemo(() => {
    if (!bills || bills.length === 0) return [];

    return bills.map((bill) => {
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

      const totalAmount =
        (finalSummary?.totalAmount ||
          billingSummary?.balanceDue ||
          billingSummary?.grandTotal ||
          billingSummary?.totalAmount ||
          0) - (billingSummary?.partialPayment || 0);

      const paymentInfo = parsePaymentModeAndSplits(
        { ...bill, ...billData, bookingDetails },
        bill?.payment_mode || "N/A"
      );

      return {
        bookingId: bookingDetails?.bookingId || bill?.bill_id,
        guestName: guestDetails?.guestName,
        checkoutDate: bookingDetails?.checkOut,
        paymentMode: paymentInfo.paymentMode,
        isMultiPayment: paymentInfo.isMultiPayment,
        splits: paymentInfo.splits,
        displayMode: paymentInfo.displayMode,
        collectionType: paymentInfo.collectionType,
        totalAmount,
        hotelAmount,
        restaurantAmount,
        barAmount,
        otherServicesAmount,
        partialPayment: billingSummary?.partialPayment || 0,
        discount:
          billingSummary?.discountAmount || billingSummary?.totalDiscount || 0,
        taxAmount:
          billingSummary?.totalTaxAmount || billingSummary?.roomTaxAmount || 0,
      };
    });
  }, [bills]);

  // Filter data based on date range and filters
  const filteredRevenueData = useMemo(() => {
    return revenueData.filter((item) => {
      if (startDate && item.checkoutDate) {
        const checkoutDateObj = new Date(item.checkoutDate);
        const startDateObj = new Date(startDate);
        startDateObj.setHours(0, 0, 0, 0);
        if (checkoutDateObj < startDateObj) return false;
      }

      if (endDate && item.checkoutDate) {
        const checkoutDateObj = new Date(item.checkoutDate);
        const endDateObj = new Date(endDate);
        endDateObj.setHours(23, 59, 59, 999);
        if (checkoutDateObj > endDateObj) return false;
      }

      if (
        collectionTypeFilter !== "all" &&
        item.collectionType !== collectionTypeFilter
      ) {
        return false;
      }

      return true;
    });
  }, [revenueData, startDate, endDate, collectionTypeFilter]);

  // Calculate advance payments from bookings for the selected date range
  const advancePaymentStats = useMemo(() => {
    if (!bookings || bookings.length === 0) {
      return {
        totalAdvance: 0,
        advanceCount: 0,
        advancePayments: [],
        onlineAdvance: 0,
        offlineAdvance: 0,
        btcAdvance: 0,
      };
    }

    const advancePayments = [];
    let totalAdvance = 0;
    let onlineAdvance = 0;
    let offlineAdvance = 0;
    let btcAdvance = 0;

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
          const startDateObj = new Date(startDate);
          const endDateObj = new Date(endDate);
          startDateObj.setHours(0, 0, 0, 0);
          endDateObj.setHours(23, 59, 59, 999);

          if (bookingDateObj >= startDateObj && bookingDateObj <= endDateObj) {
            const paymentInfo = parsePaymentModeAndSplits(
              booking,
              booking?.advance_payment_mode || booking?.payment_mode || "Cash"
            );
            const advancePaymentMode = paymentInfo.paymentMode;
            const collectionType = paymentInfo.collectionType;

            totalAdvance += partialPayment;

            if (collectionType === "online") {
              onlineAdvance += partialPayment;
            } else if (collectionType === "btc") {
              btcAdvance += partialPayment;
            } else {
              offlineAdvance += partialPayment;
            }

            const guestName =
              guests?.find((guest) => guest.guest_id === booking?.guest_id)
                ?.full_name || "N/A";

            advancePayments.push({
              bookingId: booking?.booking_id || booking?.bookingId,
              guestName: guestName,
              amount: partialPayment,
              date: bookingDate,
              paymentMode: advancePaymentMode,
              isMultiPayment: paymentInfo.isMultiPayment,
              splits: paymentInfo.splits,
              displayMode: paymentInfo.displayMode,
              collectionType: collectionType,
              transactionType: "Advance",
              hotelAmount: partialPayment,
              restaurantAmount: 0,
              barAmount: 0,
              otherServicesAmount: 0,
              totalAmount: partialPayment,
            });
          }
        }
      }
    });

    return {
      totalAdvance,
      advanceCount: advancePayments.length,
      advancePayments,
      onlineAdvance,
      offlineAdvance,
      btcAdvance,
    };
  }, [bookings, startDate, endDate, guests]);

  // Summary statistics
  const summaryStats = useMemo(() => {
    const stats = {
      totalCollection: 0,
      onlineCollection: 0,
      offlineCollection: 0,
      btcCollection: 0,
      hotelRevenue: 0,
      restaurantRevenue: 0,
      barRevenue: 0,
      otherRevenue: 0,
      taxCollection: 0,
      totalTransactions:
        filteredRevenueData.length + advancePaymentStats.advanceCount,
    };

    filteredRevenueData.forEach((item) => {
      stats.totalCollection += item.totalAmount;
      stats.hotelRevenue += item.hotelAmount;
      stats.restaurantRevenue += item.restaurantAmount;
      stats.barRevenue += item.barAmount;
      stats.otherRevenue += item.otherServicesAmount;
      stats.taxCollection += item.taxAmount || 0;

      if (item.collectionType === "online") {
        stats.onlineCollection += item.totalAmount;
      } else if (item.collectionType === "btc") {
        stats.btcCollection += item.totalAmount;
      } else {
        stats.offlineCollection += item.totalAmount;
      }
    });

    stats.totalCollection += advancePaymentStats.totalAdvance;
    stats.onlineCollection += advancePaymentStats.onlineAdvance;
    stats.offlineCollection += advancePaymentStats.offlineAdvance;
    stats.btcCollection += advancePaymentStats.btcAdvance;

    return stats;
  }, [filteredRevenueData, advancePaymentStats]);

  // Combine checkout transactions and advance payments
  const combinedTransactions = useMemo(() => {
    const checkoutTransactions = filteredRevenueData.map((item) => ({
      ...item,
      transactionType: "Checkout",
      date: item.checkoutDate,
    }));

    return [...checkoutTransactions, ...advancePaymentStats.advancePayments];
  }, [filteredRevenueData, advancePaymentStats.advancePayments]);

  // Filter by service type and search
  const tableData = useMemo(() => {
    let result = combinedTransactions;

    if (serviceTypeFilter !== "all") {
      result = result.filter((item) => {
        if (item.transactionType === "Advance") return false;
        switch (serviceTypeFilter) {
          case "hotel":
            return item.hotelAmount > 0;
          case "restaurant":
            return item.restaurantAmount > 0;
          case "bar":
            return item.barAmount > 0;
          case "other":
            return item.otherServicesAmount > 0;
          default:
            return true;
        }
      });
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (item) =>
          (item.bookingId || "").toLowerCase().includes(q) ||
          (item.guestName || "").toLowerCase().includes(q) ||
          (item.paymentMode || "").toLowerCase().includes(q)
      );
    }

    return result;
  }, [combinedTransactions, serviceTypeFilter, search]);

  // Totals for table
  const tableTotals = useMemo(() => {
    return tableData.reduce(
      (acc, item) => {
        acc.hotelRevenue += item.hotelAmount || 0;
        acc.restaurantRevenue += item.restaurantAmount || 0;
        acc.barRevenue += item.barAmount || 0;
        acc.otherRevenue += item.otherServicesAmount || 0;
        acc.totalCollection += item.totalAmount || 0;
        return acc;
      },
      {
        hotelRevenue: 0,
        restaurantRevenue: 0,
        barRevenue: 0,
        otherRevenue: 0,
        totalCollection: 0,
      }
    );
  }, [tableData]);

  // Clear filters
  const clearFilters = () => {
    const today = new Date().toISOString().split("T")[0];
    setStartDate(today);
    setEndDate(today);
    setCollectionTypeFilter("all");
    setServiceTypeFilter("all");
    setSearch("");
  };

  // Export to Excel
  const handleExportExcel = () => {
    const sheetData = tableData.map((item) => ({
      Date: formatDate(item.date || item.checkoutDate),
      "Booking ID": item.bookingId || "-",
      "Guest Name": item.guestName || "-",
      "Transaction Type": item.transactionType || "Checkout",
      "Collection Channel": item.collectionType?.toUpperCase() || "OFFLINE",
      "Payment Mode": item.paymentMode,
      "Hotel Lodging ₹": item.hotelAmount || 0,
      "Restaurant F&B ₹": item.restaurantAmount || 0,
      "Bar / Minibar ₹": item.barAmount || 0,
      "Other Services ₹": item.otherServicesAmount || 0,
      "Total Amount ₹": item.totalAmount || 0,
    }));

    const ws = XLSX.utils.json_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Revenue Posting");
    XLSX.writeFile(wb, `Revenue_Posting_${startDate}_to_${endDate}.xlsx`);
  };

  return (
    <div className="flex flex-col h-full min-h-[92vh] bg-gray-50/60 p-4 sm:p-6 space-y-4">
      {/* -------------------- TOP SUMMARY METRIC STRIP -------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Collection */}
        <div className="bg-white border border-blue-200/80 rounded-xl p-3.5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-blue-700 tracking-wide uppercase">
              Total Inflow Collection
            </div>
            <div className="text-xl font-bold text-gray-900 mt-0.5">
              {formatCurrency(summaryStats.totalCollection)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {summaryStats.totalTransactions} transactions in range
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Online Collection */}
        <div className="bg-white border border-emerald-200/80 rounded-xl p-3.5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-emerald-700 tracking-wide uppercase">
              Online / Bank Settlements
            </div>
            <div className="text-xl font-bold text-emerald-700 mt-0.5">
              {formatCurrency(summaryStats.onlineCollection)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              UPI, POS, Cards & Gateways
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <Wifi className="w-5 h-5" />
          </div>
        </div>

        {/* Offline / Cash Collection */}
        <div className="bg-white border border-amber-200/80 rounded-xl p-3.5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-amber-700 tracking-wide uppercase">
              Physical Cash Collection
            </div>
            <div className="text-xl font-bold text-amber-700 mt-0.5">
              {formatCurrency(summaryStats.offlineCollection)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Direct Cash Drawer Deposits
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
            <Banknote className="w-5 h-5" />
          </div>
        </div>

        {/* BTC / Corporate */}
        <div className="bg-white border border-purple-200/80 rounded-xl p-3.5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-purple-700 tracking-wide uppercase">
              Bill to Company (BTC)
            </div>
            <div className="text-xl font-bold text-purple-700 mt-0.5">
              {formatCurrency(summaryStats.btcCollection)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Corporate Ledger Receivables
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
            <Building2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* -------------------- DEPARTMENT REVENUE BREAKDOWN -------------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        <div className="bg-white border border-gray-200 rounded-lg p-2.5 flex items-center gap-2.5 shadow-2xs">
          <div className="p-2 rounded-md bg-blue-50 text-blue-600">
            <Hotel className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-semibold text-gray-500">Rooms & Lodging</div>
            <div className="text-xs font-bold text-gray-900">{formatCurrency(summaryStats.hotelRevenue)}</div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-2.5 flex items-center gap-2.5 shadow-2xs">
          <div className="p-2 rounded-md bg-amber-50 text-amber-600">
            <UtensilsCrossed className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-semibold text-gray-500">Restaurant (F&B)</div>
            <div className="text-xs font-bold text-gray-900">{formatCurrency(summaryStats.restaurantRevenue)}</div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-2.5 flex items-center gap-2.5 shadow-2xs">
          <div className="p-2 rounded-md bg-purple-50 text-purple-600">
            <Wine className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-semibold text-gray-500">Bar / Minibar</div>
            <div className="text-xs font-bold text-gray-900">{formatCurrency(summaryStats.barRevenue)}</div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-2.5 flex items-center gap-2.5 shadow-2xs">
          <div className="p-2 rounded-md bg-teal-50 text-teal-600">
            <CreditCard className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-semibold text-gray-500">Laundry & Services</div>
            <div className="text-xs font-bold text-gray-900">{formatCurrency(summaryStats.otherRevenue)}</div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-2.5 flex items-center gap-2.5 shadow-2xs col-span-2 sm:col-span-1">
          <div className="p-2 rounded-md bg-rose-50 text-rose-600">
            <Percent className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-semibold text-gray-500">GST Collected</div>
            <div className="text-xs font-bold text-gray-900">{formatCurrency(summaryStats.taxCollection)}</div>
          </div>
        </div>
      </div>

      {/* -------------------- CONTROL BAR (DATE & FILTERS) -------------------- */}
      <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Date Pickers */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-200">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-[11px] text-gray-500 font-semibold uppercase">From:</span>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-7 text-xs border-0 bg-transparent p-0 focus-visible:ring-0 w-28 font-medium text-gray-800"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-200">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-[11px] text-gray-500 font-semibold uppercase">To:</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-7 text-xs border-0 bg-transparent p-0 focus-visible:ring-0 w-28 font-medium text-gray-800"
            />
          </div>

          {/* Quick Filter: Collection Channel */}
          <Select value={collectionTypeFilter} onValueChange={setCollectionTypeFilter}>
            <SelectTrigger className="h-9 text-xs w-36 bg-gray-50 border-gray-200">
              <SelectValue placeholder="All Channels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Channels</SelectItem>
              <SelectItem value="online">Online / UPI / POS</SelectItem>
              <SelectItem value="offline">Cash Drawer</SelectItem>
              <SelectItem value="btc">BTC (Corporate)</SelectItem>
            </SelectContent>
          </Select>

          {/* Quick Filter: Department Service */}
          <Select value={serviceTypeFilter} onValueChange={setServiceTypeFilter}>
            <SelectTrigger className="h-9 text-xs w-36 bg-gray-50 border-gray-200">
              <SelectValue placeholder="All Services" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Services</SelectItem>
              <SelectItem value="hotel">Rooms Only</SelectItem>
              <SelectItem value="restaurant">Restaurant F&B</SelectItem>
              <SelectItem value="bar">Bar / Minibar</SelectItem>
              <SelectItem value="other">Other Services</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="h-9 px-2.5 text-xs text-gray-600 border-gray-200 hover:bg-gray-100"
            title="Reset Filters"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Right Search & Export */}
        <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end">
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search booking, guest..."
              className="pl-8 h-9 text-xs bg-gray-50/50 border-gray-200"
            />
          </div>

          <Button
            onClick={handleExportExcel}
            size="sm"
            className="h-9 px-3 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* -------------------- REVENUE AUDIT TABLE -------------------- */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/80 sticky top-0 z-10 border-b border-gray-200">
              <tr>
                <th className="text-[11px] font-bold text-gray-700 uppercase tracking-wider px-3.5 py-2.5">
                  Date
                </th>
                <th className="text-[11px] font-bold text-gray-700 uppercase tracking-wider px-3.5 py-2.5">
                  Booking ID
                </th>
                <th className="text-[11px] font-bold text-gray-700 uppercase tracking-wider px-3.5 py-2.5">
                  Guest Name
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
                  Hotel
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
              {tableData.length === 0 ? (
                <tr>
                  <td colSpan={11} className="h-32 text-center text-gray-400">
                    <TrendingUp className="w-6 h-6 text-gray-300 mx-auto mb-1.5" />
                    No revenue transactions found matching filters.
                  </td>
                </tr>
              ) : (
                tableData.map((item, index) => (
                  <tr
                    key={`${item.bookingId}-${item.transactionType}-${index}`}
                    className={`hover:bg-blue-50/20 transition-colors ${
                      item.transactionType === "Advance" ? "bg-teal-50/20" : ""
                    }`}
                  >
                    <td className="px-3.5 py-2.5 text-gray-600 whitespace-nowrap">
                      {formatDate(item.date || item.checkoutDate)}
                    </td>
                    <td className="px-3.5 py-2.5 font-mono text-gray-900 font-semibold whitespace-nowrap">
                      {item.bookingId || "N/A"}
                    </td>
                    <td className="px-3.5 py-2.5 font-medium text-gray-900 max-w-[180px] truncate">
                      {item.guestName || "N/A"}
                    </td>
                    <td className="px-3.5 py-2.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                          item.transactionType === "Advance"
                            ? "bg-teal-50 text-teal-700 border border-teal-200"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}
                      >
                        {item.transactionType || "Checkout"}
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                          item.collectionType === "online"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : item.collectionType === "btc"
                            ? "bg-purple-50 text-purple-700 border border-purple-200"
                            : item.collectionType === "multi"
                            ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {item.collectionType === "btc"
                          ? "BTC"
                          : item.collectionType === "multi"
                          ? "Split / Multi"
                          : item.collectionType.charAt(0).toUpperCase() +
                            item.collectionType.slice(1)}
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5 text-gray-700 whitespace-nowrap">
                      {item.splits && item.splits.length > 0 ? (
                        <div className="flex flex-wrap gap-1 items-center">
                          {item.splits.map((s, sIdx) => (
                            <span
                              key={sIdx}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-100 text-gray-800 text-[10px] font-medium border border-gray-200"
                            >
                              <span className="font-semibold">{s.mode || s.paymentMode}:</span>
                              <span>₹{parseFloat(s.amount || 0).toLocaleString("en-IN")}</span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        item.paymentMode
                      )}
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
                    <td className="px-3.5 py-2.5 text-right font-bold text-gray-900 whitespace-nowrap">
                      {formatCurrency(item.totalAmount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {tableData.length > 0 && (
              <tfoot className="bg-gray-50 border-t-2 border-gray-200 text-xs font-bold text-gray-900">
                <tr>
                  <td colSpan={6} className="px-3.5 py-2.5 text-right text-gray-500 uppercase tracking-wider">
                    Total Revenue:
                  </td>
                  <td className="px-3.5 py-2.5 text-right">
                    {formatCurrency(tableTotals.hotelRevenue)}
                  </td>
                  <td className="px-3.5 py-2.5 text-right">
                    {formatCurrency(tableTotals.restaurantRevenue)}
                  </td>
                  <td className="px-3.5 py-2.5 text-right">
                    {formatCurrency(tableTotals.barRevenue)}
                  </td>
                  <td className="px-3.5 py-2.5 text-right">
                    {formatCurrency(tableTotals.otherRevenue)}
                  </td>
                  <td className="px-3.5 py-2.5 text-right text-blue-700 font-extrabold">
                    {formatCurrency(tableTotals.totalCollection)}
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

export default RevenuePosting;
