import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Course, CourseDocument } from '../courses/course.schema';
import { User, UserDocument } from '../users/user.schema';
import {
  EnrollmentRecord,
  getEnrollments,
  getFeatureCards,
  getPartnerAssetKeys,
  getSeedCourses,
  getSeedUsers,
  getTestimonials,
} from './lms.data';
import { Enrollment, EnrollmentDocument } from './enrollment.schema';

@Injectable()
export class LmsService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Course.name)
    private readonly courseModel: Model<CourseDocument>,
    @InjectModel(Enrollment.name)
    private readonly enrollmentModel: Model<EnrollmentDocument>,
  ) {}

  async getCatalog(query?: { q?: string; category?: string }) {
    const q = query?.q?.trim();
    const category = query?.category?.trim();
    const filters: Record<string, unknown> = {};

    if (category && category.toLowerCase() !== 'all') {
      filters.category = new RegExp(`^${this.escapeRegex(category)}$`, 'i');
    }

    if (q) {
      const searchRegex = new RegExp(this.escapeRegex(q), 'i');
      filters.$or = [
        { courseTitle: searchRegex },
        { shortDescription: searchRegex },
        { category: searchRegex },
      ];
    }

    const [courses, allCourses] = await Promise.all([
      this.courseModel.find(filters).lean(),
      this.courseModel.find({}, { category: 1 }).lean(),
    ]);

    if (allCourses.length === 0) {
      return this.getSeedCatalog(query);
    }

    return {
      categories: [
        'All',
        ...new Set(allCourses.map((course) => course.category).filter(Boolean)),
      ],
      resultsCount: courses.length,
      courses,
    };
  }

  async getCourseById(id: string) {
    const course = await this.courseModel.findById(id).lean();
    if (course) {
      return course;
    }

    return getSeedCourses().find((item) => item._id === id) ?? null;
  }

  async getHomePageData() {
    const courses = await this.courseModel.find().limit(4).lean();
    if (courses.length === 0) {
      const seedCourses = getSeedCourses().slice(0, 4);
      return {
        hero: {
          eyebrow: 'Build skills that matter',
          title: 'Learn anytime, anywhere with GreatStack LMS.',
          description:
            'Access curated courses, live lectures, and real-world projects designed for modern learners. Move from curiosity to career-ready confidence with a platform built for momentum.',
          primaryCta: { label: 'Browse courses', href: '/courses' },
          secondaryCta: { label: 'My learning path', href: '/my-courses' },
          featuredCourseId: seedCourses[0]?._id ?? null,
        },
        partners: getPartnerAssetKeys(),
        features: getFeatureCards(),
        featuredCourses: seedCourses,
        testimonials: getTestimonials(),
        stats: {
          totalCourses: getSeedCourses().length,
          totalStudents: new Set(
            getEnrollments().map((enrollment) => enrollment.studentId),
          ).size,
          averageRating:
            this.getAverageCatalogRatingFromCourses(getSeedCourses()),
        },
      };
    }

    return {
      hero: {
        eyebrow: 'Build skills that matter',
        title: 'Learn anytime, anywhere with GreatStack LMS.',
        description:
          'Access curated courses, live lectures, and real-world projects designed for modern learners. Move from curiosity to career-ready confidence with a platform built for momentum.',
        primaryCta: { label: 'Browse courses', href: '/courses' },
        secondaryCta: { label: 'My learning path', href: '/my-courses' },
        featuredCourseId: courses[0]?._id ?? null,
      },
      partners: getPartnerAssetKeys(),
      features: getFeatureCards(),
      featuredCourses: courses,
      testimonials: getTestimonials(),
      stats: {
        totalCourses: await this.courseModel.countDocuments(),
        totalStudents: await this.userModel.countDocuments({ role: 'student' }),
        averageRating: await this.getAverageCatalogRating(),
      },
    };
  }

  async getLearnerOverview(studentId = 'student_1') {
    const student =
      (await this.userModel
        .findOne({ _id: studentId, role: 'student' })
        .lean()) ?? (await this.userModel.findOne({ role: 'student' }).lean());

    if (!student) {
      return this.getSeedLearnerOverview(studentId);
    }

    const learnerEnrollments = await this.enrollmentModel
      .find({ studentId: student._id })
      .lean();
    const courseIds = learnerEnrollments.map(
      (enrollment) => enrollment.courseId,
    );
    const courses = await this.courseModel
      .find({ _id: { $in: courseIds } })
      .lean();

    const courseMap = new Map(courses.map((course) => [course._id, course]));
    const enrolledCourses = learnerEnrollments
      .map((enrollment) => {
        const course = courseMap.get(enrollment.courseId);
        if (!course) {
          return null;
        }

        return {
          ...course,
          progressPercent: enrollment.progressPercent,
          purchaseDate: enrollment.purchaseDate,
          lastLesson: enrollment.lastLesson,
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

    const averageProgress =
      enrolledCourses.length === 0
        ? 0
        : Math.round(
            enrolledCourses.reduce(
              (sum, course) => sum + course.progressPercent,
              0,
            ) / enrolledCourses.length,
          );

    return {
      learner: this.toPublicUser(student),
      metrics: {
        activeCourses: enrolledCourses.length,
        averageProgress,
        hoursRemaining: this.getHoursRemaining(enrolledCourses),
      },
      studySprint: this.buildStudySprint(enrolledCourses),
      enrolledCourses,
    };
  }

  async getEducatorDashboard(educatorId = 'educator_1') {
    const educator =
      (await this.userModel
        .findOne({ _id: educatorId, role: 'teacher' })
        .lean()) ?? (await this.userModel.findOne({ role: 'teacher' }).lean());

    if (!educator) {
      return this.getSeedEducatorDashboard(educatorId);
    }

    const educatorCourses = await this.courseModel
      .find({ educatorId: educator._id })
      .lean();
    const courseMap = new Map(
      educatorCourses.map((course) => [course._id, course]),
    );
    const enrollments = await this.enrollmentModel
      .find({ courseId: { $in: educatorCourses.map((course) => course._id) } })
      .lean();
    const students = await this.userModel
      .find({
        _id: { $in: enrollments.map((enrollment) => enrollment.studentId) },
      })
      .lean();
    const studentMap = new Map(
      students.map((student) => [student._id, student]),
    );

    const recentEnrollments = enrollments
      .map((enrollment) => {
        const student = studentMap.get(enrollment.studentId);
        const course = courseMap.get(enrollment.courseId);
        if (!student || !course) {
          return null;
        }

        return {
          courseId: course._id,
          courseTitle: course.courseTitle,
          purchaseDate: enrollment.purchaseDate,
          student: {
            _id: student._id,
            name: student.name,
            imageUrl: student.imageUrl,
          },
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
      .sort((a, b) => +new Date(b.purchaseDate) - +new Date(a.purchaseDate));

    const totalEarnings = educatorCourses.reduce((sum, course) => {
      const enrolledCount = enrollments.filter(
        (enrollment) => enrollment.courseId === course._id,
      ).length;
      return (
        sum + enrolledCount * course.coursePrice * (1 - course.discount / 100)
      );
    }, 0);

    return {
      educator: this.toPublicUser(educator),
      metrics: {
        totalEarnings: Number(totalEarnings.toFixed(2)),
        totalCourses: educatorCourses.length,
        totalStudents: new Set(
          recentEnrollments.map((entry) => entry.student._id),
        ).size,
      },
      launchReadiness: this.buildLaunchReadiness(educatorCourses),
      recentEnrollments,
      topCourses: educatorCourses.map((course) => ({
        _id: course._id,
        title: course.courseTitle,
        enrollments: enrollments.filter(
          (enrollment) => enrollment.courseId === course._id,
        ).length,
        rating: this.getCourseAverageRating(course.courseRatings),
        revenue: Number(
          (
            enrollments.filter(
              (enrollment) => enrollment.courseId === course._id,
            ).length *
            course.coursePrice *
            (1 - course.discount / 100)
          ).toFixed(2),
        ),
      })),
    };
  }

  async seedDatabase() {
    const existingUsers = await this.userModel.countDocuments();
    const existingCourses = await this.courseModel.countDocuments();
    const existingEnrollments = await this.enrollmentModel.countDocuments();

    if (existingUsers || existingCourses || existingEnrollments) {
      return {
        message:
          'Database already contains data. Use the reset endpoint to reseed it.',
      };
    }

    await this.userModel.insertMany(getSeedUsers(), { ordered: true });
    await this.courseModel.insertMany(getSeedCourses(), { ordered: true });
    await this.enrollmentModel.insertMany(
      getEnrollments().map((enrollment) =>
        this.toEnrollmentDocument(enrollment),
      ),
      { ordered: true },
    );

    return { message: 'Database seeded successfully' };
  }

  async resetCatalog() {
    await Promise.all([
      this.userModel.deleteMany({}),
      this.courseModel.deleteMany({}),
      this.enrollmentModel.deleteMany({}),
    ]);

    await this.userModel.insertMany(getSeedUsers(), { ordered: true });
    await this.courseModel.insertMany(getSeedCourses(), { ordered: true });
    await this.enrollmentModel.insertMany(
      getEnrollments().map((enrollment) =>
        this.toEnrollmentDocument(enrollment),
      ),
      { ordered: true },
    );

    return { message: 'LMS data reset successfully' };
  }

  private async getAverageCatalogRating() {
    const courses = await this.courseModel
      .find({}, { courseRatings: 1 })
      .lean();
    const ratings = courses.flatMap((course) =>
      course.courseRatings.map((rating) => rating.rating),
    );

    if (ratings.length === 0) {
      return 0;
    }

    return Number(
      (
        ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
      ).toFixed(1),
    );
  }

  private getAverageCatalogRatingFromCourses(
    courses: Array<{ courseRatings: Array<{ rating: number }> }>,
  ) {
    const ratings = courses.flatMap((course) =>
      course.courseRatings.map((rating) => rating.rating),
    );

    if (ratings.length === 0) {
      return 0;
    }

    return Number(
      (
        ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
      ).toFixed(1),
    );
  }

  private getCourseAverageRating(
    ratings: Array<{ rating: number }> | undefined,
  ) {
    if (!ratings || ratings.length === 0) {
      return 0;
    }

    return Number(
      (
        ratings.reduce((sum, rating) => sum + rating.rating, 0) / ratings.length
      ).toFixed(1),
    );
  }

  private getHoursRemaining(
    enrolledCourses: Array<{ lessonsCount?: number; progressPercent?: number }>,
  ) {
    const remainingHours = enrolledCourses.reduce((sum, course) => {
      const totalHours = (course.lessonsCount ?? 0) * 0.75;
      const completedRatio = (course.progressPercent ?? 0) / 100;
      return sum + totalHours * (1 - completedRatio);
    }, 0);

    const wholeHours = Math.floor(remainingHours);
    const minutes = Math.round((remainingHours - wholeHours) * 60);
    return `${wholeHours}h ${minutes}m`;
  }

  private buildLaunchReadiness(
    courses: Array<{
      _id: string;
      courseTitle: string;
      shortDescription?: string;
      courseDescription?: string;
      courseThumbnail?: string;
      durationLabel?: string;
      coursePrice?: number;
      isPublished?: boolean;
      courseContent?: Array<{
        chapterContent?: Array<{
          lectureTitle?: string;
          lectureUrl?: string;
          isPreviewFree?: boolean;
        }>;
      }>;
    }>,
  ) {
    if (courses.length === 0) {
      return null;
    }

    const courseReports = courses.map((course) => {
      const lessons =
        course.courseContent?.flatMap(
          (chapter) => chapter.chapterContent ?? [],
        ) ?? [];
      const hasThumbnail = Boolean(course.courseThumbnail);
      const hasShortDescription = Boolean(course.shortDescription?.trim());
      const hasFullDescription = Boolean(course.courseDescription?.trim());
      const hasDuration = Boolean(course.durationLabel?.trim());
      const hasPrice =
        typeof course.coursePrice === 'number' && course.coursePrice > 0;
      const hasEnoughLessons = lessons.length >= 3;
      const hasVideosForAllLessons =
        lessons.length > 0 &&
        lessons.every((lesson) => Boolean(lesson.lectureUrl?.trim()));
      const hasPreviewLesson = lessons.some((lesson) => lesson.isPreviewFree);

      const checks = [
        hasThumbnail,
        hasShortDescription,
        hasFullDescription,
        hasDuration,
        hasPrice,
        hasEnoughLessons,
        hasVideosForAllLessons,
        hasPreviewLesson,
      ];
      const completedChecks = checks.filter(Boolean).length;
      const readinessScore = Math.round(
        (completedChecks / checks.length) * 100,
      );
      const blockers = [
        !hasThumbnail ? 'Add a course thumbnail' : null,
        !hasShortDescription ? 'Write a short description' : null,
        !hasFullDescription ? 'Add a full course description' : null,
        !hasDuration ? 'Set a course duration label' : null,
        !hasPrice ? 'Set a valid course price' : null,
        !hasEnoughLessons ? 'Add at least 3 lessons' : null,
        !hasVideosForAllLessons ? 'Attach video URLs to every lesson' : null,
        !hasPreviewLesson ? 'Mark one lesson as a free preview' : null,
      ].filter((item): item is string => Boolean(item));

      return {
        courseId: course._id,
        courseTitle: course.courseTitle,
        readinessScore,
        status:
          readinessScore >= 85
            ? 'ready'
            : readinessScore >= 60
              ? 'almost-ready'
              : 'needs-work',
        blockers,
        publishedState: course.isPublished ? 'published' : 'draft',
      };
    });

    const highestReadiness = Math.max(
      ...courseReports.map((course) => course.readinessScore),
    );
    const lowestReadiness = Math.min(
      ...courseReports.map((course) => course.readinessScore),
    );
    const readyCourses = courseReports.filter(
      (course) => course.readinessScore >= 85,
    ).length;
    const atRiskCourse = [...courseReports].sort(
      (a, b) => a.readinessScore - b.readinessScore,
    )[0];

    return {
      title: 'Course Launch Readiness',
      summary:
        readyCourses === courseReports.length
          ? 'Every course has the core launch ingredients in place. You are in strong shape to publish confidently.'
          : 'This analyzer checks if each course is actually launch-ready, not just created. Use it to fix weak spots before students feel them.',
      averageScore: Math.round(
        courseReports.reduce((sum, course) => sum + course.readinessScore, 0) /
          courseReports.length,
      ),
      readyCourses,
      highestReadiness,
      lowestReadiness,
      atRiskCourse,
      courseReports,
    };
  }

  private getSeedCatalog(query?: { q?: string; category?: string }) {
    const q = query?.q?.trim().toLowerCase();
    const category = query?.category?.trim().toLowerCase();
    const seedCourses = getSeedCourses();
    const courses = seedCourses.filter((course) => {
      const categoryMatch =
        !category ||
        category === 'all' ||
        course.category.toLowerCase() === category;
      const queryMatch =
        !q ||
        course.courseTitle.toLowerCase().includes(q) ||
        course.shortDescription.toLowerCase().includes(q) ||
        course.category.toLowerCase().includes(q);

      return categoryMatch && queryMatch;
    });

    return {
      categories: [
        'All',
        ...new Set(seedCourses.map((course) => course.category)),
      ],
      resultsCount: courses.length,
      courses,
    };
  }

  private getSeedLearnerOverview(studentId = 'student_1') {
    const users = getSeedUsers();
    const courses = getSeedCourses();
    const enrollments = getEnrollments();
    const student =
      users.find((user) => user._id === studentId && user.role === 'student') ??
      users.find((user) => user.role === 'student');

    if (!student) {
      return {
        learner: null,
        metrics: {
          activeCourses: 0,
          averageProgress: 0,
          hoursRemaining: '0h 0m',
        },
        studySprint: null,
        enrolledCourses: [],
      };
    }

    const enrolledCourses = enrollments
      .filter((enrollment) => enrollment.studentId === student._id)
      .map((enrollment) => {
        const course = courses.find((item) => item._id === enrollment.courseId);
        if (!course) {
          return null;
        }

        return {
          ...course,
          progressPercent: enrollment.progressPercent,
          purchaseDate: enrollment.purchaseDate,
          lastLesson: enrollment.lastLesson,
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));

    const averageProgress =
      enrolledCourses.length === 0
        ? 0
        : Math.round(
            enrolledCourses.reduce(
              (sum, course) => sum + course.progressPercent,
              0,
            ) / enrolledCourses.length,
          );

    return {
      learner: this.toPublicUser(student),
      metrics: {
        activeCourses: enrolledCourses.length,
        averageProgress,
        hoursRemaining: this.getHoursRemaining(enrolledCourses),
      },
      studySprint: this.buildStudySprint(enrolledCourses),
      enrolledCourses,
    };
  }

  private getSeedEducatorDashboard(educatorId = 'educator_1') {
    const users = getSeedUsers();
    const courses = getSeedCourses();
    const enrollments = getEnrollments();
    const educator =
      users.find(
        (user) => user._id === educatorId && user.role === 'teacher',
      ) ?? users.find((user) => user.role === 'teacher');

    if (!educator) {
      return {
        educator: null,
        metrics: {
          totalEarnings: 0,
          totalCourses: 0,
          totalStudents: 0,
        },
        launchReadiness: null,
        recentEnrollments: [],
        topCourses: [],
      };
    }

    const educatorCourses = courses.filter(
      (course) => course.educatorId === educator._id,
    );
    const recentEnrollments = enrollments
      .map((enrollment) => {
        const student = users.find((user) => user._id === enrollment.studentId);
        const course = educatorCourses.find(
          (item) => item._id === enrollment.courseId,
        );
        if (!student || !course) {
          return null;
        }

        return {
          courseId: course._id,
          courseTitle: course.courseTitle,
          purchaseDate: enrollment.purchaseDate,
          student: {
            _id: student._id,
            name: student.name,
            imageUrl: student.imageUrl,
          },
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .sort((a, b) => +new Date(b.purchaseDate) - +new Date(a.purchaseDate));

    const totalEarnings = educatorCourses.reduce((sum, course) => {
      const enrolledCount = enrollments.filter(
        (enrollment) => enrollment.courseId === course._id,
      ).length;
      return (
        sum + enrolledCount * course.coursePrice * (1 - course.discount / 100)
      );
    }, 0);

    return {
      educator: this.toPublicUser(educator),
      metrics: {
        totalEarnings: Number(totalEarnings.toFixed(2)),
        totalCourses: educatorCourses.length,
        totalStudents: new Set(
          recentEnrollments.map((entry) => entry.student._id),
        ).size,
      },
      launchReadiness: this.buildLaunchReadiness(educatorCourses),
      recentEnrollments,
      topCourses: educatorCourses.map((course) => ({
        _id: course._id,
        title: course.courseTitle,
        enrollments: enrollments.filter(
          (enrollment) => enrollment.courseId === course._id,
        ).length,
        rating: this.getCourseAverageRating(course.courseRatings),
        revenue: Number(
          (
            enrollments.filter(
              (enrollment) => enrollment.courseId === course._id,
            ).length *
            course.coursePrice *
            (1 - course.discount / 100)
          ).toFixed(2),
        ),
      })),
    };
  }

  private buildStudySprint(
    enrolledCourses: Array<{
      _id: string;
      courseTitle: string;
      category?: string;
      progressPercent?: number;
      durationLabel?: string;
      lessonsCount?: number;
      lastLesson?: string;
      courseContent?: Array<{
        chapterContent?: Array<{
          lectureTitle: string;
        }>;
      }>;
    }>,
  ) {
    if (enrolledCourses.length === 0) {
      return null;
    }

    const sortedByProgress = [...enrolledCourses].sort(
      (a, b) => (b.progressPercent ?? 0) - (a.progressPercent ?? 0),
    );
    const quickWinCourse = sortedByProgress.find(
      (course) => (course.progressPercent ?? 0) < 100,
    );
    const catchUpCourse = [...enrolledCourses].sort(
      (a, b) => (a.progressPercent ?? 0) - (b.progressPercent ?? 0),
    )[0];
    const focusCourse = [...enrolledCourses].sort((a, b) => {
      const scoreA = this.getUrgencyScore(
        a.progressPercent ?? 0,
        a.lessonsCount ?? 0,
      );
      const scoreB = this.getUrgencyScore(
        b.progressPercent ?? 0,
        b.lessonsCount ?? 0,
      );
      return scoreB - scoreA;
    })[0];

    const nextLesson = this.getNextLessonTitle(focusCourse);
    const averageProgress = Math.round(
      enrolledCourses.reduce(
        (sum, course) => sum + (course.progressPercent ?? 0),
        0,
      ) / enrolledCourses.length,
    );

    return {
      title: 'Adaptive Focus Sprint',
      summary:
        averageProgress >= 70
          ? 'You are close to converting effort into completions. Push one quick win and one catch-up block this week.'
          : 'Your learning load is still healthy. A small focused sprint now will create visible progress across the board.',
      momentumScore: Math.min(
        98,
        Math.max(
          42,
          Math.round(
            averageProgress * 0.7 +
              enrolledCourses.length * 6 +
              (nextLesson ? 8 : 0),
          ),
        ),
      ),
      recommendedMinutes: Math.max(
        45,
        Math.min(180, enrolledCourses.length * 35),
      ),
      focusCourse: focusCourse
        ? {
            courseId: focusCourse._id,
            courseTitle: focusCourse.courseTitle,
            progressPercent: focusCourse.progressPercent ?? 0,
            reason:
              (focusCourse.progressPercent ?? 0) < 35
                ? 'This course needs attention before the material feels cold.'
                : 'This course is in the ideal zone for a focused push toward completion.',
            nextLesson,
          }
        : null,
      quickWinCourse: quickWinCourse
        ? {
            courseId: quickWinCourse._id,
            courseTitle: quickWinCourse.courseTitle,
            progressPercent: quickWinCourse.progressPercent ?? 0,
            reason:
              'You already have momentum here, so one short session should create a visible result.',
          }
        : null,
      catchUpCourse: catchUpCourse
        ? {
            courseId: catchUpCourse._id,
            courseTitle: catchUpCourse.courseTitle,
            progressPercent: catchUpCourse.progressPercent ?? 0,
            reason:
              'This is the course most likely to slip if it does not get a short review block soon.',
          }
        : null,
      actionChecklist: [
        `Spend 15 minutes restarting ${focusCourse?.courseTitle ?? 'your focus course'}.`,
        nextLesson
          ? `Resume with "${nextLesson}" to remove restart friction.`
          : `Open the next available lesson and finish one concrete section.`,
        `Close the sprint with a quick win inside ${quickWinCourse?.courseTitle ?? 'your strongest course'}.`,
      ],
    };
  }

  private getUrgencyScore(progressPercent: number, lessonsCount: number) {
    const progressGap = 100 - progressPercent;
    const lessonWeight = Math.min(20, lessonsCount);
    const plateauPenalty =
      progressPercent >= 35 && progressPercent <= 80 ? 18 : 0;
    return progressGap + lessonWeight + plateauPenalty;
  }

  private getNextLessonTitle(course: {
    progressPercent?: number;
    courseContent?: Array<{
      chapterContent?: Array<{
        lectureTitle: string;
      }>;
    }>;
  }) {
    const lessons =
      course.courseContent?.flatMap(
        (chapter) => chapter.chapterContent ?? [],
      ) ?? [];

    if (lessons.length === 0) {
      return null;
    }

    const currentIndex = Math.floor(
      ((course.progressPercent ?? 0) / 100) * lessons.length,
    );

    return (
      lessons[Math.min(currentIndex, lessons.length - 1)]?.lectureTitle ?? null
    );
  }

  private toPublicUser(user: User & { password?: string }) {
    const safeUser = { ...user, password: undefined };
    return safeUser;
  }

  private toEnrollmentDocument(enrollment: EnrollmentRecord): Enrollment {
    return {
      _id: `${enrollment.studentId}_${enrollment.courseId}`,
      ...enrollment,
    };
  }

  private escapeRegex(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
