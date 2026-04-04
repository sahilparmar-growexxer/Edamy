"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CourseCard } from "@/components/CourseCard";
import { getLearnerOverview } from "@/lib/api";
import { useAuthUser } from "@/lib/use-auth-user";
import { getAverageRating, LearnerOverview } from "@/lib/lms";

type LearnerDashboardProps = {
  requestedStudentId?: string;
};

export function LearnerDashboard({ requestedStudentId }: LearnerDashboardProps) {
  const currentUser = useAuthUser();
  const [data, setData] = useState<LearnerOverview | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(requestedStudentId));
  const [error, setError] = useState<string | null>(null);

  const effectiveStudentId =
    requestedStudentId ??
    (currentUser?.role === "student" ? currentUser._id : undefined);

  useEffect(() => {
    let cancelled = false;

    async function loadLearnerOverview(studentId: string) {
      setIsLoading(true);
      setError(null);

      try {
        const response = await getLearnerOverview(studentId);
        if (!cancelled) {
          setData(response);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load your courses right now.",
          );
          setData(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    if (!effectiveStudentId) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return () => {
        cancelled = true;
      };
    }

    void loadLearnerOverview(effectiveStudentId);

    return () => {
      cancelled = true;
    };
  }, [effectiveStudentId]);

  if (!requestedStudentId && !currentUser) {
    return (
      <section className="section-space">
        <div className="app-container">
          <div className="panel p-8 text-center sm:p-10">
            <span className="pill-chip">My courses</span>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Sign in to view your learning path
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-600">
              Your enrolled courses, progress, and next study sprint will appear here as soon as
              you log in.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/login" className="primary-btn">
                Go to login
              </Link>
              <Link href="/courses" className="secondary-btn">
                Browse courses
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!requestedStudentId && currentUser?.role !== "student") {
    return (
      <section className="section-space">
        <div className="app-container">
          <div className="panel p-8 text-center sm:p-10">
            <span className="pill-chip">My courses</span>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              This page is for student accounts
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-600">
              You are signed in as a teacher. Switch to a student account to track course progress,
              or go to the educator dashboard to manage your catalog.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/educator/dashboard" className="primary-btn">
                Go to educator dashboard
              </Link>
              <Link href="/courses" className="secondary-btn">
                Browse courses
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className="section-space">
        <div className="app-container">
          <div className="panel p-8 sm:p-10">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
              Loading your courses...
            </h1>
          </div>
        </div>
      </section>
    );
  }

  if (error || !data?.learner) {
    return (
      <section className="section-space">
        <div className="app-container">
          <div className="panel p-8 text-center sm:p-10">
            <span className="pill-chip">My courses</span>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              We couldn&apos;t load this learner profile
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-600">
              {error ?? "Try again in a moment, or make sure the backend is running with seeded data."}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/courses" className="primary-btn">
                Browse courses
              </Link>
              <Link href="/account" className="secondary-btn">
                My account
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const enrolledCourses = data.enrolledCourses;
  const studySprint = data.studySprint;
  const learner = data.learner;

  return (
    <>
      <section className="section-space">
        <div className="app-container">
          <div className="panel px-6 py-8 sm:px-10 sm:py-10">
            <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
              <div>
                <span className="pill-chip">My courses</span>
                <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                  Continue learning where you left off, {learner.name}.
                </h1>
                <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
                  Track progress, revisit lessons, and keep your weekly learning rhythm intact.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
                <div className="rounded-[28px] bg-slate-950 p-6 text-white">
                  <p className="text-sm text-slate-300">Active courses</p>
                  <strong className="mt-2 block text-3xl font-semibold">{enrolledCourses.length}</strong>
                </div>
                <div className="rounded-[28px] border border-slate-200 bg-white p-6">
                  <p className="text-sm text-slate-500">Average progress</p>
                  <strong className="mt-2 block text-3xl font-semibold text-slate-950">
                    {data.metrics.averageProgress}%
                  </strong>
                </div>
                <div className="rounded-[28px] border border-slate-200 bg-white p-6">
                  <p className="text-sm text-slate-500">Remaining time</p>
                  <strong className="mt-2 block text-3xl font-semibold text-slate-950">
                    {data.metrics.hoursRemaining}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-20">
        <div className="app-container">
          {studySprint ? (
            <div className="mb-8 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
              <article className="panel overflow-hidden p-6 sm:p-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="max-w-2xl">
                    <span className="pill-chip">New feature</span>
                    <h2 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950">
                      {studySprint.title}
                    </h2>
                    <p className="mt-4 text-base leading-8 text-slate-600">
                      {studySprint.summary}
                    </p>
                  </div>

                  <div className="rounded-[28px] bg-slate-950 px-6 py-5 text-white">
                    <p className="text-sm text-slate-300">Momentum score</p>
                    <strong className="mt-2 block text-4xl font-semibold">
                      {studySprint.momentumScore}
                    </strong>
                    <p className="mt-2 text-sm text-slate-300">
                      Suggested sprint: {studySprint.recommendedMinutes} min
                    </p>
                  </div>
                </div>

                <div className="mt-8 grid gap-4 md:grid-cols-3">
                  {studySprint.focusCourse ? (
                    <div className="rounded-[28px] border border-sky-200 bg-sky-50/70 p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">
                        Focus now
                      </p>
                      <h3 className="mt-3 text-lg font-semibold text-slate-950">
                        {studySprint.focusCourse.courseTitle}
                      </h3>
                      <p className="mt-2 text-sm text-slate-600">
                        {studySprint.focusCourse.progressPercent}% complete
                      </p>
                      <p className="mt-3 text-sm leading-7 text-slate-600">
                        {studySprint.focusCourse.reason}
                      </p>
                      {studySprint.focusCourse.nextLesson ? (
                        <p className="mt-3 text-sm font-medium text-slate-900">
                          Next lesson: {studySprint.focusCourse.nextLesson}
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  {studySprint.quickWinCourse ? (
                    <div className="rounded-[28px] border border-emerald-200 bg-emerald-50/70 p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                        Quick win
                      </p>
                      <h3 className="mt-3 text-lg font-semibold text-slate-950">
                        {studySprint.quickWinCourse.courseTitle}
                      </h3>
                      <p className="mt-2 text-sm text-slate-600">
                        {studySprint.quickWinCourse.progressPercent}% complete
                      </p>
                      <p className="mt-3 text-sm leading-7 text-slate-600">
                        {studySprint.quickWinCourse.reason}
                      </p>
                    </div>
                  ) : null}

                  {studySprint.catchUpCourse ? (
                    <div className="rounded-[28px] border border-amber-200 bg-amber-50/80 p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
                        Catch up
                      </p>
                      <h3 className="mt-3 text-lg font-semibold text-slate-950">
                        {studySprint.catchUpCourse.courseTitle}
                      </h3>
                      <p className="mt-2 text-sm text-slate-600">
                        {studySprint.catchUpCourse.progressPercent}% complete
                      </p>
                      <p className="mt-3 text-sm leading-7 text-slate-600">
                        {studySprint.catchUpCourse.reason}
                      </p>
                    </div>
                  ) : null}
                </div>
              </article>

              <article className="panel p-6 sm:p-8">
                <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                  Sprint checklist
                </h2>
                <p className="mt-2 text-slate-600">
                  A practical plan generated from your current course progress, so the next study
                  session is obvious.
                </p>

                <div className="mt-6 space-y-4">
                  {studySprint.actionChecklist.map((item, index) => (
                    <div
                      key={item}
                      className="flex items-start gap-4 rounded-[24px] border border-slate-200 bg-slate-50/80 p-4"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold text-white">
                        0{index + 1}
                      </div>
                      <p className="pt-1 text-sm leading-7 text-slate-700">{item}</p>
                    </div>
                  ))}
                </div>
              </article>
            </div>
          ) : null}

          <div className="mb-8">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
              Your current learning path
            </h2>
            <p className="mt-2 text-slate-600">
              {enrolledCourses.length > 0
                ? "Pick up right where you left off and finish your next lesson."
                : "Enroll in a course to start building your learning momentum."}
            </p>
          </div>

          {enrolledCourses.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {enrolledCourses.map((course) => (
                <CourseCard
                  key={course._id}
                  id={course._id}
                  title={course.courseTitle}
                  thumbnail={course.courseThumbnail}
                  thumbnailKey={course.courseThumbnailKey}
                  price={course.coursePrice}
                  educatorName={course.educatorName}
                  rating={getAverageRating(course)}
                  ratingsCount={course.courseRatings?.length ?? 18}
                  progressPercent={course.progressPercent}
                />
              ))}
            </div>
          ) : (
            <div className="panel p-8 text-center sm:p-10">
              <h3 className="text-3xl font-semibold tracking-tight text-slate-950">
                No courses enrolled yet
              </h3>
              <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-600">
                Your account is ready. Browse the catalog, enroll in a course, and your progress
                dashboard will start filling in here automatically.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link href="/courses" className="primary-btn">
                  Browse courses
                </Link>
                <Link href="/account" className="secondary-btn">
                  Complete your profile
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
