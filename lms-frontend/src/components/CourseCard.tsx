import Link from "next/link";
import { CourseThumbnail } from "@/components/CourseThumbnail";
import { RatingStars } from "@/components/RatingStars";

type CourseCardProps = {
  id: string;
  title: string;
  thumbnail?: string;
  thumbnailKey?: string;
  price: number;
  educatorName?: string;
  rating?: number;
  ratingsCount?: number;
  progressPercent?: number;
};

export function CourseCard({
  id,
  title,
  thumbnail,
  thumbnailKey,
  price,
  educatorName = "GreatStack Educator",
  rating = 5,
  ratingsCount = 15,
  progressPercent,
}: CourseCardProps) {
  const original = price * 1.5;
  return (
    <Link
      href={`/course/${id}`}
      className="group flex h-full flex-col overflow-hidden rounded-[30px] border border-slate-200/70 bg-white/95 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.35)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_26px_70px_-34px_rgba(14,165,233,0.4)]"
      aria-label={title}
    >
      <div className="relative overflow-hidden">
        <CourseThumbnail
          title={title}
          thumbnail={thumbnail}
          thumbnailKey={thumbnailKey}
          className="w-full"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 via-transparent to-transparent opacity-70 transition group-hover:opacity-100" />
        <div className="absolute left-4 top-4 rounded-full border border-white/40 bg-white/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-700 backdrop-blur">
          Learn now
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-4 p-5 sm:p-6">
        <div>
          <h3 className="line-clamp-2 text-lg font-semibold tracking-tight text-slate-950">
            {title}
          </h3>
          <div className="mt-2 text-sm text-slate-500">By {educatorName}</div>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <RatingStars rating={rating} />
          <span className="font-semibold text-slate-900">{rating.toFixed(1)}</span>
          <span>({ratingsCount} ratings)</span>
        </div>
        {typeof progressPercent === "number" ? (
          <div className="mt-1 grid gap-2">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span>Progress</span>
              <strong className="text-slate-950">{progressPercent}%</strong>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
              <span
                className="block h-full rounded-full bg-gradient-to-r from-slate-950 via-sky-700 to-cyan-400"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        ) : null}
        <div className="mt-auto flex items-end justify-between gap-4 border-t border-slate-100 pt-4">
          <div>
            <span className="block text-2xl font-semibold tracking-tight text-slate-950">
              ${price.toFixed(2)}
            </span>
            <span className="text-sm text-slate-400 line-through">${original.toFixed(2)}</span>
          </div>
          <span className="rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition group-hover:bg-sky-700">
            Details
          </span>
        </div>
      </div>
    </Link>
  );
}

