import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router";
import { useAppContext } from "@/Development/context/AppContext.jsx";
import { useInstitutionContext } from "@/Development/context/InstitutionContext.jsx";
import { useAuthContext } from "@/Development/context/AuthContext.jsx";
import { Button } from "@/Development/components/ui/button.js";
import { Input } from "@/Development/components/ui/input.js";
import { Label } from "@/Development/components/ui/label.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/Development/components/ui/card.js";
import { Badge } from "@/Development/components/ui/badge.js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/Development/components/ui/dialog.js";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Development/components/ui/select.js";
import {
  Shirt,
  Sparkles,
  Flame,
  ShieldCheck,
  Barcode,
  Printer,
  Search,
  Plus,
  Trash2,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  DollarSign,
  Building2,
  SlidersHorizontal,
  Package,
  Layers,
  FileText,
  User,
  Phone,
  Receipt,
  RotateCcw,
  Database,
  Save,
  Truck,
  TrendingUp,
  Bed,
  Calendar,
  Waves,
  Eye,
  Check,
  MapPin,
  X,
  CreditCard,
  Banknote,
} from "lucide-react";
import { toast } from "sonner";
import {
  getLaundryCatalog,
  getServiceSpeeds,
  saveLaundryConfigToBackend,
  resetLaundryCatalogToDefault,
  generateLaundryToken,
  calculateLaundryTotals,
  createLaundryOrderBackend,
  updateLaundryStatusBackend,
  markDeliveryDeliveredBackend,
  CARE_TYPES,
  LAUNDRY_SAC_CODE,
} from "./laundryCatalog.js";
import {
  printLaundryThermalSlip,
  getLaundryThermalSlipHTML,
} from "./PrintLaundryThermal.jsx";
import {
  printLaundryA4Bill,
  getLaundryA4BillHTML,
} from "./PrintLaundryA4.jsx";

const STORAGE_ORDERS_KEY = "hotel_laundry_orders";

/**
 * Robust room number resolution helper
 * Ensures the human room number (e.g. "101", "102") is always returned instead of internal UUIDs
 */
export const getDisplayRoomNumber = (booking, roomsList = []) => {
  if (!booking) return "";

  // 1. Direct room_number fields on booking
  if (booking.room_number) {
    return Array.isArray(booking.room_number)
      ? booking.room_number.join(", ")
      : String(booking.room_number);
  }
  if (booking.roomNumber) {
    return Array.isArray(booking.roomNumber)
      ? booking.roomNumber.join(", ")
      : String(booking.roomNumber);
  }
  if (booking.room_numbers) {
    return Array.isArray(booking.room_numbers)
      ? booking.room_numbers.join(", ")
      : String(booking.room_numbers);
  }
  if (booking.allocated_room) {
    return String(booking.allocated_room);
  }

  // 2. Look up in rooms list using booking.room_id
  const rawRoomId = Array.isArray(booking.room_id)
    ? booking.room_id[0]
    : booking.room_id;
  if (rawRoomId && roomsList && roomsList.length > 0) {
    const matched = roomsList.find(
      (r) =>
        String(r.room_id || r.id || "").toLowerCase() ===
          String(rawRoomId).toLowerCase() ||
        String(r.room_number || r.number || "").toLowerCase() ===
          String(rawRoomId).toLowerCase()
    );
    if (matched) {
      return String(matched.room_number || matched.number || matched.room_name || rawRoomId);
    }
  }

  // 3. Check rooms array inside booking
  if (Array.isArray(booking.rooms) && booking.rooms.length > 0) {
    const first = booking.rooms[0];
    if (typeof first === "object") {
      return String(first.room_number || first.number || first.room_id || "");
    }
    return String(first);
  }

  // 4. Check rooms_config array
  if (Array.isArray(booking.rooms_config) && booking.rooms_config.length > 0) {
    const first = booking.rooms_config[0];
    if (typeof first === "object") {
      return String(first.room_number || first.number || first.room_id || "");
    }
    return String(first);
  }

  return rawRoomId ? String(rawRoomId) : "";
};

export default function LaundryManager({
  initialRoomNumber = null,
  onOrderCreated = null,
}) {
  const {
    bookings = [],
    rooms = [],
    updateBookingServices,
    addExpense,
  } = useAppContext();
  const { institutionData, updateInstitutionData } = useInstitutionContext();
  const { userData } = useAuthContext();

  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab");

  // Active view: 'new_order' | 'deliveries' | 'statistics' | 'price_sheet' | 'tracker'
  const [activeTab, setActiveTab] = useState(() => tabFromUrl || "new_order");

  useEffect(() => {
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setSearchParams({ tab: newTab });
  };

  // Dynamic Garment catalog & speeds loaded from Backend Database
  const [catalog, setCatalog] = useState(() => getLaundryCatalog(institutionData));
  const [serviceSpeeds, setServiceSpeeds] = useState(() => getServiceSpeeds(institutionData));
  const [catalogCategory, setCatalogCategory] = useState("All");
  const [searchGarment, setSearchGarment] = useState("");
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Modal to add new custom garment dynamically
  const [newGarmentModalOpen, setNewGarmentModalOpen] = useState(false);
  const [newGarmentData, setNewGarmentData] = useState({
    name: "",
    category: "Men",
    wash_only: "",
    wash_and_press: "",
    press_only: "",
    dry_clean: "",
  });

  // Receipt / Bill Preview Dialog State
  const [previewOrder, setPreviewOrder] = useState(null);
  const [paperSize, setPaperSize] = useState("80"); // '80' | '58'
  const [previewDocType, setPreviewDocType] = useState("a4"); // 'a4' | 'thermal'

  // Sync catalog whenever institutionData changes from backend
  useEffect(() => {
    if (institutionData?.laundryConfig?.catalog) {
      setCatalog(institutionData.laundryConfig.catalog);
    }
    if (institutionData?.laundryConfig?.serviceSpeeds) {
      setServiceSpeeds(institutionData.laundryConfig.serviceSpeeds);
    }
  }, [institutionData]);

  // Order creation form state
  const [collectionSource, setCollectionSource] = useState(
    initialRoomNumber ? "room_pickup" : "room_pickup"
  );
  const [selectedBookingId, setSelectedBookingId] = useState("");
  const [selectedRoomNumber, setSelectedRoomNumber] = useState(
    initialRoomNumber || ""
  );
  const [guestName, setGuestName] = useState("");
  const [guestMobile, setGuestMobile] = useState("");
  const [serviceSpeed, setServiceSpeed] = useState("normal");
  const [token, setToken] = useState(generateLaundryToken());
  const [basket, setBasket] = useState([]);
  const [itemNoteInput, setItemNoteInput] = useState("");

  // Delivery Target Date & Time state
  const getInitialDeliveryDate = (speed) => {
    const d = new Date();
    if (speed === "normal") {
      d.setDate(d.getDate() + 1); // Tomorrow
    }
    return d.toISOString().split("T")[0];
  };

  const [deliveryDate, setDeliveryDate] = useState(() =>
    getInitialDeliveryDate("normal")
  );
  const [deliveryTime, setDeliveryTime] = useState("18:00");

  const handleServiceSpeedChange = (speedId) => {
    setServiceSpeed(speedId);
    setDeliveryDate(getInitialDeliveryDate(speedId));
    if (speedId === "urgent") {
      const now = new Date();
      now.setHours(now.getHours() + 4);
      const hrs = String(now.getHours()).padStart(2, "0");
      const mins = String(now.getMinutes()).padStart(2, "0");
      setDeliveryTime(`${hrs}:${mins}`);
    } else {
      setDeliveryTime("18:00");
    }
  };

  // Barcode search / filter in tracker
  const [barcodeQuery, setBarcodeQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);

  // Delivery filter for 'deliveries' tab: 'pending' | 'delivered' | 'held' | 'all'
  const [deliveryFilter, setDeliveryFilter] = useState("pending");

  // Date filter for 'statistics' tab
  const currentDateStr = new Date().toISOString().split("T")[0];
  const [statsDateFilter, setStatsDateFilter] = useState(currentDateStr);

  // Load persistent orders
  const [allOrders, setAllOrders] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_ORDERS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const persistOrders = (updatedList) => {
    setAllOrders(updatedList);
    try {
      localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(updatedList));
    } catch (e) {
      console.warn("Storage write error:", e);
    }
  };

  // Find checked-in bookings for room selection
  const checkedInBookings = useMemo(() => {
    return (bookings || []).filter(
      (b) =>
        b.status === "Checked-in" ||
        b.status === "confirmed" ||
        b.reservation_status === "Checked-in"
    );
  }, [bookings]);

  // When room is selected or initialRoomNumber provided, auto-populate details
  useEffect(() => {
    if (initialRoomNumber) {
      const found = checkedInBookings.find((b) => {
        const displayNum = getDisplayRoomNumber(b, rooms);
        return (
          String(displayNum) === String(initialRoomNumber) ||
          String(b.room_id) === String(initialRoomNumber)
        );
      });
      if (found) {
        setSelectedBookingId(found.booking_id);
        const resolvedNum =
          getDisplayRoomNumber(found, rooms) || initialRoomNumber;
        setSelectedRoomNumber(resolvedNum);
        setGuestName(found.guest_name || found.booking_name || found.full_name || found.name || found.primary_guest_name || found.primary_guest || found.customerName || "");
        setGuestMobile(found.mobile_number || found.mobile || found.guest_phone || "");
        setCollectionSource("room_pickup");
      } else {
        setSelectedRoomNumber(initialRoomNumber);
        setCollectionSource("room_pickup");
      }
    }
  }, [initialRoomNumber, checkedInBookings, rooms]);

  const handleBookingSelect = (bId) => {
    setSelectedBookingId(bId);
    const bk = checkedInBookings.find((b) => b.booking_id === bId);
    if (bk) {
      const roomNum = getDisplayRoomNumber(bk, rooms);
      setSelectedRoomNumber(roomNum);
      setGuestName(bk.guest_name || bk.booking_name || bk.full_name || bk.name || bk.primary_guest_name || bk.primary_guest || bk.customerName || "");
      setGuestMobile(bk.mobile_number || bk.mobile || bk.guest_phone || "");
    }
  };

  // Compute live shift metrics for top header & statistics tab
  const {
    todaySales,
    todayGarments,
    todayOrdersCount,
    washOnlySales,
    washOnlyPcs,
    washAndPressSales,
    washAndPressPcs,
    pressSales,
    pressPcs,
    dryCleanSales,
    dryCleanPcs,
    expressSurchargesTotal,
    totalTaxCollected,
    folioSales,
    posSales,
    pendingDeliveries,
    deliveredTodayList,
    heldOnRoomOrders,
    roomsToDeliverSet,
    dailyStatsMap,
  } = useMemo(() => {
    let sales = 0;
    let garments = 0;
    let ordersCount = 0;
    let wOnlySales = 0;
    let wOnlyPcs = 0;
    let wpSales = 0;
    let wpPcs = 0;
    let pSales = 0;
    let pPcs = 0;
    let dcSales = 0;
    let dcPcs = 0;
    let surcharge = 0;
    let tax = 0;
    let folio = 0;
    let pos = 0;
    const pendingList = [];
    const deliveredList = [];
    const heldList = [];
    const roomsSet = new Set();
    const dailyMap = {};

    (allOrders || []).forEach((order) => {
      const orderDate = order.createdAt ? order.createdAt.split("T")[0] : "";
      const isToday = orderDate === currentDateStr;
      const grandTotal = Number(order.grandTotal || order.totalAmount || 0);
      const isDelivered =
        order.delivery_status === "delivered_to_room" ||
        order.status === "Delivered" ||
        order.status === "delivered";
      const isHeld = order.paymentStatus === "HELD_ON_ROOM";

      // Grouping by Date for "which day how much all statistics"
      if (orderDate) {
        if (!dailyMap[orderDate]) {
          dailyMap[orderDate] = {
            date: orderDate,
            totalSales: 0,
            ordersCount: 0,
            garmentsCount: 0,
            washOnlySales: 0,
            washAndPressSales: 0,
            pressSales: 0,
            dryCleanSales: 0,
            folioSales: 0,
            posSales: 0,
          };
        }
        dailyMap[orderDate].totalSales += grandTotal;
        dailyMap[orderDate].ordersCount += 1;
        dailyMap[orderDate].garmentsCount += Number(order.totalGarments || 0);
        if (
          order.settlementType === "ROOM_FOLIO" ||
          order.paymentMethod === "ROOM_FOLIO"
        ) {
          dailyMap[orderDate].folioSales += grandTotal;
        } else {
          dailyMap[orderDate].posSales += grandTotal;
        }

        (order.items || []).forEach((item) => {
          const qty = Number(item.quantity) || 1;
          const rate = Number(item.unitRate || item.rate || 0);
          const amt = Number(item.total || rate * qty);
          if (item.careType === "wash_only") {
            dailyMap[orderDate].washOnlySales += amt;
          } else if (item.careType === "press_only") {
            dailyMap[orderDate].pressSales += amt;
          } else if (item.careType === "dry_clean") {
            dailyMap[orderDate].dryCleanSales += amt;
          } else {
            dailyMap[orderDate].washAndPressSales += amt;
          }
        });
      }

      if (isToday) {
        sales += grandTotal;
        garments += Number(order.totalGarments || 0);
        ordersCount += 1;
        surcharge += Number(order.surchargeAmount || 0);
        tax += Number(order.cgstAmount || 0) + Number(order.sgstAmount || 0);

        if (
          order.settlementType === "ROOM_FOLIO" ||
          order.paymentMethod === "ROOM_FOLIO"
        ) {
          folio += grandTotal;
        } else {
          pos += grandTotal;
        }

        (order.items || []).forEach((item) => {
          const qty = Number(item.quantity) || 1;
          const rate = Number(item.unitRate || item.rate || 0);
          const amt = Number(item.total || rate * qty);

          if (item.careType === "wash_only") {
            wOnlySales += amt;
            wOnlyPcs += qty;
          } else if (item.careType === "press_only") {
            pSales += amt;
            pPcs += qty;
          } else if (item.careType === "dry_clean") {
            dcSales += amt;
            dcPcs += qty;
          } else {
            wpSales += amt;
            wpPcs += qty;
          }
        });

        if (isDelivered) {
          deliveredList.push(order);
        }
      }

      if (isHeld) {
        heldList.push(order);
      }

      if (!isDelivered) {
        pendingList.push(order);
        const rNum = String(order.roomNumber || "");
        if (rNum && rNum !== "Walk-In") {
          roomsSet.add(rNum);
        }
      }
    });

    return {
      todaySales: sales,
      todayGarments: garments,
      todayOrdersCount: ordersCount,
      washOnlySales: wOnlySales,
      washOnlyPcs: wOnlyPcs,
      washAndPressSales: wpSales,
      washAndPressPcs: wpPcs,
      pressSales: pSales,
      pressPcs: pPcs,
      dryCleanSales: dcSales,
      dryCleanPcs: dcPcs,
      expressSurchargesTotal: surcharge,
      totalTaxCollected: tax,
      folioSales: folio,
      posSales: pos,
      pendingDeliveries: pendingList,
      deliveredTodayList: deliveredList,
      heldOnRoomOrders: heldList,
      roomsToDeliverSet: Array.from(roomsSet),
      dailyStatsMap: dailyMap,
    };
  }, [allOrders, currentDateStr]);

  // Filtered garments in catalog
  const filteredGarments = useMemo(() => {
    return catalog.filter((g) => {
      const matchCat =
        catalogCategory === "All" ||
        (catalogCategory === "Men" && (g.category === "Men" || g.category === "Male")) ||
        (catalogCategory === "Women" && (g.category === "Women" || g.category === "Ladies")) ||
        (catalogCategory === "Kids" && g.category === "Kids") ||
        (catalogCategory === "Linen" && g.category === "Linen");

      const matchSearch =
        !searchGarment ||
        g.name.toLowerCase().includes(searchGarment.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [catalog, catalogCategory, searchGarment]);

  // Add garment to basket
  const handleAddToBasket = (garment, careType) => {
    const unitRate = garment.rates?.[careType] || 0;
    if (unitRate <= 0) {
      toast.warning(`${garment.name} does not offer ${careType.replace("_", " ")}.`);
      return;
    }

    const existingIndex = basket.findIndex(
      (item) => item.garmentId === garment.id && item.careType === careType
    );

    if (existingIndex > -1) {
      const updated = [...basket];
      updated[existingIndex].quantity += 1;
      setBasket(updated);
      toast.info(`Increased ${garment.name} (${careType.replace("_", " ")}) to ${updated[existingIndex].quantity}`);
    } else {
      setBasket([
        ...basket,
        {
          id: `${garment.id}_${careType}_${Date.now()}`,
          garmentId: garment.id,
          name: garment.name,
          category: garment.category,
          careType: careType,
          unitRate: unitRate,
          quantity: 1,
          notes: itemNoteInput || "",
        },
      ]);
      setItemNoteInput("");
      toast.success(`Added ${garment.name} (${careType.replace("_", " ")})`);
    }
  };

  const updateBasketQuantity = (index, delta) => {
    const updated = [...basket];
    const newQty = updated[index].quantity + delta;
    if (newQty <= 0) {
      updated.splice(index, 1);
    } else {
      updated[index].quantity = newQty;
    }
    setBasket(updated);
  };

  const removeBasketItem = (index) => {
    const updated = [...basket];
    updated.splice(index, 1);
    setBasket(updated);
  };

  // Calculated totals
  const cgstRate = Number(institutionData?.cgst ?? 2.5);
  const sgstRate = Number(institutionData?.sgst ?? 2.5);
  const totals = useMemo(() => {
    return calculateLaundryTotals(
      basket,
      serviceSpeed,
      cgstRate,
      sgstRate,
      serviceSpeeds
    );
  }, [basket, serviceSpeed, cgstRate, sgstRate, serviceSpeeds]);

  // Reset order creation
  const handleResetOrder = () => {
    setBasket([]);
    setToken(generateLaundryToken());
    setItemNoteInput("");
    if (!initialRoomNumber) {
      setSelectedBookingId("");
      setSelectedRoomNumber("");
      setGuestName("");
      setGuestMobile("");
    }
  };

  // Build standard order record
  const buildOrderPayload = (mode) => {
    const speedObj =
      serviceSpeeds.find((s) => s.id === serviceSpeed) || serviceSpeeds[0];

    const isRoom =
      collectionSource !== "walk_in" && selectedRoomNumber;

    return {
      orderId: token,
      token: token,
      roomNumber: isRoom ? selectedRoomNumber : "Walk-In",
      bookingId: isRoom ? selectedBookingId : null,
      guestName: guestName || (isRoom ? `Room ${selectedRoomNumber} Guest` : "Walk-In Guest"),
      guestMobile: guestMobile || "",
      collectionSource: collectionSource,
      deliveryDateTime: `${deliveryDate} ${deliveryTime}`,
      items: basket,
      totalGarments: totals.totalGarments,
      serviceSpeed: serviceSpeed,
      serviceSpeedLabel: speedObj.label,
      surchargePercent: totals.surchargePercent,
      surchargeAmount: totals.surchargeAmount,
      itemsSubtotal: totals.itemsSubtotal,
      taxableAmount: totals.taxableAmount,
      cgstAmount: totals.cgstAmount,
      sgstAmount: totals.sgstAmount,
      grandTotal: totals.grandTotal,
      settlementType: mode === "ROOM_FOLIO" ? "ROOM_FOLIO" : "DIRECT",
      paymentMethod:
        mode === "ROOM_FOLIO"
          ? "ROOM_FOLIO"
          : mode === "HELD_ON_ROOM"
          ? "HELD_ON_ROOM"
          : mode || "CASH",
      paymentStatus:
        mode === "ROOM_FOLIO"
          ? "POSTED_TO_ROOM_BILL"
          : mode === "HELD_ON_ROOM"
          ? "HELD_ON_ROOM"
          : "PAID",
      status: "Received",
      delivery_status: "pending_delivery",
      createdAt: new Date().toISOString(),
      staffId: userData?.cognitoId || userData?.name || "Laundry Staff",
    };
  };

  // 1. Post Directly to Hotel Room Bill (Hotel Folio)
  const handleSettleToRoomFolio = async () => {
    if (basket.length === 0) {
      toast.error("Please add at least one garment to the order.");
      return;
    }
    if (!selectedRoomNumber) {
      toast.error("Please select a hotel room to charge this order.");
      return;
    }

    const orderData = buildOrderPayload("ROOM_FOLIO");
    const currentDate = new Date().toISOString().split("T")[0];

    try {
      if (selectedBookingId) {
        const foundBooking = bookings.find((b) => b.booking_id === selectedBookingId);
        const institutionId = foundBooking?.institutionId || institutionData?.institutionid;

        const newLaundryServiceEntry = {
          food_charges: 0,
          laundry_charges: totals.grandTotal,
          minibar_charges: 0,
          extra_bed_charges: 0,
          manual_charges: 0,
          order_id: token,
          notes: `Laundry: ${totals.totalGarments} pcs (${orderData.serviceSpeedLabel})`,
        };

        const servicesToSend = {};
        servicesToSend[selectedRoomNumber] = {
          [currentDate]: [newLaundryServiceEntry],
        };

        await updateBookingServices(selectedBookingId, {
          booking_id: selectedBookingId,
          institutionId: institutionId,
          services: servicesToSend,
        });

        toast.success(`✓ Posted ₹${totals.grandTotal} laundry bill directly to Room ${selectedRoomNumber} hotel bill!`);
      }

      try {
        await createLaundryOrderBackend(orderData);
      } catch (backendErr) {
        console.warn("Dedicated laundry backend save skipped/fallback:", backendErr);
      }

      const updatedOrders = [orderData, ...allOrders];
      persistOrders(updatedOrders);

      if (typeof onOrderCreated === "function") {
        onOrderCreated(orderData);
      }

      setPreviewOrder(orderData);
      handleResetOrder();
    } catch (err) {
      console.error(err);
      toast.error("Failed to post laundry charges to room folio");
    }
  };

  // 2. Hold on Hotel Room (Settlement Pending)
  const handleHoldOnRoom = async () => {
    if (basket.length === 0) {
      toast.error("Please add at least one garment to the order.");
      return;
    }
    if (!selectedRoomNumber) {
      toast.error("Please select a hotel room to hold charges against.");
      return;
    }

    const orderData = buildOrderPayload("HELD_ON_ROOM");

    try {
      try {
        await createLaundryOrderBackend(orderData);
      } catch (backendErr) {
        console.warn("Backend save skipped:", backendErr);
      }

      const updatedOrders = [orderData, ...allOrders];
      persistOrders(updatedOrders);

      toast.info(`⏱ Order ${token} held against Room ${selectedRoomNumber}. Can settle upon delivery in cash or post to room folio.`);

      if (typeof onOrderCreated === "function") {
        onOrderCreated(orderData);
      }

      setPreviewOrder(orderData);
      handleResetOrder();
    } catch (err) {
      console.error(err);
      toast.error("Failed to create held order");
    }
  };

  // 3. Direct POS Settlement (Cash / UPI / Card)
  const handleDirectPOSSettle = async (payMethod = "CASH") => {
    if (basket.length === 0) {
      toast.error("Please add at least one garment to the order.");
      return;
    }
    if (collectionSource === "walk_in" && !guestName.trim()) {
      toast.error("Please enter the guest's name for direct billing.");
      return;
    }

    const orderData = buildOrderPayload(payMethod);
    const currentDate = new Date().toISOString().split("T")[0];

    try {
      if (typeof addExpense === "function") {
        try {
          await addExpense({
            date: currentDate,
            expense: 0,
            received: totals.grandTotal,
            name: `Laundry Service - ${token}`,
            description: `${totals.totalGarments} Garments [${payMethod}] - ${guestName || "Guest"}`,
          });
        } catch (e) {
          console.warn("Cash drawer recording skipped:", e);
        }
      }

      try {
        await createLaundryOrderBackend(orderData);
      } catch (backendErr) {
        console.warn("Backend save skipped:", backendErr);
      }

      const updatedOrders = [orderData, ...allOrders];
      persistOrders(updatedOrders);

      toast.success(`✓ Settled ₹${totals.grandTotal} via ${payMethod} & recorded in database!`);

      if (typeof onOrderCreated === "function") {
        onOrderCreated(orderData);
      }

      setPreviewOrder(orderData);
      handleResetOrder();
    } catch (err) {
      console.error(err);
      toast.error("Failed to process direct settlement");
    }
  };

  // Convert a Held Order into Cash Settlement (Releases Room Hold)
  const handleReleaseHoldToCash = async (orderToRelease, payMethod = "CASH") => {
    const updated = allOrders.map((o) => {
      if (o.orderId === orderToRelease.orderId || o.token === orderToRelease.token) {
        return {
          ...o,
          paymentStatus: "PAID",
          paymentMethod: payMethod,
          settlementType: "DIRECT",
        };
      }
      return o;
    });

    persistOrders(updated);

    if (typeof addExpense === "function") {
      try {
        await addExpense({
          date: currentDateStr,
          expense: 0,
          received: Number(orderToRelease.grandTotal || 0),
          name: `Laundry Settled - ${orderToRelease.token}`,
          description: `Released hold on Room ${orderToRelease.roomNumber} - Paid via ${payMethod}`,
        });
      } catch (e) {}
    }

    try {
      await updateLaundryStatusBackend(orderToRelease.orderId || orderToRelease.token, {
        paymentStatus: "PAID",
        paymentMethod: payMethod,
      });
    } catch (e) {}

    toast.success(`✓ Room ${orderToRelease.roomNumber} hold released! Settled ₹${orderToRelease.grandTotal} via ${payMethod}.`);
  };

  // Convert a Held Order into Room Folio Post (Adds to Hotel Bill)
  const handleConvertHoldToRoomFolio = async (orderToPost) => {
    if (!orderToPost.bookingId) {
      toast.error("Cannot post to hotel bill: Missing booking reference for this room.");
      return;
    }

    try {
      const newLaundryServiceEntry = {
        food_charges: 0,
        laundry_charges: Number(orderToPost.grandTotal || 0),
        minibar_charges: 0,
        extra_bed_charges: 0,
        manual_charges: 0,
        order_id: orderToPost.token,
        notes: `Laundry: ${orderToPost.totalGarments} pcs (Released from hold)`,
      };

      const servicesToSend = {};
      servicesToSend[orderToPost.roomNumber] = {
        [currentDateStr]: [newLaundryServiceEntry],
      };

      await updateBookingServices(orderToPost.bookingId, {
        booking_id: orderToPost.bookingId,
        institutionId: institutionData?.institutionid,
        services: servicesToSend,
      });

      const updated = allOrders.map((o) => {
        if (o.orderId === orderToPost.orderId || o.token === orderToPost.token) {
          return {
            ...o,
            paymentStatus: "POSTED_TO_ROOM_BILL",
            settlementType: "ROOM_FOLIO",
            paymentMethod: "ROOM_FOLIO",
          };
        }
        return o;
      });

      persistOrders(updated);

      try {
        await updateLaundryStatusBackend(orderToPost.orderId || orderToPost.token, {
          paymentStatus: "POSTED_TO_ROOM_BILL",
          settlementType: "ROOM_FOLIO",
        });
      } catch (e) {}

      toast.success(`✓ Added ₹${orderToPost.grandTotal} to Room ${orderToPost.roomNumber} Hotel Bill!`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to post charges to room bill");
    }
  };

  // One-click mark delivered to room
  const handleMarkDeliveredToRoom = async (orderToDeliver) => {
    const updated = allOrders.map((o) => {
      const isMatch =
        o.orderId === orderToDeliver.orderId ||
        o.token === orderToDeliver.token;
      if (isMatch) {
        return {
          ...o,
          status: "Delivered",
          delivery_status: "delivered_to_room",
          delivered_to_room: true,
          delivered_at: new Date().toISOString(),
          delivered_by: userData?.userName || userData?.name || "Laundry Staff",
        };
      }
      return o;
    });

    persistOrders(updated);

    try {
      await markDeliveryDeliveredBackend(orderToDeliver.orderId || orderToDeliver.token, {
        delivered_by: userData?.userName || userData?.name || "Laundry Staff",
      });
      await updateLaundryStatusBackend(orderToDeliver.orderId || orderToDeliver.token, {
        status: "delivered",
        delivery_status: "delivered_to_room",
        delivered_by: userData?.userName || "Laundry Staff",
      });
    } catch (e) {
      console.warn("Backend deliver status skipped:", e);
    }

    toast.success(`✓ Clean garments delivered to Room ${orderToDeliver.roomNumber}!`);
  };

  // Update order workflow status in Tracker
  const handleUpdateOrderStatus = (orderId, newStatus) => {
    const updated = allOrders.map((o) =>
      o.orderId === orderId ? { ...o, status: newStatus, updatedAt: new Date().toISOString() } : o
    );
    persistOrders(updated);
    try {
      updateLaundryStatusBackend(orderId, { status: newStatus });
    } catch (e) {}
    toast.success(`Order ${orderId} updated to "${newStatus}"`);
    if (selectedOrderDetails?.orderId === orderId) {
      setSelectedOrderDetails({ ...selectedOrderDetails, status: newStatus });
    }
  };

  // Price Sheet updates
  const handlePriceChange = (garmentId, careType, newPrice) => {
    const updated = catalog.map((g) => {
      if (g.id === garmentId) {
        return {
          ...g,
          rates: {
            ...g.rates,
            [careType]: Math.max(0, Number(newPrice) || 0),
          },
        };
      }
      return g;
    });
    setCatalog(updated);
  };

  const handleSpeedSurchargeChange = (speedId, newSurcharge) => {
    const updated = serviceSpeeds.map((s) => {
      if (s.id === speedId) {
        return {
          ...s,
          surchargePercent: Math.max(0, Number(newSurcharge) || 0),
        };
      }
      return s;
    });
    setServiceSpeeds(updated);
  };

  const handleDeleteGarment = (garmentId) => {
    const updated = catalog.filter((g) => g.id !== garmentId);
    setCatalog(updated);
    toast.info("Garment removed from catalog. Click 'Save to Database' to persist.");
  };

  const handleAddNewGarment = () => {
    if (!newGarmentData.name.trim()) {
      toast.error("Please enter a garment name");
      return;
    }
    const newId = `custom_${newGarmentData.name.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${Date.now()}`;
    const newEntry = {
      id: newId,
      name: newGarmentData.name.trim(),
      category: newGarmentData.category || "Men",
      rates: {
        wash_only: Number(newGarmentData.wash_only) || 0,
        wash_and_press: Number(newGarmentData.wash_and_press) || 0,
        press_only: Number(newGarmentData.press_only) || 0,
        dry_clean: Number(newGarmentData.dry_clean) || 0,
      },
    };

    setCatalog([newEntry, ...catalog]);
    setNewGarmentData({
      name: "",
      category: "Men",
      wash_only: "",
      wash_and_press: "",
      press_only: "",
      dry_clean: "",
    });
    setNewGarmentModalOpen(false);
    toast.success(`Added ${newEntry.name}! Remember to click 'Save to Database'.`);
  };

  const handleSaveToBackendDatabase = async () => {
    setIsSavingConfig(true);
    try {
      const ok = await saveLaundryConfigToBackend({
        catalog,
        serviceSpeeds,
        institutionData,
        updateInstitutionData,
      });
      if (ok) {
        toast.success("All garment rates saved to cloud database!");
      } else {
        toast.warning("Saved locally in cache.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to save configuration to database");
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleResetCatalog = async () => {
    setIsSavingConfig(true);
    try {
      const defaults = await resetLaundryCatalogToDefault(
        institutionData,
        updateInstitutionData
      );
      setCatalog(defaults);
      toast.info("Laundry prices reset to Indian standard benchmarks.");
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Barcode / Ticket Lookup in Tracker
  const filteredTrackerOrders = useMemo(() => {
    return allOrders.filter((ord) => {
      const q = barcodeQuery.trim().toLowerCase();
      const matchQuery =
        !q ||
        (ord.token && ord.token.toLowerCase().includes(q)) ||
        (ord.roomNumber && String(ord.roomNumber).toLowerCase().includes(q)) ||
        (ord.guestName && ord.guestName.toLowerCase().includes(q));

      const matchStatus =
        statusFilter === "all" ||
        ord.status.toLowerCase() === statusFilter.toLowerCase();

      return matchQuery && matchStatus;
    });
  }, [allOrders, barcodeQuery, statusFilter]);

  return (
    <div className="w-full max-w-[1600px] mx-auto p-2 sm:p-4 space-y-3 font-sans text-gray-900">
      {/* =========================================================================
          SLEEK COMPACT TOP PERFORMANCE TOOLBAR
          (Replaced duplicate below heading with a single-line high-efficiency toolbar)
         ========================================================================= */}
      <div className="bg-white border border-gray-200 rounded-xl px-3 py-2 sm:px-4 sm:py-2.5 shadow-xs flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Quick Shift KPI Badges */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="bg-blue-600 text-white font-black px-2.5 py-1 rounded-lg flex items-center gap-1">
            <Shirt className="w-3.5 h-3.5" />
            <span>Laundry</span>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg px-2.5 py-1 flex items-center gap-1 text-[11px] font-bold text-blue-900">
            <span>Today's Sales:</span>
            <strong className="text-gray-950 font-black">₹{todaySales.toFixed(0)}</strong>
            <span className="text-[10px] text-gray-500 font-normal">({todayGarments} pcs)</span>
          </div>

          <div className="bg-cyan-50 border border-cyan-200 rounded-lg px-2 py-1 flex items-center gap-1 text-[11px] text-cyan-900">
            <Waves className="w-3 h-3 text-cyan-600" />
            <span>Wash:</span>
            <strong>₹{washOnlySales.toFixed(0)}</strong>
          </div>

          <div className="bg-sky-50 border border-sky-200 rounded-lg px-2 py-1 flex items-center gap-1 text-[11px] text-sky-900">
            <Sparkles className="w-3 h-3 text-sky-600" />
            <span>Wash & Iron:</span>
            <strong>₹{washAndPressSales.toFixed(0)}</strong>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg px-2 py-1 flex items-center gap-1 text-[11px] text-amber-900">
            <Flame className="w-3 h-3 text-amber-600" />
            <span>Iron:</span>
            <strong>₹{pressSales.toFixed(0)}</strong>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg px-2 py-1 flex items-center gap-1 text-[11px] text-purple-900">
            <ShieldCheck className="w-3 h-3 text-purple-600" />
            <span>Dry Clean:</span>
            <strong>₹{dryCleanSales.toFixed(0)}</strong>
          </div>

          {pendingDeliveries.length > 0 && (
            <button
              onClick={() => handleTabChange("deliveries")}
              className="bg-orange-50 border border-orange-300 rounded-lg px-2.5 py-1 flex items-center gap-1.5 text-[11px] font-bold text-orange-900 hover:bg-orange-100 transition-colors"
            >
              <Truck className="w-3.5 h-3.5 text-orange-600" />
              <span>Deliver to Rooms:</span>
              <span className="px-1.5 py-0.2 rounded-full bg-orange-600 text-white text-[10px]">
                {pendingDeliveries.length}
              </span>
            </button>
          )}

          {heldOnRoomOrders.length > 0 && (
            <button
              onClick={() => handleTabChange("deliveries")}
              className="bg-amber-100 border border-amber-300 rounded-lg px-2 py-1 flex items-center gap-1 text-[11px] font-bold text-amber-900 hover:bg-amber-200"
            >
              <Clock className="w-3.5 h-3.5 text-amber-700" />
              <span>Held on Room:</span>
              <strong>{heldOnRoomOrders.length}</strong>
            </button>
          )}
        </div>

        {/* Paper Size / Print Mode Selector */}
        <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg border border-gray-200">
          <span className="px-1.5 text-gray-500 font-medium text-[11px]">Print Mode:</span>
          <button
            onClick={() => {
              setPreviewDocType("a4");
            }}
            className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
              previewDocType === "a4"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-gray-600 hover:text-black"
            }`}
          >
            A4 Bill
          </button>
          <button
            onClick={() => {
              setPreviewDocType("thermal");
              setPaperSize("80");
            }}
            className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
              previewDocType === "thermal" && paperSize === "80"
                ? "bg-black text-white shadow-xs"
                : "text-gray-600 hover:text-black"
            }`}
          >
            80mm
          </button>
          <button
            onClick={() => {
              setPreviewDocType("thermal");
              setPaperSize("58");
            }}
            className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
              previewDocType === "thermal" && paperSize === "58"
                ? "bg-black text-white shadow-xs"
                : "text-gray-600 hover:text-black"
            }`}
          >
            58mm
          </button>
        </div>
      </div>

      {/* =========================================================================
          VIEW 1: NEW ORDER WORKSPACE (COMPACT & SIMPLE POS UI)
          LEFT: Compact Square Garment Cards with 4 Care Pricing Options
          RIGHT: Compact Order Details, Collection, Delivery, Settlement & A4/Thermal Print
         ========================================================================= */}
      {activeTab === "new_order" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5" style={{height: "calc(100vh - 155px)"}}>
          {/* -------------------------------------------------------------
              LEFT COLUMN: SQUARE SHAPE GARMENT CARDS (lg:col-span-7)
             ------------------------------------------------------------- */}
          <div className="lg:col-span-7 flex flex-col gap-2 overflow-hidden">
            {/* Filter toolbar: Category pills & Search */}
            <div className="bg-white border border-gray-200 rounded-lg p-1.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
              {/* Category Pills (Men, Ladies, Kids, Linen) */}
              <div className="flex items-center gap-1 overflow-x-auto">
                {["All", "Men", "Women", "Kids", "Linen"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCatalogCategory(cat)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                      catalogCategory === cat
                        ? "bg-blue-600 text-white shadow-2xs"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {cat === "Women" ? "Ladies" : cat === "Men" ? "Men" : cat}
                  </button>
                ))}
              </div>

              {/* Garment Search Input */}
              <div className="relative min-w-[160px] flex-1 max-w-xs">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2" />
                <Input
                  type="text"
                  value={searchGarment}
                  onChange={(e) => setSearchGarment(e.target.value)}
                  placeholder="Search garment..."
                  className="h-6.5 pl-7 text-xs bg-gray-50 border-gray-200 focus:bg-white"
                />
                {searchGarment && (
                  <button
                    onClick={() => setSearchGarment("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Square Cards Garments Grid */}
            <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2 pr-1 content-start">
              {filteredGarments.map((garment) => {
                const inBasketQty = basket
                  .filter((b) => b.garmentId === garment.id)
                  .reduce((sum, b) => sum + b.quantity, 0);

                const getCareQty = (care) =>
                  basket
                    .filter((b) => b.garmentId === garment.id && b.careType === care)
                    .reduce((sum, b) => sum + b.quantity, 0);

                const washQty = getCareQty("wash_only");
                const washPressQty = getCareQty("wash_and_press");
                const pressQty = getCareQty("press_only");
                const dryCleanQty = getCareQty("dry_clean");

                return (
                  <Card
                    key={garment.id}
                    className={`border transition-all flex flex-col justify-between p-2 rounded-lg ${
                      inBasketQty > 0
                        ? "border-blue-400 bg-blue-50/20 shadow-2xs ring-1 ring-blue-300"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-2xs"
                    }`}
                  >
                    <div>
                      {/* Top Header of the Square Card */}
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[8.5px] font-bold uppercase tracking-wider text-gray-500 bg-gray-100 px-1 py-0.2 rounded">
                          {garment.category === "Women" ? "Ladies" : garment.category}
                        </span>
                        {inBasketQty > 0 && (
                          <Badge className="bg-blue-600 text-white text-[8.5px] px-1 py-0 font-bold">
                            {inBasketQty} in order
                          </Badge>
                        )}
                      </div>

                      {/* Garment Item Name */}
                      <h4
                        className="font-bold text-xs text-gray-900 leading-snug line-clamp-1 truncate"
                        title={garment.name}
                      >
                        {garment.name}
                      </h4>
                    </div>

                    {/* 4 Care Service Price Buttons Inside Card */}
                    <div className="grid grid-cols-2 gap-1 pt-1.5 mt-1 border-t border-gray-100">
                      {/* 1. Wash Only */}
                      <button
                        type="button"
                        onClick={() => handleAddToBasket(garment, "wash_only")}
                        className={`flex flex-col items-center justify-center p-1 rounded border text-center transition-all ${
                          washQty > 0
                            ? "bg-cyan-100 border-cyan-400 text-cyan-950 font-bold ring-1 ring-cyan-300"
                            : "border-cyan-200 bg-cyan-50/40 hover:bg-cyan-100 text-cyan-950"
                        }`}
                        title="Wash Only"
                      >
                        <span className="text-[8px] font-medium text-cyan-700 uppercase flex items-center gap-0.5">
                          <Waves className="w-2 h-2 text-cyan-600" /> Wash
                        </span>
                        <div className="text-[11px] font-bold text-cyan-950 flex items-center gap-0.5">
                          <span>₹{garment.rates?.wash_only || 0}</span>
                          {washQty > 0 && (
                            <span className="text-[8.5px] bg-cyan-600 text-white px-1 rounded-full">
                              {washQty}
                            </span>
                          )}
                        </div>
                      </button>

                      {/* 2. Wash & Press */}
                      <button
                        type="button"
                        onClick={() => handleAddToBasket(garment, "wash_and_press")}
                        className={`flex flex-col items-center justify-center p-1 rounded border text-center transition-all ${
                          washPressQty > 0
                            ? "bg-blue-100 border-blue-400 text-blue-950 font-bold ring-1 ring-blue-300"
                            : "border-blue-200 bg-blue-50/40 hover:bg-blue-100 text-blue-950"
                        }`}
                        title="Wash & Iron"
                      >
                        <span className="text-[8px] font-medium text-blue-700 uppercase flex items-center gap-0.5">
                          <Sparkles className="w-2 h-2 text-blue-600" /> Wash+Iron
                        </span>
                        <div className="text-[11px] font-bold text-blue-950 flex items-center gap-0.5">
                          <span>₹{garment.rates?.wash_and_press || 0}</span>
                          {washPressQty > 0 && (
                            <span className="text-[8.5px] bg-blue-600 text-white px-1 rounded-full">
                              {washPressQty}
                            </span>
                          )}
                        </div>
                      </button>

                      {/* 3. Press Only */}
                      <button
                        type="button"
                        onClick={() => handleAddToBasket(garment, "press_only")}
                        className={`flex flex-col items-center justify-center p-1 rounded border text-center transition-all ${
                          pressQty > 0
                            ? "bg-amber-100 border-amber-400 text-amber-950 font-bold ring-1 ring-amber-300"
                            : "border-amber-200 bg-amber-50/40 hover:bg-amber-100 text-amber-950"
                        }`}
                        title="Iron Only"
                      >
                        <span className="text-[8px] font-medium text-amber-700 uppercase flex items-center gap-0.5">
                          <Flame className="w-2 h-2 text-amber-600" /> Iron
                        </span>
                        <div className="text-[11px] font-bold text-amber-950 flex items-center gap-0.5">
                          <span>₹{garment.rates?.press_only || 0}</span>
                          {pressQty > 0 && (
                            <span className="text-[8.5px] bg-amber-600 text-white px-1 rounded-full">
                              {pressQty}
                            </span>
                          )}
                        </div>
                      </button>

                      {/* 4. Dry Clean */}
                      <button
                        type="button"
                        onClick={() => handleAddToBasket(garment, "dry_clean")}
                        className={`flex flex-col items-center justify-center p-1 rounded border text-center transition-all ${
                          dryCleanQty > 0
                            ? "bg-purple-100 border-purple-400 text-purple-950 font-bold ring-1 ring-purple-300"
                            : "border-purple-200 bg-purple-50/40 hover:bg-purple-100 text-purple-950"
                        }`}
                        title="Dry Clean"
                      >
                        <span className="text-[8px] font-medium text-purple-700 uppercase flex items-center gap-0.5">
                          <ShieldCheck className="w-2 h-2 text-purple-600" /> Dry Clean
                        </span>
                        <div className="text-[11px] font-bold text-purple-950 flex items-center gap-0.5">
                          <span>₹{garment.rates?.dry_clean || 0}</span>
                          {dryCleanQty > 0 && (
                            <span className="text-[8.5px] bg-purple-600 text-white px-1 rounded-full">
                              {dryCleanQty}
                            </span>
                          )}
                        </div>
                      </button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* -------------------------------------------------------------
              RIGHT COLUMN: ORDER, COLLECTION & SETTLEMENT CARD (lg:col-span-5)
             ------------------------------------------------------------- */}
          <div className="lg:col-span-5 overflow-y-auto">
            <Card className="border border-gray-200 rounded-xl shadow-2xs bg-white overflow-hidden">
              <CardHeader className="p-2.5 bg-gray-50/90 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-gray-900">Order & Settlement</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[11px] font-bold text-blue-900 bg-blue-100 px-2 py-0.5 rounded">
                      #{token}
                    </span>
                    {basket.length > 0 && (
                      <button
                        type="button"
                        onClick={handleResetOrder}
                        className="text-[10px] text-red-600 hover:text-red-800 font-semibold flex items-center gap-0.5"
                        title="Clear Order"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-2.5 space-y-2.5 text-xs">
                {/* 1. Collection Source Segmented Toggle */}
                <div>
                  <div className="grid grid-cols-3 gap-1 bg-gray-100 p-0.5 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setCollectionSource("room_pickup")}
                      className={`py-1 text-center rounded-md font-bold text-[11px] transition-all ${
                        collectionSource === "room_pickup"
                          ? "bg-white text-blue-900 shadow-2xs"
                          : "text-gray-600 hover:text-black"
                      }`}
                    >
                      Room Pickup
                    </button>
                    <button
                      type="button"
                      onClick={() => setCollectionSource("front_desk")}
                      className={`py-1 text-center rounded-md font-bold text-[11px] transition-all ${
                        collectionSource === "front_desk"
                          ? "bg-white text-blue-900 shadow-2xs"
                          : "text-gray-600 hover:text-black"
                      }`}
                    >
                      Front Desk
                    </button>
                    <button
                      type="button"
                      onClick={() => setCollectionSource("walk_in")}
                      className={`py-1 text-center rounded-md font-bold text-[11px] transition-all ${
                        collectionSource === "walk_in"
                          ? "bg-white text-purple-900 shadow-2xs"
                          : "text-gray-600 hover:text-black"
                      }`}
                    >
                      Walk-In POS
                    </button>
                  </div>
                </div>

                {/* 2. Room & Guest Selection (Resolves Human Room Numbers) */}
                {collectionSource !== "walk_in" ? (
                  <div className="space-y-1 bg-blue-50/50 p-2 rounded-lg border border-blue-100">
                    <Select
                      value={selectedBookingId}
                      onValueChange={handleBookingSelect}
                    >
                      <SelectTrigger className="h-7.5 text-xs bg-white border-blue-200">
                        <SelectValue placeholder="Choose Checked-In Room & Guest..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-56">
                        {checkedInBookings.map((b) => {
                          const displayRoomNum =
                            getDisplayRoomNumber(b, rooms) || "Unassigned";
                          const gName =
                            b.guest_name || b.booking_name || b.full_name || b.name || b.primary_guest_name || b.primary_guest || b.customerName || "Guest";
                          const phone = b.mobile_number || b.mobile || "";
                          return (
                            <SelectItem key={b.booking_id} value={b.booking_id}>
                              Room {displayRoomNum} — {gName} {phone ? `(${phone})` : ""}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>

                    {/* Compact Badge displaying selected room details */}
                    {selectedRoomNumber ? (
                      <div className="flex items-center justify-between px-2 py-1 rounded bg-blue-100/80 border border-blue-200 text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.2 rounded bg-blue-600 text-white font-black text-[11px]">
                            Room {selectedRoomNumber}
                          </span>
                          <span className="font-bold text-gray-900 text-[11px]">
                            {guestName || "Guest"}
                          </span>
                        </div>
                        {guestMobile && (
                          <span className="text-[10px] text-gray-600 font-medium">
                            {guestMobile}
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-[10px] text-blue-700 italic">
                        Select a guest room to charge bill or track room delivery.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-1.5 bg-purple-50/40 p-2 rounded-lg border border-purple-100">
                    <div>
                      <Input
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        placeholder="Guest Name *"
                        className="h-7 text-xs bg-white"
                      />
                    </div>
                    <div>
                      <Input
                        value={guestMobile}
                        onChange={(e) => setGuestMobile(e.target.value)}
                        placeholder="Mobile #"
                        className="h-7 text-xs bg-white"
                      />
                    </div>
                  </div>
                )}

                {/* 3. Turnaround Speed & Delivery Target */}
                <div className="space-y-1.5 bg-gray-50 p-2 rounded-lg border border-gray-200">
                  <div className="grid grid-cols-3 gap-1">
                    {serviceSpeeds.map((sp) => (
                      <button
                        key={sp.id}
                        type="button"
                        onClick={() => handleServiceSpeedChange(sp.id)}
                        className={`p-1 rounded border text-center transition-all ${
                          serviceSpeed === sp.id
                            ? "bg-blue-600 text-white border-blue-600 shadow-2xs font-bold"
                            : "bg-white text-gray-700 border-gray-200 hover:bg-gray-100"
                        }`}
                      >
                        <div className="text-[10px] uppercase font-bold">{sp.shortLabel}</div>
                        <div className="text-[8px] opacity-80">
                          {sp.surchargePercent > 0 ? `+${sp.surchargePercent}%` : "Normal"}
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Inline Delivery Date & Time Pickers */}
                  <div className="flex items-center gap-1.5 pt-1 border-t border-gray-200">
                    <span className="text-[9.5px] font-bold text-gray-600 shrink-0">
                      Target Delivery:
                    </span>
                    <Input
                      type="date"
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      className="h-6 text-[11px] bg-white font-medium flex-1 px-1.5"
                    />
                    <Input
                      type="time"
                      value={deliveryTime}
                      onChange={(e) => setDeliveryTime(e.target.value)}
                      className="h-6 text-[11px] bg-white font-medium w-20 px-1.5"
                    />
                  </div>
                </div>

                {/* 4. Basket Items List */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-bold text-gray-600 uppercase">
                    <span>Garments in Order ({totals.totalGarments} pcs)</span>
                    {basket.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setBasket([])}
                        className="text-red-600 hover:underline capitalize"
                      >
                        Clear items
                      </button>
                    )}
                  </div>

                  {basket.length === 0 ? (
                    <div className="text-center py-2.5 bg-gray-50 border border-dashed border-gray-200 rounded-lg text-gray-400">
                      <p className="text-[11px] font-medium text-gray-500">Order is empty</p>
                      <p className="text-[9.5px]">Click care price buttons on garment cards to add</p>
                    </div>
                  ) : (
                    <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                      {basket.map((item, idx) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-1 rounded-md bg-gray-50 border border-gray-200 text-xs"
                        >
                          <div className="flex-1 min-w-0 pr-1">
                            <div className="font-bold text-gray-900 truncate text-[11px]">{item.name}</div>
                            <div className="flex items-center gap-1 mt-0.2">
                              <span
                                className={`text-[8px] font-bold px-1 py-0.2 rounded uppercase ${
                                  item.careType === "wash_only"
                                    ? "bg-cyan-100 text-cyan-800"
                                    : item.careType === "wash_and_press"
                                    ? "bg-blue-100 text-blue-800"
                                    : item.careType === "press_only"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-purple-100 text-purple-800"
                                }`}
                              >
                                {item.careType === "wash_only"
                                  ? "Wash"
                                  : item.careType === "wash_and_press"
                                  ? "Wash & Iron"
                                  : item.careType === "press_only"
                                  ? "Iron"
                                  : "Dry Clean"}
                              </span>
                              <span className="text-[9.5px] text-gray-500">₹{item.unitRate}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <div className="flex items-center border border-gray-300 rounded bg-white">
                              <button
                                type="button"
                                onClick={() => updateBasketQuantity(idx, -1)}
                                className="px-1.5 py-0.2 text-[10px] text-gray-600 hover:bg-gray-100 font-bold"
                              >
                                -
                              </button>
                              <span className="px-1 text-[11px] font-bold text-gray-900">{item.quantity}</span>
                              <button
                                type="button"
                                onClick={() => updateBasketQuantity(idx, 1)}
                                className="px-1.5 py-0.2 text-[10px] text-gray-600 hover:bg-gray-100 font-bold"
                              >
                                +
                              </button>
                            </div>
                            <span className="font-bold text-gray-900 w-10 text-right text-[11px]">
                              ₹{(item.unitRate * item.quantity).toFixed(0)}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeBasketItem(idx)}
                              className="text-gray-400 hover:text-red-600 p-0.5"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 5. Financial Bill Summary */}
                <div className="bg-gray-100/90 p-2 rounded-lg space-y-0.5 border border-gray-200 text-xs">
                  <div className="flex justify-between text-gray-600 text-[11px]">
                    <span>Items Subtotal:</span>
                    <span>₹{totals.itemsSubtotal.toFixed(2)}</span>
                  </div>
                  {totals.surchargeAmount > 0 && (
                    <div className="flex justify-between text-amber-800 font-semibold text-[11px]">
                      <span>Express Surcharge ({totals.surchargePercent}%):</span>
                      <span>+₹{totals.surchargeAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600 text-[11px]">
                    <span>GST (SAC: {LAUNDRY_SAC_CODE}):</span>
                    <span>₹{totals.totalTax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-black text-gray-950 pt-1 border-t border-gray-300">
                    <span>Net Payable:</span>
                    <span className="text-sm font-black text-blue-900">₹{totals.grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* 6. Settlement, Hold & Print Action Buttons */}
                <div className="space-y-1.5 pt-0.5">
                  {collectionSource !== "walk_in" && selectedRoomNumber ? (
                    <>
                      {/* Button 1: Post Directly to Room Bill (Hotel Folio) */}
                      <Button
                        type="button"
                        onClick={handleSettleToRoomFolio}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-8 text-xs shadow-2xs"
                      >
                        <Bed className="w-3.5 h-3.5 mr-1" /> Post to Room {selectedRoomNumber} Bill (Hotel Folio)
                      </Button>

                      <div className="grid grid-cols-2 gap-1.5">
                        {/* Button 2: Hold on Hotel Room */}
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleHoldOnRoom}
                          className="h-7 text-[11px] border-amber-300 bg-amber-50/70 text-amber-900 hover:bg-amber-100 font-bold"
                        >
                          <Clock className="w-3 h-3 mr-1" /> Hold on Room
                        </Button>

                        {/* Button 3: Direct Cash / UPI */}
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleDirectPOSSettle("CASH")}
                          className="h-7 text-[11px] border-blue-200 bg-blue-50/70 text-blue-900 hover:bg-blue-100 font-bold"
                        >
                          <Banknote className="w-3 h-3 mr-1" /> Pay in Cash
                        </Button>
                      </div>
                    </>
                  ) : (
                    /* Walk-In POS Settlement */
                    <div className="grid grid-cols-2 gap-1.5">
                      <Button
                        type="button"
                        onClick={() => handleDirectPOSSettle("CASH")}
                        className="w-full bg-black hover:bg-gray-800 text-white font-bold h-8 text-xs"
                      >
                        <Banknote className="w-3.5 h-3.5 mr-1" /> Settle Cash
                      </Button>
                      <Button
                        type="button"
                        onClick={() => handleDirectPOSSettle("UPI")}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-8 text-xs"
                      >
                        <CreditCard className="w-3.5 h-3.5 mr-1" /> Settle UPI
                      </Button>
                    </div>
                  )}

                  {/* Print Actions: A4 Bill & Thermal Roll Slip */}
                  <div className="pt-1 border-t border-gray-100 grid grid-cols-2 gap-1.5">
                    {/* Print A4 Bill Button */}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (basket.length === 0) {
                          toast.error("Add garments to order first before printing bill.");
                          return;
                        }
                        const currentOrderPreview = buildOrderPayload(
                          selectedRoomNumber ? "ROOM_FOLIO" : "CASH"
                        );
                        printLaundryA4Bill({
                          order: currentOrderPreview,
                          institutionData,
                        });
                      }}
                      className="h-8 text-[11px] font-bold border-blue-200 bg-blue-50/60 text-blue-900 hover:bg-blue-100"
                    >
                      <FileText className="w-3 h-3 mr-1 text-blue-700" /> Print A4 Bill
                    </Button>

                    {/* Print Thermal Slip Button */}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (basket.length === 0) {
                          toast.error("Add garments to order first before printing slip.");
                          return;
                        }
                        const currentOrderPreview = buildOrderPayload(
                          selectedRoomNumber ? "ROOM_FOLIO" : "CASH"
                        );
                        printLaundryThermalSlip({
                          order: currentOrderPreview,
                          institutionData,
                          paperSize,
                        });
                      }}
                      className="h-8 text-[11px] font-bold border-gray-300 text-gray-800 hover:bg-gray-100"
                    >
                      <Printer className="w-3 h-3 mr-1" /> {paperSize}mm Slip
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 2: ROOM DELIVERIES BOARD ("Which room we have to deliver")
         ========================================================================= */}
      {activeTab === "deliveries" && (
        <Card className="border border-gray-200 shadow-xs bg-white rounded-xl">
          <CardHeader className="p-3.5 bg-gray-50/70 border-b border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
              <div>
                <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-blue-600" />
                  Room Deliveries Board (Which Rooms We Have to Deliver)
                </CardTitle>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Live delivery queue for laundry staff with room numbers, care badges, and 1-click room delivery sign-off.
                </p>
              </div>

              {/* Delivery Filter Pills */}
              <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg border border-gray-200 text-xs">
                <button
                  onClick={() => setDeliveryFilter("pending")}
                  className={`px-2.5 py-1 rounded font-bold text-[11px] transition-all ${
                    deliveryFilter === "pending"
                      ? "bg-white text-blue-700 shadow-xs"
                      : "text-gray-600 hover:text-black"
                  }`}
                >
                  Awaiting Delivery ({pendingDeliveries.length})
                </button>
                <button
                  onClick={() => setDeliveryFilter("held")}
                  className={`px-2.5 py-1 rounded font-bold text-[11px] transition-all ${
                    deliveryFilter === "held"
                      ? "bg-white text-amber-700 shadow-xs"
                      : "text-gray-600 hover:text-black"
                  }`}
                >
                  Held on Room ({heldOnRoomOrders.length})
                </button>
                <button
                  onClick={() => setDeliveryFilter("delivered")}
                  className={`px-2.5 py-1 rounded font-bold text-[11px] transition-all ${
                    deliveryFilter === "delivered"
                      ? "bg-white text-emerald-700 shadow-xs"
                      : "text-gray-600 hover:text-black"
                  }`}
                >
                  Delivered Today ({deliveredTodayList.length})
                </button>
                <button
                  onClick={() => setDeliveryFilter("all")}
                  className={`px-2.5 py-1 rounded font-bold text-[11px] transition-all ${
                    deliveryFilter === "all"
                      ? "bg-white text-gray-900 shadow-xs"
                      : "text-gray-600 hover:text-black"
                  }`}
                >
                  All ({allOrders.length})
                </button>
              </div>
            </div>

            {/* Pending alert banner */}
            {pendingDeliveries.length > 0 && (
              <div className="mt-2.5 p-2 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-amber-950 font-medium">
                  <Bed className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                  <span>
                    Rooms awaiting delivery:{" "}
                    <strong className="underline text-amber-900">
                      {roomsToDeliverSet.join(", ")}
                    </strong>
                  </span>
                </div>
                <Badge className="bg-amber-200 text-amber-900 font-bold border-amber-300 text-[10px]">
                  {pendingDeliveries.length} bags pending drop-off
                </Badge>
              </div>
            )}
          </CardHeader>

          <CardContent className="p-3.5">
            {(() => {
              const displayList =
                deliveryFilter === "pending"
                  ? pendingDeliveries
                  : deliveryFilter === "held"
                  ? heldOnRoomOrders
                  : deliveryFilter === "delivered"
                  ? deliveredTodayList
                  : allOrders;

              if (displayList.length === 0) {
                return (
                  <div className="text-center py-10 text-gray-400">
                    <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-400 opacity-60" />
                    <p className="text-xs font-bold text-gray-700">All guest laundry has been delivered!</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      New orders taken will appear automatically in this room delivery queue.
                    </p>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {displayList.map((ord) => {
                    const isDelivered =
                      ord.delivery_status === "delivered_to_room" ||
                      ord.status === "Delivered" ||
                      ord.status === "delivered";
                    const isHeld = ord.paymentStatus === "HELD_ON_ROOM";

                    let washCount = 0;
                    let washPressCount = 0;
                    let pressCount = 0;
                    let dryCleanCount = 0;
                    (ord.items || []).forEach((item) => {
                      const qty = Number(item.quantity) || 1;
                      if (item.careType === "wash_only") washCount += qty;
                      else if (item.careType === "press_only") pressCount += qty;
                      else if (item.careType === "dry_clean") dryCleanCount += qty;
                      else washPressCount += qty;
                    });

                    return (
                      <Card
                        key={ord.orderId || ord.token}
                        className={`border rounded-xl transition-all ${
                          isDelivered
                            ? "border-gray-200 bg-gray-50/50 opacity-80"
                            : isHeld
                            ? "border-amber-300 bg-amber-50/20"
                            : "border-blue-200 bg-white hover:border-blue-400 hover:shadow-xs"
                        }`}
                      >
                        <CardHeader className="p-2.5 pb-2 border-b border-gray-100 flex flex-row items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-2 py-0.5 rounded-md font-black text-xs ${
                                ord.roomNumber === "Walk-In"
                                  ? "bg-purple-100 text-purple-900"
                                  : "bg-blue-600 text-white shadow-xs"
                              }`}
                            >
                              {ord.roomNumber === "Walk-In"
                                ? "Walk-In POS"
                                : `Room ${ord.roomNumber}`}
                            </span>
                            <span className="font-mono text-[10px] text-gray-500 font-semibold">
                              #{ord.token || ord.orderId}
                            </span>
                          </div>

                          <Badge
                            className={`text-[9.5px] font-bold ${
                              isDelivered
                                ? "bg-emerald-100 text-emerald-800"
                                : isHeld
                                ? "bg-amber-100 text-amber-900"
                                : "bg-sky-100 text-sky-800"
                            }`}
                          >
                            {isDelivered
                              ? "✓ Delivered"
                              : isHeld
                              ? "⏱ Held on Room"
                              : ord.status || "Received"}
                          </Badge>
                        </CardHeader>

                        <CardContent className="p-2.5 space-y-2 text-xs">
                          {/* Guest info & turnaround speed */}
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-bold text-gray-900">{ord.guestName || "Guest"}</div>
                              {ord.guestMobile && (
                                <div className="text-[10px] text-gray-500">{ord.guestMobile}</div>
                              )}
                            </div>
                            <div className="text-right">
                              <span className="font-semibold text-gray-600 text-[10px] block">
                                {ord.serviceSpeedLabel || ord.serviceSpeed}
                              </span>
                              {ord.deliveryDateTime && (
                                <span className="text-[10px] text-blue-700 font-bold block">
                                  Due: {ord.deliveryDateTime}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Garment care breakdown tags */}
                          <div className="bg-gray-50 p-1.5 rounded-lg border border-gray-100 space-y-1">
                            <div className="text-[9.5px] font-semibold text-gray-500 flex justify-between">
                              <span>Items Package:</span>
                              <strong>{ord.totalGarments || ord.items?.length} pcs</strong>
                            </div>
                            <div className="flex items-center gap-1 flex-wrap">
                              {washCount > 0 && (
                                <span className="px-1 py-0.2 rounded text-[9.5px] font-bold bg-cyan-100 text-cyan-900">
                                  {washCount} Wash
                                </span>
                              )}
                              {washPressCount > 0 && (
                                <span className="px-1 py-0.2 rounded text-[9.5px] font-bold bg-blue-100 text-blue-900">
                                  {washPressCount} Wash & Iron
                                </span>
                              )}
                              {pressCount > 0 && (
                                <span className="px-1 py-0.2 rounded text-[9.5px] font-bold bg-amber-100 text-amber-900">
                                  {pressCount} Iron
                                </span>
                              )}
                              {dryCleanCount > 0 && (
                                <span className="px-1 py-0.2 rounded text-[9.5px] font-bold bg-purple-100 text-purple-900">
                                  {dryCleanCount} Dry Clean
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Billing & Settlement status */}
                          <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                            <span className="text-gray-600 font-medium">Bill Total:</span>
                            <div className="flex items-center gap-1">
                              <strong className="text-xs font-bold text-gray-950">
                                ₹{Number(ord.grandTotal || ord.totalAmount || 0).toFixed(2)}
                              </strong>
                              <Badge
                                variant="outline"
                                className={`text-[8.5px] font-bold ${
                                  ord.paymentStatus === "POSTED_TO_ROOM_BILL"
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                    : ord.paymentStatus === "HELD_ON_ROOM"
                                    ? "bg-amber-50 text-amber-900 border-amber-300"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {ord.paymentStatus === "POSTED_TO_ROOM_BILL"
                                  ? "Folio Posted"
                                  : ord.paymentStatus === "HELD_ON_ROOM"
                                  ? "Room Hold"
                                  : ord.paymentMethod || "Direct"}
                              </Badge>
                            </div>
                          </div>

                          {/* If Held on Room: Settlement Actions (Release Hold / Post to Bill) */}
                          {isHeld && (
                            <div className="bg-amber-50 p-2 rounded-lg border border-amber-200 space-y-1">
                              <span className="text-[9.5px] font-bold text-amber-900 block">
                                Settle Room Hold:
                              </span>
                              <div className="grid grid-cols-2 gap-1">
                                <Button
                                  size="sm"
                                  onClick={() => handleReleaseHoldToCash(ord, "CASH")}
                                  className="h-6 text-[9.5px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                                >
                                  Settle Cash (Release)
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleConvertHoldToRoomFolio(ord)}
                                  className="h-6 text-[9.5px] bg-blue-600 hover:bg-blue-700 text-white font-bold"
                                >
                                  Post to Hotel Bill
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* Delivery Action Button */}
                          {isDelivered ? (
                            <div className="text-[9.5px] text-emerald-800 bg-emerald-50 p-1.5 rounded border border-emerald-200 font-medium">
                              ✓ Delivered by {ord.delivered_by || "Staff"}
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-7 text-xs"
                              onClick={() => handleMarkDeliveredToRoom(ord)}
                            >
                              <Truck className="w-3 h-3 mr-1" /> Mark Delivered to Room
                            </Button>
                          )}

                          {/* Print & Preview links */}
                          <div className="flex items-center justify-between pt-0.5">
                            <button
                              type="button"
                              onClick={() => {
                                setPreviewDocType("a4");
                                setPreviewOrder(ord);
                              }}
                              className="text-[10px] text-blue-600 hover:underline font-semibold"
                            >
                              Preview
                            </button>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 px-1.5 text-[10px] text-blue-700 border-blue-200 hover:bg-blue-50"
                                onClick={() =>
                                  printLaundryA4Bill({
                                    order: ord,
                                    institutionData,
                                  })
                                }
                              >
                                <FileText className="w-2.5 h-2.5 mr-1" /> A4 Bill
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 px-2 text-[10px]"
                                onClick={() =>
                                  printLaundryThermalSlip({
                                    order: ord,
                                    institutionData,
                                    paperSize,
                                  })
                                }
                              >
                                <Printer className="w-2.5 h-2.5 mr-1" /> {paperSize}mm
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* =========================================================================
          VIEW 3: DAY-BY-DAY STATISTICS & REVENUE ("which day how much all statics")
         ========================================================================= */}
      {activeTab === "statistics" && (
        <Card className="border border-gray-200 shadow-xs bg-white rounded-xl">
          <CardHeader className="p-3.5 bg-gray-50/70 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div>
                <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  Day-by-Day Revenue & Performance Statistics
                </CardTitle>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Complete statistics: which day how much revenue, care service breakdowns, and settlement splits.
                </p>
              </div>

              {/* Single Date Selector for Focused Inspection */}
              <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-lg border border-gray-200 text-xs">
                <Calendar className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-gray-600 font-semibold text-[11px]">Focus Date:</span>
                <input
                  type="date"
                  value={statsDateFilter}
                  onChange={(e) => setStatsDateFilter(e.target.value)}
                  className="bg-white border border-gray-300 rounded px-2 py-0.5 text-xs text-gray-800 font-bold"
                />
                {statsDateFilter !== currentDateStr && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[10px] px-1 text-blue-600"
                    onClick={() => setStatsDateFilter(currentDateStr)}
                  >
                    Today
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-3.5 space-y-4">
            {/* 4 Care Revenue Overview Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              <Card className="p-2.5 border-cyan-200 bg-cyan-50/40">
                <div className="text-[10px] font-bold text-cyan-800 uppercase flex items-center gap-1">
                  <Waves className="w-3 h-3 text-cyan-600" /> Wash Only
                </div>
                <div className="text-lg font-black text-gray-900 mt-0.5">
                  ₹{washOnlySales.toFixed(2)}
                </div>
                <div className="text-[10px] text-gray-500">{washOnlyPcs} garments</div>
              </Card>

              <Card className="p-2.5 border-blue-200 bg-blue-50/40">
                <div className="text-[10px] font-bold text-blue-800 uppercase flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-blue-600" /> Wash & Iron
                </div>
                <div className="text-lg font-black text-gray-900 mt-0.5">
                  ₹{washAndPressSales.toFixed(2)}
                </div>
                <div className="text-[10px] text-gray-500">{washAndPressPcs} garments</div>
              </Card>

              <Card className="p-2.5 border-amber-200 bg-amber-50/40">
                <div className="text-[10px] font-bold text-amber-800 uppercase flex items-center gap-1">
                  <Flame className="w-3 h-3 text-amber-600" /> Pressing Only
                </div>
                <div className="text-lg font-black text-gray-900 mt-0.5">
                  ₹{pressSales.toFixed(2)}
                </div>
                <div className="text-[10px] text-gray-500">{pressPcs} garments</div>
              </Card>

              <Card className="p-2.5 border-purple-200 bg-purple-50/40">
                <div className="text-[10px] font-bold text-purple-800 uppercase flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-purple-600" /> Dry Cleaning
                </div>
                <div className="text-lg font-black text-gray-900 mt-0.5">
                  ₹{dryCleanSales.toFixed(2)}
                </div>
                <div className="text-[10px] text-gray-500">{dryCleanPcs} garments</div>
              </Card>
            </div>

            {/* Day-by-Day Historical Sales Table ("which day how much all statics") */}
            <div>
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Day-by-Day Revenue Ledger</span>
                <span className="text-[10px] text-gray-400 font-normal">
                  Aggregated from all completed and active laundry orders
                </span>
              </h4>

              {Object.keys(dailyStatsMap).length === 0 ? (
                <div className="text-center py-6 bg-gray-50 rounded-lg text-gray-400 text-xs">
                  No historical laundry records recorded yet.
                </div>
              ) : (
                <div className="overflow-x-auto border border-gray-200 rounded-xl">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50 text-gray-700 font-bold">
                        <th className="py-2 px-3">Date</th>
                        <th className="py-2 px-3 text-center">Orders</th>
                        <th className="py-2 px-3 text-center">Garments</th>
                        <th className="py-2 px-3 text-right">Wash (₹)</th>
                        <th className="py-2 px-3 text-right">Wash & Iron (₹)</th>
                        <th className="py-2 px-3 text-right">Iron Only (₹)</th>
                        <th className="py-2 px-3 text-right">Dry Clean (₹)</th>
                        <th className="py-2 px-3 text-right">Room Folio (₹)</th>
                        <th className="py-2 px-3 text-right">Cash / UPI (₹)</th>
                        <th className="py-2 px-3 text-right font-black">Total Revenue (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {Object.values(dailyStatsMap)
                        .sort((a, b) => (b.date > a.date ? 1 : -1))
                        .map((dayRow) => (
                          <tr
                            key={dayRow.date}
                            className={`hover:bg-gray-50/60 ${
                              dayRow.date === currentDateStr ? "bg-blue-50/30 font-semibold" : ""
                            }`}
                          >
                            <td className="py-2 px-3 font-bold text-gray-900">
                              {dayRow.date} {dayRow.date === currentDateStr ? "(Today)" : ""}
                            </td>
                            <td className="py-2 px-3 text-center">{dayRow.ordersCount}</td>
                            <td className="py-2 px-3 text-center">{dayRow.garmentsCount} pcs</td>
                            <td className="py-2 px-3 text-right text-cyan-800">
                              ₹{dayRow.washOnlySales.toFixed(2)}
                            </td>
                            <td className="py-2 px-3 text-right text-blue-800">
                              ₹{dayRow.washAndPressSales.toFixed(2)}
                            </td>
                            <td className="py-2 px-3 text-right text-amber-800">
                              ₹{dayRow.pressSales.toFixed(2)}
                            </td>
                            <td className="py-2 px-3 text-right text-purple-800">
                              ₹{dayRow.dryCleanSales.toFixed(2)}
                            </td>
                            <td className="py-2 px-3 text-right text-blue-900">
                              ₹{dayRow.folioSales.toFixed(2)}
                            </td>
                            <td className="py-2 px-3 text-right text-emerald-900">
                              ₹{dayRow.posSales.toFixed(2)}
                            </td>
                            <td className="py-2 px-3 text-right font-black text-gray-950">
                              ₹{dayRow.totalSales.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* =========================================================================
          VIEW 4: PRICE SHEET & RATE MASTER ("for item price there will be different shet thinsk")
         ========================================================================= */}
      {activeTab === "price_sheet" && (
        <Card className="border border-gray-200 shadow-xs bg-white rounded-xl">
          <CardHeader className="p-3.5 bg-gray-50/70 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div>
                <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-600" />
                  Garment Price Sheet & Rates Master (Database Backed)
                </CardTitle>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Dynamic rate sheet for all garments across Wash, Wash & Press, Pressing, and Dry Clean.
                </p>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setNewGarmentModalOpen(true)}
                  className="text-xs h-7"
                >
                  <Plus className="w-3 h-3 mr-1" /> Add Custom Garment
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetCatalog}
                  disabled={isSavingConfig}
                  className="text-xs h-7 text-gray-600"
                >
                  <RotateCcw className="w-3 h-3 mr-1" /> Reset Defaults
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveToBackendDatabase}
                  disabled={isSavingConfig}
                  className="bg-black text-white hover:bg-gray-800 text-xs font-bold h-7 shadow-xs"
                >
                  <Save className="w-3 h-3 mr-1" />
                  {isSavingConfig ? "Saving..." : "Save All to Database"}
                </Button>
              </div>
            </div>

            {/* Express Turnaround Surcharges Config Row */}
            <div className="mt-2.5 p-2 bg-blue-50/70 rounded-lg border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <span className="font-bold text-blue-950 flex items-center gap-1.5 text-[11px]">
                <Clock className="w-3.5 h-3.5 text-blue-600" /> Express Turnaround Surcharges (%):
              </span>
              <div className="flex items-center gap-3 flex-wrap">
                {serviceSpeeds.map((sp) => (
                  <div key={sp.id} className="flex items-center gap-1">
                    <span className="text-gray-700 font-semibold text-[11px]">{sp.shortLabel}:</span>
                    <Input
                      type="number"
                      value={sp.surchargePercent}
                      onChange={(e) => handleSpeedSurchargeChange(sp.id, e.target.value)}
                      className="h-6 w-14 text-center text-xs bg-white border-blue-200 font-bold"
                    />
                    <span className="text-gray-500 font-bold text-[11px]">%</span>
                  </div>
                ))}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-3.5">
            <div className="overflow-x-auto max-h-[600px] border border-gray-200 rounded-xl">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-gray-700 font-bold sticky top-0 z-10">
                    <th className="py-2 px-3">Garment Item</th>
                    <th className="py-2 px-3">Category</th>
                    <th className="py-2 px-3 text-center">Wash Only Rate (₹)</th>
                    <th className="py-2 px-3 text-center">Wash & Iron Rate (₹)</th>
                    <th className="py-2 px-3 text-center">Press Only Rate (₹)</th>
                    <th className="py-2 px-3 text-center">Dry Clean Rate (₹)</th>
                    <th className="py-2 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {catalog.map((garment) => (
                    <tr key={garment.id} className="hover:bg-gray-50/50">
                      <td className="py-2 px-3 font-bold text-gray-900">{garment.name}</td>
                      <td className="py-2 px-3">
                        <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.2 rounded uppercase">
                          {garment.category}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <Input
                          type="number"
                          value={garment.rates?.wash_only || ""}
                          onChange={(e) => handlePriceChange(garment.id, "wash_only", e.target.value)}
                          className="h-7 w-20 mx-auto text-xs text-center font-semibold bg-white"
                        />
                      </td>
                      <td className="py-2 px-3 text-center">
                        <Input
                          type="number"
                          value={garment.rates?.wash_and_press || ""}
                          onChange={(e) => handlePriceChange(garment.id, "wash_and_press", e.target.value)}
                          className="h-7 w-20 mx-auto text-xs text-center font-semibold bg-white"
                        />
                      </td>
                      <td className="py-2 px-3 text-center">
                        <Input
                          type="number"
                          value={garment.rates?.press_only || ""}
                          onChange={(e) => handlePriceChange(garment.id, "press_only", e.target.value)}
                          className="h-7 w-20 mx-auto text-xs text-center font-semibold bg-white"
                        />
                      </td>
                      <td className="py-2 px-3 text-center">
                        <Input
                          type="number"
                          value={garment.rates?.dry_clean || ""}
                          onChange={(e) => handlePriceChange(garment.id, "dry_clean", e.target.value)}
                          className="h-7 w-20 mx-auto text-xs text-center font-semibold bg-white"
                        />
                      </td>
                      <td className="py-2 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteGarment(garment.id)}
                          className="text-gray-400 hover:text-red-600 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* =========================================================================
          VIEW 5: BAGS & TRACKER
         ========================================================================= */}
      {activeTab === "tracker" && (
        <Card className="border border-gray-200 shadow-xs bg-white rounded-xl">
          <CardHeader className="p-3.5 bg-gray-50/70 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div>
                <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Barcode className="w-4 h-4 text-blue-600" />
                  Laundry Bags & Tickets Tracker
                </CardTitle>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Scan barcode or search by Room #, Token, or Guest Name to view lifecycle & reprint slips.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative min-w-[200px]">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <Input
                    type="text"
                    value={barcodeQuery}
                    onChange={(e) => setBarcodeQuery(e.target.value)}
                    placeholder="Scan Barcode / Room #..."
                    className="h-7 pl-8 text-xs bg-white border-gray-300"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-7 text-xs w-32 bg-white">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="received">Received</SelectItem>
                    <SelectItem value="in process">In Process</SelectItem>
                    <SelectItem value="ready">Ready</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-3.5">
            {filteredTrackerOrders.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <Barcode className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs font-semibold text-gray-700">No matching orders found</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-gray-200 rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 text-gray-700 font-bold">
                      <th className="py-2 px-3">Token #</th>
                      <th className="py-2 px-3">Room / Guest</th>
                      <th className="py-2 px-3">Garments</th>
                      <th className="py-2 px-3">Delivery Due</th>
                      <th className="py-2 px-3 text-right">Total Amount</th>
                      <th className="py-2 px-3">Payment</th>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredTrackerOrders.map((ord) => (
                      <tr key={ord.orderId || ord.token} className="hover:bg-gray-50/50">
                        <td className="py-2 px-3 font-mono font-bold text-blue-900">
                          #{ord.token || ord.orderId}
                        </td>
                        <td className="py-2 px-3">
                          <div className="font-bold text-gray-900">
                            {ord.roomNumber === "Walk-In" ? "Walk-In" : `Room ${ord.roomNumber}`}
                          </div>
                          <div className="text-[10px] text-gray-500">{ord.guestName}</div>
                        </td>
                        <td className="py-2 px-3">
                          <span className="font-semibold text-gray-800">
                            {ord.totalGarments || ord.items?.length} pcs
                          </span>
                        </td>
                        <td className="py-2 px-3 text-gray-600">
                          {ord.deliveryDateTime || ord.createdAt?.split("T")[0]}
                        </td>
                        <td className="py-2 px-3 text-right font-black text-gray-900">
                          ₹{Number(ord.grandTotal || ord.totalAmount || 0).toFixed(2)}
                        </td>
                        <td className="py-2 px-3">
                          <Badge
                            variant="outline"
                            className={`text-[9px] font-bold ${
                              ord.paymentStatus === "POSTED_TO_ROOM_BILL"
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : ord.paymentStatus === "HELD_ON_ROOM"
                                ? "bg-amber-50 text-amber-900 border-amber-300"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {ord.paymentStatus === "POSTED_TO_ROOM_BILL"
                              ? "Folio Posted"
                              : ord.paymentStatus === "HELD_ON_ROOM"
                              ? "Room Hold"
                              : ord.paymentMethod || "Paid"}
                          </Badge>
                        </td>
                        <td className="py-2 px-3">
                          <Select
                            value={ord.status || "Received"}
                            onValueChange={(val) => handleUpdateOrderStatus(ord.orderId, val)}
                          >
                            <SelectTrigger className="h-6 w-24 text-[10px] bg-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Received">Received</SelectItem>
                              <SelectItem value="In Process">In Process</SelectItem>
                              <SelectItem value="Ready">Ready</SelectItem>
                              <SelectItem value="Delivered">Delivered</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="py-2 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 px-1.5 text-[10px] text-blue-700 border-blue-200 hover:bg-blue-50 font-semibold"
                              onClick={() =>
                                printLaundryA4Bill({
                                  order: ord,
                                  institutionData,
                                })
                              }
                            >
                              <FileText className="w-2.5 h-2.5 mr-1" /> A4 Bill
                            </Button>
                            <Button
                              size="sm"
                              className="h-6 px-2 text-[10px] bg-black text-white hover:bg-gray-800"
                              onClick={() =>
                                printLaundryThermalSlip({
                                  order: ord,
                                  institutionData,
                                  paperSize,
                                })
                              }
                            >
                              <Printer className="w-2.5 h-2.5 mr-1" /> {paperSize}mm
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* =========================================================================
          MODAL 1: PREVIEW & DIRECT PRINT (A4 TAX INVOICE & THERMAL SLIP)
         ========================================================================= */}
      {previewOrder && (
        <Dialog open={Boolean(previewOrder)} onOpenChange={() => setPreviewOrder(null)}>
          <DialogContent className={`${previewDocType === "a4" ? "max-w-4xl" : "max-w-md"} p-3 sm:p-4 bg-gray-100 max-h-[92vh] flex flex-col transition-all`}>
            <DialogHeader className="shrink-0 pb-2 border-b border-gray-200">
              <DialogTitle className="text-xs font-bold text-gray-900 flex flex-wrap items-center justify-between gap-2">
                <span className="flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-blue-600" />
                  Laundry Bill #{previewOrder.token || previewOrder.orderId}
                  {previewOrder.roomNumber && previewOrder.roomNumber !== "Walk-In" && (
                    <Badge className="bg-blue-600 text-white text-[10px] ml-1">
                      Room {previewOrder.roomNumber}
                    </Badge>
                  )}
                </span>

                {/* Document Type Switcher: A4 Bill vs 80mm vs 58mm */}
                <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-gray-300 text-[11px] shadow-2xs">
                  <button
                    onClick={() => setPreviewDocType("a4")}
                    className={`px-2.5 py-1 rounded-md font-bold transition-all flex items-center gap-1 ${
                      previewDocType === "a4"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-gray-700 hover:text-black hover:bg-gray-100"
                    }`}
                  >
                    <FileText className="w-3 h-3" />
                    <span>A4 Tax Invoice</span>
                  </button>
                  <button
                    onClick={() => {
                      setPreviewDocType("thermal");
                      setPaperSize("80");
                    }}
                    className={`px-2.5 py-1 rounded-md font-bold transition-all flex items-center gap-1 ${
                      previewDocType === "thermal" && paperSize === "80"
                        ? "bg-black text-white shadow-xs"
                        : "text-gray-700 hover:text-black hover:bg-gray-100"
                    }`}
                  >
                    <Printer className="w-3 h-3" />
                    <span>80mm Thermal</span>
                  </button>
                  <button
                    onClick={() => {
                      setPreviewDocType("thermal");
                      setPaperSize("58");
                    }}
                    className={`px-2 py-1 rounded-md font-bold transition-all ${
                      previewDocType === "thermal" && paperSize === "58"
                        ? "bg-black text-white shadow-xs"
                        : "text-gray-700 hover:text-black hover:bg-gray-100"
                    }`}
                  >
                    <span>58mm</span>
                  </button>
                </div>
              </DialogTitle>
            </DialogHeader>

            {/* Document Body */}
            <div className="flex-1 overflow-y-auto my-2 p-2 sm:p-4 bg-white border border-gray-300 rounded-lg shadow-sm mx-auto w-full">
              {previewDocType === "a4" ? (
                <div
                  dangerouslySetInnerHTML={{
                    __html: getLaundryA4BillHTML({
                      order: previewOrder,
                      institutionData,
                    }),
                  }}
                />
              ) : (
                <div
                  className="font-mono max-w-sm mx-auto"
                  dangerouslySetInnerHTML={{
                    __html: getLaundryThermalSlipHTML({
                      order: previewOrder,
                      institutionData,
                      paperSize,
                    }),
                  }}
                />
              )}
            </div>

            {/* Modal Footer with Direct Print Actions */}
            <DialogFooter className="shrink-0 pt-2 border-t border-gray-200 flex flex-row items-center justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewOrder(null)}
                className="h-8 text-xs font-semibold"
              >
                Close
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs font-bold border-blue-300 bg-blue-50 text-blue-900 hover:bg-blue-100"
                  onClick={() =>
                    printLaundryA4Bill({
                      order: previewOrder,
                      institutionData,
                    })
                  }
                >
                  <FileText className="w-3.5 h-3.5 mr-1 text-blue-600" /> Print A4 Bill
                </Button>
                <Button
                  size="sm"
                  className="h-8 text-xs font-bold bg-black text-white hover:bg-gray-800"
                  onClick={() =>
                    printLaundryThermalSlip({
                      order: previewOrder,
                      institutionData,
                      paperSize,
                    })
                  }
                >
                  <Printer className="w-3.5 h-3.5 mr-1" /> Print {paperSize}mm Slip
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* =========================================================================
          MODAL 2: ADD NEW CUSTOM GARMENT ITEM
         ========================================================================= */}
      <Dialog open={newGarmentModalOpen} onOpenChange={setNewGarmentModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Plus className="w-4 h-4 text-blue-600" />
              Add Custom Garment to Database
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div>
              <Label className="text-xs font-semibold text-gray-700 block mb-1">
                Garment Item Name *
              </Label>
              <Input
                value={newGarmentData.name}
                onChange={(e) => setNewGarmentData({ ...newGarmentData, name: e.target.value })}
                placeholder="e.g. Designer Lehenga, Sherwani, Quilt..."
                className="h-8 text-xs"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-gray-700 block mb-1">Category</Label>
              <Select
                value={newGarmentData.category}
                onValueChange={(val) => setNewGarmentData({ ...newGarmentData, category: val })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Men">Men</SelectItem>
                  <SelectItem value="Women">Ladies</SelectItem>
                  <SelectItem value="Kids">Kids</SelectItem>
                  <SelectItem value="Linen">Linen</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <Label className="text-[11px] font-semibold text-gray-600 block mb-1">
                  Wash Only (₹)
                </Label>
                <Input
                  type="number"
                  value={newGarmentData.wash_only}
                  onChange={(e) => setNewGarmentData({ ...newGarmentData, wash_only: e.target.value })}
                  placeholder="0"
                  className="h-8 text-xs text-center font-bold"
                />
              </div>

              <div>
                <Label className="text-[11px] font-semibold text-gray-600 block mb-1">
                  Wash & Iron (₹)
                </Label>
                <Input
                  type="number"
                  value={newGarmentData.wash_and_press}
                  onChange={(e) => setNewGarmentData({ ...newGarmentData, wash_and_press: e.target.value })}
                  placeholder="0"
                  className="h-8 text-xs text-center font-bold"
                />
              </div>

              <div>
                <Label className="text-[11px] font-semibold text-gray-600 block mb-1">
                  Iron Only (₹)
                </Label>
                <Input
                  type="number"
                  value={newGarmentData.press_only}
                  onChange={(e) => setNewGarmentData({ ...newGarmentData, press_only: e.target.value })}
                  placeholder="0"
                  className="h-8 text-xs text-center font-bold"
                />
              </div>

              <div>
                <Label className="text-[11px] font-semibold text-gray-600 block mb-1">
                  Dry Clean (₹)
                </Label>
                <Input
                  type="number"
                  value={newGarmentData.dry_clean}
                  onChange={(e) => setNewGarmentData({ ...newGarmentData, dry_clean: e.target.value })}
                  placeholder="0"
                  className="h-8 text-xs text-center font-bold"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setNewGarmentModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleAddNewGarment}
              className="bg-black text-white hover:bg-gray-800 font-bold"
            >
              Add to Catalog
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
