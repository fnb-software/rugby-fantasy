import players from "../data/players";

export const getPlayerScoreForRound =
  (round: number) => (p?: (typeof players)[number]) => {
    const score = p?.stats.points_marques?.[round]?.nb_points;
    if (!score) {
      return 0;
    }
    return parseInt(score);
  };

export const getPlayerCostForRound =
  (round: number) => (p?: (typeof players)[number]) =>
    p?.stats.valeur_footballeur?.[round];

export const getPlayerSubForRound =
  (round: number) => (p?: (typeof players)[number]) => {
    const roundDetail = p?.stats.detail?.find(
      (roundDetail) => roundDetail.numero === round + 1,
    );
    if (roundDetail?.remplacant) {
      return 1;
    }
    return 0;
  };
