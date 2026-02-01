import React, { useState } from "react";
import { useEditContext } from "../../context/EditModeContext.jsx";
import ImageUploadModal from "../ui/ImageUploadModal.jsx";
import { useInstitutionContext } from "../../context/InstitutionContext.jsx";

const WhyStayHere = () => {
  const { institutionData, setInstitutionData } = useInstitutionContext();
  const { isEditMode } = useEditContext();

  const whyStayHereData = institutionData?.whyStayHere;
  const [currentLoungeImageIndex, setCurrentLoungeImageIndex] = useState(0);

  const [isImageEdit, setIsImageEdit] = React.useState(false);
  const [imageMetaData, setImageMetaData] = React.useState(null);

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

      <div
        className={`bg-champagne py-8 sm:py-12 md:py-16 px-4 sm:px-6 md:px-10 lg:px-20 `}
      >
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-start gap-8 md:gap-12">
          {/* Left Section - Text */}
          <div className="w-full lg:w-1/2">
            {isEditMode ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={whyStayHereData?.title }
                  placeholder="Title"
                  onChange={(e) => {
                    setInstitutionData((prev) => ({
                      ...prev,
                      whyStayHere: {
                        ...prev.whyStayHere,
                        title: e.target.value,
                      },
                    }));
                  }}
                  className="text-2xl sm:text-3xl font-semibold text-gray-800 fjalla border border-gray-300 rounded px-1 py-0.5 text-center"
                  style={{ width: `${whyStayHereData?.title?.length + 2}ch` }}
                />
                <input
                  type="text"
                  value={whyStayHereData?.titleHighlight}
                  placeholder="Title Highlight"
                  onChange={(e) => {
                    setInstitutionData((prev) => ({
                      ...prev,
                      whyStayHere: {
                        ...prev.whyStayHere,
                        titleHighlight: e.target.value,
                      },
                    }));
                  }}
                  className="text-2xl sm:text-3xl font-semibold text-gold fjalla border border-gray-300 rounded px-1 py-0.5 text-center"
                  style={{
                    width: `${whyStayHereData?.titleHighlight?.length + 2}ch`,
                  }}
                />
              </div>
            ) : (
              <h2 className="text-3xl sm:text-4xl font-semibold text-white fjalla">
                {whyStayHereData?.title || "Why You Should"}{" "}
                <span className="text-gradient-gold fjalla">
                  {whyStayHereData?.titleHighlight || "Stay Here"}
                </span>
              </h2>
            )}
            {isEditMode ? (
              <textarea
                value={whyStayHereData?.introText}
                onChange={(e) => {
                  setInstitutionData((prev) => ({
                    ...prev,
                    whyStayHere: {
                      ...prev.whyStayHere,
                      introText: e.target.value,
                    },
                  }));
                }}
                className="text-black mt-2 sm:mt-3 cormorant font-semibold border border-gray-300 rounded px-1 py-0.5 w-[55ch]"
                rows="2"
                placeholder="Enter text"
              />
            ) : (
              <p className="text-black mt-2 sm:mt-3 cormorant font-semibold">
                {whyStayHereData?.introText || "Intro Text"}
              </p>
            )}

            <div className="mt-6 sm:mt-8 md:mt-10 space-y-6 sm:space-y-8">
              {/* Point 1 */}
              {whyStayHereData?.points?.map((point, index) => (
                <div key={index} className="flex items-start gap-3 sm:gap-4">
                  <div className="bg-gold text-white w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold flex-shrink-0">
                    {index + 1}
                  </div>
                  <div>
                    {isEditMode ? (
                      <input
                        type="text"
                        value={point.title || "Point Title"}
                        onChange={(e) => {
                          setInstitutionData((prev) => ({
                            ...prev,
                            whyStayHere: {
                              ...prev.whyStayHere,
                              points: prev.whyStayHere.points.map((p, i) =>
                                i === index
                                  ? { ...p, title: e.target.value }
                                  : p
                              ),
                            },
                          }));
                        }}
                        className="text-base sm:text-lg text-gray-800 fjalla border border-gray-300 rounded px-2 py-1 w-full"
                      />
                    ) : (
                      <h3 className="text-base sm:text-lg text-gray-800 fjalla">
                        {point.title || "Point Title"}
                      </h3>
                    )}
                    {isEditMode ? (
                      <textarea
                        value={point.text || "Point description goes here."}
                        onChange={(e) => {
                          setInstitutionData((prev) => ({
                            ...prev,
                            whyStayHere: {
                              ...prev.whyStayHere,
                              points: prev.whyStayHere.points.map((p, i) =>
                                i === index ? { ...p, text: e.target.value } : p
                              ),
                            },
                          }));
                        }}
                        className="text-black mt-1 cormorant text-sm sm:text-base border border-gray-300 rounded px-2 py-1 w-full"
                      />
                    ) : (
                      <p className="text-black mt-1 cormorant text-sm sm:text-base">
                        {point.text || "Point description goes here."}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Section - Image & Ratings */}
          <div className="w-full lg:w-1/2 relative mt-8 lg:mt-0">
            <div className="relative">
              <img
                src={whyStayHereData?.mainImage || "https://placehold.co/400"}
                alt="Room"
                className="rounded-xl shadow-xl w-full h-64 sm:h-80 md:h-96 object-cover"
              />
              {/* Image Upload */}
              {isEditMode && (
                <button
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-orange-500 text-white p-2 rounded-full hover:bg-orange-600 transition-colors z-10"
                  aria-label="Edit Main Image"
                  onClick={() => {
                    setIsImageEdit(true);
                    setImageMetaData({
                      onUploadComplete: (url) => {
                        setInstitutionData((prevData) => ({
                          ...prevData,
                          whyStayHere: {
                            ...prevData.whyStayHere,
                            mainImage: url,
                          },
                        }));
                      },
                      title: "Edit Main Image",
                      folderName: "whyStayHere",
                      acceptedTypes: ["image/jpeg", "image/png"],
                    });
                  }}
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

            {/* Rating cards */}
            {/* Cody Fisher */}

            <div className="absolute top-0 right-0 translate-x-1/4 -translate-y-1/4 sm:translate-x-1/3 sm:-translate-y-1/3 bg-white shadow-md rounded-lg px-2 py-1 sm:px-3 sm:py-2 flex items-center gap-1 sm:gap-2 max-w-[160px] sm:max-w-none">
              {isEditMode ? (
                // Image Upload
                <div className="flex flex-col gap-2">
                  <div className="relative">
                    <img
                      src={
                        whyStayHereData?.ratings?.length > 0 ? whyStayHereData?.ratings[0]?.image : "https://randomuser.me/api/portraits/men/1.jpg" ||
                        "https://randomuser.me/api/portraits/men/1.jpg"
                      }
                      alt="Cody"
                      className="w-6 h-6 sm:w-8 sm:h-8 rounded-full"
                    />
                    <button
                      onClick={() => {
                        setIsImageEdit(true);
                        setImageMetaData({
                          onUploadComplete: (url) => {
                            setInstitutionData((prevData) => ({
                              ...prevData,
                              whyStayHere: {
                                ...prevData.whyStayHere,
                                ratings: prevData.whyStayHere.ratings.map(
                                  (rating, i) =>
                                    i === 0 ? { ...rating, image: url } : rating
                                ),
                              },
                            }));
                          },
                          title: "Edit Reviewer Image 1",
                          folderName: "whyStayHere/ratings",
                          acceptedTypes: ["image/jpeg", "image/png"],
                        });
                      }}
                      className="absolute top-0 right-0 bg-orange-500 text-white p-1 rounded-full hover:bg-orange-600 transition-colors"
                      aria-label="Edit Reviewer Image 1"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
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
                  </div>
                  <input
                    type="text"
                    value={ whyStayHereData?.ratings?.length > 0 ? whyStayHereData?.ratings[0]?.name : "Name"}
                    onChange={(e) => {
                      setInstitutionData((prevData) => ({
                        ...prevData,
                        whyStayHere: {
                          ...prevData.whyStayHere,
                          ratings: prevData.whyStayHere.ratings.map(
                            (rating, i) =>
                              i === 0
                                ? { ...rating, name: e.target.value }
                                : rating
                          ),
                        },
                      }));
                    }}
                    className="text-xs sm:text-sm font-semibold border border-gray-300 rounded px-1 py-0.5"
                  />
                  <input
                    type="text"
                    value={ whyStayHereData?.ratings?.length > 0 ? whyStayHereData?.ratings[0]?.score : "0"}
                    onChange={(e) => {
                      setInstitutionData((prevData) => ({
                        ...prevData,
                        whyStayHere: {
                          ...prevData.whyStayHere,
                          ratings: prevData.whyStayHere.ratings.map(
                            (rating, i) =>
                              i === 0
                                ? { ...rating, score: e.target.value }
                                : rating
                          ),
                        },
                      }));
                    }}
                    className="text-xs text-orange-500 border border-gray-300 rounded px-1 py-0.5"
                  />
                </div>
              ) : (
                <>
                  <img
                    src={
                       whyStayHereData?.ratings?.length > 0 ? whyStayHereData?.ratings[0]?.image : "https://randomuser.me/api/portraits/men/1.jpg" ||
                      "https://randomuser.me/api/portraits/men/1.jpg"
                    }
                    alt="Cody"
                    className="w-6 h-6 sm:w-8 sm:h-8 rounded-full"
                  />
                  <div>
                    <p className="text-xs sm:text-sm font-semibold">
                      {whyStayHereData?.ratings?.length > 0 ? whyStayHereData?.ratings[0]?.name : "Name"}
                    </p>
                    <p className="text-xs text-orange-500">
                      {whyStayHereData?.ratings?.length > 0 ? whyStayHereData?.ratings[0]?.score : "0"}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Albert Flores */}
            <div className="hidden sm:flex absolute top-1/3 left-[-20px] md:left-[-40px] lg:left-[-60px] bg-white shadow-md rounded-lg px-2 py-1 sm:px-3 sm:py-2 items-center gap-1 sm:gap-2">
              {isEditMode ? (
                <div className="flex flex-col gap-2">
                  <div className="relative">
                    <img
                      src={
                        whyStayHereData?.ratings?.length > 1 ? whyStayHereData?.ratings[1]?.image : "https://randomuser.me/api/portraits/men/1.jpg" ||
                        "https://randomuser.me/api/portraits/men/1.jpg"
                      }
                      alt="Albert"
                      className="w-6 h-6 sm:w-8 sm:h-8 rounded-full"
                    />
                    <button
                      onClick={() => {
                        setIsImageEdit(true);
                        setImageMetaData({
                          onUploadComplete: (url) => {
                            setInstitutionData((prevData) => ({
                              ...prevData,
                              whyStayHere: {
                                ...prevData.whyStayHere,
                                ratings: prevData.whyStayHere.ratings.map(
                                  (rating, i) =>
                                    i === 1 ? { ...rating, image: url } : rating
                                ),
                              },
                            }));
                          },
                          title: "Edit Reviewer Image 2",
                          folderName: "whyStayHere/ratings",
                          acceptedTypes: ["image/jpeg", "image/png"],
                        });
                      }}
                      className="absolute top-0 right-0 bg-orange-500 text-white p-1 rounded-full hover:bg-orange-600 transition-colors"
                      aria-label="Edit Reviewer Image 2"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
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
                  </div>
                  <input
                    type="text"
                    value={ whyStayHereData?.ratings?.length > 1 ? whyStayHereData?.ratings[1]?.name : "Name"}
                    onChange={(e) => {
                      setInstitutionData((prevData) => ({
                        ...prevData,
                        whyStayHere: {
                          ...prevData.whyStayHere,
                          ratings: prevData.whyStayHere.ratings.map(
                            (rating, i) =>
                              i === 1
                                ? { ...rating, name: e.target.value }
                                : rating
                          ),
                        },
                      }));
                    }}
                    className="text-xs sm:text-sm font-semibold border border-gray-300 rounded px-1 py-0.5"
                  />
                  <input
                    type="text"
                    value={ whyStayHereData?.ratings?.length > 1 ? whyStayHereData?.ratings[1]?.score : "0"}
                    onChange={(e) => {
                      setInstitutionData((prevData) => ({
                        ...prevData,
                        whyStayHere: {
                          ...prevData.whyStayHere,
                          ratings: prevData.whyStayHere.ratings.map(
                            (rating, i) =>
                              i === 1
                                ? { ...rating, score: e.target.value }
                                : rating
                          ),
                        },
                      }));
                    }}
                    className="text-xs text-orange-500 border border-gray-300 rounded px-1 py-0.5"
                  />
                </div>
              ) : (
                <>
                  <img
                    src={
                      whyStayHereData?.ratings?.length > 1 ? whyStayHereData?.ratings[1]?.image : "https://randomuser.me/api/portraits/men/1.jpg" ||
                      "https://randomuser.me/api/portraits/men/1.jpg"}
                    alt="Albert"
                    className="w-6 h-6 sm:w-8 sm:h-8 rounded-full"
                  />
                  <div>
                    <p className="text-xs sm:text-sm font-semibold">
                      { whyStayHereData?.ratings?.length > 1 ? whyStayHereData?.ratings[1]?.name : "Name"}
                    </p>
                    <p className="text-xs text-orange-500">
                      {whyStayHereData?.ratings?.length > 1 ? whyStayHereData?.ratings[1]?.score : "0"}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Devon Lane */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/4 sm:translate-y-1/2 bg-white shadow-md rounded-lg px-2 py-1 sm:px-3 sm:py-2 flex items-center gap-1 sm:gap-2 max-w-[160px] sm:max-w-none">
              {isEditMode ? (
                <div className="flex flex-col gap-2">
                  <div className="relative">
                    <img
                      src={
                         whyStayHereData?.ratings?.length > 2 ? whyStayHereData?.ratings[2]?.image : "https://randomuser.me/api/portraits/men/1.jpg" ||
                        "https://randomuser.me/api/portraits/men/1.jpg"
                      }
                      alt="Devon"
                      className="w-6 h-6 sm:w-8 sm:h-8 rounded-full"
                    />
                    <button
                      onClick={() => {
                        setIsImageEdit(true);
                        setImageMetaData({
                          onUploadComplete: (url) => {
                            setInstitutionData((prevData) => ({
                              ...prevData,
                              whyStayHere: {
                                ...prevData.whyStayHere,
                                ratings: prevData.whyStayHere.ratings.map(
                                  (rating, i) =>
                                    i === 2 ? { ...rating, image: url } : rating
                                ),
                              },
                            }));
                          },
                          title: "Edit Reviewer Image 3",
                          folderName: "whyStayHere/ratings",
                          acceptedTypes: ["image/jpeg", "image/png"],
                        });
                      }}
                      className="absolute top-0 right-0 bg-orange-500 text-white p-1 rounded-full hover:bg-orange-600 transition-colors"
                      aria-label="Edit Reviewer Image 3"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
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
                  </div>
                  <input
                    type="text"
                    value={ whyStayHereData?.ratings?.length > 2 ? whyStayHereData?.ratings[2]?.name : "Name"}
                    onChange={(e) => {
                      setInstitutionData((prevData) => ({
                        ...prevData,
                        whyStayHere: {
                          ...prevData.whyStayHere,
                          ratings: prevData.whyStayHere.ratings.map(
                            (rating, i) =>
                              i === 2
                                ? { ...rating, name: e.target.value }
                                : rating
                          ),
                        },
                      }));
                    }}
                    className="text-xs sm:text-sm font-semibold border border-gray-300 rounded px-1 py-0.5"
                  />
                  <input
                    type="text"
                    value={ whyStayHereData?.ratings?.length > 2 ? whyStayHereData?.ratings[2]?.score : "0"}
                    onChange={(e) => {
                      setInstitutionData((prevData) => ({
                        ...prevData,
                        whyStayHere: {
                          ...prevData.whyStayHere,
                          ratings: prevData.whyStayHere.ratings.map(
                            (rating, i) =>
                              i === 2
                                ? { ...rating, score: e.target.value }
                                : rating
                          ),
                        },
                      }));
                    }}
                    className="text-xs text-orange-500 border border-gray-300 rounded px-1 py-0.5"
                  />
                </div>
              ) : (
                <>
                  <img
                    src={
                      whyStayHereData?.ratings?.length > 2 ? whyStayHereData?.ratings[2]?.image : "https://randomuser.me/api/portraits/men/1.jpg" ||
                      "https://randomuser.me/api/portraits/men/1.jpg"
                    }
                    alt="Devon"
                    className="w-6 h-6 sm:w-8 sm:h-8 rounded-full"
                  />
                  <div>
                    <p className="text-xs sm:text-sm font-semibold">
                      { whyStayHereData?.ratings?.length > 2 ? whyStayHereData?.ratings[2]?.name : "Name"}
                    </p>
                    <p className="text-xs text-orange-500">
                      { whyStayHereData?.ratings?.length > 2 ? whyStayHereData?.ratings[2]?.score : "0"}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Additional Section - Wellness, Architecture, etc. */}
        
        <div className="py-12 px-6 md:px-20 bg-gold-rich relative overflow-hidden">
        {/* Decorative Gold Overlay Pattern */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #FFD700 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 md:gap-10">
           
            <div className="text-white text-2xl sm:text-3xl space-y-6 sm:space-y-8 text-center md:text-left w-full md:w-auto">
              {whyStayHereData?.categories.map((category, index) =>
                isEditMode ? (
                  <input
                    key={index}
                    type="text"
                    value={category.name || "Category Name"}
                    onClick={() => setCurrentLoungeImageIndex(index)}
                    onChange={(e) => {
                      setInstitutionData((prev) => ({
                        ...prev,
                        whyStayHere: {
                          ...prev.whyStayHere,
                          categories: prev.whyStayHere.categories.map(
                            (cat, i) =>
                              i === index
                                ? { ...cat, name: e.target.value }
                                : cat
                          ),
                        },
                      }));
                    }}
                    className="border border-gray-300 rounded px-2 py-1 w-full text-gray-800 fjalla"
                  />
                ) : (
                  <p
                    onClick={() => setCurrentLoungeImageIndex(index)}
                    key={index}
                    className={`cursor-pointer hover:text-gray-200 transition-colors ${
                      currentLoungeImageIndex === index ? "text-gray-300" : ""
                    }`}
                  >
                    {category?.name || "Category Name"}
                  </p>
                )
              )}
            </div>

            
            <div className="w-full md:w-1/2 mt-6 md:mt-0 relative">
              <img
                src={
                  whyStayHereData?.categories[currentLoungeImageIndex].link ||
                  "https://placehold.co/400"
                }
                alt="Lounge"
                className="rounded-xl shadow-lg object-cover w-full h-64 sm:h-80"
              />
         
              {isEditMode && (
                <button
                  onClick={() => {
                    setIsImageEdit(true);
                    setImageMetaData({
                      onUploadComplete: (url) => {
                        setInstitutionData((prevData) => ({
                          ...prevData,
                          whyStayHere: {
                            ...prevData.whyStayHere,
                            categories: prevData.whyStayHere.categories.map(
                              (cat, i) =>
                                i === currentLoungeImageIndex
                                  ? { ...cat, link: url }
                                  : cat
                            ),
                          },
                        }));
                      },
                      title: `Edit ${whyStayHereData.categories[currentLoungeImageIndex].name} Image`,
                      folderName: "whyStayHere/categories",
                      acceptedTypes: ["image/jpeg", "image/png"],
                    });
                  }}
                  className="absolute top-2 right-2 bg-orange-500 text-white p-2 rounded-full hover:bg-orange-600 transition-colors"
                  aria-label="Edit Lounge Image"
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
          </div>
        </div>

        {/* Floating Image Cards Section */}
        <div className="relative mt-12 sm:mt-16">
          {/* Background Image */}
          <div className="relative">
            <img
              src={
                whyStayHereData?.images?.main || "https://placehold.co/600x300"
              }
              alt="Ocean"
              className="w-full h-[300px] sm:h-[400px] object-cover"
            />
            {isEditMode && (
              <button
                onClick={() => {
                  setIsImageEdit(true);
                  setImageMetaData({
                    onUploadComplete: (url) => {
                      setOceanImage(url);
                      setInstitutionData((prevData) => ({
                        ...prevData,
                        whyStayHere: {
                          ...prevData.whyStayHere,
                          images: {
                            ...prevData.whyStayHere.images,
                            main: url,
                          },
                        },
                      }));
                    },
                    title: "Edit Main Image",
                    folderName: "whyStayHere/floatingSection",
                    acceptedTypes: ["image/jpeg", "image/png"],
                  });
                }}
                className="absolute top-2 right-2 bg-orange-500 text-white p-2 rounded-full hover:bg-orange-600 transition-colors z-10"
                aria-label="Edit Ocean Image"
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

          {/* Floating Cards */}
          <div className="absolute top-1/2 left-0 right-0 transform -translate-y-1/2 px-4 overflow-x-auto">
            <div className="flex justify-start md:justify-center gap-4 pb-4 min-w-max md:min-w-0 md:px-0">
              {whyStayHereData?.images?.floating.map((item, index) => (
                <div
                  key={index}
                  className="relative w-40 h-56 sm:w-48 sm:h-64 md:w-56 md:h-72 lg:w-60 lg:h-80 flex-shrink-0 shadow-lg rounded-xl overflow-hidden"
                >
                  <img
                    src={item.src || "https://placehold.co/200x300"}
                    alt={`Floating ${index + 1}`}
                    className="w-full h-full object-cover rounded-xl"
                  />
                  {isEditMode && (
                    <>
                      <button
                        onClick={() => {
                          setIsImageEdit(true);
                          setImageMetaData({
                            onUploadComplete: (url) => {
                              const updatedImages = [
                                ...whyStayHereData.images.floating,
                              ];
                              updatedImages[index] = {
                                ...updatedImages[index],
                                src: url,
                              };
                              setInstitutionData((prevData) => ({
                                ...prevData,
                                whyStayHere: {
                                  ...prevData.whyStayHere,
                                  images: {
                                    ...prevData.whyStayHere.images,
                                    floating: updatedImages,
                                  },
                                },
                              }));
                            },
                            title: `Edit Floating Image ${index + 1}`,
                            folderName: "whyStayHere/floatingSection",
                            acceptedTypes: ["image/jpeg", "image/png"],
                          });
                        }}
                        className="absolute top-2 right-2 bg-orange-500 text-white p-2 rounded-full hover:bg-orange-600 transition-colors"
                        aria-label={`Edit Floating Image ${index + 1}`}
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
                      <input
                        type="text"
                        value={item.label || "Label"}
                        onChange={(e) => {
                          const updatedImages = [
                            ...whyStayHereData.images.floating,
                          ];
                          updatedImages[index] = {
                            ...updatedImages[index],
                            label: e.target.value,
                          };
                          setInstitutionData((prevData) => ({
                            ...prevData,
                            whyStayHere: {
                              ...prevData.whyStayHere,
                              images: {
                                ...prevData.whyStayHere.images,
                                floating: updatedImages,
                              },
                            },
                          }));
                        }}
                        className="absolute bottom-2 left-2 border border-gray-300 rounded px-2 py-1 w-[calc(100%-16px)] text-sm cormorant"
                        placeholder="Enter label"
                      />
                    </>
                  )}
                  {item.label && !isEditMode && (
                    <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white px-2 py-1 text-xs sm:text-sm rounded">
                      {item.label || "Label"}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Hashtag and social links */}
          <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 text-white text-base sm:text-lg fjalla">
            {isEditMode ? (
              <input
                type="text"
                value={whyStayHereData?.hashtag || "#YourHashtag"}
                onChange={(e) => {
                  setInstitutionData((prevData) => ({
                    ...prevData,
                    whyStayHere: {
                      ...prevData.whyStayHere,
                      hashtag: e.target.value,
                    },
                  }));
                }}
                className="border border-gray-300 rounded px-2 py-1 text-black fjalla"
              />
            ) : (
              whyStayHereData?.hashtag || "#YourHashtag"
            )}
          </div>

          {/* Social Media Icons */}
          <div className="absolute bottom-2 sm:bottom-4 right-2 sm:right-4 flex gap-2 sm:gap-3">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gradient-gold p-1 sm:p-2 rounded-full flex items-center justify-center hover:brightness-110 transition-all shadow-gold"
            >
              <img
                src="https://img.icons8.com/ios-filled/50/ffffff/instagram-new.png"
                alt="Instagram"
                className="w-4 h-4 sm:w-5 sm:h-5"
              />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gradient-gold p-1 sm:p-2 rounded-full flex items-center justify-center hover:brightness-110 transition-all shadow-gold"
            >
              <img
                src="https://img.icons8.com/ios-filled/50/ffffff/twitter.png"
                alt="Twitter"
                className="w-4 h-4 sm:w-5 sm:h-5"
              />
            </a>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gradient-gold p-1 sm:p-2 rounded-full flex items-center justify-center hover:brightness-110 transition-all shadow-gold"
            >
              <img
                src="https://img.icons8.com/ios-filled/50/ffffff/facebook-new.png"
                alt="Facebook"
                className="w-4 h-4 sm:w-5 sm:h-5"
              />
            </a>
          </div>
        </div>

        {/* Grid Images Section */}
        <div className="relative mt-12 sm:mt-16">
          {/* Background Image */}
          <div className="relative">
            <img
              src={
                whyStayHereData?.images?.gridBg || "https://placehold.co/600x400"
              }
              alt="Hotel Background"
              className="w-full h-[400px] sm:h-[500px] object-cover opacity-100"
            />
            {isEditMode && (
              <button
                onClick={() => {
                  setIsImageEdit(true);
                  setImageMetaData({
                    onUploadComplete: (url) => {
                      setInstitutionData((prevData) => ({
                        ...prevData,
                        whyStayHere: {
                          ...prevData.whyStayHere,
                          images: {
                            ...prevData.whyStayHere.images,
                            gridBg: url,
                          },
                        },
                      }));
                    },
                    title: "Edit Hotel Background Image",
                    folderName: "whyStayHere/gridSection",
                    acceptedTypes: ["image/jpeg", "image/png"],
                  });
                }}
                className="absolute top-0 right-0 bg-orange-500 text-white p-2 rounded-full hover:bg-orange-600 transition-colors z-10"
                aria-label="Edit Hotel Background Image"
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

          {/* Overlay for better contrast */}
          <div className="absolute inset-0 bg-opacity-40 rounded-xl"></div>

          {/* Grid Layout */}
          <div className="absolute inset-0 p-3 sm:p-4 md:p-6">
            <div className="h-full flex flex-col sm:flex-row gap-3 sm:gap-4">
              {/* First big image */}
              <div className="w-full sm:w-1/3 h-1/3 sm:h-full rounded-lg overflow-hidden shadow-lg relative">
                <img
                  src={
                    whyStayHereData?.images?.gridBig ||
                    "https://placehold.co/400x300"
                  }
                  alt="Big"
                  className="w-full h-full object-cover rounded-lg"
                />
                {isEditMode && (
                  <button
                    onClick={() => {
                      setIsImageEdit(true);
                      setImageMetaData({
                        onUploadComplete: (url) => {
                          setInstitutionData((prevData) => ({
                            ...prevData,
                            whyStayHere: {
                              ...prevData.whyStayHere,
                              images: {
                                ...prevData.whyStayHere.images,
                                gridBig: url,
                              },
                            },
                          }));
                        },
                        title: "Edit Big Grid Image",
                        folderName: "whyStayHere/gridSection",
                        acceptedTypes: ["image/jpeg", "image/png"],
                      });
                    }}
                    className="absolute top-2 right-2 bg-orange-500 text-white p-2 rounded-full hover:bg-orange-600 transition-colors"
                    aria-label="Edit Big Grid Image"
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

              {/* 2x2 Grid */}
              <div className="flex flex-1 h-2/3 sm:h-full gap-3 sm:gap-4">
                {/* Column 1 */}
                <div className="flex flex-col gap-3 sm:gap-4 w-1/2">
                  {[0, 1].map((index) => (
                    <div
                      key={index}
                      className="h-1/2 w-full rounded-lg overflow-hidden shadow-md relative"
                    >
                      <img
                        src={
                          whyStayHereData?.images?.grid[index] ||
                          "https://placehold.co/200x300"
                        }
                        alt={`${index + 1}`}
                        className="h-full w-full object-cover rounded-lg"
                      />
                      {isEditMode && (
                        <button
                          onClick={() => {
                            setIsImageEdit(true);
                            setImageMetaData({
                              onUploadComplete: (url) => {
                                const updatedImages = [...gridImages];
                                updatedImages[index] = url;
                                setInstitutionData((prevData) => ({
                                  ...prevData,
                                  whyStayHere: {
                                    ...prevData.whyStayHere,
                                    images: {
                                      ...prevData.whyStayHere.images,
                                      grid: updatedImages,
                                    },
                                  },
                                }));
                              },
                              title: `Edit Grid Image ${index + 1}`,
                              folderName: "whyStayHere/gridSection",
                              acceptedTypes: ["image/jpeg", "image/png"],
                            });
                          }}
                          className="absolute top-2 right-2 bg-orange-500 text-white p-2 rounded-full hover:bg-orange-600 transition-colors"
                          aria-label={`Edit Grid Image ${index + 1}`}
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

                {/* Column #2 */}
                <div className="flex flex-col gap-3 sm:gap-4 w-1/2">
                  {[2, 3].map((index) => (
                    <div
                      key={index}
                      className="h-1/2 w-full rounded-lg overflow-hidden shadow-md relative"
                    >
                      <img
                        src={
                          whyStayHereData?.images?.grid[index] ||
                          "https://placehold.co/200x300"
                        }
                        alt={`${index + 1}`}
                        className="h-full w-full object-cover rounded-lg"
                      />
                      {isEditMode && (
                        <button
                          onClick={() => {
                            setIsImageEdit(true);
                            setImageMetaData({
                              onUploadComplete: (url) => {
                                const updatedImages = [...gridImages];
                                updatedImages[index] = url;
                                setInstitutionData((prevData) => ({
                                  ...prevData,
                                  whyStayHere: {
                                    ...prevData.whyStayHere,
                                    images: {
                                      ...prevData.whyStayHere.images,
                                      grid: updatedImages,
                                    },
                                  },
                                }));
                              },
                              title: `Edit Grid Image ${index + 1}`,
                              folderName: "whyStayHere/gridSection",
                              acceptedTypes: ["image/jpeg", "image/png"],
                            });
                          }}
                          className="absolute top-2 right-2 bg-orange-500 text-white p-2 rounded-full hover:bg-orange-600 transition-colors"
                          aria-label={`Edit Grid Image ${index + 1}`}
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
    </div>
  );
};

export default WhyStayHere;
