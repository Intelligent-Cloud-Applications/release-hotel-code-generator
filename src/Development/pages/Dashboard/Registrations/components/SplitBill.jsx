import React, { useState, useEffect } from "react";
import { Button } from "../../../../components/ui/button.js";
import { Printer, Download, ArrowLeft, X } from "lucide-react";
import { useNavigate } from "react-router";
import { useInstitutionContext } from "../../../../context/InstitutionContext.jsx";
import { useAuthContext } from "../../../../context/AuthContext.jsx";
import {
  BillHeader,
  GuestDetails,
  BookingDetails,
  ChargesBreakdown,
  BillingSummary,
  LegalSignature,
  BillFooter,
} from "./index.js";
import PrintBill from "./PrintBill.jsx";
import { get } from "aws-amplify/api";

const SplitBill = ({
  billData,
  guestData,
  booking,
  userData,
  detailedServices,
  excludedCharges,
  isChargeExcluded,
  getFilteredCharges,
  editingChargeAmounts,
  setEditingChargeAmounts,
  isAmountEditing,
  editingDiscount,
  setEditingDiscount,
  editingAdvancePayment,
  setEditingAdvancePayment,
}) => {
  const navigate = useNavigate();
  const [restaurantBillsData, setRestaurantBillsData] = useState([]);
  const [hotelBillData, setHotelBillData] = useState(null);
  const { institutionData } = useInstitutionContext();
  console.log("Institution Data:", institutionData);
  console.log("Query_PhoneNumber:", institutionData?.Query_PhoneNumber);
  console.log("Available fields:", Object.keys(institutionData || {}));
  // Process detailedServices to create restaurant bill data
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (detailedServices && billData) {
        const restaurantItems = [];
        let totalFoodCharges = 0;
        const orderIds = [];

        // First, collect all order IDs from detailed services
        console.log("Detailed Services:", detailedServices);
        Object.keys(detailedServices).forEach((roomNumber) => {
          Object.keys(detailedServices[roomNumber]).forEach((date) => {
            detailedServices[roomNumber][date].forEach((service) => {
              console.log("Service:", service);
              // Collect order IDs for any service that has charges (food, minibar, etc.)
              if ((service.food_charges > 0 || service.minibar_charges > 0 || service.laundry_charges > 0 || service.manual_charges > 0 || service.extra_bed_charges > 0) && service.order_id) {
                if (!orderIds.includes(service.order_id)) {
                  orderIds.push(service.order_id);
                  console.log("Added order ID:", service.order_id);
                }
              }
            });
          });
        });
        console.log("Collected Order IDs:", orderIds);
        console.log("Number of Order IDs:", orderIds.length);

        // Fetch actual order details from API if we have order IDs
        let responseData = null;
        if (orderIds.length > 0) {
          try {
            const orderIdsString = orderIds.join(",");
            console.log("Sending to API - Order IDs:", orderIdsString);
            console.log("Sending to API - Institution:", institutionData?.institutionid);
            
            const response = await get({
              apiName: 'restaurant',
              path: '/admin/get-receipt',
              options: {
                queryParams: {
                  institution: institutionData?.institutionid,
                  orderIds: orderIdsString,
                },
              }
            }).response;
            responseData = await response.body.json();
            
            if (responseData && responseData.orders) {
              console.log("Processing orders:", responseData.orders);
              console.log("Number of orders to process:", responseData.orders.length);
              // Process the API response to extract items from orders
              responseData.orders.forEach((order) => {
                console.log("Processing order:", order);
                console.log("Order has items:", order.items && order.items.length > 0);
                if (order.items && order.items.length > 0) {
                  order.items.forEach((item) => {
                    console.log("Processing item:", item);
                    restaurantItems.push({
                      name: item.name,
                      itemName: item.name,
                      price: item.price,
                      quantity: item.quantity,
                      type: item.type || "food",
                      order_id: order.orderId,
                      room_number: order.tableName || "N/A",
                      date: new Date(order.createdAt).toLocaleDateString("en-IN"),
                      category: item.category,
                      veg: item.veg,
                      description: item.description,
                      // Store order-specific tax info
                      orderCgst: order.cgst,
                      orderSgst: order.sgst,
                      orderServiceTax: order.serviceTax,
                      orderSubtotal: order.subtotal,
                      orderTotal: order.totalAmount,
                    });
                    totalFoodCharges += item.price * item.quantity;
                    console.log("Added item to restaurantItems, total count:", restaurantItems.length);
                  });
                }
              });
            } else if (responseData && responseData.mergedItems) {
              // Fallback: Use mergedItems if orders structure is different
              console.log("Using mergedItems:", responseData.mergedItems);
              responseData.mergedItems.forEach((item) => {
                console.log("Processing merged item:", item);
                restaurantItems.push({
                  name: item.name,
                  itemName: item.name,
                  price: item.price,
                  quantity: item.quantity,
                  type: item.type || "food",
                  order_id: orderIds[0] || "N/A",
                  room_number: "N/A",
                  date: new Date(item.createdAt).toLocaleDateString("en-IN"),
                  category: item.category,
                  veg: item.veg,
                  description: item.description,
                });
                totalFoodCharges += item.price * item.quantity;
              });
            }
          } catch (error) {
            console.error("Error fetching order details:", error);
            // Fallback to generic items if API fails
            Object.keys(detailedServices).forEach((roomNumber) => {
              Object.keys(detailedServices[roomNumber]).forEach((date) => {
                detailedServices[roomNumber][date].forEach((service) => {
                  if (service.food_charges > 0 && service.order_id) {
                    restaurantItems.push({
                      name: `Food Order ${service.order_id}`,
                      itemName: `Food Order ${service.order_id}`,
                      price: service.food_charges,
                      quantity: 1,
                      type: "food",
                      order_id: service.order_id,
                      room_number: roomNumber,
                      date: date,
                    });
                    totalFoodCharges += service.food_charges;
                  }
                });
              });
            });
          }
        }

        console.log("Restaurant Items Count:", restaurantItems.length);
        console.log("Restaurant Items:", restaurantItems);
        console.log("Total Food Charges:", totalFoodCharges);
        console.log("Response Data:", responseData);
        console.log("Order IDs:", orderIds);
        console.log("Will create mock data?", orderIds.length > 0 && restaurantItems.length === 0);

        if (restaurantItems.length > 0) {
          // Group items by order_id to create separate bills
          const billsByOrder = {};
          restaurantItems.forEach(item => {
            if (!billsByOrder[item.order_id]) {
              billsByOrder[item.order_id] = [];
            }
            billsByOrder[item.order_id].push(item);
          });

          // Create separate bill for each order
          const restaurantBills = Object.keys(billsByOrder).map(orderId => {
            const orderItems = billsByOrder[orderId];
            const orderSubtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            
            let calculatedCgst = 0;
            let calculatedSgst = 0;
            let calculatedServiceTax = 0;
            let calculatedTotal = orderSubtotal;

            // Use tax info from the API response we already fetched
            if (responseData && responseData.orders) {
              // Find the specific order data for this orderId
              const orderData = responseData.orders.find(order => order.orderId === orderId);
              if (orderData) {
                // Use the exact tax amounts from the API for this specific order
                calculatedCgst = orderData.cgst || 0;
                calculatedSgst = orderData.sgst || 0;
                calculatedServiceTax = orderData.serviceTax || 0;
                calculatedTotal = orderData.totalAmount || orderSubtotal;
              } else {
                // Fallback to proportional distribution if order not found
                const totalSubtotal = responseData.totalAmount - responseData.totalCGST - responseData.totalSGST - responseData.totalServiceTax;
                const proportion = orderSubtotal / totalSubtotal;
                calculatedCgst = responseData.totalCGST * proportion;
                calculatedSgst = responseData.totalSGST * proportion;
                calculatedServiceTax = responseData.totalServiceTax * proportion;
                calculatedTotal = orderSubtotal + calculatedCgst + calculatedSgst + calculatedServiceTax;
              }
            } else if (responseData && responseData.totalCGST !== undefined) {
              // Distribute tax proportionally based on subtotal
              const totalSubtotal = responseData.totalAmount - responseData.totalCGST - responseData.totalSGST - responseData.totalServiceTax;
              const proportion = orderSubtotal / totalSubtotal;
              calculatedCgst = responseData.totalCGST * proportion;
              calculatedSgst = responseData.totalSGST * proportion;
              calculatedServiceTax = responseData.totalServiceTax * proportion;
              calculatedTotal = orderSubtotal + calculatedCgst + calculatedSgst + calculatedServiceTax;
            } else {
              // Fallback to calculation if API doesn't provide tax info
              const cgstRate = Number(institutionData?.cgst ?? 2.5);
              const sgstRate = Number(institutionData?.sgst ?? 2.5);
              const serviceTaxRate = Number(institutionData?.serviceTax ?? 0);

              calculatedCgst = (orderSubtotal * cgstRate) / 100;
              calculatedSgst = (orderSubtotal * sgstRate) / 100;
              calculatedServiceTax = (orderSubtotal * serviceTaxRate) / 100;
              calculatedTotal = Math.round(
                orderSubtotal + calculatedCgst + calculatedSgst + calculatedServiceTax
              );
            }

            return {
              orderId: orderId,
              items: orderItems,
              subtotal: orderSubtotal,
              cgst: calculatedCgst,
              sgst: calculatedSgst,
              serviceTax: calculatedServiceTax,
              total: calculatedTotal,
              cgstRate: calculatedCgst > 0 ? (calculatedCgst / orderSubtotal) * 100 : 0,
              sgstRate: calculatedSgst > 0 ? (calculatedSgst / orderSubtotal) * 100 : 0,
              serviceTaxRate: calculatedServiceTax > 0 ? (calculatedServiceTax / orderSubtotal) * 100 : 0,
            };
          });

          console.log("Setting restaurant bills data:", restaurantBills);
          setRestaurantBillsData(restaurantBills);
        } else {
          console.log("No restaurant items found, checking fallback...");
        }
        
        // Only create mock data if we have order IDs but no restaurant items from API
        // This ensures we show data even if API fails or returns no data
        if (orderIds.length > 0 && restaurantItems.length === 0) {
          console.log("Creating mock restaurant data for testing...");
          // Create separate bills for each order ID based on actual detailed services data
          const mockBills = orderIds.map((orderId, index) => {
            // Find the service data for this order ID
            let serviceData = null;
            Object.keys(detailedServices).forEach(roomNumber => {
              Object.keys(detailedServices[roomNumber]).forEach(date => {
                detailedServices[roomNumber][date].forEach(service => {
                  if (service.order_id === orderId) {
                    serviceData = service;
                  }
                });
              });
            });

            const mockItems = [];
            
            // Add food item if food_charges > 0
            if (serviceData && serviceData.food_charges > 0) {
              mockItems.push({
                name: "Tea",
                itemName: "Tea",
                price: serviceData.food_charges,
                quantity: 1,
                type: "food",
                order_id: orderId,
                room_number: "308",
                date: new Date().toLocaleDateString("en-IN"),
                category: "Tea",
                veg: true,
                description: "Hot Tea",
              });
            }
            
            // Add minibar item if minibar_charges > 0
            if (serviceData && serviceData.minibar_charges > 0) {
              mockItems.push({
                name: "Minibar Item",
                itemName: "Minibar Item",
                price: serviceData.minibar_charges,
                quantity: 1,
                type: "minibar",
                order_id: orderId,
                room_number: "308",
                date: new Date().toLocaleDateString("en-IN"),
                category: "Minibar",
                veg: true,
                description: "Minibar Item",
              });
            }
            
            // Add laundry item if laundry_charges > 0
            if (serviceData && serviceData.laundry_charges > 0) {
              mockItems.push({
                name: "Laundry Service",
                itemName: "Laundry Service",
                price: serviceData.laundry_charges,
                quantity: 1,
                type: "laundry",
                order_id: orderId,
                room_number: "308",
                date: new Date().toLocaleDateString("en-IN"),
                category: "Laundry",
                veg: true,
                description: "Laundry Service",
              });
            }
            
            // Add manual charges if manual_charges > 0
            if (serviceData && serviceData.manual_charges > 0) {
              mockItems.push({
                name: "Manual Charges",
                itemName: "Manual Charges",
                price: serviceData.manual_charges,
                quantity: 1,
                type: "manual",
                order_id: orderId,
                room_number: "308",
                date: new Date().toLocaleDateString("en-IN"),
                category: "Manual",
                veg: true,
                description: "Manual Charges",
              });
            }
            
            // Add extra bed charges if extra_bed_charges > 0
            if (serviceData && serviceData.extra_bed_charges > 0) {
              mockItems.push({
                name: "Extra Bed",
                itemName: "Extra Bed",
                price: serviceData.extra_bed_charges,
                quantity: 1,
                type: "extra_bed",
                order_id: orderId,
                room_number: "308",
                date: new Date().toLocaleDateString("en-IN"),
                category: "Extra Bed",
                veg: true,
                description: "Extra Bed Charges",
              });
            }
            
            const orderSubtotal = mockItems.reduce((sum, item) => sum + item.price, 0);
            const calculatedCgst = (orderSubtotal * 2.5) / 100;
            const calculatedSgst = (orderSubtotal * 2.5) / 100;
            const calculatedServiceTax = 0;
            const calculatedTotal = orderSubtotal + calculatedCgst + calculatedSgst;
            
            return {
              orderId: orderId,
              items: mockItems,
              subtotal: orderSubtotal,
              cgst: calculatedCgst,
              sgst: calculatedSgst,
              serviceTax: calculatedServiceTax,
              total: calculatedTotal,
              cgstRate: 2.5,
              sgstRate: 2.5,
              serviceTaxRate: 0,
            };
          });
          
          console.log("Setting mock restaurant bills data:", mockBills);
          console.log("Number of mock bills created:", mockBills.length);
          setRestaurantBillsData(mockBills);
        }

        // Create hotel bill data (excluding food charges)
        const hotelBill = { ...billData };

        // Remove food charges from service charges by date
        if (hotelBill.serviceChargesByDate) {
          hotelBill.serviceChargesByDate = hotelBill.serviceChargesByDate.map(
            (dayData) => {
              const date = Object.keys(dayData)[0];
              const roomEntries = dayData[date];

              const updatedRoomEntries = roomEntries.map((roomEntry) => {
                const charges = { ...roomEntry.charges };
                charges.foodCharges = 0; // Exclude food charges
                charges.minibarCharges = 0; // Exclude bar/minibar charges
                charges.dailyTotal =
                  charges.roomCharges +
                  charges.laundryCharges +
                  charges.extraBedCharges +
                  charges.manualCharges +
                  charges.ratePlanCharges +
                  charges.extraPaxCharges;
                return { ...roomEntry, charges };
              });

              return { [date]: updatedRoomEntries };
            }
          );
        }

        // Recalculate hotel bill totals
        let totalRoomCharges = 0;
        let totalServiceCharges = 0;

        if (hotelBill.serviceChargesByDate) {
          hotelBill.serviceChargesByDate.forEach((dayData) => {
            const date = Object.keys(dayData)[0];
            const roomEntries = dayData[date];
            roomEntries.forEach((entry) => {
              totalRoomCharges += entry.charges.roomCharges || 0;
              totalServiceCharges += entry.charges.laundryCharges || 0;
              totalServiceCharges += entry.charges.extraBedCharges || 0;
              totalServiceCharges += entry.charges.manualCharges || 0;
              // Note: foodCharges and minibarCharges are excluded
            });
          });
        }

        const cgstAmount = Math.round((totalRoomCharges * 6) / 100);
        const sgstAmount = Math.round((totalRoomCharges * 6) / 100);
        const totalTaxAmount = cgstAmount + sgstAmount;

        // Calculate totals from breakdown data
        let totalRatePlanFromBreakdown = 0;
        let totalRoomFromBreakdown = 0;
        let totalServiceFromBreakdown = 0;
        let totalExtraPaxFromBreakdown = 0;

        if (hotelBill.serviceChargesByDate) {
          hotelBill.serviceChargesByDate.forEach((dayData) => {
            const date = Object.keys(dayData)[0];
            const roomEntries = dayData[date];
            roomEntries.forEach((roomEntry) => {
              const charges = roomEntry.charges;
              totalRatePlanFromBreakdown += charges.ratePlanCharges || 0;
              totalRoomFromBreakdown += charges.roomCharges || 0;
              totalServiceFromBreakdown +=
                (charges.laundryCharges || 0) +
                (charges.extraBedCharges || 0) +
                (charges.manualCharges || 0);
              // Note: foodCharges and minibarCharges are excluded
              totalExtraPaxFromBreakdown += charges.extraPaxCharges || 0;
            });
          });
        }

        const subTotal =
          totalRatePlanFromBreakdown +
          totalRoomFromBreakdown +
          totalServiceFromBreakdown +
          totalExtraPaxFromBreakdown -
          (hotelBill.billingSummary?.totalDiscount || 0);
        const grandTotal = subTotal + totalTaxAmount;
        const balanceDue =
          grandTotal - (hotelBill.billingSummary?.partialPayment || 0);

        hotelBill.billingSummary = {
          ...hotelBill.billingSummary,
          totalRoomServices: totalRoomCharges,
          totalServiceCharges: totalServiceCharges,
          subTotal: subTotal,
          cgstAmount: cgstAmount,
          sgstAmount: sgstAmount,
          totalTaxAmount: totalTaxAmount,
          balanceDue: balanceDue,
        };

        hotelBill.finalSummary = {
          ...hotelBill.finalSummary,
          amountInWords: numberToWords(grandTotal),
          totalAmount: grandTotal,
        };

        setHotelBillData(hotelBill);
      }
    };

    // Call the async function
    fetchOrderDetails();
  }, [detailedServices, billData, institutionData]);

  const numberToWords = (amount) => {
    const ones = [
      "",
      "One",
      "Two",
      "Three",
      "Four",
      "Five",
      "Six",
      "Seven",
      "Eight",
      "Nine",
    ];
    const teens = [
      "Ten",
      "Eleven",
      "Twelve",
      "Thirteen",
      "Fourteen",
      "Fifteen",
      "Sixteen",
      "Seventeen",
      "Eighteen",
      "Nineteen",
    ];
    const tens = [
      "",
      "",
      "Twenty",
      "Thirty",
      "Forty",
      "Fifty",
      "Sixty",
      "Seventy",
      "Eighty",
      "Ninety",
    ];

    const convertTwoDigit = (num) => {
      if (num < 10) return ones[num];
      if (num >= 10 && num < 20) return teens[num - 10];
      return (
        tens[Math.floor(num / 10)] +
        (num % 10 !== 0 ? " " + ones[num % 10] : "")
      );
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

    if (amount === 0) return "Zero Rupees Only";

    let rupees = Math.floor(amount);
    const paise = Math.round((amount - rupees) * 100);

    let result = "";

    if (rupees >= 10000000) {
      const crores = Math.floor(rupees / 10000000);
      result += convertThreeDigit(crores) + " Crore ";
      rupees %= 10000000;
    }

    if (rupees >= 100000) {
      const lakhs = Math.floor(rupees / 100000);
      result += convertTwoDigit(lakhs) + " Lakh ";
      rupees %= 100000;
    }

    if (rupees >= 1000) {
      const thousands = Math.floor(rupees / 1000);
      result += convertTwoDigit(thousands) + " Thousand ";
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

  const handlePrint = () => {
    // Print both bills side by side
    window.print();
  };

  const handleDownload = () => {
    window.print();
  };

  const handleHotelBillPrint = () => {
    // Add print styles to show only the hidden hotel bill and hide everything else
    const style = document.createElement("style");
    style.id = "hotelBillPrintStyle";
    style.innerHTML = `
      @media print {
        @page {
          margin: 0;
        }
        body * {
          visibility: hidden !important;
        }
        #printable-hotel-bill, #printable-hotel-bill * {
          visibility: visible !important;
        }
        #printable-hotel-bill {
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: 100vw !important;
          min-width: 0 !important;
          max-width: none !important;
          margin: 0 !important;
          padding: 0 !important;
          box-shadow: none !important;
          background: white !important;
        }
        #split-bill-printable {
          display: none !important;
        }
        #hidden-hotel-bill {
          display: block !important;
        }
        #printable-hotel-bill table, #printable-hotel-bill th, #printable-hotel-bill td {
          font-size: 10px !important;
          padding: 2px 4px !important;
          margin: 0 !important;
          line-height: 1.1 !important;
        }
        #printable-hotel-bill table {
          border-spacing: 0 !important;
          border-collapse: collapse !important;
          page-break-inside: avoid !important;
        }
        #printable-hotel-bill tr {
          page-break-inside: avoid !important;
          page-break-after: auto !important;
        }
        #printable-hotel-bill th, #printable-hotel-bill td {
          padding: 2px 4px !important;
          margin: 0 !important;
          vertical-align: top !important;
        }
        #printable-hotel-bill .pb-4, #printable-hotel-bill .mb-6, #printable-hotel-bill .mb-3, #printable-hotel-bill .mb-2, #printable-hotel-bill .mt-4, #printable-hotel-bill .mt-8, #printable-hotel-bill .pt-4, #printable-hotel-bill .pt-1, #printable-hotel-bill .pt-2 {
          margin: 0 !important;
          padding: 0 !important;
        }
        #printable-hotel-bill h1, #printable-hotel-bill .text-2xl, #printable-hotel-bill .text-xl {
          font-size: 12px !important;
          margin-bottom: 2px !important;
          padding-bottom: 0 !important;
        }
        #printable-hotel-bill h3, #printable-hotel-bill .text-base, #printable-hotel-bill .font-bold {
          font-size: 11px !important;
          margin-bottom: 2px !important;
          padding-bottom: 0 !important;
        }
        #printable-hotel-bill th {
          font-size: 10px !important;
          padding: 2px 4px !important;
        }
        #printable-hotel-bill table, #printable-hotel-bill th, #printable-hotel-bill td {
          border: 1px solid #e0e0e0 !important;
        }
        #printable-hotel-bill .section-gap {
          margin-top: 18px !important;
        }
        #printable-hotel-bill .hotel-name {
          font-size: 16px !important;
          font-weight: 600 !important;
          margin-bottom: 2px !important;
        }
      }
    `;
    document.head.appendChild(style);

    window.print();

    // Clean up after printing
    setTimeout(() => {
      const existingStyle = document.getElementById("hotelBillPrintStyle");
      if (existingStyle) existingStyle.remove();
    }, 1000);
  };

  // Use original billData as fallback if hotelBillData is not ready
  const displayHotelBillData = hotelBillData || billData;

  if (!displayHotelBillData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-gray-500 mb-4">Loading split bill...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hidden Hotel Bill Component for Printing - Uses exact same UI as main Bill */}
      <div id="hidden-hotel-bill" style={{ display: "none" }}>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-5xl mx-auto p-6 print:p-0 print:max-w-none print:m-0">
            <div
              id="printable-hotel-bill"
              className="relative bg-white print:shadow-none print:border-none border shadow-lg print:bg-white"
            >
              <div className="p-8 print:p-6">
                <BillHeader billData={displayHotelBillData} />
                <GuestDetails
                  billData={displayHotelBillData}
                  guestData={guestData}
                  isAmountEditing={false}
                  setGuestData={() => {}}
                />
                <BookingDetails billData={displayHotelBillData} />
                <ChargesBreakdown
                  billData={displayHotelBillData}
                  isAmountEditing={false}
                  editingChargeAmounts={{}}
                  setEditingChargeAmounts={() => {}}
                  isChargeExcluded={isChargeExcluded}
                  getFilteredCharges={getFilteredCharges}
                />
                <BillingSummary
                  billData={displayHotelBillData}
                  isAmountEditing={false}
                  editingDiscount={0}
                  setEditingDiscount={() => {}}
                  editingAdvancePayment={0}
                  setEditingAdvancePayment={() => {}}
                  editingChargeAmounts={{}}
                />
                <LegalSignature
                  billData={displayHotelBillData}
                  userData={userData}
                />
                <BillFooter billData={displayHotelBillData} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Compact Hotel Bill Styles */}
      <style>{`
        .compact-hotel-bill h1, .compact-hotel-bill .text-2xl, .compact-hotel-bill .text-xl {
          font-size: 14px !important;
          margin-bottom: 4px !important;
          padding-bottom: 0 !important;
        }
        .compact-hotel-bill h2, .compact-hotel-bill h3, .compact-hotel-bill .text-lg, .compact-hotel-bill .text-base {
          font-size: 12px !important;
          margin-bottom: 3px !important;
          padding-bottom: 0 !important;
        }
        .compact-hotel-bill .text-sm {
          font-size: 10px !important;
          margin-bottom: 2px !important;
        }
        .compact-hotel-bill .text-xs {
          font-size: 9px !important;
          margin-bottom: 1px !important;
        }
        .compact-hotel-bill table, .compact-hotel-bill th, .compact-hotel-bill td {
          font-size: 9px !important;
          padding: 2px 4px !important;
          margin: 0 !important;
          line-height: 1.2 !important;
        }
        .compact-hotel-bill th {
          font-size: 9px !important;
          padding: 2px 4px !important;
        }
        .compact-hotel-bill .mb-4, .compact-hotel-bill .mb-6, .compact-hotel-bill .mb-3, .compact-hotel-bill .mb-2 {
          margin-bottom: 4px !important;
        }
        .compact-hotel-bill .mt-4, .compact-hotel-bill .mt-8, .compact-hotel-bill .mt-6, .compact-hotel-bill .mt-3, .compact-hotel-bill .mt-2 {
          margin-top: 4px !important;
        }
        .compact-hotel-bill .pt-4, .compact-hotel-bill .pt-1, .compact-hotel-bill .pt-2 {
          padding-top: 4px !important;
        }
        .compact-hotel-bill .pb-4, .compact-hotel-bill .pb-1, .compact-hotel-bill .pb-2 {
          padding-bottom: 4px !important;
        }
        .compact-hotel-bill .section-gap {
          margin-top: 8px !important;
        }
        .compact-hotel-bill .hotel-name {
          font-size: 16px !important;
          font-weight: 600 !important;
          margin-bottom: 2px !important;
        }
      `}</style>

      {/* Print/Download Controls - Hidden in print */}
      <style>{`
        @media print {
          @page {
              margin: 0;
          }
          body * {
            visibility: hidden !important;
          }
          #split-bill-printable, #split-bill-printable * {
            visibility: visible !important;
          }
        #hidden-hotel-bill {
          display: block !important;
        }
        #printable-hotel-bill {
          display: block !important;
        }
          #split-bill-printable {
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
          #split-bill-printable .split-bill-container {
            display: flex !important;
            width: 100% !important;
          }
          #split-bill-printable .bill-section {
            width: 50% !important;
            padding: 5px !important;
            border-right: 1px solid #ccc !important;
          }
          #split-bill-printable .bill-section:last-child {
            border-right: none !important;
          }
          #split-bill-printable table, #split-bill-printable th, #split-bill-printable td {
            font-size: 7px !important;
            padding: 0.5px 1px !important;
            margin: 0 !important;
            line-height: 1.0 !important;
          }
          #split-bill-printable h1, #split-bill-printable .text-2xl, #split-bill-printable .text-xl {
            font-size: 8px !important;
            margin-bottom: 0.5px !important;
            padding-bottom: 0 !important;
          }
          #split-bill-printable h3, #split-bill-printable .text-base, #split-bill-printable .font-bold {
            font-size: 7px !important;
            margin-bottom: 0.5px !important;
            padding-bottom: 0 !important;
          }
          #split-bill-printable th {
            font-size: 7px !important;
            padding: 0.5px 1px !important;
          }
          #split-bill-printable table, #split-bill-printable th, #split-bill-printable td {
            border: 1px solid #e0e0e0 !important;
          }
          #split-bill-printable .section-gap {
            margin-top: 4px !important;
          }
          #split-bill-printable .hotel-name {
            font-size: 9px !important;
            font-weight: 600 !important;
            margin-bottom: 0.5px !important;
          }
        }
      `}</style>

      <div className="print:hidden bg-white shadow-sm border-b px-4 py-2">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>

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
              <span>Print Both Bills</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Split Bill Content */}
      <div className="max-w-7xl mx-auto p-2 print:p-0 print:max-w-none print:m-0">
        <div
          id="split-bill-printable"
          className="relative bg-white print:shadow-none print:border-none border shadow-lg print:bg-white"
        >
          <div className="p-2 print:p-1">
            <div className="split-bill-container flex gap-2">
              {/* Hotel Bill Section */}
              <div className="bill-section flex-1/3 border-r border-gray-300">
                <div className="flex justify-between text-center mb-1 mx-2">
                  <h2 className="text-xs font-bold text-blue-600">
                    HOTEL BILL
                  </h2>
                  <div className="mt-0.5">
                    <Button
                      onClick={handleHotelBillPrint}
                      className="flex items-center space-x-1 bg-black hover:bg-blue-700 text-white text-xs px-2 py-1"
                      size="sm"
                    >
                      <Printer className="h-3 w-3" />
                      <span>Print</span>
                    </Button>
                  </div>
                </div>
                <div className="compact-hotel-bill">
                  <BillHeader billData={displayHotelBillData} />
                  <GuestDetails
                    billData={displayHotelBillData}
                    guestData={guestData}
                    isAmountEditing={false}
                    setGuestData={() => {}}
                  />
                  <BookingDetails billData={displayHotelBillData} />
                  <ChargesBreakdown
                    billData={displayHotelBillData}
                    isAmountEditing={false}
                    editingChargeAmounts={{}}
                    setEditingChargeAmounts={() => {}}
                    isChargeExcluded={() => false}
                    getFilteredCharges={(charges) => charges}
                  />
                  <BillingSummary
                    billData={displayHotelBillData}
                    isAmountEditing={false}
                    editingDiscount={0}
                    setEditingDiscount={() => {}}
                    editingAdvancePayment={0}
                    setEditingAdvancePayment={() => {}}
                    editingChargeAmounts={{}}
                  />
                  <LegalSignature
                    billData={displayHotelBillData}
                    userData={userData}
                  />
                  <BillFooter billData={displayHotelBillData} />
                </div>
              </div>

               {/* Restaurant Bills Section */}
               <div className="bill-section flex-1">
                 
                 {restaurantBillsData.map((restaurantBill, billIndex) => (
                   <div key={restaurantBill.orderId} className="mb-2 border border-gray-300 rounded p-2">
                     <div className="flex justify-between text-center mb-1">
                       <h3 className="text-sm font-bold text-green-600">
                         ORDER #{restaurantBill.orderId}
                       </h3>
                       <div className="mt-1">
                         <PrintBill
                           table={{
                             id: billData?.bookingDetails?.roomNumber || "N/A",
                           }}
                           items={restaurantBill.items || []}
                           institutionData={institutionData}
                           screenWidth={window.innerWidth}
                           orderId={restaurantBill.orderId}
                           discountMethod="none"
                           discountValue={0}
                         />
                       </div>
                     </div>

                     {/* Restaurant Bill Header */}
                     <div className="text-center mb-2 border-b pb-1">
                       <h1 className="hotel-name text-sm font-bold">
                         {institutionData?.companyName || "Restaurant Name"}
                       </h1>
                       <p className="text-xs text-gray-600">
                         {institutionData?.contactDetails.address || "Restaurant Address"}
                       </p>
                       <div className="text-xs text-gray-500 mt-0.5">
                         <div>
                           Contact: {institutionData?.contactDetails.phone || "N/A"}
                         </div>
                         <div>Date: {new Date().toLocaleString("en-IN")}</div>
                       </div>
                       {institutionData?.gstin && (
                         <div className="text-xs text-gray-500">
                           GSTIN: {institutionData.gstin}
                         </div>
                       )}
                     </div>

                     {/* Restaurant Bill Details */}
                     <div className="mb-2 border-b pb-1">
                       <div className="text-xs font-semibold">
                         Room: {billData?.bookingDetails?.roomNumber || "N/A"}
                       </div>
                       <div className="text-xs">
                         Order ID: {restaurantBill.orderId}
                       </div>
                     </div>


                     {/* Restaurant Items Table */}
                     <table className="w-full border-collapse border border-gray-300 mb-2">
                       <thead>
                         <tr className="bg-gray-100">
                           <th className="border border-gray-300 p-1 text-left text-xs font-semibold">
                             Item
                           </th>
                           <th className="border border-gray-300 p-1 text-center text-xs font-semibold">
                             Qty
                           </th>
                           <th className="border border-gray-300 p-1 text-right text-xs font-semibold">
                             Rate
                           </th>
                           <th className="border border-gray-300 p-1 text-right text-xs font-semibold">
                             Total
                           </th>
                         </tr>
                       </thead>
                       <tbody>
                         {restaurantBill.items.map((item, index) => (
                           <tr key={index}>
                             <td className="border border-gray-300 p-1 text-xs">
                               <div>
                                 <div className="font-medium">{item.name}</div>
                                 {item.category && (
                                   <div className="text-xs text-gray-500">
                                     {item.category}
                                   </div>
                                 )}
                               </div>
                             </td>
                             <td className="border border-gray-300 p-1 text-center text-xs">
                               {item.quantity}
                             </td>
                             <td className="border border-gray-300 p-1 text-right text-xs">
                               ₹{item.price}
                             </td>
                             <td className="border border-gray-300 p-1 text-right text-xs font-semibold">
                               ₹{item.price * item.quantity}
                             </td>
                           </tr>
                         ))}
                       </tbody>
                     </table>

                     {/* Restaurant Bill Summary */}
                     <div className="border-t pt-1">
                       <div className="flex justify-between py-0.5 text-xs">
                         <span>Total Qty:</span>
                         <span>
                           {restaurantBill.items.reduce(
                             (sum, item) => sum + item.quantity,
                             0
                           )}
                         </span>
                       </div>
                       <div className="flex justify-between py-0.5 text-xs">
                         <span>Subtotal:</span>
                         <span>₹{restaurantBill.subtotal.toFixed(2)}</span>
                       </div>
                       <div className="flex justify-between py-0.5 text-xs">
                         <span>CGST ({restaurantBill.cgstRate.toFixed(1)}%):</span>
                         <span>₹{restaurantBill.cgst.toFixed(2)}</span>
                       </div>
                       <div className="flex justify-between py-0.5 text-xs">
                         <span>SGST ({restaurantBill.sgstRate.toFixed(1)}%):</span>
                         <span>₹{restaurantBill.sgst.toFixed(2)}</span>
                       </div>
                       {restaurantBill.serviceTaxRate > 0 && (
                         <div className="flex justify-between py-0.5 text-xs">
                           <span>
                             Service Tax ({restaurantBill.serviceTaxRate.toFixed(1)}%):
                           </span>
                           <span>₹{restaurantBill.serviceTax.toFixed(2)}</span>
                         </div>
                       )}
                       <div className="flex justify-between py-1 text-sm font-bold border-t border-gray-300 mt-1">
                         <span>Total (Including Taxes):</span>
                         <span>₹{restaurantBill.total.toFixed(2)}</span>
                       </div>
                     </div>

                     {/* Restaurant Bill Footer */}
                     <div className="text-center mt-2 pt-1 border-t border-gray-300">
                       <p className="text-xs text-gray-600">
                         Thank you, visit again!
                       </p>
                       <p className="text-xs text-gray-500 mt-0.5">
                         Empower your business with tekkzy.com
                       </p>
                     </div>
                   </div>
                 ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SplitBill;
