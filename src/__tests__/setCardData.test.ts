/* eslint-env jest */
import { CardSet } from "mtgatool-shared";

import computeSetCardData, { resolveSetName } from "../setCardData";
import { DbCardDataV2 } from "../types/metadata";

const set = (over: Partial<CardSet> = {}): CardSet => ({
  collation: -1,
  scryfall: "xxx",
  code: "XXX",
  arenacode: "XXX",
  tile: 0,
  release: "2020-01-01",
  ...over,
});

const card = (over: Partial<DbCardDataV2> = {}): DbCardDataV2 =>
  ({
    GrpId: 1,
    Name: "A Card",
    Set: "XXX",
    DigitalSet: "",
    Rarity: "rare",
    IsToken: false,
    IsPrimaryCard: true,
    LinkedFaceType: 0,
    ...over,
  } as DbCardDataV2);

const SETS: Record<string, CardSet> = {
  Real: set({ scryfall: "rea", code: "REA", arenacode: "REA" }),
  // Arena only ever took alternate printings from this one.
  Reprints: set({ scryfall: "rep", code: "REP", arenacode: "REP" }),
  // Paper code and Arena code disagree, as with Dominaria (DOM / DAR).
  Renamed: set({ scryfall: "dom", code: "DOM", arenacode: "DAR" }),
};

const SET_NAMES: Record<string, string> = {
  REA: "Real",
  rea: "Real",
  REP: "Reprints",
  rep: "Reprints",
  DAR: "Renamed",
  dar: "Renamed",
  DOM: "Renamed",
  dom: "Renamed",
};

describe("computeSetCardData", () => {
  const cards: Record<number, DbCardDataV2> = {
    1: card({ GrpId: 1, Set: "REA" }),
    // Sub-collation suffix: the reason a bare `s:rea` used to match nothing.
    2: card({ GrpId: 2, Set: "REA", DigitalSet: "REA-BONUS" }),
    3: card({ GrpId: 3, Set: "REP", IsPrimaryCard: false }),
    4: card({ GrpId: 4, Set: "REP", IsToken: true }),
    5: card({ GrpId: 5, Set: "DAR" }),
  };
  const result = computeSetCardData(cards, SETS, SET_NAMES);

  it("marks a set with a primary card of its own collectible", () => {
    expect(result.Real.collectible).toBe(true);
  });

  it("does not mark a set that only has alternate printings", () => {
    expect(result.Reprints.collectible).toBe(false);
  });

  it("does not count tokens, lands or non-listed faces", () => {
    const only = computeSetCardData(
      {
        1: card({ Set: "REA", IsToken: true }),
        2: card({ GrpId: 2, Set: "REA", Rarity: "land" }),
        3: card({ GrpId: 3, Set: "REA", LinkedFaceType: 5 }),
      },
      SETS,
      SET_NAMES
    );
    expect(only.Real.collectible).toBe(false);
  });

  it("collects the sub-collation suffix and its base as aliases", () => {
    expect(result.Real.aliases).toEqual(
      expect.arrayContaining(["rea", "rea-bonus"])
    );
  });

  it("keeps both the paper and the Arena code as aliases", () => {
    expect(result.Renamed.aliases).toEqual(
      expect.arrayContaining(["dar", "dom"])
    );
  });

  it("gives every set its own codes even with no cards", () => {
    const empty = computeSetCardData({}, SETS, SET_NAMES);
    expect(empty.Real.aliases).toEqual(["rea"]);
    expect(empty.Real.collectible).toBe(false);
  });
});

describe("resolveSetName", () => {
  it("resolves a bare code", () => {
    expect(resolveSetName("REA", SET_NAMES)).toBe("Real");
  });

  it("falls back to the part before the suffix", () => {
    expect(resolveSetName("REA-BONUS", SET_NAMES)).toBe("Real");
  });

  it("returns undefined for an unknown code", () => {
    expect(resolveSetName("NOPE", SET_NAMES)).toBeUndefined();
  });
});
