import React from "react";
import { useEditContext } from "../../context/EditModeContext.jsx";
import { useAuthContext } from "../../context/AuthContext.jsx";
import ImageUploadModal from "../ui/ImageUploadModal.jsx";
import { useInstitutionContext } from "../../context/InstitutionContext.jsx";

const LegacySection = () => {
  const { institutionData, setInstitutionData, updateInstitutionData } = useInstitutionContext();
  const { isEditMode, toggleEditMode } = useEditContext();
  const { userData } = useAuthContext();

  const lagacyData = institutionData?.legacySection || {};

  const [isImageEdit, setIsImageEdit] = React.useState(false);
  const [imageMetaData, setImageMetaData] = React.useState(null);

  // Handle stats changes
  const handleStatChange = (index, field, value) => {
    const updatedStats = [...lagacyData.stats];
    updatedStats[index] = { ...updatedStats[index], [field]: value };
    setInstitutionData((prev) => ({
      ...prev,
      legacySection: {
        ...prev.legacySection,
        stats: updatedStats,
      },
    }));
  };
  // Placeholder functions for Submit and Cancel actions
  const handleSubmit = () => {
    // Logic for submitting changes (e.g., save text, stats, images)
    updateInstitutionData();
    toggleEditMode(); // Turn off edit mode after submitting
  };

  return (
    <div className="py-16 px-6 bg-white relative">
      {isImageEdit && imageMetaData && (
        <ImageUploadModal
          onClose={() => setIsImageEdit(false)}
          onUploadComplete={imageMetaData.onUploadComplete}
          folderName={imageMetaData.folderName}
          acceptedTypes={imageMetaData.acceptedTypes}
          title={imageMetaData.title}
        />
      )}
      <div className="max-w-7xl mx-auto">
        {/* Toggle Switch */}
        {
          (userData?.userTypes || []).includes('admin') && (<div className="absolute top-4 right-4 z-10">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isEditMode}
              onChange={toggleEditMode}
              className="sr-only peer"
              aria-label="Toggle edit mode"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            <span className="ml-3 text-sm font-medium text-gray-900 fjalla">
              {isEditMode ? "Edit On" : "Edit Off"}
            </span>
          </label>
        </div>)
        }

        {/* Submit and Cancel Buttons (Visible when Edit Mode is On) */}
        {isEditMode && (
          <div className="fixed top-20 right-32 z-50 flex gap-2">
            <button
              onClick={handleSubmit}
              className="bg-orange-400 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition duration-300 inter font-medium"
            >
              Submit
            </button>
            <button
              onClick={() => toggleEditMode()}
              className="bg-white text-gray-700 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition duration-300 inter font-medium"
            >
              Cancel
            </button>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left side - Text and Stats */}
          <div className="lg:w-1/2 pr-8">
            {isEditMode ? (
              <div className="flex items-center gap-1 mb-4">
                <input
                  type="text"
                  value={lagacyData.title.start}
                  onChange={(e) => {
                    setInstitutionData((prev) => ({
                      ...prev,
                      legacySection: {
                        ...prev.legacySection,
                        title: {
                          ...prev.legacySection.title,
                          start: e.target.value,
                        },
                      },
                    }));
                  }}
                  className="text-3xl font-semibold text-gray-900 fjalla border border-gray-300 rounded px-1 py-0.5 text-center"
                  style={{ width: `${lagacyData.title.start.length + 2}ch` }}
                />
                <input
                  type="text"
                  value={lagacyData.title.highlight}
                  onChange={(e) => {
                    setInstitutionData((prev) => ({
                      ...prev,
                      legacySection: {
                        ...prev.legacySection,
                        title: {
                          ...prev.legacySection.title,
                          highlight: e.target.value,
                        },
                      },
                    }));
                  }}
                  className="text-3xl font-semibold text-orange-500 fjalla border border-gray-300 rounded px-1 py-0.5 text-center"
                  style={{
                    width: `${lagacyData.title.highlight.length + 2}ch`,
                  }}
                />
              </div>
            ) : (
              <h2 className="text-4xl font-semibold mb-4 fjalla">
                <span className="text-gray-900">{lagacyData.title.start}</span>
                <span className="text-orange-500">
                  {" "}
                  {lagacyData.title.highlight}
                </span>
              </h2>
            )}
            {isEditMode ? (
              <textarea
                value={lagacyData.description}
                onChange={(e) => {
                  setInstitutionData((prev) => ({
                    ...prev,
                    legacySection: {
                      ...prev.legacySection,
                      description: e.target.value,
                    },
                  }));
                }}
                className="text-black mb-12 font-bold cormorant border border-gray-300 rounded px-2 py-1 w-full h-40"
              />
            ) : (
              <p className="text-black mb-12 font-bold cormorant">
                {lagacyData.description}
              </p>
            )}

            <div className="grid grid-cols-3 gap-6">
              {lagacyData.stats.map((stat, index) => (
                <div
                  key={index}
                  className="text-center bg-orange-50 p-6 rounded-lg"
                >
                  {isEditMode ? (
                    <>
                      <input
                        type="text"
                        value={stat.number}
                        onChange={(e) =>
                          handleStatChange(index, "number", e.target.value)
                        }
                        className="text-4xl font-semibold text-orange-500 fjalla border border-gray-300 rounded px-2 py-1 w-full mb-2"
                      />
                      <input
                        type="text"
                        value={stat.label}
                        onChange={(e) =>
                          handleStatChange(index, "label", e.target.value)
                        }
                        className="text-md cormorant text-black border border-gray-300 rounded px-2 py-1 w-full"
                      />
                    </>
                  ) : (
                    <>
                      <div className="text-4xl font-semibold text-orange-500 fjalla">
                        {stat.number}
                      </div>
                      <div className="text-md mt-1 cormorant text-black">
                        {stat.label}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right side - Images grid */}
          <div className="lg:w-1/2">
            <div className="grid grid-cols-12 grid-rows-6 gap-4 h-full">
              {/* Top left large image (4 rows, 8 columns) */}
              <div className="col-span-5 row-span-4 relative">
                <div className="bg-gray-100 h-full rounded-lg overflow-hidden">
                  <img
                    src={lagacyData.images?.topLeft || ""}
                    alt="Hanging plant"
                    className="w-full h-full object-cover"
                  />
                  {isEditMode && (
                    <button
                      onClick={() => {
                        setIsImageEdit(true);
                        setImageMetaData({
                          onUploadComplete: (url) => {
                            setInstitutionData((prev) => ({
                              ...prev,
                              legacySection: {
                                ...prev.legacySection,
                                images: {
                                  ...prev.legacySection.images,
                                  topLeft: url,
                                },
                              },
                            }));
                            setIsImageEdit(false);
                          },
                          folderName: "legacySection",
                          acceptedTypes: ["image/jpeg", "image/png"],
                          title: `Top Left Image`,
                        });
                      }}
                      className="absolute top-12 right-2 bg-orange-500 text-white p-2 rounded-full hover:bg-orange-600 transition-colors z-10"
                      aria-label="Edit Top Left Image"
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
              {/* Top right image (2 rows, 4 columns) */}
              <div className="col-span-5 row-span-2 relative">
                <div className="bg-gray-100 h-full rounded-lg overflow-hidden">
                  <img
                    src={lagacyData.images?.topRight || ""}
                    alt="Potted plants"
                    className="w-full h-full object-cover"
                  />
                  {isEditMode && (
                    <button
                      onClick={() => {
                        setIsImageEdit(true);
                        setImageMetaData({
                          onUploadComplete: (url) => {
                            setInstitutionData((prev) => ({
                              ...prev,
                              legacySection: {
                                ...prev.legacySection,
                                images: {
                                  ...prev.legacySection.images,
                                  topRight: url,
                                },
                              },
                            }));
                            setIsImageEdit(false);
                          },
                          folderName: "legacySection",
                          acceptedTypes: ["image/jpeg", "image/png"],
                          title: `Top Right Image`,
                        });
                      }}
                      className="absolute top-12 right-2 bg-orange-500 text-white p-2 rounded-full hover:bg-orange-600 transition-colors z-10"
                      aria-label="Edit Top Right Image"
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
              {/* Bottom right image (4 rows, 4 columns) */}
              <div className="col-span-5 row-span-4 relative">
                <div className="bg-gray-100 h-full rounded-lg overflow-hidden">
                  <img
                    src={lagacyData.images?.bottomRight || ""}
                    alt="Plant with vase"
                    className="w-full h-full object-cover"
                  />
                  {isEditMode && (
                    <button
                      onClick={() => {
                        setIsImageEdit(true);
                        setImageMetaData({
                          onUploadComplete: (url) => {
                            setInstitutionData((prev) => ({
                              ...prev,
                              legacySection: {
                                ...prev.legacySection,
                                images: {
                                  ...prev.legacySection.images,
                                  bottomRight: url,
                                },
                              },
                            }));
                            setIsImageEdit(false);
                          },
                          folderName: "legacySection",
                          acceptedTypes: ["image/jpeg", "image/png"],
                          title: `Bottom Right Image`,
                        });
                      }}
                      className="absolute top-12 right-2 bg-orange-500 text-white p-2 rounded-full hover:bg-orange-600 transition-colors z-10"
                      aria-label="Edit Bottom Right Image"
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
              {/* Bottom image (2 rows, 8 columns) */}
              <div className="col-span-5 row-span-2 relative">
                <div className="bg-gray-100 h-full rounded-lg overflow-hidden">
                  <img
                    src={lagacyData.images?.bottom || ""}
                    alt="Plants on shelf"
                    className="w-full h-full object-cover"
                  />
                  {isEditMode && (
                    <button
                      onClick={() => {
                        setIsImageEdit(true);
                        setImageMetaData({
                          onUploadComplete: (url) => {
                            setInstitutionData((prev) => ({
                              ...prev,
                              legacySection: {
                                ...prev.legacySection,
                                images: {
                                  ...prev.legacySection.images,
                                  bottom: url,
                                },
                              },
                            }));
                            setIsImageEdit(false);
                          },
                          folderName: "legacySection",
                          acceptedTypes: ["image/jpeg", "image/png"],
                          title: `Bottom Image`,
                        });
                      }}
                      className="absolute top-12 right-2 bg-orange-500 text-white p-2 rounded-full hover:bg-orange-600 transition-colors z-10"
                      aria-label="Edit Bottom Image"
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
        </div>
      </div>
    </div>
  );
};

export default LegacySection;
