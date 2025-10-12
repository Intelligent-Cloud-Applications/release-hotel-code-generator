import Navbar from "./Navbar.jsx";
import CloudAnimation from "./CloudAnimations.jsx";
import HeroImg from "../assets/Images/hero.png";
import { Instagram, Youtube } from "lucide-react";
import { FaFacebookF, FaTwitter } from "react-icons/fa6";
import { Link } from "react-router";
import heroTest1 from "../assets/Images/heroTest1.jpg";
import heroTest2 from "../assets/Images/heroTest2.jpg";
import heroTest3 from "../assets/Images/heroTest3.jpg";
import star from "../assets/Images/star.svg";
import halfStar from "../assets/Images/halfStar.svg";
import arrow1 from "../assets/Images/arrow1.svg";
import { motion } from "framer-motion";
import { useAppContext } from "../context/AppContext.jsx";
import { useEditContext } from "../context/EditModeContext.jsx";
import { useEffect, useState } from "react";
import { Edit2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog.js";
import ImageUploadModal from "./ui/ImageUploadModal.jsx";

const Hero = () => {
  const { institutionData, setInstitutionData, updateInstitutionData } =
    useAppContext();
  const { isEditMode, setIsEditMode } = useEditContext();
  const { homeSection, footerSection } = institutionData || {};

  const heroSection1 = homeSection?.homeSection1 || {};
  const socialLinks = footerSection?.socialMedia || {};

  const [isImageEdit, setIsImageEdit] = useState(false);
  const [imageMetaData, setImageMetaData] = useState(null);

  const handleSubmit = () => {
    updateInstitutionData();
    toggleEditMode();
  };

  const handleCancel = () => {
    toggleEditMode();
    setImageMetaData(null);
    setIsImageEdit(false);
  };

  const [socialModalOpen, setSocialModalOpen] = useState(false);
  const [editingSocial, setEditingSocial] = useState(null);
  const [socialFormData, setSocialFormData] = useState({
    facebook: "",
    instagram: "",
    twitter: "",
    youtube: "",
  });

  const handleSocialEdit = (platform) => {
    setEditingSocial(platform);
    setSocialFormData({
      facebook: socialLinks?.facebook || "",
      instagram: socialLinks?.instagram || "",
      twitter: socialLinks?.twitter || "",
      youtube: socialLinks?.youtube || "",
    });
    setSocialModalOpen(true);
  };

  const handleSocialSave = () => {
    setInstitutionData({
      ...institutionData,
      footerSection: {
        ...footerSection,
        socialMedia: {
          ...socialLinks,
          ...socialFormData,
        },
      },
    });
    setSocialModalOpen(false);
    setEditingSocial(null);
  };

  // Function to render stars based on rating
  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const stars = [];

    // Add full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <img
          key={`full-${i}`}
          src={star}
          alt="Star"
          className="w-4 h-3 md:w-6 md:h-4 fill-yellow-400 text-yellow-400"
        />
      );
    }

    // Add half star if needed
    if (hasHalfStar) {
      stars.push(
        <img
          key="half"
          src={halfStar}
          alt="Half Star"
          className="w-4 h-3 md:w-6 md:h-4 fill-yellow-400 text-yellow-400"
        />
      );
    }

    return stars;
  };

  const rating = heroSection1?.leftBox?.rating || 4.5;

  return (
    <div className="h-screen bg-black relative overflow-hidden max-w-screen">
      {isImageEdit && imageMetaData && (
        <ImageUploadModal
          onClose={() => setIsImageEdit(false)}
          onUploadComplete={imageMetaData.onUploadComplete}
          folderName={imageMetaData.folderName}
          acceptedTypes={imageMetaData.acceptedTypes}
          title={imageMetaData.title}
        />
      )}

      <Navbar />
      <CloudAnimation />

      <div className="absolute bottom-[24vh] md:bottom-0 left-1/2 transform -translate-x-1/2 z-0 w-[100%] md:w-[70%] lg:w-[40%] group">
        <motion.img
          src={heroSection1?.img || HeroImg}
          alt="Hero"
          className="w-full h-auto"
          initial={{ y: 200, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
        />
        {isEditMode && (
          <button
            onClick={() => {
              setImageMetaData({
                onUploadComplete: (imageUrl) => {
                  setInstitutionData({
                    ...institutionData,
                    homeSection: {
                      ...homeSection,
                      homeSection1: {
                        ...heroSection1,
                        img: imageUrl,
                      },
                    },
                  });
                  setIsImageEdit(false);
                },
                folderName: "hero",
                acceptedTypes: ["image/jpeg", "image/jpg", "image/png"],
                title: "Upload Hero Image",
              });
              setIsImageEdit(true);
            }}
            className="absolute top-4 right-4 bg-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg pointer-events-auto z-50 hover:bg-gray-100"
          >
            <Edit2 className="w-5 h-5 text-gray-600" />
          </button>
        )}
        <div className="absolute inset-0 bg-gradient-to-tr from-black via-black/10 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black to-transparent"></div>
        <motion.img
          src={arrow1}
          alt="Arrow"
          className="hidden md:block absolute top-45 transform translate-x-1/2 -translate-y-1/2 rotate-[8.43deg] w-[8vw]"
          initial={{ y: 200, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
        />
      </div>

      {/* Right side content - Stacked below on mobile, right side on desktop */}
      <div className="absolute bottom-8 md:bottom-30 left-1/2 md:left-auto md:right-35 transform -translate-x-1/2 md:translate-x-0 z-10 flex flex-col justify-center items-center space-y-4">
        <motion.button
          className="bg-white text-black px-20 md:px-30 py-2 rounded-3xl font-[800] text-[14px] w-full md:w-auto pointer-events-auto"
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
        >
          {isEditMode ? (
            <input
              type="text"
              value={heroSection1?.rightBox?.buttonText}
              onChange={(e) =>
                setInstitutionData({
                  ...institutionData,
                  homeSection: {
                    ...homeSection,
                    homeSection1: {
                      ...heroSection1,
                      rightBox: {
                        ...heroSection1?.rightBox,
                        buttonText: e.target.value,
                      },
                    },
                  },
                })
              }
              className="bg-transparent border-2 border-gray-400 border-dashed text-black text-center w-full outline-none font-[800]"
              style={{
                fontSize: "14px",
              }}
              placeholder="Button text..."
            />
          ) : (
            heroSection1?.rightBox?.buttonText || "Book Now"
          )}
        </motion.button>
        <motion.p
          className="oldEnglish w-[16rem] md:w-[18rem] font-normal text-lg md:text-xl leading-none tracking-normal text-white text-center pointer-events-auto"
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
        >
          {isEditMode ? (
            <textarea
              value={
                heroSection1?.rightBox?.tagline ||
                "Discover a stay that feels personal, refined, and unforgettable"
              }
              onChange={(e) =>
                setInstitutionData({
                  ...institutionData,
                  homeSection: {
                    ...homeSection,
                    homeSection1: {
                      ...heroSection1,
                      rightBox: {
                        ...heroSection1?.rightBox,
                        tagline: e.target.value,
                      },
                    },
                  },
                })
              }
              className="bg-transparent border-2 h-fit border-white border-dashed text-white text-center w-full outline-none oldEnglish font-normal resize-none"
              style={{
                fontSize: "clamp(18px, 4vw, 20px)",
                lineHeight: "1.2",
              }}
              rows={3}
              placeholder="Enter tagline..."
            />
          ) : (
            heroSection1?.rightBox?.tagline ||
            "Discover a stay that feels personal, refined, and unforgettable"
          )}
        </motion.p>
        <motion.div
          className="flex justify-center items-center md:mt-4 gap-4 md:gap-8"
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.6 }}
        >
          <div className="relative group">
            <Link
              to={socialLinks?.facebook || "https://www.facebook.com"}
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaFacebookF className="w-6 h-6 md:w-8 md:h-8 mx-1 md:mx-2 text-white" />
            </Link>
            {isEditMode && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleSocialEdit("facebook");
                }}
                className="absolute -top-2 -right-2 bg-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-auto"
              >
                <Edit2 className="w-3 h-3 text-gray-600" />
              </button>
            )}
          </div>

          <div className="relative group">
            <Link
              to={socialLinks?.instagram || "https://www.instagram.com"}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Instagram className="w-6 h-6 md:w-8 md:h-8 mx-1 md:mx-2 text-white" />
            </Link>
            {isEditMode && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleSocialEdit("instagram");
                }}
                className="absolute -top-2 -right-2 bg-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-auto"
              >
                <Edit2 className="w-3 h-3 text-gray-600" />
              </button>
            )}
          </div>

          <div className="relative group">
            <Link
              to={socialLinks?.twitter || "https://www.twitter.com"}
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaTwitter className="w-6 h-6 md:w-8 md:h-8 mx-1 md:mx-2 text-white" />
            </Link>
            {isEditMode && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleSocialEdit("twitter");
                }}
                className="absolute -top-2 -right-2 bg-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-auto"
              >
                <Edit2 className="w-3 h-3 text-gray-600" />
              </button>
            )}
          </div>

          <div className="relative group">
            <Link
              to={socialLinks?.youtube || "https://www.youtube.com"}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Youtube className="w-6 h-6 md:w-8 md:h-8 mx-1 md:mx-2 text-white" />
            </Link>
            {isEditMode && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleSocialEdit("youtube");
                }}
                className="absolute -top-2 -right-2 bg-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-auto"
              >
                <Edit2 className="w-3 h-3 text-gray-600" />
              </button>
            )}
          </div>
        </motion.div>
      </div>

      {/* Testimonial section - Positioned at bottom left on mobile, similar to desktop */}
      <motion.div
        className="absolute bottom-[23rem] md:bottom-20 left-15  md:left-25 z-10 flex items-center gap-2 md:gap-4 bg-transparent px-3 md:px-6 py-2 md:py-3 rounded-full"
        initial={{ y: 200, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.6 }}
      >
        <div className="flex -space-x-2">
          <div className="relative group">
            <img
              src={heroSection1?.leftBox?.img1 || heroTest1}
              alt="Testimonial 1"
              className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-white object-cover"
            />
            {isEditMode && (
              <button
                onClick={() => {
                  setImageMetaData({
                    onUploadComplete: (imageUrl) => {
                      setInstitutionData({
                        ...institutionData,
                        homeSection: {
                          ...homeSection,
                          homeSection1: {
                            ...heroSection1,
                            leftBox: {
                              ...heroSection1?.leftBox,
                              img1: imageUrl,
                            },
                          },
                        },
                      });
                      setIsImageEdit(false);
                    },
                    folderName: "testimonials",
                    acceptedTypes: ["image/jpeg", "image/jpg", "image/png"],
                    title: "Upload Testimonial Image 1",
                  });
                  setIsImageEdit(true);
                }}
                className="absolute -top-1 -right-1 bg-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg pointer-events-auto z-50 hover:bg-gray-100"
              >
                <Edit2 className="w-2 h-2 text-gray-600" />
              </button>
            )}
          </div>
          <div className="relative group">
            <img
              src={heroSection1?.leftBox?.img2 || heroTest2}
              alt="Testimonial 2"
              className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-white object-cover"
            />
            {isEditMode && (
              <button
                onClick={() => {
                  setImageMetaData({
                    onUploadComplete: (imageUrl) => {
                      setInstitutionData({
                        ...institutionData,
                        homeSection: {
                          ...homeSection,
                          homeSection1: {
                            ...heroSection1,
                            leftBox: {
                              ...heroSection1?.leftBox,
                              img2: imageUrl,
                            },
                          },
                        },
                      });
                      setIsImageEdit(false);
                    },
                    folderName: "testimonials",
                    acceptedTypes: ["image/jpeg", "image/jpg", "image/png"],
                    title: "Upload Testimonial Image 2",
                  });
                  setIsImageEdit(true);
                }}
                className="absolute -top-1 -right-1 bg-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg pointer-events-auto z-50 hover:bg-gray-100"
              >
                <Edit2 className="w-2 h-2 text-gray-600" />
              </button>
            )}
          </div>
          <div className="relative group">
            <img
              src={heroSection1?.leftBox?.img3 || heroTest3}
              alt="Testimonial 3"
              className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-white object-cover"
            />
            {isEditMode && (
              <button
                onClick={() => {
                  setImageMetaData({
                    onUploadComplete: (imageUrl) => {
                      setInstitutionData({
                        ...institutionData,
                        homeSection: {
                          ...homeSection,
                          homeSection1: {
                            ...heroSection1,
                            leftBox: {
                              ...heroSection1?.leftBox,
                              img3: imageUrl,
                            },
                          },
                        },
                      });
                      setIsImageEdit(false);
                    },
                    folderName: "testimonials",
                    acceptedTypes: ["image/jpeg", "image/jpg", "image/png"],
                    title: "Upload Testimonial Image 3",
                  });
                  setIsImageEdit(true);
                }}
                className="absolute -top-1 -right-1 bg-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg pointer-events-auto z-50 hover:bg-gray-100"
              >
                <Edit2 className="w-2 h-2 text-gray-600" />
              </button>
            )}
          </div>
        </div>
        <div className="flex flex-col items-start">
          <div className="flex items-center">
            {renderStars(rating)}
            <span className="text-white font-[500] ml-1 md:ml-2 text-xs md:text-base pointer-events-auto">
              {isEditMode ? (
                <input
                  type="number"
                  min="1"
                  max="5"
                  step="0.1"
                  value={rating}
                  onChange={(e) =>
                    setInstitutionData({
                      ...institutionData,
                      homeSection: {
                        ...homeSection,
                        homeSection1: {
                          ...heroSection1,
                          leftBox: {
                            ...heroSection1?.leftBox,
                            rating: parseFloat(e.target.value),
                          },
                        },
                      },
                    })
                  }
                  className="bg-transparent border border-white border-dashed text-white text-center w-12 outline-none font-[500]"
                  style={{
                    fontSize: "clamp(12px, 3vw, 16px)",
                  }}
                />
              ) : (
                rating
              )}
              /5
            </span>
          </div>
          <p className="text-white mt-1 font-[400] text-xs md:text-base pointer-events-auto">
            {isEditMode ? (
              <input
                type="text"
                value={heroSection1?.leftBox?.tagline}
                onChange={(e) =>
                  setInstitutionData({
                    ...institutionData,
                    homeSection: {
                      ...homeSection,
                      homeSection1: {
                        ...heroSection1,
                        leftBox: {
                          ...heroSection1?.leftBox,
                          tagline: e.target.value,
                        },
                      },
                    },
                  })
                }
                className="bg-transparent border-2 border-white border-dashed text-white text-left w-full outline-none font-[400]"
                style={{
                  fontSize: "clamp(12px, 3vw, 16px)",
                }}
                placeholder="Reviews text..."
              />
            ) : (
              heroSection1?.leftBox?.tagline
            )}
          </p>
        </div>
      </motion.div>

      {/* Social Media Edit Modal */}
      <Dialog open={socialModalOpen} onOpenChange={setSocialModalOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Edit Social Media Links
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <FaFacebookF className="w-4 h-4" />
                Facebook URL
              </label>
              <input
                type="url"
                value={socialFormData.facebook}
                onChange={(e) =>
                  setSocialFormData({
                    ...socialFormData,
                    facebook: e.target.value,
                  })
                }
                placeholder="https://www.facebook.com/yourpage"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Instagram className="w-4 h-4" />
                Instagram URL
              </label>
              <input
                type="url"
                value={socialFormData.instagram}
                onChange={(e) =>
                  setSocialFormData({
                    ...socialFormData,
                    instagram: e.target.value,
                  })
                }
                placeholder="https://www.instagram.com/yourpage"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <FaTwitter className="w-4 h-4" />
                Twitter URL
              </label>
              <input
                type="url"
                value={socialFormData.twitter}
                onChange={(e) =>
                  setSocialFormData({
                    ...socialFormData,
                    twitter: e.target.value,
                  })
                }
                placeholder="https://www.twitter.com/yourpage"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Youtube className="w-4 h-4" />
                YouTube URL
              </label>
              <input
                type="url"
                value={socialFormData.youtube}
                onChange={(e) =>
                  setSocialFormData({
                    ...socialFormData,
                    youtube: e.target.value,
                  })
                }
                placeholder="https://www.youtube.com/yourchannel"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
            <button
              onClick={() => setSocialModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSocialSave}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            >
              Save Changes
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Hero;
