import { put } from "@vercel/blob/client";
import { searchPlayersPage, fetchPlayerStats, type Player } from "../../shared/api";
import { buildTeamsheetIndex } from "../../shared/teamsheetsIndex";
import { matchesName } from "../../../app/2026/top14/statsUtil";

declare const __APP_URL__: string;
const APP_URL = __APP_URL__;
const LG_MELEE_URL = "https://lagrandemelee.midi-olympique.fr/";

const $ = <T extends HTMLElement>(id: string) =>
  document.getElementById(id) as T;

const els = {
  authLg: $<HTMLSpanElement>("auth-lg"),
  authApp: $<HTMLSpanElement>("auth-app"),
  signInLg: $<HTMLButtonElement>("sign-in-lg"),
  signInApp: $<HTMLButtonElement>("sign-in-app"),
  round: $<HTMLInputElement>("round"),
  mode: $<HTMLSelectElement>("mode"),
  run: $<HTMLButtonElement>("run"),
  statusText: $<HTMLParagraphElement>("status-text"),
  barRow: $<HTMLDivElement>("bar-row"),
  bar: $<HTMLProgressElement>("bar"),
  barText: $<HTMLSpanElement>("bar-text"),
  lastRefresh: $<HTMLParagraphElement>("last-refresh"),
};

const SNAPSHOT_KEY = "players_snapshot";
const TOKEN_KEY = "auth_token";
const LAST_REFRESH_KEY = "last_refresh_at";

let lgAuthOk = false;
let appAuthOk = false;

const updateRunGate = () => {
  els.run.disabled = !(lgAuthOk && appAuthOk);
};

const setLgAuth = (ok: boolean) => {
  lgAuthOk = ok;
  els.authLg.classList.toggle("dot-green", ok);
  els.authLg.classList.toggle("dot-red", !ok);
  els.authLg.title = ok
    ? "lagrandemelee: signed in"
    : "lagrandemelee: open the site and log in";
  els.signInLg.hidden = ok;
  updateRunGate();
};

const setAppAuth = (ok: boolean) => {
  appAuthOk = ok;
  els.authApp.classList.toggle("dot-green", ok);
  els.authApp.classList.toggle("dot-red", !ok);
  els.authApp.title = ok
    ? "App: signed in"
    : "App: sign in to upload your snapshot";
  els.signInApp.hidden = ok;
  updateRunGate();
};

const setStatus = (text: string, kind?: "success" | "error" | "muted") => {
  els.statusText.textContent = text;
  els.statusText.classList.remove("success", "error", "muted");
  if (kind) els.statusText.classList.add(kind);
};

const setProgress = (value: number, total: number, label: string) => {
  els.barRow.hidden = false;
  els.bar.value = value;
  els.bar.max = Math.max(total, 1);
  els.barText.textContent = `${value}/${total} ${label}`;
};

const hideProgress = () => {
  els.barRow.hidden = true;
};

const formatTime = (ts: number) => new Date(ts).toLocaleString();

const semaphore = (limit: number) => {
  let inFlight = 0;
  const queue: Array<() => void> = [];
  return async <T>(fn: () => Promise<T>): Promise<T> => {
    if (inFlight >= limit) {
      await new Promise<void>((resolve) => queue.push(resolve));
    }
    inFlight++;
    try {
      return await fn();
    } finally {
      inFlight--;
      const next = queue.shift();
      if (next) next();
    }
  };
};

const fetchAllPlayers = async (
  token: string,
  round: string,
  estimatedTotal: number,
): Promise<Player[]> => {
  let pageIndex = 0;
  let batch: Player[] = [];
  const players: Player[] = [];
  do {
    batch = await searchPlayersPage(token, round, pageIndex);
    players.push(...batch);
    setProgress(
      players.length,
      Math.max(estimatedTotal, players.length + 50),
      "players loaded",
    );
    pageIndex++;
  } while (batch.length === 10);
  setProgress(players.length, players.length, "players loaded");
  return players;
};

const checkAppAuth = async (): Promise<boolean> => {
  try {
    const res = await fetch(`${APP_URL}/api/me`, { credentials: "include" });
    return res.ok;
  } catch {
    return false;
  }
};

const uploadPlayersToApp = async (players: Player[]) => {
  const tokenRes = await fetch(`${APP_URL}/api/players/upload-token`, {
    method: "POST",
    credentials: "include",
  });
  if (!tokenRes.ok) {
    const body = await tokenRes.text().catch(() => "");
    throw new Error(`Token request failed (HTTP ${tokenRes.status}): ${body}`);
  }
  const { clientToken, pathname } = (await tokenRes.json()) as {
    clientToken: string;
    pathname: string;
  };

  await put(pathname, JSON.stringify(players), {
    access: "public",
    contentType: "application/json",
    token: clientToken,
    multipart: true,
  });

  return { ok: true, count: players.length };
};

const run = async () => {
  els.run.disabled = true;
  setStatus("Starting…", "muted");
  hideProgress();

  try {
    const round = els.round.value || "22";
    const mode = els.mode.value as "teamsheets" | "all";
    const stored = await browser.storage.local.get([TOKEN_KEY, SNAPSHOT_KEY]);
    const token = stored[TOKEN_KEY] as string | undefined;
    if (!token) throw new Error("No auth token. Open lagrandemelee and log in.");
    const existing = (stored[SNAPSHOT_KEY] as Player[] | undefined) ?? [];

    const teamsheetIndex = mode === "all" ? null : buildTeamsheetIndex();
    let players: Player[];
    let toUpdate: Player[];

    if (teamsheetIndex && existing.length > 0) {
      players = existing;
      toUpdate = existing.filter((p) => {
        const entries = teamsheetIndex.get(p.club);
        return entries?.some((name) => matchesName(p, name)) ?? false;
      });
      setStatus(
        `Reusing ${existing.length} cached, refreshing ${toUpdate.length} from teamsheets…`,
      );
    } else {
      const reason = mode === "all"
        ? "All-players mode"
        : "No cached snapshot";
      setStatus(`${reason} — fetching full roster…`);
      players = await fetchAllPlayers(token, round, existing.length || 700);
      toUpdate = players;
    }

    setStatus(`Fetching stats for ${toUpdate.length} players…`);
    setProgress(0, toUpdate.length, "stats");

    const limit = semaphore(10);
    let done = 0;
    const updated = await Promise.all(
      toUpdate.map((p) =>
        limit(async () => {
          const stats = await fetchPlayerStats(token, round, p.id);
          done++;
          setProgress(done, toUpdate.length, "stats");
          return { ...p, stats } as Player;
        }),
      ),
    );

    const updatedById = new Map(updated.map((p) => [p.id, p]));
    const merged = players.map((p) => updatedById.get(p.id) ?? p);

    setStatus("Uploading to app…");
    const result = await uploadPlayersToApp(merged);

    const now = Date.now();
    await browser.storage.local.set({
      [SNAPSHOT_KEY]: merged,
      [LAST_REFRESH_KEY]: now,
    });

    setStatus(
      `✓ Uploaded ${result.count} players (${updated.length} refreshed)`,
      "success",
    );
    els.lastRefresh.textContent = `Last refresh: ${formatTime(now)}`;
  } catch (err) {
    setStatus(`✗ ${(err as Error).message}`, "error");
    hideProgress();
  } finally {
    updateRunGate();
  }
};

const init = async () => {
  const stored = await browser.storage.local.get([TOKEN_KEY, LAST_REFRESH_KEY]);
  setLgAuth(!!stored[TOKEN_KEY]);
  setAppAuth(await checkAppAuth());

  if (stored[LAST_REFRESH_KEY]) {
    els.lastRefresh.textContent = `Last refresh: ${formatTime(
      stored[LAST_REFRESH_KEY] as number,
    )}`;
  }
  if (lgAuthOk && appAuthOk) {
    setStatus("Ready. Pick a round and click Refresh.", "muted");
  } else if (!lgAuthOk && !appAuthOk) {
    setStatus("Sign in to lagrandemelee and the app, then come back.", "muted");
  } else if (!lgAuthOk) {
    setStatus("Sign in to lagrandemelee, then come back.", "muted");
  } else {
    setStatus("Sign in to the app, then come back.", "muted");
  }

  browser.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    if (TOKEN_KEY in changes) {
      setLgAuth(!!changes[TOKEN_KEY].newValue);
    }
  });

  els.signInLg.addEventListener("click", () => {
    browser.tabs.create({ url: LG_MELEE_URL });
  });

  els.signInApp.addEventListener("click", () => {
    browser.tabs.create({ url: `${APP_URL}/signin` });
  });

  els.run.addEventListener("click", run);
};

init();
