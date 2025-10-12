import React, { useState, useEffect } from "react";
import { TableComponent } from "@/Development/components/ui/TableComponent.jsx";
import { Checkbox } from "@/Development/components/ui/checkbox.js";
import { Button } from "@/Development/components/ui/button.js";
import { Input } from "@/Development/components/ui/input.js";
import {
  Download,
  Edit,
  Eye,
  LucideSortDesc,
  Plus,
  Search,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { useAppContext } from "@/Development/context/AppContext.jsx";
import RoomModal from "./RoomModal.jsx";
import ViewRoomModal from "./ViewRoomModal.jsx";
import { exportRoomsToExcel } from "@/Development/components/utils/excelExport.js";
import {toast} from "sonner";
// import { toast } from "sonner";

// Updated ConfirmDeleteModal component with blurred background
const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm, roomId }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Confirm Deletion
        </h2>
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete room with ID {roomId}? This action
          cannot be undone.
        </p>
        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
};

const Rooms = () => {
  const {
    rooms,
    loading,
    // error,
    // fetchRooms,
    createRoom,
    getRoom,
    updateRoom,
    deleteRoom,
  } = useAppContext();
  const [rowSelection, setRowSelection] = React.useState({});
  // const [tableData, setTableData] = React.useState(rooms);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [modalMode, setModalMode] = useState("create");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false); // New state for confirm modal
  const [roomToDelete, setRoomToDelete] = useState(null); // New state for room to delete
  const [filteredRooms, setFilteredRooms] = useState([]);

  // useEffect(() => {
  //   if (error) {
  //     toast.error(error);
  //   }
  // }, [error]);

  const getServiceName = (service) => {
    if (typeof service === "object" && service !== null) {
      return service.productType || "";
    }
    return service || "";
  };

  const columns = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      header: "Room Info",
      accessorKey: "room_number",
      cell: (info) => (
        <div className="flex flex-col items-start text-gray-600">
          <span className="font-semibold">{info.getValue()}</span>
          <span className="text-sm">{info.row.original.room_type}</span>
        </div>
      ),
    },
    {
      header: "Floor",
      accessorKey: "floor",
      cell: (info) => <span className="text-gray-600">{info.getValue()}</span>,
    },
    // {
    //   header: "Services",
    //   accessorKey: "services",
    //   cell: (info) => (
    //     <div className="flex flex-col text-gray-600 gap-1">
    //       <span>
    //         {info.getValue()?.length > 0
    //           ? info
    //             .getValue()
    //             .map((service) => getServiceName(service))
    //             .join(", ")
    //           : "None"}
    //       </span>
    //     </div>
    //   ),
    // },
    {
      header: "Status",
      accessorKey: "status",
      cell: (info) => {
        const status = info.getValue();
        let statusColor = "bg-gray-100 text-gray-800";
        const displayStatus = status
          ? status.charAt(0).toUpperCase() + status.slice(1)
          : "";

        if (status === "available") statusColor = "bg-green-100 text-green-800";
        if (status === "occupied") statusColor = "bg-blue-100 text-blue-800";
        if (status === "maintenance")
          statusColor = "bg-yellow-100 text-yellow-800";

        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}
          >
            {displayStatus}
          </span>
        );
      },
    },
    {
      header: "Tariff",
      accessorKey: "tariff",
      cell: (info) => <span className="text-gray-600">{info.getValue()}</span>,
    },
    // {
    //   header: "Maintenance",
    //   accessorKey: "maintenanceRequired",
    //   cell: (info) => {
    //     const required = info.getValue();
    //     return (
    //       <span
    //         className={`px-2 py-1 rounded-full text-xs font-medium ${
    //           required ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"
    //         }`}
    //       >
    //         {required ? "Yes" : "No"}
    //       </span>
    //     );
    //   },
    // },
    {
      header: "Actions",
      accessorKey: "actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-4">
          <button
            className="p-1 rounded-full hover:bg-gray-100 text-violet-500 transition-colors"
            onClick={() => handleViewRoom(row.original)}
            disabled={loading}
          >
            <Eye size={18} />
          </button>
          <button
            className="p-1 rounded-full hover:bg-gray-100 text-blue-500 transition-colors"
            onClick={() => handleEditRoom(row.original)}
            disabled={loading}
          >
            <Edit size={18} />
          </button>
          <button
            className="p-1 rounded-full hover:bg-gray-100 text-red-500 transition-colors"
            onClick={() => handleDeleteRoom(row.original.room_id)}
            disabled={loading}
          >
            <Trash2 size={18} />
          </button>
        </div>
      ),
    },
  ];

  const handleAddRoom = () => {
    setCurrentRoom(null);
    setModalMode("create");
    setIsModalOpen(true);
  };

  const handleEditRoom = (room) => {
    setCurrentRoom({ ...room });
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleViewRoom = async (room) => {
    try {
      // const result = await getRoom(room.room_id);
      // if (result.success) {
      //   setSelectedRoom(result.data);
      //   setIsViewModalOpen(true);
      //   // toast.info(`Viewing details for room ${result.data.roomNo}`);
      // }
      setSelectedRoom(room);
      setIsViewModalOpen(true);
    } catch (err) {
      console.error("Error viewing room:", err);
      // toast.error("Failed to fetch room details");
    }
  };

  const handleDeleteRoom = (roomId) => {
    setRoomToDelete(roomId);
    setIsConfirmDeleteOpen(true);
  };

  const handleExport = () => {
    const dataToExport = filteredRooms;
    exportRoomsToExcel(dataToExport, "hotel-rooms-data");
  };

  const confirmDelete = async () => {
    try {
      const result = await deleteRoom(roomToDelete);
      if (result.success) {
        // toast.success("Room deleted successfully");
      }
    } catch (err) {
      console.error("Error deleting room:", err);
      // toast.error("Failed to delete room");
    } finally {
      setIsConfirmDeleteOpen(false);
      setRoomToDelete(null);
    }
  };

  const handleModalSubmit = async (formData, mode) => {
    setIsSubmitting(true);
    try {
      let result;
      if (mode === "create") {
        result = await createRoom(formData);
      } else {
        result = await updateRoom({ ...formData, room_id: currentRoom.room_id });
      }

      // if (result.success) {
      //   toast.success(
      //     mode === "create"
      //       ? "Room created successfully"
      //       : "Room updated successfully"
      //   );
      //   setIsModalOpen(false);
      // } else {
      //   toast.error(
      //     `Failed to ${mode === "create" ? "create" : "update"} room`
      //   );
      // }
    } catch (err) {
      console.error(err);
      toast.error(
        `An unexpected error occurred: ${err?.message || "Unknown error"}`
      );
    } finally {
      setIsSubmitting(false);
      setIsModalOpen(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  useEffect(() => {
    setFilteredRooms(searchQuery
      ? rooms.filter(
        (room) =>
          room.room_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          room.specification
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          room.room_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          room.status?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          room.tariff?.toString().toLowerCase().includes(searchQuery.toLowerCase())
      )
      : [ ...rooms ])
  }, [ rooms, searchQuery ]);

  // const filteredRooms = searchQuery
  //   ? tableData.filter(
  //       (room) =>
  //         room.roomNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
  //         room.specification
  //           ?.toLowerCase()
  //           .includes(searchQuery.toLowerCase()) ||
  //         room.status?.toLowerCase().includes(searchQuery.toLowerCase())
  //     )
  //   : tableData;

  return (
    <div className="w-full flex mx-auto containter flex-col gap-4 py-4 px-6 bg-white rounded-md">
      <div className="my-2">
        <h1 className="text-3xl font-semibold text-gray-800">Rooms</h1>
        <p className="text-sm text-gray-500">
          Manage your rooms and their information.
        </p>
      </div>
      <div className="flex justify-between w-full flex-col md:flex-row gap-4 md:gap-2 bg-white">
        <div className="w-full max-w-md border-2 rounded-md px-4 flex items-center justify-center gap-2">
          <input
            type="text"
            placeholder="Search..."
            className="w-full py-1 text-sm rounded-lg border-0 focus:outline-none"
            value={searchQuery}
            onChange={handleSearchChange}
          />
          <Search className="text-gray-500" size={20} />
        </div>
        <div className="flex flex-row justify-start md:justify-center items-center gap-2">
          {/*<Button variant="outline" className="hidden md:flex">*/}
          {/*  <LucideSortDesc size={16} className="mr-1" /> Filter*/}
          {/*</Button>*/}
          <Button
            variant="outline"
            className="hidden md:flex"
            onClick={handleExport}
          >
            <Download size={16} className="mr-1" /> Export
          </Button>
          <Button
            onClick={handleAddRoom}
            className="bg-primary hover:bg-primary/90"
            disabled={loading}
          >
            <Plus size={16} className="mr-1" /> Add Room
          </Button>
        </div>
      </div>

      <div className="w-full bg-white overflow-hidden">
        {loading && !rooms.length ? (
          <div className="flex justify-center items-center h-32">
            <p className="text-gray-500">Loading rooms...</p>
          </div>
        ) : rooms.length === 0 ? (
          <div className="flex justify-center items-center h-32">
            <p className="text-gray-500">
              No rooms found. Add your first room!
            </p>
          </div>
        ) : (
          <TableComponent
            columns={columns}
            data={filteredRooms}
            rowSelection={rowSelection}
            setRowSelection={setRowSelection}
          />
        )}
      </div>

      <RoomModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        initialData={currentRoom}
        mode={modalMode}
        isSubmitting={isSubmitting}
      />
      <ViewRoomModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        roomData={selectedRoom}
      />
      <ConfirmDeleteModal
        isOpen={isConfirmDeleteOpen}
        onClose={() => {
          setIsConfirmDeleteOpen(false);
          setRoomToDelete(null);
        }}
        onConfirm={confirmDelete}
        roomId={roomToDelete}
      />
    </div>
  );
};

export default Rooms;