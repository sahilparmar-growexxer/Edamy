import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { createHmac } from 'crypto';
import { LmsService } from '../lms/lms.service';
import { Course, CourseDocument } from './course.schema';
import { Enrollment, EnrollmentDocument } from '../lms/enrollment.schema';
import { QuizAttempt, QuizAttemptDocument } from '../lms/quiz-attempt.schema';
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
    @InjectModel(QuizAttempt.name)
    private readonly quizAttemptModel: Model<QuizAttemptDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly lmsService: LmsService,
    private readonly notificationsService: NotificationsService,
    private readonly configService: ConfigService,
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
      quizzes: courseData.quizzes ?? [],
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

  async getQuizzes(courseId: string) {
    const course = await this.findOrCreateCourseForEnrollment(courseId);
    if (!course) {
      throw new NotFoundException('Course not found.');
    }

    return {
      courseId,
      quizzes: (course.quizzes ?? []).map((quiz) => ({
        quizId: quiz.quizId,
        title: quiz.title,
        description: quiz.description ?? null,
        questions: quiz.questions.map((question) => ({
          questionId: question.questionId,
          question: question.question,
          options: [...question.options],
        })),
      })),
    };
  }

  async getQuizManagerData(courseId: string, educatorId: string) {
    const [course, educator] = await Promise.all([
      this.findOrCreateCourseForEnrollment(courseId),
      this.userModel.findById(educatorId),
    ]);

    if (!course) {
      throw new NotFoundException('Course not found.');
    }

    if (!educator || educator.role !== 'teacher') {
      throw new BadRequestException('Valid teacher account is required.');
    }

    if (course.educatorId !== educatorId) {
      throw new BadRequestException(
        'You can only manage quizzes for your own courses.',
      );
    }

    return {
      courseId,
      quizzes: (course.quizzes ?? []).map((quiz) => ({
        quizId: quiz.quizId,
        title: quiz.title,
        description: quiz.description ?? null,
        questions: quiz.questions.map((question) => ({
          questionId: question.questionId,
          question: question.question,
          options: [...question.options],
          correctOptionIndex: question.correctOptionIndex,
        })),
      })),
    };
  }

  async submitQuizAttempt(
    courseId: string,
    quizId: string,
    studentId: string,
    answers: Array<{ questionId: string; selectedIndex: number }>,
  ) {
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

    const enrollmentId = `${studentId}_${courseId}`;
    const existingEnrollment =
      await this.enrollmentModel.findById(enrollmentId);
    if (!existingEnrollment) {
      throw new BadRequestException('Enroll in the course before attempting the quiz.');
    }

    const quiz = course.quizzes?.find((item) => item.quizId === quizId);
    if (!quiz) {
      throw new NotFoundException('Quiz not found.');
    }

    const answerMap = new Map(
      answers.map((answer) => [answer.questionId, answer.selectedIndex]),
    );

    const questionResults = quiz.questions.map((question) => {
      const selectedIndex = answerMap.get(question.questionId);
      const normalizedSelected =
        typeof selectedIndex === 'number' ? selectedIndex : -1;
      const correctIndex = question.correctOptionIndex;
      return {
        questionId: question.questionId,
        selectedIndex: normalizedSelected,
        correctIndex,
        isCorrect: normalizedSelected === correctIndex,
      };
    });

    const score = questionResults.filter((item) => item.isCorrect).length;
    const total = questionResults.length;
    const submittedAt = new Date().toISOString();

    const attemptId = `${studentId}_${quizId}_${Date.now()}`;

    const attempt = await this.quizAttemptModel.create({
      _id: attemptId,
      courseId,
      quizId,
      studentId,
      answers: questionResults,
      score,
      total,
      submittedAt,
    });

    return {
      message: 'Quiz submitted.',
      result: {
        attemptId: attempt._id,
        courseId,
        quizId,
        score,
        total,
        submittedAt,
        answers: questionResults,
      },
    };
  }

  async updateQuizzes(
    courseId: string,
    educatorId: string,
    quizzes: Array<{
      quizId: string;
      title: string;
      description?: string;
      questions: Array<{
        questionId: string;
        question: string;
        options: string[];
        correctOptionIndex: number;
      }>;
    }>,
  ) {
    const [course, educator] = await Promise.all([
      this.findOrCreateCourseForEnrollment(courseId),
      this.userModel.findById(educatorId),
    ]);

    if (!course) {
      throw new NotFoundException('Course not found.');
    }

    if (!educator || educator.role !== 'teacher') {
      throw new BadRequestException('Valid teacher account is required.');
    }

    if (course.educatorId !== educatorId) {
      throw new BadRequestException(
        'You can only manage quizzes for your own courses.',
      );
    }

    const normalizedQuizzes = quizzes.map((quiz) => {
      const normalizedQuestions = (quiz.questions ?? []).map((question) => {
        if (
          question.correctOptionIndex < 0 ||
          question.correctOptionIndex >= question.options.length
        ) {
          throw new BadRequestException(
            `Correct option index is out of range for question ${question.questionId}.`,
          );
        }

        return {
          questionId: question.questionId,
          question: question.question,
          options: question.options,
          correctOptionIndex: question.correctOptionIndex,
        };
      });

      return {
        quizId: quiz.quizId,
        title: quiz.title,
        description: quiz.description ?? '',
        questions: normalizedQuestions,
      };
    });

    course.quizzes = normalizedQuizzes;
    await course.save();

    return {
      message: 'Quizzes updated.',
      quizzesCount: normalizedQuizzes.length,
    };
  }

  async getQuizResults(courseId: string, quizId: string, studentId: string) {
    if (!studentId) {
      throw new BadRequestException('studentId is required.');
    }

    const attempts = await this.quizAttemptModel
      .find({ courseId, quizId, studentId })
      .sort({ submittedAt: -1 })
      .limit(5)
      .lean();

    return {
      courseId,
      quizId,
      attempts: attempts.map((attempt) => ({
        attemptId: attempt._id,
        score: attempt.score,
        total: attempt.total,
        submittedAt: attempt.submittedAt,
        answers: attempt.answers,
      })),
    };
  }

  async createPaymentOrder(courseId: string, studentId: string) {
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
    const redirectUrl = this.getRedirectUrl(course);

    if (existingEnrollment) {
      return {
        status: 'already_enrolled',
        message: 'Already enrolled in this course.',
        enrollmentId,
        redirectUrl,
      };
    }

    const finalPrice = this.getFinalPrice(course);
    if (finalPrice <= 0) {
      const enrollment = await this.enroll(courseId, studentId);
      return {
        status: 'enrolled',
        ...enrollment,
      };
    }

    const keyId = this.configService.get<string>('RAZORPAY_KEY_ID');
    const keySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET');

    if (!keyId || !keySecret) {
      throw new BadRequestException(
        'Razorpay configuration is missing. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.',
      );
    }

    const amount = Math.round(finalPrice * 100);
    const currency =
      this.configService.get<string>('RAZORPAY_CURRENCY') ?? 'INR';
    const receipt = `course_${courseId}_${studentId}_${Date.now()}`;

    const order = await this.createRazorpayOrder({
      amount,
      currency,
      receipt,
      courseId,
      studentId,
      keyId,
      keySecret,
    });

    return {
      status: 'order_created',
      keyId,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      courseTitle: course.courseTitle,
    };
  }

  async verifyPayment(
    courseId: string,
    studentId: string,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
  ) {
    const keySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET');

    if (!keySecret) {
      throw new BadRequestException(
        'Razorpay configuration is missing. Please set RAZORPAY_KEY_SECRET.',
      );
    }

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      throw new BadRequestException('Invalid payment verification payload.');
    }

    const expectedSignature = createHmac('sha256', keySecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      throw new BadRequestException('Payment verification failed.');
    }

    return this.enroll(courseId, studentId);
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

  private getRedirectUrl(course: CourseDocument) {
    return (
      course.courseContent
        ?.flatMap((chapter) => chapter.chapterContent ?? [])
        .sort((a, b) => a.lectureOrder - b.lectureOrder)[0]?.lectureUrl ?? null
    );
  }

  private getFinalPrice(course: CourseDocument) {
    const price = Number(course.coursePrice ?? 0);
    const discount = Number(course.discount ?? 0);
    if (!Number.isFinite(price)) {
      return 0;
    }

    const normalizedDiscount = Number.isFinite(discount)
      ? Math.min(Math.max(discount, 0), 100)
      : 0;

    return Math.max(0, price * (1 - normalizedDiscount / 100));
  }

  private async createRazorpayOrder(payload: {
    amount: number;
    currency: string;
    receipt: string;
    courseId: string;
    studentId: string;
    keyId: string;
    keySecret: string;
  }) {
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(
          `${payload.keyId}:${payload.keySecret}`,
        ).toString('base64')}`,
      },
      body: JSON.stringify({
        amount: payload.amount,
        currency: payload.currency,
        receipt: payload.receipt,
        payment_capture: 1,
        notes: {
          courseId: payload.courseId,
          studentId: payload.studentId,
        },
      }),
    });

    const body = (await response.json().catch(() => null)) as
      | { id?: string; amount?: number; currency?: string; error?: { description?: string } }
      | null;

    if (!response.ok || !body?.id) {
      const message =
        body?.error?.description ?? 'Failed to create Razorpay order.';
      throw new BadRequestException(message);
    }

    return {
      id: body.id,
      amount: body.amount ?? payload.amount,
      currency: body.currency ?? payload.currency,
    };
  }
}
