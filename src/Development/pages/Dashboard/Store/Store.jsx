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

    // Active Section Tab: "inventory" | "purchase_section" | "issue_section" | "par_levels"
    const [activeTab, setActiveTab] = useState("inventory");

    const [stockHistory, setStockHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState("");
    const [purchaseSearch, setPurchaseSearch] = useState("");
    const [issueSearch, setIssueSearch] = useState("");
    const [issueDeptFilter, setIssueDeptFilter] = useState("ALL");

    // Inline Add Item Toggle (no modal)
    const [showInlineAddItem, setShowInlineAddItem] = useState(false);

    // Modals reserved only for secondary inspections (History / Adjustment)
    const [showHistory, setShowHistory] = useState(false);
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
            const { body } = await get({
                apiName: "frontdesk",
                path: `/stock?institutionId=${institutionId}`,
            }).response;
            const response = await body.json();

            if (response?.success && Array.isArray(response.stockHistory)) {
                setStockHistory(response.stockHistory);
            } else {
                setStockHistory([]);
            }
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
                                                                setShowHistory(true);
                                                            }}
                                                            className="px-2 py-1 bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 rounded-md font-bold text-[10px] flex items-center gap-1 transition"
                                                            title="History"
                                                        >
                                                            <Eye size={11} /> History
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
            {/* SECONDARY MODALS (History and Adjustment)                        */}
            {/* ═════════════════════════════════════════════════════════════════ */}

            {/* ADJUSTMENT MODAL */}
            {showAdjustment && selectedItem && (
                <div className="fixed inset-0 bg-black/40 flex justify-center items-center p-3 z-50">
                    <div className="bg-white w-full max-w-sm border border-gray-200 rounded-md shadow-xl p-4 space-y-3 relative">
                        <button onClick={() => setShowAdjustment(false)} className="absolute top-3 right-3 text-gray-400 hover:text-gray-700">
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
                            className="w-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold py-2 rounded-md transition disabled:opacity-50"
                        >
                            {loadingAdjustment && <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white inline-block mr-1"></div>}
                            Save Adjustment
                        </button>
                    </div>
                </div>
            )}

            {/* HISTORY MODAL */}
            {showHistory && selectedItem && (
                <div className="fixed inset-0 bg-black/40 flex justify-center items-center p-3 z-50">
                    <div className="bg-white w-full max-w-2xl border border-gray-200 rounded-md shadow-xl p-4 space-y-3 relative max-h-[85vh] flex flex-col">
                        <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                            <h3 className="text-xs font-bold text-gray-900">
                                {selectedItem.itemName} Movement Ledger
                            </h3>
                            <button onClick={() => setShowHistory(false)} className="text-gray-400 hover:text-gray-700">
                                <X size={16} />
                            </button>
                        </div>

                        <div className="overflow-y-auto flex-1">
                            <table className="w-full text-xs">
                                <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <Th>Date</Th>
                                        <Th>Action</Th>
                                        <Th>Qty</Th>
                                        <Th>Details / Department</Th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stockHistory
                                        .filter((log) => log.itemName === selectedItem.itemName)
                                        .sort((a, b) => (b.dateEpoch || 0) - (a.dateEpoch || 0))
                                        .map((log, index) => (
                                            <tr key={(log.dateEpoch || "") + index} className="border-b border-gray-100 hover:bg-gray-50">
                                                <Td>{new Date(log.dateEpoch).toLocaleString("en-IN")}</Td>
                                                <Td>
                                                    <span className="font-bold text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-800">
                                                        {(log.actionType || "").toUpperCase()}
                                                    </span>
                                                </Td>
                                                <Td className="font-bold">
                                                    {log.actionType === "wastage" ||
                                                    log.actionType === "adjustment" ||
                                                    log.actionType === "return" ||
                                                    log.actionType === "issue_entry"
                                                        ? log.adjustmentQuantity
                                                        : log.quantity}{" "}
                                                    {log.unit}
                                                </Td>
                                                <Td>
                                                    {log.actionType === "purchase-entry"
                                                        ? `Purchase from ${log.vendorName || "Vendor"} (Bill: ${log.billNo || "—"})`
                                                        : log.actionType === "issue_entry"
                                                        ? `Issued to ${log.department || "Dept"} on ${
                                                              log.issueDate ? new Date(log.issueDate).toLocaleDateString("en-IN") : ""
                                                          }`
                                                        : log.description || "—"}
                                                </Td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
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