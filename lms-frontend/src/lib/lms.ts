import type { StaticImageData } from "next/image";
import {
  assets,
  dummyCourses,
  dummyDashboardData,
  dummyEducatorData,
  dummyStudentEnrolled,
  dummyTestimonial,
} from "@/assets/assets";

type AssetValue = string | StaticImageData;

const assetMap = assets as unknown as Record<string, AssetValue>;

export type AssetKey = keyof typeof assets;

export type Lecture = {
  lectureId: string;
  lectureTitle: string;
  lectureDuration: number;
  lectureUrl: string;
  isPreviewFree: boolean;
  lectureOrder: number;
};

export type Chapter = {
  chapterId: string;
  chapterOrder: number;
  chapterTitle: string;
  chapterContent: Lecture[];
};

export type CourseRating = {
  userId: string;
  rating: number;
  _id: string;
};

export type CourseQuizQuestion = {
  questionId: string;
  question: string;
  options: string[];
};

export type CourseQuiz = {
  quizId: string;
  title: string;
  description?: string | null;
  questions: CourseQuizQuestion[];
};

export type CourseQuizAttempt = {
  attemptId: string;
  score: number;
  total: number;
  submittedAt: string;
  answers: Array<{
    questionId: string;
    selectedIndex: number;
    correctIndex: number;
    isCorrect: boolean;
  }>;
};

export type Course = {
  _id: string;
  category: string;
  level: string;
  courseTitle: string;
  shortDescription: string;
  courseDescription: string;
  coursePrice: number;
  discount: number;
  isPublished: boolean;
  courseContent: Chapter[];
  courseThumbnail?: string;
  courseThumbnailKey?: AssetKey;
  educatorName: string;
  educatorId?: string;
  enrolledStudents?: string[];
  courseRatings?: CourseRating[];
  quizzes?: CourseQuiz[];
  durationLabel?: string;
  lessonsCount?: number;
  progressPercent?: number;
  purchaseDate?: string;
  lastLesson?: string;
};

export type HomePageData = {
  hero: {
    eyebrow: string;
    title: string;
    description: string;
    primaryCta: { label: string; href: string };
    secondaryCta: { label: string; href: string };
    featuredCourseId: string | null;
  };
  partners: AssetKey[];
  features: { title: string; description: string; iconKey: AssetKey }[];
  featuredCourses: Course[];
  testimonials: {
    name: string;
    role: string;
    imageKey?: AssetKey;
    rating: number;
    feedback: string;
  }[];
  stats: {
    totalCourses: number;
    totalStudents: number;
    averageRating: number;
  };
};

export type CatalogResponse = {
  categories: string[];
  resultsCount: number;
  courses: Course[];
};

export type LearnerOverview = {
  learner: {
    _id: string;
    name: string;
    email: string;
    mobileNumber?: string;
    imageUrl: string;
    role: string;
    headline?: string;
  };
  metrics: {
    activeCourses: number;
    averageProgress: number;
    hoursRemaining: string;
  };
  studySprint: {
    title: string;
    summary: string;
    momentumScore: number;
    recommendedMinutes: number;
    focusCourse: {
      courseId: string;
      courseTitle: string;
      progressPercent: number;
      reason: string;
      nextLesson: string | null;
    } | null;
    quickWinCourse: {
      courseId: string;
      courseTitle: string;
      progressPercent: number;
      reason: string;
    } | null;
    catchUpCourse: {
      courseId: string;
      courseTitle: string;
      progressPercent: number;
      reason: string;
    } | null;
    actionChecklist: string[];
  } | null;
  enrolledCourses: Course[];
};

export type PublicUser = {
  _id: string;
  name: string;
  email: string;
  mobileNumber?: string;
  age?: number;
  interests?: string[];
  ongoingCourses?: string[];
  timeNeeded?: string;
  imageUrl: string;
  role: "student" | "teacher" | "admin";
  headline?: string;
};

export type EducatorDashboard = {
  educator: {
    _id: string;
    name: string;
    email: string;
    mobileNumber?: string;
    imageUrl: string;
    role: string;
    headline?: string;
  };
  metrics: {
    totalEarnings: number;
    totalCourses: number;
    totalStudents: number;
  };
  launchReadiness: {
    title: string;
    summary: string;
    averageScore: number;
    readyCourses: number;
    highestReadiness: number;
    lowestReadiness: number;
    atRiskCourse: {
      courseId: string;
      courseTitle: string;
      readinessScore: number;
      status: "ready" | "almost-ready" | "needs-work";
      blockers: string[];
      publishedState: "published" | "draft";
    };
    courseReports: {
      courseId: string;
      courseTitle: string;
      readinessScore: number;
      status: "ready" | "almost-ready" | "needs-work";
      blockers: string[];
      publishedState: "published" | "draft";
    }[];
  } | null;
  recentEnrollments: {
    courseId: string;
    courseTitle: string;
    purchaseDate: string;
    student: {
      _id: string;
      name: string;
      imageUrl: string;
    };
  }[];
  topCourses: {
    _id: string;
    title: string;
    enrollments: number;
    rating: number;
    revenue: number;
  }[];
};

export type UserNotification = {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: "signup" | "login" | "enrollment" | "system";
  isRead: boolean;
  createdAtLabel?: string;
  createdAt?: string;
};

type DummyCourse = {
  _id: string;
  courseTitle: string;
  courseDescription: string;
  coursePrice: number;
  discount: number;
  isPublished: boolean;
  courseContent: Chapter[];
  courseThumbnail: string;
  enrolledStudents?: string[];
  courseRatings?: CourseRating[];
};

function stripHtml(input: string) {
  return input.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function buildFallbackCourses(): Course[] {
  const categories = ["Development", "Data", "Development", "Data"];
  const levels = ["Beginner", "Intermediate", "Beginner", "Intermediate"];
  const thumbnailKeys = [
    "course_1_thumbnail",
    "course_2_thumbnail",
    "course_3_thumbnail",
    "course_4_thumbnail",
  ] as const;
  const durationLabels = ["7h 20m", "9h 10m", "11h 05m", "8h 40m"];

  return (dummyCourses as DummyCourse[]).slice(0, 4).map((course, index) => ({
    ...course,
    category: categories[index] ?? "General",
    level: levels[index] ?? "Beginner",
    shortDescription: `${stripHtml(course.courseDescription).slice(0, 110)}...`,
    educatorName: "GreatStack",
    durationLabel: durationLabels[index] ?? "4h 00m",
    lessonsCount:
      course.courseContent?.reduce((sum, chapter) => sum + chapter.chapterContent.length, 0) ?? 0,
    courseThumbnailKey: thumbnailKeys[index] ?? "course_1_thumbnail",
  }));
}

export const fallbackCourses = buildFallbackCourses();

export const fallbackCatalog: CatalogResponse = {
  categories: ["All", ...new Set(fallbackCourses.map((course) => course.category))],
  resultsCount: fallbackCourses.length,
  courses: fallbackCourses,
};

export const fallbackHomePageData: HomePageData = {
  hero: {
    eyebrow: "Build skills that matter",
    title: "Learn anytime, anywhere with GreatStack LMS.",
    description:
      "Access curated courses, live lectures, and real-world projects designed for modern learners. Whether you are starting your first job or upskilling for a promotion, GreatStack helps you grow.",
    primaryCta: { label: "Browse courses", href: "/courses" },
    secondaryCta: { label: "My learning path", href: "/my-courses" },
    featuredCourseId: fallbackCourses[0]?._id ?? null,
  },
  partners: [
    "microsoft_logo",
    "walmart_logo",
    "accenture_logo",
    "adobe_logo",
    "paypal_logo",
  ],
  features: [
    {
      title: "Interactive lessons",
      description: "Hands-on learning with video, quizzes, and guided projects so every concept sticks.",
      iconKey: "play_icon",
    },
    {
      title: "Flexible schedule",
      description: "Learn at your own pace on desktop or mobile, with progress saved across devices.",
      iconKey: "time_clock_icon",
    },
    {
      title: "Expert instructors",
      description: "Study with experienced educators who make advanced topics easy to understand.",
      iconKey: "person_tick_icon",
    },
  ],
  featuredCourses: fallbackCourses,
  testimonials: dummyTestimonial.map((item, index) => ({
    name: item.name,
    role: item.role,
    imageKey: (["profile_img_1", "profile_img_2", "profile_img_3"][index] ??
      "profile_img_1") as AssetKey,
    rating: item.rating,
    feedback: item.feedback,
  })),
  stats: {
    totalCourses: fallbackCourses.length,
    totalStudents: 1240,
    averageRating: 4.8,
  },
};

export const fallbackLearnerOverview: LearnerOverview = {
  learner: {
    _id: "student_1",
    name: "Donald Jackman",
    email: "donald@example.com",
    mobileNumber: "+15550001011",
    imageUrl: resolveAsset("profile_img_1"),
    role: "student",
    headline: "Frontend engineer",
  },
  metrics: {
    activeCourses: 3,
    averageProgress: 41,
    hoursRemaining: "12h 30m",
  },
  studySprint: {
    title: "Adaptive Focus Sprint",
    summary:
      "Your learning load is still healthy. A short structured sprint will turn existing progress into visible momentum this week.",
    momentumScore: 74,
    recommendedMinutes: 105,
    focusCourse: {
      courseId: fallbackCourses[1]?._id ?? "course_python_advanced",
      courseTitle: fallbackCourses[1]?.courseTitle ?? "Advanced Python Programming",
      progressPercent: 38,
      reason:
        "This course is in the ideal middle zone where another session should create a clear jump in progress.",
      nextLesson: "Automation and APIs",
    },
    quickWinCourse: {
      courseId: fallbackCourses[0]?._id ?? "course_js_foundations",
      courseTitle: fallbackCourses[0]?.courseTitle ?? "Introduction to JavaScript",
      progressPercent: 64,
      reason:
        "You already have momentum here, so it is the easiest place to earn a fast result.",
    },
    catchUpCourse: {
      courseId: fallbackCourses[2]?._id ?? "course_web_bootcamp",
      courseTitle: fallbackCourses[2]?.courseTitle ?? "Web Development Bootcamp",
      progressPercent: 22,
      reason:
        "This course is most likely to go cold if you do not touch it again soon.",
    },
    actionChecklist: [
      "Spend 15 minutes restarting Advanced Python Programming.",
      'Resume with "Automation and APIs" to remove restart friction.',
      "Close the sprint with a quick win inside Introduction to JavaScript.",
    ],
  },
  enrolledCourses: fallbackCourses.slice(0, 4).map((course, index) => ({
    ...course,
    progressPercent: [64, 38, 22, 51][index] ?? 0,
    purchaseDate: ["2026-02-18", "2026-03-02", "2026-03-18", "2026-03-24"][index] ?? "2026-03-24",
    lastLesson: [
      "Fetching API data and rendering state",
      "Automation and APIs",
      "Pandas essentials for analysis",
      "Routing and page state patterns",
    ][index],
  })),
};

export const fallbackEducatorDashboard: EducatorDashboard = {
  educator: {
    _id: dummyEducatorData._id,
    name: dummyEducatorData.name,
    email: dummyEducatorData.email,
    mobileNumber: "+15550001001",
    imageUrl: resolveAsset("profile_img"),
    role: "educator",
    headline: "Senior web educator and curriculum designer",
  },
  metrics: {
    totalEarnings: dummyDashboardData.totalEarnings,
    totalCourses: dummyDashboardData.totalCourses,
    totalStudents: 5,
  },
  launchReadiness: {
    title: "Course Launch Readiness",
    summary:
      "This analyzer checks if each course is truly ready to launch, so you can fix weak spots before learners hit them.",
    averageScore: 78,
    readyCourses: 2,
    highestReadiness: 94,
    lowestReadiness: 58,
    atRiskCourse: {
      courseId: fallbackCourses[3]?._id ?? "course_data_science",
      courseTitle: fallbackCourses[3]?.courseTitle ?? "Data Science with Python",
      readinessScore: 58,
      status: "needs-work",
      blockers: ["Add a course thumbnail", "Mark one lesson as a free preview"],
      publishedState: "draft",
    },
    courseReports: fallbackCourses.map((course, index) => ({
      courseId: course._id,
      courseTitle: course.courseTitle,
      readinessScore: [94, 82, 77, 58][index] ?? 70,
      status: (["ready", "almost-ready", "almost-ready", "needs-work"][index] ??
        "almost-ready") as "ready" | "almost-ready" | "needs-work",
      blockers:
        [
          [],
          ["Attach video URLs to every lesson"],
          ["Add at least 3 lessons"],
          ["Add a course thumbnail", "Mark one lesson as a free preview"],
        ][index] ?? [],
      publishedState: (["published", "published", "draft", "draft"][index] ??
        "draft") as "published" | "draft",
    })),
  },
  recentEnrollments: dummyStudentEnrolled.map((entry, index) => ({
    courseId: `course_${index + 1}`,
    courseTitle: entry.courseTitle,
    purchaseDate: entry.purchaseDate,
    student: entry.student,
  })),
  topCourses: fallbackCourses.map((course, index) => ({
    _id: course._id,
    title: course.courseTitle,
    enrollments: [64, 42, 38, 26][index] ?? 12,
    rating: getAverageRating(course),
    revenue: [2199, 1710, 2490, 1280][index] ?? 0,
  })),
};

export function resolveAsset(key?: string, fallback?: string) {
  const sanitizedFallback = fallback?.trim();

  if (key && key in assetMap) {
    const value = assetMap[key];
    return typeof value === "string" ? value : value.src;
  }

  if (sanitizedFallback) {
    return sanitizedFallback;
  }

  const defaultAsset = assetMap.course_1_thumbnail;
  return typeof defaultAsset === "string" ? defaultAsset : defaultAsset.src;
}

export function getAverageRating(course: Pick<Course, "courseRatings">) {
  const ratings = course.courseRatings ?? [];
  if (ratings.length === 0) {
    return 4.8;
  }

  return Number(
    (ratings.reduce((sum, item) => sum + item.rating, 0) / ratings.length).toFixed(1),
  );
}

export function formatDurationMins(mins: number) {
  if (!Number.isFinite(mins)) return "";
  if (mins < 60) return `${Math.max(0, Math.round(mins))} min`;
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function getTotalLessons(course: Course) {
  if (typeof course.lessonsCount === "number" && course.lessonsCount > 0) {
    return course.lessonsCount;
  }

  return course.courseContent.reduce((acc, chapter) => acc + chapter.chapterContent.length, 0);
}

export function getFirstLecture(course: Course) {
  const chapter = [...course.courseContent].sort(
    (a, b) => a.chapterOrder - b.chapterOrder,
  )[0];
  const lecture = chapter?.chapterContent
    ?.slice()
    .sort((a, b) => a.lectureOrder - b.lectureOrder)[0];
  return lecture ? { chapter, lecture } : null;
}

export function getCourseByIdFromFallback(id: string) {
  return fallbackCourses.find((course) => course._id === id);
}
