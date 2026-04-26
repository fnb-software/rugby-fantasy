import "server-only";
import type { Teamsheet } from "@/app/2026/top14/teamsheets";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

const FETCH_TIMEOUT_MS = 10_000;
const PAGE_BYTE_CAP = 80_000;

export type FetchError = { url: string; reason: string };

export type ExtractResult = {
  teamsheets: Record<string, Teamsheet>;
  fetchErrors: FetchError[];
};

export const extractTeamsheets = async ({
  urls,
  canonicalClubs,
}: {
  urls: string[];
  canonicalClubs: string[];
}): Promise<ExtractResult> => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("missing_groq_api_key");

  const fetchErrors: FetchError[] = [];
  const pages: { url: string; text: string }[] = [];
  await Promise.all(
    urls.map(async (url) => {
      try {
        const text = await fetchPageText(url);
        pages.push({ url, text });
      } catch (e) {
        fetchErrors.push({
          url,
          reason: e instanceof Error ? e.message : "fetch_failed",
        });
      }
    }),
  );

  if (pages.length === 0) {
    return { teamsheets: {}, fetchErrors };
  }

  const prompt = buildPrompt({ pages, canonicalClubs });
  const response = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You extract structured rugby teamsheet data from web pages and respond with a single JSON object.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0,
    }),
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`groq_http_${response.status}: ${body.slice(0, 300)}`);
  }
  const json = await response.json();
  const raw = json?.choices?.[0]?.message?.content;
  if (typeof raw !== "string") throw new Error("groq_no_text_part");
  const parsed = JSON.parse(raw) as {
    teamsheets?: Array<{
      club?: string;
      starters?: { name?: string; uncertain?: boolean }[];
      subs?: { name?: string; uncertain?: boolean }[];
    }>;
  };

  const allowed = new Set(canonicalClubs);
  const teamsheets: Record<string, Teamsheet> = {};
  for (const item of parsed.teamsheets ?? []) {
    if (!item?.club || !allowed.has(item.club)) continue;
    const sanitize = (
      arr: { name?: string; uncertain?: boolean }[] | undefined,
    ) =>
      (arr ?? [])
        .filter((e): e is { name: string; uncertain?: boolean } =>
          typeof e?.name === "string" && e.name.trim().length > 0,
        )
        .map(({ name, uncertain }) => ({ name, uncertain: !!uncertain }));
    teamsheets[item.club] = {
      starters: sanitize(item.starters),
      subs: sanitize(item.subs),
    };
  }

  return { teamsheets, fetchErrors };
};

const fetchPageText = async (url: string): Promise<string> => {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ac.signal,
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; rugby-fantasy/1.0; +admin teamsheets extractor)",
        accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });
    if (!res.ok) throw new Error(`http_${res.status}`);
    const html = await res.text();
    return cleanHtml(html).slice(0, PAGE_BYTE_CAP);
  } finally {
    clearTimeout(timer);
  }
};

const cleanHtml = (html: string): string =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<\/(?:td|th)>/gi, " | ")
    .replace(/<\/(?:tr|li|p|h[1-6]|div|section|article)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const buildPrompt = ({
  pages,
  canonicalClubs,
}: {
  pages: { url: string; text: string }[];
  canonicalClubs: string[];
}): string => {
  const sources = pages
    .map((p, i) => `--- SOURCE ${i + 1} (${p.url}) ---\n${p.text}`)
    .join("\n\n");
  return `You are extracting French Top 14 rugby probable lineups ("compositions probables") from web pages.

Allowed club names (use exactly these spellings — accents and capitalization included — for the "club" field):
${canonicalClubs.map((c) => `- ${c}`).join("\n")}

Output a single JSON object with this exact shape and no other top-level keys:
{
  "teamsheets": [
    {
      "club": "<one of the allowed names>",
      "starters": [{ "name": "<last name>", "uncertain": <boolean> }, ...],
      "subs":     [{ "name": "<last name>", "uncertain": <boolean> }, ...]
    }
  ]
}

Rules:
- One array entry per club whose teamsheet appears in the sources. Skip clubs you can't confidently identify. Do NOT invent players.
- "starters": ordered list of probable starter last names. The pages typically number them 1-15; preserve that order.
- "subs": ordered list of probable replacements (typically 8 but may vary).
- Preserve the first-name initial when the source shows it: emit "X. Lastname" (e.g. "R. Ntamack", "Pa. Boudehent", "J.-L. Joseph"). If the source only gives a full first name, abbreviate it to its first letter plus a period ("Romain Ntamack" → "R. Ntamack"). If neither initial nor first name is shown, output just the surname.
- Mark "uncertain": true when the page presents the player as an alternative — typical signals: "ou X", a slash ("Smith / Jones"), parentheses, "?", "à confirmer", "incertain", or two names listed for the same shirt number. Otherwise false.
- Diacritic-preserved names ("Lévêque", "Bordeaux-Bègles", etc.). Keep accents.
- If a source page has multiple matches, extract every recognized club from it.
- Output ONLY the JSON object. No prose, no markdown fences.

CRITICAL — assigning each player to the correct team:

Match pages (e.g. an "X vs Y" preview) list TWO teamsheets on a single page. Mixing players between the two clubs is the most common failure — be deliberate.

- The URL is ground truth for which two clubs are in the match. URLs like \`/matchs/toulouse-clermont-...\` mean the match is Toulouse vs Clermont; do not output players for any other club from that source.
- Some pages render the two teamsheets as a side-by-side table. After cleanup the columns are separated by " | " and rows by newlines. In that layout, the LEFT column is one team and the RIGHT column is the other — never read across rows. Identify the column header (team name) for each side, then walk that single column top-to-bottom to collect 15 starters then the subs.
- Other pages list the two teamsheets one after the other ("Toulouse XV: 1.A 2.B ... Clermont XV: 1.X 2.Y ..."). Anchor on the team name that introduces each numbered list. Once a list ends (typically after the subs), only the next team-name header restarts attribution.
- Ignore mentions of clubs in navigation, sidebars, schedule widgets, ads, "next round" panels, recent-result banners, or comment sections. Those are not lineups.
- If you cannot confidently determine which club a player belongs to, OMIT that player rather than guess.

${sources}`;
};
