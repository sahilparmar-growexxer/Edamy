import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CourseCard } from "@/components/CourseCard";
import { getCatalog } from "@/lib/api";
import { getAverageRating } from "@/lib/lms";

type CoursesPageProps = {
  searchParams?: Promise<{
    q?: string;
    category?: string;
  }>;
};

export default async function CoursesPage({ searchParams }: CoursesPageProps) {
  const params = (await searchParams) ?? {};
  const catalog = await getCatalog({ q: params.q, category: params.category });

  return (
    <main className="app-shell">
      <Navbar active="courses" />

      <section className="section-space">
        <div className="app-container">
          <div className="panel px-6 py-8 sm:px-10 sm:py-10">
            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
              <div>
                <span className="pill-chip">All courses</span>
                <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                  Browse every course created for your next goal.
                </h1>
                <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
                  Filter by category, preview lessons, and enroll instantly in the skills that matter most.
                  New courses are added regularly so you can stay ahead.
                </p>
                {params.q ? (
                  <p className="mt-4 text-sm font-medium text-slate-500">
                    Showing results for &quot;{params.q}&quot;
                  </p>
                ) : null}
              </div>

              <div className="rounded-[28px] bg-slate-950 p-6 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-200">
                  Catalog snapshot
                </p>
                <div className="mt-5 grid grid-cols-2 gap-4">
                  <div>
                    <strong className="block text-3xl font-semibold">{catalog.resultsCount}</strong>
                    <span className="text-sm text-slate-300">Available now</span>
                  </div>
                  <div>
                    <strong className="block text-3xl font-semibold">{catalog.categories.length - 1}</strong>
                    <span className="text-sm text-slate-300">Categories</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              {catalog.categories.map((category) => {
                const isActive = (params.category ?? "All") === category;
                const href =
                  category === "All"
                    ? `/courses${params.q ? `?q=${encodeURIComponent(params.q)}` : ""}`
                    : `/courses?category=${encodeURIComponent(category)}${params.q ? `&q=${encodeURIComponent(params.q)}` : ""}`;

                return (
                  <Link
                    key={category}
                    href={href}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      isActive
                        ? "bg-slate-950 text-white"
                        : "border border-slate-200 bg-white text-slate-700 hover:border-sky-200 hover:bg-sky-50"
                    }`}
                  >
                    {category}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="pb-20">
        <div className="app-container">
          <div className="mb-8 flex flex-col gap-2">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
              {catalog.resultsCount} courses available
            </h2>
            <p className="text-slate-600">
              Pick a path, preview the lessons, and start building momentum.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {catalog.courses.map((course) => (
              <CourseCard
                key={course._id}
                id={course._id}
                title={course.courseTitle}
                thumbnail={course.courseThumbnail}
                thumbnailKey={course.courseThumbnailKey}
                price={course.coursePrice}
                educatorName={course.educatorName}
                rating={getAverageRating(course)}
                ratingsCount={course.courseRatings?.length ?? 32}
              />
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
