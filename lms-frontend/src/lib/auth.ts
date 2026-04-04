export type UserRole = "student" | "teacher";

export type AuthUser = {
  _id: string;
  name: string;
  email: string;
  mobileNumber?: string;
  age?: number;
  interests?: string[];
  ongoingCourses?: string[];
  timeNeeded?: string;
  imageUrl: string;
  role: UserRole | "admin";
  headline?: string;
};

export const AUTH_STORAGE_KEY = "lms-auth-user";
const AUTH_CHANGE_EVENT = "lms-auth-change";
let cachedAuthRaw: string | null | undefined;
let cachedAuthUser: AuthUser | null = null;

export function getRoleLabel(role: UserRole) {
  return role === "teacher" ? "Teacher" : "Student";
}

export function getDefaultRouteForRole(user: Pick<AuthUser, "_id" | "role">) {
  if (user.role === "teacher") {
    return `/educator/dashboard?educatorId=${encodeURIComponent(user._id)}`;
  }

  return `/my-courses?studentId=${encodeURIComponent(user._id)}`;
}

export function readStoredUser() {
  if (typeof window === "undefined") {
    return null;
  }

  const value = window.localStorage.getItem(AUTH_STORAGE_KEY);

  if (value === cachedAuthRaw) {
    return cachedAuthUser;
  }

  if (!value) {
    cachedAuthRaw = value;
    cachedAuthUser = null;
    return null;
  }

  try {
    cachedAuthRaw = value;
    cachedAuthUser = JSON.parse(value) as AuthUser;
    return cachedAuthUser;
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    cachedAuthRaw = null;
    cachedAuthUser = null;
    return null;
  }
}

export function subscribeToStoredUser(onChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleStorage = (event: StorageEvent) => {
    if (!event.key || event.key === AUTH_STORAGE_KEY) {
      onChange();
    }
  };

  const handleAuthChange = () => {
    onChange();
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(AUTH_CHANGE_EVENT, handleAuthChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
  };
}

export function getStoredUserSnapshot() {
  return readStoredUser();
}

export function getStoredUserServerSnapshot() {
  return null;
}

export function storeUser(user: AuthUser) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

export function updateStoredUser(patch: Partial<AuthUser>) {
  if (typeof window === "undefined") {
    return;
  }

  const current = readStoredUser();

  if (!current) {
    return;
  }

  storeUser({
    ...current,
    ...patch,
  });
}

export function clearStoredUser() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}
