import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card.js";
import { Button } from "../../components/ui/button.js";
import { Input } from "../../components/ui/input.js";
import { Label } from "../../components/ui/label.js";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select.js";
import { Separator } from "../../components/ui/separator.js";
import { Badge } from "../../components/ui/badge.js";
import {
  Settings as SettingsIcon,
  Save,
  RotateCcw,
  DollarSign,
  Percent,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useAppContext } from "../../context/AppContext.jsx";
import { useInstitutionContext } from "../../context/InstitutionContext.jsx";
import { se } from "date-fns/locale/se";

const Settings = () => {
  // State for tax settings
  const { institutionData, setInstitutionData, updateInstitutionData } =
    useInstitutionContext();
  const [taxSettings, setTaxSettings] = useState({
    taxType: institutionData?.taxType || "GST",
    taxPercent: institutionData?.taxPercent || "18",
    taxNumber: institutionData?.taxNumber || "",
  });

  // State for form validation and loading
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  // Initial settings (could be fetched from API)
  const [initialSettings, setInitialSettings] = useState({
    taxType: institutionData?.taxType || "GST",
    taxPercent: institutionData?.taxPercent || "18",
    taxNumber: institutionData?.taxNumber || "",
  });

  // Available tax types
  const taxTypes = [
    { value: "GST", label: "GST (Goods and Services Tax)" },
    { value: "VAT", label: "VAT (Value Added Tax)" },
    { value: "ST", label: "ST (Service Tax)" },
    { value: "CGST", label: "CGST (Central GST)" },
    { value: "SGST", label: "SGST (State GST)" },
    { value: "IGST", label: "IGST (Integrated GST)" },
    { value: "CUSTOM", label: "Custom Tax" },
  ];

  // Load initial settings (simulate API call)
  useEffect(() => {
    const loadSettings = async () => {
      // In a real app, this would be an API call
      // const settings = await fetchTaxSettings();

      // For now, using localStorage or default values
      const savedSettings = localStorage.getItem("hotelTaxSettings");
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setTaxSettings(parsed);
        setInitialSettings(parsed);
      }
    };

    loadSettings();
  }, []);
  // Check for changes
  useEffect(() => {
    const changed =
      taxSettings.taxType !== initialSettings.taxType ||
      taxSettings.taxPercent !== initialSettings.taxPercent ||
      taxSettings.taxNumber !== initialSettings.taxNumber;
    setHasChanges(changed);
  }, [taxSettings, initialSettings]);
  // Validation function
  const validateSettings = () => {
    const newErrors = {};

    if (!taxSettings.taxType) {
      newErrors.taxType = "Tax type is required";
    }

    if (!taxSettings.taxPercent) {
      newErrors.taxPercent = "Tax percentage is required";
    } else {
      const percent = parseFloat(taxSettings.taxPercent);
      if (isNaN(percent)) {
        newErrors.taxPercent = "Tax percentage must be a valid number";
      } else if (percent < 0) {
        newErrors.taxPercent = "Tax percentage cannot be negative";
      } else if (percent > 100) {
        newErrors.taxPercent = "Tax percentage cannot exceed 100%";
      }
    }

    if (!taxSettings.taxNumber.trim()) {
      newErrors.taxNumber = "Tax number is required";
    } else {
      // Basic validation for tax number format
      const taxNumber = taxSettings.taxNumber.trim();
      if (
        taxSettings.taxType === "GST" ||
        taxSettings.taxType === "CGST" ||
        taxSettings.taxType === "SGST" ||
        taxSettings.taxType === "IGST"
      ) {
        // GST number format: 15 characters (2 state code + 10 PAN + 1 entity number + 1 default + 1 check digit)
        if (
          !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(
            taxNumber
          )
        ) {
          newErrors.taxNumber = "Invalid GST number format";
        }
      } else if (taxSettings.taxType === "VAT") {
        // VAT number validation (basic length check)
        if (taxNumber.length < 8 || taxNumber.length > 15) {
          newErrors.taxNumber = "VAT number should be 8-15 characters";
        }
      } else {
        // Generic validation for other tax types
        if (taxNumber.length < 5) {
          newErrors.taxNumber = "Tax number should be at least 5 characters";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input changes
  const handleTaxTypeChange = (value) => {
    setTaxSettings((prev) => ({ ...prev, taxType: value }));
    if (errors.taxType) {
      setErrors((prev) => ({ ...prev, taxType: "" }));
    }
    setInstitutionData((prev) => ({
      ...prev,
      taxType: value,
    }));
  };
  const handleTaxPercentChange = (e) => {
    const value = e.target.value;
    setTaxSettings((prev) => ({ ...prev, taxPercent: value }));
    if (errors.taxPercent) {
      setErrors((prev) => ({ ...prev, taxPercent: "" }));
    }
    setInstitutionData((prev) => ({
      ...prev,
      taxPercent: value,
    }));
  };

  const handleTaxNumberChange = (e) => {
    const value = e.target.value.toUpperCase(); // Convert to uppercase for consistency
    setTaxSettings((prev) => ({ ...prev, taxNumber: value }));
    if (errors.taxNumber) {
      setErrors((prev) => ({ ...prev, taxNumber: "" }));
    }
    setInstitutionData((prev) => ({
      ...prev,
      taxNumber: value,
    }));
  };

  // Save settings
  const handleSave = async () => {
    if (!validateSettings()) {
      toast.error("Please fix the validation errors");
      return;
    }

    setIsLoading(true);
    try {
      console.log("Institution data updated:", institutionData);

      await updateInstitutionData();

      // For now, save to localStorage
      localStorage.setItem("hotelTaxSettings", JSON.stringify(taxSettings));

      setInitialSettings(taxSettings);
      toast.success("Tax settings saved successfully!");
    } catch (error) {
      toast.error("Failed to save settings. Please try again.");
      console.error("Error saving settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset to initial values
  const handleReset = () => {
    setTaxSettings(initialSettings);
    setErrors({});
    toast.info("Settings reset to last saved values");
  };

  // Get tax type display name
  const getTaxTypeLabel = (value) => {
    const taxType = taxTypes.find((type) => type.value === value);
    return taxType ? taxType.label : value;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <SettingsIcon className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          </div>
          <p className="text-gray-600">
            Manage your hotel's tax configuration and other settings
          </p>
        </div>

        {/* Main Settings Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Tax Settings
            </CardTitle>
            <p className="text-sm text-gray-600">
              Configure the tax type and percentage that will be applied to all
              bookings and services
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Current Settings Display */}
            {!hasChanges && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">
                    Current Settings
                  </span>
                </div>{" "}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-blue-600">Tax Type:</span>
                    <Badge variant="outline" className="ml-2">
                      {getTaxTypeLabel(taxSettings.taxType)}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-blue-600">Tax Rate:</span>
                    <Badge variant="outline" className="ml-2">
                      {taxSettings.taxPercent}%
                    </Badge>
                  </div>
                  <div>
                    <span className="text-blue-600">Tax Number:</span>
                    <Badge variant="outline" className="ml-2">
                      {taxSettings.taxNumber || "Not set"}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
            {/* Unsaved Changes Warning */}
            {hasChanges && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-medium text-amber-800">
                    You have unsaved changes
                  </span>
                </div>
              </div>
            )}
            <Separator />
            {/* Tax Type Selection */}
            <div className="space-y-2">
              <Label
                htmlFor="taxType"
                className="text-sm font-medium text-gray-700"
              >
                Tax Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={taxSettings.taxType}
                onValueChange={handleTaxTypeChange}
              >
                <SelectTrigger
                  className={errors.taxType ? "border-red-500" : ""}
                >
                  <SelectValue placeholder="Select tax type" />
                </SelectTrigger>
                <SelectContent>
                  {taxTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.taxType && (
                <p className="text-red-500 text-sm mt-1">{errors.taxType}</p>
              )}
              <p className="text-xs text-gray-500">
                Select the type of tax applicable in your region
              </p>
            </div>{" "}
            {/* Tax Percentage Input */}
            <div className="space-y-2">
              <Label
                htmlFor="taxPercent"
                className="text-sm font-medium text-gray-700"
              >
                Tax Percentage <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="taxPercent"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="Enter tax percentage"
                  value={taxSettings.taxPercent}
                  onChange={handleTaxPercentChange}
                  className={`pr-8 ${
                    errors.taxPercent ? "border-red-500" : ""
                  }`}
                />
                <Percent className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              </div>
              {errors.taxPercent && (
                <p className="text-red-500 text-sm mt-1">{errors.taxPercent}</p>
              )}
              <p className="text-xs text-gray-500">
                Enter the tax percentage (0-100). Example: 18 for 18% tax
              </p>
            </div>
            {/* Tax Number Input */}
            <div className="space-y-2">
              <Label
                htmlFor="taxNumber"
                className="text-sm font-medium text-gray-700"
              >
                Tax Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="taxNumber"
                type="text"
                placeholder={`Enter ${taxSettings.taxType} number`}
                value={taxSettings.taxNumber}
                onChange={handleTaxNumberChange}
                className={errors.taxNumber ? "border-red-500" : ""}
              />
              {errors.taxNumber && (
                <p className="text-red-500 text-sm mt-1">{errors.taxNumber}</p>
              )}
              <p className="text-xs text-gray-500">
                {taxSettings.taxType === "GST" ||
                taxSettings.taxType === "CGST" ||
                taxSettings.taxType === "SGST" ||
                taxSettings.taxType === "IGST"
                  ? "Enter 15-digit GST number (e.g., 22AAAAA0000A1Z5)"
                  : `Enter your ${taxSettings.taxType} registration number`}
              </p>
            </div>
            {/* Preview Calculation */}
            <div className="bg-gray-50 border rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">
                Tax Calculation Preview
              </h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Base Amount:</span>
                  <span className="font-medium">₹1,000.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {getTaxTypeLabel(taxSettings.taxType)} (
                    {taxSettings.taxPercent || 0}%):
                  </span>
                  <span className="font-medium">
                    ₹
                    {((parseFloat(taxSettings.taxPercent) || 0) * 10).toFixed(
                      2
                    )}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>Total Amount:</span>
                  <span>
                    ₹
                    {(
                      1000 +
                      (parseFloat(taxSettings.taxPercent) || 0) * 10
                    ).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSave}
                disabled={isLoading || !hasChanges}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Save Settings
                  </div>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={handleReset}
                disabled={isLoading || !hasChanges}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Additional Settings (Future Expansion) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              Additional Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <SettingsIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>More configuration options coming soon...</p>
              <p className="text-sm">
                Currency settings, notification preferences, and more
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
