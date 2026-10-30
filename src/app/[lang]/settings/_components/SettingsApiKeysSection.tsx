"use client";

import { useState } from "react";
import { Check, Copy, KeyRound, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import useTranslation from "~/language/useTranslation";
import { api } from "~/trpc/react";

const MAX_NAME_LENGTH = 64;

function formatDate(value: Date | string | null | undefined, locale: string) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function SettingsApiKeysSection() {
  const { t, lang, locale } = useTranslation();
  const utils = api.useUtils();
  const keysQuery = api.apiKey.list.useQuery();

  const [nameValue, setNameValue] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [confirmAction, setConfirmAction] = useState<{
    id: number;
    kind: "revoke" | "delete";
  } | null>(null);

  const createKey = api.apiKey.create.useMutation({
    onSuccess: async (data) => {
      setCreatedKey(data.key);
      setNameValue("");
      setCopied(false);
      toast.success(t(lang.auth.settings.apiKeys.createSuccess));
      await utils.apiKey.list.invalidate();
    },
    onError: (error) => {
      if (error.message === "active_key_limit") {
        toast.error(t(lang.auth.settings.apiKeys.limitError));
        return;
      }
      toast.error(t(lang.auth.settings.apiKeys.createError));
    },
  });

  const renameKey = api.apiKey.rename.useMutation({
    onSuccess: async () => {
      setRenamingId(null);
      toast.success(t(lang.auth.settings.apiKeys.renameSuccess));
      await utils.apiKey.list.invalidate();
    },
    onError: () => {
      toast.error(t(lang.auth.settings.apiKeys.renameError));
    },
  });

  const revokeKey = api.apiKey.revoke.useMutation({
    onSuccess: async () => {
      setConfirmAction(null);
      toast.success(t(lang.auth.settings.apiKeys.revokeSuccess));
      await utils.apiKey.list.invalidate();
    },
    onError: () => {
      toast.error(t(lang.auth.settings.apiKeys.revokeError));
    },
  });

  const deleteKey = api.apiKey.delete.useMutation({
    onSuccess: async () => {
      setConfirmAction(null);
      toast.success(t(lang.auth.settings.apiKeys.deleteSuccess));
      await utils.apiKey.list.invalidate();
    },
    onError: () => {
      toast.error(t(lang.auth.settings.apiKeys.deleteError));
    },
  });

  const trimmedName = nameValue.trim();
  const canCreate =
    trimmedName.length > 0 &&
    trimmedName.length <= MAX_NAME_LENGTH &&
    !createKey.isPending;

  async function handleCopy() {
    if (!createdKey) return;
    try {
      await navigator.clipboard.writeText(createdKey);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  function startRename(id: number, currentName: string) {
    setConfirmAction(null);
    setRenamingId(id);
    setRenameValue(currentName);
  }

  function submitRename() {
    if (renamingId == null) return;
    const next = renameValue.trim();
    if (!next) {
      toast.error(t(lang.auth.settings.apiKeys.nameRequired));
      return;
    }
    renameKey.mutate({ id: renamingId, name: next });
  }

  const keys = keysQuery.data ?? [];
  const busy =
    createKey.isPending ||
    renameKey.isPending ||
    revokeKey.isPending ||
    deleteKey.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="size-5" aria-hidden />
          {t(lang.auth.settings.sections.apiKeys)}
        </CardTitle>
        <CardDescription>
          {t(lang.auth.settings.apiKeys.description)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-muted-foreground text-sm">
          {t(lang.auth.settings.apiKeys.usage)}
        </p>

        {createdKey ? (
          <div className="border-border space-y-3 rounded-lg border p-4">
            <div>
              <p className="font-medium">
                {t(lang.auth.settings.apiKeys.createdTitle)}
              </p>
              <p className="text-muted-foreground text-sm">
                {t(lang.auth.settings.apiKeys.createdHint)}
              </p>
            </div>
            <Input
              readOnly
              value={createdKey}
              className="font-mono text-sm"
              onFocus={(event) => event.currentTarget.select()}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void handleCopy()}
              >
                {copied ? (
                  <Check className="size-4" aria-hidden />
                ) : (
                  <Copy className="size-4" aria-hidden />
                )}
                {copied
                  ? t(lang.auth.settings.apiKeys.copied)
                  : t(lang.auth.settings.apiKeys.copy)}
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  setCreatedKey(null);
                  setCopied(false);
                }}
              >
                {t(lang.auth.settings.apiKeys.dismiss)}
              </Button>
            </div>
          </div>
        ) : (
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              if (!canCreate) {
                if (!trimmedName) {
                  toast.error(t(lang.auth.settings.apiKeys.nameRequired));
                }
                return;
              }
              createKey.mutate({ name: trimmedName });
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="api-key-name">
                {t(lang.auth.settings.apiKeys.nameLabel)}
              </Label>
              <Input
                id="api-key-name"
                value={nameValue}
                maxLength={MAX_NAME_LENGTH}
                placeholder={t(lang.auth.settings.apiKeys.namePlaceholder)}
                disabled={createKey.isPending}
                onChange={(event) => setNameValue(event.target.value)}
              />
            </div>
            <Button type="submit" disabled={!canCreate}>
              {createKey.isPending
                ? t(lang.auth.settings.apiKeys.creating)
                : t(lang.auth.settings.apiKeys.create)}
            </Button>
          </form>
        )}

        <div className="space-y-3">
          {keysQuery.isLoading ? null : keys.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {t(lang.auth.settings.apiKeys.empty)}
            </p>
          ) : (
            keys.map((key) => {
              const isRevoked = key.revokedAt != null;
              const isRenaming = renamingId === key.id;
              const confirming = confirmAction?.id === key.id;
              const createdLabel = formatDate(key.createdAt, locale);
              const lastUsedLabel = formatDate(key.lastUsedAt, locale);

              return (
                <div
                  key={key.id}
                  className="border-border space-y-3 rounded-lg border p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 space-y-1">
                      {isRenaming ? (
                        <div className="flex flex-wrap gap-2">
                          <Input
                            value={renameValue}
                            maxLength={MAX_NAME_LENGTH}
                            className="max-w-xs"
                            disabled={renameKey.isPending}
                            onChange={(event) =>
                              setRenameValue(event.target.value)
                            }
                          />
                          <Button
                            type="button"
                            size="sm"
                            disabled={renameKey.isPending || !renameValue.trim()}
                            onClick={submitRename}
                          >
                            {t(lang.auth.settings.apiKeys.saveName)}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={renameKey.isPending}
                            onClick={() => setRenamingId(null)}
                          >
                            <X className="size-4" aria-hidden />
                            {t(lang.auth.settings.apiKeys.cancel)}
                          </Button>
                        </div>
                      ) : (
                        <p className="truncate font-medium">{key.name}</p>
                      )}
                      <p className="text-muted-foreground font-mono text-xs">
                        {t(lang.auth.settings.apiKeys.prefix)}: {key.keyPrefix}…
                      </p>
                    </div>
                    <Badge variant={isRevoked ? "secondary" : "default"}>
                      {isRevoked
                        ? t(lang.auth.settings.apiKeys.statusRevoked)
                        : t(lang.auth.settings.apiKeys.statusActive)}
                    </Badge>
                  </div>

                  <dl className="text-muted-foreground grid gap-1 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="inline">{t(lang.auth.settings.apiKeys.createdAt)}: </dt>
                      <dd className="inline text-foreground">
                        {createdLabel ?? "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="inline">{t(lang.auth.settings.apiKeys.lastUsed)}: </dt>
                      <dd className="inline text-foreground">
                        {lastUsedLabel ??
                          t(lang.auth.settings.apiKeys.neverUsed)}
                      </dd>
                    </div>
                  </dl>

                  {confirming ? (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <div className="flex-1">
                        <p className="font-medium">
                          {confirmAction.kind === "revoke"
                            ? t(lang.auth.settings.apiKeys.revokeConfirm)
                            : t(lang.auth.settings.apiKeys.deleteConfirm)}
                        </p>
                        <p className="text-muted-foreground text-sm">
                          {confirmAction.kind === "revoke"
                            ? t(
                                lang.auth.settings.apiKeys
                                  .revokeConfirmDescription,
                              )
                            : t(
                                lang.auth.settings.apiKeys
                                  .deleteConfirmDescription,
                              )}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          disabled={busy}
                          onClick={() => {
                            if (confirmAction.kind === "revoke") {
                              revokeKey.mutate({ id: key.id });
                            } else {
                              deleteKey.mutate({ id: key.id });
                            }
                          }}
                        >
                          {confirmAction.kind === "revoke"
                            ? revokeKey.isPending
                              ? t(lang.auth.settings.apiKeys.revoking)
                              : t(lang.auth.settings.apiKeys.revoke)
                            : deleteKey.isPending
                              ? t(lang.auth.settings.apiKeys.deleting)
                              : t(lang.auth.settings.apiKeys.delete)}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() => setConfirmAction(null)}
                        >
                          {t(lang.auth.settings.apiKeys.cancel)}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {!isRenaming ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() => startRename(key.id, key.name)}
                        >
                          <Pencil className="size-4" aria-hidden />
                          {t(lang.auth.settings.apiKeys.rename)}
                        </Button>
                      ) : null}
                      {!isRevoked ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() =>
                            setConfirmAction({ id: key.id, kind: "revoke" })
                          }
                        >
                          {t(lang.auth.settings.apiKeys.revoke)}
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        disabled={busy}
                        onClick={() =>
                          setConfirmAction({ id: key.id, kind: "delete" })
                        }
                      >
                        <Trash2 className="size-4" aria-hidden />
                        {t(lang.auth.settings.apiKeys.delete)}
                      </Button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
