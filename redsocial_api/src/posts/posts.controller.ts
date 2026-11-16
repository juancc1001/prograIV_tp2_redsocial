import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { PostsService } from './posts.service.js';
import { CreatePostDto } from './dto/create-post.dto.js';
import { UpdatePostDto } from './dto/update-post.dto.js';
import { CreateCommentDto } from './dto/create-comment.dto.js';
import { PaginationPipe } from '../common/pagination.pipe.js';
import type { Pagination } from '../common/pagination.pipe.js';
import { PostSortingPipe } from './post-sorting.pipe.js';
import { AuthGuard } from '../auth/auth.guard.js';
import type { JwtPayload } from '../auth/auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  //@query obtiene los elementos de la query como clave valor 
  //pipe transforma a tipo Pagination y valida los datos
  @UseGuards(AuthGuard)
  getPosts(
    @Query(PaginationPipe) pagination: Pagination,
    // formato "campo:asc|desc" separado por comas, ej: "likesCount:desc,createdAt:desc"
    @Query('sort', PostSortingPipe) sort: Record<string, 1 | -1>,
  ) {
    return this.postsService.getPosts(pagination, sort);
  }

  @Get('feed')
  @UseGuards(AuthGuard)
  getFeed(@CurrentUser() user: JwtPayload) {
    return this.postsService.getFeed(user.sub);
  }

  @Get('user/:username')
  getUserPosts(
    @Param('username') username: string,
    @Query(PaginationPipe) pagination: Pagination,
    @Query('sort', PostSortingPipe) sort: Record<string, 1 | -1>,
  ) {
    return this.postsService.getUserPosts(username, pagination, sort);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postsService.findOne(id);
  }

  @Post()
  @UseGuards(AuthGuard)
  @UseInterceptors(FilesInterceptor('files'))
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreatePostDto, @UploadedFiles() files: Express.Multer.File[]) {
    return this.postsService.create(user.sub, dto, files);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  update(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: UpdatePostDto) {
    return this.postsService.update(user.sub, id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.postsService.remove(user.sub, user.role, id);
  }

  @Post(':id/like')
  @UseGuards(AuthGuard)
  like(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.postsService.like(user.sub, id);
  }

  @Delete(':id/like')
  @UseGuards(AuthGuard)
  unlike(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.postsService.unlike(user.sub, id);
  }

  @Get(':id/comments')
  getComments(@Param('id') id: string, @Query(PaginationPipe) pagination: Pagination) {
    return this.postsService.getComments(id, pagination);
  }

  @Post(':id/comments')
  @UseGuards(AuthGuard)
  addComment(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: CreateCommentDto) {
    return this.postsService.addComment(user.sub, id, dto);
  }

  @Patch(':id/comments/:commentId')
  @UseGuards(AuthGuard)
  editComment(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Param('commentId') commentId: string, @Body() dto: CreateCommentDto) {
    return this.postsService.editComment(user.sub, id, commentId, dto);
  }

  @Delete(':id/comments/:commentId')
  @UseGuards(AuthGuard)
  removeComment(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Param('commentId') commentId: string) {
    return this.postsService.removeComment(user.sub, id, commentId);
  }
}
