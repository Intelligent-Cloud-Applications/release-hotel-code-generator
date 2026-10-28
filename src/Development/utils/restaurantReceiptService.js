import { institutionId as defaultInstitutionId } from "../../Operation/data.json";

/**
 * Get the base restaurant endpoint based on environment (DEV vs PROD)
 */
export const getRestaurantBaseUrl = () => {
  const stage = (import.meta.env.VITE_STAGE || "DEV").toUpperCase();
  if (stage === "PROD") {
    return (
      import.meta.env.VITE_PROD_RESTAURANT_ENDPOINT ||
      "https://uab10747yb.execute-api.us-east-1.amazonaws.com/prod"
    ).replace(/\/+$/, "");
  }
  return (
    import.meta.env.VITE_RESTAURANT_ENDPOINT ||
    "https://ppf65ueuea.execute-api.us-east-2.amazonaws.com/dev"
  ).replace(/\/+$/, "");
};

/**
 * Fetch receipt data and item details for single or multiple order IDs
 * @param {Object} options
 * @param {string} [options.institution] - Institution ID (default: HOTEL001)
 * @param {string|string[]|number} options.orderIds - Single ID, array of IDs, or comma-separated string
 * @returns {Promise<{ totalAmount: number, totalCGST: number, totalSGST: number, totalServiceTax: number, orders: Array, mergedItems: Array }>}
 */
export async function fetchRestaurantReceipt({ institution, orderIds }) {
  if (!orderIds) {
    return { orders: [], mergedItems: [], totalAmount: 0 };
  }

  let orderIdsString = "";
  if (Array.isArray(orderIds)) {
    orderIdsString = orderIds
      .filter((id) => id !== null && id !== undefined && String(id).trim() !== "")
      .map((id) => String(id).trim())
      .join(",");
  } else {
    orderIdsString = String(orderIds).trim();
  }

  if (!orderIdsString) {
    return { orders: [], mergedItems: [], totalAmount: 0 };
  }

  const inst = institution || defaultInstitutionId || "HOTEL001";
  const baseUrl = getRestaurantBaseUrl();
  const url = `${baseUrl}/admin/get-receipt?institution=${encodeURIComponent(inst)}&orderIds=${encodeURIComponent(orderIdsString)}`;

  console.log("[RestaurantReceipt] Fetching:", url);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Accept": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Receipt fetch error: HTTP ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  console.log("[RestaurantReceipt] Response:", data);
  return data;
}

/**
 * Normalizes orders from API response to a consistent array of order objects with line items
 */
export function normalizeRestaurantOrders(apiData, requestedOrderIds = []) {
  if (!apiData) return [];

  // If apiData has orders array
  if (Array.isArray(apiData.orders) && apiData.orders.length > 0) {
    return apiData.orders.map((order) => {
      const items = Array.isArray(order.items)
        ? order.items.map((item) => ({
            itemId: item.itemId || item.id,
            name: item.name || item.itemName || "Item",
            itemName: item.name || item.itemName || "Item",
            price: Number(item.price) || 0,
            quantity: Number(item.quantity) || 1,
            category: item.category || "Food",
            veg: Boolean(item.veg),
            type: item.type || "food",
            description: item.description || "",
          }))
        : [];

      const subtotal =
        order.subtotal !== undefined
          ? Number(order.subtotal)
          : items.reduce((sum, it) => sum + it.price * it.quantity, 0);

      const cgst = Number(order.cgst) || 0;
      const sgst = Number(order.sgst) || 0;
      const serviceTax = Number(order.serviceTax) || 0;
      const totalAmount = Number(order.totalAmount) || Math.round(subtotal + cgst + sgst + serviceTax);

      const billNo = order.bill_no || order.billNo || order.billNumber || null;
      return {
        orderId: String(order.orderId || ""),
        bill_no: billNo,
        billNo: billNo,
        orderType: "restaurant",
        tableName: order.tableName || "N/A",
        createdAt: order.createdAt,
        items,
        subtotal,
        cgst,
        sgst,
        serviceTax,
        totalAmount,
        discountAmount: Number(order.discountAmount) || 0,
        discountPercentage: Number(order.discountPercentage) || 0,
        status: order.status || "delivered",
        paymentMethod: order.paymentMethod || "ROOM",
        paymentMode: order.paymentMode || "offline",
        paymentStatus: order.paymentStatus,
        daySession: order.daySession || "",
        institution: order.institution || "",
      };
    });
  }

  // Fallback: If only mergedItems is present
  if (Array.isArray(apiData.mergedItems) && apiData.mergedItems.length > 0) {
    const fallbackId = Array.isArray(requestedOrderIds)
      ? requestedOrderIds[0] || "RESTAURANT"
      : String(requestedOrderIds || "RESTAURANT");

    const items = apiData.mergedItems.map((item) => ({
      itemId: item.itemId || item.id,
      name: item.name || item.itemName || "Item",
      itemName: item.name || item.itemName || "Item",
      price: Number(item.price) || 0,
      quantity: Number(item.quantity) || 1,
      category: item.category || "Food",
      veg: Boolean(item.veg),
      type: item.type || "food",
      description: item.description || "",
    }));

    const subtotal = items.reduce((sum, it) => sum + it.price * it.quantity, 0);
    const cgst = Number(apiData.totalCGST) || 0;
    const sgst = Number(apiData.totalSGST) || 0;
    const serviceTax = Number(apiData.totalServiceTax) || 0;
    const totalAmount = Number(apiData.totalAmount) || Math.round(subtotal + cgst + sgst + serviceTax);

    const fallbackBillNo = apiData.bill_no || apiData.billNo || apiData.billNumber || null;
    return [
      {
        orderId: fallbackId,
        bill_no: fallbackBillNo,
        billNo: fallbackBillNo,
        orderType: "restaurant",
        tableName: "N/A",
        createdAt: Date.now(),
        items,
        subtotal,
        cgst,
        sgst,
        serviceTax,
        totalAmount,
        discountAmount: 0,
        discountPercentage: 0,
        status: "delivered",
        paymentMethod: "ROOM",
        paymentMode: "offline",
        paymentStatus: true,
      },
    ];
  }

  return [];
}
