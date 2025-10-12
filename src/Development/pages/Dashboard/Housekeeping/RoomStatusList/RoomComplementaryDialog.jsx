import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/Development/components/ui/dialog.js";
import { Button } from "@/Development/components/ui/button.js";
import { Input } from "@/Development/components/ui/input.js";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/Development/components/ui/table.js";
import { Label } from "@/Development/components/ui/label.js";
import { ClipboardList, Gift, Plus } from "lucide-react";
import { ScrollArea } from "@/Development/components/ui/scroll-area.js";
import { useAppContext } from "@/Development/context/AppContext.jsx";

// Constants for current data (for internal use only)
const CURRENT_DATE = new Date().toISOString().split('T')[0];
const CURRENT_USER = "MarkWolf257";

const RoomComplementaryDialog = ({ roomNumber, booking = {} }) => {
  const { updateComplementaryServices } = useAppContext();
  const [open, setOpen] = useState(false);

  // Helper function to normalize complementary data
  const normalizeComplementaryData = (complementary, roomNumber) => {
    if (!complementary || !complementary[roomNumber]) {
      return { [CURRENT_DATE]: [] };
    }
    const roomComp = complementary[roomNumber];
    const normalized = {};
    for (const dateKey in roomComp) {
      const dateComp = roomComp[dateKey];
      if (Array.isArray(dateComp)) {
        normalized[dateKey] = dateComp;
      } else if (typeof dateComp === "object" && dateComp !== null) {
        normalized[dateKey] = [dateComp];
      } else {
        normalized[dateKey] = [];
      }
    }
    if (!normalized[CURRENT_DATE]) {
      normalized[CURRENT_DATE] = [];
    }
    return normalized;
  };

  // Initialize complementary with normalized data
  const [complementaryData, setComplementaryData] = useState(() =>
    normalizeComplementaryData(booking.complementary, roomNumber)
  );

  // Today's complementary
  const todayComplementary = complementaryData[CURRENT_DATE] || [];

  // New complementary entry
  const [newEntry, setNewEntry] = useState({
    name: "",
    amount: ""
  });

  // Handle change for new complementary entry
  const handleChange = (field, value) => {
    setNewEntry({
      ...newEntry,
      [field]: value
    });
  };

  // Add new complementary service
  const handleAddComplementary = () => {
    if (!newEntry.name.trim() || !(parseFloat(newEntry.amount) > 0)) return;

    const entry = {
      name: newEntry.name.trim(),
      amount: parseFloat(newEntry.amount) || 0
    };

    const updatedToday = [...todayComplementary, entry];
    setComplementaryData({
      ...complementaryData,
      [CURRENT_DATE]: updatedToday
    });

    setNewEntry({ name: "", amount: "" });
  };

  // Total complementary amount for today
  const calculateTotal = () => {
    return todayComplementary.reduce((total, entry) => total + (entry.amount || 0), 0).toFixed(2);
  };

  // Mobile card view for complementary
  const ComplementaryCard = ({ entry }) => (
    <div className="bg-muted/50 p-3 rounded-lg mb-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gift className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{entry.name}</span>
        </div>
        <span className="font-medium">₹{entry.amount.toFixed(2)}</span>
      </div>
    </div>
  );

  // Form validation
  const isFormValid = () => {
    return newEntry.name.trim() && parseFloat(newEntry.amount) > 0;
  };

  return (
    <Dialog open={open} onOpenChange={ (o) => {
      if (!o) setComplementaryData(normalizeComplementaryData(booking.complementary, roomNumber));
      setOpen(o);
    }}>
      <DialogTrigger asChild disabled={ booking.status !== 'Checked-in' }>
        <Button variant="outline" className="flex items-center w-full sm:w-auto justify-center">
          <Gift className="mr-2 h-4 w-4" />
          <span>Add Complementary</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] w-[95vw] max-h-[95vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="p-4 md:p-6 pb-2 md:pb-2">
          <DialogTitle className="text-xl">Room {roomNumber} Complementary</DialogTitle>
          <DialogDescription>
            Today's Complementary Services
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden min-h-0">
          <ScrollArea className="h-[65vh] sm:h-[70vh]">
            <div className="space-y-4 p-4 md:p-6 pt-2 md:pt-2">
              {/* Today's Complementary */}
              <div>
                <h3 className="text-lg font-medium mb-3">Current Complementary</h3>
                {todayComplementary.length > 0 ? (
                  <>
                    {/* Desktop Table View (Hidden on Mobile) */}
                    <div className="hidden md:block">
                      <div className="overflow-x-auto rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-left whitespace-nowrap">Name</TableHead>
                              <TableHead className="text-center whitespace-nowrap">Amount</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {todayComplementary.map((entry, index) => (
                              <TableRow key={index}>
                                <TableCell className="text-left font-medium">{entry.name}</TableCell>
                                <TableCell className="text-center font-medium">₹{entry.amount.toFixed(2)}</TableCell>
                              </TableRow>
                            ))}
                            <TableRow>
                              <TableCell className="text-right font-bold" colSpan={1}>Total</TableCell>
                              <TableCell className="text-center font-bold">₹{calculateTotal()}</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-3">
                      {todayComplementary.map((entry, index) => (
                        <ComplementaryCard key={index} entry={entry} />
                      ))}
                      <div className="mt-4 p-3 border rounded-md flex justify-between items-center">
                        <span className="font-bold">Total</span>
                        <span className="font-bold">₹{calculateTotal()}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="border rounded-md p-6 text-center text-muted-foreground">
                    <p>No complementary services added today</p>
                  </div>
                )}
              </div>

              {/* Add New Complementary */}
              <div className="border-t pt-4 mt-4">
                <h3 className="text-lg font-medium mb-3">Add New Complementary</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="comp-name" className="flex items-center gap-1.5">
                      <Gift className="h-4 w-4" />
                      <span>Name</span>
                    </Label>
                    <Input
                      id="comp-name"
                      value={newEntry.name}
                      onChange={e => handleChange("name", e.target.value)}
                      placeholder="Enter service name"
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="comp-amount">Amount</Label>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground">₹</span>
                      <Input
                        id="comp-amount"
                        type="number"
                        value={newEntry.amount}
                        onChange={e => handleChange("amount", e.target.value)}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        className="pl-6 h-10"
                      />
                    </div>
                  </div>
                </div>
                <Button
                  className="mt-4 w-full h-12 text-base"
                  onClick={handleAddComplementary}
                  disabled={!isFormValid()}
                >
                  <Plus className="mr-2 h-5 w-5" /> Add Complementary
                </Button>
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Fixed footer that's always visible */}
        <div className="p-4 border-t bg-background sticky bottom-0 w-full">
          <div className="flex justify-center sm:justify-end">
            <Button type="button" className="w-full sm:w-auto h-12 sm:h-10" onClick={ () => {
              const institutionId = booking.institutionId || booking.institution_id || (booking.institution && booking.institution.institutionId);
              // Build the correct complementary object: only room/date structure, no booking_id/institutionId inside
              const compToSend = {};
              compToSend[roomNumber] = {};
              for (const dateKey in complementaryData) {
                compToSend[roomNumber][dateKey] = complementaryData[dateKey];
              }
              updateComplementaryServices(booking.booking_id, compToSend);
              setOpen(false);
              setComplementaryData({});
            }}>
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RoomComplementaryDialog;