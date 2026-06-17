import { Buffer } from 'buffer';

import { v2 as cloudinary, type UploadApiResponse, type UploadApiErrorResponse } from 'cloudinary';

// Configure Cloudinary using environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME as string,
  api_key: process.env.CLOUDINARY_API_KEY as string,
  api_secret: process.env.CLOUDINARY_API_SECRET as string,
});

export interface StorageOptions {
  folder?: string;
  mimetype?: string;
}

export class StorageProvider {
  /**
   * Uploads a Buffer stream directly to Cloudinary without writing to disk.
   */
  static async uploadThumbnail(fileBuffer: Buffer, options: StorageOptions): Promise<string> {
    return new Promise((resolve, reject) => {
      // Create the upload stream
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `learnhouse/${options.folder || 'general'}`,
          resource_type: 'auto', // Automatically detects image, video, or raw file (PDF)
        },
        (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
          if (error) {
            console.error('[Cloudinary Upload Error]', error);
            return reject(error);
          }
          if (!result) {
            return reject(new Error('Cloudinary upload failed: No result returned.'));
          }
          
          // Return the secure HTTPS URL
          resolve(result.secure_url);
        }
      );

      // Pipe the memory buffer into the Cloudinary stream
      uploadStream.end(fileBuffer);
    });
  }

  // Future-proofing: We can add specific methods for PDFs or Videos later if 
  // we want to utilize Cloudinary's specific transformation parameters.
  static async uploadVideo(fileBuffer: Buffer, options: StorageOptions): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `learnhouse/${options.folder || 'videos'}`,
          resource_type: 'video',
          // Automatically generate an adaptive bitrate streaming profile (HLS/DASH)
          eager: [{ streaming_profile: 'hd', format: 'm3u8' }],
          eager_async: true, // Do this in the background, don't block the HTTP request
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result!.secure_url);
        }
      );

      uploadStream.end(fileBuffer);
    });
  }
}

