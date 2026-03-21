import sumBy from "lodash/sumBy";
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
  (round: number) => (p?: (typeof players)[number]) => {
    const roundDetail = p?.stats.detail?.find(
      (roundDetail) => roundDetail.numero === round + 1,
    );

    return roundDetail?.valeuravant;
  };

export const getPlayerCostNewForRound =
  (round: number) => (p?: (typeof players)[number]) => {
    const roundDetail = p?.stats.detail?.find(
      (roundDetail) => roundDetail.numero === round + 1,
    );

    return roundDetail?.valeurapres;
  };

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

export const getPlayerScoreTotal = () => (p?: (typeof players)[number]) => {
  const score = sumBy(p?.stats.points_marques, (r) => parseInt(r?.nb_points));
  if (!score) {
    return 0;
  }
  return score;
};

export const getPlayerSubTotal = () => (p?: (typeof players)[number]) => {
  const subPoints = p?.stats.detail?.filter((r) => r?.remplacant);
  const score = sumBy(subPoints, (r) => parseInt(r?.points));
  if (!score) {
    return 0;
  }
  return score;
};
