import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { matchesName } from "./statsUtil";

const p = (nom: string, nomcomplet: string) => ({ nom, nomcomplet });

describe("matchesName", () => {
  describe("initial format (contains '.')", () => {
    it("exact match", () => {
      assert.equal(
        matchesName(p("R. Ntamack", "Romain Ntamack"), "R. Ntamack"),
        true,
      );
    });

    it("wrong initial", () => {
      assert.equal(
        matchesName(p("R. Ntamack", "Romain Ntamack"), "T. Ntamack"),
        false,
      );
    });

    it("wrong last name", () => {
      assert.equal(
        matchesName(p("R. Ntamack", "Romain Ntamack"), "R. Willis"),
        false,
      );
    });

    it("case insensitive", () => {
      assert.equal(
        matchesName(p("R. Ntamack", "Romain Ntamack"), "r. ntamack"),
        true,
      );
    });

    it("accent normalization on teamsheet side", () => {
      // teamsheet: "T. Spring", p.nom: "T. Spring" — no accents here, but let's test with one
      assert.equal(
        matchesName(p("T. Spríng", "Tom Spring"), "T. Spring"),
        true,
      );
    });

    it("accent normalization on player side: player data has no accents", () => {
      assert.equal(
        matchesName(p("T. Spring", "Tom Spring"), "T. Spríng"),
        true,
      );
    });

    it("real example: T. Spring (Bayonne)", () => {
      assert.equal(
        matchesName(p("T. Spring", "Tomas Spring"), "T. Spring"),
        true,
      );
    });

    // Known failure case: no space after dot
    it("no space after dot should NOT match (data format matters)", () => {
      assert.equal(
        matchesName(p("R. Ntamack", "Romain Ntamack"), "R.Ntamack"),
        false,
      );
    });

    it("multi-letter disambiguating initial: Pa. matches P. Boudehent", () => {
      assert.equal(
        matchesName(p("P. Boudehent", "Paul Boudehent"), "Pa. Boudehent"),
        true,
      );
    });

    it("multi-letter initial: wrong prefix does NOT match", () => {
      assert.equal(
        matchesName(p("P. Boudehent", "Paul Boudehent"), "Pi. Boudehent"),
        false,
      );
    });

    it("multi-letter initial: wrong last name does NOT match", () => {
      assert.equal(
        matchesName(p("P. Boudehent", "Paul Boudehent"), "Pa. Willis"),
        false,
      );
    });

    it("composite initial with dash: J.-L. Joseph matches Jefferson Joseph", () => {
      assert.equal(
        matchesName(p("J. Joseph", "Jefferson Joseph"), "J.-L. Joseph"),
        true,
      );
    });

    it("composite initial: wrong leading letter does NOT match", () => {
      assert.equal(
        matchesName(p("J. Joseph", "Jefferson Joseph"), "T.-L. Joseph"),
        false,
      );
    });
  });

  describe("plain last name (no '.')", () => {
    it("last name at end of nomcomplet", () => {
      assert.equal(
        matchesName(p("D. Penaud", "Damian Penaud"), "Penaud"),
        true,
      );
    });

    it("last name not matching", () => {
      assert.equal(
        matchesName(p("D. Penaud", "Damian Penaud"), "Willis"),
        false,
      );
    });

    it("prefix of last name should NOT match", () => {
      // "Pen" should not match "Penaud"
      assert.equal(matchesName(p("D. Penaud", "Damian Penaud"), "Pen"), false);
    });

    it("first name alone should NOT match (endsWith check)", () => {
      assert.equal(
        matchesName(p("D. Penaud", "Damian Penaud"), "Damian"),
        false,
      );
    });

    it("accent normalization: teamsheet uses accented, player data doesn't", () => {
      // player data from API has no accents; teamsheet uses "Orabé"
      assert.equal(matchesName(p("E. Orabe", "Erwan Orabe"), "Orabé"), true);
    });

    it("accent normalization: teamsheet uses accented, player data doesn't", () => {
      // player data from API has no accents; teamsheet uses "Vergé"
      assert.equal(matchesName(p("C. Verge", "Clement Verge"), "Vergé"), true);
    });

    it("accent normalization: teamsheet plain, player data plain too", () => {
      assert.equal(matchesName(p("E. Orabe", "Erwan Orabe"), "Orabe"), true);
    });

    it("hyphenated last name: Bielle-Biarrey", () => {
      assert.equal(
        matchesName(
          p("L. Bielle-Biarrey", "Louis Bielle-Biarrey"),
          "Bielle-Biarrey",
        ),
        true,
      );
    });

    it("case insensitive last name", () => {
      assert.equal(
        matchesName(p("D. Penaud", "Damian Penaud"), "penaud"),
        true,
      );
    });

    it("single-word nomcomplet (player known by one name)", () => {
      assert.equal(matchesName(p("Bosch", "Bosch"), "Bosch"), true);
    });

    it("full name matching nomcomplet exactly", () => {
      assert.equal(
        matchesName(p("J. Willis", "Jack Willis"), "Jack Willis"),
        true,
      );
    });

    it("full name in wrong order should NOT match", () => {
      assert.equal(
        matchesName(p("J. Willis", "Jack Willis"), "Willis Jack"),
        false,
      );
    });

    it("compound last name: Vergnes-Taillefer", () => {
      assert.equal(
        matchesName(
          p("H. Vergnes-Taillefer", "Harri Vergnes-Taillefer"),
          "Vergnes-Taillefer",
        ),
        true,
      );
    });

    it("real example: Mousques (Bordeaux) — teamsheet accented, player data not", () => {
      assert.equal(
        matchesName(p("T. Mousques", "Thomas Mousques"), "Mousquès"),
        true,
      );
    });

    it("real example: Bielle-Biarrey accent in teamsheet", () => {
      // teamsheet might use accented or unaccented — both should work
      assert.equal(
        matchesName(
          p("L. Bielle-Biarrey", "Louis Bielle-Biarrey"),
          "Bielle-Biarrey",
        ),
        true,
      );
    });

    // Edge case: "Martin" is a last name but also a first name — won't collide
    // if nomcomplet ends with " Martin", not starts
    it("Martin does not match Martineau", () => {
      assert.equal(
        matchesName(p("S. Martineau", "Sylvain Martineau"), "Martin"),
        false,
      );
    });

    // Teamsheet name can be first part only of composed name with a dash
    it("Guérois matches Guerois-Galisson", () => {
      assert.equal(
        matchesName(
          p("L. Guerois-Galisson", "Lois Guerois-Galisson"),
          "Guérois",
        ),
        true,
      );
    });

    // Ignore apostrophes in names
    it("Mafileo matches Mafile'o", () => {
      assert.equal(
        matchesName(p("S. Mafile'o", "Sione Mafile'o"), "Mafileo"),
        true,
      );
    });

    // Dash in teamsheet can be a space in the name
    it("Bibi-biziwu matches Bibi Biziwu", () => {
      assert.equal(
        matchesName(p("D. Bibi Biziwu", "Daniel Bibi Biziwu"), "Bibi-biziwu"),
        true,
      );
    });

    // Name can be first part only of composed teamsheet name with a dash
    it("Tanga-Mangene matches Tanga", () => {
      assert.equal(
        matchesName(p("Y. Tanga", "Yoan Tanga"), "Tanga-Mangene"),
        true,
      );
    });
  });
});
