import React, { useState, useMemo } from "react";
import { Button } from "../../../../../components/ui/button.js";
import { Input } from "../../../../../components/ui/input.js";
import { Label } from "../../../../../components/ui/label.js";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../../components/ui/select.js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../../../../components/ui/dialog.js";
import { Edit, Bed, User, Phone, Users, Calendar, AlertTriangle } from "lucide-react";
import { useAppContext } from "../../../../../context/AppContext.jsx";
import { toast } from "sonner";

const SelectedBookingInfo = ({
  selectedBooking,
  selectedGuest,
  formatDate,
  onBookingUpdated,
}) => {
  const { rooms, amendBooking } = useAppContext();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    full_name: "",
    mobile: "",
    email: "",
    room_category: "",
    no_of_rooms: 1,
    no_of_persons: 1,
    checkin_date: "",
    checkout_date: "",
  });

  const availableCategories = useMemo(() => {
    const dynamicCategories = (rooms || [])
      .map((r) => r.room_type)
      .filter((t) => Boolean(t && typeof t === "string" && t.trim().length > 0));
    const fromBooking = [
      selectedBooking?.room_category,
      selectedBooking?.room_type,
      formData?.room_category,
      ...(selectedBooking?.rooms_config?.map((rc) => rc.room_category || rc.room_type) || []),
    ].filter((t) => Boolean(t && typeof t === "string" && t.trim().length > 0));
    const standardCategories = [
      "Standard",
      "Deluxe",
      "Super Deluxe",
      "Executive",
      "Suite",
      "Single",
      "Double",
      "Family",
    ];
    return Array.from(new Set([...fromBooking, ...dynamicCategories, ...standardCategories]));
  }, [rooms, selectedBooking, formData?.room_category]);

  const unreadyAssignedRooms = useMemo(() => {
    if (!selectedBooking || !rooms || rooms.length === 0) return [];
    const assignedIds = (Array.isArray(selectedBooking.room_id) && selectedBooking.room_id.length > 0)
      ? selectedBooking.room_id
      : (typeof selectedBooking.room_id === "string" && selectedBooking.room_id.trim())
      ? [selectedBooking.room_id.trim()]
      : (Array.isArray(selectedBooking.rooms_config)
          ? selectedBooking.rooms_config.map((r) => r.room_id).filter((id) => id && id !== "none")
          : []);

    return assignedIds
      .map((rid) => {
        const rObj = rooms.find((r) => String(r.room_id) === String(rid) || String(r.id) === String(rid));
        if (!rObj) return null;
        const s = String(rObj.status || "").toLowerCase().trim();
        const isUnready =
          s === "dirty" ||
          s.includes("dirty") ||
          s.includes("maintenance") ||
          s.includes("order") ||
          s.includes("block");
        if (isUnready) {
          return { roomNumber: rObj.room_number || rid, status: rObj.status || "Dirty" };
        }
        return null;
      })
      .filter(Boolean);
  }, [selectedBooking, rooms]);


  const handleOpenEdit = () => {
    const currentCategory =
      selectedBooking?.room_category ||
      selectedBooking?.room_type ||
      selectedBooking?.rooms_config?.[0]?.room_category ||
      selectedBooking?.rooms_config?.[0]?.room_type ||
      "";
    setFormData({
      full_name: selectedGuest?.full_name || selectedBooking?.full_name || "",
      mobile: selectedGuest?.mobile || selectedBooking?.mobile || "",
      email: selectedGuest?.email || selectedBooking?.email || "",
      room_category: currentCategory,
      no_of_rooms: selectedBooking?.no_of_rooms || selectedBooking?.number_of_rooms || (selectedBooking?.rooms_config ? selectedBooking.rooms_config.length : 1),
      no_of_persons: selectedBooking?.no_of_persons || selectedBooking?.no_of_adults || 1,
      checkin_date: selectedBooking?.checkin_date
        ? new Date(selectedBooking.checkin_date).toISOString().split("T")[0]
        : "",
      checkout_date: selectedBooking?.checkout_date
        ? new Date(selectedBooking.checkout_date).toISOString().split("T")[0]
        : "",
    });
    setIsEditOpen(true);
  };

  const handleSave = async () => {
    if (!formData.full_name.trim() || !formData.mobile.trim()) {
      toast.error("Please enter guest name and mobile number");
      return;
    }

    setIsSaving(true);
    try {
      const finalCategory = (formData.room_category || selectedBooking.room_category || selectedBooking.room_type || "").trim();
      const finalRooms = Math.max(1, parseInt(formData.no_of_rooms, 10) || 1);
      const finalPersons = Math.max(1, parseInt(formData.no_of_persons, 10) || 1);

      const guestData = {
        ...(selectedGuest || {}),
        full_name: formData.full_name,
        mobile: formData.mobile,
        email: formData.email,
        updated_at: Date.now(),
      };

      const bookingData = {
        ...selectedBooking,
        full_name: formData.full_name,
        mobile: formData.mobile,
        email: formData.email,
        room_category: finalCategory,
        room_type: finalCategory,
        no_of_rooms: finalRooms,
        number_of_rooms: finalRooms,
        no_of_persons: finalPersons,
        no_of_adults: finalPersons,
        checkin_date: formData.checkin_date
          ? new Date(formData.checkin_date).getTime()
          : selectedBooking.checkin_date,
        checkout_date: formData.checkout_date
          ? new Date(formData.checkout_date).getTime()
          : selectedBooking.checkout_date,
        updated_at: Date.now(),
      };

      if (amendBooking) {
        await amendBooking({
          bookingId: selectedBooking.booking_id,
          bookingData,
          guestData,
        });
      }

      toast.success("Booking details updated successfully!");
      if (onBookingUpdated) {
        onBookingUpdated(bookingData, guestData);
      }
      setIsEditOpen(false);
    } catch (err) {
      console.error("Error updating booking:", err);
      toast.error("Failed to update booking details");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold text-blue-800">
            Selected Booking
          </h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleOpenEdit}
            className="h-7 text-xs bg-white text-blue-700 hover:bg-blue-100 hover:text-blue-800 border-blue-300"
          >
            <Edit className="w-3.5 h-3.5 mr-1" /> Edit Details
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p>
              <span className="font-medium">Guest:</span>{" "}
              {selectedGuest?.full_name || selectedBooking?.full_name}
            </p>
            <p>
              <span className="font-medium">Mobile:</span>{" "}
              {selectedGuest?.mobile || selectedBooking?.mobile}
            </p>
            <p>
              <span className="font-medium">Booking ID:</span>{" "}
              {selectedBooking.booking_id}
            </p>
          </div>
          <div>
            <p>
              <span className="font-medium">Rooms / Persons:</span>{" "}
              {selectedBooking.no_of_rooms || selectedBooking.number_of_rooms || 1} Room(s) • {selectedBooking.no_of_persons || selectedBooking.no_of_adults || 1} Person(s)
            </p>
            {selectedBooking.rooms_config && selectedBooking.rooms_config.length > 1 ? (
              <div className="mt-1 flex flex-wrap gap-1 text-xs">
                {selectedBooking.rooms_config.map((r, idx) => (
                  <span key={idx} className="bg-blue-100 text-blue-900 px-1.5 py-0.5 rounded font-medium border border-blue-200">
                    Room {r.room_index || idx + 1}: {r.room_category}
                    {r.room_number ? ` (No. ${r.room_number})` : ""}
                  </span>
                ))}
              </div>
            ) : (
              <p>
                <span className="font-medium">Room Category:</span>{" "}
                <span className="font-semibold text-blue-900 bg-blue-100 px-1.5 py-0.5 rounded">
                  {selectedBooking.room_category || selectedBooking.room_type || "N/A"}
                </span>
              </p>
            )}
            <p>
              <span className="font-medium">Check-in:</span>{" "}
              {formatDate(selectedBooking.checkin_date)}
            </p>
            <p>
              <span className="font-medium">Check-out:</span>{" "}
              {formatDate(selectedBooking.checkout_date)}
            </p>
          </div>
        </div>

        {unreadyAssignedRooms.length > 0 && (
          <div className="mt-3 p-2.5 bg-amber-50 border border-amber-300 rounded-lg flex items-start gap-2 text-xs text-amber-900 shadow-xs">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-950">Room Status Notice:</p>
              <p className="mt-0.5 leading-relaxed">
                {unreadyAssignedRooms.map((r) => `Room ${r.roomNumber}`).join(", ")} was assigned at booking, but is currently{" "}
                <strong className="underline text-amber-900">
                  {unreadyAssignedRooms.map((r) => r.status).join(", ")}
                </strong>
                . Please mark it as Vacant / Clean first or choose an alternate clean room before check-in.
              </p>
            </div>
          </div>
        )}
      </div>


      {/* Edit Booking Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[520px] w-[95vw] max-h-[85vh] p-0 flex flex-col overflow-hidden">
          <DialogHeader className="p-4 pb-3 border-b flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-4 w-4 text-blue-600" />
              Edit Booking Details
            </DialogTitle>
          </DialogHeader>

          <div className="p-4 overflow-y-auto flex-1 space-y-4">
            {/* Booking & Room Summary Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-900 space-y-1">
              <div className="flex items-center justify-between font-semibold text-blue-800">
                <span>Booking #{selectedBooking?.booking_id}</span>
                <span className="bg-blue-100 border border-blue-300 text-blue-900 px-2 py-0.5 rounded font-bold">
                  {selectedBooking?.room_category || selectedBooking?.room_type || "N/A"}
                </span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-blue-700">
                <span>
                  <strong>Rooms:</strong> {selectedBooking?.no_of_rooms || selectedBooking?.number_of_rooms || 1}
                </span>
                <span>
                  <strong>Persons:</strong> {selectedBooking?.no_of_persons || selectedBooking?.no_of_adults || 1}
                </span>
                {selectedBooking?.room_id && (
                  <span>
                    <strong>Assigned Room(s):</strong>{" "}
                    {Array.isArray(selectedBooking.room_id)
                      ? selectedBooking.room_id.join(", ")
                      : selectedBooking.room_id}
                  </span>
                )}
              </div>
              {selectedBooking?.rooms_config && selectedBooking.rooms_config.length > 0 && (
                <div className="pt-1.5 mt-1 border-t border-blue-200/60 flex flex-wrap gap-1">
                  {selectedBooking.rooms_config.map((r, i) => (
                    <span
                      key={i}
                      className="bg-white border border-blue-200 text-blue-800 px-1.5 py-0.5 rounded text-[11px] font-medium"
                    >
                      Room {r.room_index || i + 1}: <strong>{r.room_category || r.room_type || "Standard"}</strong>
                      {r.room_number ? ` (No. ${r.room_number})` : ""}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="edit_guest_name" className="text-xs font-medium">Guest Full Name *</Label>
                <Input
                  id="edit_guest_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData((p) => ({ ...p, full_name: e.target.value }))}
                  className="h-8 text-sm mt-1"
                />
              </div>
              <div>
                <Label htmlFor="edit_guest_mobile" className="text-xs font-medium">Mobile Number *</Label>
                <Input
                  id="edit_guest_mobile"
                  value={formData.mobile}
                  onChange={(e) => setFormData((p) => ({ ...p, mobile: e.target.value }))}
                  className="h-8 text-sm mt-1"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="edit_cat" className="text-xs font-medium">Room Category *</Label>
              <Select
                value={formData.room_category}
                onValueChange={(val) => setFormData((p) => ({ ...p, room_category: val }))}
              >
                <SelectTrigger id="edit_cat" className="h-8 text-sm mt-1">
                  <SelectValue placeholder="Select room category" />
                </SelectTrigger>
                <SelectContent>
                  {availableCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="edit_rooms" className="text-xs font-medium">Number of Rooms *</Label>
                <Input
                  id="edit_rooms"
                  type="number"
                  min="1"
                  value={formData.no_of_rooms}
                  onChange={(e) => setFormData((p) => ({ ...p, no_of_rooms: e.target.value }))}
                  className="h-8 text-sm mt-1"
                />
              </div>
              <div>
                <Label htmlFor="edit_persons" className="text-xs font-medium">Number of Persons *</Label>
                <Input
                  id="edit_persons"
                  type="number"
                  min="1"
                  value={formData.no_of_persons}
                  onChange={(e) => setFormData((p) => ({ ...p, no_of_persons: e.target.value }))}
                  className="h-8 text-sm mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="edit_cin" className="text-xs font-medium">Check-in Date</Label>
                <Input
                  id="edit_cin"
                  type="date"
                  value={formData.checkin_date}
                  onChange={(e) => setFormData((p) => ({ ...p, checkin_date: e.target.value }))}
                  className="h-8 text-sm mt-1"
                />
              </div>
              <div>
                <Label htmlFor="edit_cout" className="text-xs font-medium">Check-out Date</Label>
                <Input
                  id="edit_cout"
                  type="date"
                  value={formData.checkout_date}
                  onChange={(e) => setFormData((p) => ({ ...p, checkout_date: e.target.value }))}
                  className="h-8 text-sm mt-1"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="p-3 border-t bg-gray-50 flex-shrink-0 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SelectedBookingInfo; 