import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LmsService } from '../lms/lms.service';
import { Course, CourseDocument } from './course.schema';
import { Enrollment, EnrollmentDocument } from '../lms/enrollment.schema';
import { User, UserDocument } from '../users/user.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { getSeedCourses } from '../lms/lms.data';

@Injectable()
export class CoursesService {
  constructor(
    @InjectModel(Course.name)
    private readonly courseModel: Model<CourseDocument>,
    @InjectModel(Enrollment.name)
    private readonly enrollmentModel: Model<EnrollmentDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly lmsService: LmsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  findAll(query?: { q?: string; category?: string }) {
    return this.lmsService.getCatalog(query);
  }

  findOne(id: string) {
    return this.lmsService.getCourseById(id);
  }

  async create(courseData: Partial<Course>) {
    const trimmedThumbnail = courseData.courseThumbnail?.trim();
    const lessonsCount =
      courseData.lessonsCount ??
      courseData.courseContent?.reduce(
        (sum, chapter) => sum + (chapter.chapterContent?.length ?? 0),
        0,
      ) ??
      0;

    const course = await this.courseModel.create({
      _id: courseData._id ?? `course_${Date.now()}`,
      category: courseData.category ?? 'General',
      level: courseData.level ?? 'Beginner',
      courseTitle: courseData.courseTitle ?? 'New course',
      shortDescription:
        courseData.shortDescription ?? 'Fresh course ready to publish.',
      courseDescription:
        courseData.courseDescription ??
        '<p>Course description coming soon.</p>',
      coursePrice: courseData.coursePrice ?? 0,
      discount: courseData.discount ?? 0,
      isPublished: courseData.isPublished ?? false,
      courseContent: courseData.courseContent ?? [],
      courseThumbnailKey: courseData.courseThumbnailKey ?? 'course_1_thumbnail',
      educatorId: courseData.educatorId ?? 'teacher_1',
      educatorName: courseData.educatorName ?? 'GreatStack',
      enrolledStudents: courseData.enrolledStudents ?? [],
      courseRatings: courseData.courseRatings ?? [],
      durationLabel: courseData.durationLabel ?? '0h 0m',
      lessonsCount,
      courseThumbnail: trimmedThumbnail || undefined,
    });

    return course.toObject();
  }

  async enroll(courseId: string, studentId: string) {
    const [course, student] = await Promise.all([
      this.findOrCreateCourseForEnrollment(courseId),
      this.userModel.findById(studentId),
    ]);

    if (!course) {
      throw new NotFoundException('Course not found.');
    }

    if (!student || student.role !== 'student') {
      throw new BadRequestException('Valid student account is required.');
    }

    if (!student.email?.trim() || !student.mobileNumber?.trim()) {
      throw new BadRequestException(
        'Please register both your email and mobile number before enrolling.',
      );
    }

    const enrollmentId = `${studentId}_${courseId}`;
    const existingEnrollment =
      await this.enrollmentModel.findById(enrollmentId);

    const redirectUrl =
      course.courseContent
        ?.flatMap((chapter) => chapter.chapterContent ?? [])
        .sort((a, b) => a.lectureOrder - b.lectureOrder)[0]?.lectureUrl ??
      null;

    if (existingEnrollment) {
      return {
        message: 'Already enrolled in this course.',
        enrollmentId,
        redirectUrl,
      };
    }

    const firstLesson =
      course.courseContent
        ?.flatMap((chapter) => chapter.chapterContent ?? [])
        .sort((a, b) => a.lectureOrder - b.lectureOrder)[0]?.lectureTitle ??
      'Getting started';

    await this.enrollmentModel.create({
      _id: enrollmentId,
      studentId,
      courseId,
      progressPercent: 0,
      purchaseDate: new Date().toISOString(),
      lastLesson: firstLesson,
    });

    if (!course.enrolledStudents.includes(studentId)) {
      course.enrolledStudents.push(studentId);
      await course.save();
    }

    await this.notificationsService.sendEnrollmentNotifications(
      {
        userId: student._id,
        name: student.name,
        email: student.email,
        mobileNumber: student.mobileNumber,
      },
      course.courseTitle,
    );

    return {
      message: 'Enrollment successful.',
      enrollmentId,
      redirectUrl,
    };
  }

  seed() {
    return this.lmsService.seedDatabase();
  }

  reset() {
    return this.lmsService.resetCatalog();
  }

  private async findOrCreateCourseForEnrollment(courseId: string) {
    const existingCourse = await this.courseModel.findById(courseId);

    if (existingCourse) {
      return existingCourse;
    }

    const seedCourse = getSeedCourses().find((course) => course._id === courseId);

    if (!seedCourse) {
      return null;
    }

    return this.courseModel.create(seedCourse);
  }
}
