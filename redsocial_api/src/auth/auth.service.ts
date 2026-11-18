import { ConflictException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { PasswordHasher } from '@nestjs/authentication';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';

@Injectable()
export class AuthService {
  private readonly passwordHasher = new PasswordHasher();
  private readonly revokedTokens = new Set<string>();

  constructor(
    @InjectModel(User.name) 
    private readonly userModel: Model<User>,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
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
    });

    return this.createToken(user);
  }

  async login(dto: LoginDto) {
    const user = await this.userModel.findOne({
      $or: [{ email: dto.usernameOrEmail.toLowerCase() }, { username: dto.usernameOrEmail }],
    });

    const validPassword = await this.passwordHasher.verify(dto.password, user?.passwordHash);
    if (!user || !validPassword) {
      throw new UnauthorizedException('Usuario o contraseña incorrectos');
    }
    if (!user.isActive) {
      throw new ForbiddenException('Tu usuario está desactivado');
    }

    return this.createToken(user);
  }

  // el token ya lo validó el guard, acá solo se devuelven los datos del usuario
  async authorize(userId: string) {
    const user = await this.userModel.findById(userId).select('-passwordHash');
    if (!user) {
      throw new UnauthorizedException('No autorizado');
    }
    return user;
  }

  // entrega un token nuevo y revoca el anterior
  async refresh(userId: string, oldToken: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new UnauthorizedException('No autorizado');
    }
    this.revokedTokens.add(oldToken);
    return this.createToken(user);
  }

  logout(token: string) {
    this.revokedTokens.add(token);
  }

  //verifica que no se use un token de usuario que ya cerró sesion
  isRevoked(token: string) {
    return this.revokedTokens.has(token);
  }

  async isActive(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      return false;
    }
    return user.isActive;
  }

  //campos de jwt payload
  private async createToken(user: UserDocument) {
    const accessToken = await this.jwtService.signAsync({ sub: user.id, username: user.username, role: user.role });
    return { accessToken };
  }
}
