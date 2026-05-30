"use client";

import { Button } from "~/components/ui/button";
import useTranslation from "~/language/useTranslation";
import { api } from "~/trpc/react";

export function FollowUserButton({
  userId,
  isFollowing,
}: {
  userId: string;
  isFollowing: boolean;
}) {
  const { t, lang } = useTranslation();
  const utils = api.useUtils();

  const follow = api.follow.follow.useMutation({
    onSuccess: () => void utils.follow.invalidate(),
  });

  const unfollow = api.follow.unfollow.useMutation({
    onSuccess: () => void utils.follow.invalidate(),
  });

  const pending = follow.isPending || unfollow.isPending;

  if (isFollowing) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() => unfollow.mutate({ userId })}
      >
        {t(lang.people.unfollow)}
      </Button>
    );
  }

  return (
    <Button
      size="sm"
      disabled={pending}
      onClick={() => follow.mutate({ userId })}
    >
      {t(lang.people.follow)}
    </Button>
  );
}
