import sumBy from "lodash/sumBy";

type Player = any;

export const getPlayerScoreForRound =
  (round: number) => (p?: Player) => {
    const roundDetail = p?.stats.detail?.find(
      (roundDetail: any) => roundDetail.numero === round + 1,
    );

    return parseFloat(roundDetail?.points || "0") * 20;
  };

export const getPlayerCostForRound =
  (round: number) => (p?: Player) => {
    const roundDetail = p?.stats.detail?.find(
      (roundDetail: any) => roundDetail.numero === round + 1,
    );

    return roundDetail?.valeuravant;
  };

export const getPlayerCostNewForRound =
  (round: number) => (p?: Player) => {
    const roundDetail = p?.stats.detail?.find(
      (roundDetail: any) => roundDetail.numero === round + 1,
    );

    return roundDetail?.valeurapres;
  };

export const getPlayerSubForRound =
  (round: number) => (p?: Player) => {
    const roundDetail = p?.stats.detail?.find(
      (roundDetail: any) => roundDetail.numero === round + 1,
    );
    if (roundDetail?.remplacant) {
      return 1;
    }
    return 0;
  };

export const getPlayerScoreTotal = () => (p?: Player) => {
  const score = sumBy(
    p?.stats.detail,
    (r: any) => parseFloat(r?.points || "0") * 20,
  );
  if (!score) {
    return 0;
  }
  return score;
};

export const getPlayerSubTotal = () => (p?: Player) => {
  const subPoints = p?.stats.detail?.filter((r: any) => r?.remplacant);
  const score = sumBy(subPoints, (r: any) => parseFloat(r?.points || "0") * 20);
  if (!score) {
    return 0;
  }
  return score;
};
