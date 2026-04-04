"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  getLearnerOverview,
  getUserNotifications,
  getUserProfile,
  updateUserProfile,
  generateTwoFactorSecret,
  enableTwoFactor,
  disableTwoFactor,
} from "@/lib/api";
import {
  updateStoredUser,
} from "@/lib/auth";
import { UserNotification } from "@/lib/lms";
import { useAuthUser } from "@/lib/use-auth-user";

type ProfileFormState = {
  name: string;
  email: string;
  mobileNumber: string;
  headline: string;
  age: string;
  interests: string[];
  ongoingCourses: string[];
  timeNeeded: string;
};

function buildEmptyProfile(user: {
  _id: string;
  role: "student" | "teacher" | "admin";
  name: string;
  email: string;
  mobileNumber?: string;
  age?: number;
  interests?: string[];
  ongoingCourses?: string[];
  timeNeeded?: string;
  headline?: string;
}): ProfileFormState {
  return {
    name: user.name,
    email: user.email,
    mobileNumber: user.mobileNumber ?? "",
    headline: user.headline ?? "",
    age: user.age ? `${user.age}` : "",
    interests: user.interests ?? [],
    ongoingCourses: user.ongoingCourses ?? [],
    timeNeeded: user.timeNeeded ?? "",
  };
}

export function AccountProfile() {
  const currentUser = useAuthUser();
  const [form, setForm] = useState<ProfileFormState | null>(null);
  const [interestDraft, setInterestDraft] = useState("");
  const [courseDraft, setCourseDraft] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [twoFactorSecret, setTwoFactorSecret] = useState<string | null>(null);
  const [twoFactorQrCode, setTwoFactorQrCode] = useState<string | null>(null);
  const [twoFactorToken, setTwoFactorToken] = useState("");
  const [isTwoFactorLoading, setIsTwoFactorLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      if (!currentUser) {
        setForm(null);
        setNotifications([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const [remoteProfile, remoteNotifications] = await Promise.all([
        getUserProfile(currentUser._id),
        getUserNotifications(currentUser._id),
      ]);
      if (!cancelled) {
        setNotifications(remoteNotifications);
      }

      if (remoteProfile) {
        const remoteBase = buildEmptyProfile({
          ...currentUser,
          ...remoteProfile,
        });

        if (currentUser.role === "student") {
          const learnerOverview = await getLearnerOverview(currentUser._id);
          const seededProfile: ProfileFormState = {
            ...remoteBase,
            headline: remoteBase.headline || learnerOverview.learner.headline || "",
            interests:
              remoteBase.interests.length > 0
                ? remoteBase.interests
                : [...new Set(learnerOverview.enrolledCourses.map((course) => course.category))],
            ongoingCourses:
              remoteBase.ongoingCourses.length > 0
                ? remoteBase.ongoingCourses
                : learnerOverview.enrolledCourses.map((course) => course.courseTitle),
            timeNeeded: remoteBase.timeNeeded || learnerOverview.metrics.hoursRemaining,
          };

          if (!cancelled) {
            setForm(seededProfile);
            setIsLoading(false);
          }
          return;
        }

        if (!cancelled) {
          setForm(remoteBase);
          setIsLoading(false);
        }
        return;
      }

      const baseProfile = buildEmptyProfile(currentUser);

      if (currentUser.role === "student") {
        const learnerOverview = await getLearnerOverview(currentUser._id);
        const seededProfile: ProfileFormState = {
          ...baseProfile,
          headline: currentUser.headline ?? learnerOverview.learner.headline ?? "",
          interests: [...new Set(learnerOverview.enrolledCourses.map((course) => course.category))],
          ongoingCourses: learnerOverview.enrolledCourses.map((course) => course.courseTitle),
          timeNeeded: learnerOverview.metrics.hoursRemaining,
        };

        if (!cancelled) {
          setForm(seededProfile);
          setIsLoading(false);
        }

        return;
      }

      if (!cancelled) {
        setForm(baseProfile);
        setIsLoading(false);
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [currentUser]);

  const totalOngoingCourses = form?.ongoingCourses.length ?? 0;
  const totalInterests = form?.interests.length ?? 0;
  const profileCompletion = useMemo(() => {
    if (!form) {
      return 0;
    }

    const fields = [
      form.name.trim(),
      form.age.trim(),
      form.headline.trim(),
      form.timeNeeded.trim(),
      form.interests.length > 0 ? "yes" : "",
      form.ongoingCourses.length > 0 ? "yes" : "",
    ];

    return Math.round(
      (fields.filter(Boolean).length / fields.length) * 100,
    );
  }, [form]);

  function updateField<K extends keyof ProfileFormState>(field: K, value: ProfileFormState[K]) {
    setForm((current) => (current ? { ...current, [field]: value } : current));
  }

  function addListItem(field: "interests" | "ongoingCourses", value: string) {
    const cleaned = value.trim();

    if (!cleaned || !form) {
      return;
    }

    const existing = new Set(form[field].map((item) => item.toLowerCase()));

    if (existing.has(cleaned.toLowerCase())) {
      return;
    }

    updateField(field, [...form[field], cleaned]);
  }

  function removeListItem(field: "interests" | "ongoingCourses", value: string) {
    if (!form) {
      return;
    }

    updateField(
      field,
      form[field].filter((item) => item !== value),
    );
  }

  function handleAddInterest() {
    addListItem("interests", interestDraft);
    setInterestDraft("");
  }

  function handleAddCourse() {
    addListItem("ongoingCourses", courseDraft);
    setCourseDraft("");
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!currentUser || !form) {
      return;
    }

    const profileToSave = {
      name: form.name.trim(),
      email: form.email.trim(),
      mobileNumber: form.mobileNumber.trim(),
      headline: form.headline.trim(),
      age: form.age.trim(),
      interests: form.interests,
      ongoingCourses: form.ongoingCourses,
      timeNeeded: form.timeNeeded.trim(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const response = await updateUserProfile(currentUser._id, {
        name: profileToSave.name,
        email: profileToSave.email,
        mobileNumber: profileToSave.mobileNumber,
        age: profileToSave.age ? Number(profileToSave.age) : undefined,
        interests: profileToSave.interests,
        ongoingCourses: profileToSave.ongoingCourses,
        timeNeeded: profileToSave.timeNeeded || undefined,
        headline: profileToSave.headline || undefined,
      });

      updateStoredUser({
        name: response.user.name,
        email: response.user.email,
        mobileNumber: response.user.mobileNumber ?? profileToSave.mobileNumber,
        age: response.user.age,
        interests: response.user.interests ?? profileToSave.interests,
        ongoingCourses: response.user.ongoingCourses ?? profileToSave.ongoingCourses,
        timeNeeded:
          response.user.timeNeeded ?? (profileToSave.timeNeeded || undefined),
        headline: response.user.headline || undefined,
      });
      setForm((current) =>
        current
          ? {
              ...current,
              age: response.user.age ? `${response.user.age}` : "",
              interests: response.user.interests ?? current.interests,
              ongoingCourses: response.user.ongoingCourses ?? current.ongoingCourses,
              timeNeeded: response.user.timeNeeded ?? current.timeNeeded,
            }
          : current,
      );
      toast.success("Profile saved successfully.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not save your profile.",
      );
    }
  }

  async function handleGenerateTwoFactor() {
    if (!currentUser) return;

    setIsTwoFactorLoading(true);
    try {
      const response = await generateTwoFactorSecret(currentUser._id);
      setTwoFactorSecret(response.secret);
      setTwoFactorQrCode(response.qrCodeUrl);
      toast.success("2FA secret generated. Scan the QR code with your authenticator app.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate 2FA secret.");
    } finally {
      setIsTwoFactorLoading(false);
    }
  }

  async function handleEnableTwoFactor() {
    if (!currentUser || !twoFactorToken.trim()) return;

    setIsTwoFactorLoading(true);
    try {
      await enableTwoFactor(currentUser._id, twoFactorToken.trim());
      updateStoredUser({ twoFactorEnabled: true });
      setTwoFactorSecret(null);
      setTwoFactorQrCode(null);
      setTwoFactorToken("");
      toast.success("2FA enabled successfully.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to enable 2FA.");
    } finally {
      setIsTwoFactorLoading(false);
    }
  }

  async function handleDisableTwoFactor() {
    if (!currentUser || !twoFactorToken.trim()) return;

    setIsTwoFactorLoading(true);
    try {
      await disableTwoFactor(currentUser._id, twoFactorToken.trim());
      updateStoredUser({ twoFactorEnabled: false });
      setTwoFactorToken("");
      toast.success("2FA disabled successfully.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to disable 2FA.");
    } finally {
      setIsTwoFactorLoading(false);
    }
  }

  function formatNotificationType(type: UserNotification["type"]) {
    switch (type) {
      case "signup":
        return "Account";
      case "login":
        return "Login";
      case "enrollment":
        return "Enrollment";
      default:
        return "System";
    }
  }

  if (isLoading) {
    return (
      <section className="section-space">
        <div className="app-container">
          <div className="panel p-8 sm:p-10">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
              Loading your profile...
            </h1>
          </div>
        </div>
      </section>
    );
  }

  if (!currentUser || !form) {
    return (
      <section className="section-space">
        <div className="app-container">
          <div className="panel p-8 text-center sm:p-10">
            <span className="pill-chip">My account</span>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Sign in to manage your profile
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-600">
              Save your name, age, interests, ongoing courses, and study time so your learning space feels personal.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/login" className="primary-btn">
                Go to login
              </Link>
              <Link href="/signup" className="secondary-btn">
                Create account
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section-space">
      <div className="app-container">
        <div className="grid gap-8 xl:grid-cols-[0.72fr_1.28fr]">
          <aside className="panel p-6 sm:p-8">
            <span className="pill-chip">My account</span>
            <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Personalize your learning profile
            </h1>
            <p className="mt-4 text-base leading-8 text-slate-600">
              Keep your details updated so your dashboard reflects what you are learning right now.
            </p>

            <div className="mt-8 space-y-4">
              <div className="rounded-[24px] bg-slate-950 p-5 text-white">
                <p className="text-sm text-slate-300">Profile completion</p>
                <strong className="mt-2 block text-4xl font-semibold">{profileCompletion}%</strong>
              </div>
              <div className="rounded-[24px] border border-slate-200 bg-white p-5">
                <p className="text-sm text-slate-500">Interests saved</p>
                <strong className="mt-2 block text-3xl font-semibold text-slate-950">
                  {totalInterests}
                </strong>
              </div>
              <div className="rounded-[24px] border border-slate-200 bg-white p-5">
                <p className="text-sm text-slate-500">Ongoing courses</p>
                <strong className="mt-2 block text-3xl font-semibold text-slate-950">
                  {totalOngoingCourses}
                </strong>
              </div>
              <div className="rounded-[24px] border border-slate-200 bg-white p-5">
                <p className="text-sm text-slate-500">Time needed</p>
                <strong className="mt-2 block text-3xl font-semibold text-slate-950">
                  {form.timeNeeded || "Not set"}
                </strong>
              </div>
            </div>
          </aside>

          <div className="panel p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Editable profile
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                  Your saved account details
                </h2>
              </div>
            </div>

            <form className="mt-8 space-y-8" onSubmit={handleSave}>
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Name</span>
                  <input
                    value={form.name}
                    onChange={(event) => updateField("name", event.target.value)}
                    className="auth-input"
                    placeholder="Your full name"
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Age</span>
                  <input
                    value={form.age}
                    onChange={(event) => updateField("age", event.target.value)}
                    className="auth-input"
                    placeholder="Your age"
                  />
                </label>

                <label className="block sm:col-span-2">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Email</span>
                  <input
                    value={form.email}
                    onChange={(event) => updateField("email", event.target.value)}
                    className="auth-input"
                    placeholder="Email address"
                    required
                  />
                </label>

                <label className="block sm:col-span-2">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Mobile number</span>
                  <input
                    value={form.mobileNumber}
                    onChange={(event) => updateField("mobileNumber", event.target.value)}
                    className="auth-input"
                    placeholder="+1 555 000 1011"
                    required
                  />
                </label>

                <label className="block sm:col-span-2">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Headline</span>
                  <input
                    value={form.headline}
                    onChange={(event) => updateField("headline", event.target.value)}
                    className="auth-input"
                    placeholder="Student learning full stack development"
                  />
                </label>

                <label className="block sm:col-span-2">
                  <span className="mb-2 block text-sm font-medium text-slate-700">How much time do you need?</span>
                  <input
                    value={form.timeNeeded}
                    onChange={(event) => updateField("timeNeeded", event.target.value)}
                    className="auth-input"
                    placeholder="For example: 6h per week or 12h 30m remaining"
                  />
                </label>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-slate-50/60 p-5">
                <div className="flex flex-wrap items-end gap-3">
                  <label className="min-w-0 flex-1">
                    <span className="mb-2 block text-sm font-medium text-slate-700">Interests</span>
                    <input
                      value={interestDraft}
                      onChange={(event) => setInterestDraft(event.target.value)}
                      className="auth-input"
                      placeholder="Add an interest like React, Design, Python..."
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleAddInterest}
                    className="secondary-btn"
                  >
                    Add interest
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {form.interests.length > 0 ? (
                    form.interests.map((interest) => (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => removeListItem("interests", interest)}
                        className="rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-700 transition hover:border-sky-300"
                      >
                        {interest} ×
                      </button>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">No interests added yet.</p>
                  )}
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-slate-50/60 p-5">
                <div className="flex flex-wrap items-end gap-3">
                  <label className="min-w-0 flex-1">
                    <span className="mb-2 block text-sm font-medium text-slate-700">Ongoing courses</span>
                    <input
                      value={courseDraft}
                      onChange={(event) => setCourseDraft(event.target.value)}
                      className="auth-input"
                      placeholder="Add a course you are currently taking"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleAddCourse}
                    className="secondary-btn"
                  >
                    Add course
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  {form.ongoingCourses.length > 0 ? (
                    form.ongoingCourses.map((course) => (
                      <div
                        key={course}
                        className="flex items-center justify-between gap-3 rounded-[22px] border border-slate-200 bg-white px-4 py-3"
                      >
                        <span className="text-sm font-medium text-slate-700">{course}</span>
                        <button
                          type="button"
                          onClick={() => removeListItem("ongoingCourses", course)}
                          className="text-sm font-medium text-rose-600 transition hover:text-rose-700"
                        >
                          Remove
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">No ongoing courses added yet.</p>
                  )}
                </div>
              </div>

              <button type="submit" className="primary-btn">
                Save profile
              </button>
            </form>
          </div>
        </div>

        <div className="mt-8 panel p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
              Two-Factor Authentication
            </h2>
            <p className="mt-2 text-slate-600">
              Add an extra layer of security to your account with 2FA using an authenticator app.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-slate-900">
                  {currentUser.twoFactorEnabled ? "2FA is enabled" : "2FA is disabled"}
                </h3>
                <p className="text-sm text-slate-600">
                  {currentUser.twoFactorEnabled
                    ? "Your account is protected with two-factor authentication."
                    : "Enable 2FA to secure your account with a time-based code."}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full ${currentUser.twoFactorEnabled ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <span className="text-sm font-medium">
                  {currentUser.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>

            {!currentUser.twoFactorEnabled && !twoFactorSecret && (
              <button
                onClick={handleGenerateTwoFactor}
                disabled={isTwoFactorLoading}
                className="primary-btn"
              >
                {isTwoFactorLoading ? "Generating..." : "Enable 2FA"}
              </button>
            )}

            {twoFactorQrCode && (
              <div className="rounded-[28px] border border-slate-200 bg-slate-50/60 p-6">
                <h4 className="text-lg font-medium text-slate-900 mb-4">Scan QR Code</h4>
                <p className="text-sm text-slate-600 mb-4">
                  Scan this QR code with your authenticator app (like Google Authenticator, Authy, or Microsoft Authenticator).
                </p>
                <div className="flex justify-center mb-4">
                  <img src={twoFactorQrCode} alt="2FA QR Code" className="max-w-48 max-h-48" />
                </div>
                <p className="text-xs text-slate-500 mb-4">
                  Manual entry code: {twoFactorSecret}
                </p>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={twoFactorToken}
                    onChange={(e) => setTwoFactorToken(e.target.value)}
                    placeholder="Enter 6-digit code"
                    className="auth-input flex-1"
                    maxLength={6}
                  />
                  <button
                    onClick={handleEnableTwoFactor}
                    disabled={isTwoFactorLoading || twoFactorToken.length !== 6}
                    className="primary-btn"
                  >
                    {isTwoFactorLoading ? "Enabling..." : "Enable 2FA"}
                  </button>
                </div>
              </div>
            )}

            {currentUser.twoFactorEnabled && (
              <div className="rounded-[28px] border border-slate-200 bg-slate-50/60 p-6">
                <h4 className="text-lg font-medium text-slate-900 mb-4">Disable 2FA</h4>
                <p className="text-sm text-slate-600 mb-4">
                  Enter your current 2FA code to disable two-factor authentication.
                </p>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={twoFactorToken}
                    onChange={(e) => setTwoFactorToken(e.target.value)}
                    placeholder="Enter 6-digit code"
                    className="auth-input flex-1"
                    maxLength={6}
                  />
                  <button
                    onClick={handleDisableTwoFactor}
                    disabled={isTwoFactorLoading || twoFactorToken.length !== 6}
                    className="secondary-btn !bg-red-50 !text-red-700 !border-red-200 hover:!bg-red-100"
                  >
                    {isTwoFactorLoading ? "Disabling..." : "Disable 2FA"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 panel p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
              Notification Center
            </h2>
            <p className="mt-2 text-slate-600">
              Activity updates saved in MongoDB for your account.
            </p>
          </div>

          <div className="space-y-4">
            {notifications.length > 0 ? (
              notifications.map((item) => (
                <article
                  key={item._id}
                  className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                          {formatNotificationType(item.type)}
                        </span>
                        <strong className="text-base font-semibold text-slate-950">
                          {item.title}
                        </strong>
                      </div>
                      <p className="mt-2 text-sm leading-7 text-slate-600">
                        {item.message}
                      </p>
                    </div>
                    <span className="text-sm text-slate-400">
                      {item.createdAtLabel ??
                        (item.createdAt
                          ? new Date(item.createdAt).toLocaleString()
                          : "Just now")}
                    </span>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-5 text-sm text-slate-500">
                No notifications yet. Signup, login, and course enrollment events will appear here.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
