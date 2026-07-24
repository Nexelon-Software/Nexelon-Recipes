import { headers } from "next/headers";
import { cache } from "react";

import { resolveSession } from "./get-session";

export const getSession = cache(async () =>
  resolveSession(await headers()),
);
