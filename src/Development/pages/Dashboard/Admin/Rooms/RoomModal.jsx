import React, { useEffect } from "react";
import {Dialog, DialogClose, DialogContent} from "@/Development/components/ui/dialog.js";
import { Button } from "@/Development/components/ui/button.js";
import { Label } from "@/Development/components/ui/label.js";
import { Input } from "@/Development/components/ui/input.js";
import { Checkbox } from "@/Development/components/ui/checkbox.js";
import { Loader2 } from "lucide-react";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/Development/components/ui/select.tsx";
import {useAppContext} from "@/Development/context/AppContext.jsx";
import {toast} from "sonner"; // For loading spinner

const RoomModal = ({ isOpen, onClose, onSubmit, mode = "create", isSubmitting = false, initialData }) => {
  const { rooms } = useAppContext();
  const [formData, setFormData] = React.useState(((mode === "edit") && initialData) ? initialData : {
    room_number: "",
    floor: "",
    room_type: "Single",
    tariff: 0,
    rate_plan: "RP1001"
  });
  const [servicesInput, setServicesInput] = React.useState(""); // New state for services input

  // useEffect(() => {
  //   if (initialData) {
  //     // Handle different service formats when editing
  //     const displayServices = initialData.services ?
  //       initialData.services.map(s => typeof s === 'object' ? s.productType : s).join(", ")
  //       : "";
  //
  //     setFormData({
  //       ...initialData,
  //       // Ensure status is lowercase for backend validation
  //       status: initialData.status ? initialData.status.toLowerCase() : "available",
  //       services: initialData.services || [],
  //     });
  //
  //     setServicesInput(displayServices);
  //   } else {
  //     setFormData({
  //       room_number: "",
  //       specification: "",
  //       status: "available", // Changed to lowercase
  //       services: [],
  //       floor: "",
  //       currentDetails: "",
  //       maintenanceRequired: false,
  //     });
  //     setServicesInput("");
  //   }
  // }, [initialData, isOpen]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // const handleServicesChange = (e) => {
  //   const value = e.target.value;
  //   setServicesInput(value); // Update the input field value
  //
  //   // Convert services to object format with productType property
  //   const services = value
  //     .split(",")
  //     .map((s) => s.trim())
  //     .filter((s) => s)
  //     .map(service => ({ productType: service })); // Convert each service to object format
  //
  //   setFormData((prev) => ({ ...prev, services }));
  // };

  // const handleStatusChange = (e) => {
  //   setFormData((prev) => ({ ...prev, status: e.target.value }));
  // };

  // const handleMaintenanceChange = (checked) => {
  //   setFormData((prev) => ({ ...prev, maintenanceRequired: checked }));
  // };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rooms.some(room => room.room_number.toString() === formData.room_number.toString() && mode === "create")) {
      toast.error(`Room ${ formData.room_number } already exists!`);
      return;
    }
    onSubmit(formData, mode);
  };

  const handleOpenChange = (open) => {
    if (!open) setFormData({
      room_number: "",
      floor: "",
      room_type: "Single",
      tariff: 0,
      rate_plan: "RP1001"
    });
    if (!isSubmitting) onClose();
  }

  useEffect(() => {
    if (initialData)
      setFormData({
        room_number: initialData.room_number,
        floor: initialData.floor,
        room_type: initialData.room_type,
        tariff: initialData.tariff,
        rate_plan: initialData.rate_plan,
      });
  }, [initialData]);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden rounded-md inter">
        <div className="bg-white border-b relative">
          <h2 className="text-xl font-semibold p-5">
            {mode === "create" ? "Add New Room" : "Edit Room"}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="room_number" className="text-sm text-gray-700">Room Number</Label>
              <Input
                id="room_number"
                name="room_number"
                value={formData.room_number}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md"
                placeholder="Enter room number"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="floor" className="text-sm text-gray-700">Floor Number</Label>
              <Input
                id="floor"
                name="floor"
                value={formData.floor}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md"
                placeholder="Enter floor number"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="room_type" className="text-sm text-gray-700">Room Type</Label>
              <Select id="room_type" name="room_type" value={formData.room_type} onValueChange={(v) => setFormData({...formData, room_type: v})} required>
                <SelectTrigger>
                  <SelectValue placeholder="Room type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Single">Single</SelectItem>
                  <SelectItem value="Double">Double</SelectItem>
                  <SelectItem value="Triple">Triple</SelectItem>
                  <SelectItem value="Suite">Suite</SelectItem>
                  <SelectItem value="Deluxe">Deluxe</SelectItem>
                  <SelectItem value="Standard">Standard</SelectItem>
                  <SelectItem value="Family">Family</SelectItem>
                  <SelectItem value="Executive">Executive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tariff" className="text-sm text-gray-700">Tariff</Label>
              <Input
                id="tariff"
                name="tariff"
                type="number"
                value={formData.tariff}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md"
                placeholder="0.00"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/*<div className="space-y-1.5">*/}
          {/*  <Label htmlFor="specification" className="text-sm text-gray-700">Specification</Label>*/}
          {/*  <Input*/}
          {/*    id="specification"*/}
          {/*    name="specification"*/}
          {/*    value={formData.specification}*/}
          {/*    onChange={handleInputChange}*/}
          {/*    className="w-full border border-gray-300 rounded-md"*/}
          {/*    placeholder="Enter room specification"*/}
          {/*    required*/}
          {/*    disabled={isSubmitting}*/}
          {/*  />*/}
          {/*</div>*/}

          {/*<div className="space-y-1.5">*/}
          {/*  <Label htmlFor="status" className="text-sm text-gray-700">Status</Label>*/}
          {/*  <select*/}
          {/*    id="status"*/}
          {/*    name="status"*/}
          {/*    value={formData.status}*/}
          {/*    onChange={handleStatusChange}*/}
          {/*    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"*/}
          {/*    required*/}
          {/*    disabled={isSubmitting}*/}
          {/*  >*/}
          {/*    <option value="available">Available</option>*/}
          {/*    <option value="occupied">Occupied</option>*/}
          {/*    <option value="maintenance">Maintenance</option>*/}
          {/*  </select>*/}
          {/*</div>*/}

          {/*<div className="space-y-1.5">*/}
          {/*  <Label htmlFor="services" className="text-sm text-gray-700">Services (comma-separated)</Label>*/}
          {/*  <Input*/}
          {/*    id="services"*/}
          {/*    name="services"*/}
          {/*    value={servicesInput} // Use servicesInput instead of formData.services*/}
          {/*    onChange={handleServicesChange}*/}
          {/*    className="w-full border border-gray-300 rounded-md"*/}
          {/*    placeholder="WiFi, TV, Bar, etc."*/}
          {/*    disabled={isSubmitting}*/}
          {/*  />*/}
          {/*</div>*/}

          {/*<div className="space-y-1.5">*/}
          {/*  <Label htmlFor="currentDetails" className="text-sm text-gray-700">Current Details</Label>*/}
          {/*  <textarea*/}
          {/*    id="currentDetails"*/}
          {/*    name="currentDetails"*/}
          {/*    value={formData.currentDetails || ""}*/}
          {/*    onChange={handleInputChange}*/}
          {/*    className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md resize-none"*/}
          {/*    placeholder="Enter any additional details about the room"*/}
          {/*    disabled={isSubmitting}*/}
          {/*  />*/}
          {/*</div>*/}

          {/*<div className="flex items-center space-x-2 py-1">*/}
          {/*  <Checkbox*/}
          {/*    id="maintenanceRequired"*/}
          {/*    checked={formData.maintenanceRequired}*/}
          {/*    onCheckedChange={handleMaintenanceChange}*/}
          {/*    className="h-4 w-4 rounded border-gray-300"*/}
          {/*    disabled={isSubmitting}*/}
          {/*  />*/}
          {/*  <Label htmlFor="maintenanceRequired" className="text-sm text-gray-700">*/}
          {/*    Maintenance Required*/}
          {/*  </Label>*/}
          {/*</div>*/}

          <div className="flex justify-end gap-3 pt-3 mt-4">
            <DialogClose disabled={isSubmitting}>
              <Button
                type="button"
                variant="outline"
                className="px-4 py-1.5 border border-gray-300 hover:bg-gray-50 text-sm"
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === "create" ? "Creating..." : "Updating..."}
                </>
              ) : (
                mode === "create" ? "Create Room" : "Update Room"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RoomModal;