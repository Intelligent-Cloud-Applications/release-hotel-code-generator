import React from "react";
import Navbar from "../components/Navbar.jsx";
import FooterSection from "../components/FooterSection.jsx";
import Gallery from "../components/Gallery.jsx";
import { useEditContext } from "../context/EditModeContext.jsx";
import { useInstitutionContext } from "../context/InstitutionContext.jsx";
import { motion } from "framer-motion";

const GalleryPage = () => {
  const { institutionData, setInstitutionData } = useInstitutionContext();
  const { isEditMode } = useEditContext();
  
  // Use a new section key for the page header to avoid conflict with the inner gallery component
  const galleryPageSection = institutionData?.template2?.galleryPageSection || {};

  return (
    <div className="relative bg-champagne z-50">
      {/* Warm Gold Tint Overlay */}
      <div className="absolute inset-0 w-full h-full z-0 pointer-events-none bg-gold opacity-5"></div>
      <Navbar />
      
      {/* Content Container */}
      <div className="pt-32 md:pt-40 pb-10">
        {/* Header Section matching Bar/Conference Hall */}
        <motion.div
           className="text-center mb-10 relative z-10 px-4"
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.6, ease: "easeOut" }}
         >
           {isEditMode ? (
             <input
               type="text"
               value={galleryPageSection?.tagline1 || "MOMENTS & MEMORIES"}
               onChange={(e) => {
                 setInstitutionData({
                   ...institutionData,
                   template2: {
                     ...institutionData.template2,
                     galleryPageSection: {
                       ...galleryPageSection,
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
               {galleryPageSection?.tagline1 || "MOMENTS & MEMORIES"}
             </h1>
           )}
           {isEditMode ? (
             <input
               type="text"
               value={galleryPageSection?.tagline2 || "OUR GALLERY"}
               onChange={(e) => {
                 setInstitutionData({
                   ...institutionData,
                   template2: {
                     ...institutionData.template2,
                     galleryPageSection: {
                       ...galleryPageSection,
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
               {galleryPageSection?.tagline2 || "OUR GALLERY"}
             </h2>
           )}
         </motion.div>

        <Gallery />
      </div>

      <FooterSection />
    </div>
  );
};

export default GalleryPage;
