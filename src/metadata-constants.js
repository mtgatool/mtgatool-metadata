const path = require("path");
const packageJson = require('../package.json');

exports.APPDATA = path.resolve(__dirname, "..");

exports.EXTERNAL = "external";
exports.OUTPUT = "dist";
exports.VERSION = packageJson.version.split(".")[0];

// What languages to actually compile
exports.LANGUAGES = [
  "EN",
  "ES",
  "BR",
  "DE",
  "FR",
  "IT",
  "JP",
  "RU",
  "ko-KR",
  "zh-CN"
];

exports.SCRYFALL_LANGUAGE = {
  DE: "DE",
  EN: "EN",
  ES: "ES",
  FR: "FR",
  IT: "IT",
  RU: "RU",
  BR: "PT",
  JP: "JA",
  "zh-CN": "ZHS",
  "ko-KR": "KO"
};

exports.LANGKEYS = {
  "en-US": "EN",
  "fr-FR": "FR",
  "it-IT": "IT",
  "de-DE": "DE",
  "es-ES": "ES",
  "ja-JP": "JA",
  "pt-BR": "PT",
  "ru-RU": "RU",
  "ko-KR": "KO",
  "zh-CN": "ZHS"
};

exports.EVENT_TO_NAME = {
  NPE: "New Player Experience",
  DirectGame: "Direct Game",
  Constructed_Event: "Constructed",
  Constructed_Event_2020: "Standard Event",
  Ladder: "Standard Ranked",
  Traditional_Cons_Event: "Traditional Constructed",
  Traditional_Cons_Event_2020: "Traditional Standard Event",
  Constructed_BestOf3: "Traditional Standard Play",
  Traditional_Ladder: "Traditional Standard Ranked",
  Traditional_Historic_Ladder: "Traditional Historic Ranked",
  Future_Play_20190909: "Future Play",
  Future_Ranked_20190909: "Future Ranked",
  Historic_Play: "Historic Play",

  Brawlers_Guildhall_20200319: "Brawlers Guildhall 03/20",

  CompDraft_RNA_20190117: "Traditional Draft RNA",
  CompDraft_WAR_20190425: "Traditional Draft WAR",
  CompDraft_M20_20190708: "Traditional Draft M20",
  CompDraft_ELD_20190930: "Traditional Draft ELD",
  CompDraft_THB_20200116: "Traditional Draft THB",

  Sealed_M20_20190630: "Sealed M20",
  Sealed_Ravnica_20190816: "Sealed Ravnica",
  Sealed_WAR_20190909: "Sealed WAR",
  Sealed_ELD_20190923: "Sealed ELD",
  Sealed_THB_20200113: "Sealed Theros",

  QuickDraft_RNA_20190426: "Ranked Draft RNA 04/19",
  QuickDraft_RNA_20190621: "Ranked Draft RNA 06/19",
  QuickDraft_WAR_20190510: "Ranked Draft WAR 05/19",
  QuickDraft_DOM_20190524: "Ranked Draft DOM 05/19",
  QuickDraft_WAR_20190607: "Ranked Draft WAR 06/19",
  QuickDraft_WAR_20190705: "Ranked Draft WAR 07/19",
  QuickDraft_M20_20190719: "Ranked Draft M20 07/19",
  QuickDraft_RNA_20190802: "Ranked Draft RNA 08/19",
  QuickDraft_WAR_20190816: "Ranked Draft WAR 08/19",
  QuickDraft_GRN_20190829: "Ranked Draft GRN 08/19",
  QuickDraft_RNA_20190913: "Ranked Draft RNA 09/19",
  QuickDraft_ELD_20191011: "Ranked Draft ELD 10/19",
  QuickDraft_WAR_20191025: "Ranked Draft WAR 10/19",
  QuickDraft_GRN_20191108: "Ranked Draft GRN 11/19",
  QuickDraft_M20_20191206: "Ranked Draft M20 12/19",
  QuickDraft_WAR_20191220: "Ranked Draft WAR 12/19",
  QuickDraft_DOM_20200103: "Ranked Draft DOM 01/20",
  QuickDraft_THB_20200131: "Ranked Draft THB 01/20",
  QuickDraft_GRN_20200214: "Ranked Draft GRN 02/20",
  QuickDraft_THB_20200228: "Ranked Draft THB 03/20",
  QuickDraft_RNA_20200313: "Ranked Draft RNA 03/20",

  Cascade_Constructed_20190516: "Cascade Constructed",
  Omniscience_Draft_20190830: "Omniscience Draft M20",
  Omniscience_Draft_20191107: "Omniscience Draft ELD",

  Esports_MIQ_20200314: "Mythic Qualifier Weekend 03/20",
  Esports_Qualifier_20190525: "Mythic Qualifier Weekend 05/19",
  Esports_Qualifier_20190817: "Mythic Qualifier Weekend 08/19",
  CompCons_Metagame_Challenge_20190712: "Metagame Challenge 07/19",
  PlayAnyDeck_20190926: "Play Any Deck - Standard",
  WinEveryCard_20191005: "Win Every Card - Standard",
  CompCons_Metagame_Challenge_20191004: "Metagame Challenge 10/19",
  ExtraLife_2019_20191101: "Extra Life",
  FestivalGods_Artisan_20200222: "Festival: Fires of Purphoros",
  FestivalGods_GiantMonsters_20200229: "Festival: Nyleas Call of the Wild",
  FestivalGods_HistoricBrawl_20200313: "Festival: Erebos Memoir of Death",
  FestivalGods_ImmortalSun_20200307: "Festival: Heliods Glory",
  FestivalGods_ThassaDeck_20200321: "Festival: Thassas Briny Bounty",
  Workshop_Brawl_20200224: "Workshop: Power and Glory",
  Workshop_Draft_THB_20200302: "Workshop: Heros of Theros",
  Workshop_OffMeta_20200309: "Workshop: Uncharted Paths",
  Workshop_Historic_20200316: "Workshop: Heirlooms of History",
  FestivalFae_Std_Artisan_20191103: "Festival: Standard Artisan",
  FestivalFae_OkosMadness_20191110: "Festival: Okos Madness",
  FestivalFae_Cascade_20191117: "Festival: Standard Cascade",
  Historic_Launch_20191121: "Historic Launch",
  Historic_Pauper_20191128: "Historic Pauper",
  Monthly_Brawl_20191212: "Monthly Brawl",
  Historic_Artisan_20191220: "Historic Artisan",
  Historic_Event: "Historic Event",
  Traditional_Historic_Event: "Traditional Historic Event",

  Historic_Challenge_20200111: "Historic Challenge",
  Momir_PW_20200110: "Momir PW",
  Brawl_Launch_20191024: "Brawl Launch",
  Precon_Brawl_ELD: "Precon Brawl",
  Lore_WAR1_Momir: "Ravnica at War I - Momir",
  Lore_WAR2_Pauper: "Ravnica at War II - Pauper",
  Lore_WAR3_Singleton: "Ravnica at War III - Singleton",
  Lore_WAR4_OverflowingCounters: "Ravnica at War IV - Counters",
  Lore_WAR5_Ravnica: "Ravnica at war V - Ravnica",
  Planecation1_GuildBattle: "Planecation - Guild Battle",
  Planecation2_Treasure: "Planecation - Treasure",
  Planecation3_Singleton: "Planecation - Singleton",
  Planecation4_Shakeup: "Planecation - Shakeup",
  Planecation5_Landfall: "Planecation - Landfall",
  Giant_Monsters_20190719: "Giant Monsters",
  FestivalGods_GiantMonsters_20200229: "Festival - Giant Monsters"
};

exports.EVENT_TO_FORMAT = {
  Play: "Standard",
  Historic_Play: "Historic",
  DirectGame: "Direct Game",
  Constructed_Event: "Standard",
  Constructed_Event_2020: "Standard",
  Ladder: "Standard",
  Traditional_Cons_Event: "Traditional Standard",
  Traditional_Cons_Event_2020: "Traditional Standard",
  Constructed_BestOf3: "Traditional Standard",
  Traditional_Ladder: "Traditional Standard",
  Traditional_Historic_Ladder: "Traditional Historic",
  Future_Play_20190909: "Future",
  Future_Ranked_20190909: "Traditional Future",

  Brawlers_Guildhall_20200319: "Brawl",

  CompDraft_RNA_20190117: "Draft RNA",
  CompDraft_WAR_20190425: "Draft WAR",
  CompDraft_M20_20190708: "Draft M20",
  CompDraft_ELD_20190930: "Draft ELD",
  CompDraft_THB_20200116: "Draft THB",

  Sealed_M20_20190630: "Sealed M20",
  Sealed_Ravnica_20190816: "Sealed RAV",
  Sealed_WAR_20190909: "Sealed WAR",
  Sealed_ELD_20190923: "Sealed ELD",
  Sealed_THB_20200113: "Sealed THB",

  QuickDraft_RNA_20190426: "Draft RNA",
  QuickDraft_RNA_20190621: "Draft RNA",
  QuickDraft_WAR_20190510: "Draft WAR",
  QuickDraft_DOM_20190524: "Draft DOM",
  QuickDraft_WAR_20190607: "Draft WAR",
  QuickDraft_WAR_20190705: "Draft WAR",
  QuickDraft_M20_20190719: "Draft M20",
  QuickDraft_RNA_20190802: "Draft RNA",
  QuickDraft_WAR_20190816: "Draft WAR",
  QuickDraft_GRN_20190829: "Draft GRN",
  QuickDraft_RNA_20190913: "Draft RNA",
  QuickDraft_ELD_20191011: "Draft ELD",
  QuickDraft_WAR_20191025: "Draft WAR",
  QuickDraft_GRN_20191108: "Draft GRN",
  QuickDraft_M20_20191206: "Draft M20",
  QuickDraft_WAR_20191220: "Draft WAR",
  QuickDraft_DOM_20200103: "Draft DOM",
  QuickDraft_THB_20200131: "Draft THB",
  QuickDraft_GRN_20200214: "Draft GRN",
  QuickDraft_THB_20200228: "Draft THB",
  QuickDraft_RNA_20200313: "Draft RNA",

  Cascade_Constructed_20190516: "Cascade Constructed",
  Omniscience_Draft_20190830: "Draft M20",
  Omniscience_Draft_20191107: "Draft ELD",

  Historic_Challenge_20200111: "Historic",
  Momir_PW_20200110: "Momir",
  Esports_MIQ_20200314: "Traditional Standard",
  Esports_Qualifier_20190525: "Traditional Standard",
  Esports_Qualifier_20190817: "Traditional Standard",
  CompCons_Metagame_Challenge_20190712: "Traditional Standard",
  PlayAnyDeck_20190926: "Standard",
  WinEveryCard_20191005: "Standard",
  CompCons_Metagame_Challenge_20191004: "Traditional Standard",
  ExtraLife_2019_20191101: "Pauper",
  FestivalGods_Artisan_20200222: "Standard Artisan",
  FestivalGods_GiantMonsters_20200229: "Giant Monsters",
  FestivalGods_ImmortalSun_20200307: "Immortal Sun",
  FestivalGods_HistoricBrawl_20200313: "Historic Brawl",
  FestivalGods_ThassaDeck_20200321: "Preconstructed Singleton",
  Workshop_Brawl_20200224: "Brawl",
  Workshop_Draft_THB_20200302: "Preconstructed Draft THB",
  Workshop_OffMeta_20200309: "Preconstructed Standard",
  Workshop_Historic_20200316: "Historic",
  FestivalFae_Std_Artisan_20191103: "Standard Artisan",
  FestivalFae_OkosMadness_20191110: "Momir",
  FestivalFae_Cascade_20191117: "Cascade",
  Historic_Launch_20191121: "Historic",
  Historic_Pauper_20191128: "Pauper",
  Monthly_Brawl_20191212: "Brawl",
  Historic_Artisan_20191220: "Artisan",
  Historic_Event: "Historic",
  Traditional_Historic_Event: "Historic",

  Brawl_Launch_20191024: "Brawl",
  Precon_Brawl_ELD: "Brawl",
  Lore_WAR1_Momir: "Momir",
  Lore_WAR2_Pauper: "Pauper",
  Lore_WAR3_Singleton: "Singleton",
  Lore_WAR4_OverflowingCounters: "Counters",
  Lore_WAR5_Ravnica: "Ravnica Constructed",
  Planecation1_GuildBattle: "Precon",
  Planecation2_Treasure: "Treasure",
  Planecation3_Singleton: "Singleton",
  Planecation4_Shakeup: "Shakeup",
  Planecation5_Landfall: "Landfall",
  Giant_Monsters_20190719: "Giant Monsters",
};

// These are the current events in the ranked ladder
exports.LIMITED_RANKED_EVENTS = [
  "QuickDraft_THB_20200131",
  "QuickDraft_THB_20200228",
  "QuickDraft_GRN_20200214",
  "QuickDraft_RNA_20200313"
];

exports.STANDARD_RANKED_EVENTS = ["Ladder", "Traditional_Ladder", "Traditional_Historic_Ladder"];

exports.SINGLE_MATCH_EVENTS = [
  "Play",
  "Historic_Play",
  "AIBotMatch",
  "NPE",
  "DirectGame",
  "Ladder",
  "Constructed_BestOf3",
  "Traditional_Ladder"
];

/*
  "Kaladesh": {
    collation: 62242,
    scryfall: "kld",
    code: "KLD",
    arenacode: "KLD",
    tile: 63859
  },
  "Aether Revolt": {
    collation: 62979,
    scryfall: "aer",
    code: "AER",
    arenacode: "AER",
    tile: 64647
  },
  "Welcome Deck 2017": {
    collation: false,
    scryfall: "w17",
    code: "W17",
    arenacode: "W17",
    tile: 67106
  },
  "Amonkhet": {
    collation: 100003,
    scryfall: "akh",
    code: "AKH",
    arenacode: "AKH",
    tile: 64827
  },
  "Hour of Devastation": {
    collation: 100004,
    scryfall: "hou",
    code: "HOU",
    arenacode: "HOU",
    tile: 65759
  },
  "Oath of the Gatewatch": {
    collation: false,
    scryfall: "ogw",
    code: "OGW",
    arenacode: "OGW",
    tile: 67106
  },
*/
exports.SETS_DATA = {
  Ixalan: {
    collation: 100005,
    scryfall: "xln",
    code: "XLN",
    arenacode: "XLN",
    tile: 66433,
    release: "2017-09-29"
  },
  "Rivals of Ixalan": {
    collation: 100006,
    scryfall: "rix",
    code: "RIX",
    arenacode: "RIX",
    tile: 66937,
    release: "2018-01-19"
  },
  Dominaria: {
    collation: 100007,
    scryfall: "dom",
    code: "DOM",
    arenacode: "DAR",
    tile: 67106,
    release: "2018-04-27"
  },
  "Core Set 2019": {
    collation: 100008,
    scryfall: "m19",
    code: "M19",
    arenacode: "M19",
    tile: 68116,
    release: "2018-07-13"
  },
  "Arena New Player Experience": {
    collation: false,
    scryfall: "ana",
    code: "ANA",
    arenacode: "ANA",
    tile: 67106,
    release: "2018-07-14"
  },
  "Guilds of Ravnica": {
    collation: 100009,
    scryfall: "grn",
    code: "GRN",
    arenacode: "GRN",
    tile: 68674,
    release: "2018-10-05"
  },
  "M19 Gift Pack": {
    collation: false,
    scryfall: "g18",
    code: "G18",
    arenacode: "G18",
    tile: 68116,
    release: "2018-07-13"
  },
  "Ravnica Allegiance": {
    collation: 100010,
    scryfall: "rna",
    code: "RNA",
    arenacode: "RNA",
    tile: 69294,
    release: "2019-01-25"
  },
  "War of the Spark": {
    collation: 100013,
    scryfall: "war",
    code: "WAR",
    arenacode: "WAR",
    tile: 69656,
    release: "2019-05-03"
  },
  "Core Set 2020": {
    collation: 100014,
    scryfall: "m20",
    code: "M20",
    arenacode: "M20",
    tile: 69912,
    release: "2019-07-12"
  },
  "Throne of Eldraine": {
    collation: 100015,
    scryfall: "eld",
    code: "ELD",
    arenacode: "ELD",
    tile: 70338,
    release: "2019-10-04"
  },
  "Theros: Beyond Death": {
    collation: 100016,
    scryfall: "thb",
    code: "THB",
    arenacode: "THB",
    tile: 64827,
    release: "2020-01-24"
  },
  // Other sets below
  "Mythic Edition": {
    collation: -1,
    scryfall: "med",
    code: "MED",
    arenacode: "MED",
    tile: 68674,
    release: "2018-10-06"
  },
  Mirage: {
    collation: -1,
    scryfall: "mir",
    code: "MI",
    arenacode: "MI",
    tile: 67003,
    release: "1996-10-08"
  },
  "Battle for Zendikar": {
    collation: -1,
    scryfall: "bfz",
    code: "BFZ",
    arenacode: "BFZ",
    tile: 67003,
    release: "2015-10-02"
  },
  "Return to Ravnica": {
    collation: -1,
    scryfall: "rtr",
    code: "RTR",
    arenacode: "RTR",
    tile: 67003,
    release: "2012-10-05"
  },
  "Rise of Eldrazi": {
    collation: -1,
    scryfall: "roe",
    code: "ROE",
    arenacode: "ROE",
    tile: 67003,
    release: "2010-04-23"
  },
  Amonkhet: {
    collation: -1,
    scryfall: "akh",
    code: "AKH",
    arenacode: "AKH",
    tile: 64827,
    release: "2017-04-28"
  },
  Planeshift: {
    collation: -1,
    scryfall: "pls",
    code: "PS",
    arenacode: "PS",
    tile: 64827,
    release: "2001-02-05"
  },
  Scourge: {
    collation: -1,
    scryfall: "scg",
    code: "SCG",
    arenacode: "SCG",
    tile: 64827,
    release: "2003-05-26"
  },
  Darksteel: {
    collation: -1,
    scryfall: "dst",
    code: "DST",
    arenacode: "DST",
    tile: 64827,
    release: "2004-02-06"
  },
  "Fifth Dawn": {
    collation: -1,
    scryfall: "5dn",
    code: "5DN",
    arenacode: "5DN",
    tile: 64827,
    release: "2004-06-04"
  },
  "Ninth Edition": {
    collation: -1,
    scryfall: "9ed",
    code: "9ED",
    arenacode: "9ED",
    tile: 64827,
    release: "2005-07-29"
  },
  "Ravnica: City of Guilds": {
    collation: -1,
    scryfall: "rav",
    code: "RAV",
    arenacode: "RAV",
    tile: 64827,
    release: "2005-10-07 "
  },
  Dissension: {
    collation: -1,
    scryfall: "dis",
    code: "DIS",
    arenacode: "DIS",
    tile: 64827,
    release: "2006-05-05 "
  },
  "Tenth Edition": {
    collation: -1,
    scryfall: "10e",
    code: "10E",
    arenacode: "10E",
    tile: 64827,
    release: "2007-07-13"
  },
  "Masters Edition II": {
    collation: -1,
    scryfall: "me2",
    code: "ME2",
    arenacode: "ME2",
    tile: 64827,
    release: "2008-09-22"
  },
  "Magic 2011": {
    collation: -1,
    scryfall: "m11",
    code: "M11",
    arenacode: "M11",
    tile: 64827,
    release: "2010-07-16"
  },
  "Masters Edition IV": {
    collation: -1,
    scryfall: "me4",
    code: "ME4",
    arenacode: "ME4",
    tile: 64827,
    release: "2011-01-10"
  },
  "Commander 2011": {
    collation: -1,
    scryfall: "cmd",
    code: "CMD",
    arenacode: "CMD",
    tile: 64827,
    release: "2011-06-17"
  },
  "Avacyn Restored": {
    collation: -1,
    scryfall: "avr",
    code: "AVR",
    arenacode: "AVR",
    tile: 64827,
    release: "2012-05-04"
  },
  "Champions of Kamigawa": {
    collation: -1,
    scryfall: "chk",
    code: "CHK",
    arenacode: "CHK",
    tile: 64827,
    release: "2004-10-01"
  },
  "New Phyrexia": {
    collation: -1,
    scryfall: "nph",
    code: "NPH",
    arenacode: "NPH",
    tile: 64827,
    release: "2011-05-13"
  },
  Zendikar: {
    collation: -1,
    scryfall: "zen",
    code: "ZEN",
    arenacode: "ZEN",
    tile: 64827,
    release: "2009-10-02"
  },
  Gatecrash: {
    collation: -1,
    scryfall: "gtc",
    code: "GTC",
    arenacode: "GTC",
    tile: 64827,
    release: "2013-02-01"
  },
  "Commander 2013": {
    collation: -1,
    scryfall: "c13",
    code: "C13",
    arenacode: "C13",
    tile: 64827,
    release: "2013-11-01"
  },
  "Eldritch Moon": {
    collation: -1,
    scryfall: "emn",
    code: "EMN",
    arenacode: "EMN",
    tile: 64827,
    release: "2016-07-22"
  },
  "Dragons of Tarkir": {
    collation: -1,
    scryfall: "dtk",
    code: "DTK",
    arenacode: "DTK",
    tile: 64827,
    release: "2015-03-27"
  },
  "Mirage": {
    collation: -1,
    scryfall: "mir",
    code: "MIR",
    arenacode: "MIR",
    tile: 64827,
    release: "1996-10-08"
  },  
  "Weatherlight": {
    collation: -1,
    scryfall: "wth",
    code: "WTH",
    arenacode: "WTH",
    tile: 64827,
    release: "1997-06-09"
  },  
  "Invasion": {
    collation: -1,
    scryfall: "inv",
    code: "INV",
    arenacode: "INV",
    tile: 64827,
    release: "2000-10-02"
  },  
  "Planeshift": {
    collation: -1,
    scryfall: "pls",
    code: "PLS",
    arenacode: "PLS",
    tile: 64827,
    release: "2001-02-05"
  },  
  "Eighth Edition": {
    collation: -1,
    scryfall: "8ed",
    code: "8ED",
    arenacode: "8ED",
    tile: 64827,
    release: "2003-07-28"
  },  
  "Saviors of Kamigawa": {
    collation: -1,
    scryfall: "sok",
    code: "SOK",
    arenacode: "SOK",
    tile: 64827,
    release: "2005-06-03"
  },  
  "Lorwyn": {
    collation: -1,
    scryfall: "lrw",
    code: "LRW",
    arenacode: "LRW",
    tile: 64827,
    release: "2007-10-12 "
  },  
  "Morningtide": {
    collation: -1,
    scryfall: "mor",
    code: "MOR",
    arenacode: "MOR",
    tile: 64827,
    release: "2008-02-01"
  },  
  "Magic 2010": {
    collation: -1,
    scryfall: "m10",
    code: "M10",
    arenacode: "M10",
    tile: 64827,
    release: "2009-07-17"
  },  
  "Worldwake": {
    collation: -1,
    scryfall: "wwk",
    code: "WWK",
    arenacode: "WWK",
    tile: 64827,
    release: "2009-07-17"
  },  
  "Magic Origins": {
    collation: -1,
    scryfall: "ori",
    code: "ORI",
    arenacode: "ORI",
    tile: 64827,
    release: "2015-07-17"
  },  
  "Modern Horizons": {
    collation: -1,
    scryfall: "mh1",
    code: "MH1",
    arenacode: "MH1",
    tile: 64827,
    release: "2019-06-14"
  },
  "Shadows over Innistrad": {
    collation: -1,
    scryfall: "soi",
    code: "SOI",
    arenacode: "SOI",
    tile: 64827,
    release: "2016-04-08"
  },
  "Vintage Masters": {
    collation: -1,
    scryfall: "vma",
    code: "VMA",
    arenacode: "VMA",
    tile: 64827,
    release: "2014-06-16"
  },
  "Modern Masters": {
    collation: -1,
    scryfall: "mma",
    code: "MMA",
    arenacode: "MMA",
    tile: 64827,
    release: "2013-06-07"
  },
  "Journey into Nyx": {
    collation: -1,
    scryfall: "jou",
    code: "JOU",
    arenacode: "JOU",
    tile: 64827,
    release: "2014-05-02"
  },
  "Theros": {
    collation: -1,
    scryfall: "ths",
    code: "THS",
    arenacode: "THS",
    tile: 64827,
    release: "2013-09-27"
  },
  "Magic 2014": {
    collation: -1,
    scryfall: "m14",
    code: "M14",
    arenacode: "M14",
    tile: 64827,
    release: "2013-07-19"
  },
  "Duel Decks: Elspeth vs. Tezzeret": {
    collation: -1,
    scryfall: "ddf",
    code: "DDF",
    arenacode: "DDF",
    tile: 64827,
    release: "2010-09-03"
  },
  "Shadowmoor": {
    collation: -1,
    scryfall: "shm",
    code: "SHM",
    arenacode: "SHM",
    tile: 64827,
    release: "2008-05-02"
  },
  "Mirrodin": {
    collation: -1,
    scryfall: "mrd",
    code: "MRD",
    arenacode: "MRD",
    tile: 64827,
    release: "2003-10-02"
  },
  "Odyssey": {
    collation: -1,
    scryfall: "ody",
    code: "ODY",
    arenacode: "ODY",
    tile: 64827,
    release: "2001-10-01"
  },
  "Magic 2013": {
    collation: -1,
    scryfall: "m13",
    code: "M13",
    arenacode: "M13",
    tile: 67003,
    release: "2012-07-13"
  },
  "Mercadian Masques": {
    collation: -1,
    scryfall: "mmq",
    code: "MMQ",
    arenacode: "MMQ",
    tile: 67003,
    release: "1999-10-04"
  },
  "Onslaught": {
    collation: -1,
    scryfall: "ons",
    code: "ONS",
    arenacode: "ONS",
    tile: 67003,
    release: "2002-10-07"
  },
  "Shards of Alara": {
    collation: -1,
    scryfall: "ala",
    code: "ALA",
    arenacode: "ALA",
    tile: 67003,
    release: "2008-10-03"
  },
  "Scars of Mirrodin": {
    collation: -1,
    scryfall: "som",
    code: "SOM",
    arenacode: "SOM",
    tile: 67003,
    release: "2010-10-01"
  },
  "Innistrad": {
    collation: -1,
    scryfall: "isd",
    code: "ISD",
    arenacode: "ISD",
    tile: 67003,
    release: "2011-09-30"
  },
  "Conflux": {
    collation: -1,
    scryfall: "con",
    code: "CONF",
    arenacode: "CONF",
    tile: 67003,
    release: "2009-02-06"
  },
  "Dark Ascension": {
    collation: -1,
    scryfall: "dka",
    code: "DKA",
    arenacode: "DKA",
    tile: 67003,
    release: "2012-02-03"
  },
  "Magic 2015": {
    collation: -1,
    scryfall: "m15",
    code: "M15",
    arenacode: "M15",
    tile: 67003,
    release: "2014-07-18"
  },
  "Unsanctioned": {
    collation: -1,
    scryfall: "und",
    code: "UND",
    arenacode: "UND",
    tile: 67003,
    release: "2020-02-29"
  },
  "Alara Reborn": {
    collation: -1,
    scryfall: "arb",
    code: "ARB",
    arenacode: "ARB",
    tile: 67003,
    release: "2009-04-30"
  },
  "": {
    collation: -1,
    scryfall: "default",
    code: "",
    arenacode: "",
    tile: 67003,
    release: "2000-00-00"
  }
};

exports.COLORS = ["{?}", "{W}", "{U}", "{B}", "{R}", "{G}", "{C}", "", "{X}"];

exports.RARITY = ["token", "land", "common", "uncommon", "rare", "mythic"];

exports.SET_NAMES = {
  W17: "Welcome Deck 2017",
  KLD: "Kaladesh",
  AER: "Aether Revolt",
  AKH: "Amonkhet",
  HOU: "Hour of Devastation",
  XLN: "Ixalan",
  RIX: "Rivals of Ixalan",
  DAR: "Dominaria",
  OGW: "Oath of the Gatewatch",
  M19: "Core Set 2019",
  ANA: "Arena New Player Experience",
  GRN: "Guilds of Ravnica",
  G18: "M19 Gift Pack",
  RNA: "Ravnica Allegiance",
  WAR: "War of the Spark",
  M20: "Core Set 2020",
  MI: "Mirage",
  ROE: "Rise of Eldrazi",
  RTR: "Return to Ravnica",
  BFZ: "Battle for Zendikar",
  ELD: "Throne of Eldraine",
  PS: "Planeshift",
  SCG: "Scourge",
  DST: "Darksteel",
  "5DN": "Fifth Dawn",
  "9ED": "Ninth Edition",
  RAV: "Ravnica: City of Guilds",
  DIS: "Dissension",
  "10E": "Tenth Edition",
  ME2: "Masters Edition II",
  M11: "Magic 2011",
  ME4: "Masters Edition IV",
  CMD: "Commander 2011",
  AVR: "Avacyn Restored",
  CHK: "Champions of Kamigawa",
  NPH: "New Phyrexia",
  ZEN: "Zendikar",
  GTC: "Gatecrash",
  C13: "Commander 2013",
  EMN: "Eldritch Moon",
  DTK: "Dragons of Tarkir",
  MIR: "Mirage",
  WTH: "Weatherlight",
  INV: "Invasion",
  PLS: "Planeshift",
  "8ED": "Eighth Edition",
  SOK: "Saviors of Kamigawa",
  LRW: "Lorwyn",
  MOR: "Morningtide",
  M10: "Magic 2010",
  WWK: "Worldwake",
  ORI: "Magic Origins",
  MH1: "Modern Horizons",
  THB: "Theros: Beyond Death",
  SOI: "Shadows over Innistrad",
  VMA: "Vintage Masters",
  MMA: "Modern Masters",
  JOU: "Journey into Nyx",
  THS: "Theros",
  M14: "Magic 2014",
  DDF: "Duel Decks: Elspeth vs. Tezzeret",
  SHM: "Shadowmoor",
  MRD: "Mirrodin",
  ODY: "Odyssey",
  M13: "Magic 2013",
  MMQ: "Mercadian Masques",
  ONS: "Onslaught",
  ALA: "Shards of Alara",
  SOM: "Scars of Mirrodin",
  ISD: "Innistrad",
  CONF: "Conflux",
  DKA: "Dark Ascension",
  M15: "Magic 2015",
  UND: "Unsanctioned",
  ARB: "Alara Reborn"
};

/*
  Sets are stored temporarly when reading from scryfall to index the new
  database (generateScryfallDatabase), so we can read their scryfall data
  later when indexing the new cards.json.
  
  NO_DUPES_ART_SETS contains sets that are accessed by their card name only;
    ScryfallCards[LANG][SET][CARDNAME]
  Every other set is accessed by both their card name and collectors number;
    ScryfallCards[LANG][SET][CARDNAME][COLLECTOR]
  
  This is because some cards in arena dont have exact *data* matches in paper,
  like promo cards (pm20), so we store them by name to access them directly.
  This is not possible with all sets because most have multiple artworks of 
  he same card, like basic lands.

  DO NOT add sets here that contain multiple artworks of the same card name!
*/
exports.NO_DUPES_ART_SETS = [
  "pm20",
  "g18",
  "pgrn",
  "pdom",
  "prix",
  "f05",
  "unh",
  "c16",
  "mir"
];

exports.ALLOWED_SCRYFALL = [
  "thb",
  "eld",
  "m20",
  "war",
  "rna",
  "grn",
  "med",
  "m19",
  "ana",
  "dom",
  "rix",
  "xln",
  "tthb",
  "teld",
  "tm20",
  "twar",
  "trna",
  "tgrn",
  "tm19",
  "tdom",
  "trix",
  "txln",
  "pm20",
  "g18",
  "pgrn",
  "pdom",
  "prix",
  "f05",
  "roe",
  "rtr",
  "bfz",
  "mir",
  "akh",
  "unh",
  "und",
  "c16",
  "pls",
  "scg",
  "dst",
  "5dn",
  "9ed",
  "rav",
  "dis",
  "10e",
  "me2",
  "m11",
  "me4",
  "cmd",
  "avr",
  "chk",
  "nph",
  "zen",
  "gtc",
  "c13",
  "emn",
  "temn",
  "dtk",
  "mir",
  "wth",
  "inv",
  "pls",
  "8ed",
  "sok",
  "lrw",
  "tlrw",
  "mor",
  "m10",
  "wwk",
  "ori",
  "mh1",
  "soi",
  "vma",
  "mma",
  "jou",
  "ths",
  "m14",
  "ddf",
  "shm",
  "mrd",
  "ody",
  "m13",
  "tm13",
  "mmq",
  "ons",
  "ala",
  "som",
  "isd",
  "con",
  "dka",
  "m15",
  "arb"
];

exports.RANKS_SHEETS = [
  {
    setCode: "war",
    sheet: "1pk3a1YKGas-NI4ze_8hbwOtVRdYAbzCDIBS9MKjcQ7M",
    page: "Staging%20Sheet"
  },
  {
    setCode: "rna",
    sheet: "1DfcITmtWaBHtiDYLYWHzizw-AOrB3GUQaapc_BqfeH4",
    page: "Staging%20Sheet"
  },
  {
    setCode: "grn",
    sheet: "1FPN3hgl6x_ePq-8On7Ebr8L6WHSU2IznoWSBoGaC_RQ",
    page: "Staging%20Sheet"
  },
  {
    setCode: "m19",
    sheet: "1aZlqE-8mGdfQ50NXUaP-9dRk3w_hp9XmcBqZ_4x3_jk",
    page: "Staging%20Sheet"
  },
  {
    setCode: "dom",
    sheet: "1cc-AOmpQZ7vKqxDTSSvhmRBVOCy_569kT0S-j-Rpbj8",
    page: "Staging%20Sheet"
  },
  {
    setCode: "rix",
    sheet: "1CNg-FDp-pOtQ14Qj-rIBO-yfyr5YcPA6n6ztrEe4ATg",
    page: "Staging%20Sheet"
  },
  {
    setCode: "xln",
    sheet: "1KDtLJd6Nkrv_DDpFs84soBZcWPG1tg79TnVEh-enPz8",
    page: "Staging%20Sheet"
  },
  {
    setCode: "m20",
    sheet: "1BAPtQv4U9KUAtVzkccJlPS8cb0s_uOcGEDORip5uaQg",
    page: "Staging%20Sheet"
  },
  {
    setCode: "eld",
    sheet: "1B-bEUGANnGFPB4zW-vAV8zHjUZINwLU8Qq1sVlgIdpU",
    page: "Staging%20Sheet"
  },
  {
    setCode: "thb",
    sheet: "1zxR9zQxdEH9XI7CZmxiKeTQdU2nD8bVgYJ4bLUwV53s",
    page: "Staging%20Sheet"
  }
];

// for some reason, scryfall does not provide this yet
// this is a manual port of the SVG
exports.ARENA_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 768 597"><path d="M347.576 239.949c-2.473-55.145-8.067-76.085-11.774-76.085-3.762 0-4.946 30.544-9.89 57.535-4.946 26.929-13.654 57.468-13.654 57.468l-22.256-7.19s-6.24-38.967-8.71-85.665c-2.416-46.7-4.299-87.485-11.184-87.485-6.718-.049-8.007 38.346-10.48 88.1-2.475 49.725-11.126 77.265-11.126 77.265l-20.426-2.414s-9.892-43.13-13.603-174.876c-.86-31.181-9.834-37.438-9.834-37.438s-8.979 6.257-9.839 37.438c-3.707 131.746-13.654 174.876-13.654 174.876l-20.375 2.414s-8.704-27.54-11.177-77.265c-2.473-49.754-3.713-88.149-10.48-88.1-6.83 0-8.713 40.785-11.242 87.485-2.415 46.698-8.6 85.665-8.6 85.665l-22.256 7.19s-8.705-30.54-13.65-57.468c-4.945-26.991-6.184-57.535-9.89-57.535-3.712 0-9.3 20.94-11.774 76.085-2.473 55.075-3.063 65.842-3.063 65.842s73.053 26.398 101.49 94.715c28.491 68.276 35.694 127.56 35.909 134.142.373 10.216 8.6 11.516 8.6 11.516s7.152-1.3 8.602-11.516c.912-6.535 7.417-65.866 35.904-134.142 28.441-68.317 101.495-94.715 101.495-94.715s-.594-10.767-3.063-65.842"></path><path d="M273.537 0c-9.573 8.966-7.488 17.264 6.254 24.895 20.613 11.445 225.805 465.27 225.805 497.761 0 21.662-6.136 41.568-18.407 59.719-2.14 9.263.392 13.895 7.598 13.895H763.71c5.154 0 5.154-4.632 0-13.895-35.035-33.824-101.34-130.195-258.113-528.172-1.877-16.954 2.127-29.228 12.012-36.82.315-7.19-1.609-12.985-5.77-17.383h-238.3zM4.705 578.738c59.145-76.265 100.637-127.355 100.637-183.566 0-21.385 66.03 30.783 78.899 192.19.13 1.635-.742 4.939-5.343 4.939H4.705c-6.273-3.922-6.273-8.443 0-13.563z"></path></svg>`;
