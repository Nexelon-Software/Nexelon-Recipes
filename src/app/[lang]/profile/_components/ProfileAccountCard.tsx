"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Save, User, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import useTranslation from "~/language/useTranslation";
import { authClient } from "~/server/better-auth/client";

const MAX_NAME_LENGTH = 256;

export function ProfileAccountCard({
  name,
  email,
  imageUrl,
}: {
  name: string;
  email: string;
  imageUrl: string | null;
}) {
  const router = useRouter();
  const { t, lang } = useTranslation();
  const [imageError, setImageError] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [nameValue, setNameValue] = useState(name);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [imageUrl]);

  useEffect(() => {
    if (!isEditing) {
      setNameValue(name);
    }
  }, [name, isEditing]);

  const showImage = Boolean(imageUrl) && !imageError;
  const trimmedName = nameValue.trim();
  const savedName = name.trim();
  const canSave =
    trimmedName.length > 0 &&
    trimmedName.length <= MAX_NAME_LENGTH &&
    trimmedName !== savedName &&
    !saving;

  function startEditing() {
    setNameValue(name);
    setIsEditing(true);
  }

  function cancelEditing() {
    setNameValue(name);
    setIsEditing(false);
  }

  async function handleSave() {
    if (!trimmedName) {
      toast.error(t(lang.auth.profile.nameRequired));
      return;
    }
    if (trimmedName.length > MAX_NAME_LENGTH) {
      return;
    }

    setSaving(true);
    try {
      const { error } = await authClient.updateUser({ name: trimmedName });
      if (error) {
        toast.error(t(lang.auth.profile.saveError));
        return;
      }
      toast.success(t(lang.auth.profile.saveSuccess));
      setIsEditing(false);
      router.refresh();
    } catch {
      toast.error(t(lang.auth.profile.saveError));
    } finally {
      setSaving(false);
    }
  }

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
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex min-w-0 items-center gap-1">
            {isEditing ? (
              <>
                <Input
                  value={nameValue}
                  maxLength={MAX_NAME_LENGTH}
                  onChange={(e) => setNameValue(e.target.value)}
                  autoComplete="name"
                  aria-label={t(lang.auth.profile.name)}
                  className="h-9 flex-1"
                  disabled={saving}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && canSave) {
                      void handleSave();
                    }
                    if (e.key === "Escape") {
                      cancelEditing();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={!canSave}
                  aria-label={t(lang.auth.profile.save)}
                  onClick={() => void handleSave()}
                >
                  <Save />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={saving}
                  aria-label={t(lang.auth.profile.cancelEdit)}
                  onClick={cancelEditing}
                >
                  <X />
                </Button>
              </>
            ) : (
              <>
                <p className="min-w-0 flex-1 truncate text-lg font-medium">
                  {name}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t(lang.auth.profile.editName)}
                  onClick={startEditing}
                >
                  <Pencil />
                </Button>
              </>
            )}
          </div>
          <p className="text-muted-foreground truncate text-sm">{email}</p>
        </div>
      </CardContent>
    </Card>
  );
}
