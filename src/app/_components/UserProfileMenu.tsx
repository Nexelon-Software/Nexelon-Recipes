"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { User } from "lucide-react";

import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { authClient } from "~/server/better-auth/client";

export function UserProfileMenu({
  imageUrl,
  loginPath,
  profilePath,
  profileLabel,
  signOutLabel,
}: {
  imageUrl: string | null;
  loginPath: string;
  profilePath: string;
  profileLabel: string;
  signOutLabel: string;
}) {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [imageUrl]);

  const showImage = Boolean(imageUrl) && !imageError;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 overflow-hidden rounded-full p-0"
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
          <span className="sr-only">{profileLabel}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={profilePath}>{profileLabel}</Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => {
            void authClient.signOut({
              fetchOptions: {
                onSuccess: () => {
                  window.location.href = loginPath;
                },
              },
            });
          }}
        >
          {signOutLabel}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
