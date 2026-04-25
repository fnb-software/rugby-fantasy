# Top14 fantasy refresher — browser extension

Refreshes your fantasy data by calling the lagrandemelee API from your
logged-in browser session and uploading the result to your rugby-fantasy
app on Vercel. The app then renders your snapshot. Works in Chrome and
Firefox; same source, two builds.

> Setting up the full stack (Next.js app + Vercel Blob + this extension,
> all on localhost)? See [docs/local-dev.md](../docs/local-dev.md).

---

## Build from source

```bash
cd extension
npm install

# point the build at your app deployment
echo 'APP_URL=https://rugby-fantasy.vercel.app' > .env
# or for local dev:
echo 'APP_URL=http://localhost:3000' > .env

npm run build:chrome     # output → extension/.output/chrome-mv3/
npm run build:firefox    # output → extension/.output/firefox-mv3/
```

`APP_URL` is baked into the build (it goes into the manifest's
`host_permissions` and the popup's fetch target). Rebuild when switching
between localhost and prod. Use `wxt zip:chrome` / `zip:firefox` to
produce shareable artifacts in `extension/.output/`.

---

## Install — Chrome

1. Build (or unzip a prebuilt artifact into a folder of your choice).
2. Open `chrome://extensions`.
3. Toggle **Developer mode** on (top-right).
4. Click **Load unpacked** and select `extension/.output/chrome-mv3/`.
5. Pin the extension to the toolbar (puzzle-piece icon → pin).

To update: rebuild, then click the reload arrow on the extension's card.

---

## Install — Firefox

Two paths.

### Temporary (testing)

1. Build (or unzip into `extension/.output/firefox-mv3/`).
2. Open `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on…** and pick the `manifest.json` inside
   that folder.
4. Active until you close Firefox.

### Signed via AMO self-distribution (persistent, free)

1. Sign up at <https://addons.mozilla.org>.
2. Generate API credentials at
   <https://addons.mozilla.org/developers/addon/api/key/>.
3. Build and zip:
   ```bash
   cd extension
   npm run zip:firefox
   ```
4. Sign:
   ```bash
   npx web-ext sign \
     --channel unlisted \
     --api-key  YOUR_KEY \
     --api-secret YOUR_SECRET \
     --source-dir .output/firefox-mv3
   ```
5. AMO returns a signed `.xpi`. Install via `about:addons` → gear icon →
   **Install Add-on From File…**. Survives restarts.

---

## Use

1. Open `https://lagrandemelee.midi-olympique.fr` in a tab and stay logged
   in. The content script captures your session token.
2. Sign into the rugby-fantasy app (the URL you set as `APP_URL`) with
   your Google account. The session cookie tells the extension that the
   app side is ready.
3. Click the toolbar icon. The popup shows two dots:
   - **lg-melee** — green when the lagrandemelee token is captured.
   - **app** — green when you're signed into the app.
   Both must be green to enable the **Refresh players** button.
4. Pick the round and the mode:
   - **Teamsheets only** — fast. Refreshes only the players in
     [`app/2026/top14/teamsheets.ts`](../app/2026/top14/teamsheets.ts) for
     the upcoming round, reusing your last cached snapshot for the rest.
   - **All players** — slow. Pages through the full roster.
5. Click **Refresh players**. The progress bar ticks; on completion the
   extension uploads the snapshot to `${APP_URL}/api/players`. Reload your
   app pages and you'll see your fresh data.

The popup must stay open during a refresh; closing it cancels the run.

---

## Troubleshooting

- **lg-melee dot stays red.** Open `lagrandemelee.midi-olympique.fr`,
  log in, reload once. The content script needs the page's storage to
  contain an auth-shaped key. If it still fails, open the page's DevTools
  → Application → Local Storage and look for the auth key; report it so
  the regex in `entrypoints/content.ts` can be tightened.
- **app dot stays red.** Click the **Sign in to the app** link in the
  popup, complete Google sign-in. If the dot still doesn't go green,
  confirm `APP_URL` in your build matches the URL you signed into and
  that the manifest's `host_permissions` includes that origin (`wxt
  build` regenerates the manifest from `wxt.config.ts`).
- **Upload returns 401.** Same cause as above. The popup uses
  `credentials: "include"` so the app's session cookie tags along; if the
  cookie isn't sent, the cookie's `SameSite` may be too strict — switch
  the app to `SameSite=None; Secure` in production for the
  `next-auth.session-token` cookie.
- **Upload returns 413.** The snapshot exceeds Vercel's request body
  limit (4.5 MB on Hobby, 10 MB on Pro). Top14 is well under this.
- **Firefox temporary add-on disappeared after restart.** Expected for
  unsigned add-ons. Use the AMO-signed path above.

---

## Architecture quick reference

- [extension/entrypoints/content.ts](entrypoints/content.ts) — runs on
  lagrandemelee, copies the session token into `browser.storage.local`.
- [extension/entrypoints/popup/main.ts](entrypoints/popup/main.ts) —
  reads the lg-melee token from storage, calls `searchjoueurs` /
  `statsjoueur`, posts the result to `${APP_URL}/api/players`. Uses the
  app's session cookie via `credentials: "include"` (allowed by
  `host_permissions` on the app origin).
- [extension/shared/api.ts](shared/api.ts) — endpoint URLs and request
  bodies, shared between this extension and the
  [CLI script](../2026/top14/minizinc/updatePlayers.ts).
- [extension/shared/teamsheetsIndex.ts](shared/teamsheetsIndex.ts) —
  builds the teamsheet → club → names map; same source of truth as the
  CLI's teamsheet-filter optimization.

The extension never sees the app's `BLOB_READ_WRITE_TOKEN`; only the
server-side route handler does. The extension only proves who the user
is via the session cookie.
