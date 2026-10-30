import { NextResponse } from "next/server";

import {
  getRecipeForApiUser,
  requireApiUser,
} from "~/server/api/v1/recipes";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiUser(request);
  if (auth instanceof NextResponse) return auth;

  const { id: idParam } = await context.params;
  const id = Number(idParam);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const document = await getRecipeForApiUser(auth.userId, id);
  if (!document) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(document);
}
