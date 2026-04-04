import Image from "next/image";
import Link from "next/link";
import { assets } from "@/assets/assets";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200/70 bg-white/80 py-16 backdrop-blur">
      <div className="app-container grid gap-10 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
        <div className="space-y-5">
          <Image src={assets.logo_dark} alt="GreatStack" width={124} />
          <p className="max-w-md text-sm leading-7 text-slate-600">
            We bring together world-class instructors, interactive content, and a
            supportive community to help you achieve your personal and
            professional goals.
          </p>
          <div className="flex gap-3">
            <div className="rounded-full bg-sky-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
              Learn faster
            </div>
            <div className="rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
              Build confidently
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Company</h4>
          <div className="flex flex-col gap-3 text-sm text-slate-600">
            <Link href="/" className="transition hover:text-slate-950">Home</Link>
            <Link href="#" className="transition hover:text-slate-950">About us</Link>
            <Link href="#" className="transition hover:text-slate-950">Contact us</Link>
            <Link href="#" className="transition hover:text-slate-950">Privacy policy</Link>
          </div>
        </div>
        <div className="space-y-4">
          <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Get in touch</h4>
          <p className="text-sm leading-7 text-slate-600">
            Questions, partnerships, or educator inquiries. We would love to hear from you.
          </p>
          <div className="flex gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
              <Image src={assets.facebook_icon} alt="Facebook" width={20} />
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
              <Image src={assets.twitter_icon} alt="Twitter" width={20} />
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
              <Image src={assets.instagram_icon} alt="Instagram" width={20} />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

