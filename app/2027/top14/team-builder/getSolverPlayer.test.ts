import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getSolverPlayer } from "./getSolverPlayer";

const makePlayer = (overrides: Partial<Parameters<typeof getSolverPlayer>[0]["player"]> = {}) => ({
  id: 1,
  isTeamsheetStarter: false,
  isTeamsheetSub: false,
  expectedStarterPoints: 10,
  expectedSubPoints: 4,
  ...overrides,
});

const baseOpts = {
  hasTeamsheet: true,
  filterByTeamsheet: true,
  excludedAsStarter: false,
  excludedAsSub: false,
};

describe("getSolverPlayer", () => {
  describe("filterByTeamsheet on, club has a teamsheet", () => {
    it("teamsheet starter keeps starter points and is zeroed as a sub", () => {
      const r = getSolverPlayer({
        ...baseOpts,
        player: makePlayer({ isTeamsheetStarter: true }),
      });
      assert.equal(r.expectedStarterPoints, 10);
      assert.equal(r.expectedSubPoints, 0);
    });

    it("teamsheet sub is scored on sub points when used as a starter", () => {
      const r = getSolverPlayer({
        ...baseOpts,
        player: makePlayer({ isTeamsheetSub: true }),
      });
      assert.equal(r.expectedStarterPoints, 4);
      assert.equal(r.expectedSubPoints, 4);
    });

    it("player listed as both starter and sub keeps both projections", () => {
      const r = getSolverPlayer({
        ...baseOpts,
        player: makePlayer({
          isTeamsheetStarter: true,
          isTeamsheetSub: true,
        }),
      });
      assert.equal(r.expectedStarterPoints, 10);
      assert.equal(r.expectedSubPoints, 4);
    });

    it("player not on the teamsheet at all is zeroed everywhere", () => {
      const r = getSolverPlayer({
        ...baseOpts,
        player: makePlayer(),
      });
      assert.equal(r.expectedStarterPoints, 0);
      assert.equal(r.expectedSubPoints, 0);
    });
  });

  describe("teamsheet filter is off / club has no teamsheet", () => {
    it("filterByTeamsheet=false keeps both projections", () => {
      const r = getSolverPlayer({
        ...baseOpts,
        filterByTeamsheet: false,
        player: makePlayer(),
      });
      assert.equal(r.expectedStarterPoints, 10);
      assert.equal(r.expectedSubPoints, 4);
    });

    it("hasTeamsheet=false keeps both projections", () => {
      const r = getSolverPlayer({
        ...baseOpts,
        hasTeamsheet: false,
        player: makePlayer(),
      });
      assert.equal(r.expectedStarterPoints, 10);
      assert.equal(r.expectedSubPoints, 4);
    });
  });

  describe("explicit exclusions", () => {
    it("excludedAsStarter zeroes starter even for a teamsheet starter", () => {
      const r = getSolverPlayer({
        ...baseOpts,
        excludedAsStarter: true,
        player: makePlayer({ isTeamsheetStarter: true }),
      });
      assert.equal(r.expectedStarterPoints, 0);
      assert.equal(r.expectedSubPoints, 0);
    });

    it("excludedAsSub zeroes sub but leaves the teamsheet-sub-as-starter score", () => {
      const r = getSolverPlayer({
        ...baseOpts,
        excludedAsSub: true,
        player: makePlayer({ isTeamsheetSub: true }),
      });
      assert.equal(r.expectedStarterPoints, 4);
      assert.equal(r.expectedSubPoints, 0);
    });
  });

  it("preserves untouched fields on the player", () => {
    const r = getSolverPlayer({
      ...baseOpts,
      player: makePlayer({ id: 42, nom: "Test", id_position: 12 } as any),
    }) as any;
    assert.equal(r.id, 42);
    assert.equal(r.nom, "Test");
    assert.equal(r.id_position, 12);
  });
});
