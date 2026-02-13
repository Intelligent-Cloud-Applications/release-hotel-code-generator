
import { useState } from "react";
import Navbar from "../components/Navbar.jsx";
import FooterSection from "../components/FooterSection.jsx";
import bgTexture from "../assets/Images/bgTexture.png"; // Add a subtle noise texture image
import img from "../assets/Images/s3_2.png";
import { Edit2 } from "lucide-react";
import { useEditContext } from "../context/EditModeContext.jsx";
import ImageUploadModal from "../components/ui/ImageUploadModal.jsx";
import { motion } from "framer-motion";
import { useInstitutionContext } from "../context/InstitutionContext.jsx";


const Restaurant = () => {
  const { institutionData, setInstitutionData } = useInstitutionContext();
  const { isEditMode } = useEditContext();
  const [isImageEdit, setIsImageEdit] = useState(false);
  const [imageMetaData, setImageMetaData] = useState({});

  // Get restaurant data with fallbacks
  const restaurantSection = institutionData?.restaurantSection || {};

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
        {/* <div
          className="absolute inset-0 w-full h-full z-0 pointer-events-none"
          style={{
            backgroundImage: `url(${bgTexture})`,
            backgroundRepeat: "repeat",
            backgroundSize: "800px 800px",
            opacity: 0.15,
            mixBlendMode: "multiply",
          }}
        ></div> */}
        <Navbar />

        {/* About Section */}
        <div className="min-h-scree px-4 md:px-16 py-32">
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
                value={restaurantSection?.tagline1 || "Restaurant at"}
                onChange={(e) => {
                  setInstitutionData({
                    ...institutionData,
                    restaurantSection: {
                      ...restaurantSection,
                      tagline1: e.target.value,
                    },
                  });
                }}
                className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 tracking-widest uppercase mb-4 bg-white/60 md:bg-transparent border-2 border-gray-400 border-dashed outline-none text-center w-full p-2 md:p-0"
                style={{
                  fontFamily: "Ogg",
                  fontWeight: 400,
                  letterSpacing: "0.2em",
                }}
                placeholder="Section tagline..."
              />
            ) : (
              <h1
                className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#D4AF37] tracking-widest uppercase mb-4"
                style={{
                  fontFamily: "Ogg",
                  fontWeight: 400,
                  letterSpacing: "0.2em",
                }}
              >
                {restaurantSection?.tagline1 || "RESTAURANT AT"}
              </h1>
            )}
            {isEditMode ? (
              <input
                type="text"
                value={restaurantSection?.tagline2 || "Amrapalli Classic"}
                onChange={(e) => {
                  setInstitutionData({
                    ...institutionData,
                    restaurantSection: {
                      ...restaurantSection,
                      tagline2: e.target.value,
                    },
                  });
                }}
                className="text-3xl sm:text-4xl md:text-6xl font-bold text-gray-800 tracking-widest uppercase bg-white/60 md:bg-transparent border-2 border-gray-400 border-dashed outline-none text-center w-full p-2 md:p-0"
                style={{
                  fontFamily: "Ogg",
                  fontWeight: 400,
                  letterSpacing: "0.15em",
                }}
                placeholder="Main title..."
              />
            ) : (
              <h2
                className="text-3xl sm:text-4xl md:text-6xl font-bold text-gray-800 tracking-widest uppercase"
                style={{
                  fontFamily: "Ogg",
                  fontWeight: 400,
                  letterSpacing: "0.15em",
                }}
              >
                {restaurantSection?.tagline2 || "AMRAPALLI CLASSIC"}
              </h2>
            )}
          </motion.div>

          {/* Content Container */}
          <div className="max-w-7xl mx-auto">
            {/* Restaurant Image */}
            <motion.div 
              className="w-full mb-12 relative group z-10"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
            >
              <img
                src={restaurantSection?.img || img}
                alt="Restaurant at Amrapalli Classic"
                className="w-full h-[260px] sm:h-[340px] md:h-[500px] object-cover rounded-lg shadow-2xl"
              />
              {isEditMode && (
                <button
                  onClick={() => {
                    setImageMetaData({
                      onUploadComplete: (imageUrl) => {
                        setInstitutionData({
                          ...institutionData,
                          restaurantSection: {
                            ...restaurantSection,
                            img: imageUrl,
                          },
                        });
                        setIsImageEdit(false);
                      },
                      folderName: "restaurant",
                      acceptedTypes: ["image/jpeg", "image/jpg", "image/png"],
                      title: "Upload Restaurant Image",
                    });
                    setIsImageEdit(true);
                  }}
                  className="absolute top-3 right-3 md:top-4 md:right-4 bg-white rounded-full p-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 shadow-lg z-[200] hover:bg-gray-100"
                >
                  <Edit2 className="w-4 h-4 text-gray-600" />
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
                  value={restaurantSection?.description || ""}
                  onChange={(e) => {
                    setInstitutionData({
                      ...institutionData,
                      restaurantSection: {
                        ...restaurantSection,
                        description: e.target.value,
                      },
                    });
                  }}
                  className="w-full text-gray-600 leading-relaxed text-base md:text-lg bg-white/60 md:bg-transparent border-2 border-gray-400 border-dashed outline-none p-4 resize-y sm:resize-none"
                  style={{
                    fontFamily: "Arial, sans-serif",
                    lineHeight: "1.8",
                    textAlign: "justify",
                    textJustify: "inter-word",
                  }}
                  rows="8"
                  placeholder="Enter restaurant description..."
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
                  {restaurantSection?.description || "Indulge in a culinary journey at our restaurant, where we serve a blend of local and international cuisines prepared by our expert chefs. Experience fine dining in a luxurious setting with impeccable service."}
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

export default Restaurant;
