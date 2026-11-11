import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PostsService } from './posts.service.js';
import { PostsController } from './posts.controller.js';
import { Post, PostSchema } from './schemas/post.schema.js';
import { User, UserSchema } from '../users/schemas/user.schema.js';
import { FileModule } from '../file/file.module.js';

@Module({
  imports: [
    FileModule,
    MongooseModule.forFeature([
      { name: Post.name, schema: PostSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [PostsController],
  providers: [PostsService],
})
export class PostsModule {}
