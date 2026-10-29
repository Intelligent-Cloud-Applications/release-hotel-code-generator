import React, { useState, useEffect } from "react";
import { useAppContext } from "../../../context/AppContext.jsx";
import { useAuthContext } from "../../../context/AuthContext.jsx";
import { Button } from "../../../components/ui/button.js";
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
import { Input } from "../../../components/ui/input.js";
import { Label } from "../../../components/ui/label.js";
import { DatePickerWithRange } from "../../../components/ui/DateRangePicker.jsx";
import {
  Download,
  FileText,
  Table as TableIcon,
  Calendar,
  Filter,
  RefreshCw,
  BarChart3,
  TrendingUp,
  Users,
  Bed,
  Building2,
  ChevronLeft,
  ChevronRight,
  Gift,
  DollarSign,
  UtensilsCrossed,
  Receipt,
  Shirt,
  Package,
  ArrowUpFromLine,
  ShoppingCart,
  Layers,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { get } from "aws-amplify/api";
import { useInstitutionContext } from "../../../context/InstitutionContext.jsx";
import { institutionId as defaultInstitutionId } from "../../../../Operation/data.json";
import {
  fetchLaundryOrdersBackend,
  fetchDeliveriesBackend,
} from "../Laundry/laundryCatalog.js";

const ReportGenerator = () => {
  const {
    rooms,
    bookings,
    guests,
    staffs,
    payments,
    expenses,
    bills,
    companies,
    reports,
    restaurantOrders,
    fetchRooms,
    fetchBookings,
    fetchGuests,
    fetchStaffs,
    listTotalBill,
    fetchCompanies,
    fetchAllReports,
    fetchReports: legacyFetchReports,
    fetchRestaurantOrders,
    loading,
  } = useAppContext();
  const fetchReports = fetchAllReports || legacyFetchReports;
  const { userData } = useAuthContext();
  const { institutionData } = useInstitutionContext();
  console.log("listExpenses", expenses);
  const [selectedReport, setSelectedReport] = useState(
    userData?.userType === "store"
      ? "stock_inventory"
      : userData?.userType === "laundry"
      ? "laundry"
      : ""
  );
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [filters, setFilters] = useState({});
  const [reportData, setReportData] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [exportedData, setExportedData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Guest report specific filters
  const [guestFilters, setGuestFilters] = useState({
    checkinDate: { from: null, to: null },
    checkoutDate: { from: null, to: null },
    roomNumber: "",
    roomType: "",
    hasGst: "",
    paymentMethod: "",
  });

  // Company report specific filters
  const [companyFilters, setCompanyFilters] = useState({
    selectedCompany: "",
    dateRange: { from: null, to: null },
    transactionType: "",
    hasGst: "",
  });

  // Expense report specific filters
  const [expenseFilters, setExpenseFilters] = useState({
    dateRange: { from: null, to: null },
    transactionType: "", // 'expense', 'received', 'both'
  });

  // Restaurant report specific filters
  const [restaurantFilters, setRestaurantFilters] = useState({
    dateRange: { from: null, to: null },
    paymentStatus: "", // 'paid', 'pending', 'cancelled', 'all'
    paymentMethod: "", // 'ROOM', 'CASH', 'CARD', 'BTC', 'QR', 'UPI', 'Free', 'Complementary', 'Multiple', 'all'
    tableName: "",
  });

  // Restaurant report display options
  const [restaurantDisplayOptions, setRestaurantDisplayOptions] = useState({
    showOrderSource: false,
    showPaidBy: false,
  });

  // Store Stock specific state & filters
  const [stockHistory, setStockHistory] = useState([]);
  const [stockFilters, setStockFilters] = useState({
    department: "all",
    category: "all",
  });

  // Dedicated backend laundry orders state
  const [backendLaundryOrders, setBackendLaundryOrders] = useState([]);

  const loadBackendLaundryData = async () => {
    try {
      const instId = institutionData?.institutionId || defaultInstitutionId;
      const [remoteOrders, remoteDeliveries] = await Promise.all([
        fetchLaundryOrdersBackend(instId).catch(() => []),
        fetchDeliveriesBackend(instId).catch(() => []),
      ]);

      const ordersMap = new Map();
      (remoteOrders || []).forEach((o) => {
        const k = o.orderId || o.order_id || o.service_id || o.token || o.id;
        if (k) ordersMap.set(String(k), o);
        if (o.token && String(o.token) !== String(k)) ordersMap.set(String(o.token), o);
      });

      (remoteDeliveries || []).forEach((del) => {
        const k = del.order_id || del.service_id || del.token || del.id;
        const matched = ordersMap.get(String(k)) || (del.token ? ordersMap.get(String(del.token)) : null);
        if (matched) {
          const merged = {
            ...matched,
            status: del.status || matched.status,
            delivery_status: del.delivery_status || matched.delivery_status,
            is_delivered: del.is_delivered ?? matched.is_delivered,
            delivered_to_room: del.delivered_to_room ?? del.is_delivered ?? matched.delivered_to_room,
            delivered_at: del.delivered_at || matched.delivered_at,
            delivered_by: del.delivered_by || matched.delivered_by,
          };
          ordersMap.set(String(k), merged);
          if (del.token) ordersMap.set(String(del.token), merged);
        } else if (k) {
          ordersMap.set(String(k), {
            orderId: del.order_id || del.token,
            token: del.token,
            roomNumber: del.room_number || "Walk-In",
            guestName: del.guest_name || "Guest",
            totalGarments: del.total_garments || 1,
            grandTotal: del.grand_total || 0,
            totalAmount: del.grand_total || 0,
            status: del.status || "collected",
            delivery_status: del.delivery_status || (del.is_delivered ? "delivered_to_room" : "pending_delivery"),
            is_delivered: Boolean(del.is_delivered),
            delivered_to_room: Boolean(del.is_delivered),
            delivered_at: del.delivered_at || null,
            delivered_by: del.delivered_by || null,
            createdAt: del.created_at || new Date().toISOString(),
            items: [],
          });
        }
      });

      const uniqueList = Array.from(new Set(ordersMap.values()));
      setBackendLaundryOrders(uniqueList);
    } catch (err) {
      console.warn("Could not load backend laundry data for reports:", err);
    }
  };

  useEffect(() => {
    if (selectedReport === "laundry") {
      loadBackendLaundryData();
    }
  }, [selectedReport, institutionData?.institutionId]);

  const getUniqueCompanyNames = () => {
    if (!companies || companies.length === 0) return [];
    return [
      ...new Set(
        companies
          .map((company) => company.name)
          .filter((name) => name && name !== "N/A")
      ),
    ].sort();
  };

  const formatCurrencyValue = (value) => {
    const numValue = parseFloat(value) || 0;
    const formatted =
      numValue % 1 === 0 ? numValue.toString() : numValue.toFixed(2);
    return `Rs. ${formatted}`;
  };

  // Robust date helpers
  const toDateObj = (val) => {
    if (!val) return null;
    if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
    if (typeof val === "number") return new Date(val > 1e10 ? val : val * 1000);
    if (typeof val === "string") {
      const trimmed = val.trim();
      if (!trimmed) return null;
      // Numeric string timestamp
      if (/^\d{10,13}$/.test(trimmed)) {
        const num = Number(trimmed);
        return new Date(num > 1e10 ? num : num * 1000);
      }
      // ISO strings or strings containing 'T'
      if (trimmed.includes("T")) {
        const d = new Date(trimmed);
        if (!isNaN(d.getTime())) return d;
      }
      // Format YYYY-MM-DD or YYYY/MM/DD
      if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(trimmed)) {
        const parts = trimmed.split(/[-/]/);
        const y = Number(parts[0]);
        const m = Number(parts[1]) - 1;
        const d = Number(parts[2].slice(0, 2));
        const dt = new Date(y, m, d);
        if (!isNaN(dt.getTime())) return dt;
      }
      // Format DD-MM-YYYY or DD/MM/YYYY or MM/DD/YYYY
      if (/^\d{1,2}[-/]\d{1,2}[-/]\d{4}/.test(trimmed)) {
        const [p1, p2, p3] = trimmed.split(/[-/]/).map(Number);
        let day = p1;
        let month = p2;
        // In Indian context, DD/MM/YYYY is standard.
        // If second number > 12, format is MM/DD/YYYY
        if (p2 > 12) {
          day = p2;
          month = p1;
        }
        const dt = new Date(p3, month - 1, day);
        if (!isNaN(dt.getTime())) return dt;
      }
      const d = new Date(trimmed);
      return isNaN(d.getTime()) ? null : d;
    }
    return null;
  };

  const toYMD = (dateLike) => {
    const d = toDateObj(dateLike);
    if (!d) return "";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  };

  // Check for exported data on component mount
  useEffect(() => {
    const storedData = sessionStorage.getItem("exportData");
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        setExportedData(parsedData);
        setSelectedReport("exported");
        sessionStorage.removeItem("exportData");
      } catch (error) {
        console.error("Error parsing exported data:", error);
      }
    }
  }, []);

  // Enforce store-only reports when userType is store, and laundry-only reports when userType is laundry
  useEffect(() => {
    if (userData?.userType === "store") {
      const storeReports = ["stock_inventory", "stock_issues", "stock_purchases"];
      if (!storeReports.includes(selectedReport)) {
        setSelectedReport("stock_inventory");
      }
    } else if (userData?.userType === "laundry") {
      if (selectedReport !== "laundry") {
        setSelectedReport("laundry");
      }
    }
  }, [userData?.userType, selectedReport]);

  // Report configurations
  const reportConfigs = {
    rooms: {
      title: "Room Report",
      icon: Bed,
      description: "Room status, types, and occupancy details",
      dataSource: "rooms",
      columns: [
        { key: "room_number", label: "Room Number", type: "text" },
        { key: "room_type", label: "Type", type: "text" },
        { key: "status", label: "Status", type: "text" },
        { key: "floor", label: "Floor", type: "number" },
        { key: "tariff", label: "Rate", type: "currency" },
      ],
    },
    bookings: {
      title: "Check-in Report",
      icon: Calendar,
      description: "Check-in details and guest information from reservations",
      dataSource: "reservations",
      columns: [
        { key: "grc_id", label: "GRC ID", type: "text" },
        { key: "guest_name", label: "Guest Name", type: "text" },
        { key: "room_number", label: "Room", type: "text" },
        { key: "room_type", label: "Type", type: "text" },
        { key: "checkin_date", label: "Check-in", type: "date" },

        { key: "advance_payment", label: "Advance Payment", type: "currency" },
        { key: "discount", label: "Discount", type: "currency" },
        { key: "total_amount", label: "Total Amount", type: "currency" },
      ],
    },
    guests: {
      title: "Guest Report",
      icon: Users,
      description: "Guest information from billing data",
      dataSource: "bills",
      columns: [
        { key: "bill_no", label: "Bill ID", type: "text" },
        { key: "guest_name", label: "Guest Name", type: "text" },
        { key: "guest_mobile", label: "Mobile", type: "text" },
        { key: "room_number", label: "Room", type: "text" },
        { key: "room_type", label: "Type", type: "text" },
        { key: "checkin_date", label: "Check-in", type: "date" },
        { key: "checkout_date", label: "Check-out", type: "date" },
        { key: "total_amount", label: "Total", type: "currency" },
        { key: "payment_mode", label: "Payment", type: "text" },
        { key: "gst_number", label: "GST Number", type: "text" },
      ],
    },
    staff: {
      title: "Staff Report",
      icon: Users,
      description: "Staff information and employment details",
      dataSource: "staffs",
      columns: [
        { key: "staff_id", label: "Staff ID", type: "text" },
        { key: "name", label: "Full Name", type: "text" },
        { key: "email", label: "Email", type: "text" },
        { key: "mobile", label: "Mobile", type: "text" },
        { key: "role", label: "Position", type: "array" },
        { key: "is_active", label: "Active", type: "boolean" },
        { key: "created_at", label: "Joined On", type: "date" },
      ],
    },
    companies: {
      title: "Company Transactions",
      icon: Building2,
      description: "Company transaction history with deposits and credits",
      dataSource: "companies",
      columns: [
        { key: "date", label: "Date", type: "date" },
        { key: "company_name", label: "Company", type: "text" },
        { key: "guest", label: "Guest", type: "text" },
        { key: "reference", label: "Reference", type: "text" },
        { key: "gst_number", label: "GST Number", type: "text" },
        { key: "credit", label: "Credit", type: "currency" },
        { key: "deposit", label: "Deposit", type: "currency" },
        { key: "balance", label: "Running Balance", type: "currency" },
        { key: "kind", label: "Type", type: "text" },
      ],
    },
    complementary: {
      title: "Complementary Report",
      icon: Gift,
      description: "Complementary items provided (by date and room)",
      dataSource: "bills",
      columns: [
        { key: "date", label: "Date", type: "date" },
        { key: "room_number", label: "Room Number", type: "text" },
        {
          key: "complementary_name",
          label: "Complementary Name",
          type: "text",
        },
        { key: "amount", label: "Amount", type: "currency" },
      ],
    },
    night: {
      title: "Night Audit Report",
      icon: Calendar,
      description:
        "Comprehensive hotel and restaurant night audit summary with ARR, Occupancy %, and channel revenue breakdown",
      dataSource: "reports",
      columns: [
        { key: "date", label: "Date", type: "date" },
        { key: "total_rooms_available", label: "Total Rooms Available", type: "number" },
        { key: "room_nights_sold", label: "Room Nights Sold", type: "number" },
        { key: "room_revenue", label: "Total Room Revenue", type: "currency" },
        { key: "arr", label: "ARR (Room Rev / Sold)", type: "currency" },
        { key: "occupancy_percent", label: "Occupancy %", type: "text" },
        { key: "rest_revenue", label: "Restaurant Rev", type: "currency" },
        { key: "room_service_rev", label: "Room Service Rev", type: "currency" },
        { key: "zomato_revenue", label: "Zomato Rev", type: "currency" },
        { key: "swiggy_revenue", label: "Swiggy Rev", type: "currency" },
        { key: "banquet_revenue", label: "Banquet Rev", type: "currency" },
        { key: "board_room_revenue", label: "Board Room Rev", type: "currency" },
        { key: "mtd_room_revenue", label: "MTD Room Rev", type: "currency" },
        { key: "mtd_fb_revenue", label: "MTD F&B Rev", type: "currency" },
        { key: "mtd_total_revenue", label: "MTD Total Rev", type: "currency" },
        { key: "total_revenue", label: "Total Day Revenue", type: "currency" },
      ],
    },
    occupancy: {
      title: "Room Occupancy Report",
      icon: Bed,
      description: "Daily occupancy metrics by date from calculated reports",
      dataSource: "reports",
      columns: [
        { key: "date", label: "Date", type: "date" },
        { key: "total_rooms", label: "Total Rooms", type: "number" },
        { key: "occupied", label: "Occupied", type: "number" },
        { key: "vacant", label: "Vacant", type: "number" },
        {
          key: "under_maintenance",
          label: "Under Maintenance",
          type: "number",
        },
        { key: "dirty", label: "Dirty", type: "number" },
        { key: "occupancy_rate", label: "Occupancy %", type: "text" },
      ],
    },
    expenses: {
      title: "Cash Draw (Expense) Report",
      icon: DollarSign,
      description: "Expenses and received amounts with cash flow tracking",
      dataSource: "expenses",
      columns: [
        { key: "date", label: "Date", type: "date" },
        { key: "transaction_type", label: "Type", type: "text" },
        { key: "name", label: "Name/Description", type: "text" },
        { key: "description", label: "Details", type: "text" },
        { key: "amount", label: "Amount", type: "currency" },
        { key: "balance_impact", label: "Balance Impact", type: "currency" },
      ],
    },
    restaurant: {
      title: "Restaurant Orders Report",
      icon: UtensilsCrossed,
      description: "Restaurant orders and food service details",
      dataSource: "restaurantOrders",
      columns: [
        { key: "billNo", label: "Bill No", type: "text" },
        { key: "orderId", label: "Order ID", type: "text" },
        { key: "tableName", label: "Table/Room", type: "text" },
        { key: "orderDate", label: "Order Date", type: "date" },
        { key: "orderTime", label: "Order Time", type: "text" },
        { key: "subtotal", label: "Subtotal", type: "currency" },
        { key: "cgst", label: "CGST", type: "currency" },
        { key: "sgst", label: "SGST", type: "currency" },
        { key: "totalAmount", label: "Total Amount", type: "currency" },
        { key: "paymentMethod", label: "Payment Method", type: "text" },
        { key: "paymentStatus", label: "Payment Status", type: "text" },
      ],
    },
    settlement: {
      title: "Settlement Report",
      icon: Receipt,
      description: "Guests who checked out with settlement details, bill number, payment mode & remarks",
      dataSource: "bookings",
      columns: [
        { key: "bill_no", label: "Bill Number", type: "text" },
        { key: "guest_name", label: "Guest Name", type: "text" },
        { key: "room_number", label: "Room No", type: "text" },
        { key: "checkout_date", label: "Check-out Date", type: "date" },
        { key: "status", label: "Status", type: "text" },
        { key: "advance_payment", label: "Advance Payment", type: "currency" },
        { key: "total_amount", label: "Total Amount", type: "currency" },
        { key: "payment_mode", label: "Payment Mode", type: "text" },
        { key: "remarks", label: "Remarks", type: "text" },
      ],
    },
    laundry: {
      title: "Laundry Revenue Report",
      icon: Shirt,
      description: "Granular laundry revenue itemized by care type (Washing vs Pressing vs Dry Clean), room folios & direct settlements",
      dataSource: "laundry",
      columns: [
        { key: "token", label: "Tag / Token", type: "text" },
        { key: "date", label: "Date", type: "date" },
        { key: "guest", label: "Guest / Room", type: "text" },
        { key: "garments", label: "Garments (Pcs)", type: "number" },
        { key: "care_types", label: "Care Types", type: "text" },
        { key: "speed", label: "Speed", type: "text" },
        { key: "subtotal", label: "Items Subtotal", type: "currency" },
        { key: "surcharge", label: "Express Fee", type: "currency" },
        { key: "cgst", label: "CGST", type: "currency" },
        { key: "sgst", label: "SGST", type: "currency" },
        { key: "total_amount", label: "Total Amount", type: "currency" },
        { key: "settlement", label: "Settlement", type: "text" },
        { key: "status", label: "Status", type: "text" },
      ],
    },
    stock_inventory: {
      title: "Store Stock Inventory Report",
      icon: Package,
      description: "Live store stock quantities, category, unit, par levels, rates and total valuation",
      dataSource: "stock",
      columns: [
        { key: "itemName", label: "Item Name", type: "text" },
        { key: "category", label: "Category", type: "text" },
        { key: "quantity", label: "Current Qty", type: "number" },
        { key: "unit", label: "Unit", type: "text" },
        { key: "parLevel", label: "Par Level", type: "number" },
        { key: "status", label: "Status", type: "text" },
        { key: "price", label: "Last Rate", type: "currency" },
        { key: "total_valuation", label: "Valuation", type: "currency" },
      ],
    },
    stock_issues: {
      title: "Store Issue & Consumption Report",
      icon: ArrowUpFromLine,
      description: "Date-wise departmental consumption (Kitchen, Housekeeping, Laundry & other depts)",
      dataSource: "stock",
      columns: [
        { key: "date", label: "Issue Date", type: "date" },
        { key: "department", label: "Department", type: "text" },
        { key: "itemName", label: "Item Name", type: "text" },
        { key: "quantity", label: "Quantity", type: "number" },
        { key: "unit", label: "Unit", type: "text" },
        { key: "type", label: "Type", type: "text" },
        { key: "description", label: "Remarks / Purpose", type: "text" },
      ],
    },
    stock_purchases: {
      title: "Store Purchase Register",
      icon: ShoppingCart,
      description: "Vendor inward purchase invoices, GRN numbers and total expenditure",
      dataSource: "stock",
      columns: [
        { key: "date", label: "Bill Date", type: "date" },
        { key: "grnNo", label: "GRN No", type: "text" },
        { key: "billNo", label: "Bill No", type: "text" },
        { key: "vendorName", label: "Vendor", type: "text" },
        { key: "itemName", label: "Item", type: "text" },
        { key: "quantity", label: "Quantity", type: "number" },
        { key: "unit", label: "Unit", type: "text" },
        { key: "price", label: "Rate", type: "currency" },
        { key: "total_amount", label: "Total Amount", type: "currency" },
      ],
    },
    police: {
      title: "Police Report (C-Form)",
      icon: Shield,
      description: "Mandatory guest arrival register for police verification — includes ID proof, nationality & address",
      dataSource: "bookings",
      columns: [
        { key: "sno", label: "S.No.", type: "number" },
        { key: "arrival_date", label: "Date of Arrival", type: "date" },
        { key: "guest_name", label: "Guest Name", type: "text" },
        { key: "mobile", label: "Mobile", type: "text" },
        { key: "nationality", label: "Nationality", type: "text" },
        { key: "address", label: "Permanent Address", type: "text" },
        { key: "room_number", label: "Room No.", type: "text" },
        { key: "departure_date", label: "Date of Departure", type: "date" },
        { key: "id_proof_type", label: "ID Type", type: "text" },
        { key: "id_proof_number", label: "ID Number", type: "text" },
        { key: "purpose", label: "Purpose of Visit", type: "text" },
      ],
    },
  };

  // Helper to process Complementary report data from bookings, bills, and restaurant orders
  const processComplementaryData = () => {
    const rows = [];
    const seen = new Set();

    const addRow = ({ date, room_number, complementary_name, amount }) => {
      const dStr = toYMD(date);
      if (!dStr) return;
      const cleanName = String(complementary_name || "Complementary").trim();
      const cleanRoom = String(room_number || "N/A").trim();
      const numAmount = Number(amount) || 0;

      const dedupeKey = `${dStr}_${cleanRoom}_${cleanName.toLowerCase()}_${numAmount}`;
      if (seen.has(dedupeKey)) return;
      seen.add(dedupeKey);

      rows.push({
        date: dStr,
        room_number: cleanRoom,
        complementary_name: cleanName,
        amount: numAmount,
      });
    };

    // Helper to traverse any nested complementary object structure
    const parseComplementaryStructure = (compObj, fallbackRoom, fallbackDate) => {
      if (!compObj || typeof compObj !== "object") return;

      if (Array.isArray(compObj)) {
        compObj.forEach((item) => {
          if (!item) return;
          if (typeof item === "string") {
            addRow({
              date: fallbackDate,
              room_number: fallbackRoom,
              complementary_name: item,
              amount: 0,
            });
          } else {
            addRow({
              date: item.date || item.dateKey || fallbackDate,
              room_number: item.room_number || item.roomNumber || fallbackRoom,
              complementary_name:
                item.name ||
                item.title ||
                item.description ||
                item.complementary_name ||
                "Complementary",
              amount: item.amount ?? item.price ?? 0,
            });
          }
        });
        return;
      }

      Object.entries(compObj).forEach(([k1, val1]) => {
        if (!val1) return;
        if (Array.isArray(val1)) {
          const isDateKey = Boolean(toDateObj(k1));
          val1.forEach((item) => {
            if (!item) return;
            const itemDate = isDateKey ? k1 : item.date || fallbackDate;
            const itemRoom = isDateKey
              ? item.room_number || fallbackRoom
              : k1 || fallbackRoom;
            addRow({
              date: itemDate,
              room_number: itemRoom,
              complementary_name:
                item.name ||
                item.title ||
                item.description ||
                item.complementary_name ||
                "Complementary",
              amount: item.amount ?? item.price ?? 0,
            });
          });
        } else if (typeof val1 === "object") {
          Object.entries(val1).forEach(([k2, val2]) => {
            if (!val2) return;
            if (Array.isArray(val2)) {
              val2.forEach((item) => {
                if (!item) return;
                const isK2Date = Boolean(toDateObj(k2));
                const itemDate = isK2Date
                  ? k2
                  : toDateObj(k1)
                  ? k1
                  : item.date || fallbackDate;
                const itemRoom = isK2Date ? k1 : k2;
                addRow({
                  date: itemDate,
                  room_number: itemRoom || fallbackRoom,
                  complementary_name:
                    item.name ||
                    item.title ||
                    item.description ||
                    item.complementary_name ||
                    "Complementary",
                  amount: item.amount ?? item.price ?? 0,
                });
              });
            } else if (typeof val2 === "object") {
              addRow({
                date: val2.date || k2 || fallbackDate,
                room_number: val2.room_number || k1 || fallbackRoom,
                complementary_name:
                  val2.name ||
                  val2.title ||
                  val2.description ||
                  "Complementary",
                amount: val2.amount ?? val2.price ?? 0,
              });
            }
          });
        }
      });
    };

    // 1. Extract from bookings
    (bookings || []).forEach((b) => {
      const roomFallback =
        b.room_number ||
        (Array.isArray(b.room_id) ? b.room_id.join(", ") : b.room_id) ||
        Object.keys(b.room_charges || {})[0] ||
        "N/A";
      const dateFallback =
        b.checkin_date || b.created_at || b.booking_date || Date.now();

      if (b.complementary) {
        parseComplementaryStructure(b.complementary, roomFallback, dateFallback);
      }
      if (b.services?.complementary) {
        parseComplementaryStructure(
          b.services.complementary,
          roomFallback,
          dateFallback
        );
      }
      if (b.breakdown?.booking?.complementary) {
        parseComplementaryStructure(
          b.breakdown.booking.complementary,
          roomFallback,
          dateFallback
        );
      }
      if (b.breakdown?.bookingDetails?.services?.complementary) {
        parseComplementaryStructure(
          b.breakdown.bookingDetails.services.complementary,
          roomFallback,
          dateFallback
        );
      }
    });

    // 2. Extract from bills
    (bills || []).forEach((bill) => {
      const roomFallback =
        bill?.bill?.bookingDetails?.roomNumber ??
        bill?.bill?.bookingDetails?.room_no ??
        bill?.room_number ??
        bill?.original_bill_data?.room_number ??
        "N/A";
      const dateFallback =
        bill?.bill?.billHeader?.billDate ??
        bill?.bill?.bookingDetails?.checkOut ??
        bill?.created_at ??
        Date.now();

      const compCandidates = [
        bill?.original_bill_data?.complementary,
        bill?.original_bill_data?.services?.complementary,
        bill?.bill?.original_bill_data?.complementary,
        bill?.bill?.original_bill_data?.services?.complementary,
        bill?.bill?.bookingDetails?.complementary,
        bill?.bookingDetails?.complementary,
        bill?.complementary,
        bill?.bill?.complementary,
      ];
      compCandidates.forEach((cand) => {
        if (cand) parseComplementaryStructure(cand, roomFallback, dateFallback);
      });

      const lineItems = [
        bill?.bill?.items,
        bill?.bill?.lineItems,
        bill?.items,
        bill?.lineItems,
        bill?.bill?.serviceDetails?.complimentaryItems,
        bill?.bill?.complimentaryItems,
      ].filter(Array.isArray);

      lineItems.forEach((items) => {
        items.forEach((li) => {
          if (!li) return;
          const isCompl =
            li.isComplimentary === true ||
            li.is_complimentary === true ||
            String(li.category || "")
              .toLowerCase()
              .includes("compliment") ||
            String(li.name || "")
              .toLowerCase()
              .includes("compliment") ||
            String(li.title || "")
              .toLowerCase()
              .includes("compliment") ||
            String(li.description || "")
              .toLowerCase()
              .includes("compliment");
          if (isCompl) {
            addRow({
              date: li.date || dateFallback,
              room_number: li.room_number || roomFallback,
              complementary_name:
                li.name ||
                li.title ||
                li.description ||
                "Complementary",
              amount: li.amount ?? li.price ?? 0,
            });
          }
        });
      });
    });

    // 3. Extract from restaurantOrders
    (restaurantOrders || []).forEach((order) => {
      const payMethod = String(
        order.paymentMethod || order.payment_mode || ""
      ).toLowerCase();
      const ordType = String(order.orderType || order.type || "").toLowerCase();
      const isOrderCompl =
        payMethod === "complementary" ||
        ordType === "complementary" ||
        order.isComplimentary;
      const orderDate =
        order.orderDate || order.created_at || order.createdAt || Date.now();
      const orderRoom = order.roomNumber || order.tableNumber || "Restaurant";

      if (isOrderCompl) {
        if (Array.isArray(order.items) && order.items.length > 0) {
          order.items.forEach((item) => {
            addRow({
              date: orderDate,
              room_number: orderRoom,
              complementary_name:
                item.itemName || item.name || "Restaurant Order",
              amount: item.price || item.total || 0,
            });
          });
        } else {
          addRow({
            date: orderDate,
            room_number: orderRoom,
            complementary_name:
              `Restaurant Order #${order.bill_no || order.orderId || ""}`.trim(),
            amount: order.totalAmount || order.grandTotal || order.amount || 0,
          });
        }
      } else if (Array.isArray(order.items)) {
        order.items.forEach((item) => {
          if (item?.isComplimentary || item?.is_complimentary) {
            addRow({
              date: orderDate,
              room_number: orderRoom,
              complementary_name:
                item.itemName || item.name || "Complementary Food",
              amount: item.price || 0,
            });
          }
        });
      }
    });

    return rows.sort(
      (a, b) => (new Date(b.date) || 0) - (new Date(a.date) || 0)
    );
  };

  const extractComplementaryRowsFromBills = (billsList) => {
    return processComplementaryData();
  };

  // ─── Police Report (C-Form) processor ────────────────────────────────────────
  // Robust data extraction: searches directly on booking, checks nested guest details,
  // matches guest_id across guests, and checks total bills to resolve guest names,
  // phone numbers, permanent addresses, ID proofs, and room numbers.
  const processPoliceReportData = () => {
    const rows = [];
    let sno = 1;

    // Helper map of room ID -> Room Number
    const roomNumberMap = new Map();
    (rooms || []).forEach((r) => {
      const num = r.room_number || r.roomNumber;
      if (r.id) roomNumberMap.set(String(r.id), String(num));
      if (r.room_id) roomNumberMap.set(String(r.room_id), String(num));
      if (r._id) roomNumberMap.set(String(r._id), String(num));
    });

    const resolveRoomNumber = (bk) => {
      if (bk.room_number && bk.room_number !== "N/A" && !/^[0-9a-f-]{20,}$/i.test(String(bk.room_number))) {
        return String(bk.room_number);
      }
      if (bk.roomNumber && !/^[0-9a-f-]{20,}$/i.test(String(bk.roomNumber))) {
        return String(bk.roomNumber);
      }
      const chargesKeys = Object.keys(bk.room_charges || {});
      for (const k of chargesKeys) {
        if (roomNumberMap.has(k)) return roomNumberMap.get(k);
        if (!/^[0-9a-f-]{20,}$/i.test(k)) return k;
      }
      const rawRoomIds = bk.room_id || bk.room_ids || bk.roomIds;
      if (Array.isArray(rawRoomIds)) {
        const resolved = rawRoomIds.map((id) => roomNumberMap.get(String(id)) || String(id));
        return resolved.join(", ");
      } else if (rawRoomIds) {
        return roomNumberMap.get(String(rawRoomIds)) || String(rawRoomIds);
      }
      return bk.room_number || "N/A";
    };

    (bookings || []).forEach((bk) => {
      const st = String(bk.status || "").toLowerCase();
      if (st === "cancelled" || st === "rejected") return;

      // Match guest entity from guests array by guest_id or id
      const matchedGuest = (guests || []).find(
        (g) =>
          (g.guest_id && (g.guest_id === bk.guest_id || g.guest_id === bk.id)) ||
          (g.id && (g.id === bk.guest_id || g.id === bk.id)) ||
          (g._id && (g._id === bk.guest_id || g._id === bk.id)) ||
          (g.mobile && bk.mobile && String(g.mobile).replace(/\D/g, "") === String(bk.mobile).replace(/\D/g, ""))
      );

      // Match from bills collection if available
      const matchedBill = (bills || []).find(
        (b) =>
          (b.booking_id && b.booking_id === bk.booking_id) ||
          (b.id && b.id === bk.booking_id) ||
          (b.guest_id && b.guest_id === bk.guest_id)
      );
      const billGuestDetails = matchedBill?.guestDetails || matchedBill?.guest_details || {};

      // ── Guest name ──────────────────────────────────────────────────────────
      const guestName =
        bk.full_name ||
        bk.guest_name ||
        bk.guestName ||
        bk.name ||
        bk.customer_name ||
        bk.primaryGuestName ||
        bk.guestDetails?.guestName ||
        bk.guestDetails?.full_name ||
        bk.guest?.name ||
        matchedGuest?.full_name ||
        matchedGuest?.name ||
        matchedGuest?.guest_name ||
        billGuestDetails?.guestName ||
        billGuestDetails?.full_name ||
        (Array.isArray(bk.guests) ? bk.guests[0]?.name : null) ||
        "Guest";

      // ── Mobile ──────────────────────────────────────────────────────────────
      const rawMobile =
        bk.mobile ||
        bk.phone ||
        bk.contact ||
        bk.guest_mobile ||
        bk.guestMobile ||
        bk.guestDetails?.mobile ||
        bk.guestDetails?.phone ||
        matchedGuest?.mobile ||
        matchedGuest?.phone ||
        billGuestDetails?.mobile ||
        billGuestDetails?.phone ||
        "";
      const cleanMobile = String(rawMobile || "").replace(/\D/g, "").slice(-10) || "—";

      // ── Nationality ─────────────────────────────────────────────────────────
      const nationality =
        bk.nationality ||
        bk.country ||
        matchedGuest?.nationality ||
        matchedGuest?.country ||
        billGuestDetails?.nationality ||
        "Indian";

      // ── Address ─────────────────────────────────────────────────────────────
      const fullAddr =
        bk.address ||
        bk.permanent_address ||
        bk.guest_address ||
        bk.home_address ||
        matchedGuest?.address ||
        matchedGuest?.permanent_address ||
        billGuestDetails?.address ||
        billGuestDetails?.full_address ||
        "";

      const city = bk.city || matchedGuest?.city || billGuestDetails?.city || "";
      const state = bk.state || matchedGuest?.state || billGuestDetails?.state || "";
      const pin = bk.pincode || bk.pinCode || matchedGuest?.pincode || billGuestDetails?.pinCode || "";

      const addressParts = [fullAddr, city, state, pin].filter(Boolean);
      const displayAddress = addressParts.length > 0 ? addressParts.join(", ") : "—";

      // ── Room number ─────────────────────────────────────────────────────────
      const roomNum = resolveRoomNumber(bk);

      // ── ID proof ────────────────────────────────────────────────────────────
      const idType =
        bk.id_proof_type ||
        bk.idProofType ||
        bk.id_type ||
        matchedGuest?.id_proof_type ||
        matchedGuest?.idProofType ||
        billGuestDetails?.idProofType ||
        billGuestDetails?.id_proof_type ||
        "";

      const idNumber =
        bk.id_proof_number ||
        bk.idProofNumber ||
        bk.id_number ||
        matchedGuest?.id_proof_number ||
        matchedGuest?.idProofNumber ||
        billGuestDetails?.idProofNumber ||
        billGuestDetails?.id_proof_number ||
        "";

      // ── Purpose ─────────────────────────────────────────────────────────────
      const purpose =
        bk.purpose ||
        bk.purpose_of_visit ||
        bk.purposeOfVisit ||
        bk.remarks ||
        "Tourism";

      // ── Dates ───────────────────────────────────────────────────────────────
      const arrivalDate =
        bk.checkin_date || bk.checkIn || bk.arrival_date || bk.created_at || null;
      const departureDate =
        bk.checkout_date || bk.checkOut || bk.departure_date || null;

      rows.push({
        sno: sno++,
        arrival_date: arrivalDate,
        guest_name: guestName,
        mobile: cleanMobile,
        nationality,
        address: displayAddress,
        room_number: roomNum,
        departure_date: departureDate,
        id_proof_type: idType || "—",
        id_proof_number: idNumber || "—",
        purpose,
        date: arrivalDate,
      });

      // ── Extra pax (additional guests on same booking) ───────────────────────
      const extraPax = bk.extra_pax || bk.extraPax || bk.additional_guests || [];
      if (Array.isArray(extraPax)) {
        extraPax.forEach((pax) => {
          if (!pax) return;
          const paxName = pax.name || pax.guest_name || pax.full_name || pax.guestName;
          if (!paxName) return;
          const paxAddr = pax.address ? [pax.address, pax.city, pax.state].filter(Boolean).join(", ") : displayAddress;
          rows.push({
            sno: sno++,
            arrival_date: arrivalDate,
            guest_name: paxName,
            mobile: (pax.mobile || pax.phone || cleanMobile).replace(/\D/g, "").slice(-10) || "—",
            nationality: pax.nationality || nationality,
            address: paxAddr,
            room_number: roomNum,
            departure_date: departureDate,
            id_proof_type: pax.id_proof_type || pax.idProofType || idType || "—",
            id_proof_number: pax.id_proof_number || pax.idProofNumber || idNumber || "—",
            purpose,
            date: arrivalDate,
          });
        });
      }
    });

    return rows.sort(
      (a, b) => (new Date(b.arrival_date || 0) || 0) - (new Date(a.arrival_date || 0) || 0)
    );
  };

  const processOccupancyData = () => {
    const totalRooms =
      Array.isArray(rooms) && rooms.length > 0 ? rooms.length : 18;
    const occupancyByDate = new Map();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMs = today.getTime();
    const todayKey = toYMD(today);

    // 1. Process from saved Day End reports ONLY for past days (strictly before today)
    (reports || []).forEach((r) => {
      if (!r || !r.date) return;
      const dObj = toDateObj(r.date);
      if (!dObj) return;
      dObj.setHours(0, 0, 0, 0);
      // Skip if report date is today or in the future
      if (dObj.getTime() >= todayMs) return;

      const dKey = toYMD(dObj);
      const roomStatusCounts =
        r.summary?.roomStatusCounts || r.roomStatusCounts || {};
      const occupied = Number(
        roomStatusCounts["occupied"] ?? r.roomData?.occupied?.length ?? 0
      );
      const dirty = Number(
        roomStatusCounts["dirty"] ?? r.roomData?.dirty?.length ?? 0
      );
      const underMaintenance = Number(
        roomStatusCounts["undermaintenance"] ??
        roomStatusCounts["maintenance"] ??
        r.roomData?.under_maintenance?.length ??
        0
      );
      const vacant = Number(
        roomStatusCounts["vacant"] ?? r.roomData?.vacant?.length ?? 0
      );
      const calcTotal = occupied + dirty + underMaintenance + vacant;
      const effectiveTotal = calcTotal > 0 ? calcTotal : totalRooms;
      const rate =
        effectiveTotal > 0 ? (occupied / effectiveTotal) * 100 : 0;

      occupancyByDate.set(dKey, {
        date: dKey,
        total_rooms: effectiveTotal,
        occupied,
        vacant:
          vacant > 0
            ? vacant
            : Math.max(0, effectiveTotal - occupied - dirty - underMaintenance),
        dirty,
        under_maintenance: underMaintenance,
        occupancy_rate: rate.toFixed(2) + "%",
      });
    });

    // 2. Compute dynamic occupancy for candidate dates (including today, past 30 days, future booking dates)
    const candidateDates = new Set();
    candidateDates.add(todayKey);

    if (dateRange?.from) {
      const from = new Date(dateRange.from);
      from.setHours(0, 0, 0, 0);
      const to = dateRange.to ? new Date(dateRange.to) : new Date(from);
      to.setHours(0, 0, 0, 0);
      const curr = new Date(from);
      while (curr <= to) {
        candidateDates.add(toYMD(curr));
        curr.setDate(curr.getDate() + 1);
      }
    } else {
      // Default: past 14 days and next 7 days for visibility into tomorrow/upcoming
      for (let i = -7; i <= 14; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        candidateDates.add(toYMD(d));
      }
    }

    // Also collect dates from any bookings (check-in to check-out)
    (bookings || []).forEach((b) => {
      const cin = toDateObj(b.checkin_date || b.checkIn);
      const cout = toDateObj(b.checkout_date || b.checkOut);
      if (cin) candidateDates.add(toYMD(cin));
      if (cout) candidateDates.add(toYMD(cout));
    });

    candidateDates.forEach((dateStr) => {
      // Only skip if already calculated from verified past Day End report
      if (occupancyByDate.has(dateStr)) return;

      const targetDate = toDateObj(dateStr);
      if (!targetDate) return;
      targetDate.setHours(0, 0, 0, 0);
      const targetTime = targetDate.getTime();
      const isToday = dateStr === todayKey;

      if (isToday) {
        // TODAY: Calculate real-time occupancy from active rooms and checked-in/in-house bookings
        const occupiedRoomsCount = (rooms || []).filter((rm) => {
          const st = String(rm.status || "").toLowerCase();
          return st === "occupied";
        }).length;

        const dirtyCount = (rooms || []).filter((rm) => {
          const st = String(rm.status || "").toLowerCase();
          return st.includes("dirty");
        }).length;

        const underMaintCount = (rooms || []).filter((rm) => {
          const st = String(rm.status || "").toLowerCase();
          return st.includes("maintenance");
        }).length;

        // Count active checked-in bookings that have not yet checked out
        const activeBookingsCount = (bookings || []).filter((b) => {
          const st = String(b.status || "").toLowerCase();
          if (st === "cancelled" || st === "rejected" || st === "checked-out" || st === "checkedout") {
            return false;
          }
          const cin = toDateObj(b.checkin_date || b.checkIn);
          const cout = toDateObj(b.checkout_date || b.checkOut);
          const cinMs = cin ? new Date(cin).setHours(0,0,0,0) : null;
          const coutMs = cout ? new Date(cout).setHours(23,59,59,999) : null;

          // If checked in or in-house, consider occupied
          if (st === "checked-in" || st === "checkedin" || st === "in-house" || st === "inhouse" || st === "occupied") {
            return true;
          }
          // Reserved/confirmed booking covering today
          if (cinMs && coutMs && targetTime >= cinMs && targetTime <= coutMs) {
            return true;
          }
          return false;
        }).length;

        const finalOccupied = Math.max(occupiedRoomsCount, activeBookingsCount);
        const effectiveTotal = Math.max(totalRooms, finalOccupied);
        const vacantCount = Math.max(0, effectiveTotal - finalOccupied - dirtyCount - underMaintCount);
        const rate = effectiveTotal > 0 ? (finalOccupied / effectiveTotal) * 100 : 0;

        occupancyByDate.set(dateStr, {
          date: dateStr,
          total_rooms: effectiveTotal,
          occupied: finalOccupied,
          vacant: vacantCount,
          dirty: dirtyCount,
          under_maintenance: underMaintCount,
          occupancy_rate: rate.toFixed(2) + "%",
        });
      } else {
        // Any other date (historical or future): count bookings active on targetDate
        let occupiedCount = 0;
        (bookings || []).forEach((b) => {
          const st = String(b.status || "").toLowerCase();
          if (st === "cancelled" || st === "rejected" || st === "no-show" || st === "noshow") return;

          const cin = toDateObj(b.checkin_date || b.checkIn);
          const cout = toDateObj(b.checkout_date || b.checkOut);
          if (!cin) return;
          const cinD = new Date(cin);
          cinD.setHours(0, 0, 0, 0);
          const coutD = cout ? new Date(cout) : new Date(cinD);
          coutD.setHours(23, 59, 59, 999);

          if (targetTime >= cinD.getTime() && targetTime <= coutD.getTime()) {
            const numRooms = Number(b.no_of_rooms || b.number_of_rooms || (Array.isArray(b.room_id) ? b.room_id.length : 1)) || 1;
            occupiedCount += numRooms;
          }
        });

        const effectiveTotal = totalRooms > 0 ? totalRooms : Math.max(occupiedCount, 1);
        const finalOccupied = Math.min(occupiedCount, effectiveTotal);
        const vacantCount = Math.max(0, effectiveTotal - finalOccupied);
        const rate = effectiveTotal > 0 ? (finalOccupied / effectiveTotal) * 100 : 0;

        occupancyByDate.set(dateStr, {
          date: dateStr,
          total_rooms: effectiveTotal,
          occupied: finalOccupied,
          vacant: vacantCount,
          dirty: 0,
          under_maintenance: 0,
          occupancy_rate: rate.toFixed(2) + "%",
        });
      }
    });

    return Array.from(occupancyByDate.values()).sort(
      (a, b) => (new Date(b.date) || 0) - (new Date(a.date) || 0)
    );
  };

    // Helper to process restaurant order data
  const processRestaurantData = (ordersList) => {
    const rows = [];

    if (!ordersList || !Array.isArray(ordersList)) return rows;

    ordersList.forEach((order) => {
      // Convert createdAt timestamp to date and time
      const orderDate = new Date(order.createdAt);
      const orderDateStr = orderDate.toISOString().split("T")[0];
      const orderTimeStr = orderDate.toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
      });

      // Process items array
      const itemsList = order.items
        ? order.items
            .map((item) => `${item.name} (${item.quantity}x)`)
            .join(", ")
        : "";

      // Calculate subtotal if not provided
      const subtotal =
        order.subtotal ||
        (order.items
          ? order.items.reduce(
              (sum, item) => sum + item.price * item.quantity,
              0
            )
          : 0);

      // Calculate combined payment status
      let combinedPaymentStatus = "Pending";
      if (order.cancel === true) {
        combinedPaymentStatus = "Cancelled";
      } else if (order.paymentStatus === true) {
        combinedPaymentStatus = "Paid";
      }

      const billNumber = order.billNo || order.billNumber || order.orderId || "N/A";
      rows.push({
        billNo: billNumber,
        orderId: order.orderId || "N/A",
        tableName: order.tableName || "N/A",
        orderDate: orderDateStr,
        orderTime: orderTimeStr,
        subtotal: subtotal,
        cgst: order.cgst || 0,
        sgst: order.sgst || 0,
        totalAmount: order.totalAmount || 0,
        paymentStatus: combinedPaymentStatus,
        // Additional fields for display options
        orderSource: order.orderSource || order.staffName || "N/A",
        paidBy: order.staffName || "N/A",
        // Keep original fields for filtering
        paymentMethod: order.paymentMethod || "N/A",
        paymentStatusOriginal:
          order.paymentStatus !== undefined ? order.paymentStatus : false,
        cancel: order.cancel || false,
        discountAmount: order.discountAmount || 0,
        discountPercentage: order.discountPercentage || 0,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      });
    });

    // Sort by creation date (most recent first)
    return rows.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  };

  // Helper to process expense data from context
  const processExpenseData = (expenseContext) => {
    const rows = [];

    if (!expenseContext || !expenseContext.success) return rows;

    // Process expenses (outgoing cash)
    if (expenseContext.expenses && Array.isArray(expenseContext.expenses)) {
      expenseContext.expenses.forEach((expense) => {
        rows.push({
          date: expense.date || "",
          transaction_type: "Expense",
          name: expense.name || "Unknown",
          description: expense.description || "",
          amount: Math.abs(Number(expense.amount) || 0),
          bill_id: expense.expenseId || expense.bill_id || "",
          payment_method: expense.payment_method || "Cash",
          balance_impact: -Math.abs(Number(expense.amount) || 0), // Negative impact on balance
          expense_id: expense.expenseId || "",
          type: "expense",
        });
      });
    }

    // Process received amounts (incoming cash)
    if (expenseContext.received && Array.isArray(expenseContext.received)) {
      expenseContext.received.forEach((received) => {
        rows.push({
          date: received.date || "",
          transaction_type: "Received",
          name: received.name || "Unknown",
          description: received.description || "",
          amount: Math.abs(Number(received.amount) || 0),
          bill_id: received.bill_id || "",
          payment_method: received.payment_method || "Cash",
          balance_impact: Math.abs(Number(received.amount) || 0), // Positive impact on balance
          received_id: received.receivedId || "",
          type: "received",
        });
      });
    }

    // Sort by date (most recent first)
    return rows.sort((a, b) => {
      const dateA = new Date(a.date.split("/").reverse().join("-"));
      const dateB = new Date(b.date.split("/").reverse().join("-"));
      return dateB - dateA;
    });
  };

  // Helper to process laundry orders and room services
  const processLaundryReportData = () => {
    const orderIdMap = new Set();
    const rows = [];

    // Candidate orders collected from backend and local cache
    const candidateOrders = [];

    // 1. Backend laundry orders and deliveries
    (backendLaundryOrders || []).forEach((o) => candidateOrders.push(o));

    // 2. Local storage cache fallback
    try {
      const savedOrders = localStorage.getItem("hotel_laundry_orders");
      if (savedOrders) {
        JSON.parse(savedOrders).forEach((o) => candidateOrders.push(o));
      }
      const savedDeliveries = localStorage.getItem("hotel_laundry_deliveries");
      if (savedDeliveries) {
        JSON.parse(savedDeliveries).forEach((o) => candidateOrders.push(o));
      }
    } catch (e) {}

    // Process candidate orders
    candidateOrders.forEach((ord) => {
      const token = ord.token || ord.order_id || ord.orderId || ord.barcode || ord.id;
      if (!token) return;
      const tokenStr = String(token);
      if (orderIdMap.has(tokenStr)) return;
      orderIdMap.add(tokenStr);

      const allItems = Array.isArray(ord.items) ? ord.items : [];
      let distinctCare = Array.from(
        new Set(
          allItems.map((i) =>
            i.careType === "wash_and_press"
              ? "Wash & Press"
              : i.careType === "press_only"
              ? "Iron Only"
              : i.careType === "dry_clean"
              ? "Dry Clean"
              : i.careType === "wash_only"
              ? "Wash"
              : i.name || "Care"
          )
        )
      ).join(", ");

      const roomNum = ord.roomNumber || ord.room_number || "";
      const roomText = roomNum && roomNum !== "Walk-In" ? `Room ${roomNum}` : "Walk-In";

      // Robust date extraction
      let dateStr = "";
      if (ord.created_date && typeof ord.created_date === "string" && ord.created_date.includes("-")) {
        dateStr = ord.created_date.trim();
      } else if (ord.orderDate && typeof ord.orderDate === "string" && ord.orderDate.includes("-")) {
        dateStr = ord.orderDate.trim();
      } else if (ord.date && typeof ord.date === "string" && ord.date.includes("-")) {
        dateStr = ord.date.trim();
      } else {
        const tokenMatch = tokenStr.match(/LND-(\d{4})(\d{2})(\d{2})/i);
        if (tokenMatch) {
          dateStr = `${tokenMatch[1]}-${tokenMatch[2]}-${tokenMatch[3]}`;
        } else {
          dateStr = toYMD(ord.createdAt || ord.created_at || ord.timestamp || new Date());
        }
      }

      const totalGarments = Number(
        ord.totalGarments ||
        ord.total_garments ||
        (allItems.length > 0 ? allItems.reduce((acc, i) => acc + (Number(i.quantity) || 1), 0) : 1)
      );

      const totalAmt = Number(ord.grandTotal || ord.totalAmount || ord.total_amount || ord.itemsSubtotal || ord.subtotal || 0);
      const subtotal = Number(ord.itemsSubtotal || ord.subtotal || Math.round((totalAmt / 1.05) * 100) / 100);
      const cgst = Number(ord.cgstAmount || ord.tax?.cgstAmount || Math.round(subtotal * 0.025 * 100) / 100);
      const sgst = Number(ord.sgstAmount || ord.tax?.sgstAmount || Math.round(subtotal * 0.025 * 100) / 100);

      const isDelivered =
        ord.is_delivered === true ||
        ord.delivered_to_room === true ||
        String(ord.delivery_status || "").toLowerCase().includes("delivered") ||
        String(ord.status || "").toLowerCase().includes("delivered");

      const settlementLabel =
        ord.settlementType === "ROOM_FOLIO" ||
        ord.settlementType === "room_folio" ||
        ord.paymentMethod === "ROOM_FOLIO" ||
        ord.paymentMethod === "folio" ||
        Boolean(roomNum && roomNum !== "Walk-In")
          ? `Room Folio (${roomNum || ""})`
          : `Direct (${ord.paymentMethod || "CASH"})`;

      rows.push({
        token: tokenStr,
        date: dateStr,
        guest: `${ord.guestName || ord.guest_name || ord.name || "Guest"} (${roomText})`,
        room_number: roomNum,
        garments: totalGarments,
        care_types: distinctCare || "Laundering",
        speed: ord.serviceSpeedLabel || ord.turnaroundSpeed || ord.turnaround_speed || "Standard",
        subtotal: subtotal,
        surcharge: Number(ord.surchargeAmount || 0),
        cgst: cgst,
        sgst: sgst,
        total_amount: totalAmt,
        settlement: settlementLabel,
        status: isDelivered ? "Delivered" : (ord.status || "Completed"),
      });
    });

    // 3. Scan bookings for any folio laundry services in detailedServices
    (bookings || []).forEach((bk) => {
      const guestName = bk.guest_name || bk.booking_name || bk.name || "In-House Guest";
      
      // A. Scan detailedServices
      if (bk.detailedServices && typeof bk.detailedServices === "object") {
        Object.entries(bk.detailedServices).forEach(([roomKey, byDate]) => {
          if (!byDate || typeof byDate !== "object") return;
          Object.entries(byDate).forEach(([dateKey, items]) => {
            if (Array.isArray(items)) {
              items.forEach((item) => {
                const isLaundry =
                  item &&
                  (item.service_type === "laundry" ||
                   item.serviceType === "laundry" ||
                   Number(item.laundry_charges) > 0 ||
                   String(item.order_id || item.token || "").startsWith("LND-"));
                if (!isLaundry) return;

                const token = item.token || item.order_id || item.service_id || `LND-${roomKey}-${dateKey}`;
                if (orderIdMap.has(String(token))) return;
                orderIdMap.add(String(token));

                const charge = Number(item.totalAmount || item.laundry_charges || item.charge || 0);
                const subtotal = Number(item.itemsSubtotal || Math.round((charge / 1.05) * 100) / 100);
                const cgst = Number(item.cgstAmount || Math.round((subtotal * 0.025) * 100) / 100);
                const sgst = Number(item.sgstAmount || Math.round((subtotal * 0.025) * 100) / 100);
                const tokenMatch = String(token).match(/LND-(\d{4})(\d{2})(\d{2})/i);
                const dateStr = tokenMatch ? `${tokenMatch[1]}-${tokenMatch[2]}-${tokenMatch[3]}` : (toYMD(item.created_at || item.createdAt || dateKey) || toYMD(new Date()));

                rows.push({
                  token: String(token),
                  date: dateStr,
                  guest: `${item.guestName || guestName} (Room ${roomKey})`,
                  room_number: roomKey,
                  garments: Number(item.totalGarments || (item.items || []).length || 1),
                  care_types: "Laundering",
                  speed: "Standard",
                  subtotal,
                  surcharge: 0,
                  cgst,
                  sgst,
                  total_amount: charge,
                  settlement: `Room Folio (${roomKey})`,
                  status: item.is_delivered || item.delivery_status === "delivered_to_room" || item.status === "Delivered" ? "Delivered" : "Completed",
                });
              });
            }
          });
        });
      }

      // B. Scan standard booking.services
      if (bk.services && typeof bk.services === "object") {
        Object.entries(bk.services).forEach(([roomKey, byDate]) => {
          if (!byDate || typeof byDate !== "object") return;
          Object.entries(byDate).forEach(([dateKey, serviceObj]) => {
            if (!serviceObj) return;
            const laundryCharge = Number(serviceObj.laundry_charges || (Array.isArray(serviceObj) ? serviceObj.reduce((s, x) => s + Number(x?.laundry_charges || 0), 0) : 0));
            if (laundryCharge > 0) {
              const token = `LND-${roomKey}-${dateKey}`;
              if (orderIdMap.has(String(token))) return;
              orderIdMap.add(String(token));

              const subtotal = Math.round((laundryCharge / 1.05) * 100) / 100;
              const cgst = Math.round((subtotal * 0.025) * 100) / 100;
              const sgst = Math.round((subtotal * 0.025) * 100) / 100;

              rows.push({
                token,
                date: toYMD(dateKey) || dateKey,
                guest: `${guestName} (Room ${roomKey})`,
                room_number: roomKey,
                garments: 1,
                care_types: "Laundering",
                speed: "Standard",
                subtotal,
                surcharge: 0,
                cgst,
                sgst,
                total_amount: laundryCharge,
                settlement: `Room Folio (${roomKey})`,
                status: "Delivered",
              });
            }
          });
        });
      }
    });

    return rows.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  // Helper to process stock inventory data
  const processStockInventoryData = () => {
    const map = {};
    const sorted = [...(stockHistory || [])].sort((a, b) => (a.dateEpoch || 0) - (b.dateEpoch || 0));

    sorted.forEach((entry) => {
      const key = `${entry.itemName}_${entry.unit}_${entry.category}`;
      if (!map[key]) {
        const catLower = (entry.category || "").toLowerCase();
        let defaultPar = 10;
        if (catLower.includes("linen") || catLower.includes("towel")) defaultPar = 25;
        if (catLower.includes("chemical") || catLower.includes("clean")) defaultPar = 15;
        if (catLower.includes("consumable")) defaultPar = 20;

        map[key] = {
          itemName: entry.itemName,
          category: entry.category,
          unit: entry.unit,
          quantity: 0,
          parLevel: Number(entry.parLevel) || defaultPar,
          price: Number(entry.price) || 0,
        };
      }
      if (entry.parLevel) map[key].parLevel = Number(entry.parLevel);
      if (entry.price && Number(entry.price) > 0) map[key].price = Number(entry.price);

      const q = Number(entry.quantity) || 0;
      if (entry.actionType === "add" || entry.actionType === "purchase-entry" || entry.actionType === "return") map[key].quantity += q;
      if (entry.actionType === "distributed" || entry.actionType === "issue_entry") map[key].quantity -= q;
      if (entry.actionType === "adjustment" || entry.actionType === "wastage") map[key].quantity = q;
    });

    return Object.values(map).map((item) => {
      const isCritical = item.quantity === 0;
      const isLow = item.quantity <= item.parLevel;
      const status = isCritical ? "OUT OF STOCK" : isLow ? "LOW STOCK" : "OK";
      const total_valuation = (item.quantity * item.price).toFixed(2);
      return {
        ...item,
        status,
        total_valuation: Number(total_valuation),
      };
    });
  };

  // Helper to process stock departmental issues
  const processStockIssuesData = () => {
    const issueLogs = (stockHistory || []).filter(
      (log) => log.actionType === "issue_entry" || log.actionType === "distributed" || log.actionType === "return"
    );

    return issueLogs.map((log) => {
      const d = log.issueDate ? toDateObj(log.issueDate) : toDateObj(log.dateEpoch);
      return {
        date: d ? toYMD(d) : "",
        department: (log.department || "General").toUpperCase(),
        itemName: log.itemName || "—",
        quantity: Number(log.adjustmentQuantity || log.quantity || 0),
        unit: log.unit || "pcs",
        type: log.actionType === "return" ? "Return" : "Issue",
        description: log.description || "—",
      };
    }).sort((a, b) => (new Date(b.date) || 0) - (new Date(a.date) || 0));
  };

  // Helper to process stock purchase register
  const processStockPurchasesData = () => {
    const purchaseLogs = (stockHistory || []).filter((log) => log.actionType === "purchase-entry");

    return purchaseLogs.map((log) => {
      const d = log.billDate ? toDateObj(log.billDate) : toDateObj(log.dateEpoch);
      const q = Number(log.quantity) || 0;
      const p = Number(log.price) || 0;
      return {
        date: d ? toYMD(d) : "",
        grnNo: log.grnNo || "—",
        billNo: log.billNo || "—",
        vendorName: log.vendorName || "—",
        itemName: log.itemName || "—",
        quantity: q,
        unit: log.unit || "pcs",
        price: p,
        total_amount: Number((q * p).toFixed(2)),
      };
    }).sort((a, b) => (new Date(b.date) || 0) - (new Date(a.date) || 0));
  };

  // Fetch data based on selected report
  useEffect(() => {
    const fetchData = async () => {
      if (!selectedReport) return;

      try {
        if (selectedReport === "stock_inventory" || selectedReport === "stock_issues" || selectedReport === "stock_purchases") {
          const instId = institutionData?.institutionId || defaultInstitutionId;
          let allStock = [];
          let lastEvaluatedKey = null;
          let page = 0;
          const MAX_PAGES = 30;

          do {
            let query = `institutionId=${encodeURIComponent(instId)}&limit=500`;
            if (lastEvaluatedKey) {
              const keyStr = typeof lastEvaluatedKey === "object"
                ? JSON.stringify(lastEvaluatedKey)
                : String(lastEvaluatedKey);
              query += `&exclusiveStartKey=${encodeURIComponent(keyStr)}`;
            }
            const { body } = await get({
              apiName: "frontdesk",
              path: `/stock?${query}`,
            }).response;
            const res = await body.json();
            if (res?.success && Array.isArray(res.stockHistory)) {
              allStock = allStock.concat(res.stockHistory);
              lastEvaluatedKey = res.lastEvaluatedKey || null;
              if (res.stockHistory.length < 500 || !lastEvaluatedKey) break;
            } else {
              break;
            }
            page++;
          } while (lastEvaluatedKey && page < MAX_PAGES);

          setStockHistory(allStock);
          return;
        }

        switch (selectedReport) {
          case "laundry":
            await fetchBookings();
            await listTotalBill();
            await loadBackendLaundryData();
            break;
          case "rooms":
            await fetchRooms();
            break;
          case "bookings":
            await fetchBookings();
            await fetchGuests();
            break;
          case "revenue":
          case "guests":
            await listTotalBill();
            break;
          case "staff":
            await fetchStaffs();
            break;
          case "companies":
            await fetchCompanies();
            break;

          case "night":
          case "occupancy":
            if (typeof fetchReports === "function") {
              await fetchReports();
            }
            if (typeof fetchRooms === "function") {
              await fetchRooms();
            }
            if (typeof fetchBookings === "function") {
              await fetchBookings();
            }
            if (typeof fetchRestaurantOrders === "function") {
              await fetchRestaurantOrders();
            }
            break;
          case "complementary":
            if (typeof listTotalBill === "function") {
              await listTotalBill();
            }
            if (typeof fetchBookings === "function") {
              await fetchBookings();
            }
            if (typeof fetchRooms === "function") {
              await fetchRooms();
            }
            if (typeof fetchRestaurantOrders === "function") {
              await fetchRestaurantOrders();
            }
            break;
          case "expenses":
            // Expenses data is already available in context
            break;
          case "restaurant":
            await fetchRestaurantOrders();
            break;
          case "settlement":
            await fetchBookings();
            await fetchGuests();
            break;
          case "police":
            if (typeof fetchBookings === "function") {
              await fetchBookings();
            }
            if (typeof fetchGuests === "function") {
              await fetchGuests();
            }
            break;
          default:
            break;
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to fetch data");
      }
    };

    fetchData();
  }, [selectedReport]);

  // Process data based on selected report and filters
  useEffect(() => {
    if (!selectedReport) {
      setReportData([]);
      return;
    }

    let data = [];
    let config = reportConfigs[selectedReport];

    console.log("Staffs", staffs);

    // Handle exported data
    if (selectedReport === "exported" && exportedData) {
      data = exportedData.data || [];
      config = {
        title: exportedData.title || "Exported Data Report",
        description:
          exportedData.description || "Data exported from another page",
        columns: exportedData.columns || [],
      };
    } else {
      switch (selectedReport) {
        case "laundry":
          data = processLaundryReportData();
          break;
        case "rooms":
          data = rooms || [];
          break;
        case "bookings":
          data = (bookings || []).map((bk) => {
            // Resolve room number from multiple possible locations
            const roomNum =
              bk.room_number ||
              (Array.isArray(bk.room_id) ? bk.room_id.join(", ") : null) ||
              Object.keys(bk.room_charges || {})[0] ||
              bk.roomNumber ||
              "N/A";

            // Resolve room type
            const roomType =
              bk.room_type ||
              bk.roomType ||
              bk.category ||
              (rooms || []).find(
                (r) =>
                  String(r.room_number) === String(roomNum) ||
                  String(r.id) === String(bk.room_id)
              )?.room_type ||
              "N/A";

            // Resolve guest name
            const guestName =
              bk.guest_name ||
              bk.full_name ||
              bk.guestName ||
              bk.name ||
              bk.customer_name ||
              bk.primaryGuestName ||
              "N/A";

            // Calculate total amount
            const roomCharges = Object.values(
              bk.room_charges || {}
            ).reduce((s, v) => s + Number(v || 0), 0);
            const serviceCharges = Object.values(
              bk.services || {}
            ).reduce((daySum, dayServices) => {
              return (
                daySum +
                Object.values(dayServices || {}).reduce((s, svc) => {
                  return (
                    s +
                    Number(svc?.manual_charges || 0) +
                    Number(svc?.minibar_charges || 0) +
                    Number(svc?.laundry_charges || 0) +
                    Number(svc?.extra_bed_charges || 0) +
                    Number(svc?.food_charges || 0)
                  );
                }, 0)
              );
            }, 0);
            const totalAmount =
              roomCharges + serviceCharges - Number(bk.discount || 0);

            return {
              grc_id: bk.booking_id || bk.grc_id || bk.id || "N/A",
              guest_name: guestName,
              room_number: roomNum,
              room_type: roomType,
              checkin_date: bk.checkin_date || bk.checkIn || null,
              checkout_date: bk.checkout_date || bk.checkOut || null,
              status: bk.status || "N/A",
              advance_payment:
                Number(bk.advance_payment || bk.partial_payment_amount || 0),
              discount: Number(bk.discount || 0),
              total_amount: totalAmount,
              date: bk.checkin_date || bk.checkIn || bk.created_at || null,
            };
          });
          break;
        case "revenue":
        case "guests":
          data = (bills || []).map((bill) => {
            // Bills can be nested in bill.bill or directly on bill
            const bd =
              bill?.bill?.bookingDetails ||
              bill?.bookingDetails ||
              bill?.original_bill_data ||
              {};
            const bh = bill?.bill?.billHeader || {};
            const gd = bill?.bill?.guestDetails || bill?.guestDetails || {};

            // Find matching booking or guest record for rich fallback if bill has missing fields
            const matchedBooking = (bookings || []).find(
              (b) =>
                (bd.bookingId && (b.booking_id === bd.bookingId || b.id === bd.bookingId)) ||
                (bill?.booking_id && b.booking_id === bill.booking_id) ||
                (bill?.id && b.booking_id === bill.id)
            );
            const matchedGuest = (guests || []).find(
              (g) =>
                (matchedBooking?.guest_id && (g.guest_id === matchedBooking.guest_id || g.id === matchedBooking.guest_id)) ||
                (bill?.guest_id && (g.guest_id === bill.guest_id || g.id === bill.guest_id))
            );

            const guestName =
              gd.guestName ||
              gd.full_name ||
              gd.name ||
              bd.guestName ||
              bd.guest_name ||
              bd.full_name ||
              bill?.guest_name ||
              bill?.guestName ||
              matchedBooking?.full_name ||
              matchedGuest?.full_name ||
              matchedGuest?.name ||
              "-";
            const guestMobile =
              gd.mobile ||
              gd.phone ||
              gd.guestMobile ||
              bd.guestMobile ||
              bd.mobile ||
              bd.phone ||
              bd.contact ||
              bill?.guest_mobile ||
              bill?.mobile ||
              matchedBooking?.mobile ||
              matchedGuest?.mobile ||
              matchedGuest?.phone ||
              "-";
            const roomNum =
              bd.roomNumber ||
              bd.room_no ||
              bd.room_number ||
              bill?.room_number ||
              (matchedBooking?.rooms_config?.[0]?.room_number) ||
              matchedBooking?.room_number ||
              Object.keys(bill?.room_charges || {})[0] ||
              "-";
            const roomType =
              bd.roomType ||
              bd.room_type ||
              bill?.room_type ||
              matchedBooking?.room_category ||
              matchedBooking?.room_type ||
              (rooms || []).find(
                (r) => String(r.room_number) === String(roomNum)
              )?.room_type ||
              "Standard";
            const checkinDate =
              bd.checkIn ||
              bd.checkin_date ||
              bill?.checkin_date ||
              bill?.created_at ||
              null;
            const checkoutDate =
              bd.checkOut ||
              bd.checkout_date ||
              bill?.checkout_date ||
              bh.billDate ||
              bill?.created_at ||
              null;
            const totalAmount =
              Number(
                bill?.bill?.grandTotal ||
                  bill?.grandTotal ||
                  bill?.total_amount ||
                  bill?.bill?.totalAmount ||
                  bd.totalAmount ||
                  0
              );
            const paymentMode =
              bd.paymentMode ||
              bd.payment_mode ||
              bill?.payment_mode ||
              bill?.bill?.paymentMode ||
              bh.paymentMode ||
              "N/A";
            const gstNumber =
              bd.gstNumber ||
              bd.gst_number ||
              bd.gstin ||
              bill?.gst_number ||
              bill?.gstin ||
              "";
            const billNo =
              bill?.bill_no ||
              bill?.billNo ||
              bh.billNo ||
              bill?.id ||
              "N/A";

            return {
              bill_no: billNo,
              guest_name: guestName,
              guest_mobile: guestMobile,
              room_number: roomNum,
              room_type: roomType,
              checkin_date: checkinDate,
              checkout_date: checkoutDate,
              total_amount: totalAmount,
              payment_mode: paymentMode,
              gst_number: gstNumber,
              date: checkoutDate || checkinDate || bill?.created_at || null,
            };
          });
          break;
        case "staff":
          data = staffs || [];
          break;
        case "companies":
          data = companies || [];
          break;
        
        case "night":
          data = reports || [];
          break;
        case "occupancy":
          data = processOccupancyData();
          break;
        case "complementary":
          data = processComplementaryData();
          break;
        case "expenses":
          // Transform expenses data into unified cash flow format
          data = processExpenseData(expenses);
          break;
        case "restaurant":
          // Transform restaurant orders data into formatted rows
          data = processRestaurantData(restaurantOrders);
          break;
        case "settlement": {
          const hasDateFilter = Boolean(dateRange?.from);
          // Show all checked-out / settled bookings by default when no date is picked
          const checkedOutBookings = (bookings || []).filter((b) => {
            const status = String(b.status || "").toLowerCase();
            const isCheckedOut = (
              status === "checked-out" ||
              status === "checkedout" ||
              status === "checked_out" ||
              status === "settled" ||
              Boolean(b.checkout_date && status !== "cancelled" && status !== "reserved")
            );
            if (!isCheckedOut) return false;

            if (hasDateFilter) {
              const fromDate = new Date(dateRange.from).setHours(0, 0, 0, 0);
              const toObj = dateRange.to || dateRange.from;
              const toDate = new Date(toObj).setHours(23, 59, 59, 999);
              const co =
                typeof b.checkout_date === "string"
                  ? new Date(b.checkout_date).getTime()
                  : Number(b.checkout_date);
              return Number.isFinite(co) && co >= fromDate && co <= toDate;
            }
            // By default with NO date selected, show all records!
            return true;
          });
          data = checkedOutBookings.map((booking) => {
            const roomCharges = Object.values(
              booking.room_charges || {}
            ).reduce((sum, charge) => sum + charge, 0);
            const serviceCharges = Object.values(booking.services || {}).reduce(
              (sum, dayServices) => {
                return (
                  sum +
                  Object.values(dayServices).reduce((daySum, service) => {
                    return (
                      daySum +
                      (service.manual_charges || 0) +
                      (service.minibar_charges || 0) +
                      (service.laundry_charges || 0) +
                      (service.extra_bed_charges || 0) +
                      (service.food_charges || 0)
                    );
                  }, 0)
                );
              },
              0
            );
            const totalAmount =
              roomCharges + serviceCharges - (booking.discount || 0);

            let guestName =
              booking.full_name ||
              booking.guestName ||
              booking.name ||
              booking.customer_name ||
              booking.primaryGuestName;
            if (!guestName && booking.guest_id) {
              const guest = guests?.find(
                (g) =>
                  g.guest_id === booking.guest_id ||
                  g.id === booking.guest_id ||
                  g._id === booking.guest_id
              );
              guestName =
                guest?.full_name || guest?.name || guest?.guest_name || "";
            }

            const billNo =
              booking.bill_no ||
              booking.billNumber ||
              booking.bill_no_sequence ||
              "";

            const paymentMode =
              booking.payment_mode ||
              booking.paymentMode ||
              booking.settlement_payment_mode ||
              booking.advance_payment_mode ||
              "N/A";

            const remarks =
              booking.notes ||
              booking.remarks ||
              booking.settlement_notes ||
              booking.settlement_remarks ||
              "";

            return {
              bill_no: billNo || "N/A",
              guest_name: guestName || "N/A",
              room_number: Object.keys(booking.room_charges || {})[0] || booking.room_number || "N/A",
              checkout_date: booking.checkout_date || null,
              date: booking.checkout_date || null,
              status: booking.status || "Checked-out",
              advance_payment:
                booking.advance_payment || booking.partial_payment_amount || 0,
              total_amount: totalAmount,
              payment_mode: paymentMode,
              remarks: remarks || "-",
            };
          });
          break;
        }
        case "stock_inventory":
          data = processStockInventoryData();
          break;
        case "stock_issues":
          data = processStockIssuesData();
          break;
        case "stock_purchases":
          data = processStockPurchasesData();
          break;
        case "police":
          data = processPoliceReportData();
          break;
        default:
          data = [];
      }
    }

    // Apply date filter if date range is selected (skip for rooms, companies, and current stock inventory snapshot)
    if (
      dateRange?.from &&
      selectedReport !== "rooms" &&
      selectedReport !== "companies" &&
      selectedReport !== "stock_inventory" &&
      selectedReport !== "settlement"
    ) {
      const fromDate = new Date(
        dateRange.from.getFullYear(),
        dateRange.from.getMonth(),
        dateRange.from.getDate(),
        0, 0, 0, 0
      );
      const toObj = dateRange.to || dateRange.from;
      const toDate = new Date(
        toObj.getFullYear(),
        toObj.getMonth(),
        toObj.getDate(),
        23, 59, 59, 999
      );

      data = data.filter((item) => {
        const itemDateRaw =
          item.date ||
          item.billDate ||
          item.bill_date ||
          item.checkout_date ||
          item.checkin_date ||
          item.created_at ||
          item.createdAt ||
          item.booking_date ||
          item.orderDate ||
          item.order_date ||
          item.purchaseDate ||
          item.issueDate ||
          item.dateEpoch ||
          item.timestamp ||
          item.billHeader?.billDate;

        const itemDateObj = toDateObj(itemDateRaw);
        if (!itemDateObj) return false;
        const itemTime = itemDateObj.getTime();
        return itemTime >= fromDate.getTime() && itemTime <= toDate.getTime();
      });
    }

    // Apply generic search filter (stringify)
    if (filters.search) {
      const search = String(filters.search).toLowerCase();
      data = data.filter((item) => {
        try {
          return JSON.stringify(item).toLowerCase().includes(search);
        } catch {
          return false;
        }
      });
    }

    // Transform data for guests report
    if (selectedReport === "guests") {
      // Helper to compute room total from charges or rate plan or standard rates
      const computeTotal = (b, bRoot, finalSummary, billingSummary) => {
        const directTotal = Number(
          finalSummary?.totalAmount ||
          bRoot?.grandTotal ||
          bRoot?.totalAmount ||
          bRoot?.total_amount ||
          billingSummary?.grandTotal ||
          billingSummary?.totalAmount ||
          b?.total_amount ||
          0
        );
        if (directTotal > 0) return directTotal;

        // If direct total is 0, compute from room charges, extra pax and services
        const roomChargesSum = Object.values(b?.room_charges || bRoot?.room_charges || {}).reduce(
          (sum, v) => sum + Number(v || 0),
          0
        );
        let servicesSum = 0;
        const svcs = b?.services || bRoot?.services;
        if (svcs && typeof svcs === "object") {
          Object.values(svcs).forEach((daySvc) => {
            if (Array.isArray(daySvc)) {
              daySvc.forEach((s) => {
                servicesSum +=
                  Number(s.food_charges || 0) +
                  Number(s.minibar_charges || 0) +
                  Number(s.laundry_charges || 0) +
                  Number(s.extra_bed_charges || 0) +
                  Number(s.manual_charges || 0);
              });
            }
          });
        }
        let extraPaxSum = 0;
        const paxList = b?.extra_pax || bRoot?.extra_pax;
        if (Array.isArray(paxList)) {
          paxList.forEach((p) => {
            extraPaxSum += Number(p.extra_pax_amount || p.amount || 0);
          });
        }
        const combined = roomChargesSum + servicesSum + extraPaxSum;
        if (combined > 0) return Math.max(0, combined - Number(b?.discount || 0));

        // Default estimation by nights and room category
        const cin = b?.checkin_date || bRoot?.checkin_date;
        const cout = b?.checkout_date || bRoot?.checkout_date;
        const nights = Math.max(
          1,
          cin && cout ? Math.ceil((new Date(cout) - new Date(cin)) / (1000 * 60 * 60 * 24)) : 1
        );
        const roomsCount = Math.max(
          1,
          Array.isArray(b?.room_id) ? b.room_id.length : (b?.rooms_config?.length || 1)
        );
        const rate = (rooms || []).find(
          (r) => String(r.room_number) === String(b?.room_number || bRoot?.room_number)
        )?.price_per_night || 2000;
        return (rate * roomsCount * nights) - Number(b?.discount || 0);
      };
      data = (data || []).map((bill, index) => {
        // If bill was already mapped from earlier case or is raw
        const bRoot = bill.bill || bill;
        const guestDetails = bRoot?.guestDetails || bill.guestDetails || {};
        const bookingDetails = bRoot?.bookingDetails || bill.bookingDetails || {};
        const billingSummary = bRoot?.billingSummary || bill.billingSummary || {};
        const finalSummary = bRoot?.finalSummary || bill.finalSummary || {};
        const billHeader = bRoot?.billHeader || bill.billHeader || {};

        // Also search matching booking and guest
        const bId = bookingDetails.bookingId || bill.booking_id || bill.bookingId || bill.id;
        const matchedBooking = (bookings || []).find(
          (b) => (bId && (b.booking_id === bId || b.id === bId))
        );
        const gId = matchedBooking?.guest_id || bill.guest_id;
        const matchedGuest = (guests || []).find(
          (g) => (gId && (g.guest_id === gId || g.id === gId))
        );

        const guestName =
          bill.guest_name ||
          guestDetails.guestName ||
          guestDetails.full_name ||
          guestDetails.name ||
          bookingDetails.guestName ||
          bookingDetails.guest_name ||
          matchedBooking?.full_name ||
          matchedGuest?.full_name ||
          matchedGuest?.name ||
          "Guest";

        const guestMobile =
          bill.guest_mobile ||
          guestDetails.mobile ||
          guestDetails.phone ||
          bookingDetails.guestMobile ||
          bookingDetails.mobile ||
          matchedBooking?.mobile ||
          matchedGuest?.mobile ||
          matchedGuest?.phone ||
          "-";

        const roomNum =
          bill.room_number ||
          bookingDetails.roomNumber ||
          bookingDetails.room_no ||
          matchedBooking?.room_number ||
          matchedBooking?.rooms_config?.[0]?.room_number ||
          "-";

        const roomType =
          bill.room_type ||
          bookingDetails.roomType ||
          bookingDetails.room_type ||
          matchedBooking?.room_category ||
          matchedBooking?.room_type ||
          "Standard";

        const cinDate =
          bill.checkin_date ||
          bookingDetails.checkIn ||
          bookingDetails.checkin_date ||
          matchedBooking?.checkin_date ||
          bill.date ||
          null;

        const coutDate =
          bill.checkout_date ||
          bookingDetails.checkOut ||
          bookingDetails.checkout_date ||
          matchedBooking?.checkout_date ||
          billHeader.billDate ||
          null;

        const computedAmt = computeTotal(matchedBooking || bill, bRoot, finalSummary, billingSummary);
        const totalAmount = computedAmt > 0 ? computedAmt : Number(billingSummary.balanceDue || matchedBooking?.partial_payment_amount || 0);

        const rawBillNo =
          bill.bill_no ||
          bill.bill_id ||
          billHeader.bill_no ||
          billHeader.billNo ||
          billHeader.billNumber ||
          billHeader.bookingRef ||
          matchedBooking?.bill_no ||
          matchedBooking?.booking_id ||
          bill.id ||
          "";

        const billNo = (rawBillNo && rawBillNo !== "N/A" && rawBillNo !== "-")
          ? rawBillNo
          : (matchedBooking?.booking_id ? ("BILL-" + matchedBooking.booking_id) : ("BILL-" + (index + 1)));

        const paymentMode =
          bill.payment_mode ||
          bookingDetails.paymentMode ||
          billHeader.paymentMode ||
          "Cash";

        return {
          bill_id: billNo,
          bill_no: billNo,
          guest_name: guestName,
          guest_mobile: guestMobile,
          guest_email: guestDetails.email || matchedBooking?.email || matchedGuest?.email || "-",
          room_number: roomNum,
          room_type: roomType,
          checkin_date: cinDate,
          checkout_date: coutDate,
          number_of_nights: bookingDetails.numberOfNights || matchedBooking?.no_of_nights || 1,
          room_charges: billingSummary.totalRoomServices || 0,
          service_charges: billingSummary.totalServiceCharges || 0,
          total_amount: totalAmount,
          balance_due: billingSummary.balanceDue || 0,
          payment_mode: paymentMode,
          booking_status: bookingDetails.bookingType || matchedBooking?.status || "Completed",
          booking_type: bookingDetails.bookingType || matchedBooking?.booking_type || "Walk-in",
          gst_number: bookingDetails.gstNo || guestDetails.gstIn || matchedBooking?.gst_no || "-",
          has_gst:
            (guestDetails.gstIn && guestDetails.gstIn !== "N/A" && guestDetails.gstIn !== "---") ||
            (bookingDetails.gstNo && bookingDetails.gstNo !== "N/A" && bookingDetails.gstNo !== "---")
              ? "Yes"
              : "No",
          date: coutDate || cinDate || null,
          updated_at: bill.updated_at || null,
        };
      });

      // Guest-specific filters
      if (guestFilters.checkinDate.from && guestFilters.checkinDate.to) {
        data = data.filter((item) => {
          if (!item.checkin_date) return false;
          const checkinDate = toDateObj(item.checkin_date);
          if (!checkinDate) return false;
          const itemDate = new Date(
            checkinDate.getFullYear(),
            checkinDate.getMonth(),
            checkinDate.getDate()
          );
          const fromDate = new Date(
            guestFilters.checkinDate.from.getFullYear(),
            guestFilters.checkinDate.from.getMonth(),
            guestFilters.checkinDate.from.getDate()
          );
          const toDate = new Date(
            guestFilters.checkinDate.to.getFullYear(),
            guestFilters.checkinDate.to.getMonth(),
            guestFilters.checkinDate.to.getDate()
          );
          return itemDate >= fromDate && itemDate <= toDate;
        });
      }

      if (guestFilters.checkoutDate.from && guestFilters.checkoutDate.to) {
        data = data.filter((item) => {
          if (!item.checkout_date) return false;
          const checkoutDate = toDateObj(item.checkout_date);
          if (!checkoutDate) return false;
          const itemDate = new Date(
            checkoutDate.getFullYear(),
            checkoutDate.getMonth(),
            checkoutDate.getDate()
          );
          const fromDate = new Date(
            guestFilters.checkoutDate.from.getFullYear(),
            guestFilters.checkoutDate.from.getMonth(),
            guestFilters.checkoutDate.from.getDate()
          );
          const toDate = new Date(
            guestFilters.checkoutDate.to.getFullYear(),
            guestFilters.checkoutDate.to.getMonth(),
            guestFilters.checkoutDate.to.getDate()
          );
          return itemDate >= fromDate && itemDate <= toDate;
        });
      }

      if (guestFilters.roomNumber) {
        data = data.filter(
          (item) =>
            item.room_number &&
            item.room_number
              .toString()
              .toLowerCase()
              .includes(guestFilters.roomNumber.toLowerCase())
        );
      }

      if (guestFilters.roomType) {
        data = data.filter(
          (item) =>
            item.room_type &&
            item.room_type
              .toString()
              .toLowerCase()
              .includes(guestFilters.roomType.toLowerCase())
        );
      }

      if (guestFilters.hasGst) {
        data = data.filter((item) => {
          if (guestFilters.hasGst === "Yes") return item.has_gst === "Yes";
          if (guestFilters.hasGst === "No") return item.has_gst === "No";
          return true;
        });
      }

      if (guestFilters.paymentMethod) {
        data = data.filter(
          (item) =>
            item.payment_mode &&
            item.payment_mode
              .toString()
              .toLowerCase()
              .includes(guestFilters.paymentMethod.toLowerCase())
        );
      }
    }

    // Re-sequence S.No. for police report after date filtering
    if (selectedReport === "police") {
      data.forEach((r, i) => { r.sno = i + 1; });
    }

    // Transform data for companies report (transaction view)
    if (selectedReport === "companies") {
      let allTransactions = [];

      if (companyFilters.selectedCompany) {
        const selectedCompanyData = (companies || []).find(
          (company) => company.name === companyFilters.selectedCompany
        );
        if (selectedCompanyData) {
          allTransactions = processCompanyTransactions(selectedCompanyData);
        }
      } else {
        (companies || []).forEach((company) => {
          const companyTransactions = processCompanyTransactions(company);
          allTransactions = [...allTransactions, ...companyTransactions];
        });
      }

      data = allTransactions.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      if (companyFilters.dateRange.from && companyFilters.dateRange.to) {
        data = data.filter((item) => {
          const itemDate = new Date(item.date);
          const fromDate = new Date(companyFilters.dateRange.from);
          const toDate = new Date(companyFilters.dateRange.to);
          toDate.setHours(23, 59, 59, 999);
          return itemDate >= fromDate && itemDate <= toDate;
        });
      }

      if (companyFilters.transactionType) {
        data = data.filter(
          (item) => item.kind === companyFilters.transactionType
        );
      }

      if (companyFilters.hasGst) {
        data = data.filter((item) => {
          const hasValidGst =
            item.gst_number &&
            item.gst_number !== "N/A" &&
            item.gst_number !== "---" &&
            item.gst_number !== "";
          if (companyFilters.hasGst === "Yes") return hasValidGst;
          if (companyFilters.hasGst === "No") return !hasValidGst;
          return true;
        });
      }

      if (companyFilters.selectedCompany) {
        data = data.filter(
          (item) => item.company_name === companyFilters.selectedCompany
        );
      }
    }

    // Transform data for expenses report
    if (selectedReport === "expenses") {
      // Apply expense-specific filters
      if (expenseFilters.dateRange.from && expenseFilters.dateRange.to) {
        data = data.filter((item) => {
          if (!item.date) return false;
          // Convert DD/MM/YYYY to Date object
          const [day, month, year] = item.date.split("/");
          const itemDate = new Date(year, month - 1, day);
          const fromDate = new Date(expenseFilters.dateRange.from);
          const toDate = new Date(expenseFilters.dateRange.to);
          toDate.setHours(23, 59, 59, 999);
          return itemDate >= fromDate && itemDate <= toDate;
        });
      }

      if (expenseFilters.transactionType) {
        if (expenseFilters.transactionType === "expense") {
          data = data.filter((item) => item.type === "expense");
        } else if (expenseFilters.transactionType === "received") {
          data = data.filter((item) => item.type === "received");
        }
        // 'both' shows all transactions
      }
    }

    function processCompanyTransactions(company) {
      const deposits = (company.deposits || []).map((d) => ({
        kind: "deposit",
        date: d?.date || d?.createdAt || d?.paidAt,
        reference: "",
        guest: "",
        credit: 0,
        deposit: Math.abs(Number(d?.amount ?? 0)),
        gst_number: company.gst_no || "N/A",
        company_name: company.name || "Unknown Company",
        company_id: company.company_id,
      }));

      const credits = (bills || [])
        .filter((bill) => {
          const billCompanyId = bill?.bill?.bookingDetails?.companyId;
          return (
            String(billCompanyId) === String(company.company_id) &&
            bill?.payment_mode === "BTC"
          );
        })
        .map((bill) => {
          let checkoutDate =
            bill?.bill?.bookingDetails?.checkOut ||
            bill?.bill?.billHeader?.billDate ||
            bill?.created_at;

          if (typeof checkoutDate === "number") {
            checkoutDate = new Date(
              checkoutDate > 1e10 ? checkoutDate : checkoutDate * 1000
            );
          }

          const guestName =
            bill?.bill?.guestDetails?.guestName ||
            bill?.bill?.guestDetails?.guest_name ||
            "Unknown Guest";

          const billAmount =
            bill?.bill?.billingSummary?.balanceDue ||
            bill?.bill?.finalSummary?.totalAmount ||
            0;

          const billGstNumber =
            bill?.bill?.guestDetails?.gstIn ||
            bill?.bill?.bookingDetails?.gstNo ||
            company.gst_no ||
            "N/A";

          return {
            kind: "credit",
            date: checkoutDate,
            reference: bill?.bill_id || "",
            guest: guestName,
            credit: Math.abs(Number(billAmount)),
            deposit: 0,
            gst_number: billGstNumber,
            company_name: company.name || "Unknown Company",
            company_id: company.company_id,
          };
        })
        .filter(
          (credit) => credit.date && !isNaN(new Date(credit.date).getTime())
        );

      const merged = [...deposits, ...credits].filter((r) => r.date);
      merged.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      let balance = 0;
      return merged.map((r) => {
        balance += Number(r.deposit) - Number(r.credit);
        return { ...r, balance };
      });
    }

    // Daily revenue report (by type)
    if (selectedReport === "revenue") {
      const byDate = new Map();

      console.log("rev", data);
      

      data = [];
    }

    // Night report (per-date summary row)
    if (selectedReport === "night") {
      const rowsMap = new Map();
      const totalInventoryRooms = (rooms || []).length || 20;

      const dayEndData = data.filter((r) => r && r.dayEndStatus);

      // Group restaurant orders by date string (YYYY-MM-DD)
      const restOrdersByDate = new Map();
      (restaurantOrders || []).forEach((ord) => {
        const orderDateStr = ord.orderDate
          ? new Date(ord.orderDate).toISOString().split("T")[0]
          : ord.createdAt
          ? new Date(Number(ord.createdAt)).toISOString().split("T")[0]
          : null;
        if (!orderDateStr) return;
        if (!restOrdersByDate.has(orderDateStr)) {
          restOrdersByDate.set(orderDateStr, []);
        }
        restOrdersByDate.get(orderDateStr).push(ord);
      });

      // Build daily night audit metrics
      (dayEndData || []).forEach((r) => {
        const dKey = r.date;
        if (!dKey) return;

        const occupiedRoomsCount = r.summary?.roomStatusCounts?.occupied || r.occupied_rooms || 0;
        const totalRoomsAvailable = totalInventoryRooms;
        const roomNightsSold = occupiedRoomsCount;

        // Room revenue for the day from day-end summary or collections
        const roomRev = Number(
          r.financialSummary?.roomRevenue ??
          r.room_revenue ??
          r.summary?.roomRevenue ??
          r.financialSummary?.totalCollection ??
          0
        );

        // ARR = Room Revenue / Total Room Nights Sold
        const arr = roomNightsSold > 0 ? Math.round((roomRev / roomNightsSold) * 100) / 100 : 0;

        // Occupancy %
        const occPercent = totalRoomsAvailable > 0
          ? `${((roomNightsSold / totalRoomsAvailable) * 100).toFixed(1)}%`
          : "0.0%";

        // Restaurant channel breakdown from restaurantOrders for this date
        const dayRestOrders = restOrdersByDate.get(dKey) || [];
        let restDineInRev = 0;
        let roomServiceRev = 0;
        let zomatoRev = 0;
        let swiggyRev = 0;
        let banquetRev = 0;
        let boardRoomRev = 0;

        dayRestOrders.forEach((o) => {
          const amt = Number(o.totalAmount || o.finalTotal || o.total || 0);
          const tbl = String(o.tableName || "").toLowerCase();
          const src = String(o.orderSource || "").toLowerCase();

          if (tbl.includes("room") || tbl.includes("hotel") || src.includes("room")) {
            roomServiceRev += amt;
          } else if (tbl.startsWith("zomato") || src.includes("zomato")) {
            zomatoRev += amt;
          } else if (tbl.startsWith("swiggy") || src.includes("swiggy")) {
            swiggyRev += amt;
          } else if (tbl.includes("banquet") || src.includes("banquet")) {
            banquetRev += amt;
          } else if (tbl.includes("board") || src.includes("board")) {
            boardRoomRev += amt;
          } else {
            restDineInRev += amt;
          }
        });

        const dayTotalFB = restDineInRev + roomServiceRev + zomatoRev + swiggyRev + banquetRev + boardRoomRev;
        const totalDayRev = roomRev + dayTotalFB;

        rowsMap.set(dKey, {
          date: dKey,
          total_rooms_available: totalRoomsAvailable,
          room_nights_sold: roomNightsSold,
          room_revenue: roomRev,
          arr: arr,
          occupancy_percent: occPercent,
          rest_revenue: restDineInRev,
          room_service_rev: roomServiceRev,
          zomato_revenue: zomatoRev,
          swiggy_revenue: swiggyRev,
          banquet_revenue: banquetRev,
          board_room_revenue: boardRoomRev,
          total_revenue: totalDayRev,
          mtd_room_revenue: 0, // Calculated below after date sorting
          mtd_fb_revenue: 0,
          mtd_total_revenue: 0,
        });
      });

      let rows = Array.from(rowsMap.values());
      rows.sort((a, b) => new Date(a.date) - new Date(b.date));

      // Compute MTD (Month Till Date) cumulative sums grouped by year-month
      let curMonth = "";
      let mtdRoom = 0;
      let mtdFB = 0;
      let mtdTotal = 0;

      rows.forEach((row) => {
        const rowMonth = String(row.date).slice(0, 7); // YYYY-MM
        if (rowMonth !== curMonth) {
          curMonth = rowMonth;
          mtdRoom = 0;
          mtdFB = 0;
          mtdTotal = 0;
        }
        const dayFB = (row.rest_revenue || 0) + (row.room_service_rev || 0) + (row.zomato_revenue || 0) +
                      (row.swiggy_revenue || 0) + (row.banquet_revenue || 0) + (row.board_room_revenue || 0);
        mtdRoom += (row.room_revenue || 0);
        mtdFB += dayFB;
        mtdTotal += (row.total_revenue || 0);

        row.mtd_room_revenue = mtdRoom;
        row.mtd_fb_revenue = mtdFB;
        row.mtd_total_revenue = mtdTotal;
      });

      if (dateRange.from && dateRange.to) {
        const fromDate = new Date(
          dateRange.from.getFullYear(),
          dateRange.from.getMonth(),
          dateRange.from.getDate()
        );
        const toDate = new Date(
          dateRange.to.getFullYear(),
          dateRange.to.getMonth(),
          dateRange.to.getDate()
        );
        rows = rows.filter((r) => {
          const d = toDateObj(r.date);
          if (!d) return false;
          const dOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
          return dOnly >= fromDate && dOnly <= toDate;
        });
      }

      data = rows;
    }

    // Occupancy report data is already prepared and formatted by processOccupancyData

    // Transform data for restaurant report
    if (selectedReport === "restaurant") {
      // Apply restaurant-specific filters
      if (restaurantFilters.dateRange.from && restaurantFilters.dateRange.to) {
        data = data.filter((item) => {
          if (!item.orderDate) return false;
          const itemDate = new Date(item.orderDate);
          const fromDate = new Date(restaurantFilters.dateRange.from);
          const toDate = new Date(restaurantFilters.dateRange.to);
          toDate.setHours(23, 59, 59, 999);
          return itemDate >= fromDate && itemDate <= toDate;
        });
      }

      if (restaurantFilters.paymentStatus) {
        data = data.filter(
          (item) => item.paymentStatus === restaurantFilters.paymentStatus
        );
      }

      if (restaurantFilters.paymentMethod) {
        data = data.filter(
          (item) => item.paymentMethod === restaurantFilters.paymentMethod
        );
      }

      if (restaurantFilters.tableName) {
        data = data.filter(
          (item) =>
            item.tableName &&
            item.tableName
              .toString()
              .toLowerCase()
              .includes(restaurantFilters.tableName.toLowerCase())
        );
      }
    }

    // Apply stock issues specific filters (Department filter)
    if (selectedReport === "stock_issues") {
      if (stockFilters.department && stockFilters.department !== "all") {
        data = data.filter(
          (item) => String(item.department || "").toUpperCase() === String(stockFilters.department).toUpperCase()
        );
      }
    }

    // Apply stock inventory specific filters (Category filter)
    if (selectedReport === "stock_inventory") {
      if (stockFilters.category && stockFilters.category !== "all") {
        data = data.filter(
          (item) => String(item.category || "").toLowerCase() === String(stockFilters.category).toLowerCase()
        );
      }
    }

    setReportData(data);
    setCurrentPage(1);
  }, [
    selectedReport,
    rooms,
    bookings,
    guests,
    staffs,
    bills,
    companies,
    reports,
    restaurantOrders,
    dateRange,
    filters,
    exportedData,
    guestFilters,
    companyFilters,
    expenseFilters,
    restaurantFilters,
    restaurantDisplayOptions,
    expenses,
    stockHistory,
    stockFilters,
  ]);

  // Pagination
  const totalPages = Math.ceil(reportData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = reportData.slice(startIndex, endIndex);

  // Format data for export
  const formatDataForExport = (data, columns) => {
    return data.map((item) => {
      const formattedItem = {};
      columns.forEach((column) => {
        let value = item[column.key];
        switch (column.type) {
          case "date": {
            const d = toDateObj(value);
            value = d ? d.toLocaleDateString() : "";
            break;
          }
          case "currency": {
            const numValue = parseFloat(value);
            value = !isNaN(numValue)
              ? `Rs. ${
                  numValue % 1 === 0 ? numValue.toString() : numValue.toFixed(2)
                }`
              : "Rs. 0";
            break;
          }
          case "boolean":
            value = value ? "Yes" : "No";
            break;
          default:
            value = value ?? "";
        }
        formattedItem[column.label] = value;
      });
      return formattedItem;
    });
  };

  // Export to Excel
  const exportToExcel = () => {
    if (!selectedReport || reportData.length === 0) {
      toast.error("No data to export");
      return;
    }

    setIsGenerating(true);
    try {
      let config = reportConfigs[selectedReport];
      let columns = config.columns;

      if (selectedReport === "exported" && exportedData) {
        config = {
          title: exportedData.title || "Exported Data Report",
          description:
            exportedData.description || "Data exported from another page",
        };
        columns = exportedData.columns || [];
      } else if (selectedReport === "guests") {
        // Apply same conditional logic for GST column in export
        const hasGstFilter = guestFilters.hasGst && guestFilters.hasGst !== "";
        if (!hasGstFilter) {
          columns = columns.filter((col) => col.key !== "gst_number");
        }
      }

      const formattedData = formatDataForExport(reportData, columns);

      const ws = XLSX.utils.json_to_sheet(formattedData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, config.title);

      const fileName = `${config.title}_${
        new Date().toISOString().split("T")[0]
      }.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast.success("Excel file downloaded successfully");
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast.error("Failed to export to Excel");
    } finally {
      setIsGenerating(false);
    }
  };

  // Export to PDF
  const exportToPDF = () => {
    if (!selectedReport || reportData.length === 0) {
      toast.error("No data to export");
      return;
    }

    setIsGenerating(true);
    try {
      let config = reportConfigs[selectedReport];
      let columns = config.columns;

      if (selectedReport === "exported" && exportedData) {
        config = {
          title: exportedData.title || "Exported Data Report",
          description:
            exportedData.description || "Data exported from another page",
        };
        columns = exportedData.columns || [];
      } else if (selectedReport === "guests") {
        // Apply same conditional logic for GST column in export
        const hasGstFilter = guestFilters.hasGst && guestFilters.hasGst !== "";
        if (!hasGstFilter) {
          columns = columns.filter((col) => col.key !== "gst_number");
        }
      }

      const formattedData = formatDataForExport(reportData, columns);

      const isLandscape = selectedReport === "laundry" || columns.length > 7;
      const doc = new jsPDF({
        orientation: isLandscape ? "landscape" : "portrait",
        unit: "mm",
        format: "a4",
      });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      doc.setFillColor(240, 240, 240);
      doc.rect(0, 0, pageWidth, 40, "F");

      if (institutionData?.name || institutionData?.companyName) {
        doc.setFontSize(isLandscape ? 18 : 20);
        doc.setFont("courier", "bold");
        doc.setTextColor(0, 0, 0);
        const companyName =
          institutionData.name || institutionData.companyName || "Company Name";
        const companyNameWidth = doc.getTextWidth(companyName);
        doc.text(companyName, (pageWidth - companyNameWidth) / 2, 20);
      }

      let currentY = 30;
      if (dateRange.from && dateRange.to && selectedReport !== "rooms") {
        doc.setFontSize(11);
        doc.setFont("courier", "bold");
        doc.setTextColor(0, 0, 0);
        const reportTitle = config.title;
        const titleWidth = doc.getTextWidth(reportTitle);

        doc.setFontSize(10);
        doc.setFont("courier", "normal");
        doc.setTextColor(80, 80, 80);
        const formatDMY = (d) => {
          if (!d) return "";
          const dt = d instanceof Date ? d : new Date(d);
          return isNaN(dt.getTime()) ? "" : `${String(dt.getDate()).padStart(2, "0")}/${String(dt.getMonth() + 1).padStart(2, "0")}/${dt.getFullYear()}`;
        };
        const dateRangeText = `${formatDMY(dateRange.from)} - ${formatDMY(dateRange.to)}`;
        const dateRangeWidth = doc.getTextWidth(dateRangeText);

        const totalWidth = titleWidth + 40 + dateRangeWidth;
        const startX = (pageWidth - totalWidth) / 2;

        doc.setFontSize(12);
        doc.setFont("courier", "bold");
        doc.setTextColor(0, 0, 0);
        doc.text(reportTitle, startX, currentY);

        doc.setFontSize(10);
        doc.setFont("courier", "bold");
        doc.setTextColor(0, 0, 0);
        doc.text(dateRangeText, startX + titleWidth + 40, currentY);

        currentY += 6;
      } else {
        doc.setFontSize(11);
        doc.setFont("courier", "bold");
        doc.setTextColor(0, 0, 0);
        const reportTitle = config.title;
        const titleWidth = doc.getTextWidth(reportTitle);
        doc.text(reportTitle, (pageWidth - titleWidth) / 2, currentY);
        currentY += 6;
      }

      const fixedTableWidth = isLandscape ? pageWidth - 20 : pageWidth * 0.92;
      const tableLeftMargin = (pageWidth - fixedTableWidth) / 2;

      doc.setTextColor(0, 0, 0);
      currentY += 8;
      doc.setLineWidth(0.5);
      doc.setDrawColor(0, 0, 0);
      doc.setLineDashPattern([2, 1], 0);
      doc.line(tableLeftMargin, currentY, pageWidth - tableLeftMargin, currentY);
      doc.setLineDashPattern([], 0);

      const tableStartY = currentY + 15;
      const tableData = formattedData.map((row) =>
        columns.map((col) => row[col.label] || "")
      );

      doc.setLineWidth(0.2);
      doc.setDrawColor(80, 80, 80);
      doc.rect(5, 5, pageWidth - 10, pageHeight - 10);

      autoTable(doc, {
        head: [columns.map((col) => col.label)],
        body: tableData,
        startY: tableStartY,
        margin: {
          left: tableLeftMargin,
          right: tableLeftMargin,
          top: 30,
          bottom: 30,
        },
        pageBreak: "auto",
        tableWidth: fixedTableWidth,
        showHead: "everyPage",
        styles: {
          fontSize:
            selectedReport === "laundry"
              ? 6.5
              : selectedReport === "rooms"
              ? 8
              : selectedReport === "companies"
              ? 8
              : 7,
          font: "helvetica",
          cellPadding: selectedReport === "laundry" ? { horizontal: 1.5, vertical: 2 } : { horizontal: 2, vertical: 3 },
          overflow: "linebreak",
          halign: "left",
          valign: "middle",
          lineWidth: 0.15,
          lineColor: [220, 220, 220],
          textColor: [0, 0, 0],
          fillColor: [255, 255, 255],
        },
        headStyles: {
          fillColor: [230, 230, 230],
          textColor: [0, 0, 0],
          fontSize:
            selectedReport === "laundry"
              ? 7.5
              : selectedReport === "rooms"
              ? 10
              : selectedReport === "companies"
              ? 9
              : 8,
          font: "helvetica",
          fontStyle: "bold",
          halign: "center",
          valign: "middle",
          cellPadding: selectedReport === "laundry" ? { horizontal: 1, vertical: 2 } : { horizontal: 1, vertical: 2 },
          lineWidth: 0.2,
          lineColor: [180, 180, 180],
        },
        alternateRowStyles: {
          fillColor: [250, 250, 250],
          textColor: [0, 0, 0],
          lineWidth: 0.1,
          lineColor: [220, 220, 220],
        },
        columnStyles: {
          ...Object.fromEntries(
            columns.map((col, index) => {
              let width = "auto";
              if (selectedReport === "laundry") {
                if (col.key === "token") width = "7%";
                else if (col.key === "date") width = "7%";
                else if (col.key === "guest") width = "13%";
                else if (col.key === "garments") width = "6%";
                else if (col.key === "care_types") width = "12%";
                else if (col.key === "speed") width = "7%";
                else if (col.key === "subtotal") width = "8%";
                else if (col.key === "surcharge") width = "7%";
                else if (col.key === "cgst") width = "6%";
                else if (col.key === "sgst") width = "6%";
                else if (col.key === "total_amount") width = "8%";
                else if (col.key === "settlement") width = "8%";
                else if (col.key === "status") width = "5%";
                else width = "auto";
              } else if (selectedReport === "rooms") {
                if (col.key.includes("room_number")) width = "15%";
                else if (col.key.includes("room_type")) width = "20%";
                else if (col.key.includes("status")) width = "25%";
                else if (col.key.includes("floor")) width = "10%";
                else if (col.key.includes("tariff")) width = "15%";
                else if (col.type === "currency") width = "15%";
                else if (col.type === "date") width = "15%";
                else width = "15%";
              } else if (selectedReport === "companies") {
                if (col.key.includes("name") || col.key.includes("Name"))
                  width = "25%";
                else if (col.key.includes("gst_no") || col.key.includes("GST"))
                  width = "20%";
                else if (col.type === "currency") width = "15%";
                else if (col.type === "number") width = "12%";
                else if (col.type === "date") width = "15%";
                else if (col.type === "boolean") width = "10%";
                else width = "15%";
              } else if (
                selectedReport === "revenue" ||
                selectedReport === "occupancy"
              ) {
                if (col.type === "date") width = "12%";
                else if (col.type === "currency") width = "12%";
                else width = "12%";
              } else if (selectedReport === "night") {
                if (col.type === "date") width = "12%";
                else if (col.type === "currency") width = "12%";
                else width = "10%";
              } else {
                if (col.type === "currency") width = "12%";
                else if (col.type === "date") width = "12%";
                else if (col.key.includes("name") || col.key.includes("Name"))
                  width = "20%";
                else if (col.key.includes("bill_id")) width = "15%";
                else if (
                  col.key.includes("booking_id") ||
                  col.key.includes("Booking ID")
                )
                  width = "18%";
                else if (col.key.includes("room") || col.key.includes("type"))
                  width = "10%";
                else if (col.key.includes("payment")) width = "12%";
                else width = "10%";
              }

              const isRight = col.type === "currency" || col.type === "number";
              const isCenter = col.key === "token" || col.key === "date" || col.key === "status" || col.key === "speed";

              return [
                index,
                {
                  cellWidth: width,
                  halign: isRight ? "right" : isCenter ? "center" : "left",
                  textColor: [0, 0, 0],
                  overflow: "linebreak",
                  cellPadding: selectedReport === "laundry" ? { horizontal: 1.5, vertical: 2 } : { horizontal: 2, vertical: 3 },
                },
              ];
            })
          ),
        },
        didDrawPage: function () {
          const currentPage = doc.internal.getCurrentPageInfo().pageNumber;
          const pageWidth = doc.internal.pageSize.getWidth();
          const pageHeight = doc.internal.pageSize.getHeight();

          if (currentPage > 1) {
            doc.setFillColor(240, 240, 240);
            doc.rect(0, 0, pageWidth, 30, "F");

            if (institutionData?.name || institutionData?.companyName) {
              doc.setFontSize(14);
              doc.setFont("courier", "bold");
              doc.setTextColor(0, 0, 0);
              const companyName =
                institutionData.name ||
                institutionData.companyName ||
                "Company Name";
              const companyNameWidth = doc.getTextWidth(companyName);
              doc.text(companyName, (pageWidth - companyNameWidth) / 2, 12);
            }

            doc.setFontSize(11);
            doc.setFont("courier", "bold");
            doc.setTextColor(0, 0, 0);
            const reportTitle = config.title;
            doc.text(reportTitle, 20, 22);

            doc.setLineWidth(0.5);
            doc.setDrawColor(0, 0, 0);
            doc.setLineDashPattern([2, 1], 0);
            doc.line(20, 28, pageWidth - 20, 28);
            doc.setLineDashPattern([], 0);
            doc.setTextColor(0, 0, 0);
          }

          const footerY = pageHeight - 25;
          doc.setFillColor(250, 250, 250);
          doc.rect(0, footerY, pageWidth, 25, "F");

          doc.setLineWidth(0.5);
          doc.setDrawColor(0, 0, 0);
          doc.setLineDashPattern([2, 1], 0);
          doc.line(0, footerY, pageWidth, footerY);
          doc.setLineDashPattern([], 0);

          doc.setFontSize(8);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(0, 0, 0);
          const pageText = `Page ${currentPage} of ${doc.internal.getNumberOfPages()}`;
          const pageTextWidth = doc.getTextWidth(pageText);
          doc.text(pageText, (pageWidth - pageTextWidth) / 2, footerY + 8);

          doc.setFontSize(6);
          doc.setFont("courier", "italic");
          doc.setTextColor(100, 100, 100);
          const poweredByText = "Powered by Tekkzy Intelligent Cloud PVT LTD";
          const poweredByWidth = doc.getTextWidth(poweredByText);
          doc.text(
            poweredByText,
            (pageWidth - poweredByWidth) / 2,
            footerY + 18
          );
        },
        didParseCell: function (data) {
          if (data.cell.text) {
            data.cell.minCellHeight = 8;
          }
        },
      });

      const finalY = doc.lastAutoTable.finalY || tableStartY + 200;
      const footerY = pageHeight - 25;
      const summaryY = Math.max(finalY + 10, footerY - 40);

      doc.setFillColor(250, 250, 250);
      doc.rect(10, summaryY, pageWidth - 20, 30, "F");

      doc.setLineWidth(0.2);
      doc.setDrawColor(200, 200, 200);
      doc.rect(10, summaryY, pageWidth - 20, 30);

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("Report Summary", 15, summaryY + 8);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      doc.text(`Total Records: ${reportData.length}`, 15, summaryY + 18);
      doc.text(
        `Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`,
        15,
        summaryY + 25
      );

      if (institutionData?.name || institutionData?.companyName) {
        doc.setFont("courier", "normal");
        const companyName =
          institutionData.name || institutionData.companyName || "Company Name";
        doc.text(
          `Generated by: ${companyName}`,
          pageWidth - 15 - doc.getTextWidth(`Generated by: ${companyName}`),
          summaryY + 18
        );
      }

      const fileName = `${config.title}_${
        new Date().toISOString().split("T")[0]
      }.pdf`;
      doc.save(fileName);

      toast.success("PDF file downloaded successfully");
    } catch (error) {
      console.error("Error exporting to PDF:", error);
      toast.error("Failed to export to PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleGuestFilterChange = (key, value) => {
    setGuestFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleCompanyFilterChange = (key, value) => {
    setCompanyFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleExpenseFilterChange = (key, value) => {
    setExpenseFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleRestaurantFilterChange = (key, value) => {
    setRestaurantFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleRestaurantDisplayOptionChange = (key, value) => {
    setRestaurantDisplayOptions((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({});
    setDateRange({ from: null, to: null });
    setGuestFilters({
      checkinDate: { from: null, to: null },
      checkoutDate: { from: null, to: null },
      roomNumber: "",
      roomType: "",
      hasGst: "",
      paymentMethod: "",
    });
    setCompanyFilters({
      selectedCompany: "",
      dateRange: { from: null, to: null },
      transactionType: "",
      hasGst: "",
    });
    setExpenseFilters({
      dateRange: { from: null, to: null },
      transactionType: "",
    });
    setRestaurantFilters({
      dateRange: { from: null, to: null },
      paymentStatus: "",
      paymentMethod: "",
      tableName: "",
    });
    setRestaurantDisplayOptions({
      showOrderSource: false,
      showPaidBy: false,
    });
    setStockFilters({
      department: "all",
      category: "all",
    });
  };

  // Compute displayed columns for table head and body consistently
  const getDisplayedColumns = () => {
    if (selectedReport === "exported" && exportedData) {
      return exportedData.columns || [];
    }

    if (!selectedReport) return [];

    let columns = reportConfigs[selectedReport].columns || [];

    // For guest report, conditionally include GST column based on filter
    if (selectedReport === "guests") {
      const hasGstFilter = guestFilters.hasGst && guestFilters.hasGst !== "";
      if (!hasGstFilter) {
        // Remove GST column if no GST filter is applied
        columns = columns.filter((col) => col.key !== "gst_number");
      }
    }

    // For restaurant report, conditionally include orderSource and paidBy columns
    if (selectedReport === "restaurant") {
      if (restaurantDisplayOptions.showPaidBy) {
        columns.push({ key: "paidBy", label: "Paid By", type: "text" });
      }
    }

    return columns;
  };

  const displayedColumns = getDisplayedColumns();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-8xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Report Generator
          </h1>
          <p className="text-gray-600">
            Generate and export reports from different data sources
          </p>
        </div>

        <div
          className={`grid grid-cols-1 gap-6 transition-all duration-300 ${
            isSidebarCollapsed ? "lg:grid-cols-1" : "lg:grid-cols-3"
          }`}
        >
          {/* Report Selection */}
          <div
            className={`lg:col-span-1 transition-all duration-300 ${
              isSidebarCollapsed ? "hidden" : "block"
            }`}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Report Configuration
                  </CardTitle>
                  <Button
                    onClick={() => setIsSidebarCollapsed(true)}
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-1 text-gray-500 hover:text-gray-700"
                    title="Hide Configuration Panel"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:inline text-xs">Hide</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="report-type">Select Report Type</Label>
                  <Select
                    value={selectedReport}
                    onValueChange={setSelectedReport}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a report type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(reportConfigs)
                        .filter(([key]) => {
                          if (userData?.userType === "store") {
                            return ["stock_inventory", "stock_issues", "stock_purchases"].includes(key);
                          }
                          if (userData?.userType === "laundry") {
                            return key === "laundry";
                          }
                          return true;
                        })
                        .map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              <config.icon className="h-4 w-4" />
                              {config.title}
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedReport && selectedReport !== "rooms" && (
                  <>
                    <div>
                      <Label>Date Range (Optional)</Label>
                      <DatePickerWithRange
                        date={dateRange}
                        onDateChange={setDateRange}
                      />
                    </div>

                    <div>
                      <Label>Search Filter</Label>
                      <Input
                        placeholder="Search in data..."
                        value={filters.search || ""}
                        onChange={(e) =>
                          handleFilterChange("search", e.target.value)
                        }
                      />
                    </div>

                    {/* Guest Report Specific Filters */}
                    {selectedReport === "guests" && (
                      <>
                        <div className="border-t pt-4">
                          <h4 className="font-medium text-sm text-gray-700 mb-3">
                            Guest Report Filters
                          </h4>

                          <div className="space-y-3">
                            <div>
                              <Label>Check-in Date Range</Label>
                              <DatePickerWithRange
                                date={guestFilters.checkinDate}
                                onDateChange={(date) =>
                                  handleGuestFilterChange("checkinDate", date)
                                }
                              />
                            </div>

                            <div>
                              <Label>Check-out Date Range</Label>
                              <DatePickerWithRange
                                date={guestFilters.checkoutDate}
                                onDateChange={(date) =>
                                  handleGuestFilterChange("checkoutDate", date)
                                }
                              />
                            </div>

                            <div>
                              <Label>Room Number</Label>
                              <Input
                                placeholder="Filter by room number..."
                                value={guestFilters.roomNumber}
                                onChange={(e) =>
                                  handleGuestFilterChange(
                                    "roomNumber",
                                    e.target.value
                                  )
                                }
                              />
                            </div>

                            <div>
                              <Label>Room Type</Label>
                              <Input
                                placeholder="Filter by room type..."
                                value={guestFilters.roomType}
                                onChange={(e) =>
                                  handleGuestFilterChange(
                                    "roomType",
                                    e.target.value
                                  )
                                }
                              />
                            </div>

                            <div>
                              <Label>GST Number</Label>
                              <Select
                                value={guestFilters.hasGst || "all"}
                                onValueChange={(value) =>
                                  handleGuestFilterChange(
                                    "hasGst",
                                    value === "all" ? "" : value
                                  )
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Filter by GST status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">All</SelectItem>
                                  <SelectItem value="Yes">Has GST</SelectItem>
                                  <SelectItem value="No">No GST</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label>Payment Method</Label>
                              <Input
                                placeholder="Filter by payment method..."
                                value={guestFilters.paymentMethod}
                                onChange={(e) =>
                                  handleGuestFilterChange(
                                    "paymentMethod",
                                    e.target.value
                                  )
                                }
                              />
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Company Report Specific Filters */}
                    {selectedReport === "companies" && (
                      <>
                        <div className="border-t pt-4">
                          <h4 className="font-medium text-sm text-gray-700 mb-3">
                            Company Transaction Filters
                          </h4>

                          <div className="space-y-3">
                            <div>
                              <Label>Select Company</Label>
                              <Select
                                value={companyFilters.selectedCompany || "all"}
                                onValueChange={(value) =>
                                  handleCompanyFilterChange(
                                    "selectedCompany",
                                    value === "all" ? "" : value
                                  )
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="All companies or select specific" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">
                                    All Companies
                                  </SelectItem>
                                  {getUniqueCompanyNames().map(
                                    (companyName) => (
                                      <SelectItem
                                        key={companyName}
                                        value={companyName}
                                      >
                                        {companyName}
                                      </SelectItem>
                                    )
                                  )}
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label>Transaction Date Range</Label>
                              <DatePickerWithRange
                                date={companyFilters.dateRange}
                                onDateChange={(date) =>
                                  handleCompanyFilterChange("dateRange", date)
                                }
                              />
                            </div>

                            <div>
                              <Label>Transaction Type</Label>
                              <Select
                                value={companyFilters.transactionType || "all"}
                                onValueChange={(value) =>
                                  handleCompanyFilterChange(
                                    "transactionType",
                                    value === "all" ? "" : value
                                  )
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Filter by transaction type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">
                                    All Transactions
                                  </SelectItem>
                                  <SelectItem value="deposit">
                                    Deposits Only
                                  </SelectItem>
                                  <SelectItem value="credit">
                                    Credits Only
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label>GST Number Status</Label>
                              <Select
                                value={companyFilters.hasGst || "all"}
                                onValueChange={(value) =>
                                  handleCompanyFilterChange(
                                    "hasGst",
                                    value === "all" ? "" : value
                                  )
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Filter by GST number presence" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">All</SelectItem>
                                  <SelectItem value="Yes">
                                    With GST Number
                                  </SelectItem>
                                  <SelectItem value="No">
                                    Without GST Number
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Expense Report Specific Filters */}
                    {selectedReport === "expenses" && (
                      <>
                        <div className="border-t pt-4">
                          <div className="space-y-3">
                            <div>
                              <Label className="mb-2">Transaction Type</Label>
                              <Select
                                value={expenseFilters.transactionType || "all"}
                                onValueChange={(value) =>
                                  handleExpenseFilterChange(
                                    "transactionType",
                                    value === "all" ? "" : value
                                  )
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Filter by transaction type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">
                                    All Transactions
                                  </SelectItem>
                                  <SelectItem value="expense">
                                    Expenses Only
                                  </SelectItem>
                                  <SelectItem value="received">
                                    Received Only
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Restaurant Report Specific Filters */}
                    {selectedReport === "restaurant" && (
                      <>
                        <div className="border-t pt-4">
                          <h4 className="font-medium text-sm text-gray-700 mb-3">
                            Restaurant Order Filters
                          </h4>

                          <div className="space-y-3">
                            <div>
                              <Label>Payment Status</Label>
                              <Select
                                value={restaurantFilters.paymentStatus || "all"}
                                onValueChange={(value) =>
                                  handleRestaurantFilterChange(
                                    "paymentStatus",
                                    value === "all" ? "" : value
                                  )
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Filter by payment status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">
                                    All Status
                                  </SelectItem>
                                  <SelectItem value="Paid">Paid</SelectItem>
                                  <SelectItem value="Pending">
                                    Pending
                                  </SelectItem>
                                  <SelectItem value="Cancelled">
                                    Cancelled
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label>Payment Method</Label>
                              <Select
                                value={restaurantFilters.paymentMethod || "all"}
                                onValueChange={(value) =>
                                  handleRestaurantFilterChange(
                                    "paymentMethod",
                                    value === "all" ? "" : value
                                  )
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Filter by payment method" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">
                                    All Methods
                                  </SelectItem>
                                  <SelectItem value="ROOM">
                                    Room Charge
                                  </SelectItem>
                                  <SelectItem value="CASH">Cash</SelectItem>
                                  <SelectItem value="CARD">Card</SelectItem>
                                  <SelectItem value="BTC">BTC</SelectItem>
                                  <SelectItem value="QR">QR</SelectItem>
                                  <SelectItem value="UPI">UPI</SelectItem>
                                  <SelectItem value="Free">Free</SelectItem>
                                  <SelectItem value="Complementary">
                                    Complementary
                                  </SelectItem>
                                  <SelectItem value="Multiple">
                                    Multiple
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label>Table/Room Name</Label>
                              <Input
                                placeholder="Filter by table or room name..."
                                value={restaurantFilters.tableName}
                                onChange={(e) =>
                                  handleRestaurantFilterChange(
                                    "tableName",
                                    e.target.value
                                  )
                                }
                              />
                            </div>

                            <div className="border-t pt-4">
                              <h4 className="font-medium text-sm text-gray-700 mb-3">
                                Display Options
                              </h4>
                              <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    id="showPaidBy"
                                    checked={
                                      restaurantDisplayOptions.showPaidBy
                                    }
                                    onChange={(e) =>
                                      handleRestaurantDisplayOptionChange(
                                        "showPaidBy",
                                        e.target.checked
                                      )
                                    }
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <Label
                                    htmlFor="showPaidBy"
                                    className="text-sm font-normal"
                                  >
                                    Show Paid By
                                  </Label>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Store Issues Report Filters */}
                    {selectedReport === "stock_issues" && (
                      <div className="border-t pt-4">
                        <h4 className="font-medium text-sm text-gray-700 mb-3">
                          Department Filter
                        </h4>
                        <div className="space-y-3">
                          <div>
                            <Label>Filter by Department</Label>
                            <Select
                              value={stockFilters.department || "all"}
                              onValueChange={(val) =>
                                setStockFilters((prev) => ({ ...prev, department: val }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="All Departments" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Departments</SelectItem>
                                <SelectItem value="KITCHEN">Kitchen</SelectItem>
                                <SelectItem value="HOUSEKEEPING">Housekeeping</SelectItem>
                                <SelectItem value="LAUNDRY">Laundry</SelectItem>
                                <SelectItem value="FRONT DESK">Front Desk</SelectItem>
                                <SelectItem value="RESTAURANT">Restaurant</SelectItem>
                                <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Store Inventory Report Filters */}
                    {selectedReport === "stock_inventory" && (
                      <div className="border-t pt-4">
                        <h4 className="font-medium text-sm text-gray-700 mb-3">
                          Category Filter
                        </h4>
                        <div className="space-y-3">
                          <div>
                            <Label>Filter by Category</Label>
                            <Select
                              value={stockFilters.category || "all"}
                              onValueChange={(val) =>
                                setStockFilters((prev) => ({ ...prev, category: val }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="All Categories" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                <SelectItem value="Linen">Linen</SelectItem>
                                <SelectItem value="Chemicals">Chemicals</SelectItem>
                                <SelectItem value="Consumables">Consumables</SelectItem>
                                <SelectItem value="Amenities">Amenities</SelectItem>
                                <SelectItem value="Kitchen">Kitchen</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        onClick={clearFilters}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        Clear Filters
                      </Button>
                      <Button
                        onClick={() => window.location.reload()}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Report Preview and Export */}
          <div
            className={`transition-all duration-300 ${
              isSidebarCollapsed ? "lg:col-span-1" : "lg:col-span-2"
            }`}
          >
            {selectedReport ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {React.createElement(
                        selectedReport === "exported" && exportedData
                          ? Download
                          : reportConfigs[selectedReport].icon,
                        { className: "h-5 w-5" }
                      )}
                      <CardTitle>
                        {selectedReport === "exported" && exportedData
                          ? exportedData.title
                          : reportConfigs[selectedReport].title}
                      </CardTitle>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={exportToExcel}
                        disabled={isGenerating || reportData.length === 0}
                        className="flex items-center gap-2"
                      >
                        <TableIcon className="h-4 w-4" />
                        Excel
                      </Button>
                      <Button
                        onClick={exportToPDF}
                        disabled={isGenerating || reportData.length === 0}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <FileText className="h-4 w-4" />
                        PDF
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    {selectedReport === "exported" && exportedData
                      ? exportedData.description
                      : reportConfigs[selectedReport].description}
                  </p>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                      <span>Loading data...</span>
                    </div>
                  ) : reportData.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium">No data found</p>
                      <p className="text-sm">
                        {filters.search || dateRange.from
                          ? "Try adjusting your filters"
                          : "No data available for this report"}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600">
                          Showing {startIndex + 1}-
                          {Math.min(endIndex, reportData.length)} of{" "}
                          {reportData.length} records
                        </p>
                        {isGenerating && (
                          <div className="flex items-center gap-2 text-sm text-blue-600">
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            Generating report...
                          </div>
                        )}
                      </div>

                      {/* Data Preview Table */}
                      <div className="w-full overflow-x-auto border border-gray-200 rounded-md">
                        <table className="w-full divide-y divide-gray-200 min-w-[950px]">
                          <thead className="bg-gray-50">
                            <tr>
                              {displayedColumns.map((column) => (
                                <th
                                  key={column.key}
                                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider truncate"
                                >
                                  {column.label}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {paginatedData.map((item, index) => (
                              <tr key={index} className="hover:bg-gray-50">
                                {displayedColumns.map((column) => {
                                  let value = item[column.key];

                                  // Special handling for company transactions
                                  if (selectedReport === "companies") {
                                    if (
                                      item.kind === "deposit" &&
                                      (column.key === "guest" ||
                                        column.key === "reference")
                                    ) {
                                      return (
                                        <td
                                          key={column.key}
                                          className="px-3 py-4 text-sm text-gray-400 truncate"
                                        >
                                          —
                                        </td>
                                      );
                                    }

                                    if (column.key === "balance") {
                                      const balanceValue =
                                        parseFloat(value) || 0;
                                      return (
                                        <td
                                          key={column.key}
                                          className={`px-3 py-4 text-sm font-semibold truncate ${
                                            balanceValue >= 0
                                              ? "text-emerald-600"
                                              : "text-red-600"
                                          }`}
                                        >
                                          {formatCurrencyValue(balanceValue)}
                                          {balanceValue < 0 ? " Due" : ""}
                                        </td>
                                      );
                                    }

                                    if (column.key === "gst_number") {
                                      const hasValidGst =
                                        value &&
                                        value !== "N/A" &&
                                        value !== "---" &&
                                        value !== "";
                                      return (
                                        <td
                                          key={column.key}
                                          className="px-3 py-4 text-sm truncate"
                                        >
                                          {hasValidGst ? (
                                            <span className="inline-flex px-2 py-1 text-xs font-mono bg-blue-50 text-blue-800 border border-blue-200 rounded">
                                              {value}
                                            </span>
                                          ) : (
                                            <span className="text-gray-400 text-xs">
                                              No GST
                                            </span>
                                          )}
                                        </td>
                                      );
                                    }

                                    if (column.key === "company_name") {
                                      return (
                                        <td
                                          key={column.key}
                                          className="px-3 py-4 text-sm font-medium text-gray-900 truncate"
                                        >
                                          {value}
                                        </td>
                                      );
                                    }

                                    if (column.key === "kind") {
                                      return (
                                        <td
                                          key={column.key}
                                          className="px-3 py-4 text-sm truncate"
                                        >
                                          <span
                                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                              value === "deposit"
                                                ? "bg-green-100 text-green-800"
                                                : "bg-orange-100 text-orange-800"
                                            }`}
                                          >
                                            {value === "deposit"
                                              ? "Deposit"
                                              : "Credit"}
                                          </span>
                                        </td>
                                      );
                                    }

                                    if (column.key === "reference" && value) {
                                      return (
                                        <td
                                          key={column.key}
                                          className="px-3 py-4 text-sm truncate"
                                        >
                                          <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                                            {value}
                                          </span>
                                        </td>
                                      );
                                    }
                                  }

                                  // Special handling for GST number in guest report
                                  if (
                                    selectedReport === "guests" &&
                                    column.key === "gst_number"
                                  ) {
                                    const hasValidGst =
                                      value &&
                                      value !== "N/A" &&
                                      value !== "---" &&
                                      value !== "";
                                    return (
                                      <td
                                        key={column.key}
                                        className="px-3 py-4 text-sm truncate"
                                      >
                                        {hasValidGst ? (
                                          <span className="inline-flex px-2 py-1 text-xs font-mono bg-blue-50 text-blue-800 border border-blue-200 rounded">
                                            {value}
                                          </span>
                                        ) : (
                                          <span className="text-gray-400 text-xs">
                                            No GST
                                          </span>
                                        )}
                                      </td>
                                    );
                                  }

                                  // Special handling for expense report
                                  if (selectedReport === "expenses") {
                                    if (column.key === "transaction_type") {
                                      return (
                                        <td
                                          key={column.key}
                                          className="px-3 py-4 text-sm truncate"
                                        >
                                          <span
                                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                              value === "Expense"
                                                ? "bg-red-100 text-red-800"
                                                : "bg-green-100 text-green-800"
                                            }`}
                                          >
                                            {value}
                                          </span>
                                        </td>
                                      );
                                    }

                                    if (column.key === "balance_impact") {
                                      const impactValue =
                                        parseFloat(value) || 0;
                                      return (
                                        <td
                                          key={column.key}
                                          className={`px-3 py-4 text-sm font-semibold truncate ${
                                            impactValue >= 0
                                              ? "text-green-600"
                                              : "text-red-600"
                                          }`}
                                        >
                                          {impactValue >= 0 ? "+" : ""}
                                          {formatCurrencyValue(
                                            Math.abs(impactValue)
                                          )}
                                        </td>
                                      );
                                    }
                                  }

                                  // Special handling for restaurant report
                                  if (selectedReport === "restaurant") {
                                    if (column.key === "paymentStatus") {
                                      return (
                                        <td
                                          key={column.key}
                                          className="px-3 py-4 text-sm truncate"
                                        >
                                          <span
                                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                              value === "Paid"
                                                ? "bg-green-100 text-green-800"
                                                : value === "Cancelled"
                                                ? "bg-red-100 text-red-800"
                                                : "bg-yellow-100 text-yellow-800"
                                            }`}
                                          >
                                            {value || "N/A"}
                                          </span>
                                        </td>
                                      );
                                    }

                                    if (column.key === "orderTime") {
                                      return (
                                        <td
                                          key={column.key}
                                          className="px-3 py-4 text-sm truncate"
                                        >
                                          <span className="text-gray-600 font-mono">
                                            {value || "N/A"}
                                          </span>
                                        </td>
                                      );
                                    }

                                    if (column.key === "paymentMethod") {
                                      return (
                                        <td
                                          key={column.key}
                                          className="px-3 py-4 text-sm truncate"
                                        >
                                          <span
                                            className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                                              value === "ROOM"
                                                ? "bg-blue-100 text-blue-800"
                                                : value === "CASH"
                                                ? "bg-green-100 text-green-800"
                                                : value === "CARD"
                                                ? "bg-purple-100 text-purple-800"
                                                : value === "BTC"
                                                ? "bg-orange-100 text-orange-800"
                                                : value === "QR"
                                                ? "bg-indigo-100 text-indigo-800"
                                                : value === "UPI"
                                                ? "bg-pink-100 text-pink-800"
                                                : value === "Free"
                                                ? "bg-yellow-100 text-yellow-800"
                                                : value === "Complementary"
                                                ? "bg-cyan-100 text-cyan-800"
                                                : value === "Multiple"
                                                ? "bg-violet-100 text-violet-800"
                                                : "bg-gray-100 text-gray-800"
                                            }`}
                                          >
                                            {value || "N/A"}
                                          </span>
                                        </td>
                                      );
                                    }

                                    if (column.key === "orderSource") {
                                      return (
                                        <td
                                          key={column.key}
                                          className="px-3 py-4 text-sm truncate"
                                        >
                                          <span className="text-gray-700 font-medium">
                                            {value || "N/A"}
                                          </span>
                                        </td>
                                      );
                                    }

                                    if (column.key === "paidBy") {
                                      return (
                                        <td
                                          key={column.key}
                                          className="px-3 py-4 text-sm truncate"
                                        >
                                          <span className="text-gray-700 font-medium">
                                            {value || "N/A"}
                                          </span>
                                        </td>
                                      );
                                    }
                                  }

                                  // Special handling for store stock reports
                                  if (selectedReport === "stock_inventory") {
                                    if (column.key === "status") {
                                      const isCritical = value === "OUT OF STOCK";
                                      const isLow = value === "LOW STOCK";
                                      return (
                                        <td key={column.key} className="px-3 py-4 text-sm truncate">
                                          <span
                                            className={`inline-flex px-2 py-0.5 text-xs font-bold rounded ${
                                              isCritical
                                                ? "bg-red-100 text-red-800"
                                                : isLow
                                                ? "bg-amber-100 text-amber-800"
                                                : "bg-emerald-100 text-emerald-800"
                                            }`}
                                          >
                                            {value}
                                          </span>
                                        </td>
                                      );
                                    }
                                  }

                                  if (selectedReport === "stock_issues") {
                                    if (column.key === "department") {
                                      return (
                                        <td key={column.key} className="px-3 py-4 text-sm truncate">
                                          <span className="inline-flex px-2 py-0.5 text-xs font-bold rounded bg-blue-50 text-blue-800 border border-blue-200">
                                            {value}
                                          </span>
                                        </td>
                                      );
                                    }
                                    if (column.key === "type") {
                                      return (
                                        <td key={column.key} className="px-3 py-4 text-sm truncate">
                                          <span
                                            className={`inline-flex px-2 py-0.5 text-xs font-bold rounded ${
                                              value === "Return"
                                                ? "bg-emerald-100 text-emerald-800"
                                                : "bg-blue-100 text-blue-800"
                                            }`}
                                          >
                                            {value}
                                          </span>
                                        </td>
                                      );
                                    }
                                  }

                                  if (selectedReport === "stock_purchases") {
                                    if (column.key === "grnNo") {
                                      return (
                                        <td key={column.key} className="px-3 py-4 text-sm truncate">
                                          <span className="inline-flex px-2 py-0.5 text-xs font-mono font-bold rounded bg-blue-50 text-blue-800 border border-blue-200">
                                            {value}
                                          </span>
                                        </td>
                                      );
                                    }
                                  }

                                  // Regular formatting
                                  switch (column.type) {
                                    case "date": {
                                      const d = toDateObj(value);
                                      if (d) {
                                        const day = String(
                                          d.getDate()
                                        ).padStart(2, "0");
                                        const month = String(
                                          d.getMonth() + 1
                                        ).padStart(2, "0");
                                        const year = d.getFullYear();
                                        value = `${day}/${month}/${year}`;
                                      } else {
                                        value = "—";
                                      }
                                      break;
                                    }
                                    case "currency":
                                      if (
                                        column.key === "credit" ||
                                        column.key === "deposit"
                                      ) {
                                        value =
                                          value && value > 0
                                            ? formatCurrencyValue(value)
                                            : "—";
                                      } else {
                                        value = formatCurrencyValue(value);
                                      }
                                      break;
                                    case "boolean":
                                      value = value === true ? "Yes" : "No";
                                      break;

                                    case "array":
                                      if (Array.isArray(value)) {
                                        value =
                                          value.length > 0
                                            ? value.join(", ")
                                            : "—";
                                      }
                                      break;
                                    default:
                                      value = value ?? "—";
                                  }

                                  return (
                                    <td
                                      key={column.key}
                                      className="px-3 py-4 text-sm text-gray-900 truncate"
                                    >
                                      {value}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination Controls */}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-200">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setCurrentPage((prev) => Math.max(1, prev - 1))
                              }
                              disabled={currentPage === 1}
                            >
                              Previous
                            </Button>
                            <span className="text-sm text-gray-600">
                              Page {currentPage} of {totalPages}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setCurrentPage((prev) =>
                                  Math.min(totalPages, prev + 1)
                                )
                              }
                              disabled={currentPage === totalPages}
                            >
                              Next
                            </Button>
                          </div>
                          <div className="text-sm text-gray-500">
                            {reportData.length} total records
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <BarChart3 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Select a Report Type
                  </h3>
                  <p className="text-gray-600">
                    Choose a report type from the sidebar to view and export
                    data
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Floating Toggle Button when sidebar is collapsed */}
        {isSidebarCollapsed && (
          <div className="fixed top-1/2 left-4 transform -translate-y-1/2 z-50">
            <Button
              onClick={() => setIsSidebarCollapsed(false)}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 shadow-lg bg-white hover:bg-gray-50"
              title="Show Configuration Panel"
            >
              <ChevronRight className="h-4 w-4" />
              <span className="hidden sm:inline">Config</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportGenerator;
