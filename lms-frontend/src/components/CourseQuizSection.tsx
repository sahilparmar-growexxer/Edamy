"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { getCourseQuizzes, getCourseQuizResults, submitCourseQuizAttempt } from "@/lib/api";
import { CourseQuiz, CourseQuizAttempt } from "@/lib/lms";
import { readStoredUser } from "@/lib/auth";

type CourseQuizSectionProps = {
  courseId: string;
};

type QuizAnswerMap = Record<string, number>;
type QuizAnswerState = Record<string, QuizAnswerMap>;
type QuizResultState = Record<string, CourseQuizAttempt[]>;
type QuizSubmittingState = Record<string, boolean>;

export function CourseQuizSection({ courseId }: CourseQuizSectionProps) {
  const [quizzes, setQuizzes] = useState<CourseQuiz[]>([]);
  const [results, setResults] = useState<QuizResultState>({});
  const [answers, setAnswers] = useState<QuizAnswerState>({});
  const [submitting, setSubmitting] = useState<QuizSubmittingState>({});

  const currentUser = useMemo(() => readStoredUser(), []);

  useEffect(() => {
    let isMounted = true;

    async function loadQuizzes() {
      const response = await getCourseQuizzes(courseId);
      if (!isMounted) return;
      setQuizzes(response.quizzes ?? []);

      if (currentUser?._id) {
        const resultsEntries = await Promise.all(
          (response.quizzes ?? []).map(async (quiz) => {
            const result = await getCourseQuizResults(courseId, quiz.quizId, currentUser._id);
            return [quiz.quizId, result.attempts ?? []] as const;
          }),
        );

        if (!isMounted) return;
        setResults(Object.fromEntries(resultsEntries));
      }
    }

    loadQuizzes().catch(() => {
      if (isMounted) {
        setQuizzes([]);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [courseId, currentUser?._id]);

  function handleSelectAnswer(quizId: string, questionId: string, selectedIndex: number) {
    setAnswers((prev) => ({
      ...prev,
      [quizId]: {
        ...(prev[quizId] ?? {}),
        [questionId]: selectedIndex,
      },
    }));
  }

  async function handleSubmitQuiz(quiz: CourseQuiz) {
    const user = readStoredUser();

    if (!user) {
      toast("Please sign in to attempt the quiz.");
      return;
    }

    if (user.role !== "student") {
      toast.error("Only students can attempt quizzes.");
      return;
    }

    const quizAnswers = answers[quiz.quizId] ?? {};
    const missing = quiz.questions.filter((q) => quizAnswers[q.questionId] === undefined);

    if (missing.length > 0) {
      toast.error("Answer every question before submitting.");
      return;
    }

    setSubmitting((prev) => ({ ...prev, [quiz.quizId]: true }));

    try {
      const response = await submitCourseQuizAttempt(courseId, quiz.quizId, {
        studentId: user._id,
        answers: quiz.questions.map((question) => ({
          questionId: question.questionId,
          selectedIndex: quizAnswers[question.questionId],
        })),
      });

      toast.success(response.message || "Quiz submitted.");

      setResults((prev) => ({
        ...prev,
        [quiz.quizId]: [response.result, ...(prev[quiz.quizId] ?? [])],
      }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not submit quiz.");
    } finally {
      setSubmitting((prev) => ({ ...prev, [quiz.quizId]: false }));
    }
  }

  if (quizzes.length === 0) {
    return (
      <div className="panel p-6 sm:p-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Quiz</h2>
          <p className="text-slate-500">Quizzes will appear here once they are published.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="panel p-6 sm:p-8">
      <div className="mb-6 flex flex-col gap-2">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Quiz</h2>
        <p className="text-slate-500">Test your knowledge and track your results.</p>
      </div>

      <div className="space-y-6">
        {quizzes.map((quiz) => {
          const latestAttempt = results[quiz.quizId]?.[0];
          const quizAnswers = answers[quiz.quizId] ?? {};

          return (
            <div key={quiz.quizId} className="rounded-[26px] border border-slate-200 bg-slate-50/70 p-5">
              <div className="flex flex-col gap-2">
                <h3 className="text-lg font-semibold text-slate-950">{quiz.title}</h3>
                {quiz.description ? <p className="text-sm text-slate-500">{quiz.description}</p> : null}
              </div>

              {latestAttempt ? (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <p className="text-sm font-semibold text-slate-950">
                    Latest result: {latestAttempt.score} / {latestAttempt.total}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Submitted {new Date(latestAttempt.submittedAt).toLocaleString()}
                  </p>
                </div>
              ) : null}

              <div className="mt-5 space-y-5">
                {quiz.questions.map((question, index) => {
                  const selectedIndex = quizAnswers[question.questionId];
                  const attemptAnswer = latestAttempt?.answers.find(
                    (answer) => answer.questionId === question.questionId,
                  );
                  const showResult = Boolean(attemptAnswer);

                  return (
                    <div key={question.questionId} className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-sm font-semibold text-slate-950">
                        {index + 1}. {question.question}
                      </p>
                      <div className="mt-3 space-y-2">
                        {question.options.map((option, optionIndex) => {
                          const isSelected = selectedIndex === optionIndex;
                          const isCorrect = attemptAnswer?.correctIndex === optionIndex;
                          const isWrongSelection =
                            showResult && isSelected && attemptAnswer?.correctIndex !== optionIndex;

                          return (
                            <label
                              key={`${question.questionId}_${optionIndex}`}
                              className={`flex cursor-pointer items-start gap-2 rounded-xl border px-3 py-2 text-sm ${
                                isCorrect
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                  : isWrongSelection
                                    ? "border-rose-200 bg-rose-50 text-rose-600"
                                    : "border-slate-200 text-slate-600"
                              }`}
                            >
                              <input
                                type="radio"
                                name={`${quiz.quizId}_${question.questionId}`}
                                className="mt-1"
                                disabled={submitting[quiz.quizId]}
                                checked={isSelected}
                                onChange={() => handleSelectAnswer(quiz.quizId, question.questionId, optionIndex)}
                              />
                              <span>{option}</span>
                            </label>
                          );
                        })}
                      </div>
                      {showResult ? (
                        <p className="mt-3 text-xs text-slate-500">
                          {attemptAnswer?.isCorrect ? "Correct answer." : "Review the correct option above."}
                        </p>
                      ) : null}
                    </div>
                  );
                })}
              </div>

              <div className="mt-5">
                <button
                  type="button"
                  onClick={() => handleSubmitQuiz(quiz)}
                  disabled={submitting[quiz.quizId]}
                  className="secondary-btn w-full disabled:opacity-70"
                >
                  {submitting[quiz.quizId] ? "Submitting..." : "Submit quiz"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
