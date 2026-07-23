# The Shiva Bowl — Dynasty League History Hub

A shareable web hub for the **The Shiva Bowl** Sleeper dynasty league. It mines the
league's full history (champions, rivalries, schedule luck, trade receipts, awards,
and a per-manager "Dynasty Wrapped") from the **free, read-only Sleeper API**.

Built with Next.js + TypeScript. There is **no database and no live API call at
runtime** — a small pipeline pulls Sleeper data into committed JSON, computes every
stat into precomputed "marts", and the app renders those statically.

## How it works (three layers)

1. **Ingest** (`scripts/ingest/`) — walks `previous_league_id` back to the inaugural
   season and writes raw Sleeper responses to `data/raw/<season>/`. No transforms.
2. **Transform** (`scripts/transform/build.ts`) — reads `data/raw`, computes all
   derived stats with plain TypeScript, writes `data/marts/marts.json`.
3. **App** (`app/`, `components/`) — Next.js Server Components import the marts and
   prerender every page (SSG). Charts are client components fed plain props.

```
Sleeper API ──(ingest)──▶ data/raw/*.json ──(transform)──▶ data/marts/marts.json ──▶ Next.js (SSG)
```

`data/` is committed on purpose — it is the source of truth, so the site can be
rebuilt from scratch and never hits the live API at request time.

## Commands

```bash
npm run dev              # local dev server
npm run build            # production build (typecheck + lint + SSG)

npm run ingest:backfill  # one-time: pull ALL seasons into data/raw (~50s, ~220 calls)
npm run ingest:refresh   # in-season: re-pull only the current season (cheap)
npm run data:build       # recompute data/marts from data/raw
npm run data:all         # backfill + build
npm run data:refresh     # refresh + build  (used by the weekly GitHub Action)
```

After cloning, run `npm install` then `npm run data:all` to populate `data/`.

## Configuration

`league.config.ts` holds the only required setting:

```ts
currentLeagueId: "1315853532460498944"
```

**Each new season** Sleeper creates a new `league_id`. When the next season's league
exists, update `currentLeagueId` to it and run `npm run data:all`. The new league's
`previous_league_id` automatically links the prior history.

## Data correctness notes

- All managers are joined on Sleeper `user_id` (stable), never `roster_id` (only
  stable within a season).
- Points recombine Sleeper's split fields: `fpts + fpts_decimal/100`.
- `fpts`/`ppts` cover the **regular season** only; the optimal-lineup engine is
  validated against `ppts` (46/48 rosters match to the penny; the rest differ by
  ≤5 pts due to using a current player-metadata snapshot for historical eligibility).
- Per-player points (`players_points`) are observed-but-undocumented; they're present
  for this league and power the trade/start-sit overlays. Code degrades gracefully if
  they ever disappear.
- Trade verdicts are **realized points**, never dynasty market value.

## Deploy (free)

1. Push this folder to a GitHub repo (it is the repo root).
2. Import the repo on **Vercel** (Hobby tier). Framework auto-detects Next.js. Deploy.
3. Share the public URL with the league.

### Weekly auto-refresh

`.github/workflows/refresh.yml` runs Tuesdays 13:17 UTC (Sep–Jan), re-pulls the
current week, rebuilds marts, and commits `data/**`. The push triggers a Vercel
redeploy automatically. You can also trigger it manually from the Actions tab
(`workflow_dispatch`). Note: GitHub disables scheduled workflows after 60 days of
repo inactivity — re-enable each preseason.
