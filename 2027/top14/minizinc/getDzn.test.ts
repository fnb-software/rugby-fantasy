import { describe, it } from "node:test";
import assert from "node:assert/strict";
import getDzn from "./getDzn.js";

const makePlayer = (id: number, id_position: number, overrides: any = {}) => ({
  id,
  id_position,
  id_club: 100 + id,
  stats: {
    detail: [
      {
        numero: 1,
        points: "5",
        valeuravant: 10,
        valeurapres: 12,
        remplacant: false,
      },
    ],
  },
  ...overrides,
});

describe("getDzn with empty players", () => {
  it("adds 18 empty players to the player pool when budget is set", () => {
    const players = [makePlayer(1, 12), makePlayer(2, 13)];
    const dzn = getDzn(players, 0, 100);
    
    const playerIds = dzn
      .match(/Players = \{([^}]+)\}/)![1]
      .split(",")
      .map((s) => s.trim().replace(/'/g, ""));
    
    const emptyPlayerIds = playerIds.filter((id) => id.startsWith("-"));
    assert.equal(emptyPlayerIds.length, 18, "should have 18 empty players when budget is set");
    assert.ok(playerIds.includes("1"), "should include real player 1");
    assert.ok(playerIds.includes("2"), "should include real player 2");
  });

  it("does not add empty players when budget is not set", () => {
    const players = [makePlayer(1, 12), makePlayer(2, 13)];
    const dzn = getDzn(players, 0, undefined);
    
    const playerIds = dzn
      .match(/Players = \{([^}]+)\}/)![1]
      .split(",")
      .map((s) => s.trim().replace(/'/g, ""));
    
    const emptyPlayerIds = playerIds.filter((id) => id.startsWith("-"));
    assert.equal(emptyPlayerIds.length, 0, "should not have empty players when budget is not set");
    assert.equal(playerIds.length, 2, "should only have the 2 real players");
  });

  it("empty players have zero cost and value", () => {
    const players = [makePlayer(1, 12)];
    const dzn = getDzn(players, 0, 100);
    
    const costs = dzn
      .match(/cost = \[([^\]]+)\]/)![1]
      .split(",")
      .map((s) => parseInt(s.trim()));
    
    const values = dzn
      .match(/value = \[([^\]]+)\]/)![1]
      .split(",")
      .map((s) => parseInt(s.trim()));
    
    // Empty players (negative IDs) should have zero cost/value
    const playerIds = dzn
      .match(/Players = \{([^}]+)\}/)![1]
      .split(",")
      .map((s) => s.trim().replace(/'/g, ""));
    
    playerIds.forEach((id, index) => {
      if (id.startsWith("-")) {
        assert.equal(costs[index], 0, `empty player ${id} should have zero cost`);
        assert.equal(values[index], 0, `empty player ${id} should have zero value`);
      }
    });
  });

  it("empty players have special squad ID for high cap", () => {
    const players = [makePlayer(1, 12)];
    const dzn = getDzn(players, 0, 100);
    
    const squads = dzn
      .match(/squad = \[([^\]]+)\]/)![1]
      .split(",")
      .map((s) => parseInt(s.trim()));
    
    const emptySquads = squads.slice(-18);
    assert.ok(emptySquads.every((s) => s === -1), "empty players should have squad -1");
  });

  it("empty players have correct positions for their slots", () => {
    const players = [makePlayer(1, 12)];
    const dzn = getDzn(players, 0, 100);
    
    const positions = dzn
      .match(/position = \[([^\]]+)\]/)![1]
      .split(",")
      .map((s) => parseInt(s.trim()));
    
    const playerIds = dzn
      .match(/Players = \{([^}]+)\}/)![1]
      .split(",")
      .map((s) => s.trim().replace(/'/g, ""));
    
    // team_position from fantasy.mzn: [12, 12, 13, 11, 11, 10, 10, 10, 9, 8, 6, 6, 5, 7, 7]
    const expectedStartersPositions = [12, 12, 13, 11, 11, 10, 10, 10, 9, 8, 6, 6, 5, 7, 7];
    
    // Check that empty players -1 through -15 have the correct starter positions
    for (let i = 1; i <= 15; i++) {
      const emptyId = `-${i}`;
      const index = playerIds.indexOf(emptyId);
      assert.ok(index !== -1, `empty player ${emptyId} should exist`);
      assert.equal(
        positions[index],
        expectedStartersPositions[i - 1],
        `empty player ${emptyId} should have position ${expectedStartersPositions[i - 1]}`
      );
    }
    
    // Empty players -16, -17, -18 (subs) should have position 10
    for (let i = 16; i <= 18; i++) {
      const emptyId = `-${i}`;
      const index = playerIds.indexOf(emptyId);
      assert.ok(index !== -1, `empty player ${emptyId} should exist`);
      assert.equal(
        positions[index],
        10,
        `empty player ${emptyId} (sub) should have position 10`
      );
    }
  });

});
