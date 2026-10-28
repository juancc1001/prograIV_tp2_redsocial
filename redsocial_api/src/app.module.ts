import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { v2 as cloudinary } from 'cloudinary';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { UsersModule } from './users/users.module.js';
import { PostsModule } from './posts/posts.module.js';
import { AuthModule } from './auth/auth.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGODB_URI!),
    UsersModule,
    PostsModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  constructor(config: ConfigService) {
    // Formato: cloudinary://<api_key>:<api_secret>@<cloud_name>
    const cloudinaryUrl = new URL(config.getOrThrow<string>('CLOUDINARY_URL'));
    cloudinary.config({
      cloud_name: cloudinaryUrl.hostname,
      api_key: cloudinaryUrl.username,
      api_secret: cloudinaryUrl.password,
    });
  }
}
