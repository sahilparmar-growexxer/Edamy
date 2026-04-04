import {
  CatalogResponse,
  Course,
  EducatorDashboard,
  HomePageData,
  LearnerOverview,
  PublicUser,
  UserNotification,
  fallbackCatalog,
  fallbackEducatorDashboard,
  fallbackHomePageData,
  fallbackLearnerOverview,
  getCourseByIdFromFallback,
} from "@/lib/lms";

const API_BASE_URL =
  (typeof window === "undefined"
    ? process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL
    : process.env.NEXT_PUBLIC_API_BASE_URL) ?? "http://localhost:5001";

type AuthPayload = {
  email: string;
  password: string;
  role: "student" | "teacher";
};

type SignupPayload = AuthPayload & {
  name: string;
  mobileNumber: string;
  headline?: string;
};

type AuthResponse = {
  message: string;
  user: PublicUser;
};

type CreateCoursePayload = {
  courseTitle: string;
  category: string;
  level: string;
  shortDescription: string;
  courseDescription: string;
  coursePrice: number;
  discount: number;
  durationLabel: string;
  courseThumbnail?: string;
  educatorId: string;
  educatorName: string;
  isPublished: boolean;
  courseContent: Array<{
    chapterId: string;
    chapterOrder: number;
    chapterTitle: string;
    chapterContent: Array<{
      lectureId: string;
      lectureTitle: string;
      lectureDuration: number;
      lectureUrl: string;
      isPreviewFree: boolean;
      lectureOrder: number;
    }>;
  }>;
};

async function fetchJson<T>(path: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    return (await response.json()) as T;
  } catch {
    return fallback;
  }
}

async function postJson<T>(path: string, payload: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => null)) as
    | { message?: string | string[] }
    | null;

  const message = Array.isArray(data?.message) ? data?.message.join(", ") : data?.message;

  if (!response.ok) {
    throw new Error(message ?? "Request failed.");
  }

  return data as T;
}

async function patchJson<T>(path: string, payload: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const raw = await response.text();
  let data: { message?: string | string[] } | T | null = null;

  if (raw) {
    try {
      data = JSON.parse(raw) as { message?: string | string[] } | T;
    } catch {
      data = null;
    }
  }

  const message =
    (Array.isArray((data as { message?: string | string[] } | null)?.message)
      ? ((data as { message?: string | string[] }).message as string[]).join(", ")
      : (data as { message?: string | string[] } | null)?.message) ??
    raw;
  const normalizedMessage = Array.isArray(message) ? message.join(", ") : message;

  if (!response.ok) {
    throw new Error(normalizedMessage ?? "Request failed.");
  }

  return (data as T) ?? ({} as T);
}

function filterFallbackCatalog(params?: { q?: string; category?: string }): CatalogResponse {
  const q = params?.q?.trim().toLowerCase();
  const category = params?.category?.trim().toLowerCase();

  const courses = fallbackCatalog.courses.filter((course) => {
    const categoryMatch =
      !category || category === "all" || course.category.toLowerCase() === category;
    const queryMatch =
      !q ||
      course.courseTitle.toLowerCase().includes(q) ||
      course.shortDescription.toLowerCase().includes(q) ||
      course.category.toLowerCase().includes(q);

    return categoryMatch && queryMatch;
  });

  return {
    categories: fallbackCatalog.categories,
    resultsCount: courses.length,
    courses,
  };
}

export async function getHomePageData() {
  return fetchJson<HomePageData>("/lms/home", fallbackHomePageData);
}

export async function getCatalog(params?: { q?: string; category?: string }) {
  const search = new URLSearchParams();
  if (params?.q) search.set("q", params.q);
  if (params?.category) search.set("category", params.category);

  const query = search.toString();
  return fetchJson<CatalogResponse>(
    `/courses${query ? `?${query}` : ""}`,
    filterFallbackCatalog(params),
  );
}

export async function getCourseById(id: string) {
  return fetchJson<Course | null>(`/courses/${id}`, getCourseByIdFromFallback(id) ?? null);
}

export async function getLearnerOverview(studentId = "student_1") {
  return fetchJson<LearnerOverview>(
    `/lms/learner?studentId=${studentId}`,
    fallbackLearnerOverview,
  );
}

export async function getEducatorDashboard(educatorId = "educator_1") {
  return fetchJson<EducatorDashboard>(
    `/lms/educator/dashboard?educatorId=${educatorId}`,
    fallbackEducatorDashboard,
  );
}

export async function loginUser(payload: AuthPayload) {
  return postJson<AuthResponse>("/users/login", payload);
}

export async function signupUser(payload: SignupPayload) {
  return postJson<AuthResponse>("/users/signup", payload);
}

export async function getUserProfile(userId: string) {
  return fetchJson<PublicUser | null>(`/users/${userId}`, null);
}

export async function getUserNotifications(userId: string) {
  return fetchJson<UserNotification[]>(`/users/${userId}/notifications`, []);
}

export async function updateUserProfile(
  userId: string,
  payload: {
    name: string;
    email: string;
    mobileNumber: string;
    age?: number;
    interests?: string[];
    ongoingCourses?: string[];
    timeNeeded?: string;
    headline?: string;
  },
) {
  return patchJson<AuthResponse>(`/users/${userId}`, payload);
}

export async function createCourse(payload: CreateCoursePayload) {
  return postJson<Course>("/courses", payload);
}

export async function enrollInCourse(courseId: string, studentId: string) {
  return postJson<{
    message: string;
    enrollmentId: string;
    redirectUrl: string;
  }>(`/courses/${courseId}/enroll`, { studentId });
}