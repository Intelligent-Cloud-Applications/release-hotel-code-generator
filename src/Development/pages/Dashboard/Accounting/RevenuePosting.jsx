import React, { useState, useMemo } from "react";
import { useAppContext } from "../../../context/AppContext.jsx";
import { Button } from "../../../components/ui/button.js";
import { Input } from "../../../components/ui/input.js";
import { Label } from "../../../components/ui/label.js";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card.js";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select.js";
import { Badge } from "../../../components/ui/badge.js";
import { Separator } from "../../../components/ui/separator.js";
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
  IndianRupee,
} from "lucide-react";

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

  // Format date
  const formatDate = (dateValue) => {
    if (!dateValue) return "N/A";
    let date;
    if (typeof dateValue === "string") {
      date = new Date(dateValue);
    } else {
      date = new Date(dateValue);
    }
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
  // Cash = Offline, BTC = Bill to Company, Everything else = Online
  const getCollectionType = (paymentMode) => {
    if (!paymentMode) return "offline";
    const mode = paymentMode.toLowerCase().trim();

    // BTC - Bill to Company
    if (
      mode.includes("btc") ||
      mode.includes("bill to company") ||
      mode.includes("company")
    ) {
      return "btc";
    }

    // Cash is offline
    if (mode === "cash") {
      return "offline";
    }

    // Everything else (UPI, Card, Net Banking, etc.) is online
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

    // Get services from bookingDetails.services (room-wise, date-wise)
    const services = bookingDetails?.services || {};
    console.log("▶️", services);
    

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

    // Also check detailedServices for food orders
    // const detailedServices = bookingDetails?.detailedServices || {};
    // Object.keys(detailedServices).forEach((roomNumber) => {
    //   const roomDetailedServices = detailedServices[roomNumber] || {};
    //   Object.keys(roomDetailedServices).forEach((date) => {
    //     const dailyOrders = roomDetailedServices[date] || [];
    //     if (Array.isArray(dailyOrders)) {
    //       dailyOrders.forEach((order) => {
    //         foodCharges += order.food_charges || 0;
    //         laundryCharges += order.laundry_charges || 0;
    //         minibarCharges += order.minibar_charges || 0;
    //         extraBedCharges += order.extra_bed_charges || 0;
    //         manualCharges += order.manual_charges || 0;
    //       });
    //     }
    //   });
    // });

    return {
      roomCharges,
      foodCharges,
      laundryCharges,
      minibarCharges,
      extraBedCharges,
      manualCharges,
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

      // Calculate service-wise amounts from the services data
      const servicesCalculated = calculateServicesFromData(bookingDetails);
      console.log(servicesCalculated);
      

      // Hotel/Room charges - prefer billingSummary, fallback to calculated
      const hotelAmount =
        (billingSummary?.totalRoomServices ||
          billingSummary?.roomChargesTotal ||
          billingSummary?.totalRoomCharges ||
          servicesCalculated.roomCharges ||
          0) - (billingSummary?.partialPayment || 0);

      // Food/Restaurant charges
      const restaurantAmount = servicesCalculated.foodCharges || 0;

      // Bar charges (minibar)
      const barAmount = servicesCalculated.minibarCharges || 0;

      // Other services (laundry, extra bed, manual charges)
      const otherServicesAmount =
        servicesCalculated.laundryCharges +
        servicesCalculated.extraBedCharges +
        servicesCalculated.manualCharges;

      // Total amount - use finalSummary.totalAmount or billingSummary.balanceDue
      const totalAmount =
        (finalSummary?.totalAmount ||
          billingSummary?.balanceDue ||
          billingSummary?.grandTotal ||
          billingSummary?.totalAmount ||
          0) - (billingSummary?.partialPayment || 0);

      return {
        bookingId: bookingDetails?.bookingId || bill?.bill_id,
        guestName: guestDetails?.guestName,
        checkoutDate: bookingDetails?.checkOut,
        paymentMode: bill?.payment_mode || "N/A",
        collectionType: getCollectionType(bill?.payment_mode),
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
      // Date filter
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

      // Collection type filter
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
      // Check if booking has partial payment (advance)
      const partialPayment =
        booking?.partial_payment_amount ||
        booking?.advance_payment ||
        booking?.partialPayment ||
        0;

      if (partialPayment > 0) {
        // Check if booking date falls within the selected range
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
            const advancePaymentMode =
              booking?.advance_payment_mode || booking?.payment_mode || "Cash";
            const collectionType = getCollectionType(advancePaymentMode);

            totalAdvance += partialPayment;

            // Track by collection type
            if (collectionType === "online") {
              onlineAdvance += partialPayment;
            } else if (collectionType === "btc") {
              btcAdvance += partialPayment;
            } else {
              offlineAdvance += partialPayment;
            }

            // Extract guest name from various possible paths
            const guestName =
              guests.find((guest) => guest.guest_id === booking?.guest_id)
                ?.full_name || "N/A";

            advancePayments.push({
              bookingId: booking?.booking_id || booking?.bookingId,
              guestName: guestName,
              amount: partialPayment,
              date: bookingDate,
              paymentMode: advancePaymentMode,
              collectionType: collectionType,
              transactionType: "Advance",
              hotelAmount: 0,
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
  }, [bookings, startDate, endDate]);

  // Calculate summary statistics (including advance payments in collection types)
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


    // Add checkout transactions
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

    // Add advance payments to collection type totals
    stats.totalCollection += advancePaymentStats.totalAdvance;
    stats.onlineCollection += advancePaymentStats.onlineAdvance;
    stats.offlineCollection += advancePaymentStats.offlineAdvance;
    stats.btcCollection += advancePaymentStats.btcAdvance;

    return stats;
  }, [filteredRevenueData, advancePaymentStats]);

  // Combine checkout transactions and advance payments for table
  const combinedTransactions = useMemo(() => {
    // Add transactionType to checkout transactions
    const checkoutTransactions = filteredRevenueData.map((item) => ({
      ...item,
      transactionType: "Checkout",
      date: item.checkoutDate,
    }));

    // Combine with advance payments
    return [...checkoutTransactions, ...advancePaymentStats.advancePayments];
  }, [filteredRevenueData, advancePaymentStats.advancePayments]);

  // Get data filtered by service type for the table
  const tableData = useMemo(() => {
    if (serviceTypeFilter === "all") return combinedTransactions;

    return combinedTransactions.filter((item) => {
      // Advance payments don't have service breakdown, show them only when "all" is selected
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
  }, [combinedTransactions, serviceTypeFilter]);

  // Calculate table totals (for filtered data)
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

  // Clear all filters
  const clearFilters = () => {
    const today = new Date().toISOString().split("T")[0];
    setStartDate(today);
    setEndDate(today);
    setCollectionTypeFilter("all");
    setServiceTypeFilter("all");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Revenue Posting
        </h1>
        <p className="text-gray-600">
          View payment summaries and collections by date range and categories
        </p>
      </div>

      {/* Date & Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Date Selection & Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Start Date */}
            <div>
              <Label className="text-sm font-medium text-gray-700">
                Start Date
              </Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            {/* End Date */}
            <div>
              <Label className="text-sm font-medium text-gray-700">
                End Date
              </Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            {/* Collection Type Filter */}
            <div>
              <Label className="text-sm font-medium text-gray-700">
                Collection Type
              </Label>
              <Select
                value={collectionTypeFilter}
                onValueChange={setCollectionTypeFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Collections" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Collections</SelectItem>
                  <SelectItem value="online">Online Collection</SelectItem>
                  <SelectItem value="offline">Offline Collection</SelectItem>
                  <SelectItem value="btc">BTC (Bill to Company)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Service Type Filter */}
            <div>
              <Label className="text-sm font-medium text-gray-700">
                Service Type
              </Label>
              <Select
                value={serviceTypeFilter}
                onValueChange={setServiceTypeFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Services" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Services</SelectItem>
                  <SelectItem value="hotel">Hotel</SelectItem>
                  <SelectItem value="restaurant">Restaurant</SelectItem>
                  <SelectItem value="bar">Bar</SelectItem>
                  <SelectItem value="other">Other Services</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={clearFilters}
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Collection Type Summary Cards */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Collection Summary
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Total Collection */}
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center">
                <TrendingUp className="h-10 w-10 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Total Collection
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(summaryStats.totalCollection)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {summaryStats.totalTransactions} transactions
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Online Collection */}
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center">
                <Wifi className="h-10 w-10 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Online Collection
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(summaryStats.onlineCollection)}
                  </p>
                  <p className="text-xs text-gray-500">
                    UPI, Card, Net Banking
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Offline Collection */}
          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="p-4">
              <div className="flex items-center">
                <Banknote className="h-10 w-10 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Offline Collection
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(summaryStats.offlineCollection)}
                  </p>
                  <p className="text-xs text-gray-500">Cash</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* BTC Collection */}
          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-4">
              <div className="flex items-center">
                <Building2 className="h-10 w-10 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    BTC Collection
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(summaryStats.btcCollection)}
                  </p>
                  <p className="text-xs text-gray-500">Bill to Company</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Advance Payments */}
          <Card className="border-l-4 border-l-teal-500">
            <CardContent className="p-4">
              <div className="flex items-center">
                <IndianRupee className="h-10 w-10 text-teal-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Advance Payments
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(advancePaymentStats.totalAdvance)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {advancePaymentStats.advanceCount} bookings
                    {advancePaymentStats.offlineAdvance > 0 &&
                      ` | Cash: ${formatCurrency(
                        advancePaymentStats.offlineAdvance
                      )}`}
                    {advancePaymentStats.onlineAdvance > 0 &&
                      ` | Online: ${formatCurrency(
                        advancePaymentStats.onlineAdvance
                      )}`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Service-wise Revenue Cards */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Service-wise Revenue
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Hotel Revenue */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Hotel className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Hotel</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatCurrency(summaryStats.hotelRevenue)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Restaurant Revenue */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <UtensilsCrossed className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Restaurant
                  </p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatCurrency(summaryStats.restaurantRevenue)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bar Revenue */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Wine className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Bar / Minibar
                  </p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatCurrency(summaryStats.barRevenue)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Other Services Revenue */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <CreditCard className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Other Services
                  </p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatCurrency(summaryStats.otherRevenue)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tax Collection */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-3 bg-red-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Tax (GST)</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatCurrency(summaryStats.taxCollection)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Detailed Transactions Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Transaction Details
            </CardTitle>
            <Badge variant="secondary">{tableData.length} Records</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            {tableData.length === 0 ? (
              <div className="p-8 text-center">
                <TrendingUp className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-800 mb-2">
                  No Transactions Found
                </h3>
                <p className="text-gray-600">
                  Try adjusting your date range or filters
                </p>
              </div>
            ) : (
              <table className="min-w-full text-xs md:text-sm border border-gray-200 bg-white rounded-lg">
                <thead className="bg-blue-50">
                  <tr>
                    <th className="px-3 py-3 font-semibold text-left text-gray-700">
                      Date
                    </th>
                    <th className="px-3 py-3 font-semibold text-left text-gray-700">
                      Booking ID
                    </th>
                    <th className="px-3 py-3 font-semibold text-left text-gray-700">
                      Guest Name
                    </th>
                    <th className="px-3 py-3 font-semibold text-left text-gray-700">
                      Transaction Type
                    </th>
                    <th className="px-3 py-3 font-semibold text-left text-gray-700">
                      Collection Type
                    </th>
                    <th className="px-3 py-3 font-semibold text-left text-gray-700">
                      Payment Mode
                    </th>
                    <th className="px-3 py-3 font-semibold text-right text-gray-700">
                      Hotel
                    </th>
                    <th className="px-3 py-3 font-semibold text-right text-gray-700">
                      Restaurant
                    </th>
                    <th className="px-3 py-3 font-semibold text-right text-gray-700">
                      Bar
                    </th>
                    <th className="px-3 py-3 font-semibold text-right text-gray-700">
                      Other
                    </th>
                    <th className="px-3 py-3 font-semibold text-right text-gray-700">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((item, index) => (
                    <tr
                      key={`${item.bookingId}-${item.transactionType}-${index}`}
                      className={`border-t border-gray-100 hover:bg-gray-50 ${
                        item.transactionType === "Advance"
                          ? "bg-teal-50/50"
                          : ""
                      }`}
                    >
                      <td className="px-3 py-3 whitespace-nowrap">
                        {formatDate(item.date || item.checkoutDate)}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-xs font-mono">
                        {item.bookingId || "N/A"}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap max-w-[10rem] truncate">
                        {item.guestName || "N/A"}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className={
                            item.transactionType === "Advance"
                              ? "bg-teal-100 text-teal-800 border-teal-200"
                              : "bg-blue-100 text-blue-800 border-blue-200"
                          }
                        >
                          {item.transactionType || "Checkout"}
                        </Badge>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className={
                            item.collectionType === "online"
                              ? "bg-green-100 text-green-800 border-green-200"
                              : item.collectionType === "btc"
                              ? "bg-purple-100 text-purple-800 border-purple-200"
                              : "bg-yellow-100 text-yellow-800 border-yellow-200"
                          }
                        >
                          {item.collectionType === "btc"
                            ? "BTC"
                            : item.collectionType.charAt(0).toUpperCase() +
                              item.collectionType.slice(1)}
                        </Badge>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <Badge variant="outline" className="text-gray-700">
                          {item.paymentMode}
                        </Badge>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-right">
                        {item.hotelAmount > 0
                          ? formatCurrency(item.hotelAmount)
                          : "-"}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-right">
                        {item.restaurantAmount > 0
                          ? formatCurrency(item.restaurantAmount)
                          : "-"}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-right">
                        {item.barAmount > 0
                          ? formatCurrency(item.barAmount)
                          : "-"}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-right">
                        {item.otherServicesAmount > 0
                          ? formatCurrency(item.otherServicesAmount)
                          : "-"}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-right font-semibold">
                        {formatCurrency(item.totalAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-100 font-semibold">
                  <tr>
                    <td colSpan="6" className="px-3 py-3 text-right">
                      Totals:
                    </td>
                    <td className="px-3 py-3 text-right">
                      {formatCurrency(tableTotals.hotelRevenue)}
                    </td>
                    <td className="px-3 py-3 text-right">
                      {formatCurrency(tableTotals.restaurantRevenue)}
                    </td>
                    <td className="px-3 py-3 text-right">
                      {formatCurrency(tableTotals.barRevenue)}
                    </td>
                    <td className="px-3 py-3 text-right">
                      {formatCurrency(tableTotals.otherRevenue)}
                    </td>
                    <td className="px-3 py-3 text-right text-blue-700">
                      {formatCurrency(tableTotals.totalCollection)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RevenuePosting;
