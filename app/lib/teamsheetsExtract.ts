import "server-only";
import type { Teamsheet } from "@/app/2026/top14/teamsheets";

const FETCH_TIMEOUT_MS = 10_000;
const PAGE_BYTE_CAP = 80_000;

type LlmProvider = {
  name: string;
  url: string;
  apiKey: string;
  model: string;
  extraHeaders?: Record<string, string>;
};

export type FetchError = { url: string; reason: string };

export type AttemptEvent =
  | { phase: "start"; provider: string }
  | { phase: "fail"; provider: string; reason: string }
  | { phase: "success"; provider: string };

export type ExtractResult = {
  teamsheets: Record<string, Teamsheet>;
  fetchErrors: FetchError[];
};

export const extractTeamsheets = async ({
  urls,
  texts,
  canonicalClubs,
  onAttempt,
}: {
  urls: string[];
  texts?: string[];
  canonicalClubs: string[];
  onAttempt?: (event: AttemptEvent) => void;
}): Promise<ExtractResult> => {
  const providers = buildProviders();
  if (providers.length === 0) throw new Error("missing_llm_api_key");

  const fetchErrors: FetchError[] = [];
  const pages: { url: string; text: string }[] = [];
  await Promise.all(
    urls.map(async (url) => {
      try {
        const text = await fetchPageText(url);
        console.log({ text });
        pages.push({ url, text });
      } catch (e) {
        fetchErrors.push({
          url,
          reason: e instanceof Error ? e.message : "fetch_failed",
        });
      }
    }),
  );
  (texts ?? []).forEach((t, i) => {
    const trimmed = t.trim();
    if (trimmed.length === 0) return;
    pages.push({
      url: `pasted-${i + 1}`,
      text: trimmed.slice(0, PAGE_BYTE_CAP),
    });
  });

  if (pages.length === 0) {
    return { teamsheets: {}, fetchErrors };
  }

  const prompt = buildPrompt({ pages, canonicalClubs });
  const raw = await callLlm({ providers, prompt, onAttempt });
  console.log(raw);
  const parsed = JSON.parse(raw) as {
    teamsheets?: Array<{
      club?: string;
      starters?: string[];
      subs?: string[];
    }>;
  };

  const allowed = new Set(canonicalClubs);
  const teamsheets: Record<string, Teamsheet> = {};
  for (const item of parsed.teamsheets ?? []) {
    if (!item?.club || !allowed.has(item.club)) continue;
    const sanitize = (arr: string[] | undefined) =>
      (arr ?? [])
        .filter((e): e is string => typeof e === "string" && e.trim().length > 0)
        .map((e) => {
          const uncertain = e.endsWith("*");
          const name = (uncertain ? e.slice(0, -1) : e).trim();
          return { name, uncertain };
        })
        .filter((e) => e.name.length > 0);
    teamsheets[item.club] = {
      starters: sanitize(item.starters),
      subs: sanitize(item.subs),
    };
  }

  return { teamsheets, fetchErrors };
};

const buildProviders = (): LlmProvider[] => {
  const providers: LlmProvider[] = [];
  const cerebrasKey = process.env.CEREBRAS_API_KEY;
  if (cerebrasKey) {
    const cerebrasModels = ["qwen-3-235b-a22b-instruct-2507", "llama3.1-8b"];
    for (const model of cerebrasModels) {
      providers.push({
        name: `cerebras:${model}`,
        url: "https://api.cerebras.ai/v1/chat/completions",
        apiKey: cerebrasKey,
        model,
      });
    }
  }
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    providers.push({
      name: "groq:llama-3.3-70b-versatile",
      url: "https://api.groq.com/openai/v1/chat/completions",
      apiKey: groqKey,
      model: "llama-3.3-70b-versatile",
    });
  }
  const openrouterKey = process.env.OPENROUTER_API_KEY;
  if (openrouterKey) {
    const openrouterHeaders = {
      "http-referer": "https://github.com/fnb-software/rugby-fantasy",
      "x-title": "rugby-fantasy",
    };
    const freeModels = [
      "meta-llama/llama-3.3-70b-instruct:free",
      "qwen/qwen3-next-80b-a3b-instruct:free",
      "z-ai/glm-4.5-air:free",
    ];
    for (const model of freeModels) {
      providers.push({
        name: `openrouter:${model}`,
        url: "https://openrouter.ai/api/v1/chat/completions",
        apiKey: openrouterKey,
        model,
        extraHeaders: openrouterHeaders,
      });
    }
  }
  return providers;
};

const callLlm = async ({
  providers,
  prompt,
  onAttempt,
}: {
  providers: LlmProvider[];
  prompt: string;
  onAttempt?: (event: AttemptEvent) => void;
}): Promise<string> => {
  const errors: string[] = [];
  for (const provider of providers) {
    onAttempt?.({ phase: "start", provider: provider.name });
    try {
      const response = await fetch(provider.url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${provider.apiKey}`,
          ...(provider.extraHeaders ?? {}),
        },
        body: JSON.stringify({
          model: provider.model,
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
          max_tokens: 8192,
        }),
      });
      if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new Error(`http_${response.status}: ${body.slice(0, 200)}`);
      }
      const json = await response.json();
      const choice = json?.choices?.[0];
      const raw = choice?.message?.content;
      if (typeof raw !== "string" || raw.trim().length === 0) {
        throw new Error("no_text_part");
      }
      if (choice?.finish_reason === "length") {
        throw new Error(`truncated_at_${raw.length}_chars`);
      }
      let shape: { teamsheets?: Array<{ club?: string; starters?: string[]; subs?: string[] }> };
      try {
        shape = JSON.parse(raw);
      } catch {
        throw new Error("invalid_json");
      }
      const incomplete = (shape?.teamsheets ?? []).find(
        (t) =>
          !Array.isArray(t?.subs) ||
          t.subs.length === 0 ||
          !Array.isArray(t?.starters) ||
          t.starters.length === 0,
      );
      if (incomplete) {
        throw new Error(`incomplete_teamsheet:${incomplete.club ?? "?"}`);
      }
      onAttempt?.({ phase: "success", provider: provider.name });
      return raw;
    } catch (e) {
      const reason = e instanceof Error ? e.message : "unknown";
      errors.push(`${provider.name}: ${reason}`);
      onAttempt?.({ phase: "fail", provider: provider.name, reason });
      console.warn(`[teamsheetsExtract] ${provider.name} failed: ${reason}`);
    }
  }
  throw new Error(`all_llm_providers_failed: ${errors.join(" | ")}`);
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
    .replace(/<\/tr>/gi, "\n")
    .replace(/<\/(?:li|p|h[1-6]|div|section|article)>/gi, "")
    .replace(/<br\s*\/?>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/[ \t]+/g, " ")
    .replace(/\|([ \t]*\|)+/g, "|")
    .replace(/\n[ \t|]*\n+/g, "\n")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(
      /\b([A-Z])[a-z]{2,}(?:-([A-Z])[a-z]{2,})?(?:\s+[A-Z][a-z]+)*\s+([A-Z]{2,}(?:[-' ][A-Z]+)*)/g,
      (_match, first: string, second: string | undefined, last: string) =>
        second ? `${first}.-${second}. ${last}` : `${first}. ${last}`,
    )
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

Output a single JSON object with this exact shape and no other top-level keys. Every entry in "starters"/"subs" is just a string (the player's last name). Append a literal "*" at the end of the name to mark an uncertain/alternative player — never use objects, never add an "uncertain" field:
{
  "teamsheets": [
    {
      "club": "<one of the allowed names>",
      "starters": ["Lastname", "Lastname*", ... 15 total],
      "subs":     ["Lastname", "Lastname*", ... up to 8 total]
    }
  ]
}

Both "starters" AND "subs" are required for every club entry — never omit "subs", and never abbreviate the array with "..." in your actual output (write every player out).

Rules:
- One array entry per club whose teamsheet appears in the sources. Skip clubs you can't confidently identify. Do NOT invent players.
- "starters": ordered list of probable starter last names. The pages typically number them 1-15; preserve that order.
- "subs": ordered list of probable replacements (typically 8 but may vary).
- Preserve the first-name initial when the source shows it: emit "X. Lastname" (e.g. "R. Ntamack", "Pa. Boudehent", "J.-L. Joseph"). If the source only gives a full first name, abbreviate it to its first letter plus a period ("Romain Ntamack" → "R. Ntamack"). If neither initial nor first name is shown, output just the surname.
- Append "*" to the last name ONLY when the page presents the player as an alternative — typical signals: "ou X", a slash ("Smith / Jones"), parentheses, "?", "à confirmer", "incertain", or two names listed for the same shirt number. Examples: "Ntamack" (confident), "Ntamack*" (uncertain), "R. Ntamack*" (uncertain with initial). Confident picks MUST NOT carry the "*".
- Player names in the source have already been pre-processed: diacritics stripped (so "Hervé" appears as "HERVE", "Lévêque" as "LEVEQUE") and "Firstname LASTNAME" patterns abbreviated to "F. LASTNAME". Pass player names through as-is — do NOT add accents back, do NOT re-expand initials. Club names in the allowed list above DO keep their accents and must be output exactly as listed.
- If a source page has multiple matches, extract every recognized club from it.
- Output ONLY the JSON object. No prose, no markdown fences.

CRITICAL — assigning each player to the correct team:

Match pages (e.g. an "X vs Y" preview) list TWO teamsheets on a single page. Mixing players between the two clubs is the most common failure — be deliberate.

- The URL is ground truth for which two clubs are in the match. URLs like \`/matchs/toulouse-clermont-...\` mean the match is Toulouse vs Clermont; do not output players for any other club from that source.
- Some pages render the two teamsheets as a side-by-side table. After cleanup, columns are separated by " | " and each table row is on its own line.
  - "Shirt-number sandwich" layout (common on allrugby): each row reads \`| <Name A> | <NUMBER> | <Name B> |\`. The middle column is the shirt number; the LEFT name is one team's player wearing that number and the RIGHT name is the other team's. Numbers 1–15 are starters, 16+ are subs. Walk every row, sending left-column names to the team named above the left column and right-column names to the team above the right column. Never assign a name to the team whose column it does NOT sit in.
  - Plain two-column layout: each row reads \`| <Name A> | <Name B> |\` with no middle number. Same rule — left column is one team, right column is the other; never read across.
  - In either layout, identify the team-name header sitting above each column before assigning anyone.
- Other pages list the two teamsheets one after the other ("Toulouse XV: 1.A 2.B ... Clermont XV: 1.X 2.Y ..."). Anchor on the team name that introduces each numbered list. Once a list ends (typically after the subs), only the next team-name header restarts attribution.
- Ignore mentions of clubs in navigation, sidebars, schedule widgets, ads, "next round" panels, recent-result banners, or comment sections. Those are not lineups.
- If you cannot confidently determine which club a player belongs to, OMIT that player rather than guess.

${sources}`;
};
