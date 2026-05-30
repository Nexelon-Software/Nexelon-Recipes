"use client";

import { User } from "lucide-react";
import { useEffect, useState } from "react";

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
  const { t, lang } = useTranslation();
  const [imageError, setImageError] = useState(false);
  const trimmedImage = image?.trim() ?? null;
  const displayName = name.trim() || t(lang.people.unknownName);
  const showImage = Boolean(trimmedImage) && !imageError;

  useEffect(() => {
    setImageError(false);
  }, [trimmedImage]);

  return (
    <div className="border-border flex items-center gap-3 rounded-lg border p-3">
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
      <FollowUserButton userId={id} isFollowing={isFollowing} />
    </div>
  );
}
