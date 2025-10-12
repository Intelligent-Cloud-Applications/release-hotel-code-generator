import React from "react";
import { useAppContext } from "../../../context/AppContext.jsx";
import { useLoading } from "../../../hooks/useLoading.js";
import {
  CompactLoader,
  OverlayLoader,
} from "../../../components/LoadingStates.jsx";
import LoadingButton from "../../../components/ui/LoadingButton.jsx";
import { Button } from "../../../components/ui/button.js";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../components/ui/dialog.js";
import { Input } from "../../../components/ui/input.js";
import { Label } from "../../../components/ui/label.js";
import { Textarea } from "../../../components/ui/textarea.js";
import { Plus, Pencil, Trash, ArrowDown, ArrowUp, ChevronLeft, ChevronRight } from "lucide-react";

const Expenses = () => {
  const {
    expenses: allExpenses,
    addExpense,
    updateOpeningBalance,
    updateClosingBalance,
    updateExpense,
    deleteExpense,
  } = useAppContext();
  console.log("allExpenses", allExpenses);

  const [expenses, setExpenses] = React.useState([]);
  const [receivedAmounts, setReceivedAmounts] = React.useState([]);
  const [todaysOpeningBalance, setTodaysOpeningBalance] = React.useState(
    allExpenses.openingBalance
  );

  const [currentBalance, setCurrentBalance] = React.useState(
    allExpenses.closingBalance
  );

  React.useEffect(() => {
    if (allExpenses && allExpenses.expenses) {
      setExpenses(allExpenses.expenses);
    }

    if (allExpenses && allExpenses.received) {
      setReceivedAmounts(allExpenses.received);
    } else if (allExpenses) {
      setReceivedAmounts([]);
    }

    if (allExpenses && allExpenses.openingBalance !== undefined) {
      setTodaysOpeningBalance(allExpenses.openingBalance);
    }

    if (allExpenses && allExpenses.closingBalance !== undefined) {
      setCurrentBalance(allExpenses.closingBalance);
    }
  }, [allExpenses]);

  const { withLoading, isKeyLoading } = useLoading();
  const [loading, setLoading] = React.useState(false);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isReceivedDialogOpen, setIsReceivedDialogOpen] = React.useState(false);
  const [formData, setFormData] = React.useState({
    date: new Date(Date.now() + (5.5 * 60 * 60 * 1000)).toISOString().split("T")[0],
    name: "",
    description: "",
    amount: "",
  });
  const [receivedFormData, setReceivedFormData] = React.useState({
    date: new Date(Date.now() + (5.5 * 60 * 60 * 1000)).toISOString().split("T")[0],
    name: "",
    description: "",
    amount: "",
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSubmittingReceived, setIsSubmittingReceived] = React.useState(false);
  const [isEditExpenseDialogOpen, setIsEditExpenseDialogOpen] =
    React.useState(false);
  const [editingExpense, setEditingExpense] = React.useState(null);
  const [editFormData, setEditFormData] = React.useState({
    date: "",
    name: "",
    description: "",
    amount: "",
  });
  const [isUpdatingExpense, setIsUpdatingExpense] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [expenseToDelete, setExpenseToDelete] = React.useState(null);
  const [isDeletingExpense, setIsDeletingExpense] = React.useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 15;

  // Get all transactions for pagination
  const allTransactions = React.useMemo(() => {
    return [
      ...(expenses || []).map(expense => ({ ...expense, type: 'expense', id: expense.expenseId || expense.name + expense.date })),
      ...(receivedAmounts || []).map(received => ({ ...received, type: 'received', id: received.receivedId || received.name + received.date }))
    ].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }, [expenses, receivedAmounts]);

  // Calculate pagination
  const totalPages = Math.ceil(allTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTransactions = allTransactions.slice(startIndex, endIndex);

  // Reset to first page when transactions change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [allTransactions.length]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleReceivedInputChange = (e) => {
    const { name, value } = e.target;
    setReceivedFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };



  const handleEditExpense = (expense) => {
    console.log("Opening edit dialog for expense:", expense);
    setEditingExpense(expense);
    
    // Handle date conversion more carefully
    let formattedDate;
    try {
      // If expense.date is already in dd/mm/yyyy format, convert to yyyy-mm-dd for input
      if (expense.date && expense.date.includes('/')) {
        const [day, month, year] = expense.date.split('/');
        formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      } else {
        // If it's already in a different format, try to parse it
        formattedDate = new Date(expense.date).toISOString().split("T")[0];
      }
    } catch (error) {
      console.error("Error parsing date:", error);
      formattedDate = new Date().toISOString().split("T")[0]; // fallback to today
    }
    
    setEditFormData({
      date: formattedDate,
      name: expense.name || "",
      description: expense.description || "",
      amount: expense.amount ? expense.amount.toString() : "0",
    });
    setIsEditExpenseDialogOpen(true);
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsUpdatingExpense(true);

    try {
      await withLoading(
        "edit-expense",
        async () => {
          const updatedExpense = {
            ...editingExpense,
            date: new Date(editFormData.date).toLocaleDateString("en-GB"),
            name: editFormData.name,
            description: editFormData.description,
            amount: parseFloat(editFormData.amount) || 0,
            expenseId: editingExpense.expenseId, // Preserve the expenseId
          };

          // Update the expense in the local state
          setExpenses((prev) =>
            prev.map((expense) =>
              expense === editingExpense ? updatedExpense : expense
            )
          );

          // Here you would typically call an API to update the expense
          await updateExpense({
            expenseId: editingExpense.expenseId,
            expense: updatedExpense,
            date: updatedExpense.date,
          });

          setIsEditExpenseDialogOpen(false);
          setEditingExpense(null);
          setEditFormData({
            date: "",
            name: "",
            description: "",
            amount: "",
          });
        },
        "UPDATING",
        "overlay"
      );
    } catch (error) {
      console.error("Error updating expense:", error);
    } finally {
      setIsUpdatingExpense(false);
    }
  };

  const handleDeleteExpense = (expense) => {
    setExpenseToDelete(expense);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!expenseToDelete) return;

    setIsDeletingExpense(true);

    try {
      await withLoading(
        "delete-expense",
        async () => {
          // Remove the transaction from local state
          if (expenseToDelete.expenseId) {
            setExpenses((prev) =>
              prev.filter((expense) => expense !== expenseToDelete)
            );
          } else if (expenseToDelete.receivedId) {
            setReceivedAmounts((prev) =>
              prev.filter((received) => received !== expenseToDelete)
            );
          }

          // Adjust current balance based on transaction type
          const amount = parseFloat(expenseToDelete.amount) || 0;
          if (expenseToDelete.expenseId) {
            // Expense deleted: add amount back to balance
            setCurrentBalance((prev) => prev + amount);
          } else if (expenseToDelete.receivedId) {
            // Received amount deleted: subtract amount from balance
            setCurrentBalance((prev) => prev - amount);
          }

          // Here you would typically call an API to delete the transaction
          await deleteExpense({
            ...(expenseToDelete.expenseId && { expenseId: expenseToDelete.expenseId }),
            ...(expenseToDelete.receivedId && { receivedId: expenseToDelete.receivedId }),
            date: expenseToDelete.date,
          });

          setIsDeleteDialogOpen(false);
          setExpenseToDelete(null);
        },
        "DELETING",
        "overlay"
      );
    } catch (error) {
      console.error("Error deleting expense:", error);
    } finally {
      setIsDeletingExpense(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await withLoading(
        "add-expense",
        async () => {
          const newExpense = {
            date: new Date(formData.date).toLocaleDateString("en-GB"),
            name: formData.name,
            description: formData.description,
            amount: parseFloat(formData.amount) || 0,
            expenseId: Math.random().toString(36).substr(2, 9), // Generate a simple random ID
          };

          setExpenses((prev) => [...(prev || []), newExpense]);
          await addExpense({ expense: newExpense });

          setCurrentBalance(
            (prev) => prev - (parseFloat(formData.amount) || 0)
          );

          // Reset form and close dialog
          setFormData({
            date: new Date().toISOString().split("T")[0],
            name: "",
            description: "",
            amount: "",
          });
          setIsDialogOpen(false);
        },
        "SUBMITTING",
        "overlay"
      );
    } catch (error) {
      console.error("Error adding expense:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReceivedSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingReceived(true);

    try {
      await withLoading(
        "add-received",
        async () => {
          const newReceived = {
            date: new Date(receivedFormData.date).toLocaleDateString("en-GB"),
            name: receivedFormData.name,
            description: receivedFormData.description,
            amount: parseFloat(receivedFormData.amount) || 0,
            receivedId: Math.random().toString(36).substr(2, 9), // Generate a simple random ID
          };

          setReceivedAmounts((prev) => [...(prev || []), newReceived]);
          await addExpense({ received: newReceived });

          setCurrentBalance(
            (prev) => prev + (parseFloat(receivedFormData.amount) || 0)
          );

          // Reset form and close dialog
          setReceivedFormData({
            date: new Date().toISOString().split("T")[0],
            name: "",
            description: "",
            amount: "",
          });
          setIsReceivedDialogOpen(false);
        },
        "SUBMITTING",
        "overlay"
      );
    } catch (error) {
      console.error("Error adding received amount:", error);
    } finally {
      setIsSubmittingReceived(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/30 p-3 sm:p-4 lg:p-6">
      {/* Header Section */}
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Cash Drawer</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Track cash inflows and outflows</p>
          </div>
          <div className="flex gap-2 sm:gap-3">
            <Button
              className="bg-red-600 hover:bg-red-700 text-white shadow-sm text-xs sm:text-sm px-3 sm:px-4 py-2 h-8 sm:h-9"
              onClick={() => setIsDialogOpen(true)}
              disabled={isKeyLoading("add-expense")}
            >
              <ArrowUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Cash Out</span>
              <span className="sm:hidden">Out</span>
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white shadow-sm text-xs sm:text-sm px-3 sm:px-4 py-2 h-8 sm:h-9"
              onClick={() => setIsReceivedDialogOpen(true)}
              disabled={isKeyLoading("add-received")}
            >
              <ArrowDown className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Cash In</span>
              <span className="sm:hidden">In</span>
            </Button>
          </div>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 hover:shadow-sm transition-shadow">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Yesterday's Closing</div>
            <div className="text-base sm:text-lg font-semibold text-gray-900">₹{allExpenses.yesterdayClosingBalance || "0.00"}</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 hover:shadow-sm transition-shadow">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Opening Balance</div>
            <div className="text-base sm:text-lg font-semibold text-blue-600">₹{todaysOpeningBalance || "0.00"}</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 hover:shadow-sm transition-shadow sm:col-span-2 lg:col-span-1">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Current Balance</div>
            <div className="text-base sm:text-lg font-semibold text-green-600">₹{currentBalance || "0.00"}</div>
          </div>
        </div>
      </div>



      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px] mx-4">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Delete Transaction</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-gray-500">
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {expenseToDelete && (
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-900 truncate">{expenseToDelete.name}</span>
                <span className="text-sm font-semibold text-gray-900 ml-2">
                  ₹{typeof expenseToDelete.amount === "number"
                    ? expenseToDelete.amount.toFixed(2)
                    : parseFloat(expenseToDelete.amount || 0).toFixed(2)}
                </span>
              </div>
              <div className="text-xs text-gray-500">
                {expenseToDelete.date} • {expenseToDelete.description || 'No description'}
              </div>
            </div>
          )}
          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeletingExpense || isKeyLoading("delete-expense")}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <LoadingButton
              onClick={handleConfirmDelete}
              size="sm"
              loading={isDeletingExpense || isKeyLoading("delete-expense")}
              disabled={isDeletingExpense || isKeyLoading("delete-expense")}
              className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto"
            >
              Delete
            </LoadingButton>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Expense Dialog */}
      <Dialog open={isEditExpenseDialogOpen} onOpenChange={setIsEditExpenseDialogOpen}>
        <DialogContent className="sm:max-w-[400px] mx-4">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Edit Transaction</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-gray-500">
              Update the transaction details.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="editDate" className="text-xs sm:text-sm font-medium">Date</Label>
                <Input
                  id="editDate"
                  name="date"
                  type="date"
                  value={editFormData.date}
                  onChange={handleEditFormChange}
                  required
                  className="mt-1 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="editAmount" className="text-xs sm:text-sm font-medium">Amount</Label>
                <Input
                  id="editAmount"
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={editFormData.amount}
                  onChange={handleEditFormChange}
                  required
                  className="mt-1 text-sm"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="editName" className="text-xs sm:text-sm font-medium">Name</Label>
              <Input
                id="editName"
                name="name"
                placeholder="Enter transaction name"
                value={editFormData.name}
                onChange={handleEditFormChange}
                required
                className="mt-1 text-sm"
              />
            </div>

            <div>
              <Label htmlFor="editDescription" className="text-xs sm:text-sm font-medium">Description</Label>
              <Textarea
                id="editDescription"
                name="description"
                placeholder="Enter description (optional)"
                value={editFormData.description}
                onChange={handleEditFormChange}
                rows={2}
                className="mt-1 resize-none text-sm"
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditExpenseDialogOpen(false)}
                disabled={isUpdatingExpense || isKeyLoading("edit-expense")}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <LoadingButton
                type="submit"
                size="sm"
                loading={isUpdatingExpense || isKeyLoading("edit-expense")}
                disabled={isUpdatingExpense || isKeyLoading("edit-expense")}
                className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
              >
                Update
              </LoadingButton>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Expense Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[400px] mx-4">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Cash Out</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-gray-500">
              Record cash taken out from the drawer.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="date" className="text-xs sm:text-sm font-medium">Date</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                  className="mt-1 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="amount" className="text-xs sm:text-sm font-medium">Amount</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={handleInputChange}
                  required
                  className="mt-1 text-sm"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="name" className="text-xs sm:text-sm font-medium">Purpose</Label>
              <Input
                id="name"
                name="name"
                placeholder="Enter purpose (e.g., Petty cash, Supplies)"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="mt-1 text-sm"
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-xs sm:text-sm font-medium">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Enter additional details (optional)"
                value={formData.description}
                onChange={handleInputChange}
                rows={2}
                className="mt-1 resize-none text-sm"
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSubmitting || isKeyLoading("add-expense")}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <LoadingButton
                type="submit"
                size="sm"
                loading={isSubmitting || isKeyLoading("add-expense")}
                disabled={isSubmitting || isKeyLoading("add-expense")}
                className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
              >
                Record Cash Out
              </LoadingButton>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Received Amount Dialog */}
      <Dialog open={isReceivedDialogOpen} onOpenChange={setIsReceivedDialogOpen}>
        <DialogContent className="sm:max-w-[400px] mx-4">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Cash In</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-gray-500">
              Record cash added to the drawer.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleReceivedSubmit} className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="receivedDate" className="text-xs sm:text-sm font-medium">Date</Label>
                <Input
                  id="receivedDate"
                  name="date"
                  type="date"
                  value={receivedFormData.date}
                  onChange={handleReceivedInputChange}
                  required
                  className="mt-1 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="receivedAmount" className="text-xs sm:text-sm font-medium">Amount</Label>
                <Input
                  id="receivedAmount"
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={receivedFormData.amount}
                  onChange={handleReceivedInputChange}
                  required
                  className="mt-1 text-sm"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="receivedName" className="text-xs sm:text-sm font-medium">Source</Label>
              <Input
                id="receivedName"
                name="name"
                placeholder="Enter source (e.g., Guest payment, Deposit)"
                value={receivedFormData.name}
                onChange={handleReceivedInputChange}
                required
                className="mt-1 text-sm"
              />
            </div>

            <div>
              <Label htmlFor="receivedDescription" className="text-xs sm:text-sm font-medium">Description</Label>
              <Textarea
                id="receivedDescription"
                name="description"
                placeholder="Enter additional details (optional)"
                value={receivedFormData.description}
                onChange={handleReceivedInputChange}
                rows={2}
                className="mt-1 resize-none text-sm"
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsReceivedDialogOpen(false)}
                disabled={isSubmittingReceived || isKeyLoading("add-received")}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <LoadingButton
                type="submit"
                size="sm"
                loading={isSubmittingReceived || isKeyLoading("add-received")}
                disabled={isSubmittingReceived || isKeyLoading("add-received")}
                className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
              >
                Record Cash In
              </LoadingButton>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-6 sm:p-8">
            <CompactLoader message="Loading transactions..." />
          </div>
        ) : (expenses?.length === 0 && receivedAmounts?.length === 0) ? (
          <div className="text-center py-8 sm:py-12">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Plus className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
            </div>
            <p className="text-gray-500 text-sm">No transactions found</p>
            <p className="text-gray-400 text-xs mt-1">Record your first transaction to get started</p>
          </div>
        ) : (
          <div>
            <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-100">
              <h3 className="text-sm font-medium text-gray-900">Transactions</h3>
            </div>
            
            {/* Mobile Card View */}
            <div className="block sm:hidden">
              {currentTransactions.map((transaction) => (
                    <div key={transaction.id} className="border-b border-gray-100 p-3 last:border-b-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            transaction.type === 'expense' 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {transaction.type === 'expense' ? (
                              <ArrowDown className="h-3 w-3 mr-1" />
                            ) : (
                              <ArrowUp className="h-3 w-3 mr-1" />
                            )}
                            {transaction.type === 'expense' ? 'Out' : 'In'}
                          </span>
                          <span className="text-xs text-gray-500">{transaction.date}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditExpense(transaction)}
                            className="h-6 w-6 p-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteExpense(transaction)}
                            className="h-6 w-6 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="font-medium text-sm text-gray-900 mb-1">{transaction.name}</div>
                      {transaction.description && (
                        <div className="text-xs text-gray-600 mb-2 line-clamp-2">{transaction.description}</div>
                      )}
                      <div className="text-right">
                        <span className={`font-semibold text-sm ${
                          transaction.type === 'expense' ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {transaction.type === 'expense' ? '-' : '+'}₹{typeof transaction.amount === "number"
                            ? transaction.amount.toFixed(2)
                            : parseFloat(transaction.amount || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500">Type</th>
                    <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500">Date</th>
                    <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500">Purpose/Source</th>
                    <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500">Description</th>
                    <th className="px-3 lg:px-6 py-3 text-right text-xs font-medium text-gray-500">Amount</th>
                    <th className="px-3 lg:px-6 py-3 text-right text-xs font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {currentTransactions.map((transaction) => (
                        <tr key={transaction.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-3 lg:px-6 py-3">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              transaction.type === 'expense' 
                                ? 'bg-red-100 text-red-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {transaction.type === 'expense' ? (
                                <>
                                  <ArrowDown className="h-3 w-3 mr-1" />
                                  <span className="hidden lg:inline">Cash Out</span>
                                  <span className="lg:hidden">Out</span>
                                </>
                              ) : (
                                <>
                                  <ArrowUp className="h-3 w-3 mr-1" />
                                  <span className="hidden lg:inline">Cash In</span>
                                  <span className="lg:hidden">In</span>
                                </>
                              )}
                            </span>
                          </td>
                          <td className="px-3 lg:px-6 py-3 text-sm text-gray-600">
                            {transaction.date}
                          </td>
                          <td className="px-3 lg:px-6 py-3">
                            <div className="font-medium text-sm text-gray-900 max-w-[120px] lg:max-w-none truncate">{transaction.name}</div>
                          </td>
                          <td className="hidden lg:table-cell px-6 py-3 text-sm text-gray-600 max-w-xs truncate">
                            {transaction.description || '—'}
                          </td>
                          <td className="px-3 lg:px-6 py-3 text-right">
                            <span className={`font-medium text-sm ${
                              transaction.type === 'expense' ? 'text-red-600' : 'text-green-600'
                            }`}>
                              {transaction.type === 'expense' ? '-' : '+'}₹{typeof transaction.amount === "number"
                                ? transaction.amount.toFixed(2)
                                : parseFloat(transaction.amount || 0).toFixed(2)}
                            </span>
                          </td>
                          <td className="px-3 lg:px-6 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditExpense(transaction)}
                                className="h-7 w-7 p-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteExpense(transaction)}
                                className="h-7 w-7 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                              >
                                <Trash className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-3 sm:px-6 py-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="text-xs sm:text-sm text-gray-500">
                    Showing {startIndex + 1} to {Math.min(endIndex, allTransactions.length)} of {allTransactions.length} transactions
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    {/* Page numbers */}
                    <div className="flex items-center gap-1">
                      {(() => {
                        const pages = [];
                        const maxVisiblePages = 5;
                        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
                        
                        // Adjust start page if we're near the end
                        if (endPage - startPage + 1 < maxVisiblePages) {
                          startPage = Math.max(1, endPage - maxVisiblePages + 1);
                        }
                        
                        // First page
                        if (startPage > 1) {
                          pages.push(
                            <Button
                              key={1}
                              variant={currentPage === 1 ? "default" : "outline"}
                              size="sm"
                              onClick={() => handlePageChange(1)}
                              className="h-8 w-8 p-0 text-xs"
                            >
                              1
                            </Button>
                          );
                          if (startPage > 2) {
                            pages.push(
                              <span key="ellipsis1" className="px-2 text-gray-400 text-xs">
                                ...
                              </span>
                            );
                          }
                        }
                        
                        // Middle pages
                        for (let i = startPage; i <= endPage; i++) {
                          pages.push(
                            <Button
                              key={i}
                              variant={currentPage === i ? "default" : "outline"}
                              size="sm"
                              onClick={() => handlePageChange(i)}
                              className="h-8 w-8 p-0 text-xs"
                            >
                              {i}
                            </Button>
                          );
                        }
                        
                        // Last page
                        if (endPage < totalPages) {
                          if (endPage < totalPages - 1) {
                            pages.push(
                              <span key="ellipsis2" className="px-2 text-gray-400 text-xs">
                                ...
                              </span>
                            );
                          }
                          pages.push(
                            <Button
                              key={totalPages}
                              variant={currentPage === totalPages ? "default" : "outline"}
                              size="sm"
                              onClick={() => handlePageChange(totalPages)}
                              className="h-8 w-8 p-0 text-xs"
                            >
                              {totalPages}
                            </Button>
                          );
                        }
                        
                        return pages;
                      })()}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Expenses;
