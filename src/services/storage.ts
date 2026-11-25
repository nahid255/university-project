import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, isFirebaseConfigured } from './firebase';

export interface FileValidationOptions {
  maxSizeMB: number;
  allowedTypes: string[]; // e.g. ['image/jpeg', 'image/png', 'application/pdf']
}

export const validateFile = (
  file: File,
  options: FileValidationOptions
): { valid: boolean; error?: string } => {
  const maxBytes = options.maxSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    return {
      valid: false,
      error: `File size exceeds the limit of ${options.maxSizeMB} MB. Current size: ${(file.size / (1024 * 1024)).toFixed(1)} MB`,
    };
  }

  const isTypeAllowed = options.allowedTypes.some((type) => {
    if (type.endsWith('/*')) {
      const prefix = type.replace('/*', '');
      return file.type.startsWith(prefix);
    }
    return file.type === type;
  });

  if (!isTypeAllowed && options.allowedTypes.length > 0) {
    return {
      valid: false,
      error: `Unsupported file type (${file.type || 'unknown'}). Allowed: ${options.allowedTypes.join(', ')}`,
    };
  }

  return { valid: true };
};

export const uploadFile = async (
  file: File,
  storagePath: string
): Promise<string> => {
  // If Firebase is configured with real storage bucket
  if (isFirebaseConfigured() && storage) {
    try {
      const fileRef = ref(storage, storagePath);
      const snapshot = await uploadBytes(fileRef, file);
      const downloadUrl = await getDownloadURL(snapshot.ref);
      return downloadUrl;
    } catch (err) {
      console.warn('Firebase storage upload failed, fallback to local URL:', err);
    }
  }

  // Fallback for demonstration / local mode: convert image or small document to Data URL or Object URL
  return new Promise((resolve, reject) => {
    if (file.size > 8 * 1024 * 1024) {
      // For large files in local demo, create an object URL
      resolve(URL.createObjectURL(file));
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
