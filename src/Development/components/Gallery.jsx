import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import bgTexture from "../assets/Images/bgTexture.png";

import img1 from "../assets/Images/img1.jpg";
import img2 from "../assets/Images/img2.jpg";
import img3 from "../assets/Images/rooms1.jpg";
import img4 from "../assets/Images/rooms2.jpg";
import img5 from "../assets/Images/rooms3.jpg";
import { FaArrowRight } from "react-icons/fa6";
import { useAppContext } from "../context/AppContext.jsx";
import { useEditContext } from "../context/EditModeContext.jsx";
import { Edit2 } from "lucide-react";
import ImageUploadModal from "./ui/ImageUploadModal.jsx";
import { useInstitutionContext } from "../context/InstitutionContext.jsx";

const Gallery = () => {
  const { institutionData, setInstitutionData } = useInstitutionContext();
  const { isEditMode } = useEditContext();
  const gallerySection = institutionData?.homeSection?.heroSection7;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isImageEdit, setIsImageEdit] = useState(false);
  const [imageMetaData, setImageMetaData] = useState(null);

  // Default images fallback
  const defaultImages = [
    { src: img1, name: "Suite Room" },
    { src: img2, name: "Deluxe Room" },
    { src: img3, name: "Standard Room" },
    { src: img4, name: "Family Room" },
    { src: img5, name: "Presidential Suite" },
  ];

  // Transform gallery data to match the expected format
  const imgData = gallerySection?.images?.map((image, index) => ({
    src: image.img || defaultImages[index]?.src || img1,
    name: image.title || defaultImages[index]?.name || `Room ${index + 1}`,
  })) || defaultImages;

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % imgData.length);
  };

  const getImageAtPosition = (position) => {
    const index = (currentIndex + position) % imgData.length;
    return imgData[index];
  };

  return (
    <div className=" md:h-[100vh] flex flex-col md:flex-row relative overflow-hidden bg-black">
      {isImageEdit && imageMetaData && (
        <ImageUploadModal
          onClose={() => setIsImageEdit(false)}
          onUploadComplete={imageMetaData.onUploadComplete}
          folderName={imageMetaData.folderName}
          acceptedTypes={imageMetaData.acceptedTypes}
          title={imageMetaData.title}
        />
      )}

      {/* Left Section - Title */}
      <div className="w-full md:w-1/2 h-[40vh] md:h-[80vh] bg-[#D9D2BF] relative flex items-center justify-center md:block">
        <div
          className="absolute inset-0 w-full h-full z-10"
          style={{
            backgroundImage: `url(${bgTexture})`,
            backgroundRepeat: "repeat",
            backgroundSize: "800px 800px",
            opacity: 0.15,
            mixBlendMode: "multiply",
          }}
        ></div>
        {/* Desktop Title */}
        {isEditMode ? (
          <input
            type="text"
            value={gallerySection?.title || "View Our Gallery"}
            onChange={(e) =>
              setInstitutionData({
                ...institutionData,
                homeSection: {
                  ...institutionData.homeSection,
                  heroSection7: {
                    ...gallerySection,
                    title: e.target.value,
                  },
                },
              })
            }
            className="relative hidden md:block md:absolute md:w-[20vw] md:top-1/2 md:transform md:-translate-y-1/2 z-20 text-black md:text-white md:rotate-[270deg] w-fit text-center bg-transparent border-2 border-white border-dashed p-2 outline-none uppercase"
            style={{
              fontFamily: "Montserrat",
              fontWeight: 700,
              fontSize: "clamp(24px, 5vw, 54.31px)",
              lineHeight: "100%",
              letterSpacing: "0%",
              textAlign: "center",
            }}
            placeholder="Enter title..."
          />
        ) : (
          <h1
            className="relative hidden md:block md:absolute md:w-[20vw] md:top-1/2 md:transform md:-translate-y-1/2 z-20 text-black md:text-white md:rotate-[270deg] w-fit text-center"
            style={{
              fontFamily: "Montserrat",
              fontWeight: 700,
              fontStyle: "normal",
              fontSize: "clamp(24px, 5vw, 54.31px)",
              lineHeight: "100%",
              letterSpacing: "0%",
              textAlign: "center",
              textTransform: "uppercase",
            }}
          >
            {gallerySection?.title || "VIEW OUR GALLERY"}
          </h1>
        )}
        {/* Mobile Title */}
        {isEditMode ? (
          <input
            type="text"
            value={gallerySection?.title || "View Our Gallery"}
            onChange={(e) =>
              setInstitutionData({
                ...institutionData,
                homeSection: {
                  ...institutionData.homeSection,
                  heroSection7: {
                    ...gallerySection,
                    title: e.target.value,
                  },
                },
              })
            }
            className="absolute top-8 md:hidden text-black bg-transparent border-2 border-gray-600 border-dashed p-2 outline-none uppercase w-[90%] text-center"
            style={{
              fontFamily: "Montserrat",
              fontWeight: 700,
              fontSize: "clamp(24px, 5vw, 54.31px)",
              lineHeight: "100%",
              letterSpacing: "0%",
              textAlign: "center",
            }}
            placeholder="Enter title..."
          />
        ) : (
          <h1
            className="absolute top-8 md:hidden  text-black md:text-white w-fit text-center"
            style={{
              fontFamily: "Montserrat",
              fontWeight: 700,
              fontStyle: "normal",
              fontSize: "clamp(24px, 5vw, 54.31px)",
              lineHeight: "100%",
              letterSpacing: "0%",
              textAlign: "center",
              textTransform: "uppercase",
            }}
          >
            {gallerySection?.title || "VIEW OUR GALLERY"}
          </h1>
        )}
      </div>
      
      {/* Right Section - Background */}
      <div className="w-full md:w-1/2 h-[60vh] md:h-[80vh] bg-[#C6C6C6] relative">
        <div
          className="absolute inset-0 w-full h-full z-10"
          style={{
            backgroundImage: `url(${bgTexture})`,
            backgroundRepeat: "repeat",
            backgroundSize: "800px 800px",
            opacity: 0.15,
            mixBlendMode: "multiply",
          }}
        ></div>
      </div>

      {/* First Image with Arrow */}
      <AnimatePresence mode="wait">
        <div className="absolute left-0 max-md:top-30 md:left-[30vw] w-[60vw] md:w-[25vw] h-[35vh] md:h-[60vh] md:bottom-10 z-50 pr-4 md:px-0">
          <motion.div
            className="h-full w-full relative group"
            key={`first-${currentIndex}`}
            initial={{ x: "0", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "50%", opacity: 0 }}
            transition={{ duration: 2, ease: "easeInOut" }}
          >
            <img
              src={getImageAtPosition(0).src}
              alt={getImageAtPosition(0).name}
              className="object-cover h-full w-full"
            />
            {isEditMode && (
              <button
                onClick={() => {
                  setImageMetaData({
                    onUploadComplete: (imageUrl) => {
                      const updatedImages = [...gallerySection.images];
                      const actualIndex = currentIndex % updatedImages.length;
                      updatedImages[actualIndex] = { ...updatedImages[actualIndex], img: imageUrl };
                      setInstitutionData({
                        ...institutionData,
                        homeSection: {
                          ...institutionData.homeSection,
                          heroSection7: {
                            ...gallerySection,
                            images: updatedImages,
                          },
                        },
                      });
                      setIsImageEdit(false);
                    },
                    folderName: "gallery",
                    acceptedTypes: ["image/jpeg", "image/jpg", "image/png"],
                    title: `Upload Gallery Image ${currentIndex + 1}`,
                  });
                  setIsImageEdit(true);
                }}
                className="absolute top-4 right-4 bg-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg pointer-events-auto z-50 hover:bg-gray-100"
              >
                <Edit2 className="w-4 h-4 text-gray-600" />
              </button>
            )}
            <div className="absolute -top-[5vh] rounded md:-top-[5vh] py-1 flex flex-row justify-between w-[60vw] md:w-full z-50 px-4 md:px-0">
              <span
                className="text-black md:text-white"
                style={{
                  fontFamily: "Montserrat",
                  fontWeight: 700,
                  fontStyle: "normal",
                  fontSize: "clamp(16px, 3.5vw, 22.42px)",
                  lineHeight: "100%",
                  letterSpacing: "0%",
                  textAlign: "right",
                  textTransform: "uppercase",
                }}
              >
                {currentIndex + 1}
              </span>
              {isEditMode ? (
                <input
                  type="text"
                  value={gallerySection?.images?.[currentIndex % gallerySection.images.length]?.title || ""}
                  onChange={(e) => {
                    const updatedImages = [...gallerySection.images];
                    const actualIndex = currentIndex % updatedImages.length;
                    updatedImages[actualIndex] = { ...updatedImages[actualIndex], title: e.target.value };
                    setInstitutionData({
                      ...institutionData,
                      homeSection: {
                        ...institutionData.homeSection,
                        heroSection7: {
                          ...gallerySection,
                          images: updatedImages,
                        },
                      },
                    });
                  }}
                  className="bg-transparent border-2 border-white border-dashed text-black md:text-white p-1 outline-none uppercase text-center"
                  style={{
                    fontFamily: "Montserrat",
                    fontWeight: 700,
                    fontSize: "clamp(16px, 3.5vw, 22.42px)",
                    lineHeight: "100%",
                  }}
                  placeholder="Image title..."
                />
              ) : (
                <span
                  className="text-black md:text-white"
                  style={{
                    fontFamily: "Montserrat",
                    fontWeight: 700,
                    fontStyle: "normal",
                    fontSize: "clamp(16px, 3.5vw, 22.42px)",
                    lineHeight: "100%",
                    letterSpacing: "0%",
                    textAlign: "right",
                    textTransform: "uppercase",
                  }}
                >
                  {getImageAtPosition(0).name}
                </span>
              )}
            </div>
          </motion.div>
          <div
            onClick={handleNext}
            className="h-10 w-10 md:h-12 md:w-12 bg-white rounded-full flex justify-center items-center absolute cursor-pointer top-1/2 transform -translate-y-1/2 -right-1 md:-right-6 z-50"
          >
            <FaArrowRight size={20} className="md:w-6 md:h-6" />
          </div>
        </div>
      </AnimatePresence>

      {/* Second Image */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`second-${currentIndex}`}
          className="absolute -right-0 max-md:bottom-10 md:-right-10 w-[60vw] md:w-[25vw] h-[35vh] md:h-[60vh] md:top-[10vh] group"
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={ { x: "-50%", opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        >
          <img
            src={getImageAtPosition(1).src}
            alt={getImageAtPosition(1).name}
            className="object-cover h-full w-full rounded"
          />
          {isEditMode && (
            <button
              onClick={() => {
                setImageMetaData({
                  onUploadComplete: (imageUrl) => {
                    const updatedImages = [...gallerySection.images];
                    const actualIndex = (currentIndex + 1) % updatedImages.length;
                    updatedImages[actualIndex] = { ...updatedImages[actualIndex], img: imageUrl };
                    setInstitutionData({
                      ...institutionData,
                      homeSection: {
                        ...institutionData.homeSection,
                        heroSection7: {
                          ...gallerySection,
                          images: updatedImages,
                        },
                      },
                    });
                    setIsImageEdit(false);
                  },
                  folderName: "gallery",
                  acceptedTypes: ["image/jpeg", "image/jpg", "image/png"],
                  title: `Upload Gallery Image ${((currentIndex + 1) % gallerySection.images.length) + 1}`,
                });
                setIsImageEdit(true);
              }}
              className="absolute top-4 right-4 bg-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg pointer-events-auto z-50 hover:bg-gray-100"
            >
              <Edit2 className="w-4 h-4 text-gray-600" />
            </button>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Gallery;
