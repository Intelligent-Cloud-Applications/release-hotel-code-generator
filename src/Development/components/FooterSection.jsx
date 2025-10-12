import React, { useState } from "react";
import {
  FaFacebookF,
  FaInstagram,
  FaTwitter,
  FaLinkedinIn,
} from "react-icons/fa";
import { IoLocationSharp, IoMail } from "react-icons/io5";
import { FaPhoneAlt } from "react-icons/fa";
import { Edit2, Settings } from "lucide-react";
import { useAppContext } from "../context/AppContext.jsx";
import { useEditContext } from "../context/EditModeContext.jsx";
import LinkManagementModal from "./LinkManagementModal.jsx";

const FooterSection = () => {
  const { institutionData, setInstitutionData } = useAppContext();
  const { isEditMode } = useEditContext();
  
  // Get footer data with fallbacks
  const footerSection = institutionData?.footerSection || {};
  const footerSection1 = footerSection?.footerSection1 || {};
  const footerSection2 = footerSection?.footerSection2 || { title: "Accommodation", links: [] };
  const footerSection3 = footerSection?.footerSection3 || { title: "Amenities", links: [] };
  const footerSection4 = footerSection?.footerSection4 || {};
  const socialMedia = footerSection?.socialMedia || {};
  
  // State for modal
  const [modalOpen, setModalOpen] = useState(false);
  const [currentSection, setCurrentSection] = useState(null);

  // Helper functions
  const updateFooterSection = (sectionKey, updatedData) => {
    setInstitutionData({
      ...institutionData,
        footerSection: {
        ...footerSection,
        [sectionKey]: updatedData,
      },
    });
  };

  const openLinkModal = (sectionKey) => {
    setCurrentSection(sectionKey);
    setModalOpen(true);
  };

  const handleSaveLinks = (updatedLinks) => {
    if (currentSection) {
      const section = footerSection[currentSection] || {};
      updateFooterSection(currentSection, {
        ...section,
        links: updatedLinks,
      });
    }
  };

return (
    <div className="bg-black px-4 md:px-16 pb-4 pt-8 flex flex-col justify-between">
        <div className="flex flex-col items-center justify-center w-full flex-1">
            {isEditMode ? (
              <div className="relative w-full mb-8 md:mb-16 hidden md:block">
                <input
                  type="text"
                  value={footerSection?.tagline}
                  onChange={(e) => {
                    setInstitutionData({
                      ...institutionData,
                        footerSection: {
                        ...footerSection,
                        tagline: e.target.value,
                      },
                    });
                  }}
                  className="montserrat font-[700] w-full text-center uppercase bg-transparent border-2 border-white border-dashed p-4 outline-none"
                  style={{
                    fontFamily: "Montserrat",
                    fontWeight: 700,
                    fontSize: "clamp(32px, 8vw, 124.34px)",
                    lineHeight: "clamp(32px, 8vw, 100px)",
                    letterSpacing: "0.04em",
                    fontVariant: "small-caps",
                    color: "#FFECEC",
                    textShadow:
                        "inset 0px 3.89px 3.89px rgba(179, 137, 137, 0.8), 0px -2px 4px rgba(179, 137, 137, 0.6) inset, 0px 0px 15px rgba(255, 255, 255, 0.2)",
                  }}
                  placeholder="Enter hotel name..."
                />
              </div>
            ) : (
              <h1
                  className="montserrat font-[700] w-full text-center uppercase mb-8 md:mb-16 hidden md:block"
                  style={{
                      fontFamily: "Montserrat",
                      fontWeight: 700,
                      fontSize: "clamp(32px, 8vw, 124.34px)",
                      lineHeight: "clamp(32px, 8vw, 100px)",
                      letterSpacing: "0.04em",
                      fontVariant: "small-caps",
                      color: "#FFECEC",
                      textShadow:
                          "inset 0px 3.89px 3.89px rgba(179, 137, 137, 0.8), 0px -2px 4px rgba(179, 137, 137, 0.6) inset, 0px 0px 15px rgba(255, 255, 255, 0.2)",
                  }}
              >
                  {footerSection?.tagline || "Hotel Amrapalli Classic"}
              </h1>
            )}

            {/* Footer Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-16 w-full max-w-full md:max-w-[70vw] text-white mt-4 md:mt-8">
                {/* Amrapalli Hotel Section */}
                <div className="flex flex-col text-center md:text-left">
                    {isEditMode ? (
                      <input
                        type="text"
                        value={footerSection1?.title || "Amrapalli Hotel"}
                        onChange={(e) => {
                          updateFooterSection("footerSection1", {
                            ...footerSection1,
                            title: e.target.value,
                          });
                        }}
                        className="text-xl md:text-2xl font-bold mb-4 md:mb-6 bg-transparent border-2 border-white border-dashed p-2 outline-none text-center md:text-left"
                        style={{ fontFamily: "Ogg" }}
                        placeholder="Section title..."
                      />
                    ) : (
                      <h2
                          className="text-xl md:text-2xl font-bold mb-4 md:mb-6"
                          style={{ fontFamily: "Ogg" }}
                      >
                          {footerSection1?.title || "Amrapalli Hotel"}
                      </h2>
                    )}
                    {isEditMode ? (
                      <textarea
                        value={footerSection1?.description || "Experience luxury redefined through innovative glassmorphism architecture"}
                        onChange={(e) => {
                          updateFooterSection("footerSection1", {
                            ...footerSection1,
                            description: e.target.value,
                          });
                        }}
                        className="text-sm leading-relaxed mb-4 md:mb-6 bg-transparent border-2 border-white border-dashed p-2 outline-none resize-none text-center md:text-left"
                        style={{ fontFamily: "Poppins", fontWeight: 300 }}
                        rows="3"
                        placeholder="Section description..."
                      />
                    ) : (
                      <p
                          className="text-sm leading-relaxed mb-4 md:mb-6"
                          style={{ fontFamily: "Poppins", fontWeight: 300 }}
                      >
                          {footerSection1?.description || "Experience luxury redefined through innovative glassmorphism architecture"}
                      </p>
                    )}
                    <div className="flex gap-4 justify-center md:justify-start">
                        {isEditMode ? (
                          <>
                            <input
                              type="url"
                              value={socialMedia?.facebook || ""}
                              onChange={(e) => {
                                setInstitutionData({
                                  ...institutionData,
                                  template2: {
                                    ...institutionData.template2,
                                    footerSection: {
                                      ...footerSection,
                                      socialMedia: {
                                        ...socialMedia,
                                        facebook: e.target.value,
                                      },
                                    },
                                  },
                                });
                              }}
                              className="w-8 h-8 bg-transparent border border-white border-dashed rounded text-xs p-1 outline-none"
                              placeholder="Facebook URL"
                              title="Facebook URL"
                            />
                            <input
                              type="url"
                              value={socialMedia?.instagram || ""}
                              onChange={(e) => {
                                setInstitutionData({
                                  ...institutionData,
                                  template2: {
                                    ...institutionData.template2,
                                    footerSection: {
                                      ...footerSection,
                                      socialMedia: {
                                        ...socialMedia,
                                        instagram: e.target.value,
                                      },
                                    },
                                  },
                                });
                              }}
                              className="w-8 h-8 bg-transparent border border-white border-dashed rounded text-xs p-1 outline-none"
                              placeholder="Instagram URL"
                              title="Instagram URL"
                            />
                            <input
                              type="url"
                              value={socialMedia?.twitter || ""}
                              onChange={(e) => {
                                setInstitutionData({
                                  ...institutionData,
                                  template2: {
                                    ...institutionData.template2,
                                    footerSection: {
                                      ...footerSection,
                                      socialMedia: {
                                        ...socialMedia,
                                        twitter: e.target.value,
                                      },
                                    },
                                  },
                                });
                              }}
                              className="w-8 h-8 bg-transparent border border-white border-dashed rounded text-xs p-1 outline-none"
                              placeholder="Twitter URL"
                              title="Twitter URL"
                            />
                            <input
                              type="url"
                              value={socialMedia?.linkedin || ""}
                              onChange={(e) => {
                                setInstitutionData({
                                  ...institutionData,
                                  template2: {
                                    ...institutionData.template2,
                                    footerSection: {
                                      ...footerSection,
                                      socialMedia: {
                                        ...socialMedia,
                                        linkedin: e.target.value,
                                      },
                                    },
                                  },
                                });
                              }}
                              className="w-8 h-8 bg-transparent border border-white border-dashed rounded text-xs p-1 outline-none"
                              placeholder="LinkedIn URL"
                              title="LinkedIn URL"
                            />
                          </>
                        ) : (
                          <>
                            <a href={socialMedia?.facebook || "#"} className="hover:text-gray-300 transition-colors">
                                <FaFacebookF size={20} />
                            </a>
                            <a href={socialMedia?.instagram || "#"} className="hover:text-gray-300 transition-colors">
                                <FaInstagram size={20} />
                            </a>
                            <a href={socialMedia?.twitter || "#"} className="hover:text-gray-300 transition-colors">
                                <FaTwitter size={20} />
                            </a>
                            <a href={socialMedia?.linkedin || "#"} className="hover:text-gray-300 transition-colors">
                                <FaLinkedinIn size={20} />
                            </a>
                          </>
                        )}
                    </div>
                </div>

                {/* Accommodation Section */}
                <div className="flex flex-col text-center md:text-left">
                    <div className="flex items-center justify-between mb-4 md:mb-6">
                      {isEditMode ? (
                        <input
                          type="text"
                          value={footerSection2?.title || "Accommodation"}
                          onChange={(e) => {
                            updateFooterSection("footerSection2", {
                              ...footerSection2,
                              title: e.target.value,
                            });
                          }}
                          className="text-lg md:text-xl font-bold bg-transparent border-2 border-white border-dashed p-1 outline-none flex-1 text-center md:text-left"
                          style={{ fontFamily: "Ogg" }}
                          placeholder="Section title..."
                        />
                      ) : (
                        <h2
                            className="text-lg md:text-xl font-bold"
                            style={{ fontFamily: "Ogg" }}
                        >
                            {footerSection2?.title || "Accommodation"}
                        </h2>
                      )}
                      {isEditMode && (
                        <button
                          onClick={() => openLinkModal("footerSection2")}
                          className="ml-2 bg-white rounded-full p-1 hover:bg-gray-200 transition-colors"
                          title="Manage links"
                        >
                          <Settings className="w-4 h-4 text-black" />
                        </button>
                      )}
                    </div>
                    
                    <ul
                        className="space-y-3 text-sm"
                        style={{ fontFamily: "Poppins", fontWeight: 300 }}
                    >
                        {footerSection2?.links?.length > 0 ? (
                          footerSection2.links.map((link, index) => (
                            <li key={index}>
                              <a href={link.url || "#"} className="hover:text-gray-300 transition-colors">
                                  {link.name}
                              </a>
                            </li>
                          ))
                        ) : isEditMode ? (
                          <li className="text-gray-400 italic">
                            No links added. Click the settings icon to add links.
                          </li>
                        ) : (
                          <>
                            <li>
                                <a href="#" className="hover:text-gray-300 transition-colors">
                                    Panoramic Suite
                                </a>
                            </li>
                            <li>
                                <a href="#" className="hover:text-gray-300 transition-colors">
                                    Balcony Suite
                                </a>
                            </li>
                            <li>
                                <a href="#" className="hover:text-gray-300 transition-colors">
                                    Presidential Suite
                                </a>
                            </li>
                            <li>
                                <a href="#" className="hover:text-gray-300 transition-colors">
                                    Penthouse
                                </a>
                            </li>
                          </>
                        )}
                    </ul>
                </div>

                {/* Amenities Section */}
                <div className="flex flex-col text-center md:text-left">
                    <div className="flex items-center justify-between mb-4 md:mb-6">
                      {isEditMode ? (
                        <input
                          type="text"
                          value={footerSection3?.title || "Amenities"}
                          onChange={(e) => {
                            updateFooterSection("footerSection3", {
                              ...footerSection3,
                              title: e.target.value,
                            });
                          }}
                          className="text-lg md:text-xl font-bold bg-transparent border-2 border-white border-dashed p-1 outline-none flex-1 text-center md:text-left"
                          style={{ fontFamily: "Ogg" }}
                          placeholder="Section title..."
                        />
                      ) : (
                        <h2
                            className="text-lg md:text-xl font-bold"
                            style={{ fontFamily: "Ogg" }}
                        >
                            {footerSection3?.title || "Amenities"}
                        </h2>
                      )}
                      {isEditMode && (
                        <button
                          onClick={() => openLinkModal("footerSection3")}
                          className="ml-2 bg-white rounded-full p-1 hover:bg-gray-200 transition-colors"
                          title="Manage links"
                        >
                          <Settings className="w-4 h-4 text-black" />
                        </button>
                      )}
                    </div>
                    
                    <ul
                        className="space-y-3 text-sm"
                        style={{ fontFamily: "Poppins", fontWeight: 300 }}
                    >
                        {footerSection3?.links?.length > 0 ? (
                          footerSection3.links.map((link, index) => (
                            <li key={index}>
                              <a href={link.url || "#"} className="hover:text-gray-300 transition-colors">
                                  {link.name}
                              </a>
                            </li>
                          ))
                        ) : isEditMode ? (
                          <li className="text-gray-400 italic">
                            No links added. Click the settings icon to add links.
                          </li>
                        ) : (
                          <>
                            <li>
                                <a href="#" className="hover:text-gray-300 transition-colors">
                                    Rooftop Pool
                                </a>
                            </li>
                            <li>
                                <a href="#" className="hover:text-gray-300 transition-colors">
                                    Fine Dining
                                </a>
                            </li>
                            <li>
                                <a href="#" className="hover:text-gray-300 transition-colors">
                                    Luxury Spa
                                </a>
                            </li>
                            <li>
                                <a href="#" className="hover:text-gray-300 transition-colors">
                                    Banquet Hall
                                </a>
                            </li>
                          </>
                        )}
                    </ul>
                </div>

                {/* Contact Section */}
                <div className="flex flex-col text-center md:text-left">
                    {isEditMode ? (
                      <input
                        type="text"
                        value={footerSection4?.title || "Contact"}
                        onChange={(e) => {
                          updateFooterSection("footerSection4", {
                            ...footerSection4,
                            title: e.target.value,
                          });
                        }}
                        className="text-lg md:text-xl font-bold mb-4 md:mb-6 bg-transparent border-2 border-white border-dashed p-1 outline-none text-center md:text-left"
                        style={{ fontFamily: "Ogg" }}
                        placeholder="Section title..."
                      />
                    ) : (
                      <h2
                          className="text-lg md:text-xl font-bold mb-4 md:mb-6"
                          style={{ fontFamily: "Ogg" }}
                      >
                          {footerSection4?.title || "Contact"}
                      </h2>
                    )}
                    <ul
                        className="space-y-3 text-sm"
                        style={{ fontFamily: "Poppins", fontWeight: 300 }}
                    >
                        <li className="flex items-start gap-2 justify-center md:justify-start">
                            <IoLocationSharp size={18} className="mt-0.5 flex-shrink-0" />
                            {isEditMode ? (
                              <input
                                type="text"
                                value={footerSection4?.address || "Odisha, India"}
                                onChange={(e) => {
                                  updateFooterSection("footerSection4", {
                                    ...footerSection4,
                                    address: e.target.value,
                                  });
                                }}
                                className="flex-1 bg-transparent border border-white border-dashed p-1 outline-none text-center md:text-left"
                                placeholder="Address..."
                              />
                            ) : (
                              <span>{footerSection4?.address || "Odisha, India"}</span>
                            )}
                        </li>
                        <li className="flex items-start gap-2 justify-center md:justify-start">
                            <FaPhoneAlt size={16} className="mt-1 flex-shrink-0" />
                            {isEditMode ? (
                              <input
                                type="tel"
                                value={footerSection4?.phone || "+91 98765 43210"}
                                onChange={(e) => {
                                  updateFooterSection("footerSection4", {
                                    ...footerSection4,
                                    phone: e.target.value,
                                  });
                                }}
                                className="flex-1 bg-transparent border border-white border-dashed p-1 outline-none text-center md:text-left"
                                placeholder="Phone number..."
                              />
                            ) : (
                              <span>{footerSection4?.phone || "+91 98765 43210"}</span>
                            )}
                        </li>
                        <li className="flex items-start gap-2 justify-center md:justify-start">
                            <IoMail size={18} className="mt-0.5 flex-shrink-0" />
                            {isEditMode ? (
                              <input
                                type="email"
                                value={footerSection4?.email || "info@amrapallihotel.com"}
                                onChange={(e) => {
                                  updateFooterSection("footerSection4", {
                                    ...footerSection4,
                                    email: e.target.value,
                                  });
                                }}
                                className="flex-1 bg-transparent border border-white border-dashed p-1 outline-none text-center md:text-left"
                                placeholder="Email address..."
                              />
                            ) : (
                              <span>{footerSection4?.email || "info@amrapallihotel.com"}</span>
                            )}
                        </li>
                    </ul>
                </div>
            </div>
        </div>

        {/* Bottom Copyright Section */}
        <div className="w-full border-t border-gray-700 pt-4 md:pt-6 mt-8 md:mt-12">
            <p
                className="text-center text-xs md:text-sm text-gray-400 tracking-wider"
                style={{ fontFamily: "Poppins", fontWeight: 300 }}
            >
                © 2025 Amrapalli Hotel. All rights reserved. | Designed with Tekkzy
            </p>
        </div>

        {/* Link Management Modal */}
        <LinkManagementModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setCurrentSection(null);
          }}
          sectionTitle={currentSection === "footerSection2" ? "Accommodation" : 
                       currentSection === "footerSection3" ? "Amenities" : ""}
          links={currentSection ? footerSection[currentSection]?.links || [] : []}
          onSaveLinks={handleSaveLinks}
        />
    </div>
);
};

export default FooterSection;
