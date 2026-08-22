import resolveCardArt, {
  artistScore,
  ArtCardInput,
  normalizeName,
} from "../resolveCardArt";
import { ScryfallBulk, ScryfallPrint } from "../scryfallBulk";

function print(p: Partial<ScryfallPrint> & { set: string; cn: string }): ScryfallPrint {
  return {
    arenaId: null,
    name: "",
    faces: [],
    artist: "",
    digital: false,
    released: "2020-01-01",
    layout: "normal",
    highres: true,
    ...p,
  };
}

function bulk(prints: ScryfallPrint[], setNames: Record<string, string> = {}): ScryfallBulk {
  return { prints, setNames };
}

function card(c: Partial<ArtCardInput> & { GrpId: number; Name: string }): ArtCardInput {
  return {
    Set: "",
    DigitalSet: "",
    CollectorNumber: "1",
    ArtistCredit: "",
    IsToken: false,
    ...c,
  };
}

describe("normalizeName", () => {
  it("folds the punctuation the two sources disagree on", () => {
    expect(normalizeName("Ajani's Pridemate")).toBe(normalizeName("Ajanis Pridemate"));
    expect(normalizeName("Jötun Grunt")).toBe(normalizeName("Jotun Grunt"));
  });

  it("reconciles Arena's three-slash split names with Scryfall's two", () => {
    expect(normalizeName("Consign /// Oblivion")).toBe(normalizeName("Consign // Oblivion"));
  });
});

describe("artistScore", () => {
  it("matches identical credits", () => {
    expect(artistScore("Mark Zug", "Mark Zug")).toBe(100);
  });

  it("matches when one source carries extra names", () => {
    // Real pairs from the two databases.
    expect(artistScore("Dan Scott", "Dan Murayama Scott")).toBeGreaterThanOrEqual(70);
    expect(artistScore("Jenn Ravenna Tran", "Ravenna Tran")).toBeGreaterThanOrEqual(70);
    expect(artistScore("Parente", "Paolo Parente")).toBeGreaterThanOrEqual(70);
  });

  it("tolerates Arena's typos", () => {
    expect(artistScore("Massimilano Frezzato", "Massimiliano Frezzato")).toBeGreaterThanOrEqual(70);
  });

  it("does not match different people", () => {
    expect(artistScore("Kieran Yanner", "Daniel Ljunggren")).toBeLessThan(70);
  });

  it("is zero when either credit is missing", () => {
    expect(artistScore("", "Mark Zug")).toBe(0);
    expect(artistScore("Mark Zug", "")).toBe(0);
  });
});

describe("resolveCardArt", () => {
  const toScryfall = (code: string): string | null =>
    ({ KTK: "ktk", "Y23-DMU": "ydmu", GRN: "grn" } as Record<string, string>)[code] ?? null;

  it("takes Arena's own address when a print is there and is this card", () => {
    const result = resolveCardArt(
      [card({ GrpId: 1, Name: "Savage Knuckleblade", Set: "KTK", CollectorNumber: "202", ArtistCredit: "Todd Lockwood" })],
      toScryfall,
      bulk([print({ set: "ktk", cn: "202", name: "Savage Knuckleblade", artist: "Todd Lockwood" })])
    );
    expect(result.art[1]).toEqual({ s: "ktk", n: "202" });
    expect(result.stats.exact).toBe(1);
  });

  it("refuses an address holding a different card, and finds the right one", () => {
    // Arena's ktk/252 is an Island; Scryfall's is a Plains. This is the bug
    // that showed players a Plains where their Island should be.
    const result = resolveCardArt(
      [card({ GrpId: 2, Name: "Island", Set: "KTK", CollectorNumber: "252", ArtistCredit: "Titus Lunter" })],
      toScryfall,
      bulk([
        print({ set: "ktk", cn: "252", name: "Plains", artist: "Sam Burley" }),
        print({ set: "ktk", cn: "256", name: "Island", artist: "Titus Lunter" }),
      ])
    );
    expect(result.art[2]).toEqual({ s: "ktk", n: "256" });
    expect(result.stats.corrected).toBe(1);
  });

  it("refuses an address holding the right card by the wrong artist", () => {
    // A set holds four Islands. Matching the name alone picks whichever one
    // Arena's number happens to land on.
    const result = resolveCardArt(
      [card({ GrpId: 3, Name: "Island", Set: "KTK", CollectorNumber: "254", ArtistCredit: "Adam Paquette" })],
      toScryfall,
      bulk([
        print({ set: "ktk", cn: "254", name: "Island", artist: "Florian de Gesincourt" }),
        print({ set: "ktk", cn: "257", name: "Island", artist: "Adam Paquette" }),
      ])
    );
    expect(result.art[3]).toEqual({ s: "ktk", n: "257" });
  });

  it("believes arena_id when the name agrees", () => {
    const result = resolveCardArt(
      [card({ GrpId: 4, Name: "Ral, Izzet Viceroy", Set: "GRN", CollectorNumber: "5", ArtistCredit: "Daniel Ljunggren" })],
      toScryfall,
      bulk([
        print({ set: "grn", cn: "5", name: "Collar the Culprit", artist: "Victor Adame Minguez" }),
        print({ set: "pana", cn: "1", name: "Ral, Izzet Viceroy", artist: "Daniel Ljunggren", arenaId: 4 }),
      ])
    );
    expect(result.art[4]).toEqual({ s: "pana", n: "1" });
    expect(result.stats.byArenaId).toBe(1);
  });

  it("ignores arena_id when it points at a different card", () => {
    const result = resolveCardArt(
      [card({ GrpId: 5, Name: "Island", Set: "KTK", CollectorNumber: "252", ArtistCredit: "Titus Lunter" })],
      toScryfall,
      bulk([
        print({ set: "ktk", cn: "252", name: "Plains", artist: "Sam Burley", arenaId: 5 }),
        print({ set: "ktk", cn: "256", name: "Island", artist: "Titus Lunter" }),
      ])
    );
    expect(result.art[5]).toEqual({ s: "ktk", n: "256" });
    expect(result.stats.byArenaId).toBe(0);
  });

  it("substitutes another printing by the same artist, and says so", () => {
    // Black Dragon is Y23-DMU #28 in Arena and is not in Scryfall's ydmu.
    const result = resolveCardArt(
      [card({ GrpId: 6, Name: "Black Dragon", DigitalSet: "Y23-DMU", CollectorNumber: "28", ArtistCredit: "Mark Zug" })],
      toScryfall,
      bulk(
        [
          print({ set: "afr", cn: "90", name: "Black Dragon", artist: "Mark Zug" }),
          print({ set: "prm", cn: "92722", name: "Black Dragon", artist: "Jason A. Engle" }),
        ],
        { afr: "Adventures in the Forgotten Realms" }
      )
    );
    expect(result.art[6]).toEqual({ s: "afr", n: "90", sub: 1 });
    expect(result.stats.substituteByArtist).toBe(1);
    expect(result.artSets.afr).toBe("Adventures in the Forgotten Realms");
  });

  it("prefers the artist over the set when they disagree", () => {
    // Ranking by set first picks the right card with the wrong picture.
    const result = resolveCardArt(
      [card({ GrpId: 7, Name: "Teferi, Hero of Dominaria", Set: "GRN", CollectorNumber: "999", ArtistCredit: "Yongjae Choi" })],
      toScryfall,
      bulk([
        print({ set: "grn", cn: "300", name: "Teferi, Hero of Dominaria", artist: "Chris Rallis" }),
        print({ set: "med", cn: "GR6", name: "Teferi, Hero of Dominaria", artist: "Yongjae Choi" }),
      ])
    );
    expect(result.art[7]).toEqual({ s: "med", n: "GR6", sub: 1 });
  });

  it("falls back to any printing when no credit matches", () => {
    const result = resolveCardArt(
      [card({ GrpId: 8, Name: "Shivan Dragon", DigitalSet: "Y23-DMU", CollectorNumber: "53", ArtistCredit: "Nobody At All" })],
      toScryfall,
      bulk([print({ set: "fdn", cn: "763", name: "Shivan Dragon", artist: "Donato Giancola" })])
    );
    expect(result.art[8]).toEqual({ s: "fdn", n: "763", sub: 1 });
    expect(result.stats.substituteAny).toBe(1);
  });

  it("treats an Alchemy rebalance and its original as the same illustration", () => {
    const result = resolveCardArt(
      [card({ GrpId: 9, Name: "A-Alrund's Epiphany", Set: "KTK", CollectorNumber: "41", ArtistCredit: "Kieran Yanner" })],
      toScryfall,
      bulk([print({ set: "khm", cn: "41", name: "Alrund's Epiphany", artist: "Kieran Yanner" })])
    );
    expect(result.art[9]).toEqual({ s: "khm", n: "41", sub: 1 });
  });

  it("keeps tokens on token prints and cards off them", () => {
    const prints = [
      print({ set: "tktk", cn: "5", name: "Zombie", artist: "Kev Walker", layout: "token" }),
      print({ set: "ktk", cn: "77", name: "Zombie", artist: "Kev Walker" }),
    ];
    const asToken = resolveCardArt(
      [card({ GrpId: 10, Name: "Zombie", Set: "KTK", CollectorNumber: "5", ArtistCredit: "Kev Walker", IsToken: true })],
      toScryfall,
      bulk(prints)
    );
    expect(asToken.art[10]).toEqual({ s: "tktk", n: "5" });

    const asCard = resolveCardArt(
      [card({ GrpId: 11, Name: "Zombie", Set: "KTK", CollectorNumber: "77", ArtistCredit: "Kev Walker" })],
      toScryfall,
      bulk(prints)
    );
    expect(asCard.art[11]).toEqual({ s: "ktk", n: "77" });
  });

  it("emits nothing at all for a card Scryfall has never heard of", () => {
    const result = resolveCardArt(
      [card({ GrpId: 12, Name: "Titanic Pelagosaur", DigitalSet: "ANA-M19", CollectorNumber: "21" })],
      toScryfall,
      bulk([print({ set: "ktk", cn: "1", name: "Something Else" })])
    );
    expect(result.art[12]).toBeUndefined();
    expect(result.stats.unresolved).toBe(1);
  });
});
