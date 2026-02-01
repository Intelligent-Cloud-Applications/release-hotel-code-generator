import React, { useState } from "react";
import { useEditContext } from "../../context/EditModeContext.jsx";
import {
  FaSwimmer,
  FaWifi,
  FaCoffee,
  FaDumbbell,
  FaGamepad,
  FaLightbulb,
  FaBath,
  FaParking,
  FaSpa,
  FaUtensils,
  FaTv,
  FaConciergeBell,
} from "react-icons/fa";
import { useInstitutionContext } from "../../context/InstitutionContext.jsx";

const OurFacilities = () => {
  const { institutionData } = useInstitutionContext();
  const { isEditMode } = useEditContext();

  // Fallback data for facilities if not available in JSON
  const defaultFacilities = [
    { name: "Swimming Pool", icon: "FaSwimmer" },
    { name: "Free WiFi", icon: "FaWifi" },
    { name: "Coffee Shop", icon: "FaCoffee" },
    { name: "Fitness Center", icon: "FaDumbbell" },
    { name: "Game Room", icon: "FaGamepad" },
    { name: "Room Service", icon: "FaConciergeBell" },
    { name: "Spa & Wellness", icon: "FaSpa" },
    { name: "Restaurant", icon: "FaUtensils" },
  ];

  // State for editable title and description
  const [title, setTitle] = useState(
    institutionData?.ourFacilities?.title?.start || "Our Premium"
  );
  const [titleHighlight, setTitleHighlight] = useState(
    institutionData?.ourFacilities?.title?.highlight || "Facilities"
  );
  const [description, setDescription] = useState(
    institutionData?.ourFacilities?.description ||
      "Experience world-class amenities designed for your comfort and convenience."
  );

  // State for editable facilities with fallback
  const [facilities, setFacilities] = useState(
    institutionData?.ourFacilities?.facilities?.length > 0
      ? institutionData.ourFacilities.facilities
      : defaultFacilities
  );

  // Available icons for selection
  const iconOptions = [
    { name: "FaSwimmer", component: FaSwimmer },
    { name: "FaWifi", component: FaWifi },
    { name: "FaCoffee", component: FaCoffee },
    { name: "FaDumbbell", component: FaDumbbell },
    { name: "FaGamepad", component: FaGamepad },
    { name: "FaLightbulb", component: FaLightbulb },
    { name: "FaBath", component: FaBath },
    { name: "FaParking", component: FaParking },
    { name: "FaSpa", component: FaSpa },
    { name: "FaUtensils", component: FaUtensils },
    { name: "FaTv", component: FaTv },
    { name: "FaConciergeBell", component: FaConciergeBell },
  ];

  // Map icon name to component
  const getIconComponent = (iconName) => {
    const icon = iconOptions.find((opt) => opt.name === iconName);
    return icon ? icon.component : FaSwimmer; // Default to FaSwimmer if not found
  };

  // Handle facility name and icon changes
  const handleFacilityChange = (index, field, value) => {
    const updatedFacilities = [...facilities];
    updatedFacilities[index] = { ...updatedFacilities[index], [field]: value };
    setFacilities(updatedFacilities);
  };

  return (
    <div className="py-20 px-6 md:px-20 bg-gradient-to-br from-slate-50 via-white to-blue-50 relative max-w-screen">
      {/* Background decorative elements */}


      <div className="max-w-7xl mx-auto text-center relative z-10">
        {isEditMode ? (
          <div className="flex justify-center items-center gap-2 mb-6">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-4xl md:text-5xl fjalla text-gray-900 border-2 border-orange-200 rounded-xl px-3 py-2 text-center bg-white/80 backdrop-blur-sm shadow-lg focus:border-orange-400 focus:ring-4 focus:ring-orange-100 transition-all duration-300"
              style={{ width: `${title.length + 4}ch` }}
            />
            <input
              type="text"
              value={titleHighlight}
              onChange={(e) => setTitleHighlight(e.target.value)}
              className="text-4xl md:text-5xl fjalla text-gold border-2 border-gold/30 rounded-xl px-3 py-2 text-center bg-white/80 backdrop-blur-sm shadow-lg focus:border-gold focus:ring-4 focus:ring-gold/20 transition-all duration-300"
              style={{ width: `${titleHighlight.length + 2}ch` }}
            />
          </div>
        ) : (
          <div className="mb-6">
            <h2 className="text-4xl md:text-6xl fjalla leading-tight">
              <span className="text-gray-900 drop-shadow-sm">{title}</span>
              <span className="text-gold ml-3 drop-shadow-sm">
                {titleHighlight}
              </span>
            </h2>
            <div className="w-24 h-1 bg-gold mx-auto mt-4 rounded-full"></div>
          </div>
        )}

        {isEditMode ? (
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="text-gray-700 mt-4 text-lg cormorant border-2 border-gray-200 rounded-xl px-4 py-3 w-full max-w-2xl mx-auto bg-white/80 backdrop-blur-sm shadow-lg focus:border-orange-400 focus:ring-4 focus:ring-orange-100 transition-all duration-300 resize-none"
            rows="3"
          />
        ) : (
          <p className="text-gray-700 mt-6 text-lg md:text-xl cormorant leading-relaxed max-w-3xl mx-auto font-medium">
            {description}
          </p>
        )}

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {facilities && facilities.length > 0 ? (
            facilities.map((facility, index) => (
              <div
                key={index}
                className="group bg-white/80 backdrop-blur-sm p-8 rounded-2xl text-center shadow-xl border border-white/20 aspect-square flex flex-col justify-center hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 ease-out hover:bg-gradient-to-br hover:from-white hover:to-orange-50 relative overflow-hidden"
              >
                
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>

                <div className="relative z-10">
                  <div className="w-16 h-16 mx-auto mb-6 p-3 bg-gradient-to-br from-orange-100 to-red-100 rounded-2xl group-hover:from-orange-200 group-hover:to-red-200 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 shadow-lg">
                    {React.createElement(getIconComponent(facility.icon), {
                      className:
                        "w-full h-full text-gray-700 group-hover:text-gold transition-colors duration-500",
                    })}
                  </div>
                  <h3 className="text-gray-800 font-semibold text-lg cormorant group-hover:text-gray-900 transition-colors duration-300 leading-relaxed">
                    {facility.name}
                  </h3>
                </div>

                <div className="absolute top-0 right-0 w-0 h-0 border-l-[20px] border-l-transparent border-t-[20px] border-t-gold/30 group-hover:border-t-gold/50 transition-colors duration-300"></div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 text-lg">No facilities data available</p>
            </div>
          )}
        </div>

                      
      </div>
    </div>
  );
};

export default OurFacilities;
