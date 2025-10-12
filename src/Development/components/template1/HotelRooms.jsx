import React from "react";
import { useEditContext } from "../../context/EditModeContext.jsx";
import ImageUploadModal from "../ui/ImageUploadModal.jsx";
import { useInstitutionContext } from "../../context/InstitutionContext.jsx";

export default function HotelRooms() {
  const { institutionData, setInstitutionData } = useInstitutionContext();
  const { isEditMode, toggleEditMode } = useEditContext();

  const [isImageEdit, setIsImageEdit] = React.useState(false);
  const [imageMetaData, setImageMetaData] = React.useState(null);

  const HotelRoomsData = institutionData.hotelRooms;

  return (
    <div className="relative">
      {isImageEdit && imageMetaData && (
        <ImageUploadModal
          onClose={() => setIsImageEdit(false)}
          onUploadComplete={imageMetaData.onUploadComplete}
          folderName={imageMetaData.folderName}
          acceptedTypes={imageMetaData.acceptedTypes}
          title={imageMetaData.title}
        />
      )}
      {/* Content Container with Conditional Blur */}
      <div className={isImageEdit ? "filter blur-lg" : ""}>
        <div className="flex flex-col items-center p-10 bg-white">
          {isEditMode ? (
            <div className="flex justify-center items-center gap-1">
              <input
                type="text"
                value={HotelRoomsData.title.start || "Our"}
                onChange={(e) => {
                  const newTitle = {
                    ...HotelRoomsData.title,
                    start: e.target.value,
                  };
                  setInstitutionData((prev) => ({
                    ...prev,
                    hotelRooms: { ...prev.hotelRooms, title: newTitle },
                  }));
                }}
                className="text-4xl font-medium fjalla text-gray-900 border border-gray-300 rounded px-1 py-0.5 text-center"
                style={{ width: `${HotelRoomsData.title.start.length + 2}ch` }}
              />
              <input
                type="text"
                value={HotelRoomsData.title.highlight || "Best"}
                onChange={(e) => {
                  const newTitle = {
                    ...HotelRoomsData.title,
                    highlight: e.target.value,
                  };
                  setInstitutionData((prev) => ({
                    ...prev,
                    hotelRooms: { ...prev.hotelRooms, title: newTitle },
                  }));
                }}
                className="text-4xl font-medium fjalla text-orange-500 border border-gray-300 rounded px-1 py-0.5 text-center"
                style={{
                  width: `${HotelRoomsData.title.highlight.length + 2}ch`,
                }}
              />
              <input
                type="text"
                value={HotelRoomsData.title.end || "Rooms!"}
                onChange={(e) => {
                  const newTitle = {
                    ...HotelRoomsData.title,
                    end: e.target.value,
                  };
                  setInstitutionData((prev) => ({
                    ...prev,
                    hotelRooms: { ...prev.hotelRooms, title: newTitle },
                  }));
                }}
                className="text-4xl font-medium fjalla text-gray-900 border border-gray-300 rounded px-1 py-0.5 text-center"
                style={{ width: `${HotelRoomsData.title.end.length + 2}ch` }}
              />
            </div>
          ) : (
            <h2 className="text-5xl font-medium text-center fjalla">
              {HotelRoomsData.title.start || "Our"}{" "}
              <span className="text-orange-500">
                {HotelRoomsData.title.highlight || "Best"}
              </span>{" "}
              {HotelRoomsData.title.end || "Rooms!"}
            </h2>
          )}
          {isEditMode ? (
            <textarea
              value={
                HotelRoomsData.description || "Description of hotel rooms."
              }
              onChange={(e) => {
                setInstitutionData((prev) => ({
                  ...prev,
                  hotelRooms: {
                    ...prev.hotelRooms,
                    description: e.target.value,
                  },
                }));
              }}
              className="text-black text-center mt-2 text-lg font-bold cormorant border border-gray-300 rounded px-2 py-1 w-[40ch]"
              rows="2"
            />
          ) : (
            <p className="text-black text-center mt-2 text-lg font-bold cormorant">
              {HotelRoomsData.description || "Description of hotel rooms."}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-8 w-full max-w-6xl">
            {/* Discount Card */}
            <div className="bg-orange-500 text-white p-7 rounded-2xl flex flex-col items-center justify-center text-center">
              {isEditMode ? (
                <>
                  <input
                    type="text"
                    value={HotelRoomsData.discount.title || "Discount Title"}
                    onChange={(e) => {
                      const newDiscount = {
                        ...HotelRoomsData.discount,
                        title: e.target.value,
                      };
                      setInstitutionData((prev) => ({
                        ...prev,
                        hotelRooms: {
                          ...prev.hotelRooms,
                          discount: newDiscount,
                        },
                      }));
                    }}
                    className="text-3xl font-bold fjalla text-white border border-gray-300 rounded px-2 py-1 w-[300px] text-center"
                  />
                  <textarea
                    value={
                      HotelRoomsData.discount.description ||
                      "Discount description goes here."
                    }
                    onChange={(e) => {
                      const newDiscount = {
                        ...HotelRoomsData.discount,
                        description: e.target.value,
                      };
                      setInstitutionData((prev) => ({
                        ...prev,
                        hotelRooms: {
                          ...prev.hotelRooms,
                          discount: newDiscount,
                        },
                      }));
                    }}
                    className="text-3xl font-bold fjalla text-white border border-gray-300 rounded px-2 py-1 w-[300px] text-center"
                  />
                  <input
                    type="text"
                    value={HotelRoomsData.discount.buttonText || "Button Text"}
                    onChange={(e) => {
                      const newDiscount = {
                        ...HotelRoomsData.discount,
                        buttonText: e.target.value,
                      };
                      setInstitutionData((prev) => ({
                        ...prev,
                        hotelRooms: {
                          ...prev.hotelRooms,
                          discount: newDiscount,
                        },
                      }));
                    }}
                    className="bg-white text-orange-500 cormorant text-2xl font-semibold px-5 py-2 mt-20 rounded-lg shadow-md border border-gray-300"
                  />
                </>
              ) : (
                <>
                  <h3 className="text-3xl font-bold fjalla w-[300px] text-[45px] h-[57px] flex items-center justify-center">
                    {HotelRoomsData.discount.title || "Discount Title"}
                  </h3>
                  <p className="text-xl font-bold mt-6 cormorant text-purple-950">
                    {HotelRoomsData.discount.description ||
                      "Discount description goes here."}
                  </p>
                  {/*<button className="bg-white text-orange-500 cormorant text-2xl font-semibold px-5 py-2 mt-20 rounded-lg shadow-md hover:bg-gray-100 transition">*/}
                  {/*  {HotelRoomsData.discount.buttonText}*/}
                  {/*</button>*/}
                </>
              )}
            </div>

            {/* Hotel Room Images */}
            <div className="grid grid-cols-1 gap-4 sm:col-span-1 md:col-span-2">
              <div className="grid grid-cols-2 gap-4">
                {HotelRoomsData.images.slice(0, 2).map((src, index) => (
                  <div key={index} className="relative">
                    <img
                      className="rounded-2xl w-full h-56 object-cover shadow-lg"
                      src={src || "https://placehold.co/200"}
                      alt={`Room ${index + 1}`}
                    />
                    {isEditMode && (
                      <button
                        onClick={() => {
                          setIsImageEdit(true);
                          setImageMetaData({
                            onUploadComplete: (newSrc) => {
                              const updatedImages = [...HotelRoomsData.images];
                              updatedImages[index] = newSrc;
                              setInstitutionData((prev) => ({
                                ...prev,
                                hotelRooms: {
                                  ...prev.hotelRooms,
                                  images: updatedImages,
                                },
                              }));
                              setIsImageEdit(false);
                            },
                            title: `Edit Image ${index + 1}`,
                            folderName: "HotelRoomsSection",
                            acceptedTypes: ["image/jpeg", "image/png"],
                          });
                        }}
                        className="absolute top-2 right-2 bg-orange-500 text-white p-2 rounded-full hover:bg-orange-600 transition-colors z-10"
                        aria-label={`Edit Image ${index + 1}`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {HotelRoomsData.images.slice(2, 4).map((src, index) => (
                  <div key={index + 2} className="relative">
                    <img
                      className="rounded-2xl w-full h-56 object-cover shadow-lg"
                      src={src || "https://placehold.co/200"}
                      alt={`Room ${index + 3}`}
                    />
                    {isEditMode && (
                      <button
                        onClick={() => {
                          setIsImageEdit(true);
                          setImageMetaData({
                            onUploadComplete: (newSrc) => {
                              const updatedImages = [...HotelRoomsData.images];
                              updatedImages[index + 2] = newSrc;
                              setInstitutionData((prev) => ({
                                ...prev,
                                hotelRooms: {
                                  ...prev.hotelRooms,
                                  images: updatedImages,
                                },
                              }));
                              setIsImageEdit(false);
                            },
                            title: `Edit Image ${index + 3}`,
                            folderName: "HotelRoomsSection",
                            acceptedTypes: ["image/jpeg", "image/png"],
                          });
                        }}
                        className="absolute top-2 right-2 bg-orange-500 text-white p-2 rounded-full hover:bg-orange-600 transition-colors z-10"
                        aria-label={`Edit Image ${index + 3}`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
