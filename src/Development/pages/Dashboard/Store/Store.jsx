import { useState, useMemo, useEffect } from "react";
import {
    Plus,
    Package,
    Search,
    X,
    Eye,
    Edit,
} from "lucide-react";
import { get, post } from "aws-amplify/api";
import { useAuthContext } from "../../../context/AuthContext";

/* ----------------------- AUTOCOMPLETE INPUT ------------------------ */

function AutoCompleteInput({ label, value, onChange, suggestions }) {
    const [focused, setFocused] = useState(false);

    const filtered =
        focused
            ? suggestions.filter((s) =>
                s.toLowerCase().includes(value.toLowerCase())
            )
            : [];

    return (
        <div className="relative w-full">
            <input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={label}
                onFocus={() => setFocused(true)}
                onBlur={() => setTimeout(() => setFocused(false), 200)}
                className="w-full p-2 border border-gray-300 rounded-md text-sm bg-white 
        focus:outline-none focus:ring-1 focus:ring-gray-400"
            />

            {focused && filtered.length > 0 && (
                <div className="absolute left-0 right-0 bg-white border border-gray-300 
          rounded-md mt-1 shadow-lg max-h-40 overflow-auto z-20">
                    {filtered.map((text, index) => (
                        <div
                            key={index}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                onChange(text);
                                setFocused(false);
                            }}
                            className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer"
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
        className="w-full p-2 border border-gray-300 rounded-md text-sm bg-white 
    focus:outline-none focus:ring-1 focus:ring-gray-400"
    />
);

/* ---------------------------------------------------------------------- */
/* 🔥   MAIN STARTS HERE — ONLY STOCK TABLE IS USED                      */
/* ---------------------------------------------------------------------- */

export default function Store() {
    const { userData } = useAuthContext();
    const institutionId = userData?.institutionId;

    const [stockHistory, setStockHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState("");
    const [purchaseSearch, setPurchaseSearch] = useState("");

    const [showAddItem, setShowAddItem] = useState(false);
    const [showStock, setShowStock] = useState(false);
    const [showPurchaseEntry, setShowPurchaseEntry] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [showAdjustment, setShowAdjustment] = useState(false);

    const [loadingAddItem, setLoadingAddItem] = useState(false);
    const [loadingStockChange, setLoadingStockChange] = useState(false);
    const [loadingPurchaseEntry, setLoadingPurchaseEntry] = useState(false);
    const [loadingAdjustment, setLoadingAdjustment] = useState(false);

    const [selectedItem, setSelectedItem] = useState(null);

    const [form, setForm] = useState({
        name: "",
        category: "",
        unit: "pcs",
    });

    const [stockForm, setStockForm] = useState({
        quantity: "",
        description: "",
        action: "add",
        department: "",
        issueDate: "",
    });

    const [adjustmentForm, setAdjustmentForm] = useState({
        newQuantity: "",
        description: "",
        adjustmentType: "adjustment",
    });

    const [purchaseForm, setPurchaseForm] = useState({
        grnNo: "",
        billNo: "",
        billDate: "",
        vendorName: "",
        itemName: "",
        quantity: "",
        price: "",
        unit: "pcs",
        category: "",
        purchaseType: "",
    });

    /* ----------------------- FETCH STOCK HISTORY ------------------------ */

    useEffect(() => {
        if (institutionId) {
            fetchStockHistory();
        }
    }, [institutionId]);

    const fetchStockHistory = async () => {
        try {
            setLoading(true);
            const { body } = await get({
                apiName: "frontdesk",
                path: `/stock?institutionId=${institutionId}`,
            }).response;
            const response = await body.json();

            console.log("API Response:", response);

            // Extract stockHistory from the response
            if (response?.success && Array.isArray(response.stockHistory)) {
                setStockHistory(response.stockHistory);
                console.log("Loaded stock items:", response.count);
            } else {
                console.warn("Unexpected response format, setting empty array");
                setStockHistory([]);
            }
        } catch (error) {
            console.error("Error fetching stock history:", error);
            setStockHistory([]); // Set empty array on error
            alert("Failed to load stock history");
        } finally {
            setLoading(false);
        }
    };

    /* ----------------------- DERIVED ITEMS FROM STOCK HISTORY ------------------------ */

    const items = useMemo(() => {
        const map = {};

        stockHistory.sort((a, b) => a.dateEpoch - b.dateEpoch);

        if (Array.isArray(stockHistory)) {
            stockHistory.forEach((entry) => {
                const key = entry.itemName + "_" + entry.unit + "_" + entry.category;

                if (!map[key]) {
                    map[key] = {
                        itemName: entry.itemName,
                        category: entry.category,
                        unit: entry.unit,
                        quantity: 0,
                    };
                }

                console.log(map[key]);

                if (entry.actionType === "add") map[key].quantity += entry.quantity;
                if (entry.actionType === "distributed") map[key].quantity -= entry.quantity;
                if (entry.actionType === "issue_entry") map[key].quantity -= entry.quantity;
                if (entry.actionType === "purchase-entry") map[key].quantity += entry.quantity;
                if (entry.actionType === "adjustment") map[key].quantity = entry.quantity;
                if (entry.actionType === "wastage") map[key].quantity = entry.quantity;
                if (entry.actionType === "return") map[key].quantity = entry.quantity;
            });
        }

        return Object.values(map);
    }, [stockHistory]);

    
    

    /* ----------------------- SUGGESTIONS ------------------------ */

    const itemSuggestions = Array.isArray(stockHistory)
        ? [...new Set(stockHistory.map((e) => e.itemName))]
        : [];
    const catSuggestions = Array.isArray(stockHistory)
        ? [...new Set(stockHistory.map((e) => e.category))]
        : [];
    const unitSuggestions = [...new Set(["pcs", "kg", "litre"])];
    const vendorSuggestions = Array.isArray(stockHistory)
        ? [...new Set(stockHistory.map((e) => e.vendorName).filter(Boolean))]
        : [];
    const departmentSuggestions = Array.isArray(stockHistory)
        ? [...new Set(stockHistory.map((e) => e.department).filter(Boolean))]
        : [];

    /* ----------------------- GENERATE NEXT GRN NUMBER ------------------------ */

    const getNextGrnNo = () => {
        if (!Array.isArray(stockHistory) || stockHistory.length === 0) return "001";

        const purchaseEntries = stockHistory.filter((e) => e.actionType === "purchase-entry");
        const nextNumber = purchaseEntries.length + 1;
        return `${String(nextNumber).padStart(3, "0")}`;
    };

    const handleItemNameChange = (v) => {
        const matchingEntry = stockHistory.find(entry => entry.itemName === v);
        if (matchingEntry) {
            setPurchaseForm({
                ...purchaseForm,
                itemName: v,
                category: matchingEntry.category,
                unit: matchingEntry.unit,
            });
        } else {
            setPurchaseForm({ ...purchaseForm, itemName: v });
        }
    };

    const filtered = items.filter(
        (i) =>
            i.itemName.toLowerCase().includes(search.toLowerCase()) ||
            i.category.toLowerCase().includes(search.toLowerCase())
    );

    /* ----------------------- HANDLERS ------------------------ */

    const addNewItem = async () => {
        if (!form.name || !form.category || !form.unit)
            return alert("Fill all fields");

        setLoadingAddItem(true);
        try {
            await post({
                apiName: "frontdesk",
                path: `/stock?institutionId=${institutionId}`,
                options: {
                    body: {
                        itemName: form.name,
                        category: form.category,
                        unit: form.unit,
                        quantity: 0,
                        actionType: "create-item",
                        description: "Item created",
                    },
                },
            }).response;

            setForm({ name: "", category: "", unit: "pcs" });
            setShowAddItem(false);
            await fetchStockHistory(); // Refresh the list
        } catch (error) {
            console.error("Error creating item:", error);
            alert("Failed to create item");
        } finally {
            setLoadingAddItem(false);
        }
    };

    const openStockModal = (item) => {
        setSelectedItem(item);
        setStockForm({ quantity: "", description: "", action: "add", department: "", issueDate: "" });
        setShowStock(true);
    };

    const viewHistory = (item) => {
        setSelectedItem(item);
        setShowHistory(true);
    };

    const openAdjustmentModal = (item) => {
        setSelectedItem(item);
        setAdjustmentForm({ newQuantity: "", description: "", adjustmentType: "adjustment" });
        setShowAdjustment(true);
    };

    const openPurchaseModal = () => {
        const nextGrn = getNextGrnNo();
        setPurchaseForm({
            grnNo: nextGrn,
            billNo: "",
            billDate: "",
            vendorName: "",
            itemName: "",
            quantity: "",
            price: "",
            unit: "pcs",
            category: "",
            purchaseType: "",
        });
        setShowPurchaseEntry(true);
    };

    const applyStockChange = async () => {
        if (!stockForm.quantity) return alert("enter qty");

        const qty = parseInt(stockForm.quantity);

        if (stockForm.action === "issue_entry") {
            if (qty > selectedItem.quantity) return alert("Not enough stock");
            if (!stockForm.department) return alert("Enter department");
            if (!stockForm.issueDate) return alert("Enter issue date");
        }

        setLoadingStockChange(true);
        try {
            const body = {
                itemName: selectedItem.itemName,
                category: selectedItem.category,
                unit: selectedItem.unit,
                quantity: qty,
                actionType: stockForm.action, // add or issue_entry
                description: stockForm.description,
            };

            // Add issue entry specific fields
            if (stockForm.action === "issue_entry") {
                body.department = stockForm.department;
                body.issueDate = new Date(stockForm.issueDate).getTime();
                body.adjustmentQuantity = qty;
            }

            await post({
                apiName: "frontdesk",
                path: `/stock?institutionId=${institutionId}`,
                options: { body },
            }).response;

            setShowStock(false);
            await fetchStockHistory(); // Refresh the list
        } catch (error) {
            console.error("Error updating stock:", error);
            alert("Failed to update stock");
        } finally {
            setLoadingStockChange(false);
        }
    };

    const submitAdjustment = async () => {
        if (!adjustmentForm.newQuantity) return alert("Enter quantity");

        const inputQty = parseInt(adjustmentForm.newQuantity);
        if (inputQty < 0) return alert("Quantity cannot be negative");

        let finalQty;
        if (adjustmentForm.adjustmentType === "wastage") {
            finalQty = selectedItem.quantity - inputQty;
            if (finalQty < 0) return alert("Waste quantity exceeds current stock");
        } else if (adjustmentForm.adjustmentType === "return") {
            finalQty = selectedItem.quantity + inputQty;
        } else {
            // adjustment - set directly to the specified value
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
            await fetchStockHistory(); // Refresh the list
        } catch (error) {
            console.error("Error adjusting stock:", error);
            alert("Failed to adjust stock");
        } finally {
            setLoadingAdjustment(false);
        }
    };

    const submitPurchaseEntry = async () => {
        if (
            !purchaseForm.billNo ||
            !purchaseForm.billDate ||
            !purchaseForm.vendorName ||
            !purchaseForm.itemName ||
            !purchaseForm.quantity ||
            !purchaseForm.price ||
            !purchaseForm.unit ||
            !purchaseForm.category
        ) {
            return alert("Please fill all required fields");
        }

        setLoadingPurchaseEntry(true);
        try {
            const billDateEpoch = new Date(purchaseForm.billDate).getTime();

            await post({
                apiName: "frontdesk",
                path: `/stock?institutionId=${institutionId}`,
                options: {
                    body: {
                        grnNo: purchaseForm.grnNo,
                        billNo: purchaseForm.billNo,
                        billDate: billDateEpoch,
                        vendorName: purchaseForm.vendorName,
                        itemName: purchaseForm.itemName,
                        quantity: parseInt(purchaseForm.quantity),
                        price: parseFloat(purchaseForm.price),
                        unit: purchaseForm.unit,
                        category: purchaseForm.category,
                        purchaseType: purchaseForm.purchaseType || "Standard",
                        actionType: "purchase-entry",
                    },
                },
            }).response;

            setShowPurchaseEntry(false);
            await fetchStockHistory(); // Refresh the list
        } catch (error) {
            console.error("Error submitting purchase entry:", error);
            alert("Failed to submit purchase entry");
        } finally {
            setLoadingPurchaseEntry(false);
        }
    };

    /* ----------------------- UI ------------------------ */

    if (loading) {
        return (
            <div className="h-[calc(100vh-70px)] bg-[#f7f7f7] p-6 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading stock data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-70px)] bg-[#f7f7f7] p-6">
            <div className="max-w-7xl mx-auto space-y-4">

                {/* HEADER */}
                <div className="flex justify-between items-center">
                    <h1 className="text-xl font-semibold text-gray-900">
                        Store Management
                    </h1>
                </div>

                {/* TWO COLUMN LAYOUT */}
                <div className="grid grid-cols-2 gap-6">

                    {/* LEFT SECTION - STORE INVENTORY */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-semibold text-gray-900">Store Inventory</h2>
                            <button
                                onClick={() => setShowAddItem(true)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-md hover:bg-black transition"
                            >
                                <Plus size={14} /> Add Item
                            </button>
                        </div>

                        <div className="relative">
                            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search items..."
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded bg-white shadow-sm text-sm"
                            />
                        </div>

                        <ItemsPage
                            filtered={filtered}
                            openStockModal={openStockModal}
                            viewHistory={viewHistory}
                            openAdjustmentModal={openAdjustmentModal}
                        />
                    </div>

                    {/* RIGHT SECTION - PURCHASE ENTRY RECORDS */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-semibold text-gray-900">Purchase Entry Records</h2>
                            <button
                                onClick={openPurchaseModal}
                                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition"
                            >
                                <Plus size={14} /> Purchase Entry
                            </button>
                        </div>

                        <div className="relative">
                            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                            <input
                                value={purchaseSearch}
                                onChange={(e) => setPurchaseSearch(e.target.value)}
                                placeholder="Search purchase records..."
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded bg-white shadow-sm text-sm"
                            />
                        </div>

                        <PurchaseRecordsTable stockHistory={stockHistory} searchTerm={purchaseSearch} />
                    </div>

                </div>
            </div>

            {/* ADD ITEM MODAL */}
            {showAddItem && (
                <Modal title="Add New Item" onClose={() => setShowAddItem(false)}>
                    <div className="space-y-3">

                        <AutoCompleteInput
                            label="Item Name"
                            value={form.name}
                            suggestions={itemSuggestions}
                            onChange={(v) => setForm({ ...form, name: v })}
                        />

                        <AutoCompleteInput
                            label="Category"
                            value={form.category}
                            suggestions={catSuggestions}
                            onChange={(v) => setForm({ ...form, category: v })}
                        />

                        <AutoCompleteInput
                            label="Unit"
                            value={form.unit}
                            suggestions={unitSuggestions}
                            onChange={(v) => setForm({ ...form, unit: v })}
                        />

                        <button
                            onClick={addNewItem}
                            disabled={loadingAddItem}
                            className="w-full bg-gray-900 text-white py-2 rounded flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loadingAddItem && (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            )}
                            Create Item
                        </button>
                    </div>
                </Modal>
            )}

            {/* STOCK MODAL */}
            {showStock && (
                <Modal title="Update Stock" onClose={() => setShowStock(false)}>
                    <div className="space-y-3">

                        <p className="text-sm text-gray-600">
                            {selectedItem.itemName} (Current: {selectedItem.quantity}{" "}
                            {selectedItem.unit})
                        </p>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setStockForm({ ...stockForm, action: "add" })}
                                className={`flex-1 py-2 border rounded ${stockForm.action === "add"
                                    ? "bg-green-600 text-white"
                                    : "bg-gray-100"
                                    }`}
                            >
                                Add
                            </button>

                            <button
                                onClick={() =>
                                    setStockForm({ ...stockForm, action: "issue_entry" })
                                }
                                className={`flex-1 py-2 border rounded ${stockForm.action === "issue_entry"
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-100"
                                    }`}
                            >
                                Issue Entry
                            </button>
                        </div>

                        <Input
                            type="number"
                            placeholder="Quantity"
                            value={stockForm.quantity}
                            onChange={(e) =>
                                setStockForm({ ...stockForm, quantity: e.target.value })
                            }
                        />

                        {stockForm.action === "issue_entry" && (
                            <>
                                <AutoCompleteInput
                                    label="Department"
                                    value={stockForm.department}
                                    suggestions={departmentSuggestions}
                                    onChange={(v) => setStockForm({ ...stockForm, department: v })}
                                />

                                <Input
                                    type="date"
                                    placeholder="Issue Date"
                                    value={stockForm.issueDate}
                                    onChange={(e) =>
                                        setStockForm({ ...stockForm, issueDate: e.target.value })
                                    }
                                />
                            </>
                        )}

                        <Input
                            placeholder="Description"
                            value={stockForm.description}
                            onChange={(e) =>
                                setStockForm({ ...stockForm, description: e.target.value })
                            }
                        />

                        <button
                            onClick={applyStockChange}
                            disabled={loadingStockChange}
                            className="w-full bg-gray-900 text-white py-2 rounded flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loadingStockChange && (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            )}
                            Apply
                        </button>
                    </div>
                </Modal>
            )}

            {/* PURCHASE ENTRY MODAL */}
            {showPurchaseEntry && (
                <Modal title="Purchase Entry" onClose={() => setShowPurchaseEntry(false)} large>
                    <div className="space-y-3">

                        <div className="bg-blue-50 p-3 rounded border border-blue-200">
                            <p className="text-sm font-semibold text-blue-900">
                                GRN No: {purchaseForm.grnNo}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <Input
                                placeholder="Bill No *"
                                value={purchaseForm.billNo}
                                onChange={(e) =>
                                    setPurchaseForm({ ...purchaseForm, billNo: e.target.value })
                                }
                            />

                            <Input
                                type="date"
                                placeholder="Bill Date *"
                                value={purchaseForm.billDate}
                                onChange={(e) =>
                                    setPurchaseForm({ ...purchaseForm, billDate: e.target.value })
                                }
                            />
                        </div>

                        <AutoCompleteInput
                            label="Vendor Name *"
                            value={purchaseForm.vendorName}
                            suggestions={vendorSuggestions}
                            onChange={(v) => setPurchaseForm({ ...purchaseForm, vendorName: v })}
                        />

                        <AutoCompleteInput
                            label="Item Name *"
                            value={purchaseForm.itemName}
                            suggestions={itemSuggestions}
                            onChange={handleItemNameChange}
                        />

                        <AutoCompleteInput
                            label="Category *"
                            value={purchaseForm.category}
                            suggestions={catSuggestions}
                            onChange={(v) => setPurchaseForm({ ...purchaseForm, category: v })}
                        />

                        <div className="grid grid-cols-3 gap-3">
                            <Input
                                type="number"
                                placeholder="Quantity *"
                                value={purchaseForm.quantity}
                                onChange={(e) =>
                                    setPurchaseForm({ ...purchaseForm, quantity: e.target.value })
                                }
                            />

                            <AutoCompleteInput
                                label="Unit *"
                                value={purchaseForm.unit}
                                suggestions={unitSuggestions}
                                onChange={(v) => setPurchaseForm({ ...purchaseForm, unit: v })}
                            />

                            <Input
                                type="number"
                                step="0.01"
                                placeholder="Price (per unit) *"
                                value={purchaseForm.price}
                                onChange={(e) =>
                                    setPurchaseForm({ ...purchaseForm, price: e.target.value })
                                }
                            />
                        </div>

                        <Input
                            placeholder="Purchase Type (optional)"
                            value={purchaseForm.purchaseType}
                            onChange={(e) =>
                                setPurchaseForm({ ...purchaseForm, purchaseType: e.target.value })
                            }
                        />

                        <button
                            onClick={submitPurchaseEntry}
                            disabled={loadingPurchaseEntry}
                            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loadingPurchaseEntry && (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            )}
                            Submit Purchase Entry
                        </button>
                    </div>
                </Modal>
            )}

            {/* ADJUSTMENT MODAL */}
            {showAdjustment && (
                <Modal title="Adjust Stock" onClose={() => setShowAdjustment(false)}>
                    <div className="space-y-3">

                        <p className="text-sm text-gray-600">
                            {selectedItem.itemName} (Current: {selectedItem.quantity}{" "}
                            {selectedItem.unit})
                        </p>

                        <select
                            value={adjustmentForm.adjustmentType}
                            onChange={(e) =>
                                setAdjustmentForm({ ...adjustmentForm, adjustmentType: e.target.value, newQuantity: "" })
                            }
                            className="w-full p-2 border border-gray-300 rounded-md text-sm bg-white 
                            focus:outline-none focus:ring-1 focus:ring-gray-400"
                        >
                            <option value="adjustment">Adjustment</option>
                            <option value="wastage">Waste</option>
                            <option value="return">Return</option>
                        </select>

                        <Input
                            type="number"
                            placeholder={
                                adjustmentForm.adjustmentType === "wastage" 
                                    ? "Quantity to waste" 
                                    : adjustmentForm.adjustmentType === "return" 
                                    ? "Quantity to return" 
                                    : "New stock quantity"
                            }
                            value={adjustmentForm.newQuantity}
                            onChange={(e) =>
                                setAdjustmentForm({ ...adjustmentForm, newQuantity: e.target.value })
                            }
                        />

                        {adjustmentForm.adjustmentType === "wastage" && adjustmentForm.newQuantity && (
                            <p className="text-xs text-red-600">
                                New stock: {selectedItem.quantity - parseInt(adjustmentForm.newQuantity || 0)} {selectedItem.unit}
                            </p>
                        )}

                        {adjustmentForm.adjustmentType === "return" && adjustmentForm.newQuantity && (
                            <p className="text-xs text-green-600">
                                New stock: {selectedItem.quantity + parseInt(adjustmentForm.newQuantity || 0)} {selectedItem.unit}
                            </p>
                        )}

                        <Input
                            placeholder="Reason for adjustment"
                            value={adjustmentForm.description}
                            onChange={(e) =>
                                setAdjustmentForm({ ...adjustmentForm, description: e.target.value })
                            }
                        />

                        <button
                            onClick={submitAdjustment}
                            disabled={loadingAdjustment}
                            className="w-full bg-orange-600 text-white py-2 rounded hover:bg-orange-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loadingAdjustment && (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            )}
                            Adjust Stock
                        </button>
                    </div>
                </Modal>
            )}

            {/* HISTORY MODAL */}
            {showHistory && selectedItem && (
                <Modal title={`${selectedItem.itemName} History`} onClose={() => setShowHistory(false)} large>
                    <HistoryPage selectedItem={selectedItem} stockHistory={stockHistory} />
                </Modal>
            )}
        </div>
    );
}

/* ----------------------- ITEMS PAGE TABLE ------------------------ */

function ItemsPage({ filtered, openStockModal, viewHistory, openAdjustmentModal }) {
    return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden h-[calc(100vh-300px)] overflow-y-auto">
            <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-50">
                    <tr className="border-b">
                        <Th>Item</Th>
                        <Th>Category</Th>
                        <Th>Qty</Th>
                        <Th>Unit</Th>
                        <Th right>Actions</Th>
                    </tr>
                </thead>

                <tbody>
                    {filtered.map((item, idx) => (
                        <tr key={item.itemName + idx} className="border-b hover:bg-gray-50">
                            <Td>{item.itemName}</Td>
                            <Td>{item.category}</Td>
                            <Td>{item.quantity}</Td>
                            <Td>{item.unit}</Td>

                            <Td right>
                                <div className="flex gap-3 justify-end">
                                    <IconBtn
                                        onClick={() => viewHistory(item)}
                                        icon={<Eye size={16} className="text-blue-600" />}
                                    />
                                    <IconBtn
                                        onClick={() => openAdjustmentModal(item)}
                                        icon={<Edit size={16} className="text-orange-600" />}
                                    />
                                    <IconBtn
                                        onClick={() => openStockModal(item)}
                                        icon={<Package size={16} className="text-green-600" />}
                                    />
                                </div>
                            </Td>
                        </tr>
                    ))}

                    {filtered.length === 0 && (
                        <tr>
                            <td colSpan="5" className="py-10 text-center text-gray-500">
                                No items found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

/* ----------------------- HISTORY PAGE ------------------------ */

function HistoryPage({ selectedItem, stockHistory }) {
    const logs = stockHistory
        .filter((log) => log.itemName === selectedItem.itemName)
        .sort((a, b) => b.dateEpoch - a.dateEpoch);

    return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-2 max-h-96 overflow-y-auto">

            <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                    <tr>
                        <Th>Date</Th>
                        <Th>Action</Th>
                        <Th>Qty</Th>
                        <Th>Description</Th>
                    </tr>
                </thead>

                <tbody>
                    {logs.map((log) => (
                        <tr key={log.dateEpoch} className="border-b hover:bg-gray-50">
                            <Td>{new Date(log.dateEpoch).toLocaleString()}</Td>

                            <Td>
                                <span
                                    className={`px-2 py-1 text-xs rounded ${log.actionType === "add"
                                        ? "bg-green-100 text-green-700"
                                        : log.actionType === "distributed"
                                            ? "bg-blue-100 text-blue-700"
                                            : log.actionType === "issue_entry"
                                                ? "bg-blue-100 text-blue-700"
                                                : log.actionType === "purchase-entry"
                                                    ? "bg-purple-100 text-purple-700"
                                                    : log.actionType === "adjustment"
                                                        ? "bg-orange-100 text-orange-700"
                                                        : log.actionType === "wastage"
                                                            ? "bg-red-100 text-red-700"
                                                            : log.actionType === "return"
                                                                ? "bg-teal-100 text-teal-700"
                                                                : "bg-gray-200"
                                        }`}
                                >
                                    {log.actionType === "distributed" ? "DISTRIBUTED" : log.actionType === "issue_entry" ? "ISSUE ENTRY" : log.actionType === "add" ? "ADD" : log.actionType === "purchase-entry" ? "PURCHASE" : log.actionType === "adjustment" ? "ADJUSTMENT" : log.actionType === "wastage" ? "WASTE" : log.actionType === "return" ? "RETURN" : "CREATE"}
                                </span>
                            </Td>

                            <Td>{log.actionType === 'wastage' || log.actionType === 'adjustment' || log.actionType === 'return' || log.actionType === 'issue_entry' ? log.adjustmentQuantity : log.quantity} {log.unit}</Td>

                            <Td>{log.actionType === 'purchase-entry' ? "Purchase from " + log.vendorName : log.actionType === 'issue_entry' ? `Issued to ${log.department} on ${new Date(log.issueDate).toLocaleDateString('en-GB')}` : log.description || "-"}</Td>
                        </tr>
                    ))}

                    {logs.length === 0 && (
                        <tr>
                            <td colSpan="4" className="py-10 text-center text-gray-500">
                                No history available.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

function PurchaseRecordsTable({ stockHistory, searchTerm }) {
    const purchaseRecords = stockHistory
        .filter((log) => log.actionType === "purchase-entry")
        .filter((record) => {
            if (!searchTerm) return true;
            const searchLower = searchTerm.toLowerCase();
            return (
                record.grnNo?.toLowerCase().includes(searchLower) ||
                record.billNo?.toLowerCase().includes(searchLower) ||
                record.vendorName?.toLowerCase().includes(searchLower) ||
                record.itemName?.toLowerCase().includes(searchLower) ||
                record.purchaseType?.toLowerCase().includes(searchLower)
            );
        })
        .sort((a, b) => b.billDate - a.billDate);

    return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden h-[calc(100vh-300px)] overflow-y-auto">
            <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-50">
                    <tr className="border-b">
                        <Th>GRN No</Th>
                        <Th>Bill No</Th>
                        <Th>Date</Th>
                        <Th>Vendor</Th>
                        <Th>Item</Th>
                        <Th>Qty</Th>
                        <Th>Rate</Th>
                        <Th>Total</Th>
                    </tr>
                </thead>

                <tbody>
                    {purchaseRecords.map((record, idx) => (
                        <tr key={record.grnNo + idx} className="border-b hover:bg-gray-50">
                            <Td>
                                <span className="text-xs font-mono bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                    {record.grnNo}
                                </span>
                            </Td>
                            <Td>{record.billNo}</Td>
                            <Td className="text-xs">{new Date(record.billDate).toLocaleDateString()}</Td>
                            <Td>{record.vendorName}</Td>
                            <Td>{record.itemName}</Td>
                            <Td>{record.quantity}</Td>
                            <Td>₹{record.price?.toFixed(2)}</Td>
                            <Td className="font-semibold">₹{(record.quantity * record.price).toFixed(2)}</Td>
                        </tr>
                    ))}

                    {purchaseRecords.length === 0 && (
                        <tr>
                            <td colSpan="8" className="py-10 text-center text-gray-500">
                                No purchase records found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

/* ----------------------- UI BASE COMPONENTS ------------------------ */

const Th = ({ children, right }) => (
    <th
        className={`p-3 text-xs text-gray-600 font-medium ${right ? "text-right" : "text-left"
            }`}
    >
        {children}
    </th>
);

const Td = ({ children, right }) => (
    <td className={`p-3 ${right ? "text-right" : "text-left"}`}>{children}</td>
);

const IconBtn = ({ onClick, icon }) => (
    <button
        onClick={onClick}
        className="p-2 border border-gray-300 rounded hover:bg-gray-200 transition"
    >
        {icon}
    </button>
);

/* ----------------------- MODAL ------------------------ */

function Modal({ title, children, onClose, large }) {
    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/30 flex justify-center items-center p-4 z-50" onClick={handleBackdropClick}>
            <div className={`bg-white ${large ? 'w-[800px]' : 'w-96'} border border-gray-200 rounded-lg shadow-xl p-5 relative`}>
                <button onClick={onClose} className="absolute top-3 right-3">
                    <X size={18} />
                </button>
                <h2 className="text-lg font-semibold mb-4">{title}</h2>
                {children}
            </div>
        </div>
    );
}
