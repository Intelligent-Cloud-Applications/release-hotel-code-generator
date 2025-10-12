import React from "react";
import { useEditContext } from "../../context/EditModeContext.jsx";
import ImageUploadModal from "../../components/ui/ImageUploadModal.jsx";
import { useInstitutionContext } from "../../context/InstitutionContext.jsx";

const TopPicksSection = () => {
  const { institutionData, setInstitutionData } = useInstitutionContext();
  const { isEditMode } = useEditContext();

  const topPicksData = institutionData?.topPicksSection || {};

  const [isImageEdit, setIsImageEdit] = React.useState(false);
  const [imageMetaData, setImageMetaData] = React.useState(null);

  return (
    <div className="py-16 px-6 md:px-20 bg-gray-50 relative">
      {isImageEdit && imageMetaData && (
        <ImageUploadModal
          onClose={() => setIsImageEdit(false)}
          onUploadComplete={imageMetaData.onUploadComplete}
          folderName={imageMetaData.folderName}
          acceptedTypes={imageMetaData.acceptedTypes}
          title={imageMetaData.title}
        />
      )}
      <div className="max-w-7xl mx-auto text-center">
        <div className="border-t-2 border-orange-500 my-8"></div>
        {isEditMode ? (
          <div className="flex items-center justify-center gap-1 mb-4">
            <input
              type="text"
              value={topPicksData.title.start || ""}
              onChange={(e) => {
                setInstitutionData({
                  ...institutionData,
                  topPicksSection: {
                    ...topPicksData,
                    title: {
                      ...topPicksData.title,
                      start: e.target.value,
                    },
                  },
                });
              }}
              className="text-3xl font-semibold text-gray-900 fjalla border border-gray-300 rounded px-1 py-0.5 text-center"
              style={{ width: `${topPicksData.title.start.length + 4}ch` }}
            />
            <input
              type="text"
              value={topPicksData.title.highlight || ""}
              onChange={(e) => {
                setInstitutionData({
                  ...institutionData,
                  topPicksSection: {
                    ...topPicksData,
                    title: {
                      ...topPicksData.title,
                      highlight: e.target.value,
                    },
                  },
                });
              }}
              className="text-3xl font-semibold text-orange-500 fjalla border border-gray-300 rounded px-1 py-0.5 text-center"
              style={{ width: `${topPicksData.title.highlight.length + 4}ch` }}
            />
          </div>
        ) : (
          <h2 className="text-4xl font-semibold text-orange-500 fjalla">
            <span className="text-gray-900">{topPicksData.title.start}</span>
            <span className="text-orange-500">
              {topPicksData.title.highlight}
            </span>
          </h2>
        )}
        {isEditMode ? (
          <textarea
            value={topPicksData.description || ""}
            onChange={(e) => {
              setInstitutionData({
                ...institutionData,
                topPicksSection: {
                  ...topPicksData,
                  description: e.target.value,
                },
              });
            }}
            className="text-black mt-2 cormorant font-bold mx-auto border border-gray-300 rounded px-1 py-0.5 w-[40ch]"
            rows="2"
          />
        ) : (
          <p className="text-black mt-2 max-w-2xl cormorant font-bold mx-auto">
            {topPicksData.description}
          </p>
        )}

        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Image */}
          <div className="bg-white rounded-lg shadow flex items-center justify-center relative">
            <img
              src={topPicksData.images?.left}
              alt="Top Pick 1"
              className="w-full h-64 object-cover rounded-lg"
            />
            {isEditMode && (
              <button
                onClick={() => {
                  setIsImageEdit(true);
                  setImageMetaData({
                    onUploadComplete: (url) => {
                      const updatedImages = {
                        ...topPicksData.images,
                        left: url,
                      };
                      setInstitutionData({
                        ...institutionData,
                        topPicksSection: {
                          ...topPicksData,
                          images: updatedImages,
                        },
                      });
                    },
                    folderName: "topPicksSection",
                    acceptedTypes: ["image/jpeg", "image/png"],
                    title: `Edit Left Image`,
                  });
                }}
                className="absolute top-12 right-2 bg-orange-500 text-white p-2 rounded-full hover:bg-orange-600 transition-colors z-10"
                aria-label="Edit Left Image"
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
          {/* Middle Image */}
          <div className="bg-white rounded-lg shadow flex items-center justify-center relative">
            <img
              src={topPicksData.images?.middle}
              alt="Top Pick 2"
              className="w-full h-64 object-cover rounded-lg"
            />
            {isEditMode && (
              <button
                onClick={() => {
                  setIsImageEdit(true);
                  setImageMetaData({
                    onUploadComplete: (url) => {
                      const updatedImages = {
                        ...topPicksData.images,
                        middle: url,
                      };
                      setInstitutionData({
                        ...institutionData,
                        topPicksSection: {
                          ...topPicksData,
                          images: updatedImages,
                        },
                      });
                    },
                    folderName: "topPicksSection",
                    acceptedTypes: ["image/jpeg", "image/png"],
                    title: `Edit Middle Image`,
                  });
                }}
                className="absolute top-12 right-2 bg-orange-500 text-white p-2 rounded-full hover:bg-orange-600 transition-colors z-10"
                aria-label="Edit Middle Image"
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
          {/* Right Image */}
          <div className="bg-white rounded-lg shadow flex items-center justify-center relative">
            <img
              src={topPicksData.images?.right}
              alt="Top Pick 3"
              className="w-full h-64 object-cover rounded-lg"
            />
            {isEditMode && (
              <button
                onClick={() => {
                  setIsImageEdit(true);
                  setImageMetaData({
                    onUploadComplete: (url) => {
                      const updatedImages = {
                        ...topPicksData.images,
                        right: url,
                      };
                      setInstitutionData({
                        ...institutionData,
                        topPicksSection: {
                          ...topPicksData,
                          images: updatedImages,
                        },
                      });
                    },
                    folderName: "topPicksSection",
                    acceptedTypes: ["image/jpeg", "image/png"],
                    title: `Edit Right Image`,
                  });
                }}
                className="absolute top-12 right-2 bg-orange-500 text-white p-2 rounded-full hover:bg-orange-600 transition-colors z-10"
                aria-label="Edit Right Image"
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
    </div>
  );
};

export default TopPicksSection;
