import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Star, Edit2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import avatar1 from "../assets/Images/heroTest1.jpg";
import avatar2 from "../assets/Images/heroTest2.jpg";
import avatar3 from "../assets/Images/heroTest3.jpg";
import { useAppContext } from "../context/AppContext.jsx";
import { useEditContext } from "../context/EditModeContext.jsx";
import ImageUploadModal from "./ui/ImageUploadModal.jsx";

const Reviews = () => {
  const { institutionData, setInstitutionData } = useAppContext();
  const { isEditMode } = useEditContext();
  const reviewsSection = institutionData.homeSection.homeSection6;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isImageEdit, setIsImageEdit] = useState(false);
  const [imageMetaData, setImageMetaData] = useState(null);

  // Default avatar images
  const defaultAvatars = [avatar1, avatar2, avatar3];

  // Transform reviews data to match the expected format
  const testimonials = reviewsSection?.reviews?.map((review, index) => ({
    id: index + 1,
    text: review.comment || "Amazing stay! The service was excellent and the rooms were very comfortable.",
    name: review.name || "Guest",
    position: review.position || "Guest",
    img: review.img || defaultAvatars[index],
    rating: review.rating || 5,
  })) || [];

  const handlePrevious = () => {
    setDirection(-1);
    setCurrentIndex((prev) =>
      prev === 0 ? testimonials.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setDirection(1);
    setCurrentIndex((prev) =>
      prev === testimonials.length - 1 ? 0 : prev + 1
    );
  };

  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction) => ({
      x: direction > 0 ? -1000 : 1000,
      opacity: 0,
    }),
  };

  const staggeredVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: (custom) => ({
      x: 0,
      opacity: 1,
      transition: {
        delay: custom * 0.2,
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 },
      },
    }),
    exit: (direction) => ({
      x: direction > 0 ? -1000 : 1000,
      opacity: 0,
    }),
  };

  return (
    <div className="bg-black flex flex-col justify-center items-center py-8 md:py-16 px-4 md:px-8 min-h-[60vh]">
      {isImageEdit && imageMetaData && (
        <ImageUploadModal
          onClose={() => setIsImageEdit(false)}
          onUploadComplete={imageMetaData.onUploadComplete}
          folderName={imageMetaData.folderName}
          acceptedTypes={imageMetaData.acceptedTypes}
          title={imageMetaData.title}
        />
      )}

      <div className="text-center text-[32px] md:text-[52px] uppercase mb-8 md:mb-12">
        {isEditMode ? (
          <input
            type="text"
            value={reviewsSection?.title }
            onChange={(e) =>
              setInstitutionData({
                ...institutionData,
                homeSection: {
                  ...institutionData.homeSection,
                  homeSection6: {
                    ...reviewsSection,
                    title: e.target.value,
                  },
                },
              })
            }
            className="bg-transparent border-2 border-white border-dashed text-white text-center p-2 outline-none uppercase w-full"
            placeholder="Enter title..."
            style={{
              fontFamily: "Montserrat",
              fontWeight: 700,
              fontSize: "clamp(32px, 7vw, 52px)",
            }}
          />
        ) : (
          <>
            <span className="montserrat text-white font-[700]">
              {reviewsSection?.title?.split(" ")[0] || "OUR"}
            </span>{" "}
            <span className="ogg text-white">
              {reviewsSection?.title?.split(" ").slice(1).join(" ") || "REVIEWS"}
            </span>
          </>
        )}
      </div>

      <div className="max-w-[90vw] md:max-w-[80vw] w-full flex items-center justify-between gap-4 md:gap-12">
        {/* Left Arrow */}
        <button
          onClick={handlePrevious}
          className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-white flex items-center justify-center hover:bg-gray-200 transition-colors flex-shrink-0"
        >
          <ChevronLeft className="w-4 h-4 md:w-6 md:h-6 text-black" />
        </button>

        {/* Testimonial Content */}
        <div className="flex flex-col items-center text-center flex-1 py-4 md:py-8 overflow-hidden">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={currentIndex}
              className="flex flex-col items-center w-full"
            >
              {/* Stars - Slides first */}
              <motion.div
                custom={0}
                variants={staggeredVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="flex gap-1 mb-4 md:mb-8 items-center"
              >
                {isEditMode ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="5"
                      step="1"
                      value={reviewsSection?.reviews?.[currentIndex]?.rating}
                      onChange={(e) => {
                        const updatedReviews = [...reviewsSection.reviews];
                        updatedReviews[currentIndex] = { ...updatedReviews[currentIndex], rating: parseInt(e.target.value) };
                        setInstitutionData({
                          ...institutionData,
                          homeSection: {
                            ...institutionData.homeSection,
                            homeSection6: {
                              ...reviewsSection,
                              reviews: updatedReviews,
                            },
                          },
                        });
                      }}
                      className="bg-transparent border-2 border-white border-dashed text-white text-center p-1 outline-none w-12"
                      style={{
                        fontSize: "16px",
                      }}
                    />
                    <span className="text-white">stars</span>
                  </div>
                ) : (
                  <>
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 md:w-6 md:h-6 ${
                          i < (testimonials[currentIndex]?.rating || 5)
                            ? "fill-white text-white"
                            : "fill-gray-600 text-gray-600"
                        }`}
                      />
                    ))}
                  </>
                )}
              </motion.div>

              {isEditMode ? (
                <motion.div
                  custom={1}
                  variants={staggeredVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="text-white mb-4 md:mb-8 max-w-3xl px-2 md:px-0"
                >
                  <textarea
                    value={reviewsSection?.reviews?.[currentIndex]?.comment}
                    onChange={(e) => {
                      const updatedReviews = [...reviewsSection.reviews];
                      updatedReviews[currentIndex] = { ...updatedReviews[currentIndex], comment: e.target.value };
                      setInstitutionData({
                        ...institutionData,
                        homeSection: {
                          ...institutionData.homeSection,
                          homeSection6: {
                            ...reviewsSection,
                            reviews: updatedReviews,
                          },
                        },
                      });
                    }}
                    className="bg-transparent border-2 border-white border-dashed text-white text-center p-2 outline-none resize-none w-full"
                    style={{
                      fontFamily: "Poppins",
                      fontWeight: 700,
                      fontSize: "clamp(14px, 3.5vw, 22px)",
                      lineHeight: "140%",
                      letterSpacing: "0%",
                      minHeight: "200px",
                    }}
                    rows="6"
                    cols={"100"}
                    placeholder="Review comment..."
                  />
                </motion.div>
              ) : (
                <motion.p
                  custom={1}
                  variants={staggeredVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="text-white mb-4 md:mb-8 max-w-3xl px-2 md:px-0 max-md:min-h-[250px]"
                  style={{
                    fontFamily: "Poppins",
                    fontWeight: 700,
                    fontSize: "clamp(14px, 3.5vw, 22px)",
                    lineHeight: "140%",
                    letterSpacing: "0%",
                    textAlign: "center",
                  }}
                >
                  "
                  {window.innerWidth < 768
                    ? testimonials[currentIndex].text.length > 300
                      ? testimonials[currentIndex].text.substring(0, 300) + "..."
                      : testimonials[currentIndex].text
                    : testimonials[currentIndex].text.length > 500
                    ? testimonials[currentIndex].text.substring(0, 500) + "..."
                    : testimonials[currentIndex].text}
                  "
                </motion.p>
              )}

              {/* Avatar and Name - Slides third */}
              <motion.div
                custom={2}
                variants={staggeredVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="flex items-center gap-3 md:gap-4 mb-4 md:mb-8"
              >
                <div className="relative group w-10 h-10 md:w-12 md:h-12 rounded-full bg-gray-400">
                  {testimonials[currentIndex]?.img && (
                    <img
                      src={testimonials[currentIndex]?.img || defaultAvatars[currentIndex]}
                      alt={testimonials[currentIndex].name}
                      className="w-full h-full object-cover rounded-full"
                    />
                  )}
                  {isEditMode && (
                    <button
                      onClick={() => {
                        setImageMetaData({
                          onUploadComplete: (imageUrl) => {
                            const updatedReviews = [...reviewsSection.reviews];
                            updatedReviews[currentIndex] = { ...updatedReviews[currentIndex], img: imageUrl };
                            setInstitutionData({
                              ...institutionData,
                              homeSection: {
                                ...institutionData.homeSection,
                                homeSection6: {
                                  ...reviewsSection,
                                  reviews: updatedReviews,
                                },
                              },
                            });
                            setIsImageEdit(false);
                          },
                          folderName: "avatars",
                          acceptedTypes: ["image/jpeg", "image/jpg", "image/png"],
                          title: `Upload Avatar ${currentIndex + 1}`,
                        });
                        setIsImageEdit(true);
                      }}
                      className="absolute -top-1 -right-1 bg-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg pointer-events-auto z-50 hover:bg-gray-100"
                    >
                      <Edit2 className="w-3 h-3 text-gray-600" />
                    </button>
                  )}
                </div>
                <div className="text-left">
                  {isEditMode ? (
                    <input
                      type="text"
                      value={reviewsSection?.reviews?.[currentIndex]?.name || ""}
                      onChange={(e) => {
                        const updatedReviews = [...reviewsSection.reviews];
                        updatedReviews[currentIndex] = { ...updatedReviews[currentIndex], name: e.target.value };
                        setInstitutionData({
                          ...institutionData,
                          homeSection: {
                            ...institutionData.homeSection,
                            homeSection6: {
                              ...reviewsSection,
                              reviews: updatedReviews,
                            },
                          },
                        });
                      }}
                      className="bg-transparent border-2 border-white border-dashed text-white p-1 outline-none mb-1 w-full"
                      style={{
                        fontFamily: "Poppins",
                        fontWeight: 600,
                        fontSize: "clamp(14px, 3vw, 16px)",
                        lineHeight: "1.4",
                      }}
                      placeholder="Name..."
                    />
                  ) : (
                    <p
                      className="text-white"
                      style={{
                        fontFamily: "Poppins",
                        fontWeight: 600,
                        fontSize: "clamp(14px, 3vw, 16px)",
                        lineHeight: "1.4",
                      }}
                    >
                      {testimonials[currentIndex].name}
                    </p>
                  )}
                  {isEditMode ? (
                    <input
                      type="text"
                      value={reviewsSection?.reviews?.[currentIndex]?.position || ""}
                      onChange={(e) => {
                        const updatedReviews = [...reviewsSection.reviews];
                        updatedReviews[currentIndex] = { ...updatedReviews[currentIndex], position: e.target.value };
                        setInstitutionData({
                          ...institutionData,
                          homeSection: {
                            ...institutionData.homeSection,
                            homeSection6: {
                              ...reviewsSection,
                              reviews: updatedReviews,
                            },
                          },
                        });
                      }}
                      className="bg-transparent border-2 border-gray-400 border-dashed text-gray-400 p-1 outline-none w-full"
                      style={{
                        fontFamily: "Poppins",
                        fontWeight: 400,
                        fontSize: "clamp(12px, 2.5vw, 14px)",
                        lineHeight: "1.4",
                      }}
                      placeholder="Position..."
                    />
                  ) : (
                    <p
                      className="text-gray-400"
                      style={{
                        fontFamily: "Poppins",
                        fontWeight: 400,
                        fontSize: "clamp(12px, 2.5vw, 14px)",
                        lineHeight: "1.4",
                      }}
                    >
                      {testimonials[currentIndex].position}
                    </p>
                  )}
                </div>
              </motion.div>

              {/* Dots Navigation */}
              <div className="flex gap-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setDirection(index > currentIndex ? 1 : -1);
                      setCurrentIndex(index);
                    }}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentIndex ? "bg-white w-8" : "bg-gray-600"
                    }`}
                  />
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right Arrow */}
        <button
          onClick={handleNext}
          className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-white flex items-center justify-center hover:bg-gray-200 transition-colors flex-shrink-0"
        >
          <ChevronRight className="w-4 h-4 md:w-6 md:h-6 text-black" />
        </button>
      </div>
    </div>
  );
};

export default Reviews;
