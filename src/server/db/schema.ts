import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  pgTable,
  pgTableCreator,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const createTable = pgTableCreator((name) => `drizzle_${name}`);

export const posts = createTable(
  "post",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    name: d.varchar({ length: 256 }),
    createdById: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => user.id),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("created_by_idx").on(t.createdById),
    index("name_idx").on(t.name),
  ]
);

export const recipes = createTable(
  "recipe",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    name: d.varchar({ length: 256 }).notNull(),
    description: d.text(),
    category: d.varchar({ length: 64 }),
    cuisine: d.varchar({ length: 128 }),
    difficulty: d.varchar({ length: 16 }),
    prepTimeMinutes: d.integer(),
    cookTimeMinutes: d.integer(),
    servings: d.integer(),
    imageUrl: d.text(),
    notes: d.text(),
    sourceUrl: d.text(),
    visibility: d.varchar({ length: 16 }).notNull().default("private"),
    deleted: d.boolean().notNull().default(false),
    createdById: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => user.id),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("recipe_created_by_idx").on(t.createdById),
    index("recipe_name_idx").on(t.name),
    index("recipe_deleted_idx").on(t.deleted),
  ],
);

export const recipeIngredients = createTable(
  "recipeIngredient",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    recipeId: d
      .integer()
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    name: d.varchar({ length: 256 }).notNull(),
    amount: d.varchar({ length: 64 }),
    unit: d.varchar({ length: 64 }),
    sortOrder: d.integer().notNull().default(0),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [index("recipe_ingredient_recipe_id_idx").on(t.recipeId)],
);

export const recipeSteps = createTable(
  "recipeStep",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    recipeId: d
      .integer()
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    instruction: d.text().notNull(),
    sortOrder: d.integer().notNull().default(0),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [index("recipe_step_recipe_id_idx").on(t.recipeId)],
);

export const recipeNutrition = createTable(
  "recipeNutrition",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    recipeId: d
      .integer()
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    caloriesKcal: d.integer(),
    proteinG: d.integer(),
    carbsG: d.integer(),
    fatG: d.integer(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    uniqueIndex("recipe_nutrition_recipe_id_uidx").on(t.recipeId),
  ],
);

/** Cached food composition rows from CIQUAL / Frida (per 100 g macros). */
export const foods = createTable(
  "food",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    source: d.varchar({ length: 16 }).notNull(),
    externalId: d.varchar({ length: 64 }).notNull(),
    sourceVersion: d.varchar({ length: 32 }).notNull(),
    name: d.varchar({ length: 512 }).notNull(),
    nameEn: d.varchar({ length: 512 }),
    language: d.varchar({ length: 8 }).notNull(),
    foodGroup: d.varchar({ length: 256 }),
    caloriesKcalPer100g: d.real(),
    proteinGPer100g: d.real(),
    carbsGPer100g: d.real(),
    fatGPer100g: d.real(),
    densityGPerMl: d.real(),
    gramsPerPiece: d.real(),
    gramsPerHead: d.real(),
    importedAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    uniqueIndex("food_source_external_id_uidx").on(t.source, t.externalId),
    index("food_name_idx").on(t.name),
    index("food_name_en_idx").on(t.nameEn),
  ],
);

export const foodImportRuns = createTable(
  "foodImportRun",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    source: d.varchar({ length: 16 }).notNull(),
    sourceVersion: d.varchar({ length: 32 }).notNull(),
    rowCount: d.integer().notNull().default(0),
    startedAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
    finishedAt: d.timestamp({ withTimezone: true }),
    status: d.varchar({ length: 16 }).notNull(),
    notes: d.text(),
  }),
  (t) => [
    index("food_import_run_source_idx").on(t.source),
    // At most one in-progress import per source (claim lock).
    uniqueIndex("food_import_run_source_running_uidx")
      .on(t.source)
      .where(sql`${t.status} = 'running'`),
  ],
);

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified")
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const userFollows = createTable(
  "userFollow",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    followerId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    followingId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [
    index("user_follow_follower_idx").on(t.followerId),
    index("user_follow_following_idx").on(t.followingId),
    uniqueIndex("user_follow_follower_following_idx").on(
      t.followerId,
      t.followingId,
    ),
  ],
);

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").$defaultFn(
    () => /* @__PURE__ */ new Date()
  ),
  updatedAt: timestamp("updated_at").$defaultFn(
    () => /* @__PURE__ */ new Date()
  ),
});

export const userRelations = relations(user, ({ many }) => ({
  account: many(account),
  session: many(session),
  recipes: many(recipes),
  followers: many(userFollows, { relationName: "following" }),
  following: many(userFollows, { relationName: "follower" }),
}));

export const recipeRelations = relations(recipes, ({ one, many }) => ({
  createdBy: one(user, {
    fields: [recipes.createdById],
    references: [user.id],
  }),
  ingredients: many(recipeIngredients),
  steps: many(recipeSteps),
  nutrition: one(recipeNutrition),
}));

export const recipeIngredientRelations = relations(
  recipeIngredients,
  ({ one }) => ({
    recipe: one(recipes, {
      fields: [recipeIngredients.recipeId],
      references: [recipes.id],
    }),
  }),
);

export const recipeStepRelations = relations(recipeSteps, ({ one }) => ({
  recipe: one(recipes, {
    fields: [recipeSteps.recipeId],
    references: [recipes.id],
  }),
}));

export const recipeNutritionRelations = relations(
  recipeNutrition,
  ({ one }) => ({
    recipe: one(recipes, {
      fields: [recipeNutrition.recipeId],
      references: [recipes.id],
    }),
  }),
);

export const userFollowRelations = relations(userFollows, ({ one }) => ({
  follower: one(user, {
    fields: [userFollows.followerId],
    references: [user.id],
    relationName: "follower",
  }),
  following: one(user, {
    fields: [userFollows.followingId],
    references: [user.id],
    relationName: "following",
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));
