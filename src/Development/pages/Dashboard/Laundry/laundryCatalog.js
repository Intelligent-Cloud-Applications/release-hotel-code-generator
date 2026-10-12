/**
 * Granular Laundry Catalog & Pricing Configuration
 * Standard Indian Hotel PMS Industry Benchmark (IDS Next, eZee Absolute, ShawMan, Opera)
 * SAC Code for Laundry: 996312 (GST Laundry & Dry Cleaning Services)
 * Fully dynamic: Stored in and retrieved from Backend Database (Institution Configuration)
 */

import { get, post, patch } from "aws-amplify/api";
import { institutionId } from "@/Operation/data.json";

export const LAUNDRY_SAC_CODE = "996312";

export const DEFAULT_SERVICE_SPEEDS = [
  {
    id: "normal",
    label: "Standard (24 Hours)",
    shortLabel: "Normal (24h)",
    surchargePercent: 0,
    badgeColor: "bg-gray-100 text-gray-800 border-gray-300",
    description: "Delivered within 24 hours (No extra charge)",
  },
  {
    id: "express",
    label: "Express Same-Day (6-8 Hours)",
    shortLabel: "Express (+50%)",
    surchargePercent: 50,
    badgeColor: "bg-blue-100 text-blue-800 border-blue-300",
    description: "Same day evening delivery (+50% surcharge)",
  },
  {
    id: "urgent",
    label: "Urgent Express Plus (2-4 Hours)",
    shortLabel: "Urgent (+100%)",
    surchargePercent: 100,
    badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
    description: "Priority 2-4 hours delivery (+100% surcharge)",
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

// Default Indian Hotel Garment Price Catalog (All prices in INR ₹)
export const DEFAULT_GARMENTS = [
  // --- MEN'S WEAR ---
  {
    id: "men_shirt",
    name: "Shirt (Formal / Casual)",
    category: "Men",
    rates: { wash_and_press: 70, press_only: 35, dry_clean: 150 },
  },
  {
    id: "men_tshirt",
    name: "T-Shirt / Polo",
    category: "Men",
    rates: { wash_and_press: 60, press_only: 30, dry_clean: 120 },
  },
  {
    id: "men_trouser",
    name: "Trouser / Jeans / Chinos",
    category: "Men",
    rates: { wash_and_press: 80, press_only: 40, dry_clean: 160 },
  },
  {
    id: "men_kurta",
    name: "Kurta (Gents)",
    category: "Men",
    rates: { wash_and_press: 90, press_only: 45, dry_clean: 180 },
  },
  {
    id: "men_pyjama",
    name: "Pyjama / Dhoti / Lungi",
    category: "Men",
    rates: { wash_and_press: 60, press_only: 30, dry_clean: 120 },
  },
  {
    id: "men_suit_2pc",
    name: "Suit (2-Piece: Coat & Trouser)",
    category: "Men",
    rates: { wash_and_press: 350, press_only: 130, dry_clean: 350 },
  },
  {
    id: "men_suit_3pc",
    name: "Suit (3-Piece: Coat, Vest & Trouser)",
    category: "Men",
    rates: { wash_and_press: 450, press_only: 170, dry_clean: 450 },
  },
  {
    id: "men_blazer",
    name: "Blazer / Coat / Jacket",
    category: "Men",
    rates: { wash_and_press: 250, press_only: 100, dry_clean: 250 },
  },
  {
    id: "men_safari",
    name: "Safari Suit",
    category: "Men",
    rates: { wash_and_press: 140, press_only: 70, dry_clean: 280 },
  },
  {
    id: "men_undergarment",
    name: "Undergarments (Vest / Brief)",
    category: "Men",
    rates: { wash_and_press: 35, press_only: 20, dry_clean: 60 },
  },
  {
    id: "men_socks",
    name: "Socks (Pair)",
    category: "Men",
    rates: { wash_and_press: 25, press_only: 15, dry_clean: 50 },
  },
  {
    id: "men_handkerchief",
    name: "Handkerchief",
    category: "Men",
    rates: { wash_and_press: 15, press_only: 10, dry_clean: 30 },
  },

  // --- WOMEN'S WEAR ---
  {
    id: "women_saree_cotton",
    name: "Saree (Cotton / Synthetic)",
    category: "Women",
    rates: { wash_and_press: 120, press_only: 60, dry_clean: 220 },
  },
  {
    id: "women_saree_silk",
    name: "Saree (Silk / Heavy / Zari)",
    category: "Women",
    rates: { wash_and_press: 250, press_only: 100, dry_clean: 350 },
  },
  {
    id: "women_blouse",
    name: "Blouse",
    category: "Women",
    rates: { wash_and_press: 45, press_only: 25, dry_clean: 90 },
  },
  {
    id: "women_salwar_suit",
    name: "Salwar Kameez / Punjabi Suit (3 Pc)",
    category: "Women",
    rates: { wash_and_press: 130, press_only: 65, dry_clean: 240 },
  },
  {
    id: "women_kurti",
    name: "Kurti / Tunic",
    category: "Women",
    rates: { wash_and_press: 70, press_only: 35, dry_clean: 140 },
  },
  {
    id: "women_leggings",
    name: "Leggings / Churidar / Salwar",
    category: "Women",
    rates: { wash_and_press: 50, press_only: 25, dry_clean: 100 },
  },
  {
    id: "women_dress",
    name: "Dress / Evening Gown",
    category: "Women",
    rates: { wash_and_press: 150, press_only: 75, dry_clean: 300 },
  },
  {
    id: "women_skirt",
    name: "Skirt",
    category: "Women",
    rates: { wash_and_press: 70, press_only: 35, dry_clean: 140 },
  },
  {
    id: "women_dupatta",
    name: "Dupatta / Scarf / Stole",
    category: "Women",
    rates: { wash_and_press: 40, press_only: 20, dry_clean: 80 },
  },
  {
    id: "women_shawl",
    name: "Shawl / Pashmina",
    category: "Women",
    rates: { wash_and_press: 180, press_only: 70, dry_clean: 260 },
  },
  {
    id: "women_nightwear",
    name: "Nighty / Night Suit",
    category: "Women",
    rates: { wash_and_press: 70, press_only: 35, dry_clean: 140 },
  },

  // --- KIDS WEAR ---
  {
    id: "kids_shirt",
    name: "Kids Shirt / T-Shirt",
    category: "Kids",
    rates: { wash_and_press: 45, press_only: 25, dry_clean: 90 },
  },
  {
    id: "kids_shorts",
    name: "Kids Shorts / Trousers",
    category: "Kids",
    rates: { wash_and_press: 45, press_only: 25, dry_clean: 90 },
  },
  {
    id: "kids_dress",
    name: "Kids Frock / Party Dress",
    category: "Kids",
    rates: { wash_and_press: 65, press_only: 35, dry_clean: 130 },
  },

  // --- LINEN / HOUSEHOLD ---
  {
    id: "linen_bedsheet_single",
    name: "Bedsheet (Single)",
    category: "Linen",
    rates: { wash_and_press: 80, press_only: 40, dry_clean: 160 },
  },
  {
    id: "linen_bedsheet_double",
    name: "Bedsheet (Double / King)",
    category: "Linen",
    rates: { wash_and_press: 120, press_only: 60, dry_clean: 240 },
  },
  {
    id: "linen_pillow_cover",
    name: "Pillow Cover",
    category: "Linen",
    rates: { wash_and_press: 25, press_only: 15, dry_clean: 50 },
  },
  {
    id: "linen_towel_bath",
    name: "Bath Towel",
    category: "Linen",
    rates: { wash_and_press: 50, press_only: 25, dry_clean: 100 },
  },
  {
    id: "linen_blanket",
    name: "Blanket / Quilt / Comforter",
    category: "Linen",
    rates: { wash_and_press: 300, press_only: 100, dry_clean: 380 },
  },
];

const PRICING_STORAGE_KEY = "hotel_laundry_pricing_config";
const SPEEDS_STORAGE_KEY = "hotel_laundry_speeds_config";

/**
 * Get active dynamic garment catalog from Backend Database / InstitutionData
 */
export function getLaundryCatalog(institutionData = null) {
  let list = DEFAULT_GARMENTS;
  // 1. Try Backend Database from institutionData
  if (
    institutionData?.laundryConfig?.catalog &&
    Array.isArray(institutionData.laundryConfig.catalog) &&
    institutionData.laundryConfig.catalog.length > 0
  ) {
    list = institutionData.laundryConfig.catalog;
  } else {
    // 2. Try Cached Local Storage
    try {
      const saved = localStorage.getItem(PRICING_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          list = parsed;
        }
      }
    } catch (err) {
      console.warn("Could not load cached laundry catalog:", err);
    }
  }

  // Ensure all 4 rates are present on every garment
  return list.map((g) => ({
    ...g,
    rates: {
      wash_only:
        g.rates?.wash_only !== undefined
          ? g.rates.wash_only
          : Math.round((g.rates?.wash_and_press || 60) * 0.7),
      wash_and_press: g.rates?.wash_and_press || 0,
      press_only: g.rates?.press_only || 0,
      dry_clean: g.rates?.dry_clean || 0,
    },
  }));
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
    const saved = localStorage.getItem(SPEEDS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn("Could not load cached service speeds:", err);
  }

  return DEFAULT_SERVICE_SPEEDS;
}

/**
 * Save updated laundry configuration directly to Backend Database and sync locally
 */
export async function saveLaundryConfigToBackend({
  catalog,
  serviceSpeeds = null,
  institutionData = null,
  updateInstitutionData = null,
}) {
  // 1. Update local storage cache immediately
  try {
    localStorage.setItem(PRICING_STORAGE_KEY, JSON.stringify(catalog));
    if (serviceSpeeds) {
      localStorage.setItem(SPEEDS_STORAGE_KEY, JSON.stringify(serviceSpeeds));
    }
  } catch (err) {
    console.error("Local caching error:", err);
  }

  // 2. Persist directly to backend database via updateInstitutionData API
  if (typeof updateInstitutionData === "function" && institutionData) {
    try {
      const updatedInstitution = {
        ...institutionData,
        laundryConfig: {
          ...(institutionData.laundryConfig || {}),
          catalog: catalog,
          serviceSpeeds: serviceSpeeds || institutionData?.laundryConfig?.serviceSpeeds || DEFAULT_SERVICE_SPEEDS,
          sacCode: LAUNDRY_SAC_CODE,
          updatedAt: new Date().toISOString(),
        },
      };

      await updateInstitutionData(updatedInstitution);
      console.log("Successfully persisted dynamic laundry catalog to backend database!");
      return true;
    } catch (err) {
      console.error("Backend database update failed:", err);
      return false;
    }
  }

  return true;
}

/**
 * Save updated garment catalog (local helper)
 */
export function saveLaundryCatalog(garments) {
  try {
    localStorage.setItem(PRICING_STORAGE_KEY, JSON.stringify(garments));
    return true;
  } catch (err) {
    console.error("Failed to save laundry catalog:", err);
    return false;
  }
}

/**
 * Reset to factory default garment rates
 */
export async function resetLaundryCatalogToDefault(institutionData = null, updateInstitutionData = null) {
  try {
    localStorage.removeItem(PRICING_STORAGE_KEY);
    localStorage.removeItem(SPEEDS_STORAGE_KEY);
  } catch (err) {}

  if (typeof updateInstitutionData === "function" && institutionData) {
    try {
      const updatedInstitution = {
        ...institutionData,
        laundryConfig: {
          catalog: DEFAULT_GARMENTS,
          serviceSpeeds: DEFAULT_SERVICE_SPEEDS,
          sacCode: LAUNDRY_SAC_CODE,
          updatedAt: new Date().toISOString(),
        },
      };
      await updateInstitutionData(updatedInstitution);
    } catch (err) {
      console.error("Failed to reset backend database catalog:", err);
    }
  }

  return DEFAULT_GARMENTS;
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
export function calculateLaundryTotals(items, serviceSpeedId = "normal", cgstPct = 2.5, sgstPct = 2.5, customSpeeds = null) {
  const speedsList = customSpeeds || DEFAULT_SERVICE_SPEEDS;
  const speed = speedsList.find((s) => s.id === serviceSpeedId) || speedsList[0];
  const surchargePercent = speed?.surchargePercent || 0;

  // Subtotal from all item lines
  const itemsSubtotal = (items || []).reduce((acc, item) => {
    const qty = Number(item.quantity) || 0;
    const rate = Number(item.unitRate) || 0;
    return acc + qty * rate;
  }, 0);

  // Total garment count
  const totalGarments = (items || []).reduce((acc, item) => acc + (Number(item.quantity) || 0), 0);

  // Turnaround surcharge
  const surchargeAmount = (itemsSubtotal * surchargePercent) / 100;

  // Taxable amount before GST
  const taxableAmount = itemsSubtotal + surchargeAmount;

  // GST rates
  const cgstAmount = (taxableAmount * (Number(cgstPct) || 2.5)) / 100;
  const sgstAmount = (taxableAmount * (Number(sgstPct) || 2.5)) / 100;
  const totalTax = cgstAmount + sgstAmount;

  // Net total
  const grandTotal = Math.round(taxableAmount + totalTax);

  return {
    totalGarments,
    itemsSubtotal: Number(itemsSubtotal.toFixed(2)),
    surchargePercent,
    surchargeAmount: Number(surchargeAmount.toFixed(2)),
    taxableAmount: Number(taxableAmount.toFixed(2)),
    cgstAmount: Number(cgstAmount.toFixed(2)),
    sgstAmount: Number(sgstAmount.toFixed(2)),
    totalTax: Number(totalTax.toFixed(2)),
    grandTotal,
  };
}

/**
 * Backend API Client Methods for Laundry
 */
export async function createLaundryOrderBackend(orderData) {
  try {
    const { body } = await post({
      apiName: "housekeeping",
      path: "/laundry/orders",
      options: {
        body: {
          ...orderData,
          institutionId,
        },
        queryParams: { institutionId },
      },
    }).response;
    const res = await body.json();
    return res.order || orderData;
  } catch (err) {
    console.warn("Backend /laundry/orders creation failed, local fallback:", err);
    return orderData;
  }
}

export async function fetchLaundryOrdersBackend() {
  try {
    const { body } = await get({
      apiName: "housekeeping",
      path: "/laundry/orders",
      options: {
        queryParams: { institutionId },
      },
    }).response;
    const res = await body.json();
    return res.orders || [];
  } catch (err) {
    console.warn("Backend /laundry/orders list failed, local fallback:", err);
    return [];
  }
}

export async function updateLaundryStatusBackend(orderId, statusData) {
  try {
    const { body } = await patch({
      apiName: "housekeeping",
      path: `/laundry/orders/${orderId}/status`,
      options: {
        body: {
          ...statusData,
          institutionId,
        },
        queryParams: { institutionId },
      },
    }).response;
    const res = await body.json();
    return res.order;
  } catch (err) {
    console.warn("Backend status update failed, local fallback:", err);
    return null;
  }
}

export async function settleLaundryOrderBackend(orderId, settleData) {
  try {
    const { body } = await post({
      apiName: "housekeeping",
      path: `/laundry/orders/${orderId}/settle`,
      options: {
        body: {
          ...settleData,
          institutionId,
        },
        queryParams: { institutionId },
      },
    }).response;
    const res = await body.json();
    return res.order;
  } catch (err) {
    console.warn("Backend settle failed, local fallback:", err);
    return null;
  }
}

export async function fetchDeliveriesBackend() {
  try {
    const { body } = await get({
      apiName: "housekeeping",
      path: "/laundry/deliveries",
      options: {
        queryParams: { institutionId },
      },
    }).response;
    const res = await body.json();
    return res.deliveries || [];
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

