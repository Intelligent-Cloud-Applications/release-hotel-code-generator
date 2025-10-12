import React, { useState } from "react";
import bgTexture from "../assets/Images/bgTexture.png";
import room1 from "../assets/Images/s3_1.png";
import room2 from "../assets/Images/s3_2.png";
import room3 from "../assets/Images/s3_3.png";
import { useAppContext } from "../context/AppContext.jsx";
import { useEditContext } from "../context/EditModeContext.jsx";
import { Edit2 } from "lucide-react";
import ImageUploadModal from "./ui/ImageUploadModal.jsx";
import { useInstitutionContext } from "../context/InstitutionContext.jsx";

const RoomRates = () => {
  const { institutionData, setInstitutionData } = useInstitutionContext();
  const { isEditMode } = useEditContext();
  const roomRatesSection = institutionData.homeSection.homeSection5;

  const [isImageEdit, setIsImageEdit] = useState(false);
  const [imageMetaData, setImageMetaData] = useState(null);

  // Default room images
  const defaultRoomImages = [room1, room2, room3];

  return (
    <div className="bg-black py-8 md:py-8 flex flex-col justify-center items-center space-y-8 md:px-4">
      {isImageEdit && imageMetaData && (
        <ImageUploadModal
          onClose={() => setIsImageEdit(false)}
          onUploadComplete={imageMetaData.onUploadComplete}
          folderName={imageMetaData.folderName}
          acceptedTypes={imageMetaData.acceptedTypes}
          title={imageMetaData.title}
        />
      )}

      <div className="text-center text-[32px] md:text-[48px] uppercase">
        {isEditMode ? (
          <input
            type="text"
            value={roomRatesSection?.title}
            onChange={(e) =>
              setInstitutionData({
                ...institutionData,
                homeSection: {
                  ...institutionData.homeSection,
                  homeSection5: {
                    ...roomRatesSection,
                    title: e.target.value,
                  },
                },
              })
            }
            className="bg-transparent border-2 border-white border-dashed text-white text-center p-2 outline-none uppercase w-full"
            placeholder="Enter title..."
            style={{
              fontFamily: "Poppins",
              fontWeight: 600,
              fontSize: "clamp(32px, 7vw, 48px)",
            }}
          />
        ) : (
          <>
            <span className="poppins font-[600] text-white">
              {roomRatesSection?.title?.split(" ")[0] || "Rooms"}
            </span>{" "}
            <span className="ogg text-white">
              {roomRatesSection?.title?.split(" ").slice(1).join(" ") ||
                "& Rates"}
            </span>
          </>
        )}
      </div>

      <div className="flex flex-col justify-center items-center gap-8 md:gap-14 w-full md:max-w-[90vw]">
        <div className="flex flex-col md:flex-row px-10 md:px-0 justify-evenly items-center w-full md:w-[80vw] md:h-[60vh] gap-8 md:gap-12">
          {roomRatesSection?.rooms?.map((room, index) => (
            <div
              key={index}
              className="relative bg-[#FBF6F0] rounded-2xl p-4 md:p-6 w-full md:w-full h-auto md:h-full"
            >
              <div
                className="absolute inset-0 w-full h-full z-10 rounded-2xl"
                style={{
                  backgroundImage: `url(${bgTexture})`,
                  backgroundRepeat: "repeat",
                  backgroundSize: "800px 800px",
                  opacity: 0.15,
                  mixBlendMode: "multiply",
                }}
              ></div>
              <div className="flex flex-col justify-between h-full z-20 gap-3 md:gap-4 relative">
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
                        acceptedTypes: ["image/jpeg", "image/jpg", "image/png"],
                        title: `Upload Room Image ${index + 1}`,
                      });
                      setIsImageEdit(true);
                    }}
                    className="absolute top-4 right-4 bg-white rounded-full p-2 transition-opacity duration-200 shadow-lg pointer-events-auto z-50 hover:bg-gray-100"
                  >
                    <Edit2 className="w-4 h-4 text-gray-600" />
                  </button>
                )}

                <div className={`flex flex-col gap-3 ${isEditMode ? "md:gap-3" : "md:gap-6"} flex-1 justify-center`}>
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
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-8">
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
                      className="bg-white text-black px-6 md:px-4 py-2 rounded-full z-50 cursor-pointer w-full md:w-auto"
                      style={{
                        boxShadow: "4px 5px 0px 0px #000000",
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
            </div>
          ))}
        </div>
        <div className="md:w-[80vw] w-full relative flex flex-col justify-center items-center gap-4 md:gap-6 bg-[#FBF6F0] md:rounded-2xl p-6 md:p-4 py-8 md:py-12">
          <div
            className="absolute inset-0 w-full h-full z-10 rounded-2xl"
            style={{
              backgroundImage: `url(${bgTexture})`,
              backgroundRepeat: "repeat",
              backgroundSize: "800px 800px",
              opacity: 0.15,
              mixBlendMode: "multiply",
            }}
          ></div>
          {isEditMode ? (
            <input
              type="text"
              value={
                roomRatesSection?.bottomBox?.title
              }
              onChange={(e) =>
                setInstitutionData({
                  ...institutionData,
                  homeSection: {
                    ...institutionData.homeSection,
                    homeSection5: {
                      ...roomRatesSection,
                      bottomBox: {
                        ...roomRatesSection?.bottomBox,
                        title: e.target.value,
                      },
                    },
                  },
                })
              }
              className="relative z-20 bg-transparent border-2 border-gray-400 border-dashed text-black text-center p-2 outline-none font-bold"
              style={{
                fontFamily: "Ogg",
                fontWeight: 700,
                fontSize: "clamp(24px, 5vw, 30px)",
                lineHeight: "120%",
              }}
              placeholder="Bottom section title..."
            />
          ) : (
            <h1
              className="relative z-20"
              style={{
                fontFamily: "Ogg",
                fontWeight: 700,
                fontStyle: "normal",
                fontSize: "clamp(24px, 5vw, 30px)",
                lineHeight: "120%",
                letterSpacing: "0%",
                textAlign: "center",
              }}
            >
              {roomRatesSection?.bottomBox?.title || "Culinary Excellence"}
            </h1>
          )}
          {isEditMode ? (
            <textarea
              value={
                roomRatesSection?.bottomBox?.description ||
                "Experience world-class cuisine in our glassmorphism-designed dining spaces"
              }
              onChange={(e) =>
                setInstitutionData({
                  ...institutionData,
                  homeSection: {
                    ...institutionData.homeSection,
                    homeSection5: {
                      ...roomRatesSection,
                      bottomBox: {
                        ...roomRatesSection?.bottomBox,
                        description: e.target.value,
                      },
                    },
                  },
                })
              }
              className="relative z-20 bg-transparent border-2 border-gray-400 border-dashed text-black text-center p-2 outline-none resize-none max-w-[90%] md:max-w-full"
              style={{
                fontFamily: "Poppins",
                fontWeight: 400,
                fontSize: "clamp(14px, 3vw, 16px)",
                lineHeight: "140%",
              }}
              rows="2"
              cols={"100"}
              placeholder="Bottom section description..."
            />
          ) : (
            <p
              className="relative z-20 max-w-[90%] md:max-w-full"
              style={{
                fontFamily: "Poppins",
                fontWeight: 400,
                fontStyle: "normal",
                fontSize: "clamp(14px, 3vw, 16px)",
                lineHeight: "140%",
                letterSpacing: "0%",
                textAlign: "center",
              }}
            >
              {roomRatesSection?.bottomBox?.description ||
                "Experience world-class cuisine in our glassmorphism-designed dining spaces"}
            </p>
          )}
          <button
            className="bg-white text-black px-6 md:px-8 py-3 md:py-4 rounded-full z-50 cursor-pointer relative"
            style={{
              boxShadow: "4px 5px 0px 0px #000000",
              fontFamily: "Montserrat",
              fontWeight: 800,
              fontStyle: "normal",
              fontSize: "clamp(14px, 3vw, 16px)",
              lineHeight: "100%",
              letterSpacing: "0%",
              textAlign: "center",
            }}
          >
            {isEditMode ? (
              <input
                type="text"
                value={
                  roomRatesSection?.bottomBox?.buttonText
                }
                onChange={(e) =>
                  setInstitutionData({
                    ...institutionData,
                    homeSection: {
                      ...institutionData.homeSection,
                      homeSection5: {
                        ...roomRatesSection,
                        bottomBox: {
                          ...roomRatesSection?.bottomBox,
                          buttonText: e.target.value,
                        },
                      },
                    },
                  })
                }
                className="bg-transparent border-2 border-gray-400 border-dashed text-black text-center outline-none font-bold"
                style={{
                  fontFamily: "Montserrat",
                  fontWeight: 800,
                  fontSize: "clamp(14px, 3vw, 16px)",
                  lineHeight: "100%",
                }}
                placeholder="Button text..."
              />
            ) : (
              roomRatesSection?.bottomBox?.buttonText || "Make Reservation"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoomRates;
