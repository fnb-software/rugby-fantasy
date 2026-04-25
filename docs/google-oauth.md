# Setting up Google OAuth

NextAuth needs a Google OAuth client ID/secret. One-time setup, takes
~5 minutes.

1. **Open the Google Cloud Console** at
   <https://console.cloud.google.com/>. Sign in with the Google account
   that should own the credentials.

2. **Create or select a project** from the project picker in the top bar.
   Name it something recognizable (e.g. `rugby-fantasy`).

3. **Configure the OAuth consent screen** (required once per project,
   before you can create a client):
   - Left nav → **APIs & Services → OAuth consent screen**.
   - **User type**: *External* (use *Internal* only if you have a Google
     Workspace and want to scope the app to your org).
   - **App name**: `rugby-fantasy` (or whatever you'll show users).
   - **User support email** + **Developer contact**: your email.
   - **Scopes**: leave the defaults — NextAuth only needs `openid`,
     `email`, `profile`. These are non-sensitive and require no Google
     review.
   - **Test users**: add the same emails you intend to put in
     `ALLOWED_EMAILS`. While the app is in "Testing" mode, *only* these
     test users can sign in. Save.

4. **Create the OAuth client**:
   - Left nav → **APIs & Services → Credentials**.
   - **+ Create Credentials → OAuth client ID**.
   - **Application type**: *Web application*.
   - **Name**: `rugby-fantasy web`.
   - **Authorized JavaScript origins** (optional but tidy):
     - `http://localhost:3000`
     - `https://<your-prod-domain>`
   - **Authorized redirect URIs** (required, must match exactly):
     - `http://localhost:3000/api/auth/callback/google`
     - `https://<your-prod-domain>/api/auth/callback/google`
   - **Create**. A modal shows the **Client ID** and **Client secret** —
     copy them now (the secret is also retrievable from the Credentials
     page later).

5. **Plug the values into your env**:
   - Locally: append to `.env.local`
     ```
     AUTH_GOOGLE_ID=<client id>
     AUTH_GOOGLE_SECRET=<client secret>
     ```
   - On Vercel: Project → Settings → Environment Variables → add
     `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` for *Production* and
     *Preview*.

6. **Promote to "In production" later** — only needed when you want
   users outside the OAuth consent screen's test-user list to sign in.
   Until then, the test-user list + your `ALLOWED_EMAILS` allowlist both
   gate access (the test-user check happens in Google's flow; the
   allowlist runs in [auth.ts](../auth.ts) right after).
