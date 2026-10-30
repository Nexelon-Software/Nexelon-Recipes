export type ApiEndpointDoc = {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  summary: string;
  auth: boolean;
  requestBody?: string;
  response: string;
  errors: string[];
  notes?: string[];
};

export type ApiDocsDocument = {
  title: string;
  intro: string[];
  auth: {
    title: string;
    paragraphs: string[];
  };
  format: {
    title: string;
    paragraphs: string[];
  };
  softDelete: {
    title: string;
    paragraphs: string[];
  };
  endpoints: ApiEndpointDoc[];
};

/** Single source of truth for the public API docs page and Markdown export. */
export const recipeApiDocs: ApiDocsDocument = {
  title: "Nexelon Recipes REST API",
  intro: [
    "Authenticate with a personal API key created in Settings.",
    "Recipe bodies use the same JSON shape as app import/export.",
  ],
  auth: {
    title: "Authentication",
    paragraphs: [
      "Send the key on every request: `Authorization: Bearer <api-key>`.",
      "Missing, invalid, or revoked keys return `401 Unauthorized`.",
      "Create and revoke keys in the app under Settings → API keys.",
    ],
  },
  format: {
    title: "Recipe JSON format",
    paragraphs: [
      "Single recipe: `nexelon-recipe` envelope or a bare recipe object.",
      "Collection: `nexelon-recipes` envelope (or a bare array for bulk import).",
      "Canonical examples: `GET /api/recipes/format` (public, no API key).",
    ],
  },
  softDelete: {
    title: "Soft delete",
    paragraphs: [
      "`DELETE /api/v1/recipes/{id}` sets `deleted: true`. The row stays in the database.",
      "Restored recipes are available again via `POST /api/v1/recipes/{id}/restore`.",
      "Permanent delete is **not** available over the REST API. Use Trash in your profile (web UI) to restore or delete permanently.",
    ],
  },
  endpoints: [
    {
      method: "GET",
      path: "/api/v1/recipes",
      summary: "List the authenticated user's active recipes.",
      auth: true,
      response:
        "`200` — `nexelon-recipes` collection; each item is a recipe object plus `id`.",
      errors: ["401 Unauthorized"],
    },
    {
      method: "GET",
      path: "/api/v1/recipes?deleted=true",
      summary: "List soft-deleted recipes for backup/sync.",
      auth: true,
      response:
        "`200` — same collection shape as the active list, only soft-deleted rows.",
      errors: ["401 Unauthorized"],
    },
    {
      method: "POST",
      path: "/api/v1/recipes",
      summary: "Create one recipe.",
      auth: true,
      requestBody:
        "`nexelon-recipe` envelope or bare recipe object (same as import).",
      response:
        "`201` — `nexelon-recipe` envelope plus `id`.",
      errors: ["400 Validation failed", "401 Unauthorized"],
    },
    {
      method: "POST",
      path: "/api/v1/recipes/import",
      summary: "Bulk-create recipes from a collection.",
      auth: true,
      requestBody:
        "`nexelon-recipes` envelope or a non-empty array of recipe objects. All-or-nothing transaction.",
      response:
        "`201` — `nexelon-recipes` collection of created recipes with `id` on each.",
      errors: ["400 Validation failed", "401 Unauthorized"],
      notes: [
        "If any recipe fails validation, nothing is written.",
      ],
    },
    {
      method: "GET",
      path: "/api/v1/recipes/{id}",
      summary: "Get one active recipe by id.",
      auth: true,
      response: "`200` — `nexelon-recipe` envelope plus `id`.",
      errors: [
        "401 Unauthorized",
        "404 Not found (missing, soft-deleted, or not owned)",
      ],
    },
    {
      method: "PUT",
      path: "/api/v1/recipes/{id}",
      summary: "Replace one active recipe (full body).",
      auth: true,
      requestBody:
        "`nexelon-recipe` envelope or bare recipe object.",
      response: "`200` — updated `nexelon-recipe` envelope plus `id`.",
      errors: [
        "400 Validation failed",
        "401 Unauthorized",
        "404 Not found (missing, soft-deleted, or not owned)",
      ],
    },
    {
      method: "DELETE",
      path: "/api/v1/recipes/{id}",
      summary: "Soft-delete a recipe (sets deleted flag).",
      auth: true,
      response: "`204` — empty body.",
      errors: [
        "401 Unauthorized",
        "404 Not found (missing, already deleted, or not owned)",
      ],
      notes: [
        "Does not permanently remove the recipe. Use profile Trash for permanent delete.",
      ],
    },
    {
      method: "POST",
      path: "/api/v1/recipes/{id}/restore",
      summary: "Restore a soft-deleted recipe.",
      auth: true,
      response: "`200` — restored `nexelon-recipe` envelope plus `id`.",
      errors: [
        "401 Unauthorized",
        "404 Not found (not soft-deleted or not owned)",
      ],
    },
  ],
};

export function recipeApiDocsToMarkdown(
  doc: ApiDocsDocument = recipeApiDocs,
): string {
  const lines: string[] = [`# ${doc.title}`, ""];

  for (const paragraph of doc.intro) {
    lines.push(paragraph, "");
  }

  lines.push(`## ${doc.auth.title}`, "");
  for (const paragraph of doc.auth.paragraphs) {
    lines.push(paragraph, "");
  }

  lines.push(`## ${doc.format.title}`, "");
  for (const paragraph of doc.format.paragraphs) {
    lines.push(paragraph, "");
  }

  lines.push(`## ${doc.softDelete.title}`, "");
  for (const paragraph of doc.softDelete.paragraphs) {
    lines.push(paragraph, "");
  }

  lines.push("## Endpoints", "");

  for (const endpoint of doc.endpoints) {
    lines.push(`### \`${endpoint.method} ${endpoint.path}\``, "");
    lines.push(endpoint.summary, "");
    lines.push(`- **Auth:** ${endpoint.auth ? "Bearer API key required" : "None"}`);
    if (endpoint.requestBody) {
      lines.push(`- **Request body:** ${endpoint.requestBody}`);
    }
    lines.push(`- **Response:** ${endpoint.response}`);
    if (endpoint.errors.length > 0) {
      lines.push(`- **Errors:** ${endpoint.errors.join("; ")}`);
    }
    if (endpoint.notes?.length) {
      for (const note of endpoint.notes) {
        lines.push(`- **Note:** ${note}`);
      }
    }
    lines.push("");
  }

  return lines.join("\n").trimEnd() + "\n";
}
