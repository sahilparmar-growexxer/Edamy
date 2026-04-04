"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { enrollInCourse } from "@/lib/api";
import { getDefaultRouteForRole, readStoredUser } from "@/lib/auth";

type EnrollButtonProps = {
  courseId: string;
  redirectUrl?: string | null;
};

export function EnrollButton({ courseId, redirectUrl }: EnrollButtonProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleEnroll() {
    const currentUser = readStoredUser();

    if (!currentUser) {
      toast("Please sign in to enroll in a course.");
      router.push("/login");
      return;
    }

    if (currentUser.role !== "student") {
      toast.error("Only students can enroll in courses.");
      return;
    }

    if (!currentUser.email?.trim() || !currentUser.mobileNumber?.trim()) {
      toast.error("Please register your email and mobile number before enrolling.");
      router.push("/account");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await enrollInCourse(courseId, currentUser._id);
      toast.success("Enrolled successfully. Your course is ready.");

      const nextUrl = response.redirectUrl ?? redirectUrl;
      const myCoursesRoute = getDefaultRouteForRole(currentUser);

      router.prefetch(myCoursesRoute);

      if (nextUrl) {
        window.location.assign(nextUrl);
        return;
      }

      router.push(myCoursesRoute);
      router.refresh();
    } catch (enrollError) {
      toast.error(
        enrollError instanceof Error ? enrollError.message : "Could not enroll in this course.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleEnroll}
      disabled={isSubmitting}
      className="secondary-btn w-full disabled:opacity-70"
    >
      {isSubmitting ? "Enrolling..." : "Enroll course"}
    </button>
  );
}
