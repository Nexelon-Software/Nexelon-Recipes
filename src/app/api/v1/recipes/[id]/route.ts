import { NextResponse } from "next/server";

import {
  getRecipeForApiUser,
  parseRecipeIdParam,
  requireApiUser,
  softDeleteRecipeFromApi,
  updateRecipeFromApiBody,
} from "~/server/api/v1/recipes";

export async function GET(
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

  const document = await getRecipeForApiUser(auth.userId, id);
  if (!document) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(document);
}

export async function PUT(
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

  const bodyText = await request.text();
  const result = await updateRecipeFromApiBody(auth.userId, id, bodyText);
  if (result.error) return result.error;
  return result.response;
}

export async function DELETE(
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

  return softDeleteRecipeFromApi(auth.userId, id);
}
