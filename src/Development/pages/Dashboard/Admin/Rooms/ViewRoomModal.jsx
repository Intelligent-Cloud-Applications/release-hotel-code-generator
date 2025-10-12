import React from "react";
import { Dialog, DialogContent } from "@/Development/components/ui/dialog.js";
import { Button } from "@/Development/components/ui/button.js";
import { Label } from "@/Development/components/ui/label.js";

const ViewRoomModal = ({ isOpen, onClose, roomData }) => {
  // Function to format services for display
  const getServiceName = (service) => {
    if (typeof service === "object" && service !== null) {
      return service.productType || "";
    }
    return service || "";
  };

  const formattedServices = roomData?.services?.length > 0
    ? roomData.services.map(getServiceName).join(", ")
    : "None";

  const formattedStatus = roomData?.status
    ? roomData.status.charAt(0).toUpperCase() + roomData.status.slice(1)
    : "";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden rounded-md inter">
        <div className="bg-white border-b relative">
          <h2 className="text-xl font-semibold p-5">Room Details</h2>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm text-gray-700">Room Number</Label>
              <p className="text-gray-900">{roomData?.room_number || "N/A"}</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm text-gray-700">Floor Number</Label>
              <p className="text-gray-900">{roomData?.floor || "N/A"}</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm text-gray-700">Specification</Label>
              <p className="text-gray-900">{roomData?.room_type || "N/A"}</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm text-gray-700">Status</Label>
              <p className="text-gray-900">{formattedStatus || "N/A"}</p>
            </div>
          </div>

          {/*<div className="space-y-1.5">*/}
          {/*  <Label className="text-sm text-gray-700">Services</Label>*/}
          {/*  <p className="text-gray-900">{formattedServices}</p>*/}
          {/*</div>*/}

          {/*<div className="space-y-1.5">*/}
          {/*  <Label className="text-sm text-gray-700">Current Details</Label>*/}
          {/*  <p className="text-gray-900 whitespace-pre-wrap">*/}
          {/*    {roomData?.currentDetails || "None"}*/}
          {/*  </p>*/}
          {/*</div>*/}

          {/*<div className="space-y-1.5">*/}
          {/*  <Label className="text-sm text-gray-700">Maintenance Required</Label>*/}
          {/*  <p className="text-gray-900">*/}
          {/*    {roomData?.maintenanceRequired ? "Yes" : "No"}*/}
          {/*  </p>*/}
          {/*</div>*/}

          <div className="flex justify-end pt-3 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="px-4 py-1.5 border border-gray-300 hover:bg-gray-50 text-sm"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewRoomModal;