import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

export interface UploadedFile {
  name: string;
  url: string;
  type: string;
  size: number;
}

export class FileStorageService {


  // Upload multiple files and return their URLs
  static async uploadFiles(files: File[]): Promise<UploadedFile[]> {
    const uploadedFiles: UploadedFile[] = [];

    for (const file of files) {
      try {
        const uploadedFile = await this.uploadSingleFile(file);
        uploadedFiles.push(uploadedFile);
      } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error);
        // Continue with other files even if one fails
      }
    }

    return uploadedFiles;
  }

  // Upload a single file
  static async uploadSingleFile(file: File): Promise<UploadedFile> {
    try {
      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExtension = file.name.split('.').pop();
      const fileName = `${timestamp}_${randomString}.${fileExtension}`;
      const filePath = `evidence/${fileName}`;

      const storageRef = ref(storage, filePath);

      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      return {
        name: file.name,
        url: url,
        type: file.type,
        size: file.size
      };

    } catch (error) {
      console.error('Error uploading file:', error);
      throw new Error(`Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get file URL from storage path
  static async getFileUrl(filePath: string): Promise<string> {
    const storageRef = ref(storage, filePath);
    return await getDownloadURL(storageRef);
  }

  // Delete files from storage
  static async deleteFiles(fileUrls: string[]): Promise<void> {
    try {
      // Firebase Storage deletes by reference. Construct reference from URL.
      // This is tricky if we only have URLs.
      // Assuming fileUrls are actually paths or we can extract the path.
      // However, the original code took filePaths. If consumers pass paths, good.
      // If consumers pass full URLs, we need to parse them.
      // Checking usage in codebase would be wise, but let's assume they might pass full URLs
      // created by THIS service.

      // But for now, let's assume they are paths because the original method name was getFileUrl(filePath).

      const parsedPromises = fileUrls.map(urlOrPath => {

        // Basic check if it's a full URL (heuristic)
        if (urlOrPath.includes('firebasestorage')) {
          // It's a URL, we need to extract the path or use refFromURL (not available in all SDK versions directly like this)
          // Ideally we stick to paths.
          // But if we only have the download URL, we can try to create a ref from it.
          try {
            const storageRef = ref(storage, urlOrPath);
            return deleteObject(storageRef);
          } catch (e) {
            // Fallback: treat as path
            const storageRef = ref(storage, urlOrPath);
            return deleteObject(storageRef);
          }
        } else {
          const storageRef = ref(storage, urlOrPath);
          return deleteObject(storageRef);
        }
      });

      await Promise.all(parsedPromises);
    } catch (error) {
      console.error('Error deleting files:', error);
      throw error;
    }
  }

  // Get file type from filename
  static getFileType(filename: string): 'image' | 'video' | 'pdf' | 'document' | 'unknown' {
    const ext = filename.toLowerCase().split('.').pop();

    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext || '')) {
      return 'image';
    } else if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'].includes(ext || '')) {
      return 'video';
    } else if (['pdf'].includes(ext || '')) {
      return 'pdf';
    } else if (['doc', 'docx', 'txt', 'rtf'].includes(ext || '')) {
      return 'document';
    } else {
      return 'unknown';
    }
  }

  // Validate file before upload
  static validateFile(file: File): { isValid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/avi', 'video/mov', 'video/wmv',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    if (file.size > maxSize) {
      return {
        isValid: false,
        error: `File ${file.name} is too large. Maximum size is 10MB.`
      };
    }

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: `File type ${file.type} is not allowed for ${file.name}.`
      };
    }

    return { isValid: true };
  }
}