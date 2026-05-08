import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { reassignTeamsheets } from "./teamsheetsReassign";

const player = (club: string, nom: string, nomcomplet: string) => ({
  club,
  nom,
  nomcomplet,
});

const e = (name: string, uncertain = false) => ({ name, uncertain });
const names = (arr: { name: string }[]) => arr.map((x) => x.name);

const PLAYERS = [
  player("Pau", "K. Maddocks", "Kris Maddocks"),
  player("Pau", "T. Attissogbe", "Theo Attissogbe"),
  player("Pau", "E. Gailleton", "Emilien Gailleton"),
  player("Castres", "G. Palis", "Geoffrey Palis"),
  player("Castres", "A. Ambadiang", "Adrien Ambadiang"),
  player("Castres", "J. Goodhue", "Jack Goodhue"),
  player("Toulouse", "T. Ramos", "Thomas Ramos"),
  player("Toulouse", "B. Thomas", "Blair Thomas"),
  player("Clermont", "B. Hamdaoui", "Bautista Hamdaoui"),
  player("Clermont", "A. Delguy", "Alex Delguy"),
];

const MATCHES = [
  { clubdom: "Pau", clubext: "Castres" },
  { clubdom: "Toulouse", clubext: "Clermont" },
];

describe("reassignTeamsheets", () => {
  it("keeps correctly assigned teamsheets unchanged", () => {
    const result = reassignTeamsheets({
      extracted: {
        Pau: {
          starters: [e("K. Maddocks"), e("T. Attissogbe"), e("E. Gailleton")],
          subs: [],
        },
        Castres: {
          starters: [e("G. Palis"), e("A. Ambadiang"), e("J. Goodhue")],
          subs: [],
        },
      },
      players: PLAYERS,
      matches: MATCHES,
    });
    assert.deepEqual(names(result.Pau.starters), [
      "K. Maddocks",
      "T. Attissogbe",
      "E. Gailleton",
    ]);
    assert.deepEqual(names(result.Castres.starters), [
      "G. Palis",
      "A. Ambadiang",
      "J. Goodhue",
    ]);
  });

  it("swaps a full column-flip and preserves order", () => {
    const result = reassignTeamsheets({
      extracted: {
        Pau: {
          starters: [e("G. Palis"), e("A. Ambadiang"), e("J. Goodhue")],
          subs: [],
        },
        Castres: {
          starters: [e("K. Maddocks"), e("T. Attissogbe"), e("E. Gailleton")],
          subs: [],
        },
      },
      players: PLAYERS,
      matches: MATCHES,
    });
    assert.deepEqual(names(result.Pau.starters), [
      "K. Maddocks",
      "T. Attissogbe",
      "E. Gailleton",
    ]);
    assert.deepEqual(names(result.Castres.starters), [
      "G. Palis",
      "A. Ambadiang",
      "J. Goodhue",
    ]);
  });

  it("swaps partial flips at matching positions in place", () => {
    const result = reassignTeamsheets({
      extracted: {
        Pau: {
          starters: [e("K. Maddocks"), e("A. Ambadiang"), e("E. Gailleton")],
          subs: [],
        },
        Castres: {
          starters: [e("G. Palis"), e("T. Attissogbe"), e("J. Goodhue")],
          subs: [],
        },
      },
      players: PLAYERS,
      matches: MATCHES,
    });
    assert.deepEqual(names(result.Pau.starters), [
      "K. Maddocks",
      "T. Attissogbe",
      "E. Gailleton",
    ]);
    assert.deepEqual(names(result.Castres.starters), [
      "G. Palis",
      "A. Ambadiang",
      "J. Goodhue",
    ]);
  });

  it("moves a stray player to its match partner via per-player fallback", () => {
    // Single-sided issue: Pau[1] is a Castres player, but Castres has its own
    // 2-player list with no obvious counterpart at index 1, so the position
    // swap doesn't fire — fallback moves Ambadiang to Castres.starters.
    const result = reassignTeamsheets({
      extracted: {
        Pau: {
          starters: [e("K. Maddocks"), e("A. Ambadiang"), e("E. Gailleton")],
          subs: [],
        },
        Castres: { starters: [e("G. Palis"), e("J. Goodhue")], subs: [] },
      },
      players: PLAYERS,
      matches: MATCHES,
    });
    assert.deepEqual(names(result.Pau.starters), [
      "K. Maddocks",
      "E. Gailleton",
    ]);
    assert.deepEqual(names(result.Castres.starters), [
      "G. Palis",
      "J. Goodhue",
      "A. Ambadiang",
    ]);
  });

  it("does not pull players across unrelated matches", () => {
    // A Toulouse player wrongly shows up under Pau. Toulouse is not Pau's
    // match partner (Castres is), so reassignment leaves Ramos alone rather
    // than yanking him across matches.
    const result = reassignTeamsheets({
      extracted: {
        Pau: {
          starters: [e("K. Maddocks"), e("T. Ramos"), e("E. Gailleton")],
          subs: [],
        },
        Castres: { starters: [e("G. Palis")], subs: [] },
      },
      players: PLAYERS,
      matches: MATCHES,
    });
    assert.deepEqual(names(result.Pau.starters), [
      "K. Maddocks",
      "T. Ramos",
      "E. Gailleton",
    ]);
  });

  it("dedupes a player listed in both starters and subs (starter wins)", () => {
    const result = reassignTeamsheets({
      extracted: {
        Pau: {
          starters: [e("K. Maddocks"), e("T. Attissogbe")],
          subs: [e("K. Maddocks"), e("E. Gailleton")],
        },
        Castres: { starters: [e("G. Palis")], subs: [] },
      },
      players: PLAYERS,
      matches: MATCHES,
    });
    assert.deepEqual(names(result.Pau.starters), [
      "K. Maddocks",
      "T. Attissogbe",
    ]);
    assert.deepEqual(names(result.Pau.subs), ["E. Gailleton"]);
  });

  it("dedupes after reassignment when LLM listed same player in two clubs", () => {
    // Maddocks correctly in Pau.starters AND incorrectly in Castres.subs.
    // Fallback moves Castres.subs → Pau.subs; dedupe drops the sub copy.
    const result = reassignTeamsheets({
      extracted: {
        Pau: {
          starters: [e("K. Maddocks"), e("T. Attissogbe"), e("E. Gailleton")],
          subs: [],
        },
        Castres: {
          starters: [e("G. Palis"), e("A. Ambadiang"), e("J. Goodhue")],
          subs: [e("K. Maddocks")],
        },
      },
      players: PLAYERS,
      matches: MATCHES,
    });
    assert.deepEqual(names(result.Pau.starters), [
      "K. Maddocks",
      "T. Attissogbe",
      "E. Gailleton",
    ]);
    assert.deepEqual(names(result.Pau.subs), []);
    assert.deepEqual(names(result.Castres.subs), []);
  });

  it("preserves the uncertain flag through swap and move", () => {
    const result = reassignTeamsheets({
      extracted: {
        Pau: { starters: [e("G. Palis", true)], subs: [] },
        Castres: { starters: [e("K. Maddocks", true)], subs: [] },
      },
      players: PLAYERS,
      matches: MATCHES,
    });
    assert.equal(result.Pau.starters[0].name, "K. Maddocks");
    assert.equal(result.Pau.starters[0].uncertain, true);
    assert.equal(result.Castres.starters[0].name, "G. Palis");
    assert.equal(result.Castres.starters[0].uncertain, true);
  });

  it("dedupes the same name listed twice in starters", () => {
    const result = reassignTeamsheets({
      extracted: {
        Pau: {
          starters: [e("K. Maddocks"), e("T. Attissogbe"), e("K. Maddocks")],
          subs: [],
        },
        Castres: { starters: [e("G. Palis")], subs: [] },
      },
      players: PLAYERS,
      matches: MATCHES,
    });
    assert.deepEqual(names(result.Pau.starters), [
      "K. Maddocks",
      "T. Attissogbe",
    ]);
  });

  it("leaves names not found in any roster where the LLM placed them", () => {
    const result = reassignTeamsheets({
      extracted: {
        Pau: { starters: [e("X. Unknown")], subs: [] },
        Castres: { starters: [e("Y. Mystery")], subs: [] },
      },
      players: PLAYERS,
      matches: MATCHES,
    });
    assert.deepEqual(names(result.Pau.starters), ["X. Unknown"]);
    assert.deepEqual(names(result.Castres.starters), ["Y. Mystery"]);
  });

  it("dedupes case- and punctuation-insensitively", () => {
    const result = reassignTeamsheets({
      extracted: {
        Pau: {
          starters: [e("K. Maddocks"), e("k. maddocks")],
          subs: [],
        },
        Castres: { starters: [e("G. Palis")], subs: [] },
      },
      players: PLAYERS,
      matches: MATCHES,
    });
    assert.equal(result.Pau.starters.length, 1);
  });

  it("accepts string entries (not just {name, uncertain} objects)", () => {
    const result = reassignTeamsheets({
      extracted: {
        Pau: {
          starters: ["K. Maddocks", "T. Attissogbe"],
          subs: [],
        },
        Castres: { starters: ["G. Palis"], subs: [] },
      },
      players: PLAYERS,
      matches: MATCHES,
    });
    assert.deepEqual(names(result.Pau.starters), [
      "K. Maddocks",
      "T. Attissogbe",
    ]);
    assert.equal(result.Pau.starters[0].uncertain, false);
  });

  it("swaps subs independently of starters", () => {
    // Starters are correctly assigned but subs are flipped between the two
    // clubs. The position swap should fix subs without touching starters.
    const result = reassignTeamsheets({
      extracted: {
        Pau: {
          starters: [e("K. Maddocks")],
          subs: [e("A. Ambadiang")],
        },
        Castres: {
          starters: [e("G. Palis")],
          subs: [e("E. Gailleton")],
        },
      },
      players: PLAYERS,
      matches: MATCHES,
    });
    assert.deepEqual(names(result.Pau.starters), ["K. Maddocks"]);
    assert.deepEqual(names(result.Pau.subs), ["E. Gailleton"]);
    assert.deepEqual(names(result.Castres.starters), ["G. Palis"]);
    assert.deepEqual(names(result.Castres.subs), ["A. Ambadiang"]);
  });
});
