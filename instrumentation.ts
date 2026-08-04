/**
 * Next.js server boot hook. Food sync lives in `~/server/foods/maybe-sync`;
 * this file only wires process start → fire-and-forget refresh.
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") return;
  if (process.env.FOODS_AUTO_IMPORT === "false") return;

  void import("~/server/foods/maybe-sync")
    .then((m) => m.maybeSyncFoods())
    .catch((err: unknown) => {
      console.error("[foods] auto sync failed", err);
    });
}
