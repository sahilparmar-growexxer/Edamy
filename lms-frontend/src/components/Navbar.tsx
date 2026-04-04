"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { assets } from "@/assets/assets";
import { clearStoredUser } from "@/lib/auth";
import { useAuthUser } from "@/lib/use-auth-user";

type NavbarProps = {
  active?: "home" | "courses" | "my-courses" | "educator" | "account";
};

export function Navbar({ active }: NavbarProps) {
  const router = useRouter();
  const currentUser = useAuthUser();

  const links = [
    { href: "/", label: "Home", key: "home" },
    { href: "/courses", label: "All Courses", key: "courses" },
    {
      href:
        currentUser?.role === "student"
          ? `/my-courses?studentId=${encodeURIComponent(currentUser._id)}`
          : "/my-courses",
      label: "My Courses",
      key: "my-courses",
    },
    {
      href:
        currentUser?.role === "teacher"
          ? `/educator/dashboard?educatorId=${encodeURIComponent(currentUser._id)}`
          : "/educator/dashboard",
      label: "Educator",
      key: "educator",
    },
  ] as const;

  return (
    <header className="sticky top-0 z-50 border-b border-white/60 bg-white/75 backdrop-blur-xl">
      <div className="app-container flex flex-col gap-4 py-4 lg:flex-row lg:items-center lg:justify-between">
        <Link href="/" aria-label="GreatStack LMS home">
          <Image src={assets.logo} alt="GreatStack Logo" width={140} priority />
        </Link>

        <nav
          className="flex flex-wrap items-center gap-2 rounded-full border border-slate-200/80 bg-white/90 p-1.5 shadow-sm"
          aria-label="Primary navigation"
        >
          {links.map((link) => {
            const isActive = active === link.key;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-slate-950 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          {currentUser ? (
            <>
              <Link
                href="/account"
                className="hidden rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 md:inline-flex"
              >
                My Account
              </Link>
              <button
                className="primary-btn"
                type="button"
                onClick={() => {
                  clearStoredUser();
                  toast.success("Logged out successfully.");
                  router.push("/");
                  router.refresh();
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 md:inline-flex"
              >
                Sign in
              </Link>
              <Link href="/signup" className="primary-btn">
                Create Account
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
