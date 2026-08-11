import fs from "fs";
import path from "path";

import { validateSnapshot } from "./updateFormats";

// The repo's own formats.json is, by definition, a valid snapshot.
const real = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "../formats.json"), "utf8")
);

describe("validateSnapshot", () => {
  it("accepts the current formats.json", () => {
    expect(validateSnapshot(real)).toBeNull();
  });

  it("rejects junk", () => {
    expect(validateSnapshot(null)).toMatch(/not an array/);
    expect(validateSnapshot({ Formats: [] })).toMatch(/only 0 formats/);
    expect(validateSnapshot({ Formats: "yes" })).toMatch(/not an array/);
  });

  it("rejects a table with too few formats", () => {
    const small = { ...real, Formats: real.Formats.slice(0, 10) };
    expect(validateSnapshot(small)).toMatch(/only 10 formats/);
  });

  it("rejects a table missing an evergreen format", () => {
    const noStandard = {
      ...real,
      Formats: real.Formats.filter(
        (f: { name: string }) => f.name !== "Standard"
      ),
    };
    expect(validateSnapshot(noStandard)).toMatch(/missing the Standard/);
  });

  it("rejects malformed set lists", () => {
    const broken = {
      ...real,
      Formats: real.Formats.map((f: { name: string }) =>
        f.name === "Alchemy" ? { ...f, legalSets: [1, 2, 3] } : f
      ),
    };
    expect(validateSnapshot(broken)).toMatch(/Alchemy.legalSets/);
  });

  it("rejects unnamed formats", () => {
    const unnamed = { ...real, Formats: [...real.Formats, { name: "" }] };
    expect(validateSnapshot(unnamed)).toMatch(/no name/);
  });
});
