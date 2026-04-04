import Image from "next/image";
import { assets } from "@/assets/assets";

type RatingStarsProps = {
  rating: number; // 0..5 (supports halves)
  size?: number;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function RatingStars({ rating, size = 16 }: RatingStarsProps) {
  const r = clamp(rating, 0, 5);
  const full = Math.floor(r);
  const hasHalf = r - full >= 0.5;
  const empty = 5 - full - (hasHalf ? 1 : 0);

  return (
    <span className="inline-flex items-center gap-1" aria-label={`${r.toFixed(1)} out of 5`}>
      {Array.from({ length: full }).map((_, i) => (
        <Image
          key={`f-${i}`}
          src={assets.star}
          alt=""
          width={size}
          height={size}
        />
      ))}
      {hasHalf ? (
        <span className="relative inline-flex overflow-hidden" aria-hidden="true">
          <Image src={assets.star} alt="" width={size} height={size} />
          <span className="absolute inset-y-0 right-0 overflow-hidden">
            <Image src={assets.star_blank} alt="" width={size} height={size} />
          </span>
        </span>
      ) : null}
      {Array.from({ length: empty }).map((_, i) => (
        <Image
          key={`e-${i}`}
          src={assets.star_blank}
          alt=""
          width={size}
          height={size}
        />
      ))}
    </span>
  );
}

