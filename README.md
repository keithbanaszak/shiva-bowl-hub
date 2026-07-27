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

## Deploy & keep it updated

The site is live at **https://shiva-bowl-hub.vercel.app**. Two ways to ship changes;
the first is the one you want.

### The good setup — connect GitHub once, then it runs itself

This is what makes the site **update itself when league activity happens** and
**deploy on every change** without you touching a terminal. One-time, ~5 minutes:

1. **Create an empty GitHub repo** (no README/licence) — e.g. `shiva-bowl-hub`.
2. **Push this folder to it:**
   ```bash
   git remote add origin https://github.com/<you>/shiva-bowl-hub.git
   git push -u origin main
   ```
3. **Connect it to the existing Vercel project:** Vercel dashboard →
   `shiva-bowl-hub` → Settings → Git → Connect the repo. The URL and history are
   preserved. From now on **every push auto-deploys**.

That's it. Once connected, the refresh Action below runs on schedule, commits any
new data, and the push redeploys — no computer needs to be on.

> **Optional, only if you skip step 3:** create a Deploy Hook (Vercel → Settings →
> Git → Deploy Hooks), and add its URL as a repo secret named `VERCEL_DEPLOY_HOOK`.
> The Action will POST it after a refresh so the data still ships. Unnecessary once
> git is connected.

### Auto-refresh (the "updates when activity happens" part)

Sleeper has no push notifications, so freshness is polling. `.github/workflows/refresh.yml`:

- runs **daily** 13:17 UTC during the season (Sep–Jan) — waivers, trades and cuts
  happen almost every day, so the site stays near-live;
- runs **weekly** (Tuesdays) the rest of the year, which still catches dynasty
  offseason moves;
- re-pulls the current season, pulls the [rules sheet](#league-rules--manager-profiles),
  rebuilds every mart, and commits `data/**` **and** `public/search-index.json`
  (the ⌘K index — it lives outside `data/` and Vercel doesn't regenerate it, so it
  must be committed for new players to appear in search);
- can be run any time from the repo's **Actions** tab → *Refresh Sleeper data* →
  *Run workflow*.

> GitHub disables scheduled workflows after **60 days of no repo activity**. The
> Action's own commits count as activity, so it self-sustains whenever data is
> changing; only a completely dead stretch pauses it. Re-enable from the Actions
> tab if that happens (and always check each preseason).

### Deploying by hand (no GitHub)

Until git is connected, ship with the Vercel CLI from the project root:

```bash
npm run data:refresh   # pull Sleeper + sheet, rebuild marts
npx vercel --prod      # build and deploy
```

Nothing updates on its own this way — you re-run both after every league move.

## League rules & manager profiles

`/rules` and manager real-names come from a Google Sheet you edit directly, so the
league's house rules aren't buried in code. Set it up once:

1. Create a Google Sheet with two tabs:
   - **rules** — columns `category, rule, detail, status, vote_closes, sort_order, pinned`
     (`status` is `active` / `proposed` / `retired`).
   - **managers** — columns `user_id, real_name, nickname, joined, favorite_team, bio`.
2. File → Share → **Publish to web**.
3. Put the sheet id and each tab's `gid` (both in the tab URL) into
   `configSheet` in `league.config.ts`.

Then `npm run config:pull` (the refresh Action does this automatically). It's
**fail-soft**: if the sheet is unreachable the committed `data/league-config.json`
is kept, so a bad edit never breaks a deploy. Until you link a sheet, the defaults
committed in that file are used.

**Each new season** Sleeper mints a new `league_id`; update `currentLeagueId` in
`league.config.ts` and run `npm run data:all`.
