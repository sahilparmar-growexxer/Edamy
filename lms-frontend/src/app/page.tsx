import Image from "next/image";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CourseThumbnail } from "@/components/CourseThumbnail";
import { getHomePageData } from "@/lib/api";
import { getAverageRating, resolveAsset } from "@/lib/lms";

export default async function HomePage() {
  const data = await getHomePageData();
  const featuredCourse =
    data.featuredCourses.find((course) => course._id === data.hero.featuredCourseId) ??
    data.featuredCourses[0];

  return (
    <main className="app-shell">
      <Navbar active="home" />

      <section className="section-space overflow-hidden">
        <div className="app-container">
          <div className="subtle-grid panel relative overflow-hidden px-6 py-8 sm:px-10 sm:py-12 lg:px-12 lg:py-14">
            <div className="absolute -left-20 top-10 h-48 w-48 rounded-full bg-sky-200/40 blur-3xl" />
            <div className="absolute bottom-0 right-0 h-56 w-56 rounded-full bg-cyan-200/40 blur-3xl" />
            <div className="relative grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="max-w-2xl">
                <span className="pill-chip">{data.hero.eyebrow}</span>
                <h1 className="mt-6 max-w-3xl text-5xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-6xl">
                  {data.hero.title}
                </h1>
                <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                  {data.hero.description}
                </p>

                <div className="mt-8 flex flex-wrap gap-4">
                  <a href={data.hero.primaryCta.href} className="primary-btn">
                    {data.hero.primaryCta.label}
                  </a>
                  <a href={data.hero.secondaryCta.href} className="secondary-btn">
                    {data.hero.secondaryCta.label}
                  </a>
                </div>

                <form
                  className="mt-8 flex flex-col gap-3 sm:flex-row"
                  action="/courses"
                  method="get"
                >
                  <div className="flex flex-1 items-center gap-3 rounded-full border border-slate-200 bg-white px-5 py-3 shadow-sm">
                    <img src={resolveAsset("search_icon")} alt="Search icon" width="18" height="18" />
                    <input
                      name="q"
                      type="text"
                      placeholder="Search for courses, topics, or skills"
                      aria-label="Search courses"
                      className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                    />
                  </div>
                  <button type="submit" className="primary-btn">
                    Search
                  </button>
                </form>

                <div className="mt-8 flex flex-wrap gap-4">
                  <div className="rounded-3xl border border-slate-200/80 bg-white/90 px-5 py-4 shadow-sm">
                    <strong className="block text-xl font-semibold text-slate-950">
                      {data.stats.totalCourses}+
                    </strong>
                    <span className="text-sm text-slate-500">Guided courses</span>
                  </div>
                  <div className="rounded-3xl border border-slate-200/80 bg-white/90 px-5 py-4 shadow-sm">
                    <strong className="block text-xl font-semibold text-slate-950">
                      {data.stats.totalStudents}+
                    </strong>
                    <span className="text-sm text-slate-500">Active learners</span>
                  </div>
                  <div className="rounded-3xl border border-slate-200/80 bg-white/90 px-5 py-4 shadow-sm">
                    <strong className="block text-xl font-semibold text-slate-950">
                      {data.stats.averageRating.toFixed(1)}
                    </strong>
                    <span className="text-sm text-slate-500">Average rating</span>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="panel relative overflow-hidden rounded-[36px] p-3">
                  {featuredCourse ? (
                    <Image
                      src={resolveAsset(featuredCourse.courseThumbnailKey, featuredCourse.courseThumbnail)}
                      alt={featuredCourse.courseTitle}
                      width={620}
                      height={480}
                      priority
                      className="h-[420px] w-full rounded-[28px] object-cover"
                    />
                  ) : null}
                  <div className="absolute inset-x-6 bottom-6 rounded-[28px] border border-white/40 bg-slate-950/78 p-5 text-white backdrop-blur">
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200">
                      Featured course
                    </p>
                    <h2 className="mt-3 text-2xl font-semibold tracking-tight">
                      {featuredCourse?.courseTitle ?? "Discover your next course"}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-200">
                      {featuredCourse?.shortDescription}
                    </p>
                  </div>
                </div>
                <div className="absolute -bottom-6 -left-6 hidden rounded-[28px] bg-white px-5 py-4 shadow-[0_20px_50px_-24px_rgba(15,23,42,0.35)] lg:block">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                    Momentum
                  </p>
                  <p className="mt-2 text-xl font-semibold text-slate-950">New lessons every week</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-6">
        <div className="app-container">
          <div className="grid gap-4 rounded-[32px] border border-slate-200/70 bg-white/80 p-6 sm:grid-cols-3 lg:grid-cols-5">
            {data.partners.map((logoKey, index) => (
              <div
                key={index}
                className="flex min-h-20 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50/80 px-5"
              >
                <Image src={resolveAsset(logoKey)} alt="Partner logo" width={120} height={42} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-space">
        <div className="app-container">
          <div className="max-w-2xl">
            <span className="pill-chip">Why choose GreatStack</span>
            <h2 className="section-title mt-5">A sharper learning experience built for real progress.</h2>
            <p className="section-copy mt-4">
              Beautiful lessons, practical curriculum, and a calmer dashboard experience that helps learners stay focused.
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {data.features.map((feature, index) => (
              <article
                key={feature.title}
                className={`panel p-7 ${
                  index === 1 ? "bg-slate-950 text-white" : "bg-white/95"
                }`}
              >
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
                    index === 1 ? "bg-white/10" : "bg-sky-50"
                  }`}
                >
                  <img src={resolveAsset(feature.iconKey)} alt={feature.title} className="h-6 w-6" />
                </div>
                <h3 className={`mt-6 text-xl font-semibold ${index === 1 ? "text-white" : "text-slate-950"}`}>
                  {feature.title}
                </h3>
                <p className={`mt-3 text-sm leading-7 ${index === 1 ? "text-slate-300" : "text-slate-600"}`}>
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-space">
        <div className="app-container">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Learn from the best
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
              Discover our top-rated courses across various categories. From coding and
              design to business and wellness, our courses are crafted to deliver
              results.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {data.featuredCourses.slice(0, 4).map((course) => {
              const rating = getAverageRating(course);
              const ratingsCount = course.courseRatings?.length ?? 122;

              return (
                <a
                  key={course._id}
                  href={`/course/${course._id}`}
                  className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_12px_30px_-24px_rgba(15,23,42,0.35)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_36px_-24px_rgba(15,23,42,0.4)]"
                >
                  <div className="overflow-hidden p-2">
                    <CourseThumbnail
                      title={course.courseTitle}
                      thumbnail={course.courseThumbnail}
                      thumbnailKey={course.courseThumbnailKey}
                      className="h-40 w-full rounded-lg object-cover transition duration-300 group-hover:scale-[1.03]"
                    />
                  </div>

                  <div className="px-4 pb-4 pt-1">
                    <h3 className="line-clamp-2 text-base font-semibold leading-6 text-slate-900">
                      {course.courseTitle}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">{course.educatorName}</p>

                    <div className="mt-2 flex items-center gap-2 text-sm">
                      <span className="font-medium text-slate-700">{rating.toFixed(1)}</span>
                      <div className="flex items-center gap-0.5 text-[13px] text-orange-500">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <span key={index}>★</span>
                        ))}
                      </div>
                      <span className="text-slate-400">({ratingsCount})</span>
                    </div>

                    <p className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
                      ${course.coursePrice.toFixed(2)}
                    </p>
                  </div>
                </a>
              );
            })}
          </div>

          <div className="mt-10 flex justify-center">
            <a
              href="/courses"
              className="inline-flex min-w-40 items-center justify-center rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
            >
              Show all courses
            </a>
          </div>
        </div>
      </section>

      <section className="section-space pt-0">
        <div className="app-container">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Testimonials
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
              Hear from our learners as they share their journeys of transformation,
              success, and how our platform has made a difference in their lives.
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {data.testimonials.map((item, index) => (
              <article
                key={index}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_34px_-28px_rgba(15,23,42,0.3)]"
              >
                <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-4">
                  <Image
                    src={resolveAsset(item.imageKey)}
                    alt={item.name}
                    width={52}
                    height={52}
                    className="h-[52px] w-[52px] rounded-full object-cover"
                  />
                  <div>
                    <strong className="block text-base font-semibold text-slate-900">
                      {item.name}
                    </strong>
                    <p className="text-xs text-slate-500">{item.role}</p>
                  </div>
                </div>

                <div className="px-5 py-5">
                  <div className="flex items-center gap-0.5 text-[18px] text-orange-500">
                    {Array.from({ length: 5 }).map((_, starIndex) => (
                      <span key={starIndex}>★</span>
                    ))}
                  </div>
                  <p className="mt-4 line-clamp-5 text-sm leading-7 text-slate-600">
                    {item.feedback}
                  </p>
                  <a
                    href="/courses"
                    className="mt-5 inline-flex text-sm font-medium text-sky-600 transition hover:text-sky-700"
                  >
                    Read more
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
