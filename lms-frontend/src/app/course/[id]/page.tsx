import Link from "next/link";
import { CourseThumbnail } from "@/components/CourseThumbnail";
import { EnrollButton } from "@/components/EnrollButton";
import { CourseQuizSection } from "@/components/CourseQuizSection";
import { CourseQuizBuilder } from "@/components/CourseQuizBuilder";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getCourseById } from "@/lib/api";
import {
  formatDurationMins,
  getAverageRating,
  getFirstLecture,
  getTotalLessons,
  resolveAsset,
} from "@/lib/lms";

type CoursePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function CoursePage({ params }: CoursePageProps) {
  const { id } = await params;
  const course = await getCourseById(id);

  if (!course) {
    return (
      <main className="app-shell">
        <Navbar active="courses" />
        <section className="section-space">
          <div className="app-container">
            <div className="panel p-10 text-center">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Course not found</h1>
              <p className="mt-4 text-slate-600">
                The course you are looking for does not exist or has been removed.
              </p>
              <Link href="/courses" className="primary-btn mt-8">
                Back to courses
              </Link>
            </div>
          </div>
        </section>
        <Footer />
      </main>
    );
  }

  const firstLecture = getFirstLecture(course);
  const totalLectures = getTotalLessons(course);
  const totalDuration = course.courseContent.reduce(
    (acc, chapter) =>
      acc + chapter.chapterContent.reduce((sum, lecture) => sum + lecture.lectureDuration, 0),
    0,
  );

  const metaCards = [
    {
      icon: "time_left_clock_icon",
      value: course.durationLabel ?? formatDurationMins(totalDuration),
      label: "Total duration",
    },
    {
      icon: "lesson_icon",
      value: `${totalLectures}`,
      label: "Lessons",
    },
    {
      icon: "person_tick_icon",
      value: course.educatorName,
      label: "Instructor",
    },
  ];

  return (
    <main className="app-shell">
      <Navbar active="courses" />

      <section className="section-space">
        <div className="app-container">
          <div className="grid gap-8 xl:grid-cols-[1.5fr_0.78fr]">
            <div className="space-y-8">
              <div className="panel overflow-hidden">
                <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
                  <div>
                    <span className="pill-chip">Course details</span>
                    <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                      {course.courseTitle}
                    </h1>
                    <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
                      {course.shortDescription}
                    </p>
                  </div>
                  <div className="overflow-hidden rounded-[30px]">
                    <CourseThumbnail
                      title={course.courseTitle}
                      thumbnail={course.courseThumbnail}
                      thumbnailKey={course.courseThumbnailKey}
                      className="h-[320px] w-full object-cover"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {metaCards.map((card) => (
                  <div key={card.label} className="panel flex items-center gap-4 p-5">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50">
                      <img src={resolveAsset(card.icon)} alt={card.label} className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-950">{card.value}</h3>
                      <p className="text-sm text-slate-500">{card.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="panel p-6 sm:p-8">
                <div className="mb-6 flex flex-col gap-2">
                  <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Overview</h2>
                  <p className="text-slate-500">A guided breakdown of what you will learn inside this course.</p>
                </div>
                <div
                  className="rich-text"
                  dangerouslySetInnerHTML={{ __html: course.courseDescription }}
                />
              </div>

              <div className="panel p-6 sm:p-8">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Curriculum</h2>
                    <p className="mt-1 text-slate-500">
                      {course.courseContent.length} chapters • {totalLectures} lessons
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-5">
                  {course.courseContent.map((chapter) => (
                    <div key={chapter.chapterId} className="rounded-[28px] border border-slate-200 bg-slate-50/60 p-5">
                      <h3 className="text-lg font-semibold text-slate-950">{chapter.chapterTitle}</h3>
                      <div className="mt-4 space-y-3">
                        {chapter.chapterContent.map((lecture) => (
                          <div
                            key={lecture.lectureId}
                            className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div>
                              <strong className="block text-sm font-semibold text-slate-950">
                                {lecture.lectureTitle}
                              </strong>
                              <p className="mt-1 text-sm text-slate-500">
                                {formatDurationMins(lecture.lectureDuration)}
                              </p>
                            </div>
                            {lecture.isPreviewFree ? (
                              <span className="inline-flex rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">
                                Preview
                              </span>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <CourseQuizSection courseId={course._id} />
              <CourseQuizBuilder courseId={course._id} educatorId={course.educatorId} />
            </div>

            <aside className="xl:sticky xl:top-28 xl:self-start">
              <div className="panel overflow-hidden">
                <div className="bg-slate-950 p-6 text-white">
                  <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-200">
                    Best value
                  </span>
                  <div className="mt-5 flex items-end gap-3">
                    <span className="text-4xl font-semibold tracking-tight">
                      ${course.coursePrice.toFixed(2)}
                    </span>
                    <span className="pb-1 text-sm text-slate-400 line-through">
                      ${(course.coursePrice * 1.4).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="space-y-4 p-6">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Students enrolled
                    </p>
                    <p className="mt-2 text-lg font-semibold text-slate-950">
                      {course.enrolledStudents?.length ?? 0}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Rating
                    </p>
                    <p className="mt-2 text-lg font-semibold text-slate-950">
                      {getAverageRating(course)} / 5
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Language
                    </p>
                    <p className="mt-2 text-lg font-semibold text-slate-950">English</p>
                  </div>

                  <a href={firstLecture?.lecture?.lectureUrl ?? "#"} className="primary-btn w-full">
                    Watch preview
                  </a>
                  <EnrollButton
                    courseId={course._id}
                    redirectUrl={firstLecture?.lecture?.lectureUrl ?? null}
                  />
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
