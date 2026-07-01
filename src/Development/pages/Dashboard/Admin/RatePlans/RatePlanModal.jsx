import React, { useEffect } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
} from "@/Development/components/ui/dialog.js";
import { Button } from "@/Development/components/ui/button.js";
import { Label } from "@/Development/components/ui/label.js";
import { Input } from "@/Development/components/ui/input.js";
import { Textarea } from "@/Development/components/ui/textarea.js";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Development/components/ui/select.tsx";
import { toast } from "sonner";

const RatePlanModal = ({
  isOpen,
  onClose,
  onSubmit,
  mode = "create",
  isSubmitting = false,
  initialData,
}) => {
  const [formData, setFormData] = React.useState(
    mode === "edit" && initialData
      ? initialData
      : {
          name: "",
          description: "",
          meal_plan: "Room Only",
          base_tariff: "",
          tariff_variation: "",
        }
  );

  const mealPlanOptions = [
    "Room Only",
    "Bed & Breakfast",
    "Half Board",
    "Full Board",
    "All Inclusive",
  ];

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? (value === "" ? "" : Number(value)) : value,
    }));
  };

  const handleSelectChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      meal_plan: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation
    if (!formData.name || !formData.name.trim()) {
      toast.error("Rate plan name is required");
      return;
    }

    if (!formData.description || !formData.description.trim()) {
      toast.error("Description is required");
      return;
    }

    if (formData.base_tariff === "") {
      toast.error("Base tariff is required");
      return;
    }

    const baseTariff = Number(formData.base_tariff);
    const tariffVariation = formData.tariff_variation === "" ? 0 : Number(formData.tariff_variation);

    if (baseTariff < 0) {
      toast.error("Base tariff cannot be negative");
      return;
    }

    if (tariffVariation < 0) {
      toast.error("Tariff variation cannot be negative");
      return;
    }

    onSubmit({
      ...formData,
      base_tariff: baseTariff,
      tariff_variation: tariffVariation,
    }, mode);
  };

  const handleOpenChange = (open) => {
    if (!open) {
      setFormData({
        name: "",
        description: "",
        meal_plan: "Room Only",
        base_tariff: "",
        tariff_variation: "",
      });
    }
    if (!isSubmitting) onClose();
  };

  useEffect(() => {
    if (initialData && isOpen) {
      setFormData(initialData);
    }
  }, [initialData, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-md inter">
        <div className="bg-white border-b relative">
          <h2 className="text-xl font-semibold p-5">
            {mode === "create" ? "Add New Rate Plan" : "Edit Rate Plan"}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-sm text-gray-700">
              Rate Plan Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md"
              placeholder="e.g., Summer Special, Corporate Rate"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-sm text-gray-700">
              Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md"
              placeholder="Enter rate plan description"
              rows="3"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="meal_plan" className="text-sm text-gray-700">
              Meal Plan <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.meal_plan}
              onValueChange={handleSelectChange}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select meal plan" />
              </SelectTrigger>
              <SelectContent>
                {mealPlanOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="base_tariff" className="text-sm text-gray-700">
                Base Tariff <span className="text-red-500">*</span>
              </Label>
              <Input
                id="base_tariff"
                name="base_tariff"
                type="number"
                step="0.01"
                value={formData.base_tariff}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md"
                placeholder="0.00"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tariff_variation" className="text-sm text-gray-700">
                Tariff Variation
              </Label>
              <Input
                id="tariff_variation"
                name="tariff_variation"
                type="number"
                step="0.01"
                value={formData.tariff_variation}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md"
                placeholder="0.00"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === "create" ? "Creating..." : "Updating..."}
                </>
              ) : mode === "create" ? (
                "Create Rate Plan"
              ) : (
                "Update Rate Plan"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RatePlanModal;
