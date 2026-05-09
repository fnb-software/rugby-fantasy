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

# point the build at your app deployment, and (optionally) drop in AMO
# credentials so the sign commands below work without copy-paste edits.
cat > .env <<'EOF'
APP_URL=https://rugby-fantasy.vercel.app
# or for local dev: APP_URL=http://localhost:3000

# Get these at https://addons.mozilla.org/developers/addon/api/key/
# (only needed for the web-ext sign commands below)
JWT_ISSUER=
JWT_SECRET=
EOF

npm run build:chrome     # output → extension/.output/chrome-mv3/
npm run build:firefox    # output → extension/.output/firefox-mv3/
```

`APP_URL` is baked into the build (it goes into the manifest's
`host_permissions` and the popup's fetch target). Rebuild when switching
between localhost and prod. Use `wxt zip:chrome` / `zip:firefox` to
produce shareable artifacts in `extension/.output/`.

The sign commands further down assume the AMO credentials live in
`.env` — they prefix every invocation with `set -a; source .env; set +a`
so you can copy-paste verbatim. `.env` is gitignored.

---

## Install — Chrome

1. Build (or unzip a prebuilt artifact into a folder of your choice).
2. Open `chrome://extensions`.
3. Toggle **Developer mode** on (top-right).
4. Click **Load unpacked** and select `extension/.output/chrome-mv3/`.
5. Pin the extension to the toolbar (puzzle-piece icon → pin).

To update: rebuild, then click the reload arrow on the extension's card.

---

## Install — Firefox (desktop)

Two paths.

### Temporary (testing)

1. Build (or unzip into `extension/.output/firefox-mv3/`).
2. Open `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on…** and pick the `manifest.json` inside
   that folder.
4. Active until you close Firefox.

### Signed via AMO self-distribution (persistent, free)

Desktop only — Firefox for Android does not accept install-from-file
XPIs. For Android, use the listed-on-AMO path below.

1. Sign up at <https://addons.mozilla.org>.
2. Generate API credentials at
   <https://addons.mozilla.org/developers/addon/api/key/>.
3. Build and zip:
   ```bash
   cd extension
   npm run zip:firefox
   ```
4. Sign (loads `JWT_ISSUER` / `JWT_SECRET` from `.env`):
   ```bash
   set -a; source .env; set +a
   npx web-ext sign \
     --channel=unlisted \
     --api-key="$JWT_ISSUER" \
     --api-secret="$JWT_SECRET" \
     --source-dir=.output/firefox-mv3
   ```
5. AMO returns a signed `.xpi`. Install via `about:addons` → gear icon →
   **Install Add-on From File…**. Survives restarts.

---

## Install — Firefox for Android

Firefox Android (stable, 120+) only installs add-ons that are **listed**
on AMO. There is no install-from-file flow on the stable build, so the
extension has to go through public AMO review.

The manifest already declares Android compatibility via
`browser_specific_settings.gecko_android` (min Firefox 120) — see
[wxt.config.ts](wxt.config.ts).

1. Build, zip, and tarball the source (AMO requires source for bundled
   builds):
   ```bash
   cd extension
   npm run zip:firefox
   tar --exclude=node_modules --exclude=.output \
       --exclude=web-ext-artifacts --exclude=.wxt \
       --exclude=.env --exclude=.gitignore --exclude=.git \
       -czf .output/firefox-source.tar.gz .
   ```
2. The first listed version needs metadata (categories, summary,
   license). The repo ships an [`amo-metadata.json`](amo-metadata.json)
   in this folder with `"other"` categories and an AGPL-3.0-only
   license (closest match to AGPL-3.0-or-later in AMO's slug list) — adjust if you want a more specific category. See the
   [AMO API reference](https://addons-server.readthedocs.io/en/latest/topics/api/addons.html)
   for the full field list.
3. Submit and sign in one shot (loads AMO credentials from `.env`):
   ```bash
   set -a; source .env; set +a
   npx web-ext sign \
     --channel=listed \
     --api-key="$JWT_ISSUER" \
     --api-secret="$JWT_SECRET" \
     --source-dir=.output/firefox-mv3 \
     --upload-source-code=.output/firefox-source.tar.gz \
     --amo-metadata=amo-metadata.json
   ```
4. AMO queues the version for human review (unlike the unlisted flow,
   which signs immediately). When approved, the add-on appears at
   `addons.mozilla.org/.../addon/<slug>/`.
5. On the phone, open that page in Firefox for Android and tap **Add to
   Firefox**. Subsequent version bumps reuse the same `web-ext sign`
   command — no `--amo-metadata` needed after the first submission.

### Android UX notes

- The toolbar icon lives under **⋮ menu → Extensions → Top14 fantasy
  refresher**. Tapping it opens the popup as a full-height sheet.
- The popup must stay open during a refresh (same constraint as
  desktop). Backgrounding Firefox cancels the run.
- The lg-melee login lives in a separate tab — sign in to
  `lagrandemelee.midi-olympique.fr` first, then open the popup.

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
