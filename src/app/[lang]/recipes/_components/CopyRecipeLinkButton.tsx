"use client";

import { useState } from "react";
import { Check, Link2 } from "lucide-react";

import { Button } from "~/components/ui/button";

export function CopyRecipeLinkButton({
  copyLabel,
  copiedLabel,
}: {
  copyLabel: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      className="inline-flex items-center gap-1.5"
      onClick={() => {
        void navigator.clipboard.writeText(window.location.href).then(() => {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 2000);
        });
      }}
    >
      {copied ? (
        <Check className="size-4" aria-hidden />
      ) : (
        <Link2 className="size-4" aria-hidden />
      )}
      {copied ? copiedLabel : copyLabel}
    </Button>
  );
}
