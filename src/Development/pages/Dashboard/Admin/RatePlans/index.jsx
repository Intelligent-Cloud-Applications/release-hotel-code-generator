import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/Development/components/ui/table.js";
import { Button } from "@/Development/components/ui/button.js";
import { Input } from "@/Development/components/ui/input.js";
import {
  Download,
  Edit,
  Plus,
  Search,
  Trash2,
  Badge as BadgeIcon,
} from "lucide-react";
import { useAppContext } from "@/Development/context/AppContext.jsx";
import RatePlanModal from "./RatePlanModal.jsx";
import { toast } from "sonner";
import { Badge } from "@/Development/components/ui/badge.js";

// Confirm Delete Modal Component
const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm, ratePlanName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Confirm Deletion
        </h2>
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete the rate plan "{ratePlanName}"? This action
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

const RatePlans = () => {
  const {
    ratePlans,
    loading,
    createRatePlan,
    updateRatePlan,
    deleteRatePlan,
    fetchRatePlans,
  } = useAppContext();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRatePlan, setCurrentRatePlan] = useState(null);
  const [modalMode, setModalMode] = useState("create");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filteredRatePlans, setFilteredRatePlans] = useState([]);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [ratePlanToDelete, setRatePlanToDelete] = useState(null);

  // Format currency helper
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount || 0);
  };

  // Handle Add Rate Plan
  const handleAddRatePlan = () => {
    setCurrentRatePlan(null);
    setModalMode("create");
    setIsModalOpen(true);
  };

  // Handle Edit Rate Plan
  const handleEditRatePlan = (ratePlan) => {
    setCurrentRatePlan({ ...ratePlan });
    setModalMode("edit");
    setIsModalOpen(true);
  };

  // Handle Delete Rate Plan
  const handleDeleteRatePlan = (ratePlan) => {
    setRatePlanToDelete(ratePlan);
    setIsConfirmDeleteOpen(true);
  };

  // Confirm Delete Action
  const confirmDelete = async () => {
    if (!ratePlanToDelete) return;

    try {
      await deleteRatePlan(ratePlanToDelete.plan_id);
      toast.success("Rate plan deleted successfully");
    } catch (err) {
      console.error("Error deleting rate plan:", err);
      toast.error("Failed to delete rate plan");
    } finally {
      setIsConfirmDeleteOpen(false);
      setRatePlanToDelete(null);
    }
  };

  // Handle Modal Submit
  const handleModalSubmit = async (formData, mode) => {
    setIsSubmitting(true);
    try {
      if (mode === "create") {
        await createRatePlan(formData);
        toast.success("Rate plan created successfully");
      } else {
        // Only send changed fields for update
        const changedFields = {};
        Object.keys(formData).forEach((key) => {
          if (formData[key] !== currentRatePlan[key]) {
            changedFields[key] = formData[key];
          }
        });

        // Always include plan_id for identification
        changedFields.plan_id = currentRatePlan.plan_id;

        await updateRatePlan(changedFields);
        toast.success("Rate plan updated successfully");
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error(
        `Failed to ${mode === "create" ? "create" : "update"} rate plan`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Search
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Filter rate plans based on search query
  useEffect(() => {
    setFilteredRatePlans(
      searchQuery
        ? ratePlans.filter(
            (plan) =>
              plan.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              plan.description
                ?.toLowerCase()
                .includes(searchQuery.toLowerCase()) ||
              plan.meal_plan?.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : [...ratePlans]
    );
  }, [ratePlans, searchQuery]);

  // Reload rate plans on mount
  useEffect(() => {
    fetchRatePlans();
  }, []);

  return (
    <div className="w-full flex mx-auto container flex-col gap-4 py-4 px-6 bg-white rounded-md">
      {/* Header */}
      <div className="my-2">
        <h1 className="text-3xl font-semibold text-gray-800">Rate Plans</h1>
        <p className="text-sm text-gray-500">
          Manage your rate plans and pricing strategies.
        </p>
      </div>

      {/* Search and Action Bar */}
      <div className="flex justify-between w-full flex-col md:flex-row gap-4 md:gap-2 bg-white">
        <div className="w-full max-w-md border-2 rounded-md px-4 flex items-center justify-center gap-2">
          <input
            type="text"
            placeholder="Search rate plans..."
            className="w-full py-1 text-sm rounded-lg border-0 focus:outline-none"
            value={searchQuery}
            onChange={handleSearchChange}
          />
          <Search className="text-gray-500" size={20} />
        </div>
        <div className="flex flex-row justify-start md:justify-center items-center gap-2">
          <Button
            onClick={handleAddRatePlan}
            className="bg-primary hover:bg-primary/90"
            disabled={loading}
          >
            <Plus size={16} className="mr-1" /> Add Rate Plan
          </Button>
        </div>
      </div>

      {/* Table Section */}
      <div className="w-full bg-white overflow-hidden">
        {loading && !ratePlans.length ? (
          <div className="flex justify-center items-center h-32">
            <p className="text-gray-500">Loading rate plans...</p>
          </div>
        ) : ratePlans.length === 0 ? (
          <div className="flex justify-center items-center h-32">
            <p className="text-gray-500">
              No rate plans found. Create your first rate plan!
            </p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-gray-700 font-semibold">
                    Plan Name
                  </TableHead>
                  <TableHead className="text-gray-700 font-semibold">
                    Description
                  </TableHead>
                  <TableHead className="text-gray-700 font-semibold">
                    Meal Plan
                  </TableHead>
                  <TableHead className="text-gray-700 font-semibold">
                    Base Tariff
                  </TableHead>
                  <TableHead className="text-gray-700 font-semibold">
                    Tariff Variation
                  </TableHead>
                  <TableHead className="text-gray-700 font-semibold text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRatePlans.map((ratePlan, index) => (
                  <TableRow key={ratePlan.plan_id} className="hover:bg-gray-50">
                    <TableCell className="font-medium text-gray-800">
                      {ratePlan.name}
                    </TableCell>
                    <TableCell className="text-gray-600 max-w-xs">
                      <div className="truncate" title={ratePlan.description}>
                        {ratePlan.description}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-blue-50">
                        {ratePlan.meal_plan}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {formatCurrency(ratePlan.base_tariff)}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {formatCurrency(ratePlan.tariff_variation)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          className="p-1 rounded-full hover:bg-blue-100 text-blue-500 transition-colors"
                          onClick={() => handleEditRatePlan(ratePlan)}
                          disabled={loading}
                          title="Edit rate plan"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          className="p-1 rounded-full hover:bg-red-100 text-red-500 transition-colors"
                          onClick={() => handleDeleteRatePlan(ratePlan)}
                          disabled={loading}
                          title="Delete rate plan"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Modals */}
      <RatePlanModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        initialData={currentRatePlan}
        mode={modalMode}
        isSubmitting={isSubmitting}
      />
      <ConfirmDeleteModal
        isOpen={isConfirmDeleteOpen}
        onClose={() => {
          setIsConfirmDeleteOpen(false);
          setRatePlanToDelete(null);
        }}
        onConfirm={confirmDelete}
        ratePlanName={ratePlanToDelete?.name}
      />
    </div>
  );
};

export default RatePlans;
