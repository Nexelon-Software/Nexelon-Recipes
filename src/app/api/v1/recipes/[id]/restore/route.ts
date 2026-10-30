import { NextResponse } from "next/server";

import {
  parseRecipeIdParam,
  requireApiUser,
  restoreRecipeFromApi,
} from "~/server/api/v1/recipes";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiUser(request);
  if (auth instanceof NextResponse) return auth;

  const { id: idParam } = await context.params;
  const id = parseRecipeIdParam(idParam);
  if (id == null) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const result = await restoreRecipeFromApi(auth.userId, id);
  if (result.error) return result.error;
  return result.response;
}
