import React from "react";
import { useEditContext } from "../../context/EditModeContext.jsx";
import { useAuthContext } from "../../context/AuthContext.jsx";
import { Edit2 } from "lucide-react";
import ImageUploadModal from "../ui/ImageUploadModal.jsx";
import { useInstitutionContext } from "../../context/InstitutionContext.jsx";

const Hero = () => {
  const { institutionData, setInstitutionData, updateInstitutionData } =
    useInstitutionContext();
  const { isEditMode, toggleEditMode } = useEditContext();
  const { userData } = useAuthContext();

  const [isImageEdit, setIsImageEdit] = React.useState(false);
  const [imageMetaData, setImageMetaData] = React.useState(null);

  // Placeholder functions for Submit and Cancel actions
  const handleSubmit = () => {
    // Logic for submitting changes (e.g., save video or other edits)
    updateInstitutionData();
    toggleEditMode(); // Turn off edit mode after submitting
  };

  const handleCancel = () => {
    // Logic for canceling changes (e.g., revert video or other edits)
    toggleEditMode(); // Turn off edit mode
    setImageMetaData(null); // Reset image metadata
    setIsImageEdit(false); // Close the image upload modal
  };

  return (
    <section className="w-full relative overflow-hidden min-h-[80vh]">
      {isImageEdit && imageMetaData && (
        <ImageUploadModal
          onClose={() => setIsImageEdit(false)}
          onUploadComplete={imageMetaData.onUploadComplete}
          folderName={imageMetaData.folderName}
          acceptedTypes={imageMetaData.acceptedTypes}
          title={imageMetaData.title}
        />
      )}

      {/* Video Background with conditional blur */}

      <video
        className={`absolute inset-0 w-full h-full object-cover`}
        autoPlay
        loop
        muted
        playsInline
        src={
          institutionData.hero.videoUrl ||
          "https://videos.pexels.com/video-files/855139/855139-hd_1920_1080_30fps.mp4"
        }
      />

      {/* Toggle Switch */}
      {userData?.userType === "admin" && (
        <div className="absolute top-4 right-4 z-20">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isEditMode}
              onChange={toggleEditMode}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            <span className="ml-3 text-sm font-medium text-white">
              {isEditMode ? "Edit On" : "Edit Off"}
            </span>
          </label>
        </div>
      )}

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
            onClick={handleCancel}
            className="bg-white text-gray-700 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition duration-300 inter font-medium"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Edit Icon */}
      {isEditMode && (
        <button
          className="absolute top-12 right-2 bg-orange-500 text-white p-2 rounded-full hover:bg-orange-600 transition-colors z-20"
          aria-label="Edit Video"
          onClick={() => {
            setIsImageEdit(true);
            setImageMetaData({
              onUploadComplete: (url) => {
                setInstitutionData((prevData) => ({
                  ...prevData,
                  hero: {
                    ...prevData.hero,
                    videoUrl: url, // Update the video URL in institution data
                  },
                }));
              },
              title: "Upload Hero Video",
              folderName: "homeSection",
              acceptedTypes: ["video/mp4", "video/webm"],
            });
          }}
        >
          <Edit2 size={24} className="text-white" />
        </button>
      )}
    </section>
  );
};

export default Hero;