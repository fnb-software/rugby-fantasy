import players from "../data/players";

export const getPlayerScoreForRound =
  (round: number) => (p?: (typeof players)[number]) => {
    const roundDetail = p?.stats.detail?.find(
      (roundDetail) => roundDetail.numero === round + 1,
    );

    return parseFloat(roundDetail?.points) * 20;
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
