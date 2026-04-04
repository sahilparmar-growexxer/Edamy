import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { Course } from './course.schema';

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  findAll(@Query('q') q?: string, @Query('category') category?: string) {
    return this.coursesService.findAll({ q, category });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.coursesService.findOne(id);
  }

  @Post()
  create(@Body() courseData: Partial<Course>) {
    return this.coursesService.create(courseData);
  }

  @Post(':id/enroll')
  enroll(@Param('id') id: string, @Body('studentId') studentId?: string) {
    return this.coursesService.enroll(id, studentId ?? '');
  }

  @Post('seed')
  seed() {
    return this.coursesService.seed();
  }

  @Post('reset')
  reset() {
    return this.coursesService.reset();
  }
}
