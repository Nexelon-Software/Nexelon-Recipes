"use client";

import { useEffect, useState } from "react";
import { User } from "lucide-react";

import { Card, CardContent } from "~/components/ui/card";

export function ProfileAccountCard({
  name,
  email,
  imageUrl,
}: {
  name: string;
  email: string;
  imageUrl: string | null;
}) {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [imageUrl]);

  const showImage = Boolean(imageUrl) && !imageError;

  return (
    <Card>
      <CardContent className="flex items-center gap-4 pt-4">
        <div className="bg-muted flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full">
          {showImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl!}
              alt=""
              width={64}
              height={64}
              referrerPolicy="no-referrer"
              className="size-16 object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <User className="text-muted-foreground size-8" />
          )}
        </div>
        <div className="min-w-0 space-y-1">
          <p className="truncate text-lg font-medium">{name}</p>
          <p className="text-muted-foreground truncate text-sm">{email}</p>
        </div>
      </CardContent>
    </Card>
  );
}
