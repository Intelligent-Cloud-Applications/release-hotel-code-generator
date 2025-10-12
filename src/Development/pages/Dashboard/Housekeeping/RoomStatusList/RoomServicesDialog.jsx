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
import { Plus, ClipboardList, Coffee, Shirt, Wine, Bed, FileText } from "lucide-react";
import { ScrollArea } from "@/Development/components/ui/scroll-area.js";
import {useAppContext} from "@/Development/context/AppContext.jsx";

// Constants for current data (for internal use only)
const CURRENT_DATE = new Date().toISOString().split('T')[0];
const CURRENT_TIMESTAMP = "2025-06-18 07:05:22";
const CURRENT_USER = "MarkWolf257";

const RoomServicesDialog = ({ roomNumber, booking = {} }) => {
  console.log("booking", booking);
  const { updateBookingServices } = useAppContext();
  const [open, setOpen] = useState(false);
  
  // Helper function to normalize services data
  const normalizeServicesData = (services, roomNumber) => {
    if (!services || !services[roomNumber]) {
      return { [CURRENT_DATE]: [] };
    }
    
    const roomServices = services[roomNumber];
    const normalized = {};
    
    // Process each date in the room's services
    for (const dateKey in roomServices) {
      const dateServices = roomServices[dateKey];
      
      // If it's already an array, use it as is
      if (Array.isArray(dateServices)) {
        normalized[dateKey] = dateServices;
      } 
      // If it's an object, wrap it in an array
      else if (typeof dateServices === 'object' && dateServices !== null) {
        normalized[dateKey] = [dateServices];
      } 
      // Otherwise, use empty array
      else {
        normalized[dateKey] = [];
      }
    }
    
    // Ensure current date exists
    if (!normalized[CURRENT_DATE]) {
      normalized[CURRENT_DATE] = [];
    }
    
    return normalized;
  };

  // Initialize services with normalized data
  const [servicesData, setServicesData] = useState(() => 
    normalizeServicesData(booking.services, roomNumber)
  );

  // Today's services
  const todayServices = servicesData[CURRENT_DATE] || [];

  // New service charges
  const [newCharges, setNewCharges] = useState({
    food_charges: "",
    laundry_charges: "",
    minibar_charges: "",
    extra_bed_charges: "",
    manual_charges: ""
  });

  // Define service types with their corresponding icons
  const serviceTypes = [
    { value: "food_charges", label: "Food", icon: Coffee },
    { value: "laundry_charges", label: "Laundry", icon: Shirt },
    { value: "minibar_charges", label: "Bar", icon: Wine },
    { value: "extra_bed_charges", label: "Extra Bed", icon: Bed },
    { value: "manual_charges", label: "Other", icon: FileText }
  ];

  const handleChangeCharge = (chargeType, value) => {
    setNewCharges({
      ...newCharges,
      [chargeType]: value
    });
  };

  const handleAddService = () => {
    // Check if at least one charge has a value
    const hasAnyCharge = Object.values(newCharges).some(
      value => value && parseFloat(value) > 0
    );

    if (!hasAnyCharge) return;

    // Create a new service entry
    const serviceEntry = {
      food_charges: parseFloat(newCharges.food_charges) || 0,
      laundry_charges: parseFloat(newCharges.laundry_charges) || 0,
      minibar_charges: parseFloat(newCharges.minibar_charges) || 0,
      extra_bed_charges: parseFloat(newCharges.extra_bed_charges) || 0,
      manual_charges: parseFloat(newCharges.manual_charges) || 0,
    };

    // Update today's services
    const updatedTodayServices = [...todayServices, serviceEntry];

    // Update the full services data structure
    setServicesData({
      ...servicesData,
      [CURRENT_DATE]: updatedTodayServices
    });

    // Reset the form
    setNewCharges({
      food_charges: "",
      laundry_charges: "",
      minibar_charges: "",
      extra_bed_charges: "",
      manual_charges: ""
    });
  };

  const calculateTotal = (chargeType = null) => {
    return todayServices.reduce((total, service) => {
      if (chargeType) {
        return total + (service[chargeType] || 0);
      } else {
        // Sum all charge types
        return total +
          service.food_charges +
          service.laundry_charges +
          service.minibar_charges +
          service.extra_bed_charges +
          service.manual_charges;
      }
    }, 0).toFixed(2);
  };

  // Check if a service has a specific charge
  const hasCharge = (service, chargeType) => {
    return service[chargeType] > 0;
  };

  // Calculate total for a specific service
  const calculateServiceTotal = (service) => {
    return (
      service.food_charges +
      service.laundry_charges +
      service.minibar_charges +
      service.extra_bed_charges +
      service.manual_charges
    ).toFixed(2);
  };

  // Mobile card view for services
  const ServiceCard = ({ service }) => {
    return (
      <div className="bg-muted/50 p-3 rounded-lg mb-3">
        <div className="flex-1">
          {serviceTypes.map(type =>
              hasCharge(service, type.value) && (
                <div key={type.value} className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <type.icon className="h-4 w-4 text-muted-foreground" />
                    <span>{type.label}</span>
                  </div>
                  <span className="font-medium">₹{service[type.value].toFixed(2)}</span>
                </div>
              )
          )}
          <div className="mt-2 text-sm font-medium flex justify-end border-t pt-2">
            <span>Total: ₹{calculateServiceTotal(service)}</span>
          </div>
        </div>
      </div>
    );
  };

  // Check if new service form is valid
  const isFormValid = () => {
    return Object.values(newCharges).some(
      value => value && parseFloat(value) > 0
    );
  };

  return (
    <Dialog open={open} onOpenChange={ (o) => {
      if (!o) setServicesData(normalizeServicesData(booking.services, roomNumber));
      setOpen(o);
    }}>
      <DialogTrigger asChild disabled={ booking.status !== 'Checked-in' }>
        <Button variant="outline" className="flex items-center w-full sm:w-auto justify-center">
          <ClipboardList className="mr-2 h-4 w-4" />
          <span>Add Services</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] w-[95vw] max-h-[95vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="p-4 md:p-6 pb-2 md:pb-2">
          <DialogTitle className="text-xl">Room {roomNumber} Services</DialogTitle>
          <DialogDescription>
            Today's Charges
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden min-h-0">
          <ScrollArea className="h-[65vh] sm:h-[70vh]">
            <div className="space-y-4 p-4 md:p-6 pt-2 md:pt-2">
              {/* Today's Services */}
              <div>
                <h3 className="text-lg font-medium mb-3">Current Services</h3>
                {todayServices.length > 0 ? (
                  <>
                    {/* Desktop Table View (Hidden on Mobile) */}
                    <div className="hidden md:block">
                      <div className="overflow-x-auto rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              {serviceTypes.map(type => (
                                <TableHead key={type.value} className="text-center whitespace-nowrap">
                                  <div className="flex flex-col items-center">
                                    <type.icon className="h-4 w-4 mb-1" />
                                    <span>{type.label}</span>
                                  </div>
                                </TableHead>
                              ))}
                              <TableHead className="text-right whitespace-nowrap">Total</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {todayServices.map((service, index) => (
                              <TableRow key={index}>
                                {serviceTypes.map(type => (
                                  <TableCell key={type.value} className="text-center">
                                    {service[type.value] > 0 ? `₹${service[type.value].toFixed(2)}` : '-'}
                                  </TableCell>
                                ))}
                                <TableCell className="text-right font-medium">₹{calculateServiceTotal(service)}</TableCell>
                              </TableRow>
                            ))}
                            <TableRow>
                              {serviceTypes.map(type => (
                                <TableCell key={type.value} className="text-center font-medium">
                                  ₹{calculateTotal(type.value)}
                                </TableCell>
                              ))}
                              <TableCell className="text-right font-bold">
                                ₹{calculateTotal()}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-3">
                      {todayServices.map((service, index) => (
                        <ServiceCard key={index} service={service} />
                      ))}

                      {/* Mobile Summary */}
                      <div className="mt-4 p-3 border rounded-md space-y-1.5">
                        <h4 className="font-medium mb-2">Summary</h4>
                        {serviceTypes.map(type => (
                          <div key={type.value} className="flex justify-between text-sm">
                            <div className="flex items-center gap-1.5">
                              <type.icon className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>{type.label}</span>
                            </div>
                            <span>₹{calculateTotal(type.value)}</span>
                          </div>
                        ))}
                        <div className="pt-2 mt-1 border-t flex justify-between">
                          <span className="font-bold">Total</span>
                          <span className="font-bold">₹{calculateTotal()}</span>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="border rounded-md p-6 text-center text-muted-foreground">
                    <p>No services added today</p>
                  </div>
                )}
              </div>

              {/* Add New Service */}
              <div className="border-t pt-4 mt-4">
                <h3 className="text-lg font-medium mb-3">Add New Service</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {serviceTypes.map(type => {
                    const ChargeIcon = type.icon;
                    return (
                      <div key={type.value} className="space-y-1.5">
                        <Label htmlFor={`charge-${type.value}`} className="flex items-center gap-1.5">
                          <ChargeIcon className="h-4 w-4" />
                          <span>{type.label}</span>
                        </Label>
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground">₹</span>
                          <Input
                            id={`charge-${type.value}`}
                            type="number"
                            value={newCharges[type.value]}
                            onChange={(e) => handleChangeCharge(type.value, e.target.value)}
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            className="pl-6 h-10"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Button
                  className="mt-4 w-full h-12 text-base"
                  onClick={handleAddService}
                  disabled={!isFormValid()}
                >
                  <Plus className="mr-2 h-5 w-5" /> Add Service
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
              // Build the correct services object: only room/date structure, no booking_id/institutionId inside
              const servicesToSend = {};
              servicesToSend[roomNumber] = {};
              for (const dateKey in servicesData) {
                if (dateKey === "roomTotal") continue;
                // Always send as array format to match backend expectations
                servicesToSend[roomNumber][dateKey] = servicesData[dateKey];
              }
              // Only send booking_id, institutionId, and services (room/date structure) at the top level
              updateBookingServices(booking.booking_id, {
                booking_id: booking.booking_id,
                institutionId,
                services: servicesToSend
              });
              setOpen(false);
            }}>
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RoomServicesDialog;