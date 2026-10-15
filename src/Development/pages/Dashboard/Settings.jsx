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
  Building,
  Mail,
  Phone,
  MapPin,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { useInstitutionContext } from "../../context/InstitutionContext.jsx";
import { useAuthContext } from "../../context/AuthContext.jsx";

const Settings = () => {
  const { institutionData, setInstitutionData, updateInstitutionData } =
    useInstitutionContext();
  const { userData } = useAuthContext();

  // Check admin permission
  const isAdmin =
    userData?.userType === "admin" ||
    (Array.isArray(userData?.userTypes) && userData.userTypes.includes("admin"));

  // Form State using the exact attributes expected by the Bill
  const [formSettings, setFormSettings] = useState({
    companyName: "",
    email: "",
    phone: "",
    address: "",
    taxType: "GST",
    taxPercent: "18",
    taxNumber: "",
  });

  const [initialSettings, setInitialSettings] = useState({
    companyName: "",
    email: "",
    phone: "",
    address: "",
    taxType: "GST",
    taxPercent: "18",
    taxNumber: "",
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

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

  // Initialize directly from institutionData using the exact attributes that Bill reads
  useEffect(() => {
    if (institutionData) {
      const current = {
        companyName: institutionData.companyName || "",
        email: institutionData.contactDetails?.email || "",
        phone: institutionData.contactDetails?.phone || "",
        address: institutionData.contactDetails?.address || "",
        taxType: institutionData.taxType || "GST",
        taxPercent:
          institutionData.taxPercent !== undefined && institutionData.taxPercent !== null
            ? String(institutionData.taxPercent)
            : "18",
        taxNumber: institutionData.taxNumber || "",
      };

      setFormSettings(current);
      setInitialSettings(current);
    }
  }, [institutionData]);

  // Check for changes
  useEffect(() => {
    const changed =
      formSettings.companyName !== initialSettings.companyName ||
      formSettings.email !== initialSettings.email ||
      formSettings.phone !== initialSettings.phone ||
      formSettings.address !== initialSettings.address ||
      formSettings.taxType !== initialSettings.taxType ||
      formSettings.taxPercent !== initialSettings.taxPercent ||
      formSettings.taxNumber !== initialSettings.taxNumber;
    setHasChanges(changed);
  }, [formSettings, initialSettings]);

  // Validation
  const validateSettings = () => {
    const newErrors = {};

    if (!formSettings.companyName.trim()) {
      newErrors.companyName = "Hotel / Company name is required";
    }

    if (
      formSettings.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formSettings.email.trim())
    ) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formSettings.phone.trim()) {
      newErrors.phone = "Phone / Contact number is required";
    }

    if (!formSettings.address.trim()) {
      newErrors.address = "Address is required";
    }

    if (!formSettings.taxType) {
      newErrors.taxType = "Tax type is required";
    }

    if (!formSettings.taxPercent) {
      newErrors.taxPercent = "Tax percentage is required";
    } else {
      const percent = parseFloat(formSettings.taxPercent);
      if (isNaN(percent)) {
        newErrors.taxPercent = "Tax percentage must be a valid number";
      } else if (percent < 0) {
        newErrors.taxPercent = "Tax percentage cannot be negative";
      } else if (percent > 100) {
        newErrors.taxPercent = "Tax percentage cannot exceed 100%";
      }
    }

    if (!formSettings.taxNumber.trim()) {
      newErrors.taxNumber = "Tax / GSTIN number is required";
    } else {
      const taxNum = formSettings.taxNumber.trim();
      if (
        formSettings.taxType === "GST" ||
        formSettings.taxType === "CGST" ||
        formSettings.taxType === "SGST" ||
        formSettings.taxType === "IGST"
      ) {
        if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(taxNum)) {
          newErrors.taxNumber = "Invalid GST number format (15 characters, e.g. 22AAAAA0000A1Z5)";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFieldChange = (field, value) => {
    setFormSettings((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // Save directly to the exact attributes that Bill reads
  const handleSave = async () => {
    if (!isAdmin) {
      toast.error("Only administrators can modify hotel settings.");
      return;
    }

    if (!validateSettings()) {
      toast.error("Please fix the validation errors");
      return;
    }

    setIsLoading(true);
    try {
      const trimmedTaxNumber = formSettings.taxNumber.trim().toUpperCase();

      // Put data into the exact attributes that Bill reads:
      // companyName, contactDetails.address, contactDetails.phone, contactDetails.email, taxNumber
      const updatedData = {
        ...(institutionData || {}),
        companyName: formSettings.companyName.trim(),
        contactDetails: {
          ...(institutionData?.contactDetails || {}),
          address: formSettings.address.trim(),
          phone: formSettings.phone.trim(),
          email: formSettings.email.trim(),
        },
        taxNumber: trimmedTaxNumber,
        taxType: formSettings.taxType,
        taxPercent: formSettings.taxPercent,
      };

      setInstitutionData(updatedData);
      await updateInstitutionData(updatedData);

      setInitialSettings({
        ...formSettings,
        taxNumber: trimmedTaxNumber,
      });
      setHasChanges(false);
      toast.success("Settings saved successfully!");
    } catch (error) {
      toast.error("Failed to save settings. Please try again.");
      console.error("Error saving settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFormSettings(initialSettings);
    setErrors({});
    toast.info("Settings reset to last saved values");
  };

  const getTaxTypeLabel = (value) => {
    const taxType = taxTypes.find((type) => type.value === value);
    return taxType ? taxType.label : value;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <SettingsIcon className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            </div>
            <p className="text-gray-600 text-sm">
              Manage hotel profile, contact details, GST and billing tax configuration
            </p>
          </div>

          <div>
            {isAdmin ? (
              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 flex items-center gap-1.5 py-1 px-3">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Administrator Mode
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 flex items-center gap-1.5 py-1 px-3">
                <ShieldAlert className="h-4 w-4 text-amber-600" />
                Read-Only Mode
              </Badge>
            )}
          </div>
        </div>

        {/* Read-only warning for non-admins */}
        {!isAdmin && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-4 mb-6 flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Administrator Access Required</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Only users with the <strong>Admin</strong> role can modify company details, contact information, and GST configuration.
              </p>
            </div>
          </div>
        )}

        {/* Unsaved changes notice */}
        {hasChanges && isAdmin && (
          <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-900">
                You have unsaved changes. Click "Save Settings" below to apply.
              </span>
            </div>
          </div>
        )}

        {/* Hotel Profile Card */}
        <Card className="mb-6 shadow-sm border border-gray-200">
          <CardHeader className="bg-white border-b border-gray-100">
            <CardTitle className="flex items-center gap-2 text-lg text-gray-800">
              <Building className="h-5 w-5 text-blue-600" />
              Hotel Profile & Contact Details
            </CardTitle>
            <p className="text-sm text-gray-500">
              These details are retrieved directly by guest bills and invoices.
            </p>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {/* Hotel Name */}
            <div className="space-y-1.5">
              <Label htmlFor="companyName" className="text-sm font-medium text-gray-700">
                Hotel / Company Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="companyName"
                type="text"
                disabled={!isAdmin}
                placeholder="e.g. Hotel Sunshine"
                value={formSettings.companyName}
                onChange={(e) => handleFieldChange("companyName", e.target.value)}
                className={errors.companyName ? "border-red-500" : ""}
              />
              {errors.companyName && (
                <p className="text-red-500 text-xs">{errors.companyName}</p>
              )}
            </div>

            {/* Email and Phone Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-gray-500" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  disabled={!isAdmin}
                  placeholder="contact@hotel.com"
                  value={formSettings.email}
                  onChange={(e) => handleFieldChange("email", e.target.value)}
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && (
                  <p className="text-red-500 text-xs">{errors.email}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-gray-500" />
                  Phone Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  type="text"
                  disabled={!isAdmin}
                  placeholder="+91 9876543210"
                  value={formSettings.phone}
                  onChange={(e) => handleFieldChange("phone", e.target.value)}
                  className={errors.phone ? "border-red-500" : ""}
                />
                {errors.phone && (
                  <p className="text-red-500 text-xs">{errors.phone}</p>
                )}
              </div>
            </div>

            {/* Address */}
            <div className="space-y-1.5">
              <Label htmlFor="address" className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-gray-500" />
                Hotel Address <span className="text-red-500">*</span>
              </Label>
              <Input
                id="address"
                type="text"
                disabled={!isAdmin}
                placeholder="123 Luxury Road, City, State - 302001"
                value={formSettings.address}
                onChange={(e) => handleFieldChange("address", e.target.value)}
                className={errors.address ? "border-red-500" : ""}
              />
              {errors.address && (
                <p className="text-red-500 text-xs">{errors.address}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tax & GST Settings Card */}
        <Card className="mb-6 shadow-sm border border-gray-200">
          <CardHeader className="bg-white border-b border-gray-100">
            <CardTitle className="flex items-center gap-2 text-lg text-gray-800">
              <DollarSign className="h-5 w-5 text-blue-600" />
              Tax & GST Configuration
            </CardTitle>
            <p className="text-sm text-gray-500">
              Configure the tax rate and GSTIN applied to bills and checkouts.
            </p>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {/* Active Display */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  Active Bill Configuration
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-blue-700 font-medium">Tax Type:</span>
                  <Badge variant="outline" className="ml-2 bg-white">
                    {getTaxTypeLabel(formSettings.taxType)}
                  </Badge>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Tax Rate:</span>
                  <Badge variant="outline" className="ml-2 bg-white">
                    {formSettings.taxPercent}%
                  </Badge>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">GSTIN:</span>
                  <Badge variant="outline" className="ml-2 bg-white font-mono">
                    {formSettings.taxNumber || "Not set"}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator />

            {/* Tax Type */}
            <div className="space-y-1.5">
              <Label htmlFor="taxType" className="text-sm font-medium text-gray-700">
                Tax Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formSettings.taxType}
                onValueChange={(val) => handleFieldChange("taxType", val)}
                disabled={!isAdmin}
              >
                <SelectTrigger className={errors.taxType ? "border-red-500" : ""}>
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
                <p className="text-red-500 text-xs">{errors.taxType}</p>
              )}
            </div>

            {/* Tax Percentage */}
            <div className="space-y-1.5">
              <Label htmlFor="taxPercent" className="text-sm font-medium text-gray-700">
                Tax Percentage (%) <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="taxPercent"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  disabled={!isAdmin}
                  placeholder="18"
                  value={formSettings.taxPercent}
                  onChange={(e) => handleFieldChange("taxPercent", e.target.value)}
                  className={`pr-8 ${errors.taxPercent ? "border-red-500" : ""}`}
                />
                <Percent className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              </div>
              {errors.taxPercent && (
                <p className="text-red-500 text-xs">{errors.taxPercent}</p>
              )}
            </div>

            {/* Tax Number / GSTIN */}
            <div className="space-y-1.5">
              <Label htmlFor="taxNumber" className="text-sm font-medium text-gray-700">
                Tax Number / GSTIN <span className="text-red-500">*</span>
              </Label>
              <Input
                id="taxNumber"
                type="text"
                disabled={!isAdmin}
                placeholder={`Enter ${formSettings.taxType} number (e.g. 22AAAAA0000A1Z5)`}
                value={formSettings.taxNumber}
                onChange={(e) =>
                  handleFieldChange("taxNumber", e.target.value.toUpperCase())
                }
                className={`font-mono ${errors.taxNumber ? "border-red-500" : ""}`}
              />
              {errors.taxNumber && (
                <p className="text-red-500 text-xs">{errors.taxNumber}</p>
              )}
            </div>

            {/* Preview */}
            <div className="bg-gray-50 border rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2 text-sm">
                Tax Calculation Preview
              </h4>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Sample Base Amount:</span>
                  <span className="font-medium">₹1,000.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {getTaxTypeLabel(formSettings.taxType)} (
                    {formSettings.taxPercent || 0}%):
                  </span>
                  <span className="font-medium">
                    ₹
                    {(
                      ((parseFloat(formSettings.taxPercent) || 0) * 1000) /
                      100
                    ).toFixed(2)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-gray-900">
                  <span>Sample Total Amount:</span>
                  <span>
                    ₹
                    {(
                      1000 +
                      ((parseFloat(formSettings.taxPercent) || 0) * 1000) / 100
                    ).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {isAdmin && (
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <Button
                  onClick={handleSave}
                  disabled={isLoading || !hasChanges}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
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
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
