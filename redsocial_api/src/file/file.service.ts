import { Injectable } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

@Injectable()
export class FileService {
  upload(buffer: Buffer): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      // auto para aceptar tanto imágenes como videos
      const stream = cloudinary.uploader.upload_stream({ resource_type: 'auto' }, (error, result) => {
        if (error || !result) {
          reject(error);
          return;
        }
        resolve(result);
      });
      stream.end(buffer);
    });
  }
}
