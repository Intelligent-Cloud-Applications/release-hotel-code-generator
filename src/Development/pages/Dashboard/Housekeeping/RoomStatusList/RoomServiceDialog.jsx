import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/Development/components/ui/dialog.js";
import { Button } from "@/Development/components/ui/button.js";
import { Input } from "@/Development/components/ui/input.js";
import { Label } from "@/Development/components/ui/label.js";
import { Badge } from "@/Development/components/ui/badge.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/Development/components/ui/card.js";
import { Separator } from "@/Development/components/ui/separator.js";
import {
  Plus,
  ClipboardList,
  Coffee,
  Shirt,
  Wine,
  Bed,
  FileText,
  Gift,
  X,
  Save,
  Calendar,
  Lock
} from "lucide-react";
import { ScrollArea } from "@/Development/components/ui/scroll-area.js";
import { useAppContext } from "@/Development/context/AppContext.jsx";

const CURRENT_DATE = new Date().toISOString().split('T')[0];
const CURRENT_DATETIME = new Date().toISOString().replace('T', ' ').split('.')[0];
const CURRENT_USER = "MarkWolf257";

const serviceTypes = [
  { value: "food_charges", label: "Food", icon: Coffee },
  { value: "laundry_charges", label: "Laundry", icon: Shirt },
  { value: "minibar_charges", label: "Bar", icon: Wine },
  { value: "extra_bed_charges", label: "Extra Bed", icon: Bed },
  { value: "manual_charges", label: "Other", icon: FileText }
];

// Enhanced normalize helpers to get ALL dates
function normalizeAllServicesData(services, roomNumber) {
  if (!services || !services[roomNumber]) return {};
  const roomServices = services[roomNumber];

  const allServices = {};
  Object.keys(roomServices).forEach(date => {
    const dateData = roomServices[date];

    if (Array.isArray(dateData)) {
      allServices[date] = dateData;
    } else if (typeof dateData === 'object' && dateData !== null) {
      const hasValues = Object.values(dateData).some(val => val > 0);
      if (hasValues) {
        allServices[date] = [dateData];
      }
    }
  });

  return allServices;
}

function normalizeAllComplementaryData(complementary, roomNumber) {
  if (!complementary || !complementary[roomNumber]) return {};
  const roomComp = complementary[roomNumber];

  const allComplementary = {};
  Object.keys(roomComp).forEach(date => {
    const dateData = roomComp[date];

    if (Array.isArray(dateData)) {
      allComplementary[date] = dateData;
    } else if (typeof dateData === 'object' && dateData !== null) {
      allComplementary[date] = [dateData];
    }
  });

  return allComplementary;
}

const RoomServicesAndComplementaryDialog = ({ roomNumber, booking = {} }) => {
  const { updateBookingServices, updateComplementaryServices } = useAppContext();
  const [open, setOpen] = useState(false);

  // Previous data from ALL dates (display only)
  const allPrevServices = normalizeAllServicesData(booking.services, roomNumber);
  const allPrevComplementary = normalizeAllComplementaryData(booking.complementary, roomNumber);

  // New entries (will be sent)
  const [newServices, setNewServices] = useState([]);
  const [newServiceFields, setNewServiceFields] = useState({
    food_charges: "", laundry_charges: "", minibar_charges: "", extra_bed_charges: "", manual_charges: ""
  });
  const [newComplementary, setNewComplementary] = useState([]);
  const [newCompFields, setNewCompFields] = useState({ name: "", amount: "" });

  // Add new service
  function handleAddService() {
    const hasAnyCharge = Object.values(newServiceFields).some(v => v && parseFloat(v) > 0);
    if (!hasAnyCharge) return;

    const serviceEntry = {
      food_charges: parseFloat(newServiceFields.food_charges) || 0,
      laundry_charges: parseFloat(newServiceFields.laundry_charges) || 0,
      minibar_charges: parseFloat(newServiceFields.minibar_charges) || 0,
      extra_bed_charges: parseFloat(newServiceFields.extra_bed_charges) || 0,
      manual_charges: parseFloat(newServiceFields.manual_charges) || 0,
    };

    setNewServices([...newServices, serviceEntry]);
    setNewServiceFields({
      food_charges: "", laundry_charges: "", minibar_charges: "", extra_bed_charges: "", manual_charges: ""
    });
  }

  function handleAddComplementary() {
    if (!newCompFields.name.trim() || !(parseFloat(newCompFields.amount) > 0)) return;

    const compEntry = {
      name: newCompFields.name.trim(),
      amount: parseFloat(newCompFields.amount)
    };

    setNewComplementary([...newComplementary, compEntry]);
    setNewCompFields({ name: "", amount: "" });
  }

  // Remove entries
  function removeService(index) {
    setNewServices(newServices.filter((_, i) => i !== index));
  }

  function removeComplementary(index) {
    setNewComplementary(newComplementary.filter((_, i) => i !== index));
  }

  // Save changes
  function handleSave() {
    const institutionId = booking.institutionId;

    if (newServices.length > 0) {
      const servicesToSend = {};
      servicesToSend[roomNumber] = { [CURRENT_DATE]: newServices };
      updateBookingServices(booking.booking_id, {
        booking_id: booking.booking_id,
        institutionId,
        services: servicesToSend
      });
    }

    if (newComplementary.length > 0) {
      const compToSend = {};
      compToSend[roomNumber] = { [CURRENT_DATE]: newComplementary };
      updateComplementaryServices(booking.booking_id, compToSend);
    }

    setOpen(false);
    setNewServices([]);
    setNewComplementary([]);
  }

  // Calculate totals
  function calculateServiceTotal(service) {
    return Object.values(service).reduce((sum, val) => sum + (val || 0), 0);
  }

  function calculateTotal(list, type = 'services') {
    if (type === 'services') {
      return list.reduce((total, service) => total + parseFloat(calculateServiceTotal(service)), 0).toFixed(2);
    }
    return list.reduce((sum, item) => sum + (item.amount || 0), 0).toFixed(2);
  }

  function calculateDateTotal(dateServices, type = 'services') {
    if (type === 'services') {
      return dateServices.reduce((total, service) => total + parseFloat(calculateServiceTotal(service)), 0).toFixed(2);
    }
    return dateServices.reduce((sum, item) => sum + (item.amount || 0), 0).toFixed(2);
  }

  // Format date for display
  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  const totalNewAmount = (parseFloat(calculateTotal(newServices)) + parseFloat(calculateTotal(newComplementary, 'comp'))).toFixed(2);
  const hasNewEntries = newServices.length > 0 || newComplementary.length > 0;

  // Get sorted dates for display
  const allServiceDates = Object.keys(allPrevServices).sort((a, b) => new Date(b) - new Date(a));
  const allComplementaryDates = Object.keys(allPrevComplementary).sort((a, b) => new Date(b) - new Date(a));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild disabled={booking.status !== 'Checked-in'}>
        <Button 
          variant="filled" 
          className={`w-full relative ${
            booking.status === 'Checked-in' 
              ? 'bg-black text-white hover:bg-gray-800' 
              : 'bg-white/50 backdrop-blur-sm text-gray-400 border border-gray-200'
          }`}
        >
          {booking.status === 'Checked-in' ? (
            <>
              <ClipboardList className="mr-2 h-4 w-4" />
              Add Services
            </>
          ) : (
            <>
              <Lock className="mr-2 h-4 w-4" />
              Add Services
            </>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent
        className="p-0 flex flex-col"
        style={{
          maxWidth: '95vw',
          width: '95vw',
          height: '95vh',
          maxHeight: '95vh'
        }}
      >
        {/* Header - Fixed */}
        <DialogHeader className="px-6 py-4 border-b flex-shrink-0 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">Room {roomNumber} - Services & Complementary</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {CURRENT_DATETIME} UTC • {CURRENT_USER}
              </p>
            </div>
            {hasNewEntries && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                New Total: ₹{totalNewAmount}
              </Badge>
            )}
          </div>
        </DialogHeader>

        {/* Scrollable Content Area */}
        <div className="flex-1 min-h-0">
          <ScrollArea className="h-full w-full">
            <div className="px-6 py-4 space-y-6">

              {/* Services Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Coffee className="h-5 w-5" />
                    Room Services
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Add Services Form */}
                  <div className="grid grid-cols-5 gap-4">
                    {serviceTypes.map(type => (
                      <div key={type.value} className="space-y-2 w-full">
                        <Label className="text-xs font-medium flex items-center gap-1.5 leading-tight">
                          <type.icon className="h-3 w-3 flex-shrink-0" />
                          <span className="whitespace-nowrap">{type.label}</span>
                        </Label>
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₹</span>
                          <Input
                            type="number"
                            placeholder="0"
                            value={newServiceFields[type.value]}
                            onChange={(e) => setNewServiceFields({
                              ...newServiceFields,
                              [type.value]: e.target.value
                            })}
                            className="pl-6 h-9 text-sm w-full"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={handleAddService}
                    disabled={!Object.values(newServiceFields).some(v => v && parseFloat(v) > 0)}
                    className="w-full"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Service
                  </Button>

                  {/* New Services */}
                  {newServices.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-green-700">New Services (Today - {CURRENT_DATE})</h4>
                        <Badge variant="outline" className="text-green-700 border-green-200">
                          ₹{calculateTotal(newServices)}
                        </Badge>
                      </div>
                      {newServices.map((service, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                            {serviceTypes.map(type =>
                                service[type.value] > 0 && (
                                  <span key={type.value} className="whitespace-nowrap">
                                  {type.label}: ₹{service[type.value]}
                                </span>
                                )
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                            <span className="font-medium text-green-700">₹{calculateServiceTotal(service)}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeService(idx)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Previous Services - All Dates */}
                  {allServiceDates.length > 0 && (
                    <div className="space-y-4">
                      <Separator />
                      <h4 className="font-medium text-gray-600">Previous Services History</h4>
                      {allServiceDates.map((date) => (
                        <div key={date} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-500" />
                              <span className="font-medium text-gray-700">{formatDate(date)}</span>
                              <Badge variant="outline" className="text-xs">
                                {date}
                              </Badge>
                            </div>
                            <Badge variant="outline" className="text-gray-600">
                              ₹{calculateDateTotal(allPrevServices[date])}
                            </Badge>
                          </div>
                          <div className="space-y-2 ml-6">
                            {allPrevServices[date].map((service, idx) => (
                              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                                  {serviceTypes.map(type =>
                                      (service[type.value] || 0) > 0 && (
                                        <span key={type.value} className="whitespace-nowrap">
                                        {type.label}: ₹{service[type.value] || 0}
                                      </span>
                                      )
                                  )}
                                </div>
                                <span className="font-medium text-gray-600 flex-shrink-0 ml-4">₹{calculateServiceTotal(service)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Complementary Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gift className="h-5 w-5" />
                    Complementary Services
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Add Complementary Form */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium">Service Name</Label>
                      <Input
                        placeholder="Enter service name"
                        value={newCompFields.name}
                        onChange={(e) => setNewCompFields({ ...newCompFields, name: e.target.value })}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium">Amount</Label>
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₹</span>
                        <Input
                          type="number"
                          placeholder="0"
                          value={newCompFields.amount}
                          onChange={(e) => setNewCompFields({ ...newCompFields, amount: e.target.value })}
                          className="pl-6 h-9"
                        />
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleAddComplementary}
                    disabled={!newCompFields.name.trim() || !parseFloat(newCompFields.amount)}
                    className="w-full"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Complementary
                  </Button>

                  {/* New Complementary */}
                  {newComplementary.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-green-700">New Complementary (Today - {CURRENT_DATE})</h4>
                        <Badge variant="outline" className="text-green-700 border-green-200">
                          ₹{calculateTotal(newComplementary, 'comp')}
                        </Badge>
                      </div>
                      {newComplementary.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                          <span className="text-sm flex-1 min-w-0 pr-2">{item.name}</span>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="font-medium text-green-700">₹{item.amount.toFixed(2)}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeComplementary(idx)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Previous Complementary - All Dates */}
                  {allComplementaryDates.length > 0 && (
                    <div className="space-y-4">
                      <Separator />
                      <h4 className="font-medium text-gray-600">Previous Complementary History</h4>
                      {allComplementaryDates.map((date) => (
                        <div key={date} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-500" />
                              <span className="font-medium text-gray-700">{formatDate(date)}</span>
                              <Badge variant="outline" className="text-xs">
                                {date}
                              </Badge>
                            </div>
                            <Badge variant="outline" className="text-gray-600">
                              ₹{calculateDateTotal(allPrevComplementary[date], 'comp')}
                            </Badge>
                          </div>
                          <div className="space-y-2 ml-6">
                            {allPrevComplementary[date].map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <span className="text-sm text-gray-600 flex-1 min-w-0 pr-2">{item.name || 'Unnamed Service'}</span>
                                <span className="font-medium text-gray-600 flex-shrink-0">₹{(item.amount || 0).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Extra padding at bottom to ensure footer doesn't overlap */}
              <div className="h-20"></div>
            </div>
          </ScrollArea>
        </div>

        {/* Fixed Footer */}
        <div className="px-6 py-4 border-t bg-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {hasNewEntries ? `${newServices.length + newComplementary.length} new entries ready` : 'No new entries'}
            </div>
            <Button
              onClick={handleSave}
              disabled={!hasNewEntries}
              className="ml-auto"
            >
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RoomServicesAndComplementaryDialog;