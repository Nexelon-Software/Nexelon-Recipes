import { mkdir, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { RAW_DIR } from "./find-dump";
import type { FoodSource } from "./types";

/** ANSES-CIQUAL 2025 on Recherche Data Gouv (etalab 2.0). */
const CIQUAL_DATASET_API =
  "https://entrepot.recherche.data.gouv.fr/api/datasets/:persistentId?persistentId=doi:10.57745/RDMHWY";
const CIQUAL_DATAFILE_BASE =
  "https://entrepot.recherche.data.gouv.fr/api/access/datafile";

/** Frida (DTU) dataset article on data.dtu.dk / Figshare (CC-BY 4.0). */
const FRIDA_ARTICLE_API = "https://api.figshare.com/v2/articles/29500682";

const DOWNLOAD_TIMEOUT_MS = 120_000;

type CiqualDatasetResponse = {
  data?: {
    latestVersion?: {
      files?: Array<{
        label?: string;
        dataFile?: { id?: number };
      }>;
    };
  };
};

type FigshareArticleResponse = {
  files?: Array<{
    name?: string;
    download_url?: string;
  }>;
};

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS),
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`Failed to resolve dump metadata (${res.status}): ${url}`);
  }
  return (await res.json()) as T;
}

async function resolveCiqualDownloadUrl(): Promise<string> {
  const json = await fetchJson<CiqualDatasetResponse>(CIQUAL_DATASET_API);
  const files = json.data?.latestVersion?.files ?? [];
  const xlsx = files.find(
    (f) => typeof f.label === "string" && /ciqual.*\.xlsx$/i.test(f.label),
  );
  const id = xlsx?.dataFile?.id;
  if (id === undefined) {
    throw new Error(
      "CIQUAL dataset metadata has no matching *.xlsx file (doi:10.57745/RDMHWY)",
    );
  }
  return `${CIQUAL_DATAFILE_BASE}/${id}`;
}

async function resolveFridaDownloadUrl(): Promise<string> {
  const json = await fetchJson<FigshareArticleResponse>(FRIDA_ARTICLE_API);
  const files = json.files ?? [];
  const xlsx = files.find(
    (f) =>
      typeof f.name === "string" &&
      /frida.*\.xlsx$/i.test(f.name) &&
      !/doc/i.test(f.name),
  );
  if (!xlsx?.download_url) {
    throw new Error(
      "Frida article metadata has no matching dataset *.xlsx (figshare 29500682)",
    );
  }
  return xlsx.download_url;
}

export async function resolveDownloadUrl(source: FoodSource): Promise<string> {
  return source === "ciqual"
    ? resolveCiqualDownloadUrl()
    : resolveFridaDownloadUrl();
}

/**
 * Resolve + download the official spreadsheet into `data/foods/raw/{source}.xlsx`.
 * Always overwrites the canonical file (atomic via `.part` rename).
 */
export async function ensureDumpDownloaded(source: FoodSource): Promise<string> {
  const url = await resolveDownloadUrl(source);
  console.log(`[foods] Downloading ${source} from ${url}…`);

  const res = await fetch(url, {
    signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS),
    redirect: "follow",
  });
  if (!res.ok) {
    throw new Error(`Download failed (${res.status}): ${url}`);
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.byteLength < 1024) {
    throw new Error(
      `Downloaded ${source} file is suspiciously small (${buffer.byteLength} bytes)`,
    );
  }

  await mkdir(RAW_DIR, { recursive: true });
  const dest = join(RAW_DIR, `${source}.xlsx`);
  const part = `${dest}.part`;
  await writeFile(part, buffer);
  await rename(part, dest);

  console.log(
    `[foods] Saved ${source} dump (${buffer.byteLength} bytes) → ${dest}`,
  );
  return dest;
}
