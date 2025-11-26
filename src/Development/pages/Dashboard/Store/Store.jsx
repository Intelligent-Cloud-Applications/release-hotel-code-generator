import { useState, useMemo, useEffect } from "react";
import {
    Plus,
    Package,
    Search,
    X,
    Eye,
    Trash2,
} from "lucide-react";
import { get, post, del } from "aws-amplify/api";
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
                onBlur={() => setTimeout(() => setFocused(false), 150)}
                className="w-full p-2 border border-gray-300 rounded-md text-sm bg-white 
        focus:outline-none focus:ring-1 focus:ring-gray-400"
            />

            {focused && filtered.length > 0 && (
                <div className="absolute left-0 right-0 bg-white border border-gray-300 
          rounded-md mt-1 shadow-lg max-h-40 overflow-auto z-20">
                    {filtered.map((text, index) => (
                        <div
                            key={index}
                            onClick={() => {
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
    const [actionLoading, setActionLoading] = useState(false);

    const [search, setSearch] = useState("");

    const [showAddItem, setShowAddItem] = useState(false);
    const [showStock, setShowStock] = useState(false);

    const [page, setPage] = useState("items"); // items | history

    const [selectedItem, setSelectedItem] = useState(null);

    const [form, setForm] = useState({
        name: "",
        category: "",
        unit: "",
        price: "",
    });

    const [stockForm, setStockForm] = useState({
        quantity: "",
        description: "",
        action: "add",
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

        if (Array.isArray(stockHistory)) {
            // Sort to process create-item first to ensure price is set
            const sorted = [...stockHistory].sort((a, b) => {
                if (a.actionType === "create-item") return -1;
                if (b.actionType === "create-item") return 1;
                return 0;
            });

            sorted.forEach((entry) => {
                const key = entry.itemName + "_" + entry.unit + "_" + entry.category;

                if (!map[key]) {
                    map[key] = {
                        itemName: entry.itemName,
                        category: entry.category,
                        unit: entry.unit,
                        quantity: 0,
                        price: 0, // Initialize unit price
                    };
                }

                // Update price if this entry has a non-zero price (from create-item)
                if (entry.price && entry.price > 0 && entry.actionType === "create-item") {
                    map[key].price = entry.price;
                }

                if (entry.actionType === "add") map[key].quantity += entry.quantity;
                if (entry.actionType === "distributed") map[key].quantity -= entry.quantity;
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

    /* ----------------------- FILTER ITEMS ------------------------ */

    const filtered = items.filter(
        (i) =>
            i.itemName.toLowerCase().includes(search.toLowerCase()) ||
            i.category.toLowerCase().includes(search.toLowerCase())
    );

    /* ----------------------- HANDLERS ------------------------ */

    const addNewItem = async () => {
        if (!form.name || !form.category || !form.unit || !form.price)
            return alert("Fill all fields");

        try {
            setActionLoading(true);
            await post({
                apiName: "frontdesk",
                path: `/stock?institutionId=${institutionId}`,
                options: {
                    body: {
                        itemName: form.name,
                        category: form.category,
                        unit: form.unit,
                        price: parseFloat(form.price),
                        quantity: 0,
                        actionType: "create-item",
                        description: "Item created",
                    },
                },
            }).response;

            setForm({ name: "", category: "", unit: "", price: "" });
            setShowAddItem(false);
            await fetchStockHistory(); // Refresh the list
        } catch (error) {
            console.error("Error creating item:", error);
            alert("Failed to create item");
        } finally {
            setActionLoading(false);
        }
    };

    const openStockModal = (item) => {
        setSelectedItem(item);
        setStockForm({ quantity: "", description: "", action: "add" });
        setShowStock(true);
    };

    const applyStockChange = async () => {
        if (!stockForm.quantity) return alert("enter qty");

        const qty = parseInt(stockForm.quantity);

        if (stockForm.action === "distributed" && qty > selectedItem.quantity)
            return alert("Not enough stock");

        setActionLoading(true);

        // Calculate total price = quantity × unit price
        const unitPrice = selectedItem.price || 0;
        const totalPrice = qty * unitPrice;

        try {
            await post({
                apiName: "frontdesk",
                path: `/stock?institutionId=${institutionId}`,
                options: {
                    body: {
                        itemName: selectedItem.itemName,
                        category: selectedItem.category,
                        unit: selectedItem.unit,
                        quantity: qty,
                        price: totalPrice, // Send total price (quantity × unit price)
                        actionType: stockForm.action, // add or distributed
                        description: stockForm.description,
                    },
                },
            }).response;

            setShowStock(false);
            await fetchStockHistory(); // Refresh the list
        } catch (error) {
            console.error("Error updating stock:", error);
            alert("Failed to update stock");
        } finally {
            setActionLoading(false);
        }
    };

    const viewHistory = (item) => {
        setSelectedItem(item);
        setPage("history");
    };

    const deleteHistoryEntry = async (dateEpoch) => {
        if (!window.confirm("Are you sure you want to delete this entry?")) {
            return;
        }

        setActionLoading(true);

        try {
            await del({
                apiName: "frontdesk",
                path: `/stock/${dateEpoch}?institutionId=${institutionId}`,
            }).response;

            await fetchStockHistory(); // Refresh the list
            alert("Entry deleted successfully");
        } catch (error) {
            console.error("Error deleting entry:", error);
            alert("Failed to delete entry");
        } finally {
            setActionLoading(false);
        }
    };

    const deleteItem = async (item) => {
        if (!window.confirm(`Are you sure you want to delete "${item.itemName}" and all its history?`)) {
            return;
        }

        setActionLoading(true);

        try {
            // Get all history entries for this item
            const itemLogs = stockHistory.filter(
                (log) => log.itemName === item.itemName &&
                    log.category === item.category &&
                    log.unit === item.unit
            );

            // Delete all entries
            for (const log of itemLogs) {
                await del({
                    apiName: "frontdesk",
                    path: `/stock/${log.dateEpoch}?institutionId=${institutionId}`,
                }).response;
            }

            await fetchStockHistory(); // Refresh the list
            alert("Item deleted successfully");
        } catch (error) {
            console.error("Error deleting item:", error);
            alert("Failed to delete item");
        } finally {
            setActionLoading(false);
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
            <div className="max-w-5xl mx-auto space-y-6">

                {/* HEADER */}
                <div className="flex justify-between items-center">
                    <h1 className="text-xl font-semibold text-gray-900">
                        {page === "items" ? "Store Inventory" : `${selectedItem.itemName} History`}
                    </h1>

                    {page === "items" && (
                        <button
                            onClick={() => setShowAddItem(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-black transition"
                        >
                            <Plus size={16} /> Add Item
                        </button>
                    )}

                    {page === "history" && (
                        <button
                            onClick={() => setPage("items")}
                            className="px-4 py-2 border rounded bg-white hover:bg-gray-100"
                        >
                            Back to Items
                        </button>
                    )}
                </div>

                {/* SEARCH (only in Items page) */}
                {page === "items" && (
                    <div className="relative">
                        <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search items..."
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded bg-white shadow-sm text-sm"
                        />
                    </div>
                )}

                {/* PAGE SWITCH */}
                {page === "items" && (
                    <ItemsPage
                        filtered={filtered}
                        openStockModal={openStockModal}
                        viewHistory={viewHistory}
                        onDelete={deleteItem}
                    />
                )}

                {page === "history" && (
                    <HistoryPage
                        selectedItem={selectedItem}
                        stockHistory={stockHistory}
                        onDelete={deleteHistoryEntry}
                    />
                )}
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

                        <Input
                            type="number"
                            placeholder="Price"
                            value={form.price}
                            onChange={(e) => setForm({ ...form, price: e.target.value })}
                        />

                        <button
                            onClick={addNewItem}
                            disabled={actionLoading}
                            className="w-full bg-gray-900 text-white py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {actionLoading && (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            )}
                            {actionLoading ? "Creating..." : "Create Item"}
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
                                    setStockForm({ ...stockForm, action: "distributed" })
                                }
                                className={`flex-1 py-2 border rounded ${stockForm.action === "distributed"
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-100"
                                    }`}
                            >
                                Distributed
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

                        <Input
                            placeholder="Description"
                            value={stockForm.description}
                            onChange={(e) =>
                                setStockForm({ ...stockForm, description: e.target.value })
                            }
                        />

                        <button
                            onClick={applyStockChange}
                            disabled={actionLoading}
                            className="w-full bg-gray-900 text-white py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {actionLoading && (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            )}
                            {actionLoading ? "Updating..." : "Apply"}
                        </button>
                    </div>
                </Modal>
            )}

            {/* LOADING OVERLAY */}
            {actionLoading && (
                <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
                    <div className="bg-white rounded-lg p-6 flex flex-col items-center gap-3">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                        <p className="text-gray-700 font-medium">Processing...</p>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ----------------------- ITEMS PAGE TABLE ------------------------ */

function ItemsPage({ filtered, openStockModal, viewHistory, onDelete }) {
    return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <table className="w-full text-sm">
                <thead>
                    <tr className="bg-gray-900 border-b">
                        <Th>Item</Th>
                        <Th>Category</Th>
                        <Th>Qty</Th>
                        <Th>Unit</Th>
                        <Th>Unit Price</Th>
                        <Th right>Actions</Th>
                    </tr>
                </thead>

                <tbody>
                    {filtered.map((item) => (
                        <tr key={item.itemName} className="border-b hover:bg-gray-50">
                            <Td>{item.itemName}</Td>
                            <Td>{item.category}</Td>
                            <Td>{item.quantity}</Td>
                            <Td>{item.unit}</Td>
                            <Td>₹{item.price}</Td>

                            <Td right>
                                <div className="flex gap-2 justify-end">
                                    <button
                                        onClick={() => viewHistory(item)}
                                        className="flex items-center gap-1 px-3 py-1.5 text-xs border border-blue-300 text-blue-600 rounded hover:bg-blue-50 transition"
                                    >
                                        <Eye size={14} />
                                        View
                                    </button>
                                    <button
                                        onClick={() => openStockModal(item)}
                                        className="flex items-center gap-1 px-3 py-1.5 text-xs border border-green-300 text-green-600 rounded hover:bg-green-50 transition"
                                    >
                                        <Package size={14} />
                                        Update
                                    </button>
                                    <button
                                        onClick={() => onDelete(item)}
                                        className="flex items-center gap-1 px-3 py-1.5 text-xs border border-red-300 text-red-600 rounded hover:bg-red-50 transition"
                                    >
                                        <Trash2 size={14} />
                                        Delete
                                    </button>
                                </div>
                            </Td>
                        </tr>
                    ))}

                    {filtered.length === 0 && (
                        <tr>
                            <td colSpan="6" className="py-10 text-center text-gray-500">
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

function HistoryPage({ selectedItem, stockHistory, onDelete }) {
    const logs = stockHistory
        .filter((log) => log.itemName === selectedItem.itemName)
        .sort((a, b) => b.dateEpoch - a.dateEpoch);

    return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">

            <table className="w-full text-sm">
                <thead className="bg-gray-900 border-b">
                    <tr>
                        <Th>Date</Th>
                        <Th>Action</Th>
                        <Th>Qty</Th>
                        <Th>Price</Th>
                        <Th>Description</Th>
                        <Th right>Actions</Th>
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
                                            : "bg-gray-200"
                                        }`}
                                >
                                    {log.actionType === "distributed" ? "DISTRIBUTED" : log.actionType === "add" ? "ADD" : "CREATE"}
                                </span>
                            </Td>

                            <Td>{log.quantity} {log.unit}</Td>

                            <Td>
                                {log.actionType === "create-item"
                                    ? `₹${log.price} (unit)`
                                    : log.price
                                        ? `₹${log.price}`
                                        : "-"
                                }
                            </Td>

                            <Td>{log.description || "-"}</Td>

                            <Td right>
                                <button
                                    onClick={() => onDelete(log.dateEpoch)}
                                    className="flex items-center gap-1 px-3 py-1.5 text-xs border border-red-300 text-red-600 rounded hover:bg-red-50 transition"
                                >
                                    <Trash2 size={14} />
                                    Delete
                                </button>
                            </Td>
                        </tr>
                    ))}

                    {logs.length === 0 && (
                        <tr>
                            <td colSpan="6" className="py-10 text-center text-gray-500">
                                No history available.
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
        className={`p-3 text-xs text-white font-medium ${right ? "text-right" : "text-left"
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

function Modal({ title, children, onClose }) {
    return (
        <div className="fixed inset-0 bg-black/30 flex justify-center items-center p-4 z-50">
            <div className="bg-white w-96 border border-gray-200 rounded-lg shadow-xl p-5 relative">
                <button onClick={onClose} className="absolute top-3 right-3">
                    <X size={18} />
                </button>
                <h2 className="text-lg font-semibold mb-4">{title}</h2>
                {children}
            </div>
        </div>
    );
}
