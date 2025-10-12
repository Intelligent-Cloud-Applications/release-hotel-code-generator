import React, { useEffect } from "react";
import { TableComponent } from "@/Development/components/ui/TableComponent.jsx";
import { Checkbox } from "@/Development/components/ui/checkbox.js";
import { Button } from "@/Development/components/ui/button.js";
import { exportGuestsToExcel } from "@/Development/components/utils/excelExport.js";
// import { DatePickerWithRange } from "@/components/ui/DateRangePicker";
// import { addDays } from "date-fns";
import { Download, Edit, Eye, Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/Development/components/ui/dialog.js";
import { Input } from "@/Development/components/ui/input.js";
import { Label } from "@/Development/components/ui/label.js";
import { useAppContext } from "@/Development/context/AppContext.jsx";
import {HoverCard, HoverCardContent, HoverCardTrigger} from "@/Development/components/ui/hover-card.tsx";

const staticColumns = [
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
    id: "customerName",
    header: "Customer Name",
    accessorKey: "userDetails",
    cell: (info) => {
      const row = info.row.original;
      return (
        <div className="flex flex-col gap-1">
          <span className="font-medium">{row.full_name}</span>
          <span className="text-xs text-gray-500">{row.nationality}</span>
        </div>
      );
    },
  },
  {
    id: "contactInfo",
    header: "Contact",
    accessorKey: "users",
    cell: (info) => {
      const userData = info.row.original;
      return (
        <div className="flex flex-col text-gray-600 gap-1">
          <span className="truncate">{userData.email}</span>
          <span>{userData.mobile}</span>
        </div>
      );
    },
  },
  {
    header: "ID Proof",
    accessorKey: "amount",
    cell: (info) => {
      const row = info.row.original;
      return (
        <div className="flex flex-col text-gray-600 gap-1">
          <span>{row.id_proof_type}</span>
          <span>{row.id_proof_number}</span>
        </div>
      )
    },
  },
  // {
  //   header: () => (
  //     <div className="flex flex-col gap-1 text-gray-600">
  //       <span>Check In</span>
  //       <span>Check Out</span>
  //     </div>
  //   ),
  //   accessorKey: "expectedCheckInDate",
  //   cell: (row) => {
  //     const data = row.row.original;
  //     return (
  //       <div className="flex flex-col gap-1 text-gray-600">
  //         <span>{new Date(data.expectedCheckInDate).toLocaleDateString()}</span>
  //         <span>
  //           {new Date(data.expectedCheckOutDate).toLocaleDateString()}
  //         </span>
  //       </div>
  //     );
  //   },
  // },
  {
    header: "Address",
    accessorKey: "address",
    cell: (info) => {
      const row = info.row.original;
      return (
        <div className="flex justify-between text-gray-600 gap-1 w-48">
          <span className="truncate">{info.getValue()}</span>
          <HoverCard>
            <HoverCardTrigger>
              <Button
                variant="light"
                size="xsm"
                className="bg-violet-100 text-violet-500"
              >
                <Eye size={20} />
              </Button>
            </HoverCardTrigger>
            <HoverCardContent>
              <p className="inter text-sm">{info.getValue()}, PIN-{row.pincode}, {row.city}, {row.state}, {row.country}</p>
            </HoverCardContent>
          </HoverCard>
        </div>
      )
    },
  },
];

const Guests = () => {
  // const { bookings, fetchBookings } = useAppContext();
  const { guests } = useAppContext();
  // console.log("Current bookings:", bookings);

  const [rowSelection, setRowSelection] = React.useState({});
  const [tableData, setTableData] = React.useState(guests || []);
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = React.useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [selectedGuest, setSelectedGuest] = React.useState(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [newGuest, setNewGuest] = React.useState({
    bookingId: "",
    serviceIds: [],
    status: "free",
    guestDetails: [],
    amount: 0,
    bookingDate: Date.now(),
    expectedCheckOutDate: null,
    userDetails: {
      idType: "idCard",
      phoneNumber: "",
      address: "",
      purpose: "Tourism",
      emailId: "",
      idNumber: "",
      age: 18,
      username: "",
    },
    expectedCheckInDate: null,
    institution: "",
    foodbill: {},
  });

  // useEffect(() => {
  //   // Fetch bookings when component mounts
  //   fetchBookings();
  // }, []);
  useEffect(() => {
    // setTableData([ ...guests ]);
    setTableData(searchQuery
      ? guests.filter(
        (guest) =>
          guest.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          guest.nationality?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          guest.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          guest.mobile?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          guest.id_proof_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          guest.id_proof_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          guest.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          guest.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          guest.state?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          guest.country?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          guest.pincode?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      : [ ...guests ])
  }, [guests, searchQuery]);

  const [date, setDate] = React.useState(() => {
    // Default to a broader date range to show all data initially
    const today = new Date();
    return {
      from: new Date(today.getFullYear() - 1, 0, 1), // Start of last year
      to: new Date(today.getFullYear() + 1, 11, 31), // End of next year
    };
  });
  // Set initial table data once bookings are loaded
  // React.useEffect(() => {
  //   console.log("Bookings effect triggered, bookings:", bookings);
  //   if (bookings && Array.isArray(bookings) && bookings.length > 0) {
  //     setTableData(bookings);
  //   } else {
  //     setTableData([]);
  //   }
  // }, [bookings]);

  // Function to filter table data based on date range and search query
  // React.useEffect(() => {
  //   console.log("Filter effect triggered");
  //   console.log("Current bookings:", bookings);
  //   console.log("Date filter:", date);
  //   console.log("Search query:", searchQuery);
  //
  //   if (!bookings || !Array.isArray(bookings) || bookings.length === 0) {
  //     console.log("No bookings available, setting empty table");
  //     setTableData([]);
  //     return;
  //   }
  //
  //   let result = [...bookings];
  //   console.log("Starting with", result.length, "bookings");
  //
  //   // First filter by date if available
  //   if (date?.from || date?.to) {
  //     result = result.filter((guest) => {
  //       // Skip invalid dates
  //       if (!guest.expectedCheckInDate || isNaN(new Date(guest.expectedCheckInDate).getTime())) {
  //         return false;
  //       }
  //
  //       const checkInDate = new Date(guest.expectedCheckInDate);
  //
  //       // Check both date boundaries
  //       const isAfterFrom = !date.from || checkInDate >= date.from;
  //       const isBeforeTo = !date.to || checkInDate <= date.to;
  //
  //       return isAfterFrom && isBeforeTo;
  //     });
  //     console.log("After date filter:", result.length, "bookings");
  //   }
  //
  //   // Then filter by search query if available
  //   if (searchQuery.trim()) {
  //     const query = searchQuery.toLowerCase().trim();
  //     result = result.filter(
  //       (guest) => {
  //         // Handle potentially missing data
  //         if (!guest.userDetails) return false;
  //
  //         const username = guest.userDetails.username || '';
  //         const bookingId = guest.bookingId || '';
  //         const emailId = guest.userDetails.emailId || '';
  //         const phoneNumber = guest.userDetails.phoneNumber || '';
  //
  //         return (
  //           username.toLowerCase().includes(query) ||
  //           bookingId.toLowerCase().includes(query) ||
  //           emailId.toLowerCase().includes(query) ||
  //           phoneNumber.toLowerCase().includes(query)
  //         );
  //       }
  //     );
  //     console.log("After search filter:", result.length, "bookings");
  //   }
  //
  //   console.log("Final result:", result);
  //   setTableData(result);
  // }, [date, searchQuery, bookings]);

  const selectedRows = Object.keys(rowSelection).filter(
    (key) => rowSelection[key]
  );
  const selectedData = tableData.filter((_, index) =>
    selectedRows.includes(index.toString())
  );

  const handleDeleteSelected = () => {
    const newData = tableData.filter((_, index) => !rowSelection[index]);

    setTableData(newData);
    setRowSelection({});
  };

  const handleExport = () => {
    const dataToExport =
      Object.keys(rowSelection).length > 0 ? selectedData : tableData;


    exportGuestsToExcel(dataToExport, "hotel-guests-data");
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setIsViewModalOpen(false);
    setIsEditModalOpen(false);
    setIsDeleteModalOpen(false);
    setSelectedGuest(null);
    // Reset form fields
    setNewGuest({
      bookingId: "",
      serviceIds: [],
      status: "free",
      guestDetails: [],
      amount: 0,
      bookingDate: Date.now(),
      expectedCheckOutDate: null,
      userDetails: {
        idType: "idCard",
        phoneNumber: "",
        address: "",
        purpose: "Tourism",
        emailId: "",
        idNumber: "",
        age: 18,
        username: "",
      },
      expectedCheckInDate: null,
      institution: "",
      foodbill: {},
    });
  };

  const handleInputChange = (field, value) => {
    if (field.startsWith("userDetails.")) {
      const userField = field.split(".")[1];
      setNewGuest((prev) => ({
        ...prev,
        userDetails: {
          ...prev.userDetails,
          [userField]: value,
        },
      }));
    } else if (field === "amount") {
      setNewGuest((prev) => ({
        ...prev,
        [field]: parseFloat(value) || 0,
      }));
    } else if (field === "checkInDate" || field === "checkOutDate") {
      const timestamp = new Date(value).getTime();
      if (field === "checkInDate") {
        setNewGuest((prev) => ({
          ...prev,
          expectedCheckInDate: timestamp,
        }));
      } else {
        setNewGuest((prev) => ({
          ...prev,
          expectedCheckOutDate: timestamp,
        }));
      }
    } else {
      setNewGuest((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleEditInputChange = (field, value, nestedField = null) => {
    if (nestedField) {
      setSelectedGuest((prev) => ({
        ...prev,
        [field]: {
          ...prev[field],
          [nestedField]: value,
        },
      }));
    } else {
      setSelectedGuest((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();

    // Generate a unique booking ID
    const bookingId = `b${Math.random().toString(36).substring(2, 15)}`;

    const updatedGuest = {
      ...newGuest,
      bookingId,
      bookingDate: Date.now(),
    };

    // Make sure dates are valid
    if (!updatedGuest.expectedCheckInDate || !updatedGuest.expectedCheckOutDate) {
      alert("Please select valid check-in and check-out dates");
      return;
    }

    setTableData((prev) => [...prev, updatedGuest]);
    handleCloseModal();
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();

    // Update the guest in the table data
    setTableData((prev) =>
      prev.map((guest) =>
        guest.bookingId === selectedGuest.bookingId
          ? selectedGuest
          : guest
      )
    );

    handleCloseModal();
  };

  const handleConfirmDelete = () => {
    // Remove the guest from the table data
    setTableData((prev) =>
      prev.filter(
        (guest) => guest.bookingId !== selectedGuest.bookingId
      )
    );

    handleCloseModal();
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const columns = React.useMemo(() => {
    return [
      ...staticColumns,
      // {
      //   header: "Actions",
      //   accessorKey: "actions",
      //   cell: ({ row }) => {
      //     const guest = row.original;
      //     return (
      //       <div className="flex items-center gap-6">
      //         <Button
      //           variant={"light"}
      //           size={"xsm"}
      //           className="bg-violet-100 text-violet-500"
      //           onClick={() => handleViewGuest(guest)}
      //         >
      //           <Eye size={20} />
      //         </Button>
      //         <Button
      //           variant={"light"}
      //           size={"xsm"}
      //           className="bg-blue-100 text-blue-500"
      //           onClick={() => handleEditGuest(guest)}
      //         >
      //           <Edit size={20} />
      //         </Button>
      //         <Button
      //           size={"xsm"}
      //           variant={"light"}
      //           className="bg-red-100 text-red-500"
      //           onClick={() => handleDeleteGuest(guest)}
      //         >
      //           <Trash2 size={20} />
      //         </Button>
      //       </div>
      //     );
      //   },
      // },
    ];
  }, []);

  return (
    <div className="w-full flex mx-auto containter flex-col gap-4 py-4 px-6 bg-white rounded-md">
      
      <div className="my-2">
        <h1 className="text-3xl font-semibold text-gray-800">Guests</h1>
        <p className="text-sm text-gray-500">
          Manage your guests and their information.
        </p>
      </div>
      <div className="flex justify-between w-full flex-row bg-white ">
        <div className="w-full max-w-md border-2 rounded-md px-4 flex items-center justify-center gap-2">
          <input
            type="text"
            placeholder="Search by name, ID, email or phone..."
            className="w-full py-1 text-sm rounded-lg border-0 focus:outline-none"
            value={searchQuery}
            onChange={handleSearchChange}
          />
          <Search className="text-gray-500" size={20} />
        </div>        <div className="flex flex-row justify-center items-center gap-2">
        {Object.keys(rowSelection).length > 0 && (
          <Button
            variant="delete"
            className="flex items-center gap-2"
            onClick={handleDeleteSelected}
          >
            Delete Selected <Trash2 />
          </Button>
        )}
        {/*<DatePickerWithRange*/}
        {/*  className="hidden md:flex"*/}
        {/*  date={date}*/}
        {/*  setDate={setDate}*/}
        {/*/>*/}
        {/*<Button*/}
        {/*  variant="outline"*/}
        {/*  className="flex items-center gap-2"*/}
        {/*  onClick={handleRefresh}*/}
        {/*>*/}
        {/*  Refresh <RefreshCw />*/}
        {/*</Button>*/}
        {Object.keys(rowSelection).length > 0 ? (
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={handleExport}
          >
            Export Selected <Download />
          </Button>
        ) : (
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={handleExport}
          >
            Export All <Download />
          </Button>
        )}
        {/*<Button className="bg-secondary" onClick={handleAddCustomer}>*/}
        {/*  Add Customer <Plus />*/}
        {/*</Button>*/}
      </div>
      </div>

      <TableComponent
        columns={columns}
        data={tableData}
        setRowSelection={setRowSelection}
        rowSelection={rowSelection}
      />

      {/* Add Customer Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[525px] inter">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Add New Customer
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4 pt-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Customer Name</Label>
                <Input
                  id="name"
                  value={newGuest.userDetails.username}
                  onChange={(e) =>
                    handleInputChange("userDetails.username", e.target.value)
                  }
                  placeholder="Enter customer name"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newGuest.userDetails.emailId}
                    onChange={(e) =>
                      handleInputChange("userDetails.emailId", e.target.value)
                    }
                    placeholder="customer@example.com"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={newGuest.userDetails.phoneNumber}
                    onChange={(e) =>
                      handleInputChange("userDetails.phoneNumber", e.target.value)
                    }
                    placeholder="+1 (202) 555-0123"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="checkIn">Check In Date</Label>
                  <Input
                    id="checkIn"
                    type="date"
                    onChange={(e) =>
                      handleInputChange("checkInDate", e.target.value)
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="checkOut">Check Out Date</Label>
                  <Input
                    id="checkOut"
                    type="date"
                    onChange={(e) =>
                      handleInputChange("checkOutDate", e.target.value)
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="amount">Purchase Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={newGuest.amount}
                    onChange={(e) =>
                      handleInputChange("amount", e.target.value)
                    }
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="purpose">Purpose of Visit</Label>
                  <Input
                    id="purpose"
                    value={newGuest.userDetails.purpose}
                    onChange={(e) =>
                      handleInputChange("userDetails.purpose", e.target.value)
                    }
                    placeholder="Tourism, Business, etc."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="idType">ID Type</Label>
                  <Input
                    id="idType"
                    value={newGuest.userDetails.idType}
                    onChange={(e) =>
                      handleInputChange("userDetails.idType", e.target.value)
                    }
                    placeholder="Passport, ID Card, etc."
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="idNumber">ID Number</Label>
                  <Input
                    id="idNumber"
                    value={newGuest.userDetails.idNumber}
                    onChange={(e) =>
                      handleInputChange("userDetails.idNumber", e.target.value)
                    }
                    placeholder="ID Number"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    value={newGuest.userDetails.age}
                    onChange={(e) =>
                      handleInputChange("userDetails.age", e.target.value)
                    }
                    placeholder="Age"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="institution">Institution/Company</Label>
                  <Input
                    id="institution"
                    value={newGuest.institution}
                    onChange={(e) =>
                      handleInputChange("institution", e.target.value)
                    }
                    placeholder="Company or Institution"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={newGuest.userDetails.address}
                  onChange={(e) =>
                    handleInputChange("userDetails.address", e.target.value)
                  }
                  placeholder="123 Main St, City, State"
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={handleCloseModal}
              >
                Cancel
              </Button>
              <Button type="submit">Add Customer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Guest Modal */}
      {/*{selectedGuest && (*/}
      {/*  <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>*/}
      {/*    <DialogContent className="sm:max-w-[525px] inter">*/}
      {/*      <DialogHeader>*/}
      {/*        <DialogTitle className="text-xl font-bold">*/}
      {/*          Guest Details*/}
      {/*        </DialogTitle>*/}
      {/*      </DialogHeader>*/}
      {/*      <div className="space-y-4 pt-4">*/}
      {/*        <div className="grid gap-4">*/}
      {/*          <div className="grid grid-cols-2 gap-4">*/}
      {/*            /!*<div>*!/*/}
      {/*            /!*  <Label className="font-semibold">ID Proof</Label>*!/*/}
      {/*            /!*  <p className="text-gray-700 mt-1">*!/*/}
      {/*            /!*    {selectedGuest.id_proof_type}*!/*/}
      {/*            /!*  </p>*!/*/}
      {/*            /!*  <p className="text-gray-700 mt-1">*!/*/}
      {/*            /!*    {selectedGuest.id_proof_number}*!/*/}
      {/*            /!*  </p>*!/*/}
      {/*            /!*</div>*!/*/}
      {/*            <div>*/}
      {/*              <Label className="font-semibold">Customer Name</Label>*/}
      {/*              <p className="text-gray-700 mt-1">*/}
      {/*                {selectedGuest.full_name}*/}
      {/*              </p>*/}
      {/*            </div>*/}
      {/*          </div>*/}

      {/*          <div className="grid grid-cols-2 gap-4">*/}
      {/*            <div>*/}
      {/*              <Label className="font-semibold">Email</Label>*/}
      {/*              <p className="text-gray-700 mt-1">*/}
      {/*                {selectedGuest.email}*/}
      {/*              </p>*/}
      {/*            </div>*/}
      {/*            <div>*/}
      {/*              <Label className="font-semibold">Phone</Label>*/}
      {/*              <p className="text-gray-700 mt-1">*/}
      {/*                {selectedGuest.mobile}*/}
      {/*              </p>*/}
      {/*            </div>*/}
      {/*          </div>*/}

      {/*          /!*<div className="grid grid-cols-2 gap-4">*!/*/}
      {/*          /!*  <div>*!/*/}
      {/*          /!*    <Label className="font-semibold">Check In</Label>*!/*/}
      {/*          /!*    <p className="text-gray-700 mt-1">*!/*/}
      {/*          /!*      {new Date(selectedGuest.expectedCheckInDate).toLocaleDateString()}*!/*/}
      {/*          /!*    </p>*!/*/}
      {/*          /!*  </div>*!/*/}
      {/*          /!*  <div>*!/*/}
      {/*          /!*    <Label className="font-semibold">Check Out</Label>*!/*/}
      {/*          /!*    <p className="text-gray-700 mt-1">*!/*/}
      {/*          /!*      {new Date(selectedGuest.expectedCheckOutDate).toLocaleDateString()}*!/*/}
      {/*          /!*    </p>*!/*/}
      {/*          /!*  </div>*!/*/}
      {/*          /!*</div>*!/*/}

      {/*          /!*<div className="grid grid-cols-2 gap-4">*!/*/}
      {/*          /!*  <div>*!/*/}
      {/*          /!*    <Label className="font-semibold">Purchase Amount</Label>*!/*/}
      {/*          /!*    <p className="text-gray-700 mt-1">*!/*/}
      {/*          /!*      ${selectedGuest.amount}*!/*/}
      {/*          /!*    </p>*!/*/}
      {/*          /!*  </div>*!/*/}
      {/*          /!*  <div>*!/*/}
      {/*          /!*    <Label className="font-semibold">Purpose</Label>*!/*/}
      {/*          /!*    <p className="text-gray-700 mt-1">*!/*/}
      {/*          /!*      {selectedGuest.userDetails.purpose}*!/*/}
      {/*          /!*    </p>*!/*/}
      {/*          /!*  </div>*!/*/}
      {/*          /!*</div>*!/*/}

      {/*          <div className="grid grid-cols-2 gap-4">*/}
      {/*            <div>*/}
      {/*              <Label className="font-semibold">ID Type</Label>*/}
      {/*              <p className="text-gray-700 mt-1">*/}
      {/*                {selectedGuest.id_proof_type}*/}
      {/*              </p>*/}
      {/*            </div>*/}
      {/*            <div>*/}
      {/*              <Label className="font-semibold">ID Number</Label>*/}
      {/*              <p className="text-gray-700 mt-1">*/}
      {/*                {selectedGuest.id_proof_number}*/}
      {/*              </p>*/}
      {/*            </div>*/}
      {/*          </div>*/}

      {/*          /!*<div className="grid grid-cols-2 gap-4">*!/*/}
      {/*          /!*  <div>*!/*/}
      {/*          /!*    <Label className="font-semibold">Age</Label>*!/*/}
      {/*          /!*    <p className="text-gray-700 mt-1">*!/*/}
      {/*          /!*      {selectedGuest.userDetails.age}*!/*/}
      {/*          /!*    </p>*!/*/}
      {/*          /!*  </div>*!/*/}
      {/*          /!*  <div>*!/*/}
      {/*          /!*    <Label className="font-semibold">Institution</Label>*!/*/}
      {/*          /!*    <p className="text-gray-700 mt-1">*!/*/}
      {/*          /!*      {selectedGuest.institution || 'N/A'}*!/*/}
      {/*          /!*    </p>*!/*/}
      {/*          /!*  </div>*!/*/}
      {/*          /!*</div>*!/*/}

      {/*          <div>*/}
      {/*            <Label className="font-semibold">Address</Label>*/}
      {/*            <p className="text-gray-700 mt-1">{selectedGuest.address}</p>*/}
      {/*            <p className="text-gray-700 mt-1">{selectedGuest.pincode}</p>*/}
      {/*            <p className="text-gray-700 mt-1">{selectedGuest.city}</p>*/}
      {/*            <p className="text-gray-700 mt-1">{selectedGuest.state}</p>*/}
      {/*            <p className="text-gray-700 mt-1">{selectedGuest.country}</p>*/}
      {/*          </div>*/}
      {/*        </div>*/}
      {/*      </div>*/}

      {/*      <DialogFooter>*/}
      {/*        <Button onClick={handleCloseModal}>Close</Button>*/}
      {/*      </DialogFooter>*/}
      {/*    </DialogContent>*/}
      {/*  </Dialog>*/}
      {/*)}*/}

      {/* Edit Guest Modal */}
      {/*{selectedGuest && (*/}
      {/*  <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>*/}
      {/*    <DialogContent className="sm:max-w-[525px] inter">*/}
      {/*      <DialogHeader>*/}
      {/*        <DialogTitle className="text-xl font-bold">*/}
      {/*          Edit Guest*/}
      {/*        </DialogTitle>*/}
      {/*      </DialogHeader>*/}
      {/*      <form onSubmit={handleEditSubmit} className="space-y-4 pt-4">*/}
      {/*        <div className="grid gap-4">*/}
      {/*          <div className="grid gap-2">*/}
      {/*            <Label htmlFor="edit-name">Customer Name</Label>*/}
      {/*            <Input*/}
      {/*              id="edit-name"*/}
      {/*              value={selectedGuest.userDetails.username || ""}*/}
      {/*              onChange={(e) =>*/}
      {/*                handleEditInputChange(*/}
      {/*                  "userDetails",*/}
      {/*                  {*/}
      {/*                    ...selectedGuest.userDetails,*/}
      {/*                    username: e.target.value*/}
      {/*                  }*/}
      {/*                )*/}
      {/*              }*/}
      {/*              placeholder="Enter customer name"*/}
      {/*              required*/}
      {/*            />*/}
      {/*          </div>*/}

      {/*          <div className="grid grid-cols-2 gap-4">*/}
      {/*            <div className="grid gap-2">*/}
      {/*              <Label htmlFor="edit-email">Email</Label>*/}
      {/*              <Input*/}
      {/*                id="edit-email"*/}
      {/*                type="email"*/}
      {/*                value={selectedGuest.userDetails.emailId || ""}*/}
      {/*                onChange={(e) =>*/}
      {/*                  handleEditInputChange(*/}
      {/*                    "userDetails",*/}
      {/*                    {*/}
      {/*                      ...selectedGuest.userDetails,*/}
      {/*                      emailId: e.target.value*/}
      {/*                    }*/}
      {/*                  )*/}
      {/*                }*/}
      {/*                placeholder="customer@example.com"*/}
      {/*                required*/}
      {/*              />*/}
      {/*            </div>*/}
      {/*            <div className="grid gap-2">*/}
      {/*              <Label htmlFor="edit-phone">Phone</Label>*/}
      {/*              <Input*/}
      {/*                id="edit-phone"*/}
      {/*                value={selectedGuest.userDetails.phoneNumber || ""}*/}
      {/*                onChange={(e) =>*/}
      {/*                  handleEditInputChange(*/}
      {/*                    "userDetails",*/}
      {/*                    {*/}
      {/*                      ...selectedGuest.userDetails,*/}
      {/*                      phoneNumber: e.target.value*/}
      {/*                    }*/}
      {/*                  )*/}
      {/*                }*/}
      {/*                placeholder="+1 (202) 555-0123"*/}
      {/*                required*/}
      {/*              />*/}
      {/*            </div>*/}
      {/*          </div>*/}

      {/*          <div className="grid grid-cols-2 gap-4">*/}
      {/*            <div className="grid gap-2">*/}
      {/*              <Label htmlFor="edit-checkIn">Check In Date</Label>*/}
      {/*              <Input*/}
      {/*                id="edit-checkIn"*/}
      {/*                type="date"*/}
      {/*                value={new Date(selectedGuest.expectedCheckInDate).toISOString().split('T')[0]}*/}
      {/*                onChange={(e) =>*/}
      {/*                  handleEditInputChange(*/}
      {/*                    "expectedCheckInDate",*/}
      {/*                    new Date(e.target.value).getTime()*/}
      {/*                  )*/}
      {/*                }*/}
      {/*                required*/}
      {/*              />*/}
      {/*            </div>*/}
      {/*            <div className="grid gap-2">*/}
      {/*              <Label htmlFor="edit-checkOut">Check Out Date</Label>*/}
      {/*              <Input*/}
      {/*                id="edit-checkOut"*/}
      {/*                type="date"*/}
      {/*                value={new Date(selectedGuest.expectedCheckOutDate).toISOString().split('T')[0]}*/}
      {/*                onChange={(e) =>*/}
      {/*                  handleEditInputChange(*/}
      {/*                    "expectedCheckOutDate",*/}
      {/*                    new Date(e.target.value).getTime()*/}
      {/*                  )*/}
      {/*                }*/}
      {/*                required*/}
      {/*              />*/}
      {/*            </div>*/}
      {/*          </div>*/}

      {/*          <div className="grid grid-cols-2 gap-4">*/}
      {/*            <div className="grid gap-2">*/}
      {/*              <Label htmlFor="edit-amount">Purchase Amount</Label>*/}
      {/*              <Input*/}
      {/*                id="edit-amount"*/}
      {/*                type="number"*/}
      {/*                value={selectedGuest.amount || 0}*/}
      {/*                onChange={(e) =>*/}
      {/*                  handleEditInputChange("amount", parseFloat(e.target.value) || 0)*/}
      {/*                }*/}
      {/*                placeholder="0.00"*/}
      {/*                required*/}
      {/*              />*/}
      {/*            </div>*/}
      {/*            <div className="grid gap-2">*/}
      {/*              <Label htmlFor="edit-purpose">Purpose of Visit</Label>*/}
      {/*              <Input*/}
      {/*                id="edit-purpose"*/}
      {/*                value={selectedGuest.userDetails.purpose || ""}*/}
      {/*                onChange={(e) =>*/}
      {/*                  handleEditInputChange(*/}
      {/*                    "userDetails",*/}
      {/*                    {*/}
      {/*                      ...selectedGuest.userDetails,*/}
      {/*                      purpose: e.target.value*/}
      {/*                    }*/}
      {/*                  )*/}
      {/*                }*/}
      {/*                placeholder="Tourism, Business, etc."*/}
      {/*              />*/}
      {/*            </div>*/}
      {/*          </div>*/}

      {/*          <div className="grid grid-cols-2 gap-4">*/}
      {/*            <div className="grid gap-2">*/}
      {/*              <Label htmlFor="edit-idType">ID Type</Label>*/}
      {/*              <Input*/}
      {/*                id="edit-idType"*/}
      {/*                value={selectedGuest.userDetails.idType || ""}*/}
      {/*                onChange={(e) =>*/}
      {/*                  handleEditInputChange(*/}
      {/*                    "userDetails",*/}
      {/*                    {*/}
      {/*                      ...selectedGuest.userDetails,*/}
      {/*                      idType: e.target.value*/}
      {/*                    }*/}
      {/*                  )*/}
      {/*                }*/}
      {/*                placeholder="Passport, ID Card, etc."*/}
      {/*              />*/}
      {/*            </div>*/}
      {/*            <div className="grid gap-2">*/}
      {/*              <Label htmlFor="edit-idNumber">ID Number</Label>*/}
      {/*              <Input*/}
      {/*                id="edit-idNumber"*/}
      {/*                value={selectedGuest.userDetails.idNumber || ""}*/}
      {/*                onChange={(e) =>*/}
      {/*                  handleEditInputChange(*/}
      {/*                    "userDetails",*/}
      {/*                    {*/}
      {/*                      ...selectedGuest.userDetails,*/}
      {/*                      idNumber: e.target.value*/}
      {/*                    }*/}
      {/*                  )*/}
      {/*                }*/}
      {/*                placeholder="ID Number"*/}
      {/*              />*/}
      {/*            </div>*/}
      {/*          </div>*/}

      {/*          <div className="grid grid-cols-2 gap-4">*/}
      {/*            <div className="grid gap-2">*/}
      {/*              <Label htmlFor="edit-age">Age</Label>*/}
      {/*              <Input*/}
      {/*                id="edit-age"*/}
      {/*                type="number"*/}
      {/*                value={selectedGuest.userDetails.age || ""}*/}
      {/*                onChange={(e) =>*/}
      {/*                  handleEditInputChange(*/}
      {/*                    "userDetails",*/}
      {/*                    {*/}
      {/*                      ...selectedGuest.userDetails,*/}
      {/*                      age: parseInt(e.target.value) || 0*/}
      {/*                    }*/}
      {/*                  )*/}
      {/*                }*/}
      {/*                placeholder="Age"*/}
      {/*              />*/}
      {/*            </div>*/}
      {/*            <div className="grid gap-2">*/}
      {/*              <Label htmlFor="edit-institution">Institution/Company</Label>*/}
      {/*              <Input*/}
      {/*                id="edit-institution"*/}
      {/*                value={selectedGuest.institution || ""}*/}
      {/*                onChange={(e) =>*/}
      {/*                  handleEditInputChange("institution", e.target.value)*/}
      {/*                }*/}
      {/*                placeholder="Company or Institution"*/}
      {/*              />*/}
      {/*            </div>*/}
      {/*          </div>*/}

      {/*          <div className="grid gap-2">*/}
      {/*            <Label htmlFor="edit-address">Address</Label>*/}
      {/*            <Input*/}
      {/*              id="edit-address"*/}
      {/*              value={selectedGuest.userDetails.address || ""}*/}
      {/*              onChange={(e) =>*/}
      {/*                handleEditInputChange(*/}
      {/*                  "userDetails",*/}
      {/*                  {*/}
      {/*                    ...selectedGuest.userDetails,*/}
      {/*                    address: e.target.value*/}
      {/*                  }*/}
      {/*                )*/}
      {/*              }*/}
      {/*              placeholder="123 Main St, City, State"*/}
      {/*              required*/}
      {/*            />*/}
      {/*          </div>*/}
      {/*        </div>*/}

      {/*        <DialogFooter>*/}
      {/*          <Button*/}
      {/*            variant="outline"*/}
      {/*            type="button"*/}
      {/*            onClick={handleCloseModal}*/}
      {/*          >*/}
      {/*            Cancel*/}
      {/*          </Button>*/}
      {/*          <Button type="submit">Save Changes</Button>*/}
      {/*        </DialogFooter>*/}
      {/*      </form>*/}
      {/*    </DialogContent>*/}
      {/*  </Dialog>*/}
      {/*)}*/}

      {/* Delete Guest Modal */}
      {/*{selectedGuest && (*/}
      {/*  <Dialog*/}
      {/*    open={isDeleteModalOpen}*/}
      {/*    onOpenChange={setIsDeleteModalOpen}*/}
      {/*  >*/}
      {/*    <DialogContent className="sm:max-w-[425px] inter">*/}
      {/*      <DialogHeader>*/}
      {/*        <DialogTitle className="text-xl font-bold text-red-600">*/}
      {/*          Delete Guest*/}
      {/*        </DialogTitle>*/}
      {/*      </DialogHeader>*/}
      {/*      <div className="space-y-4 pt-4">*/}
      {/*        <p className="text-center">*/}
      {/*          Are you sure you want to delete this guest?*/}
      {/*        </p>*/}
      {/*        <div className="bg-gray-50 p-4 rounded-md">*/}
      {/*          <p className="font-semibold">{selectedGuest.full_name}</p>*/}
      {/*          <p className="text-sm text-gray-500">{selectedGuest.email}</p>*/}
      {/*          /!*<p className="text-sm text-gray-500">ID: {selectedGuest.bookingId.slice(0, 8)}</p>*!/*/}
      {/*        </div>*/}
      {/*        <p className="text-center text-sm text-red-500 mt-2">*/}
      {/*          This action cannot be undone.*/}
      {/*        </p>*/}
      {/*      </div>*/}

      {/*      <DialogFooter>*/}
      {/*        <Button*/}
      {/*          variant="outline"*/}
      {/*          type="button"*/}
      {/*          onClick={handleCloseModal}*/}
      {/*        >*/}
      {/*          Cancel*/}
      {/*        </Button>*/}
      {/*        <Button variant="destructive" onClick={handleConfirmDelete}>*/}
      {/*          Delete*/}
      {/*        </Button>*/}
      {/*      </DialogFooter>*/}
      {/*    </DialogContent>*/}
      {/*  </Dialog>*/}
      {/*)}*/}
    </div>
  );
}
export default Guests;