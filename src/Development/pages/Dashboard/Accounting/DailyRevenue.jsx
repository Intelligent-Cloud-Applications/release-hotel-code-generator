import React, { useState, useMemo, useRef } from "react";
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
  Printer,
  ChevronLeft,
  ChevronRight,
  IndianRupee,
  FileText,
} from "lucide-react";

const DailyRevenue = () => {
  const { bills, bookings, rooms, guests } = useAppContext();
  const printRef = useRef(null);

  // Single date for daily report
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });

  // Format date for display
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
      // Check if booking has partial payment (advance)
      const partialPayment =
        booking?.partial_payment_amount ||
        booking?.advance_payment ||
        booking?.partialPayment ||
        0;

      if (partialPayment > 0) {
        // Check if booking date (when advance was paid) falls on the selected date
        const bookingDate =
          booking?.booking_date ||
          booking?.created_at ||
          booking?.check_in ||
          booking?.checkIn ||
          booking?.checkin_date;

        if (bookingDate) {
          const bookingDateObj = new Date(bookingDate);
          bookingDateObj.setHours(0, 0, 0, 0);

          // Only include if advance was paid on the selected date
          if (
            bookingDateObj >= selectedDateObj &&
            bookingDateObj < nextDayObj
          ) {
            const advancePaymentMode =
              booking?.advance_payment_mode || booking?.payment_mode || "Cash";
            const collectionType = getCollectionType(advancePaymentMode);

            // Get guest details
            const guestId = booking?.guest_id || booking?.guestId;
            const guest = guests?.find((g) => g?.guest_id === guestId);
            const guestName =
              guest?.full_name ||
              guest?.name ||
              booking?.guest_name ||
              booking?.guestName ||
              "N/A";

            // Get room number - handle both array and single value
            let roomNumber = "N/A";
            if (booking?.room_id) {
              if (Array.isArray(booking.room_id)) {
                roomNumber = booking.room_id
                  .map((rid) => {
                    return (
                      rooms.find((room) => room.room_id === rid)?.room_number ||
                      "N/A"
                    );
                  })
                  .join(", ");
              } else {
                const room = rooms.find((r) => r.room_id === booking.room_id);
                roomNumber = room?.room_number || booking.room_id;
              }
            } else if (booking?.room_number || booking?.roomNumber) {
              roomNumber = booking.room_number || booking.roomNumber;
            }

            advancePayments.push({
              bookingId: booking?.booking_id || booking?.bookingId,
              guestName,
              roomNumber,
              transactionType: "Advance",
              paymentMode: advancePaymentMode,
              collectionType,
              totalAmount: partialPayment,
              hotelAmount: 0,
              restaurantAmount: 0,
              barAmount: 0,
              otherServicesAmount: 0,
              taxAmount: 0,
            });
          }
        }
      }
    });

    return advancePayments;
  }, [bookings, selectedDate, guests, rooms]);

  // Combine all transactions
  const allTransactions = useMemo(() => {
    return [...dailyCheckoutData, ...dailyAdvanceData];
  }, [dailyCheckoutData, dailyAdvanceData]);

  // Calculate daily summary
  const dailySummary = useMemo(() => {
    const summary = {
      totalCollection: 0,
      onlineCollection: 0,
      offlineCollection: 0,
      btcCollection: 0,
      hotelRevenue: 0,
      restaurantRevenue: 0,
      barRevenue: 0,
      otherRevenue: 0,
      taxCollection: 0,
      advanceCollection: 0,
      checkoutCollection: 0,
      totalCheckouts: dailyCheckoutData.length,
      totalAdvances: dailyAdvanceData.length,
    };

    // Process checkout transactions
    dailyCheckoutData.forEach((item) => {
      summary.checkoutCollection += item.totalAmount;
      summary.hotelRevenue += item.hotelAmount;
      summary.restaurantRevenue += item.restaurantAmount;
      summary.barRevenue += item.barAmount;
      summary.otherRevenue += item.otherServicesAmount;
      summary.taxCollection += item.taxAmount || 0;

      if (item.collectionType === "online") {
        summary.onlineCollection += item.totalAmount;
      } else if (item.collectionType === "btc") {
        summary.btcCollection += item.totalAmount;
      } else {
        summary.offlineCollection += item.totalAmount;
      }
    });

    // Process advance payments
    dailyAdvanceData.forEach((item) => {
      summary.advanceCollection += item.totalAmount;

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

  // Print function
  const handlePrint = () => {
    const printContent = printRef.current;
    const printWindow = window.open("");
    printWindow.document.write(`
      <html>
        <head>
          <title>Daily Revenue Report - ${formatDateLong(selectedDate)}</title>
          <style>
            * { box-sizing: border-box; }
            body { font-family: Arial, sans-serif; padding: 20px; margin: 0; }
            
            .print-header { text-align: center; margin-bottom: 25px; border-bottom: 2px solid #333; padding-bottom: 15px; }
            .print-header h1 { margin: 0 0 5px 0; font-size: 24px; }
            .print-header p { margin: 0; font-size: 14px; color: #666; }
            
            .section-title { font-size: 14px; font-weight: bold; margin: 20px 0 10px 0; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
            
            .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
            .summary-card { border: 1px solid #ddd; padding: 12px; border-radius: 6px; background: #fafafa; }
            .summary-card .label { font-size: 11px; color: #666; margin-bottom: 4px; }
            .summary-card .value { font-size: 16px; font-weight: bold; color: #333; }
            .summary-card .sub { font-size: 10px; color: #888; }
            
            .breakdown-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 20px; }
            .service-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-bottom: 20px; }
            
            table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 11px; }
            th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
            th { background-color: #f0f0f0; font-weight: bold; }
            .text-right { text-align: right; }
            tfoot { background-color: #f5f5f5; font-weight: bold; }
            
            .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #666; border-top: 1px solid #ddd; padding-top: 10px; }
            
            @media print { 
              body { padding: 10px; font-size: 11px; }
              .summary-grid { grid-template-columns: repeat(4, 1fr); }
              .service-grid { grid-template-columns: repeat(5, 1fr); }
              table { font-size: 10px; }
              th, td { padding: 4px 6px; }
            }
          </style>
        </head>
        <body>
          <div class="print-header">
            <h1>Daily Revenue Report</h1>
            <p>${formatDateLong(selectedDate)}</p>
          </div>
          
          <div class="section-title">Collection Summary</div>
          <div class="summary-grid">
            <div class="summary-card">
              <div class="label">Total Collection</div>
              <div class="value">${formatCurrency(
                dailySummary.totalCollection
              )}</div>
              <div class="sub">${
                dailySummary.totalCheckouts + dailySummary.totalAdvances
              } transactions</div>
            </div>
            <div class="summary-card">
              <div class="label">Online Collection</div>
              <div class="value">${formatCurrency(
                dailySummary.onlineCollection
              )}</div>
              <div class="sub">UPI, Card, Net Banking</div>
            </div>
            <div class="summary-card">
              <div class="label">Cash Collection</div>
              <div class="value">${formatCurrency(
                dailySummary.offlineCollection
              )}</div>
              <div class="sub">Cash Payments</div>
            </div>
            <div class="summary-card">
              <div class="label">BTC Collection</div>
              <div class="value">${formatCurrency(
                dailySummary.btcCollection
              )}</div>
              <div class="sub">Bill to Company</div>
            </div>
          </div>
          
          <div class="section-title">Transaction Breakdown</div>
          <div class="breakdown-grid">
            <div class="summary-card">
              <div class="label">Checkout Collections</div>
              <div class="value">${formatCurrency(
                dailySummary.checkoutCollection
              )}</div>
              <div class="sub">${dailySummary.totalCheckouts} checkouts</div>
            </div>
            <div class="summary-card">
              <div class="label">Advance Collections</div>
              <div class="value">${formatCurrency(
                dailySummary.advanceCollection
              )}</div>
              <div class="sub">${dailySummary.totalAdvances} advances</div>
            </div>
          </div>
          
          <div class="section-title">Service-wise Revenue</div>
          <div class="service-grid">
            <div class="summary-card">
              <div class="label">Hotel</div>
              <div class="value">${formatCurrency(
                dailySummary.hotelRevenue
              )}</div>
            </div>
            <div class="summary-card">
              <div class="label">Restaurant</div>
              <div class="value">${formatCurrency(
                dailySummary.restaurantRevenue
              )}</div>
            </div>
            <div class="summary-card">
              <div class="label">Bar / Minibar</div>
              <div class="value">${formatCurrency(
                dailySummary.barRevenue
              )}</div>
            </div>
            <div class="summary-card">
              <div class="label">Other Services</div>
              <div class="value">${formatCurrency(
                dailySummary.otherRevenue
              )}</div>
            </div>
            <div class="summary-card">
              <div class="label">Tax (GST)</div>
              <div class="value">${formatCurrency(
                dailySummary.taxCollection
              )}</div>
            </div>
          </div>
          
          <div class="section-title">Transaction Details (${
            allTransactions.length
          } Records)</div>
          <table>
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Guest Name</th>
                <th>Room</th>
                <th>Type</th>
                <th>Collection</th>
                <th>Payment Mode</th>
                <th class="text-right">Hotel</th>
                <th class="text-right">Restaurant</th>
                <th class="text-right">Bar</th>
                <th class="text-right">Other</th>
                <th class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${allTransactions
                .map(
                  (item) => `
                <tr>
                  <td>${item.bookingId || "N/A"}</td>
                  <td>${item.guestName || "N/A"}</td>
                  <td>${item.roomNumber || "N/A"}</td>
                  <td>${item.transactionType}</td>
                  <td>${
                    item.collectionType === "btc"
                      ? "BTC"
                      : item.collectionType.charAt(0).toUpperCase() +
                        item.collectionType.slice(1)
                  }</td>
                  <td>${item.paymentMode}</td>
                  <td class="text-right">${
                    item.hotelAmount > 0
                      ? formatCurrency(item.hotelAmount)
                      : "-"
                  }</td>
                  <td class="text-right">${
                    item.restaurantAmount > 0
                      ? formatCurrency(item.restaurantAmount)
                      : "-"
                  }</td>
                  <td class="text-right">${
                    item.barAmount > 0 ? formatCurrency(item.barAmount) : "-"
                  }</td>
                  <td class="text-right">${
                    item.otherServicesAmount > 0
                      ? formatCurrency(item.otherServicesAmount)
                      : "-"
                  }</td>
                  <td class="text-right"><strong>${formatCurrency(
                    item.totalAmount
                  )}</strong></td>
                </tr>
              `
                )
                .join("")}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="6" class="text-right">Daily Totals:</td>
                <td class="text-right">${formatCurrency(
                  dailySummary.hotelRevenue
                )}</td>
                <td class="text-right">${formatCurrency(
                  dailySummary.restaurantRevenue
                )}</td>
                <td class="text-right">${formatCurrency(
                  dailySummary.barRevenue
                )}</td>
                <td class="text-right">${formatCurrency(
                  dailySummary.otherRevenue
                )}</td>
                <td class="text-right">${formatCurrency(
                  dailySummary.totalCollection
                )}</td>
              </tr>
            </tfoot>
          </table>
          
          <div class="footer">
            <p>Generated on ${new Date().toLocaleString("en-IN")}</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-12">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Daily Revenue Report
          </h1>
          <p className="text-gray-600">
            View daily collection summary and transaction details
          </p>
        </div>
        <Button onClick={handlePrint} className="flex items-center gap-2">
          <Printer className="h-4 w-4" />
          Print Report
        </Button>
      </div>

      {/* Date Navigation */}
      <Card className="mb-6 print:hidden">
        <CardContent className="p-4">
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateDay(-1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-gray-500" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-auto"
              />
              <span className="text-lg font-medium text-gray-700">
                {formatDateLong(selectedDate)}
              </span>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateDay(1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                setSelectedDate(new Date().toISOString().split("T")[0])
              }
            >
              Today
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Printable Content */}
      <div ref={printRef}>
        {/* Report Header for Print */}
        <div className="hidden print:block text-center mb-6">
          <h1 className="text-2xl font-bold">Daily Revenue Report</h1>
          <p className="text-lg">{formatDateLong(selectedDate)}</p>
        </div>

        {/* Collection Summary Cards */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Collection Summary
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                      {formatCurrency(dailySummary.totalCollection)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {dailySummary.totalCheckouts + dailySummary.totalAdvances}{" "}
                      transactions
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
                      {formatCurrency(dailySummary.onlineCollection)}
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
                      Cash Collection
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(dailySummary.offlineCollection)}
                    </p>
                    <p className="text-xs text-gray-500">Cash Payments</p>
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
                      {formatCurrency(dailySummary.btcCollection)}
                    </p>
                    <p className="text-xs text-gray-500">Bill to Company</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Transaction Type Breakdown */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Transaction Breakdown
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Checkout Collection */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">
                        Checkout Collections
                      </p>
                      <p className="text-xl font-bold text-gray-900">
                        {formatCurrency(dailySummary.checkoutCollection)}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-lg">
                    {dailySummary.totalCheckouts}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Advance Collection */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="p-3 bg-teal-100 rounded-lg">
                      <IndianRupee className="h-6 w-6 text-teal-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">
                        Advance Collections
                      </p>
                      <p className="text-xl font-bold text-gray-900">
                        {formatCurrency(dailySummary.advanceCollection)}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-lg">
                    {dailySummary.totalAdvances}
                  </Badge>
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
                      {formatCurrency(dailySummary.hotelRevenue)}
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
                      {formatCurrency(dailySummary.restaurantRevenue)}
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
                      {formatCurrency(dailySummary.barRevenue)}
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
                      {formatCurrency(dailySummary.otherRevenue)}
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
                    <p className="text-sm font-medium text-gray-600">
                      Tax (GST)
                    </p>
                    <p className="text-xl font-bold text-gray-900">
                      {formatCurrency(dailySummary.taxCollection)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Transaction Details
              </CardTitle>
              <Badge variant="secondary">
                {allTransactions.length} Records
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              {allTransactions.length === 0 ? (
                <div className="p-8 text-center">
                  <TrendingUp className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-800 mb-2">
                    No Transactions Found
                  </h3>
                  <p className="text-gray-600">
                    No transactions recorded for {formatDateLong(selectedDate)}
                  </p>
                </div>
              ) : (
                <table className="min-w-full text-xs md:text-sm border border-gray-200 bg-white rounded-lg">
                  <thead className="bg-blue-50">
                    <tr>
                      <th className="px-3 py-3 font-semibold text-left text-gray-700">
                        Booking ID
                      </th>
                      <th className="px-3 py-3 font-semibold text-left text-gray-700">
                        Guest Name
                      </th>
                      <th className="px-3 py-3 font-semibold text-left text-gray-700">
                        Room
                      </th>
                      <th className="px-3 py-3 font-semibold text-left text-gray-700">
                        Type
                      </th>
                      <th className="px-3 py-3 font-semibold text-left text-gray-700">
                        Collection
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
                    {allTransactions.map((item, index) => (
                      <tr
                        key={`${item.bookingId}-${item.transactionType}-${index}`}
                        className={`border-t border-gray-100 hover:bg-gray-50 ${
                          item.transactionType === "Advance"
                            ? "bg-teal-50/50"
                            : ""
                        }`}
                      >
                        <td className="px-3 py-3 whitespace-nowrap text-xs font-mono">
                          {item.bookingId || "N/A"}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap max-w-[10rem] truncate">
                          {item.guestName || "N/A"}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          {item.roomNumber || "N/A"}
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
                            {item.transactionType}
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
                        Daily Totals:
                      </td>
                      <td className="px-3 py-3 text-right">
                        {formatCurrency(dailySummary.hotelRevenue)}
                      </td>
                      <td className="px-3 py-3 text-right">
                        {formatCurrency(dailySummary.restaurantRevenue)}
                      </td>
                      <td className="px-3 py-3 text-right">
                        {formatCurrency(dailySummary.barRevenue)}
                      </td>
                      <td className="px-3 py-3 text-right">
                        {formatCurrency(dailySummary.otherRevenue)}
                      </td>
                      <td className="px-3 py-3 text-right text-blue-700">
                        {formatCurrency(dailySummary.totalCollection)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DailyRevenue;
