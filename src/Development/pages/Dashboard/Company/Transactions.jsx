import React from "react"
import { useParams, useNavigate } from "react-router"
import { useAppContext } from "@/Development/context/AppContext.jsx"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/Development/components/ui/card.js"
import { Button } from "@/Development/components/ui/button.js"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/Development/components/ui/table.js"
import { Badge } from "@/Development/components/ui/badge.js"
import { cn } from "@/Development/lib/utils.js"
import { ChevronLeft, ChevronRight, ArrowLeft, Plus, Download, Filter, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/Development/components/ui/dialog.js"
import { Input } from "@/Development/components/ui/input.js"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Development/components/ui/select.js"
import { Label } from "@/Development/components/ui/label.js"
import * as XLSX from 'xlsx'

const fmtCurrency = (n) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n ?? 0)

const fmtDate = (d) => {
  let date
  if (typeof d === "number") {
    // Handle Unix timestamp (both seconds and milliseconds)
    date = new Date(d > 1e10 ? d : d * 1000)
  } else if (typeof d === "string") {
    date = new Date(d)
  } else {
    date = d
  }

  if (!date || isNaN(date?.getTime?.())) return "—"
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
}

const fmtDateForInput = (d) => {
  let date
  if (typeof d === "number") {
    // Handle Unix timestamp (both seconds and milliseconds)
    date = new Date(d > 1e10 ? d : d * 1000)
  } else if (typeof d === "string") {
    date = new Date(d)
  } else {
    date = d
  }

  if (!date || isNaN(date?.getTime?.())) return ""
  return date.toISOString().split('T')[0]
}

export default function CompanyTransactions() {
  const params = useParams()
  const navigate = useNavigate()
  const { companies = [], bills = [], updateCompany, addExpense } = useAppContext() || {}
  const companyId = React.useMemo(() => {
    const raw = params?.id
    return Array.isArray(raw) ? raw[0] : raw
  }, [params])

  const company =
    companies.find((c) => String(c?.id) === String(companyId)) ||
    companies.find((c) => String(c?.company_id) === String(companyId))

  const companyName = company?.name || company?.companyName || "Company"
  // Filter states
  const [filterYear, setFilterYear] = React.useState("")
  const [filterMonth, setFilterMonth] = React.useState("")
  const [filterStartDate, setFilterStartDate] = React.useState("")
  const [filterEndDate, setFilterEndDate] = React.useState("")
  const [showFilterDialog, setShowFilterDialog] = React.useState(false)

  // Temporary filter states for the dialog
  const [tempFilterYear, setTempFilterYear] = React.useState("")
  const [tempFilterMonth, setTempFilterMonth] = React.useState("")
  const [tempFilterStartDate, setTempFilterStartDate] = React.useState("")
  const [tempFilterEndDate, setTempFilterEndDate] = React.useState("")

  const deposits = (company?.deposits || []).map((d) => ({
    kind: "deposit",
    date: d?.date || d?.createdAt || d?.paidAt,
    reference: "",
    guest: "",
    credit: 0,
    deposit: Math.abs(Number(d?.amount ?? 0)),
    paymentMode: d?.payment_mode || "Unknown"
  }))

  // Get credits from both company data and bills (BTC payment mode)
  const credits = React.useMemo(() => {
    const creditsFromCompany = (company?.credits || []).map(creditObj => {
      // Handle the structure where each credit is an object with timestamp as key
      const entries = Object.entries(creditObj)
      if (entries.length === 0) return null
      
      const [timestamp, creditData] = entries[0]
      
      // Convert timestamp to Date object
      const creditDate = new Date(parseInt(timestamp) * 1000)
      
      return {
        kind: "credit",
        date: creditDate,
        reference: creditData.orderId || "",
        guest: creditData.name || "Company Credit",
        credit: Math.abs(Number(creditData.amount || 0)),
        deposit: 0,
        source: "company",
        type: creditData.type || "company",
        paymentMode: creditData.payment_mode || "Company Credit"
      }
    }).filter(Boolean) // Remove any null entries

    const creditsFromBills = bills
      .filter(bill => {
        // Check if bill belongs to this company
        const billCompanyId = bill?.bill?.bookingDetails?.companyId
        if (String(billCompanyId) !== String(companyId)) return false

        // Check if payment mode is BTC (company credit)
        return bill?.payment_mode === 'BTC'
      })
      .map(bill => {
        // Extract company ID for this bill
        const billCompanyId = bill?.bill?.bookingDetails?.companyId
        
        // Extract checkout date from bill - handle timestamp conversion
        let checkoutDate = bill?.bill?.bookingDetails?.checkOut ||
          bill?.bill?.billHeader?.billDate ||
          bill?.created_at

        // Convert timestamp to Date object if it's a number
        if (typeof checkoutDate === 'number') {
          checkoutDate = new Date(checkoutDate > 1e10 ? checkoutDate : checkoutDate * 1000)
        }

        // Extract guest name from bill
        const guestName = bill?.bill?.guestDetails?.guestName ||
          bill?.bill?.guestDetails?.guest_name ||
          "Unknown Guest"

        // Extract bill amount from billing summary - LOG ALL POSSIBLE AMOUNTS
        const balanceDue = bill?.bill?.billingSummary?.balanceDue
        const totalAmount = bill?.bill?.finalSummary?.totalAmount
        const grandTotal = bill?.bill?.summary?.grandTotal
        const subTotal = bill?.bill?.billingSummary?.subTotal
        const roomCharges = bill?.bill?.billingSummary?.totalRoomServices
        const serviceCharges = bill?.bill?.billingSummary?.totalServiceCharges
        const taxAmount = bill?.bill?.billingSummary?.totalTaxAmount
        const discountAmount = bill?.bill?.billingSummary?.totalDiscount
        const advancePayment = bill?.bill?.billingSummary?.partialPayment

        // Log detailed bill information for debugging
        console.log('=== BILL CREDIT DEBUG ===', {
          billId: bill?.bill_id,
          guestName: guestName,
          paymentMode: bill?.payment_mode,
          companyId: billCompanyId,
          amounts: {
            balanceDue: balanceDue,
            totalAmount: totalAmount,
            grandTotal: grandTotal,
            subTotal: subTotal,
            roomCharges: roomCharges,
            serviceCharges: serviceCharges,
            taxAmount: taxAmount,
            discountAmount: discountAmount,
            advancePayment: advancePayment
          },
          billStructure: {
            hasBillingSummary: !!bill?.bill?.billingSummary,
            hasFinalSummary: !!bill?.bill?.finalSummary,
            hasSummary: !!bill?.bill?.summary,
            billingSummaryKeys: bill?.bill?.billingSummary ? Object.keys(bill.bill.billingSummary) : [],
            finalSummaryKeys: bill?.bill?.finalSummary ? Object.keys(bill.bill.finalSummary) : []
          }
        })

        // Calculate the correct amount instead of using potentially incorrect stored values
        let calculatedAmount = 0
        
        if (subTotal !== undefined && taxAmount !== undefined) {
          // Use subTotal + taxAmount (this should be the correct calculation)
          calculatedAmount = subTotal + taxAmount
          console.log('Using calculated amount (subTotal + taxAmount):', calculatedAmount)
        } else if (balanceDue !== undefined) {
          // Fallback to balanceDue if calculation fields are missing
          calculatedAmount = balanceDue
          console.log('Using balanceDue as fallback:', calculatedAmount)
        } else if (totalAmount !== undefined) {
          // Fallback to totalAmount
          calculatedAmount = totalAmount
          console.log('Using totalAmount as fallback:', calculatedAmount)
        } else if (grandTotal !== undefined) {
          // Fallback to grandTotal
          calculatedAmount = grandTotal
          console.log('Using grandTotal as fallback:', calculatedAmount)
        }

        console.log('Final selected bill amount for credit:', calculatedAmount)
        console.log('Amount breakdown:', {
          subTotal: subTotal,
          taxAmount: taxAmount,
          calculatedAmount: calculatedAmount,
          balanceDue: balanceDue,
          totalAmount: totalAmount,
          grandTotal: grandTotal
        })

        return {
          kind: "credit",
          date: checkoutDate,
          reference: bill?.bill_id || "",
          guest: guestName,
          credit: Math.abs(Number(calculatedAmount)),
          deposit: 0,
          source: "bill",
          paymentMode: bill?.payment_mode || "BTC"
        }
      })
      .filter(credit => credit.date && !isNaN(new Date(credit.date).getTime())) // Only include credits with valid dates

    // Combine both sources
    return [...creditsFromCompany, ...creditsFromBills]
  }, [bills, companyId, company?.credits])

  console.log("Company Credits:", credits.filter(c => c.source === "company"))
  console.log("Bill Credits (BTC):", credits.filter(c => c.source === "bill"))
  console.log("All Credits:", credits)
  
  // Log detailed credit information for debugging
  credits.filter(c => c.source === "bill").forEach((credit, index) => {
    console.log(`=== CREDIT ${index + 1} DETAILS ===`, {
      guest: credit.guest,
      reference: credit.reference,
      creditAmount: credit.credit,
      date: credit.date,
      source: credit.source
    })
  })

  const merged = React.useMemo(() => {
    const rows = [...deposits, ...credits].filter((r) => r.date)
    rows.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    let balance = 0
    const withBalance = rows.map((r) => {
      balance += Number(r.deposit) - Number(r.credit)
      return { ...r, balance }
    })
    // Sort by date in descending order - most recent first
    return withBalance.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [deposits, credits])

  // Generate filter options based on actual data
  const filterOptions = React.useMemo(() => {
    const years = new Set()
    const months = new Set()
    let minDate = null
    let maxDate = null

    merged.forEach(transaction => {
      let date
      if (typeof transaction.date === 'number') {
        date = new Date(transaction.date > 1e10 ? transaction.date : transaction.date * 1000)
      } else {
        date = new Date(transaction.date)
      }

      if (!isNaN(date.getTime())) {
        years.add(date.getFullYear())
        months.add(date.getMonth())

        if (!minDate || date < minDate) minDate = date
        if (!maxDate || date > maxDate) maxDate = date
      }
    })

    const sortedYears = Array.from(years).sort((a, b) => b - a) // Most recent first
    const sortedMonths = Array.from(months).sort((a, b) => a - b) // January to December

    return {
      years: sortedYears,
      months: sortedMonths,
      minDate: minDate ? fmtDateForInput(minDate) : "",
      maxDate: maxDate ? fmtDateForInput(maxDate) : ""
    }
  }, [merged])

  // Filter function
  const applyFilters = (transactions) => {
    return transactions.filter((transaction) => {
      let transactionDate
      if (typeof transaction.date === 'number') {
        transactionDate = new Date(transaction.date > 1e10 ? transaction.date : transaction.date * 1000)
      } else {
        transactionDate = new Date(transaction.date)
      }

      if (!transaction.date || isNaN(transactionDate.getTime())) return false

      // Year filter
      if (filterYear && transactionDate.getFullYear() !== parseInt(filterYear)) {
        return false
      }

      // Month filter (0-indexed)
      if (filterMonth && transactionDate.getMonth() !== parseInt(filterMonth)) {
        return false
      }

      // Date range filter
      if (filterStartDate) {
        const startDate = new Date(filterStartDate)
        if (transactionDate < startDate) return false
      }

      if (filterEndDate) {
        const endDate = new Date(filterEndDate)
        endDate.setHours(23, 59, 59, 999) // Include the entire end date
        if (transactionDate > endDate) return false
      }

      return true
    })
  }

  // Apply filters to merged data
  const filteredMerged = React.useMemo(() => {
    return applyFilters(merged)
  }, [merged, filterYear, filterMonth, filterStartDate, filterEndDate])

  const totals = React.useMemo(() => {
    const totalCredit = filteredMerged.reduce((sum, r) => sum + (r.credit || 0), 0)
    const totalDeposit = filteredMerged.reduce((sum, r) => sum + (r.deposit || 0), 0)
    const balance = totalDeposit - totalCredit
    return { totalCredit, totalDeposit, balance }
  }, [filteredMerged])

  const PAGE_SIZE = 10
  const [page, setPage] = React.useState(1)
  const totalPages = Math.max(1, Math.ceil(filteredMerged.length / PAGE_SIZE))
  const pageRows = React.useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filteredMerged.slice(start, start + PAGE_SIZE)
  }, [filteredMerged, page])

  const canPrev = page > 1
  const canNext = page < totalPages

  // Reset page when filters change
  React.useEffect(() => {
    setPage(1)
  }, [filterYear, filterMonth, filterStartDate, filterEndDate])

  const [showDepositDialog, setShowDepositDialog] = React.useState(false)
  const [depositAmount, setDepositAmount] = React.useState("")
  const [depositPaymentMode, setDepositPaymentMode] = React.useState("")
  const [depositUpiPlatform, setDepositUpiPlatform] = React.useState("")
  const [depositError, setDepositError] = React.useState(null)
  const [depositLoading, setDepositLoading] = React.useState(false)

  const handleDeposit = async (e) => {
    e.preventDefault()
    setDepositError(null)
    const amount = Number(depositAmount)
    
    // Validation
    if (isNaN(amount) || amount <= 0) {
      setDepositError("Please enter a valid deposit amount")
      return
    }
    
    if (!depositPaymentMode) {
      setDepositError("Please select a payment mode")
      return
    }
    
    if (depositPaymentMode === "UPI" && !depositUpiPlatform) {
      setDepositError("Please select a UPI platform")
      return
    }
    
    setDepositLoading(true)
    try {
      // Determine the final UPI platform value
      const finalUpiPlatform = depositUpiPlatform === "Others" ? "" : depositUpiPlatform
      
      await updateCompany?.({
        company_id: companyId,
        deposit: {
          date: new Date().toISOString(),
          amount,
          payment_mode: depositPaymentMode,
          upi_platform: depositPaymentMode === "UPI" ? finalUpiPlatform : null,
        },
      })
      
      // If payment is cash, add to cash drawer as received
      if (depositPaymentMode === "Cash") {
        try {
          const company = companies.find(c => c.company_id === companyId)
          const cashReceivedData = {
            date: new Date().toLocaleDateString("en-GB"), // DD/MM/YYYY format
            name: `${company?.name || 'Company'} - Deposit`,
            description: `Cash deposit received from ${company?.name || 'Company'}`,
            amount: amount,
            bill_id: `DEPOSIT_${companyId}_${Date.now()}`, // Store unique reference
            receivedId: Math.random().toString(36).substr(2, 9), // Generate unique ID
          };

          // Add to cash drawer as received amount
          addExpense({ received: cashReceivedData });
          console.log("Cash deposit added to expenses:", cashReceivedData);
        } catch (expenseError) {
          console.error("Error adding cash deposit to expenses:", expenseError);
          // Don't fail the deposit if expense tracking fails
        }
      }
      
      setShowDepositDialog(false)
      setDepositAmount("")
      setDepositPaymentMode("")
      setDepositUpiPlatform("")
    } catch (err) {
      setDepositError("Failed to add deposit")
    } finally {
      setDepositLoading(false)
    }
  }

  const openFilterDialog = () => {
    // Set temp values to current filter values
    setTempFilterYear(filterYear)
    setTempFilterMonth(filterMonth)
    setTempFilterStartDate(filterStartDate)
    setTempFilterEndDate(filterEndDate)
    setShowFilterDialog(true)
  }

  const applyFilterChanges = () => {
    setFilterYear(tempFilterYear)
    setFilterMonth(tempFilterMonth)
    setFilterStartDate(tempFilterStartDate)
    setFilterEndDate(tempFilterEndDate)
    setShowFilterDialog(false)
  }

  const clearAllFilters = () => {
    setTempFilterYear("")
    setTempFilterMonth("")
    setTempFilterStartDate("")
    setTempFilterEndDate("")
  }

  const clearFilters = () => {
    setFilterYear("")
    setFilterMonth("")
    setFilterStartDate("")
    setFilterEndDate("")
  }

  const hasActiveFilters = filterYear || filterMonth || filterStartDate || filterEndDate
  const hasTempFilterChanges = tempFilterYear || tempFilterMonth || tempFilterStartDate || tempFilterEndDate

  const handleExportToExcel = () => {
    try {
      // Use filtered data for export
      const exportData = filteredMerged.map((row, index) => ({
        'S.No': index + 1,
        'Date': fmtDate(row.date),
        'Guest': row.kind === 'deposit' ? 'N/A' : (row.guest || '—'),
        'Reference': row.kind === 'deposit' ? 'N/A' : (row.reference || '—'),
        'Payment Mode': row.paymentMode || '—',
        'Credit (₹)': row.credit || 0,
        'Deposit (₹)': row.deposit || 0,
        'Balance (₹)': row.balance,
        'Type': row.kind === 'deposit' ? 'Deposit' : 'Credit',
        'Source': row.source === 'company' ? (row.type || 'Company Credit') : row.source === 'bill' ? 'Bill Credit' : 'Unknown',
      }))

      // Add summary row at the end
      exportData.push({
        'S.No': '',
        'Date': '',
        'Guest': '',
        'Reference': 'TOTAL',
        'Credit (₹)': totals.totalCredit,
        'Deposit (₹)': totals.totalDeposit,
        'Balance (₹)': totals.balance,
        'Type': 'Summary',
      })

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(exportData)

      // Set column widths
      const colWidths = [
        { wch: 8 },   // S.No
        { wch: 12 },  // Date
        { wch: 20 },  // Guest
        { wch: 15 },  // Reference
        { wch: 15 },  // Payment Mode
        { wch: 12 },  // Credit
        { wch: 12 },  // Deposit
        { wch: 12 },  // Balance
        { wch: 10 },  // Type
        { wch: 15 },  // Source
      ]
      ws['!cols'] = colWidths

      // Style the header row (make it bold)
      const range = XLSX.utils.decode_range(ws['!ref'])
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col })
        if (!ws[cellAddress]) continue
        ws[cellAddress].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: "E0E0E0" } }
        }
      }

      // Style the summary row
      const summaryRowIndex = exportData.length - 1
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: summaryRowIndex + 1, c: col })
        if (!ws[cellAddress]) continue
        ws[cellAddress].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: "F0F0F0" } }
        }
      }

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Transactions')

      // Generate filename with company name, filters, and current date
      const today = new Date().toISOString().split('T')[0]
      let filename = `${companyName.replace(/[^a-zA-Z0-9]/g, '_')}_Transactions`

      // Add filter info to filename
      if (hasActiveFilters) {
        const filterParts = []
        if (filterYear) filterParts.push(`Year${filterYear}`)
        if (filterMonth) filterParts.push(`Month${parseInt(filterMonth) + 1}`)
        if (filterStartDate) filterParts.push(`From${filterStartDate}`)
        if (filterEndDate) filterParts.push(`To${filterEndDate}`)
        if (filterParts.length > 0) {
          filename += `_Filtered_${filterParts.join('_')}`
        }
      }

      filename += `_${today}.xlsx`

      // Save the file
      XLSX.writeFile(wb, filename)
    } catch (error) {
      console.error('Error exporting to Excel:', error)
      alert('Failed to export data. Please try again.')
    }
  }

  // Month names for display
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6">
      {/* Heading + Back */}
      <div className="mb-4 flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/company')} aria-label="Go back">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <h1 className="text-xl font-semibold text-pretty">{companyName} — Transactions</h1>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={openFilterDialog}
            disabled={merged.length === 0}
          >
            <Filter className="h-4 w-4 mr-1" />
            Filters
            {hasActiveFilters && (
              <Badge variant="destructive" className="ml-1 h-2 w-2 p-0" />
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportToExcel}
            disabled={filteredMerged.length === 0}
          >
            <Download className="h-4 w-4 mr-1" />
            Export Excel
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => setShowDepositDialog(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            New Deposit
          </Button>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Active Filters:</span>
          {filterYear && (
            <Badge variant="secondary" className="gap-1">
              Year: {filterYear}
              <X className="h-3 w-3 cursor-pointer" onClick={() => setFilterYear("")} />
            </Badge>
          )}
          {filterMonth && (
            <Badge variant="secondary" className="gap-1">
              Month: {monthNames[parseInt(filterMonth)]}
              <X className="h-3 w-3 cursor-pointer" onClick={() => setFilterMonth("")} />
            </Badge>
          )}
          {filterStartDate && (
            <Badge variant="secondary" className="gap-1">
              From: {filterStartDate}
              <X className="h-3 w-3 cursor-pointer" onClick={() => setFilterStartDate("")} />
            </Badge>
          )}
          {filterEndDate && (
            <Badge variant="secondary" className="gap-1">
              To: {filterEndDate}
              <X className="h-3 w-3 cursor-pointer" onClick={() => setFilterEndDate("")} />
            </Badge>
          )}
          <Button variant="ghost" size="sm" onClick={clearFilters} className="ml-2">
            <X className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        </div>
      )}

      {/* Filter Dialog */}
      <Dialog open={showFilterDialog} onOpenChange={setShowFilterDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Filter Transactions</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            {/* Year Filter */}
            <div className="space-y-2">
              <Label htmlFor="filter-year">Year</Label>
              <Select value={tempFilterYear} onValueChange={setTempFilterYear}>
                <SelectTrigger id="filter-year">
                  <SelectValue placeholder={
                    filterOptions.years.length > 0
                      ? "Select year"
                      : "No years available"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {filterOptions.years.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Month Filter */}
            <div className="space-y-2">
              <Label htmlFor="filter-month">Month</Label>
              <Select value={tempFilterMonth} onValueChange={setTempFilterMonth}>
                <SelectTrigger id="filter-month">
                  <SelectValue placeholder={
                    filterOptions.months.length > 0
                      ? "Select month"
                      : "No months available"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {filterOptions.months.map(monthIndex => (
                    <SelectItem key={monthIndex} value={monthIndex.toString()}>
                      {monthNames[monthIndex]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Start Date Filter */}
            <div className="space-y-2">
              <Label htmlFor="filter-start-date">From Date</Label>
              <Input
                id="filter-start-date"
                type="date"
                value={tempFilterStartDate}
                onChange={(e) => setTempFilterStartDate(e.target.value)}
                min={filterOptions.minDate}
                max={filterOptions.maxDate}
              />
              {filterOptions.minDate && (
                <p className="text-xs text-muted-foreground">
                  Earliest: {filterOptions.minDate}
                </p>
              )}
            </div>

            {/* End Date Filter */}
            <div className="space-y-2">
              <Label htmlFor="filter-end-date">To Date</Label>
              <Input
                id="filter-end-date"
                type="date"
                value={tempFilterEndDate}
                onChange={(e) => setTempFilterEndDate(e.target.value)}
                min={filterOptions.minDate}
                max={filterOptions.maxDate}
              />
              {filterOptions.maxDate && (
                <p className="text-xs text-muted-foreground">
                  Latest: {filterOptions.maxDate}
                </p>
              )}
            </div>
          </div>

          {/* Data summary */}
          {merged.length > 0 && (
            <div className="bg-muted/30 p-3 rounded-lg text-sm">
              <div className="font-medium mb-1">Available Data:</div>
              <div className="text-muted-foreground">
                {filterOptions.years.length > 0 && (
                  <div>Years: {filterOptions.years.join(', ')}</div>
                )}
                {filterOptions.minDate && filterOptions.maxDate && (
                  <div>Date range: {filterOptions.minDate} to {filterOptions.maxDate}</div>
                )}
                <div>Total transactions: {merged.length}</div>
              </div>
            </div>
          )}

          {/* Preview of temp filters */}
          {hasTempFilterChanges && (
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="text-sm font-medium mb-2">Preview Filters:</div>
              <div className="flex flex-wrap gap-2">
                {tempFilterYear && (
                  <Badge variant="outline">Year: {tempFilterYear}</Badge>
                )}
                {tempFilterMonth && (
                  <Badge variant="outline">Month: {monthNames[parseInt(tempFilterMonth)]}</Badge>
                )}
                {tempFilterStartDate && (
                  <Badge variant="outline">From: {tempFilterStartDate}</Badge>
                )}
                {tempFilterEndDate && (
                  <Badge variant="outline">To: {tempFilterEndDate}</Badge>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            {hasTempFilterChanges && (
              <Button variant="outline" onClick={clearAllFilters}>
                Clear All
              </Button>
            )}
            <DialogClose asChild>
              <Button variant="ghost">
                Cancel
              </Button>
            </DialogClose>
            <Button onClick={applyFilterChanges}>
              Apply Filters
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deposit Dialog */}
      <Dialog open={showDepositDialog} onOpenChange={setShowDepositDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleDeposit}>
            <DialogHeader>
              <DialogTitle>Add Deposit</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="deposit-amount" className="text-sm font-medium">
                  Amount <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="deposit-amount"
                  type="number"
                  value={depositAmount}
                  onChange={e => setDepositAmount(e.target.value)}
                  min={0.01}
                  step={0.01}
                  placeholder="Enter deposit amount"
                  required
                  disabled={depositLoading}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-sm font-medium">
                  Payment Mode <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={depositPaymentMode}
                  onValueChange={setDepositPaymentMode}
                  disabled={depositLoading}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select payment mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="UPI">UPI</SelectItem>
                    <SelectItem value="Credit Card">Credit Card</SelectItem>
                    <SelectItem value="Debit Card">Debit Card</SelectItem>
                    <SelectItem value="Net Banking">Net Banking</SelectItem>
                    <SelectItem value="Wallet">Wallet</SelectItem>
                    <SelectItem value="NEFT">NEFT</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* UPI Platform Dropdown - Only show when UPI is selected */}
              {depositPaymentMode === "UPI" && (
                <div>
                  <Label className="text-sm font-medium">
                    UPI Platform <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={depositUpiPlatform}
                    onValueChange={setDepositUpiPlatform}
                    disabled={depositLoading}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select UPI platform" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Paytm">Paytm</SelectItem>
                      <SelectItem value="PhonePe">PhonePe</SelectItem>
                      <SelectItem value="Google Pay">Google Pay</SelectItem>
                      <SelectItem value="Amazon Pay">Amazon Pay</SelectItem>
                      <SelectItem value="BHIM">BHIM</SelectItem>
                      <SelectItem value="Mobikwik">Mobikwik</SelectItem>
                      <SelectItem value="Freecharge">Freecharge</SelectItem>
                      <SelectItem value="Others">Others</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {depositError && (
                <div className="p-3 rounded-md bg-red-50 border border-red-200">
                  <p className="text-sm text-red-600">{depositError}</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={depositLoading}>
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" variant="default" disabled={depositLoading}>
                {depositLoading ? "Saving..." : "Add Deposit"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* KPIs */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium">Total Credit</CardTitle>
            <CardDescription className="text-base font-semibold text-foreground">
              {fmtCurrency(totals.totalCredit)}
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium">Total Deposit</CardTitle>
            <CardDescription className="text-base font-semibold text-foreground">
              {fmtCurrency(totals.totalDeposit)}
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium">Balance</CardTitle>
            <CardDescription
              className={cn("text-base font-semibold", totals.balance >= 0 ? "text-emerald-600" : "text-red-600")}
            >
              {fmtCurrency(totals.balance)}
              {totals.balance < 0 ? " Due" : ""}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Transaction History</CardTitle>
          <CardDescription>
            Guest first. Deposits hide Guest and Reference.
            {hasActiveFilters && (
              <span className="text-blue-600 ml-2">
                • Showing {filteredMerged.length} of {merged.length} transactions
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead>Guest</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Payment Mode</TableHead>
                  <TableHead className="text-right">Credit</TableHead>
                  <TableHead className="text-right">Deposit</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      {hasActiveFilters ? "No transactions match the current filters." : "No transactions yet."}
                    </TableCell>
                  </TableRow>
                ) : (
                  pageRows.map((r, idx) => {
                    const isDeposit = r.deposit > 0
                    const guest = isDeposit ? "" : r.guest || "—"
                    const ref = isDeposit ? "" : r.reference || "—"
                    const source = r.source || "unknown"
                    const paymentMode = r.paymentMode || "—"
                    
                    return (
                      <TableRow key={`${r.kind}-${idx}`} className="hover:bg-muted/40">
                        <TableCell className="whitespace-nowrap">
                          {guest}
                          {source === "company" && r.type && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              {r.type}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{fmtDate(r.date)}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          {ref ? <Badge variant="secondary">{ref}</Badge> : " "}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge variant="outline" className="text-xs">
                            {paymentMode}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{r.credit ? fmtCurrency(r.credit) : "—"}</TableCell>
                        <TableCell className="text-right">{r.deposit ? fmtCurrency(r.deposit) : "—"}</TableCell>
                        <TableCell
                          className={cn("text-right font-medium", r.balance >= 0 ? "text-emerald-600" : "text-red-600")}
                        >
                          {fmtCurrency(r.balance)}
                          {r.balance < 0 ? " Due" : ""}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Page {page} of {totalPages} • {filteredMerged.length} transactions
              {hasActiveFilters && ` (filtered from ${merged.length} total)`}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!canPrev}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={!canNext}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}