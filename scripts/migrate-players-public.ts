// Copies all app blobs from the old PRIVATE Vercel Blob store to the new
// PUBLIC store at the same pathnames. Covers:
//   - players/{PREFIX}{userId}.json     (per-user roster snapshot)
//   - expected-results/{PREFIX}{userId}.json  (per-user, optional)
//   - top14-2026/admin.json             (global admin data, optional)
//
// Run: npx tsx --env-file=.env.local ./scripts/migrate-players-public.ts
//
// Requires in .env.local:
//   USER_ID=<your Google sub>
//   BLOB_READ_WRITE_TOKEN=<old PRIVATE store token>
//   BLOB_PUBLIC_READ_WRITE_TOKEN=<new PUBLIC store token>
//   BLOB_PREFIX=<same prefix the app uses; empty in prod>
//
// After this script succeeds, on Vercel:
//   1. Replace BLOB_READ_WRITE_TOKEN's value with the new public store's
//      token (i.e. point the standard env var at the public store).
//   2. Optionally remove BLOB_PUBLIC_READ_WRITE_TOKEN (no longer used).
//   3. Redeploy.

import { get, put } from "@vercel/blob";

const main = async () => {
  const userId = process.env.USER_ID;
  if (!userId) throw new Error("USER_ID is not set");
  const privateToken = process.env.BLOB_READ_WRITE_TOKEN;
  const publicToken = process.env.BLOB_PUBLIC_READ_WRITE_TOKEN;
  if (!privateToken) throw new Error("BLOB_READ_WRITE_TOKEN is not set");
  if (!publicToken) throw new Error("BLOB_PUBLIC_READ_WRITE_TOKEN is not set");

  const PREFIX = process.env.BLOB_PREFIX ?? "";

  const paths = [
    { path: `players/${PREFIX}${userId}.json`, required: true },
    { path: `expected-results/${PREFIX}${userId}.json`, required: false },
    { path: `top14-2026/admin.json`, required: false },
  ];

  for (const { path, required } of paths) {
    const existing = await get(path, {
      access: "private",
      useCache: false,
      token: privateToken,
    });
    if (!existing || existing.statusCode !== 200) {
      const msg = `No private blob at ${path}`;
      if (required) throw new Error(msg);
      console.log(`skip: ${msg}`);
      continue;
    }
    const json = await new Response(existing.stream).text();
    const result = await put(path, json, {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
      token: publicToken,
    });
    console.log(
      `migrated ${path} (${json.length.toLocaleString()} bytes) → ${result.url}`,
    );
  }
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
