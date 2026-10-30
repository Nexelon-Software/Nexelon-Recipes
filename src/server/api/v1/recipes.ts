import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";

import { authenticateApiKey } from "~/server/api-keys";
import {
  createRecipeForUser,
  createRecipeForUserInTx,
  restoreRecipeForUser,
  softDeleteRecipeForUser,
  updateRecipeForUser,
} from "~/server/api/routers/recipe";
import {
  RECIPE_COLLECTION_JSON_FORMAT,
  RECIPE_JSON_VERSION,
  RecipeJsonParseError,
  parseRecipeCollectionJsonFile,
  parseRecipeJsonFile,
  recipeDetailToRecipeInput,
  recipeInputToExportEnvelope,
  type RecipeDetailForInput,
  type RecipeInput,
} from "~/server/api/routers/recipe/schemas";
import { db } from "~/server/db";
import { recipeIngredients, recipes, recipeSteps } from "~/server/db/schema";

function jsonError(status: number, message: string) {
  return NextResponse.json({ error: message }, { status });
}

export async function requireApiUser(
  request: Request,
): Promise<{ userId: string } | NextResponse> {
  const auth = await authenticateApiKey(request.headers.get("authorization"));
  if (!auth) {
    return jsonError(401, "Unauthorized");
  }
  return { userId: auth.userId };
}

function recipeToApiDocument(id: number, input: RecipeInput) {
  return {
    ...recipeInputToExportEnvelope(input),
    id,
  };
}

function recipeRowToApiDocument(row: RecipeDetailForInput & { id: number }) {
  return recipeToApiDocument(row.id, recipeDetailToRecipeInput(row));
}

/** Collection item shape: bare export recipe + id (same as `nexelon-recipes` recipes[]). */
function recipeRowToCollectionItem(row: RecipeDetailForInput & { id: number }) {
  const input = recipeDetailToRecipeInput(row);
  return {
    ...recipeInputToExportEnvelope(input).recipe,
    id: row.id,
  };
}

async function loadRecipeRows(userId: string, deleted: boolean) {
  return db.query.recipes.findMany({
    where: and(
      eq(recipes.deleted, deleted),
      eq(recipes.createdById, userId),
    ),
    orderBy: [desc(recipes.updatedAt)],
    with: {
      ingredients: {
        orderBy: [asc(recipeIngredients.sortOrder)],
      },
      steps: {
        orderBy: [asc(recipeSteps.sortOrder)],
      },
      nutrition: true,
    },
  });
}

export async function listRecipesForApiUser(
  userId: string,
  options?: { deleted?: boolean },
) {
  const deleted = options?.deleted ?? false;
  const rows = await loadRecipeRows(userId, deleted);

  return {
    format: RECIPE_COLLECTION_JSON_FORMAT,
    version: RECIPE_JSON_VERSION,
    exportedAt: new Date().toISOString(),
    recipes: rows.map((row) => recipeRowToCollectionItem(row)),
  };
}

export async function getRecipeForApiUser(
  userId: string,
  recipeId: number,
  options?: { deleted?: boolean },
) {
  const deleted = options?.deleted ?? false;
  const row = await db.query.recipes.findFirst({
    where: and(
      eq(recipes.id, recipeId),
      eq(recipes.deleted, deleted),
      eq(recipes.createdById, userId),
    ),
    with: {
      ingredients: {
        orderBy: [asc(recipeIngredients.sortOrder)],
      },
      steps: {
        orderBy: [asc(recipeSteps.sortOrder)],
      },
      nutrition: true,
    },
  });

  if (!row) return null;
  return recipeRowToApiDocument(row);
}

function parseBodyRecipe(
  bodyText: string,
):
  | { input: RecipeInput; error?: undefined }
  | { input?: undefined; error: NextResponse } {
  try {
    return { input: parseRecipeJsonFile(bodyText) };
  } catch (error) {
    if (error instanceof RecipeJsonParseError) {
      return { error: jsonError(400, error.message) };
    }
    throw error;
  }
}

export async function createRecipeFromApiBody(
  userId: string,
  bodyText: string,
) {
  const parsed = parseBodyRecipe(bodyText);
  if (parsed.error) {
    return { error: parsed.error, response: null };
  }

  const recipeId = await createRecipeForUser(db, userId, parsed.input);
  const document = await getRecipeForApiUser(userId, recipeId);
  if (!document) {
    return {
      error: jsonError(500, "Recipe was created but could not be loaded"),
      response: null,
    };
  }

  return {
    error: null,
    response: NextResponse.json(document, { status: 201 }),
  };
}

export async function updateRecipeFromApiBody(
  userId: string,
  recipeId: number,
  bodyText: string,
) {
  const parsed = parseBodyRecipe(bodyText);
  if (parsed.error) {
    return { error: parsed.error, response: null };
  }

  const result = await updateRecipeForUser(
    db,
    userId,
    recipeId,
    parsed.input,
  );
  if (result === "not_found") {
    return { error: jsonError(404, "Not found"), response: null };
  }

  const document = await getRecipeForApiUser(userId, recipeId);
  if (!document) {
    return {
      error: jsonError(500, "Recipe was updated but could not be loaded"),
      response: null,
    };
  }

  return { error: null, response: NextResponse.json(document) };
}

export async function softDeleteRecipeFromApi(
  userId: string,
  recipeId: number,
) {
  const result = await softDeleteRecipeForUser(db, userId, recipeId);
  if (result === "not_found") {
    return jsonError(404, "Not found");
  }
  return new NextResponse(null, { status: 204 });
}

export async function restoreRecipeFromApi(userId: string, recipeId: number) {
  const result = await restoreRecipeForUser(db, userId, recipeId);
  if (result === "not_found") {
    return { error: jsonError(404, "Not found"), response: null };
  }

  const document = await getRecipeForApiUser(userId, recipeId);
  if (!document) {
    return {
      error: jsonError(500, "Recipe was restored but could not be loaded"),
      response: null,
    };
  }

  return { error: null, response: NextResponse.json(document) };
}

export async function importRecipesFromApiBody(
  userId: string,
  bodyText: string,
) {
  let inputs: RecipeInput[];
  try {
    inputs = parseRecipeCollectionJsonFile(bodyText);
  } catch (error) {
    if (error instanceof RecipeJsonParseError) {
      return { error: jsonError(400, error.message), response: null };
    }
    throw error;
  }

  const ids = await db.transaction(async (tx) => {
    const createdIds: number[] = [];
    for (const input of inputs) {
      createdIds.push(await createRecipeForUserInTx(tx, userId, input));
    }
    return createdIds;
  });

  const rows = await db.query.recipes.findMany({
    where: and(
      eq(recipes.deleted, false),
      eq(recipes.createdById, userId),
      inArray(recipes.id, ids),
    ),
    with: {
      ingredients: {
        orderBy: [asc(recipeIngredients.sortOrder)],
      },
      steps: {
        orderBy: [asc(recipeSteps.sortOrder)],
      },
      nutrition: true,
    },
  });

  const byId = new Map(rows.map((row) => [row.id, row]));
  const imported = ids
    .map((id) => byId.get(id))
    .filter((row): row is NonNullable<typeof row> => row != null)
    .map((row) => recipeRowToCollectionItem(row));

  return {
    error: null,
    response: NextResponse.json(
      {
        format: RECIPE_COLLECTION_JSON_FORMAT,
        version: RECIPE_JSON_VERSION,
        exportedAt: new Date().toISOString(),
        recipes: imported,
      },
      { status: 201 },
    ),
  };
}

export function parseRecipeIdParam(idParam: string): number | null {
  const id = Number(idParam);
  if (!Number.isInteger(id) || id <= 0) return null;
  return id;
}
