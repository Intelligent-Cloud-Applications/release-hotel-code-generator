import React, { useRef, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/Development/components/ui/button.js";
import MultiPartUpload from "../../lib/multiPartUpload.js";
import institution from "../../../Operation/data.json"
import { toast } from "sonner";

const ImageUploadModal = ({
  onClose,
  onUploadComplete,
  folderName = "images",
  title = "Upload Media",
  acceptedTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/svg",
    "video/mp4",
    "video/webm",
    "video/ogg",
  ],
}) => {
  const fileRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);

      // Create preview for both images and videos
      if (file.type.startsWith("image/")) {
        setPreviewUrl(URL.createObjectURL(file));
      } else if (file.type.startsWith("video/")) {
        setPreviewUrl(URL.createObjectURL(file));
      }
    }
    setUploadProgress(0);
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      alert("Please select a file to upload.");
      return;
    }

    // Check if file type is accepted
    if (
      !acceptedTypes.includes(selectedFile.type) &&
      acceptedTypes.length > 0
    ) {
      alert(
        `Please select a valid file type. Accepted types: ${acceptedTypes.join(
          ", "
        )}`
      );
      return;
    }

    try {
      setIsUploading(true);
      // Upload the file to S3 and get the image link
      const result = await MultiPartUpload({
        bucket: "institution-utils",
        region: "us-east-1",
        folder: `hotel_code_generator/${institution.institutionId}/${folderName}`,
        file: selectedFile,
      });
      if (!result) {
        throw new Error("Failed to upload file.");
      }
      if (result) {
        onUploadComplete(result);
        onClose();
      }
    } catch (error) {
      toast("Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  React.useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[300] inter px-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      <div className="bg-white p-4 md:p-6 rounded-lg shadow-xl w-full max-w-md relative z-10 mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 mb-4 text-center">
          <input
            type="file"
            accept={acceptedTypes.join(",")}
            className="hidden"
            ref={fileRef}
            id="image-upload"
            onChange={handleFileChange}
          />
          <label
            htmlFor="image-upload"
            className="cursor-pointer text-gray-600 flex flex-col items-center"
          >
            {selectedFile && previewUrl ? (
              <div className="flex flex-col items-center">
                {selectedFile.type.startsWith("image/") ? (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full max-h-48 object-contain rounded-lg mb-2"
                  />
                ) : selectedFile.type.startsWith("video/") ? (
                  <video
                    src={previewUrl}
                    controls
                    className="w-full max-h-48 object-contain rounded-lg mb-2"
                  />
                ) : null}
                <p className="text-sm text-gray-600">{selectedFile.name}</p>
              </div>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-10 w-10 mb-2 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span className="text-sm">Click to browse files</span>
                <span className="text-xs text-gray-500 mt-1">
                  {acceptedTypes.some((type) => type.startsWith("image/")) &&
                    "Images "}
                  {acceptedTypes.some((type) => type.startsWith("video/")) &&
                    "Videos "}
                  are supported
                </span>
              </>
            )}
          </label>
        </div>

        {isUploading && uploadProgress > 0 && (
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
            <div
              className="bg-primary h-2.5 rounded-full"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        )}

        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="hover:bg-gray-100"
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleFileUpload}
            className="bg-primary hover:bg-secondary text-white"
            disabled={!selectedFile || isUploading}
          >
            {isUploading
              ? "Uploading..."
              : `Upload ${
                  selectedFile?.type.startsWith("video/") ? "Video" : "Image"
                }`}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ImageUploadModal;
