import React from "react";
import { LAUNDRY_SAC_CODE } from "./laundryCatalog.js";

/**
 * Generate Raw HTML for 58mm / 80mm ESC/POS Thermal Receipt
 */
export const getLaundryThermalSlipHTML = ({
  order = {},
  institutionData = {},
  paperSize = "80", // "58" or "80"
}) => {
  const formatDateTime = (dateStr) => {
    const d = dateStr ? new Date(dateStr) : new Date();
    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "2-digit",
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
  const hotelAddress =
    institutionData?.Query_Address || institutionData?.address || "";
  const hotelPhone =
    institutionData?.Query_PhoneNumber ||
    institutionData?.phone ||
    institutionData?.mobile ||
    institutionData?.contactDetails?.phone ||
    "";
  const gstin = institutionData?.gstin || institutionData?.taxNumber || "";

  const items = order.items || [];
  const token = order.token || order.orderId || `LND-${Date.now()}`;

  const careTypeLabel = (ct) => {
    if (ct === "wash_only") return "Wash Only";
    if (ct === "wash_and_press") return "Wash & Iron";
    if (ct === "press_only") return "Iron Only";
    if (ct === "dry_clean") return "Dry Clean";
    return ct || "Care";
  };

  const is58mm = String(paperSize) === "58";
  const maxWidthMm = is58mm ? "54mm" : "74mm";

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

  // Build items rows
  const itemsHTML = items
    .map(
      (item) => `
        <tr style="border-bottom: 1px dotted #888;">
          <td style="padding: 3px 0; text-align: left; vertical-align: top;">
            <div style="font-weight: 700; font-size: ${is58mm ? "10px" : "11px"}; line-height: 1.2;">${item.name}</div>
            <div style="font-size: ${is58mm ? "8px" : "9px"}; color: #333; font-weight: 600;">[${careTypeLabel(item.careType)}]</div>
            ${item.notes ? `<div style="font-size: 8px; color: #555; font-style: italic;">Note: ${item.notes}</div>` : ""}
          </td>
          <td style="padding: 3px 2px; text-align: center; vertical-align: top; font-size: ${is58mm ? "10px" : "11px"}; font-weight: bold;">
            ${item.quantity}
          </td>
          <td style="padding: 3px 2px; text-align: right; vertical-align: top; font-size: ${is58mm ? "10px" : "11px"};">
            ₹${Number(item.unitRate || 0).toFixed(0)}
          </td>
          <td style="padding: 3px 0; text-align: right; vertical-align: top; font-weight: bold; font-size: ${is58mm ? "10px" : "11px"};">
            ₹${(Number(item.unitRate || 0) * Number(item.quantity || 1)).toFixed(2)}
          </td>
        </tr>
      `
    )
    .join("");

  // Barcode pattern
  const barcodeChars = (token || "").replace(/[^A-Za-z0-9]/g, "");
  let barcodeLines = "";
  for (let i = 0; i < barcodeChars.length; i++) {
    const code = barcodeChars.charCodeAt(i);
    const w1 = (code % 3) + 1;
    const w2 = ((code * 2) % 3) + 1;
    barcodeLines += `<span style="display:inline-block;width:${w1}px;height:${is58mm ? "24px" : "32px"};background:#000;margin-right:${w2}px;"></span>`;
  }

  return `
    <div class="laundry-thermal-ticket" style="font-family: 'Courier New', Courier, monospace; color: #000; width: ${maxWidthMm}; max-width: ${maxWidthMm}; margin: 0 auto; padding: 2px;">
      
      <!-- HEADER -->
      <div style="text-align: center; margin-bottom: 5px;">
        <div style="font-size: ${is58mm ? "12px" : "15px"}; font-weight: 900; letter-spacing: 0.5px; text-transform: uppercase;">
          ${hotelName}
        </div>
        ${hotelAddress ? `<div style="font-size: ${is58mm ? "8px" : "9.5px"}; line-height: 1.2; margin-top: 2px;">${hotelAddress}</div>` : ""}
        ${hotelPhone ? `<div style="font-size: ${is58mm ? "8.5px" : "9.5px"};">Ph: ${hotelPhone}</div>` : ""}
        ${gstin ? `<div style="font-size: ${is58mm ? "8.5px" : "9.5px"}; font-weight: bold;">GSTIN: ${gstin}</div>` : ""}
        <div style="font-size: ${is58mm ? "8.5px" : "9.5px"}; font-weight: bold; margin-top: 1px;">SAC: ${LAUNDRY_SAC_CODE} (LAUNDRY & DRY CLEAN)</div>
      </div>

      <div style="border-top: 1px dashed #000; margin: 4px 0;"></div>
      
      <!-- TOKEN & BARCODE -->
      <div style="text-align: center; margin: 5px 0;">
        <div style="font-size: ${is58mm ? "11px" : "13px"}; font-weight: 900; letter-spacing: 1px;">
          TAG NO: ${token}
        </div>
        <div style="margin: 3px 0; overflow: hidden; display: flex; justify-content: center; align-items: center;">
          ${barcodeLines}
        </div>
        <div style="font-size: ${is58mm ? "8px" : "9px"}; letter-spacing: 2px;">*${token}*</div>
      </div>

      <div style="border-top: 1px dashed #000; margin: 4px 0;"></div>

      <!-- GUEST / ROOM DETAILS -->
      <table style="width: 100%; font-size: ${is58mm ? "9px" : "10px"}; line-height: 1.3;">
        <tr>
          <td style="font-weight: bold; width: 35%;">Room / Type:</td>
          <td style="font-weight: 900; font-size: ${is58mm ? "10px" : "12px"};">
            ${(() => {
              const clean = String(order.roomNumber || "")
                .split(",")
                .map((s) => s.trim())
                .filter((s) => !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s))
                .join(", ");
              return clean && clean !== "Walk-In" ? `ROOM ${clean}` : order.roomNumber === "Walk-In" ? "WALK-IN GUEST" : (order.roomNumber ? `ROOM ${order.roomNumber}` : "WALK-IN GUEST");
            })()}
          </td>
        </tr>
        <tr>
          <td style="font-weight: bold;">Guest Name:</td>
          <td style="font-weight: bold;">${order.guestName || "Guest"}</td>
        </tr>
        ${order.guestMobile ? `<tr><td style="font-weight: bold;">Mobile:</td><td>${order.guestMobile}</td></tr>` : ""}
        <tr>
          <td style="font-weight: bold;">Received:</td>
          <td>${formatDateTime(order.createdAt)}</td>
        </tr>
        ${order.deliveryDateTime ? `<tr><td style="font-weight: bold;">Target Delivery:</td><td style="font-weight: bold;">${order.deliveryDateTime}</td></tr>` : ""}
        <tr>
          <td style="font-weight: bold;">Speed:</td>
          <td style="font-weight: bold; text-transform: uppercase;">
            ${order.serviceSpeedLabel || "Standard (24h)"}
            ${order.surchargePercent > 0 ? ` (+${order.surchargePercent}%)` : ""}
          </td>
        </tr>
        <tr>
          <td style="font-weight: bold;">Billing:</td>
          <td style="font-weight: bold;">
            ${
              order.settlementType === "ROOM_FOLIO"
                ? `POSTED TO ROOM ${order.roomNumber} BILL`
                : order.paymentStatus === "HELD_ON_ROOM"
                ? `HOLD ON ROOM ${order.roomNumber}`
                : `DIRECT PAID [${order.paymentMethod || "CASH"}]`
            }
          </td>
        </tr>
      </table>

      <div style="border-top: 1px dashed #000; margin: 4px 0;"></div>

      <!-- ITEMIZATION TABLE -->
      <table style="width: 100%; border-collapse: collapse; margin-top: 3px;">
        <thead>
          <tr style="border-bottom: 1px solid #000; font-size: ${is58mm ? "9px" : "10px"}; font-weight: bold;">
            <th style="text-align: left; padding: 2px 0;">GARMENT / CARE</th>
            <th style="text-align: center; padding: 2px 2px; width: 14%;">QTY</th>
            <th style="text-align: right; padding: 2px 2px; width: 22%;">RATE</th>
            <th style="text-align: right; padding: 2px 0; width: 24%;">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHTML}
        </tbody>
      </table>

      <div style="border-top: 1px dashed #000; margin: 4px 0;"></div>

      <!-- TOTALS -->
      <table style="width: 100%; font-size: ${is58mm ? "9px" : "10.5px"}; line-height: 1.35;">
        <tr>
          <td style="font-weight: bold;">Total Garments:</td>
          <td style="text-align: right; font-weight: bold;">${order.totalGarments || items.length} pcs</td>
        </tr>
        <tr>
          <td>Subtotal:</td>
          <td style="text-align: right;">₹${Number(order.itemsSubtotal || 0).toFixed(2)}</td>
        </tr>
        ${
          order.surchargeAmount > 0
            ? `
          <tr>
            <td>Express Fee (${order.surchargePercent}%):</td>
            <td style="text-align: right;">₹${Number(order.surchargeAmount).toFixed(2)}</td>
          </tr>
          <tr>
            <td>Taxable Amount:</td>
            <td style="text-align: right;">₹${Number(order.taxableAmount || 0).toFixed(2)}</td>
          </tr>
        `
            : ""
        }
        <tr>
          <td>CGST (${cgstRate}%):</td>
          <td style="text-align: right;">₹${Number(order.cgstAmount || 0).toFixed(2)}</td>
        </tr>
        <tr>
          <td>SGST (${sgstRate}%):</td>
          <td style="text-align: right;">₹${Number(order.sgstAmount || 0).toFixed(2)}</td>
        </tr>
        <tr style="border-top: 1px solid #000; font-size: ${is58mm ? "11px" : "13px"}; font-weight: 900;">
          <td style="padding-top: 3px;">NET PAYABLE:</td>
          <td style="text-align: right; padding-top: 3px;">₹${Number(order.grandTotal || 0).toFixed(2)}</td>
        </tr>
      </table>

      <div style="border-top: 1px dashed #000; margin: 5px 0;"></div>

      <!-- FOOTER & CONDITIONS -->
      <div style="text-align: center; font-size: ${is58mm ? "7.5px" : "8.5px"}; line-height: 1.2; color: #222;">
        <div style="font-weight: bold; text-transform: uppercase; margin-bottom: 2px;">Laundry Terms</div>
        <div>1. Check garments upon delivery. Later claims not entertained.</div>
        <div>2. Hotel not liable for colour bleed, shrinkage or natural fabric wear.</div>
        <div>3. Max liability limited to 10x cleaning charge for accidental loss.</div>
        <div style="margin-top: 4px; font-weight: bold; font-size: ${is58mm ? "8.5px" : "9.5px"};">THANK YOU!</div>
      </div>
    </div>
  `;
};

/**
 * Isolated Hidden Iframe Thermal Printer
 * Forces exact 58mm / 80mm roll width without defaulting to full A4 page scaling
 */
export const printLaundryThermalSlip = ({
  order,
  institutionData = {},
  paperSize = "80", // "58" or "80"
}) => {
  const is58mm = String(paperSize) === "58";
  const widthMm = is58mm ? "58mm" : "80mm";
  const token = order.token || order.orderId || `LND-${Date.now()}`;

  const htmlContent = getLaundryThermalSlipHTML({
    order,
    institutionData,
    paperSize,
  });

  // Remove existing iframe if any
  const existingIframe = document.getElementById("laundryThermalPrintFrame");
  if (existingIframe) {
    document.body.removeChild(existingIframe);
  }

  // Create isolated invisible iframe
  const iframe = document.createElement("iframe");
  iframe.id = "laundryThermalPrintFrame";
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = widthMm;
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
        <title>Receipt-${token}</title>
        <style>
          @page {
            size: ${widthMm} auto;
            margin: 0mm;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          html, body {
            width: ${widthMm};
            max-width: ${widthMm};
            margin: 0 auto;
            padding: ${is58mm ? "1.5mm" : "3mm"};
            background: #fff;
            color: #000;
            font-family: 'Courier New', Courier, monospace;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          table { width: 100%; border-collapse: collapse; }
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
      console.error("Thermal print error:", e);
    }
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 2500);
  }, 250);
};

export default printLaundryThermalSlip;
