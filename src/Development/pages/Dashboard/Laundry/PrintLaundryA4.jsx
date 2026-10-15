import React from "react";
import { LAUNDRY_SAC_CODE } from "./laundryCatalog.js";

/**
 * Converts a number to Indian Currency words
 * e.g. 560 → "Five Hundred Sixty Rupees Only"
 */
export const numberToIndianWords = (num) => {
  if (num === null || num === undefined || isNaN(num) || num <= 0) {
    return "Zero Rupees Only";
  }

  const a = [
    "",
    "One ",
    "Two ",
    "Three ",
    "Four ",
    "Five ",
    "Six ",
    "Seven ",
    "Eight ",
    "Nine ",
    "Ten ",
    "Eleven ",
    "Twelve ",
    "Thirteen ",
    "Fourteen ",
    "Fifteen ",
    "Sixteen ",
    "Seventeen ",
    "Eighteen ",
    "Nineteen ",
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const inWords = (n) => {
    let str = "";
    if (n > 99) {
      str += a[Math.floor(n / 100)] + "Hundred ";
      n %= 100;
    }
    if (n > 19) {
      str += b[Math.floor(n / 10)] + " " + a[n % 10];
    } else {
      str += a[n];
    }
    return str;
  };

  const amount = Math.floor(num);
  const paise = Math.round((num - amount) * 100);

  const crore = Math.floor(amount / 10000000);
  const lakh = Math.floor((amount % 10000000) / 100000);
  const thousand = Math.floor((amount % 100000) / 1000);
  const hundred = amount % 1000;

  let words = "";
  if (crore > 0) words += inWords(crore) + "Crore ";
  if (lakh > 0) words += inWords(lakh) + "Lakh ";
  if (thousand > 0) words += inWords(thousand) + "Thousand ";
  if (hundred > 0) words += inWords(hundred);

  words = words.trim() + " Rupees";
  if (paise > 0) {
    words += " and " + inWords(paise).trim() + " Paise";
  }
  return words + " Only";
};

/**
 * Returns formatted care type label
 */
export const getCareTypeLabel = (ct) => {
  if (ct === "wash_only") return "Washing Only";
  if (ct === "wash_and_press") return "Wash & Steam Iron";
  if (ct === "press_only") return "Steam Iron Only";
  if (ct === "dry_clean") return "Dry Cleaning";
  return ct || "Laundering";
};

/**
 * Generate Professional A4 Laundry Tax Invoice HTML
 * Pure Black & White — Indian Hotel Standard (ITC / Taj style)
 * GST Compliant: SAC 999791, CGST 2.5% + SGST 2.5%
 */
export const getLaundryA4BillHTML = ({ order = {}, institutionData = {} }) => {
  const formatDate = (dateStr) => {
    const d = dateStr ? new Date(dateStr) : new Date();
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (dateStr) => {
    const d = dateStr ? new Date(dateStr) : new Date();
    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const hotelName =
    institutionData?.companyName ||
    institutionData?.institution_name ||
    "HOTEL LAUNDRY SERVICES";
  const hotelAddress = institutionData?.Query_Address || institutionData?.address || "";
  const hotelPhone =
    institutionData?.Query_PhoneNumber ||
    institutionData?.phone ||
    institutionData?.mobile ||
    institutionData?.contactDetails?.phone ||
    "";
  const hotelEmail =
    institutionData?.Query_Email ||
    institutionData?.email ||
    institutionData?.contactDetails?.email ||
    "";
  const gstin = institutionData?.gstin || institutionData?.taxNumber || "";
  const stateCode = institutionData?.stateCode || institutionData?.gstin?.substring(0, 2) || "";
  const stateName = institutionData?.state || institutionData?.State || "";

  const items = order.items || [];
  const token = order.token || order.orderId || `LND-${Date.now()}`;
  const grandTotal = Number(order.grandTotal || 0);

  // --- Items rows ---
  const itemsRowsHTML = items
    .map((item, index) => {
      const qty = Number(item.quantity) || 1;
      const rate = Number(item.unitRate || 0);
      const total = qty * rate;
      const isEven = index % 2 === 1;
      return `
        <tr style="border-bottom:1px solid #cccccc;background:${isEven ? "#f5f5f5" : "#ffffff"};">
          <td style="padding:6px 7px;text-align:center;font-size:10.5px;border-right:1px solid #cccccc;">${index + 1}</td>
          <td style="padding:6px 8px;font-size:10.5px;border-right:1px solid #cccccc;">
            <div style="font-weight:700;color:#000000;">${item.name}</div>
            <div style="font-size:9.5px;color:#333333;">${item.category ? `Category: ${item.category}` : ""}${item.notes ? ` &nbsp;|&nbsp; Note: ${item.notes}` : ""}</div>
          </td>
          <td style="padding:6px 7px;text-align:center;font-size:10.5px;border-right:1px solid #cccccc;">${getCareTypeLabel(item.careType)}</td>
          <td style="padding:6px 7px;text-align:center;font-size:10.5px;font-family:monospace;border-right:1px solid #cccccc;">${LAUNDRY_SAC_CODE}</td>
          <td style="padding:6px 7px;text-align:center;font-size:10.5px;font-weight:700;border-right:1px solid #cccccc;">${qty}</td>
          <td style="padding:6px 7px;text-align:right;font-size:10.5px;border-right:1px solid #cccccc;">&#8377;${rate.toFixed(2)}</td>
          <td style="padding:6px 7px;text-align:right;font-size:10.5px;font-weight:700;">&#8377;${total.toFixed(2)}</td>
        </tr>
      `;
    })
    .join("");

  // Detect settlement description
  let settlementDesc = "";
  if (order.settlementType === "ROOM_FOLIO") {
    settlementDesc = `Posted to Room ${order.roomNumber} Hotel Folio`;
  } else if (order.paymentStatus === "HELD_ON_ROOM") {
    settlementDesc = `Held on Room ${order.roomNumber} — Pending Settlement`;
  } else {
    settlementDesc = `Direct Payment — ${order.paymentMethod || "Cash"}`;
  }

  const cleanRoom = String(order.roomNumber || "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s))
    .join(", ");
  const roomDisplay =
    cleanRoom && cleanRoom !== "Walk-In"
      ? `Room No. ${cleanRoom}`
      : order.roomNumber && order.roomNumber !== "Walk-In"
      ? `Room No. ${order.roomNumber}`
      : "Walk-In Guest";

  const deliveryDisplay =
    order.deliveryDateTime ||
    (order.deliveryDate ? `${order.deliveryDate} at ${order.deliveryTime || "18:00"}` : "Standard");

  const speedSurcharge =
    order.surchargePercent > 0 ? `Express (${order.surchargePercent}% surcharge)` : "Standard";

  const cgstRate =
    order.cgstRate !== undefined && order.cgstRate !== null
      ? Number(order.cgstRate)
      : institutionData?.laundryConfig?.cgstRate !== undefined
      ? Number(institutionData.laundryConfig.cgstRate)
      : institutionData?.laundryGst !== undefined
      ? Number(institutionData.laundryGst) / 2
      : institutionData?.cgst !== undefined
      ? Number(institutionData.cgst)
      : 2.5;

  const sgstRate =
    order.sgstRate !== undefined && order.sgstRate !== null
      ? Number(order.sgstRate)
      : institutionData?.laundryConfig?.sgstRate !== undefined
      ? Number(institutionData.laundryConfig.sgstRate)
      : institutionData?.laundryGst !== undefined
      ? Number(institutionData.laundryGst) / 2
      : institutionData?.sgst !== undefined
      ? Number(institutionData.sgst)
      : 2.5;

  return `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#000000;background:#ffffff;padding:20px 24px;max-width:760px;margin:0 auto;box-sizing:border-box;line-height:1.45;">

      <!-- ═══════════════════════════════════════════
           HEADER: DOUBLE BORDER TOP RULE + HOTEL NAME
           ═══════════════════════════════════════════ -->
      <div style="border-top:3px solid #000000;border-bottom:1px solid #000000;padding:2px 0;margin-bottom:2px;"></div>
      <div style="border-top:1px solid #000000;padding-top:10px;margin-bottom:10px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="vertical-align:top;width:65%;">
              <div style="font-size:22px;font-weight:900;letter-spacing:1px;text-transform:uppercase;color:#000000;">${hotelName}</div>
              ${hotelAddress ? `<div style="font-size:10px;color:#333333;margin-top:2px;">${hotelAddress}</div>` : ""}
              <div style="font-size:10px;color:#333333;margin-top:1px;">
                ${hotelPhone ? `Tel: <b>${hotelPhone}</b>` : ""}
                ${hotelEmail ? `&nbsp;&nbsp;Email: <b>${hotelEmail}</b>` : ""}
              </div>
              ${gstin ? `<div style="font-size:10px;color:#000000;font-weight:700;margin-top:1px;">GSTIN: <span style="font-family:monospace;">${gstin}</span>${stateName ? `&nbsp;&nbsp;State: ${stateName}` : ""}${stateCode ? ` (${stateCode})` : ""}</div>` : ""}
            </td>
            <td style="vertical-align:top;text-align:right;width:35%;">
              <div style="border:2px solid #000000;display:inline-block;padding:5px 12px;text-align:center;">
                <div style="font-size:13px;font-weight:900;letter-spacing:1.5px;text-transform:uppercase;">TAX INVOICE</div>
                <div style="font-size:9px;font-weight:600;letter-spacing:0.5px;">LAUNDRY SERVICES BILL</div>
              </div>
              <div style="font-size:9px;color:#444444;margin-top:4px;text-align:right;">ORIGINAL FOR RECIPIENT</div>
            </td>
          </tr>
        </table>
      </div>
      <div style="border-top:1px solid #000000;border-bottom:3px solid #000000;padding:2px 0;margin-bottom:12px;"></div>

      <!-- ═══════════════════════════════════════════
           INVOICE META: 3-COLUMN GRID (Token | Guest | Speed)
           ═══════════════════════════════════════════ -->
      <table style="width:100%;border-collapse:collapse;border:1px solid #000000;margin-bottom:12px;">
        <tr>
          <td style="width:33.33%;padding:8px 10px;vertical-align:top;border-right:1px solid #000000;">
            <div style="font-size:8.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #cccccc;padding-bottom:2px;margin-bottom:4px;">Invoice Reference</div>
            <div style="font-size:9.5px;margin-bottom:2px;"><b>Token No.:</b> <span style="font-family:monospace;font-size:11px;font-weight:900;">${token}</span></div>
            <div style="font-size:9.5px;margin-bottom:2px;"><b>Date:</b> ${formatDate(order.createdAt)}</div>
            <div style="font-size:9.5px;margin-bottom:2px;"><b>Order Time:</b> ${formatDateTime(order.createdAt)}</div>
            <div style="font-size:9.5px;"><b>Collection:</b> ${(order.collectionSource || "room_pickup").replace(/_/g, " ")}</div>
          </td>
          <td style="width:33.33%;padding:8px 10px;vertical-align:top;border-right:1px solid #000000;">
            <div style="font-size:8.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #cccccc;padding-bottom:2px;margin-bottom:4px;">Guest / Room Details</div>
            <div style="font-size:12px;font-weight:900;margin-bottom:3px;">${roomDisplay}</div>
            <div style="font-size:10px;font-weight:700;margin-bottom:2px;">${order.guestName || "In-House Guest"}</div>
            ${order.guestMobile ? `<div style="font-size:9.5px;"><b>Mobile:</b> ${order.guestMobile}</div>` : ""}
            <div style="font-size:9.5px;margin-top:3px;"><b>Settlement:</b> ${settlementDesc}</div>
          </td>
          <td style="width:33.33%;padding:8px 10px;vertical-align:top;">
            <div style="font-size:8.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #cccccc;padding-bottom:2px;margin-bottom:4px;">Service Details</div>
            <div style="font-size:9.5px;margin-bottom:2px;"><b>Speed:</b> ${order.serviceSpeedLabel || speedSurcharge}</div>
            <div style="font-size:9.5px;margin-bottom:2px;"><b>Target Delivery:</b></div>
            <div style="font-size:10px;font-weight:700;margin-bottom:2px;">${deliveryDisplay}</div>
            <div style="font-size:9.5px;"><b>Total Garments:</b> ${order.totalGarments || items.length} pcs</div>
          </td>
        </tr>
      </table>

      <!-- ═══════════════════════════════════════════
           ITEMIZATION TABLE
           ═══════════════════════════════════════════ -->
      <table style="width:100%;border-collapse:collapse;border:1px solid #000000;margin-bottom:12px;">
        <thead>
          <tr style="background:#000000;color:#ffffff;">
            <th style="padding:7px 7px;font-size:10px;font-weight:700;text-align:center;width:5%;border-right:1px solid #444444;">#</th>
            <th style="padding:7px 8px;font-size:10px;font-weight:700;text-align:left;width:33%;border-right:1px solid #444444;">Garment Description</th>
            <th style="padding:7px 7px;font-size:10px;font-weight:700;text-align:center;width:20%;border-right:1px solid #444444;">Care Service</th>
            <th style="padding:7px 7px;font-size:10px;font-weight:700;text-align:center;width:12%;border-right:1px solid #444444;">SAC Code</th>
            <th style="padding:7px 7px;font-size:10px;font-weight:700;text-align:center;width:7%;border-right:1px solid #444444;">Qty</th>
            <th style="padding:7px 7px;font-size:10px;font-weight:700;text-align:right;width:11%;border-right:1px solid #444444;">Rate (&#8377;)</th>
            <th style="padding:7px 7px;font-size:10px;font-weight:700;text-align:right;width:12%;">Amount (&#8377;)</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRowsHTML}
        </tbody>
        <tfoot>
          <tr style="background:#f0f0f0;border-top:2px solid #000000;">
            <td colspan="4" style="padding:6px 8px;font-size:10px;font-weight:700;text-align:right;border-right:1px solid #cccccc;">Items Subtotal:</td>
            <td style="padding:6px 7px;text-align:center;font-size:10.5px;font-weight:700;border-right:1px solid #cccccc;">${order.totalGarments || items.length}</td>
            <td style="border-right:1px solid #cccccc;"></td>
            <td style="padding:6px 7px;text-align:right;font-size:11px;font-weight:700;">&#8377;${Number(order.itemsSubtotal || 0).toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>

      <!-- ═══════════════════════════════════════════
           SUMMARY: Amount in Words (left) + Tax Breakdown (right)
           ═══════════════════════════════════════════ -->
      <table style="width:100%;border-collapse:collapse;margin-bottom:12px;">
        <tr>
          <!-- Left: Amount in words + GST notes -->
          <td style="width:55%;vertical-align:top;padding-right:14px;">
            <div style="border:1px solid #000000;padding:8px 10px;margin-bottom:8px;">
              <div style="font-size:8.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:3px;">Invoice Amount in Words:</div>
              <div style="font-size:11px;font-weight:700;font-style:italic;">${numberToIndianWords(grandTotal)}</div>
            </div>
            <div style="font-size:9px;color:#333333;line-height:1.5;">
              <div style="font-weight:700;margin-bottom:2px;">GST Compliance Notes:</div>
              <div>&#8226; SAC Code: <b>${LAUNDRY_SAC_CODE}</b> — Laundry, Cleaning &amp; Dyeing Services</div>
              <div>&#8226; CGST @ ${cgstRate}% &amp; SGST @ ${sgstRate}% applicable as per GST hotel guest amenities notification</div>
              <div>&#8226; All charges are inclusive of applicable taxes as shown</div>
            </div>
          </td>

          <!-- Right: Tax calculation breakdown table -->
          <td style="width:45%;vertical-align:top;">
            <table style="width:100%;border-collapse:collapse;border:1px solid #000000;">
              <tr style="border-bottom:1px solid #cccccc;">
                <td style="padding:5px 8px;font-size:10px;border-right:1px solid #cccccc;">Items Subtotal</td>
                <td style="padding:5px 8px;text-align:right;font-size:10px;">&#8377;${Number(order.itemsSubtotal || 0).toFixed(2)}</td>
              </tr>
              ${
                order.surchargeAmount > 0
                  ? `
              <tr style="border-bottom:1px solid #cccccc;">
                <td style="padding:5px 8px;font-size:10px;border-right:1px solid #cccccc;">Express Surcharge (+${order.surchargePercent}%)</td>
                <td style="padding:5px 8px;text-align:right;font-size:10px;">+&#8377;${Number(order.surchargeAmount).toFixed(2)}</td>
              </tr>
              <tr style="border-bottom:1px solid #cccccc;">
                <td style="padding:5px 8px;font-size:10px;border-right:1px solid #cccccc;">Taxable Amount</td>
                <td style="padding:5px 8px;text-align:right;font-size:10px;">&#8377;${Number(order.taxableAmount || 0).toFixed(2)}</td>
              </tr>
              `
                  : ""
              }
              <tr style="border-bottom:1px solid #cccccc;">
                <td style="padding:5px 8px;font-size:10px;border-right:1px solid #cccccc;">CGST @ ${cgstRate}%</td>
                <td style="padding:5px 8px;text-align:right;font-size:10px;">&#8377;${Number(order.cgstAmount || 0).toFixed(2)}</td>
              </tr>
              <tr style="border-bottom:1px solid #cccccc;">
                <td style="padding:5px 8px;font-size:10px;border-right:1px solid #cccccc;">SGST @ ${sgstRate}%</td>
                <td style="padding:5px 8px;text-align:right;font-size:10px;">&#8377;${Number(order.sgstAmount || 0).toFixed(2)}</td>
              </tr>
              <tr style="background:#000000;color:#ffffff;">
                <td style="padding:8px 8px;font-size:12px;font-weight:900;text-transform:uppercase;border-right:1px solid #444444;">NET TOTAL PAYABLE</td>
                <td style="padding:8px 8px;text-align:right;font-size:14px;font-weight:900;">&#8377;${grandTotal.toFixed(2)}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- ═══════════════════════════════════════════
           TERMS & CONDITIONS
           ═══════════════════════════════════════════ -->
      <div style="border-top:1px solid #999999;padding-top:8px;margin-bottom:20px;">
        <div style="font-size:8.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Standard Hotel Laundry Terms &amp; Conditions</div>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="width:50%;vertical-align:top;padding-right:10px;font-size:8.5px;color:#333333;line-height:1.5;">
              1. Garments handled with professional care as per manufacturer care symbols.<br/>
              2. Hotel not liable for color fastness, fabric shrinkage, or delicate embellishments.<br/>
              3. Discrepancies must be reported within 12 hours of delivery.
            </td>
            <td style="width:50%;vertical-align:top;font-size:8.5px;color:#333333;line-height:1.5;">
              4. In case of damage, hotel liability limited to 10x the laundering charge.<br/>
              5. Unclaimed garments after 30 days disposed as per hotel policy.<br/>
              6. Room laundry charges reflect in checkout portfolio automatically.
            </td>
          </tr>
        </table>
      </div>

      <!-- ═══════════════════════════════════════════
           SIGNATURE BLOCK
           ═══════════════════════════════════════════ -->
      <table style="width:100%;border-collapse:collapse;margin-top:20px;">
        <tr>
          <td style="width:45%;text-align:center;vertical-align:bottom;">
            <div style="border-bottom:1px solid #000000;height:36px;margin:0 auto 5px auto;width:80%;"></div>
            <div style="font-size:10px;font-weight:700;">Guest Signature / Room Acknowledgement</div>
            <div style="font-size:8.5px;color:#444444;">(Garments received in good condition)</div>
          </td>
          <td style="width:10%;"></td>
          <td style="width:45%;text-align:center;vertical-align:bottom;">
            <div style="border-bottom:1px solid #000000;height:36px;margin:0 auto 5px auto;width:80%;"></div>
            <div style="font-size:10px;font-weight:700;">For ${hotelName}</div>
            <div style="font-size:8.5px;color:#444444;">(Authorised Laundry Executive / Housekeeper)</div>
          </td>
        </tr>
      </table>

      <!-- FOOTER -->
      <div style="border-top:1px solid #cccccc;margin-top:16px;padding-top:5px;text-align:center;font-size:8px;color:#777777;">
        Computer Generated Official Laundry Tax Invoice &nbsp;|&nbsp; Generated: ${new Date().toLocaleString("en-IN")}
        &nbsp;|&nbsp; Token: ${token}
      </div>

    </div>
  `;
};

/**
 * Isolated Hidden Iframe A4 Printer
 * Guarantees standard A4 Portrait paper dimensions with professional margins
 */
export const printLaundryA4Bill = ({ order, institutionData = {} }) => {
  const token = order.token || order.orderId || `LND-${Date.now()}`;
  const htmlContent = getLaundryA4BillHTML({ order, institutionData });

  // Remove existing iframe if any
  const existingIframe = document.getElementById("laundryA4PrintFrame");
  if (existingIframe) {
    document.body.removeChild(existingIframe);
  }

  // Create isolated invisible iframe
  const iframe = document.createElement("iframe");
  iframe.id = "laundryA4PrintFrame";
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "210mm";
  iframe.style.height = "0";
  iframe.style.border = "none";
  iframe.style.zIndex = "-9999";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Laundry-Invoice-${token}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 10mm 12mm;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          html, body {
            width: 100%;
            background: #ffffff;
            color: #000000;
            font-family: Arial, Helvetica, sans-serif;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          table { width: 100%; border-collapse: collapse; }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        ${htmlContent}
      </body>
    </html>
  `);
  doc.close();

  iframe.contentWindow.focus();
  setTimeout(() => {
    try {
      iframe.contentWindow.print();
    } catch (e) {
      console.error("A4 print error:", e);
    }
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 2500);
  }, 300);
};

export default printLaundryA4Bill;
