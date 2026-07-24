"use client";

import { User } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { cn } from "~/lib/utils";

export function RecipeAuthorLink({
  href,
  name,
  image,
  ariaLabel,
  compact = false,
}: {
  href: string;
  name: string;
  image: string | null;
  ariaLabel: string;
  compact?: boolean;
}) {
  const [imageError, setImageError] = useState(false);
  const trimmedImage = image?.trim() ?? null;
  const showImage = Boolean(trimmedImage) && !imageError;

  useEffect(() => {
    setImageError(false);
  }, [trimmedImage]);

  return (
    <Link
      href={href}
      className={cn(
        "hover:text-primary flex min-w-0 items-center gap-2 transition-colors hover:underline",
        compact && "gap-1.5",
      )}
      aria-label={ariaLabel}
      onClick={(event) => event.stopPropagation()}
    >
      <div
        className={cn(
          "bg-muted flex shrink-0 items-center justify-center overflow-hidden rounded-full",
          compact ? "size-6" : "size-8",
        )}
      >
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={trimmedImage!}
            alt=""
            referrerPolicy="no-referrer"
            className="size-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <User
            className={cn(
              "text-muted-foreground",
              compact ? "size-3" : "size-4",
            )}
            aria-hidden
          />
        )}
      </div>
      <span
        className={cn(
          "min-w-0 truncate font-medium",
          compact && "text-xs font-normal",
        )}
      >
        {name}
      </span>
    </Link>
  );
}
