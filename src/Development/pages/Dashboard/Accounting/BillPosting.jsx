import React, { useState, useEffect } from "react";
import { useAuthContext } from "../../../context/AuthContext";
import {
  CheckCircle,
  Clock,
  CheckCheck,
  Search,
  Loader2,
  Receipt,
  FileCheck2,
  FileSpreadsheet,
  Building2,
  Calendar,
  AlertCircle,
  TrendingUp,
  RefreshCw,
  ExternalLink,
  CreditCard,
  Banknote,
  DollarSign,
} from "lucide-react";
import { get, post, put } from "aws-amplify/api";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Badge } from "../../../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../../components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { Textarea } from "../../../components/ui/textarea";
import { Label } from "../../../components/ui/label";

const BillPosting = () => {
  const { userData } = useAuthContext();
  const institutionId = userData?.institutionId;

  const [activeTab, setActiveTab] = useState("pending"); // pending | approved | sanctioned
  const [loading, setLoading] = useState(true);
  const [purchaseEntries, setPurchaseEntries] = useState([]);
  const [accountingBills, setAccountingBills] = useState([]);
  const [search, setSearch] = useState("");

  // Modal states
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showSanctionModal, setShowSanctionModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [loadingAction, setLoadingAction] = useState(false);

  // Forms
  const [approvalForm, setApprovalForm] = useState({
    paymentType: "credit",
    remark: "",
  });

  const [sanctionForm, setSanctionForm] = useState({
    paymentDate: new Date().toISOString().split("T")[0],
    referenceNo: "",
    paymentMode: "cheque",
    paymentAmount: "",
  });

  /* ----------------------- FETCH DATA ------------------------ */
  useEffect(() => {
    if (institutionId) {
      fetchData();
    }
  }, [institutionId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchPurchaseEntries(), fetchAccountingBills()]);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setLoading(false);
  };

  const fetchPurchaseEntries = async () => {
    try {
      const { body } = await get({
        apiName: "frontdesk",
        path: `/stock?institutionId=${institutionId}`,
      }).response;
      const data = await body.json();

      const purchaseOnly = Array.isArray(data.stockHistory)
        ? data.stockHistory.filter((e) => e.actionType === "purchase-entry")
        : [];

      setPurchaseEntries(purchaseOnly);
    } catch (error) {
      console.error("Error fetching purchase entries:", error);
      setPurchaseEntries([]);
    }
  };

  const fetchAccountingBills = async () => {
    try {
      const { body } = await get({
        apiName: "accounting",
        path: `/bill?institutionId=${institutionId}`,
      }).response;
      const data = await body.json();

      setAccountingBills(Array.isArray(data.bills) ? data.bills : []);
    } catch (error) {
      console.error("Error fetching accounting bills:", error);
      setAccountingBills([]);
    }
  };

  /* ----------------------- DERIVED DATA ------------------------ */
  const approvedGRNs = new Set(accountingBills.map((b) => b.grnNo));

  const pendingBills = purchaseEntries.filter(
    (entry) => !approvedGRNs.has(entry.grnNo)
  );

  const approvedBills = accountingBills.filter(
    (bill) => bill.status === "approved"
  );

  const sanctionedBills = accountingBills.filter(
    (bill) => bill.status === "sanctioned"
  );

  /* ----------------------- SEARCH FILTERING ------------------------ */
  const filterBySearch = (bills, key = "vendorName") => {
    if (!search.trim()) return bills;
    const query = search.toLowerCase();
    return bills.filter(
      (bill) =>
        (bill[key] || "").toLowerCase().includes(query) ||
        (bill.grnNo || "").toLowerCase().includes(query) ||
        (bill.billNo || "").toLowerCase().includes(query) ||
        (bill.vendorBillNo || "").toLowerCase().includes(query) ||
        (bill.itemName || "").toLowerCase().includes(query)
    );
  };

  const filteredPending = filterBySearch(pendingBills);
  const filteredApproved = filterBySearch(approvedBills);
  const filteredSanctioned = filterBySearch(sanctionedBills);

  // Totals calculations
  const totalPendingAmount = filteredPending.reduce(
    (sum, b) => sum + (Number(b.price || 0) * Number(b.quantity || 1)),
    0
  );
  const totalApprovedAmount = filteredApproved.reduce(
    (sum, b) => sum + Number(b.billTotalAmount || 0),
    0
  );
  const totalSanctionedAmount = filteredSanctioned.reduce(
    (sum, b) => sum + Number(b.paymentAmount || b.billTotalAmount || 0),
    0
  );

  /* ----------------------- MODAL HANDLERS ------------------------ */
  const openApprovalModal = (bill) => {
    setSelectedBill(bill);
    setApprovalForm({
      paymentType: "credit",
      remark: "",
    });
    setShowApprovalModal(true);
  };

  const openSanctionModal = (bill) => {
    setSelectedBill(bill);
    setSanctionForm({
      paymentDate: new Date().toISOString().split("T")[0],
      referenceNo: "",
      paymentMode: "cheque",
      paymentAmount: bill.billTotalAmount || "",
    });
    setShowSanctionModal(true);
  };

  const handleApprove = async () => {
    if (!selectedBill) return;

    setLoadingAction(true);
    try {
      const billData = {
        grnNo: selectedBill.grnNo,
        vendorName: selectedBill.vendorName,
        vendorBillNo: selectedBill.billNo,
        billDate: selectedBill.billDate,
        billTotalAmount: selectedBill.price * selectedBill.quantity,
        paymentType: approvalForm.paymentType,
        remark: approvalForm.remark,
        createdAt: Date.now(),
      };

      await post({
        apiName: "accounting",
        path: `/bill?institutionId=${institutionId}`,
        options: {
          body: billData,
        },
      }).response;

      await fetchAccountingBills();
      setShowApprovalModal(false);
      setSelectedBill(null);
    } catch (error) {
      console.error("Error approving bill:", error);
      alert("Error approving bill. Please try again.");
    }
    setLoadingAction(false);
  };

  const handleSanction = async () => {
    if (!selectedBill) return;

    if (
      !sanctionForm.paymentDate ||
      !sanctionForm.paymentAmount ||
      (sanctionForm.paymentMode !== "cash" && !sanctionForm.referenceNo)
    ) {
      alert("Please fill all required payment fields.");
      return;
    }

    setLoadingAction(true);
    try {
      const updatedBill = {
        ...selectedBill,
        status: "sanctioned",
        paymentDate: sanctionForm.paymentDate,
        referenceNo: sanctionForm.referenceNo,
        paymentMode: sanctionForm.paymentMode,
        paymentAmount: Number(sanctionForm.paymentAmount),
        sanctionedAt: Date.now(),
      };

      await put({
        apiName: "accounting",
        path: `/bill?institutionId=${institutionId}`,
        options: {
          body: updatedBill,
        },
      }).response;

      await fetchAccountingBills();
      setShowSanctionModal(false);
      setSelectedBill(null);
    } catch (error) {
      console.error("Error sanctioning bill:", error);
      alert("Error sanctioning bill. Please try again.");
    }
    setLoadingAction(false);
  };

  return (
    <div className="flex flex-col h-full min-h-[92vh] bg-gray-50/60 p-4 sm:p-6 space-y-4">
      {/* -------------------- METRIC SUMMARY STRIP -------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Pending Card */}
        <div className="bg-white border border-amber-200/80 rounded-xl p-3.5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-amber-700 tracking-wide uppercase">
              Pending Verification
            </div>
            <div className="text-xl font-bold text-gray-900 mt-0.5">
              {pendingBills.length} <span className="text-xs font-normal text-gray-500">bills</span>
            </div>
            <div className="text-xs font-semibold text-amber-600 mt-1">
              ₹{totalPendingAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Approved Card */}
        <div className="bg-white border border-emerald-200/80 rounded-xl p-3.5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-emerald-700 tracking-wide uppercase">
              Approved (Waiting Sanction)
            </div>
            <div className="text-xl font-bold text-gray-900 mt-0.5">
              {approvedBills.length} <span className="text-xs font-normal text-gray-500">bills</span>
            </div>
            <div className="text-xs font-semibold text-emerald-600 mt-1">
              ₹{totalApprovedAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        {/* Sanctioned Card */}
        <div className="bg-white border border-blue-200/80 rounded-xl p-3.5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-blue-700 tracking-wide uppercase">
              Sanctioned / Settled
            </div>
            <div className="text-xl font-bold text-gray-900 mt-0.5">
              {sanctionedBills.length} <span className="text-xs font-normal text-gray-500">bills</span>
            </div>
            <div className="text-xs font-semibold text-blue-600 mt-1">
              ₹{totalSanctionedAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
            <CheckCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Total Ledger Impact */}
        <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-gray-500 tracking-wide uppercase">
              Total Purchase Ledger
            </div>
            <div className="text-xl font-bold text-gray-900 mt-0.5">
              {purchaseEntries.length + accountingBills.length} <span className="text-xs font-normal text-gray-400">records</span>
            </div>
            <div className="text-xs font-semibold text-gray-700 mt-1">
              ₹{(totalPendingAmount + totalApprovedAmount + totalSanctionedAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-gray-50 text-gray-600 flex items-center justify-center border border-gray-200/80">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* -------------------- CONTROL BAR -------------------- */}
      <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Left: Tab Segmented Pill */}
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg border border-gray-200/80">
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === "pending"
                ? "bg-white text-amber-700 shadow-xs border border-gray-200/70"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Pending Store Bills
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === "pending"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              {filteredPending.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("approved")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === "approved"
                ? "bg-white text-emerald-700 shadow-xs border border-gray-200/70"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            Approved Bills
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === "approved"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              {filteredApproved.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("sanctioned")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === "sanctioned"
                ? "bg-white text-blue-700 shadow-xs border border-gray-200/70"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Sanctioned / Settled
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === "sanctioned"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              {filteredSanctioned.length}
            </span>
          </button>
        </div>

        {/* Right: Search & Refresh */}
        <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search vendor, GRN, bill #, item..."
              className="pl-8.5 h-9 text-xs bg-gray-50/50 border-gray-200 focus:bg-white"
            />
          </div>
          <Button
            onClick={fetchData}
            variant="outline"
            size="sm"
            disabled={loading}
            className="h-9 px-3 text-xs gap-1.5 border-gray-200 text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* -------------------- MAIN TABULAR VIEWPORT -------------------- */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden flex-1 flex flex-col">
        {activeTab === "pending" && (
          <PendingBillsTable
            bills={filteredPending}
            onApprove={openApprovalModal}
            loading={loading}
          />
        )}

        {activeTab === "approved" && (
          <ApprovedBillsTable
            bills={filteredApproved}
            onSanction={openSanctionModal}
            loading={loading}
          />
        )}

        {activeTab === "sanctioned" && (
          <SanctionedBillsTable
            bills={filteredSanctioned}
            loading={loading}
          />
        )}
      </div>

      {/* -------------------- APPROVAL MODAL -------------------- */}
      <Dialog open={showApprovalModal} onOpenChange={setShowApprovalModal}>
        <DialogContent className="max-w-lg p-0 overflow-hidden rounded-2xl border-gray-200">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-5 py-4 text-white">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-200" />
              <DialogTitle className="text-base font-bold text-white">
                Approve Vendor Purchase Bill
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-emerald-100 mt-0.5">
              Validate GRN goods receipt and pass bill to accounting ledger
            </DialogDescription>
          </div>

          {selectedBill && (
            <div className="p-5 space-y-4">
              {/* Highlight summary card */}
              <div className="bg-emerald-50/70 border border-emerald-200/70 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-emerald-100">
                  <span className="text-xs text-gray-500 font-medium">Vendor / Supplier</span>
                  <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-emerald-700" />
                    {selectedBill.vendorName || "Store Supplier"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-400 block text-[11px]">GRN Reference</span>
                    <span className="font-semibold text-gray-800">{selectedBill.grnNo}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[11px]">Vendor Bill #</span>
                    <span className="font-semibold text-gray-800">{selectedBill.billNo || "-"}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[11px]">Item / Description</span>
                    <span className="font-semibold text-gray-800">
                      {selectedBill.itemName} ({selectedBill.quantity} {selectedBill.unit})
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[11px]">Bill Date</span>
                    <span className="font-semibold text-gray-800">
                      {selectedBill.billDate
                        ? new Date(selectedBill.billDate).toLocaleDateString("en-GB")
                        : "-"}
                    </span>
                  </div>
                </div>
                <div className="pt-2 border-t border-emerald-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-900">Total Sanction Amount:</span>
                  <span className="text-base font-bold text-emerald-700">
                    ₹{(Number(selectedBill.price || 0) * Number(selectedBill.quantity || 1)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Form Input fields */}
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="paymentType" className="text-xs font-semibold text-gray-700">
                    Terms / Payment Ledger Type *
                  </Label>
                  <Select
                    value={approvalForm.paymentType}
                    onValueChange={(val) => setApprovalForm({ ...approvalForm, paymentType: val })}
                  >
                    <SelectTrigger id="paymentType" className="h-9 text-xs">
                      <SelectValue placeholder="Select terms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="credit">Credit Ledger (Accounts Payable)</SelectItem>
                      <SelectItem value="cash">Direct Cash</SelectItem>
                      <SelectItem value="online">Online / Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="remark" className="text-xs font-semibold text-gray-700">
                    Accountant Remark / Notes
                  </Label>
                  <Textarea
                    id="remark"
                    value={approvalForm.remark}
                    onChange={(e) => setApprovalForm({ ...approvalForm, remark: e.target.value })}
                    placeholder="E.g., Approved after inventory stock count verification..."
                    rows={2}
                    className="text-xs resize-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowApprovalModal(false)}
                  disabled={loadingAction}
                  className="text-xs h-9"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleApprove}
                  disabled={loadingAction}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 px-4 gap-1.5 font-semibold"
                >
                  {loadingAction && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Approve & Post to Accounting
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* -------------------- SANCTION MODAL -------------------- */}
      <Dialog open={showSanctionModal} onOpenChange={setShowSanctionModal}>
        <DialogContent className="max-w-lg p-0 overflow-hidden rounded-2xl border-gray-200">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-5 py-4 text-white">
            <div className="flex items-center gap-2">
              <CheckCheck className="w-5 h-5 text-blue-200" />
              <DialogTitle className="text-base font-bold text-white">
                Sanction / Settle Bill Payment
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-blue-100 mt-0.5">
              Record disbursement reference (Cheque, UTR, Cash) to mark bill settled
            </DialogDescription>
          </div>

          {selectedBill && (
            <div className="p-5 space-y-4">
              {/* Highlight summary card */}
              <div className="bg-blue-50/70 border border-blue-200/70 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-blue-100">
                  <span className="text-xs text-gray-500 font-medium">Accounting Bill No</span>
                  <span className="text-xs font-bold text-blue-900 font-mono">
                    #{selectedBill.billNo}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-400 block text-[11px]">Vendor Name</span>
                    <span className="font-semibold text-gray-800">{selectedBill.vendorName}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[11px]">GRN Reference</span>
                    <span className="font-semibold text-gray-800">{selectedBill.grnNo}</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-blue-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-blue-900">Approved Bill Total:</span>
                  <span className="text-base font-bold text-blue-700">
                    ₹{Number(selectedBill.billTotalAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Form Input fields */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="paymentDate" className="text-xs font-semibold text-gray-700">
                      Disbursement Date *
                    </Label>
                    <Input
                      id="paymentDate"
                      type="date"
                      value={sanctionForm.paymentDate}
                      onChange={(e) =>
                        setSanctionForm({ ...sanctionForm, paymentDate: e.target.value })
                      }
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="paymentMode" className="text-xs font-semibold text-gray-700">
                      Payment Mode *
                    </Label>
                    <Select
                      value={sanctionForm.paymentMode}
                      onValueChange={(val) =>
                        setSanctionForm({ ...sanctionForm, paymentMode: val })
                      }
                    >
                      <SelectTrigger id="paymentMode" className="h-9 text-xs">
                        <SelectValue placeholder="Select mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cheque">Cheque</SelectItem>
                        <SelectItem value="utr">NEFT / RTGS (UTR)</SelectItem>
                        <SelectItem value="cash">Cash Outflow</SelectItem>
                        <SelectItem value="online">Online / UPI</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {sanctionForm.paymentMode !== "cash" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="referenceNo" className="text-xs font-semibold text-gray-700">
                      Payment Reference # (Cheque / UTR / Transaction ID) *
                    </Label>
                    <Input
                      id="referenceNo"
                      value={sanctionForm.referenceNo}
                      onChange={(e) =>
                        setSanctionForm({ ...sanctionForm, referenceNo: e.target.value })
                      }
                      placeholder="e.g. CHQ-928172 or UTR-HDFC902187"
                      className="h-9 text-xs"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="paymentAmount" className="text-xs font-semibold text-gray-700">
                    Disbursed Amount (₹) *
                  </Label>
                  <Input
                    id="paymentAmount"
                    type="number"
                    step="0.01"
                    value={sanctionForm.paymentAmount}
                    onChange={(e) =>
                      setSanctionForm({ ...sanctionForm, paymentAmount: e.target.value })
                    }
                    className="h-9 text-xs font-semibold"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSanctionModal(false)}
                  disabled={loadingAction}
                  className="text-xs h-9"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSanction}
                  disabled={loadingAction}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-9 px-4 gap-1.5 font-semibold"
                >
                  {loadingAction && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Confirm Sanction & Settle
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BillPosting;

/* ------------------------------------------------------------- */
/*                      TABULAR COMPONENTS                       */
/* ------------------------------------------------------------- */

const PendingBillsTable = ({ bills, onApprove, loading }) => (
  <div className="overflow-x-auto">
    <Table>
      <TableHeader className="bg-gray-50/80 sticky top-0 z-10 border-b border-gray-200">
        <TableRow className="hover:bg-transparent">
          <TableHead className="text-[11px] font-bold text-gray-700 uppercase tracking-wider py-2.5">
            GRN No
          </TableHead>
          <TableHead className="text-[11px] font-bold text-gray-700 uppercase tracking-wider py-2.5">
            Vendor / Supplier
          </TableHead>
          <TableHead className="text-[11px] font-bold text-gray-700 uppercase tracking-wider py-2.5">
            Vendor Bill #
          </TableHead>
          <TableHead className="text-[11px] font-bold text-gray-700 uppercase tracking-wider py-2.5">
            Bill Date
          </TableHead>
          <TableHead className="text-[11px] font-bold text-gray-700 uppercase tracking-wider py-2.5">
            Item Details
          </TableHead>
          <TableHead className="text-[11px] font-bold text-gray-700 uppercase tracking-wider py-2.5 text-right">
            Quantity
          </TableHead>
          <TableHead className="text-[11px] font-bold text-gray-700 uppercase tracking-wider py-2.5 text-right">
            Rate
          </TableHead>
          <TableHead className="text-[11px] font-bold text-gray-700 uppercase tracking-wider py-2.5 text-right">
            Total Amount
          </TableHead>
          <TableHead className="text-[11px] font-bold text-gray-700 uppercase tracking-wider py-2.5 text-center">
            Action
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <TableRow>
            <TableCell colSpan={9} className="h-32 text-center text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
              Loading pending purchase entries...
            </TableCell>
          </TableRow>
        ) : bills.length === 0 ? (
          <TableRow>
            <TableCell colSpan={9} className="h-32 text-center text-gray-400 text-xs">
              No pending purchase bills found.
            </TableCell>
          </TableRow>
        ) : (
          bills.map((bill, idx) => {
            const total = Number(bill.price || 0) * Number(bill.quantity || 1);
            return (
              <TableRow
                key={(bill.grnNo || "") + idx}
                className="hover:bg-amber-50/30 transition-colors border-b border-gray-100"
              >
                <TableCell className="font-mono text-xs font-semibold text-gray-900 py-2.5">
                  {bill.grnNo}
                </TableCell>
                <TableCell className="text-xs font-medium text-gray-900 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    {bill.vendorName || "Unknown Vendor"}
                  </div>
                </TableCell>
                <TableCell className="text-xs text-gray-600 font-mono py-2.5">
                  {bill.billNo || "-"}
                </TableCell>
                <TableCell className="text-xs text-gray-600 py-2.5">
                  {bill.billDate
                    ? new Date(bill.billDate).toLocaleDateString("en-GB")
                    : "-"}
                </TableCell>
                <TableCell className="text-xs text-gray-800 py-2.5">
                  {bill.itemName}
                </TableCell>
                <TableCell className="text-xs text-gray-700 py-2.5 text-right">
                  {bill.quantity} {bill.unit || "unit"}
                </TableCell>
                <TableCell className="text-xs text-gray-700 py-2.5 text-right">
                  ₹{Number(bill.price || 0).toFixed(2)}
                </TableCell>
                <TableCell className="text-xs font-bold text-gray-900 py-2.5 text-right">
                  ₹{total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell className="py-2.5 text-center">
                  <Button
                    onClick={() => onApprove(bill)}
                    size="sm"
                    className="h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium gap-1 shadow-2xs"
                  >
                    <CheckCircle className="w-3 h-3" />
                    Approve
                  </Button>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  </div>
);

const ApprovedBillsTable = ({ bills, onSanction, loading }) => (
  <div className="overflow-x-auto">
    <Table>
      <TableHeader className="bg-gray-50/80 sticky top-0 z-10 border-b border-gray-200">
        <TableRow className="hover:bg-transparent">
          <TableHead className="text-[11px] font-bold text-gray-700 uppercase tracking-wider py-2.5">
            Bill #
          </TableHead>
          <TableHead className="text-[11px] font-bold text-gray-700 uppercase tracking-wider py-2.5">
            GRN No
          </TableHead>
          <TableHead className="text-[11px] font-bold text-gray-700 uppercase tracking-wider py-2.5">
            Vendor / Supplier
          </TableHead>
          <TableHead className="text-[11px] font-bold text-gray-700 uppercase tracking-wider py-2.5">
            Bill Date
          </TableHead>
          <TableHead className="text-[11px] font-bold text-gray-700 uppercase tracking-wider py-2.5 text-right">
            Total Amount
          </TableHead>
          <TableHead className="text-[11px] font-bold text-gray-700 uppercase tracking-wider py-2.5">
            Payment Terms
          </TableHead>
          <TableHead className="text-[11px] font-bold text-gray-700 uppercase tracking-wider py-2.5">
            Accountant Remark
          </TableHead>
          <TableHead className="text-[11px] font-bold text-gray-700 uppercase tracking-wider py-2.5 text-center">
            Status
          </TableHead>
          <TableHead className="text-[11px] font-bold text-gray-700 uppercase tracking-wider py-2.5 text-center">
            Action
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <TableRow>
            <TableCell colSpan={9} className="h-32 text-center text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
              Loading approved bills...
            </TableCell>
          </TableRow>
        ) : bills.length === 0 ? (
          <TableRow>
            <TableCell colSpan={9} className="h-32 text-center text-gray-400 text-xs">
              No approved bills pending sanction.
            </TableCell>
          </TableRow>
        ) : (
          bills.map((bill, idx) => (
            <TableRow
              key={(bill.billNo || "") + idx}
              className="hover:bg-emerald-50/30 transition-colors border-b border-gray-100"
            >
              <TableCell className="font-mono text-xs font-semibold text-gray-900 py-2.5">
                #{bill.billNo}
              </TableCell>
              <TableCell className="text-xs text-gray-600 font-mono py-2.5">
                {bill.grnNo}
              </TableCell>
              <TableCell className="text-xs font-medium text-gray-900 py-2.5">
                <div className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  {bill.vendorName || "Unknown Vendor"}
                </div>
              </TableCell>
              <TableCell className="text-xs text-gray-600 py-2.5">
                {bill.billDate
                  ? new Date(bill.billDate).toLocaleDateString("en-GB")
                  : "-"}
              </TableCell>
              <TableCell className="text-xs font-bold text-emerald-700 py-2.5 text-right">
                ₹{Number(bill.billTotalAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </TableCell>
              <TableCell className="text-xs py-2.5">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-gray-100 text-gray-700 uppercase">
                  {bill.paymentType || "Credit"}
                </span>
              </TableCell>
              <TableCell className="text-xs text-gray-600 py-2.5 max-w-[200px] truncate" title={bill.remark || bill.ramark || ""}>
                {bill.remark || bill.ramark || "-"}
              </TableCell>
              <TableCell className="py-2.5 text-center">
                <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[10px] font-semibold px-2 py-0.5">
                  Approved
                </Badge>
              </TableCell>
              <TableCell className="py-2.5 text-center">
                <Button
                  onClick={() => onSanction(bill)}
                  size="sm"
                  className="h-7 px-2.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium gap-1 shadow-2xs"
                >
                  <CheckCheck className="w-3 h-3" />
                  Sanction
                </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
);

const SanctionedBillsTable = ({ bills, loading }) => (
  <div className="overflow-x-auto">
    <Table>
      <TableHeader className="bg-gray-50/80 sticky top-0 z-10 border-b border-gray-200">
        <TableRow className="hover:bg-transparent">
          <TableHead className="text-[11px] font-bold text-gray-700 uppercase tracking-wider py-2.5">
            Bill #
          </TableHead>
          <TableHead className="text-[11px] font-bold text-gray-700 uppercase tracking-wider py-2.5">
            GRN No
          </TableHead>
          <TableHead className="text-[11px] font-bold text-gray-700 uppercase tracking-wider py-2.5">
            Vendor / Supplier
          </TableHead>
          <TableHead className="text-[11px] font-bold text-gray-700 uppercase tracking-wider py-2.5">
            Bill Date
          </TableHead>
          <TableHead className="text-[11px] font-bold text-gray-700 uppercase tracking-wider py-2.5">
            Payment Date
          </TableHead>
          <TableHead className="text-[11px] font-bold text-gray-700 uppercase tracking-wider py-2.5">
            Payment Mode
          </TableHead>
          <TableHead className="text-[11px] font-bold text-gray-700 uppercase tracking-wider py-2.5">
            Reference # / UTR
          </TableHead>
          <TableHead className="text-[11px] font-bold text-gray-700 uppercase tracking-wider py-2.5 text-right">
            Disbursed Amount
          </TableHead>
          <TableHead className="text-[11px] font-bold text-gray-700 uppercase tracking-wider py-2.5 text-center">
            Status
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <TableRow>
            <TableCell colSpan={9} className="h-32 text-center text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
              Loading sanctioned records...
            </TableCell>
          </TableRow>
        ) : bills.length === 0 ? (
          <TableRow>
            <TableCell colSpan={9} className="h-32 text-center text-gray-400 text-xs">
              No settled or sanctioned records found.
            </TableCell>
          </TableRow>
        ) : (
          bills.map((bill, idx) => (
            <TableRow
              key={(bill.billNo || "") + idx}
              className="hover:bg-blue-50/20 transition-colors border-b border-gray-100"
            >
              <TableCell className="font-mono text-xs font-semibold text-gray-900 py-2.5">
                #{bill.billNo}
              </TableCell>
              <TableCell className="text-xs text-gray-600 font-mono py-2.5">
                {bill.grnNo}
              </TableCell>
              <TableCell className="text-xs font-medium text-gray-900 py-2.5">
                <div className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  {bill.vendorName || "Unknown Vendor"}
                </div>
              </TableCell>
              <TableCell className="text-xs text-gray-600 py-2.5">
                {bill.billDate
                  ? new Date(bill.billDate).toLocaleDateString("en-GB")
                  : "-"}
              </TableCell>
              <TableCell className="text-xs text-gray-700 py-2.5">
                {bill.paymentDate
                  ? new Date(bill.paymentDate).toLocaleDateString("en-GB")
                  : "-"}
              </TableCell>
              <TableCell className="text-xs py-2.5">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 uppercase">
                  {bill.paymentMode || "Cheque"}
                </span>
              </TableCell>
              <TableCell className="text-xs text-gray-700 font-mono py-2.5">
                {bill.referenceNo || "-"}
              </TableCell>
              <TableCell className="text-xs font-bold text-gray-900 py-2.5 text-right">
                ₹{Number(bill.paymentAmount || bill.billTotalAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </TableCell>
              <TableCell className="py-2.5 text-center">
                <Badge className="bg-blue-50 text-blue-700 border border-blue-200/80 text-[10px] font-semibold px-2 py-0.5">
                  Sanctioned
                </Badge>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
);
