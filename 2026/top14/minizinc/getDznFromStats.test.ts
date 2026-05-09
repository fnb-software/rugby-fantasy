import { describe, it } from "node:test";
import assert from "node:assert/strict";
import getDznFromStats from "./getDznFromStats.js";

const CAP: Record<number, number> = {
  5: 2, 6: 4, 7: 4, 8: 2, 9: 2, 10: 6, 11: 4, 12: 4, 13: 2,
};
const REQUIRED: Record<number, number> = {
  5: 1, 6: 2, 7: 2, 8: 1, 9: 1, 10: 3, 11: 2, 12: 2, 13: 1,
};
const STARTER_FORMATION = [5, 6, 6, 7, 7, 8, 9, 10, 10, 10, 11, 11, 12, 12, 13];

const makePlayer = (id: number, id_position: number, overrides: any = {}) => ({
  id,
  id_position,
  id_club: 100 + id,
  valeur: 1,
  expectedStarterPoints: 5,
  expectedSubPoints: 0,
  ...overrides,
});

const minimalStarters = () =>
  STARTER_FORMATION.map((pos, i) => makePlayer(i + 1, pos));

const parsePool = (dzn: string) => {
  const positions = dzn
    .match(/position = \[([^\]]+)\]/)![1]
    .split(",")
    .map((s) => parseInt(s.trim()));
  const ids = dzn
    .match(/Players = \{([^}]+)\}/)![1]
    .split(",")
    .map((s) => s.trim().replace(/'/g, ""));
  const counts: Record<number, number> = {};
  for (const p of positions) counts[p] = (counts[p] || 0) + 1;
  return { ids, positions, counts, size: positions.length };
};

const parseCaps = (dzn: string) =>
  dzn
    .match(/max_per_position = array1d\(5\.\.13, \[([^\]]+)\]\)/)![1]
    .split(",")
    .map((s) => parseInt(s.trim()));

describe("getDznFromStats filler", () => {
  it("produces an 18-player pool from a minimal starter pool", () => {
    const dzn = getDznFromStats({
      players: minimalStarters(),
      lockedPlayers: [],
      reservePlayers: [],
    });
    const { size } = parsePool(dzn);
    assert.equal(size, 18);
  });

  it("keeps every position within cap when filling subs", () => {
    const dzn = getDznFromStats({
      players: minimalStarters(),
      lockedPlayers: [],
      reservePlayers: [],
    });
    const { counts } = parsePool(dzn);
    for (const pos of Object.keys(CAP).map(Number)) {
      assert.ok(
        (counts[pos] || 0) <= CAP[pos],
        `pos ${pos}: ${counts[pos]} > cap ${CAP[pos]}`,
      );
    }
  });

  it("does not dump every sub filler at position 5 (the old corner case)", () => {
    const dzn = getDznFromStats({
      players: minimalStarters(),
      lockedPlayers: [],
      reservePlayers: [],
    });
    const { counts } = parsePool(dzn);
    assert.ok(
      (counts[5] || 0) <= CAP[5],
      `pos 5 over cap: ${counts[5]} > ${CAP[5]}`,
    );
    // Bench fillers should land at positions with most slack — primarily pos 10 (cap 6, 3 starters → 3 free).
    assert.ok(
      (counts[10] || 0) > REQUIRED[10],
      `expected bench fillers to favor pos 10, got ${counts[10]}`,
    );
  });

  it("subtracts reserve positions from the per-position cap", () => {
    const dzn = getDznFromStats({
      players: minimalStarters(),
      lockedPlayers: [],
      reservePlayers: [makePlayer(900, 12), makePlayer(901, 12)],
    });
    const caps = parseCaps(dzn);
    // Position 12 is index 7 in [5..13]; cap 4 - 2 reserves = 2.
    assert.equal(caps[7], 2);
    // Untouched positions stay at full cap.
    assert.equal(caps[0], CAP[5]);
    assert.equal(caps[5], CAP[10]);
  });

  it("includes locked players even when they have zero score", () => {
    const lockedPlayer = makePlayer(500, 5, {
      expectedStarterPoints: 0,
      expectedSubPoints: 0,
    });
    // Use 14 minimal starters so pos 5 is initially missing — the locked one fills it.
    const others = STARTER_FORMATION.slice(1).map((pos, i) =>
      makePlayer(i + 1, pos),
    );
    const dzn = getDznFromStats({
      players: [lockedPlayer, ...others],
      lockedPlayers: [{ player: lockedPlayer, index: 12 }],
      reservePlayers: [],
    });
    const { ids } = parsePool(dzn);
    assert.ok(ids.includes("500"), "locked zero-score player missing from pool");
  });

  it("excludes reserve players from the candidate pool", () => {
    const reserve = makePlayer(700, 10);
    const dzn = getDznFromStats({
      players: [...minimalStarters(), reserve],
      lockedPlayers: [],
      reservePlayers: [reserve],
    });
    const { ids } = parsePool(dzn);
    assert.ok(!ids.includes("700"), "reserve player leaked into pool");
  });
});
