import { StoredFile } from '../types';

// Firebase imports removed.
const isFirebaseReady = false;

export const uploadFile = async (
  file: File,
  folder: string,
  uploadedBy: string
): Promise<StoredFile> => {
  // 1. Client-side Validation
  const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
  if (!validTypes.includes(file.type) && !file.name.match(/\.(pdf|jpg|jpeg|png)$/i)) {
    throw new Error("Invalid file format. Only PDF, JPG, and PNG are allowed.");
  }
  if (file.size > 5 * 1024 * 1024) { 
    throw new Error("File size exceeds 5MB limit.");
  }

  // 2. Upload Logic
  try {
    const fileExtension = file.name.split('.').pop();
    const uniqueName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;
    const fullPath = `${folder}/${uniqueName}`;

    let url = '';

    // Preview Mode (Blob)
    console.log("[Storage MOCK] Firebase not ready, using Blob URL");
    url = URL.createObjectURL(file);

    return {
        key: fullPath,
        filename: file.name,
        url: url,
        size: file.size,
        mimeType: file.type,
        uploadedAt: Date.now(),
        uploadedBy: uploadedBy
    };
  } catch (error: any) {
      console.error("Upload failed:", error);
      throw new Error("Upload failed: " + error.message);
  }
};

export const getSignedUrl = async (fileKey: string): Promise<string> => {
  return ""; // In mock mode, we usually store the Blob URL directly in the 'url' field anyway
};

export const deleteFile = async (fileKey: string): Promise<void> => {
    // Mock delete
    console.log("Mock deleted file:", fileKey);
};
