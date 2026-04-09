export type AssetKey =
  | 'course_1_thumbnail'
  | 'course_2_thumbnail'
  | 'course_3_thumbnail'
  | 'course_4_thumbnail'
  | 'profile_img_1'
  | 'profile_img_2'
  | 'profile_img_3'
  | 'microsoft_logo'
  | 'walmart_logo'
  | 'accenture_logo'
  | 'adobe_logo'
  | 'paypal_logo'
  | 'play_icon'
  | 'time_clock_icon'
  | 'person_tick_icon';

export type CourseRating = {
  _id: string;
  userId: string;
  rating: number;
};

export type LectureRecord = {
  lectureId: string;
  lectureTitle: string;
  lectureDuration: number;
  lectureUrl: string;
  isPreviewFree: boolean;
  lectureOrder: number;
};

export type ChapterRecord = {
  chapterId: string;
  chapterOrder: number;
  chapterTitle: string;
  chapterContent: LectureRecord[];
};

export type QuizQuestionRecord = {
  questionId: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
};

export type QuizRecord = {
  quizId: string;
  title: string;
  description?: string;
  questions: QuizQuestionRecord[];
};

export type CourseRecord = {
  _id: string;
  category: string;
  level: string;
  courseTitle: string;
  shortDescription: string;
  courseDescription: string;
  coursePrice: number;
  discount: number;
  isPublished: boolean;
  courseContent: ChapterRecord[];
  quizzes: QuizRecord[];
  courseThumbnailKey: AssetKey;
  educatorId: string;
  educatorName: string;
  enrolledStudents: string[];
  courseRatings: CourseRating[];
  durationLabel: string;
  lessonsCount: number;
};

export type UserRecord = {
  _id: string;
  name: string;
  email: string;
  mobileNumber?: string;
  age?: number;
  interests?: string[];
  ongoingCourses?: string[];
  timeNeeded?: string;
  password: string;
  imageUrl: string;
  role: 'student' | 'teacher' | 'admin';
  headline?: string;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
};

export type TestimonialRecord = {
  name: string;
  role: string;
  imageKey: AssetKey;
  rating: number;
  feedback: string;
};

export type EnrollmentRecord = {
  studentId: string;
  courseId: string;
  progressPercent: number;
  purchaseDate: string;
  lastLesson: string;
};

const users: UserRecord[] = [
  {
    _id: 'educator_1',
    name: 'GreatStack',
    email: 'educator@greatstack.dev',
    mobileNumber: '+15550001001',
    age: 34,
    interests: ['Curriculum Design', 'React', 'Teaching'],
    ongoingCourses: ['Advanced Python Programming', 'Web Development Bootcamp'],
    timeNeeded: '8h per week',
    password: 'teacher123',
    imageUrl:
      'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=400&q=80',
    role: 'teacher',
    headline: 'Senior web educator and curriculum designer',
    twoFactorEnabled: false,
  },
  {
    _id: 'student_1',
    name: 'Donald Jackman',
    email: 'donald@example.com',
    mobileNumber: '+15550001011',
    age: 27,
    interests: ['Frontend', 'JavaScript', 'Productivity'],
    ongoingCourses: [
      'Introduction to JavaScript',
      'Advanced Python Programming',
      'Data Science with Python',
      'Web Development Bootcamp',
    ],
    timeNeeded: '12h 30m remaining',
    password: 'student123',
    imageUrl:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    role: 'student',
    headline: 'Frontend engineer',
    twoFactorEnabled: false,
  },
  {
    _id: 'student_2',
    name: 'Richard Nelson',
    email: 'richard@example.com',
    mobileNumber: '+15550001012',
    age: 29,
    interests: ['Design Systems', 'UI', 'Research'],
    ongoingCourses: ['Web Development Bootcamp'],
    timeNeeded: '6h per week',
    password: 'student123',
    imageUrl:
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
    role: 'student',
    headline: 'Product designer',
    twoFactorEnabled: false,
  },
  {
    _id: 'student_3',
    name: 'James Washington',
    email: 'james@example.com',
    mobileNumber: '+15550001013',
    age: 31,
    interests: ['Analytics', 'Python', 'Dashboards'],
    ongoingCourses: ['Introduction to JavaScript'],
    timeNeeded: '5h per week',
    password: 'student123',
    imageUrl:
      'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=400&q=80',
    role: 'student',
    headline: 'Data analyst',
    twoFactorEnabled: false,
  },
];

const courses: CourseRecord[] = [
  {
    _id: 'course_js_foundations',
    category: 'Development',
    level: 'Beginner',
    courseTitle: 'Introduction to JavaScript',
    shortDescription:
      'Build confidence with modern JavaScript fundamentals, DOM updates, and async patterns.',
    courseDescription:
      '<h2>Master modern JavaScript fundamentals</h2><p>This course takes you from syntax basics to practical browser interactivity with clear, project-based lessons.</p><ul><li>Understand variables, functions, arrays, and objects</li><li>Practice DOM manipulation and event handling</li><li>Ship mini projects that reinforce every core concept</li></ul>',
    coursePrice: 49.99,
    discount: 20,
    isPublished: true,
    courseThumbnailKey: 'course_1_thumbnail',
    educatorId: 'educator_1',
    educatorName: 'GreatStack',
    enrolledStudents: ['student_1', 'student_2', 'student_3'],
    courseRatings: [
      { _id: 'rating_1', userId: 'student_1', rating: 4.9 },
      { _id: 'rating_2', userId: 'student_2', rating: 4.8 },
      { _id: 'rating_3', userId: 'student_3', rating: 5 },
    ],
    durationLabel: '7h 20m',
    lessonsCount: 8,
    courseContent: [
      {
        chapterId: 'js_ch_1',
        chapterOrder: 1,
        chapterTitle: 'JavaScript essentials',
        chapterContent: [
          {
            lectureId: 'js_l_1',
            lectureTitle: 'What JavaScript powers on the web',
            lectureDuration: 18,
            lectureUrl: 'https://youtu.be/CBWnBi-awSA',
            isPreviewFree: true,
            lectureOrder: 1,
          },
          {
            lectureId: 'js_l_2',
            lectureTitle: 'Variables, values, and data types',
            lectureDuration: 32,
            lectureUrl: 'https://youtu.be/pZQeBJsGoDQ',
            isPreviewFree: false,
            lectureOrder: 2,
          },
        ],
      },
      {
        chapterId: 'js_ch_2',
        chapterOrder: 2,
        chapterTitle: 'Interactive browser workflows',
        chapterContent: [
          {
            lectureId: 'js_l_3',
            lectureTitle: 'Events and DOM updates',
            lectureDuration: 41,
            lectureUrl: 'https://youtu.be/W6NZfCO5SIk',
            isPreviewFree: true,
            lectureOrder: 1,
          },
          {
            lectureId: 'js_l_4',
            lectureTitle: 'Fetching API data and rendering state',
            lectureDuration: 47,
            lectureUrl: 'https://youtu.be/Oive66jrwBs',
            isPreviewFree: false,
            lectureOrder: 2,
          },
        ],
      },
    ],
    quizzes: [
      {
        quizId: 'quiz_js_basics',
        title: 'JavaScript Basics Check',
        description: 'Test core syntax and concepts from the first module.',
        questions: [
          {
            questionId: 'q_js_1',
            question: 'Which keyword declares a block-scoped variable?',
            options: ['var', 'let', 'def', 'const'],
            correctOptionIndex: 1,
          },
          {
            questionId: 'q_js_2',
            question: 'Which value is NOT a JavaScript primitive?',
            options: ['string', 'number', 'object', 'boolean'],
            correctOptionIndex: 2,
          },
          {
            questionId: 'q_js_3',
            question: 'What method converts a JSON string into an object?',
            options: ['JSON.parse', 'JSON.stringify', 'Object.parse', 'JSON.toObject'],
            correctOptionIndex: 0,
          },
        ],
      },
    ],
  },
  {
    _id: 'course_python_advanced',
    category: 'Data',
    level: 'Intermediate',
    courseTitle: 'Advanced Python Programming',
    shortDescription:
      'Sharpen your Python fluency with automation, data handling, and production-ready patterns.',
    courseDescription:
      '<h2>Advance your Python toolkit</h2><p>Go beyond the basics with reusable modules, cleaner abstractions, and problem-solving workflows used in real teams.</p><ul><li>Structure larger Python projects confidently</li><li>Use iterators, comprehensions, and error handling effectively</li><li>Automate repetitive work with scripts and utilities</li></ul>',
    coursePrice: 69.99,
    discount: 25,
    isPublished: true,
    courseThumbnailKey: 'course_2_thumbnail',
    educatorId: 'educator_1',
    educatorName: 'GreatStack',
    enrolledStudents: ['student_1', 'student_3'],
    courseRatings: [
      { _id: 'rating_4', userId: 'student_1', rating: 4.7 },
      { _id: 'rating_5', userId: 'student_3', rating: 4.8 },
    ],
    durationLabel: '9h 10m',
    lessonsCount: 10,
    courseContent: [
      {
        chapterId: 'py_ch_1',
        chapterOrder: 1,
        chapterTitle: 'Writing cleaner Python',
        chapterContent: [
          {
            lectureId: 'py_l_1',
            lectureTitle: 'Readable architecture for growing scripts',
            lectureDuration: 28,
            lectureUrl: 'https://youtu.be/rfscVS0vtbw',
            isPreviewFree: true,
            lectureOrder: 1,
          },
          {
            lectureId: 'py_l_2',
            lectureTitle: 'Iterables, generators, and performance',
            lectureDuration: 39,
            lectureUrl: 'https://youtu.be/bD05uGo_sVI',
            isPreviewFree: false,
            lectureOrder: 2,
          },
        ],
      },
      {
        chapterId: 'py_ch_2',
        chapterOrder: 2,
        chapterTitle: 'Automation and APIs',
        chapterContent: [
          {
            lectureId: 'py_l_3',
            lectureTitle: 'Automating file and data workflows',
            lectureDuration: 52,
            lectureUrl: 'https://youtu.be/q5uM4VKywbA',
            isPreviewFree: false,
            lectureOrder: 1,
          },
          {
            lectureId: 'py_l_4',
            lectureTitle: 'Calling external services with Python',
            lectureDuration: 44,
            lectureUrl: 'https://youtu.be/tb8gHvYlCFs',
            isPreviewFree: true,
            lectureOrder: 2,
          },
        ],
      },
    ],
    quizzes: [
      {
        quizId: 'quiz_py_advanced',
        title: 'Advanced Python Quiz',
        description: 'Check your understanding of advanced Python patterns.',
        questions: [
          {
            questionId: 'q_py_1',
            question: 'Which feature allows a function to yield multiple values over time?',
            options: ['Decorator', 'Generator', 'Context manager', 'Comprehension'],
            correctOptionIndex: 1,
          },
          {
            questionId: 'q_py_2',
            question: 'What keyword is used to create a context manager?',
            options: ['with', 'using', 'context', 'manage'],
            correctOptionIndex: 0,
          },
          {
            questionId: 'q_py_3',
            question: 'Which data structure stores unique values?',
            options: ['list', 'tuple', 'set', 'dict'],
            correctOptionIndex: 2,
          },
        ],
      },
    ],
  },
  {
    _id: 'course_web_bootcamp',
    category: 'Development',
    level: 'Beginner',
    courseTitle: 'Web Development Bootcamp',
    shortDescription:
      'A practical front-to-back path through HTML, CSS, responsive layouts, and modern app basics.',
    courseDescription:
      '<h2>Launch your web development career</h2><p>This bootcamp gives you a guided path through the building blocks of great web experiences and deployable apps.</p><ul><li>Create responsive layouts from scratch</li><li>Understand frontend and backend responsibilities clearly</li><li>Build polished portfolio-ready mini projects</li></ul>',
    coursePrice: 89.99,
    discount: 30,
    isPublished: true,
    courseThumbnailKey: 'course_3_thumbnail',
    educatorId: 'educator_1',
    educatorName: 'GreatStack',
    enrolledStudents: ['student_1', 'student_2', 'student_3'],
    courseRatings: [
      { _id: 'rating_6', userId: 'student_2', rating: 4.6 },
      { _id: 'rating_7', userId: 'student_3', rating: 4.9 },
    ],
    durationLabel: '11h 05m',
    lessonsCount: 12,
    courseContent: [
      {
        chapterId: 'wd_ch_1',
        chapterOrder: 1,
        chapterTitle: 'Responsive interfaces',
        chapterContent: [
          {
            lectureId: 'wd_l_1',
            lectureTitle: 'Structuring semantic HTML',
            lectureDuration: 24,
            lectureUrl: 'https://youtu.be/UB1O30fR-EE',
            isPreviewFree: true,
            lectureOrder: 1,
          },
          {
            lectureId: 'wd_l_2',
            lectureTitle: 'Modern CSS layout systems',
            lectureDuration: 46,
            lectureUrl: 'https://youtu.be/JJSoEo8JSnc',
            isPreviewFree: false,
            lectureOrder: 2,
          },
        ],
      },
      {
        chapterId: 'wd_ch_2',
        chapterOrder: 2,
        chapterTitle: 'Application foundations',
        chapterContent: [
          {
            lectureId: 'wd_l_3',
            lectureTitle: 'Routing and page state patterns',
            lectureDuration: 34,
            lectureUrl: 'https://youtu.be/Sklc_fQBmcs',
            isPreviewFree: false,
            lectureOrder: 1,
          },
          {
            lectureId: 'wd_l_4',
            lectureTitle: 'Working with APIs and forms',
            lectureDuration: 38,
            lectureUrl: 'https://youtu.be/0ik6X4DJKCc',
            isPreviewFree: true,
            lectureOrder: 2,
          },
        ],
      },
    ],
    quizzes: [
      {
        quizId: 'quiz_web_core',
        title: 'Web Bootcamp Core Quiz',
        description: 'Validate core HTML, CSS, and routing concepts.',
        questions: [
          {
            questionId: 'q_web_1',
            question: 'Which CSS layout module is best for 2D layouts?',
            options: ['Flexbox', 'Grid', 'Float', 'Position'],
            correctOptionIndex: 1,
          },
          {
            questionId: 'q_web_2',
            question: 'Which HTML element defines a navigation section?',
            options: ['<section>', '<nav>', '<aside>', '<header>'],
            correctOptionIndex: 1,
          },
          {
            questionId: 'q_web_3',
            question: 'Which HTTP method is typically used for updates?',
            options: ['GET', 'POST', 'PATCH', 'HEAD'],
            correctOptionIndex: 2,
          },
        ],
      },
    ],
  },
  {
    _id: 'course_data_science',
    category: 'Data',
    level: 'Intermediate',
    courseTitle: 'Data Science with Python',
    shortDescription:
      'Explore notebooks, data cleaning, and visualization workflows that make analysis actionable.',
    courseDescription:
      '<h2>From raw data to clear insight</h2><p>Learn how to prepare datasets, discover patterns, and present findings with confidence using Python tooling.</p><ul><li>Use notebooks and data frames effectively</li><li>Clean and prepare real-world datasets</li><li>Tell better stories with charts and summaries</li></ul>',
    coursePrice: 79.99,
    discount: 15,
    isPublished: true,
    courseThumbnailKey: 'course_4_thumbnail',
    educatorId: 'educator_1',
    educatorName: 'GreatStack',
    enrolledStudents: ['student_1'],
    courseRatings: [{ _id: 'rating_8', userId: 'student_1', rating: 4.9 }],
    durationLabel: '8h 40m',
    lessonsCount: 9,
    courseContent: [
      {
        chapterId: 'ds_ch_1',
        chapterOrder: 1,
        chapterTitle: 'Preparing useful datasets',
        chapterContent: [
          {
            lectureId: 'ds_l_1',
            lectureTitle: 'Pandas essentials for analysis',
            lectureDuration: 33,
            lectureUrl: 'https://youtu.be/vmEHCJofslg',
            isPreviewFree: true,
            lectureOrder: 1,
          },
          {
            lectureId: 'ds_l_2',
            lectureTitle: 'Cleaning and reshaping data',
            lectureDuration: 49,
            lectureUrl: 'https://youtu.be/KdmPHEnPJPs',
            isPreviewFree: false,
            lectureOrder: 2,
          },
        ],
      },
      {
        chapterId: 'ds_ch_2',
        chapterOrder: 2,
        chapterTitle: 'Explaining insights visually',
        chapterContent: [
          {
            lectureId: 'ds_l_3',
            lectureTitle: 'Visualization patterns that communicate',
            lectureDuration: 36,
            lectureUrl: 'https://youtu.be/6GUZXDef2U0',
            isPreviewFree: false,
            lectureOrder: 1,
          },
          {
            lectureId: 'ds_l_4',
            lectureTitle: 'Sharing analysis with stakeholders',
            lectureDuration: 31,
            lectureUrl: 'https://youtu.be/ua-CiDNNj30',
            isPreviewFree: true,
            lectureOrder: 2,
          },
        ],
      },
    ],
    quizzes: [
      {
        quizId: 'quiz_ds_intro',
        title: 'Data Science Foundations',
        description: 'Check fundamentals of data prep and storytelling.',
        questions: [
          {
            questionId: 'q_ds_1',
            question: 'Which library is most commonly used for data frames in Python?',
            options: ['NumPy', 'Pandas', 'Matplotlib', 'Seaborn'],
            correctOptionIndex: 1,
          },
          {
            questionId: 'q_ds_2',
            question: 'What is the main goal of data cleaning?',
            options: [
              'Increase model accuracy without validation',
              'Remove errors and inconsistencies',
              'Reduce dataset size only',
              'Avoid visualization work',
            ],
            correctOptionIndex: 1,
          },
          {
            questionId: 'q_ds_3',
            question: 'Which chart best shows changes over time?',
            options: ['Bar chart', 'Pie chart', 'Line chart', 'Scatter plot'],
            correctOptionIndex: 2,
          },
        ],
      },
    ],
  },
];

const testimonials: TestimonialRecord[] = [
  {
    name: 'Donald Jackman',
    role: 'Frontend Engineer @ Amazon',
    imageKey: 'profile_img_1',
    rating: 5,
    feedback:
      'The lessons are clear, structured, and practical. I was able to apply what I learned to real work in the same week.',
  },
  {
    name: 'Richard Nelson',
    role: 'Product Designer @ Samsung',
    imageKey: 'profile_img_2',
    rating: 4.5,
    feedback:
      'I loved how approachable the platform felt. The pacing is perfect for busy people who still want meaningful progress.',
  },
  {
    name: 'James Washington',
    role: 'Data Analyst @ Google',
    imageKey: 'profile_img_3',
    rating: 5,
    feedback:
      'The curriculum feels thoughtfully sequenced, and the dashboards make it easy to stay accountable to my learning goals.',
  },
];

const partnerAssetKeys: AssetKey[] = [
  'microsoft_logo',
  'walmart_logo',
  'accenture_logo',
  'adobe_logo',
  'paypal_logo',
];

const featureCards = [
  {
    title: 'Interactive lessons',
    description:
      'Hands-on videos, projects, and guided practice that keep each concept grounded in real outcomes.',
    iconKey: 'play_icon' as const,
  },
  {
    title: 'Flexible schedule',
    description:
      'Move at your own pace across focused learning paths built for people balancing work, study, and life.',
    iconKey: 'time_clock_icon' as const,
  },
  {
    title: 'Expert instructors',
    description:
      'Learn from educators who turn complex topics into approachable, practical lessons you can use quickly.',
    iconKey: 'person_tick_icon' as const,
  },
];

const enrollments: EnrollmentRecord[] = [
  {
    studentId: 'student_1',
    courseId: 'course_js_foundations',
    progressPercent: 64,
    purchaseDate: '2026-02-18T10:30:00.000Z',
    lastLesson: 'Fetching API data and rendering state',
  },
  {
    studentId: 'student_1',
    courseId: 'course_python_advanced',
    progressPercent: 38,
    purchaseDate: '2026-03-02T13:15:00.000Z',
    lastLesson: 'Automation and APIs',
  },
  {
    studentId: 'student_1',
    courseId: 'course_data_science',
    progressPercent: 22,
    purchaseDate: '2026-03-18T08:50:00.000Z',
    lastLesson: 'Pandas essentials for analysis',
  },
  {
    studentId: 'student_1',
    courseId: 'course_web_bootcamp',
    progressPercent: 51,
    purchaseDate: '2026-03-24T11:10:00.000Z',
    lastLesson: 'Routing and page state patterns',
  },
  {
    studentId: 'student_2',
    courseId: 'course_web_bootcamp',
    progressPercent: 55,
    purchaseDate: '2026-03-12T09:45:00.000Z',
    lastLesson: 'Modern CSS layout systems',
  },
  {
    studentId: 'student_3',
    courseId: 'course_js_foundations',
    progressPercent: 84,
    purchaseDate: '2026-03-20T14:25:00.000Z',
    lastLesson: 'Events and DOM updates',
  },
];

export function getSeedCourses(): CourseRecord[] {
  return courses.map((course) => ({
    ...course,
    enrolledStudents: [...course.enrolledStudents],
    courseRatings: course.courseRatings.map((rating) => ({ ...rating })),
    courseContent: course.courseContent.map((chapter) => ({
      ...chapter,
      chapterContent: chapter.chapterContent.map((lecture) => ({ ...lecture })),
    })),
    quizzes: course.quizzes.map((quiz) => ({
      ...quiz,
      questions: quiz.questions.map((question) => ({ ...question })),
    })),
  }));
}

export function getSeedUsers(): UserRecord[] {
  return users.map((user) => ({ ...user }));
}

export function getPartnerAssetKeys(): AssetKey[] {
  return [...partnerAssetKeys];
}

export function getFeatureCards() {
  return featureCards.map((feature) => ({ ...feature }));
}

export function getTestimonials(): TestimonialRecord[] {
  return testimonials.map((testimonial) => ({ ...testimonial }));
}

export function getEnrollments(): EnrollmentRecord[] {
  return enrollments.map((enrollment) => ({ ...enrollment }));
}
