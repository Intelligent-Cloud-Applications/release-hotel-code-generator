import React, { useState, useEffect, useMemo } from "react";
import { Button } from "../../../../components/ui/button.js";
import {
  Printer,
  Download,
  ArrowLeft,
  X,
  Shirt,
  Utensils,
  Coffee,
  Bed,
  FileText,
  Filter,
  Layers,
  EyeOff,
  Eye,
} from "lucide-react";
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
import {
  fetchRestaurantReceipt,
  normalizeRestaurantOrders,
} from "../../../../utils/restaurantReceiptService.js";
import printLaundryA4Bill from "../../Laundry/PrintLaundryA4.jsx";
import { printDepartmentA4Invoice } from "../../../../utils/printDepartmentA4.js";

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
  institutionData: propInstitutionData,
}) => {
  const navigate = useNavigate();
  const [restaurantBillsData, setRestaurantBillsData] = useState([]);
  const [hotelBillData, setHotelBillData] = useState(null);
  const [excludedBillIds, setExcludedBillIds] = useState(new Set());
  const [selectedDepartment, setSelectedDepartment] = useState("all");

  const { institutionData: contextInstitutionData } = useInstitutionContext();
  const institutionData = propInstitutionData || contextInstitutionData;
  const institutionId =
    institutionData?.institutionId ||
    institutionData?.institutionid ||
    institutionData?.institution ||
    booking?.institutionId ||
    userData?.institutionId ||
    "HOTEL001";

  // Toggle exclusion of an individual department bill from the split
  const toggleExcludeBill = (orderId) => {
    setExcludedBillIds((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };

  // Process all services across F&B, Laundry, Minibar, and Housekeeping
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (detailedServices && billData) {
        const foodOrderIds = [];
        const laundryServices = [];
        const minibarServices = [];
        const housekeepingServices = [];
        const fallbackFoodServices = [];

        // 1. Scan detailedServices
        console.log("Detailed Services:", detailedServices);
        if (detailedServices && typeof detailedServices === "object") {
          Object.keys(detailedServices).forEach((roomNumber) => {
            Object.keys(detailedServices[roomNumber] || {}).forEach((date) => {
              (detailedServices[roomNumber][date] || []).forEach((service) => {
                const isLaundry =
                  Number(service.laundry_charges) > 0 ||
                  service.service_type === "laundry" ||
                  String(service.order_id || "").startsWith("LND-");

                const isMinibar =
                  Number(service.minibar_charges) > 0 ||
                  service.service_type === "minibar" ||
                  service.service_type === "bar";

                const isHousekeeping =
                  Number(service.extra_bed_charges) > 0 ||
                  Number(service.manual_charges) > 0 ||
                  service.service_type === "extra_bed" ||
                  service.service_type === "manual" ||
                  service.service_type === "housekeeping";

                if (isLaundry) {
                  if (
                    service.order_id &&
                    !laundryServices.some((s) => s.order_id === service.order_id)
                  ) {
                    laundryServices.push({ ...service, roomNumber, date });
                  } else if (!service.order_id) {
                    laundryServices.push({
                      ...service,
                      roomNumber,
                      date,
                      order_id: `LND-${roomNumber}-${date.replace(/[^a-zA-Z0-9]/g, "")}`,
                    });
                  }
                } else if (isMinibar) {
                  minibarServices.push({ ...service, roomNumber, date });
                } else if (isHousekeeping) {
                  housekeepingServices.push({ ...service, roomNumber, date });
                } else if (service.order_id) {
                  const oid = String(service.order_id).trim();
                  if (!foodOrderIds.includes(oid)) {
                    foodOrderIds.push(oid);
                  }
                  fallbackFoodServices.push({ ...service, roomNumber, date });
                } else if (Number(service.food_charges) > 0) {
                  fallbackFoodServices.push({ ...service, roomNumber, date });
                }
              });
            });
          });
        }

        // 2. Scan billData.serviceChargesByDate to ensure no room service charges are missed
        if (
          billData?.serviceChargesByDate &&
          Array.isArray(billData.serviceChargesByDate)
        ) {
          billData.serviceChargesByDate.forEach((dayData) => {
            const date = Object.keys(dayData)[0];
            const roomEntries = dayData[date];
            if (Array.isArray(roomEntries)) {
              roomEntries.forEach((entry) => {
                const roomNumber =
                  entry.roomNumber || billData?.bookingDetails?.roomNumber || "N/A";
                const ch = entry.charges || {};

                // Minibar
                if (Number(ch.minibarCharges || ch.minibar_charges) > 0) {
                  const already = minibarServices.some(
                    (s) => s.roomNumber === roomNumber && s.date === date
                  );
                  if (!already) {
                    minibarServices.push({
                      roomNumber,
                      date,
                      minibar_charges: Number(
                        ch.minibarCharges || ch.minibar_charges
                      ),
                      name: "In-Room Minibar Refreshments",
                    });
                  }
                }

                // Housekeeping / Extra Bed / Manual Charges
                if (
                  Number(ch.extraBedCharges || ch.extra_bed_charges) > 0 ||
                  Number(ch.manualCharges || ch.manual_charges) > 0
                ) {
                  const already = housekeepingServices.some(
                    (s) => s.roomNumber === roomNumber && s.date === date
                  );
                  if (!already) {
                    housekeepingServices.push({
                      roomNumber,
                      date,
                      extra_bed_charges: Number(
                        ch.extraBedCharges || ch.extra_bed_charges || 0
                      ),
                      manual_charges: Number(
                        ch.manualCharges || ch.manual_charges || 0
                      ),
                      name:
                        Number(ch.extraBedCharges || ch.extra_bed_charges) > 0
                          ? "Extra Bed & Linen Service"
                          : "Housekeeping & Manual Adjustments",
                    });
                  }
                }

                // Laundry
                if (
                  Number(ch.laundryCharges || ch.laundry_charges) > 0 &&
                  laundryServices.length === 0
                ) {
                  laundryServices.push({
                    roomNumber,
                    date,
                    laundry_charges: Number(
                      ch.laundryCharges || ch.laundry_charges
                    ),
                    name: "Laundry Service",
                    order_id: `LND-${roomNumber}-${date.replace(/[^a-zA-Z0-9]/g, "")}`,
                  });
                }
              });
            }
          });
        }

        // 3. Scan booking orderDetails if any
        const bookingOrderDetails =
          booking?.breakdown?.charges?.serviceCharges?.orderDetails ||
          booking?.orderDetails ||
          [];
        if (Array.isArray(bookingOrderDetails)) {
          bookingOrderDetails.forEach((od) => {
            const oid = String(od.order_id || od.orderId || "").trim();
            if (oid && !oid.startsWith("LND-") && !foodOrderIds.includes(oid)) {
              foodOrderIds.push(oid);
            }
          });
        }

        console.log("Collected Restaurant Order IDs:", foodOrderIds);

        // Fetch actual order details from API if we have restaurant order IDs
        let apiOrders = [];
        if (foodOrderIds.length > 0) {
          try {
            console.log(
              "Fetching restaurant receipt for order IDs:",
              foodOrderIds,
              "Institution:",
              institutionId
            );
            const receiptData = await fetchRestaurantReceipt({
              institution: institutionId,
              orderIds: foodOrderIds,
            });
            apiOrders = normalizeRestaurantOrders(receiptData, foodOrderIds);
            console.log("Normalized restaurant orders:", apiOrders);
          } catch (error) {
            console.error("Error fetching restaurant receipt:", error);
          }
        }

        const bills = [];

        // 1. Add fetched F&B restaurant orders (with actual line items)
        apiOrders.forEach((order) => {
          bills.push({
            orderId: order.orderId,
            orderType: "restaurant",
            department: "Food & Beverage",
            sac: "996331",
            billTitle: `F&B ORDER #${order.orderId}`,
            tableName:
              order.tableName || billData?.bookingDetails?.roomNumber || "N/A",
            date: order.createdAt || new Date().toLocaleDateString("en-IN"),
            items: order.items,
            subtotal: order.subtotal,
            cgst: order.cgst,
            sgst: order.sgst,
            serviceTax: order.serviceTax,
            total: order.totalAmount,
            cgstRate:
              order.subtotal > 0
                ? (order.cgst / order.subtotal) * 100
                : Number(institutionData?.cgst ?? 2.5),
            sgstRate:
              order.subtotal > 0
                ? (order.sgst / order.subtotal) * 100
                : Number(institutionData?.sgst ?? 2.5),
            serviceTaxRate:
              order.subtotal > 0
                ? (order.serviceTax / order.subtotal) * 100
                : Number(institutionData?.serviceTax ?? 0),
          });
        });

        // 2. Fallback F&B orders not returned by API
        foodOrderIds.forEach((oid) => {
          if (!bills.some((b) => b.orderId === oid)) {
            const serviceData = fallbackFoodServices.find(
              (s) => String(s.order_id) === oid
            );
            const charge = Number(
              serviceData?.food_charges || serviceData?.charge || 0
            );
            const cgstRate = Number(institutionData?.cgst ?? 2.5);
            const sgstRate = Number(institutionData?.sgst ?? 2.5);
            const cgst = (charge * cgstRate) / 100;
            const sgst = (charge * sgstRate) / 100;
            bills.push({
              orderId: oid,
              orderType: "restaurant",
              department: "Food & Beverage",
              sac: "996331",
              billTitle: `F&B ORDER #${oid}`,
              tableName:
                serviceData?.roomNumber ||
                billData?.bookingDetails?.roomNumber ||
                "N/A",
              date:
                serviceData?.date || new Date().toLocaleDateString("en-IN"),
              items: [
                {
                  name: serviceData?.name || `Restaurant Order #${oid}`,
                  itemName: serviceData?.name || `Restaurant Order #${oid}`,
                  price: charge,
                  quantity: 1,
                  type: "food",
                  category: "Restaurant",
                },
              ],
              subtotal: charge,
              cgst,
              sgst,
              serviceTax: 0,
              total: Math.round(charge + cgst + sgst),
              cgstRate,
              sgstRate,
              serviceTaxRate: 0,
            });
          }
        });

        // 3. Add Laundry Orders (with garment care details, SAC 996312)
        laundryServices.forEach((service) => {
          let orderItems =
            Array.isArray(service.items) && service.items.length > 0
              ? service.items
              : null;
          let foundLaundryOrder = null;
          if (!orderItems) {
            try {
              const saved = JSON.parse(
                localStorage.getItem("hotel_laundry_orders") || "[]"
              );
              foundLaundryOrder = saved.find(
                (o) =>
                  o.orderId === service.order_id || o.token === service.order_id
              );
              if (foundLaundryOrder && foundLaundryOrder.items) {
                orderItems = foundLaundryOrder.items;
              }
            } catch (e) {}
          }

          const laundryItems =
            orderItems && orderItems.length > 0
              ? orderItems.map((lItem) => {
                  const careLabel =
                    lItem.careType === "wash_and_press"
                      ? "Wash & Iron"
                      : lItem.careType === "press_only"
                      ? "Iron"
                      : lItem.careType === "dry_clean"
                      ? "Dry Clean"
                      : lItem.careType === "wash_only"
                      ? "Wash"
                      : "Care";
                  return {
                    name: `${lItem.name} [${careLabel}]`,
                    itemName: `${lItem.name} [${careLabel}]`,
                    price: Number(lItem.rate || lItem.unitRate || lItem.price || 0),
                    quantity: Number(lItem.quantity) || 1,
                    type: "laundry",
                    category: lItem.category || "Laundry",
                    sac: "996312",
                  };
                })
              : [
                  {
                    name: service.name || `Laundry Service #${service.order_id}`,
                    itemName:
                      service.name || `Laundry Service #${service.order_id}`,
                    price: Number(service.laundry_charges) || 0,
                    quantity: 1,
                    type: "laundry",
                    category: "Laundry",
                    sac: "996312",
                  },
                ];

          const subtotal =
            service.itemsSubtotal !== undefined
              ? Number(service.itemsSubtotal)
              : foundLaundryOrder?.itemsSubtotal !== undefined
              ? Number(foundLaundryOrder.itemsSubtotal)
              : Number(service.laundry_charges) || 0;

          const cgst =
            service.cgstAmount !== undefined
              ? Number(service.cgstAmount)
              : foundLaundryOrder?.cgstAmount !== undefined
              ? Number(foundLaundryOrder.cgstAmount)
              : (subtotal * 2.5) / 100;

          const sgst =
            service.sgstAmount !== undefined
              ? Number(service.sgstAmount)
              : foundLaundryOrder?.sgstAmount !== undefined
              ? Number(foundLaundryOrder.sgstAmount)
              : (subtotal * 2.5) / 100;

          const total =
            service.totalAmount !== undefined
              ? Number(service.totalAmount)
              : foundLaundryOrder?.grandTotal !== undefined
              ? Number(foundLaundryOrder.grandTotal)
              : Math.round(subtotal + cgst + sgst);

          const exactLaundryDate =
            foundLaundryOrder?.createdAt ||
            foundLaundryOrder?.created_at ||
            service.created_at ||
            service.createdAt ||
            service.date;

          bills.push({
            orderId: service.order_id,
            orderType: "laundry",
            department: "Laundry",
            sac: "996312",
            billTitle: `LAUNDRY FOLIO #${service.order_id}`,
            tableName:
              service.roomNumber ||
              billData?.bookingDetails?.roomNumber ||
              "N/A",
            date: exactLaundryDate || service.date,
            items: laundryItems,
            subtotal,
            cgst,
            sgst,
            serviceTax: 0,
            total,
            cgstRate: subtotal > 0 ? (cgst / subtotal) * 100 : 2.5,
            sgstRate: subtotal > 0 ? (sgst / subtotal) * 100 : 2.5,
            serviceTaxRate: 0,
          });
        });

        // 4. Add Minibar Department Bills (SAC 996332)
        minibarServices.forEach((service, index) => {
          const charge = Number(service.minibar_charges || 0);
          const cgstRate = Number(institutionData?.cgst ?? 2.5);
          const sgstRate = Number(institutionData?.sgst ?? 2.5);
          const cgst = (charge * cgstRate) / 100;
          const sgst = (charge * sgstRate) / 100;
          const orderId =
            service.order_id ||
            `MNB-${service.roomNumber}-${(service.date || index)
              .toString()
              .replace(/[^a-zA-Z0-9]/g, "")}`;

          bills.push({
            orderId,
            orderType: "minibar",
            department: "Minibar",
            sac: "996332",
            billTitle: `MINIBAR FOLIO #${orderId}`,
            tableName:
              service.roomNumber ||
              billData?.bookingDetails?.roomNumber ||
              "N/A",
            date: service.date || new Date().toLocaleDateString("en-IN"),
            items: [
              {
                name: service.name || "In-Room Minibar Refreshments",
                itemName: service.name || "In-Room Minibar Refreshments",
                price: charge,
                quantity: 1,
                type: "minibar",
                category: "Minibar",
              },
            ],
            subtotal: charge,
            cgst,
            sgst,
            serviceTax: 0,
            total: Math.round(charge + cgst + sgst),
            cgstRate,
            sgstRate,
            serviceTaxRate: 0,
          });
        });

        // 5. Add Housekeeping & Extra Bed / Room Services (SAC 996311)
        housekeepingServices.forEach((service, index) => {
          const extraBed = Number(service.extra_bed_charges || 0);
          const manual = Number(service.manual_charges || 0);
          const charge = extraBed + manual;
          const cgstRate = Number(institutionData?.cgst ?? 2.5);
          const sgstRate = Number(institutionData?.sgst ?? 2.5);
          const cgst = (charge * cgstRate) / 100;
          const sgst = (charge * sgstRate) / 100;
          const orderId =
            service.order_id ||
            `HSK-${service.roomNumber}-${(service.date || index)
              .toString()
              .replace(/[^a-zA-Z0-9]/g, "")}`;

          const items = [];
          if (extraBed > 0) {
            items.push({
              name: "Extra Bed & Linen Service",
              itemName: "Extra Bed & Linen Service",
              price: extraBed,
              quantity: 1,
              type: "housekeeping",
              category: "Extra Bed",
            });
          }
          if (manual > 0) {
            items.push({
              name: service.name || "Room Service & Manual Charges",
              itemName: service.name || "Room Service & Manual Charges",
              price: manual,
              quantity: 1,
              type: "housekeeping",
              category: "Housekeeping",
            });
          }

          bills.push({
            orderId,
            orderType: "housekeeping",
            department: "Housekeeping",
            sac: "996311",
            billTitle: `HOUSEKEEPING FOLIO #${orderId}`,
            tableName:
              service.roomNumber ||
              billData?.bookingDetails?.roomNumber ||
              "N/A",
            date: service.date || new Date().toLocaleDateString("en-IN"),
            items:
              items.length > 0
                ? items
                : [
                    {
                      name: "Housekeeping & Support Services",
                      itemName: "Housekeeping & Support Services",
                      price: charge,
                      quantity: 1,
                      type: "housekeeping",
                      category: "Housekeeping",
                    },
                  ],
            subtotal: charge,
            cgst,
            sgst,
            serviceTax: 0,
            total: Math.round(charge + cgst + sgst),
            cgstRate,
            sgstRate,
            serviceTaxRate: 0,
          });
        });

        console.log("Setting multi-department bills data:", bills);
        setRestaurantBillsData(bills);
      }
    };

    fetchOrderDetails();
  }, [detailedServices, billData, institutionData]);

  // Recalculate isolated Hotel Accommodation Folio based on which bills are currently included in the split
  useEffect(() => {
    if (!billData) return;

    const hotelBill = { ...billData };

    // Determine which departments/bills are separated out (i.e. NOT in excludedBillIds)
    const separatedTypes = new Set(
      restaurantBillsData
        .filter((b) => !excludedBillIds.has(b.orderId))
        .map((b) => b.orderType)
    );

    if (hotelBill.serviceChargesByDate) {
      hotelBill.serviceChargesByDate = hotelBill.serviceChargesByDate.map(
        (dayData) => {
          const date = Object.keys(dayData)[0];
          const roomEntries = dayData[date];

          const updatedRoomEntries = (roomEntries || []).map((roomEntry) => {
            const charges = { ...roomEntry.charges };

            if (separatedTypes.has("restaurant")) charges.foodCharges = 0;
            if (separatedTypes.has("minibar")) charges.minibarCharges = 0;
            if (separatedTypes.has("laundry")) charges.laundryCharges = 0;
            if (separatedTypes.has("housekeeping")) {
              charges.extraBedCharges = 0;
              charges.manualCharges = 0;
            }

            charges.dailyTotal =
              (charges.roomCharges || 0) +
              (charges.ratePlanCharges || 0) +
              (charges.extraPaxCharges || 0) +
              (charges.foodCharges || 0) +
              (charges.minibarCharges || 0) +
              (charges.laundryCharges || 0) +
              (charges.extraBedCharges || 0) +
              (charges.manualCharges || 0);

            return { ...roomEntry, charges };
          });

          return { [date]: updatedRoomEntries };
        }
      );
    }

    // Recalculate totals
    let totalRoomCharges = 0;
    let totalServiceCharges = 0;
    let totalRatePlanFromBreakdown = 0;
    let totalExtraPaxFromBreakdown = 0;

    if (hotelBill.serviceChargesByDate) {
      hotelBill.serviceChargesByDate.forEach((dayData) => {
        const date = Object.keys(dayData)[0];
        const roomEntries = dayData[date];
        (roomEntries || []).forEach((entry) => {
          const ch = entry.charges || {};
          totalRoomCharges += ch.roomCharges || 0;
          totalRatePlanFromBreakdown += ch.ratePlanCharges || 0;
          totalExtraPaxFromBreakdown += ch.extraPaxCharges || 0;
          totalServiceCharges +=
            (ch.foodCharges || 0) +
            (ch.laundryCharges || 0) +
            (ch.minibarCharges || 0) +
            (ch.extraBedCharges || 0) +
            (ch.manualCharges || 0);
        });
      });
    }

    const effectiveRoomTariff = totalRoomCharges + totalRatePlanFromBreakdown;
    const cgstAmount = Math.round((effectiveRoomTariff * 6) / 100);
    const sgstAmount = Math.round((effectiveRoomTariff * 6) / 100);
    const totalTaxAmount = cgstAmount + sgstAmount;

    const subTotal =
      effectiveRoomTariff +
      totalExtraPaxFromBreakdown +
      totalServiceCharges -
      (hotelBill.billingSummary?.totalDiscount || 0);

    const grandTotal = subTotal + totalTaxAmount;
    const balanceDue =
      grandTotal - (hotelBill.billingSummary?.partialPayment || 0);

    hotelBill.billingSummary = {
      ...hotelBill.billingSummary,
      totalRoomServices: effectiveRoomTariff,
      totalServiceCharges: totalServiceCharges,
      subTotal: subTotal,
      cgstAmount: cgstAmount,
      sgstAmount: sgstAmount,
      totalTaxAmount: totalTaxAmount,
      balanceDue: balanceDue,
      grandTotal: grandTotal,
    };

    hotelBill.finalSummary = {
      ...hotelBill.finalSummary,
      amountInWords: numberToWords(grandTotal),
      totalAmount: grandTotal,
    };

    setHotelBillData(hotelBill);
  }, [billData, restaurantBillsData, excludedBillIds]);

  const handlePrintA4 = (bill) => {
    if (bill.orderType === "laundry") {
      try {
        const saved = JSON.parse(
          localStorage.getItem("hotel_laundry_orders") || "[]"
        );
        const found = saved.find(
          (o) => o.orderId === bill.orderId || o.token === bill.orderId
        );
        if (found) {
          printLaundryA4Bill(found, institutionData);
          return;
        }
      } catch (e) {
        console.error("Laundry A4 print fallback:", e);
      }
    }

    printDepartmentA4Invoice({
      bill,
      institutionData,
      booking,
      guestData,
    });
  };

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

               {/* Multi-Department Billing Separation Section */}
                <div className="bill-section flex-1">
                  {/* Department Folios Control Banner */}
                  <div className="mb-3 p-3 bg-white border border-gray-200 rounded shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2 mb-2">
                      <div>
                        <h2 className="text-sm font-bold text-gray-800 flex items-center gap-1.5 uppercase tracking-wide">
                          <Layers className="w-4 h-4 text-primary" />
                          Multi-Department Billing Separation
                        </h2>
                        <p className="text-[11px] text-gray-500">
                          Isolated folios for F&B, Laundry, Minibar & Housekeeping with dedicated SAC codes and GST handling.
                        </p>
                      </div>
                      <div className="text-[11px] font-semibold text-gray-600 bg-gray-100 px-2.5 py-1 rounded">
                        {restaurantBillsData.length} Total Folio{restaurantBillsData.length !== 1 ? "s" : ""}
                        {excludedBillIds.size > 0 && (
                          <span className="text-amber-700 ml-1">
                            ({excludedBillIds.size} Excluded)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Department Filter Tabs */}
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { id: "all", label: "All Folios", count: restaurantBillsData.length, icon: Layers },
                        {
                          id: "restaurant",
                          label: "F&B / Restaurant",
                          count: restaurantBillsData.filter((b) => b.orderType === "restaurant").length,
                          icon: Utensils,
                        },
                        {
                          id: "laundry",
                          label: "Laundry",
                          count: restaurantBillsData.filter((b) => b.orderType === "laundry").length,
                          icon: Shirt,
                        },
                        {
                          id: "minibar",
                          label: "Minibar",
                          count: restaurantBillsData.filter((b) => b.orderType === "minibar").length,
                          icon: Coffee,
                        },
                        {
                          id: "housekeeping",
                          label: "Housekeeping",
                          count: restaurantBillsData.filter((b) => b.orderType === "housekeeping").length,
                          icon: Bed,
                        },
                      ]
                        .filter((tab) => tab.id === "all" || tab.count > 0)
                        .map((tab) => {
                          const TabIcon = tab.icon;
                          const isActive = selectedDepartment === tab.id;
                          return (
                            <button
                              key={tab.id}
                              type="button"
                              onClick={() => setSelectedDepartment(tab.id)}
                              className={`px-2.5 py-1 text-xs font-medium rounded-full flex items-center gap-1 transition-colors ${
                                isActive
                                  ? "bg-primary text-white shadow-xs"
                                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                              }`}
                            >
                              <TabIcon className="w-3 h-3" />
                              <span>{tab.label}</span>
                              <span
                                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                                  isActive ? "bg-white/20 text-white" : "bg-gray-200 text-gray-700"
                                }`}
                              >
                                {tab.count}
                              </span>
                            </button>
                          );
                        })}
                    </div>
                  </div>

                  {/* Render Department Folios */}
                  {restaurantBillsData
                    .filter((bill) =>
                      selectedDepartment === "all" ? true : bill.orderType === selectedDepartment
                    )
                    .map((restaurantBill, billIndex) => {
                      const isExcluded = excludedBillIds.has(restaurantBill.orderId);
                      const isLaundry = restaurantBill.orderType === "laundry";
                      const isRestaurant = restaurantBill.orderType === "restaurant";
                      const isMinibar = restaurantBill.orderType === "minibar";
                      const isHousekeeping = restaurantBill.orderType === "housekeeping";

                      const borderBgClass = isExcluded
                        ? "border-gray-300 bg-gray-50/70 opacity-80"
                        : isLaundry
                        ? "border-blue-300 bg-blue-50/20"
                        : isMinibar
                        ? "border-amber-300 bg-amber-50/20"
                        : isHousekeeping
                        ? "border-purple-300 bg-purple-50/20"
                        : "border-green-300 bg-green-50/20";

                      const titleColor = isLaundry
                        ? "text-blue-700"
                        : isMinibar
                        ? "text-amber-800"
                        : isHousekeeping
                        ? "text-purple-800"
                        : "text-green-700";

                      const sacCode =
                        restaurantBill.sac ||
                        (isLaundry
                          ? "996312"
                          : isMinibar
                          ? "996332"
                          : isHousekeeping
                          ? "996311"
                          : "996331");

                      return (
                        <div
                          key={restaurantBill.orderId || billIndex}
                          className={`mb-3 border rounded p-3 transition-all ${borderBgClass}`}
                        >
                          {/* Header with Title and Action Buttons */}
                          <div className="flex flex-wrap justify-between items-center gap-2 mb-2 border-b pb-2">
                            <div className="flex items-center gap-2">
                              <div
                                className={`p-1.5 rounded ${
                                  isLaundry
                                    ? "bg-blue-100 text-blue-700"
                                    : isMinibar
                                    ? "bg-amber-100 text-amber-800"
                                    : isHousekeeping
                                    ? "bg-purple-100 text-purple-800"
                                    : "bg-green-100 text-green-700"
                                }`}
                              >
                                {isLaundry && <Shirt className="w-4 h-4" />}
                                {isRestaurant && <Utensils className="w-4 h-4" />}
                                {isMinibar && <Coffee className="w-4 h-4" />}
                                {isHousekeeping && <Bed className="w-4 h-4" />}
                              </div>
                              <div>
                                <h3 className={`text-sm font-bold flex items-center gap-1.5 ${titleColor}`}>
                                  {restaurantBill.billTitle ||
                                    `${(restaurantBill.orderType || "FOLIO").toUpperCase()} #${restaurantBill.orderId}`}
                                </h3>
                                <div className="text-[10px] text-gray-500 font-medium">
                                  SAC: {sacCode} • Ledger Folio
                                </div>
                              </div>
                            </div>

                            {/* Action Buttons: Exclude/Include, 80mm Slip, A4 Tax Invoice */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => toggleExcludeBill(restaurantBill.orderId)}
                                className={`h-7 px-2 text-[11px] font-medium border ${
                                  isExcluded
                                    ? "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100"
                                    : "bg-white text-gray-600 border-gray-300 hover:text-amber-700 hover:bg-gray-50"
                                }`}
                                title={isExcluded ? "Include in Split" : "Exclude from Split"}
                              >
                                {isExcluded ? (
                                  <>
                                    <Eye className="w-3.5 h-3.5 mr-1 text-amber-600" />
                                    <span>Include</span>
                                  </>
                                ) : (
                                  <>
                                    <EyeOff className="w-3.5 h-3.5 mr-1" />
                                    <span>Exclude</span>
                                  </>
                                )}
                              </Button>

                              {/* 80mm Slip Thermal Print */}
                              <div className="mt-0">
                                <PrintBill
                                  table={{
                                    id: restaurantBill.tableName || billData?.bookingDetails?.roomNumber || "N/A",
                                  }}
                                  items={restaurantBill.items || []}
                                  institutionData={institutionData}
                                  screenWidth={window.innerWidth}
                                  orderId={restaurantBill.orderId}
                                  date={restaurantBill.date}
                                  discountMethod="none"
                                  discountValue={0}
                                />
                              </div>

                              {/* A4 Tax Invoice Print */}
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handlePrintA4(restaurantBill)}
                                className="h-7 px-2 text-[11px] font-medium bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 flex items-center gap-1"
                                title="Print A4 Size Tax Invoice"
                              >
                                <FileText className="w-3.5 h-3.5 text-blue-600" />
                                <span>A4 Print</span>
                              </Button>
                            </div>
                          </div>

                          {/* Excluded status notice */}
                          {isExcluded && (
                            <div className="mb-2 p-1.5 bg-amber-100/80 border border-amber-300 rounded text-[11px] text-amber-900 flex items-center gap-1.5">
                              <EyeOff className="w-3.5 h-3.5 text-amber-700" />
                              <span>
                                <b>Excluded from Split:</b> This charge is not separated and remains on the main hotel bill.
                              </span>
                            </div>
                          )}

                          {/* Department Bill Header */}
                          <div className="text-center mb-2 border-b pb-1">
                            <h1 className="hotel-name text-sm font-bold">
                              {institutionData?.companyName ||
                                (isLaundry
                                  ? "Hotel Laundry Services"
                                  : isMinibar
                                  ? "Hotel Minibar & Refreshments"
                                  : isHousekeeping
                                  ? "Hotel Housekeeping Services"
                                  : "Restaurant Name")}
                            </h1>
                            <div className="text-[10px] font-bold text-gray-700 tracking-wide uppercase mt-0.5">
                              TAX INVOICE — {restaurantBill.department || (isLaundry ? "GUEST LAUNDRY" : isMinibar ? "MINIBAR" : isHousekeeping ? "HOUSEKEEPING" : "FOOD & BEVERAGE")} (SAC {sacCode})
                            </div>
                            <p className="text-xs text-gray-600">
                              {institutionData?.contactDetails?.address || institutionData?.Query_Address || "Hotel Address"}
                            </p>
                            <div className="text-xs text-gray-500 mt-0.5">
                              <div>
                                Contact: {institutionData?.contactDetails?.phone || institutionData?.Query_PhoneNumber || "N/A"}
                              </div>
                              <div>
                                Date: {restaurantBill.date ? (() => {
                                  const parsed = new Date(restaurantBill.date);
                                  return !isNaN(parsed.getTime()) ? parsed.toLocaleDateString("en-IN") : String(restaurantBill.date);
                                })() : new Date().toLocaleDateString("en-IN")}
                              </div>
                            </div>
                            {institutionData?.gstin && (
                              <div className="text-xs text-gray-500">
                                GSTIN: {institutionData.gstin}
                              </div>
                            )}
                          </div>

                          {/* Department Bill Details */}
                          <div className="mb-2 border-b pb-1 flex justify-between text-xs">
                            <div>
                              <span className="font-semibold">Room:</span>{" "}
                              {restaurantBill.tableName || billData?.bookingDetails?.roomNumber || "N/A"}
                            </div>
                            <div>
                              <span className="font-semibold">Folio / Order:</span>{" "}
                              {restaurantBill.orderId}
                            </div>
                          </div>

                          {/* Items Table */}
                          <table className="w-full border-collapse border border-gray-300 mb-2">
                            <thead>
                              <tr className="bg-gray-100">
                                <th className="border border-gray-300 p-1 text-left text-xs font-semibold">
                                  Item / Description
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
                              {restaurantBill.items && restaurantBill.items.length > 0 ? (
                                restaurantBill.items.map((item, index) => (
                                  <tr key={index}>
                                    <td className="border border-gray-300 p-1 text-xs">
                                      <div>
                                        <div className="font-medium">{item.name || item.itemName}</div>
                                        {item.category && (
                                          <div className="text-[10px] text-gray-500">
                                            {item.category}
                                          </div>
                                        )}
                                      </div>
                                    </td>
                                    <td className="border border-gray-300 p-1 text-center text-xs">
                                      {item.quantity}
                                    </td>
                                    <td className="border border-gray-300 p-1 text-right text-xs">
                                      ₹{Number(item.price || item.unitRate || 0).toFixed(2)}
                                    </td>
                                    <td className="border border-gray-300 p-1 text-right text-xs font-semibold">
                                      ₹{(Number(item.price || item.unitRate || 0) * Number(item.quantity || 1)).toFixed(2)}
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan="4" className="text-center p-2 text-xs text-gray-500">
                                    No item details available
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>

                          {/* Summary & Taxes */}
                          <div className="border-t pt-1">
                            <div className="flex justify-between py-0.5 text-xs">
                              <span>Total Qty:</span>
                              <span>
                                {restaurantBill.items.reduce(
                                  (sum, item) => sum + (Number(item.quantity) || 1),
                                  0
                                )}
                              </span>
                            </div>
                            <div className="flex justify-between py-0.5 text-xs">
                              <span>Subtotal:</span>
                              <span>₹{Number(restaurantBill.subtotal || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between py-0.5 text-xs">
                              <span>CGST ({(restaurantBill.cgstRate || 2.5).toFixed(1)}%):</span>
                              <span>₹{Number(restaurantBill.cgst || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between py-0.5 text-xs">
                              <span>SGST ({(restaurantBill.sgstRate || 2.5).toFixed(1)}%):</span>
                              <span>₹{Number(restaurantBill.sgst || 0).toFixed(2)}</span>
                            </div>
                            {Number(restaurantBill.serviceTax || 0) > 0 && (
                              <div className="flex justify-between py-0.5 text-xs">
                                <span>
                                  Service Tax ({(restaurantBill.serviceTaxRate || 0).toFixed(1)}%):
                                </span>
                                <span>₹{Number(restaurantBill.serviceTax).toFixed(2)}</span>
                              </div>
                            )}
                            <div className="flex justify-between py-1 text-sm font-bold border-t border-gray-300 mt-1">
                              <span>Total (Including Taxes):</span>
                              <span>₹{Number(restaurantBill.total || 0).toFixed(2)}</span>
                            </div>
                          </div>

                          {/* Footer */}
                          <div className="text-center mt-2 pt-1 border-t border-gray-300">
                            <p className="text-[11px] text-gray-600">
                              Multi-Department Ledger Folio • Thank you, visit again!
                            </p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};

export default SplitBill;
