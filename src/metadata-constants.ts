import fs from "fs";
import path from "path";
import { CardSet, Rarity } from "mtgatool-shared";

export const RATINGS_MTGCSR = 0;
export const RATINGS_LOLA = 1;
export const RATINGS_LOLA_B = 2;

export const APPDATA = path.resolve(__dirname, "..");

export const EXTERNAL = "external";
export const OUTPUT = "output";
export const DIST = "dist";

const packageJson = JSON.parse(
  fs.readFileSync(path.join(APPDATA, "package.json"), "utf8")
);

export const VERSION = packageJson.version.split(".")[0];

export type SCRYFALL_LANGS =
  | "EN"
  | "PH"
  | "DE"
  | "ES"
  | "FR"
  | "IT"
  | "RU"
  | "PT"
  | "JA"
  // | "ZHS"
  | "KO"
  | "PH";

export type ARENA_LANGS =
  | "enUS"
  | "frFR"
  | "itIT"
  | "deDE"
  | "esES"
  | "jaJP"
  | "ptBR"
  | "ruRU"
  | "koKR";
// | "zhCN";

// What languages to actually compile
export const LANGUAGES: SCRYFALL_LANGS[] = [
  "EN",
  "ES",
  "PT",
  "DE",
  "FR",
  "IT",
  "JA",
  "RU",
  "KO",
  // "ZHS", // Chinese is not provided by mtga anymore
];

export const LANGKEYS: Record<ARENA_LANGS, SCRYFALL_LANGS> = {
  enUS: "EN",
  frFR: "FR",
  itIT: "IT",
  deDE: "DE",
  esES: "ES",
  jaJP: "JA",
  ptBR: "PT",
  ruRU: "RU",
  koKR: "KO",
  // zhCN: "ZHS",
};

export const SETS_DATA: Record<string, CardSet> = {
  Coldsnap: {
    collation: -1,
    scryfall: "csp",
    code: "CSP",
    arenacode: "CSP",
    tile: 66433,
    release: "2006-07-21",
  },
  "Born of the Gods": {
    collation: -1,
    scryfall: "bng",
    code: "BNG",
    arenacode: "BNG",
    tile: 66433,
    release: "2014-02-07",
  },
  "Fate Reforged": {
    collation: -1,
    scryfall: "frf",
    code: "FRF",
    arenacode: "FRF",
    tile: 66433,
    release: "2015-01-23",
  },
  "Khans of Tarkir": {
    collation: -1,
    scryfall: "ktk",
    code: "KTK",
    arenacode: "KTK",
    tile: 66433,
    release: "2014-09-26",
  },
  "Oath of the Gatewatch": {
    collation: -1,
    scryfall: "ogw",
    code: "OGW",
    arenacode: "OGW",
    tile: 66433,
    release: "2016-01-22",
  },
  "Commander 2018": {
    collation: -1,
    scryfall: "c18",
    code: "C18",
    arenacode: "C18",
    tile: 66433,
    release: "2018-08-09",
  },
  "Commander 2021": {
    collation: -1,
    scryfall: "c21",
    code: "C21",
    arenacode: "C21",
    tile: 66433,
    release: "2021-04-23",
  },
  "Commander Collection: Black": {
    collation: -1,
    scryfall: "cc2",
    code: "CC2",
    arenacode: "CC2",
    tile: 66433,
    release: "2022-01-28",
  },
  "Neon Dynasty Commander": {
    collation: -1,
    scryfall: "nec",
    code: "NEC",
    arenacode: "NEC",
    tile: 66433,
    release: "2022-02-18",
  },
  "Ultimate Masters ": {
    collation: -1,
    scryfall: "uma",
    code: "UMA",
    arenacode: "UMA",
    tile: 66433,
    release: "2018-12-07",
  },
  "Aether Revolt": {
    collation: -1,
    scryfall: "aer",
    code: "AER",
    arenacode: "AER",
    tile: 66433,
    release: "2017-01-20",
  },
  "Hour of Devastation": {
    collation: -1,
    scryfall: "hou",
    code: "HOU",
    arenacode: "HOU",
    tile: 66433,
    release: "2017-07-14",
  },
  "Mythic Edition": {
    collation: -1,
    scryfall: "med",
    code: "MED",
    arenacode: "MED",
    tile: 68674,
    release: "2018-10-06",
  },
  Mirage: {
    collation: -1,
    scryfall: "mir",
    code: "MIR",
    arenacode: "MIR",
    tile: 67003,
    release: "1996-10-08",
  },
  "Battle for Zendikar": {
    collation: -1,
    scryfall: "bfz",
    code: "BFZ",
    arenacode: "BFZ",
    tile: 67003,
    release: "2015-10-02",
  },
  "Return to Ravnica": {
    collation: -1,
    scryfall: "rtr",
    code: "RTR",
    arenacode: "RTR",
    tile: 67003,
    release: "2012-10-05",
  },
  "Rise of Eldrazi": {
    collation: -1,
    scryfall: "roe",
    code: "ROE",
    arenacode: "ROE",
    tile: 67003,
    release: "2010-04-23",
  },
  Amonkhet: {
    collation: -1,
    scryfall: "akh",
    code: "AKH",
    arenacode: "AKH",
    tile: 64827,
    release: "2017-04-28",
  },
  Planeshift: {
    collation: -1,
    scryfall: "pls",
    code: "PLS",
    arenacode: "PLS",
    tile: 64827,
    release: "2001-02-05",
  },
  Scourge: {
    collation: -1,
    scryfall: "scg",
    code: "SCG",
    arenacode: "SCG",
    tile: 64827,
    release: "2003-05-26",
  },
  Darksteel: {
    collation: -1,
    scryfall: "dst",
    code: "DST",
    arenacode: "DST",
    tile: 64827,
    release: "2004-02-06",
  },
  "Fifth Dawn": {
    collation: -1,
    scryfall: "5dn",
    code: "5DN",
    arenacode: "5DN",
    tile: 64827,
    release: "2004-06-04",
  },
  "Ninth Edition": {
    collation: -1,
    scryfall: "9ed",
    code: "9ED",
    arenacode: "9ED",
    tile: 64827,
    release: "2005-07-29",
  },
  "Ravnica: City of Guilds": {
    collation: -1,
    scryfall: "rav",
    code: "RAV",
    arenacode: "RAV",
    tile: 64827,
    release: "2005-10-07 ",
  },
  Dissension: {
    collation: -1,
    scryfall: "dis",
    code: "DIS",
    arenacode: "DIS",
    tile: 64827,
    release: "2006-05-05 ",
  },
  "Tenth Edition": {
    collation: -1,
    scryfall: "10e",
    code: "10E",
    arenacode: "10E",
    tile: 64827,
    release: "2007-07-13",
  },
  "Masters Edition II": {
    collation: -1,
    scryfall: "me2",
    code: "ME2",
    arenacode: "ME2",
    tile: 64827,
    release: "2008-09-22",
  },
  "Magic 2011": {
    collation: -1,
    scryfall: "m11",
    code: "M11",
    arenacode: "M11",
    tile: 64827,
    release: "2010-07-16",
  },
  "Masters Edition IV": {
    collation: -1,
    scryfall: "me4",
    code: "ME4",
    arenacode: "ME4",
    tile: 64827,
    release: "2011-01-10",
  },
  "Commander 2011": {
    collation: -1,
    scryfall: "cmd",
    code: "CMD",
    arenacode: "CMD",
    tile: 64827,
    release: "2011-06-17",
  },
  "Avacyn Restored": {
    collation: -1,
    scryfall: "avr",
    code: "AVR",
    arenacode: "AVR",
    tile: 64827,
    release: "2012-05-04",
  },
  "Champions of Kamigawa": {
    collation: -1,
    scryfall: "chk",
    code: "CHK",
    arenacode: "CHK",
    tile: 64827,
    release: "2004-10-01",
  },
  "New Phyrexia": {
    collation: -1,
    scryfall: "nph",
    code: "NPH",
    arenacode: "NPH",
    tile: 64827,
    release: "2011-05-13",
  },
  Zendikar: {
    collation: -1,
    scryfall: "zen",
    code: "ZEN",
    arenacode: "ZEN",
    tile: 64827,
    release: "2009-10-02",
  },
  Gatecrash: {
    collation: -1,
    scryfall: "gtc",
    code: "GTC",
    arenacode: "GTC",
    tile: 64827,
    release: "2013-02-01",
  },
  "Commander 2013": {
    collation: -1,
    scryfall: "c13",
    code: "C13",
    arenacode: "C13",
    tile: 64827,
    release: "2013-11-01",
  },
  "Eldritch Moon": {
    collation: -1,
    scryfall: "emn",
    code: "EMN",
    arenacode: "EMN",
    tile: 64827,
    release: "2016-07-22",
  },
  "Dragons of Tarkir": {
    collation: -1,
    scryfall: "dtk",
    code: "DTK",
    arenacode: "DTK",
    tile: 64827,
    release: "2015-03-27",
  },
  Weatherlight: {
    collation: -1,
    scryfall: "wth",
    code: "WTH",
    arenacode: "WTH",
    tile: 64827,
    release: "1997-06-09",
  },
  Invasion: {
    collation: -1,
    scryfall: "inv",
    code: "INV",
    arenacode: "INV",
    tile: 64827,
    release: "2000-10-02",
  },
  "Eighth Edition": {
    collation: -1,
    scryfall: "8ed",
    code: "8ED",
    arenacode: "8ED",
    tile: 64827,
    release: "2003-07-28",
  },
  "Saviors of Kamigawa": {
    collation: -1,
    scryfall: "sok",
    code: "SOK",
    arenacode: "SOK",
    tile: 64827,
    release: "2005-06-03",
  },
  Lorwyn: {
    collation: -1,
    scryfall: "lrw",
    code: "LRW",
    arenacode: "LRW",
    tile: 64827,
    release: "2007-10-12 ",
  },
  Morningtide: {
    collation: -1,
    scryfall: "mor",
    code: "MOR",
    arenacode: "MOR",
    tile: 64827,
    release: "2008-02-01",
  },
  "Magic 2010": {
    collation: -1,
    scryfall: "m10",
    code: "M10",
    arenacode: "M10",
    tile: 64827,
    release: "2009-07-17",
  },
  Worldwake: {
    collation: -1,
    scryfall: "wwk",
    code: "WWK",
    arenacode: "WWK",
    tile: 64827,
    release: "2009-07-17",
  },
  "Magic Origins": {
    collation: -1,
    scryfall: "ori",
    code: "ORI",
    arenacode: "ORI",
    tile: 64827,
    release: "2015-07-17",
  },
  "Modern Horizons": {
    collation: -1,
    scryfall: "mh1",
    code: "MH1",
    arenacode: "MH1",
    tile: 64827,
    release: "2019-06-14",
  },
  "Shadows over Innistrad": {
    collation: -1,
    scryfall: "soi",
    code: "SOI",
    arenacode: "SOI",
    tile: 64827,
    release: "2016-04-08",
  },
  "Vintage Masters": {
    collation: -1,
    scryfall: "vma",
    code: "VMA",
    arenacode: "VMA",
    tile: 64827,
    release: "2014-06-16",
  },
  "Modern Masters": {
    collation: -1,
    scryfall: "mma",
    code: "MMA",
    arenacode: "MMA",
    tile: 64827,
    release: "2013-06-07",
  },
  "Journey into Nyx": {
    collation: -1,
    scryfall: "jou",
    code: "JOU",
    arenacode: "JOU",
    tile: 64827,
    release: "2014-05-02",
  },
  Theros: {
    collation: -1,
    scryfall: "ths",
    code: "THS",
    arenacode: "THS",
    tile: 64827,
    release: "2013-09-27",
  },
  "Magic 2014": {
    collation: -1,
    scryfall: "m14",
    code: "M14",
    arenacode: "M14",
    tile: 64827,
    release: "2013-07-19",
  },
  "Duel Decks: Elspeth vs. Tezzeret": {
    collation: -1,
    scryfall: "ddf",
    code: "DDF",
    arenacode: "DDF",
    tile: 64827,
    release: "2010-09-03",
  },
  Shadowmoor: {
    collation: -1,
    scryfall: "shm",
    code: "SHM",
    arenacode: "SHM",
    tile: 64827,
    release: "2008-05-02",
  },
  Mirrodin: {
    collation: -1,
    scryfall: "mrd",
    code: "MRD",
    arenacode: "MRD",
    tile: 64827,
    release: "2003-10-02",
  },
  Odyssey: {
    collation: -1,
    scryfall: "ody",
    code: "ODY",
    arenacode: "ODY",
    tile: 64827,
    release: "2001-10-01",
  },
  "Magic 2013": {
    collation: -1,
    scryfall: "m13",
    code: "M13",
    arenacode: "M13",
    tile: 67003,
    release: "2012-07-13",
  },
  "Mercadian Masques": {
    collation: -1,
    scryfall: "mmq",
    code: "MMQ",
    arenacode: "MMQ",
    tile: 67003,
    release: "1999-10-04",
  },
  Onslaught: {
    collation: -1,
    scryfall: "ons",
    code: "ONS",
    arenacode: "ONS",
    tile: 67003,
    release: "2002-10-07",
  },
  "Shards of Alara": {
    collation: -1,
    scryfall: "ala",
    code: "ALA",
    arenacode: "ALA",
    tile: 67003,
    release: "2008-10-03",
  },
  "Scars of Mirrodin": {
    collation: -1,
    scryfall: "som",
    code: "SOM",
    arenacode: "SOM",
    tile: 67003,
    release: "2010-10-01",
  },
  Innistrad: {
    collation: -1,
    scryfall: "isd",
    code: "ISD",
    arenacode: "ISD",
    tile: 67003,
    release: "2011-09-30",
  },
  Conflux: {
    collation: -1,
    scryfall: "con",
    code: "CONF",
    arenacode: "CONF",
    tile: 67003,
    release: "2009-02-06",
  },
  "Dark Ascension": {
    collation: -1,
    scryfall: "dka",
    code: "DKA",
    arenacode: "DKA",
    tile: 67003,
    release: "2012-02-03",
  },
  "Magic 2015": {
    collation: -1,
    scryfall: "m15",
    code: "M15",
    arenacode: "M15",
    tile: 67003,
    release: "2014-07-18",
  },
  Unsanctioned: {
    collation: -1,
    scryfall: "und",
    code: "UND",
    arenacode: "UND",
    tile: 67003,
    release: "2020-02-29",
  },
  "Alara Reborn": {
    collation: -1,
    scryfall: "arb",
    code: "ARB",
    arenacode: "ARB",
    tile: 67003,
    release: "2009-04-30",
  },
  "Secret Lair Drop": {
    collation: -1,
    scryfall: "sld",
    code: "SLD",
    arenacode: "SLD",
    tile: 67003,
    release: "2002-02-04",
  },
  Torment: {
    collation: -1,
    scryfall: "tor",
    code: "TOR",
    arenacode: "TOR",
    tile: 67003,
    release: "2002-02-04",
  },
  Judgment: {
    collation: -1,
    scryfall: "jud",
    code: "JUD",
    arenacode: "JUD",
    tile: 67003,
    release: "2002-05-27",
  },
  Legions: {
    collation: -1,
    scryfall: "lgn",
    code: "LGN",
    arenacode: "LGN",
    tile: 67003,
    release: "2003-02-03",
  },
  "Time Spiral": {
    collation: -1,
    scryfall: "tsp",
    code: "TSP",
    arenacode: "TSP",
    tile: 67003,
    release: "2006-10-06",
  },
  "Magic 2012": {
    collation: -1,
    scryfall: "m12",
    code: "M12",
    arenacode: "M12",
    tile: 67003,
    release: "2011-07-15",
  },
  "Planar Chaos": {
    collation: -1,
    scryfall: "plc",
    code: "PLC",
    arenacode: "PLC",
    tile: 67003,
    release: "2007-02-02",
  },
  "Dragon's Maze": {
    collation: -1,
    scryfall: "dgm",
    code: "DGM",
    arenacode: "DGM",
    tile: 67003,
    release: "2013-05-03",
  },
  Unstable: {
    collation: -1,
    scryfall: "ust",
    code: "UST",
    arenacode: "UST",
    tile: 67003,
    release: "2017-12-08",
  },
  Jumpstart: {
    collation: -1,
    scryfall: "jmp",
    code: "JMP",
    arenacode: "JMP",
    tile: 67003,
    release: "2020-07-17",
  },
  "Commander 2020": {
    collation: -1,
    scryfall: "c20",
    code: "C20",
    arenacode: "C20",
    tile: 67003,
    release: "2020-04-17",
  },
  "Commander Legends": {
    collation: -1,
    scryfall: "cmr",
    code: "CMR",
    arenacode: "CMR",
    tile: 67003,
    release: "2020-11-20",
  },
  "Double Masters": {
    collation: -1,
    scryfall: "2xm",
    code: "2XM",
    arenacode: "2XM",
    tile: 67003,
    release: "2020-08-07",
  },
  "Strixhaven Mystical Archive": {
    collation: 100999, // This one is not used
    scryfall: "sta",
    code: "STA",
    arenacode: "STA",
    tile: 76476,
    release: "2021-04-23",
  },
  "Mirrodin Besieged": {
    collation: -1,
    scryfall: "mbs",
    code: "MBS",
    arenacode: "MBS",
    tile: 67003,
    release: "2011-02-04",
  },
  ANC: {
    collation: -1,
    scryfall: "anc",
    code: "ANC",
    arenacode: "ANC",
    tile: 67003,
    release: "2021-05-27",
  },
  "Jumpstart: Historic Horizons": {
    collation: -1,
    scryfall: "j21",
    code: "J21",
    arenacode: "J21",
    tile: 67003,
    release: "2021-08-26",
  },
  "Modern Horizons 2": {
    collation: -1,
    scryfall: "mh2",
    code: "MH2",
    arenacode: "MH2",
    tile: 67003,
    release: "2021-06-18",
  },
  Ixalan: {
    collation: 100005,
    scryfall: "xln",
    code: "XLN",
    arenacode: "XLN",
    tile: 66433,
    release: "2017-09-29",
  },
  "Rivals of Ixalan": {
    collation: 100006,
    scryfall: "rix",
    code: "RIX",
    arenacode: "RIX",
    tile: 66937,
    release: "2018-01-19",
  },
  Dominaria: {
    collation: 100007,
    scryfall: "dom",
    code: "DOM",
    arenacode: "DAR",
    tile: 67106,
    release: "2018-04-27",
  },
  "Core Set 2019": {
    collation: 100008,
    scryfall: "m19",
    code: "M19",
    arenacode: "M19",
    tile: 68116,
    release: "2018-07-13",
  },
  "Arena New Player Experience": {
    collation: false,
    scryfall: "ana",
    code: "ANA",
    arenacode: "ANA",
    tile: 67106,
    release: "2018-07-14",
  },
  "Arena New Player Experience 2020": {
    collation: false,
    scryfall: "ana",
    code: "ANB",
    arenacode: "ANB",
    tile: 67106,
    release: "2020-08-13",
  },
  "Guilds of Ravnica": {
    collation: 100009,
    scryfall: "grn",
    code: "GRN",
    arenacode: "GRN",
    tile: 68674,
    release: "2018-10-05",
  },
  "M19 Gift Pack": {
    collation: false,
    scryfall: "g18",
    code: "G18",
    arenacode: "G18",
    tile: 68116,
    release: "2018-07-13",
  },
  "Ravnica Allegiance": {
    collation: 100010,
    scryfall: "rna",
    code: "RNA",
    arenacode: "RNA",
    tile: 69294,
    release: "2019-01-25",
  },
  "War of the Spark": {
    collation: 100013,
    scryfall: "war",
    code: "WAR",
    arenacode: "WAR",
    tile: 69656,
    release: "2019-05-03",
  },
  "Core Set 2020": {
    collation: 100014,
    scryfall: "m20",
    code: "M20",
    arenacode: "M20",
    tile: 69912,
    release: "2019-07-12",
  },
  "Throne of Eldraine": {
    collation: 100015,
    scryfall: "eld",
    code: "ELD",
    arenacode: "ELD",
    tile: 70338,
    release: "2019-10-04",
  },
  "Theros: Beyond Death": {
    collation: 100016,
    scryfall: "thb",
    code: "THB",
    arenacode: "THB",
    tile: 70735,
    release: "2020-01-24",
  },
  "Ikoria: Lair of Behemoths": {
    collation: 100017,
    scryfall: "iko",
    code: "IKO",
    arenacode: "IKO",
    tile: 71242,
    release: "2020-04-16",
  },
  "Core Set 2021": {
    collation: 100018,
    scryfall: "m21",
    code: "M21",
    arenacode: "M21",
    tile: 71783,
    release: "2020-06-04",
  },
  "Zendikar Rising": {
    collation: 100020,
    scryfall: "znr",
    code: "ZNR",
    arenacode: "ZNR",
    tile: 67003,
    release: "2020-09-25",
  },
  "Amonkhet Remastered": {
    collation: 100019,
    scryfall: "akr",
    code: "AKR",
    arenacode: "AKR",
    tile: 67003,
    release: "2020-08-13",
  },
  "Kaladesh Remastered": {
    collation: 100021,
    scryfall: "klr",
    code: "KLR",
    arenacode: "KLR",
    tile: 67003,
    release: "2020-11-12",
  },
  Kaldheim: {
    collation: 100022,
    scryfall: "khm",
    code: "KHM",
    arenacode: "KHM",
    tile: 76884,
    release: "2021-02-05",
  },
  "Strixhaven: School of Mages": {
    collation: 100023,
    scryfall: "stx",
    code: "STX",
    arenacode: "STX",
    tile: 76476,
    release: "2021-04-23",
  },
  "Adventures in the Forgotten Realms": {
    collation: 100024,
    scryfall: "afr",
    code: "AFR",
    arenacode: "AFR",
    tile: 67003,
    release: "2021-07-23",
  },
  "Innistrad: Midnight Hunt": {
    collation: 100025,
    scryfall: "mid",
    code: "MID",
    arenacode: "MID",
    tile: 67003,
    release: "2021-06-18",
  },
  "Innistrad: Crimson Vow": {
    collation: 100026,
    scryfall: "vow",
    code: "VOW",
    arenacode: "VOW",
    tile: 67003,
    release: "2021-11-19",
  },
  "Kamigawa: Neon Dynasty": {
    collation: 100027,
    scryfall: "neo",
    code: "NEO",
    arenacode: "NEO",
    tile: 67003,
    release: "2022-02-18",
  },
  "Streets of New Capenna": {
    collation: 100028,
    scryfall: "snc",
    code: "SNC",
    arenacode: "SNC",
    tile: 67003,
    release: "2022-04-29",
  },
  "Alchemy: Innistrad": {
    collation: 400026,
    scryfall: "ymid",
    code: "Y22-MID",
    arenacode: "Y22-MID",
    tile: 67003,
    release: "2021-12-09",
  },
  "Alchemy: Kamigawa": {
    collation: 400027,
    scryfall: "yneo",
    code: "Y22-NEO",
    arenacode: "Y22-NEO",
    tile: 67003,
    release: "2022-03-17",
  },
  "Alchemy: New Capenna": {
    collation: 400028,
    scryfall: "ysnc",
    code: "Y22-SNC",
    arenacode: "Y22-SNC",
    tile: 67003,
    release: "2022-06-02",
  },
  "Dominaria United": {
    collation: 400028,
    scryfall: "dmu",
    code: "DMU",
    arenacode: "DMU",
    tile: 67003,
    release: "2022-09-09",
  },
  "": {
    collation: -1,
    scryfall: "default",
    code: "",
    arenacode: "",
    tile: 67003,
    release: "2000-00-00",
  },
  "Historic Anthology 1": {
    collation: -1,
    scryfall: "ha1",
    code: "AHA1",
    arenacode: "AHA1",
    tile: 67003,
    release: "2019-11-21",
  },
  "Historic Anthology 2": {
    collation: -1,
    scryfall: "ha2",
    code: "AHA2",
    arenacode: "AHA2",
    tile: 67003,
    release: "2020-03-12",
  },
  "Historic Anthology 3": {
    collation: -1,
    scryfall: "ha3",
    code: "AHA3",
    arenacode: "AHA3",
    tile: 67003,
    release: "2020-05-21",
  },
  "Historic Anthology 4": {
    collation: -1,
    scryfall: "ha4",
    code: "AHA4",
    arenacode: "AHA4",
    tile: 67003,
    release: "2021-03-11",
  },
  "Historic Anthology 5": {
    collation: -1,
    scryfall: "ha5",
    code: "AHA5",
    arenacode: "AHA5",
    tile: 67003,
    release: "2021-05-27",
  },
  "Historic Anthology 6": {
    collation: -1,
    scryfall: "ha6",
    code: "AHA6",
    arenacode: "AHA6",
    tile: 67003,
    release: "2022-07-28",
  },
  "Explorer Anthology 1": {
    collation: -1,
    scryfall: "ea1",
    code: "EA1",
    arenacode: "EA1",
    tile: 67003,
    release: "2022-07-28",
  },
  "Alchemy Horizons: Baldur's Gate": {
    collation: 100029,
    scryfall: "hbg",
    code: "HBG",
    arenacode: "HBG",
    tile: 67003,
    release: "2022-07-07",
  },
  "Alchemy: Dominaria": {
    collation: 100029,
    scryfall: "ydmu",
    code: "Y23-DMU",
    arenacode: "Y23-DMU",
    tile: 67003,
    release: "2022-10-05",
  },
  Unfinity: {
    collation: 100029,
    scryfall: "unf",
    code: "UNF",
    arenacode: "UNF",
    tile: 67003,
    release: "2022-10-07",
  },
  "The Brothers' War": {
    collation: 100030,
    scryfall: "bro",
    code: "BRO",
    arenacode: "BRO",
    tile: 67003,
    release: "2022-11-18",
  },
  "The Brothers' War Retro Artifacts": {
    collation: 100030,
    scryfall: "brr",
    code: "BRR",
    arenacode: "BRR",
    tile: 67003,
    release: "2022-11-18",
  },
  "Explorer Anthology 2": {
    collation: -1,
    scryfall: "ea2",
    code: "EA2",
    arenacode: "EA2",
    tile: 67003,
    release: "2022-12-13",
  },
  "Alchemy: The Brothers' War": {
    collation: 100029,
    scryfall: "ybro",
    code: "Y23-BRO",
    arenacode: "Y23-BRO",
    tile: 67003,
    release: "2022-12-13",
  },
};

export const DIGITAL_SETS = [
  "Historic Anthology 1",
  "Historic Anthology 2",
  "Historic Anthology 3",
  "Historic Anthology 4",
  "Historic Anthology 5",
  "Historic Anthology 6",
  "Explorer Anthology 1",
  "Alchemy: Innistrad",
  "Alchemy: Kamigawa",
  "Alchemy: New Capenna",
  "Alchemy: Dominaria",
  "Alchemy Horizons: Baldur's Gate",
  "Alchemy: The Brothers' War",
];

export const COLORS = [
  "{?}",
  "{W}",
  "{U}",
  "{B}",
  "{R}",
  "{G}",
  "{C}",
  "",
  "{X}",
];

export const RARITY: Rarity[] = [
  "token",
  "land",
  "common",
  "uncommon",
  "rare",
  "mythic",
];

export const RANKS_SHEETS = [
  {
    setCode: "war",
    sheet: "1pk3a1YKGas-NI4ze_8hbwOtVRdYAbzCDIBS9MKjcQ7M",
    page: "Staging%20Sheet",
    source: RATINGS_MTGCSR,
  },
  {
    setCode: "rna",
    sheet: "1DfcITmtWaBHtiDYLYWHzizw-AOrB3GUQaapc_BqfeH4",
    page: "Staging%20Sheet",
    source: RATINGS_MTGCSR,
  },
  {
    setCode: "grn",
    sheet: "1FPN3hgl6x_ePq-8On7Ebr8L6WHSU2IznoWSBoGaC_RQ",
    page: "Staging%20Sheet",
    source: RATINGS_MTGCSR,
  },
  {
    setCode: "m19",
    sheet: "1aZlqE-8mGdfQ50NXUaP-9dRk3w_hp9XmcBqZ_4x3_jk",
    page: "Staging%20Sheet",
    source: RATINGS_MTGCSR,
  },
  {
    setCode: "dom",
    sheet: "1cc-AOmpQZ7vKqxDTSSvhmRBVOCy_569kT0S-j-Rpbj8",
    page: "Staging%20Sheet",
    source: RATINGS_MTGCSR,
  },
  {
    setCode: "rix",
    sheet: "1CNg-FDp-pOtQ14Qj-rIBO-yfyr5YcPA6n6ztrEe4ATg",
    page: "Staging%20Sheet",
    source: RATINGS_MTGCSR,
  },
  {
    setCode: "xln",
    sheet: "1KDtLJd6Nkrv_DDpFs84soBZcWPG1tg79TnVEh-enPz8",
    page: "Staging%20Sheet",
    source: RATINGS_MTGCSR,
  },
  {
    setCode: "m20",
    sheet: "1BAPtQv4U9KUAtVzkccJlPS8cb0s_uOcGEDORip5uaQg",
    page: "Staging%20Sheet",
    source: RATINGS_MTGCSR,
  },
  {
    setCode: "eld",
    sheet: "1B-bEUGANnGFPB4zW-vAV8zHjUZINwLU8Qq1sVlgIdpU",
    page: "Staging%20Sheet",
    source: RATINGS_MTGCSR,
  },
  {
    setCode: "thb",
    sheet: "1zxR9zQxdEH9XI7CZmxiKeTQdU2nD8bVgYJ4bLUwV53s",
    page: "Staging%20Sheet",
    source: RATINGS_MTGCSR,
  },
  {
    setCode: "iko",
    sheet: "1frdwYEvl4fUoVUwwoaz6q2hggVZHwggaitAk4ZGZDz8",
    page: "Backend",
    source: RATINGS_LOLA,
  },
  {
    setCode: "m21",
    sheet: "15HMdmkNmzTFIAITQm4LVZVBnVFB26Bn3HOJqQvMy2Mc",
    page: "Backend",
    source: RATINGS_LOLA,
  },
  {
    setCode: "znr",
    sheet: "1SnHlQd7o5Wd01iwtllOvre9svfNimWX0OoqQg-bO8-A",
    page: "Backend",
    source: RATINGS_LOLA,
  },
  {
    setCode: "klr",
    sheet: "1yNNsSS5ZTc53yKnJFoH_8UCl_bhQk77WhqDVPp2927M",
    page: "Backend",
    source: RATINGS_LOLA,
  },
  {
    setCode: "khm",
    sheet: "1kjRvUCV6pem9I4QjSgh5u9Hokt2o1LiidlqMI9XB9sI",
    page: "Backend",
    source: RATINGS_LOLA,
  },
  {
    setCode: "stx",
    sheet: "15pIP1xsfX4JfIIEr0g675mxYi68wP_i95uO0MTY5pOU",
    page: "Backend",
    source: RATINGS_LOLA,
  },
  {
    setCode: "sta",
    sheet: "15pIP1xsfX4JfIIEr0g675mxYi68wP_i95uO0MTY5pOU",
    page: "Backend",
    source: RATINGS_LOLA,
  },
  {
    setCode: "afr",
    sheet: "1wvB-UjKgbiY7YJF5QX2brdCrpqj1IpUYJ7pnSO1UQEE",
    page: "Backend",
    source: RATINGS_LOLA,
  },
  {
    setCode: "mid",
    sheet: "1E2-9WgFXKCWxUXPvK1N5oP7ezqBoeJLpAFjIimkeKPg",
    page: "Backend",
    source: RATINGS_LOLA,
  },
  {
    setCode: "vow",
    sheet: "12imsNm26eowlrRqSRWSgkzVDOM-gQjvgBfbsYN3CT8g",
    page: "Backend",
    source: RATINGS_LOLA,
  },
  {
    setCode: "neo",
    sheet: "12j6k0HbqDKUeeMCV-1ElcGCk4iBEFESZcirn9h_bv3s",
    page: "Backend",
    source: RATINGS_LOLA_B,
  },
  {
    setCode: "snc",
    sheet: "1XCSiREUdFmJaoagnVYmDIrH6of32iHkxDDVC6GoBtmE",
    page: "Backend",
    source: RATINGS_LOLA_B,
  },
];

// for some reason, scryfall does not provide this yet
// this is a manual port of the SVG
export const ARENA_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 768 597"><path d="M347.576 239.949c-2.473-55.145-8.067-76.085-11.774-76.085-3.762 0-4.946 30.544-9.89 57.535-4.946 26.929-13.654 57.468-13.654 57.468l-22.256-7.19s-6.24-38.967-8.71-85.665c-2.416-46.7-4.299-87.485-11.184-87.485-6.718-.049-8.007 38.346-10.48 88.1-2.475 49.725-11.126 77.265-11.126 77.265l-20.426-2.414s-9.892-43.13-13.603-174.876c-.86-31.181-9.834-37.438-9.834-37.438s-8.979 6.257-9.839 37.438c-3.707 131.746-13.654 174.876-13.654 174.876l-20.375 2.414s-8.704-27.54-11.177-77.265c-2.473-49.754-3.713-88.149-10.48-88.1-6.83 0-8.713 40.785-11.242 87.485-2.415 46.698-8.6 85.665-8.6 85.665l-22.256 7.19s-8.705-30.54-13.65-57.468c-4.945-26.991-6.184-57.535-9.89-57.535-3.712 0-9.3 20.94-11.774 76.085-2.473 55.075-3.063 65.842-3.063 65.842s73.053 26.398 101.49 94.715c28.491 68.276 35.694 127.56 35.909 134.142.373 10.216 8.6 11.516 8.6 11.516s7.152-1.3 8.602-11.516c.912-6.535 7.417-65.866 35.904-134.142 28.441-68.317 101.495-94.715 101.495-94.715s-.594-10.767-3.063-65.842"></path><path d="M273.537 0c-9.573 8.966-7.488 17.264 6.254 24.895 20.613 11.445 225.805 465.27 225.805 497.761 0 21.662-6.136 41.568-18.407 59.719-2.14 9.263.392 13.895 7.598 13.895H763.71c5.154 0 5.154-4.632 0-13.895-35.035-33.824-101.34-130.195-258.113-528.172-1.877-16.954 2.127-29.228 12.012-36.82.315-7.19-1.609-12.985-5.77-17.383h-238.3zM4.705 578.738c59.145-76.265 100.637-127.355 100.637-183.566 0-21.385 66.03 30.783 78.899 192.19.13 1.635-.742 4.939-5.343 4.939H4.705c-6.273-3.922-6.273-8.443 0-13.563z"></path></svg>`;

export const HA_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M8.213 5.315v.134l-1.923.909v7.899h6.259V9.101q0-1.013-.127-1.691t-.417-1.058-.589-.559-.79-.343v-.134h8.182v.134l-1.684.909v16.884c-.006.454.052.903.121 1.35q.127.678.417 1.066t.589.566.79.343v.119h-8.182v-.119l1.684-1.043v-5.424l.005-5.351-2.325 1.803H6.289v6.349q0 1.013.127 1.692t.417 1.066.589.566.79.343v.119H.03v-.119l1.684-1.043V6.361L.03 5.452v-.134h8.182zm15.094 15.787v5.583h3.138v-5.583h5.524v-3.02h-5.524v-5.583h-3.138v5.583h-5.509v3.02z"/></svg>`;

export const AKR_SVG = `<svg width="11.985" height="13.996" version="1.1" viewBox="0 0 11.985 13.996" xmlns="http://www.w3.org/2000/svg"><style/><path d="m5.9929 10.106-3.438-2.024c-0.35-0.24-0.503-0.513-0.46-0.816 0.02-0.34 0.397-0.785 1.127-1.333 0.824-0.747 1.325-1.425 1.503-2.034 0.279-0.85 0.264-2.15-0.044-3.899 0.087 1.21-0.249 2.407-1.009 3.589a5.39 5.39 0 0 1-0.844 0.981c-0.614 0.524-1.219 0.961-1.814 1.311-0.582 0.403-0.909 0.884-0.98 1.445-0.138 0.836 0.145 1.48 0.847 1.931l5.112 2.962 5.111-2.962c0.703-0.451 0.985-1.095 0.847-1.93-0.07-0.562-0.398-1.043-0.98-1.446-0.595-0.35-1.2-0.787-1.814-1.31a5.39 5.39 0 0 1-0.844-0.982c-0.76-1.182-1.096-2.379-1.01-3.589-0.307 1.75-0.322 3.05-0.042 3.899 0.177 0.609 0.678 1.287 1.502 2.034 0.73 0.548 1.106 0.992 1.127 1.333 0.043 0.303-0.11 0.575-0.46 0.816l-3.437 2.024"/><path d="m5.9929 13.105-5.128-3.103-0.541 0.63 5.669 3.364 5.668-3.365-0.54-0.63-5.128 3.104m0-9.041-2.907 3.366 2.907 1.734 2.906-1.734-2.906-3.366"/></svg>`;

export const KLR_SVG = `<svg width="15.49mm" height="18.11mm" version="1.1" viewBox="0 0 15.49 18.11" xmlns="http://www.w3.org/2000/svg"><g transform="translate(-116.7 -8.899)"><path d="m124.4 27.01c-2.887-1.833-7.693-3.115-7.743-9.376-0.01-1.843 1.119-3.866 2.857-5.048 0.5595-0.3706 2.717-1.422 2.368-2.194-0.4796-1.042-1.918 0.1803-1.019 0.6411-0.2797 0.2204-0.7293 0.1603-0.9691-0.2304-0.2698-0.4507 0.04-1.172 0.7793-1.603 0.6894-0.4107 1.678-0.4808 2.538 0.3105 1.029 0.9516 1.089 2.775 0.3497 4.237-0.4296 0.8714-1.529 1.422-1.199 2.194 0.1698 0.4107 1.049 0.4407 1.109-0.08013 0.0599-0.4007-0.5894-0.5008-0.6694-0.04007-0.2598-0.2304 0.05-1.022 0.7393-0.8414 0.4496 0.1302 0.6894 0.9215 0.2598 1.563-0.3197 0.4608-1.389 0.8013-2.178-0.1302-0.6694 0.591-1.369 2.344-0.04 3.035 0.4296 0.2204 0.7693 0.01002 0.8692-0.2304 0.2198-0.4908-0.4796-0.9516-0.8792-0.3205-0.3996-0.581 0.5095-1.533 1.479-0.7012 0.4995 0.4207 0.5095 1.422 0.0799 2.083-0.4396 0.6811-1.608 0.7613-2.628-0.1302-0.8492-0.7412-0.9591-2.043-0.5894-3.115-0.6094-0.2504-0.7992-0.9115-0.6294-1.462 0.1898-0.601 0.9391-1.102 1.459-0.5108-0.4796-0.1202-0.9291 0.3606-0.7493 0.6611 0.2298 0.3706 0.5595 0.2003 0.8092 0.01002 0.3896-0.3005 0.8892-0.8514 1.059-1.212 0.2198-0.4808-0.0999-1.523-1.439-1.042-0.9991 0.3606-2.268 2.043-2.158 3.906 0.2198 3.566 3.597 5.439 6.134 5.439 2.538 0 5.924-1.873 6.134-5.439 0.1199-1.863-1.149-3.546-2.158-3.906-1.339-0.4808-1.648 0.5609-1.429 1.042 0.1698 0.3606 0.6694 0.9115 1.059 1.212 0.2498 0.1903 0.5795 0.3606 0.7992-0.01002 0.1898-0.3005-0.2598-0.7813-0.7393-0.6611 0.5095-0.591 1.269-0.09015 1.459 0.5108 0.1698 0.5509-0.03 1.212-0.6394 1.462 0.3796 1.072 0.2698 2.374-0.5795 3.115-1.019 0.8915-2.188 0.8113-2.638 0.1302-0.4296-0.6611-0.4096-1.663 0.0799-2.083 0.9791-0.8314 1.888 0.1202 1.479 0.7012-0.3896-0.631-1.089-0.1703-0.8792 0.3205 0.0999 0.2404 0.4496 0.4507 0.8792 0.2304 1.329-0.6911 0.6294-2.444-0.04-3.035-0.7893 0.9315-1.868 0.591-2.178 0.1302-0.4396-0.6411-0.1998-1.432 0.2498-1.563 0.6894-0.1803 0.9991 0.611 0.7493 0.8414-0.0899-0.4608-0.7293-0.3606-0.6794 0.04007 0.0699 0.5209 0.9391 0.4908 1.119 0.08013 0.3297-0.7713-0.7693-1.322-1.209-2.194-0.7293-1.462-0.6794-3.285 0.3497-4.237 0.8692-0.7913 1.858-0.7212 2.538-0.3105 0.7393 0.4307 1.059 1.152 0.7793 1.603-0.2398 0.3906-0.6794 0.4507-0.9591 0.2304 0.8892-0.4608-0.5495-1.683-1.019-0.6411-0.3497 0.7713 1.798 1.823 2.358 2.194 1.748 1.182 2.877 3.205 2.857 5.048-0.04 6.26-4.845 7.542-7.743 9.376z"/></g></svg>`;

export const STX_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 29 23"><path d="M27.304.24l.002.053c.058 1.743-.32 3.162-1.138 4.257-1.015.074-1.784.487-2.307 1.238 1.312-.886 2.744-1.077 4.296-.573-.527 1.475-1.12 2.559-1.782 3.25-1.042-.348-1.855-.239-2.44.33.951-.299 1.943-.2 2.976.298-.673 1.31-1.751 2.237-3.235 2.783.905.172 1.62.662 2.147 1.47-1.146.722-2.417 1.09-3.814 1.103.678.703 1.141 1.264 1.388 1.682-1.113.18-2.165.106-3.157-.223.287.46.477.903.57 1.329-.99-.093-1.796-.379-2.418-.856.014.555-.085 1.053-.298 1.494a4.761 4.761 0 01-1.751-1.848l-.2.783.038.034c1.242 1.128 2.095 2.38 2.558 3.754-.695.128-1.346.085-1.954-.13.216.695.202 1.317-.041 1.868-.688-.284-1.203-.657-1.544-1.118.05.249.068.518.054.807-.021.433-.538.893-1.097.893-.558 0-1.075-.46-1.096-.893a3.312 3.312 0 01.053-.807c-.34.461-.855.834-1.543 1.118-.243-.55-.257-1.173-.04-1.868-.61.215-1.26.258-1.955.13.468-1.389 1.333-2.651 2.596-3.788l-.2-.783a4.761 4.761 0 01-1.75 1.848c-.214-.44-.313-.939-.3-1.494-.62.477-1.427.763-2.417.856.093-.426.283-.87.57-1.329-.992.33-2.044.404-3.157.223.247-.418.71-.979 1.388-1.682-1.397-.013-2.668-.38-3.814-1.102.527-.809 1.242-1.3 2.147-1.471-1.484-.546-2.562-1.474-3.236-2.783 1.033-.497 2.026-.597 2.977-.298-.585-.569-1.399-.678-2.44-.33C1.28 7.775.684 6.69.157 5.216c1.553-.504 2.985-.313 4.297.573-.523-.75-1.292-1.164-2.308-1.238C1.321 3.444.943 2.007 1.011.24l1.492.305c2.01.725 5.742 4.675 6.398 5.308.437.422.834.618 1.191.587l-.516.688.219 2.907c.635 1.656 1.864 2.473 2.274 2.816a7.684 7.684 0 01-1.022-1.77l.642-1.422c.163-.346.169-.68.016-1a5.286 5.286 0 012.452-1.15l.028.005c.91.175 1.719.557 2.424 1.145-.152.32-.146.654.017 1l.642 1.422-.011.028a7.709 7.709 0 01-1.012 1.742c.41-.343 1.64-1.16 2.275-2.816l.219-2.907-.516-.688.01.001c.354.026.748-.17 1.181-.588.656-.633 4.388-4.583 6.398-5.308L27.304.24zm-13.12 10.427h-.027l-.441.912h-.333l.774 2.248h.027l.774-2.248h-.333l-.441-.912zm-6.52-3.595c-.112.03-.292.21-.537.538-.07.697-.073 1.465-.005 2.305-.152.014-.398-.03-.738-.134.415.236.716.497.902.785.665 1.083 1.138 1.796 1.42 2.14.282.343.626.48 1.032.414-.959-1-1.65-2.034-2.073-3.105-.115-.864-.115-1.845 0-2.943zm13.012 0c.115 1.098.115 2.08 0 2.943-.423 1.07-1.114 2.106-2.072 3.105.405.067.75-.071 1.031-.415.282-.343.756-1.056 1.42-2.14.187-.287.487-.548.902-.784-.34.103-.586.148-.737.134.067-.84.065-1.608-.005-2.305-.246-.328-.426-.507-.539-.538z" fill="#000" fill-rule="nonzero"/></svg>`;

export const STA_SVG = `<svg viewBox="0 0 28 22" xmlns="http://www.w3.org/2000/svg"><path d="M3.102.043c-.315.564-.643.932-.985 1.104-.342.172-.446.378-.312.616-1.11.164-1.702.618-1.773 1.362-.108 1.115 1.222 1.29 1.537 2.244l1.252 11.75c.062.598-.057 1.066-.358 1.401-.45.504-.296 1.715.79 1.916 1.084.202 1.706-.127 2.936 1.15.452-.831 1.09-1.35 1.915-1.558 1.218-.511 1.169-1.611.942-2.293-.334-.853-.939-1.067-1.57-1.01-.29.048-1.04.14-2.008.83 1.02-.881 2.625-1.44 4.815-1.675 2.094-.227 4.502-.292 4.502-.292.235-.598.413-1.651.532-3.16.12 1.472.025 3.135-.287 4.987 1.692.573 3.825.667 6.398.282.403-.074.895-.186 1.477-.337-1.128.307-1.764.737-1.908 1.29-.172.72-.09 1.479.775 1.865.908.32 1.811 0 1.811 0-.011.396.254.648.795.758.28.07.483.289.607.653.042-.449.19-.716.442-.802.345-.098.65-.555.463-.871 1.237.106 1.905-.4 2.003-1.52.03-.837-.427-1.368-1.371-1.594L24.854 5.077c-.095-.695.09-1.245.557-1.65.833-.934.184-2.213-1.236-2.253-.947-.026-1.748-.404-2.403-1.131a3.386 3.386 0 01-1.635 1.519c-1.09.495-1.737.938-1.507 2.13.321 1.069 2.1.833 2.616.505-.544.382-2.397.863-5.56 1.446a7.995 7.995 0 01-.273 1.79c.026-1.739-.19-2.974-.646-3.706-.684-1.097-2.142-1.346-3.71-1.313-1.706.098-3.768.19-6.465 2.182.28-.224.748-.541 1.407-.953 1.006-.566 1.21-1.246.765-1.88-.424-.612-1.357-.726-2.025-.42.092-.31-.084-.513-.527-.607a1.904 1.904 0 01-1.11-.693z" fill="#000" fill-rule="nonzero"/></svg>`;

export const VOW_SVG = `<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 156 113"><path d="M122.612 0c15.067 10.473 18.4 27.403 19.59 31.947.793 3.03 2.97 5.612 6.534 7.747L156 43.52l-13.129 9.282c-2.414 1.302-3.25 3.19-2.506 5.665.84 2.724.596 6.976-.733 12.755-1.33 5.779-5.327 10.986-11.992 15.621 0 0 2.015-8.84.47-17.034-1.029-5.462-4.563-7.15-10.604-5.066l-23.178 9.464c-2.257 3.98-4.001 7.036-5.231 9.168-1.23 2.131-1.23 3.874 0 5.229l4.602 5.472 9.91 1.09c4.083 0 6.398 1.715 6.945 5.146-12.403-1.36-23.22 2.87-32.451 12.689h-.206c-9.231-9.819-20.048-14.048-32.45-12.689.546-3.43 2.86-5.147 6.945-5.147l9.909-1.09 4.602-5.471c1.23-1.355 1.23-3.098 0-5.23-1.23-2.13-2.974-5.187-5.231-9.167l-23.178-9.464c-6.04-2.085-9.575-.396-10.605 5.066-1.544 8.194.47 17.034.47 17.034C21.696 82.207 17.699 77 16.37 71.221c-1.33-5.78-1.574-10.03-.734-12.755.743-2.475-.092-4.363-2.506-5.665L0 43.52l7.264-3.825c3.563-2.135 5.741-4.717 6.534-7.747 1.19-4.544 4.523-21.474 19.59-31.947-4.545 12.706-2.995 23.602 4.649 32.688 1.032-3.049 2.592-5.232 4.679-6.55 2.328 7.508 7.049 11.986 14.162 13.434l4.425-5.068-2.672-16.04 9.083-12.101c-2.298 8.393-1.816 15.312 1.445 20.759 2.257-1.823 5.204-2.718 8.841-2.684 3.637-.034 6.584.86 8.84 2.684 3.262-5.447 3.744-12.366 1.446-20.76l9.083 12.102-2.672 16.04 4.425 5.068c7.113-1.448 11.834-5.926 14.162-13.434 2.087 1.318 3.647 3.501 4.68 6.55 7.643-9.086 9.193-19.982 4.648-32.688Zm-54.24 43.44c-3.054.149-3.232 5.763-1.868 9.518 1.364 3.754 2.973 8.027 8.264 16.073-.104-.636-4.689-13.434-1.598-19.815-1.163-3.95-2.762-5.875-4.798-5.776Zm19.256 0c-2.036-.1-3.635 1.826-4.798 5.776 3.09 6.38-1.494 19.179-1.598 19.815 5.29-8.046 6.9-12.319 8.264-16.073 1.364-3.755 1.186-9.37-1.868-9.518Z" fill="#000" fill-rule="nonzero"></path></svg>`;

export const HBG_SVG = `<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 49"><g fill="#000" fill-rule="nonzero"><path d="M23.854 4.421c10.815 0 19.583 8.954 19.583 20s-8.768 20-19.583 20c-10.816 0-19.584-8.954-19.584-20s8.768-20 19.584-20ZM23.5 5.5 22 12l-7 5-6-1.5 4 4.5v9l-4.5 4.5 6-1.5 7.5 4.5 1.5 6 2-6 7-4.5 6.5 2-4-5v-9l4-5-6 2-7.5-5-2-6.5Zm0 8.5 8.5 5.5V29l-8.5 6-8-5.5v-10l8-5.5Z"></path><path d="M23.854.453C10.868.453.354 11.191.354 24.421s10.514 23.968 23.5 23.968 23.5-10.738 23.5-23.968S36.84.453 23.854.453Zm0 3c11.314 0 20.5 9.38 20.5 20.968 0 11.587-9.186 20.968-20.5 20.968-11.315 0-20.5-9.38-20.5-20.968 0-11.587 9.185-20.968 20.5-20.968Z"></path></g></svg>`;
