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

export type ExtractResult = {
  teamsheets: Record<string, Teamsheet>;
  fetchErrors: FetchError[];
};

export const extractTeamsheets = async ({
  urls,
  texts,
  canonicalClubs,
}: {
  urls: string[];
  texts?: string[];
  canonicalClubs: string[];
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
  const raw = await callLlm({ providers, prompt });
  console.log(raw);
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
        .filter(
          (e): e is { name: string; uncertain?: boolean } =>
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
      "nousresearch/hermes-3-llama-3.1-405b:free",
      "openai/gpt-oss-120b:free",
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
}: {
  providers: LlmProvider[];
  prompt: string;
}): Promise<string> => {
  const errors: string[] = [];
  for (const provider of providers) {
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
      try {
        JSON.parse(raw);
      } catch {
        throw new Error("invalid_json");
      }
      return raw;
    } catch (e) {
      const reason = e instanceof Error ? e.message : "unknown";
      errors.push(`${provider.name}: ${reason}`);
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
    .replace(/<\/(?:tr|li|p|h[1-6]|div|section|article)>/gi, "")
    .replace(/<br\s*\/?>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/(\s)*\n/g, "")
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
