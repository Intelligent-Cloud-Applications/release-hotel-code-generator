import { useMemo, useState } from "react"
import { Link, useNavigate } from "react-router"
import { useAppContext } from "@/Development/context/AppContext.jsx"
import { Button } from "@/Development/components/ui/button.js"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/Development/components/ui/table.js"
import { Input } from "@/Development/components/ui/input.js"
import { Eye, Pencil, Trash2, Plus, Download, Loader2 } from "lucide-react"
import { Label } from "@/Development/components/ui/label.js"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/Development/components/ui/dialog.js"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/Development/components/ui/alert-dialog.js"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/Development/components/ui/card.js"

export default function ClientCompaniesList() {
  const { companies, createCompany, updateCompany, deleteCompany, bills = [] } = useAppContext()
  const navigate = useNavigate()
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)
  const pageSize = 10

  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const [companyName, setCompanyName] = useState("")
  const [gstNo, setGstNo] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  // Enhanced companies with calculated metrics
  const enhancedCompanies = useMemo(() => {
    return companies.map(company => {
      const companyId = company?.company_id || company?.id

      // Only calculate metrics if company has a valid ID
      if (!companyId) {
        return {
          ...company,
          calculatedBookings: 0,
          calculatedRevenue: 0,
          calculatedOutstanding: 0,
          calculatedLastBooking: null
        }
      }

      // Get all bills for this company with BTC payment mode
      const companyBills = bills.filter(bill => {
        const billCompanyId = bill?.bill?.bookingDetails?.companyId
        return billCompanyId && String(billCompanyId) === String(companyId) && bill?.payment_mode === 'BTC'
      })

      // Calculate revenue from bills
      const companyRevenue = companyBills.reduce((sum, bill) => {
        const billAmount = bill?.bill?.billingSummary?.balanceDue ||
          bill?.bill?.finalSummary?.totalAmount ||
          0
        return sum + Math.abs(Number(billAmount))
      }, 0)

      // Calculate deposits - ensure it's always an array
      const deposits = Array.isArray(company?.deposits) ? company.deposits : []
      const companyDeposits = deposits
        .reduce((sum, deposit) => sum + Math.abs(Number(deposit?.amount ?? 0)), 0)

      // Calculate outstanding (deposits - revenue, negative means company owes money)
      const outstanding = companyDeposits - companyRevenue

      // Get last booking date from bills
      const lastBookingDate = companyBills.length > 0
        ? companyBills
          .map(bill => {
            // Extract date from checkout, bill date, or created date
            let date = bill?.bill?.bookingDetails?.checkOut ||
              bill?.bill?.billHeader?.billDate ||
              bill?.created_at

            // Convert timestamp to Date if needed
            if (typeof date === 'number') {
              date = new Date(date > 1e10 ? date : date * 1000)
            }
            return date
          })
          .filter(Boolean)
          .filter(date => !isNaN(new Date(date).getTime()))
          .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0]
        : null

      return {
        ...company,
        calculatedBookings: companyBills.length,
        calculatedRevenue: companyRevenue,
        calculatedOutstanding: outstanding,
        calculatedLastBooking: lastBookingDate
      }
    })
  }, [companies, bills])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return enhancedCompanies
    return enhancedCompanies.filter((c) => {
      const name = String(c?.name ?? "").toLowerCase()
      const company_id = String(c?.company_id ?? "").toLowerCase()
      const city = String(c?.city ?? "").toLowerCase()
      const email = String(c?.email ?? "").toLowerCase()
      const gst_no = String(c?.gst_no ?? "").toLowerCase()
      return name.includes(q) || company_id.includes(q) || city.includes(q) || email.includes(q) || gst_no.includes(q)
    })
  }, [enhancedCompanies, query])

  console.log(companies, filtered)
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, currentPage])

  const handleOpenCreate = () => {
    setSelected(null)
    setCompanyName("")
    setGstNo("")
    setCreateOpen(true)
  }

  const handleSubmitCreate = async () => {
    const name = companyName.trim()
    const gst_no = gstNo.trim()
    if (!name) return

    setIsCreating(true)
    try {
      await Promise.resolve(createCompany?.({ name, gst_no }))
      setCreateOpen(false)
      setCompanyName("")
      setGstNo("")
    } catch (e) {
      console.error("[v0] createCompany error:", e)
    } finally {
      setIsCreating(false)
    }
  }

  const handleOpenEdit = (company) => {
    setSelected(company)
    setCompanyName(company?.name ?? "")
    setGstNo(company?.gst_no ?? "")
    setEditOpen(true)
  }

  const handleSubmitEdit = async () => {
    const name = companyName.trim()
    const gst_no = gstNo.trim()
    if (!name || !selected?.company_id) return
    try {
      await Promise.resolve(updateCompany?.({ company_id: selected.company_id, name, gst_no }))
      setEditOpen(false)
      setSelected(null)
      setCompanyName("")
      setGstNo("")
    } catch (e) {
      console.error("[v0] updateCompany error:", e)
    }
  }

  const handleOpenDelete = (company) => {
    setSelected(company)
    setDeleteOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!selected?.company_id) return
    try {
      await Promise.resolve(deleteCompany?.(selected.company_id))
    } catch (e) {
      console.error("[v0] deleteCompany error:", e)
    } finally {
      setDeleteOpen(false)
      setSelected(null)
    }
  }

  const currencyFormatter = useMemo(() => {
    try {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
      })
    } catch {
      return { format: (n) => String(n ?? "—") }
    }
  }, [])

  const formatMoney = (value) => {
    const num = Number(value)
    if (!isFinite(num)) return "—"
    return currencyFormatter.format(num)
  }

  const formatDate = (value) => {
    if (!value) return "—"

    let date
    if (typeof value === 'number') {
      date = new Date(value > 1e10 ? value : value * 1000)
    } else {
      date = new Date(value)
    }

    if (isNaN(date.getTime())) return "—"
    return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
  }

  const handleExportCompanies = () => {
    // Prepare company data for export
    const exportData = enhancedCompanies.map(company => ({
      company_name: company?.name ?? "—",
      gst_number: company?.gst_no ?? "—",
      bookings: company?.calculatedBookings ?? 0,
      revenue: company?.calculatedRevenue ?? 0,
      outstanding: company?.calculatedOutstanding ?? 0,
      last_booking: company?.calculatedLastBooking ? formatDate(company.calculatedLastBooking) : "—"
    }))

    // Store data in sessionStorage for the Report component to access
    sessionStorage.setItem('exportData', JSON.stringify({
      type: 'companies',
      data: exportData,
      columns: [
        { key: 'company_name', label: 'Company Name', type: 'text' },
        { key: 'gst_number', label: 'GST Number', type: 'text' },
        { key: 'bookings', label: 'Bills', type: 'number' },
        { key: 'revenue', label: 'Revenue', type: 'currency' },
        { key: 'outstanding', label: 'Outstanding', type: 'currency' },
        { key: 'last_booking', label: 'Last Bill Date', type: 'text' }
      ],
      title: 'Companies Report',
      description: 'Company information with billing statistics and financial details'
    }))

    // Navigate to the Report Generator component
    navigate('/dashboard/report-generator')
  }

  return (
    <section className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-lg">Client Companies</CardTitle>
            <div className="flex items-center gap-2">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search companies..."
                aria-label="Search companies"
                className="w-48 md:w-64"
              />
              <Button
                onClick={handleExportCompanies}
                variant="outline"
                aria-label="Export companies"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
              <Button onClick={handleOpenCreate} aria-label="Create company">
                <Plus className="h-4 w-4 mr-2" />
                Create
              </Button>
            </div>
          </div>
          <CardDescription className="text-sm">
            Showing {Math.min(pageSize, filtered.length)} of {filtered.length} companies
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableCaption className="text-sm">Companies overview</TableCaption>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>GST Number</TableHead>
                  <TableHead>Bills</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Outstanding</TableHead>
                  <TableHead>Last Bill Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageItems.map((c) => {
                  return (
                    <TableRow key={c?.company_id ?? c?.name} className="odd:bg-muted/20 hover:bg-muted/40 transition-colors">
                      <TableCell className="font-medium">{c?.name ?? "—"}</TableCell>
                      <TableCell className="font-mono text-sm">{c?.gst_no ?? "—"}</TableCell>
                      <TableCell>{c?.calculatedBookings ?? 0}</TableCell>
                      <TableCell className="text-right">{formatMoney(c?.calculatedRevenue ?? 0)}</TableCell>
                      <TableCell className={`text-right ${(c?.calculatedOutstanding ?? 0) < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {formatMoney(Math.abs(c?.calculatedOutstanding ?? 0))}
                        {(c?.calculatedOutstanding ?? 0) < 0 ? " Due" : ""}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{formatDate(c?.calculatedLastBooking)}</TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex items-center gap-2">
                          <Link
                            to={`/dashboard/company/${encodeURIComponent(c?.company_id ?? "")}`}
                            aria-label={`View transactions for ${c?.name ?? "company"}`}
                            className="inline-flex"
                          >
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Edit ${c?.name ?? "company"}`}
                            onClick={() => handleOpenEdit(c)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {/*<Button*/}
                          {/*  variant="ghost"*/}
                          {/*  size="icon"*/}
                          {/*  aria-label={`Delete ${c?.name ?? "company"}`}*/}
                          {/*  onClick={() => handleOpenDelete(c)}*/}
                          {/*>*/}
                          {/*  <Trash2 className="h-4 w-4 text-red-600" />*/}
                          {/*</Button>*/}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {pageItems.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">
                      No companies found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create company</DialogTitle>
            <DialogDescription>Add a new client company to your list.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="company-name-create">Company name</Label>
              <Input
                id="company-name-create"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g., Acme Corp"
                disabled={isCreating}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="gst-no-create">GST Number</Label>
              <Input
                id="gst-no-create"
                value={gstNo}
                onChange={(e) => setGstNo(e.target.value)}
                placeholder="e.g., 22AAAAA0000A1Z5"
                disabled={isCreating}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={isCreating}>
              Cancel
            </Button>
            <Button onClick={handleSubmitCreate} disabled={!companyName.trim() || isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit company</DialogTitle>
            <DialogDescription>Update the selected company details.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="company-name-edit">Company name</Label>
              <Input
                id="company-name-edit"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Company name"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="gst-no-edit">GST Number</Label>
              <Input
                id="gst-no-edit"
                value={gstNo}
                onChange={(e) => setGstNo(e.target.value)}
                placeholder="e.g., 22AAAAA0000A1Z5"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitEdit} disabled={!companyName.trim() || !selected?.company_id}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete company</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete{" "}
              <span className="font-medium">{selected?.name ?? "this company"}</span> and remove its data from your
              list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleConfirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}