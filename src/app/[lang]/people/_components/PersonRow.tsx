"use client";

import { User } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { localePath } from "~/lib/seo-url";
import useTranslation from "~/language/useTranslation";

import { FollowUserButton } from "./FollowUserButton";

export function PersonRow({
  id,
  name,
  image,
  isFollowing,
}: {
  id: string;
  name: string;
  image: string | null;
  isFollowing: boolean;
}) {
  const { t, lang, locale } = useTranslation();
  const [imageError, setImageError] = useState(false);
  const trimmedImage = image?.trim() ?? null;
  const displayName = name.trim() || t(lang.people.unknownName);
  const showImage = Boolean(trimmedImage) && !imageError;

  useEffect(() => {
    setImageError(false);
  }, [trimmedImage]);

  const recipesHref = localePath(locale, `/${id}/recipes`);

  return (
    <div className="border-border hover:bg-muted/50 flex items-center gap-3 rounded-lg border p-3 transition-colors">
      <Link
        href={recipesHref}
        className="flex min-w-0 flex-1 items-center gap-3"
        aria-label={`${t(lang.people.viewRecipes)}: ${displayName}`}
      >
        <div className="bg-muted flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full">
          {showImage ? (
            <img
              src={trimmedImage!}
              alt=""
              className="size-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <User className="text-muted-foreground size-5" aria-hidden />
          )}
        </div>
        <p className="min-w-0 flex-1 truncate font-medium">{displayName}</p>
      </Link>
      <FollowUserButton userId={id} isFollowing={isFollowing} />
    </div>
  );
}
