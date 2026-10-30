import { NextResponse } from "next/server";

import { recipeFormatDocument } from "~/server/api/routers/recipe/format-example";

/** Current recipe JSON for export and import. Plain JSON, not the tRPC envelope. */
export function GET() {
  return new NextResponse(JSON.stringify(recipeFormatDocument, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
    },
  });
}
