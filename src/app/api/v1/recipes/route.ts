import { NextResponse } from "next/server";

import {
  createRecipeFromApiBody,
  listRecipesForApiUser,
  requireApiUser,
} from "~/server/api/v1/recipes";

export async function GET(request: Request) {
  const auth = await requireApiUser(request);
  if (auth instanceof NextResponse) return auth;

  const deleted =
    new URL(request.url).searchParams.get("deleted") === "true";

  const body = await listRecipesForApiUser(auth.userId, { deleted });
  return NextResponse.json(body);
}

export async function POST(request: Request) {
  const auth = await requireApiUser(request);
  if (auth instanceof NextResponse) return auth;

  const bodyText = await request.text();
  const result = await createRecipeFromApiBody(auth.userId, bodyText);
  if (result.error) return result.error;
  return result.response;
}
