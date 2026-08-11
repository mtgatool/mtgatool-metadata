import fs from "fs";
import path from "path";

import { contentHash, validateSnapshot } from "./updateFormats";

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

  it("rejects malformed format groups", () => {
    const nullGroup = { ...real, FormatGroups: [...real.FormatGroups, null] };
    expect(validateSnapshot(nullGroup)).toMatch(/group has no name/);

    const numberName = {
      ...real,
      FormatGroups: [{ GroupName: 1, FormatNames: ["Standard"] }],
    };
    expect(validateSnapshot(numberName)).toMatch(/group has no name/);

    const stringNames = {
      ...real,
      FormatGroups: [{ GroupName: "Constructed", FormatNames: "Standard" }],
    };
    expect(validateSnapshot(stringNames)).toMatch(
      /Constructed.FormatNames is not a string array/
    );

    const mixedNames = {
      ...real,
      FormatGroups: [{ GroupName: "Constructed", FormatNames: ["ok", 5] }],
    };
    expect(validateSnapshot(mixedNames)).toMatch(
      /Constructed.FormatNames is not a string array/
    );
  });
});

describe("contentHash", () => {
  // The uploading client hashes JSON.stringify(snapshot); the table stores
  // the content in a `json` column (text-preserving, unlike jsonb), so a
  // parse/stringify round trip — which is what PostgREST hands us — must
  // reproduce the same hash.
  it("survives a JSON text round trip", () => {
    const snapshot = {
      Formats: [{ name: "A", individualCardQuotas: { "99": { max: 1 } } }],
      FormatGroups: [],
    };
    const roundTripped = JSON.parse(JSON.stringify(snapshot));
    expect(contentHash(roundTripped)).toBe(contentHash(snapshot));
  });

  it("changes when the content changes", () => {
    const a = { Formats: [{ name: "A" }], FormatGroups: [] };
    const b = { Formats: [{ name: "B" }], FormatGroups: [] };
    expect(contentHash(a)).not.toBe(contentHash(b));
  });
});
