// Trim a cleaned page text down to the section containing player names.
//
// Many sources (rugbyrama, allrugby, l'équipe, …) wrap a teamsheet in tens of
// kilobytes of navigation, related-articles widgets, comments, etc. Once the
// HTML has been collapsed to plain text, the teamsheet shows up as a dense
// cluster of known surnames; the surrounding noise rarely mentions players.
// We tokenize each line, look up tokens in a Set of surnames derived from the
// player roster, then keep the slice from first hit to last hit (with a small
// buffer for headers like team names that sit just above the cluster).
//
// If fewer than `minHits` lines contain a known surname we leave the text
// alone — it's safer to feed the LLM extra noise than to crop out the entire
// teamsheet on a page where surname coverage is sparse.
export const trimToPlayerNames = (
  text: string,
  surnames: string[],
  { minHits = 5, bufferLines = 2 }: { minHits?: number; bufferLines?: number } = {},
): string => {
  if (surnames.length === 0) return text;
  const surnameSet = new Set(
    surnames.map(normalize).filter((s) => s.length >= 3),
  );
  if (surnameSet.size === 0) return text;

  const lines = text.split("\n");
  const hits: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    const tokens = normalize(lines[i]).match(TOKEN_RE) ?? [];
    if (tokens.some((t) => surnameSet.has(t))) hits.push(i);
  }
  if (hits.length < minHits) return text;
  const start = Math.max(0, hits[0] - bufferLines);
  const end = Math.min(lines.length, hits[hits.length - 1] + bufferLines + 1);
  return lines.slice(start, end).join("\n");
};

// Lastname tokens like "ntamack", "brau-boirie", "papali'i". Min 3 chars to
// keep "rey", "isa", "cros" while rejecting initials and 2-letter words.
const TOKEN_RE = /[a-z][a-z'\-]{2,}/g;

const normalize = (s: string): string =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
