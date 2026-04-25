# Local development

How to stand up the full stack on your machine: the Next.js app, the
browser extension, and the CLI refresher, all talking to the same Vercel
Blob bucket as production but isolated by a key prefix.

## Prerequisites

- **Node 20+** (most deps require it; older Node may install but breaks
  at runtime — WXT needs ≥20, `next-auth@beta` needs ≥18.17 but Node 20
  is the safe floor).
- **Vercel CLI**: `npm i -g vercel`, then `vercel link` from the repo
  root once.
- **Google Cloud OAuth client** — see
  [docs/google-oauth.md](./google-oauth.md) for the step-by-step.
- **Vercel Blob store**: provision via Vercel Dashboard → your project →
  Storage → Create Database → Blob.

## One-time setup

```bash
# clone & install
git clone <repo>
cd rugby-fantasy
npm install
cd extension && npm install && cd ..

# pull env from Vercel (gives BLOB_READ_WRITE_TOKEN + AUTH_*)
vercel env pull .env.local

# add the dev-only namespace prefix so dev never overwrites prod keys
echo 'BLOB_PREFIX=dev/' >> .env.local

# allowlist your email (and any teammates)
echo 'ALLOWED_EMAILS=you@example.com,teammate@example.com' >> .env.local
```

Generate `AUTH_SECRET` with `npx auth secret` (writes to `.env.local`)
and make sure `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` from
[docs/google-oauth.md](./google-oauth.md) are also present.

If you'll run the CLI (`npm run mz:update:players`), also set:

```bash
# in .env.local — your userId for the per-user blob key.
# Find it after signing in by hitting http://localhost:3000/api/me.
echo 'USER_ID=<your-google-sub>' >> .env.local

# in 2026/top14/.env — the lagrandemelee API token.
# Sniff it from DevTools on lagrandemelee.midi-olympique.fr after login.
echo 'TOP14_TOKEN=<token>' > 2026/top14/.env
```

See [.env.example](../.env.example) for the full list of variables.

## Running the stack

Three terminals:

```bash
# 1. Next.js app
npm run dev                      # http://localhost:3000

# 2. Extension build (rebuilds on save)
cd extension
echo 'APP_URL=http://localhost:3000' > .env
npm run dev                      # Chrome target → .output/chrome-mv3/
# OR
npm run dev:firefox              # Firefox target → .output/firefox-mv3/

# 3. (optional) CLI refresher — uploads a fresh snapshot to your
#    per-user Blob key (players/dev/{USER_ID}.json) without going
#    through the extension. Requires TOP14_TOKEN, USER_ID, and the
#    BLOB_* envs (auto-loaded from `.env.local` + `2026/top14/.env`).
npm run mz:update:players
```

You only need one extension target running at a time, but you can run
both in parallel terminals if you want to test cross-browser. Each
target writes to its own `.output/{browser}-mv3/` folder.

### Loading the dev build

**Chrome**: open `chrome://extensions`, toggle Developer mode on, click
**Load unpacked**, pick `extension/.output/chrome-mv3/`. WXT's `dev`
mode auto-reloads the bundle, and the extension card refreshes itself.

**Firefox**: `npm run dev:firefox` launches Firefox Developer Edition
via `web-ext` with the extension already loaded. The launched browser
uses a dedicated profile at `extension/.wxt/rugby-fantasy-profile/` (kept
across runs — see "First-run profile setup" below). If you'd rather
load it in your _main_ Firefox session: open
`about:debugging#/runtime/this-firefox` → **Load Temporary Add-on…** →
pick the `manifest.json` inside `extension/.output/firefox-mv3/`. Temp
add-ons there disappear when you quit Firefox and don't auto-reload on
rebuild; click the **Reload** button on the same page after each
change.

#### First-run profile setup

`web-ext` doesn't create the profile directory itself — you run this
once from the repo root:

```bash
"/Applications/Firefox Developer Edition.app/Contents/MacOS/firefox" \
  -CreateProfile "rugby-fantasy-dev $(pwd)/extension/.wxt/rugby-fantasy-profile" \
  -no-remote
```

That creates an empty profile rooted at
`extension/.wxt/rugby-fantasy-profile/` and registers it in Firefox's profile
list. From then on, `npm run dev:firefox` launches Dev Edition into
that profile every time, and `keepProfileChanges: true` in
[extension/wxt.config.ts](../extension/wxt.config.ts) preserves cookies
and history between runs — sign into lagrandemelee and the app _once_
in that profile and you're set.

If you want to reset the profile (e.g. to test a fresh sign-in flow),
delete the directory: `rm -rf extension/.wxt/rugby-fantasy-profile/`, then
re-run the `-CreateProfile` command.

For the full extension story — install steps for prod, the auth-dot
model, troubleshooting the upload — see
[extension/README.md](../extension/README.md).

### Firefox-specific gotchas

- **`Error: spawn /Applications/Firefox.app/Contents/MacOS/firefox
ENOENT` from `npm run dev:firefox`.** WXT defaults the Firefox runner
  to `firefoxdeveloperedition` (configured in
  [extension/wxt.config.ts](../extension/wxt.config.ts) via
  `runner.binaries.firefox`). If you only have _regular_ Firefox
  installed, override that default by setting `WEB_EXT_FIREFOX` in
  `extension/.env`:
  ```
  WEB_EXT_FIREFOX=firefox
  ```
  Recognized aliases (resolved by `web-ext` to platform-specific paths):
  `firefox`, `firefoxdeveloperedition`, `beta`, `nightly`. Or pass an
  absolute path if your install is in a non-standard location. Setting
  the env var only via the shell (without `.env`) won't help — WXT calls
  `web-ext` as a library, not via the CLI, so it ignores
  `WEB_EXT_FIREFOX` unless we hand it through `wxt.config.ts` (which
  reads `.env`).
- **NextAuth cookie not sent on localhost.** Firefox requires
  `Secure: true` for `SameSite=None` cookies, and Secure can't be set on
  HTTP. NextAuth's default `next-auth.session-token` is `SameSite=Lax`
  on dev (HTTP), which Firefox _does_ allow extensions to use as long as
  the popup origin is in `host_permissions` (it is — we add
  `http://localhost:3000/*`). If the app dot still won't go green in FF
  but works in Chrome, open the popup's DevTools (right-click in the
  popup → Inspect) and check the `GET /api/me` request: if the response
  is 401 with no cookie, the cookie didn't ship — usually a clue that
  `host_permissions` is missing or `APP_URL` doesn't match the URL you
  signed into.
- **Temporary add-on lost its storage on restart.** Only relevant when
  loading via `about:debugging` in your main Firefox: temp add-ons get a
  fresh extension UUID each session, so `browser.storage.local` is
  wiped. The `npm run dev:firefox` path doesn't have this problem — the
  persistent profile keeps the same UUID across runs.

## Day-to-day flow

1. Sign into `http://localhost:3000` with Google. First sign-in fails
   with `AccessDenied` if your email isn't in `ALLOWED_EMAILS` — add it,
   restart `next dev`.
2. Sign into `https://lagrandemelee.midi-olympique.fr` in another tab.
3. Click the extension icon. Both auth dots green → click **Refresh
   players**. The snapshot lands at
   `players/dev/<your-google-sub>.json` in the shared Blob store.
4. Reload `http://localhost:3000/2026/top14`. Your snapshot is served
   from the dev blob.

## Storage layout & isolation

```
players/<userId>.json          # prod key (BLOB_PREFIX="")
players/dev/<userId>.json      # dev key (BLOB_PREFIX="dev/")
```

Same Blob store, different prefixes — `vercel blob list players/` shows
both side by side. Reads use the same prefix, so dev only ever reads dev
data and prod only ever reads prod data.

If you need stronger isolation, create a second Blob store via the
dashboard and use its token in `.env.local`. Costs more but no shared
state.

## Common gotchas

- **Sign-in returns "AccessDenied"**: email not in `ALLOWED_EMAILS`.
  Update `.env.local` and restart `next dev`.
- **Extension popup "app" dot stays red on localhost**: confirm
  `host_permissions` in the dev manifest includes
  `http://localhost:3000/*` (it does if `APP_URL` is set in
  `extension/.env`). After changing `APP_URL`, `wxt dev` rebuilds; click
  the reload arrow on the extension card.
- **Cookies don't reach `/api/players`**: the popup uses
  `credentials: "include"` and the manifest lists the app origin — both
  are scaffolded. If you change ports, rebuild the extension.
- **`next-auth` build error on Vercel**: `AUTH_SECRET` must be set in
  Vercel env (Production + Preview). Generate it locally with
  `npx auth secret` and copy.
- **Stale snapshot in the app after upload**: `getPlayers` is cached via
  `unstable_cache` and tagged per-user. The `POST /api/players` route
  calls `revalidateTag(playersTag(userId))` on success, but the CLI
  (`npm run mz:update:players`) writes Blob directly and **does not**
  revalidate — restart `next dev` after a CLI run, or hit any page that
  triggers a fresh fetch.
- **CLI fails with "USER_ID is not set"**: append `USER_ID=<your google sub>`
  to `.env.local`. Find your sub by signing into the app and hitting
  [http://localhost:3000/api/me](http://localhost:3000/api/me).
- **CLI fails with "BLOB_READ_WRITE_TOKEN is not set"**: run
  `vercel env pull .env.local` from the repo root.

## Architecture pointers

- [auth.ts](../auth.ts) — NextAuth v5 config (Google + JWT).
- [app/api/players/route.ts](../app/api/players/route.ts) — extension
  upload endpoint.
- [app/api/me/route.ts](../app/api/me/route.ts) — extension auth probe.
- [app/lib/players.ts](../app/lib/players.ts) — server-side `getPlayers`
  reading from `players/{prefix}{userId}.json` in Vercel Blob (cached
  via `unstable_cache` with a per-user tag).
- [2026/top14/minizinc/updatePlayers.ts](../2026/top14/minizinc/updatePlayers.ts)
  — CLI refresher; writes to the same blob key the app reads.
- [extension/](../extension/) — the browser extension; see its
  [README](../extension/README.md).
