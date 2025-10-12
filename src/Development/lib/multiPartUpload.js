import { post } from "aws-amplify/api";

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB

const MultiPartUpload = async ({ bucket, region, folder, file }) => {
  const fileName = file.name;
  const fileType = file.type;
  let uploadId = "";
  let parts = [];

  if (!file) {
    return;
  }

  try {
    // 1. Start the multipart upload
    const { body } = await post({
      apiName: "common",
      path: "/upload-file",
      options: {
        body: {
          action: "INITIATE",
          bucket,
          region,
          folder,
          fileName,
          fileType,
        },
      },
    }).response;
    const startUploadResponse = await body.json();

    if (!startUploadResponse || !startUploadResponse.uploadId) {
      throw new Error("Failed to initiate multipart upload");
    }
    uploadId = startUploadResponse.uploadId;
  } catch (error) {
    console.error("Error initiating multipart upload:", error);
    throw new Error("Failed to initiate multipart upload");
  }

  // 2. Split the file into chunks and upload them
  try {
    const totalParts = Math.ceil(file.size / CHUNK_SIZE);
    for (let i = 1; i <= totalParts; i++) {
      const start = (i - 1) * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);

      // Get the presigned URL for each part

      const { body: presignedUrlResponse } = await post({
        apiName: "common",
        path: "/upload-file",
        options: {
          body: {
            action: "GET_PRESIGNED_URL",
            bucket,
            region,
            folder,
            fileName,
            partNumber: i,
            uploadId,
          },
        },
      }).response;
      const { presignedUrl } = await presignedUrlResponse.json();
      if (!presignedUrl) {
        throw new Error(`Failed to get presigned URL for part ${i}`);
      }

      // Upload the part to S3 using the pre-signed URL
      const uploadResponse = await fetch(presignedUrl, {
        method: "PUT",
        body: chunk,
      });

      parts.push({
        ETag: uploadResponse.headers.get("ETag"),
        PartNumber: i,
      });
    }
  } catch (error) {
    console.error("Error uploading file parts:", error);
    throw new Error("Failed to upload file parts");
  }

  // 3. Complete the multipart upload
  try {
    const { body } = await post({
      apiName: "common",
      path: "/upload-file",
      options: {
        body: {
          action: "COMPLETE",
          bucket,
          region,
          folder,
          fileName,
          uploadId,
          parts,
        },
      },
    }).response;

    const completeUploadResponse = await body.json();

    console.log("Multipart upload completed successfully:", completeUploadResponse);
    
    if (!completeUploadResponse || !completeUploadResponse.fileUrl) {
      throw new Error("Failed to complete multipart upload");
    }

    return completeUploadResponse.fileUrl;
  } catch (error) {
    console.error("Error completing multipart upload:", error);
    throw new Error("Failed to complete multipart upload");
  }
};

export default MultiPartUpload;
