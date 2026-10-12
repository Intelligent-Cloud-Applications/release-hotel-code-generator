import { useState, useMemo, useEffect, useCallback } from "react";
import {
    Plus,
    Package,
    Search,
    X,
    Eye,
    Edit,
    Printer,
    FileText,
    ArrowUpFromLine,
    ArrowDownToLine,
    RotateCcw,
    AlertTriangle,
    RefreshCw,
    Layers,
    ShoppingCart,
    BarChart3,
    Trash2,
    Calendar,
    Building2,
    CheckCircle2,
    ChevronDown,
    History,
    ArrowLeft,
    Download,
    Filter,
} from "lucide-react";
import { get, post } from "aws-amplify/api";
import { useAuthContext } from "../../../context/AuthContext";
import { institutionId as defaultInstitutionId } from "../../../../Operation/data.json";

/* ----------------------- AUTOCOMPLETE INPUT ------------------------ */

function AutoCompleteInput({ label, value, onChange, suggestions = [], placeholder, className = "" }) {
    const [focused, setFocused] = useState(false);

    const filtered = focused
        ? (suggestions || []).filter((s) =>
            typeof s === "string" && s.toLowerCase().includes((value || "").toLowerCase())
        )
        : [];

    return (
        <div className="relative w-full">
            <input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder || label}
                onFocus={() => setFocused(true)}
                onBlur={() => setTimeout(() => setFocused(false), 200)}
                className={`w-full p-2 border border-gray-300 rounded-md text-xs bg-white focus:outline-none focus:ring-1 focus:ring-gray-400 ${className}`}
            />

            {focused && filtered.length > 0 && (
                <div className="absolute left-0 right-0 bg-white border border-gray-300 rounded-md mt-1 shadow-lg max-h-40 overflow-auto z-30">
                    {filtered.map((text, index) => (
                        <div
                            key={index}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                onChange(text);
                                setFocused(false);
                            }}
                            className="px-3 py-2 text-xs hover:bg-gray-100 cursor-pointer"
                        >
                            {text}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

const Input = (props) => (
    <input
        {...props}
        className={`w-full p-2 border border-gray-300 rounded-md text-xs bg-white focus:outline-none focus:ring-1 focus:ring-gray-400 ${props.className || ""}`}
    />
);

/* ---------------------------------------------------------------------- */
/* 🔥   MAIN COMPONENT                                                     */
/* ---------------------------------------------------------------------- */

export default function Store() {
    const { userData } = useAuthContext();
    const institutionId = userData?.institutionId || defaultInstitutionId;

    // Active Section Tab: "inventory" | "purchase_section" | "issue_section" | "history_section" | "par_levels"
    const [activeTab, setActiveTab] = useState("inventory");

    const [stockHistory, setStockHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState("");
    const [purchaseSearch, setPurchaseSearch] = useState("");
    const [issueSearch, setIssueSearch] = useState("");
    const [issueDeptFilter, setIssueDeptFilter] = useState("ALL");

    // History Section Filters & Pagination
    const [historySearch, setHistorySearch] = useState("");
    const [historyActionFilter, setHistoryActionFilter] = useState("all");
    const [historyDateFrom, setHistoryDateFrom] = useState("");
    const [historyDateTo, setHistoryDateTo] = useState("");
    const [historyPage, setHistoryPage] = useState(1);
    const [historyPageSize, setHistoryPageSize] = useState(50);

    // Inline Add Item Toggle (no modal)
    const [showInlineAddItem, setShowInlineAddItem] = useState(false);

    // Adjustment Modal
    const [showAdjustment, setShowAdjustment] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    // Loaders
    const [loadingAddItem, setLoadingAddItem] = useState(false);
    const [loadingPurchaseEntry, setLoadingPurchaseEntry] = useState(false);
    const [loadingIssueEntry, setLoadingIssueEntry] = useState(false);
    const [loadingAdjustment, setLoadingAdjustment] = useState(false);

    // Forms
    const [itemForm, setItemForm] = useState({
        name: "",
        category: "",
        unit: "pcs",
        parLevel: "",
    });

    const [adjustmentForm, setAdjustmentForm] = useState({
        newQuantity: "",
        description: "",
        adjustmentType: "adjustment",
    });

    // INLINE Multi-Item Purchase Entry Form (Section, Not Modal)
    const [purchaseForm, setPurchaseForm] = useState({
        grnNo: "001",
        billNo: "",
        billDate: new Date().toISOString().split("T")[0],
        vendorName: "",
        purchaseType: "Standard",
        items: [
            {
                id: 1,
                itemName: "",
                category: "",
                unit: "pcs",
                quantity: "",
                price: "",
            },
        ],
    });

    // INLINE Issue & Return Form (Section, Not Modal)
    const [issueForm, setIssueForm] = useState({
        actionType: "issue_entry", // "issue_entry" | "return"
        department: "KITCHEN",
        issueDate: new Date().toISOString().split("T")[0],
        itemName: "",
        quantity: "",
        description: "",
    });

    /* ----------------------- FETCH STOCK HISTORY ------------------------ */

    const fetchStockHistory = useCallback(async () => {
        if (!institutionId) return;
        try {
            setLoading(true);
            let allItems = [];
            let lastEvaluatedKey = null;
            let page = 0;
            const MAX_PAGES = 30; // Protect against infinite loops (up to 15,000 items)

            do {
                let query = `institutionId=${encodeURIComponent(institutionId)}&limit=500`;
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
                const response = await body.json();

                if (response?.success && Array.isArray(response.stockHistory)) {
                    allItems = allItems.concat(response.stockHistory);
                    lastEvaluatedKey = response.lastEvaluatedKey || null;
                    if (response.stockHistory.length < 500 || !lastEvaluatedKey) {
                        break;
                    }
                } else {
                    break;
                }
                page++;
            } while (lastEvaluatedKey && page < MAX_PAGES);

            setStockHistory(allItems);
        } catch (error) {
            console.error("Error fetching stock history from cloud DB:", error);
            setStockHistory([]);
        } finally {
            setLoading(false);
        }
    }, [institutionId]);

    useEffect(() => {
        fetchStockHistory();
    }, [fetchStockHistory]);

    /* ----------------------- DERIVED ITEMS FROM STOCK HISTORY ------------------------ */

    const items = useMemo(() => {
        const map = {};
        const sorted = [...stockHistory].sort((a, b) => (a.dateEpoch || 0) - (b.dateEpoch || 0));

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
                    totalPurchased: 0,
                    totalIssued: 0,
                    lastPrice: 0,
                };
            }

            if (entry.parLevel) {
                map[key].parLevel = Number(entry.parLevel);
            }

            if (entry.price && Number(entry.price) > 0) {
                map[key].lastPrice = Number(entry.price);
            }

            const q = Number(entry.quantity) || 0;

            if (entry.actionType === "add") map[key].quantity += q;
            if (entry.actionType === "distributed") {
                map[key].quantity -= q;
                map[key].totalIssued += q;
            }
            if (entry.actionType === "issue_entry") {
                map[key].quantity -= q;
                map[key].totalIssued += q;
            }
            if (entry.actionType === "purchase-entry") {
                map[key].quantity += q;
                map[key].totalPurchased += q;
            }
            if (entry.actionType === "adjustment") map[key].quantity = q;
            if (entry.actionType === "wastage") map[key].quantity = q;
            if (entry.actionType === "return") map[key].quantity = q;
        });

        return Object.values(map);
    }, [stockHistory]);

    /* ----------------------- SUGGESTIONS ------------------------ */

    const itemSuggestions = useMemo(() => {
        return Array.isArray(stockHistory)
            ? [...new Set(stockHistory.map((e) => e.itemName).filter(Boolean))]
            : [];
    }, [stockHistory]);

    const catSuggestions = useMemo(() => {
        const set = new Set(["Linen", "Chemicals", "Consumables", "Housekeeping", "Kitchen", "Amenities"]);
        if (Array.isArray(stockHistory)) {
            stockHistory.forEach((e) => e.category && set.add(e.category));
        }
        return [...set];
    }, [stockHistory]);

    const unitSuggestions = ["pcs", "kg", "litre", "PKT", "Box", "Roll", "Set", "Dozen"];

    const vendorSuggestions = useMemo(() => {
        return Array.isArray(stockHistory)
            ? [...new Set(stockHistory.map((e) => e.vendorName).filter(Boolean))]
            : [];
    }, [stockHistory]);

    const departmentSuggestions = [
        "KITCHEN",
        "HOUSEKEEPING",
        "LAUNDRY",
        "FRONT DESK",
        "RESTAURANT",
        "MAINTENANCE",
    ];

    /* ----------------------- NEXT GRN NUMBER ------------------------ */

    const getNextGrnNo = useCallback(() => {
        if (!Array.isArray(stockHistory) || stockHistory.length === 0) return "001";
        const purchaseEntries = stockHistory.filter((e) => e.actionType === "purchase-entry");
        const nextNumber = purchaseEntries.length + 1;
        return String(nextNumber).padStart(3, "0");
    }, [stockHistory]);

    useEffect(() => {
        setPurchaseForm((prev) => ({
            ...prev,
            grnNo: getNextGrnNo(),
        }));
    }, [stockHistory, getNextGrnNo]);

    /* ----------------------- FILTERED LISTS ------------------------ */

    const filteredItems = useMemo(() => {
        return items.filter(
            (i) =>
                (i.itemName || "").toLowerCase().includes(search.toLowerCase()) ||
                (i.category || "").toLowerCase().includes(search.toLowerCase())
        );
    }, [items, search]);

    const purchaseRecords = useMemo(() => {
        return stockHistory
            .filter((log) => log.actionType === "purchase-entry")
            .filter((record) => {
                if (!purchaseSearch) return true;
                const s = purchaseSearch.toLowerCase();
                return (
                    (record.grnNo || "").toLowerCase().includes(s) ||
                    (record.billNo || "").toLowerCase().includes(s) ||
                    (record.vendorName || "").toLowerCase().includes(s) ||
                    (record.itemName || "").toLowerCase().includes(s) ||
                    (record.category || "").toLowerCase().includes(s)
                );
            })
            .sort((a, b) => (b.billDate || b.dateEpoch || 0) - (a.billDate || a.dateEpoch || 0));
    }, [stockHistory, purchaseSearch]);

    const issueRecords = useMemo(() => {
        return stockHistory
            .filter((log) => log.actionType === "issue_entry" || log.actionType === "distributed" || log.actionType === "return")
            .filter((record) => {
                const matchDept = issueDeptFilter === "ALL" || (record.department || "").toUpperCase() === issueDeptFilter.toUpperCase();
                if (!matchDept) return false;
                if (!issueSearch) return true;
                const s = issueSearch.toLowerCase();
                return (
                    (record.itemName || "").toLowerCase().includes(s) ||
                    (record.department || "").toLowerCase().includes(s) ||
                    (record.description || "").toLowerCase().includes(s)
                );
            })
            .sort((a, b) => (b.issueDate || b.dateEpoch || 0) - (a.issueDate || a.dateEpoch || 0));
    }, [stockHistory, issueSearch, issueDeptFilter]);

    const replenishmentItems = useMemo(() => {
        return items.filter((item) => item.quantity <= item.parLevel);
    }, [items]);

    /* ----------------------- ITEM MOVEMENT LEDGER (NO MODAL) ------------------------ */

    const itemLedgerData = useMemo(() => {
        let logs = [...stockHistory];

        // Filter by selectedItem if selected
        if (selectedItem) {
            logs = logs.filter(
                (log) =>
                    (log.itemName || "").trim().toLowerCase() === (selectedItem.itemName || "").trim().toLowerCase()
            );
        }

        // Sort ascending to calculate running balance accurately
        const ascLogs = [...logs].sort((a, b) => (a.dateEpoch || 0) - (b.dateEpoch || 0));
        let runningBal = 0;
        const enrichedWithBalance = ascLogs.map((log) => {
            const q = Number(
                log.actionType === "issue_entry" ||
                log.actionType === "distributed" ||
                log.actionType === "wastage" ||
                log.actionType === "adjustment" ||
                log.actionType === "return"
                    ? log.adjustmentQuantity
                    : log.quantity
            ) || 0;

            if (log.actionType === "add" || log.actionType === "purchase-entry" || log.actionType === "return") {
                runningBal += q;
            } else if (log.actionType === "issue_entry" || log.actionType === "distributed" || log.actionType === "wastage") {
                runningBal = Math.max(0, runningBal - q);
            } else if (log.actionType === "adjustment") {
                runningBal = q;
            }

            return {
                ...log,
                effectiveQty: q,
                balanceAfter: runningBal,
            };
        });

        // Now sort descending (newest first)
        let descLogs = enrichedWithBalance.sort((a, b) => (b.dateEpoch || 0) - (a.dateEpoch || 0));

        // Filter by action
        if (historyActionFilter !== "all") {
            descLogs = descLogs.filter((log) => {
                if (historyActionFilter === "purchase") return log.actionType === "purchase-entry" || log.actionType === "add";
                if (historyActionFilter === "issue") return log.actionType === "issue_entry" || log.actionType === "distributed";
                if (historyActionFilter === "return") return log.actionType === "return";
                if (historyActionFilter === "adjustment") return log.actionType === "adjustment" || log.actionType === "wastage";
                return true;
            });
        }

        // Filter by search
        if (historySearch.trim()) {
            const s = historySearch.toLowerCase();
            descLogs = descLogs.filter((log) =>
                (log.itemName || "").toLowerCase().includes(s) ||
                (log.department || "").toLowerCase().includes(s) ||
                (log.vendorName || "").toLowerCase().includes(s) ||
                (log.billNo || "").toLowerCase().includes(s) ||
                (log.grnNo || "").toLowerCase().includes(s) ||
                (log.description || "").toLowerCase().includes(s)
            );
        }

        // Filter by date
        if (historyDateFrom) {
            const fromTime = new Date(historyDateFrom).setHours(0, 0, 0, 0);
            descLogs = descLogs.filter((log) => (log.dateEpoch || 0) >= fromTime);
        }
        if (historyDateTo) {
            const toTime = new Date(historyDateTo).setHours(23, 59, 59, 999);
            descLogs = descLogs.filter((log) => (log.dateEpoch || 0) <= toTime);
        }

        return descLogs;
    }, [stockHistory, selectedItem, historyActionFilter, historySearch, historyDateFrom, historyDateTo]);

    const totalHistoryPages = useMemo(() => {
        if (historyPageSize === "all") return 1;
        return Math.max(1, Math.ceil(itemLedgerData.length / Number(historyPageSize)));
    }, [itemLedgerData.length, historyPageSize]);

    const paginatedHistoryData = useMemo(() => {
        if (historyPageSize === "all") return itemLedgerData;
        const start = (historyPage - 1) * Number(historyPageSize);
        return itemLedgerData.slice(start, start + Number(historyPageSize));
    }, [itemLedgerData, historyPage, historyPageSize]);

    const exportLedgerToCSV = () => {
        if (!itemLedgerData || itemLedgerData.length === 0) {
            alert("No ledger records to export");
            return;
        }
        const headers = [
            "Date",
            "Item Name",
            "Category",
            "Movement Type",
            "Quantity Change",
            "Unit",
            "Running Balance",
            "Department / Vendor",
            "Reference / Bill No",
            "Rate / Price",
            "Total Amount",
            "Remarks / Description",
        ];
        const rows = itemLedgerData.map((log) => [
            `"${new Date(log.dateEpoch).toLocaleString("en-IN").replace(/"/g, '""')}"`,
            `"${(log.itemName || "").replace(/"/g, '""')}"`,
            `"${(log.category || "").replace(/"/g, '""')}"`,
            `"${(log.actionType || "").toUpperCase()}"`,
            log.effectiveQty,
            `"${log.unit || ""}"`,
            log.balanceAfter,
            `"${(log.department || log.vendorName || "").replace(/"/g, '""')}"`,
            `"${(log.billNo || log.grnNo || "").replace(/"/g, '""')}"`,
            log.price || 0,
            log.price ? ((Number(log.quantity) || 0) * (Number(log.price) || 0)).toFixed(2) : 0,
            `"${(log.description || "").replace(/"/g, '""')}"`,
        ]);
        const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const slug = selectedItem?.itemName ? selectedItem.itemName.replace(/\s+/g, "_") : "store_all_items";
        link.href = url;
        link.setAttribute("download", `${slug}_movement_ledger_${new Date().toISOString().split("T")[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const printLedger = () => {
        if (!itemLedgerData || itemLedgerData.length === 0) {
            alert("No ledger records to print");
            return;
        }

        const printWin = window.open("", "_blank", "width=1100,height=800");
        if (!printWin) {
            alert("Popup blocked! Please allow popups for this site to print the ledger.");
            return;
        }

        const title = selectedItem?.itemName
            ? `Stock Movement Ledger - ${selectedItem.itemName}`
            : "Master Store Movement Ledger";
        const generatedAt = new Date().toLocaleString("en-IN");
        const dateRangeText = (historyDateFrom || historyDateTo)
            ? `Period: ${historyDateFrom || "Start"} to ${historyDateTo || "Present"}`
            : "Period: All Recorded History";

        const rowsHtml = itemLedgerData
            .map((log, idx) => {
                const dateStr = log.dateEpoch ? new Date(log.dateEpoch).toLocaleDateString("en-IN") : "-";
                const isPositive = log.effectiveQty > 0;
                const qtyBadge = isPositive
                    ? `<span style="color:#047857;font-weight:700;">+${log.effectiveQty}</span>`
                    : `<span style="color:#b91c1c;font-weight:700;">${log.effectiveQty}</span>`;
                const amount = log.price ? ((Number(log.quantity) || 0) * (Number(log.price) || 0)).toFixed(2) : "-";
                const party = log.department || log.vendorName || "-";
                const refNo = log.billNo || log.grnNo || "-";

                return `
                <tr>
                    <td style="text-align:center;">${idx + 1}</td>
                    <td>${dateStr}</td>
                    <td><strong>${escapeHtml(log.itemName || "-")}</strong></td>
                    <td>${escapeHtml(log.category || "-")}</td>
                    <td style="text-align:center;text-transform:uppercase;font-size:10px;font-weight:600;">${escapeHtml(log.actionType || "-")}</td>
                    <td style="text-align:right;">${qtyBadge} ${escapeHtml(log.unit || "")}</td>
                    <td style="text-align:right;font-weight:700;">${log.balanceAfter ?? "-"}</td>
                    <td>${escapeHtml(party)}</td>
                    <td>${escapeHtml(refNo)}</td>
                    <td style="text-align:right;">${log.price ? "₹" + Number(log.price).toFixed(2) : "-"}</td>
                    <td style="text-align:right;font-weight:600;">${amount !== "-" ? "₹" + amount : "-"}</td>
                    <td style="font-size:10px;color:#555;">${escapeHtml(log.description || "-")}</td>
                </tr>
            `;
            })
            .join("");

        function escapeHtml(text) {
            return String(text || "")
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }

        const summaryKpiHtml = selectedItem
            ? `
            <div class="kpi-grid">
                <div class="kpi-card">
                    <div class="kpi-label">Current Stock</div>
                    <div class="kpi-value">${selectedItem.quantity} <span style="font-size:11px;font-weight:normal;color:#666;">${selectedItem.unit}</span></div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-label">Par / Safety Level</div>
                    <div class="kpi-value">${selectedItem.parLevel || 0} <span style="font-size:11px;font-weight:normal;color:#666;">${selectedItem.unit}</span></div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-label">Total Purchased (Inward)</div>
                    <div class="kpi-value" style="color:#047857;">${selectedItem.totalPurchased || 0} <span style="font-size:11px;font-weight:normal;color:#666;">${selectedItem.unit}</span></div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-label">Total Issued (Outward)</div>
                    <div class="kpi-value" style="color:#1d4ed8;">${selectedItem.totalIssued || 0} <span style="font-size:11px;font-weight:normal;color:#666;">${selectedItem.unit}</span></div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-label">Total Records</div>
                    <div class="kpi-value">${itemLedgerData.length}</div>
                </div>
            </div>
        `
            : `
            <div class="kpi-grid">
                <div class="kpi-card">
                    <div class="kpi-label">Scope</div>
                    <div class="kpi-value">All Items Master</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-label">Total Audit Trail Records</div>
                    <div class="kpi-value">${itemLedgerData.length}</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-label">Action Filter</div>
                    <div class="kpi-value" style="text-transform:uppercase;font-size:12px;">${historyActionFilter}</div>
                </div>
            </div>
        `;

        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <title>${escapeHtml(title)}</title>
    <style>
        @page {
            size: A4 landscape;
            margin: 8mm;
        }
        * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: #111827;
            background: #fff;
            margin: 0;
            padding: 16px;
            font-size: 11px;
            line-height: 1.35;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #111827;
            padding-bottom: 8px;
            margin-bottom: 12px;
        }
        .header-title h1 {
            margin: 0;
            font-size: 18px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #111827;
        }
        .header-title .subtitle {
            margin-top: 3px;
            font-size: 12px;
            color: #4b5563;
            font-weight: 600;
        }
        .header-meta {
            text-align: right;
            font-size: 10px;
            color: #4b5563;
            line-height: 1.4;
        }
        .kpi-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
            gap: 8px;
            margin-bottom: 12px;
        }
        .kpi-card {
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 4px;
            padding: 6px 10px;
        }
        .kpi-label {
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
            color: #6b7280;
            letter-spacing: 0.4px;
        }
        .kpi-value {
            font-size: 13px;
            font-weight: 800;
            color: #111827;
            margin-top: 2px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
            margin-bottom: 16px;
        }
        th, td {
            border: 1px solid #d1d5db;
            padding: 5px 6px;
            vertical-align: middle;
        }
        th {
            background: #f3f4f6;
            color: #1f2937;
            font-weight: 700;
            text-transform: uppercase;
            font-size: 9px;
            letter-spacing: 0.3px;
            text-align: left;
        }
        tr:nth-child(even) td {
            background: #fafafa;
        }
        .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 32px;
            padding-top: 10px;
            page-break-inside: avoid;
        }
        .sig-block {
            text-align: center;
            width: 28%;
            border-top: 1px dashed #4b5563;
            padding-top: 6px;
            font-size: 10px;
            font-weight: 600;
            color: #374151;
        }
        .print-btn-bar {
            margin-bottom: 12px;
            display: flex;
            gap: 8px;
        }
        .print-btn {
            background: #111827;
            color: #fff;
            border: none;
            padding: 6px 14px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
        }
        .close-btn {
            background: #e5e7eb;
            color: #111827;
            border: none;
            padding: 6px 14px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
        }
        @media print {
            .print-btn-bar {
                display: none !important;
            }
            body {
                padding: 0 !important;
            }
        }
    </style>
</head>
<body>
    <div class="print-btn-bar">
        <button class="print-btn" onclick="window.print()">Print Document</button>
        <button class="close-btn" onclick="window.close()">Close</button>
    </div>

    <div class="header">
        <div class="header-title">
            <h1>${escapeHtml(title)}</h1>
            <div class="subtitle">Store Department &bull; Stock Movement & Audit Trail</div>
        </div>
        <div class="header-meta">
            <div><strong>Generated:</strong> ${generatedAt}</div>
            <div><strong>${escapeHtml(dateRangeText)}</strong></div>
            <div><strong>Total Entries:</strong> ${itemLedgerData.length}</div>
        </div>
    </div>

    ${summaryKpiHtml}

    <table>
        <thead>
            <tr>
                <th style="width:24px;text-align:center;">#</th>
                <th style="width:70px;">Date</th>
                <th>Item Name</th>
                <th>Category</th>
                <th style="width:65px;text-align:center;">Action</th>
                <th style="width:75px;text-align:right;">Qty Change</th>
                <th style="width:75px;text-align:right;">Run. Bal</th>
                <th>Dept / Vendor</th>
                <th>Ref / Bill</th>
                <th style="width:65px;text-align:right;">Rate</th>
                <th style="width:75px;text-align:right;">Amount</th>
                <th style="width:120px;">Remarks</th>
            </tr>
        </thead>
        <tbody>
            ${rowsHtml}
        </tbody>
    </table>

    <div class="signatures">
        <div class="sig-block">Prepared By (Store Keeper)</div>
        <div class="sig-block">Verified By (Auditor / Accounts)</div>
        <div class="sig-block">Authorized Signatory (Manager)</div>
    </div>

    <script>
        window.onload = function() {
            setTimeout(function() {
                window.print();
            }, 300);
        };
    </script>
</body>
</html>
        `;

        printWin.document.open();
        printWin.document.write(html);
        printWin.document.close();
    };

    /* ----------------------- ACTION HANDLERS ------------------------ */

    const addNewItem = async () => {
        if (!itemForm.name || !itemForm.category || !itemForm.unit) {
            return alert("Please fill Item Name, Category and Unit");
        }

        setLoadingAddItem(true);
        try {
            await post({
                apiName: "frontdesk",
                path: `/stock?institutionId=${institutionId}`,
                options: {
                    body: {
                        itemName: itemForm.name.trim(),
                        category: itemForm.category.trim(),
                        unit: itemForm.unit.trim(),
                        quantity: 0,
                        parLevel: itemForm.parLevel ? parseInt(itemForm.parLevel, 10) : 15,
                        actionType: "create-item",
                        description: "Item created",
                    },
                },
            }).response;

            setItemForm({ name: "", category: "", unit: "pcs", parLevel: "" });
            setShowInlineAddItem(false);
            await fetchStockHistory();
        } catch (error) {
            console.error("Error creating item:", error);
            alert("Failed to create item");
        } finally {
            setLoadingAddItem(false);
        }
    };

    // Purchase Row Management
    const addPurchaseRow = () => {
        setPurchaseForm((prev) => ({
            ...prev,
            items: [
                ...prev.items,
                {
                    id: Date.now(),
                    itemName: "",
                    category: "",
                    unit: "pcs",
                    quantity: "",
                    price: "",
                },
            ],
        }));
    };

    const removePurchaseRow = (id) => {
        if (purchaseForm.items.length <= 1) return;
        setPurchaseForm((prev) => ({
            ...prev,
            items: prev.items.filter((item) => item.id !== id),
        }));
    };

    const updatePurchaseRow = (id, field, value) => {
        setPurchaseForm((prev) => ({
            ...prev,
            items: prev.items.map((row) => {
                if (row.id !== id) return row;
                const updated = { ...row, [field]: value };
                if (field === "itemName") {
                    const match = stockHistory.find((e) => e.itemName?.toLowerCase() === value?.toLowerCase());
                    if (match) {
                        updated.category = match.category || updated.category;
                        updated.unit = match.unit || updated.unit;
                        if (match.price && !updated.price) updated.price = match.price;
                    }
                }
                return updated;
            }),
        }));
    };

    const submitMultiItemPurchaseEntry = async () => {
        if (!purchaseForm.billNo || !purchaseForm.billDate || !purchaseForm.vendorName) {
            return alert("Please enter Bill No, Bill Date, and Vendor Name");
        }

        const validItems = purchaseForm.items.filter(
            (i) => i.itemName.trim() && Number(i.quantity) > 0 && Number(i.price) >= 0
        );

        if (validItems.length === 0) {
            return alert("Please add at least one item with valid Name, Quantity and Rate");
        }

        setLoadingPurchaseEntry(true);
        try {
            const billDateEpoch = new Date(purchaseForm.billDate).getTime();

            for (const item of validItems) {
                await post({
                    apiName: "frontdesk",
                    path: `/stock?institutionId=${institutionId}`,
                    options: {
                        body: {
                            grnNo: purchaseForm.grnNo,
                            billNo: purchaseForm.billNo,
                            billDate: billDateEpoch,
                            vendorName: purchaseForm.vendorName,
                            itemName: item.itemName.trim(),
                            category: item.category.trim() || "General",
                            unit: item.unit.trim() || "pcs",
                            quantity: parseInt(item.quantity, 10),
                            price: parseFloat(item.price),
                            purchaseType: purchaseForm.purchaseType || "Standard",
                            actionType: "purchase-entry",
                        },
                    },
                }).response;
            }

            // Reset form
            setPurchaseForm({
                grnNo: getNextGrnNo(),
                billNo: "",
                billDate: new Date().toISOString().split("T")[0],
                vendorName: "",
                purchaseType: "Standard",
                items: [
                    {
                        id: 1,
                        itemName: "",
                        category: "",
                        unit: "pcs",
                        quantity: "",
                        price: "",
                    },
                ],
            });

            await fetchStockHistory();
            alert("Multi-item purchase entry saved successfully!");
        } catch (error) {
            console.error("Error submitting purchase entries:", error);
            alert("Failed to submit purchase entry");
        } finally {
            setLoadingPurchaseEntry(false);
        }
    };

    const submitInlineIssue = async () => {
        if (!issueForm.itemName) return alert("Please select or enter an item name");
        const matchItem = items.find((i) => i.itemName.toLowerCase() === issueForm.itemName.toLowerCase());
        
        const qty = parseInt(issueForm.quantity, 10);
        if (!qty || qty <= 0) return alert("Enter valid quantity greater than 0");

        if (issueForm.actionType === "issue_entry") {
            if (matchItem && qty > matchItem.quantity) {
                return alert(`Insufficient stock! Available: ${matchItem.quantity} ${matchItem.unit}`);
            }
        }

        setLoadingIssueEntry(true);
        try {
            await post({
                apiName: "frontdesk",
                path: `/stock?institutionId=${institutionId}`,
                options: {
                    body: {
                        itemName: matchItem?.itemName || issueForm.itemName,
                        category: matchItem?.category || "General",
                        unit: matchItem?.unit || "pcs",
                        quantity: qty,
                        actionType: issueForm.actionType,
                        department: issueForm.department,
                        issueDate: new Date(issueForm.issueDate).getTime(),
                        adjustmentQuantity: qty,
                        description: issueForm.description || `${issueForm.actionType === "return" ? "Returned from" : "Issued to"} ${issueForm.department}`,
                    },
                },
            }).response;

            setIssueForm({
                actionType: "issue_entry",
                department: issueForm.department,
                issueDate: new Date().toISOString().split("T")[0],
                itemName: "",
                quantity: "",
                description: "",
            });

            await fetchStockHistory();
            alert(`Stock ${issueForm.actionType === "return" ? "return" : "issue"} recorded successfully!`);
        } catch (err) {
            console.error("Issue entry failed:", err);
            alert("Failed to record issue entry");
        } finally {
            setLoadingIssueEntry(false);
        }
    };

    const openIssueForSpecificItem = (item) => {
        setIssueForm((prev) => ({
            ...prev,
            actionType: "issue_entry",
            itemName: item.itemName,
            quantity: "",
        }));
        setActiveTab("issue_section");
    };

    const openReplenishPO = (replenishList) => {
        setPurchaseForm({
            grnNo: getNextGrnNo(),
            billNo: "",
            billDate: new Date().toISOString().split("T")[0],
            vendorName: "",
            purchaseType: "Replenishment",
            items: replenishList.map((item, idx) => ({
                id: idx + 1,
                itemName: item.itemName,
                category: item.category,
                unit: item.unit,
                quantity: Math.max(1, (item.parLevel * 2) - item.quantity),
                price: item.lastPrice || "",
            })),
        });
        setActiveTab("purchase_section");
    };

    const submitAdjustment = async () => {
        if (adjustmentForm.newQuantity === "") return alert("Enter quantity");
        const inputQty = parseInt(adjustmentForm.newQuantity, 10);
        if (inputQty < 0) return alert("Quantity cannot be negative");

        let finalQty;
        if (adjustmentForm.adjustmentType === "wastage") {
            finalQty = selectedItem.quantity - inputQty;
            if (finalQty < 0) return alert("Waste quantity exceeds current stock");
        } else if (adjustmentForm.adjustmentType === "return") {
            finalQty = selectedItem.quantity + inputQty;
        } else {
            finalQty = inputQty;
        }

        setLoadingAdjustment(true);
        try {
            await post({
                apiName: "frontdesk",
                path: `/stock?institutionId=${institutionId}`,
                options: {
                    body: {
                        itemName: selectedItem.itemName,
                        category: selectedItem.category,
                        unit: selectedItem.unit,
                        quantity: finalQty,
                        adjustmentQuantity: inputQty,
                        actionType: adjustmentForm.adjustmentType,
                        description: adjustmentForm.description || `Stock ${adjustmentForm.adjustmentType}`,
                    },
                },
            }).response;

            setShowAdjustment(false);
            await fetchStockHistory();
        } catch (error) {
            console.error("Error adjusting stock:", error);
            alert("Failed to adjust stock");
        } finally {
            setLoadingAdjustment(false);
        }
    };

    /* ----------------------- LOADING STATE ------------------------ */

    if (loading && stockHistory.length === 0) {
        return (
            <div className="h-[calc(100vh-70px)] bg-[#f7f7f7] p-6 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-gray-900 mx-auto mb-3"></div>
                    <p className="text-xs text-gray-600">Connecting to cloud database...</p>
                </div>
            </div>
        );
    }

    const purchaseTotalAmount = purchaseForm.items.reduce(
        (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.price) || 0),
        0
    );

    return (
        <div className="min-h-[calc(100vh-70px)] bg-[#f7f7f7] p-4 sm:p-5 space-y-3.5">
            {/* TOP HEADER & SECTION NAVIGATION (No rounded-full buttons) */}
            <div className="bg-white border border-gray-200 rounded-md p-3 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-gray-900 text-white rounded-md">
                        <Package size={18} />
                    </div>
                    <div>
                        <h1 className="text-base font-bold text-gray-900 leading-tight">
                            Store Inventory & Department Stock
                        </h1>
                        <p className="text-[11px] text-gray-500">
                            Live stock tracking, multi-item purchase entries & departmental issue management
                        </p>
                    </div>
                </div>

                {/* SECTION TABS (Clean rounded-md buttons) */}
                <div className="flex items-center gap-1 overflow-x-auto bg-gray-100 p-1 rounded-md">
                    <button
                        onClick={() => setActiveTab("inventory")}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition flex items-center gap-1.5 ${
                            activeTab === "inventory"
                                ? "bg-white text-gray-900 shadow-2xs border border-gray-200"
                                : "text-gray-600 hover:text-gray-900"
                        }`}
                    >
                        <Layers size={13} /> Store Inventory
                    </button>
                    <button
                        onClick={() => setActiveTab("purchase_section")}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition flex items-center gap-1.5 ${
                            activeTab === "purchase_section"
                                ? "bg-white text-gray-900 shadow-2xs border border-gray-200"
                                : "text-gray-600 hover:text-gray-900"
                        }`}
                    >
                        <ArrowDownToLine size={13} /> Purchase Entry (Section)
                    </button>
                    <button
                        onClick={() => setActiveTab("issue_section")}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition flex items-center gap-1.5 ${
                            activeTab === "issue_section"
                                ? "bg-white text-gray-900 shadow-2xs border border-gray-200"
                                : "text-gray-600 hover:text-gray-900"
                        }`}
                    >
                        <ArrowUpFromLine size={13} /> Issue & Consumption (Section)
                    </button>
                    <button
                        onClick={() => setActiveTab("history_section")}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition flex items-center gap-1.5 ${
                            activeTab === "history_section"
                                ? "bg-white text-gray-900 shadow-2xs border border-gray-200"
                                : "text-gray-600 hover:text-gray-900"
                        }`}
                    >
                        <History size={13} /> Item History & Movement Ledger
                    </button>
                    <button
                        onClick={() => setActiveTab("par_levels")}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition flex items-center gap-1.5 ${
                            activeTab === "par_levels"
                                ? "bg-white text-gray-900 shadow-2xs border border-gray-200"
                                : "text-gray-600 hover:text-gray-900"
                        }`}
                    >
                        <AlertTriangle size={13} className={replenishmentItems.length > 0 ? "text-amber-600" : ""} />
                        Par-Levels ({replenishmentItems.length})
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchStockHistory}
                        title="Sync with cloud database"
                        className="p-1.5 border border-gray-300 rounded-md bg-white hover:bg-gray-100 text-gray-700 transition"
                    >
                        <RefreshCw size={14} />
                    </button>
                </div>
            </div>

            {/* ═════════════════════════════════════════════════════════════════ */}
            {/* SECTION 1: STORE INVENTORY                                        */}
            {/* ═════════════════════════════════════════════════════════════════ */}
            {activeTab === "inventory" && (
                <div className="space-y-3">
                    {/* Inline Collapsible Add Item Form */}
                    {showInlineAddItem && (
                        <div className="bg-white border border-gray-200 rounded-md p-3.5 shadow-2xs space-y-3 animate-in fade-in duration-150">
                            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                                <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                                    <Plus size={14} className="text-blue-600" /> Add New Item to Master Inventory
                                </h3>
                                <button onClick={() => setShowInlineAddItem(false)} className="text-gray-400 hover:text-gray-700">
                                    <X size={15} />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                                <div>
                                    <label className="text-[10px] font-bold uppercase text-gray-500 block mb-0.5">Item Name *</label>
                                    <AutoCompleteInput
                                        placeholder="e.g. Bath Towel"
                                        value={itemForm.name}
                                        suggestions={itemSuggestions}
                                        onChange={(v) => setItemForm({ ...itemForm, name: v })}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase text-gray-500 block mb-0.5">Category *</label>
                                    <AutoCompleteInput
                                        placeholder="e.g. Linen / Chemicals"
                                        value={itemForm.category}
                                        suggestions={catSuggestions}
                                        onChange={(v) => setItemForm({ ...itemForm, category: v })}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase text-gray-500 block mb-0.5">Unit *</label>
                                    <AutoCompleteInput
                                        placeholder="pcs / kg / litre"
                                        value={itemForm.unit}
                                        suggestions={unitSuggestions}
                                        onChange={(v) => setItemForm({ ...itemForm, unit: v })}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase text-gray-500 block mb-0.5">Par-Level</label>
                                    <Input
                                        type="number"
                                        placeholder="Min Stock (e.g. 20)"
                                        value={itemForm.parLevel}
                                        onChange={(e) => setItemForm({ ...itemForm, parLevel: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => setShowInlineAddItem(false)}
                                    className="px-3 py-1.5 border border-gray-300 rounded-md text-xs font-semibold text-gray-600 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={addNewItem}
                                    disabled={loadingAddItem}
                                    className="px-4 py-1.5 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-md flex items-center gap-1.5 disabled:opacity-50"
                                >
                                    {loadingAddItem && <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>}
                                    Save Item to Master
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Toolbar and Inventory Table */}
                    <div className="bg-white border border-gray-200 rounded-md shadow-2xs overflow-hidden">
                        <div className="p-3 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2.5">
                            <div className="relative flex-1 min-w-[220px]">
                                <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search inventory items by name, category..."
                                    className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-md text-xs focus:outline-none"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setActiveTab("issue_section")}
                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md transition flex items-center gap-1"
                                >
                                    <ArrowUpFromLine size={13} /> Issue to Dept
                                </button>
                                <button
                                    onClick={() => setShowInlineAddItem(!showInlineAddItem)}
                                    className="px-3 py-1.5 bg-gray-900 hover:bg-black text-white text-xs font-semibold rounded-md transition flex items-center gap-1"
                                >
                                    <Plus size={13} /> {showInlineAddItem ? "Close Form" : "Add Item"}
                                </button>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="overflow-x-auto max-h-[calc(100vh-270px)]">
                            <table className="w-full text-xs">
                                <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <Th>#</Th>
                                        <Th>Item Name</Th>
                                        <Th>Category</Th>
                                        <Th>Available Qty</Th>
                                        <Th>Unit</Th>
                                        <Th>Par Level</Th>
                                        <Th>Status</Th>
                                        <Th right>Actions</Th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredItems.map((item, idx) => {
                                        const isLow = item.quantity <= item.parLevel;
                                        return (
                                            <tr key={item.itemName + idx} className="border-b border-gray-100 hover:bg-gray-50">
                                                <Td className="text-gray-400">{idx + 1}</Td>
                                                <Td>
                                                    <span className="font-bold text-gray-900">{item.itemName}</span>
                                                </Td>
                                                <Td>
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-700">
                                                        {item.category}
                                                    </span>
                                                </Td>
                                                <Td>
                                                    <span className={`font-bold ${isLow ? "text-red-600 text-sm" : "text-gray-900"}`}>
                                                        {item.quantity}
                                                    </span>
                                                </Td>
                                                <Td className="text-gray-600">{item.unit}</Td>
                                                <Td className="text-gray-500">{item.parLevel} {item.unit}</Td>
                                                <Td>
                                                    {item.quantity === 0 ? (
                                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">
                                                            OUT OF STOCK
                                                        </span>
                                                    ) : isLow ? (
                                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                                            LOW STOCK
                                                        </span>
                                                    ) : (
                                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                                            OK
                                                        </span>
                                                    )}
                                                </Td>
                                                <Td right>
                                                    <div className="flex gap-1.5 justify-end">
                                                        <button
                                                            onClick={() => openIssueForSpecificItem(item)}
                                                            className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 rounded-md font-bold text-[10px] flex items-center gap-1 transition"
                                                            title="Issue to department"
                                                        >
                                                            <ArrowUpFromLine size={11} /> Issue
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedItem(item);
                                                                setAdjustmentForm({ newQuantity: "", description: "", adjustmentType: "adjustment" });
                                                                setShowAdjustment(true);
                                                            }}
                                                            className="px-2 py-1 bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 rounded-md font-bold text-[10px] flex items-center gap-1 transition"
                                                            title="Stock Adjustment"
                                                        >
                                                            <Edit size={11} /> Adjust
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedItem(item);
                                                                setHistorySearch("");
                                                                setHistoryActionFilter("all");
                                                                setHistoryDateFrom("");
                                                                setHistoryDateTo("");
                                                                setHistoryPage(1);
                                                                setActiveTab("history_section");
                                                            }}
                                                            className="px-2 py-1 bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 rounded-md font-bold text-[10px] flex items-center gap-1 transition"
                                                            title="View Item Movement Ledger"
                                                        >
                                                            <History size={11} /> History
                                                        </button>
                                                    </div>
                                                </Td>
                                            </tr>
                                        );
                                    })}
                                    {filteredItems.length === 0 && (
                                        <tr>
                                            <td colSpan="8" className="py-10 text-center text-gray-400">
                                                No items found in store inventory.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ═════════════════════════════════════════════════════════════════ */}
            {/* SECTION 2: PURCHASE ENTRY (INLINE SECTION — NOT A MODAL!)         */}
            {/* ═════════════════════════════════════════════════════════════════ */}
            {activeTab === "purchase_section" && (
                <div className="space-y-4">
                    {/* INLINE PURCHASE FORM SECTION */}
                    <div className="bg-white border border-gray-200 rounded-md p-4 shadow-2xs space-y-3.5">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                            <div>
                                <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                    <ShoppingCart size={16} className="text-blue-600" />
                                    Multi-Item Purchase Entry Voucher
                                </h2>
                                <p className="text-[11px] text-gray-500">
                                    Enter inward bills & supplier GRNs directly into the database
                                </p>
                            </div>
                            <span className="font-mono text-xs font-bold px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-md">
                                GRN: {purchaseForm.grnNo}
                            </span>
                        </div>

                        {/* Bill Header Info */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-gray-50 p-3 rounded-md border border-gray-200">
                            <div>
                                <label className="text-[10px] font-bold uppercase text-gray-500 block mb-0.5">Bill / Invoice No *</label>
                                <Input
                                    placeholder="e.g. 025 or 1234"
                                    value={purchaseForm.billNo}
                                    onChange={(e) => setPurchaseForm({ ...purchaseForm, billNo: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase text-gray-500 block mb-0.5">Bill Date *</label>
                                <Input
                                    type="date"
                                    value={purchaseForm.billDate}
                                    onChange={(e) => setPurchaseForm({ ...purchaseForm, billDate: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase text-gray-500 block mb-0.5">Vendor Name *</label>
                                <AutoCompleteInput
                                    placeholder="Vendor Name (e.g. ABC / TT)"
                                    value={purchaseForm.vendorName}
                                    suggestions={vendorSuggestions}
                                    onChange={(v) => setPurchaseForm({ ...purchaseForm, vendorName: v })}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase text-gray-500 block mb-0.5">Purchase Type</label>
                                <Input
                                    placeholder="Standard / Replenishment"
                                    value={purchaseForm.purchaseType}
                                    onChange={(e) => setPurchaseForm({ ...purchaseForm, purchaseType: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Multiple Item Rows */}
                        <div className="border border-gray-200 rounded-md overflow-hidden">
                            <div className="bg-gray-100 p-2.5 text-xs font-bold text-gray-700 flex justify-between items-center">
                                <span>Item Breakdown ({purchaseForm.items.length} items in this invoice)</span>
                                <button
                                    type="button"
                                    onClick={addPurchaseRow}
                                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-[11px] font-semibold flex items-center gap-1 transition"
                                >
                                    <Plus size={12} /> + Add Another Item Row
                                </button>
                            </div>

                            <div className="p-2.5 space-y-2 bg-white">
                                {purchaseForm.items.map((row) => {
                                    const rowTotal = (Number(row.quantity) || 0) * (Number(row.price) || 0);
                                    return (
                                        <div key={row.id} className="grid grid-cols-12 gap-2 items-center p-2 rounded-md bg-gray-50/70 border border-gray-200 text-xs">
                                            <div className="col-span-12 sm:col-span-4">
                                                <AutoCompleteInput
                                                    placeholder="Item Name *"
                                                    value={row.itemName}
                                                    suggestions={itemSuggestions}
                                                    onChange={(v) => updatePurchaseRow(row.id, "itemName", v)}
                                                />
                                            </div>
                                            <div className="col-span-4 sm:col-span-2">
                                                <AutoCompleteInput
                                                    placeholder="Category"
                                                    value={row.category}
                                                    suggestions={catSuggestions}
                                                    onChange={(v) => updatePurchaseRow(row.id, "category", v)}
                                                />
                                            </div>
                                            <div className="col-span-2 sm:col-span-1">
                                                <input
                                                    placeholder="Unit"
                                                    value={row.unit}
                                                    onChange={(e) => updatePurchaseRow(row.id, "unit", e.target.value)}
                                                    className="w-full p-2 border border-gray-300 rounded-md text-xs bg-white"
                                                />
                                            </div>
                                            <div className="col-span-3 sm:col-span-2">
                                                <input
                                                    type="number"
                                                    placeholder="Qty *"
                                                    value={row.quantity}
                                                    onChange={(e) => updatePurchaseRow(row.id, "quantity", e.target.value)}
                                                    className="w-full p-2 border border-gray-300 rounded-md text-xs bg-white text-right font-bold"
                                                />
                                            </div>
                                            <div className="col-span-3 sm:col-span-2">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    placeholder="Rate (₹) *"
                                                    value={row.price}
                                                    onChange={(e) => updatePurchaseRow(row.id, "price", e.target.value)}
                                                    className="w-full p-2 border border-gray-300 rounded-md text-xs bg-white text-right font-bold"
                                                />
                                            </div>
                                            <div className="col-span-12 sm:col-span-1 flex items-center justify-between sm:justify-end gap-2">
                                                <span className="sm:hidden font-bold text-gray-700">₹{rowTotal.toFixed(2)}</span>
                                                {purchaseForm.items.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removePurchaseRow(row.id)}
                                                        className="text-gray-400 hover:text-red-600 p-1"
                                                        title="Remove row"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Total and Save Bar */}
                            <div className="bg-gray-100 p-3 flex flex-wrap justify-between items-center text-xs border-t border-gray-200 gap-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-600 font-bold uppercase text-[11px]">Total Invoice Amount:</span>
                                    <span className="text-base font-extrabold text-gray-900">
                                        ₹{purchaseTotalAmount.toFixed(2)}
                                    </span>
                                </div>
                                <button
                                    onClick={submitMultiItemPurchaseEntry}
                                    disabled={loadingPurchaseEntry}
                                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-md flex items-center gap-1.5 disabled:opacity-50 transition"
                                >
                                    {loadingPurchaseEntry && <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>}
                                    Save Purchase Entry to Database
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Historical Purchase Records Table */}
                    <div className="bg-white border border-gray-200 rounded-md shadow-2xs overflow-hidden">
                        <div className="p-3 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2.5">
                            <div>
                                <h3 className="text-xs font-bold text-gray-900">Purchase Entry Records (Database Log)</h3>
                                <p className="text-[11px] text-gray-500">All historical inward bills recorded in system</p>
                            </div>
                            <div className="relative min-w-[240px]">
                                <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
                                <input
                                    value={purchaseSearch}
                                    onChange={(e) => setPurchaseSearch(e.target.value)}
                                    placeholder="Search by GRN, Bill No, Vendor or Item..."
                                    className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-md text-xs focus:outline-none"
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto max-h-96">
                            <table className="w-full text-xs">
                                <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <Th>GRN No</Th>
                                        <Th>Bill No</Th>
                                        <Th>Date</Th>
                                        <Th>Vendor</Th>
                                        <Th>Item</Th>
                                        <Th>Quantity</Th>
                                        <Th>Rate (₹)</Th>
                                        <Th right>Total (₹)</Th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {purchaseRecords.map((record, idx) => (
                                        <tr key={(record.grnNo || "") + idx} className="border-b border-gray-100 hover:bg-gray-50">
                                            <Td>
                                                <span className="font-mono bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-bold text-[10px]">
                                                    {record.grnNo}
                                                </span>
                                            </Td>
                                            <Td className="font-semibold text-gray-800">{record.billNo}</Td>
                                            <Td className="text-gray-600">
                                                {record.billDate ? new Date(record.billDate).toLocaleDateString("en-IN") : "—"}
                                            </Td>
                                            <Td className="text-gray-800">{record.vendorName}</Td>
                                            <Td className="font-bold text-gray-900">{record.itemName}</Td>
                                            <Td>
                                                {record.quantity} {record.unit || ""}
                                            </Td>
                                            <Td>₹{Number(record.price || 0).toFixed(2)}</Td>
                                            <Td right className="font-bold text-gray-900">
                                                ₹{(Number(record.quantity || 0) * Number(record.price || 0)).toFixed(2)}
                                            </Td>
                                        </tr>
                                    ))}
                                    {purchaseRecords.length === 0 && (
                                        <tr>
                                            <td colSpan="8" className="py-8 text-center text-gray-400">
                                                No purchase records found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ═════════════════════════════════════════════════════════════════ */}
            {/* SECTION 3: ISSUE & CONSUMPTION (INLINE SECTION — NOT A MODAL!)   */}
            {/* ═════════════════════════════════════════════════════════════════ */}
            {activeTab === "issue_section" && (
                <div className="space-y-4">
                    {/* INLINE ISSUE FORM SECTION */}
                    <div className="bg-white border border-gray-200 rounded-md p-4 shadow-2xs space-y-3.5">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                            <div>
                                <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                    <ArrowUpFromLine size={16} className="text-blue-600" />
                                    Department Stock Issue & Return Form
                                </h2>
                                <p className="text-[11px] text-gray-500">
                                    Issue items date-wise to Kitchen, Housekeeping, Laundry or return unused items
                                </p>
                            </div>

                            {/* Mode Toggle */}
                            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-md">
                                <button
                                    onClick={() => setIssueForm({ ...issueForm, actionType: "issue_entry" })}
                                    className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                                        issueForm.actionType === "issue_entry"
                                            ? "bg-blue-600 text-white"
                                            : "text-gray-600 hover:text-gray-900"
                                    }`}
                                >
                                    Issue to Dept
                                </button>
                                <button
                                    onClick={() => setIssueForm({ ...issueForm, actionType: "return" })}
                                    className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                                        issueForm.actionType === "return"
                                            ? "bg-emerald-600 text-white"
                                            : "text-gray-600 hover:text-gray-900"
                                    }`}
                                >
                                    Return from Dept
                                </button>
                            </div>
                        </div>

                        {/* Inline Form Fields */}
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                            <div>
                                <label className="text-[10px] font-bold uppercase text-gray-500 block mb-0.5">Department *</label>
                                <select
                                    value={issueForm.department}
                                    onChange={(e) => setIssueForm({ ...issueForm, department: e.target.value })}
                                    className="w-full p-2 border border-gray-300 rounded-md text-xs bg-white focus:outline-none"
                                >
                                    {departmentSuggestions.map((d) => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase text-gray-500 block mb-0.5">Issue Date *</label>
                                <Input
                                    type="date"
                                    value={issueForm.issueDate}
                                    onChange={(e) => setIssueForm({ ...issueForm, issueDate: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase text-gray-500 block mb-0.5">Select Item *</label>
                                <AutoCompleteInput
                                    placeholder="Type item name..."
                                    value={issueForm.itemName}
                                    suggestions={items.map((i) => i.itemName)}
                                    onChange={(v) => setIssueForm({ ...issueForm, itemName: v })}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase text-gray-500 block mb-0.5">Quantity *</label>
                                <Input
                                    type="number"
                                    placeholder="e.g. 5"
                                    value={issueForm.quantity}
                                    onChange={(e) => setIssueForm({ ...issueForm, quantity: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold uppercase text-gray-500 block mb-0.5">Description / Purpose / Shift</label>
                            <Input
                                placeholder="e.g. Towels issued for kitchen cleaning shift, or HK 2nd floor linen change"
                                value={issueForm.description}
                                onChange={(e) => setIssueForm({ ...issueForm, description: e.target.value })}
                            />
                        </div>

                        <div className="flex justify-end">
                            <button
                                onClick={submitInlineIssue}
                                disabled={loadingIssueEntry}
                                className={`px-5 py-2 text-white text-xs font-bold rounded-md flex items-center gap-1.5 disabled:opacity-50 transition ${
                                    issueForm.actionType === "return" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-blue-600 hover:bg-blue-700"
                                }`}
                            >
                                {loadingIssueEntry && <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>}
                                Save {issueForm.actionType === "return" ? "Return" : "Issue"} Entry
                            </button>
                        </div>
                    </div>

                    {/* Historical Issue Ledger Table */}
                    <div className="bg-white border border-gray-200 rounded-md shadow-2xs overflow-hidden">
                        <div className="p-3 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2.5">
                            <div>
                                <h3 className="text-xs font-bold text-gray-900">Department Consumption Register (Live Database Log)</h3>
                                <p className="text-[11px] text-gray-500">Filter date-wise and department-wise</p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-md text-[11px]">
                                    {["ALL", "KITCHEN", "HOUSEKEEPING", "LAUNDRY"].map((dept) => (
                                        <button
                                            key={dept}
                                            onClick={() => setIssueDeptFilter(dept)}
                                            className={`px-2 py-1 rounded font-semibold transition ${
                                                issueDeptFilter === dept ? "bg-gray-900 text-white" : "text-gray-600 hover:text-gray-900"
                                            }`}
                                        >
                                            {dept}
                                        </button>
                                    ))}
                                </div>

                                <div className="relative min-w-[200px]">
                                    <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
                                    <input
                                        value={issueSearch}
                                        onChange={(e) => setIssueSearch(e.target.value)}
                                        placeholder="Search issued items..."
                                        className="w-full pl-8 pr-3 py-1 border border-gray-300 rounded-md text-xs focus:outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto max-h-96">
                            <table className="w-full text-xs">
                                <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <Th>Issue Date</Th>
                                        <Th>Department</Th>
                                        <Th>Item Name</Th>
                                        <Th>Quantity</Th>
                                        <Th>Type</Th>
                                        <Th>Notes / Remarks</Th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {issueRecords.map((rec, idx) => (
                                        <tr key={(rec.dateEpoch || "") + idx} className="border-b border-gray-100 hover:bg-gray-50">
                                            <Td>
                                                <span className="font-mono text-gray-700">
                                                    {rec.issueDate
                                                        ? new Date(rec.issueDate).toLocaleDateString("en-IN")
                                                        : new Date(rec.dateEpoch).toLocaleDateString("en-IN")}
                                                </span>
                                            </Td>
                                            <Td>
                                                <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-blue-50 text-blue-700 border border-blue-200">
                                                    {rec.department || "General"}
                                                </span>
                                            </Td>
                                            <Td>
                                                <span className="font-bold text-gray-900">{rec.itemName}</span>
                                            </Td>
                                            <Td>
                                                <span className="font-bold text-gray-900">
                                                    {rec.adjustmentQuantity || rec.quantity} {rec.unit || "pcs"}
                                                </span>
                                            </Td>
                                            <Td>
                                                <span
                                                    className={`px-1.5 py-0.5 text-[10px] rounded-md font-bold ${
                                                        rec.actionType === "return"
                                                            ? "bg-emerald-100 text-emerald-800"
                                                            : "bg-blue-100 text-blue-800"
                                                    }`}
                                                >
                                                    {rec.actionType === "return" ? "RETURN" : "ISSUED"}
                                                </span>
                                            </Td>
                                            <Td className="text-gray-600">{rec.description || "—"}</Td>
                                        </tr>
                                    ))}
                                    {issueRecords.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="py-8 text-center text-gray-400">
                                                No issue records found for selected filter.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ═════════════════════════════════════════════════════════════════ */}
            {/* SECTION 4: PAR-LEVELS & REPLENISHMENT                            */}
            {/* ═════════════════════════════════════════════════════════════════ */}
            {activeTab === "par_levels" && (
                <div className="space-y-3">
                    <div className="bg-white p-3.5 border border-gray-200 rounded-md flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="text-sm font-bold text-gray-900">
                                Linen & Cleaning Chemical Par-Levels
                            </h2>
                            <p className="text-[11px] text-gray-500">
                                Automatic consumption monitoring and purchase order replenishment generator
                            </p>
                        </div>
                        {replenishmentItems.length > 0 && (
                            <button
                                onClick={() => openReplenishPO(replenishmentItems)}
                                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-md shadow-2xs transition flex items-center gap-1.5"
                            >
                                <ShoppingCart size={13} /> Open Auto-Replenishment PO ({replenishmentItems.length} items)
                            </button>
                        )}
                    </div>

                    <div className="bg-white border border-gray-200 rounded-md shadow-2xs overflow-hidden">
                        <table className="w-full text-xs">
                            <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <Th>Item Name</Th>
                                    <Th>Category</Th>
                                    <Th>Current Qty</Th>
                                    <Th>Par Level</Th>
                                    <Th>Deficit</Th>
                                    <Th>Status</Th>
                                    <Th right>Quick Action</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, idx) => {
                                    const isLow = item.quantity <= item.parLevel;
                                    const deficit = Math.max(0, item.parLevel - item.quantity);
                                    return (
                                        <tr key={item.itemName + idx} className="border-b border-gray-100 hover:bg-gray-50">
                                            <Td className="font-bold text-gray-900">{item.itemName}</Td>
                                            <Td>{item.category}</Td>
                                            <Td className={`font-bold ${isLow ? "text-red-600 font-extrabold" : "text-gray-900"}`}>
                                                {item.quantity} {item.unit}
                                            </Td>
                                            <Td className="text-gray-600">{item.parLevel} {item.unit}</Td>
                                            <Td>
                                                {deficit > 0 ? (
                                                    <span className="text-red-700 font-bold">-{deficit} {item.unit}</span>
                                                ) : (
                                                    <span className="text-emerald-700 font-semibold">Adequate</span>
                                                )}
                                            </Td>
                                            <Td>
                                                {item.quantity === 0 ? (
                                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">
                                                        OUT OF STOCK
                                                    </span>
                                                ) : isLow ? (
                                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                                        REORDER
                                                    </span>
                                                ) : (
                                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                                        HEALTHY
                                                    </span>
                                                )}
                                            </Td>
                                            <Td right>
                                                <button
                                                    onClick={() => openReplenishPO([item])}
                                                    className="px-2.5 py-1 bg-gray-900 text-white rounded-md text-[10px] font-semibold hover:bg-black transition"
                                                >
                                                    Order Item
                                                </button>
                                            </Td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ═════════════════════════════════════════════════════════════════ */}
            {/* SECTION 5: ITEM MOVEMENT LEDGER & AUDIT TRAIL (FULL SECTION)     */}
            {/* ═════════════════════════════════════════════════════════════════ */}
            {activeTab === "history_section" && (
                <div className="space-y-3.5">
                    {/* Header Strip with Back Button & Item Selector */}
                    <div className="bg-white border border-gray-200 rounded-md p-3.5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setActiveTab("inventory")}
                                className="px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-md text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
                                title="Return to Store Inventory"
                            >
                                <ArrowLeft size={14} /> Back to Inventory
                            </button>
                            <div>
                                <h2 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                                    <History size={16} className="text-gray-700" />
                                    {selectedItem ? `${selectedItem.itemName} Movement Ledger` : "Master Store Movement Ledger"}
                                </h2>
                                <p className="text-[11px] text-gray-500">
                                    {selectedItem
                                        ? `Category: ${selectedItem.category} • Unit: ${selectedItem.unit} • Current Stock: ${selectedItem.quantity} ${selectedItem.unit}`
                                        : "Complete chronological audit trail of all store purchases, issues, returns, and adjustments"}
                                </p>
                            </div>
                        </div>

                        {/* Top controls: Item Switcher + Export + Print */}
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-300 rounded-md px-2 py-1 text-xs">
                                <span className="text-[10px] font-bold uppercase text-gray-500">Item:</span>
                                <select
                                    value={selectedItem ? `${selectedItem.itemName}_${selectedItem.unit}_${selectedItem.category}` : "ALL"}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === "ALL") {
                                            setSelectedItem(null);
                                        } else {
                                            const found = items.find((it) => `${it.itemName}_${it.unit}_${it.category}` === val);
                                            if (found) setSelectedItem(found);
                                        }
                                        setHistoryPage(1);
                                    }}
                                    className="bg-transparent text-xs font-bold text-gray-800 focus:outline-none cursor-pointer max-w-[180px] sm:max-w-[240px] truncate"
                                >
                                    <option value="ALL">All Store Items (Master Store Ledger)</option>
                                    {items.map((it, idx) => (
                                        <option key={idx} value={`${it.itemName}_${it.unit}_${it.category}`}>
                                            {it.itemName} ({it.quantity} {it.unit} in stock)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <button
                                onClick={exportLedgerToCSV}
                                className="px-2.5 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-md text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
                                title="Export Ledger to CSV"
                            >
                                <Download size={13} /> Export CSV
                            </button>

                            <button
                                onClick={printLedger}
                                className="px-2.5 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-md text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
                                title="Print Ledger (A4 Landscape Statement)"
                            >
                                <Printer size={13} /> Print Ledger
                            </button>
                        </div>
                    </div>

                    {/* KPI Metric Summary Cards */}
                    {selectedItem ? (
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                            <div className="bg-white border border-gray-200 rounded-md p-3 shadow-2xs">
                                <div className="text-[10px] font-bold uppercase text-gray-400">Current Balance</div>
                                <div className="text-base font-bold text-gray-900 mt-0.5">
                                    {selectedItem.quantity} <span className="text-xs font-normal text-gray-500">{selectedItem.unit}</span>
                                </div>
                                <div className="mt-1">
                                    {selectedItem.quantity === 0 ? (
                                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-800">OUT OF STOCK</span>
                                    ) : selectedItem.quantity <= selectedItem.parLevel ? (
                                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800">LOW STOCK</span>
                                    ) : (
                                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">HEALTHY</span>
                                    )}
                                </div>
                            </div>
                            <div className="bg-white border border-gray-200 rounded-md p-3 shadow-2xs">
                                <div className="text-[10px] font-bold uppercase text-gray-400">Par-Level Threshold</div>
                                <div className="text-base font-bold text-gray-900 mt-0.5">
                                    {selectedItem.parLevel} <span className="text-xs font-normal text-gray-500">{selectedItem.unit}</span>
                                </div>
                                <div className="text-[10px] text-gray-400 mt-1">Minimum safety reserve</div>
                            </div>
                            <div className="bg-white border border-gray-200 rounded-md p-3 shadow-2xs">
                                <div className="text-[10px] font-bold uppercase text-gray-400">Total Inward Purchased</div>
                                <div className="text-base font-bold text-emerald-700 mt-0.5">
                                    {selectedItem.totalPurchased || 0} <span className="text-xs font-normal text-gray-500">{selectedItem.unit}</span>
                                </div>
                                <div className="text-[10px] text-gray-400 mt-1">Cumulative purchases</div>
                            </div>
                            <div className="bg-white border border-gray-200 rounded-md p-3 shadow-2xs">
                                <div className="text-[10px] font-bold uppercase text-gray-400">Total Outward Issued</div>
                                <div className="text-base font-bold text-blue-700 mt-0.5">
                                    {selectedItem.totalIssued || 0} <span className="text-xs font-normal text-gray-500">{selectedItem.unit}</span>
                                </div>
                                <div className="text-[10px] text-gray-400 mt-1">Issued to departments</div>
                            </div>
                            <div className="bg-white border border-gray-200 rounded-md p-3 shadow-2xs">
                                <div className="text-[10px] font-bold uppercase text-gray-400">Movement Records</div>
                                <div className="text-base font-bold text-gray-900 mt-0.5">
                                    {itemLedgerData.length} <span className="text-xs font-normal text-gray-500">entries</span>
                                </div>
                                <div className="text-[10px] text-gray-400 mt-1">Total audit trail entries</div>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            <div className="bg-white border border-gray-200 rounded-md p-3 shadow-2xs">
                                <div className="text-[10px] font-bold uppercase text-gray-400">Total Inventory Items</div>
                                <div className="text-base font-bold text-gray-900 mt-0.5">{items.length} items</div>
                                <div className="text-[10px] text-gray-400 mt-1">Active items in master</div>
                            </div>
                            <div className="bg-white border border-gray-200 rounded-md p-3 shadow-2xs">
                                <div className="text-[10px] font-bold uppercase text-gray-400">Total Purchase Entries</div>
                                <div className="text-base font-bold text-emerald-700 mt-0.5">
                                    {stockHistory.filter((l) => l.actionType === "purchase-entry" || l.actionType === "add").length}
                                </div>
                                <div className="text-[10px] text-gray-400 mt-1">Inward GRN receipts</div>
                            </div>
                            <div className="bg-white border border-gray-200 rounded-md p-3 shadow-2xs">
                                <div className="text-[10px] font-bold uppercase text-gray-400">Department Issue Logs</div>
                                <div className="text-base font-bold text-blue-700 mt-0.5">
                                    {stockHistory.filter((l) => l.actionType === "issue_entry" || l.actionType === "distributed").length}
                                </div>
                                <div className="text-[10px] text-gray-400 mt-1">Outward consumptions</div>
                            </div>
                            <div className="bg-white border border-gray-200 rounded-md p-3 shadow-2xs">
                                <div className="text-[10px] font-bold uppercase text-gray-400">Total Movement Logs</div>
                                <div className="text-base font-bold text-gray-900 mt-0.5">{stockHistory.length} logs</div>
                                <div className="text-[10px] text-gray-400 mt-1">Historical ledger entries</div>
                            </div>
                        </div>
                    )}

                    {/* Filter and Search Bar */}
                    <div className="bg-white border border-gray-200 rounded-md p-3 shadow-2xs flex flex-wrap items-center justify-between gap-2.5">
                        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
                            {/* Search */}
                            <div className="relative flex-1 min-w-[180px] max-w-sm">
                                <Search size={13} className="absolute left-2.5 top-2.5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search vendor, department, bill no, GRN, notes..."
                                    value={historySearch}
                                    onChange={(e) => {
                                        setHistorySearch(e.target.value);
                                        setHistoryPage(1);
                                    }}
                                    className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-md text-xs bg-white focus:outline-none focus:ring-1 focus:ring-gray-400"
                                />
                                {historySearch && (
                                    <button
                                        onClick={() => {
                                            setHistorySearch("");
                                            setHistoryPage(1);
                                        }}
                                        className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                                    >
                                        <X size={12} />
                                    </button>
                                )}
                            </div>

                            {/* Movement Type Filter */}
                            <select
                                value={historyActionFilter}
                                onChange={(e) => {
                                    setHistoryActionFilter(e.target.value);
                                    setHistoryPage(1);
                                }}
                                className="px-2.5 py-1.5 border border-gray-300 rounded-md text-xs bg-white text-gray-700 focus:outline-none cursor-pointer"
                            >
                                <option value="all">All Movements (In & Out)</option>
                                <option value="purchase">Purchases (Stock In)</option>
                                <option value="issue">Department Issues (Stock Out)</option>
                                <option value="return">Store Returns (Stock In)</option>
                                <option value="adjustment">Adjustments & Wastage</option>
                            </select>

                            {/* Date Range Filters */}
                            <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                <Calendar size={13} className="text-gray-400" />
                                <input
                                    type="date"
                                    value={historyDateFrom}
                                    onChange={(e) => {
                                        setHistoryDateFrom(e.target.value);
                                        setHistoryPage(1);
                                    }}
                                    className="px-2 py-1 border border-gray-300 rounded-md text-xs bg-white focus:outline-none text-gray-700"
                                    title="From Date"
                                />
                                <span>to</span>
                                <input
                                    type="date"
                                    value={historyDateTo}
                                    onChange={(e) => {
                                        setHistoryDateTo(e.target.value);
                                        setHistoryPage(1);
                                    }}
                                    className="px-2 py-1 border border-gray-300 rounded-md text-xs bg-white focus:outline-none text-gray-700"
                                    title="To Date"
                                />
                            </div>

                            {(historySearch || historyActionFilter !== "all" || historyDateFrom || historyDateTo) && (
                                <button
                                    onClick={() => {
                                        setHistorySearch("");
                                        setHistoryActionFilter("all");
                                        setHistoryDateFrom("");
                                        setHistoryDateTo("");
                                        setHistoryPage(1);
                                    }}
                                    className="px-2 py-1 text-[11px] font-semibold text-gray-600 hover:text-gray-900 flex items-center gap-1 border border-gray-300 rounded-md hover:bg-gray-50 transition cursor-pointer"
                                >
                                    <RotateCcw size={11} /> Reset
                                </button>
                            )}
                        </div>

                        {/* Page Size Selector */}
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <span>Rows:</span>
                            <select
                                value={historyPageSize}
                                onChange={(e) => {
                                    setHistoryPageSize(e.target.value === "all" ? "all" : Number(e.target.value));
                                    setHistoryPage(1);
                                }}
                                className="px-2 py-1 border border-gray-300 rounded-md text-xs bg-white text-gray-700 cursor-pointer"
                            >
                                <option value="25">25</option>
                                <option value="50">50</option>
                                <option value="100">100</option>
                                <option value="all">All ({itemLedgerData.length})</option>
                            </select>
                        </div>
                    </div>

                    {/* Movement Ledger Table */}
                    <div className="bg-white border border-gray-200 rounded-md overflow-hidden shadow-2xs">
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead className="bg-gray-50 border-b border-gray-200 text-gray-700">
                                    <tr>
                                        <Th>Date & Time</Th>
                                        <Th>Item & Category</Th>
                                        <Th>Movement Type</Th>
                                        <Th right>Qty Change</Th>
                                        <Th right>Balance After</Th>
                                        <Th>Department / Vendor</Th>
                                        <Th>Reference / Bill</Th>
                                        <Th right>Rate / Cost</Th>
                                        <Th>Remarks / Reason</Th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {paginatedHistoryData.map((log, index) => {
                                        const isPurchase = log.actionType === "purchase-entry" || log.actionType === "add";
                                        const isIssue = log.actionType === "issue_entry" || log.actionType === "distributed";
                                        const isReturn = log.actionType === "return";
                                        const isWastage = log.actionType === "wastage";
                                        const isAdjustment = log.actionType === "adjustment";

                                        return (
                                            <tr key={(log.dateEpoch || "") + index} className="hover:bg-gray-50/80 transition">
                                                <Td className="whitespace-nowrap font-medium text-gray-700">
                                                    {log.dateEpoch ? new Date(log.dateEpoch).toLocaleString("en-IN") : "—"}
                                                </Td>
                                                <Td>
                                                    <div className="font-bold text-gray-900">{log.itemName || "—"}</div>
                                                    <div className="text-[10px] text-gray-400">{log.category || "General"}</div>
                                                </Td>
                                                <Td>
                                                    {isPurchase && (
                                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                            PURCHASE (IN)
                                                        </span>
                                                    )}
                                                    {isIssue && (
                                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                                            ISSUE (OUT)
                                                        </span>
                                                    )}
                                                    {isReturn && (
                                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                                            RETURN (IN)
                                                        </span>
                                                    )}
                                                    {isAdjustment && (
                                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                                            ADJUSTMENT
                                                        </span>
                                                    )}
                                                    {isWastage && (
                                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                                            WASTE (OUT)
                                                        </span>
                                                    )}
                                                    {!isPurchase && !isIssue && !isReturn && !isAdjustment && !isWastage && (
                                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-700">
                                                            {(log.actionType || "LOG").toUpperCase()}
                                                        </span>
                                                    )}
                                                </Td>
                                                <Td right className="font-bold whitespace-nowrap">
                                                    {isPurchase || isReturn ? (
                                                        <span className="text-emerald-700">+{log.effectiveQty} {log.unit}</span>
                                                    ) : isIssue || isWastage ? (
                                                        <span className="text-rose-700">-{log.effectiveQty} {log.unit}</span>
                                                    ) : (
                                                        <span className="text-gray-900">{log.effectiveQty} {log.unit}</span>
                                                    )}
                                                </Td>
                                                <Td right className="font-bold text-gray-900 whitespace-nowrap">
                                                    {log.balanceAfter} <span className="text-[10px] font-normal text-gray-500">{log.unit}</span>
                                                </Td>
                                                <Td>
                                                    {isPurchase ? (
                                                        <span className="font-medium text-gray-800">{log.vendorName || "—"}</span>
                                                    ) : (
                                                        <span className="font-semibold text-blue-700">
                                                            {(log.department || "General").toUpperCase()}
                                                        </span>
                                                    )}
                                                </Td>
                                                <Td className="whitespace-nowrap text-gray-600">
                                                    {isPurchase ? (
                                                        <span>Bill: {log.billNo || "—"} {log.grnNo ? `(GRN: ${log.grnNo})` : ""}</span>
                                                    ) : log.issueDate ? (
                                                        <span>Date: {new Date(log.issueDate).toLocaleDateString("en-IN")}</span>
                                                    ) : (
                                                        <span>—</span>
                                                    )}
                                                </Td>
                                                <Td right className="whitespace-nowrap text-gray-700">
                                                    {log.price && Number(log.price) > 0 ? (
                                                        <div>
                                                            <div className="font-medium">₹{Number(log.price).toFixed(2)}</div>
                                                            <div className="text-[10px] text-gray-400">
                                                                Total: ₹{((Number(log.quantity) || 0) * (Number(log.price) || 0)).toFixed(2)}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span>—</span>
                                                    )}
                                                </Td>
                                                <Td className="text-gray-600 max-w-xs truncate">
                                                    {log.description || "—"}
                                                </Td>
                                            </tr>
                                        );
                                    })}
                                    {itemLedgerData.length === 0 && (
                                        <tr>
                                            <td colSpan="9" className="py-12 text-center text-gray-400">
                                                No movement records found for the selected criteria.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Footer */}
                        {itemLedgerData.length > 0 && historyPageSize !== "all" && (
                            <div className="bg-gray-50 border-t border-gray-200 px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-gray-600">
                                <div>
                                    Showing{" "}
                                    <span className="font-bold text-gray-900">
                                        {Math.min((historyPage - 1) * Number(historyPageSize) + 1, itemLedgerData.length)}
                                    </span>{" "}
                                    to{" "}
                                    <span className="font-bold text-gray-900">
                                        {Math.min(historyPage * Number(historyPageSize), itemLedgerData.length)}
                                    </span>{" "}
                                    of <span className="font-bold text-gray-900">{itemLedgerData.length}</span> total records
                                </div>

                                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                                    <button
                                        onClick={() => setHistoryPage(1)}
                                        disabled={historyPage === 1}
                                        className="px-2 py-1 border border-gray-300 rounded-md bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed text-xs transition cursor-pointer"
                                    >
                                        First
                                    </button>
                                    <button
                                        onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                                        disabled={historyPage === 1}
                                        className="px-2.5 py-1 border border-gray-300 rounded-md bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed text-xs transition cursor-pointer"
                                    >
                                        Prev
                                    </button>
                                    <span className="px-2 font-semibold text-gray-800">
                                        Page {historyPage} of {totalHistoryPages}
                                    </span>
                                    <button
                                        onClick={() => setHistoryPage((p) => Math.min(totalHistoryPages, p + 1))}
                                        disabled={historyPage === totalHistoryPages}
                                        className="px-2.5 py-1 border border-gray-300 rounded-md bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed text-xs transition cursor-pointer"
                                    >
                                        Next
                                    </button>
                                    <button
                                        onClick={() => setHistoryPage(totalHistoryPages)}
                                        disabled={historyPage === totalHistoryPages}
                                        className="px-2 py-1 border border-gray-300 rounded-md bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed text-xs transition cursor-pointer"
                                    >
                                        Last
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ═════════════════════════════════════════════════════════════════ */}
            {/* SECONDARY MODAL (Adjustment Only)                                  */}
            {/* ═════════════════════════════════════════════════════════════════ */}

            {/* ADJUSTMENT MODAL */}
            {showAdjustment && selectedItem && (
                <div className="fixed inset-0 bg-black/40 flex justify-center items-center p-3 z-50">
                    <div className="bg-white w-full max-w-sm border border-gray-200 rounded-md shadow-xl p-4 space-y-3 relative">
                        <button onClick={() => setShowAdjustment(false)} className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 cursor-pointer">
                            <X size={16} />
                        </button>
                        <h3 className="text-xs font-bold text-gray-900">Adjust Stock for {selectedItem.itemName}</h3>
                        <p className="text-[11px] text-gray-500">
                            Current Stock: <b>{selectedItem.quantity} {selectedItem.unit}</b>
                        </p>

                        <select
                            value={adjustmentForm.adjustmentType}
                            onChange={(e) => setAdjustmentForm({ ...adjustmentForm, adjustmentType: e.target.value, newQuantity: "" })}
                            className="w-full p-2 border border-gray-300 rounded-md text-xs bg-white"
                        >
                            <option value="adjustment">Stock Count Adjustment (Direct set)</option>
                            <option value="wastage">Waste / Damaged (Deduct)</option>
                            <option value="return">Return to Store (Add)</option>
                        </select>

                        <Input
                            type="number"
                            placeholder="Quantity"
                            value={adjustmentForm.newQuantity}
                            onChange={(e) => setAdjustmentForm({ ...adjustmentForm, newQuantity: e.target.value })}
                        />

                        <Input
                            placeholder="Reason for adjustment"
                            value={adjustmentForm.description}
                            onChange={(e) => setAdjustmentForm({ ...adjustmentForm, description: e.target.value })}
                        />

                        <button
                            onClick={submitAdjustment}
                            disabled={loadingAdjustment}
                            className="w-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold py-2 rounded-md transition disabled:opacity-50 cursor-pointer"
                        >
                            {loadingAdjustment && <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white inline-block mr-1"></div>}
                            Save Adjustment
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

const Th = ({ children, right }) => (
    <th className={`p-2.5 text-[10px] text-gray-600 font-bold uppercase tracking-wider ${right ? "text-right" : "text-left"}`}>
        {children}
    </th>
);

const Td = ({ children, right, className = "" }) => (
    <td className={`p-2.5 ${right ? "text-right" : "text-left"} ${className}`}>{children}</td>
);