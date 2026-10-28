import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, isValidObjectId } from 'mongoose';
import { Post } from './schemas/post.schema.js';
import { User } from '../users/schemas/user.schema.js';
import { CreatePostDto } from './dto/create-post.dto.js';
import { UpdatePostDto } from './dto/update-post.dto.js';
import { CreateCommentDto } from './dto/create-comment.dto.js';

interface PopulatedComment {
  _id: Types.ObjectId;
  text: string;
  createdAt: Date;
  author: User;
}

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name) private readonly postModel: Model<Post>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async getFeed(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return this.listPosts({ author: { $in: user.following } });
  }

  async getUserPosts(username: string) {
    const user = await this.userModel.findOne({ username });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return this.listPosts({ author: user._id });
  }

  async findOne(id: string) {
    this.checkId(id);
    const [post] = await this.listPosts({ _id: new Types.ObjectId(id) });
    if (!post) {
      throw new NotFoundException('Publicación no encontrada');
    }
    return post;
  }

  async create(userId: string, dto: CreatePostDto) {
    const post = await this.postModel.create({
      author: userId,
      type: dto.type,
      title: dto.title,
      description: dto.description,
      media: dto.media,
    });
    return this.findOne(post.id);
  }

  async update(userId: string, id: string, dto: UpdatePostDto) {
    const post = await this.findOwnPost(userId, id);
    post.title = dto.title ?? post.title;
    post.description = dto.description ?? post.description;
    await post.save();
    return this.findOne(id);
  }

  async remove(userId: string, id: string) {
    const post = await this.findOwnPost(userId, id);
    await post.deleteOne();
  }

  like(userId: string, id: string) {
    return this.updateLikes(id, { $addToSet: { likes: userId } });
  }

  unlike(userId: string, id: string) {
    return this.updateLikes(id, { $pull: { likes: userId } });
  }

  async getComments(id: string) {
    this.checkId(id);
    const post = await this.postModel
      .findById(id)
      .select('comments')
      .populate<{ comments: PopulatedComment[] }>('comments.author', 'username profilePictureUrl');
    if (!post) {
      throw new NotFoundException('Publicación no encontrada');
    }

    return post.comments.map(comment => ({
      id: comment._id,
      text: comment.text,
      createdAt: comment.createdAt,
      author: {
        username: comment.author.username,
        profilePictureUrl: comment.author.profilePictureUrl,
      },
    }));
  }

  async addComment(userId: string, id: string, dto: CreateCommentDto) {
    this.checkId(id);
    const result = await this.postModel.updateOne(
      { _id: id },
      { $push: { comments: { author: userId, text: dto.text } } },
    );
    if (result.matchedCount === 0) {
      throw new NotFoundException('Publicación no encontrada');
    }
    return this.getComments(id);
  }

  async removeComment(userId: string, id: string, commentId: string) {
    this.checkId(id);
    this.checkId(commentId);
    // solo se borra si el comentario es del usuario
    const result = await this.postModel.updateOne(
      { _id: id },
      { $pull: { comments: { _id: commentId, author: userId } } },
    );
    if (result.modifiedCount === 0) {
      throw new NotFoundException('Comentario no encontrado');
    }
  }

  // listados con el formato de la card: sin los comentarios, solo la cantidad
  private listPosts(match: Record<string, unknown>) {
    return this.postModel.aggregate([
      { $match: match },
      { $sort: { createdAt: -1 } },
      { $lookup: { from: 'users', localField: 'author', foreignField: '_id', as: 'author' } },
      { $unwind: '$author' },
      {
        $project: {
          _id: 0,
          id: '$_id',
          type: 1,
          title: 1,
          description: 1,
          media: 1,
          createdAt: 1,
          imageUrl: { $first: '$media.url' },
          likesCount: { $size: '$likes' },
          commentsCount: { $size: '$comments' },
          author: {
            username: '$author.username',
            profilePictureUrl: '$author.profilePictureUrl',
          },
        },
      },
    ]);
  }

  private async findOwnPost(userId: string, id: string) {
    this.checkId(id);
    const post = await this.postModel.findById(id);
    if (!post) {
      throw new NotFoundException('Publicación no encontrada');
    }
    if (!post.author.equals(userId)) {
      throw new ForbiddenException('Solo el autor puede modificar la publicación');
    }
    return post;
  }

  private async updateLikes(id: string, update: object) {
    this.checkId(id);
    const post = await this.postModel.findByIdAndUpdate(id, update, { new: true });
    if (!post) {
      throw new NotFoundException('Publicación no encontrada');
    }
    return { likesCount: post.likes.length };
  }

  private checkId(id: string) {
    if (!isValidObjectId(id)) {
      throw new NotFoundException('Publicación no encontrada');
    }
  }
}
