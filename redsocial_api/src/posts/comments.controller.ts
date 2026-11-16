import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { PostsService } from './posts.service.js';
import { CreateCommentDto } from './dto/create-comment.dto.js';
import { PaginationPipe } from '../common/pagination.pipe.js';
import type { Pagination } from '../common/pagination.pipe.js';
import { AuthGuard } from '../auth/auth.guard.js';
import type { JwtPayload } from '../auth/auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';

// los comentarios viven dentro de la publicación, por eso la ruta cuelga de posts/:id
@Controller('posts/:id/comments')
export class CommentsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  getComments(@Param('id') id: string, @Query(PaginationPipe) pagination: Pagination) {
    return this.postsService.getComments(id, pagination);
  }

  @Post()
  @UseGuards(AuthGuard)
  addComment(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: CreateCommentDto) {
    return this.postsService.addComment(user.sub, id, dto);
  }

  @Put(':commentId')
  @UseGuards(AuthGuard)
  editComment(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Param('commentId') commentId: string, @Body() dto: CreateCommentDto) {
    return this.postsService.editComment(user.sub, id, commentId, dto);
  }

  @Delete(':commentId')
  @UseGuards(AuthGuard)
  removeComment(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Param('commentId') commentId: string) {
    return this.postsService.removeComment(user.sub, user.role, id, commentId);
  }
}
