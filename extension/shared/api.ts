const BASE = "https://lagrandemelee.midi-olympique.fr/v1/private";

const COMMON_HEADERS: Record<string, string> = {
  Accept: "application/json",
  "Accept-Language": "en-US,en;q=0.9,fr-FR;q=0.8",
  "Content-Type": "application/json",
  "X-Access-Key": "740@18.23@@d50f0d9f-4343-4b7c-ba53-41852dc2ec1a",
};

const headers = (token: string) => ({
  ...COMMON_HEADERS,
  Authorization: `Token ${token}`,
});

export type Player = {
  id: number;
  nom: string;
  nomcomplet: string;
  club: string;
  [k: string]: unknown;
};

export const searchPlayersPage = async (
  token: string,
  round: string,
  pageIndex: number,
): Promise<Player[]> => {
  const res = await fetch(`${BASE}/searchjoueurs?lg=en`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify({
      filters: {
        nom: "",
        club: "",
        position: "",
        budget_ok: false,
        valeur_max: 25,
        engage: false,
        partant: false,
        dreamteam: false,
        quota: "",
        idj: round,
        pageIndex,
        pageSize: 10,
        loadSelect: 0,
        searchonly: 1,
      },
    }),
  });
  if (!res.ok) throw new Error(`searchjoueurs ${pageIndex}: HTTP ${res.status}`);
  const data = await res.json();
  return data.joueurs ?? [];
};

export const fetchPlayerStats = async (
  token: string,
  round: string,
  playerId: number,
): Promise<unknown> => {
  const res = await fetch(`${BASE}/statsjoueur?lg=en`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify({
      credentials: { idj: round, idf: playerId, detail: true },
    }),
  });
  if (!res.ok) throw new Error(`statsjoueur ${playerId}: HTTP ${res.status}`);
  return res.json();
};
