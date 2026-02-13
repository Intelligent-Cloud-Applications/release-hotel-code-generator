import { useState } from "react";
import Navbar from "../components/Navbar.jsx";
import FooterSection from "../components/FooterSection.jsx";
import bgTexture from "../assets/Images/bgTexture.png";
import img from "../assets/Images/bar_interior.png";
import { Edit2 } from "lucide-react";
import { useEditContext } from "../context/EditModeContext.jsx";
import ImageUploadModal from "../components/ui/ImageUploadModal.jsx";
import { motion } from "framer-motion";
import { useInstitutionContext } from "../context/InstitutionContext.jsx";

const Bar = () => {
  const { institutionData, setInstitutionData } = useInstitutionContext();
  const { isEditMode } = useEditContext();
  const [isImageEdit, setIsImageEdit] = useState(false);
  const [imageMetaData, setImageMetaData] = useState({});

  // Get bar data with fallbacks (using unique key 'barSection')
  const barSection = institutionData?.barSection || {};

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
      <div className="relative bg-champagne z-50">
        {/* Warm Gold Tint Overlay */}
        <div className="absolute inset-0 w-full h-full z-0 pointer-events-none bg-gold opacity-5"></div>
        <Navbar />

        {/* Content Section */}
        <div className="min-h-screen px-4 md:px-16 py-32">
          {/* Header */}
          <motion.div
            className="text-center mb-16 relative z-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            {isEditMode ? (
              <input
                type="text"
                value={barSection?.tagline1 || "PREMIUM LOUNGE"}
                onChange={(e) => {
                  setInstitutionData({
                    ...institutionData,
                    barSection: {
                      ...barSection,
                      tagline1: e.target.value,
                    },
                  });
                }}
                className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 tracking-widest uppercase mb-4 bg-white/60 md:bg-transparent border-2 border-gold border-dashed outline-none text-center w-full p-2 md:p-0"
                style={{
                  fontFamily: "Ogg",
                  fontWeight: 400,
                  letterSpacing: "0.2em",
                }}
                placeholder="Section tagline..."
              />
            ) : (
              <h1
                className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 tracking-widest uppercase mb-4"
                style={{
                  fontFamily: "Ogg",
                  fontWeight: 400,
                  letterSpacing: "0.2em",
                }}
              >
                {barSection?.tagline1 || "PREMIUM LOUNGE"}
              </h1>
            )}
            {isEditMode ? (
              <input
                type="text"
                value={barSection?.tagline2 || "The Gold Bar"}
                onChange={(e) => {
                  setInstitutionData({
                    ...institutionData,
                    barSection: {
                      ...barSection,
                      tagline2: e.target.value,
                    },
                  });
                }}
                className="text-3xl sm:text-4xl md:text-6xl font-bold text-gold tracking-widest uppercase bg-white/60 md:bg-transparent border-2 border-gold border-dashed outline-none text-center w-full p-2 md:p-0"
                style={{
                  fontFamily: "Ogg",
                  fontWeight: 400,
                  letterSpacing: "0.15em",
                }}
                placeholder="Main title..."
              />
            ) : (
              <h2
                className="text-3xl sm:text-4xl md:text-6xl font-bold text-gold tracking-widest uppercase"
                style={{
                  fontFamily: "Ogg",
                  fontWeight: 400,
                  letterSpacing: "0.15em",
                  color: "#D4AF37", // Gold Color
                }}
              >
                {barSection?.tagline2 || "THE GOLD BAR"}
              </h2>
            )}
          </motion.div>

          {/* Content Container */}
          <div className="max-w-7xl mx-auto">
            {/* Bar Image */}
            <motion.div
              className="w-full mb-12 relative group z-10"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
            >
              <img
                src={barSection?.img || img}
                alt="Luxury Bar"
                className="w-full h-[260px] sm:h-[340px] md:h-[500px] object-cover rounded-lg shadow-2xl border border-gold/20"
              />
              {isEditMode && (
                <button
                  onClick={() => {
                    setImageMetaData({
                      onUploadComplete: (imageUrl) => {
                        setInstitutionData({
                          ...institutionData,
                          barSection: {
                            ...barSection,
                            img: imageUrl,
                          },
                        });
                        setIsImageEdit(false);
                      },
                      folderName: "bar",
                      acceptedTypes: ["image/jpeg", "image/jpg", "image/png"],
                      title: "Upload Bar Image",
                    });
                    setIsImageEdit(true);
                  }}
                  className="absolute top-3 right-3 md:top-4 md:right-4 bg-white rounded-full p-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 shadow-lg z-[200] hover:bg-gold hover:text-white"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
            </motion.div>

            {/* Description Text */}
            <motion.div
              className="text-center max-w-5xl mx-auto relative z-10"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
            >
              {isEditMode ? (
                <textarea
                  value={barSection?.description || ""}
                  onChange={(e) => {
                    setInstitutionData({
                      ...institutionData,
                      barSection: {
                        ...barSection,
                        description: e.target.value,
                      },
                    });
                  }}
                  className="w-full text-gray-600 leading-relaxed text-base md:text-lg bg-white/60 md:bg-transparent border-2 border-gold border-dashed outline-none p-4 resize-y sm:resize-none"
                  style={{
                    fontFamily: "Arial, sans-serif",
                    lineHeight: "1.8",
                    textAlign: "justify",
                    textJustify: "inter-word",
                  }}
                  rows="8"
                  placeholder="Enter bar description..."
                />
              ) : (
                <p
                  className="text-gray-600 leading-relaxed text-base md:text-lg"
                  style={{
                    fontFamily: "Arial, sans-serif",
                    lineHeight: "1.8",
                    textAlign: "justify",
                    textJustify: "inter-word",
                  }}
                >
                  {barSection?.description ||
                    "Experience the epitome of nightlife sophistication at The Gold Bar. Sip on artisanal cocktails and rare spirits in an ambiance defined by velvet elegance and ambient lighting. Perfect for intimate conversations or celebrating life's victories."}
                </p>
              )}
            </motion.div>
          </div>
        </div>

        <FooterSection />
      </div>
    </>
  );
};

export default Bar;
