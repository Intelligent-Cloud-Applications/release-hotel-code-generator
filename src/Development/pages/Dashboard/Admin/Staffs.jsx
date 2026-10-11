import React, { useEffect, useState, useMemo } from "react";
import Select from "react-select";
import { Checkbox } from "@/Development/components/ui/checkbox.js";
import { TableComponent } from "@/Development/components/ui/TableComponent.jsx";
import { Button } from "@/Development/components/ui/button.js";
import { Download, Edit, Plus, Search, Trash2 } from "lucide-react";
import { exportStaffsToExcel } from "@/Development/components/utils/excelExport.js";
import { useAppContext } from "@/Development/context/AppContext.jsx";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/Development/components/ui/dialog.js";
import { Input } from "@/Development/components/ui/input.js";
import { Label } from "@/Development/components/ui/label.js";

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
    accessorKey: "name",
    header: "Staff Name",
    cell: (info) => {
      const roleRaw = info.row.original.role;
      const roles = Array.isArray(roleRaw) ? roleRaw : roleRaw ? [roleRaw] : [];
      return (
        <div className="flex flex-col justify-center gap-1">
          <span className="font-semibold text-gray-700">{info.getValue()}</span>
          {roles.length > 0 && (
            <span className="text-xs text-gray-500 truncate">
              {roles
                .map((r) => {
                  const str = typeof r === "object" ? r.value || r.label || "" : String(r || "");
                  return str ? str.charAt(0).toUpperCase() + str.slice(1) : "";
                })
                .filter(Boolean)
                .join(", ")}
            </span>
          )}
        </div>
      );
    },
  },
  {
    id: "contact",
    header: "Contact",
    accessorKey: "mobile",
    cell: (info) => (
      <div className="flex flex-col text-gray-600 gap-1">
        <span>{info.getValue()}</span>
        <span>{info.row.original.email}</span>
      </div>
    ),
  },
  {
    id: "status",
    header: "Active",
    accessorKey: "is_active",
    cell: (info) =>
      info.getValue() ? (
        <span className="bg-green-100 text-green-600 font-medium px-3 py-1 rounded-xl">
          Active
        </span>
      ) : (
        <span className="bg-red-100 text-red-600 font-medium px-3 py-1 rounded-xl">
          Inactive
        </span>
      ),
  },
];

const Staffs = () => {
  const { staffs, createStaff, updateStaff, deleteStaff, loading } = useAppContext();

  const [tableData, setTableData] = useState(staffs);
  const [searchQuery, setSearchQuery] = useState("");
  const [rowSelection, setRowSelection] = useState({});

  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [isEditStaffOpen, setIsEditStaffOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [newStaffData, setNewStaffData] = useState({
    name: "",
    email: "",
    mobile: "",
    role: [],
    password: "",
  });

  const [currentStaff, setCurrentStaff] = useState(null);
  const availableRoles = ["admin", "frontdesk", "housekeeping", "accountant", "laundry", "store"].map((r) => ({
    label: r.charAt(0).toUpperCase() + r.slice(1),
    value: r,
  }));

  // Sync data from context
  useEffect(() => {
    setTableData(staffs);
  }, [staffs]);

  // Filter by search
  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = staffs.filter((staff) => {
        const query = searchQuery.toLowerCase();
        return (
          staff.name?.toLowerCase().includes(query) ||
          staff.email?.toLowerCase().includes(query) ||
          staff.mobile?.toLowerCase().includes(query)
        );
      });
      setTableData(filtered);
    } else setTableData(staffs);
  }, [searchQuery, staffs]);

  const selectedRows = Object.keys(rowSelection).filter((k) => rowSelection[k]);
  const selectedData = tableData.filter((_, i) => selectedRows.includes(i.toString()));

  const handleExport = () => {
    const dataToExport =
      Object.keys(rowSelection).length > 0 ? selectedData : tableData;
    exportStaffsToExcel(dataToExport);
  };

  const handleAddStaffChange = (e) => {
    const { name, value } = e.target;
    setNewStaffData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddStaffSubmit = async (e) => {
    e.preventDefault();
    try {
      if (staffs.some((s) => s.email === newStaffData.email)) {
        toast.error("Email already exists");
        return;
      }
      if (!newStaffData.role.length) {
        toast.error("Select at least one role");
        return;
      }
      const payload = {
        ...newStaffData,
        role: newStaffData.role.map((r) => (typeof r === "object" ? r.value : r)),
      };
      const result = await createStaff(payload);
      if (result.success) {
        toast.success("Staff added successfully");
        setIsAddStaffOpen(false);
        setNewStaffData({
          name: "",
          email: "",
          mobile: "",
          role: [],
          password: "",
        });
      } else toast.error("Failed to add staff");
    } catch (err) {
      toast.error("Error creating staff");
    }
  };

  const handleEditStaff = (staff) => {
    setCurrentStaff(staff);
    let initialRoles = [];
    if (Array.isArray(staff.role)) {
      initialRoles = staff.role.map((r) => {
        const val = typeof r === "object" ? (r.value || "").toLowerCase() : String(r).toLowerCase();
        return { label: val.charAt(0).toUpperCase() + val.slice(1), value: val };
      });
    } else if (typeof staff.role === "string" && staff.role.trim()) {
      const val = staff.role.trim().toLowerCase();
      initialRoles = [{ label: val.charAt(0).toUpperCase() + val.slice(1), value: val }];
    }
    setNewStaffData({
      name: staff.name,
      email: staff.email,
      mobile: staff.mobile,
      role: initialRoles,
      password: "",
    });
    setIsEditStaffOpen(true);
  };

  const handleUpdateStaff = async (e) => {
    e.preventDefault();
    try {
      if (!newStaffData.role.length) {
        toast.error("Select at least one role");
        return;
      }
      const payload = {
        ...newStaffData,
        role: newStaffData.role.map((r) => (typeof r === "object" ? r.value : r)),
        staff_id: currentStaff.staff_id,
      };
      await updateStaff(payload);
        toast.success("Staff updated successfully");
        setIsEditStaffOpen(false);
        setNewStaffData({
          name: '',
          email: '',
          mobile: '',
          role: [],
          password: ''
        })
    } catch (e) {
      console.log(e)
      toast.error("Error updating staff");
    }
  };

  const handleDeleteStaff = (staff) => {
    setDeleteTarget(staff.staff_id);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    const result = await deleteStaff(deleteTarget);
    if (result.success) toast.success("Deleted successfully");
    else toast.error("Delete failed");
    setIsDeleteConfirmOpen(false);
  };

  const columns = useMemo(() => {
    return [
      ...staticColumns,
      {
        accessorKey: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const staff = row.original;
          return (
            <div className="flex gap-3">
              <Button
                size="xsm"
                variant="light"
                className="bg-blue-100 text-blue-600"
                onClick={() => handleEditStaff(staff)}
              >
                <Edit size={18} />
              </Button>
              <Button
                size="xsm"
                variant="light"
                className="bg-red-100 text-red-500"
                onClick={() => handleDeleteStaff(staff)}
              >
                <Trash2 size={18} />
              </Button>
            </div>
          );
        },
      },
    ];
  }, []);

  return (
    <div className="w-full container flex flex-col gap-4 py-4 px-6 bg-white rounded-md">
      <div>
        <h1 className="text-3xl font-semibold text-gray-800">Staffs</h1>
        <p className="text-sm text-gray-500">Manage your staff information</p>
      </div>

      {/* Toolbar */}
      <div className="flex justify-between items-center gap-3">
        <div className="flex items-center gap-2 border rounded-md px-3 w-full max-w-md">
          <Search className="text-gray-500" size={18} />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email or phone"
            className="w-full py-2 text-sm border-0 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport}>
            {selectedRows.length > 0 ? "Export Selected" : "Export All"} <Download />
          </Button>
          <Button className="bg-secondary" onClick={() => setIsAddStaffOpen(true)}>
            Add Staff <Plus />
          </Button>
        </div>
      </div>

      {/* Table */}
      <TableComponent
        columns={columns}
        data={tableData}
        rowSelection={rowSelection}
        setRowSelection={setRowSelection}
      />

      {/* Add Modal */}
      <Dialog open={isAddStaffOpen} onOpenChange={setIsAddStaffOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Staff</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddStaffSubmit} className="grid gap-4">
            <div>
              <Label>Name</Label>
              <Input name="name" value={newStaffData.name} onChange={handleAddStaffChange} required />
            </div>
            <div>
              <Label>Email</Label>
              <Input name="email" type="email" value={newStaffData.email} onChange={handleAddStaffChange} required />
            </div>
            <div>
              <Label>Phone</Label>
              <Input name="mobile" value={newStaffData.mobile} onChange={handleAddStaffChange} required />
            </div>
            <div>
              <Label>Password</Label>
              <Input name="password" type="password" value={newStaffData.password} onChange={handleAddStaffChange} required />
            </div>
            <div>
              <Label>Roles</Label>
              <Select
                isMulti
                options={availableRoles}
                value={newStaffData.role}
                onChange={(selected) => setNewStaffData((prev) => ({ ...prev, role: selected || [] }))}
                placeholder="Select roles..."
                menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                menuPosition="fixed"
                styles={{
                  menuPortal: (base) => ({ ...base, zIndex: 99999 }),
                }}
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {availableRoles.map((r) => {
                  const isSelected = (newStaffData.role || []).some(
                    (sel) => (typeof sel === "object" ? sel.value : sel) === r.value
                  );
                  return (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setNewStaffData((prev) => ({
                            ...prev,
                            role: (prev.role || []).filter(
                              (sel) => (typeof sel === "object" ? sel.value : sel) !== r.value
                            ),
                          }));
                        } else {
                          setNewStaffData((prev) => ({
                            ...prev,
                            role: [...(prev.role || []), r],
                          }));
                        }
                      }}
                      className={`px-2.5 py-1 text-xs rounded-md font-semibold transition-all border ${
                        isSelected
                          ? "bg-black text-white border-black"
                          : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
                      }`}
                    >
                      {isSelected ? "✓ " : "+ "}
                      {r.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddStaffOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Adding..." : "Add Staff"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditStaffOpen} onOpenChange={setIsEditStaffOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Staff</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateStaff} className="grid gap-4">
            <div>
              <Label>Name</Label>
              <Input name="name" value={newStaffData.name} onChange={handleAddStaffChange} required />
            </div>
            <div>
              <Label>Email</Label>
              <Input name="email" type="email" value={newStaffData.email} disabled />
            </div>
            <div>
              <Label>Phone</Label>
              <Input name="mobile" value={newStaffData.mobile} onChange={handleAddStaffChange} required />
            </div>
            <div>
              <Label>Password</Label>
              <Input name="password" type="password" value={newStaffData.password} onChange={handleAddStaffChange} placeholder="Leave blank to keep unchanged" />
            </div>
            <div>
              <Label>Roles</Label>
              <Select
                isMulti
                options={availableRoles}
                value={newStaffData.role}
                onChange={(selected) => setNewStaffData((prev) => ({ ...prev, role: selected || [] }))}
                placeholder="Select roles..."
                menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                menuPosition="fixed"
                styles={{
                  menuPortal: (base) => ({ ...base, zIndex: 99999 }),
                }}
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {availableRoles.map((r) => {
                  const isSelected = (newStaffData.role || []).some(
                    (sel) => (typeof sel === "object" ? sel.value : sel) === r.value
                  );
                  return (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setNewStaffData((prev) => ({
                            ...prev,
                            role: (prev.role || []).filter(
                              (sel) => (typeof sel === "object" ? sel.value : sel) !== r.value
                            ),
                          }));
                        } else {
                          setNewStaffData((prev) => ({
                            ...prev,
                            role: [...(prev.role || []), r],
                          }));
                        }
                      }}
                      className={`px-2.5 py-1 text-xs rounded-md font-semibold transition-all border ${
                        isSelected
                          ? "bg-black text-white border-black"
                          : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
                      }`}
                    >
                      {isSelected ? "✓ " : "+ "}
                      {r.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditStaffOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save Changes"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-600">
              Are you sure you want to delete this staff member? This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDelete}
              disabled={loading}
            >
              {loading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Staffs;
