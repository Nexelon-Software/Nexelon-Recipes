"use client";

import { User } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export function RecipeAuthorLink({
  href,
  name,
  image,
  ariaLabel,
}: {
  href: string;
  name: string;
  image: string | null;
  ariaLabel: string;
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
      className="hover:text-primary flex min-w-0 items-center gap-2 transition-colors hover:underline"
      aria-label={ariaLabel}
    >
      <div className="bg-muted flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full">
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
          <User className="text-muted-foreground size-4" aria-hidden />
        )}
      </div>
      <span className="min-w-0 truncate font-medium">{name}</span>
    </Link>
  );
}
