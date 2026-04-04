"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { AuthUser, getDefaultRouteForRole, getRoleLabel, storeUser, UserRole } from "@/lib/auth";
import { loginUser, signupUser } from "@/lib/api";

type AuthMode = "login" | "signup";

type AuthFormProps = {
  mode: AuthMode;
};

const roleOptions: UserRole[] = ["student", "teacher"];

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const isSignup = mode === "signup";
  const [role, setRole] = useState<UserRole>("student");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");
  const [headline, setHeadline] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = isSignup
        ? await signupUser({
            name,
            email,
            mobileNumber,
            password,
            role,
            headline: headline.trim() || undefined,
          })
        : await loginUser({ email, password, role });

      storeUser(response.user as AuthUser);
      toast.success(
        isSignup
          ? "Account created successfully."
          : "Logged in successfully.",
      );
      if (!isSignup && !response.user.mobileNumber) {
        toast("Please add your mobile number in My Account to receive course updates.");
      }
      router.push(getDefaultRouteForRole(response.user));
      router.refresh();
    } catch (submissionError) {
      const message =
        submissionError instanceof Error
          ? submissionError.message
          : "Something went wrong. Please try again.";
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="section-space">
      <div className="app-container">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="panel subtle-grid overflow-hidden p-8 sm:p-10">
            <span className="pill-chip">{isSignup ? "Join the platform" : "Welcome back"}</span>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              {isSignup ? "Create your LMS account by role." : "Sign in to your learning workspace."}
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
              Choose whether you are learning as a student or managing classes as a teacher, then
              we&apos;ll take you to the right space.
            </p>

            <div className="mt-8 space-y-4">
              {roleOptions.map((option) => {
                const active = option === role;

                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setRole(option)}
                    className={`w-full rounded-[28px] border p-5 text-left transition ${
                      active
                        ? "border-slate-950 bg-slate-950 text-white shadow-[0_24px_60px_-30px_rgba(15,23,42,0.45)]"
                        : "border-slate-200 bg-white text-slate-800 hover:border-sky-200 hover:bg-sky-50/70"
                    }`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] opacity-80">
                      {getRoleLabel(option)}
                    </p>
                    <p className="mt-2 text-lg font-semibold">
                      {option === "teacher"
                        ? "Access your teaching dashboard and course controls."
                        : "Continue your enrolled courses and track progress."}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="mt-8 rounded-[28px] border border-slate-200 bg-white/80 p-5 text-sm leading-7 text-slate-600">
              Demo accounts already available:
              {" "}
              `teacher`: `educator@greatstack.dev` / `teacher123`
              {" "}
              and
              {" "}
              `student`: `donald@example.com` / `student123`
            </div>
          </div>

          <div className="panel p-8 sm:p-10">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">
                  {isSignup ? "Signup" : "Login"}
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                  {isSignup ? `Create a ${role} account` : `Login as ${role}`}
                </h2>
              </div>
              <Link href={isSignup ? "/login" : "/signup"} className="secondary-btn">
                {isSignup ? "Go to login" : "Create account"}
              </Link>
            </div>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              {isSignup ? (
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Full name</span>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="auth-input"
                    placeholder="Enter your full name"
                    required
                  />
                </label>
              ) : null}

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="auth-input"
                  placeholder={role === "teacher" ? "educator@greatstack.dev" : "donald@example.com"}
                  required
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="auth-input"
                  placeholder="Enter your password"
                  required
                />
              </label>

              {isSignup ? (
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Mobile number</span>
                  <input
                    value={mobileNumber}
                    onChange={(event) => setMobileNumber(event.target.value)}
                    className="auth-input"
                    placeholder="+1 555 000 1011"
                    required
                  />
                </label>
              ) : null}

              {isSignup ? (
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Headline</span>
                  <input
                    value={headline}
                    onChange={(event) => setHeadline(event.target.value)}
                    className="auth-input"
                    placeholder={
                      role === "teacher"
                        ? "Senior instructor in web development"
                        : "Student learning full stack development"
                    }
                  />
                </label>
              ) : null}

              {error ? (
                <div className="rounded-[22px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {error}
                </div>
              ) : null}

              <button type="submit" disabled={isSubmitting} className="primary-btn w-full disabled:opacity-70">
                {isSubmitting
                  ? isSignup
                    ? "Creating account..."
                    : "Signing in..."
                  : isSignup
                    ? `Create ${getRoleLabel(role)} account`
                    : `Login as ${getRoleLabel(role)}`}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
