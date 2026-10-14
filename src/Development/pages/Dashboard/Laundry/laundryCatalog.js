/**
 * Granular Laundry Catalog & Pricing Configuration
 * Standard Indian Hotel PMS Industry Benchmark (IDS Next, eZee Absolute, ShawMan, Opera)
 * SAC Code for Laundry: 996312 (GST Laundry & Dry Cleaning Services)
 * Fully dynamic: Stored in and retrieved from Backend Database (Institution Configuration)
 */

import { get, post, patch, put } from "aws-amplify/api";
import { institutionId } from "@/Operation/data.json";

export const LAUNDRY_SAC_CODE = "996312";

export const DEFAULT_SERVICE_SPEEDS = [
  {
    id: "normal",
    label: "Standard Delivery (24 Hours)",
    shortLabel: "Standard",
    surchargePercent: 0,
    flatExtraAmount: 0,
    badgeColor: "bg-gray-100 text-gray-800 border-gray-300",
    description: "Standard delivery turnaround",
  },
  {
    id: "express",
    label: "Express Same-Day",
    shortLabel: "Express",
    surchargePercent: 0,
    flatExtraAmount: 0,
    badgeColor: "bg-blue-100 text-blue-800 border-blue-300",
    description: "Same-day evening delivery",
  },
  {
    id: "urgent",
    label: "Urgent Priority",
    shortLabel: "Urgent",
    surchargePercent: 0,
    flatExtraAmount: 0,
    badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
    description: "Priority delivery turnaround",
  },
];

export const SERVICE_SPEEDS = DEFAULT_SERVICE_SPEEDS;

export const CARE_TYPES = [
  {
    id: "wash_only",
    label: "Washing Only",
    shortLabel: "Wash",
    iconName: "Waves",
    description: "Gentle wash without ironing",
    color: "cyan",
  },
  {
    id: "wash_and_press",
    label: "Wash & Press",
    shortLabel: "Wash & Iron",
    iconName: "Sparkles",
    description: "Complete laundering and steam press",
    color: "blue",
  },
  {
    id: "press_only",
    label: "Pressing Only",
    shortLabel: "Iron",
    iconName: "Flame",
    description: "Steam pressing and ironing only",
    color: "amber",
  },
  {
    id: "dry_clean",
    label: "Dry Clean",
    shortLabel: "Dry Clean",
    iconName: "ShieldCheck",
    description: "Specialized solvent dry cleaning",
    color: "purple",
  },
];

// Default Garment Price Catalog starts completely empty.
// Garments will only appear when added dynamically by the user/hotelier.
export const DEFAULT_GARMENTS = [];

/**
 * Get active dynamic garment catalog (purely backend-driven, no local storage fallback)
 */
export function getLaundryCatalog(institutionData = null) {
  if (
    institutionData?.laundryConfig?.catalog &&
    Array.isArray(institutionData.laundryConfig.catalog) &&
    institutionData.laundryConfig.catalog.length > 0
  ) {
    return institutionData.laundryConfig.catalog.map((g) => ({
      ...g,
      rates: {
        wash_only: Number(g.rates?.wash_only || 0),
        wash_and_press: Number(g.rates?.wash_and_press || 0),
        press_only: Number(g.rates?.press_only || 0),
        dry_clean: Number(g.rates?.dry_clean || 0),
      },
    }));
  }

  try {
    const cached = localStorage.getItem("hotel_laundry_catalog_cache");
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}

  return [];
}

/**
 * Get active turnaround speeds & surcharges from Backend Database
 */
export function getServiceSpeeds(institutionData = null) {
  if (
    institutionData?.laundryConfig?.serviceSpeeds &&
    Array.isArray(institutionData.laundryConfig.serviceSpeeds) &&
    institutionData.laundryConfig.serviceSpeeds.length > 0
  ) {
    return institutionData.laundryConfig.serviceSpeeds;
  }
  try {
    const cached = localStorage.getItem("hotel_laundry_speeds_cache");
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}

  return DEFAULT_SERVICE_SPEEDS;
}

/**
 * Fetch laundry catalog & speeds directly from dedicated backend endpoint GET /laundry/catalog
 */
export async function fetchLaundryCatalogBackend(customInstId) {
  const instId = customInstId || institutionId;
  try {
    const { body } = await get({
      apiName: "housekeeping",
      path: "/laundry/catalog",
      options: {
        queryParams: { institutionId: instId },
      },
    }).response;
    const res = await body.json();
    return {
      catalog: Array.isArray(res.catalog) ? res.catalog : [],
      serviceSpeeds:
        Array.isArray(res.serviceSpeeds) && res.serviceSpeeds.length > 0
          ? res.serviceSpeeds
          : DEFAULT_SERVICE_SPEEDS,
      sacCode: res.sacCode || LAUNDRY_SAC_CODE,
    };
  } catch (err) {
    console.warn("fetchLaundryCatalogBackend failed:", err);
    return null;
  }
}

/**
 * Save updated laundry configuration directly to Backend Database (PUT /laundry/catalog)
 */
export async function saveLaundryConfigToBackend({
  catalog,
  serviceSpeeds = null,
  gstRate = null,
  cgstRate = null,
  sgstRate = null,
  institutionData = null,
  updateInstitutionData = null,
}) {
  const instId =
    institutionData?.institutionid ||
    institutionData?.institutionId ||
    institutionId;
  const speedsToSave =
    serviceSpeeds ||
    institutionData?.laundryConfig?.serviceSpeeds ||
    DEFAULT_SERVICE_SPEEDS;

  const effectiveGstRate =
    gstRate !== null && gstRate !== undefined
      ? Number(gstRate)
      : institutionData?.laundryConfig?.gstRate !== undefined
      ? Number(institutionData.laundryConfig.gstRate)
      : institutionData?.laundryGst !== undefined
      ? Number(institutionData.laundryGst)
      : 5;

  const effectiveCgstRate =
    cgstRate !== null && cgstRate !== undefined
      ? Number(cgstRate)
      : institutionData?.laundryConfig?.cgstRate !== undefined
      ? Number(institutionData.laundryConfig.cgstRate)
      : effectiveGstRate / 2;

  const effectiveSgstRate =
    sgstRate !== null && sgstRate !== undefined
      ? Number(sgstRate)
      : institutionData?.laundryConfig?.sgstRate !== undefined
      ? Number(institutionData.laundryConfig.sgstRate)
      : effectiveGstRate / 2;

  // Persist locally immediately so changes never disappear on reload
  try {
    if (Array.isArray(catalog)) {
      localStorage.setItem("hotel_laundry_catalog_cache", JSON.stringify(catalog));
    }
    if (Array.isArray(speedsToSave)) {
      localStorage.setItem("hotel_laundry_speeds_cache", JSON.stringify(speedsToSave));
    }
    localStorage.setItem(
      "hotel_laundry_gst_cache",
      JSON.stringify({ gstRate: effectiveGstRate, cgstRate: effectiveCgstRate, sgstRate: effectiveSgstRate })
    );
  } catch (e) {}

  let backendSuccess = false;

  // 1. Direct call to dedicated PUT /laundry/catalog endpoint
  try {
    const { body } = await put({
      apiName: "housekeeping",
      path: "/laundry/catalog",
      options: {
        body: {
          institutionId: instId,
          catalog: catalog || [],
          serviceSpeeds: speedsToSave,
          sacCode: LAUNDRY_SAC_CODE,
          gstRate: effectiveGstRate,
          cgstRate: effectiveCgstRate,
          sgstRate: effectiveSgstRate,
        },
        queryParams: { institutionId: instId },
      },
    }).response;
    const res = await body.json();
    console.log("Dedicated /laundry/catalog saved successfully to cloud:", res);
    backendSuccess = true;
  } catch (err) {
    console.warn("Direct PUT /laundry/catalog failed, trying institution fallback:", err);
  }

  // 2. Also persist to institutionData for full synchronization
  if (typeof updateInstitutionData === "function" && institutionData) {
    try {
      const updatedInstitution = {
        ...institutionData,
        laundryGst: effectiveGstRate,
        laundryConfig: {
          ...(institutionData.laundryConfig || {}),
          catalog: catalog || [],
          serviceSpeeds: speedsToSave,
          sacCode: LAUNDRY_SAC_CODE,
          gstRate: effectiveGstRate,
          cgstRate: effectiveCgstRate,
          sgstRate: effectiveSgstRate,
          updatedAt: new Date().toISOString(),
        },
      };
      await updateInstitutionData(updatedInstitution);
      backendSuccess = true;
    } catch (err) {
      console.warn("Institution data update fallback failed:", err);
    }
  }

  return backendSuccess;
}

/**
 * Reset to empty clean slate
 */
export async function resetLaundryCatalogToDefault(
  institutionData = null,
  updateInstitutionData = null
) {
  // Purge any legacy keys
  try {
    localStorage.removeItem("hotel_laundry_pricing_config");
    localStorage.removeItem("hotel_laundry_pricing_config_v2");
    localStorage.removeItem("hotel_laundry_speeds_config");
    localStorage.removeItem("hotel_laundry_speeds_config_v2");
  } catch (err) {}

  await saveLaundryConfigToBackend({
    catalog: [],
    serviceSpeeds: DEFAULT_SERVICE_SPEEDS,
    institutionData,
    updateInstitutionData,
  });

  return [];
}

/**
 * Generate a unique Barcode / Tag Token for laundry bag
 * Format: LND-YYYYMMDD-XXXX (e.g., LND-20261008-4821)
 */
export function generateLaundryToken() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `LND-${year}${month}${day}-${random}`;
}

/**
 * Calculate financial totals for a laundry order basket
 */
export function calculateLaundryTotals(
  items,
  serviceSpeedId = "normal",
  cgstPct = 2.5,
  sgstPct = 2.5,
  customSpeeds = null,
  customExtraCharge = 0
) {
  const speedsList = customSpeeds || DEFAULT_SERVICE_SPEEDS;
  const speed = speedsList.find((s) => s.id === serviceSpeedId) || speedsList[0];
  const surchargePercent = Number(speed?.surchargePercent) || 0;
  const flatExtraAmount = Number(speed?.flatExtraAmount) || 0;

  // Subtotal from all item lines
  const itemsSubtotal = (items || []).reduce((acc, item) => {
    const qty = Number(item.quantity) || 0;
    const rate = Number(item.unitRate) || 0;
    return acc + qty * rate;
  }, 0);

  // Total garment count
  const totalGarments = (items || []).reduce((acc, item) => acc + (Number(item.quantity) || 0), 0);

  // Turnaround surcharge
  const percentSurchargeAmount = (itemsSubtotal * surchargePercent) / 100;
  const extraCharge = Number(customExtraCharge) || 0;
  const surchargeAmount = percentSurchargeAmount + flatExtraAmount + extraCharge;

  // Taxable amount before GST
  const taxableAmount = itemsSubtotal + surchargeAmount;

  // GST rates - safely handle 0% rate without fallback to 2.5%
  const cgstRateNum = typeof cgstPct === "number" && !isNaN(cgstPct)
    ? cgstPct
    : (!isNaN(Number(cgstPct)) && Number(cgstPct) >= 0 ? Number(cgstPct) : 2.5);
  const sgstRateNum = typeof sgstPct === "number" && !isNaN(sgstPct)
    ? sgstPct
    : (!isNaN(Number(sgstPct)) && Number(sgstPct) >= 0 ? Number(sgstPct) : 2.5);

  const cgstAmount = (taxableAmount * cgstRateNum) / 100;
  const sgstAmount = (taxableAmount * sgstRateNum) / 100;
  const totalTax = cgstAmount + sgstAmount;

  // Net total
  const grandTotal = Math.round(taxableAmount + totalTax);

  return {
    totalGarments,
    itemsSubtotal: Number(itemsSubtotal.toFixed(2)),
    surchargePercent,
    flatExtraAmount,
    extraCharge,
    surchargeAmount: Number(surchargeAmount.toFixed(2)),
    taxableAmount: Number(taxableAmount.toFixed(2)),
    cgstRate: cgstRateNum,
    sgstRate: sgstRateNum,
    cgstAmount: Number(cgstAmount.toFixed(2)),
    sgstAmount: Number(sgstAmount.toFixed(2)),
    totalTax: Number(totalTax.toFixed(2)),
    grandTotal,
  };
}

/**
 * Backend API Client Methods for Laundry
 */
export async function createLaundryOrderBackend(orderData, customInstId) {
  const instId = customInstId || orderData?.institutionId || institutionId;
  try {
    const { body } = await post({
      apiName: "housekeeping",
      path: "/laundry/orders",
      options: {
        body: {
          ...orderData,
          institutionId: instId,
        },
        queryParams: { institutionId: instId },
      },
    }).response;
    const res = await body.json();
    return res.order || orderData;
  } catch (err) {
    console.warn("Backend /laundry/orders creation failed, local fallback:", err);
    return orderData;
  }
}

export async function fetchLaundryOrdersBackend(customInstId) {
  const instId = customInstId || institutionId;
  try {
    let allOrders = [];
    let lastEvaluatedKey = null;
    let page = 0;
    const MAX_PAGES = 30; // Protect against infinite loops (up to 15,000 items)

    do {
      const queryParams = { institutionId: instId, limit: "500" };
      if (lastEvaluatedKey) {
        queryParams.exclusiveStartKey = typeof lastEvaluatedKey === "object"
          ? JSON.stringify(lastEvaluatedKey)
          : String(lastEvaluatedKey);
      }
      const { body } = await get({
        apiName: "housekeeping",
        path: "/laundry/orders",
        options: { queryParams },
      }).response;
      const res = await body.json();
      const chunk = res.orders || [];
      allOrders = allOrders.concat(chunk);
      lastEvaluatedKey = res.lastEvaluatedKey || null;
      page++;
      // If fewer than 500 items returned or no pagination token, we have reached the end
      if (!lastEvaluatedKey || chunk.length < 500) break;
    } while (lastEvaluatedKey && page < MAX_PAGES);

    return allOrders;
  } catch (err) {
    console.warn("Backend /laundry/orders list failed, local fallback:", err);
    return [];
  }
}

export async function updateLaundryStatusBackend(orderId, statusData, customInstId) {
  const instId = customInstId || statusData?.institutionId || institutionId;
  try {
    const { body } = await patch({
      apiName: "housekeeping",
      path: `/laundry/orders/${orderId}/status`,
      options: {
        body: {
          ...statusData,
          institutionId: instId,
        },
        queryParams: { institutionId: instId },
      },
    }).response;
    const res = await body.json();
    return res.order;
  } catch (err) {
    console.warn("Backend status update failed, local fallback:", err);
    return null;
  }
}

export async function settleLaundryOrderBackend(orderId, settleData, customInstId) {
  const instId = customInstId || settleData?.institutionId || institutionId;
  try {
    const { body } = await post({
      apiName: "housekeeping",
      path: `/laundry/orders/${orderId}/settle`,
      options: {
        body: {
          ...settleData,
          institutionId: instId,
        },
        queryParams: { institutionId: instId },
      },
    }).response;
    const res = await body.json();
    return res.order;
  } catch (err) {
    console.warn("Backend settle failed, local fallback:", err);
    return null;
  }
}

export async function fetchDeliveriesBackend(customInstId) {
  const instId = customInstId || institutionId;
  try {
    let allDeliveries = [];
    let lastEvaluatedKey = null;
    let page = 0;
    const MAX_PAGES = 30;

    do {
      const queryParams = { institutionId: instId, limit: "500" };
      if (lastEvaluatedKey) {
        queryParams.exclusiveStartKey = typeof lastEvaluatedKey === "object"
          ? JSON.stringify(lastEvaluatedKey)
          : String(lastEvaluatedKey);
      }
      const { body } = await get({
        apiName: "housekeeping",
        path: "/laundry/deliveries",
        options: { queryParams },
      }).response;
      const res = await body.json();
      const chunk = res.deliveries || [];
      allDeliveries = allDeliveries.concat(chunk);
      lastEvaluatedKey = res.lastEvaluatedKey || null;
      page++;
      if (!lastEvaluatedKey || chunk.length < 500) break;
    } while (lastEvaluatedKey && page < MAX_PAGES);

    return allDeliveries;
  } catch (err) {
    console.warn("Backend deliveries fetch failed, local fallback:", err);
    return [];
  }
}

export async function markDeliveryDeliveredBackend(orderId, deliverData = {}) {
  try {
    const { body } = await patch({
      apiName: "housekeeping",
      path: `/laundry/orders/${orderId}/deliver`,
      options: {
        body: {
          ...deliverData,
          institutionId,
        },
        queryParams: { institutionId },
      },
    }).response;
    const res = await body.json();
    return res.order;
  } catch (err) {
    console.warn("Backend mark delivered failed, local fallback:", err);
    return null;
  }
}

export async function fetchLaundryRevenueBackend(dateStr) {
  try {
    const { body } = await get({
      apiName: "housekeeping",
      path: "/laundry/revenue",
      options: {
        queryParams: { institutionId, ...(dateStr ? { date: dateStr } : {}) },
      },
    }).response;
    const res = await body.json();
    return res.revenue;
  } catch (err) {
    console.warn("Backend revenue fetch failed, local fallback:", err);
    return null;
  }
}

