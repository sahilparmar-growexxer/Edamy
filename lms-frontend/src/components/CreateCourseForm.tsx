"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createCourse } from "@/lib/api";
import { readStoredUser } from "@/lib/auth";

type CreateCourseFormProps = {
  educatorId?: string;
};

type LessonDraft = {
  id: string;
  title: string;
  videoUrl: string;
  duration: string;
  isPreviewFree: boolean;
};

function createEmptyLesson(index: number): LessonDraft {
  return {
    id: `lesson_${Date.now()}_${index}`,
    title: "",
    videoUrl: "",
    duration: "20",
    isPreviewFree: index === 0,
  };
}

function buildCourseContent(lessons: LessonDraft[]) {
  return [
    {
      chapterId: `chapter_${Date.now()}`,
      chapterOrder: 1,
      chapterTitle: "Course lessons",
      chapterContent: lessons.map((lesson, index) => ({
        lectureId: `lecture_${Date.now()}_${index + 1}`,
        lectureTitle: lesson.title.trim(),
        lectureDuration: Number(lesson.duration) || 20,
        lectureUrl: lesson.videoUrl.trim(),
        isPreviewFree: lesson.isPreviewFree,
        lectureOrder: index + 1,
      })),
    },
  ];
}

export function CreateCourseForm({ educatorId }: CreateCourseFormProps) {
  const router = useRouter();
  const [teacherName, setTeacherName] = useState("GreatStack");
  const [teacherId, setTeacherId] = useState(educatorId ?? "");
  const [courseTitle, setCourseTitle] = useState("");
  const [category, setCategory] = useState("Development");
  const [level, setLevel] = useState("Beginner");
  const [price, setPrice] = useState("49.99");
  const [discount, setDiscount] = useState("0");
  const [durationLabel, setDurationLabel] = useState("4h 00m");
  const [thumbnail, setThumbnail] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [courseDescription, setCourseDescription] = useState("");
  const [lessons, setLessons] = useState<LessonDraft[]>([
    createEmptyLesson(1),
    createEmptyLesson(2),
  ]);
  const [isPublished, setIsPublished] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const user = readStoredUser();
    if (user?.role === "teacher") {
      setTeacherName(user.name);
      setTeacherId((currentId) => currentId || user._id);
      setError(null);
      return;
    }

    if (!educatorId) {
      setError("Sign in as a teacher to create a course.");
    }
  }, [educatorId]);

  function updateLesson(id: string, patch: Partial<LessonDraft>) {
    setLessons((currentLessons) =>
      currentLessons.map((lesson) => (lesson.id === id ? { ...lesson, ...patch } : lesson)),
    );
  }

  function addLesson() {
    setLessons((currentLessons) => [
      ...currentLessons,
      createEmptyLesson(currentLessons.length + 1),
    ]);
  }

  function removeLesson(id: string) {
    setLessons((currentLessons) => {
      if (currentLessons.length === 1) {
        return currentLessons;
      }

      const nextLessons = currentLessons.filter((lesson) => lesson.id !== id);
      const hasPreviewLesson = nextLessons.some((lesson) => lesson.isPreviewFree);

      return nextLessons.map((lesson, index) => ({
        ...lesson,
        isPreviewFree: hasPreviewLesson ? lesson.isPreviewFree : index === 0,
      }));
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const validLessons = lessons.filter(
      (lesson) => lesson.title.trim() && lesson.videoUrl.trim(),
    );

    if (validLessons.length === 0) {
      setError("Add at least one lesson with both a title and a video URL.");
      return;
    }

    if (validLessons.length !== lessons.length) {
      setError("Each lesson needs both a title and a video URL.");
      return;
    }

    if (!teacherId.trim()) {
      setError("Sign in as a teacher to create a course.");
      return;
    }

    setIsSubmitting(true);

    try {
      const course = await createCourse({
        courseTitle,
        category,
        level,
        shortDescription,
        courseDescription: `<p>${courseDescription}</p>`,
        coursePrice: Number(price),
        discount: Number(discount),
        durationLabel,
        courseThumbnail: thumbnail || undefined,
        educatorId: teacherId || "teacher_1",
        educatorName: teacherName || "GreatStack",
        isPublished,
        courseContent: buildCourseContent(validLessons),
      });

      router.push(
        `/educator/dashboard?educatorId=${encodeURIComponent(
          course.educatorId ?? teacherId ?? "teacher_1",
        )}`,
      );
      router.refresh();
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Could not create course. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="panel p-6 sm:p-8" onSubmit={handleSubmit}>
      <div className="grid gap-5 md:grid-cols-2">
        <label className="block md:col-span-2">
          <span className="mb-2 block text-sm font-medium text-slate-700">Course title</span>
          <input
            value={courseTitle}
            onChange={(event) => setCourseTitle(event.target.value)}
            className="auth-input"
            placeholder="Advanced React for Teams"
            required
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">Category</span>
          <input
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="auth-input"
            placeholder="Development"
            required
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">Level</span>
          <select value={level} onChange={(event) => setLevel(event.target.value)} className="auth-input">
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">Price</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            className="auth-input"
            required
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">Discount %</span>
          <input
            type="number"
            min="0"
            max="100"
            value={discount}
            onChange={(event) => setDiscount(event.target.value)}
            className="auth-input"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">Duration label</span>
          <input
            value={durationLabel}
            onChange={(event) => setDurationLabel(event.target.value)}
            className="auth-input"
            placeholder="6h 30m"
            required
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">Thumbnail URL</span>
          <input
            value={thumbnail}
            onChange={(event) => setThumbnail(event.target.value)}
            className="auth-input"
            placeholder="https://example.com/course-cover.jpg"
          />
        </label>

        <label className="block md:col-span-2">
          <span className="mb-2 block text-sm font-medium text-slate-700">Short description</span>
          <textarea
            value={shortDescription}
            onChange={(event) => setShortDescription(event.target.value)}
            className="auth-input min-h-28"
            placeholder="Explain what learners will achieve in this course."
            required
          />
        </label>

        <label className="block md:col-span-2">
          <span className="mb-2 block text-sm font-medium text-slate-700">Full description</span>
          <textarea
            value={courseDescription}
            onChange={(event) => setCourseDescription(event.target.value)}
            className="auth-input min-h-36"
            placeholder="Describe the learning experience, outcomes, and teaching style."
            required
          />
        </label>

        <div className="md:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <span className="mb-2 block text-sm font-medium text-slate-700">Course videos</span>
              <p className="text-sm text-slate-500">
                Add each lesson with its own video URL.
              </p>
            </div>
            <button type="button" onClick={addLesson} className="secondary-btn">
              Add lesson
            </button>
          </div>

          <div className="space-y-4">
            {lessons.map((lesson, index) => (
              <div
                key={lesson.id}
                className="rounded-[28px] border border-slate-200 bg-slate-50/70 p-5"
              >
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Lesson {index + 1}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Add the lesson title and video link here.
                    </p>
                  </div>
                  {lessons.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => removeLesson(lesson.id)}
                      className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                    >
                      Remove
                    </button>
                  ) : null}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">Lesson title</span>
                    <input
                      value={lesson.title}
                      onChange={(event) => updateLesson(lesson.id, { title: event.target.value })}
                      className="auth-input"
                      placeholder="Introduction to hooks"
                      required
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">Video URL</span>
                    <input
                      type="url"
                      value={lesson.videoUrl}
                      onChange={(event) => updateLesson(lesson.id, { videoUrl: event.target.value })}
                      className="auth-input"
                      placeholder="https://www.youtube.com/watch?v=..."
                      required
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">Duration in minutes</span>
                    <input
                      type="number"
                      min="1"
                      value={lesson.duration}
                      onChange={(event) => updateLesson(lesson.id, { duration: event.target.value })}
                      className="auth-input"
                    />
                  </label>

                  <label className="flex items-center gap-3 pt-8">
                    <input
                      type="checkbox"
                      checked={lesson.isPreviewFree}
                      onChange={(event) =>
                        updateLesson(lesson.id, { isPreviewFree: event.target.checked })
                      }
                    />
                    <span className="text-sm font-medium text-slate-700">
                      Allow free preview for this lesson
                    </span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-3 md:col-span-2">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(event) => setIsPublished(event.target.checked)}
          />
          <span className="text-sm font-medium text-slate-700">Publish this course immediately</span>
        </label>
      </div>

      {error ? (
        <div className="mt-5 rounded-[22px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="mt-8 flex flex-wrap gap-3">
        <button type="submit" disabled={isSubmitting} className="primary-btn disabled:opacity-70">
          {isSubmitting ? "Creating course..." : "Create new course"}
        </button>
        <button type="button" onClick={() => router.back()} className="secondary-btn">
          Cancel
        </button>
      </div>
    </form>
  );
}
