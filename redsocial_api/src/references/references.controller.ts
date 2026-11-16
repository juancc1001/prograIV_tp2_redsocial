import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReferencesService } from './references.service.js';
import { AuthGuard } from '../auth/auth.guard.js';

@Controller('references')
export class ReferencesController {
  constructor(private readonly referencesService: ReferencesService) {}

  // type: MOVIE | BOOK | GAME
  @Get('search')
  @UseGuards(AuthGuard)
  search(@Query('type') type: string, @Query('q') query: string) {
    return this.referencesService.search(type, query);
  }
}
