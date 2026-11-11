import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema.js';
import { Post } from '../posts/schemas/post.schema.js';
import { FileService } from '../file/file.service.js';
import { UpdateUserDto } from './dto/update-user.dto.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Post.name) private readonly postModel: Model<Post>,
    private readonly fileService: FileService,
  ) {}

  async findProfile(username: string) {
    const user = await this.userModel.findOne({ username });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const postsCount = await this.postModel.countDocuments({ author: user._id, deleted: { $ne: true } });
    // los seguidores no se guardan: son los usuarios que tienen a este en su "following"
    const followersCount = await this.userModel.countDocuments({ following: user._id });

    return {
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      bio: user.bio,
      profilePictureUrl: user.profilePictureUrl,
      postsCount,
      followersCount,
      followingCount: user.following.length,
    };
  }

  async update(userId: string, dto: UpdateUserDto, picture?: Express.Multer.File) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    user.firstName = dto.firstName ?? user.firstName;
    user.lastName = dto.lastName ?? user.lastName;
    user.bio = dto.bio ?? user.bio;
    if (picture) {
      const uploaded = await this.fileService.upload(picture.buffer);
      user.profilePictureUrl = uploaded.secure_url;
    }
    await user.save();
    return this.findProfile(user.username);
  }
}
