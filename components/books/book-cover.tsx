"use client";

import { BookOpen } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const COVER_HOSTS = new Set(["books.google.com", "books.googleusercontent.com"]);

function getCoverSrc(src: string) {
  try {
    const url = new URL(src);
    if (url.protocol === "https:" && COVER_HOSTS.has(url.hostname)) {
      return `/api/book-cover?url=${encodeURIComponent(url.toString())}`;
    }
  } catch {
    return src;
  }

  return src;
}

export function BookCover({ src, title, className, priority = false, sizes = "80px" }: {
  src: string | null;
  title: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);

  useEffect(() => {
    setFailedSrc(null);
    setLoadedSrc(null);
  }, [src]);

  const imageSrc = src ? getCoverSrc(src) : null;
  const isLoading = Boolean(imageSrc && failedSrc !== src && loadedSrc !== src);

  return (
    <div className={cn("relative flex aspect-[2/3] items-center justify-center overflow-hidden rounded-md bg-muted", className)}>
      {src && failedSrc !== src ? (
        <>
          {isLoading && <div className="absolute inset-0 animate-pulse bg-muted-foreground/10" aria-hidden="true" />}
          <Image
          src={imageSrc ?? src}
          alt={`Cover of ${title}`}
          fill
          unoptimized
          priority={priority}
          loading={priority ? "eager" : "lazy"}
          sizes={sizes}
          className="object-contain"
          onLoad={() => setLoadedSrc(src)}
          onError={() => {
            setFailedSrc(src);
            setLoadedSrc(null);
          }}
          />
        </>
      ) : (
        <div className="flex flex-col items-center gap-2 p-3 text-center text-muted-foreground">
          <BookOpen className="size-8" aria-hidden="true" />
          <span className="text-xs">No cover available</span>
        </div>
      )}
    </div>
  );
}
