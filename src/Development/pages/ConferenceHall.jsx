import { useState } from "react";
import Navbar from "../components/Navbar.jsx";
import FooterSection from "../components/FooterSection.jsx";
import bgTexture from "../assets/Images/bgTexture.png";
import img from "../assets/Images/conference_hall.png";
import { Edit2 } from "lucide-react";
import { useEditContext } from "../context/EditModeContext.jsx";
import ImageUploadModal from "../components/ui/ImageUploadModal.jsx";
import { motion } from "framer-motion";
import { useInstitutionContext } from "../context/InstitutionContext.jsx";

const ConferenceHall = () => {
  const { institutionData, setInstitutionData } = useInstitutionContext();
  const { isEditMode } = useEditContext();
  const [isImageEdit, setIsImageEdit] = useState(false);
  const [imageMetaData, setImageMetaData] = useState({});

  // Get conference hall data with fallbacks (using unique key 'conferenceHallSection')
  const conferenceHallSection = institutionData?.template2?.conferenceHallSection || {};

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
                value={conferenceHallSection?.tagline1 || "EVENTS & MEETINGS"}
                onChange={(e) => {
                  setInstitutionData({
                    ...institutionData,
                    template2: {
                      ...institutionData.template2,
                      conferenceHallSection: {
                        ...conferenceHallSection,
                        tagline1: e.target.value,
                      },
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
                {conferenceHallSection?.tagline1 || "EVENTS & MEETINGS"}
              </h1>
            )}
            {isEditMode ? (
              <input
                type="text"
                value={conferenceHallSection?.tagline2 || "The Grand Hall"}
                onChange={(e) => {
                  setInstitutionData({
                    ...institutionData,
                    template2: {
                      ...institutionData.template2,
                      conferenceHallSection: {
                        ...conferenceHallSection,
                        tagline2: e.target.value,
                      },
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
                  color: "#D4AF37",
                }}
              >
                {conferenceHallSection?.tagline2 || "THE GRAND HALL"}
              </h2>
            )}
          </motion.div>

          {/* Content Container */}
          <div className="max-w-7xl mx-auto">
            {/* Conference Hall Image */}
            <motion.div
              className="w-full mb-12 relative group z-10"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
            >
              <img
                src={conferenceHallSection?.img || img}
                alt="Conference Hall"
                className="w-full h-[260px] sm:h-[340px] md:h-[500px] object-cover rounded-lg shadow-2xl border border-gold/20"
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
                            conferenceHallSection: {
                              ...conferenceHallSection,
                              img: imageUrl,
                            },
                          },
                        });
                        setIsImageEdit(false);
                      },
                      folderName: "conference",
                      acceptedTypes: ["image/jpeg", "image/jpg", "image/png"],
                      title: "Upload Conference Image",
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
                  value={conferenceHallSection?.description || ""}
                  onChange={(e) => {
                    setInstitutionData({
                      ...institutionData,
                      template2: {
                        ...institutionData.template2,
                        conferenceHallSection: {
                          ...conferenceHallSection,
                          description: e.target.value,
                        },
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
                  placeholder="Enter conference hall description..."
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
                  {conferenceHallSection?.description ||
                    "Host world-class events in our state-of-the-art Grand Hall. Featuring elegant gold-accented lighting, flexible seating arrangements, and premium audiovisual technology, it creates the perfect setting for corporate galas, weddings, and executive summits."}
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

export default ConferenceHall;
