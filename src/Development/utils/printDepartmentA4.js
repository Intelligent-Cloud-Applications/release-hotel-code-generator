import { numberToIndianWords } from "../pages/Dashboard/Laundry/PrintLaundryA4.jsx";

/**
 * Generates and prints an A4 Tax Invoice for any department folio (F&B, Laundry, Minibar, Housekeeping)
 */
export function printDepartmentA4Invoice({
  bill = {},
  institutionData = {},
  booking = {},
  guestData = {},
}) {
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
    "HOTEL SERVICES";
  const hotelAddress =
    institutionData?.Query_Address ||
    institutionData?.address ||
    institutionData?.contactDetails?.address ||
    "";
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

  const guestName =
    guestData?.name ||
    guestData?.guest_name ||
    booking?.guest_name ||
    booking?.guestName ||
    "Valued Resident Guest";
  const roomNumber =
    bill.tableName ||
    booking?.room_number ||
    booking?.roomNumber ||
    "N/A";
  const folioId = bill.orderId || `FOL-${Date.now()}`;
  const departmentName = (bill.orderType || "services").toUpperCase();

  const departmentTitle =
    bill.orderType === "laundry"
      ? "TAX INVOICE — GUEST LAUNDRY SERVICES"
      : bill.orderType === "minibar"
      ? "TAX INVOICE — MINIBAR & BEVERAGES"
      : bill.orderType === "housekeeping"
      ? "TAX INVOICE — HOUSEKEEPING & ROOM SERVICES"
      : "TAX INVOICE — FOOD & BEVERAGE";

  const sacCode =
    bill.sac ||
    (bill.orderType === "laundry"
      ? "996312"
      : bill.orderType === "minibar"
      ? "996332"
      : bill.orderType === "housekeeping"
      ? "996311"
      : "996331");

  const items = Array.isArray(bill.items) ? bill.items : [];
  const subtotal = Number(bill.subtotal || 0);
  const cgst = Number(bill.cgst || 0);
  const sgst = Number(bill.sgst || 0);
  const serviceTax = Number(bill.serviceTax || 0);
  const total = Number(bill.total || 0);
  const totalQty = items.reduce((sum, it) => sum + (Number(it.quantity) || 1), 0);

  const itemsRowsHTML = items
    .map((item, idx) => {
      const qty = Number(item.quantity) || 1;
      let rate = Number(item.price || item.unitRate || item.rate || 0);
      if (rate <= 0 && subtotal > 0 && totalQty > 0) {
        rate = Math.round((subtotal / totalQty) * 100) / 100;
      }
      const rowTotal = qty * rate;
      const isEven = idx % 2 === 1;
      return `
        <tr style="background:${isEven ? "#f9fafb" : "#ffffff"}; border-bottom:1px solid #e5e7eb;">
          <td style="padding:8px 10px; font-size:12px; text-align:center; color:#4b5563;">${idx + 1}</td>
          <td style="padding:8px 10px; font-size:12px;">
            <div style="font-weight:600; color:#111827;">${item.name || item.itemName || "Service Item"}</div>
            ${item.category ? `<div style="font-size:10px; color:#6b7280;">Category: ${item.category}</div>` : ""}
            ${item.description ? `<div style="font-size:10px; color:#9ca3af; font-style:italic;">${item.description}</div>` : ""}
          </td>
          <td style="padding:8px 10px; font-size:12px; text-align:center; color:#4b5563;">${sacCode}</td>
          <td style="padding:8px 10px; font-size:12px; text-align:center; font-weight:600;">${qty}</td>
          <td style="padding:8px 10px; font-size:12px; text-align:right; font-family:monospace;">₹${rate.toFixed(2)}</td>
          <td style="padding:8px 10px; font-size:12px; text-align:right; font-weight:600; font-family:monospace;">₹${rowTotal.toFixed(2)}</td>
        </tr>
      `;
    })
    .join("");

  const htmlContent = `
    <div style="max-width:800px; margin:0 auto; padding:24px; font-family:system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#111827; background:#ffffff;">
      <!-- Header -->
      <div style="border-bottom:2px solid #1e3a8a; padding-bottom:16px; margin-bottom:16px; display:flex; justify-content:space-between; align-items:flex-start;">
        <div>
          <h1 style="margin:0; font-size:22px; font-weight:800; color:#1e3a8a; letter-spacing:-0.5px;">${hotelName}</h1>
          ${hotelAddress ? `<div style="font-size:11.5px; color:#4b5563; margin-top:3px;">${hotelAddress}</div>` : ""}
          <div style="font-size:11.5px; color:#4b5563; margin-top:2px;">
            ${hotelPhone ? `Tel: ${hotelPhone}` : ""} ${hotelEmail ? `• Email: ${hotelEmail}` : ""}
          </div>
          ${gstin ? `<div style="font-size:12px; font-weight:700; color:#1f2937; margin-top:4px;">GSTIN: ${gstin}</div>` : ""}
        </div>
        <div style="text-align:right;">
          <div style="display:inline-block; padding:4px 10px; background:#1e3a8a; color:#ffffff; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1px; border-radius:4px;">
            ${departmentName} DEPARTMENT FOLIO
          </div>
          <div style="font-size:18px; font-weight:800; color:#111827; margin-top:8px;">#${folioId}</div>
          <div style="font-size:11.5px; color:#6b7280; margin-top:2px;">Date: ${formatDateTime(bill.date)}</div>
        </div>
      </div>

      <!-- Banner -->
      <div style="background:#f3f4f6; border-left:4px solid #1e3a8a; padding:8px 12px; margin-bottom:18px; display:flex; justify-content:space-between; align-items:center;">
        <span style="font-size:12.5px; font-weight:700; color:#1f2937; letter-spacing:0.5px;">${departmentTitle}</span>
        <span style="font-size:11px; font-weight:600; color:#4b5563;">SAC: ${sacCode}</span>
      </div>

      <!-- Guest & Room Info -->
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:20px; background:#f9fafb; padding:12px 16px; border-radius:6px; border:1px solid #e5e7eb;">
        <div>
          <div style="font-size:10.5px; text-transform:uppercase; font-weight:600; color:#6b7280; letter-spacing:0.5px;">Guest Name</div>
          <div style="font-size:14px; font-weight:700; color:#111827; margin-top:2px;">${guestName}</div>
          <div style="font-size:11.5px; color:#4b5563; margin-top:2px;">Room Number: <b>${roomNumber}</b></div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:10.5px; text-transform:uppercase; font-weight:600; color:#6b7280; letter-spacing:0.5px;">Folio Reference</div>
          <div style="font-size:12px; font-weight:600; color:#111827; margin-top:2px;">${(bill.bill_no || bill.billNo) ? `Bill No: <b>${bill.bill_no || bill.billNo}</b> | ` : ""}Order/Folio: ${folioId}</div>
          <div style="font-size:11.5px; color:#4b5563; margin-top:2px;">Payment Method: <b>${bill.paymentMethod || "ROOM FOLIO"}</b></div>
        </div>
      </div>

      <!-- Line Items Table -->
      <table style="width:100%; border-collapse:collapse; margin-bottom:16px; border:1px solid #e5e7eb; border-radius:6px; overflow:hidden;">
        <thead>
          <tr style="background:#1e3a8a; color:#ffffff;">
            <th style="padding:9px 10px; font-size:11.5px; font-weight:700; width:40px; text-align:center;">#</th>
            <th style="padding:9px 10px; font-size:11.5px; font-weight:700; text-align:left;">Item / Description</th>
            <th style="padding:9px 10px; font-size:11.5px; font-weight:700; width:70px; text-align:center;">SAC</th>
            <th style="padding:9px 10px; font-size:11.5px; font-weight:700; width:50px; text-align:center;">Qty</th>
            <th style="padding:9px 10px; font-size:11.5px; font-weight:700; width:90px; text-align:right;">Rate</th>
            <th style="padding:9px 10px; font-size:11.5px; font-weight:700; width:100px; text-align:right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRowsHTML}
        </tbody>
      </table>

      <!-- Summary & Taxes -->
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:24px;">
        <div style="flex:1; max-width:55%; padding-right:16px;">
          <div style="font-size:11.5px; font-weight:600; color:#4b5563; margin-bottom:4px;">Amount in Words:</div>
          <div style="font-size:12px; font-weight:700; color:#111827; background:#f9fafb; padding:8px 12px; border-radius:4px; border:1px solid #e5e7eb;">
            ${numberToIndianWords(total)}
          </div>
          <div style="font-size:10.5px; color:#6b7280; margin-top:10px; line-height:1.4;">
            * This is an isolated department folio under Multi-Department Billing Separation.<br/>
            * Applicable GST is accounted under SAC ${sacCode}.
          </div>
        </div>

        <div style="width:240px; background:#f9fafb; border:1px solid #e5e7eb; border-radius:6px; padding:12px 16px;">
          <div style="display:flex; justify-content:space-between; font-size:12px; padding:3px 0; color:#4b5563;">
            <span>Total Qty:</span>
            <span style="font-weight:600; color:#111827;">${totalQty}</span>
          </div>
          <div style="display:flex; justify-content:space-between; font-size:12px; padding:3px 0; color:#4b5563;">
            <span>Subtotal:</span>
            <span style="font-weight:600; color:#111827; font-family:monospace;">₹${subtotal.toFixed(2)}</span>
          </div>
          <div style="display:flex; justify-content:space-between; font-size:12px; padding:3px 0; color:#4b5563;">
            <span>CGST (${(bill.cgstRate || 2.5).toFixed(1)}%):</span>
            <span style="font-weight:600; color:#111827; font-family:monospace;">₹${cgst.toFixed(2)}</span>
          </div>
          <div style="display:flex; justify-content:space-between; font-size:12px; padding:3px 0; color:#4b5563;">
            <span>SGST (${(bill.sgstRate || 2.5).toFixed(1)}%):</span>
            <span style="font-weight:600; color:#111827; font-family:monospace;">₹${sgst.toFixed(2)}</span>
          </div>
          ${serviceTax > 0 ? `
            <div style="display:flex; justify-content:space-between; font-size:12px; padding:3px 0; color:#4b5563;">
              <span>Service Tax:</span>
              <span style="font-weight:600; color:#111827; font-family:monospace;">₹${serviceTax.toFixed(2)}</span>
            </div>
          ` : ""}
          <div style="border-top:2px solid #1e3a8a; margin-top:8px; padding-top:8px; display:flex; justify-content:space-between; font-size:14px; font-weight:800; color:#1e3a8a;">
            <span>Total Amount:</span>
            <span style="font-family:monospace;">₹${total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <!-- Signatures -->
      <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-top:40px; padding-top:20px; border-top:1px dashed #d1d5db;">
        <div style="text-align:center; width:180px;">
          <div style="border-bottom:1px solid #111827; height:32px;"></div>
          <div style="font-size:11px; font-weight:600; color:#4b5563; margin-top:6px;">Guest Signature</div>
        </div>
        <div style="text-align:center; width:180px;">
          <div style="border-bottom:1px solid #111827; height:32px;"></div>
          <div style="font-size:11px; font-weight:600; color:#4b5563; margin-top:6px;">Authorized Signatory</div>
        </div>
      </div>
    </div>
  `;

  // Remove existing iframe if any
  const existingIframe = document.getElementById("deptA4PrintFrame");
  if (existingIframe) {
    document.body.removeChild(existingIframe);
  }

  // Create isolated invisible iframe
  const iframe = document.createElement("iframe");
  iframe.id = "deptA4PrintFrame";
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
        <title>Department-Folio-${folioId}</title>
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
}
