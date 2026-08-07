/* eslint-env jest */
import applyBoosterCollations, {
  readBoosterCollations,
} from "../getBoosterCollations";
import { SETS_DATA } from "../metadata-constants";

const quiet = (): void => undefined;

describe("booster collations", () => {
  const derived = readBoosterCollations();
  const applied = applyBoosterCollations(SETS_DATA, quiet);
  const byCode: Record<string, any> = {};
  Object.values(applied).forEach((set: any) => {
    byCode[String(set.arenacode).toUpperCase()] = set;
  });

  it("reads ids out of Arena's booster data", () => {
    // One per set that has a play booster of its own — the draft and mythic
    // boosters of the same set are deliberately not counted separately.
    expect(Object.keys(derived).length).toBeGreaterThan(40);
  });

  it("agrees with an id that was already known", () => {
    // Dominaria's 100007 was in the hand-kept list long before this existed,
    // so it is the check that the tree is being read the way it was meant.
    expect(derived.DAR).toBe(100007);
  });

  it("gives the sets that had none one at last", () => {
    // Every set for two years carried -1 and so looked undraftable.
    expect(byCode.FDN.collation).toBe(100048);
    expect(byCode.FIN.collation).toBe(100054);
    expect(byCode.TDM.collation).toBe(100053);
    expect(byCode.MSH.collation).toBe(100061);
  });

  it("corrects the ones that had drifted", () => {
    // Entered by hand and off by one from Murders at Karlov Manor onwards,
    // which left it claiming Khans of Tarkir's boosters.
    expect(byCode.MKM.collation).toBe(100043);
    expect(byCode.KTK.collation).toBe(100042);
    expect(byCode.OTJ.collation).toBe(100044);
    expect(byCode.DSK.collation).toBe(100047);
  });

  it("keeps bonus sheets with the set whose packs they come in", () => {
    // These have no booster of their own; moving OTJ without them would leave
    // them pointing at whichever set inherited the old number.
    expect(byCode.OTP.collation).toBe(byCode.OTJ.collation);
    expect(byCode.BIG.collation).toBe(byCode.OTJ.collation);
    expect(byCode.OTC.collation).toBe(byCode.OTJ.collation);
  });

  it("leaves no two unrelated sets sharing an id", () => {
    const shared: Record<number, string[]> = {};
    Object.values(applied).forEach((set: any) => {
      if (set.collation === -1 || set.collation === false) return;
      shared[set.collation] = shared[set.collation] || [];
      shared[set.collation].push(String(set.arenacode).toUpperCase());
    });

    const groups = Object.values(shared).filter((codes) => codes.length > 1);
    // Only Outlaws of Thunder Junction and its bonus sheets, on purpose.
    expect(groups).toHaveLength(1);
    expect(groups[0].sort()).toEqual(["BIG", "OTC", "OTJ", "OTP"]);
  });

  it("leaves sets that genuinely have no boosters alone", () => {
    // Commander decks, anthologies and paper-only sets keep -1, which is what
    // marks them as something you cannot open packs of.
    expect(byCode.AHA1.collation).toBe(-1);
    expect(byCode.JMP.collation).toBe(-1);
  });
});
