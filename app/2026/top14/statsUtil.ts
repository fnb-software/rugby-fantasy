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
      .replace(/[\u0300-\u036f]/g, "");
  const n = normalize(name);
  const nom = normalize(p.nom);
  const nomcomplet = normalize(p.nomcomplet);
  // "R. Ntamack" style: match initial + last name against p.nom
  if (n.includes(".")) return nom === n;
  // plain last name: check nomcomplet ends with it
  return nomcomplet.endsWith(" " + n) || nomcomplet === n;
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
  Bayonne: 5,
  Castres: 40,
  Clermont: -12,
  Lyon: -5,
  Montpellier: -20,
  Montauban: -40,
  Pau: 10,
  Perpignan: 5,
  "Racing 92": -10,
  "La Rochelle": -5,
  "Stade français": 12,
  Toulon: -5,
  Toulouse: 20,
  "Bordeaux-Bègles": 5,
};
