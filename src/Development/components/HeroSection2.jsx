import React from "react";
import { motion } from "framer-motion";
import roomImage from "../assets/Images/room1.jpg"; // You'll need to add the room image
import bgTexture from "../assets/Images/bgTexture.png"; // Add a subtle noise texture image
import { FaBowlFood, FaHotel } from "react-icons/fa6";
import { MdOutlineLocalParking } from "react-icons/md";
import { EditModeProvider, useEditContext } from "../context/EditModeContext.jsx";
import { useAppContext } from "../context/AppContext.jsx";
import { useEffect } from "react";
import { Edit2 } from "lucide-react";
import { useInstitutionContext } from "../context/InstitutionContext.jsx";

const HeroSection2 = () => {
  const { institutionData, setInstitutionData } = useInstitutionContext();
  const { isEditMode, setIsEditMode } = useEditContext();

  const heroSection2 = institutionData?.homeSection?.homeSection2;


  return (
    <div className="relative bg-champagne z-50 flex items-center py-8 md:py-16 min-h-[50vh] md:h-[50vh]">
      {/* Subtle Gold Tint Overlay */}
      <div className="absolute inset-0 w-full h-full z-0 bg-gold opacity-5 pointer-events-none"></div>

      <div className="relative h-full mx-auto flex flex-col md:flex-row px-4 items-center justify-between z-20 w-full">
        {/* Left side - Text content */}
        <motion.div
          className="flex flex-col md:flex-row gap-4 md:gap-8 w-full"
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center flex-col poppins gap-4 md:gap-8 w-full md:w-[20vw] justify-center">
            {/* Icon buttons */}
            <div
              className="bg-white px-6 md:px-8 py-2 md:py-3 rounded-3xl text-center pointer-events-auto"
              style={{ boxShadow: "3px 5px 5.3px 0px #00000040" }}
            >
              {isEditMode ? (
                <input
                  type="text"
                  value={heroSection2?.title || "Hotel Amrapalli Classic"}
                  onChange={(e) =>
                    setInstitutionData({
                      ...institutionData,
                      homeSection: {
                        ...institutionData.homeSection,
                        homeSection2: {
                          ...heroSection2,
                          title: e.target.value,
                        },
                      },
                    })
                  }
                  className="bg-transparent border-2 border-gray-400 border-dashed text-gold text-center w-full outline-none font-bold"
                  style={{
                    fontSize: "clamp(14px, 3vw, 16px)",
                  }}
                  placeholder="Hotel name..."
                />
              ) : (
                <p className="text-gold font-bold text-sm md:text-base">
                  {heroSection2?.title || "Hotel Amrapalli Classic"}
                </p>
              )}
            </div>
            <div className="flex flex-row -space-x-4">
              <button
                className="w-[50px] h-[50px] md:w-[68px] md:h-[68px] bg-white rounded-full flex items-center justify-center transition-shadow z-30"
                style={{
                  boxShadow:
                    "0px 8px 16px 0px rgba(0, 0, 0, 0.6), inset 0px 3px 6px rgba(0, 0, 0, 0.3)",
                }}
              >
                <FaHotel className="w-5 h-5 md:w-7 md:h-7 text-gold" />
              </button>
              <button
                className="w-[50px] h-[50px] md:w-[68px] md:h-[68px] bg-white rounded-full flex items-center justify-center transition-shadow z-20"
                style={{
                  boxShadow:
                    "0px 8px 16px 0px rgba(0, 0, 0, 0.6), inset 0px 3px 6px rgba(0, 0, 0, 0.3)",
                }}
              >
                <MdOutlineLocalParking className="w-5 h-5 md:w-7 md:h-7 text-gold" />
              </button>
              <button
                className="w-[50px] h-[50px] md:w-[68px] md:h-[68px] bg-white rounded-full flex items-center justify-center transition-shadow z-10"
                style={{
                  boxShadow:
                    "0px 8px 16px 0px rgba(0, 0, 0, 0.6), inset 0px 3px 6px rgba(0, 0, 0, 0.3)",
                }}
              >
                <FaBowlFood className="w-5 h-5 md:w-7 md:h-7 text-gold" />
              </button>
            </div>
          </div>

          <div
            className="w-full md:w-[70vw] text-center md:text-left mt-4 md:mt-0 pointer-events-auto"
            style={{
              fontFamily: "Poppins",
              fontWeight: 500,
              fontStyle: "normal",
              fontSize: "clamp(16px, 4vw, 65px)",
              lineHeight: "clamp(24px, 5vw, 80px)",
              letterSpacing: "0%",
              paddingRight: "1rem",
              paddingLeft: "1rem",
            }}
          >
            {isEditMode ? (
              <textarea
                value={heroSection2?.subtitle || "with comfort, offering stunning views Where elegance meets modern luxury"}
                onChange={(e) =>
                  setInstitutionData({
                    ...institutionData,
                    homeSection: {
                      ...institutionData.homeSection,
                      homeSection2: {
                        ...heroSection2,
                        subtitle: e.target.value,
                      },
                    },
                  })
                }
                className="bg-transparent border-2 border-gray-400 border-dashed text-black w-full outline-none font-[400] resize-none"
                style={{
                  fontSize: "clamp(16px, 4vw, 65px)",
                  lineHeight: "clamp(24px, 5vw, 80px)",
                  fontFamily: "Poppins",
                }}
                rows={3}
                placeholder="Enter subtitle text..."
              />
            ) : (
              <p>
                <span className="font-[400]">
                  {heroSection2?.subtitle?.split(' ').slice(0, -7).join(' ') || "with comfort, offering stunning views"}
                </span>
                <div className="relative inline-block mx-2 md:mx-3 group">
                  <img
                    src={heroSection2?.roomImage || roomImage}
                    alt="Background"
                    className="w-20 h-8 md:w-55 md:h-18 rounded-4xl object-cover"
                  />
                  {isEditMode && (
                    <button
                      onClick={() => {
                        // Add image upload functionality here if needed
                        console.log('Room image edit clicked');
                      }}
                      className="absolute top-0 right-0 bg-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-auto z-10 shadow-lg"
                    >
                      <Edit2 className="w-3 h-3 text-gray-600" />
                    </button>
                  )}
                </div>
                <span
                  className="font-[400] block md:inline mt-2 md:mt-0"
                  style={{
                    background: "linear-gradient(to right, #C5A059, #b8860b)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  {heroSection2?.subtitle?.split(' ').slice(-7).join(' ') || "offering stunning views Where elegance"}
                </span>
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default HeroSection2;
