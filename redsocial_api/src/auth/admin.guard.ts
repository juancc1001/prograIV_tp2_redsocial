import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Request } from 'express';
import type { JwtPayload } from './auth.guard.js';
import { Role } from '../users/schemas/user.schema.js';

// va después de AuthGuard que es carga request.user
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request & { user?: JwtPayload }>();
    if (request.user?.role !== Role.Admin) {
      throw new ForbiddenException('Solo un administrador puede realizar esa consulta');
    }
    return true;
  }
}
