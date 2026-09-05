import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getEffectiveStarterPoints } from "./getEffectiveStarterPoints";

const baseInput = {
  filterByTeamsheet: true,
  hasTeamsheet: true,
  isTeamsheetStarter: false,
  isTeamsheetSub: false,
  expectedStarterPoints: 10,
  expectedSubPoints: 4,
};

describe("getEffectiveStarterPoints", () => {
  it("returns sub points for a teamsheet-sub-only player when the filter is on", () => {
    assert.equal(
      getEffectiveStarterPoints({ ...baseInput, isTeamsheetSub: true }),
      4,
    );
  });

  it("returns starter points for a teamsheet starter", () => {
    assert.equal(
      getEffectiveStarterPoints({ ...baseInput, isTeamsheetStarter: true }),
      10,
    );
  });

  it("returns starter points when listed as both starter and sub", () => {
    assert.equal(
      getEffectiveStarterPoints({
        ...baseInput,
        isTeamsheetStarter: true,
        isTeamsheetSub: true,
      }),
      10,
    );
  });

  it("returns starter points for a player not on the teamsheet at all", () => {
    assert.equal(getEffectiveStarterPoints(baseInput), 10);
  });

  it("returns raw starter points when the teamsheet filter is off", () => {
    assert.equal(
      getEffectiveStarterPoints({
        ...baseInput,
        filterByTeamsheet: false,
        isTeamsheetSub: true,
      }),
      10,
    );
  });

  it("returns raw starter points when the club has no teamsheet", () => {
    assert.equal(
      getEffectiveStarterPoints({
        ...baseInput,
        hasTeamsheet: false,
        isTeamsheetSub: true,
      }),
      10,
    );
  });
});
