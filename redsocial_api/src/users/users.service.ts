import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PasswordHasher } from '@nestjs/authentication';
import { Role, User, UserDocument } from './schemas/user.schema.js';
import { Post } from '../posts/schemas/post.schema.js';
import { FileService } from '../file/file.service.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import type { Pagination } from '../common/pagination.pipe.js';

@Injectable()
export class UsersService {
  private readonly passwordHasher = new PasswordHasher();

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Post.name) private readonly postModel: Model<Post>,
    private readonly fileService: FileService,
  ) {}

  async findAll(role: Role, pagination: Pagination) {
    if (role !== Role.Admin) {
      throw new ForbiddenException('Solo un administrador puede ver el listado de usuarios');
    }

    const users = await this.userModel
      .find()
      .sort({ createdAt: -1 })
      .skip(pagination.offset)
      .limit(pagination.limit);

    return users.map(user => this.toListItem(user));
  }

  async create(role: Role, dto: CreateUserDto) {
    if (role !== Role.Admin) {
      throw new ForbiddenException('Solo un administrador puede crear usuarios');
    }

    const existing = await this.userModel.findOne({
      $or: [{ email: dto.email.toLowerCase() }, { username: dto.username }],
    });
    if (existing) {
      throw new ConflictException('El email o nombre de usuario ya está en uso');
    }

    const passwordHash = await this.passwordHasher.hash(dto.password);
    const user = await this.userModel.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      username: dto.username,
      birthDate: dto.birthDate,
      passwordHash,
      role: dto.role,
    });

    return this.toListItem(user);
  }

  // alta y baja lógica: el usuario queda en la base, solo cambia isActive
  async setActive(role: Role, username: string, isActive: boolean) {
    if (role !== Role.Admin) {
      throw new ForbiddenException('Solo un administrador puede activar o desactivar usuarios');
    }

    const user = await this.userModel.findOne({ username });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    user.isActive = isActive;
    await user.save();
    return this.toListItem(user);
  }

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

  // datos que se muestran en el listado del dashboard
  private toListItem(user: UserDocument) {
    return {
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      profilePictureUrl: user.profilePictureUrl,
      isActive: user.isActive,
    };
  }
}
