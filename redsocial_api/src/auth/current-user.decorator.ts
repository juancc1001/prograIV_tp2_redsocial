import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { JwtPayload } from './auth.guard.js';

//decorator para pasar el usuario actual de los controladores a los servicios
export const CurrentUser = createParamDecorator((data: unknown, context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest<Request & { user: JwtPayload }>();
  return request.user;
});
