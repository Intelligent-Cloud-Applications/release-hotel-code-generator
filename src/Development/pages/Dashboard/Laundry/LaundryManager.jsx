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
  QrCode,
  Settings,
  Eye,
  TrendingUp,
  BarChart3,
  RefreshCw,
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
  fetchDeliveriesBackend,
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

const ymd = (d = new Date()) => {
  const date = new Date(d);
  if (isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Robust room number resolution helper
 * Ensures human room numbers (e.g. "101", "102") are always returned instead of internal UUIDs
 */
export const resolveSingleRoomNumber = (item, roomsList = [], booking = null) => {
  if (item === null || item === undefined) return "";
  const str = String(item).replace(/^,+|,+$/g, "").trim();
  if (!str) return "";

  // 1. Direct lookup in roomsList by room_id or id or room_number
  const matched = (roomsList || []).find(
    (r) =>
      String(r.room_id || r.id || "").toLowerCase() === str.toLowerCase() ||
      String(r.room_number || r.number || "").toLowerCase() === str.toLowerCase()
  );
  if (matched?.room_number || matched?.number) {
    return String(matched.room_number || matched.number).trim();
  }

  // 2. Lookup in cached hotel_rooms in localStorage
  try {
    const cached = localStorage.getItem("hotel_rooms");
    if (cached) {
      const parsed = JSON.parse(cached);
      const hit = (parsed || []).find(
        (r) =>
          String(r.room_id || r.id || "").toLowerCase() === str.toLowerCase() ||
          String(r.room_number || r.number || "").toLowerCase() === str.toLowerCase()
      );
      if (hit?.room_number || hit?.number) {
        return String(hit.room_number || hit.number).trim();
      }
    }
  } catch (e) {}

  // 3. Lookup in booking.rooms_config or booking.rooms
  if (booking) {
    const configArr = [
      ...(Array.isArray(booking.rooms_config) ? booking.rooms_config : []),
      ...(Array.isArray(booking.rooms) ? booking.rooms : []),
    ];
    const cfgHit = configArr.find(
      (c) =>
        String(c?.room_id || c?.id || "").toLowerCase() === str.toLowerCase() ||
        String(c?.room_number || c?.number || "").toLowerCase() === str.toLowerCase()
    );
    if (cfgHit?.room_number || cfgHit?.number) {
      return String(cfgHit.room_number || cfgHit.number).trim();
    }
  }

  // 4. If str is a UUID and not resolved, NEVER return raw UUID
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
  if (isUuid) {
    return "";
  }

  return str;
};

export const getBookingRoomNumbers = (booking, roomsList = []) => {
  if (!booking) return [];

  const rawItems = [];
  const add = (val) => {
    if (val === null || val === undefined) return;
    if (Array.isArray(val)) {
      val.forEach(add);
    } else if (typeof val === "string") {
      val.split(",").forEach((s) => {
        const trimmed = s.trim();
        if (trimmed) rawItems.push(trimmed);
      });
    } else if (typeof val === "number") {
      rawItems.push(String(val));
    }
  };

  // Add room_id and room_ids
  add(booking.room_id);
  add(booking.room_ids);

  // Add rooms_config and rooms
  if (Array.isArray(booking.rooms_config)) {
    booking.rooms_config.forEach((r) => {
      if (r?.room_number) add(r.room_number);
      else if (r?.room_id) add(r.room_id);
    });
  }
  if (Array.isArray(booking.rooms)) {
    booking.rooms.forEach((r) => {
      if (r?.room_number) add(r.room_number);
      else if (r?.room_id) add(r.room_id);
    });
  }

  // Add room_number and room_numbers
  add(booking.room_number);
  add(booking.room_numbers);
  add(booking.roomNumber);
  add(booking.roomNo);
  add(booking.allocated_room);

  // Add keys from room_charges and services
  if (booking.room_charges && typeof booking.room_charges === "object") {
    Object.keys(booking.room_charges).forEach(add);
  }
  if (booking.services && typeof booking.services === "object") {
    Object.keys(booking.services).forEach(add);
  }

  const resolvedList = [];
  rawItems.forEach((item) => {
    const resolved = resolveSingleRoomNumber(item, roomsList, booking);
    if (resolved && !resolvedList.includes(resolved)) {
      resolvedList.push(resolved);
    }
  });

  return resolvedList;
};

export const getDisplayRoomNumber = (booking, roomsList = []) => {
  if (!booking) return "";
  const list = getBookingRoomNumbers(booking, roomsList);
  if (list.length > 0) {
    return list.join(", ");
  }
  return booking.allocated_room ? String(booking.allocated_room) : "";
};

export const formatDisplayRoom = (roomVal, roomsList = []) => {
  if (!roomVal || roomVal === "Walk-In") return roomVal || "Walk-In";
  const str = String(roomVal);
  if (!str.includes("-") && !str.includes(",")) return str;
  const parts = str.split(",").map((s) => s.trim()).filter(Boolean);
  const resolved = parts
    .map((p) => resolveSingleRoomNumber(p, roomsList))
    .filter(Boolean);
  return resolved.length > 0 ? resolved.join(", ") : str;
};

/* Small shared pieces ------------------------------------------------------ */
const Panel = ({ className = "", children }) => (
  <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>{children}</div>
);

const Segmented = ({ value, onChange, options, className = "", size = "normal" }) => (
  <div
    className={`grid gap-0.5 bg-gray-100 p-0.5 rounded-md ${className}`}
    style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
  >
    {options.map((o) => (
      <button
        key={o.id}
        type="button"
        onClick={() => onChange(o.id)}
        className={`${size === "sm" ? "px-2 py-1 text-[11px]" : "px-3 py-1.5 text-[12px]"} rounded font-semibold transition-colors ${
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

const SvgDonutChart = ({
  data = [],
  size = 124,
  strokeWidth = 20,
  centerValue = "",
  centerLabel = "",
}) => {
  const total = data.reduce((sum, d) => sum + (Number(d.value) || 0), 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  return (
    <div className="relative inline-flex items-center justify-center shrink-0">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="#f1f5f9"
          strokeWidth={strokeWidth}
        />
        {total > 0 &&
          data.map((item, idx) => {
            if (!item.value || item.value <= 0) return null;
            const itemPercent = (item.value / total) * 100;
            const strokeDasharray = `${(itemPercent / 100) * circumference} ${circumference}`;
            const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
            accumulatedPercent += itemPercent;

            return (
              <circle
                key={idx}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke={item.color}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-300 hover:opacity-80"
              >
                <title>{`${item.label}: ₹${Number(item.value).toFixed(2)} (${itemPercent.toFixed(1)}%)`}</title>
              </circle>
            );
          })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-1">
        <span className="text-xs font-bold text-gray-900 leading-tight">
          {centerValue || (total > 0 ? `₹${total >= 1000 ? `${(total / 1000).toFixed(1)}k` : total.toFixed(0)}` : "₹0")}
        </span>
        {centerLabel && (
          <span className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold">
            {centerLabel}
          </span>
        )}
      </div>
    </div>
  );
};


const paymentBadge = (ord) => {
  if (ord.paymentStatus === "POSTED_TO_ROOM_BILL")
    return { text: "Posted to room bill", cls: "bg-emerald-50 text-emerald-800 border-emerald-200" };
  if (ord.paymentStatus === "HELD_ON_ROOM")
    return { text: "Held on room", cls: "bg-amber-50 text-amber-900 border-amber-300" };
  return { text: ord.paymentMethod || "Paid", cls: "bg-gray-100 text-gray-800 border-gray-200" };
};

const isOrderDelivered = (ord) => {
  if (!ord) return false;
  const s = String(ord.status || "").toLowerCase();
  const ds = String(ord.delivery_status || "").toLowerCase();
  return (
    ord.is_delivered === true ||
    ord.delivered_to_room === true ||
    ds === "delivered_to_room" ||
    ds === "delivered" ||
    s === "delivered"
  );
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
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  const [statsRangeType, setStatsRangeType] = useState("today");
  const [statsCustomFrom, setStatsCustomFrom] = useState(currentDateStr);
  const [statsCustomTo, setStatsCustomTo] = useState(currentDateStr);
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState(null);
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

  /* Orders: 100% sourced from backend database (no localStorage) ---------- */
  const [allOrders, setAllOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const loadLaundryOrders = async () => {
    setLoadingOrders(true);
    try {
      const catalogData = await fetchLaundryCatalogBackend(currentInstitutionId);
      if (catalogData) {
        if (Array.isArray(catalogData.catalog) && catalogData.catalog.length > 0) {
          setCatalog(catalogData.catalog);
        }
        if (Array.isArray(catalogData.serviceSpeeds) && catalogData.serviceSpeeds.length > 0) {
          setServiceSpeeds(catalogData.serviceSpeeds);
        }
      }

      // Query database for orders and deliveries
      const [remoteOrders, remoteDeliveries] = await Promise.all([
        fetchLaundryOrdersBackend(currentInstitutionId).catch(() => []),
        fetchDeliveriesBackend(currentInstitutionId).catch(() => []),
      ]);

      const ordersMap = new Map();

      // 1. Add orders returned from backend database
      (remoteOrders || []).forEach((o) => {
        const key = o.orderId || o.order_id || o.service_id || o.token || o.id;
        if (key) ordersMap.set(String(key), o);
        if (o.token && String(o.token) !== String(key)) {
          ordersMap.set(String(o.token), o);
        }
      });

      // 2. Merge delivery statuses from /laundry/deliveries endpoint (ensures delivered/pending status is 100% accurate from DB)
      (remoteDeliveries || []).forEach((del) => {
        const key = del.order_id || del.service_id || del.token || del.id;
        const matched = ordersMap.get(String(key)) || (del.token ? ordersMap.get(String(del.token)) : null);
        if (matched) {
          const updated = {
            ...matched,
            status: del.status || matched.status,
            delivery_status: del.delivery_status || matched.delivery_status,
            is_delivered: del.is_delivered ?? matched.is_delivered,
            delivered_to_room: del.delivered_to_room ?? del.is_delivered ?? matched.delivered_to_room,
            delivered_at: del.delivered_at || matched.delivered_at,
            delivered_by: del.delivered_by || matched.delivered_by,
            target_delivery_time: del.target_delivery_time || matched.target_delivery_time,
          };
          ordersMap.set(String(key), updated);
          if (del.token) ordersMap.set(String(del.token), updated);
        } else if (key) {
          const adapted = {
            orderId: del.order_id || del.token,
            order_id: del.order_id || del.token,
            service_id: del.order_id || del.token,
            token: del.token,
            barcode: del.barcode || del.token,
            roomNumber: del.room_number || "Walk-In",
            guestName: del.guest_name || "Guest",
            guestMobile: del.guest_phone || "",
            totalGarments: del.total_garments || 0,
            grandTotal: del.grand_total || 0,
            totalAmount: del.grand_total || 0,
            status: del.status || "collected",
            delivery_status: del.delivery_status || (del.is_delivered ? "delivered_to_room" : "pending_delivery"),
            is_delivered: Boolean(del.is_delivered),
            delivered_to_room: Boolean(del.is_delivered),
            delivered_at: del.delivered_at || null,
            delivered_by: del.delivered_by || null,
            target_delivery_time: del.target_delivery_time,
            serviceSpeed: del.turnaround_speed || "standard",
            createdAt: del.created_at
              ? (typeof del.created_at === "number" ? new Date(del.created_at).toISOString() : del.created_at)
              : new Date().toISOString(),
            items: [],
          };
          ordersMap.set(String(key), adapted);
        }
      });

      // 3. Scan active checked-in bookings for any room-posted laundry folio entries
      (bookings || []).forEach((b) => {
        if (b.detailedServices && typeof b.detailedServices === "object") {
          Object.entries(b.detailedServices).forEach(([rNum, dateMap]) => {
            if (dateMap && typeof dateMap === "object") {
              Object.entries(dateMap).forEach(([dateStr, sList]) => {
                if (Array.isArray(sList)) {
                  sList.forEach((s) => {
                    if (s && (s.service_type === "laundry" || s.serviceType === "laundry")) {
                      const sKey = s.service_id || s.order_id || s.token || s.id;
                      if (sKey) {
                        const existing = ordersMap.get(String(sKey)) || (s.token ? ordersMap.get(String(s.token)) : null);
                        if (!existing) {
                          ordersMap.set(String(sKey), {
                            orderId: sKey,
                            order_id: sKey,
                            service_id: sKey,
                            token: s.token || sKey,
                            barcode: s.barcode || s.token || sKey,
                            roomNumber: rNum || s.roomNumber || b.room_id || "",
                            bookingId: b.booking_id,
                            guestName: s.guestName || b.guest_name || b.booking_name || `Guest (Room ${rNum})`,
                            guestMobile: b.guest_phone || b.mobile || "",
                            totalGarments: s.totalGarments || (s.items || []).length || 1,
                            grandTotal: s.totalAmount || s.laundry_charges || 0,
                            totalAmount: s.totalAmount || s.laundry_charges || 0,
                            settlementType: "ROOM_FOLIO",
                            paymentMethod: "ROOM_FOLIO",
                            paymentStatus: "POSTED_TO_ROOM_BILL",
                            status: s.status || "Received",
                            delivery_status: s.delivery_status || "pending_delivery",
                            is_delivered: Boolean(s.is_delivered || s.delivered_to_room),
                            delivered_to_room: Boolean(s.is_delivered || s.delivered_to_room),
                            createdAt: s.created_at
                              ? (typeof s.created_at === "number" ? new Date(s.created_at).toISOString() : s.created_at)
                              : `${dateStr}T12:00:00Z`,
                            items: s.items || [],
                          });
                        }
                      }
                    }
                  });
                }
              });
            }
          });
        }
      });

      // Deduplicate orders by unique key
      const uniqueOrders = [];
      const seenKeys = new Set();
      ordersMap.forEach((ord) => {
        const uniqueKey = ord.orderId || ord.order_id || ord.service_id || ord.token || ord.id;
        if (uniqueKey && !seenKeys.has(String(uniqueKey))) {
          seenKeys.add(String(uniqueKey));
          uniqueOrders.push(ord);
        }
      });

      // Sort descending by date
      uniqueOrders.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.created_at || a.orderDate || 0).getTime();
        const dateB = new Date(b.createdAt || b.created_at || b.orderDate || 0).getTime();
        return dateB - dateA;
      });

      setAllOrders(uniqueOrders);
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

  useEffect(() => {
    if (activeTab === "deliveries" || activeTab === "tracker") {
      loadLaundryOrders();
    }
  }, [activeTab]);

  const persistOrders = (updatedList) => {
    setAllOrders(updatedList);
  };

  const checkedInBookings = useMemo(
    () =>
      (bookings || []).filter(
        (b) => b.status === "Checked-in" || b.status === "confirmed" || b.reservation_status === "Checked-in"
      ),
    [bookings]
  );

  const roomPickupOptions = useMemo(() => {
    const options = [];
    (checkedInBookings || []).forEach((b) => {
      const gInfo = resolveGuestDetails(b);
      const bRooms = getBookingRoomNumbers(b, rooms);
      if (bRooms.length > 1) {
        bRooms.forEach((rNum) => {
          options.push({
            value: `${b.booking_id}:::${rNum}`,
            booking_id: b.booking_id,
            roomNumber: rNum,
            guestInfo: gInfo,
            label: `Room ${rNum} — ${gInfo.name || "In-House Guest"}${gInfo.phone ? ` (${gInfo.phone})` : ""}`,
          });
        });
      } else if (bRooms.length === 1) {
        const rNum = bRooms[0];
        options.push({
          value: `${b.booking_id}:::${rNum}`,
          booking_id: b.booking_id,
          roomNumber: rNum,
          guestInfo: gInfo,
          label: `Room ${rNum} — ${gInfo.name || "In-House Guest"}${gInfo.phone ? ` (${gInfo.phone})` : ""}`,
        });
      } else {
        const rNum = getDisplayRoomNumber(b, rooms) || "Unassigned";
        options.push({
          value: b.booking_id,
          booking_id: b.booking_id,
          roomNumber: rNum !== "Unassigned" ? rNum : "",
          guestInfo: gInfo,
          label: `Room ${rNum} — ${gInfo.name || "In-House Guest"}${gInfo.phone ? ` (${gInfo.phone})` : ""}`,
        });
      }
    });
    return options;
  }, [checkedInBookings, rooms, guests]);

  const selectedPickupValue = useMemo(() => {
    if (!selectedBookingId) return "";
    if (selectedRoomNumber) {
      const compound = `${selectedBookingId}:::${selectedRoomNumber}`;
      const exists = roomPickupOptions.some((o) => o.value === compound);
      if (exists) return compound;
    }
    const singleMatch = roomPickupOptions.find((o) => o.booking_id === selectedBookingId);
    return singleMatch ? singleMatch.value : selectedBookingId;
  }, [selectedBookingId, selectedRoomNumber, roomPickupOptions]);

  useEffect(() => {
    if (!initialRoomNumber) return;
    const targetRoomStr = String(initialRoomNumber).trim();
    const found = checkedInBookings.find((b) => {
      const bRooms = getBookingRoomNumbers(b, rooms);
      return bRooms.includes(targetRoomStr) || String(b.room_id) === targetRoomStr;
    });
    if (found) {
      setSelectedBookingId(found.booking_id);
      setSelectedRoomNumber(targetRoomStr);
      const gInfo = resolveGuestDetails(found);
      setGuestName(gInfo.name);
      setGuestMobile(gInfo.phone);
    } else {
      setSelectedRoomNumber(targetRoomStr);
    }
    setCollectionSource("room_pickup");
  }, [initialRoomNumber, checkedInBookings, rooms, guests]);

  const handleRoomOptionSelect = (val) => {
    if (!val) return;
    const opt = roomPickupOptions.find((o) => o.value === val);
    if (opt) {
      setSelectedBookingId(opt.booking_id);
      setSelectedRoomNumber(opt.roomNumber);
      setGuestName(opt.guestInfo.name);
      setGuestMobile(opt.guestInfo.phone);
    } else {
      const [bId, rNum] = val.split(":::");
      setSelectedBookingId(bId);
      const bk = checkedInBookings.find((b) => b.booking_id === bId);
      if (bk) {
        const fallbackRoom = rNum || getDisplayRoomNumber(bk, rooms);
        setSelectedRoomNumber(fallbackRoom);
        const gInfo = resolveGuestDetails(bk);
        setGuestName(gInfo.name);
        setGuestMobile(gInfo.phone);
      }
    }
  };

  const handleBookingSelect = (bId) => {
    handleRoomOptionSelect(bId);
  };

  /* Statistics: one pass, grouped by day ----------------------------------- */
  const getOrderDate = (order) => {
    if (!order) return "";
    // 1. Explicit business date attributes
    if (order.created_date && typeof order.created_date === "string" && order.created_date.includes("-")) {
      return order.created_date.trim();
    }
    if (order.orderDate && typeof order.orderDate === "string" && order.orderDate.includes("-")) {
      return order.orderDate.trim();
    }
    if (order.date && typeof order.date === "string" && order.date.includes("-")) {
      return order.date.trim();
    }
    // 2. Token-embedded date: LND-YYYYMMDD-XXXX
    const tokenStr = String(order.token || order.barcode || order.orderId || "");
    const tokenMatch = tokenStr.match(/LND-(\d{4})(\d{2})(\d{2})/i);
    if (tokenMatch) {
      return `${tokenMatch[1]}-${tokenMatch[2]}-${tokenMatch[3]}`;
    }
    // 3. Fallback to createdAt / created_at converted to local date via ymd()
    if (order.createdAt) {
      const d = new Date(order.createdAt);
      if (!isNaN(d.getTime())) return ymd(d);
    }
    if (order.created_at) {
      const d = new Date(order.created_at);
      if (!isNaN(d.getTime())) return ymd(d);
    }
    return "";
  };

  const { dailyStatsMap, pendingDeliveries, deliveredTodayList, heldOnRoomOrders, roomsToDeliver } =
    useMemo(() => {
      const dailyMap = {};
      const pending = [];
      const deliveredToday = [];
      const held = [];
      const roomsSet = new Set();

      (allOrders || []).forEach((order) => {
        const orderDate = getOrderDate(order);
        const grandTotal = Number(order.grandTotal || order.totalAmount || 0);
        const isDelivered = isOrderDelivered(order);

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
            if (c) {
              c.amt += amt;
              c.pcs += qty;
            }
          });
        }

        const deliveredDate = order.delivered_date
          ? order.delivered_date
          : order.delivered_at
          ? ymd(new Date(order.delivered_at))
          : orderDate;

        if (isDelivered && (deliveredDate === currentDateStr || orderDate === currentDateStr)) {
          deliveredToday.push(order);
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

  const statsDateRange = useMemo(() => {
    const today = new Date();
    const todayStr = ymd(today);

    if (statsRangeType === "today") {
      return { from: todayStr, to: todayStr, label: "Today" };
    }
    if (statsRangeType === "yesterday") {
      const yest = new Date();
      yest.setDate(yest.getDate() - 1);
      const yestStr = ymd(yest);
      return { from: yestStr, to: yestStr, label: "Yesterday" };
    }
    if (statsRangeType === "7days") {
      const past7 = new Date();
      past7.setDate(past7.getDate() - 6);
      return { from: ymd(past7), to: todayStr, label: "Last 7 Days" };
    }
    if (statsRangeType === "month") {
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      return { from: ymd(monthStart), to: todayStr, label: "This Month" };
    }
    return {
      from: statsCustomFrom || todayStr,
      to: statsCustomTo || todayStr,
      label: "Custom Range",
    };
  }, [statsRangeType, statsCustomFrom, statsCustomTo, currentDateStr]);

  const periodFilteredOrders = useMemo(() => {
    const { from, to } = statsDateRange;
    return (allOrders || [])
      .filter((ord) => {
        const d = getOrderDate(ord);
        if (!d) return false;
        return d >= from && d <= to;
      })
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || a.created_at || a.orderDate || 0);
        const dateB = new Date(b.createdAt || b.created_at || b.orderDate || 0);
        return dateB - dateA;
      });
  }, [allOrders, statsDateRange]);

  const periodMetrics = useMemo(() => {
    let totalRevenue = 0;
    let totalGarments = 0;
    let folioAmount = 0;
    let cashAmount = 0;
    let cardAmount = 0;
    let upiAmount = 0;
    const careBreakdown = Object.fromEntries(CARE_IDS.map((c) => [c, { amt: 0, pcs: 0 }]));
    const dailyTrendMap = {};

    periodFilteredOrders.forEach((ord) => {
      const amt = Number(ord.grandTotal || ord.totalAmount || 0);
      const pcs = Number(
        ord.totalGarments ||
          (ord.items || []).reduce((s, it) => s + (Number(it.quantity) || 0), 0) ||
          0
      );
      const d = getOrderDate(ord);

      totalRevenue += amt;
      totalGarments += pcs;

      const pMethod =
        ord.settlementType === "ROOM_FOLIO" || ord.paymentMethod === "ROOM_FOLIO"
          ? "ROOM_FOLIO"
          : (ord.paymentMethod || "").toUpperCase();

      if (pMethod === "ROOM_FOLIO") folioAmount += amt;
      else if (pMethod === "CASH") cashAmount += amt;
      else if (pMethod === "CARD") cardAmount += amt;
      else if (pMethod === "UPI") upiAmount += amt;
      else cashAmount += amt;

      (ord.items || []).forEach((item) => {
        const itemQty = Number(item.quantity) || 1;
        const itemRate = Number(item.unitRate || item.rate || 0);
        const itemTotal = Number(item.total || itemQty * itemRate);
        const cKey = careOf(item);
        if (careBreakdown[cKey]) {
          careBreakdown[cKey].amt += itemTotal;
          careBreakdown[cKey].pcs += itemQty;
        }
      });

      if (d) {
        if (!dailyTrendMap[d]) {
          dailyTrendMap[d] = { date: d, revenue: 0, orders: 0, pcs: 0 };
        }
        dailyTrendMap[d].revenue += amt;
        dailyTrendMap[d].orders += 1;
        dailyTrendMap[d].pcs += pcs;
      }
    });

    const dailyTrendList = Object.values(dailyTrendMap).sort((a, b) => (a.date > b.date ? 1 : -1));
    const maxDailyRevenue = Math.max(1, ...dailyTrendList.map((d) => d.revenue));

    return {
      totalRevenue,
      totalOrders: periodFilteredOrders.length,
      totalGarments,
      folioAmount,
      cashAmount,
      cardAmount,
      upiAmount,
      careBreakdown,
      dailyTrendList,
      maxDailyRevenue,
    };
  }, [periodFilteredOrders]);

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

  const laundryGstRate = useMemo(() => {
    if (institutionData?.laundryConfig?.gstRate !== undefined && institutionData?.laundryConfig?.gstRate !== null) {
      return Number(institutionData.laundryConfig.gstRate);
    }
    if (institutionData?.laundryGst !== undefined && institutionData?.laundryGst !== null) {
      return Number(institutionData.laundryGst);
    }
    const defaultTotal = Number(institutionData?.cgst ?? 2.5) + Number(institutionData?.sgst ?? 2.5);
    return defaultTotal > 0 ? defaultTotal : 5;
  }, [institutionData]);

  const cgstRate = useMemo(() => {
    if (institutionData?.laundryConfig?.cgstRate !== undefined && institutionData?.laundryConfig?.cgstRate !== null) {
      return Number(institutionData.laundryConfig.cgstRate);
    }
    return laundryGstRate / 2;
  }, [institutionData, laundryGstRate]);

  const sgstRate = useMemo(() => {
    if (institutionData?.laundryConfig?.sgstRate !== undefined && institutionData?.laundryConfig?.sgstRate !== null) {
      return Number(institutionData.laundryConfig.sgstRate);
    }
    return laundryGstRate / 2;
  }, [institutionData, laundryGstRate]);

  const [customGstInput, setCustomGstInput] = useState(() => String(laundryGstRate));
  useEffect(() => {
    setCustomGstInput(String(laundryGstRate));
  }, [laundryGstRate]);

  const handleSaveLaundryGst = async (rateToSave) => {
    const num = Math.max(0, Number(rateToSave) || 0);
    setIsSavingConfig(true);
    try {
      await saveLaundryConfigToBackend({
        catalog,
        serviceSpeeds,
        gstRate: num,
        cgstRate: num / 2,
        sgstRate: num / 2,
        institutionData,
        updateInstitutionData,
      });
      toast.success(`Laundry GST updated to ${num}% (${num / 2}% CGST + ${num / 2}% SGST)`);
    } catch (e) {
      toast.error("Failed to update laundry GST");
    } finally {
      setIsSavingConfig(false);
    }
  };

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
      cgstRate,
      sgstRate,
      laundryGstRate,
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
    await loadLaundryOrders();
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
    if (isSubmitting) return;
    if (basket.length === 0) return toast.error("Add at least one garment.");
    if (!selectedRoomNumber) return toast.error("Select a room to charge.");

    setIsSubmitting(true);
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

    try {
      // finishOrder calls createLaundryOrderBackend (POST /laundry/orders).
      // The backend /laundry/orders Lambda automatically records and posts the folio entry
      // directly to the booking in DynamoDB. Calling updateBookingServices manually from frontend
      // caused DynamoDB to receive duplicate entries (one from /laundry/orders, one from /bookings/services).
      await finishOrder(orderData);
      toast.success(`Posted ₹${totals.grandTotal} to Room ${selectedRoomNumber} (${name})`);
    } catch (err) {
      console.error(err);
      toast.error("Could not post to room bill");
    } finally {
      setIsSubmitting(false);
    }
  };

 

  // 3. Direct POS settlement (Cash, Card, UPI)
  const handleDirectPOSSettle = async (payMethod = "CASH") => {
    if (isSubmitting) return;
    if (basket.length === 0) return toast.error("Add at least one garment.");
    if (collectionSource === "walk_in" && !guestName.trim()) {
      return toast.error("Please enter the guest name for Walk-In order.");
    }
    if (collectionSource === "room_pickup" && !selectedRoomNumber) {
      return toast.error("Please select a checked-in room.");
    }

    setIsSubmitting(true);
    const { name, phone } = resolveRoomGuest(collectionSource === "walk_in" ? "Walk-In Guest" : "In-House Guest");
    const resolvedName = collectionSource === "walk_in" ? (guestName.trim() || "Walk-In Guest") : name;
    const resolvedPhone = collectionSource === "walk_in" ? (guestMobile.trim() || "") : phone;
    const orderData = {
      ...buildOrderPayload(payMethod),
      booking_id: collectionSource === "room_pickup" ? selectedBookingId || null : null,
      bookingId: collectionSource === "room_pickup" ? selectedBookingId || null : null,
      guestName: resolvedName,
      guestPhone: resolvedPhone,
      guestMobile: resolvedPhone,
      roomNumber: collectionSource === "room_pickup" && selectedRoomNumber ? selectedRoomNumber : "Walk-In",
      totalAmount: totals.grandTotal,
      settlementType: "direct",
      paymentMethod: payMethod,
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
            description: `${totals.totalGarments} Garments [${payMethod}] - ${resolvedName}${selectedRoomNumber ? ` (Room ${selectedRoomNumber})` : ""}`,
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
    } finally {
      setIsSubmitting(false);
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
    await loadLaundryOrders();
  };

  const handleConvertHoldToRoomFolio = async (orderToPost) => {
    if (isSubmitting) return;
    const bId = orderToPost.bookingId || orderToPost.booking_id;
    if (!bId) return toast.error("Missing booking reference for this room.");

    setIsSubmitting(true);
    const foundBooking = bookings.find((b) => b.booking_id === bId);
    const gInfo = resolveGuestDetails(foundBooking);
    const name =
      orderToPost.guestName ||
      gInfo.name ||
      (orderToPost.roomNumber ? `Room ${orderToPost.roomNumber} Guest` : "In-House Guest");

    try {
      const chargeAmt = Number(orderToPost.grandTotal || orderToPost.totalAmount || 0);
      const oToken = orderToPost.token || orderToPost.orderId;
      const rawExisting = foundBooking?.services?.[orderToPost.roomNumber]?.[currentDateStr];
      const existingList = Array.isArray(rawExisting)
        ? rawExisting
        : rawExisting && typeof rawExisting === "object"
        ? [rawExisting]
        : [];
      const alreadyPosted = existingList.some(
        (s) => s && (s.order_id === oToken || s.token === oToken || s.service_id === oToken)
      );

      if (!alreadyPosted) {
        const entry = {
          food_charges: 0,
          laundry_charges: chargeAmt,
          minibar_charges: 0,
          extra_bed_charges: 0,
          manual_charges: 0,
          order_id: oToken,
          service_id: oToken,
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
      }

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
      await loadLaundryOrders();
    } catch (err) {
      console.error(err);
      toast.error("Could not post to room bill");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkDeliveredToRoom = async (orderToDeliver) => {
    const by = userData?.userName || userData?.name || "Laundry Staff";
    const id = orderToDeliver.orderId || orderToDeliver.order_id || orderToDeliver.token || orderToDeliver.id;
    // Optimistic UI update
    setAllOrders((prev) =>
      prev.map((o) => {
        const oKey = o.orderId || o.order_id || o.token || o.id;
        if (oKey === id || o.token === orderToDeliver.token) {
          return {
            ...o,
            status: "Delivered",
            delivery_status: "delivered_to_room",
            delivered_to_room: true,
            is_delivered: true,
            delivered_at: new Date().toISOString(),
            delivered_by: by,
          };
        }
        return o;
      })
    );
    try {
      await markDeliveryDeliveredBackend(id, { delivered_by: by }, currentInstitutionId);
      await updateLaundryStatusBackend(
        id,
        { status: "delivered", delivery_status: "delivered_to_room", delivered_by: by },
        currentInstitutionId
      );
    } catch (e) {
      console.warn("Backend deliver status skipped:", e);
    }
    toast.success(`Delivered to Room ${orderToDeliver.roomNumber}`);
    // Refresh directly from database
    await loadLaundryOrders();
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    const isNowDelivered = newStatus === "Delivered" || newStatus === "delivered";
    setAllOrders((prev) =>
      prev.map((o) => {
        const oKey = o.orderId || o.order_id || o.token || o.id;
        if (oKey === orderId || o.token === orderId) {
          return {
            ...o,
            status: newStatus,
            ...(isNowDelivered
              ? {
                  delivery_status: "delivered_to_room",
                  delivered_to_room: true,
                  is_delivered: true,
                  delivered_at: o.delivered_at || new Date().toISOString(),
                  delivered_by: o.delivered_by || userData?.userName || userData?.name || "Laundry Staff",
                }
              : {}),
            updatedAt: new Date().toISOString(),
          };
        }
        return o;
      })
    );
    try {
      await updateLaundryStatusBackend(
        orderId,
        {
          status: newStatus,
          ...(isNowDelivered ? { delivery_status: "delivered_to_room", delivered_to_room: true } : {}),
        },
        currentInstitutionId
      );
    } catch (e) {
      console.warn("Backend status update skipped:", e);
    }
    toast.success(`Order ${orderId} is now "${newStatus}"`);
    // Refresh directly from database
    await loadLaundryOrders();
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

          {/* RIGHT: order & settlement (compact layout, 2-item clean fit with scrolling) */}
          <Panel className="lg:col-span-5 flex flex-col justify-between overflow-hidden">
            {/* header */}
            <div className="shrink-0 flex items-center justify-between px-2.5 py-1.5 border-b border-gray-100 bg-white">
              <div className="flex items-center gap-1.5 font-semibold text-xs">
                <Receipt className="w-3.5 h-3.5 text-blue-600" /> Order
                <span className="font-mono text-[11px] text-gray-500">#{token}</span>
              </div>
              {basket.length > 0 && (
                <button
                  type="button"
                  onClick={handleResetOrder}
                  className="flex items-center gap-1 text-[10.5px] text-gray-500 hover:text-red-600 font-medium"
                >
                  <Trash2 className="w-3 h-3" /> Clear
                </button>
              )}
            </div>

            {/* customer / order type: Only 2 options (Room Pickup vs Walk-In) */}
            <div className="shrink-0 px-2.5 py-1.5 space-y-1 border-b border-gray-100 bg-white">
              <Segmented
                value={collectionSource}
                size="sm"
                onChange={(val) => {
                  setCollectionSource(val);
                  if (val === "walk_in") {
                    setSelectedBookingId("");
                    setSelectedRoomNumber("");
                    setGuestName("");
                    setGuestMobile("");
                  }
                }}
                options={[
                  { id: "room_pickup", label: "Room Pickup" },
                  { id: "walk_in", label: "Walk-In" },
                ]}
              />
              {collectionSource === "room_pickup" ? (
                <>
                  <Select value={selectedPickupValue} onValueChange={handleRoomOptionSelect}>
                    <SelectTrigger className="!h-7 text-xs">
                      <SelectValue placeholder="Select checked-in room *" />
                    </SelectTrigger>
                    <SelectContent className="max-h-56">
                      {roomPickupOptions.length === 0 ? (
                        <div className="p-2 text-xs text-gray-500 text-center">No checked-in rooms found</div>
                      ) : (
                        roomPickupOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <div className="min-h-4 flex items-center text-[10.5px] text-gray-600">
                    {selectedRoomNumber ? (
                      <span className="bg-blue-50 text-blue-900 px-1.5 py-0.5 rounded border border-blue-200 truncate">
                        <strong className="text-gray-900">Room {selectedRoomNumber}</strong> ·{" "}
                        {guestName || "In-House Guest"}
                        {guestMobile ? ` · ${guestMobile}` : ""}
                      </span>
                    ) : (
                      <span className="text-amber-700 font-medium">Please select a checked-in room</span>
                    )}
                  </div>
                </>
              ) : (
                <div className="space-y-1">
                  <div className="grid grid-cols-2 gap-1.5">
                    <Input
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="Guest Name *"
                      className="!h-7 text-xs font-medium"
                      required
                    />
                    <Input
                      value={guestMobile}
                      onChange={(e) => setGuestMobile(e.target.value)}
                      placeholder="Phone (Optional)"
                      className="!h-7 text-xs"
                    />
                  </div>
                  <div className="text-[9.5px] text-gray-500">
                    * Guest name required for Walk-In.
                  </div>
                </div>
              )}
            </div>

            {/* delivery */}
            <div className="shrink-0 px-2.5 py-1.5 space-y-1 border-b border-gray-100 bg-white">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[11px] text-gray-700">Delivery</span>
                <button
                  type="button"
                  onClick={() => setEditSpeedsModalOpen(true)}
                  className="flex items-center gap-1 text-[10.5px] text-blue-600 hover:underline"
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
                    className={`rounded border py-0.5 px-1 text-center transition-colors ${
                      serviceSpeed === sp.id
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <div className="text-[10px] font-semibold truncate leading-tight">{sp.shortLabel}</div>
                    <div className={`text-[9px] leading-tight ${serviceSpeed === sp.id ? "text-blue-100" : "text-gray-500"}`}>
                      {speedExtraLabel(sp)}
                    </div>
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-1">
                <div>
                  <span className="text-[9.5px] text-gray-500">Date</span>
                  <Input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="!h-6 text-[10px] px-1"
                  />
                </div>
                <div>
                  <span className="text-[9.5px] text-gray-500">Time</span>
                  <Input
                    type="time"
                    value={deliveryTime}
                    onChange={(e) => setDeliveryTime(e.target.value)}
                    className="!h-6 text-[10px] px-1"
                  />
                </div>
                <div>
                  <span className="text-[9.5px] text-gray-500">Extra fee (₹)</span>
                  <Input
                    type="number"
                    min="0"
                    value={customExtraCharge || ""}
                    onChange={(e) => setCustomExtraCharge(Math.max(0, Number(e.target.value) || 0))}
                    placeholder="0"
                    className="!h-6 text-[10px] px-1 text-right"
                  />
                </div>
              </div>
            </div>

            {/* items (scrollable after 2 items cleanly) */}
            <div className="shrink-0 flex flex-col px-2.5 py-1.5 bg-white">
              <div className="shrink-0 flex items-center justify-between mb-1">
                <span className="font-semibold text-xs text-gray-700">Items ({totals.totalGarments} pcs)</span>
                {basket.length > 2 && (
                  <span className="text-[9.5px] text-blue-600 font-medium">Scroll to view all {basket.length}</span>
                )}
              </div>
              <div className="max-h-[110px] min-h-[90px] overflow-y-auto space-y-1.5 pr-0.5">
                {basket.length === 0 ? (
                  <div className="h-[90px] flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 text-gray-400 p-2 text-center">
                    <p className="font-semibold text-gray-600 text-xs">Cart is empty</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Tap any garment rate to add item</p>
                  </div>
                ) : (
                  basket.map((item, idx) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-1.5 rounded-md border border-gray-200 bg-white shadow-2xs p-1.5 px-2 transition-all hover:border-gray-300"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-xs text-gray-800 truncate leading-tight">{item.name}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <CareChip careType={item.careType} />
                          <span className="text-[10px] text-gray-500 font-medium">₹{item.unitRate} each</span>
                        </div>
                      </div>
                      <div className="flex items-center rounded border border-gray-200 bg-gray-50">
                        <button
                          type="button"
                          onClick={() => updateBasketQuantity(idx, -1)}
                          className="w-5 h-5 flex items-center justify-center text-gray-600 hover:bg-gray-200 text-xs font-bold rounded-l transition-colors"
                        >
                          −
                        </button>
                        <span className="px-1 text-xs font-bold text-gray-800 min-w-[18px] text-center">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateBasketQuantity(idx, 1)}
                          className="w-5 h-5 flex items-center justify-center text-gray-600 hover:bg-gray-200 text-xs font-bold rounded-r transition-colors"
                        >
                          +
                        </button>
                      </div>
                      <span className="w-12 text-right font-bold text-xs text-gray-900">
                        ₹{(item.unitRate * item.quantity).toFixed(0)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeBasketItem(idx)}
                        className="p-0.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors"
                        title="Remove"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* bill + actions, pinned to the bottom (clean, covered, prominent total payable) */}
            <div className="shrink-0 border-t border-gray-200 bg-slate-50 px-2.5 py-1.5 space-y-1">
              <div className="space-y-0.5 text-[10px] text-gray-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium text-gray-800">₹{totals.itemsSubtotal.toFixed(2)}</span>
                </div>
                {totals.surchargeAmount > 0 && (
                  <div className="flex justify-between">
                    <span>Delivery extra</span>
                    <span className="font-medium text-gray-800">₹{totals.surchargeAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>CGST ({cgstRate}%)</span>
                  <span className="font-medium text-gray-800">₹{totals.cgstAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>
                    SGST ({sgstRate}%) (SAC {LAUNDRY_SAC_CODE})
                  </span>
                  <span className="font-medium text-gray-800">₹{totals.sgstAmount.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between border-t border-blue-200 bg-blue-50/80 -mx-2.5 px-2.5 py-1 rounded">
                <span className="font-bold text-xs text-blue-950 uppercase tracking-wide">Total Payable</span>
                <span className="text-base font-extrabold text-blue-900">₹{totals.grandTotal.toFixed(2)}</span>
              </div>


              {collectionSource === "room_pickup" ? (
                <div className="space-y-1">
                  <Button
                    type="button"
                    onClick={handleSettleToRoomFolio}
                    disabled={!selectedRoomNumber || basket.length === 0 || isSubmitting}
                    className="w-full !h-7 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs disabled:opacity-50"
                  >
                    <Bed className="w-3.5 h-3.5 mr-1" />
                    {isSubmitting
                      ? "Posting..."
                      : selectedRoomNumber
                      ? `Post to Hotel Bill (Room ${selectedRoomNumber})`
                      : "Post to Hotel Bill"}
                  </Button>
                  <div className="grid grid-cols-3 gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleDirectPOSSettle("CASH")}
                      disabled={!selectedRoomNumber || basket.length === 0 || isSubmitting}
                      className="!h-6.5 text-[10.5px] font-semibold px-1 bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 disabled:opacity-50"
                    >
                      <Banknote className="w-3 h-3 mr-0.5 shrink-0" /> Cash
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleDirectPOSSettle("CARD")}
                      disabled={!selectedRoomNumber || basket.length === 0 || isSubmitting}
                      className="!h-6.5 text-[10.5px] font-semibold px-1 bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 disabled:opacity-50"
                    >
                      <CreditCard className="w-3 h-3 mr-0.5 shrink-0" /> Card
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleDirectPOSSettle("UPI")}
                      disabled={!selectedRoomNumber || basket.length === 0 || isSubmitting}
                      className="!h-6.5 text-[10.5px] font-semibold px-1 bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100 disabled:opacity-50"
                    >
                      <QrCode className="w-3 h-3 mr-0.5 shrink-0" /> UPI
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="grid grid-cols-3 gap-1">
                    <Button
                      type="button"
                      onClick={() => handleDirectPOSSettle("CASH")}
                      disabled={basket.length === 0 || isSubmitting}
                      className="!h-7 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
                    >
                      <Banknote className="w-3.5 h-3.5 mr-1" /> Cash
                    </Button>
                    <Button
                      type="button"
                      onClick={() => handleDirectPOSSettle("CARD")}
                      disabled={basket.length === 0 || isSubmitting}
                      className="!h-7 text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
                    >
                      <CreditCard className="w-3.5 h-3.5 mr-1" /> Card
                    </Button>
                    <Button
                      type="button"
                      onClick={() => handleDirectPOSSettle("UPI")}
                      disabled={basket.length === 0 || isSubmitting}
                      className="!h-7 text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white disabled:opacity-50"
                    >
                      <QrCode className="w-3.5 h-3.5 mr-1" /> UPI
                    </Button>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-1 pt-0.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (basket.length === 0) return toast.error("Add garments before printing.");
                    printA4(previewCurrent());
                  }}
                  className="!h-6 text-[10.5px]"
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
                  className="!h-6 text-[10.5px]"
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
            <div className="flex items-center gap-2">
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
              <Button
                variant="outline"
                size="sm"
                onClick={loadLaundryOrders}
                disabled={loadingOrders}
                className="!h-7 px-2 text-xs flex items-center gap-1.5"
                title="Refresh deliveries from database"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingOrders ? "animate-spin text-blue-600" : "text-gray-600"}`} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </div>
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
                    const isDelivered = isOrderDelivered(ord);
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
                              {ord.roomNumber === "Walk-In" ? "Walk-in" : `Room ${formatDisplayRoom(ord.roomNumber, rooms)}`}
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
      {activeTab === "statistics" && (
        <Panel className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {/* Filter Bar: Default Today + Quick Ranges + Custom Range */}
          <div className="shrink-0 px-3 py-2 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2 bg-gray-50/50">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="flex items-center gap-1 font-semibold text-xs text-gray-700 mr-1">
                <Calendar className="w-3.5 h-3.5 text-blue-600" /> Date Range:
              </span>
              {[
                { id: "today", label: "Today" },
                { id: "yesterday", label: "Yesterday" },
                { id: "7days", label: "Last 7 Days" },
                { id: "month", label: "This Month" },
                { id: "custom", label: "Custom Range" },
              ].map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setStatsRangeType(pill.id)}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors border ${
                    statsRangeType === pill.id
                      ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  {pill.label}
                </button>
              ))}

              {statsRangeType === "custom" && (
                <div className="flex items-center gap-1 ml-1 bg-white border border-gray-200 rounded p-0.5">
                  <input
                    type="date"
                    value={statsCustomFrom}
                    onChange={(e) => setStatsCustomFrom(e.target.value)}
                    className="!h-6 text-[11px] px-1 font-medium border-0 focus:ring-0"
                  />
                  <span className="text-[10px] text-gray-400">to</span>
                  <input
                    type="date"
                    value={statsCustomTo}
                    onChange={(e) => setStatsCustomTo(e.target.value)}
                    className="!h-6 text-[11px] px-1 font-medium border-0 focus:ring-0"
                  />
                </div>
              )}
            </div>

            <div className="text-[11px] text-gray-500 font-medium">
              Showing <strong className="text-gray-900">{periodMetrics.totalOrders}</strong> orders ·{" "}
              <strong className="text-gray-900">{periodMetrics.totalGarments}</strong> pcs (
              {statsDateRange.from === statsDateRange.to
                ? statsDateRange.from
                : `${statsDateRange.from} to ${statsDateRange.to}`}
              )
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3">
            {/* Top KPI Metrics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              <div className="rounded-lg border border-blue-200 bg-blue-50/70 p-2.5">
                <div className="text-[11px] font-semibold text-blue-800 flex items-center justify-between">
                  <span>Laundry Revenue</span>
                  <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <div className="text-lg font-bold text-blue-950 mt-0.5">
                  ₹{periodMetrics.totalRevenue.toFixed(2)}
                </div>
                <div className="text-[10px] text-blue-800/80">
                  {periodMetrics.totalOrders} orders completed
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-2.5">
                <div className="text-[11px] font-semibold text-gray-600">Hotel Room Folio</div>
                <div className="text-lg font-bold text-gray-900 mt-0.5">
                  ₹{periodMetrics.folioAmount.toFixed(2)}
                </div>
                <div className="text-[10px] text-gray-500">
                  {periodMetrics.totalRevenue > 0
                    ? `${((periodMetrics.folioAmount / periodMetrics.totalRevenue) * 100).toFixed(0)}% of revenue`
                    : "0%"}
                </div>
              </div>

              <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-2.5">
                <div className="text-[11px] font-semibold text-emerald-800">Cash Settlements</div>
                <div className="text-lg font-bold text-emerald-950 mt-0.5">
                  ₹{periodMetrics.cashAmount.toFixed(2)}
                </div>
                <div className="text-[10px] text-emerald-700">Direct cash POS</div>
              </div>

              <div className="rounded-lg border border-purple-200 bg-purple-50/50 p-2.5">
                <div className="text-[11px] font-semibold text-purple-800">Card Payments</div>
                <div className="text-lg font-bold text-purple-950 mt-0.5">
                  ₹{periodMetrics.cardAmount.toFixed(2)}
                </div>
                <div className="text-[10px] text-purple-700">Card POS terminal</div>
              </div>

              <div className="rounded-lg border border-sky-200 bg-sky-50/50 p-2.5">
                <div className="text-[11px] font-semibold text-sky-800">UPI / QR Code</div>
                <div className="text-lg font-bold text-sky-950 mt-0.5">
                  ₹{periodMetrics.upiAmount.toFixed(2)}
                </div>
                <div className="text-[10px] text-sky-700">Instant UPI collection</div>
              </div>
            </div>

            {/* Visual Settlement Distribution & Daily Trend Graphs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Circular Settlement Distribution Graph */}
              <div className="rounded-lg border border-gray-200 bg-white p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-xs text-gray-800 flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5 text-blue-600" /> Settlement Breakdown
                  </h4>
                  <span className="text-[11px] font-semibold text-gray-700">
                    Total: ₹{periodMetrics.totalRevenue.toFixed(0)}
                  </span>
                </div>

                {periodMetrics.totalRevenue === 0 ? (
                  <div className="text-center py-8 text-xs text-gray-400">
                    No billing activity in this period.
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
                    {/* SVG Circular Donut Chart */}
                    <div className="shrink-0 flex justify-center">
                      <SvgDonutChart
                        size={120}
                        strokeWidth={18}
                        centerLabel="Settled"
                        data={[
                          { label: "Room Folio", value: periodMetrics.folioAmount, color: "#2563eb" },
                          { label: "Cash", value: periodMetrics.cashAmount, color: "#10b981" },
                          { label: "Card", value: periodMetrics.cardAmount, color: "#a855f7" },
                          { label: "UPI", value: periodMetrics.upiAmount, color: "#0ea5e9" },
                        ]}
                      />
                    </div>

                    {/* Settlement legend badges */}
                    <div className="flex-1 w-full grid grid-cols-2 gap-1.5 text-xs">
                      <div className="flex items-center justify-between p-1.5 rounded bg-blue-50/60 border border-blue-100">
                        <span className="flex items-center gap-1 font-medium text-gray-700 text-[11px]">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" /> Folio
                        </span>
                        <span className="font-bold text-gray-900 text-right text-[11px]">
                          ₹{periodMetrics.folioAmount.toFixed(0)}{" "}
                          <span className="text-[9.5px] text-gray-500 font-normal">
                            ({((periodMetrics.folioAmount / (periodMetrics.totalRevenue || 1)) * 100).toFixed(0)}%)
                          </span>
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-1.5 rounded bg-emerald-50/60 border border-emerald-100">
                        <span className="flex items-center gap-1 font-medium text-gray-700 text-[11px]">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" /> Cash
                        </span>
                        <span className="font-bold text-gray-900 text-right text-[11px]">
                          ₹{periodMetrics.cashAmount.toFixed(0)}{" "}
                          <span className="text-[9.5px] text-gray-500 font-normal">
                            ({((periodMetrics.cashAmount / (periodMetrics.totalRevenue || 1)) * 100).toFixed(0)}%)
                          </span>
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-1.5 rounded bg-purple-50/60 border border-purple-100">
                        <span className="flex items-center gap-1 font-medium text-gray-700 text-[11px]">
                          <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0" /> Card
                        </span>
                        <span className="font-bold text-gray-900 text-right text-[11px]">
                          ₹{periodMetrics.cardAmount.toFixed(0)}{" "}
                          <span className="text-[9.5px] text-gray-500 font-normal">
                            ({((periodMetrics.cardAmount / (periodMetrics.totalRevenue || 1)) * 100).toFixed(0)}%)
                          </span>
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-1.5 rounded bg-sky-50/60 border border-sky-100">
                        <span className="flex items-center gap-1 font-medium text-gray-700 text-[11px]">
                          <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shrink-0" /> UPI
                        </span>
                        <span className="font-bold text-gray-900 text-right text-[11px]">
                          ₹{periodMetrics.upiAmount.toFixed(0)}{" "}
                          <span className="text-[9.5px] text-gray-500 font-normal">
                            ({((periodMetrics.upiAmount / (periodMetrics.totalRevenue || 1)) * 100).toFixed(0)}%)
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>


              {/* Revenue Trend Bar Graph */}
              <div className="rounded-lg border border-gray-200 bg-white p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-xs text-gray-800 flex items-center gap-1.5">
                    <BarChart3 className="w-3.5 h-3.5 text-blue-600" /> Daily Revenue Trend
                  </h4>
                  <span className="text-[11px] text-gray-500">
                    {periodMetrics.dailyTrendList.length} active day(s)
                  </span>
                </div>

                {periodMetrics.dailyTrendList.length === 0 ? (
                  <div className="text-center py-6 text-xs text-gray-400">
                    No daily revenue data for this range.
                  </div>
                ) : (
                  <div className="h-28 flex items-end gap-2 pt-4 px-1 overflow-x-auto border-b border-gray-200 pb-1">
                    {periodMetrics.dailyTrendList.map((d) => {
                      const heightPct = Math.max(
                        10,
                        Math.round((d.revenue / periodMetrics.maxDailyRevenue) * 100)
                      );
                      const isToday = d.date === currentDateStr;
                      return (
                        <div
                          key={d.date}
                          className="flex-1 min-w-[36px] flex flex-col items-center gap-1 group relative"
                        >
                          <div className="text-[9.5px] font-bold text-gray-600 truncate opacity-90 group-hover:opacity-100">
                            ₹{d.revenue >= 1000 ? `${(d.revenue / 1000).toFixed(1)}k` : d.revenue.toFixed(0)}
                          </div>
                          <div
                            style={{ height: `${heightPct}%` }}
                            className={`w-full max-w-[28px] rounded-t transition-all ${
                              isToday
                                ? "bg-blue-600 hover:bg-blue-700 shadow-sm"
                                : "bg-slate-400 hover:bg-slate-500"
                            }`}
                            title={`${d.date}: ₹${d.revenue.toFixed(2)} (${d.orders} orders)`}
                          />
                          <div className="text-[9px] text-gray-500 truncate font-mono">
                            {d.date.substring(5)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Care Types Breakdown with Circular Chart */}
            <div className="rounded-lg border border-gray-200 bg-white p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-xs text-gray-800 flex items-center gap-1.5">
                  <Shirt className="w-3.5 h-3.5 text-blue-600" /> Garment Care Services Distribution
                </h4>
                <span className="text-[11px] font-semibold text-gray-700">
                  {periodMetrics.totalGarments} pcs processed
                </span>
              </div>
              <div className="flex flex-col md:flex-row items-center gap-3">
                <div className="shrink-0 flex justify-center">
                  <SvgDonutChart
                    size={110}
                    strokeWidth={16}
                    centerLabel="Garments"
                    centerValue={`${periodMetrics.totalGarments} pcs`}
                    data={CARE_IDS.map((c) => {
                      const cData = periodMetrics.careBreakdown[c] || { amt: 0, pcs: 0 };
                      const colorMap = {
                        wash_only: "#3b82f6",
                        wash_and_press: "#10b981",
                        press_only: "#f59e0b",
                        dry_clean: "#8b5cf6",
                      };
                      return {
                        label: CARE_UI[c]?.label || c,
                        value: cData.pcs || 0,
                        color: colorMap[c] || "#64748b",
                      };
                    })}
                  />
                </div>
                <div className="flex-1 w-full grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {CARE_IDS.map((c) => {
                    const ui = CARE_UI[c];
                    const cData = periodMetrics.careBreakdown[c] || { amt: 0, pcs: 0 };
                    return (
                      <div key={c} className="rounded-lg border border-gray-100 bg-slate-50/70 p-2">
                        <div className="flex items-center gap-1 text-[11px] font-medium text-gray-700">
                          <ui.Icon className="w-3 h-3 text-gray-500" /> {ui.label}
                        </div>
                        <div className="text-sm font-bold text-gray-900 mt-0.5">
                          ₹{cData.amt.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-gray-500">{cData.pcs} garments</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Detailed Orders History Table with Customer Name, Phone & Eye Button */}
            <div className="rounded-lg border border-gray-200 bg-white overflow-hidden shadow-2xs">
              <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <h4 className="font-semibold text-xs text-gray-800">
                  Orders Breakdown ({periodFilteredOrders.length} orders)
                </h4>
                <span className="text-[10.5px] text-gray-500">
                  Click the <Eye className="w-3 h-3 inline text-blue-600" /> icon to view full bill & print
                </span>
              </div>

              {periodFilteredOrders.length === 0 ? (
                <div className="text-center py-8 text-xs text-gray-400">
                  No laundry orders found in the selected date range.
                </div>
              ) : (
                <div className="overflow-x-auto max-h-[360px]">
                  <table className="w-full text-xs text-left">
                    <thead className="sticky top-0 bg-gray-100 text-gray-700 z-10 border-b border-gray-200">
                      <tr>
                        <th className="py-2 px-2.5 font-semibold">Date & Time</th>
                        <th className="py-2 px-2 font-semibold">Token No</th>
                        <th className="py-2 px-2 font-semibold">Room / Type</th>
                        <th className="py-2 px-2 font-semibold">Customer Name</th>
                        <th className="py-2 px-2 font-semibold">Phone Number</th>
                        <th className="py-2 px-2 text-center font-semibold">Pcs</th>
                        <th className="py-2 px-2 font-semibold">Settlement</th>
                        <th className="py-2 px-2 font-semibold">Status</th>
                        <th className="py-2 px-2.5 text-right font-semibold">Amount</th>
                        <th className="py-2 px-2 text-center font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {periodFilteredOrders.map((ord) => {
                        const oDate = ord.createdAt
                          ? new Date(ord.createdAt).toLocaleString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : ord.orderDate || "—";
                        const pBadge = paymentBadge(ord);
                        const isDelivered = isOrderDelivered(ord);

                        return (
                          <tr key={ord.orderId || ord.token} className="hover:bg-blue-50/40 transition-colors">
                            <td className="py-2 px-2.5 font-medium text-gray-700 whitespace-nowrap">
                              {oDate}
                            </td>
                            <td className="py-2 px-2 font-mono font-semibold text-blue-700 whitespace-nowrap">
                              #{ord.token || ord.orderId}
                            </td>
                            <td className="py-2 px-2 font-semibold text-gray-900 whitespace-nowrap">
                              {ord.roomNumber && ord.roomNumber !== "Walk-In"
                                ? `Room ${formatDisplayRoom(ord.roomNumber, rooms)}`
                                : "Walk-In"}
                            </td>
                            <td className="py-2 px-2 text-gray-800 font-medium">
                              {ord.guestName || "Guest"}
                            </td>
                            <td className="py-2 px-2 text-gray-600 font-mono text-[11px]">
                              {ord.guestMobile || "—"}
                            </td>
                            <td className="py-2 px-2 text-center font-semibold text-gray-800">
                              {ord.totalGarments || ord.items?.length || 1}
                            </td>
                            <td className="py-2 px-2 whitespace-nowrap">
                              <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold ${pBadge.cls}`}>
                                {pBadge.text}
                              </span>
                            </td>
                            <td className="py-2 px-2 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold ${
                                  isDelivered
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                    : "bg-amber-50 text-amber-800 border-amber-200"
                                }`}
                              >
                                {isDelivered ? "Delivered" : "In Progress"}
                              </span>
                            </td>
                            <td className="py-2 px-2.5 text-right font-bold text-gray-900 whitespace-nowrap">
                              ₹{Number(ord.grandTotal || ord.totalAmount || 0).toFixed(2)}
                            </td>
                            <td className="py-2 px-2 text-center whitespace-nowrap">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setSelectedOrderForDetails(ord)}
                                className="!h-7 !w-7 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded"
                                title="View Order Breakdown & Print"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </Panel>
      )}

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

            {/* Dynamic Laundry GST Settings Card */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] bg-slate-50 border border-slate-200 rounded-md p-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-slate-800 flex items-center gap-1">
                  <Receipt className="w-3.5 h-3.5 text-blue-600" /> Laundry GST (SAC {LAUNDRY_SAC_CODE}):
                </span>
                <span className="text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded font-medium">
                  Active: <strong className="text-blue-700">{laundryGstRate}%</strong> ({cgstRate}% CGST + {sgstRate}% SGST)
                </span>
                <div className="flex items-center gap-1">
                  {[0, 5, 12, 18].map((slab) => (
                    <button
                      key={slab}
                      type="button"
                      onClick={() => handleSaveLaundryGst(slab)}
                      disabled={isSavingConfig}
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition-colors ${
                        Number(laundryGstRate) === slab
                          ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                          : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                      }`}
                    >
                      {slab}% {slab === 5 ? "(Standard)" : slab === 0 ? "(Exempt)" : ""}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">Custom GST %:</span>
                <Input
                  type="number"
                  min="0"
                  max="28"
                  step="0.5"
                  value={customGstInput}
                  onChange={(e) => setCustomGstInput(e.target.value)}
                  placeholder="e.g. 5"
                  className="!h-6 w-16 text-center text-xs px-1"
                />
                <Button
                  size="sm"
                  onClick={() => handleSaveLaundryGst(customGstInput)}
                  disabled={isSavingConfig}
                  className="!h-6 text-[11px] font-semibold bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Save GST
                </Button>
              </div>
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
                          <div className="font-semibold">{ord.roomNumber === "Walk-In" ? "Walk-in" : `Room ${formatDisplayRoom(ord.roomNumber, rooms)}`}</div>
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
                    <Badge className="bg-blue-600 text-white text-[10px]">Room {formatDisplayRoom(previewOrder.roomNumber, rooms)}</Badge>
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

      {/* ----------------- ORDER DETAILS MODAL (EYE BUTTON) ----------------- */}
      <Dialog
        open={!!selectedOrderForDetails}
        onOpenChange={(open) => !open && setSelectedOrderForDetails(null)}
      >
        <DialogContent className="max-w-xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
          {selectedOrderForDetails && (() => {
            const ord = selectedOrderForDetails;
            const items = ord.items || [];
            const speedObj = serviceSpeeds.find((s) => s.id === ord.serviceSpeed);
            const ordCgstRate = ord.cgstRate !== undefined ? ord.cgstRate : cgstRate;
            const ordSgstRate = ord.sgstRate !== undefined ? ord.sgstRate : sgstRate;

            return (
              <>
                <DialogHeader className="p-4 pb-2 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <DialogTitle className="text-base font-bold flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-blue-600" />
                      Order Details: #{ord.token || ord.orderId}
                    </DialogTitle>
                    <div className="flex items-center gap-1.5">
                      <Badge className={paymentBadge(ord).cls}>
                        {paymentBadge(ord).text}
                      </Badge>
                      <Badge variant="outline" className="text-[11px]">
                        {ord.status || "Received"}
                      </Badge>
                    </div>
                  </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
                  {/* Guest & Order Info Summary */}
                  <div className="grid grid-cols-2 gap-3 bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <div className="space-y-1">
                      <div className="text-[10.5px] uppercase font-bold text-gray-400 tracking-wide">
                        Guest Details
                      </div>
                      <div className="font-semibold text-gray-900 text-sm">
                        {ord.roomNumber && ord.roomNumber !== "Walk-In"
                          ? `Room ${formatDisplayRoom(ord.roomNumber, rooms)}`
                          : "Walk-In"}
                      </div>
                      <div className="text-gray-700">
                        <strong>Name:</strong> {ord.guestName || "Guest"}
                      </div>
                      <div className="text-gray-700">
                        <strong>Phone:</strong> {ord.guestMobile || "Not provided"}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="text-[10.5px] uppercase font-bold text-gray-400 tracking-wide">
                        Order & Turnaround
                      </div>
                      <div className="text-gray-700">
                        <strong>Order Time:</strong>{" "}
                        {ord.createdAt
                          ? new Date(ord.createdAt).toLocaleString("en-IN")
                          : "—"}
                      </div>
                      <div className="text-gray-700">
                        <strong>Delivery Target:</strong>{" "}
                        {ord.deliveryDateTime || "Standard"}
                      </div>
                      <div className="text-gray-700">
                        <strong>Speed:</strong>{" "}
                        {ord.serviceSpeedLabel || speedObj?.label || "Standard"}
                      </div>
                      <div className="text-gray-700">
                        <strong>Staff:</strong> {ord.staffId || "Staff"}
                      </div>
                    </div>
                  </div>

                  {/* Items Table */}
                  <div>
                    <div className="font-semibold text-gray-800 mb-1.5 flex items-center justify-between">
                      <span>Itemized Garment Breakdown ({ord.totalGarments || items.length} pcs)</span>
                      <span className="text-[11px] text-gray-500 font-mono">SAC {LAUNDRY_SAC_CODE}</span>
                    </div>
                    <table className="w-full text-xs border border-gray-200 rounded-md overflow-hidden">
                      <thead className="bg-gray-100 text-gray-700">
                        <tr>
                          <th className="py-1.5 px-2.5 text-left font-semibold">Garment</th>
                          <th className="py-1.5 px-2 text-center font-semibold">Care</th>
                          <th className="py-1.5 px-2 text-center font-semibold">Qty</th>
                          <th className="py-1.5 px-2 text-right font-semibold">Rate</th>
                          <th className="py-1.5 px-2.5 text-right font-semibold">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {items.map((it, idx) => {
                          const qty = Number(it.quantity) || 1;
                          const rate = Number(it.unitRate || it.rate || 0);
                          const total = Number(it.total || qty * rate);
                          return (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="py-1.5 px-2.5">
                                <div className="font-semibold text-gray-800">{it.name}</div>
                                {it.category && (
                                  <div className="text-[10px] text-gray-400">{it.category}</div>
                                )}
                              </td>
                              <td className="py-1.5 px-2 text-center">
                                <CareChip careType={it.careType} />
                              </td>
                              <td className="py-1.5 px-2 text-center font-semibold">{qty}</td>
                              <td className="py-1.5 px-2 text-right text-gray-600">₹{rate.toFixed(2)}</td>
                              <td className="py-1.5 px-2.5 text-right font-bold text-gray-900">
                                ₹{total.toFixed(2)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Financial Bill Summary */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-1 text-xs">
                    <div className="flex justify-between text-gray-600">
                      <span>Items Subtotal:</span>
                      <span className="font-medium">₹{Number(ord.itemsSubtotal || 0).toFixed(2)}</span>
                    </div>
                    {Number(ord.surchargeAmount || 0) > 0 && (
                      <div className="flex justify-between text-gray-600">
                        <span>Delivery Extra ({ord.surchargePercent || 0}% surcharge):</span>
                        <span className="font-medium">₹{Number(ord.surchargeAmount).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-gray-600">
                      <span>Taxable Amount:</span>
                      <span className="font-medium">
                        ₹{Number(ord.taxableAmount || ord.itemsSubtotal || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>CGST ({ordCgstRate}%):</span>
                      <span className="font-medium">₹{Number(ord.cgstAmount || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>SGST ({ordSgstRate}%):</span>
                      <span className="font-medium">₹{Number(ord.sgstAmount || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-gray-900 border-t border-gray-200 pt-1.5 mt-1">
                      <span>Grand Total:</span>
                      <span>₹{Number(ord.grandTotal || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <DialogFooter className="p-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between sm:justify-between">
                  <Button variant="outline" size="sm" onClick={() => setSelectedOrderForDetails(null)}>
                    Close
                  </Button>
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => printA4(ord)}
                      className="text-xs"
                    >
                      <FileText className="w-3.5 h-3.5 mr-1" /> Print A4 Bill
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => printSlip(ord)}
                      className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                    >
                      <Printer className="w-3.5 h-3.5 mr-1" /> Print {paperSize}mm Slip
                    </Button>
                  </div>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}