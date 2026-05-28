"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { User } from "lucide-react";

import { buttonVariants } from "~/components/ui/button";
import { cn } from "~/lib/utils";

export function UserAvatarLink({
  imageUrl,
  settingsPath,
  settingsLabel,
}: {
  imageUrl: string | null;
  settingsPath: string;
  settingsLabel: string;
}) {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [imageUrl]);

  const showImage = Boolean(imageUrl) && !imageError;

  return (
    <Link
      href={settingsPath}
      className={cn(
        buttonVariants({ variant: "ghost", size: "icon" }),
        "h-9 w-9 overflow-hidden rounded-full p-0",
      )}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl!}
          alt=""
          width={36}
          height={36}
          referrerPolicy="no-referrer"
          className="size-9 object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <User className="text-muted-foreground size-5" />
      )}
      <span className="sr-only">{settingsLabel}</span>
    </Link>
  );
}
