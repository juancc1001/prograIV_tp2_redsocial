import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { PostsService } from './posts.service.js';
import { CreatePostDto } from './dto/create-post.dto.js';
import { UpdatePostDto } from './dto/update-post.dto.js';
import { CreateCommentDto } from './dto/create-comment.dto.js';
import { AuthGuard } from '../auth/auth.guard.js';
import type { JwtPayload } from '../auth/auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get('feed')
  @UseGuards(AuthGuard)
  getFeed(@CurrentUser() user: JwtPayload) {
    return this.postsService.getFeed(user.sub);
  }

  @Get('user/:username')
  getUserPosts(@Param('username') username: string) {
    return this.postsService.getUserPosts(username);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postsService.findOne(id);
  }

  @Post()
  @UseGuards(AuthGuard)
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreatePostDto) {
    return this.postsService.create(user.sub, dto);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  update(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: UpdatePostDto) {
    return this.postsService.update(user.sub, id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.postsService.remove(user.sub, id);
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
  getComments(@Param('id') id: string) {
    return this.postsService.getComments(id);
  }

  @Post(':id/comments')
  @UseGuards(AuthGuard)
  addComment(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: CreateCommentDto) {
    return this.postsService.addComment(user.sub, id, dto);
  }

  @Delete(':id/comments/:commentId')
  @UseGuards(AuthGuard)
  removeComment(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Param('commentId') commentId: string) {
    return this.postsService.removeComment(user.sub, id, commentId);
  }
}
