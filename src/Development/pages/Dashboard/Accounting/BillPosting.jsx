import React, { useState, useEffect } from "react";
import { useAuthContext } from "../../../context/AuthContext";
import { CheckCircle, Clock, CheckCheck, Search, Loader2 } from "lucide-react";
import { get, post, put } from "aws-amplify/api";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Badge } from "../../../components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../../components/ui/tabs";
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

  const [activeTab, setActiveTab] = useState("pending"); // pending, approved, sanctioned
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
    paymentDate: "",
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
      setLoading(true);
      const { body } = await get({
        apiName: "frontdesk",
        path: `/stock?institutionId=${institutionId}`,
      }).response;
      const data = await body.json();

      const purchaseOnly = Array.isArray(data.stockHistory)
        ? data.stockHistory.filter((e) => e.actionType === "purchase-entry")
        : [];

      console.log(purchaseOnly);

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

      console.log(data.bills);

      setAccountingBills(Array.isArray(data.bills) ? data.bills : []);
    } catch (error) {
      console.error("Error fetching accounting bills:", error);
      setAccountingBills([]);
    }
  };

  /* ----------------------- DERIVED DATA ------------------------ */

  // Get GRN numbers that are already in accounting bills
  const approvedGRNs = new Set(accountingBills.map((b) => b.grnNo));

  // Pending bills: purchase entries not yet in accounting bills
  const pendingBills = purchaseEntries.filter(
    (entry) => !approvedGRNs.has(entry.grnNo)
  );

  // Approved bills: status = 'approved'
  const approvedBills = accountingBills.filter(
    (bill) => bill.status === "approved"
  );

  // Sanctioned bills: status = 'sanctioned'
  const sanctionedBills = accountingBills.filter(
    (bill) => bill.status === "sanctioned"
  );

  /* ----------------------- SEARCH FILTERING ------------------------ */

  const filterBySearch = (bills, key = "vendorName") => {
    if (!search) return bills;
    return bills.filter(
      (bill) =>
        (bill[key] || "").toLowerCase().includes(search.toLowerCase()) ||
        (bill.grnNo || "").toLowerCase().includes(search.toLowerCase()) ||
        (bill.billNo || "").toLowerCase().includes(search.toLowerCase())
    );
  };

  const filteredPending = filterBySearch(pendingBills);
  const filteredApproved = filterBySearch(approvedBills);
  const filteredSanctioned = filterBySearch(sanctionedBills);

  /* ----------------------- HANDLERS ------------------------ */

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
      paymentDate: "",
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

      const response = await post({
        apiName: "accounting",
        path: `/bill?institutionId=${institutionId}`,
        options: {
          body: billData,
        },
      }).response;

      alert("Bill approved successfully!");
      await fetchAccountingBills();
      setShowApprovalModal(false);
      setSelectedBill(null);
    } catch (error) {
      console.error("Error approving bill:", error);
      
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
      alert("Please fill all required fields");
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
        paymentAmount: sanctionForm.paymentAmount,
        sanctionedAt: Date.now(),
      };

      const response = await put({
        apiName: "accounting",
        path: `/bill?institutionId=${institutionId}`,
        options: {
          body: updatedBill,
        },
      }).response;

      alert("Bill sanctioned successfully!");
      await fetchAccountingBills();
      setShowSanctionModal(false);
      setSelectedBill(null);
    } catch (error) {
      console.error("Error sanctioning bill:", error);
      alert("Error sanctioning bill");
    }
    setLoadingAction(false);
  };

  /* ----------------------- UI ------------------------ */

  // if (loading) {
  //   return (
  //     <div className="h-[calc(100vh-70px)] bg-[#f7f7f7] flex items-center justify-center">
  //       <Loader2 className="h-12 w-12 animate-spin text-gray-900" />
  //     </div>
  //   );
  // }

  return (
    <div className="h-[calc(100vh-70px)] bg-[#f7f7f7] p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-4">
        /* Header */
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-900">Bill Posting</h1>
            <Button onClick={fetchData} variant="default" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Refresh
            </Button>
          </div>

          {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by vendor, GRN, or bill number..."
            className="pl-10"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="h-4 w-4" />
              Pending
              <Badge variant="secondary" className="ml-1 text-gray-100">
                {filteredPending.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="approved" className="gap-2">
              <CheckCircle className="h-4 w-4" />
              Approved
              <Badge variant="secondary" className="ml-1 text-gray-100">
                {filteredApproved.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="sanctioned" className="gap-2">
              <CheckCheck className="h-4 w-4" />
              Sanctioned
              <Badge variant="secondary" className="ml-1 text-gray-100">
                {filteredSanctioned.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-4">
            <PendingBillsTable
              bills={filteredPending}
              onApprove={openApprovalModal}
            />
          </TabsContent>

          <TabsContent value="approved" className="mt-4">
            <ApprovedBillsTable
              bills={filteredApproved}
              onSanction={openSanctionModal}
            />
          </TabsContent>

          <TabsContent value="sanctioned" className="mt-4">
            <SanctionedBillsTable bills={filteredSanctioned} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Approval Modal */}
      <Dialog open={showApprovalModal} onOpenChange={setShowApprovalModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Approve Bill</DialogTitle>
            <DialogDescription>
              Review bill details and approve for payment
            </DialogDescription>
          </DialogHeader>

          {selectedBill && (
            <div className="space-y-4">
              {/* Bill Details */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 space-y-2">
                <DetailRow label="GRN No" value={selectedBill.grnNo} />
                <DetailRow
                  label="Vendor Name"
                  value={selectedBill.vendorName}
                />
                <DetailRow label="Bill No" value={selectedBill.billNo} />
                <DetailRow
                  label="Bill Date"
                  value={new Date(selectedBill.billDate).toLocaleDateString(
                    "en-GB"
                  )}
                />
                <DetailRow label="Item Name" value={selectedBill.itemName} />
                <DetailRow
                  label="Quantity"
                  value={`${selectedBill.quantity} ${selectedBill.unit}`}
                />
                <DetailRow
                  label="Unit Price"
                  value={`₹${selectedBill.price}`}
                />
                <DetailRow
                  label="Total Amount"
                  value={`₹${(
                    selectedBill.price * selectedBill.quantity
                  ).toFixed(2)}`}
                  highlight
                />
              </div>

              {/* Payment Type */}
              <div className="space-y-2">
                <Label htmlFor="paymentType">Payment Type *</Label>
                <Select
                  value={approvalForm.paymentType}
                  onValueChange={(value) =>
                    setApprovalForm({
                      ...approvalForm,
                      paymentType: value,
                    })
                  }
                >
                  <SelectTrigger id="paymentType" className="w-full">
                    <SelectValue placeholder="Select payment type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="credit">Credit</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Remark */}
              <div className="space-y-2">
                <Label htmlFor="remark">Remark</Label>
                <Textarea
                  id="remark"
                  value={approvalForm.remark}
                  onChange={(e) =>
                    setApprovalForm({ ...approvalForm, remark: e.target.value })
                  }
                  placeholder="Enter any remarks..."
                  rows={3}
                />
              </div>

              {/* Action Button */}
              <Button
                onClick={handleApprove}
                disabled={loadingAction}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {loadingAction && <Loader2 className="h-4 w-4 animate-spin" />}
                <CheckCircle className="h-4 w-4" />
                Approve Bill
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Sanction Modal */}
      <Dialog open={showSanctionModal} onOpenChange={setShowSanctionModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sanction Bill</DialogTitle>
            <DialogDescription>
              Enter payment details to sanction the bill
            </DialogDescription>
          </DialogHeader>

          {selectedBill && (
            <div className="space-y-4">
              {/* Bill Details */}
              <div className="bg-green-50 p-4 rounded-lg border border-green-200 space-y-2">
                <DetailRow label="Bill No" value={selectedBill.billNo} />
                <DetailRow
                  label="Vendor Name"
                  value={selectedBill.vendorName}
                />
                <DetailRow label="GRN No" value={selectedBill.grnNo} />
                <DetailRow
                  label="Bill Total Amount"
                  value={`₹${selectedBill.billTotalAmount}`}
                  highlight
                />
              </div>

              {/* Payment Date */}
              <div className="space-y-2">
                <Label htmlFor="paymentDate">Payment Date *</Label>
                <Input
                  id="paymentDate"
                  type="date"
                  value={sanctionForm.paymentDate}
                  onChange={(e) =>
                    setSanctionForm({
                      ...sanctionForm,
                      paymentDate: e.target.value,
                    })
                  }
                />
              </div>

              {/* Payment Mode */}
              <div className="space-y-2">
                <Label htmlFor="paymentMode">Payment Mode *</Label>
                <Select
                  value={sanctionForm.paymentMode}
                  onValueChange={(value) =>
                    setSanctionForm({
                      ...sanctionForm,
                      paymentMode: value,
                    })
                  }
                >
                  <SelectTrigger id="paymentMode" className="w-full">
                    <SelectValue placeholder="Select payment mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="utr">UTR (Bank Transfer)</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="online">Online Payment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Reference Number - Hidden for Cash */}
              {sanctionForm.paymentMode !== "cash" && (
                <div className="space-y-2">
                  <Label htmlFor="referenceNo">
                    Reference No. (Cheque No./UTR) *
                  </Label>
                  <Input
                    id="referenceNo"
                    type="text"
                    value={sanctionForm.referenceNo}
                    onChange={(e) =>
                      setSanctionForm({
                        ...sanctionForm,
                        referenceNo: e.target.value,
                      })
                    }
                    placeholder="Enter cheque number or UTR..."
                  />
                </div>
              )}

              {/* Payment Amount */}
              <div className="space-y-2">
                <Label htmlFor="paymentAmount">Payment Amount *</Label>
                <Input
                  id="paymentAmount"
                  type="number"
                  step="0.01"
                  value={sanctionForm.paymentAmount}
                  onChange={(e) =>
                    setSanctionForm({
                      ...sanctionForm,
                      paymentAmount: e.target.value,
                    })
                  }
                  placeholder="Enter payment amount..."
                />
              </div>

              {/* Action Button */}
              <Button
                onClick={handleSanction}
                disabled={loadingAction}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {loadingAction && <Loader2 className="h-4 w-4 animate-spin" />}
                <CheckCheck className="h-4 w-4" />
                Sanction Bill
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BillPosting;

/* ----------------------- PENDING BILLS TABLE ------------------------ */

const PendingBillsTable = ({ bills, onApprove }) => (
  <div className="rounded-md border bg-white">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>GRN No</TableHead>
          <TableHead>Vendor Name</TableHead>
          <TableHead>Bill No</TableHead>
          <TableHead>Bill Date</TableHead>
          <TableHead>Item</TableHead>
          <TableHead>Quantity</TableHead>
          <TableHead>Price</TableHead>
          <TableHead>Total Amount</TableHead>
          <TableHead>Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {bills.length === 0 ? (
          <TableRow>
            <TableCell colSpan={9} className="h-24 text-center">
              No pending bills found.
            </TableCell>
          </TableRow>
        ) : (
          bills.map((bill, idx) => (
            <TableRow key={bill.grnNo + idx}>
              <TableCell>{bill.grnNo}</TableCell>
              <TableCell>{bill.vendorName}</TableCell>
              <TableCell>{bill.billNo}</TableCell>
              <TableCell>
                {new Date(bill.billDate).toLocaleDateString("en-GB")}
              </TableCell>
              <TableCell>{bill.itemName}</TableCell>
              <TableCell>
                {bill.quantity} {bill.unit}
              </TableCell>
              <TableCell>₹{bill.price}</TableCell>
              <TableCell>₹{(bill.price * bill.quantity).toFixed(2)}</TableCell>
              <TableCell>
                <Button
                  onClick={() => onApprove(bill)}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-3 w-3" />
                  Approve
                </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
);

/* ----------------------- APPROVED BILLS TABLE ------------------------ */

const ApprovedBillsTable = ({ bills, onSanction }) => (
  <div className="rounded-md border bg-white">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Bill No</TableHead>
          <TableHead>GRN No</TableHead>
          <TableHead>Vendor Name</TableHead>
          <TableHead>Bill Date</TableHead>
          <TableHead>Total Amount</TableHead>
          <TableHead>Payment Type</TableHead>
          <TableHead>Remark</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {bills.length === 0 ? (
          <TableRow>
            <TableCell colSpan={9} className="h-24 text-center">
              No approved bills found.
            </TableCell>
          </TableRow>
        ) : (
          bills.map((bill, idx) => (
            <TableRow key={bill.billNo + idx}>
              <TableCell>{bill.billNo}</TableCell>
              <TableCell>{bill.grnNo}</TableCell>
              <TableCell>{bill.vendorName}</TableCell>
              <TableCell>
                {new Date(bill.billDate).toLocaleDateString("en-GB")}
              </TableCell>
              <TableCell>₹{bill.billTotalAmount}</TableCell>
              <TableCell>
                <Badge variant="secondary" className="text-white">
                  {bill.paymentType.charAt(0).toUpperCase() +
                    bill.paymentType.slice(1)}
                </Badge>
              </TableCell>
              <TableCell>{bill.ramark || "-"}</TableCell>
              <TableCell>
                <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                  {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
                </Badge>
              </TableCell>
              <TableCell>
                <Button
                  onClick={() => onSanction(bill)}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <CheckCheck className="h-3 w-3" />
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

/* ----------------------- SANCTIONED BILLS TABLE ------------------------ */

const SanctionedBillsTable = ({ bills }) => (
  <div className="rounded-md border bg-white">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Bill No</TableHead>
          <TableHead>GRN No</TableHead>
          <TableHead>Vendor Name</TableHead>
          <TableHead>Bill Date</TableHead>
          <TableHead>Total Amount</TableHead>
          <TableHead>Payment Date</TableHead>
          <TableHead>Payment Mode</TableHead>
          <TableHead>Reference No</TableHead>
          <TableHead>Payment Amount</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {bills.length === 0 ? (
          <TableRow>
            <TableCell colSpan={10} className="h-24 text-center">
              No sanctioned bills found.
            </TableCell>
          </TableRow>
        ) : (
          bills.map((bill, idx) => (
            <TableRow key={bill.billNo + idx}>
              <TableCell>{bill.billNo}</TableCell>
              <TableCell>{bill.grnNo}</TableCell>
              <TableCell>{bill.vendorName}</TableCell>
              <TableCell>
                {new Date(bill.billDate).toLocaleDateString("en-GB")}
              </TableCell>
              <TableCell>₹{bill.billTotalAmount}</TableCell>
              <TableCell>
                {bill.paymentDate
                  ? new Date(bill.paymentDate).toLocaleDateString("en-GB")
                  : "-"}
              </TableCell>
              <TableCell>
                <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">
                  {bill.paymentMode.charAt(0).toUpperCase() + bill.paymentMode.slice(1)}
                </Badge>
              </TableCell>
              <TableCell>{bill.referenceNo ? bill.referenceNo : "-"}</TableCell>
              <TableCell>₹{bill.paymentAmount}</TableCell>
              <TableCell>
                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                  {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
                </Badge>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
);

/* ----------------------- DETAIL ROW ------------------------ */

const DetailRow = ({ label, value, highlight }) => (
  <div className="flex justify-between items-center">
    <span className="text-sm text-gray-600 font-medium">{label}:</span>
    <span
      className={`text-sm ${
        highlight ? "font-bold text-gray-900" : "text-gray-800"
      }`}
    >
      {value}
    </span>
  </div>
);
