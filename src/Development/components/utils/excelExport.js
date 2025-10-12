import * as XLSX from "xlsx";

/**
 * Exports data to an Excel file and triggers a download
 *
 * @param {Array} data - The data to export (array of objects)
 * @param {string} fileName - Name of the file to be downloaded (without extension)
 * @param {string} sheetName - Name of the Excel sheet
 * @returns {void}
 */
export const exportToExcel = (data, fileName, sheetName) => {
  // Handle empty data case
  if (!data || data.length === 0) {
    return;
  }

  try {
    // Create a worksheet from the data
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Create a workbook and add the worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Generate the Excel file as binary string
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    // Create a Blob from the buffer
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    // Create download link and trigger download
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName}.xlsx`;
    a.click();

    // Clean up
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error exporting data to Excel:", error);
  }
};

export const exportGuestsToExcel = (
  data,
  fileName = "guest-data",
  sheetName = "Guests"
) => {
  const flattenedData = data.map((guest) => ({
    "Internal ID": guest.guest_id,
    "Customer ID Type": guest.id_proof_type,
    "Customer ID Number": guest.id_proof_number,
    "Customer Name": guest.full_name,
    "Nationality": guest.nationality,
    "Email": guest.email,
    "Phone": guest.mobile,
    "Address": guest.address,
    "City": guest.city,
    "State": guest.state,
    "Country": guest.country,
    "Pincode": guest.pincode,
  }));
  exportToExcel(flattenedData, fileName, sheetName);
};

export const exportRoomsToExcel = (
  data,
  fileName = "room-data",
  sheetName = "Rooms"
) => {
  // const flattenedData = data.map(guest => ({
  //   'Customer ID': guest.customerName.id,
  //   'Customer Name': guest.customerName.name,
  //   'Email': guest.contact.email,
  //   'Phone': guest.contact.phone,
  //   'Purchases': guest.purchases,
  //   'Check In': guest.checkInandCheckOut.checkIn,
  //   'Check Out': guest.checkInandCheckOut.checkOut,
  //   'Address': guest.address
  // }));
  const flattenedData = data.map((room) => ({
    ...room,
    // services: room.services.map((service) => service.productType).join(", "),
  }));
  exportToExcel(flattenedData, fileName, sheetName);
};

export const exportStaffsToExcel = (
  data,
  fileName = "staff-data",
  sheetName = "Staffs"
) => {
  const flattenedData = data.map((staff) => {
    const roleVal = Array.isArray(staff.role) ? staff.role.join(', ') : staff.role;
    return {
      "Staff ID": staff.staff_id,
      "Staff Name": staff.name,
      "Role": roleVal,
      "Email": staff.email,
      "Phone": staff.mobile,
      "Active": staff.is_active,
    };
  });
  exportToExcel(flattenedData, fileName, sheetName);
};