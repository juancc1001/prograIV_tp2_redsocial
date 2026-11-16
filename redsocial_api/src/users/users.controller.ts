import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { AuthGuard } from '../auth/auth.guard.js';
import type { JwtPayload } from '../auth/auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { PaginationPipe } from '../common/pagination.pipe.js';
import type { Pagination } from '../common/pagination.pipe.js';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(AuthGuard)
  findAll(@CurrentUser() user: JwtPayload, @Query(PaginationPipe) pagination: Pagination) {
    return this.usersService.findAll(user.role, pagination);
  }

  @Post()
  @UseGuards(AuthGuard)
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateUserDto) {
    return this.usersService.create(user.role, dto);
  }

  // baja lógica
  @Delete(':username')
  @UseGuards(AuthGuard)
  disable(@CurrentUser() user: JwtPayload, @Param('username') username: string) {
    return this.usersService.setActive(user.role, username, false);
  }

  // alta lógica
  @Post(':username/enable')
  @UseGuards(AuthGuard)
  enable(@CurrentUser() user: JwtPayload, @Param('username') username: string) {
    return this.usersService.setActive(user.role, username, true);
  }

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
