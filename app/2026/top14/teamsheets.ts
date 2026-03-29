// Teamsheets for the current round
// starters / subs: last names as they appear in the official teamsheet
// "ou" alternatives are listed as separate entries so either player gets credit

export type Teamsheet = {
  starters: string[];
  subs: string[];
};

export const TEAMSHEETS: Record<string, Teamsheet> = {
  Bayonne: { starters: [], subs: [] },
  "Bordeaux-Bègles": { starters: [], subs: [] },
  Castres: { starters: [], subs: [] },
  Clermont: { starters: [], subs: [] },
  "La Rochelle": { starters: [], subs: [] },
  Lyon: { starters: [], subs: [] },
  Montauban: { starters: [], subs: [] },
  Montpellier: { starters: [], subs: [] },
  Pau: { starters: [], subs: [] },
  Perpignan: { starters: [], subs: [] },
  "Racing 92": { starters: [], subs: [] },
  "Stade français": { starters: [], subs: [] },
  Toulon: { starters: [], subs: [] },
  Toulouse: { starters: [], subs: [] },
};
