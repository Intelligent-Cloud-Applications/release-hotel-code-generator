import React from "react";
import Navbar from "../components/Navbar.jsx";
import { useEditContext } from "../context/EditModeContext.jsx";
import FooterSection from "../components/FooterSection.jsx";
import bgTexture from "../assets/Images/bgTexture.png"; // Add a subtle noise texture image
import room1 from "../assets/Images/s3_1.png";
import room2 from "../assets/Images/s3_2.png";
import room3 from "../assets/Images/s3_3.png";
import { Edit2 } from "lucide-react";
import ImageUploadModal from "../components/ui/ImageUploadModal.jsx";
import { motion } from "framer-motion";
import { useInstitutionContext } from "../context/InstitutionContext.jsx";

const Rooms = () => {
  const { institutionData, setInstitutionData } = useInstitutionContext();
  const { isEditMode, setIsEditMode } = useEditContext();
  const [isImageEdit, setIsImageEdit] = React.useState(false);
  const [imageMetaData, setImageMetaData] = React.useState({});

  const roomRatesSection = institutionData.homeSection.homeSection5;
  // Page header content for Rooms page
  const roomsSection = institutionData?.roomsSection || {};

  const defaultRoomImages = [room1, room2, room3];
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

        {/* Room Rates Section */}
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
                value={roomsSection?.tagline1 || "Rooms at"}
                onChange={(e) => {
                  setInstitutionData({
                    ...institutionData,
                    roomsSection: {
                      ...roomsSection,
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
                {roomsSection?.tagline1 || "ROOMS AT"}
              </h1>
            )}
            {isEditMode ? (
              <input
                type="text"
                value={roomsSection?.tagline2 || "Amrapalli Classic"}
                onChange={(e) => {
                  setInstitutionData({
                    ...institutionData,
                    roomsSection: {
                      ...roomsSection,
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
                className="text-4xl md:text-6xl font-bold text-black tracking-widest uppercase"
                style={{
                  fontFamily: "Ogg",
                  fontWeight: 400,
                  letterSpacing: "0.15em",
                }}
              >
                {roomsSection?.tagline2 || "AMRAPALLI CLASSIC"}
              </h2>
            )}
          </motion.div>

          {/* Content Container */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="w-full flex justify-center items-center"
          >
            <div className="flex flex-col md:flex-row px-10 md:px-0 justify-evenly items-center w-full md:w-[80vw] md:h-[60vh] gap-8 md:gap-12">
              {roomRatesSection?.rooms?.map((room, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ 
                    duration: 0.6, 
                    delay: 0.6 + index * 0.2,
                    ease: "easeOut"
                  }}
                  whileHover={{ 
                    scale: 1.02, 
                    y: -5,
                    transition: { duration: 0.2 }
                  }}
                  className="relative bg-[#DBD6D0] rounded-2xl p-4 md:p-6 w-full md:w-full h-auto md:h-full border-2 border-transparent hover:border-gold hover:shadow-gold transition-all duration-300"
                  style={{
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                  }}
                >
                  <div className="flex flex-col justify-between h-full gap-3 md:gap-4 relative">
                    <img
                      src={room?.img || defaultRoomImages[index]}
                      alt={`Room ${index + 1}`}
                      className="rounded-2xl h-[200px] md:h-[60%] object-cover w-full"
                    />
                    {isEditMode && (
                      <button
                        onClick={() => {
                          setImageMetaData({
                            onUploadComplete: (imageUrl) => {
                              const updatedRooms = [...roomRatesSection.rooms];
                              updatedRooms[index] = {
                                ...updatedRooms[index],
                                img: imageUrl,
                              };
                              setInstitutionData({
                                ...institutionData,
                                homeSection: {
                                  ...institutionData.homeSection,
                                  homeSection5: {
                                    ...roomRatesSection,
                                    rooms: updatedRooms,
                                  },
                                },
                              });
                              setIsImageEdit(false);
                            },
                            folderName: "rooms",
                            acceptedTypes: [
                              "image/jpeg",
                              "image/jpg",
                              "image/png",
                            ],
                            title: `Upload Room Image ${index + 1}`,
                          });
                          setIsImageEdit(true);
                        }}
                        className="absolute top-4 right-4 bg-white rounded-full p-2 transition-opacity duration-200 shadow-lg pointer-events-auto z-50 hover:bg-gray-100"
                      >
                        <Edit2 className="w-4 h-4 text-gray-600" />
                      </button>
                    )}

                    <div
                      className={`flex flex-col gap-3 ${
                        isEditMode ? "md:gap-3" : "md:gap-6"
                      } flex-1 justify-center`}
                    >
                      {isEditMode ? (
                        <input
                          type="text"
                          value={room?.type}
                          onChange={(e) => {
                            const updatedRooms = [...roomRatesSection.rooms];
                            updatedRooms[index] = {
                              ...updatedRooms[index],
                              type: e.target.value,
                            };
                            setInstitutionData({
                              ...institutionData,
                              homeSection: {
                                ...institutionData.homeSection,
                                homeSection5: {
                                  ...roomRatesSection,
                                  rooms: updatedRooms,
                                },
                              },
                            });
                          }}
                          className="bg-transparent border-2 border-gray-400 border-dashed text-black outline-none"
                          style={{
                            fontFamily: "Poppins",
                            fontWeight: 700,
                            fontStyle: "normal",
                            fontSize: "clamp(18px, 4vw, 24px)",
                            lineHeight: "100%",
                            letterSpacing: "0%",
                          }}
                          placeholder="Room type..."
                        />
                      ) : (
                        <h2
                          className="text-black"
                          style={{
                            fontFamily: "Poppins",
                            fontWeight: 700,
                            fontStyle: "normal",
                            fontSize: "clamp(18px, 4vw, 24px)",
                            lineHeight: "100%",
                            letterSpacing: "0%",
                          }}
                        >
                          {room?.type || `Room ${index + 1}`}
                        </h2>
                      )}
                      {isEditMode ? (
                        <textarea
                          value={room?.description || ""}
                          onChange={(e) => {
                            const updatedRooms = [...roomRatesSection.rooms];
                            updatedRooms[index] = {
                              ...updatedRooms[index],
                              description: e.target.value,
                            };
                            setInstitutionData({
                              ...institutionData,
                              homeSection: {
                                ...institutionData.homeSection,
                                homeSection5: {
                                  ...roomRatesSection,
                                  rooms: updatedRooms,
                                },
                              },
                            });
                          }}
                          className="bg-transparent border-2 border-gray-400 border-dashed text-black p-2 outline-none resize-none"
                          style={{
                            fontFamily: "Poppins",
                            fontWeight: 400,
                            fontStyle: "normal",
                            fontSize: "clamp(12px, 2.5vw, 14px)",
                            lineHeight: "140%",
                            letterSpacing: "0%",
                            width: "100%",
                          }}
                          rows="3"
                          placeholder="Room description..."
                        />
                      ) : (
                        <p
                          style={{
                            fontFamily: "Poppins",
                            fontWeight: 400,
                            fontStyle: "normal",
                            fontSize: "clamp(12px, 2.5vw, 14px)",
                            lineHeight: "140%",
                            letterSpacing: "0%",
                            width: "100%",
                          }}
                        >
                          {room?.description || "Room description"}
                        </p>
                      )}
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-8 transition-all duration-300 transform hover:-translate-y-1">
                        {isEditMode ? (
                          <input
                            type="text"
                            value={room?.price}
                            onChange={(e) => {
                              const updatedRooms = [...roomRatesSection.rooms];
                              updatedRooms[index] = {
                                ...updatedRooms[index],
                                price: e.target.value,
                              };
                              setInstitutionData({
                                ...institutionData,
                                homeSection: {
                                  ...institutionData.homeSection,
                                  homeSection5: {
                                    ...roomRatesSection,
                                    rooms: updatedRooms,
                                  },
                                },
                              });
                            }}
                            className="bg-transparent border-2 border-gray-400 border-dashed text-black outline-none"
                            style={{
                              fontFamily: "Montserrat",
                              fontWeight: 700,
                              fontStyle: "normal",
                              fontSize: "clamp(16px, 3vw, 18px)",
                              lineHeight: "28px",
                              letterSpacing: "0%",
                            }}
                            placeholder="Price..."
                          />
                        ) : (
                          <span
                            className="text-black"
                            style={{
                              fontFamily: "Montserrat",
                              fontWeight: 700,
                              fontStyle: "normal",
                              fontSize: "clamp(16px, 3vw, 18px)",
                              lineHeight: "28px",
                              letterSpacing: "0%",
                            }}
                          >
                            {room?.price || "Price"}
                          </span>
                        )}
                        <button
                          className="bg-gradient-gold text-white px-6 md:px-4 py-2 rounded-full z-50 cursor-pointer w-full md:w-auto shadow-gold hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                          style={{
                            boxShadow: "4px 4px 0px 0px #000000",
                            fontFamily: "Montserrat",
                            fontWeight: 800,
                            fontStyle: "normal",
                            fontSize: "clamp(12px, 2.5vw, 14px)",
                            lineHeight: "100%",
                            letterSpacing: "0%",
                            textAlign: "center",
                          }}
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>

        <FooterSection />
      </div>
    </>
  );
};

export default Rooms;
