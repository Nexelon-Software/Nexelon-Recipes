import { NextResponse } from "next/server";

import {
  importRecipesFromApiBody,
  requireApiUser,
} from "~/server/api/v1/recipes";

export async function POST(request: Request) {
  const auth = await requireApiUser(request);
  if (auth instanceof NextResponse) return auth;

  const bodyText = await request.text();
  const result = await importRecipesFromApiBody(auth.userId, bodyText);
  if (result.error) return result.error;
  return result.response;
}
