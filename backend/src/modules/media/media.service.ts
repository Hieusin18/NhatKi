import { UploadApiResponse } from 'cloudinary';
import cloudinary from './cloudinary.helper';

export const uploadToCloudinary = (fileBuffer: Buffer, folderName: string): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folderName,
        resource_type: 'auto',
      },
      (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new Error('Cloudinary upload returned undefined result.'));
        resolve(result);
      }
    );
    uploadStream.end(fileBuffer);
  });
};
