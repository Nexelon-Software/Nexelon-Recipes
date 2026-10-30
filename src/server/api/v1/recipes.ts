import { and, asc, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { authenticateApiKey } from "~/server/api-keys";
import { createRecipeForUser } from "~/server/api/routers/recipe";
import {
  RECIPE_COLLECTION_JSON_FORMAT,
  RECIPE_JSON_VERSION,
  RecipeJsonParseError,
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

export async function listRecipesForApiUser(userId: string) {
  const rows = await db.query.recipes.findMany({
    where: and(eq(recipes.deleted, false), eq(recipes.createdById, userId)),
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

  return {
    format: RECIPE_COLLECTION_JSON_FORMAT,
    version: RECIPE_JSON_VERSION,
    exportedAt: new Date().toISOString(),
    recipes: rows.map((row) => recipeRowToCollectionItem(row)),
  };
}

export async function getRecipeForApiUser(userId: string, recipeId: number) {
  const row = await db.query.recipes.findFirst({
    where: and(
      eq(recipes.id, recipeId),
      eq(recipes.deleted, false),
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

export async function createRecipeFromApiBody(
  userId: string,
  bodyText: string,
) {
  let input: RecipeInput;
  try {
    input = parseRecipeJsonFile(bodyText);
  } catch (error) {
    if (error instanceof RecipeJsonParseError) {
      return { error: jsonError(400, error.message), response: null };
    }
    throw error;
  }

  const recipeId = await createRecipeForUser(db, userId, input);
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
