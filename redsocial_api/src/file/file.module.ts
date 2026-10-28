import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

@Module({})
export class FileModule {
  constructor(config: ConfigService) {
    const cloudinaryUrl = new URL(config.getOrThrow<string>('CLOUDINARY_URL'));
    cloudinary.config({
      cloud_name: cloudinaryUrl.hostname,
      api_key: cloudinaryUrl.username,
      api_secret: cloudinaryUrl.password,
    });
  }
}
