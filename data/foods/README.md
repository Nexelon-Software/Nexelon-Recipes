# Food composition dumps (Frida + CIQUAL)

Offline cache of EU reference food tables. Import into Postgres with:

```bash
npm run foods:import
# or: npm run foods:import -- --source=ciqual
# or: npm run foods:import -- --source=frida
# fetch official XLSX then import:
npm run foods:import -- --download
```

## Automatic refresh on app start

When the Next.js server boots, [`instrumentation.ts`](../../instrumentation.ts) calls
`maybeSyncFoods` (unless `FOODS_AUTO_IMPORT=false`). **CIQUAL is disabled for now**
(auto-sync and `foods:import` without `--source=` only run **Frida**). Per enabled source it:

1. Reads the latest `foodImportRun` row
2. Runs when there is no success yet, the latest run **failed**, or the latest
   **success** is ≥ **6 months** old
3. Claims a `running` row (DB unique lock) so concurrent processes do not double-import
4. **Downloads** the official spreadsheet into `data/foods/raw/{source}.xlsx`
   (CIQUAL via Recherche Data Gouv Dataverse API; Frida via DTU/Figshare article API)
5. Parses and upserts; finishes as `success` / `failed`

Download or parse failures mark the run `failed` and log an error (the app keeps running).
Manual `npm run foods:import` uses local files unless you pass `--download`.

## Setup

1. Apply the `food` / `foodImportRun` migration (`npm run db:generate` then migrate) if not already applied — including the partial unique index on one `running` row per source.
2. Start the app (boot sync downloads + imports when due), or run
   `npm run foods:import -- --download`.
3. Optional: place dumps under `data/foods/raw/` yourself for offline CLI imports without `--download`.

## Expected files

Canonical paths written by auto-download / `--download`:

| Source | Filename | Upstream |
|--------|----------|----------|
| CIQUAL | `ciqual.xlsx` | [ANSES-CIQUAL 2025 on Recherche Data Gouv](https://doi.org/10.57745/rdmhwy) (etalab 2.0) — **French names only** in the published Excel (`_FR_`); no separate English dump is published |
| Frida | `frida.xlsx` | [DTU Frida dataset](https://doi.org/10.11583/dtu.29500682) (CC-BY 4.0) — Danish + English food names |

The importer also accepts other filenames containing `ciqual` / `frida` and ending in `.xlsx` / `.xls`.

## Attribution

- **CIQUAL** — ANSES, table de composition nutritionnelle des aliments (etalab 2.0).
- **Frida** — National Food Institute, Technical University of Denmark (CC-BY 4.0).

Both sources are stored as separate rows keyed by `(source, externalId)`. No cross-source merge.
