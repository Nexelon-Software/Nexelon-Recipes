"use client";

import { Download } from "lucide-react";
import Link from "next/link";

import { Button, buttonVariants } from "~/components/ui/button";
import { localePath } from "~/lib/seo-url";
import { cn } from "~/lib/utils";
import useTranslation from "~/language/useTranslation";
import {
  recipeApiDocs,
  recipeApiDocsToMarkdown,
  type ApiEndpointDoc,
} from "~/server/api/v1/docs";

function EndpointCard({ endpoint }: { endpoint: ApiEndpointDoc }) {
  return (
    <article className="border-border space-y-3 rounded-lg border p-4">
      <div className="flex flex-wrap items-baseline gap-2">
        <span className="bg-muted rounded px-2 py-0.5 font-mono text-xs font-semibold tracking-wide">
          {endpoint.method}
        </span>
        <code className="text-sm break-all">{endpoint.path}</code>
      </div>
      <p className="text-sm">{endpoint.summary}</p>
      <dl className="text-muted-foreground space-y-1 text-sm">
        <div>
          <dt className="inline font-medium text-foreground">Auth: </dt>
          <dd className="inline">
            {endpoint.auth ? "Bearer API key" : "None"}
          </dd>
        </div>
        {endpoint.requestBody ? (
          <div>
            <dt className="inline font-medium text-foreground">Body: </dt>
            <dd className="inline">{endpoint.requestBody}</dd>
          </div>
        ) : null}
        <div>
          <dt className="inline font-medium text-foreground">Response: </dt>
          <dd className="inline">{endpoint.response}</dd>
        </div>
        {endpoint.errors.length > 0 ? (
          <div>
            <dt className="inline font-medium text-foreground">Errors: </dt>
            <dd className="inline">{endpoint.errors.join("; ")}</dd>
          </div>
        ) : null}
        {endpoint.notes?.map((note) => (
          <div key={note}>
            <dt className="inline font-medium text-foreground">Note: </dt>
            <dd className="inline">{note}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

export function ApiDocsContent() {
  const { t, lang, locale } = useTranslation();
  const doc = recipeApiDocs;
  const settingsPath = localePath(locale, "/settings");
  const formatPath = "/api/recipes/format";

  function downloadMarkdown() {
    const markdown = recipeApiDocsToMarkdown(doc);
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "nexelon-recipes-api.md";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="container mx-auto max-w-3xl space-y-8 px-3 py-6 sm:px-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            {t(lang.docs.api.title)}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t(lang.docs.api.subtitle)}
          </p>
        </div>
        <Button type="button" variant="outline" onClick={downloadMarkdown}>
          <Download className="size-4" aria-hidden />
          {t(lang.docs.api.exportMarkdown)}
        </Button>
      </div>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">{doc.auth.title}</h2>
        {doc.auth.paragraphs.map((paragraph) => (
          <p key={paragraph} className="text-muted-foreground text-sm">
            {paragraph}
          </p>
        ))}
        <Link
          href={settingsPath}
          className={cn(buttonVariants({ variant: "link" }), "h-auto px-0")}
        >
          {t(lang.docs.api.openSettings)}
        </Link>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">{doc.format.title}</h2>
        {doc.format.paragraphs.map((paragraph) => (
          <p key={paragraph} className="text-muted-foreground text-sm">
            {paragraph}
          </p>
        ))}
        <a
          href={formatPath}
          target="_blank"
          rel="noreferrer"
          className={cn(buttonVariants({ variant: "link" }), "h-auto px-0")}
        >
          {t(lang.docs.api.openFormat)}
        </a>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">{doc.softDelete.title}</h2>
        {doc.softDelete.paragraphs.map((paragraph) => (
          <p key={paragraph} className="text-muted-foreground text-sm">
            {paragraph}
          </p>
        ))}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">{t(lang.docs.api.endpoints)}</h2>
        <div className="space-y-3">
          {doc.endpoints.map((endpoint) => (
            <EndpointCard
              key={`${endpoint.method}-${endpoint.path}`}
              endpoint={endpoint}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
