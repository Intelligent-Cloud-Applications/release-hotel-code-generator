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

const DEFAULT_ROOM_TYPES = [
  "Single",
  "Double",
  "Triple",
  "Suite",
  "Deluxe",
  "Standard",
  "Family",
  "Executive",
];

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

  const [customRoomTypes, setCustomRoomTypes] = React.useState(() => {
    try {
      const saved = localStorage.getItem("hotel_custom_room_types");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [isAddingCustom, setIsAddingCustom] = React.useState(false);
  const [customTypeInput, setCustomTypeInput] = React.useState("");

  const availableRoomTypes = React.useMemo(() => {
    const list = new Set([
      ...DEFAULT_ROOM_TYPES,
      ...(rooms || []).map((r) => r.room_type).filter(Boolean),
      ...customRoomTypes,
    ]);
    if (formData.room_type && formData.room_type !== "__custom__") {
      list.add(formData.room_type);
    }
    return Array.from(list);
  }, [rooms, customRoomTypes, formData.room_type]);

  const handleAddCustomType = (e) => {
    if (e) e.preventDefault();
    const trimmed = (customTypeInput || "").trim();
    if (!trimmed) {
      toast.warning("Please enter a room type name.");
      return;
    }
    const updated = Array.from(new Set([...customRoomTypes, trimmed]));
    setCustomRoomTypes(updated);
    try {
      localStorage.setItem("hotel_custom_room_types", JSON.stringify(updated));
    } catch (err) {}
    setFormData((prev) => ({ ...prev, room_type: trimmed }));
    setIsAddingCustom(false);
    setCustomTypeInput("");
    toast.success(`"${trimmed}" added to Room Types.`);
  };

  const handleRoomTypeChange = (v) => {
    if (v === "__custom__") {
      setIsAddingCustom(true);
    } else {
      setIsAddingCustom(false);
      setFormData((prev) => ({ ...prev, room_type: v }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rooms.some(room => room.room_number.toString() === formData.room_number.toString() && mode === "create")) {
      toast.error(`Room ${ formData.room_number } already exists!`);
      return;
    }
    let finalRoomType = formData.room_type;
    if (isAddingCustom && customTypeInput.trim()) {
      const trimmed = customTypeInput.trim();
      const updated = Array.from(new Set([...customRoomTypes, trimmed]));
      setCustomRoomTypes(updated);
      try {
        localStorage.setItem("hotel_custom_room_types", JSON.stringify(updated));
      } catch (err) {}
      finalRoomType = trimmed;
    }
    onSubmit({ ...formData, room_type: finalRoomType }, mode);
  };

  const handleOpenChange = (open) => {
    if (!open) {
      setFormData({
        room_number: "",
        floor: "",
        room_type: "Single",
        tariff: 0,
        rate_plan: "RP1001"
      });
      setIsAddingCustom(false);
      setCustomTypeInput("");
    }
    if (!isSubmitting) onClose();
  };

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
      <DialogContent className="sm:max-w-[560px] p-0 overflow-hidden rounded-md inter">
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

            <div className={`space-y-1.5 ${isAddingCustom ? "md:col-span-2" : ""}`}>
              <Label htmlFor="room_type" className="text-sm text-gray-700">Room Type</Label>
              <Select
                id="room_type"
                name="room_type"
                value={isAddingCustom ? "__custom__" : (formData.room_type || "Single")}
                onValueChange={handleRoomTypeChange}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select room type" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {availableRoomTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                  <SelectItem value="__custom__" className="text-blue-600 font-semibold border-t border-gray-100 mt-1 pt-1.5">
                    + Add Custom Room Type...
                  </SelectItem>
                </SelectContent>
              </Select>

              {isAddingCustom && (
                <div className="space-y-2 pt-2 pb-1 px-3 bg-blue-50/70 rounded-lg border border-blue-200 mt-2">
                  <Label className="text-xs text-blue-900 font-semibold">Enter New Room Type Name</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={customTypeInput}
                      onChange={(e) => setCustomTypeInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddCustomType();
                        }
                      }}
                      placeholder="e.g. Presidential Suite, Deluxe Ocean View, etc."
                      className="h-10 text-sm flex-1 bg-white border-blue-300 focus:border-blue-500 shadow-sm"
                      autoFocus
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddCustomType}
                      className="h-10 px-4 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shrink-0 shadow-sm"
                    >
                      Save
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIsAddingCustom(false);
                        setCustomTypeInput("");
                        setFormData((prev) => ({
                          ...prev,
                          room_type: availableRoomTypes[0] || "Single",
                        }));
                      }}
                      className="h-10 px-3 text-xs text-gray-700 hover:text-gray-900 shrink-0 border-gray-300 bg-white hover:bg-gray-100"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className={`space-y-1.5 ${isAddingCustom ? "md:col-span-2" : ""}`}>
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