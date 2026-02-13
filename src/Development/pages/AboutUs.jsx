import { useState } from "react";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar.jsx";
import FooterSection from "../components/FooterSection.jsx";
import bgTexture from "../assets/Images/bgTexture.png"; // Add a subtle noise texture image
import img from "../assets/Images/s3_1.png";
import { Edit2 } from "lucide-react";
import { useEditContext } from "../context/EditModeContext.jsx";
import ImageUploadModal from "../components/ui/ImageUploadModal.jsx";
import { useInstitutionContext } from "../context/InstitutionContext.jsx";

const AboutUs = () => {
  const { institutionData, setInstitutionData } = useInstitutionContext();
  const { isEditMode } = useEditContext();
  const [isImageEdit, setIsImageEdit] = useState(false);
  const [imageMetaData, setImageMetaData] = useState({});

  // Get aboutus data with fallbacks
  const aboutusSection = institutionData?.aboutusSection || {};

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
      <div className="relative bg-champagne z-50 ">
        {/* Warm Gold Tint Overlay */}
        <div className="absolute inset-0 w-full h-full z-0 pointer-events-none bg-gold opacity-5"></div>
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
                value={aboutusSection?.tagline1 || "About"}
                onChange={(e) => {
                  setInstitutionData({
                    ...institutionData,
                    aboutusSection: {
                      ...aboutusSection,
                      tagline1: e.target.value,
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
                className="text-3xl md:text-4xl font-bold text-gold tracking-widest uppercase mb-4"
                style={{
                  fontFamily: "Ogg",
                  fontWeight: 400,
                  letterSpacing: "0.2em",
                }}
              >
                {aboutusSection?.tagline1 || "ABOUT"}
              </h1>
            )}
            {isEditMode ? (
              <input
                type="text"
                value={aboutusSection?.tagline2 || "Amrapalli Classic"}
                onChange={(e) => {
                  setInstitutionData({
                    ...institutionData,
                    aboutusSection: {
                      ...aboutusSection,
                      tagline2: e.target.value,
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
                {aboutusSection?.tagline2 || "AMRAPALLI CLASSIC"}
              </h2>
            )}
          </motion.div>

          {/* Content Container */}
          <div className="max-w-7xl mx-auto">
            {/* Hotel Image */}
            <motion.div
              className="w-full mb-12 relative group z-10"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
            >
              <img
                src={aboutusSection?.img || img}
                alt="Hotel Amrapalli Classic Interior"
                className="w-full h-[260px] sm:h-[340px] md:h-[500px] object-cover rounded-lg shadow-2xl"
              />
              {isEditMode && (
                <button
                  onClick={() => {
                    setImageMetaData({
                      onUploadComplete: (imageUrl) => {
                        setInstitutionData({
                          ...institutionData,
                          aboutusSection: {
                            ...aboutusSection,
                            img: imageUrl,
                          },
                        });
                        setIsImageEdit(false);
                      },
                      folderName: "aboutus",
                      acceptedTypes: ["image/jpeg", "image/jpg", "image/png"],
                      title: "Upload About Us Image",
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
                  value={aboutusSection?.description || ""}
                  onChange={(e) => {
                    setInstitutionData({
                      ...institutionData,
                      aboutusSection: {
                        ...aboutusSection,
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
                  rows="10"
                  placeholder="Enter about us description..."
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
                  {aboutusSection?.description ||
                    "We at Hotel Amrapalli Classic(A unit of SKGG Hotels Pvt Ltd) take immense pleasure to offer a newest luxurious and premium Hotel at Bhawanipatna. Located in a peaceful location of Hilltown,Hotel Amrapalli Classic offers serene atmosphere with great scenic views. Our motto is to provide Superior class luxury with great comfort at very affordable price. We have luxurious and spacious Air-conditioned rooms, Centrally Air-conditioned conference and party halls and restaurant and Bar offering great cuisines. Experience premium class service at Hotel Amrapalli Classic,Bhawanipatna"}
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

export default AboutUs;
