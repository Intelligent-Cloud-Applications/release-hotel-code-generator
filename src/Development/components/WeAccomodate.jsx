import React, { useState } from "react";
import { motion } from "framer-motion";
import room1 from "../assets/Images/rooms1.jpg";
import room2 from "../assets/Images/rooms2.jpg";
import room3 from "../assets/Images/rooms3.jpg";
import arrow1 from "../assets/Images/arrow2.svg";
import arrow2 from "../assets/Images/arrow3.svg";
import arrow3 from "../assets/Images/arrow4.svg";
import { useAppContext } from "../context/AppContext.jsx";
import { useEditContext } from "../context/EditModeContext.jsx";
import { Edit2 } from "lucide-react";
import ImageUploadModal from "./ui/ImageUploadModal.jsx";
import { useInstitutionContext } from "../context/InstitutionContext.jsx";

const WeAccomodate = () => {
  const { institutionData, setInstitutionData } = useInstitutionContext();
  const { isEditMode, setIsEditMode } = useEditContext();
  const weAccomodate = institutionData?.homeSection?.homeSection3;

  const [isImageEdit, setIsImageEdit] = useState(false);
  const [imageMetaData, setImageMetaData] = useState(null);

  return (
    <div className="bg-black py-8 md:py-8 flex flex-col justify-center items-center space-y-8">
      {isImageEdit && imageMetaData && (
        <ImageUploadModal
          onClose={() => setIsImageEdit(false)}
          onUploadComplete={imageMetaData.onUploadComplete}
          folderName={imageMetaData.folderName}
          acceptedTypes={imageMetaData.acceptedTypes}
          title={imageMetaData.title}
        />
      )}

      <motion.div
        className="text-center text-[32px] md:text-[64px] uppercase px-4"
        initial={{ opacity: 0, y: -50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {isEditMode ? (
          <input
            type="text"
            value={weAccomodate?.title || ""}
            onChange={(e) =>
              setInstitutionData({
                ...institutionData,
                homeSection: {
                  ...institutionData.homeSection,
                  homeSection3: {
                    ...weAccomodate,
                    title: e.target.value,
                  },
                },
              })
            }
            className="bg-transparent border-2 border-white border-dashed text-white text-center p-2 outline-none uppercase montserrat w-full"
            placeholder="Enter title..."
          />
        ) : (
          <>
            <span className="montserrat text-white">
              {weAccomodate?.title.split(" ")[0]}
            </span>{" "}
            <span className="ogg text-white">
              {weAccomodate?.title.split(" ")[1]}
            </span>
          </>
        )}
      </motion.div>

      {/* Desktop Layout */}
      <div className="hidden md:flex flex-row justify-center items-center max-w-[50vw] gap-20 relative mb-20">
        <div className="relative group w-1/3">
          <motion.img
            src={weAccomodate?.img1 || room1}
            alt="Room 1"
            className="w-full h-[50vh] object-cover"
            initial={{ opacity: 0, x: -100 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          />
          {isEditMode && (
            <button
              onClick={() => {
                setImageMetaData({
                  onUploadComplete: (imageUrl) => {
                    setInstitutionData({
                      ...institutionData,
                      homeSection: {
                        ...institutionData.homeSection,
                        homeSection3: {
                          ...weAccomodate,
                          img1: imageUrl,
                        },
                      },
                    });
                    setIsImageEdit(false);
                  },
                  folderName: "rooms",
                  acceptedTypes: ["image/jpeg", "image/jpg", "image/png"],
                  title: "Upload Room Image 1",
                });
                setIsImageEdit(true);
              }}
              className="absolute top-4 right-4 bg-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg pointer-events-auto z-50 hover:bg-gray-100"
            >
              <Edit2 className="w-5 h-5 text-gray-600" />
            </button>
          )}
        </div>

        <div className="relative group w-1/3">
          <motion.img
            src={weAccomodate?.img2 || room2}
            alt="Room 2"
            className="w-full h-[50vh] object-cover"
            initial={{ opacity: 0, y: 100 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
          />
          {isEditMode && (
            <button
              onClick={() => {
                setImageMetaData({
                  onUploadComplete: (imageUrl) => {
                    setInstitutionData({
                      ...institutionData,
                      homeSection: {
                        ...institutionData.homeSection,
                        homeSection3: {
                          ...weAccomodate,
                          img2: imageUrl,
                        },
                      },
                    });
                    setIsImageEdit(false);
                  },
                  folderName: "rooms",
                  acceptedTypes: ["image/jpeg", "image/jpg", "image/png"],
                  title: "Upload Room Image 2",
                });
                setIsImageEdit(true);
              }}
              className="absolute top-4 right-4 bg-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg pointer-events-auto z-50 hover:bg-gray-100"
            >
              <Edit2 className="w-5 h-5 text-gray-600" />
            </button>
          )}
        </div>

        <div className="relative group w-1/3">
          <motion.img
            src={weAccomodate?.img3 || room3}
            alt="Room 3"
            className="w-full h-[50vh] object-cover"
            initial={{ opacity: 0, x: 100 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
          />
          {isEditMode && (
            <button
              onClick={() => {
                setImageMetaData({
                  onUploadComplete: (imageUrl) => {
                    setInstitutionData({
                      ...institutionData,
                      homeSection: {
                        ...institutionData.homeSection,
                        homeSection3: {
                          ...weAccomodate,
                          img3: imageUrl,
                        },
                      },
                    });
                    setIsImageEdit(false);
                  },
                  folderName: "rooms",
                  acceptedTypes: ["image/jpeg", "image/jpg", "image/png"],
                  title: "Upload Room Image 3",
                });
                setIsImageEdit(true);
              }}
              className="absolute top-4 right-4 bg-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg pointer-events-auto z-50 hover:bg-gray-100"
            >
              <Edit2 className="w-5 h-5 text-gray-600" />
            </button>
          )}
        </div>
        <motion.img
          src={arrow1}
          alt="Arrow 1"
          className="absolute top-15 -left-38 transform -translate-y-1/2 -translate-x-1/2 "
          initial={{ opacity: 0, scale: 0 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.8, ease: "backOut" }}
        />
        <motion.h3
          className="absolute z-10 text-white text-right montserrat font-[500] uppercase text-[22.42px] leading-none top-30 -left-68"
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.9, ease: "easeOut" }}
        >
          {isEditMode ? (
            <input
              type="text"
              value={weAccomodate?.text1}
              onChange={(e) =>
                setInstitutionData({
                  ...institutionData,
                  homeSection: {
                    ...institutionData.homeSection,
                    homeSection3: {
                      ...weAccomodate,
                      text1: e.target.value,
                    },
                  },
                })
              }
              className="bg-transparent border-2 border-white border-dashed text-white text-center p-1 outline-none uppercase montserrat font-[500]"
              
              placeholder="Enter tagline..."
            />
          ) : (
            weAccomodate?.text1 || "Restaurants"
          )}
        </motion.h3>
        <motion.img
          src={arrow2}
          alt="Arrow 2"
          className="absolute -bottom-35 left-1/2 transform -translate-y-1/2 -translate-x-1/2"
          initial={{ opacity: 0, scale: 0 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 1.0, ease: "backOut" }}
        />
        <motion.h3
          className="absolute z-10 text-white text-right montserrat font-[500] uppercase text-[22.42px] leading-none -bottom-36 left-1/2 transform -translate-y-1/2 -translate-x-1/2"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 1.1, ease: "easeOut" }}
        >
          {isEditMode ? (
            <input
              type="text"
              value={weAccomodate?.text2}
              onChange={(e) =>
                setInstitutionData({
                  ...institutionData,
                  homeSection: {
                    ...institutionData.homeSection,
                    homeSection3: {
                      ...weAccomodate,
                      text2: e.target.value,
                    },
                  },
                })
              }
              className="bg-transparent border-2 border-white border-dashed text-white text-center p-1 outline-none uppercase montserrat font-[500]"
              placeholder="Enter tagline..."
            />
          ) : (
            weAccomodate?.text2 || "Spoon Room"
          )}
        </motion.h3>
        <motion.img
          src={arrow3}
          alt="Arrow 3"
          className="absolute top-20 -right-68 transform -translate-y-1/2 -translate-x-1/2"
          initial={{ opacity: 0, scale: 0 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 1.2, ease: "backOut" }}
        />
        <motion.h3
          className="absolute z-10 text-white text-right montserrat font-[500] uppercase text-[22.42px] leading-none top-40 -right-70"
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 1.3, ease: "easeOut" }}
        >
          {isEditMode ? (
            <input
              type="text"
              value={weAccomodate?.text3}
              onChange={(e) =>
                setInstitutionData({
                  ...institutionData,
                  homeSection: {
                    ...institutionData.homeSection,
                    homeSection3: {
                      ...weAccomodate,
                      text3: e.target.value,
                    },
                  },
                })
              }
              className="bg-transparent border-2 border-white border-dashed text-white text-center p-1 outline-none uppercase montserrat font-[500]"
              placeholder="Enter tagline..."
            />
          ) : (
            weAccomodate?.text3 || "AC Rooms with Wifi"
          )}
        </motion.h3>
      </div>

      {/* Mobile Layout */}
      <div className="flex md:hidden flex-col items-center justify-center gap-6 w-full mb-12">
        {/* Room 1 - Restaurants */}
        <motion.div
          className="flex items-center w-[60vw] px-6 gap-4 relative"
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="relative group w-full">
            <img
              src={weAccomodate?.img1 || room1}
              alt="Room 1"
              className="w-full h-[40vh] object-cover"
            />
            {isEditMode && (
              <button
                onClick={() => {
                  setImageMetaData({
                    onUploadComplete: (imageUrl) => {
                      setInstitutionData({
                        ...institutionData,
                        homeSection: {
                          ...institutionData.homeSection,
                          homeSection3: {
                            ...weAccomodate,
                            img1: imageUrl,
                          },
                        },
                      });
                      setIsImageEdit(false);
                    },
                    folderName: "rooms",
                    acceptedTypes: ["image/jpeg", "image/jpg", "image/png"],
                    title: "Upload Room Image 1",
                  });
                  setIsImageEdit(true);
                }}
                className="absolute top-4 right-4 bg-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg pointer-events-auto z-50 hover:bg-gray-100"
              >
                <Edit2 className="w-4 h-4 text-gray-600" />
              </button>
            )}
          </div>

          <div className=" flex items-center absolute -right-5 justify-center h-[40vh] bg-black">
            <h3
              className="text-white montserrat font-[600] uppercase text-[24px] leading-tight tracking-wider"
              style={{
                writingMode: "vertical-rl",
                textOrientation: "mixed",
                transform: "rotate(180deg)",
              }}
            >
              {isEditMode ? (
                <input
                  type="text"
                  value={weAccomodate?.text1}
                  onChange={(e) =>
                    setInstitutionData({
                      ...institutionData,
                      homeSection: {
                        ...institutionData.homeSection,
                        homeSection3: {
                          ...weAccomodate,
                          text1: e.target.value,
                        },
                      },
                    })
                  }
                  className="bg-transparent border border-white border-dashed text-white text-center p-1 outline-none uppercase montserrat font-[600] w-16"
                  placeholder="Text..."
                  style={{
                    writingMode: "vertical-rl",
                    textOrientation: "mixed",
                    transform: "rotate(180deg)",
                  }}
                />
              ) : (
                weAccomodate?.text1 || "Restaurants"
              )}
            </h3>
          </div>
        </motion.div>

        {/* Room 2 - Lobby Rooms */}
        <motion.div
          className="flex items-center w-[60vw] px-6 gap-4 relative"
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
        >
          <div className="relative group w-full">
            <img
              src={weAccomodate?.img2 || room2}
              alt="Room 2"
              className="w-full h-[40vh] object-cover"
            />
            {isEditMode && (
              <button
                onClick={() => {
                  setImageMetaData({
                    onUploadComplete: (imageUrl) => {
                      setInstitutionData({
                        ...institutionData,
                        homeSection: {
                          ...institutionData.homeSection,
                          homeSection3: {
                            ...weAccomodate,
                            img2: imageUrl,
                          },
                        },
                      });
                      setIsImageEdit(false);
                    },
                    folderName: "rooms",
                    acceptedTypes: ["image/jpeg", "image/jpg", "image/png"],
                    title: "Upload Room Image 2",
                  });
                  setIsImageEdit(true);
                }}
                className="absolute top-4 right-4 bg-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg pointer-events-auto z-50 hover:bg-gray-100"
              >
                <Edit2 className="w-4 h-4 text-gray-600" />
              </button>
            )}
          </div>
          <div className="absolute -left-5  flex items-center justify-center h-[40vh] bg-black">
            <h3
              className="text-white montserrat font-[600] uppercase text-[24px] leading-tight tracking-wider"
              style={{
                writingMode: "vertical-rl",
                textOrientation: "mixed",
                transform: "rotate(180deg)",
              }}
            >
              {isEditMode ? (
                <input
                  type="text"
                  value={weAccomodate?.text2}
                  onChange={(e) =>
                    setInstitutionData({
                      ...institutionData,
                      homeSection: {
                        ...institutionData.homeSection,
                        homeSection3: {
                          ...weAccomodate,
                          text2: e.target.value,
                        },
                      },
                    })
                  }
                  className="bg-transparent border border-white border-dashed text-white text-center p-1 outline-none uppercase montserrat font-[600] w-16"
                  placeholder="Text..."
                  style={{
                    writingMode: "vertical-rl",
                    textOrientation: "mixed",
                    transform: "rotate(180deg)",
                  }}
                />
              ) : (
                weAccomodate?.text2 || "Spoon Room"
              )}
            </h3>
          </div>
        </motion.div>

        {/* Room 3 - AC Rooms with Wifi */}
        <motion.div
          className="flex items-center w-[60vw] px-6 gap-4 relative"
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
        >
          <div className="relative group w-full">
            <img
              src={weAccomodate?.img3 || room3}
              alt="Room 3"
              className="w-full h-[40vh] object-cover"
            />
            {isEditMode && (
              <button
                onClick={() => {
                  setImageMetaData({
                    onUploadComplete: (imageUrl) => {
                      setInstitutionData({
                        ...institutionData,
                        homeSection: {
                          ...institutionData.homeSection,
                          homeSection3: {
                            ...weAccomodate,
                            img3: imageUrl,
                          },
                        },
                      });
                      setIsImageEdit(false);
                    },
                    folderName: "rooms",
                    acceptedTypes: ["image/jpeg", "image/jpg", "image/png"],
                    title: "Upload Room Image 3",
                  });
                  setIsImageEdit(true);
                }}
                className="absolute top-4 right-4 bg-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg pointer-events-auto z-50 hover:bg-gray-100"
              >
                <Edit2 className="w-4 h-4 text-gray-600" />
              </button>
            )}
          </div>

          <div className=" flex items-center absolute -right-5 justify-center h-[40vh] bg-black">
            <h3
              className="text-white montserrat font-[600] uppercase text-[24px] leading-tight tracking-wider"
              style={{
                writingMode: "vertical-rl",
                textOrientation: "mixed",
                transform: "rotate(180deg)",
              }}
            >
              {isEditMode ? (
                <input
                  type="text"
                  value={weAccomodate?.text3}
                  onChange={(e) =>
                    setInstitutionData({
                      ...institutionData,
                      homeSection: {
                        ...institutionData.homeSection,
                        homeSection3: {
                          ...weAccomodate,
                          text3: e.target.value,
                        },
                      },
                    })
                  }
                  className="bg-transparent border border-white border-dashed text-white text-center p-1 outline-none uppercase montserrat font-[600] w-16"
                  placeholder="Text..."
                  style={{
                    writingMode: "vertical-rl",
                    textOrientation: "mixed",
                    transform: "rotate(180deg)",
                  }}
                />
              ) : (
                weAccomodate?.text3 || "AC Rooms with Wifi"
              )}
            </h3>
          </div>
        </motion.div>
      </div>

      <motion.p
        className="text-center poppins text-white max-w-[90vw] md:max-w-[50vw] font-[400] text-sm md:text-lg leading-relaxed px-4 mt-8 md:mt-20"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
      >
        {isEditMode ? (
          <textarea
            value={weAccomodate?.description || ""}
            onChange={(e) =>
              setInstitutionData({
                ...institutionData,
                homeSection: {
                  ...institutionData.homeSection,
                  homeSection3: {
                    ...weAccomodate,
                    description: e.target.value,
                  },
                },
              })
            }
            className="bg-transparent border-2 border-white border-dashed text-white text-center p-2 outline-none poppins font-[400] text-sm md:text-lg leading-relaxed"
            placeholder="Enter description..."
            rows="4"
            cols="100"
          />
        ) : (
          weAccomodate?.description ||
          "Welcome to Amrapalli Classic Hotel, where modern design blends seamlessly with timeless hospitality. Set in Bhawanipatna's cultural heart, we offer more than just a place to stay — we create moments of warmth, relaxation, and understated luxury."
        )}
      </motion.p>
    </div>
  );
};

export default WeAccomodate;
