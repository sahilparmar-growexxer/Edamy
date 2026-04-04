"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getEducatorDashboard } from "@/lib/api";
import { EducatorDashboard as EducatorDashboardData } from "@/lib/lms";
import { useAuthUser } from "@/lib/use-auth-user";

type EducatorDashboardProps = {
  requestedEducatorId?: string;
};

export function EducatorDashboard({ requestedEducatorId }: EducatorDashboardProps) {
  const currentUser = useAuthUser();
  const [data, setData] = useState<EducatorDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(requestedEducatorId));
  const [error, setError] = useState<string | null>(null);

  const effectiveEducatorId =
    requestedEducatorId ??
    (currentUser?.role === "teacher" ? currentUser._id : undefined);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard(educatorId: string) {
      setIsLoading(true);
      setError(null);

      try {
        const response = await getEducatorDashboard(educatorId);
        if (!cancelled) {
          setData(response);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load the educator dashboard right now.",
          );
          setData(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    if (!effectiveEducatorId) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return () => {
        cancelled = true;
      };
    }

    void loadDashboard(effectiveEducatorId);

    return () => {
      cancelled = true;
    };
  }, [effectiveEducatorId]);

  if (!requestedEducatorId && !currentUser) {
    return (
      <section className="section-space">
        <div className="app-container">
          <div className="panel p-8 text-center sm:p-10">
            <span className="pill-chip">Educator dashboard</span>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Sign in to manage your teaching workspace
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-600">
              Your revenue, courses, enrollments, and launch readiness will appear here once you
              log in with a teacher account.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/login" className="primary-btn">
                Go to login
              </Link>
              <Link href="/signup" className="secondary-btn">
                Create teacher account
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!requestedEducatorId && currentUser?.role !== "teacher") {
    return (
      <section className="section-space">
        <div className="app-container">
          <div className="panel p-8 text-center sm:p-10">
            <span className="pill-chip">Educator dashboard</span>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              This page is for teacher accounts
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-600">
              You are signed in as a student. Switch to a teacher account to publish courses and
              track enrollments.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/my-courses" className="primary-btn">
                Go to my courses
              </Link>
              <Link href="/signup" className="secondary-btn">
                Create teacher account
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
              Loading educator dashboard...
            </h1>
          </div>
        </div>
      </section>
    );
  }

  if (error || !data?.educator) {
    return (
      <section className="section-space">
        <div className="app-container">
          <div className="panel p-8 text-center sm:p-10">
            <span className="pill-chip">Educator dashboard</span>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              We couldn&apos;t load this educator profile
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-600">
              {error ?? "Try again in a moment, or make sure the backend is running with seeded data."}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/courses" className="primary-btn">
                Browse courses
              </Link>
              <Link href="/login" className="secondary-btn">
                Go to login
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const educator = data.educator;
  const launchReadiness = data.launchReadiness;
  const createCourseHref = `/educator/create-course?educatorId=${encodeURIComponent(
    effectiveEducatorId ?? educator._id,
  )}`;

  return (
    <section className="section-space">
      <div className="app-container">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="pill-chip">Educator dashboard</span>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Welcome back, {educator.name}.
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
              Manage your teaching business with a cleaner dashboard, stronger hierarchy, and
              clearer performance signals.
            </p>
          </div>
          <Link href={createCourseHref} className="primary-btn">
            Create new course
          </Link>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          <div className="rounded-[32px] bg-slate-950 p-6 text-white shadow-[0_24px_70px_-34px_rgba(15,23,42,0.48)]">
            <p className="text-sm text-slate-300">Total earnings</p>
            <h3 className="mt-3 text-4xl font-semibold tracking-tight">
              ${data.metrics.totalEarnings.toFixed(2)}
            </h3>
            <p className="mt-2 text-sm leading-7 text-slate-300">Revenue from all published courses.</p>
          </div>
          <div className="panel p-6">
            <p className="text-sm text-slate-500">Courses published</p>
            <h3 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
              {data.metrics.totalCourses}
            </h3>
            <p className="mt-2 text-sm leading-7 text-slate-600">Live courses available to learners.</p>
          </div>
          <div className="panel p-6">
            <p className="text-sm text-slate-500">Active students</p>
            <h3 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
              {data.metrics.totalStudents}
            </h3>
            <p className="mt-2 text-sm leading-7 text-slate-600">Unique learners across your catalog.</p>
          </div>
        </div>

        {launchReadiness ? (
          <div className="mt-10 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <article className="panel p-6 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-2xl">
                  <span className="pill-chip">New feature</span>
                  <h2 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950">
                    {launchReadiness.title}
                  </h2>
                  <p className="mt-4 text-base leading-8 text-slate-600">
                    {launchReadiness.summary}
                  </p>
                </div>

                <div className="rounded-[28px] bg-slate-950 px-6 py-5 text-white">
                  <p className="text-sm text-slate-300">Average readiness</p>
                  <strong className="mt-2 block text-4xl font-semibold">
                    {launchReadiness.averageScore}%
                  </strong>
                  <p className="mt-2 text-sm text-slate-300">
                    {launchReadiness.readyCourses} ready to launch
                  </p>
                </div>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                <div className="rounded-[28px] border border-emerald-200 bg-emerald-50/70 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                    Strongest course
                  </p>
                  <p className="mt-3 text-3xl font-semibold text-slate-950">
                    {launchReadiness.highestReadiness}%
                  </p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    Your best-prepared course already has the core launch ingredients.
                  </p>
                </div>

                <div className="rounded-[28px] border border-amber-200 bg-amber-50/80 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
                    Most at risk
                  </p>
                  <p className="mt-3 text-lg font-semibold text-slate-950">
                    {launchReadiness.atRiskCourse.courseTitle}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    {launchReadiness.atRiskCourse.readinessScore}% readiness
                  </p>
                </div>

                <div className="rounded-[28px] border border-sky-200 bg-sky-50/70 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">
                    Lowest readiness
                  </p>
                  <p className="mt-3 text-3xl font-semibold text-slate-950">
                    {launchReadiness.lowestReadiness}%
                  </p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    Fixing low-readiness courses prevents weak first impressions for learners.
                  </p>
                </div>
              </div>
            </article>

            <article className="panel p-6 sm:p-8">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                At-risk blockers
              </h2>
              <p className="mt-2 text-slate-600">
                The lowest-readiness course is the fastest place to improve launch quality.
              </p>

              <div className="mt-6 rounded-[28px] border border-slate-200 bg-slate-50/80 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-950">
                      {launchReadiness.atRiskCourse.courseTitle}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {launchReadiness.atRiskCourse.publishedState === "published"
                        ? "Published"
                        : "Draft"}{" "}
                      · {launchReadiness.atRiskCourse.readinessScore}% ready
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                    {launchReadiness.atRiskCourse.status}
                  </span>
                </div>

                <div className="mt-5 space-y-3">
                  {launchReadiness.atRiskCourse.blockers.map((blocker) => (
                    <div
                      key={blocker}
                      className="rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
                    >
                      {blocker}
                    </div>
                  ))}
                </div>
              </div>
            </article>
          </div>
        ) : null}

        <div className="mt-10 grid gap-8 xl:grid-cols-[1.35fr_0.9fr]">
          <div className="panel p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                Recent student activity
              </h2>
              <p className="mt-2 text-slate-600">
                Monitor enrollments and keep track of new learners.
              </p>
            </div>

            {data.recentEnrollments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      <th className="pb-4 pr-4">Student</th>
                      <th className="pb-4 pr-4">Course</th>
                      <th className="pb-4">Purchase date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentEnrollments.map((entry, index) => (
                      <tr key={`${entry.courseId}-${entry.student._id}-${index}`} className="border-b border-slate-100 last:border-b-0">
                        <td className="py-4 pr-4">
                          <div className="flex items-center gap-3">
                            <Image
                              src={entry.student.imageUrl}
                              alt={entry.student.name}
                              width={44}
                              height={44}
                              className="h-11 w-11 rounded-2xl object-cover"
                            />
                            <span className="font-medium text-slate-900">{entry.student.name}</span>
                          </div>
                        </td>
                        <td className="py-4 pr-4 text-slate-600">{entry.courseTitle}</td>
                        <td className="py-4 text-slate-500">
                          {new Date(entry.purchaseDate).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-[28px] border border-slate-200 bg-slate-50/70 p-6 text-slate-600">
                No student activity yet. Publish a course and share it with learners to start
                seeing enrollments here.
              </div>
            )}
          </div>

          <div className="panel p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                Top performing courses
              </h2>
              <p className="mt-2 text-slate-600">
                See which courses are driving revenue and enrollments right now.
              </p>
            </div>

            {data.topCourses.length > 0 ? (
              <div className="space-y-4">
                {data.topCourses.map((course, index) => (
                  <article
                    key={course._id}
                    className="flex items-center gap-4 rounded-[26px] border border-slate-200 bg-slate-50/70 p-4"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold text-white">
                      0{index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-base font-semibold text-slate-950">{course.title}</h3>
                      <p className="mt-1 text-sm text-slate-500">{course.enrollments} enrollments</p>
                    </div>
                    <div className="text-right">
                      <strong className="block text-base font-semibold text-slate-950">
                        {course.rating.toFixed(1)}
                      </strong>
                      <span className="text-sm text-slate-500">${course.revenue.toFixed(0)}</span>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-[28px] border border-slate-200 bg-slate-50/70 p-6 text-slate-600">
                No course performance data yet. Create your first course to start building your
                dashboard.
              </div>
            )}
          </div>
        </div>

        {launchReadiness ? (
          <div className="mt-8 panel p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                Launch checklist by course
              </h2>
              <p className="mt-2 text-slate-600">
                A quick view of which courses are truly launch-ready and which ones still need
                polish.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {launchReadiness.courseReports.map((course) => (
                <article
                  key={course.courseId}
                  className="rounded-[26px] border border-slate-200 bg-slate-50/70 p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-semibold text-slate-950">
                        {course.courseTitle}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {course.publishedState === "published" ? "Published" : "Draft"} · {course.status}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3 text-right shadow-sm">
                      <strong className="block text-xl font-semibold text-slate-950">
                        {course.readinessScore}%
                      </strong>
                      <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        Ready
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    {course.blockers.length > 0 ? (
                      course.blockers.slice(0, 3).map((blocker) => (
                        <p
                          key={blocker}
                          className="rounded-[18px] border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                        >
                          {blocker}
                        </p>
                      ))
                    ) : (
                      <p className="rounded-[18px] border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                        Ready to launch. No blockers detected.
                      </p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
