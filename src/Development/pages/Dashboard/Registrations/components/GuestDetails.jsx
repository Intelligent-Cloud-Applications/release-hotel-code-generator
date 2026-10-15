import React from "react";
import { Input } from "../../../../components/ui/input.js";

const GuestDetails = ({
  billData,
  guestData,
  isAmountEditing,
  setGuestData,
}) => {
  const toTitleCase = (str) => {
    if (!str) return "";
    return str
      .toLowerCase()
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  if (!guestData) {
    return (
      <div className="mb-4 mt-2">
        <h3 className="font-bold text-black mb-2 text-base">
          Guest & Booking Details
        </h3>
        <div className="text-sm text-gray-500">Loading details...</div>
      </div>
    );
  }

  const gstInDisplay =
    billData.bookingDetails?.companyName &&
    billData.bookingDetails.companyName !== "N/A" &&
    billData.bookingDetails.companyGstNo &&
    billData.bookingDetails.companyGstNo !== "N/A"
      ? billData.bookingDetails.companyGstNo
      : "";

  const companyNameDisplay =
    billData.bookingDetails?.companyName &&
    billData.bookingDetails.companyName !== "N/A"
      ? billData.bookingDetails.companyName
      : "";

  const grcNumber = billData.bookingDetails?.grc_no || "";
  console.log("GRC Number in GuestDetails:",billData);

  return (
    <div className="mb-4 mt-2">
      <h3 className="font-bold text-black mb-2 text-base">
        Guest & Booking Details
      </h3>

      <div className="mt-1">
        <table className="w-full text-sm border border-black border-collapse">
          <tbody>
            {/* Guest Name + GRC Number */}
            <tr className="border-b border-black">
              <td className="bg-gray-100 px-3 py-2 font-semibold border-r border-black">
                Guest Name
              </td>
              <td className="px-3 py-2 border-r border-black">
                {isAmountEditing ? (
                  <Input
                    type="text"
                    value={guestData.full_name || ""}
                    placeholder="Guest Name"
                    onChange={(e) =>
                      setGuestData((prev) => ({
                        ...prev,
                        full_name: e.target.value,
                      }))
                    }
                  />
                ) : (
                  <span>{toTitleCase(guestData.full_name || "---")}</span>
                )}
              </td>
              <td className="bg-gray-100 px-3 py-2 font-semibold border-r border-black">
                GRC Number
              </td>
              <td className="px-3 py-2">{grcNumber || "---"}</td>
            </tr>

            {/* Address + Pax (No. of Persons) */}
            <tr className="border-b border-black align-top">
              <td className="bg-gray-100 px-3 py-2 font-semibold border-r border-black">
                Address
              </td>
              <td className="px-3 py-2 border-r border-black">
                {isAmountEditing ? (
                  <>
                    <Input
                      type="text"
                      className="mb-2"
                      value={guestData.address || ""}
                      placeholder="Address"
                      onChange={(e) =>
                        setGuestData((prev) => ({
                          ...prev,
                          address: e.target.value,
                        }))
                      }
                    />
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        className="w-1/3"
                        value={guestData.city || ""}
                        placeholder="City"
                        onChange={(e) =>
                          setGuestData((prev) => ({
                            ...prev,
                            city: e.target.value,
                          }))
                        }
                      />
                      <Input
                        type="text"
                        className="w-1/3"
                        value={guestData.state || ""}
                        placeholder="State"
                        onChange={(e) =>
                          setGuestData((prev) => ({
                            ...prev,
                            state: e.target.value,
                          }))
                        }
                      />
                      <Input
                        type="text"
                        className="w-1/3"
                        value={guestData.pincode || ""}
                        placeholder="Pin Code"
                        onChange={(e) =>
                          setGuestData((prev) => ({
                            ...prev,
                            pincode: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </>
                ) : (
                  <span>
                    {guestData.address || "---"}, {guestData.city || "---"},{" "}
                    {guestData.state || "---"} - {guestData.pincode || "---"}
                  </span>
                )}
              </td>

              {/* Pax (No. of Persons) */}
              <td className="bg-gray-100 px-3 py-2 font-semibold border-r border-black">
                Pax (No. of Adults)
              </td>
              <td className="px-3 py-2">
                <span>{billData.bookingDetails?.no_of_adults || "---"}</span>
                {Array.isArray(billData.extraPaxList) && billData.extraPaxList.length > 0 && (
                  <div className="text-[11px] text-gray-700 mt-0.5">
                    <span className="font-semibold text-gray-900">Extra Occupant(s): </span>
                    {billData.extraPaxList.map((p) => p.full_name).filter(Boolean).join(", ")}
                  </div>
                )}
              </td>
            </tr>

            {/* Room No + Room Type */}
            <tr className="border-b border-black">
              <td className="bg-gray-100 px-3 py-2 font-semibold border-r border-black">
                Room Number
              </td>
              <td className="px-3 py-2 border-r border-black">
                {billData.bookingDetails?.roomNumber || "---"}
              </td>
              <td className="bg-gray-100 px-3 py-2 font-semibold border-r border-black">
                Room Type
              </td>
              <td className="px-3 py-2">
                {billData.bookingDetails?.roomType || "---"}
              </td>
            </tr>

            {/* Rate Plan + Nights */}
            <tr className="border-b border-black">
              <td className="bg-gray-100 px-3 py-2 font-semibold border-r border-black">
                Rate Plan
              </td>
              <td className="px-3 py-2 border-r border-black">
                {billData.bookingDetails?.ratePlanName || "---"}
              </td>
              <td className="bg-gray-100 px-3 py-2 font-semibold border-r border-black">
                Nights/Days
              </td>
              <td className="px-3 py-2">
                {billData.bookingDetails?.numberOfNights || "---"}
              </td>
            </tr>

            {/* Arrival + Departure */}
            <tr className="border-b border-black">
              <td className="bg-gray-100 px-3 py-2 font-semibold border-r border-black">
                Arrival Date & Time
              </td>
              <td className="px-3 py-2 border-r border-black">
                {billData.bookingDetails?.checkIn
                  ? `${new Date(
                      billData.bookingDetails.checkIn
                    ).toLocaleDateString("en-GB")} ${new Date(
                      billData.bookingDetails.checkIn
                    ).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}`
                  : "---"}
              </td>
              <td className="bg-gray-100 px-3 py-2 font-semibold border-r border-black">
                Departure Date & Time
              </td>
              <td className="px-3 py-2">
                {billData.bookingDetails?.checkOut
                  ? `${new Date(
                      billData.bookingDetails.checkOut
                    ).toLocaleDateString("en-GB")} ${new Date(
                      billData.bookingDetails.checkOut
                    ).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}`
                  : "---"}
              </td>
            </tr>

            {/* Company Name + GSTIN */}
            {gstInDisplay && (
              <tr className="border-b border-black">
                <td className="bg-gray-100 px-3 py-2 font-semibold border-r border-black">
                  Company Name
                </td>
                <td className="px-3 py-2 border-r border-black">
                  {companyNameDisplay}
                </td>
                <td className="bg-gray-100 px-3 py-2 font-semibold border-r border-black">
                  GST No.
                </td>
                <td className="px-3 py-2">{gstInDisplay}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GuestDetails;
