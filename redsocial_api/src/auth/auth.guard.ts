import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { AuthService } from './auth.service.js';
import { Role } from '../users/schemas/user.schema.js';

export interface JwtPayload {
  sub: string;
  username: string;
  role: Role;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly authService: AuthService,
  ) {}

  //revisa principalmente que no esté expirado el token
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request & { user?: JwtPayload }>();
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    //separo bearer
    if (type !== 'Bearer' || !token || this.authService.isRevoked(token)) {
      throw new UnauthorizedException('No autorizado');
    }

    //verifica el jwt
    try {
      request.user = await this.jwtService.verifyAsync<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('No autorizado');
    }

    // si esta desactivado tampoco está autorizado
    const active = await this.authService.isActive(request.user.sub);
    if (!active) {
      throw new ForbiddenException('Tu usuario está desactivado');
    }
    return true;
  }
}
