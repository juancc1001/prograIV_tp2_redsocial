import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types, isValidObjectId } from 'mongoose';
import { Media, MediaType, Post } from './schemas/post.schema.js';
import { User } from '../users/schemas/user.schema.js';
import { FileService } from '../file/file.service.js';
import { CreatePostDto } from './dto/create-post.dto.js';
import { UpdatePostDto } from './dto/update-post.dto.js';
import { CreateCommentDto } from './dto/create-comment.dto.js';
import type { Pagination } from '../common/pagination.pipe.js';

interface PopulatedComment {
  _id: Types.ObjectId;
  text: string;
  createdAt: Date;
  edited: boolean;
  author: User;
}

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name) private readonly postModel: Model<Post>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly fileService: FileService,
  ) {}

  getPosts(pagination: Pagination) {
    return this.listPosts({}, pagination);
  }

  async getFeed(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return this.listPosts({ author: { $in: user.following } });
  }

  async getUserPosts(username: string, pagination: Pagination) {
    const user = await this.userModel.findOne({ username });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return this.listPosts({ author: user._id }, pagination);
  }

  async findOne(id: string) {
    this.checkId(id);
    const [post] = await this.listPosts({ _id: new Types.ObjectId(id) });
    if (!post) {
      throw new NotFoundException('Publicación no encontrada');
    }
    return post;
  }

  async create(userId: string, dto: CreatePostDto, files: Express.Multer.File[]) {
    const media: Media[] = [];
    for (let i = 0; i < files.length; i++) {
      const uploaded = await this.fileService.upload(files[i].buffer);
      const isVideo = uploaded.resource_type === 'video';
      media.push({
        type: isVideo ? MediaType.Video : MediaType.Image,
        url: uploaded.secure_url,
        order: i,
        durationSeconds: uploaded.duration,
      });
    }

    const post = await this.postModel.create({
      author: userId,
      type: dto.type,
      title: dto.title,
      description: dto.description,
      location: dto.location,
      media: media,
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
    // baja lógica: el documento queda en la base marcado como borrado
    post.deleted = true;
    await post.save();
  }

  async like(userId: string, id: string) {
    this.checkId(id);
    // el filtro evita que el mismo usuario dé un segundo me gusta
    const post = await this.postModel.findOneAndUpdate(
      { _id: id, deleted: { $ne: true }, likes: { $ne: userId } },
      { $push: { likes: userId } },
      { new: true },
    );
    if (!post) {
      await this.checkPostExists(id);
      throw new ConflictException('Ya le diste me gusta a esta publicación');
    }
    return { likesCount: post.likes.length };
  }

  async unlike(userId: string, id: string) {
    this.checkId(id);
    // solo se quita si el usuario lo había dado
    const post = await this.postModel.findOneAndUpdate(
      { _id: id, deleted: { $ne: true }, likes: userId },
      { $pull: { likes: userId } },
      { new: true },
    );
    if (!post) {
      await this.checkPostExists(id);
      throw new ConflictException('No le diste me gusta a esta publicación');
    }
    return { likesCount: post.likes.length };
  }

  // los comentarios se guardan del más nuevo al más viejo,
  // así $slice devuelve directamente la página pedida
  async getComments(id: string, pagination: Pagination) {
    this.checkId(id);
    const post = await this.postModel
      .findOne({ _id: id, deleted: { $ne: true } })
      .select({ comments: { $slice: [pagination.offset, pagination.limit] } })
      .populate<{ comments: PopulatedComment[] }>('comments.author', 'username profilePictureUrl');
    if (!post) {
      throw new NotFoundException('Publicación no encontrada');
    }

    return post.comments.map(comment => this.toCommentResponse(comment));
  }

  async addComment(userId: string, id: string, dto: CreateCommentDto) {
    this.checkId(id);
    const commentId = new Types.ObjectId();
    // $position: 0 lo agrega al principio del array
    const result = await this.postModel.updateOne(
      { _id: id, deleted: { $ne: true } },
      { $push: { comments: { $each: [{ _id: commentId, author: userId, text: dto.text }], $position: 0 } } },
    );
    if (result.matchedCount === 0) {
      throw new NotFoundException('Publicación no encontrada');
    }
    return this.getComment(id, commentId);
  }

  async editComment(userId: string, id: string, commentId: string, dto: CreateCommentDto) {
    this.checkId(id);
    this.checkId(commentId);
    // solo encuentra el comentario si es del usuario
    // el $ del update apunta al comentario que encontró el filtro
    const result = await this.postModel.updateOne(
      { _id: id, deleted: { $ne: true }, comments: { $elemMatch: { _id: commentId, author: userId } } },
      { $set: { 'comments.$.text': dto.text, 'comments.$.edited': true } },
    );
    if (result.matchedCount === 0) {
      throw new NotFoundException('Comentario no encontrado');
    }
    return this.getComment(id, commentId);
  }

  async removeComment(userId: string, id: string, commentId: string) {
    this.checkId(id);
    this.checkId(commentId);
    // solo se borra si el comentario es del usuario
    const result = await this.postModel.updateOne(
      { _id: id, deleted: { $ne: true } },
      { $pull: { comments: { _id: commentId, author: userId } } },
    );
    if (result.modifiedCount === 0) {
      throw new NotFoundException('Comentario no encontrado');
    }
  }

  // listados con el formato de la card, sin comentarios, solo la cantidad
  //Record<string, unknown> diccionario de filtros para mongo
  private listPosts(match: Record<string, unknown>, pagination?: Pagination) {
    let sort: Record<string, 1 | -1> = { createdAt: -1 };
    if (pagination) {
      sort = pagination.sort;
    }

    // $ne: true también incluye los posts viejos que no tienen el campo
    // likesCount se calcula antes del $sort para poder ordenar por él
    const pipeline: PipelineStage[] = [
      { $match: { ...match, deleted: { $ne: true } } },
      { $addFields: { likesCount: { $size: '$likes' } } },
      { $sort: sort },
    ];
    if (pagination) {
      pipeline.push({ $skip: pagination.offset });
      pipeline.push({ $limit: pagination.limit });
    }
    pipeline.push(
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
          likes: 1,
          likesCount: 1,
          commentsCount: { $size: '$comments' },
          author: {
            username: '$author.username',
            profilePictureUrl: '$author.profilePictureUrl',
          },
        },
      },
    );
    return this.postModel.aggregate(pipeline);
  }

  private async findOwnPost(userId: string, id: string) {
    this.checkId(id);
    const post = await this.postModel.findOne({ _id: id, deleted: { $ne: true } });
    if (!post) {
      throw new NotFoundException('Publicación no encontrada');
    }
    if (!post.author.equals(userId)) {
      throw new ForbiddenException('Solo el autor puede modificar la publicación');
    }
    return post;
  }

  private async getComment(postId: string, commentId: Types.ObjectId | string) {
    const post = await this.postModel
      .findById(postId)
      .select({ comments: { $elemMatch: { _id: commentId } } })
      .populate<{ comments: PopulatedComment[] }>('comments.author', 'username profilePictureUrl');
    if (!post || post.comments.length === 0) {
      throw new NotFoundException('Comentario no encontrado');
    }
    return this.toCommentResponse(post.comments[0]);
  }

  private toCommentResponse(comment: PopulatedComment) {
    return {
      id: comment._id,
      text: comment.text,
      createdAt: comment.createdAt,
      edited: comment.edited,
      author: {
        username: comment.author.username,
        profilePictureUrl: comment.author.profilePictureUrl,
      },
    };
  }

  private async checkPostExists(id: string) {
    const exists = await this.postModel.exists({ _id: id, deleted: { $ne: true } });
    if (!exists) {
      throw new NotFoundException('Publicación no encontrada');
    }
  }

  private checkId(id: string) {
    if (!isValidObjectId(id)) {
      throw new NotFoundException('Publicación no encontrada');
    }
  }
}
