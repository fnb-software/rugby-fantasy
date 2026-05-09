import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { trimToPlayerNames } from "./teamsheetsTrim";

const SURNAMES = [
  "Maddocks",
  "Attissogbe",
  "Gailleton",
  "Brau-Boirie",
  "Simmonds",
  "Robson",
  "Palis",
  "Ambadiang",
  "Goodhue",
  "Cocagi",
  "Hervé",
  "Arata",
];

describe("trimToPlayerNames", () => {
  it("returns text unchanged when no surnames are provided", () => {
    const text = "anything\ngoes\nhere";
    assert.equal(trimToPlayerNames(text, []), text);
  });

  it("returns text unchanged when fewer than minHits lines contain a surname", () => {
    const text = [
      "Some news about Maddocks scoring last week.",
      "More navigation links",
      "Footer text",
    ].join("\n");
    // only 1 hit, default minHits = 5 → no trim
    assert.equal(trimToPlayerNames(text, SURNAMES), text);
  });

  it("trims to the player-name region with a header buffer above", () => {
    const text = [
      "homepage",
      "navigation",
      "ads",
      "more nav",
      "Pau vs Castres",
      "| L. Maddocks | 1 | G. Palis |",
      "| T. Attissogbe | 2 | A. Ambadiang |",
      "| E. Gailleton | 3 | J. Goodhue |",
      "| F. Brau-Boirie | 4 | A. Cocagi |",
      "| J. Simmonds | 5 | E. Hervé |",
      "| D. Robson | 6 | S. Arata |",
      "footer",
      "comments",
      "related articles",
    ].join("\n");

    const trimmed = trimToPlayerNames(text, SURNAMES);
    const lines = trimmed.split("\n");
    // first hit at index 5, buffer = 2 → start at index 3 ("more nav")
    assert.equal(lines[0], "more nav");
    // header line just above the table is preserved
    assert.ok(lines.includes("Pau vs Castres"));
    // last hit at index 10, buffer = 2 → ends at "comments" (index 12)
    assert.equal(lines[lines.length - 1], "comments");
    // footer-after-buffer is dropped
    assert.ok(!lines.includes("related articles"));
    // and the homepage/navigation lead-in is dropped
    assert.ok(!lines.includes("homepage"));
    assert.ok(!lines.includes("navigation"));
  });

  it("matches accented surnames against accent-stripped page text", () => {
    // Page has been through cleanHtml so "HERVÉ" is now "HERVE", but the
    // surname list still arrives with its original accented spelling. The
    // hit on the "HERVE" line proves both sides get normalized for lookup.
    const text = [
      "homepage",
      "navigation",
      "more navigation",
      "ads here",
      "MADDOCKS",
      "ATTISSOGBE",
      "GAILLETON",
      "BRAU-BOIRIE",
      "SIMMONDS",
      "ROBSON",
      "HERVE",
      "ARATA",
      "tail",
    ].join("\n");
    const trimmed = trimToPlayerNames(text, [...SURNAMES, "Hervé"]);
    const lines = trimmed.split("\n");
    assert.ok(lines.includes("HERVE"));
    // first hit at index 4, buffer 2 → start at index 2 ("more navigation")
    assert.equal(lines[0], "more navigation");
    assert.ok(!lines.includes("homepage"));
    assert.ok(!lines.includes("navigation"));
  });

  it("recognizes hyphenated surnames as a single token", () => {
    const text = [
      "intro",
      "BRAU-BOIRIE plays at 12",
      "MADDOCKS at fullback",
      "ATTISSOGBE on the wing",
      "GAILLETON at centre",
      "SIMMONDS at fly-half",
      "ROBSON at scrum-half",
      "outro",
    ].join("\n");
    const trimmed = trimToPlayerNames(text, SURNAMES);
    assert.ok(trimmed.includes("BRAU-BOIRIE plays at 12"));
  });

  it("ignores 1- and 2-letter tokens (won't match initials)", () => {
    const text = ["L.", "T.", "E.", "F.", "J.", "D."].join("\n");
    // initials shouldn't trigger any hits regardless of surnames
    assert.equal(trimToPlayerNames(text, SURNAMES), text);
  });

  it("respects custom minHits and bufferLines options", () => {
    const text = [
      "head",
      "Maddocks here",
      "middle",
      "Attissogbe here",
      "tail",
    ].join("\n");
    // default would be 5 hits required → no trim. With minHits=2 we trim.
    const trimmed = trimToPlayerNames(text, SURNAMES, {
      minHits: 2,
      bufferLines: 0,
    });
    assert.equal(trimmed, ["Maddocks here", "middle", "Attissogbe here"].join("\n"));
  });

  it("keeps the entire text when every line contains a surname", () => {
    const lines = [
      "MADDOCKS",
      "ATTISSOGBE",
      "GAILLETON",
      "BRAU-BOIRIE",
      "SIMMONDS",
      "ROBSON",
    ];
    const text = lines.join("\n");
    assert.equal(trimToPlayerNames(text, SURNAMES), text);
  });
});
