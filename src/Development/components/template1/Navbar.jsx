import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useEditContext } from "../../context/EditModeContext.jsx";
import { useInstitutionContext } from "../../context/InstitutionContext.jsx";
import { Button } from "../ui/button.js";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { isEditMode } = useEditContext();
  const { institutionData, setInstitutionData } = useInstitutionContext();

  const navigate = useNavigate();

  return (
    <nav className="flex justify-between items-center p-4 w-full h-20 bg-transparent relative">
      {/* Hamburger menu icon - visible on mobile only */}
      <div
        className="text-2xl cursor-pointer text-gray-700 hover:text-gray-900 transition-colors md:hidden ml-auto"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="block w-6 h-0.5 bg-gray-700 mb-1.5"></span>
        <span className="block w-6 h-0.5 bg-gray-700 mb-1.5"></span>
        <span className="block w-6 h-0.5 bg-gray-700"></span>
      </div>

      {/* Hidden spacer for mobile layout */}
      <div className="md:hidden"></div>

      {/* Centered company info */}
      <Link
        to="/"
        className="absolute left-1/2 transform -translate-x-1/2 flex items-center z-10"
      >
        {/* CN and Company Name side by side */}
        <div className="flex items-center">
          {isEditMode ? (
            <input
              type="text"
              value={institutionData?.cnText}
              onChange={(e) => {
                setInstitutionData((institutionData) => {
                  return {
                    ...institutionData,
                    cnText: e.target.value,
                  };
                });
              }}
              className="text-4xl md:text-5xl font-bold text-black fjalla bg-white border border-gray-300 rounded px-2 py-1 w-16"
            />
          ) : (
            <span className="text-4xl md:text-5xl font-bold text-black fjalla">
              {institutionData?.cnText || "CN"}
            </span>
          )}
          <div className="ml-2 flex flex-col justify-center h-full">
            {isEditMode ? (
              <input
                type="text"
                value={institutionData?.companyName}
                onChange={(e) => {
                  setInstitutionData((institutionData) => {
                    return {
                      ...institutionData,
                      companyName: e.target.value,
                    };
                  });
                }}
                className="text-xl md:text-2xl font-medium text-black leading-tight cormorant bg-white border border-gray-300 rounded px-2 py-1 w-full"
              />
            ) : (
              <span className="text-xl md:text-2xl font-medium text-black leading-tight cormorant">
                {institutionData?.companyName || "Company Name"}
              </span>
            )}
            {isEditMode ? (
              <input
                type="text"
                value={institutionData?.slogan}
                onChange={(e) => {
                  setInstitutionData((institutionData) => {
                    return {
                      ...institutionData,
                      slogan: e.target.value,
                    };
                  });
                }}
                className="text-xs md:text-sm leading-wide sugiyama bg-white border border-gray-300 rounded px-2 py-1 w-full"
              />
            ) : (
              <span className="text-xs md:text-sm leading-wide sugiyama">
                {institutionData?.slogan || "Slogan"}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Icons and Buttons - hidden on mobile */}
      <div className="hidden md:flex gap-3 ml-auto items-center">
        {/* Call Icon */}
        <Link to="/contact">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-gray-700 hover:text-gray-900 cursor-pointer transition-colors"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
            />
          </svg>
        </Link>

        {/* Enquire Button */}
        {/*<button className="px-4 py-1.5 rounded text-lg font-bold bg-[#ff8600] text-black border-none cursor-pointer hover:bg-[#e67800] transition-colors cormorant">*/}
        {/*  Enquire*/}
        {/*</button>*/}

        {/* About Us Button */}
        <button
          className="px-4 py-1.5 rounded text-lg font-bold bg-white text-black border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors cormorant"
          onClick={() => navigate("/about")}
        >
          About Us
        </button>
        <Button className="px-4 py-1.5 rounded text-lg font-semibild cursor-pointer" onClick={() => navigate("/book-now")}>Book Now</Button>
      </div>

      {/* Mobile menu dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 w-full bg-white shadow-md p-4 flex flex-col gap-3 z-20 md:hidden">
          {/* Call option with icon */}
          <div className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded transition-colors">
            <Link to="/contact">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-gray-700"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
            </Link>
            <span className="text-gray-700">Call Us</span>
          </div>

          {/* Enquire Button */}
          {/*<button className="w-full px-4 py-2 rounded text-lg font-bold bg-[#ff8600] text-black border-none cursor-pointer hover:bg-[#e67800] transition-colors cormorant">*/}
          {/*  Enquire*/}
          {/*</button>*/}

          {/* About Us Button */}
          <button
            className="w-full px-4 py-2 rounded text-lg font-bold bg-white text-black border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors cormorant"
            onClick={() => navigate("/about")}
          >
            About Us
          </button>
          <Button onClick={() => navigate("/book-now")}>Book Now</Button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;