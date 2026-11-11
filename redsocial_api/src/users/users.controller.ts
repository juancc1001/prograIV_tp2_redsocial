import { Body, Controller, Get, Param, Patch, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { AuthGuard } from '../auth/auth.guard.js';
import type { JwtPayload } from '../auth/auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':username')
  findProfile(@Param('username') username: string) {
    return this.usersService.findProfile(username);
  }

  @Patch('me')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('picture'))
  update(@CurrentUser() user: JwtPayload, @Body() dto: UpdateUserDto, @UploadedFile() picture?: Express.Multer.File) {
    return this.usersService.update(user.sub, dto, picture);
  }
}
