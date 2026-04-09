import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CoursesService } from './courses.service';
import { CoursesController } from './courses.controller';
import { LmsModule } from '../lms/lms.module';
import { Course, CourseSchema } from './course.schema';
import { Enrollment, EnrollmentSchema } from '../lms/enrollment.schema';
import { QuizAttempt, QuizAttemptSchema } from '../lms/quiz-attempt.schema';
import { User, UserSchema } from '../users/user.schema';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Course.name, schema: CourseSchema },
      { name: Enrollment.name, schema: EnrollmentSchema },
      { name: QuizAttempt.name, schema: QuizAttemptSchema },
      { name: User.name, schema: UserSchema },
    ]),
    LmsModule,
    NotificationsModule,
  ],
  controllers: [CoursesController],
  providers: [CoursesService],
})
export class CoursesModule {}
