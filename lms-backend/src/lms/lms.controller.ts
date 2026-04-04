import { Controller, Get, Query } from '@nestjs/common';
import { LmsService } from './lms.service';

@Controller('lms')
export class LmsController {
  constructor(private readonly lmsService: LmsService) {}

  @Get('home')
  getHomePage() {
    return this.lmsService.getHomePageData();
  }

  @Get('learner')
  getLearnerOverview(@Query('studentId') studentId?: string) {
    return this.lmsService.getLearnerOverview(studentId);
  }

  @Get('educator/dashboard')
  getEducatorDashboard(@Query('educatorId') educatorId?: string) {
    return this.lmsService.getEducatorDashboard(educatorId);
  }
}
