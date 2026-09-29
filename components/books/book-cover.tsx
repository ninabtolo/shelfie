"use client";

import { BookOpen } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function BookCover({ src, title, className }: {
  src: string | null;
  title: string;
  className?: string;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  return (
    <div className={cn("relative flex aspect-[2/3] items-center justify-center overflow-hidden rounded-md bg-muted", className)}>
      {src && failedSrc !== src ? (
        <Image
          src={src}
          alt={`Cover of ${title}`}
          fill
          unoptimized
          className="object-contain"
          onError={() => setFailedSrc(src)}
        />
      ) : (
        <div className="flex flex-col items-center gap-2 p-3 text-center text-muted-foreground">
          <BookOpen className="size-8" aria-hidden="true" />
          <span className="text-xs">No cover available</span>
        </div>
      )}
    </div>
  );
}
