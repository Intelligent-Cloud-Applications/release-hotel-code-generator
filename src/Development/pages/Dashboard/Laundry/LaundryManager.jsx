import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router";
import { useAppContext } from "@/Development/context/AppContext.jsx";
import { useInstitutionContext } from "@/Development/context/InstitutionContext.jsx";
import { useAuthContext } from "@/Development/context/AuthContext.jsx";
import { Button } from "@/Development/components/ui/button.js";
import { Input } from "@/Development/components/ui/input.js";
import { Label } from "@/Development/components/ui/label.js";
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
  Truck,
  Bed,
  Calendar,
  Waves,
  Receipt,
  RotateCcw,
  Save,
  FileText,
  X,
  CreditCard,
  Banknote,
  Settings,
} from "lucide-react";
import { toast } from "sonner";
import {
  getLaundryCatalog,
  getServiceSpeeds,
  fetchLaundryCatalogBackend,
  saveLaundryConfigToBackend,
  resetLaundryCatalogToDefault,
  generateLaundryToken,
  calculateLaundryTotals,
  createLaundryOrderBackend,
  fetchLaundryOrdersBackend,
  updateLaundryStatusBackend,
  markDeliveryDeliveredBackend,
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

/* ---------------------------------------------------------------------------
   Layout constant: the page fills the screen below your app header.
   If your header is taller/shorter, change this one number (px).
--------------------------------------------------------------------------- */
const APP_CHROME_HEIGHT = 84;

/* One calm palette: neutral surfaces, a single blue accent.
   Care types get a small tint only where they need to be told apart. */
const CARE_UI = {
  wash_only: { label: "Wash", Icon: Waves, chip: "bg-cyan-50 text-cyan-800 border-cyan-200" },
  wash_and_press: { label: "Wash + Iron", Icon: Sparkles, chip: "bg-blue-50 text-blue-800 border-blue-200" },
  press_only: { label: "Iron", Icon: Flame, chip: "bg-amber-50 text-amber-800 border-amber-200" },
  dry_clean: { label: "Dry clean", Icon: ShieldCheck, chip: "bg-purple-50 text-purple-800 border-purple-200" },
};
const CARE_IDS = Object.keys(CARE_UI);
const careOf = (item) => (CARE_UI[item?.careType] ? item.careType : "wash_and_press");

const TABS = [
  { id: "new_order", label: "New order" },
  { id: "deliveries", label: "Deliveries" },
  { id: "tracker", label: "Tracker" },
  { id: "statistics", label: "Statistics" },
  { id: "price_sheet", label: "Rates" },
];

const emptyBatchRow = (category = "Men") => ({
  name: "",
  category,
  wash_only: "",
  wash_and_press: "",
  press_only: "",
  dry_clean: "",
});
const initialBatch = () => [emptyBatchRow("Men"), emptyBatchRow("Women"), emptyBatchRow("Kids")];

const ymd = (d = new Date()) => d.toISOString().split("T")[0];

/**
 * Robust room number resolution helper
 * Ensures the human room number (e.g. "101", "102") is always returned instead of internal UUIDs
 */
export const getDisplayRoomNumber = (booking, roomsList = []) => {
  if (!booking) return "";

  const joinIf = (v) => (Array.isArray(v) ? v.join(", ") : String(v));
  if (booking.room_number) return joinIf(booking.room_number);
  if (booking.roomNumber) return joinIf(booking.roomNumber);
  if (booking.room_numbers) return joinIf(booking.room_numbers);
  if (booking.allocated_room) return String(booking.allocated_room);

  const rawRoomId = Array.isArray(booking.room_id) ? booking.room_id[0] : booking.room_id;
  if (rawRoomId && roomsList && roomsList.length > 0) {
    const matched = roomsList.find(
      (r) =>
        String(r.room_id || r.id || "").toLowerCase() === String(rawRoomId).toLowerCase() ||
        String(r.room_number || r.number || "").toLowerCase() === String(rawRoomId).toLowerCase()
    );
    if (matched) {
      return String(matched.room_number || matched.number || matched.room_name || rawRoomId);
    }
  }

  const fromList = (arr) => {
    if (Array.isArray(arr) && arr.length > 0) {
      const first = arr[0];
      return typeof first === "object"
        ? String(first.room_number || first.number || first.room_id || "")
        : String(first);
    }
    return null;
  };
  const a = fromList(booking.rooms);
  if (a !== null) return a;
  const b = fromList(booking.rooms_config);
  if (b !== null) return b;

  return rawRoomId ? String(rawRoomId) : "";
};

/* Small shared pieces ------------------------------------------------------ */
const Panel = ({ className = "", children }) => (
  <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>{children}</div>
);

const Segmented = ({ value, onChange, options }) => (
  <div
    className="grid gap-0.5 bg-gray-100 p-0.5 rounded-md"
    style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
  >
    {options.map((o) => (
      <button
        key={o.id}
        type="button"
        onClick={() => onChange(o.id)}
        className={`px-3 py-1.5 rounded text-[12px] font-semibold transition-colors ${
          value === o.id ? "bg-white text-blue-700 shadow-sm" : "text-gray-600 hover:text-gray-900"
        }`}
      >
        {o.label}
      </button>
    ))}
  </div>
);

const CareChip = ({ careType, qty }) => {
  const ui = CARE_UI[careType] || CARE_UI.wash_and_press;
  return (
    <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold ${ui.chip}`}>
      {qty ? `${qty} ` : ""}
      {ui.label}
    </span>
  );
};

const paymentBadge = (ord) => {
  if (ord.paymentStatus === "POSTED_TO_ROOM_BILL")
    return { text: "Posted to room bill", cls: "bg-emerald-50 text-emerald-800 border-emerald-200" };
  if (ord.paymentStatus === "HELD_ON_ROOM")
    return { text: "Held on room", cls: "bg-amber-50 text-amber-900 border-amber-300" };
  return { text: ord.paymentMethod || "Paid", cls: "bg-gray-100 text-gray-800 border-gray-200" };
};

export default function LaundryManager({ initialRoomNumber = null, onOrderCreated = null }) {
  const {
    bookings = [],
    rooms = [],
    guests = [],
    fetchGuests,
    updateBookingServices,
    addExpense,
  } = useAppContext();
  const { institutionData, updateInstitutionData } = useInstitutionContext();
  const { userData } = useAuthContext();

  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(() => tabFromUrl || "new_order");

  useEffect(() => {
    if (tabFromUrl && tabFromUrl !== activeTab) setActiveTab(tabFromUrl);
  }, [tabFromUrl]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setSearchParams({ tab: newTab });
  };

  /* Catalog & speeds ------------------------------------------------------- */
  const [catalog, setCatalog] = useState(() => getLaundryCatalog(institutionData));
  const [serviceSpeeds, setServiceSpeeds] = useState(() => getServiceSpeeds(institutionData));
  const [catalogCategory, setCatalogCategory] = useState("All");
  const [searchGarment, setSearchGarment] = useState("");
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  const [showBatchAddSection, setShowBatchAddSection] = useState(false);
  const [batchGarments, setBatchGarments] = useState(initialBatch);

  const handleAddBatchRow = () => setBatchGarments((p) => [...p, emptyBatchRow()]);
  const handleUpdateBatchRow = (index, field, value) =>
    setBatchGarments((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  const handleRemoveBatchRow = (index) =>
    setBatchGarments((prev) => (prev.length <= 1 ? [emptyBatchRow()] : prev.filter((_, i) => i !== index)));

  const handleSaveBatchGarments = async () => {
    const validRows = batchGarments.filter((r) => r.name && r.name.trim().length > 0);
    if (validRows.length === 0) {
      toast.error("Enter at least one garment name");
      return;
    }
    setIsSavingConfig(true);
    try {
      const newEntries = validRows.map((r, i) => ({
        id: `custom_${r.name.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${Date.now()}_${i}`,
        name: r.name.trim(),
        category: r.category || "Men",
        rates: {
          wash_only: Math.max(0, Number(r.wash_only) || 0),
          wash_and_press: Math.max(0, Number(r.wash_and_press) || 0),
          press_only: Math.max(0, Number(r.press_only) || 0),
          dry_clean: Math.max(0, Number(r.dry_clean) || 0),
        },
      }));
      const updatedCatalog = [...newEntries, ...catalog];
      setCatalog(updatedCatalog);
      try {
        localStorage.setItem("hotel_laundry_catalog_cache", JSON.stringify(updatedCatalog));
      } catch (e) {}
      setBatchGarments(initialBatch());
      setShowBatchAddSection(false);
      await saveLaundryConfigToBackend({
        catalog: updatedCatalog,
        serviceSpeeds,
        institutionData,
        updateInstitutionData,
      });
      toast.success(`Added ${newEntries.length} garments and saved`);
    } catch (err) {
      console.error(err);
      toast.error("Could not save garments");
    } finally {
      setIsSavingConfig(false);
    }
  };

  const [editSpeedsModalOpen, setEditSpeedsModalOpen] = useState(false);
  const [customExtraCharge, setCustomExtraCharge] = useState(0);

  const [previewOrder, setPreviewOrder] = useState(null);
  const [paperSize, setPaperSize] = useState("80");
  const [previewDocType, setPreviewDocType] = useState("a4");

  useEffect(() => {
    if (institutionData?.laundryConfig?.catalog && Array.isArray(institutionData.laundryConfig.catalog)) {
      setCatalog(institutionData.laundryConfig.catalog);
    }
    if (
      institutionData?.laundryConfig?.serviceSpeeds &&
      Array.isArray(institutionData.laundryConfig.serviceSpeeds)
    ) {
      setServiceSpeeds(institutionData.laundryConfig.serviceSpeeds);
    }
  }, [institutionData]);

  /* Order form state ------------------------------------------------------- */
  const [collectionSource, setCollectionSource] = useState("room_pickup");
  const [selectedBookingId, setSelectedBookingId] = useState("");
  const [selectedRoomNumber, setSelectedRoomNumber] = useState(initialRoomNumber || "");
  const [guestName, setGuestName] = useState("");
  const [guestMobile, setGuestMobile] = useState("");
  const [serviceSpeed, setServiceSpeed] = useState("normal");
  const [token, setToken] = useState(generateLaundryToken());
  const [basket, setBasket] = useState([]);

  const getInitialDeliveryDate = (speed) => {
    const d = new Date();
    if (speed === "normal") d.setDate(d.getDate() + 1);
    return ymd(d);
  };
  const [deliveryDate, setDeliveryDate] = useState(() => getInitialDeliveryDate("normal"));
  const [deliveryTime, setDeliveryTime] = useState("18:00");

  const handleServiceSpeedChange = (speedId) => {
    setServiceSpeed(speedId);
    setDeliveryDate(getInitialDeliveryDate(speedId));
    if (speedId === "urgent") {
      const now = new Date();
      now.setHours(now.getHours() + 4);
      setDeliveryTime(
        `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
      );
    } else {
      setDeliveryTime("18:00");
    }
  };

  const [barcodeQuery, setBarcodeQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deliveryFilter, setDeliveryFilter] = useState("pending");

  const currentDateStr = ymd();
  const [statsDateFilter, setStatsDateFilter] = useState(currentDateStr);
  const currentInstitutionId = institutionData?.institutionid || institutionData?.institutionId;

  const resolveGuestDetails = (bk) => {
    if (!bk) return { name: "", phone: "" };
    let name =
      bk.guest_name || bk.booking_name || bk.full_name || bk.name ||
      bk.primary_guest_name || bk.primary_guest || bk.customerName || "";
    let phone = bk.mobile_number || bk.mobile || bk.phone || bk.guest_phone || "";

    if (!name && bk.guest_details) {
      name = bk.guest_details.full_name || bk.guest_details.name || bk.guest_details.guest_name || "";
      phone = phone || bk.guest_details.phone || bk.guest_details.mobile || "";
    }

    const guestId = bk.guest_id || bk.guestId || bk.guest_details?.guest_id;
    if (guestId && Array.isArray(guests) && guests.length > 0) {
      const g = guests.find((item) => String(item.guest_id || item.id || item._id) === String(guestId));
      if (g) {
        if (!name) name = g.full_name || g.name || g.guest_name || "";
        if (!phone) phone = g.mobile_number || g.phone || g.mobile || "";
      }
    }

    if (!name && Array.isArray(bk.guest_list) && bk.guest_list.length > 0) {
      const firstG = bk.guest_list[0];
      name = firstG.name || firstG.full_name || firstG.guest_name || "";
      phone = phone || firstG.mobile || firstG.phone || "";
    }
    return { name: (name || "").trim(), phone: (phone || "").trim() };
  };

  /* Orders ----------------------------------------------------------------- */
  const [allOrders, setAllOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const loadLaundryOrders = async () => {
    setLoadingOrders(true);
    try {
      const catalogData = await fetchLaundryCatalogBackend(currentInstitutionId);
      if (catalogData) {
        if (Array.isArray(catalogData.catalog) && catalogData.catalog.length > 0) {
          setCatalog(catalogData.catalog);
          try {
            localStorage.setItem("hotel_laundry_catalog_cache", JSON.stringify(catalogData.catalog));
          } catch (e) {}
        }
        if (Array.isArray(catalogData.serviceSpeeds) && catalogData.serviceSpeeds.length > 0) {
          setServiceSpeeds(catalogData.serviceSpeeds);
          try {
            localStorage.setItem("hotel_laundry_speeds_cache", JSON.stringify(catalogData.serviceSpeeds));
          } catch (e) {}
        }
      }
      const remoteOrders = await fetchLaundryOrdersBackend(currentInstitutionId);
      if (Array.isArray(remoteOrders)) setAllOrders(remoteOrders);
    } catch (err) {
      console.warn("Failed loading laundry data from backend:", err);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    loadLaundryOrders();
    if (typeof fetchGuests === "function" && (!guests || guests.length === 0)) fetchGuests();
  }, [currentInstitutionId]);

  const persistOrders = (updatedList) => setAllOrders(updatedList);

  const checkedInBookings = useMemo(
    () =>
      (bookings || []).filter(
        (b) => b.status === "Checked-in" || b.status === "confirmed" || b.reservation_status === "Checked-in"
      ),
    [bookings]
  );

  useEffect(() => {
    if (!initialRoomNumber) return;
    const found = checkedInBookings.find((b) => {
      const displayNum = getDisplayRoomNumber(b, rooms);
      return String(displayNum) === String(initialRoomNumber) || String(b.room_id) === String(initialRoomNumber);
    });
    if (found) {
      setSelectedBookingId(found.booking_id);
      setSelectedRoomNumber(getDisplayRoomNumber(found, rooms) || initialRoomNumber);
      const gInfo = resolveGuestDetails(found);
      setGuestName(gInfo.name);
      setGuestMobile(gInfo.phone);
    } else {
      setSelectedRoomNumber(initialRoomNumber);
    }
    setCollectionSource("room_pickup");
  }, [initialRoomNumber, checkedInBookings, rooms, guests]);

  const handleBookingSelect = (bId) => {
    setSelectedBookingId(bId);
    const bk = checkedInBookings.find((b) => b.booking_id === bId);
    if (bk) {
      setSelectedRoomNumber(getDisplayRoomNumber(bk, rooms));
      const gInfo = resolveGuestDetails(bk);
      setGuestName(gInfo.name);
      setGuestMobile(gInfo.phone);
    }
  };

  /* Statistics: one pass, grouped by day ----------------------------------- */
  const { dailyStatsMap, pendingDeliveries, deliveredTodayList, heldOnRoomOrders, roomsToDeliver } =
    useMemo(() => {
      const dailyMap = {};
      const pending = [];
      const deliveredToday = [];
      const held = [];
      const roomsSet = new Set();

      (allOrders || []).forEach((order) => {
        const orderDate = order.createdAt ? order.createdAt.split("T")[0] : "";
        const grandTotal = Number(order.grandTotal || order.totalAmount || 0);
        const isDelivered =
          order.delivery_status === "delivered_to_room" ||
          order.status === "Delivered" ||
          order.status === "delivered";

        if (orderDate) {
          if (!dailyMap[orderDate]) {
            dailyMap[orderDate] = {
              date: orderDate,
              total: 0,
              orders: 0,
              garments: 0,
              folio: 0,
              pos: 0,
              care: Object.fromEntries(CARE_IDS.map((c) => [c, { amt: 0, pcs: 0 }])),
            };
          }
          const day = dailyMap[orderDate];
          day.total += grandTotal;
          day.orders += 1;
          day.garments += Number(order.totalGarments || 0);
          if (order.settlementType === "ROOM_FOLIO" || order.paymentMethod === "ROOM_FOLIO") day.folio += grandTotal;
          else day.pos += grandTotal;

          (order.items || []).forEach((item) => {
            const qty = Number(item.quantity) || 1;
            const rate = Number(item.unitRate || item.rate || 0);
            const amt = Number(item.total || rate * qty);
            const c = day.care[careOf(item)];
            c.amt += amt;
            c.pcs += qty;
          });
          if (orderDate === currentDateStr && isDelivered) deliveredToday.push(order);
        }

        if (order.paymentStatus === "HELD_ON_ROOM") held.push(order);
        if (!isDelivered) {
          pending.push(order);
          const rNum = String(order.roomNumber || "");
          if (rNum && rNum !== "Walk-In") roomsSet.add(rNum);
        }
      });

      return {
        dailyStatsMap: dailyMap,
        pendingDeliveries: pending,
        deliveredTodayList: deliveredToday,
        heldOnRoomOrders: held,
        roomsToDeliver: Array.from(roomsSet),
      };
    }, [allOrders, currentDateStr]);

  const todayStats = dailyStatsMap[currentDateStr];
  const todaySales = todayStats?.total || 0;
  const todayGarments = todayStats?.garments || 0;

  const filteredGarments = useMemo(
    () =>
      catalog.filter((g) => {
        const cat = g.category === "Male" ? "Men" : g.category === "Ladies" ? "Women" : g.category;
        const matchCat = catalogCategory === "All" || cat === catalogCategory;
        const matchSearch = !searchGarment || g.name.toLowerCase().includes(searchGarment.toLowerCase());
        return matchCat && matchSearch;
      }),
    [catalog, catalogCategory, searchGarment]
  );

  /* Basket ----------------------------------------------------------------- */
  const handleAddToBasket = (garment, careType) => {
    const unitRate = garment.rates?.[careType] || 0;
    if (unitRate <= 0) {
      toast.warning(`${garment.name} has no ${CARE_UI[careType].label.toLowerCase()} rate.`);
      return;
    }
    setBasket((prev) => {
      const idx = prev.findIndex((i) => i.garmentId === garment.id && i.careType === careType);
      if (idx > -1) return prev.map((i, n) => (n === idx ? { ...i, quantity: i.quantity + 1 } : i));
      return [
        ...prev,
        {
          id: `${garment.id}_${careType}_${Date.now()}`,
          garmentId: garment.id,
          name: garment.name,
          category: garment.category,
          careType,
          unitRate,
          quantity: 1,
          notes: "",
        },
      ];
    });
  };

  const updateBasketQuantity = (index, delta) =>
    setBasket((prev) =>
      prev
        .map((it, i) => (i === index ? { ...it, quantity: it.quantity + delta } : it))
        .filter((it) => it.quantity > 0)
    );
  const removeBasketItem = (index) => setBasket((prev) => prev.filter((_, i) => i !== index));

  const cgstRate = Number(institutionData?.cgst ?? 2.5);
  const sgstRate = Number(institutionData?.sgst ?? 2.5);
  const totals = useMemo(
    () => calculateLaundryTotals(basket, serviceSpeed, cgstRate, sgstRate, serviceSpeeds, customExtraCharge),
    [basket, serviceSpeed, cgstRate, sgstRate, serviceSpeeds, customExtraCharge]
  );

  const handleResetOrder = () => {
    setBasket([]);
    setToken(generateLaundryToken());
    setCustomExtraCharge(0);
    if (!initialRoomNumber) {
      setSelectedBookingId("");
      setSelectedRoomNumber("");
      setGuestName("");
      setGuestMobile("");
    }
  };

  const buildOrderPayload = (mode) => {
    const speedObj = serviceSpeeds.find((s) => s.id === serviceSpeed) || serviceSpeeds[0];
    const isRoom = collectionSource !== "walk_in" && selectedRoomNumber;
    return {
      orderId: token,
      token,
      roomNumber: isRoom ? selectedRoomNumber : "Walk-In",
      bookingId: isRoom ? selectedBookingId : null,
      guestName: guestName || (isRoom ? `Room ${selectedRoomNumber} Guest` : "Walk-In Guest"),
      guestMobile: guestMobile || "",
      collectionSource,
      deliveryDateTime: `${deliveryDate} ${deliveryTime}`,
      items: basket,
      totalGarments: totals.totalGarments,
      serviceSpeed,
      serviceSpeedLabel: speedObj.label,
      surchargePercent: totals.surchargePercent,
      surchargeAmount: totals.surchargeAmount,
      extraAmount: totals.extraAmount || 0,
      flatExtraAmount: totals.flatExtraAmount || 0,
      itemsSubtotal: totals.itemsSubtotal,
      taxableAmount: totals.taxableAmount,
      cgstAmount: totals.cgstAmount,
      sgstAmount: totals.sgstAmount,
      grandTotal: totals.grandTotal,
      settlementType: mode === "ROOM_FOLIO" ? "ROOM_FOLIO" : "DIRECT",
      paymentMethod: mode === "ROOM_FOLIO" ? "ROOM_FOLIO" : mode === "HELD_ON_ROOM" ? "HELD_ON_ROOM" : mode || "CASH",
      paymentStatus: mode === "ROOM_FOLIO" ? "POSTED_TO_ROOM_BILL" : mode === "HELD_ON_ROOM" ? "HELD_ON_ROOM" : "PAID",
      status: "Received",
      delivery_status: "pending_delivery",
      createdAt: new Date().toISOString(),
      staffId: userData?.cognitoId || userData?.name || "Laundry Staff",
    };
  };

  const finishOrder = async (orderData) => {
    try {
      await createLaundryOrderBackend(orderData, currentInstitutionId);
    } catch (backendErr) {
      console.warn("Backend save skipped:", backendErr);
    }
    persistOrders([orderData, ...allOrders]);
    if (typeof onOrderCreated === "function") onOrderCreated(orderData);
    setPreviewOrder(orderData);
    handleResetOrder();
  };

  const resolveRoomGuest = (fallbackLabel) => {
    const foundBooking = bookings.find((b) => b.booking_id === selectedBookingId);
    const gInfo = resolveGuestDetails(foundBooking);
    return {
      foundBooking,
      name: guestName || gInfo.name || (selectedRoomNumber ? `Room ${selectedRoomNumber} Guest` : fallbackLabel),
      phone: guestMobile || gInfo.phone || "",
    };
  };

  // 1. Post directly to hotel room bill
  const handleSettleToRoomFolio = async () => {
    if (basket.length === 0) return toast.error("Add at least one garment.");
    if (!selectedRoomNumber) return toast.error("Select a room to charge.");

    const { foundBooking, name, phone } = resolveRoomGuest("In-House Guest");
    const orderData = {
      ...buildOrderPayload("ROOM_FOLIO"),
      booking_id: selectedBookingId,
      bookingId: selectedBookingId,
      guestName: name,
      guestPhone: phone,
      guestMobile: phone,
      roomNumber: selectedRoomNumber,
      totalAmount: totals.grandTotal,
      settlementType: "room_folio",
      turnaroundSpeed: serviceSpeed,
      institutionId: currentInstitutionId,
    };
    const currentDate = ymd();

    try {
      if (selectedBookingId) {
        const institutionId = foundBooking?.institutionId || currentInstitutionId;
        const entry = {
          food_charges: 0,
          laundry_charges: totals.grandTotal,
          minibar_charges: 0,
          extra_bed_charges: 0,
          manual_charges: 0,
          order_id: token,
          service_id: token,
          service_type: "laundry",
          name: `Laundry: ${totals.totalGarments} pcs`,
          token,
          guestName: name,
          roomNumber: selectedRoomNumber,
          items: basket,
          cgstAmount: totals.cgstAmount,
          sgstAmount: totals.sgstAmount,
          itemsSubtotal: totals.itemsSubtotal,
          notes: `Laundry: ${totals.totalGarments} pcs (${orderData.serviceSpeedLabel})`,
          totalAmount: totals.grandTotal,
          created_at: Date.now(),
        };
        await updateBookingServices(selectedBookingId, {
          booking_id: selectedBookingId,
          institutionId,
          services: { [selectedRoomNumber]: { [currentDate]: [entry] } },
        });
        toast.success(`Posted ₹${totals.grandTotal} to Room ${selectedRoomNumber} (${name})`);
      }
      await finishOrder(orderData);
    } catch (err) {
      console.error(err);
      toast.error("Could not post to room bill");
    }
  };

  // 2. Hold on room (settle later)
  const handleHoldOnRoom = async () => {
    if (basket.length === 0) return toast.error("Add at least one garment.");
    if (!selectedRoomNumber) return toast.error("Select a room to hold against.");

    const { name, phone } = resolveRoomGuest("In-House Guest");
    const orderData = {
      ...buildOrderPayload("HELD_ON_ROOM"),
      booking_id: selectedBookingId,
      bookingId: selectedBookingId,
      guestName: name,
      guestPhone: phone,
      guestMobile: phone,
      roomNumber: selectedRoomNumber,
      totalAmount: totals.grandTotal,
      settlementType: "room_folio",
      turnaroundSpeed: serviceSpeed,
      institutionId: currentInstitutionId,
    };
    try {
      toast.info(`Order ${token} held for Room ${selectedRoomNumber}`);
      await finishOrder(orderData);
    } catch (err) {
      console.error(err);
      toast.error("Could not hold order");
    }
  };

  // 3. Direct POS settlement
  const handleDirectPOSSettle = async (payMethod = "CASH") => {
    if (basket.length === 0) return toast.error("Add at least one garment.");
    if (collectionSource === "walk_in" && !guestName.trim()) return toast.error("Enter the guest name.");

    const { name, phone } = resolveRoomGuest("Walk-In Guest");
    const resolvedName = selectedRoomNumber ? name : guestName || "Walk-In Guest";
    const orderData = {
      ...buildOrderPayload(payMethod),
      booking_id: selectedBookingId || null,
      bookingId: selectedBookingId || null,
      guestName: resolvedName,
      guestPhone: phone,
      guestMobile: phone,
      roomNumber: selectedRoomNumber || "Walk-In",
      totalAmount: totals.grandTotal,
      settlementType: "direct",
      turnaroundSpeed: serviceSpeed,
      institutionId: currentInstitutionId,
    };

    try {
      if (typeof addExpense === "function") {
        try {
          await addExpense({
            date: ymd(),
            expense: 0,
            received: totals.grandTotal,
            name: `Laundry Service - ${token}`,
            description: `${totals.totalGarments} Garments [${payMethod}] - ${resolvedName}`,
          });
        } catch (e) {
          console.warn("Cash drawer recording skipped:", e);
        }
      }
      toast.success(`Settled ₹${totals.grandTotal} via ${payMethod}`);
      await finishOrder(orderData);
    } catch (err) {
      console.error(err);
      toast.error("Could not complete payment");
    }
  };

  const handleReleaseHoldToCash = async (orderToRelease, payMethod = "CASH") => {
    persistOrders(
      allOrders.map((o) =>
        o.orderId === orderToRelease.orderId || o.token === orderToRelease.token
          ? { ...o, paymentStatus: "PAID", paymentMethod: payMethod, settlementType: "DIRECT" }
          : o
      )
    );
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
      await updateLaundryStatusBackend(
        orderToRelease.orderId || orderToRelease.token,
        { paymentStatus: "PAID", paymentMethod: payMethod },
        currentInstitutionId
      );
    } catch (e) {}
    toast.success(`Room ${orderToRelease.roomNumber} hold released. ₹${orderToRelease.grandTotal} paid via ${payMethod}`);
  };

  const handleConvertHoldToRoomFolio = async (orderToPost) => {
    const bId = orderToPost.bookingId || orderToPost.booking_id;
    if (!bId) return toast.error("Missing booking reference for this room.");

    const foundBooking = bookings.find((b) => b.booking_id === bId);
    const gInfo = resolveGuestDetails(foundBooking);
    const name =
      orderToPost.guestName ||
      gInfo.name ||
      (orderToPost.roomNumber ? `Room ${orderToPost.roomNumber} Guest` : "In-House Guest");

    try {
      const chargeAmt = Number(orderToPost.grandTotal || orderToPost.totalAmount || 0);
      const entry = {
        food_charges: 0,
        laundry_charges: chargeAmt,
        minibar_charges: 0,
        extra_bed_charges: 0,
        manual_charges: 0,
        order_id: orderToPost.token || orderToPost.orderId,
        service_id: orderToPost.token || orderToPost.orderId,
        service_type: "laundry",
        name: `Laundry: ${orderToPost.totalGarments || 1} pcs`,
        guestName: name,
        roomNumber: orderToPost.roomNumber,
        items: orderToPost.items || [],
        cgstAmount: orderToPost.cgstAmount || Math.round(chargeAmt * 0.025),
        sgstAmount: orderToPost.sgstAmount || Math.round(chargeAmt * 0.025),
        itemsSubtotal: orderToPost.itemsSubtotal || orderToPost.subtotal || chargeAmt,
        notes: `Laundry: ${orderToPost.totalGarments || 1} pcs (Released from hold)`,
        totalAmount: chargeAmt,
        created_at: Date.now(),
      };
      await updateBookingServices(bId, {
        booking_id: bId,
        institutionId: currentInstitutionId,
        services: { [orderToPost.roomNumber]: { [currentDateStr]: [entry] } },
      });

      persistOrders(
        allOrders.map((o) =>
          o.orderId === orderToPost.orderId || o.token === orderToPost.token
            ? {
                ...o,
                paymentStatus: "POSTED_TO_ROOM_BILL",
                settlementType: "ROOM_FOLIO",
                paymentMethod: "ROOM_FOLIO",
                guestName: name,
              }
            : o
        )
      );
      try {
        await updateLaundryStatusBackend(
          orderToPost.orderId || orderToPost.token,
          { paymentStatus: "POSTED_TO_ROOM_BILL", settlementType: "ROOM_FOLIO", guestName: name },
          currentInstitutionId
        );
      } catch (e) {}
      toast.success(`Added ₹${chargeAmt} to Room ${orderToPost.roomNumber} bill`);
    } catch (err) {
      console.error(err);
      toast.error("Could not post to room bill");
    }
  };

  const handleMarkDeliveredToRoom = async (orderToDeliver) => {
    const by = userData?.userName || userData?.name || "Laundry Staff";
    persistOrders(
      allOrders.map((o) =>
        o.orderId === orderToDeliver.orderId || o.token === orderToDeliver.token
          ? {
              ...o,
              status: "Delivered",
              delivery_status: "delivered_to_room",
              delivered_to_room: true,
              delivered_at: new Date().toISOString(),
              delivered_by: by,
            }
          : o
      )
    );
    try {
      const id = orderToDeliver.orderId || orderToDeliver.token;
      await markDeliveryDeliveredBackend(id, { delivered_by: by });
      await updateLaundryStatusBackend(
        id,
        { status: "delivered", delivery_status: "delivered_to_room", delivered_by: by },
        currentInstitutionId
      );
    } catch (e) {
      console.warn("Backend deliver status skipped:", e);
    }
    toast.success(`Delivered to Room ${orderToDeliver.roomNumber}`);
  };

  const handleUpdateOrderStatus = (orderId, newStatus) => {
    persistOrders(
      allOrders.map((o) =>
        o.orderId === orderId ? { ...o, status: newStatus, updatedAt: new Date().toISOString() } : o
      )
    );
    try {
      updateLaundryStatusBackend(orderId, { status: newStatus }, currentInstitutionId);
    } catch (e) {}
    toast.success(`Order ${orderId} is now "${newStatus}"`);
  };

  /* Rates ------------------------------------------------------------------ */
  const handlePriceChange = (garmentId, careType, newPrice) =>
    setCatalog((prev) =>
      prev.map((g) =>
        g.id === garmentId
          ? { ...g, rates: { ...g.rates, [careType]: Math.max(0, Number(newPrice) || 0) } }
          : g
      )
    );

  const handleSpeedSurchargeChange = async (speedId, newSurcharge, newFlat = null) => {
    const updated = serviceSpeeds.map((s) =>
      s.id === speedId
        ? {
            ...s,
            surchargePercent: Math.max(0, Number(newSurcharge) || 0),
            ...(newFlat !== null ? { flatExtraAmount: Math.max(0, Number(newFlat) || 0) } : {}),
          }
        : s
    );
    setServiceSpeeds(updated);
    try {
      localStorage.setItem("hotel_laundry_speeds_cache", JSON.stringify(updated));
    } catch (e) {}
    try {
      await saveLaundryConfigToBackend({ catalog, serviceSpeeds: updated, institutionData, updateInstitutionData });
    } catch (e) {
      console.warn("Autosave speeds error:", e);
    }
  };

  const handleDeleteGarment = async (garmentId) => {
    const updated = catalog.filter((g) => g.id !== garmentId);
    setCatalog(updated);
    toast.info("Garment removed.");
    try {
      await saveLaundryConfigToBackend({ catalog: updated, serviceSpeeds, institutionData, updateInstitutionData });
    } catch (e) {
      console.warn("Autosave catalog error:", e);
    }
  };

  const handleSaveToBackendDatabase = async () => {
    setIsSavingConfig(true);
    try {
      const ok = await saveLaundryConfigToBackend({ catalog, serviceSpeeds, institutionData, updateInstitutionData });
      ok ? toast.success("Rates saved") : toast.warning("Saved on this device only.");
    } catch (err) {
      console.error(err);
      toast.error("Could not save rates");
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleResetCatalog = async () => {
    if (!window.confirm("Remove every garment and rate from the catalog?")) return;
    setIsSavingConfig(true);
    try {
      const defaults = await resetLaundryCatalogToDefault(institutionData, updateInstitutionData);
      setCatalog(defaults);
      toast.info("Catalog cleared.");
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingConfig(false);
    }
  };

  const filteredTrackerOrders = useMemo(
    () =>
      allOrders.filter((ord) => {
        const q = barcodeQuery.trim().toLowerCase();
        const matchQuery =
          !q ||
          (ord.token && ord.token.toLowerCase().includes(q)) ||
          (ord.roomNumber && String(ord.roomNumber).toLowerCase().includes(q)) ||
          (ord.guestName && ord.guestName.toLowerCase().includes(q));
        const matchStatus =
          statusFilter === "all" || (ord.status || "Received").toLowerCase() === statusFilter.toLowerCase();
        return matchQuery && matchStatus;
      }),
    [allOrders, barcodeQuery, statusFilter]
  );

  const printA4 = (order) => printLaundryA4Bill({ order, institutionData });
  const printSlip = (order) => printLaundryThermalSlip({ order, institutionData, paperSize });
  const previewCurrent = () => buildOrderPayload(selectedRoomNumber ? "ROOM_FOLIO" : "CASH");

  const speedExtraLabel = (sp) => {
    const p = Number(sp.surchargePercent) > 0;
    const f = Number(sp.flatExtraAmount) > 0;
    if (p && f) return `+${sp.surchargePercent}% +₹${sp.flatExtraAmount}`;
    if (p) return `+${sp.surchargePercent}%`;
    if (f) return `+₹${sp.flatExtraAmount}`;
    return "No extra";
  };

  const inRoomMode = collectionSource !== "walk_in" && selectedRoomNumber;

  /* ======================================================================== */
  return (
    <div
      className="w-full max-w-[1600px] mx-auto p-2 flex flex-col gap-2 font-sans text-gray-900 text-xs"
      style={{ height: `calc(100vh - ${APP_CHROME_HEIGHT}px)` }}
    >
      {/* ---------------------------- SLIM STATUS BAR ---------------------------- */}
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg">
        <div className="flex items-center gap-5 text-[12px] text-gray-600">
          <span className="flex items-center gap-1.5 font-semibold text-gray-900 text-sm">
            <Shirt className="w-4 h-4 text-blue-600" /> Laundry
          </span>
          <span>
            Today <strong className="text-gray-900 text-sm">₹{todaySales.toFixed(0)}</strong>
            <span className="text-gray-400"> · {todayGarments} pcs</span>
          </span>
          <button type="button" onClick={() => handleTabChange("deliveries")} className="hover:text-blue-700">
            To deliver <strong className="text-gray-900 text-sm">{pendingDeliveries.length}</strong>
          </button>
          <button type="button" onClick={() => handleTabChange("deliveries")} className="hover:text-blue-700">
            On hold <strong className="text-gray-900 text-sm">{heldOnRoomOrders.length}</strong>
          </button>
          {loadingOrders && (
            <span className="flex items-center gap-1 text-blue-600">
              <RotateCcw className="w-3 h-3 animate-spin" /> Syncing
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-gray-500">Print as</span>
          <div className="w-56">
            <Segmented
              value={previewDocType === "a4" ? "a4" : paperSize}
              onChange={(v) => {
                if (v === "a4") setPreviewDocType("a4");
                else {
                  setPreviewDocType("thermal");
                  setPaperSize(v);
                }
              }}
              options={[
                { id: "a4", label: "A4" },
                { id: "80", label: "80mm" },
                { id: "58", label: "58mm" },
              ]}
            />
          </div>
        </div>
      </div>

      {/* ----------------------------- NEW ORDER ---------------------------- */}
      {activeTab === "new_order" && (
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-2">
          {/* LEFT: garments */}
          <Panel className="lg:col-span-7 flex flex-col min-h-0 p-2 gap-2">
            <div className="shrink-0 flex flex-wrap items-center justify-between gap-2">
              <Segmented
                value={catalogCategory}
                onChange={setCatalogCategory}
                options={[
                  { id: "All", label: "All" },
                  { id: "Men", label: "Men" },
                  { id: "Women", label: "Ladies" },
                  { id: "Kids", label: "Kids" },
                  { id: "Linen", label: "Linen" },
                ]}
              />
              <div className="flex items-center gap-1.5">
                <div className="relative w-44">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2" />
                  <Input
                    value={searchGarment}
                    onChange={(e) => setSearchGarment(e.target.value)}
                    placeholder="Search garment"
                    className="!h-7 pl-7 pr-6 text-xs"
                  />
                  {searchGarment && (
                    <button
                      onClick={() => setSearchGarment("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    handleTabChange("price_sheet");
                    setShowBatchAddSection(true);
                  }}
                  className="!h-7 text-[11px] font-semibold"
                >
                  <Plus className="w-3 h-3 mr-1" /> Add garments
                </Button>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto">
              {filteredGarments.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-gray-500">
                  <Shirt className="w-8 !h-8 text-gray-300 mb-2" />
                  <p className="font-semibold text-gray-800">
                    {catalog.length === 0 ? "No garments yet" : "No garments match"}
                  </p>
                  <p className="text-[11px] max-w-xs mt-1 mb-3">
                    {catalog.length === 0
                      ? "Add garments with their wash, iron and dry clean rates to start taking orders."
                      : "Try a different search or category."}
                  </p>
                  {catalog.length === 0 ? (
                    <Button
                      size="sm"
                      onClick={() => {
                        handleTabChange("price_sheet");
                        setShowBatchAddSection(true);
                      }}
                      className="!h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Plus className="w-3 h-3 mr-1" /> Add garments
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSearchGarment("");
                        setCatalogCategory("All");
                      }}
                      className="!h-7 text-xs"
                    >
                      Clear filters
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid gap-2.5 content-start" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))" }}>
                  {filteredGarments.map((garment) => {
                    const qtyFor = (care) =>
                      basket
                        .filter((b) => b.garmentId === garment.id && b.careType === care)
                        .reduce((s, b) => s + b.quantity, 0);
                    const total = CARE_IDS.reduce((s, c) => s + qtyFor(c), 0);
                    return (
                      <div
                        key={garment.id}
                        className={`rounded-lg border p-2.5 bg-white ${
                          total > 0 ? "border-blue-400 ring-1 ring-blue-200" : "border-gray-200"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <h4 className="font-semibold text-xs truncate" title={garment.name}>
                            {garment.name}
                          </h4>
                          <span className="text-[10px] text-gray-500 shrink-0">
                            {garment.category === "Women" ? "Ladies" : garment.category}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-1">
                          {CARE_IDS.map((care) => {
                            const ui = CARE_UI[care];
                            const q = qtyFor(care);
                            const rate = garment.rates?.[care] || 0;
                            return (
                              <button
                                key={care}
                                type="button"
                                disabled={rate <= 0}
                                onClick={() => handleAddToBasket(garment, care)}
                                className={`relative rounded border px-1 py-1.5 text-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                                  q > 0
                                    ? "border-blue-500 bg-blue-50"
                                    : "border-gray-200 bg-gray-50 hover:bg-blue-50 hover:border-blue-300"
                                }`}
                                title={ui.label}
                              >
                                <div className="text-[10px] text-gray-500 leading-tight">{ui.label}</div>
                                <div className="text-[12px] font-bold leading-tight">₹{rate}</div>
                                {q > 0 && (
                                  <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-1 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center">
                                    {q}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Panel>

          {/* RIGHT: order & settlement (fixed layout, only the item list scrolls) */}
          <Panel className="lg:col-span-5 flex flex-col min-h-0 overflow-hidden">
            {/* header */}
            <div className="shrink-0 flex items-center justify-between px-3 py-2 border-b border-gray-100">
              <div className="flex items-center gap-1.5 font-semibold">
                <Receipt className="w-4 h-4 text-blue-600" /> Order
                <span className="font-mono text-[11px] text-gray-500">#{token}</span>
              </div>
              {basket.length > 0 && (
                <button
                  type="button"
                  onClick={handleResetOrder}
                  className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-red-600"
                >
                  <Trash2 className="w-3 h-3" /> Clear
                </button>
              )}
            </div>

            {/* customer */}
            <div className="shrink-0 px-3 py-2 space-y-1.5 border-b border-gray-100">
              <Segmented
                value={collectionSource}
                onChange={setCollectionSource}
                options={[
                  { id: "room_pickup", label: "Room pickup" },
                  { id: "front_desk", label: "Front desk" },
                  { id: "walk_in", label: "Walk-in" },
                ]}
              />
              {collectionSource !== "walk_in" ? (
                <>
                  <Select value={selectedBookingId} onValueChange={handleBookingSelect}>
                    <SelectTrigger className="!h-8 text-xs">
                      <SelectValue placeholder="Choose checked-in room and guest" />
                    </SelectTrigger>
                    <SelectContent className="max-h-56">
                      {checkedInBookings.map((b) => {
                        const gInfo = resolveGuestDetails(b);
                        return (
                          <SelectItem key={b.booking_id} value={b.booking_id}>
                            Room {getDisplayRoomNumber(b, rooms) || "Unassigned"} — {gInfo.name || "Guest"}
                            {gInfo.phone ? ` (${gInfo.phone})` : ""}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <div className="h-5 flex items-center text-[11px] text-gray-600">
                    {selectedRoomNumber ? (
                      <span>
                        <strong className="text-gray-900">Room {selectedRoomNumber}</strong> ·{" "}
                        {guestName || "In-house guest"}
                        {guestMobile ? ` · ${guestMobile}` : ""}
                      </span>
                    ) : (
                      <span className="text-gray-400">Select a room to charge or track delivery</span>
                    )}
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-1.5">
                  <Input
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Guest name *"
                    className="!h-8 text-xs"
                  />
                  <Input
                    value={guestMobile}
                    onChange={(e) => setGuestMobile(e.target.value)}
                    placeholder="Mobile number"
                    className="!h-8 text-xs"
                  />
                </div>
              )}
            </div>

            {/* delivery */}
            <div className="shrink-0 px-3 py-2 space-y-1.5 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-700">Delivery</span>
                <button
                  type="button"
                  onClick={() => setEditSpeedsModalOpen(true)}
                  className="flex items-center gap-1 text-[11px] text-blue-600 hover:underline"
                >
                  <Settings className="w-3 h-3" /> Edit charges
                </button>
              </div>
              <div className="grid grid-cols-3 gap-1">
                {serviceSpeeds.map((sp) => (
                  <button
                    key={sp.id}
                    type="button"
                    onClick={() => handleServiceSpeedChange(sp.id)}
                    className={`rounded-md border py-1 text-center transition-colors ${
                      serviceSpeed === sp.id
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <div className="text-[11px] font-semibold truncate">{sp.shortLabel}</div>
                    <div className={`text-[10px] ${serviceSpeed === sp.id ? "text-blue-100" : "text-gray-500"}`}>
                      {speedExtraLabel(sp)}
                    </div>
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <div>
                  <span className="text-[10px] text-gray-500">Date</span>
                  <Input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="!h-7 text-[11px] px-1.5"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-gray-500">Time</span>
                  <Input
                    type="time"
                    value={deliveryTime}
                    onChange={(e) => setDeliveryTime(e.target.value)}
                    className="!h-7 text-[11px] px-1.5"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-gray-500">Extra fee (₹)</span>
                  <Input
                    type="number"
                    min="0"
                    value={customExtraCharge || ""}
                    onChange={(e) => setCustomExtraCharge(Math.max(0, Number(e.target.value) || 0))}
                    placeholder="0"
                    className="!h-7 text-[11px] px-1.5 text-right"
                  />
                </div>
              </div>
            </div>

            {/* items (the only scrolling region) */}
            <div className="flex-1 min-h-0 flex flex-col px-3 py-2">
              <div className="shrink-0 flex items-center justify-between mb-1">
                <span className="font-semibold text-gray-700">Items ({totals.totalGarments} pcs)</span>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto space-y-1 pr-0.5">
                {basket.length === 0 ? (
                  <div className="h-full min-h-16 flex flex-col items-center justify-center rounded-md border border-dashed border-gray-200 text-gray-400">
                    <p className="font-medium text-gray-500">No items yet</p>
                    <p className="text-[10px]">Tap a rate on a garment card to add it</p>
                  </div>
                ) : (
                  basket.map((item, idx) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-2 rounded-md border border-gray-200 bg-gray-50 px-2 py-1"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-[11px] truncate">{item.name}</div>
                        <div className="flex items-center gap-1">
                          <CareChip careType={item.careType} />
                          <span className="text-[10px] text-gray-500">₹{item.unitRate} each</span>
                        </div>
                      </div>
                      <div className="flex items-center rounded border border-gray-300 bg-white">
                        <button
                          type="button"
                          onClick={() => updateBasketQuantity(idx, -1)}
                          className="px-1.5 text-gray-600 hover:bg-gray-100 font-bold"
                        >
                          −
                        </button>
                        <span className="px-1.5 text-[11px] font-bold">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateBasketQuantity(idx, 1)}
                          className="px-1.5 text-gray-600 hover:bg-gray-100 font-bold"
                        >
                          +
                        </button>
                      </div>
                      <span className="w-12 text-right font-semibold text-[11px]">
                        ₹{(item.unitRate * item.quantity).toFixed(0)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeBasketItem(idx)}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* bill + actions, pinned to the bottom */}
            <div className="shrink-0 border-t border-gray-200 bg-gray-50 px-3 py-2 space-y-1.5">
              <div className="space-y-0.5 text-[11px] text-gray-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{totals.itemsSubtotal.toFixed(2)}</span>
                </div>
                {totals.surchargeAmount > 0 && (
                  <div className="flex justify-between">
                    <span>Delivery extra</span>
                    <span>₹{totals.surchargeAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>
                    GST {cgstRate + sgstRate}% (SAC {LAUNDRY_SAC_CODE})
                  </span>
                  <span>₹{totals.totalTax.toFixed(2)}</span>
                </div>
              </div>
              <div className="flex items-baseline justify-between border-t border-gray-300 pt-1.5">
                <span className="font-semibold text-gray-900">Total payable</span>
                <span className="text-lg font-bold text-gray-900">₹{totals.grandTotal.toFixed(2)}</span>
              </div>

              {inRoomMode ? (
                <>
                  <Button
                    type="button"
                    onClick={handleSettleToRoomFolio}
                    className="w-full !h-8 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Bed className="w-3.5 h-3.5 mr-1" /> Post to Room {selectedRoomNumber} bill
                  </Button>
                  <div className="grid grid-cols-2 gap-1.5">
                    <Button type="button" variant="outline" onClick={handleHoldOnRoom} className="!h-8 text-[11px] font-semibold">
                      <Clock className="w-3 h-3 mr-1" /> Hold on room
                    </Button>
                    <Button type="button" variant="outline" onClick={() => handleDirectPOSSettle("CASH")} className="!h-8 text-[11px] font-semibold">
                      <Banknote className="w-3 h-3 mr-1" /> Pay cash
                    </Button>
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-1.5">
                  <Button type="button" onClick={() => handleDirectPOSSettle("CASH")} className="!h-8 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white">
                    <Banknote className="w-3.5 h-3.5 mr-1" /> Pay cash
                  </Button>
                  <Button type="button" onClick={() => handleDirectPOSSettle("UPI")} className="!h-8 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white">
                    <CreditCard className="w-3.5 h-3.5 mr-1" /> Pay UPI
                  </Button>
                </div>
              )}
              <div className="grid grid-cols-2 gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (basket.length === 0) return toast.error("Add garments before printing.");
                    printA4(previewCurrent());
                  }}
                  className="!h-7 text-[11px]"
                >
                  <FileText className="w-3 h-3 mr-1" /> A4 bill
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (basket.length === 0) return toast.error("Add garments before printing.");
                    printSlip(previewCurrent());
                  }}
                  className="!h-7 text-[11px]"
                >
                  <Printer className="w-3 h-3 mr-1" /> {paperSize}mm slip
                </Button>
              </div>
            </div>
          </Panel>
        </div>
      )}

      {/* ----------------------------- DELIVERIES --------------------------- */}
      {activeTab === "deliveries" && (
        <Panel className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <div className="shrink-0 px-3 py-2 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2">
            <Segmented
              value={deliveryFilter}
              onChange={setDeliveryFilter}
              options={[
                { id: "pending", label: `Awaiting (${pendingDeliveries.length})` },
                { id: "held", label: `On hold (${heldOnRoomOrders.length})` },
                { id: "delivered", label: `Delivered today (${deliveredTodayList.length})` },
                { id: "all", label: `All (${allOrders.length})` },
              ]}
            />
            {roomsToDeliver.length > 0 && (
              <span className="flex items-center gap-1.5 text-[11px] text-gray-600">
                <Bed className="w-3.5 h-3.5 text-amber-600" />
                Rooms waiting: <strong className="text-gray-900">{roomsToDeliver.join(", ")}</strong>
              </span>
            )}
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-3">
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
                  <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <CheckCircle2 className="w-9 h-9 mb-2 text-emerald-400" />
                    <p className="font-semibold text-gray-700">Nothing here</p>
                    <p className="text-[11px]">New orders appear in this queue automatically.</p>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
                  {displayList.map((ord) => {
                    const isDelivered =
                      ord.delivery_status === "delivered_to_room" ||
                      ord.status === "Delivered" ||
                      ord.status === "delivered";
                    const isHeld = ord.paymentStatus === "HELD_ON_ROOM";
                    const counts = {};
                    (ord.items || []).forEach((it) => {
                      const c = careOf(it);
                      counts[c] = (counts[c] || 0) + (Number(it.quantity) || 1);
                    });
                    const pay = paymentBadge(ord);

                    return (
                      <div
                        key={ord.orderId || ord.token}
                        className={`rounded-lg border bg-white p-2.5 space-y-2 ${
                          isDelivered ? "border-gray-200 opacity-75" : isHeld ? "border-amber-300" : "border-gray-200"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm">
                              {ord.roomNumber === "Walk-In" ? "Walk-in" : `Room ${ord.roomNumber}`}
                            </span>
                            <span className="font-mono text-[10px] text-gray-500">#{ord.token || ord.orderId}</span>
                          </div>
                          <Badge
                            className={`text-[10px] font-semibold ${
                              isDelivered
                                ? "bg-emerald-100 text-emerald-800"
                                : isHeld
                                ? "bg-amber-100 text-amber-900"
                                : "bg-sky-100 text-sky-800"
                            }`}
                          >
                            {isDelivered ? "Delivered" : isHeld ? "On hold" : ord.status || "Received"}
                          </Badge>
                        </div>

                        <div className="flex items-start justify-between text-[11px]">
                          <div>
                            <div className="font-semibold">{ord.guestName || "Guest"}</div>
                            {ord.guestMobile && <div className="text-gray-500">{ord.guestMobile}</div>}
                          </div>
                          <div className="text-right text-gray-500">
                            <div>{ord.serviceSpeedLabel || ord.serviceSpeed}</div>
                            {ord.deliveryDateTime && <div className="text-gray-800 font-medium">Due {ord.deliveryDateTime}</div>}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="text-[11px] text-gray-500 mr-1">{ord.totalGarments || ord.items?.length} pcs</span>
                          {Object.entries(counts).map(([c, q]) => (
                            <CareChip key={c} careType={c} qty={q} />
                          ))}
                        </div>

                        <div className="flex items-center justify-between border-t border-gray-100 pt-1.5">
                          <span className="font-bold text-sm">₹{Number(ord.grandTotal || ord.totalAmount || 0).toFixed(2)}</span>
                          <Badge variant="outline" className={`text-[10px] font-semibold ${pay.cls}`}>
                            {pay.text}
                          </Badge>
                        </div>

                        {isHeld && (
                          <div className="grid grid-cols-2 gap-1.5">
                            <Button size="sm" variant="outline" onClick={() => handleReleaseHoldToCash(ord, "CASH")} className="!h-7 text-[11px] font-semibold">
                              Settle in cash
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleConvertHoldToRoomFolio(ord)} className="!h-7 text-[11px] font-semibold">
                              Post to room bill
                            </Button>
                          </div>
                        )}

                        {isDelivered ? (
                          <div className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 rounded px-2 py-1">
                            Delivered by {ord.delivered_by || "staff"}
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleMarkDeliveredToRoom(ord)}
                            className="w-full !h-7 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <Truck className="w-3 h-3 mr-1" /> Mark delivered
                          </Button>
                        )}

                        <div className="grid grid-cols-3 gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="!h-6 text-[11px] text-blue-700"
                            onClick={() => {
                              setPreviewDocType("a4");
                              setPreviewOrder(ord);
                            }}
                          >
                            Preview
                          </Button>
                          <Button size="sm" variant="outline" className="!h-6 text-[11px]" onClick={() => printA4(ord)}>
                            A4
                          </Button>
                          <Button size="sm" variant="outline" className="!h-6 text-[11px]" onClick={() => printSlip(ord)}>
                            {paperSize}mm
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </Panel>
      )}

      {/* ----------------------------- STATISTICS --------------------------- */}
      {activeTab === "statistics" && (() => {
        const day = dailyStatsMap[statsDateFilter];
        return (
          <Panel className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <div className="shrink-0 px-3 py-2 border-b border-gray-100 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-gray-500" />
              <span className="text-gray-600 font-medium">Date</span>
              <input
                type="date"
                value={statsDateFilter}
                onChange={(e) => setStatsDateFilter(e.target.value)}
                className="!h-7 bg-white border border-gray-300 rounded px-2 text-xs font-semibold"
              />
              {statsDateFilter !== currentDateStr && (
                <Button variant="ghost" size="sm" className="!h-7 text-[11px] text-blue-600" onClick={() => setStatsDateFilter(currentDateStr)}>
                  Today
                </Button>
              )}
              <span className="ml-auto text-[11px] text-gray-500">
                {day ? `${day.orders} orders · ${day.garments} pcs` : "No orders on this date"}
              </span>
            </div>

            <div className="shrink-0 grid grid-cols-2 md:grid-cols-5 gap-2 p-3">
              {CARE_IDS.map((c) => {
                const ui = CARE_UI[c];
                return (
                  <div key={c} className="rounded-lg border border-gray-200 p-2.5">
                    <div className="flex items-center gap-1 text-[11px] text-gray-600">
                      <ui.Icon className="w-3 h-3" /> {ui.label}
                    </div>
                    <div className="text-base font-bold mt-0.5">₹{(day?.care[c].amt || 0).toFixed(2)}</div>
                    <div className="text-[10px] text-gray-500">{day?.care[c].pcs || 0} garments</div>
                  </div>
                );
              })}
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-2.5">
                <div className="text-[11px] text-blue-800">Day total</div>
                <div className="text-base font-bold mt-0.5">₹{(day?.total || 0).toFixed(2)}</div>
                <div className="text-[10px] text-blue-800/70">
                  Folio ₹{(day?.folio || 0).toFixed(0)} · Direct ₹{(day?.pos || 0).toFixed(0)}
                </div>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-auto px-3 pb-3">
              <h4 className="font-semibold text-gray-700 mb-1.5">Daily revenue</h4>
              {Object.keys(dailyStatsMap).length === 0 ? (
                <div className="text-center py-8 text-gray-400">No laundry orders recorded yet.</div>
              ) : (
                <table className="w-full text-xs text-left border border-gray-200 rounded-lg">
                  <thead className="sticky top-0 bg-gray-50 text-gray-700">
                    <tr className="border-b border-gray-200">
                      <th className="py-1.5 px-3 font-semibold">Date</th>
                      <th className="py-1.5 px-3 text-center font-semibold">Orders</th>
                      <th className="py-1.5 px-3 text-center font-semibold">Pcs</th>
                      <th className="py-1.5 px-3 text-right font-semibold">Wash</th>
                      <th className="py-1.5 px-3 text-right font-semibold">Wash + Iron</th>
                      <th className="py-1.5 px-3 text-right font-semibold">Iron</th>
                      <th className="py-1.5 px-3 text-right font-semibold">Dry clean</th>
                      <th className="py-1.5 px-3 text-right font-semibold">Room bill</th>
                      <th className="py-1.5 px-3 text-right font-semibold">Cash / UPI</th>
                      <th className="py-1.5 px-3 text-right font-semibold">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {Object.values(dailyStatsMap)
                      .sort((a, b) => (b.date > a.date ? 1 : -1))
                      .map((d) => (
                        <tr
                          key={d.date}
                          onClick={() => setStatsDateFilter(d.date)}
                          className={`cursor-pointer hover:bg-gray-50 ${d.date === statsDateFilter ? "bg-blue-50/60" : ""}`}
                        >
                          <td className="py-1.5 px-3 font-semibold">
                            {d.date}
                            {d.date === currentDateStr ? " (today)" : ""}
                          </td>
                          <td className="py-1.5 px-3 text-center">{d.orders}</td>
                          <td className="py-1.5 px-3 text-center">{d.garments}</td>
                          <td className="py-1.5 px-3 text-right">₹{d.care.wash_only.amt.toFixed(2)}</td>
                          <td className="py-1.5 px-3 text-right">₹{d.care.wash_and_press.amt.toFixed(2)}</td>
                          <td className="py-1.5 px-3 text-right">₹{d.care.press_only.amt.toFixed(2)}</td>
                          <td className="py-1.5 px-3 text-right">₹{d.care.dry_clean.amt.toFixed(2)}</td>
                          <td className="py-1.5 px-3 text-right">₹{d.folio.toFixed(2)}</td>
                          <td className="py-1.5 px-3 text-right">₹{d.pos.toFixed(2)}</td>
                          <td className="py-1.5 px-3 text-right font-bold">₹{d.total.toFixed(2)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </div>
          </Panel>
        );
      })()}

      {/* ------------------------------ RATES ------------------------------- */}
      {activeTab === "price_sheet" && (
        <Panel className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <div className="shrink-0 px-3 py-2 border-b border-gray-100 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  onClick={() => setShowBatchAddSection(!showBatchAddSection)}
                  className="!h-7 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="w-3 h-3 mr-1" /> {showBatchAddSection ? "Close form" : "Add garments"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditSpeedsModalOpen(true)} className="!h-7 text-xs">
                  <Settings className="w-3 h-3 mr-1" /> Delivery charges
                </Button>
              </div>
              <div className="flex items-center gap-1.5">
                <Button size="sm" variant="outline" onClick={handleResetCatalog} disabled={isSavingConfig} className="!h-7 text-xs text-gray-600">
                  <RotateCcw className="w-3 h-3 mr-1" /> Clear all
                </Button>
                <Button size="sm" onClick={handleSaveToBackendDatabase} disabled={isSavingConfig} className="!h-7 text-xs font-semibold bg-gray-900 hover:bg-gray-800 text-white">
                  <Save className="w-3 h-3 mr-1" /> {isSavingConfig ? "Saving..." : "Save rates"}
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <span className="flex items-center gap-1 font-semibold text-gray-700">
                <Clock className="w-3.5 h-3.5 text-gray-500" /> Delivery extra
              </span>
              {serviceSpeeds.map((sp) => (
                <div key={sp.id} className="flex items-center gap-1 rounded border border-gray-200 px-2 py-1">
                  <span className="font-semibold">{sp.shortLabel}</span>
                  <Input
                    type="number"
                    min="0"
                    value={sp.surchargePercent}
                    onChange={(e) => handleSpeedSurchargeChange(sp.id, e.target.value, sp.flatExtraAmount)}
                    className="!h-6 w-12 text-center text-xs px-1"
                  />
                  <span className="text-gray-500">%</span>
                  <span className="text-gray-300">|</span>
                  <span className="text-gray-500">₹</span>
                  <Input
                    type="number"
                    min="0"
                    value={sp.flatExtraAmount || 0}
                    onChange={(e) => handleSpeedSurchargeChange(sp.id, sp.surchargePercent, e.target.value)}
                    className="!h-6 w-12 text-center text-xs px-1"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3">
            {showBatchAddSection && (
              <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-2.5 space-y-2">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-[11px] text-gray-600 text-left">
                        <th className="pb-1 min-w-[150px] font-semibold">Garment name *</th>
                        <th className="pb-1 w-28 font-semibold">Category</th>
                        <th className="pb-1 w-20 text-center font-semibold">Wash ₹</th>
                        <th className="pb-1 w-24 text-center font-semibold">Wash + Iron ₹</th>
                        <th className="pb-1 w-20 text-center font-semibold">Iron ₹</th>
                        <th className="pb-1 w-24 text-center font-semibold">Dry clean ₹</th>
                        <th className="pb-1 w-8" />
                      </tr>
                    </thead>
                    <tbody>
                      {batchGarments.map((row, idx) => (
                        <tr key={idx}>
                          <td className="py-0.5 pr-1.5">
                            <Input
                              placeholder={idx === 0 ? "e.g. Shirt" : idx === 1 ? "e.g. Saree" : "e.g. Bedsheet"}
                              value={row.name}
                              onChange={(e) => handleUpdateBatchRow(idx, "name", e.target.value)}
                              className="!h-7 text-xs bg-white"
                            />
                          </td>
                          <td className="py-0.5 pr-1.5">
                            <select
                              value={row.category}
                              onChange={(e) => handleUpdateBatchRow(idx, "category", e.target.value)}
                              className="!h-7 text-xs bg-white border border-gray-200 rounded px-2 w-full"
                            >
                              <option value="Men">Men</option>
                              <option value="Women">Ladies</option>
                              <option value="Kids">Kids</option>
                              <option value="Linen">Linen</option>
                              <option value="Other">Other</option>
                            </select>
                          </td>
                          {["wash_only", "wash_and_press", "press_only", "dry_clean"].map((f) => (
                            <td key={f} className="py-0.5 pr-1.5">
                              <Input
                                type="number"
                                min="0"
                                placeholder="0"
                                value={row[f]}
                                onChange={(e) => handleUpdateBatchRow(idx, f, e.target.value)}
                                className="!h-7 text-xs bg-white text-center"
                              />
                            </td>
                          ))}
                          <td className="py-0.5 text-center">
                            <button type="button" onClick={() => handleRemoveBatchRow(idx)} className="text-gray-400 hover:text-red-600 p-1">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-between">
                  <Button type="button" variant="outline" size="sm" onClick={handleAddBatchRow} className="!h-7 text-xs bg-white">
                    <Plus className="w-3 h-3 mr-1" /> Add row
                  </Button>
                  <div className="flex items-center gap-1.5">
                    <Button type="button" variant="outline" size="sm" onClick={() => setShowBatchAddSection(false)} className="!h-7 text-xs">
                      Cancel
                    </Button>
                    <Button type="button" size="sm" onClick={handleSaveBatchGarments} disabled={isSavingConfig} className="!h-7 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white">
                      <Save className="w-3 h-3 mr-1" /> Save garments
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <table className="w-full text-xs text-left border border-gray-200">
              <thead className="sticky top-0 bg-gray-50 text-gray-700 z-10">
                <tr className="border-b border-gray-200">
                  <th className="py-1.5 px-3 font-semibold">Garment</th>
                  <th className="py-1.5 px-3 font-semibold">Category</th>
                  <th className="py-1.5 px-3 text-center font-semibold">Wash ₹</th>
                  <th className="py-1.5 px-3 text-center font-semibold">Wash + Iron ₹</th>
                  <th className="py-1.5 px-3 text-center font-semibold">Iron ₹</th>
                  <th className="py-1.5 px-3 text-center font-semibold">Dry clean ₹</th>
                  <th className="py-1.5 px-3 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {catalog.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-gray-500">
                      <Shirt className="w-7 !h-7 text-gray-300 mx-auto mb-2" />
                      <p className="font-semibold text-gray-700">No garments yet</p>
                      <p className="text-[11px] mt-0.5">Use “Add garments” to build your rate sheet.</p>
                    </td>
                  </tr>
                ) : (
                  catalog.map((garment) => (
                    <tr key={garment.id} className="hover:bg-gray-50">
                      <td className="py-1.5 px-3 font-semibold">{garment.name}</td>
                      <td className="py-1.5 px-3 text-gray-500">{garment.category === "Women" ? "Ladies" : garment.category}</td>
                      {["wash_only", "wash_and_press", "press_only", "dry_clean"].map((f) => (
                        <td key={f} className="py-1 px-3 text-center">
                          <Input
                            type="number"
                            value={garment.rates?.[f] || ""}
                            onChange={(e) => handlePriceChange(garment.id, f, e.target.value)}
                            className="!h-7 w-20 mx-auto text-xs text-center"
                          />
                        </td>
                      ))}
                      <td className="py-1 px-3 text-right">
                        <button type="button" onClick={() => handleDeleteGarment(garment.id)} className="text-gray-400 hover:text-red-600 p-1">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {/* ------------------------------ TRACKER ----------------------------- */}
      {activeTab === "tracker" && (
        <Panel className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <div className="shrink-0 px-3 py-2 border-b border-gray-100 flex items-center gap-2">
            <div className="relative w-56">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <Input
                value={barcodeQuery}
                onChange={(e) => setBarcodeQuery(e.target.value)}
                placeholder="Scan token, room or guest"
                className="!h-7 pl-8 text-xs"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="!h-7 text-xs w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="received">Received</SelectItem>
                <SelectItem value="in process">In process</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
              </SelectContent>
            </Select>
            <span className="ml-auto text-[11px] text-gray-500">{filteredTrackerOrders.length} orders</span>
          </div>

          <div className="flex-1 min-h-0 overflow-auto">
            {filteredTrackerOrders.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <Barcode className="w-8 !h-8 mb-2 opacity-50" />
                <p className="font-semibold text-gray-700">No matching orders</p>
              </div>
            ) : (
              <table className="w-full text-xs text-left">
                <thead className="sticky top-0 bg-gray-50 text-gray-700">
                  <tr className="border-b border-gray-200">
                    <th className="py-1.5 px-3 font-semibold">Token</th>
                    <th className="py-1.5 px-3 font-semibold">Room / guest</th>
                    <th className="py-1.5 px-3 font-semibold">Pcs</th>
                    <th className="py-1.5 px-3 font-semibold">Due</th>
                    <th className="py-1.5 px-3 text-right font-semibold">Amount</th>
                    <th className="py-1.5 px-3 font-semibold">Payment</th>
                    <th className="py-1.5 px-3 font-semibold">Status</th>
                    <th className="py-1.5 px-3 text-right font-semibold">Print</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredTrackerOrders.map((ord) => {
                    const pay = paymentBadge(ord);
                    return (
                      <tr key={ord.orderId || ord.token} className="hover:bg-gray-50">
                        <td className="py-1.5 px-3 font-mono font-semibold text-blue-800">#{ord.token || ord.orderId}</td>
                        <td className="py-1.5 px-3">
                          <div className="font-semibold">{ord.roomNumber === "Walk-In" ? "Walk-in" : `Room ${ord.roomNumber}`}</div>
                          <div className="text-[10px] text-gray-500">{ord.guestName}</div>
                        </td>
                        <td className="py-1.5 px-3">{ord.totalGarments || ord.items?.length}</td>
                        <td className="py-1.5 px-3 text-gray-600">{ord.deliveryDateTime || ord.createdAt?.split("T")[0]}</td>
                        <td className="py-1.5 px-3 text-right font-bold">₹{Number(ord.grandTotal || ord.totalAmount || 0).toFixed(2)}</td>
                        <td className="py-1.5 px-3">
                          <Badge variant="outline" className={`text-[10px] font-semibold ${pay.cls}`}>
                            {pay.text}
                          </Badge>
                        </td>
                        <td className="py-1.5 px-3">
                          <Select value={ord.status || "Received"} onValueChange={(val) => handleUpdateOrderStatus(ord.orderId, val)}>
                            <SelectTrigger className="!h-6 w-28 text-[11px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Received">Received</SelectItem>
                              <SelectItem value="In Process">In process</SelectItem>
                              <SelectItem value="Ready">Ready</SelectItem>
                              <SelectItem value="Delivered">Delivered</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="py-1.5 px-3">
                          <div className="flex items-center justify-end gap-1">
                            <Button size="sm" variant="outline" className="!h-6 px-2 text-[11px]" onClick={() => printA4(ord)}>
                              <FileText className="w-3 h-3 mr-1" /> A4
                            </Button>
                            <Button size="sm" variant="outline" className="!h-6 px-2 text-[11px]" onClick={() => printSlip(ord)}>
                              <Printer className="w-3 h-3 mr-1" /> {paperSize}mm
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </Panel>
      )}

      {/* --------------------------- BILL PREVIEW --------------------------- */}
      {previewOrder && (
        <Dialog open={Boolean(previewOrder)} onOpenChange={() => setPreviewOrder(null)}>
          <DialogContent
            className={`${previewDocType === "a4" ? "max-w-4xl" : "max-w-md"} p-3 bg-gray-100 max-h-[92vh] flex flex-col`}
          >
            <DialogHeader className="shrink-0 pb-2 border-b border-gray-200">
              <DialogTitle className="text-xs font-semibold flex flex-wrap items-center justify-between gap-2">
                <span className="flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-blue-600" />
                  Laundry bill #{previewOrder.token || previewOrder.orderId}
                  {previewOrder.roomNumber && previewOrder.roomNumber !== "Walk-In" && (
                    <Badge className="bg-blue-600 text-white text-[10px]">Room {previewOrder.roomNumber}</Badge>
                  )}
                </span>
                <Segmented
                  value={previewDocType === "a4" ? "a4" : paperSize}
                  onChange={(v) => {
                    if (v === "a4") setPreviewDocType("a4");
                    else {
                      setPreviewDocType("thermal");
                      setPaperSize(v);
                    }
                  }}
                  options={[
                    { id: "a4", label: "A4 invoice" },
                    { id: "80", label: "80mm" },
                    { id: "58", label: "58mm" },
                  ]}
                />
              </DialogTitle>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto my-2 p-3 bg-white border border-gray-300 rounded-lg w-full">
              {previewDocType === "a4" ? (
                <div dangerouslySetInnerHTML={{ __html: getLaundryA4BillHTML({ order: previewOrder, institutionData }) }} />
              ) : (
                <div
                  className="font-mono max-w-sm mx-auto"
                  dangerouslySetInnerHTML={{
                    __html: getLaundryThermalSlipHTML({ order: previewOrder, institutionData, paperSize }),
                  }}
                />
              )}
            </div>

            <DialogFooter className="shrink-0 pt-2 border-t border-gray-200 flex flex-row items-center justify-between gap-2">
              <Button variant="outline" size="sm" onClick={() => setPreviewOrder(null)} className="!h-8 text-xs">
                Close
              </Button>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" className="!h-8 text-xs" onClick={() => printA4(previewOrder)}>
                  <FileText className="w-3.5 h-3.5 mr-1" /> Print A4
                </Button>
                <Button size="sm" className="!h-8 text-xs bg-gray-900 text-white hover:bg-gray-800" onClick={() => printSlip(previewOrder)}>
                  <Printer className="w-3.5 h-3.5 mr-1" /> Print {paperSize}mm
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ------------------------- DELIVERY CHARGES ------------------------- */}
      <Dialog open={editSpeedsModalOpen} onOpenChange={setEditSpeedsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" /> Delivery speeds and extra charges
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-1 text-xs">
            <p className="text-[11px] text-gray-500">
              Set a percentage, a flat fee in ₹, or both for each delivery speed.
            </p>
            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {serviceSpeeds.map((sp, idx) => {
                const patch = (changes) => {
                  const updated = [...serviceSpeeds];
                  updated[idx] = { ...updated[idx], ...changes };
                  setServiceSpeeds(updated);
                };
                return (
                  <div key={sp.id} className="p-2.5 rounded-lg border border-gray-200 space-y-2">
                    <div className="font-semibold">
                      {sp.shortLabel} <span className="font-normal text-gray-500">({sp.label})</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-[10px] text-gray-600 block mb-0.5">Label</Label>
                        <Input value={sp.shortLabel} onChange={(e) => patch({ shortLabel: e.target.value })} className="!h-7 text-xs" />
                      </div>
                      <div>
                        <Label className="text-[10px] text-gray-600 block mb-0.5">Extra (%)</Label>
                        <Input
                          type="number"
                          min="0"
                          value={sp.surchargePercent}
                          onChange={(e) => patch({ surchargePercent: Math.max(0, Number(e.target.value) || 0) })}
                          className="!h-7 text-xs text-center"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-gray-600 block mb-0.5">Flat extra (₹)</Label>
                        <Input
                          type="number"
                          min="0"
                          value={sp.flatExtraAmount || 0}
                          onChange={(e) => patch({ flatExtraAmount: Math.max(0, Number(e.target.value) || 0) })}
                          className="!h-7 text-xs text-center"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setEditSpeedsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={isSavingConfig}
              onClick={async () => {
                setIsSavingConfig(true);
                try {
                  await saveLaundryConfigToBackend({ catalog, serviceSpeeds, institutionData, updateInstitutionData });
                  toast.success("Delivery charges saved");
                  setEditSpeedsModalOpen(false);
                } catch (e) {
                  toast.error("Could not save delivery charges");
                } finally {
                  setIsSavingConfig(false);
                }
              }}
              className="bg-gray-900 text-white hover:bg-gray-800 font-semibold"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}