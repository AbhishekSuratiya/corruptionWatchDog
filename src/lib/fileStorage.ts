import { supabase } from './supabase';

export interface UploadedFile {
  name: string;
  url: string;
  type: string;
  size: number;
}

export class FileStorageService {
  private static readonly BUCKET_NAME = 'evidence-files';

  // Initialize storage bucket (call this once during app setup)
  static async initializeBucket() {
    try {
      // Check if bucket exists
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some(bucket => bucket.name === this.BUCKET_NAME);

      if (!bucketExists) {
        // Create bucket if it doesn't exist
        const { error } = await supabase.storage.createBucket(this.BUCKET_NAME, {
          public: true,
          allowedMimeTypes: [
            'image/jpeg',
            'image/png', 
            'image/gif',
            'image/webp',
            'video/mp4',
            'video/avi',
            'video/mov',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain'
          ],
          fileSizeLimit: 10485760 // 10MB
        });

        if (error) {
          console.error('Error creating storage bucket:', error);
          throw error;
        }

        console.log('Evidence files bucket created successfully');
      }
    } catch (error) {
      console.error('Error initializing storage bucket:', error);
      // Don't throw error here as the app should still work without storage
    }
  }

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

      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(filePath);

      return {
        name: file.name,
        url: urlData.publicUrl,
        type: file.type,
        size: file.size
      };

    } catch (error) {
      console.error('Error uploading file:', error);
      throw new Error(`Failed to upload ${file.name}: ${error.message}`);
    }
  }

  // Get file URL from storage path
  static getFileUrl(filePath: string): string {
    const { data } = supabase.storage
      .from(this.BUCKET_NAME)
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  }

  // Delete files from storage
  static async deleteFiles(filePaths: string[]): Promise<void> {
    try {
      const { error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove(filePaths);

      if (error) {
        throw error;
      }
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