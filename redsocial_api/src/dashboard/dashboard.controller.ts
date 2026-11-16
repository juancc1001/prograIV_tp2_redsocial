import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { AdminGuard } from '../auth/admin.guard.js';
import { DateRangePipe } from '../common/date-range.pipe.js';
import type { DateRange } from '../common/date-range.pipe.js';

@Controller('dashboard')
@UseGuards(AuthGuard, AdminGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('posts-per-user')
  postsPerUser(@Query(DateRangePipe) range: DateRange) {
    return this.dashboardService.postsPerUser(range);
  }

  @Get('comments-per-day')
  commentsPerDay(@Query(DateRangePipe) range: DateRange) {
    return this.dashboardService.commentsPerDay(range);
  }

  @Get('comments-per-post')
  commentsPerPost(@Query(DateRangePipe) range: DateRange) {
    return this.dashboardService.commentsPerPost(range);
  }
}
