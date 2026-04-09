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

  @Post(':id/create-order')
  createOrder(@Param('id') id: string, @Body('studentId') studentId?: string) {
    return this.coursesService.createPaymentOrder(id, studentId ?? '');
  }

  @Post(':id/verify-payment')
  verifyPayment(
    @Param('id') id: string,
    @Body()
    payload: {
      studentId?: string;
      razorpayOrderId?: string;
      razorpayPaymentId?: string;
      razorpaySignature?: string;
    },
  ) {
    return this.coursesService.verifyPayment(
      id,
      payload.studentId ?? '',
      payload.razorpayOrderId ?? '',
      payload.razorpayPaymentId ?? '',
      payload.razorpaySignature ?? '',
    );
  }

  @Get(':id/quizzes')
  getQuizzes(@Param('id') id: string) {
    return this.coursesService.getQuizzes(id);
  }

  @Get(':id/quizzes/manage')
  getQuizManagerData(
    @Param('id') id: string,
    @Query('educatorId') educatorId?: string,
  ) {
    return this.coursesService.getQuizManagerData(id, educatorId ?? '');
  }

  @Post(':id/quizzes/:quizId/attempt')
  submitQuiz(
    @Param('id') id: string,
    @Param('quizId') quizId: string,
    @Body()
    payload: {
      studentId?: string;
      answers?: Array<{ questionId: string; selectedIndex: number }>;
    },
  ) {
    return this.coursesService.submitQuizAttempt(
      id,
      quizId,
      payload.studentId ?? '',
      payload.answers ?? [],
    );
  }

  @Post(':id/quizzes')
  updateQuizzes(
    @Param('id') id: string,
    @Body()
    payload: {
      educatorId?: string;
      quizzes?: Array<{
        quizId: string;
        title: string;
        description?: string;
        questions: Array<{
          questionId: string;
          question: string;
          options: string[];
          correctOptionIndex: number;
        }>;
      }>;
    },
  ) {
    return this.coursesService.updateQuizzes(
      id,
      payload.educatorId ?? '',
      payload.quizzes ?? [],
    );
  }

  @Get(':id/quizzes/:quizId/results')
  getQuizResults(
    @Param('id') id: string,
    @Param('quizId') quizId: string,
    @Query('studentId') studentId?: string,
  ) {
    return this.coursesService.getQuizResults(
      id,
      quizId,
      studentId ?? '',
    );
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
