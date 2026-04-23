export const POSITION_LABELS: Record<string, string> = {
  lib_arriere: "Fullback",
  lib_34aile: "Wing",
  lib_34centre: "Centre",
  lib_ouverture: "Fly-half",
  lib_12melee: "Scrum-half",
  lib_3emeligne: "Back row",
  lib_2emeligne: "Lock",
  lib_pilier: "Prop",
  lib_talonneur: "Hooker",
};

export const getRoundPlayerOnlyPoints = (p) => {
  const isForward = [
    "lib_3emeligne",
    "lib_2emeligne",
    "lib_pilier",
    "lib_talonneur",
  ].includes(p.position);
  const getPointsMultiplier = getStatPointsMultiplier({ isForward });
  return (r) => {
    return r.stats.reduce((totalPoints, stat) => {
      const multiplier = getPointsMultiplier(stat);
      const points = multiplier * (stat?.total || 0);
      return totalPoints + points;
    }, 0);
  };
};

export const getStatPointsMultiplier =
  ({ isForward }) =>
  (stat) => {
    switch (stat.libelle) {
      case "Try":
        return isForward ? 15 : 10;
      case "Conversion":
        return 2;
      case "Penalty":
      case "Drop goal":
        return 3;
      case "Missed kick":
        return -2;
      case "Conceded penalty":
        return isForward ? -3 : -5;
      case "Yellow cards":
        return -10;
      case "lib_carton_orange":
        return -13;
      case "Red cards ":
        return -15;
      case "Tackles":
        return 1;
      case "Missed tackle":
        return -2;
      case "Line-breaks":
        return isForward ? 8 : 4;
      case "Tackle break":
        return isForward ? 4 : 2;
      case "Runs with the ball":
        return 1;
      case "Forward pass":
        return -1;
      case "Turnover won":
        return isForward ? 3 : 5;
      case "lib_critere_interception_reussie":
        return isForward ? 5 : 3;
      case "Offloads":
        return 2;
    }
    return 0;
  };

// Match a teamsheet name (last name, or "X. Lastname") against a player object.
// p.nom is e.g. "J. Willis", p.nomcomplet is "Jack Willis".
export const matchesName = (
  p: { nom: string; nomcomplet: string },
  name: string,
) => {
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/'/g, "")
      .replace(/-/g, " ");
  const nameTeamsheet = normalize(name);
  const nameWithInitial = normalize(p.nom);
  const nameFull = normalize(p.nomcomplet);
  // "R. Ntamack" style: match initial + last name against p.nom
  if (nameTeamsheet.includes(".")) {
    if (nameWithInitial === nameTeamsheet) return true;
    // Multi-letter disambiguating initial like "Pa. Boudehent" — player's
    // nom keeps a single initial "P.", so fall back to matching the prefix
    // against the first name from nomcomplet.
    // Works for both multi-letter initials ("Pa. Boudehent") and composite
    // initials where the dash has been normalized to a space ("J.-L. Joseph"
    // → "j. l. joseph"). We take the first dotted segment's letters as the
    // prefix to match against the player's first name from nomcomplet.
    const lastDotIdx = nameTeamsheet.lastIndexOf(".");
    if (nameTeamsheet[lastDotIdx + 1] !== " ") return false;
    const firstDotIdx = nameTeamsheet.indexOf(".");
    const initials = nameTeamsheet.slice(0, firstDotIdx);
    const rest = nameTeamsheet.slice(lastDotIdx + 2);
    const spaceIdx = nameFull.indexOf(" ");
    if (spaceIdx < 0) return false;
    const firstName = nameFull.slice(0, spaceIdx);
    const lastName = nameFull.slice(spaceIdx + 1);
    return firstName.startsWith(initials) && lastName === rest;
  }
  // plain last name: check nomcomplet ends with it, or it appears as a word within it
  const matchesLastName = (n: string) =>
    nameFull.endsWith(" " + n) ||
    nameFull === n ||
    nameFull.includes(" " + n + " ");
  if (matchesLastName(nameTeamsheet)) return true;
  // if teamsheet name was hyphenated, also try just the first segment
  // (e.g. "Tanga-Mangene" matching a player registered as "Tanga")
  if (!name.includes("-")) return false;
  const firstSegment = nameTeamsheet.split(" ")[0];
  return matchesLastName(firstSegment);
};

export const getTeamPoints = ({ isMatchHome, result }) => {
  const resultPoints = isMatchHome
    ? getHomeResult(result)
    : getAwayResult(result);
  const scorePoints = result / 2;
  return resultPoints + scorePoints;
};

const getHomeResult = (result) => (result > 0 ? 6 : result < 0 ? -2 : 2);
const getAwayResult = (result) => (result > 0 ? 8 : result < 0 ? 0 : 4);

export const TEAM_RESULTS_EXPECTED = {
  Bayonne: -10,
  Castres: -1,
  Clermont: -35,
  Lyon: 1,
  Montpellier: -15,
  Montauban: -25,
  Pau: 0,
  Perpignan: -10,
  "Racing 92": 25,
  "La Rochelle": 10,
  "Stade français": 0,
  Toulon: 10,
  Toulouse: 35,
  "Bordeaux-Bègles": 15,
};
