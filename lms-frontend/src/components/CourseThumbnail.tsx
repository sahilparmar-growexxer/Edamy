"use client";

import { useState } from "react";
import { resolveAsset } from "@/lib/lms";

type CourseThumbnailProps = {
  title: string;
  thumbnail?: string;
  thumbnailKey?: string;
  className?: string;
};

export function CourseThumbnail({
  title,
  thumbnail,
  thumbnailKey,
  className,
}: CourseThumbnailProps) {
  const fallbackSrc = resolveAsset(thumbnailKey);
  const preferredSrc = resolveAsset(thumbnailKey, thumbnail);
  const [src, setSrc] = useState(preferredSrc);

  return (
    <img
      src={src}
      alt={title}
      loading="lazy"
      className={className}
      onError={() => {
        if (src !== fallbackSrc) {
          setSrc(fallbackSrc);
        }
      }}
    />
  );
}
