import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LmsController } from './lms.controller';
import { LmsService } from './lms.service';
import { User, UserSchema } from '../users/user.schema';
import { Course, CourseSchema } from '../courses/course.schema';
import { Enrollment, EnrollmentSchema } from './enrollment.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Course.name, schema: CourseSchema },
      { name: Enrollment.name, schema: EnrollmentSchema },
    ]),
  ],
  controllers: [LmsController],
  providers: [LmsService],
  exports: [LmsService],
})
export class LmsModule {}
