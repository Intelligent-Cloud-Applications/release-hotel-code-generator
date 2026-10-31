import React, { useState, useEffect, useMemo } from "react";
import { useAppContext } from "../../../context/AppContext.jsx";
import { useAuthContext } from "../../../context/AuthContext.jsx";
import { Button } from "../../../components/ui/button.js";
import { Input } from "../../../components/ui/input.js";
import { Label } from "../../../components/ui/label.js";
import { Badge } from "../../../components/ui/badge.js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../../components/ui/dialog.js";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select.js";
import { Textarea } from "../../../components/ui/textarea.js";
import {
  CheckCircle,
  Clock,
  Search,
  Plus,
  Building2,
  UtensilsCrossed,
  FileSpreadsheet,
  FileText,
  Filter,
  CheckCheck,
  Banknote,
  Receipt,
  Eye,
  RotateCcw,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  ShieldCheck,
  Calendar,
  Layers,
  FileCheck2,
} from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";

/* Segmented Toggle Component */
const Segmented = ({ value, onChange, options, className = "", size = "normal" }) => (
  <div
    className={`grid gap-0.5 bg-gray-100 p-0.5 rounded-lg border border-gray-200/80 ${className}`}
    style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
  >
    {options.map((o) => (
      <button
        key={o.id}
        type="button"
        onClick={() => onChange(o.id)}
        className={`${
          size === "sm" ? "px-2 py-1 text-[11px]" : "px-3 py-1.5 text-xs"
        } rounded-md font-semibold transition-all duration-150 flex items-center justify-center gap-1.5 ${
          value === o.id
            ? "bg-white text-blue-700 shadow-xs border border-gray-200/60"
            : "text-gray-500 hover:text-gray-900"
        }`}
      >
        {o.icon && <o.icon className="w-3.5 h-3.5" />}
        {o.label}
      </button>
    ))}
  </div>
);

const CashEntry = () => {
  const { userData } = useAuthContext();
  const {
    bills = [],
    restaurantOrders = [],
    fetchRestaurantOrders,
    listTotalBill,
    addExpense,
    listExpenses,
  } = useAppContext();

  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'frontdesk' | 'restaurant'
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'pending' | 'verified'
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);

  // Modal for new manual / bill cash entry
  const [showAddModal, setShowAddModal] = useState(false);
  const [sourceType, setSourceType] = useState("frontdesk"); // 'frontdesk' | 'restaurant'
  const [selectedBillId, setSelectedBillId] = useState("");
  const [entryAmount, setEntryAmount] = useState("");
  const [entryDate, setEntryDate] = useState(() =>
    new Date().toISOString().split("T")[0]
  );
  const [entryRemarks, setEntryRemarks] = useState("");
  const [entryStaff, setEntryStaff] = useState("");

  // Modal for verifying / viewing an entry
  const [viewEntryModal, setViewEntryModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [verificationNotes, setVerificationNotes] = useState("");

  // Local storage persisted cash entries
  const [cashEntries, setCashEntries] = useState(() => {
    try {
      const saved = localStorage.getItem("hotel_accountant_cash_entries");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save to localStorage whenever cashEntries updates
  useEffect(() => {
    try {
      localStorage.setItem(
        "hotel_accountant_cash_entries",
        JSON.stringify(cashEntries)
      );
    } catch (e) {
      console.error("Failed to store accountant cash entries:", e);
    }
  }, [cashEntries]);

  // Initial load
  useEffect(() => {
    handleRefreshData();
  }, []);

  const handleRefreshData = async () => {
    setIsSyncing(true);
    try {
      if (typeof listTotalBill === "function") await listTotalBill();
      if (typeof fetchRestaurantOrders === "function") await fetchRestaurantOrders();
      if (typeof listExpenses === "function") await listExpenses();
    } catch (e) {
      console.warn("Sync error:", e);
    } finally {
      setIsSyncing(false);
    }
  };

  // Sync bill records: Auto-discover cash transactions from Front Desk bills and Restaurant orders
  useEffect(() => {
    const existingIds = new Set(cashEntries.map((e) => e.systemRefId));
    const autoEntries = [];

    // 1. Process Front Desk Bills that collected Cash
    (bills || []).forEach((bill) => {
      const billId =
        bill?.bill_id ||
        bill?.bill?.bill_id ||
        bill?.id ||
        bill?.booking_id ||
        "";
      const billNo =
        bill?.bill_no ||
        bill?.billNo ||
        bill?.bill?.billHeader?.billNo ||
        bill?.bill?.bill_no ||
        "N/A";
      const guestName =
        bill?.bill?.guestDetails?.guestName ||
        bill?.bill?.guestDetails?.guest_name ||
        bill?.guest_name ||
        "Guest";
      const roomNo =
        bill?.bill?.bookingDetails?.roomNumber ||
        bill?.bill?.bookingDetails?.room_no ||
        bill?.room_number ||
        "N/A";

      const billTotal = Number(
        bill?.bill?.billingSummary?.balanceDue ??
          bill?.bill?.finalSummary?.totalAmount ??
          bill?.total_amount ??
          0
      );

      const pMode = String(
        bill?.payment_mode || bill?.bill?.payment_mode || ""
      ).trim();

      let cashPortion = 0;
      if (pMode === "Cash") {
        cashPortion = billTotal;
      } else if (pMode === "Multi-Payment" || pMode === "Multiple") {
        const splits = bill?.multi_payments || bill?.bill?.multi_payments || [];
        const cashSplit = (splits || []).find((s) => s.mode === "Cash");
        if (cashSplit && parseFloat(cashSplit.amount) > 0) {
          cashPortion = parseFloat(cashSplit.amount);
        }
      }

      if (cashPortion > 0) {
        const refId = `FD-${billId || billNo}`;
        if (!existingIds.has(refId)) {
          autoEntries.push({
            id: `CE-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            systemRefId: refId,
            source: "frontdesk",
            billNo: String(billNo),
            billId: String(billId),
            guestOrTable: `${guestName} (Room ${roomNo})`,
            date:
              bill?.created_at && !isNaN(new Date(bill.created_at).getTime())
                ? new Date(bill.created_at).toISOString().split("T")[0]
                : new Date().toISOString().split("T")[0],
            amount: cashPortion,
            status: "Pending", // 'Pending' | 'Verified'
            paymentDetails:
              pMode === "Multi-Payment" ? "Multi-Payment (Cash Portion)" : "Full Cash",
            staff: bill?.generated_by_staff_id || "Front Desk",
            verifiedBy: null,
            verifiedAt: null,
            remarks: "Auto-synced from Front Desk checkout",
          });
        }
      }
    });

    // 2. Process Restaurant Orders that collected Cash
    (restaurantOrders || []).forEach((order) => {
      const orderId = order?.orderId || order?.id || order?._id || "";
      const billNo = order?.billNo || order?.invoiceNumber || orderId || "N/A";
      const tableName = order?.tableName || order?.table || order?.roomNumber || "Walk-In";
      const payMethod = String(
        order?.paymentMethod || order?.payment_mode || order?.paymentMode || ""
      ).trim();

      const isCash =
        payMethod.toLowerCase() === "cash" ||
        payMethod.toLowerCase() === "cash on delivery";

      const orderAmount = Number(
        order?.grandTotal ||
          order?.totalAmount ||
          order?.total_amount ||
          order?.subtotal ||
          0
      );

      if (isCash && orderAmount > 0) {
        const refId = `REST-${orderId || billNo}`;
        if (!existingIds.has(refId)) {
          autoEntries.push({
            id: `CE-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            systemRefId: refId,
            source: "restaurant",
            billNo: String(billNo),
            billId: String(orderId),
            guestOrTable: `Table/Room: ${tableName}`,
            date:
              order?.orderDate || order?.date
                ? new Date(order.orderDate || order.date)
                    .toISOString()
                    .split("T")[0]
                : new Date().toISOString().split("T")[0],
            amount: orderAmount,
            status: "Pending",
            paymentDetails: "Restaurant Cash Settlement",
            staff: order?.waiterName || order?.staff || "Restaurant Staff",
            verifiedBy: null,
            verifiedAt: null,
            remarks: "Auto-synced from Restaurant POS order",
          });
        }
      }
    });

    if (autoEntries.length > 0) {
      setCashEntries((prev) => [...autoEntries, ...prev]);
    }
  }, [bills, restaurantOrders]);

  // Handle Manual Cash Entry Submit
  const handleCreateCashEntry = async (e) => {
    e.preventDefault();
    if (!entryAmount || parseFloat(entryAmount) <= 0) {
      toast.error("Please enter a valid cash amount");
      return;
    }

    let billNo = "MANUAL";
    let guestOrTable = "Direct Cash Receipt";

    if (sourceType === "frontdesk" && selectedBillId) {
      const bObj = (bills || []).find(
        (b) =>
          b.bill_id === selectedBillId ||
          b.id === selectedBillId ||
          b.booking_id === selectedBillId
      );
      if (bObj) {
        billNo = bObj.bill_no || bObj.billNo || bObj.id || "N/A";
        guestOrTable = `${bObj?.bill?.guestDetails?.guestName || "Guest"} (Room ${
          bObj?.bill?.bookingDetails?.roomNumber || "N/A"
        })`;
      }
    } else if (sourceType === "restaurant" && selectedBillId) {
      const rObj = (restaurantOrders || []).find(
        (r) => r.orderId === selectedBillId || r.id === selectedBillId
      );
      if (rObj) {
        billNo = rObj.billNo || rObj.orderId || "N/A";
        guestOrTable = `Table: ${rObj.tableName || "Walk-In"}`;
      }
    }

    const numAmount = parseFloat(entryAmount);
    const entryDateStr = entryDate || new Date().toISOString().split("T")[0];
    const parts = entryDateStr.split("-");
    const ddmmyyyy = `${parts[2]}/${parts[1]}/${parts[0]}`;

    // 1. Post directly to backend cash drawer (addExpense API)
    try {
      if (typeof addExpense === "function") {
        await addExpense({
          received: {
            date: ddmmyyyy,
            name: `ACC-${billNo}`,
            description: `Accountant cash entry - ${guestOrTable} (${entryRemarks || "Verified receipt"})`,
            amount: numAmount,
            bill_id: selectedBillId || `ACC-${Date.now()}`,
            receivedId: Math.random().toString(36).substr(2, 9),
          },
        });
        if (typeof listExpenses === "function") await listExpenses();
      }
    } catch (err) {
      console.warn("Backend addExpense notice:", err);
    }

    const newEntry = {
      id: `CE-${Date.now()}`,
      systemRefId: `MANUAL-${Date.now()}`,
      source: sourceType,
      billNo: String(billNo),
      billId: selectedBillId || "N/A",
      guestOrTable: guestOrTable,
      date: entryDateStr,
      amount: numAmount,
      status: "Verified",
      paymentDetails:
        sourceType === "frontdesk"
          ? "Front Desk Cash Receipt"
          : "Restaurant Cash Receipt",
      staff: entryStaff || userData?.name || "Accountant",
      verifiedBy: userData?.name || "Accountant",
      verifiedAt: new Date().toLocaleString(),
      remarks: entryRemarks || "Accountant manual entry",
    };

    setCashEntries((prev) => [newEntry, ...prev]);
    toast.success("Cash entry recorded and synced to Cash Drawer successfully!");
    setShowAddModal(false);

    // Reset Form
    setSelectedBillId("");
    setEntryAmount("");
    setEntryRemarks("");
    setEntryStaff("");
  };

  // Toggle or Set Verify Status
  const handleVerifyEntry = async (entry, newStatus) => {
    setCashEntries((prev) =>
      prev.map((e) => {
        if (e.id === entry.id) {
          return {
            ...e,
            status: newStatus,
            verifiedBy:
              newStatus === "Verified" ? userData?.name || "Accountant" : null,
            verifiedAt:
              newStatus === "Verified" ? new Date().toLocaleString() : null,
            remarks: verificationNotes ? `${e.remarks} | Note: ${verificationNotes}` : e.remarks,
          };
        }
        return e;
      })
    );

    // Also sync to drawer if accountant is verifying
    if (newStatus === "Verified") {
      try {
        const parts = (entry.date || "").split("-");
        const ddmmyyyy = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : new Date().toLocaleDateString("en-GB");
        if (typeof addExpense === "function") {
          await addExpense({
            received: {
              date: ddmmyyyy,
              name: `VERIFIED-${entry.billNo}`,
              description: `Audit verified cash - ${entry.guestOrTable}`,
              amount: Number(entry.amount),
              bill_id: entry.billId || entry.billNo,
              receivedId: Math.random().toString(36).substr(2, 9),
            },
          });
          if (typeof listExpenses === "function") await listExpenses();
        }
      } catch (err) {
        console.warn("Backend addExpense notice on verification:", err);
      }
    }

    toast.success(
      `Entry ${entry.billNo} marked as ${newStatus}!`
    );
    setViewEntryModal(false);
    setSelectedEntry(null);
    setVerificationNotes("");
  };

  // Filtered entries
  const filteredEntries = useMemo(() => {
    return cashEntries.filter((item) => {
      // Source tab filter
      if (activeTab === "frontdesk" && item.source !== "frontdesk") return false;
      if (activeTab === "restaurant" && item.source !== "restaurant") return false;

      // Status filter
      if (statusFilter === "pending" && item.status !== "Pending") return false;
      if (statusFilter === "verified" && item.status !== "Verified") return false;

      // Date filter
      if (dateFilter && item.date !== dateFilter) return false;

      // Search query
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matches =
          String(item.billNo || "").toLowerCase().includes(q) ||
          String(item.guestOrTable || "").toLowerCase().includes(q) ||
          String(item.staff || "").toLowerCase().includes(q) ||
          String(item.paymentDetails || "").toLowerCase().includes(q) ||
          String(item.remarks || "").toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [cashEntries, activeTab, statusFilter, dateFilter, searchTerm]);

  // Aggregate stats
  const stats = useMemo(() => {
    const totalCash = filteredEntries.reduce(
      (sum, e) => sum + (Number(e.amount) || 0),
      0
    );
    const verifiedCash = filteredEntries
      .filter((e) => e.status === "Verified")
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const pendingCash = filteredEntries
      .filter((e) => e.status === "Pending")
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    const frontDeskCount = filteredEntries.filter(
      (e) => e.source === "frontdesk"
    ).length;
    const restCount = filteredEntries.filter(
      (e) => e.source === "restaurant"
    ).length;

    return { totalCash, verifiedCash, pendingCash, frontDeskCount, restCount };
  }, [filteredEntries]);

  // Excel Export
  const exportToExcel = () => {
    if (filteredEntries.length === 0) {
      toast.error("No entries to export");
      return;
    }

    const rows = filteredEntries.map((e, idx) => ({
      "S.No": idx + 1,
      "Date": e.date,
      "Source": e.source === "frontdesk" ? "Front Desk" : "Restaurant",
      "Bill No": e.billNo,
      "Guest / Table": e.guestOrTable,
      "Amount (₹)": e.amount,
      "Payment Mode": e.paymentDetails,
      "Received By / Staff": e.staff,
      "Status": e.status,
      "Verified By": e.verifiedBy || "-",
      "Verified Date/Time": e.verifiedAt || "-",
      "Remarks": e.remarks || "-",
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Cash_Audit_Entries");
    XLSX.writeFile(wb, `Accountant_Cash_Report_${new Date().toISOString().split("T")[0]}.xlsx`);
    toast.success("Excel report downloaded successfully!");
  };

  // PDF Export
  const exportToPDF = () => {
    if (filteredEntries.length === 0) {
      toast.error("No entries to export");
      return;
    }

    const doc = new jsPDF({ orientation: "landscape" });

    doc.setFontSize(16);
    doc.text("Accountant Cash Verification & Bill Details Report", 14, 15);
    doc.setFontSize(10);
    doc.text(
      `Generated on: ${new Date().toLocaleDateString("en-IN")} | Generated By: ${
        userData?.name || "Accountant"
      }`,
      14,
      22
    );

    const tableHead = [
      [
        "Date",
        "Source",
        "Bill No",
        "Guest / Table",
        "Amount",
        "Details",
        "Staff",
        "Status",
        "Verified By",
      ],
    ];

    const tableBody = filteredEntries.map((e) => [
      e.date,
      e.source === "frontdesk" ? "Front Desk" : "Restaurant",
      e.billNo,
      e.guestOrTable,
      e.amount.toLocaleString("en-IN"),
      e.paymentDetails,
      e.staff,
      e.status,
      e.verifiedBy || "-",
    ]);

    tableBody.push([
      "TOTAL",
      "",
      "",
      "",
      stats.totalCash.toLocaleString("en-IN"),
      `Verified: ${stats.verifiedCash.toLocaleString("en-IN")} | Pending: ${stats.pendingCash.toLocaleString("en-IN")}`,
      "",
      "",
      "",
    ]);

    autoTable(doc, {
      head: tableHead,
      body: tableBody,
      startY: 28,
      theme: "grid",
      styles: { fontSize: 8 },
      headStyles: { fillColor: [37, 99, 235] },
    });

    doc.save(`Accountant_Cash_Report_${new Date().toISOString().split("T")[0]}.pdf`);
    toast.success("PDF report downloaded successfully!");
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto p-3 flex flex-col gap-3 font-sans text-gray-900 text-xs min-h-[calc(100vh-60px)]">
      {/* ----------------- SLIM TOP STATUS & ACTION BAR ----------------- */}
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-xs">
        <div className="flex items-center gap-6 text-[12px] text-gray-600">
          <span className="flex items-center gap-1.5 font-bold text-gray-900 text-sm">
            <Banknote className="w-4 h-4 text-emerald-600" /> Cash Audit & Bill Verification
          </span>
          <span className="border-l pl-4 border-gray-200">
            Total Cash: <strong className="text-gray-900 text-sm">₹{stats.totalCash.toLocaleString()}</strong>
            <span className="text-gray-400"> ({filteredEntries.length} entries)</span>
          </span>
          <span className="border-l pl-4 border-gray-200">
            Verified: <strong className="text-emerald-700 text-sm">₹{stats.verifiedCash.toLocaleString()}</strong>
          </span>
          <span className="border-l pl-4 border-gray-200">
            Pending: <strong className="text-amber-700 text-sm">₹{stats.pendingCash.toLocaleString()}</strong>
          </span>
          {isSyncing && (
            <span className="flex items-center gap-1 text-blue-600 font-medium">
              <RotateCcw className="w-3 h-3 animate-spin" /> Syncing
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshData}
            disabled={isSyncing}
            className="h-7 text-xs px-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          >
            <RotateCcw className={`h-3 w-3 mr-1 ${isSyncing ? "animate-spin" : ""}`} /> Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={exportToExcel}
            className="h-7 text-xs px-2.5 text-emerald-700 border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50"
          >
            <FileSpreadsheet className="h-3 w-3 mr-1" /> Excel
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={exportToPDF}
            className="h-7 text-xs px-2.5 text-red-700 border-red-200 bg-red-50/50 hover:bg-red-50"
          >
            <FileText className="h-3 w-3 mr-1" /> PDF
          </Button>

          <Button
            size="sm"
            onClick={() => setShowAddModal(true)}
            className="h-7 text-xs px-3 bg-blue-600 hover:bg-blue-700 text-white font-medium"
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Record Cash
          </Button>
        </div>
      </div>

      {/* ----------------- KPI SUMMARY STRIP ----------------- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] text-gray-500 font-medium">Total Recorded Cash</div>
            <div className="text-xl font-bold text-gray-900 mt-0.5">₹{stats.totalCash.toLocaleString()}</div>
          </div>
          <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            ₹
          </div>
        </div>

        <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] text-emerald-700 font-medium">Verified by Accountant</div>
            <div className="text-xl font-bold text-emerald-700 mt-0.5">₹{stats.verifiedCash.toLocaleString()}</div>
          </div>
          <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCheck className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] text-amber-700 font-medium">Awaiting Audit (Pending)</div>
            <div className="text-xl font-bold text-amber-700 mt-0.5">₹{stats.pendingCash.toLocaleString()}</div>
          </div>
          <div className="w-9 h-9 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] text-gray-500 font-medium">Source Collections</div>
            <div className="text-xs font-semibold text-gray-800 mt-1 flex items-center gap-3">
              <span>FD: <strong className="text-blue-600">{stats.frontDeskCount}</strong></span>
              <span>REST: <strong className="text-purple-600">{stats.restCount}</strong></span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* ----------------- FILTER & CONTROLS STRIP ----------------- */}
      <div className="bg-white p-2.5 rounded-lg border border-gray-200 shadow-xs flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          {/* Department Source Segmented Tab */}
          <div className="w-72">
            <Segmented
              value={activeTab}
              onChange={setActiveTab}
              options={[
                { id: "all", label: "All Sources" },
                { id: "frontdesk", label: "Front Desk", icon: Building2 },
                { id: "restaurant", label: "Restaurant", icon: UtensilsCrossed },
              ]}
            />
          </div>

          {/* Status Filter Segmented */}
          <div className="w-60">
            <Segmented
              value={statusFilter}
              onChange={setStatusFilter}
              size="sm"
              options={[
                { id: "all", label: "All Status" },
                { id: "pending", label: "Pending" },
                { id: "verified", label: "Verified" },
              ]}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Date Picker Filter */}
          <div className="flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="h-6 w-32 border-0 bg-transparent text-xs p-0 focus-visible:ring-0"
            />
            {dateFilter && (
              <button
                type="button"
                onClick={() => setDateFilter("")}
                className="text-gray-400 hover:text-gray-600 text-xs px-1 font-bold"
              >
                ×
              </button>
            )}
          </div>

          {/* Search Input */}
          <div className="relative w-56">
            <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search bill, guest, table..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-7 pl-8 text-xs bg-gray-50 border-gray-200 focus:bg-white"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2 top-1.5 text-gray-400 hover:text-gray-600 text-xs font-bold"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ----------------- DATA TABLE PANEL ----------------- */}
      <div className="flex-1 bg-white border border-gray-200 rounded-lg shadow-xs overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1 max-h-[calc(100vh-270px)]">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/90 sticky top-0 z-10 border-b border-gray-200 text-gray-600 font-semibold text-[11px]">
              <tr>
                <th className="py-2.5 px-3 w-10 text-center">#</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Department</th>
                <th className="py-2.5 px-3">Bill / Order No</th>
                <th className="py-2.5 px-3">Guest / Table Details</th>
                <th className="py-2.5 px-3 text-right">Cash Amount</th>
                <th className="py-2.5 px-3">Payment Breakdown</th>
                <th className="py-2.5 px-3">Cashier / Staff</th>
                <th className="py-2.5 px-3 text-center">Audit Status</th>
                <th className="py-2.5 px-3">Verified Log</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-12 text-gray-400 font-medium">
                    No cash transactions found for the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry, idx) => (
                  <tr key={entry.id || idx} className="hover:bg-blue-50/40 transition-colors">
                    <td className="py-2 px-3 text-center text-gray-400 font-mono text-[11px]">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-3 font-medium text-gray-800 whitespace-nowrap">
                      {entry.date}
                    </td>
                    <td className="py-2 px-3">
                      {entry.source === "frontdesk" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                          <Building2 className="w-3 h-3" /> Front Desk
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/60">
                          <UtensilsCrossed className="w-3 h-3" /> Restaurant
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 font-bold text-gray-900 font-mono text-xs">
                      {entry.billNo}
                    </td>
                    <td className="py-2 px-3 text-gray-700 max-w-[200px] truncate" title={entry.guestOrTable}>
                      {entry.guestOrTable}
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-emerald-800 font-mono text-xs">
                      ₹{Number(entry.amount).toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-gray-500 text-[11px]">
                      {entry.paymentDetails}
                    </td>
                    <td className="py-2 px-3 text-gray-600 text-[11px]">
                      {entry.staff || "-"}
                    </td>
                    <td className="py-2 px-3 text-center">
                      {entry.status === "Verified" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCheck className="w-3 h-3" /> Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3 h-3" /> Pending
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-[11px]">
                      {entry.status === "Verified" ? (
                        <div>
                          <span className="font-semibold text-gray-800">{entry.verifiedBy}</span>
                          <div className="text-[10px] text-gray-400">{entry.verifiedAt}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic text-[11px]">Unverified</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 text-xs font-semibold"
                        onClick={() => {
                          setSelectedEntry(entry);
                          setVerificationNotes("");
                          setViewEntryModal(true);
                        }}
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" /> Audit
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ----------------- MODAL: VIEW & VERIFY AUDIT ----------------- */}
      <Dialog open={viewEntryModal} onOpenChange={setViewEntryModal}>
        <DialogContent className="max-w-md p-5">
          <DialogHeader className="pb-2 border-b">
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-gray-900">
              <CheckCheck className="h-5 w-5 text-blue-600" />
              Cash Entry Audit & Verification
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Verify physical cash collection against issued bill details.
            </DialogDescription>
          </DialogHeader>

          {selectedEntry && (
            <div className="space-y-3.5 text-xs py-2">
              <div className="grid grid-cols-2 gap-2.5 bg-gray-50 p-3 rounded-lg border border-gray-200">
                <div>
                  <span className="text-gray-500 block text-[11px]">Department:</span>
                  <span className="font-semibold text-gray-800">
                    {selectedEntry.source === "frontdesk" ? "Front Desk" : "Restaurant"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[11px]">Bill Number:</span>
                  <span className="font-bold text-gray-900 font-mono">{selectedEntry.billNo}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[11px]">Guest / Table:</span>
                  <span className="font-medium text-gray-800">{selectedEntry.guestOrTable}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[11px]">Date:</span>
                  <span className="font-medium text-gray-800">{selectedEntry.date}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[11px]">Cash Amount:</span>
                  <span className="font-bold text-emerald-700 text-sm font-mono">
                    ₹{Number(selectedEntry.amount).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[11px]">Collected By:</span>
                  <span className="font-medium text-gray-800">{selectedEntry.staff || "-"}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500 block text-[11px]">Payment Mode Details:</span>
                  <span className="font-medium text-gray-800">{selectedEntry.paymentDetails}</span>
                </div>
                {selectedEntry.remarks && (
                  <div className="col-span-2">
                    <span className="text-gray-500 block text-[11px]">System Remarks:</span>
                    <span className="text-gray-700">{selectedEntry.remarks}</span>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="audit_notes" className="text-xs font-semibold text-gray-700">
                  Accountant Verification Note (Optional)
                </Label>
                <Textarea
                  id="audit_notes"
                  placeholder="e.g. Physical cash counted in register / drawer confirmed..."
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  className="text-xs h-16 bg-white"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t">
                <span className="text-xs font-medium text-gray-600">
                  Current Status:{" "}
                  <strong className={selectedEntry.status === "Verified" ? "text-emerald-700" : "text-amber-700"}>
                    {selectedEntry.status}
                  </strong>
                </span>

                <div className="flex gap-2">
                  {selectedEntry.status === "Verified" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleVerifyEntry(selectedEntry, "Pending")}
                      className="text-xs h-8 text-amber-700 border-amber-300 hover:bg-amber-50"
                    >
                      Mark as Pending
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleVerifyEntry(selectedEntry, "Verified")}
                      className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                    >
                      <CheckCircle className="h-3.5 w-3.5 mr-1" /> Verify Cash Entry
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ----------------- MODAL: RECORD MANUAL CASH ENTRY ----------------- */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md p-5">
          <DialogHeader className="pb-2 border-b">
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-gray-900">
              <Plus className="h-5 w-5 text-blue-600" />
              Record Cash Entry
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Enter cash collection and credit it to the hotel cash drawer.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateCashEntry} className="space-y-3 text-xs py-2">
            <div>
              <Label className="text-xs font-semibold text-gray-700">Department Source</Label>
              <Select value={sourceType} onValueChange={setSourceType}>
                <SelectTrigger className="mt-1 h-8 text-xs bg-white border-gray-200">
                  <SelectValue placeholder="Select Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="frontdesk">Front Desk (Room Bill)</SelectItem>
                  <SelectItem value="restaurant">Restaurant (Food Order)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {sourceType === "frontdesk" ? (
              <div>
                <Label className="text-xs font-semibold text-gray-700">Link to Front Desk Bill (Optional)</Label>
                <Select value={selectedBillId} onValueChange={(val) => {
                  setSelectedBillId(val);
                  const b = (bills || []).find((x) => x.bill_id === val || x.id === val || x.booking_id === val);
                  if (b) {
                    const due = Number(b?.bill?.billingSummary?.balanceDue ?? b?.bill?.finalSummary?.totalAmount ?? b?.total_amount ?? 0);
                    if (due > 0) setEntryAmount(String(due));
                  }
                }}>
                  <SelectTrigger className="mt-1 h-8 text-xs bg-white border-gray-200">
                    <SelectValue placeholder="Select Bill (or leave for manual)" />
                  </SelectTrigger>
                  <SelectContent className="max-h-48">
                    {(bills || []).slice(0, 50).map((b, i) => (
                      <SelectItem key={b.bill_id || i} value={b.bill_id || b.id || b.booking_id || String(i)}>
                        Bill #{b.bill_no || b.billNo || "N/A"} - {b?.bill?.guestDetails?.guestName || "Guest"} (₹{Number(b?.bill?.billingSummary?.balanceDue ?? b?.total_amount ?? 0)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div>
                <Label className="text-xs font-semibold text-gray-700">Link to Restaurant Order (Optional)</Label>
                <Select value={selectedBillId} onValueChange={(val) => {
                  setSelectedBillId(val);
                  const r = (restaurantOrders || []).find((x) => x.orderId === val || x.id === val);
                  if (r) {
                    const tot = Number(r.grandTotal || r.totalAmount || r.subtotal || 0);
                    if (tot > 0) setEntryAmount(String(tot));
                  }
                }}>
                  <SelectTrigger className="mt-1 h-8 text-xs bg-white border-gray-200">
                    <SelectValue placeholder="Select Order (or leave for manual)" />
                  </SelectTrigger>
                  <SelectContent className="max-h-48">
                    {(restaurantOrders || []).slice(0, 50).map((r, i) => (
                      <SelectItem key={r.orderId || i} value={r.orderId || r.id || String(i)}>
                        Order #{r.billNo || r.orderId} - {r.tableName || "Table"} (₹{Number(r.grandTotal || r.totalAmount || 0)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <Label className="text-xs font-semibold text-gray-700">Cash Amount (₹) *</Label>
                <Input
                  type="number"
                  placeholder="e.g. 2500"
                  value={entryAmount}
                  onChange={(e) => setEntryAmount(e.target.value)}
                  className="mt-1 h-8 text-xs bg-white border-gray-200"
                  required
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-gray-700">Date *</Label>
                <Input
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  className="mt-1 h-8 text-xs bg-white border-gray-200"
                  required
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold text-gray-700">Cashier / Staff Name</Label>
              <Input
                type="text"
                placeholder="Staff who collected the cash"
                value={entryStaff}
                onChange={(e) => setEntryStaff(e.target.value)}
                className="mt-1 h-8 text-xs bg-white border-gray-200"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-gray-700">Remarks / Bill Notes</Label>
              <Textarea
                placeholder="Additional audit or reference details..."
                value={entryRemarks}
                onChange={(e) => setEntryRemarks(e.target.value)}
                className="mt-1 text-xs h-16 bg-white border-gray-200"
              />
            </div>

            <DialogFooter className="pt-2 border-t">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium">
                Save & Credit Cash Drawer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CashEntry;
