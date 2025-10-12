import React from "react";
import { Input } from "../../../../components/ui/input.js";
import {
  Select,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "../../../../components/ui/select.js";

const GuestDetails = ({ 
  billData, 
  guestData, 
  isAmountEditing, 
  setGuestData 
}) => {
  // Add null check for guestData
  if (!guestData) {
    return (
      <div className="mb-4 mt-2">
        <h3 className="font-bold text-black mb-2 text-base">
          Guest Details
        </h3>
        <div className="mt-1">
          <div className="text-sm text-gray-500">Loading guest details...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4 mt-2">
      <h3 className="font-bold text-black mb-2 text-base">
        Guest Details
      </h3>
      <div className="mt-1">
        <table className="w-full text-sm guest-booking-table">
          <tbody>
            <tr className="border-b border-black">
              <td className="border-r-1 border-black px-3 py-2 font-semibold bg-gray-100">
                Guest Name
              </td>
              <td className="border-r-1 border-black px-3 py-2">
                {isAmountEditing ? (
                  <Input
                    type="text"
                    className="w-full"
                    value={guestData.full_name || ""}
                    placeholder="Guest Name"
                    onChange={(e) => {
                      setGuestData((prev) => ({
                        ...prev,
                        full_name: e.target.value,
                      }));
                    }}
                  />
                ) : (
                  <span>{guestData.full_name || ""}</span>
                )}
              </td>
              <td className="border-r-1 border-black px-3 py-2 font-semibold bg-gray-100">
                Gender
              </td>
              <td className="px-3 py-2">
                {isAmountEditing ? (
                  <Select
                    value={guestData.gender || ""}
                    onValueChange={(value) => {
                      setGuestData((prev) => ({
                        ...prev,
                        gender: value,
                      }));
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <span>{guestData.gender || ""}</span>
                )}
              </td>
            </tr>
            <tr className="border-b border-black">
              <td className="border-r-1 border-black px-3 py-2 font-semibold bg-gray-100">
                Mobile Number
              </td>
              <td className="border-r-1 border-black px-3 py-2">
                {isAmountEditing ? (
                  <Input
                    type="text"
                    className="w-full"
                    value={guestData.mobile || ""}
                    placeholder="Mobile Number"
                    onChange={(e) => {
                      setGuestData((prev) => ({
                        ...prev,
                        mobile: e.target.value,
                      }));
                    }}
                  />
                ) : (
                  <span>{guestData.mobile || ""}</span>
                )}
              </td>
              <td className="border-r-1 border-black px-3 py-2 font-semibold bg-gray-100">
                Identification Type
              </td>
              <td className="px-3 py-2">
                {isAmountEditing ? (
                  <Select
                    value={guestData.id_proof_type || ""}
                    onValueChange={(value) => {
                      setGuestData((prev) => ({
                        ...prev,
                        id_proof_type: value,
                      }));
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select ID Proof Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Aadhar">Aadhar</SelectItem>
                      <SelectItem value="Passport">Passport</SelectItem>
                      <SelectItem value="Voter ID">Voter ID</SelectItem>
                      <SelectItem value="Driving License">
                        Driving License
                      </SelectItem>
                      <SelectItem value="PAN">PAN Card</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <span>{guestData.id_proof_type || ""}</span>
                )}
              </td>
            </tr>
            <tr className="border-b border-black">
              <td className="border-r-1 border-black px-3 py-2 font-semibold bg-gray-100">
                Email
              </td>
              <td className="border-r-1 border-black px-3 py-2">
                {isAmountEditing ? (
                  <Input
                    type="email"
                    className="w-full"
                    value={guestData.email || ""}
                    placeholder="Email"
                    onChange={(e) => {
                      setGuestData((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }));
                    }}
                  />
                ) : (
                  <span>{guestData.email || "---"}</span>
                )}
              </td>
              <td className="border-r-1 border-black px-3 py-2 font-semibold bg-gray-100">
                Identification No.
              </td>
              <td className="px-3 py-2">
                {isAmountEditing ? (
                  <Input
                    type="text"
                    className="w-full"
                    value={guestData.id_proof_number || ""}
                    placeholder="ID Proof Number"
                    onChange={(e) => {
                      setGuestData((prev) => ({
                        ...prev,
                        id_proof_number: e.target.value,
                      }));
                    }}
                  />
                ) : (
                  <span>{guestData.id_proof_number || ""}</span>
                )}
              </td>
            </tr>
            <tr className=" border-black">
              <td className="border-r-1 border-black px-3 py-2 font-semibold bg-gray-100">
                Address
              </td>
              <td className="border-r-1 border-black px-3 py-2">
                {isAmountEditing ? (
                  <Input
                    type="text"
                    className="w-fit"
                    value={guestData.address || ""}
                    placeholder="Address"
                    onChange={(e) => {
                      setGuestData((prev) => ({
                        ...prev,
                        address: e.target.value,
                      }));
                    }}
                  />
                ) : (
                  <span>{guestData.address || "---"}</span>
                )}
                ,{" "}
                {isAmountEditing ? (
                  <Input
                    type="text"
                    className="w-fit"
                    value={guestData.city || ""}
                    placeholder="City"
                    onChange={(e) => {
                      setGuestData((prev) => ({
                        ...prev,
                        city: e.target.value,
                      }));
                    }}
                  />
                ) : (
                  <span>{guestData.city || "---"}</span>
                )}
                ,{" "}
                {isAmountEditing ? (
                  <Input
                    type="text"
                    className="w-fit"
                    value={guestData.state || ""}
                    placeholder="State"
                    onChange={(e) => {
                      setGuestData((prev) => ({
                        ...prev,
                        state: e.target.value,
                      }));
                    }}
                  />
                ) : (
                  <span>{guestData.state || "---"}</span>
                )}
                ,{" "}
                {isAmountEditing ? (
                  <Input
                    type="text"
                    className="w-fit"
                    value={guestData.pincode || ""}
                    placeholder="Pin Code"
                    onChange={(e) => {
                      setGuestData((prev) => ({
                        ...prev,
                        pincode: e.target.value,
                      }));
                    }}
                  />
                ) : (
                  <span>{guestData.pincode || "---"}</span>
                )}
              </td>
              <td className="border-r-1 border-black px-3 py-2 font-semibold bg-gray-100">
                Nationality
              </td>
              <td className="px-3 py-2">
                {isAmountEditing ? (
                  <Input
                    type="text"
                    className="w-full"
                    value={guestData.nationality || ""}
                    placeholder="Nationality"
                    onChange={(e) => {
                      setGuestData((prev) => ({
                        ...prev,
                        nationality: e.target.value,
                      }));
                    }}
                  />
                ) : (
                  <span>{guestData.nationality || ""}</span>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GuestDetails;
