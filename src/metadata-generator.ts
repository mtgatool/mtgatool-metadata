import path from "path";
import fs from "fs";
import {
  APPDATA,
  EXTERNAL,
  OUTPUT,
  SETS_DATA,
  SET_NAMES,
  CID_ART_SETS,
  NO_DUPES_ART_SETS,
  EVENT_TO_NAME,
  EVENT_TO_FORMAT,
  LIMITED_RANKED_EVENTS,
  STANDARD_RANKED_EVENTS,
  SINGLE_MATCH_EVENTS,
  LANGKEYS,
  ARENA_LANGS,
  SCRYFALL_LANGS,
  RARITY,
} from "./metadata-constants";
import stripComments from "strip-json-comments";
import { ScryfallData } from "./types/scryfall";
import { RanksData } from "./types/metadata";
import { Card, Ability } from "./types/jsons-data";
import { constants, DbCardData, Metadata } from "mtgatool-shared";
import CardApiResponse from "scryfall-client/dist/types/api/card";
import { ImageUris } from "scryfall-client/dist/types/api/constants";

const { RATINGS_LOLA, RATINGS_MTGCSR } = constants;

export function generateMetadata(
  ScryfallCards: ScryfallData,
  ranksData: RanksData,
  metagameData: Metadata["archetypes"] | undefined,
  version: string,
  languages: SCRYFALL_LANGS[]
): Promise<void> {
  return new Promise((resolve) => {
    console.log("Reading JSON files");
    const cards = readExternalJson("cards.json");
    const altPrintings: Record<
      string,
      Record<string, number>
    > = readExternalJson("altPrintings.json");
    const abilitiesRead = readExternalJson("abilities.json");
    let locRead = readExternalJson("loc.json");
    let enumsRead = readExternalJson("enums.json");

    // Write scryfall cards to a file. Its good for debugging.
    const scStr = JSON.stringify(ScryfallCards);
    const scJsonOut = path.join(APPDATA, EXTERNAL, `scryfall-cards.json`);
    fs.writeFile(scJsonOut, scStr, () => {});
    // Same for ranks
    const str = JSON.stringify(ranksData);
    const jsonOut = path.join(APPDATA, EXTERNAL, `ranks-data.json`);
    fs.writeFile(jsonOut, str, () => {});

    // Generate list of all cards that are alt printings from other card
    const altCards: number[] = [];
    Object.keys(altPrintings).map((obj) => {
      Object.values(altPrintings[obj]).forEach((val) => {
        altCards.push(val);
      });
    });

    // Read locales for all languages and clean up mana costs in the texts
    const regex = new RegExp("/o(?=[^{]*})/");
    // Clean up kanji descriptions for JP
    const JpRegex = new RegExp(/ *（[^）]*） */g);
    const loc: Partial<Record<SCRYFALL_LANGS, any>> = {};
    locRead.forEach(
      (lang: {
        isoCode: ARENA_LANGS;
        keys: { id: number; text: string }[];
      }) => {
        loc[LANGKEYS[lang.isoCode]] = {};
        lang.keys.forEach((item) => {
          loc[LANGKEYS[lang.isoCode]][item.id] = item.text
            .replace(regex, "")
            .replace(JpRegex, "");
        });
      }
    );
    locRead = null;

    const getText = function (id: number, language: SCRYFALL_LANGS) {
      return loc[language] == undefined ? loc["EN"][id] : loc[language][id];
    };

    // Altrough enums must be in other languages ill write them in english
    //ata be in english
    // for things like creature types. And it would break.
    const enums: Record<string, Record<number, string>> = {};
    enumsRead.forEach(
      (_enum: { name: string; values: { id: number; text: number }[] }) => {
        enums[_enum.name] = {};
        _enum.values.forEach((value) => {
          enums[_enum.name][value.id] = getText(value.text, "EN");
        });
      }
    );
    enumsRead = null;

    let finalized = 0;
    languages.forEach((lang) => {
      // Read abilities for this language
      const abilities: Record<number, string> = {};
      abilitiesRead.forEach((ab: Ability) => {
        const abid = ab.id;
        abilities[abid] = getText(ab.text, lang);
      });

      // main loop
      console.log("Generating " + lang);
      const cardsFinal: Record<number, DbCardData> = {};
      cards.forEach((card: Card) => {
        if (card.set == "ArenaSUP") return;

        // Get types line based on enums
        let typeLine = "";
        card.supertypes.forEach((type) => {
          typeLine += enums["SuperType"][type] + " ";
        });
        card.types.forEach((type) => {
          typeLine += enums["CardType"][type] + " ";
        });
        card.subtypes.forEach((type) => {
          typeLine += enums["SubType"][type] + " ";
        });
        // Doing this throws an error in tool :(
        //typeLine = typeLine.slice(0, -1);

        // Clean up mana cost
        const manaCost: string[] = [];
        card.castingcost.split("o").forEach((mana: string) => {
          if (mana !== "" && mana !== "0") {
            mana = mana
              .toLowerCase()
              .replace("(", "")
              .replace("/", "")
              .replace(")", "");
            manaCost.push(mana);
          }
        });

        let set: string = SET_NAMES[card.set];

        let collector = card.collectorNumber;
        // Special collectors numbers that define Mythic edition and Gift pack cards
        if (collector.includes("GR")) {
          set = "Mythic Edition";
        }
        if (collector.includes("GP")) {
          set = "M19 Gift Pack";
        }

        const cardId = card.grpid;
        const cardName = getText(card.titleId, lang);
        const englishName = getText(card.titleId, "EN");

        const cardObj: DbCardData = {
          id: cardId,
          name: cardName,
          titleId: card.titleId,
          set: set,
          artid: card.artId,
          type: typeLine,
          cost: manaCost,
          cmc: card.cmc,
          rarity: RARITY[card.rarity],
          cid: collector,
          frame: card.frameColors,
          artist: card.artistCredit,
          dfc: card.linkedFaceType,
          isPrimary: card.isPrimaryCard,
          abilities: card.abilities.map((ab) => ab.abilityId),
          // Defaults / unset
          collectible: false,
          craftable: false,
          booster: false,
          dfcId: false,
          rank: 0,
          rank_values: [],
          images: {},
          reprints: false,
        };

        let scryfallObject: CardApiResponse | undefined = undefined;
        let scryfallSet = SETS_DATA[set] ? SETS_DATA[set].scryfall : "";
        if (!card.isToken) {
          const orig = scryfallSet + collector;
          const replace = replaceCardData(cardId);
          if (replace.scryfallSet) scryfallSet = replace.scryfallSet;
          if (replace.collector) collector = replace.collector;

          if (orig !== scryfallSet + collector) {
            const origSet = cardObj.set;
            cardObj.set =
              Object.keys(SETS_DATA).filter(
                (key) => SETS_DATA[key].scryfall == scryfallSet
              )[0] || origSet;
          }
        } else {
          // If the card is a token the scryfall set name begins with "t"
          scryfallSet = "t" + scryfallSet;

          if (cardId == 74596) {
            collector = "6";
            scryfallSet = "pr2";
          }
          if (cardId == 74597) {
            collector = "6";
            scryfallSet = "p04";
          }
          if (cardId == 71670) {
            collector = "9";
            scryfallSet = "tlrw";
          }
          if (cardId == 68808) {
            collector = "10";
            scryfallSet = "tmh1";
          }
          if (cardId == 68809) {
            collector = "8";
            scryfallSet = "tcn2";
          }
        }

        // Get scryfall object
        scryfallObject = getScryfallCard(
          ScryfallCards,
          cardId == 72578 ? "PH" : lang,
          scryfallSet,
          englishName,
          collector,
          cardObj.artist
        );

        if (card.linkedFaces.length > 0) {
          cardObj.dfcId = card.linkedFaces[0];
        } else {
          cardObj.dfcId = false;
        }

        // Use the name if available
        if (scryfallObject && scryfallObject.printed_name) {
          cardObj.name = scryfallObject.printed_name;
        }
        // We did not find any image data on scryfall for this card!
        if (
          scryfallObject == undefined ||
          scryfallObject.image_uris == undefined
        ) {
          // Try default to english
          scryfallObject = getScryfallCard(
            ScryfallCards,
            cardId == 72578 ? "PH" : lang,
            scryfallSet,
            englishName,
            collector,
            cardObj.artist
          );
        }

        // Add ranks data
        let scryfallName = englishName;
        if (scryfallObject) {
          scryfallName = scryfallObject.name;
        }

        const setCode = SETS_DATA[set] ? SETS_DATA[set].code : "";
        if (ranksData[setCode] && ranksData[setCode][scryfallName]) {
          const rData = ranksData[setCode][scryfallName];
          //console.log(setCode, scryfallName, JSON.stringify(rData).slice(0, 50));
          if (rData.rankSource === RATINGS_MTGCSR) {
            cardObj.source = RATINGS_MTGCSR;
            cardObj.rank = Math.round(rData.rank);
            cardObj.rank_values = rData.values;
            cardObj.rank_controversy = rData.cont;
          }
          if (rData.rankSource === RATINGS_LOLA) {
            cardObj.source = RATINGS_LOLA;
            cardObj.rank = Math.round(rData.rank);
            cardObj.side = rData.side;
            cardObj.ceil = rData.ceil;
            cardObj.rank_values = rData.values;
          }
        } else {
          //console.log("No ranks for " + scryfallName + ", set: " + setCode);
          cardObj.rankSource = -1;
          cardObj.rank = 0;
          cardObj.rank_values = 0;
          cardObj.rank_controversy = 0;
        }

        if (
          scryfallObject == undefined ||
          scryfallObject.image_uris == undefined
        ) {
          // English failed..
          console.log(
            `No scryfall data for [${lang}] ${cardObj.name} (${englishName}) - ${scryfallSet} (${cardObj.cid}) artist: ${cardObj.artist} grpId: ${cardObj.id}`
          );
          cardObj.images = {};
        } else {
          if (scryfallObject.image_uris) {
            const rep = "https://img.scryfall.com/cards";
            Object.keys(scryfallObject.image_uris).forEach((key) => {
              const k = key as keyof ImageUris;
              // Remove the first part of the URLs and some
              // links that are not used by tool.
              // This reduces the file size subtantially
              if (
                scryfallObject?.image_uris &&
                k !== "png" &&
                k !== "border_crop"
              ) {
                scryfallObject.image_uris[k] = scryfallObject.image_uris[
                  k
                ].replace(rep, "");
              }
            });
          }
          if (scryfallObject.booster == false) {
            cardObj.booster = false;
          }
          cardObj.images = scryfallObject.image_uris;
        }
        if (!altCards.includes(cardObj.id)) {
          cardsFinal[cardObj.id] = cardObj;
        }
      });

      // Add reprints and split cards references
      Object.keys(cardsFinal).forEach((key) => {
        const card: DbCardData | undefined = cardsFinal[parseInt(key)];

        if (card && card.frame) {
          if (card.dfc == 5 && card.frame.length == 0) {
            const did = card.dfcId;
            if (did && did !== true) {
              card.frame = cardsFinal[did].frame;
            }
            card.dfcId = did;
          }
        }

        card.reprints = false;
        if (card.rarity !== "token" && card.rarity !== "land") {
          const arr: number[] = [];

          Object.keys(cardsFinal).forEach((key) => {
            const cardLoop: DbCardData | undefined = cardsFinal[parseInt(key)];
            if (
              cardLoop &&
              cardLoop.name == card.name &&
              cardLoop.id !== card.id
            ) {
              arr.push(cardLoop.id);
            }
          });

          if (arr.length > 0) {
            card.reprints = arr;
          }
        }
      });

      // Make the final JSON structure
      const date = new Date();
      const jsonOutput = {
        cards: cardsFinal,
        ok: true,
        version: version,
        language: lang,
        updated: date.getTime(),
        events: EVENT_TO_NAME,
        events_format: EVENT_TO_FORMAT,
        sets: SETS_DATA,
        abilities: abilities,
        limited_ranked_events: LIMITED_RANKED_EVENTS,
        standard_ranked_events: STANDARD_RANKED_EVENTS,
        single_match_events: SINGLE_MATCH_EVENTS,
        archetypes: metagameData || [],
      };

      // Write to a file
      const str = JSON.stringify(jsonOutput);
      const jsonOut = path.join(
        APPDATA,
        OUTPUT,
        `v${version}-${lang.toLowerCase()}-database.json`
      );
      fs.writeFile(jsonOut, str, function (err) {
        if (err) {
          return console.log(err);
        }

        console.log(`${jsonOut} generated.`);
        finalized++;
        if (finalized == languages.length) {
          resolve();
        }
      });
      //
    });
  });
}

function getScryfallCard(
  ScryfallCards: ScryfallData,
  lang: SCRYFALL_LANGS,
  scryfallSet: string,
  cardName: string,
  cid: string,
  artist: string
): CardApiResponse | undefined {
  let ret: CardApiResponse | undefined = undefined;
  const collector = parseInt(cid);

  // Secrel lair drop basic lands only exist in Japanese
  if (scryfallSet == "sld" && collector > 62 && collector < 68) {
    lang = "JA";
  }

  try {
    if (CID_ART_SETS.includes(scryfallSet)) {
      ret = ScryfallCards[lang][scryfallSet][collector];
    } else if (NO_DUPES_ART_SETS.includes(scryfallSet)) {
      ret = ScryfallCards[lang][scryfallSet][cardName];
    } else {
      ret = ScryfallCards[lang][scryfallSet][cardName][collector];
    }
  } catch (e) {
    ret = undefined;
  }

  if (ret == undefined && lang !== "EN") {
    try {
      if (CID_ART_SETS.includes(scryfallSet)) {
        ret = ScryfallCards["EN"][scryfallSet][collector];
      } else if (NO_DUPES_ART_SETS.includes(scryfallSet)) {
        ret = ScryfallCards["EN"][scryfallSet][cardName];
      } else {
        ret = ScryfallCards["EN"][scryfallSet][cardName][collector];
      }
    } catch (e) {
      ret = undefined;
    }
  }

  if (ret == undefined) {
    try {
      ret = ScryfallCards[lang]["byArt"][cardName][artist.toLowerCase()];
    } catch (e) {
      ret = undefined;
    }
  }

  return ret;
}

function readExternalJson(filename: string) {
  const file = path.join(APPDATA, EXTERNAL, filename);
  //JSON.parse(fs.readFileSync(file));
  const filestr = fs.readFileSync(file) + "";
  const str = stripComments(filestr);
  try {
    const json = JSON.parse(`{"value": ${str}}`);
    return json.value;
  } catch (e) {
    console.log(filename);
    console.log(str);
  }
  return "";
}

// eslint-disable-next-line complexity
function replaceCardData(
  cardId: number
): { scryfallSet?: string; collector?: string } {
  let collector: string | undefined = undefined;
  let scryfallSet: string | undefined = undefined;
  // Jumpstart replacement cards
  if (cardId == 74983)
    // Archon of Sun's Grace - jmp (3)
    scryfallSet = "ajmp";
  if (cardId == 74984)
    // Serra's Guardian - jmp (310)
    scryfallSet = "ajmp";
  if (cardId == 74986)
    // Banishing Light - jmp (4)
    scryfallSet = "ajmp";
  if (cardId == 74987)
    // Gadwick, the Wizened - jmp (48)
    scryfallSet = "ajmp";
  if (cardId == 74988)
    // Teferi's Ageless Insight - jmp (76)
    scryfallSet = "ajmp";
  if (cardId == 74989)
    // Weight of Memory - jmp (74)
    scryfallSet = "ajmp";
  if (cardId == 74990)
    // Bond of Revival - jmp (80)
    scryfallSet = "ajmp";
  if (cardId == 74991)
    // Audacious Thief - jmp (84)
    scryfallSet = "ajmp";
  if (cardId == 74992)
    // Doomed Necromancer - jmp (137)
    scryfallSet = "ajmp";
  if (cardId == 74993)
    // Carnifex Demon - jmp (57)
    scryfallSet = "ajmp";
  if (cardId == 74994)
    // Woe Strider - jmp (123)
    scryfallSet = "ajmp";
  if (cardId == 74995)
    // Lightning Strike - jmp (152)
    scryfallSet = "ajmp";
  if (cardId == 74996)
    // Lightning Serpent (Lightning Serpent) - jmp (88)
    scryfallSet = "ajmp";
  if (cardId == 74997)
    // Scorching Dragonfire (Scorching Dragonfire) - jmp (139)
    scryfallSet = "ajmp";
  if (cardId == 74998)
    // Goblin Oriflamme (Goblin Oriflamme) - jmp (130)
    scryfallSet = "ajmp";
  if (cardId == 75000)
    // Dryad Greenseeker (Dryad Greenseeker) - jmp (178)
    scryfallSet = "ajmp";
  if (cardId == 75001)
    // Pollenbright Druid (Pollenbright Druid) - jmp (173)
    scryfallSet = "ajmp";
  if (cardId == 75002)
    // Prey Upon (Prey Upon) - jmp (143)
    scryfallSet = "ajmp";

  // ??
  if (cardId == 69441) {
    collector = "40";
    scryfallSet = "akh";
  }
  if (cardId == 73175) {
    collector = "2";
    scryfallSet = "twwk";
  }
  if (cardId == 73172) {
    collector = "1";
    scryfallSet = "tcon";
  }
  if (cardId == 73165) {
    collector = "6";
    scryfallSet = "tm15";
  }
  if (cardId == 71686) {
    collector = "12";
    scryfallSet = "tshm";
  }
  if (cardId == 73649) {
    collector = "385";
  }

  // ANA lands
  // These arent the exact ones, these are lands from
  // random sets but with the same art.
  if (cardId == 69443) {
    collector = "263";
    scryfallSet = "m20";
  }
  if (cardId == 69444) {
    collector = "265";
    scryfallSet = "xln";
  }
  if (cardId == 69445) {
    collector = "257";
    scryfallSet = "dtk";
  }
  if (cardId == 69446) {
    collector = "269";
    scryfallSet = "rtr";
  }
  if (cardId == 69447) {
    collector = "266";
    scryfallSet = "dom";
  }

  // Unsanctioned lands (hidden squirrel)
  if (cardId == 73136) {
    collector = "87";
    scryfallSet = "und";
  }
  if (cardId == 73137) {
    collector = "89";
    scryfallSet = "und";
  }
  if (cardId == 73138) {
    collector = "91";
    scryfallSet = "und";
  }
  if (cardId == 73139) {
    collector = "93";
    scryfallSet = "und";
  }
  if (cardId == 73140) {
    collector = "95";
    scryfallSet = "und";
  }

  // Unsanctioned lands (full art)
  if (cardId == 73141) {
    collector = "88";
    scryfallSet = "und";
  }
  if (cardId == 73142) {
    collector = "90";
    scryfallSet = "und";
  }
  if (cardId == 73143) {
    collector = "92";
    scryfallSet = "und";
  }
  if (cardId == 73144) {
    collector = "94";
    scryfallSet = "und";
  }
  if (cardId == 73145) {
    collector = "96";
    scryfallSet = "und";
  }

  // Unhinged lands
  if (cardId == 70501) scryfallSet = "unh";
  if (cardId == 70502) scryfallSet = "unh";
  if (cardId == 70503) scryfallSet = "unh";
  if (cardId == 70504) scryfallSet = "unh";
  if (cardId == 70505) scryfallSet = "unh";
  // Commander 2016 lands
  if (cardId == 70506) scryfallSet = "c16";
  if (cardId == 70507) scryfallSet = "c16";
  if (cardId == 70508) scryfallSet = "c16";
  if (cardId == 70509) scryfallSet = "c16";
  if (cardId == 70510) scryfallSet = "c16";
  // Promo Llanowar Elves
  if (cardId == 69781) scryfallSet = "pdom";
  // Promo Firemind's Research
  if (cardId == 69780) scryfallSet = "pgrn";
  // Promo Ghalta
  if (cardId == 70140) scryfallSet = "prix";
  // Promo Duress
  if (cardId == 70141) scryfallSet = "f05";

  return {
    scryfallSet,
    collector,
  };
}
