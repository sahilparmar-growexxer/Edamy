"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { getCourseQuizManagerData, updateCourseQuizzes } from "@/lib/api";
import { useAuthUser } from "@/lib/use-auth-user";

type QuizQuestionDraft = {
  questionId: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
};

type QuizDraft = {
  quizId: string;
  title: string;
  description: string;
  questions: QuizQuestionDraft[];
};

type CourseQuizBuilderProps = {
  courseId: string;
  educatorId?: string;
};

function createQuizId() {
  return `quiz_${Date.now()}`;
}

function createQuestionId(quizId: string, index: number) {
  return `${quizId}_q_${index + 1}`;
}

export function CourseQuizBuilder({ courseId, educatorId }: CourseQuizBuilderProps) {
  const currentUser = useAuthUser();
  const [quizzes, setQuizzes] = useState<QuizDraft[]>([]);
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const canManage =
    currentUser?.role === "teacher" &&
    Boolean(educatorId) &&
    currentUser?._id === educatorId;

  const activeQuiz = useMemo(
    () => quizzes.find((quiz) => quiz.quizId === activeQuizId) ?? null,
    [quizzes, activeQuizId],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadQuizzes() {
      if (!currentUser?._id) return;
      const response = await getCourseQuizManagerData(courseId, currentUser._id);
      if (cancelled) return;

      const normalized = response.quizzes.map((quiz) => ({
        quizId: quiz.quizId,
        title: quiz.title,
        description: quiz.description ?? "",
        questions: quiz.questions.map((question) => ({
          questionId: question.questionId,
          question: question.question,
          options: [...question.options],
          correctOptionIndex: question.correctOptionIndex,
        })),
      }));

      setQuizzes(normalized);
      setActiveQuizId(normalized[0]?.quizId ?? null);
    }

    if (canManage) {
      loadQuizzes().catch(() => {
        if (!cancelled) {
          setQuizzes([]);
        }
      });
    }

    return () => {
      cancelled = true;
    };
  }, [canManage, courseId, currentUser?._id]);

  if (!canManage) {
    return null;
  }

  function handleAddQuiz() {
    const quizId = createQuizId();
    const newQuiz: QuizDraft = {
      quizId,
      title: "New quiz",
      description: "",
      questions: [
        {
          questionId: createQuestionId(quizId, 0),
          question: "",
          options: ["", "", "", ""],
          correctOptionIndex: 0,
        },
      ],
    };

    setQuizzes((prev) => [...prev, newQuiz]);
    setActiveQuizId(quizId);
  }

  function handleQuizFieldChange(
    quizId: string,
    field: "title" | "description",
    value: string,
  ) {
    setQuizzes((prev) =>
      prev.map((quiz) => (quiz.quizId === quizId ? { ...quiz, [field]: value } : quiz)),
    );
  }

  function handleQuestionChange(
    quizId: string,
    questionId: string,
    field: "question",
    value: string,
  ) {
    setQuizzes((prev) =>
      prev.map((quiz) => {
        if (quiz.quizId !== quizId) return quiz;
        return {
          ...quiz,
          questions: quiz.questions.map((question) =>
            question.questionId === questionId ? { ...question, [field]: value } : question,
          ),
        };
      }),
    );
  }

  function handleOptionChange(
    quizId: string,
    questionId: string,
    optionIndex: number,
    value: string,
  ) {
    setQuizzes((prev) =>
      prev.map((quiz) => {
        if (quiz.quizId !== quizId) return quiz;
        return {
          ...quiz,
          questions: quiz.questions.map((question) => {
            if (question.questionId !== questionId) return question;
            const nextOptions = [...question.options];
            nextOptions[optionIndex] = value;
            return { ...question, options: nextOptions };
          }),
        };
      }),
    );
  }

  function handleCorrectOptionChange(
    quizId: string,
    questionId: string,
    value: number,
  ) {
    setQuizzes((prev) =>
      prev.map((quiz) => {
        if (quiz.quizId !== quizId) return quiz;
        return {
          ...quiz,
          questions: quiz.questions.map((question) =>
            question.questionId === questionId
              ? { ...question, correctOptionIndex: value }
              : question,
          ),
        };
      }),
    );
  }

  function handleAddQuestion(quizId: string) {
    setQuizzes((prev) =>
      prev.map((quiz) => {
        if (quiz.quizId !== quizId) return quiz;
        const nextIndex = quiz.questions.length;
        return {
          ...quiz,
          questions: [
            ...quiz.questions,
            {
              questionId: createQuestionId(quizId, nextIndex),
              question: "",
              options: ["", "", "", ""],
              correctOptionIndex: 0,
            },
          ],
        };
      }),
    );
  }

  async function handleSave() {
    if (!currentUser?._id) {
      toast.error("Sign in as a teacher to save quizzes.");
      return;
    }

    if (quizzes.length === 0) {
      toast.error("Add at least one quiz.");
      return;
    }

    setIsSaving(true);

    try {
      const sanitized = quizzes.map((quiz) => ({
        quizId: quiz.quizId,
        title: quiz.title.trim() || "Untitled quiz",
        description: quiz.description.trim(),
        questions: quiz.questions.map((question) => ({
          questionId: question.questionId,
          question: question.question.trim() || "Untitled question",
          options: question.options.map((option) => option.trim()),
          correctOptionIndex: question.correctOptionIndex,
        })),
      }));

      const response = await updateCourseQuizzes(courseId, {
        educatorId: currentUser._id,
        quizzes: sanitized,
      });

      toast.success(response.message || "Quizzes updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update quizzes.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="panel mt-8 p-6 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="pill-chip">Teacher tools</span>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
            Manage course quizzes
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Add or update quiz questions for this course.
          </p>
        </div>
        <button type="button" onClick={handleAddQuiz} className="secondary-btn">
          Add quiz
        </button>
      </div>

      {quizzes.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">No quizzes yet. Add your first quiz.</p>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[220px_1fr]">
          <div className="space-y-2">
            {quizzes.map((quiz) => (
              <button
                key={quiz.quizId}
                type="button"
                onClick={() => setActiveQuizId(quiz.quizId)}
                className={`w-full rounded-2xl border px-4 py-3 text-left text-sm ${
                  activeQuizId === quiz.quizId
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-600"
                }`}
              >
                {quiz.title || "Untitled quiz"}
              </button>
            ))}
          </div>

          {activeQuiz ? (
            <div className="rounded-[28px] border border-slate-200 bg-white p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium text-slate-700">
                  Quiz title
                  <input
                    value={activeQuiz.title}
                    onChange={(event) =>
                      handleQuizFieldChange(activeQuiz.quizId, "title", event.target.value)
                    }
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700"
                  />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Description
                  <input
                    value={activeQuiz.description}
                    onChange={(event) =>
                      handleQuizFieldChange(activeQuiz.quizId, "description", event.target.value)
                    }
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700"
                  />
                </label>
              </div>

              <div className="mt-5 space-y-5">
                {activeQuiz.questions.map((question, index) => (
                  <div key={question.questionId} className="rounded-2xl border border-slate-200 p-4">
                    <label className="text-sm font-medium text-slate-700">
                      Question {index + 1}
                      <input
                        value={question.question}
                        onChange={(event) =>
                          handleQuestionChange(
                            activeQuiz.quizId,
                            question.questionId,
                            "question",
                            event.target.value,
                          )
                        }
                        className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700"
                      />
                    </label>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {question.options.map((option, optionIndex) => (
                        <label key={`${question.questionId}_${optionIndex}`} className="text-sm text-slate-600">
                          Option {optionIndex + 1}
                          <input
                            value={option}
                            onChange={(event) =>
                              handleOptionChange(
                                activeQuiz.quizId,
                                question.questionId,
                                optionIndex,
                                event.target.value,
                              )
                            }
                            className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700"
                          />
                        </label>
                      ))}
                    </div>

                    <label className="mt-4 flex flex-col text-sm font-medium text-slate-700">
                      Correct option
                      <select
                        value={question.correctOptionIndex}
                        onChange={(event) =>
                          handleCorrectOptionChange(
                            activeQuiz.quizId,
                            question.questionId,
                            Number(event.target.value),
                          )
                        }
                        className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700"
                      >
                        {question.options.map((_, optionIndex) => (
                          <option key={`${question.questionId}_correct_${optionIndex}`} value={optionIndex}>
                            Option {optionIndex + 1}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={() => handleAddQuestion(activeQuiz.quizId)}
                  className="secondary-btn"
                >
                  Add question
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="primary-btn disabled:opacity-70"
                >
                  {isSaving ? "Saving..." : "Save quizzes"}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
