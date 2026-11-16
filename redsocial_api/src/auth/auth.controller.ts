import { Body, Controller, Headers, HttpCode, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { AuthGuard } from './auth.guard.js';
import type { JwtPayload } from './auth.guard.js';
import { CurrentUser } from './current-user.decorator.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // el guard valida el token (firma, vencimiento y que no esté revocado) y si falla devuelve 401
  @Post('authorize')
  @HttpCode(200)
  @UseGuards(AuthGuard)
  authorize(@CurrentUser() user: JwtPayload) {
    return this.authService.authorize(user.sub);
  }

  @Post('refresh')
  @HttpCode(200)
  @UseGuards(AuthGuard)
  refresh(@CurrentUser() user: JwtPayload, @Headers('authorization') authorization: string) {
    const token = authorization.split(' ')[1];
    return this.authService.refresh(user.sub, token);
  }

  @Post('logout')
  @HttpCode(204)
  @UseGuards(AuthGuard)
  logout(@Headers('authorization') authorization: string) {
    const token = authorization.split(' ')[1];
    this.authService.logout(token);
  }
}
