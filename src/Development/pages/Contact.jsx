
import React, { useState } from "react";
import LegacySection from "../components/LegacySection.jsx";
import TopPicksSection from "../components/TopPicksSection.jsx";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import FooterSection from "../components/FooterSection.jsx";
import bgTexture from "../assets/Images/bgTexture.png"; // Add a subtle noise texture image
import img from "../assets/Images/s3_1.png";
import { Edit2 } from "lucide-react";
import { useAppContext } from "../context/AppContext.jsx";
import { useEditContext } from "../context/EditModeContext.jsx";
import ImageUploadModal from "../components/ui/ImageUploadModal.jsx";
import { motion } from "framer-motion";

const Contact = () => {
  const { institutionData, setInstitutionData } = useAppContext();
  const { isEditMode } = useEditContext();
  const [isImageEdit, setIsImageEdit] = useState(false);
  const [imageMetaData, setImageMetaData] = useState({});

  // Get contact data with fallbacks
  const contactSection = institutionData?.template2?.contactSection || {};

  return (
      <>
        {isImageEdit && imageMetaData && (
          <ImageUploadModal
            onClose={() => setIsImageEdit(false)}
            onUploadComplete={imageMetaData.onUploadComplete}
            folderName={imageMetaData.folderName}
            acceptedTypes={imageMetaData.acceptedTypes}
            title={imageMetaData.title}
          />
        )}
      <div className="relative bg-[#FBF6F0] z-50 ">
        {/* Noise texture overlay using actual texture image */}
        <div
          className="absolute inset-0 w-full h-full z-0 pointer-events-none"
          style={{
            backgroundImage: `url(${bgTexture})`,
            backgroundRepeat: "repeat",
            backgroundSize: "800px 800px",
            opacity: 0.15,
            mixBlendMode: "multiply",
          }}
        ></div>
        <Navbar />

        {/* Contact Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="min-h-scree px-4 md:px-16 py-32"
        >
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-center mb-16"
          >
            {isEditMode ? (
              <input
                type="text"
                value={contactSection?.tagline1 || "Contact"}
                onChange={(e) => {
                  setInstitutionData({
                    ...institutionData,
                    template2: {
                      ...institutionData.template2,
                      contactSection: {
                        ...contactSection,
                        tagline1: e.target.value,
                      },
                    },
                  });
                }}
                className="text-3xl md:text-4xl font-bold text-gray-800 tracking-widest uppercase mb-4 bg-transparent border-2 border-gray-400 border-dashed outline-none text-center w-full"
                style={{
                  fontFamily: "Ogg",
                  fontWeight: 400,
                  letterSpacing: "0.2em",
                }}
                placeholder="Section tagline..."
              />
            ) : (
              <h1
                className="text-3xl md:text-4xl font-bold text-gray-800 tracking-widest uppercase mb-4"
                style={{
                  fontFamily: "Ogg",
                  fontWeight: 400,
                  letterSpacing: "0.2em",
                }}
              >
                {contactSection?.tagline1 || "CONTACT"}
              </h1>
            )}
            {isEditMode ? (
              <input
                type="text"
                value={contactSection?.tagline2 || "Amrapalli Classic"}
                onChange={(e) => {
                  setInstitutionData({
                    ...institutionData,
                    template2: {
                      ...institutionData.template2,
                      contactSection: {
                        ...contactSection,
                        tagline2: e.target.value,
                      },
                    },
                  });
                }}
                className="text-4xl md:text-6xl font-bold text-gray-800 tracking-widest uppercase bg-transparent border-2 border-gray-400 border-dashed outline-none text-center w-full"
                style={{
                  fontFamily: "Ogg",
                  fontWeight: 400,
                  letterSpacing: "0.15em",
                }}
                placeholder="Main title..."
              />
            ) : (
              <h2
                className="text-4xl md:text-6xl font-bold text-gray-800 tracking-widest uppercase"
                style={{
                  fontFamily: "Ogg",
                  fontWeight: 400,
                  letterSpacing: "0.15em",
                }}
              >
                {contactSection?.tagline2 || "AMRAPALLI CLASSIC"}
              </h2>
            )}
          </motion.div>

    
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="max-w-7xl mx-auto"
          >
            {/* Content: Left image and Right form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 items-start">
              {/* Left: Hotel Image Card */}
              <motion.div 
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, delay: 0.6 }}
                whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                className="relative bg-white/40 rounded-xl md:rounded-2xl overflow-hidden z-10 group"
              >
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    boxShadow: "8px 8px 0px 0px #00000033",
                    borderRadius: "1rem",
                  }}
                />
                <img
                  src={contactSection?.img || img}
                  alt="Hotel Amrapalli Classic"
                  className="w-full h-[360px] md:h-[520px] object-cover rounded-xl md:rounded-2xl relative z-10"
                  style={{ boxShadow: "6px 6px 0px 0px #000000" }}
                />
                {isEditMode && (
                  <button
                    onClick={() => {
                      setImageMetaData({
                        onUploadComplete: (imageUrl) => {
                          setInstitutionData({
                            ...institutionData,
                            template2: {
                              ...institutionData.template2,
                              contactSection: {
                                ...contactSection,
                                img: imageUrl,
                              },
                            },
                          });
                          setIsImageEdit(false);
                        },
                        folderName: "contact",
                        acceptedTypes: ["image/jpeg", "image/jpg", "image/png"],
                        title: "Upload Contact Image",
                      });
                      setIsImageEdit(true);
                    }}
                    className="absolute top-4 right-4 bg-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg z-[200] hover:bg-gray-100"
                  >
                    <Edit2 className="w-4 h-4 text-gray-600" />
                  </button>
                )}
              </motion.div>

              {/* Right: Form Card */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, delay: 0.8 }}
                whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
                className="relative bg-[#d2c9c0] rounded-xl md:rounded-2xl p-5 md:p-8 z-10"
                style={{ boxShadow: "6px 6px 0px 0px #000000" }}
              >
                <h3
                  className="text-xl md:text-2xl font-semibold text-gray-800 mb-4 !z-[1000]"
                  style={{ fontFamily: "Montserrat" }}
                >
                  Send us a Message
                </h3>

                <motion.form 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 1.0 }}
                  className="space-y-4"
                >
                  {/* Full Name */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 1.1 }}
                  >
                    <label className="block text-xs text-gray-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      className="w-full bg-white rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-black/40"
                      placeholder=""
                    />
                  </motion.div>

                  {/* Email and Phone */}
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 1.2 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    <div>
                      <label className="block text-xs text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        className="w-full bg-white rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-black/40"
                        placeholder=""
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-700 mb-1">Phone</label>
                      <input
                        type="tel"
                        className="w-full bg-white rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-black/40"
                        placeholder=""
                      />
                    </div>
                  </motion.div>

                  {/* Inquiry Type */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 1.3 }}
                  >
                    <label className="block text-xs text-gray-700 mb-1">Inquiry Type</label>
                    <div className="relative">
                      <select className="w-full bg-white rounded-md px-3 py-2 appearance-none outline-none focus:ring-2 focus:ring-black/40">
                        <option value="">Select inquiry type</option>
                        <option>Room Booking</option>
                        <option>Event/Conference</option>
                        <option>Restaurant</option>
                        <option>Other</option>
                      </select>
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-600">▾</span>
                    </div>
                  </motion.div>

                  {/* Message */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 1.4 }}
                  >
                    <label className="block text-xs text-gray-700 mb-1">Message</label>
                    <textarea
                      rows={5}
                      className="w-full bg-white rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-black/40 resize-none"
                    />
                  </motion.div>

                  {/* Submit */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 1.5 }}
                  >
                    <motion.button
                      type="button"
                      whileHover={{ 
                        scale: 1.02, 
                        y: -2,
                        boxShadow: "6px 6px 0px 0px #000000"
                      }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                      className="w-full bg-white text-black font-semibold rounded-full py-2"
                      style={{ boxShadow: "4px 4px 0px 0px #000000" }}
                    >
                      Send Message
                    </motion.button>
                  </motion.div>
                </motion.form>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>

        <FooterSection />
      </div>
      </>
  );
};

export default Contact;
