import { BadGatewayException, Injectable } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

@Injectable()
export class FileService {
  upload(buffer: Buffer): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      // auto para aceptar tanto imágenes como videos
      const stream = cloudinary.uploader.upload_stream({ resource_type: 'auto' }, (error, result) => {
        if (error) {
          // 502 y no el http_code de cloudinary: un 401 cerraría la sesión en el front
          reject(new BadGatewayException(`Cloudinary: ${error.message}`));
          return;
        }
        if (!result) {
          reject(new BadGatewayException('No se pudo subir el archivo'));
          return;
        }
        resolve(result);
      });
      stream.end(buffer);
    });
  }
}
