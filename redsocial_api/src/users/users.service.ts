import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema.js';
import { Post } from '../posts/schemas/post.schema.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Post.name) private readonly postModel: Model<Post>,
  ) {}

  async findProfile(username: string) {
    const user = await this.userModel.findOne({ username });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const postsCount = await this.postModel.countDocuments({ author: user._id });
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
}
