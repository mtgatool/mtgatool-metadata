/* eslint-disable complexity */
import path from "path";
import fs from "fs";
import {
  APPDATA,
  OUTPUT,
  SETS_DATA,
  SET_NAMES,
  LANGKEYS,
  ARENA_LANGS,
  SCRYFALL_LANGS,
  RARITY,
} from "./metadata-constants";
import { ScryfallData } from "./types/scryfall";
import { RanksData } from "./types/metadata";
import { Card, Ability } from "./types/jsons-data";
import { constants, DbCardData } from "mtgatool-shared";
import CardApiResponse from "scryfall-client/dist/types/api/card";
import { ImageUris } from "scryfall-client/dist/types/api/constants";
import replaceCardData from "./replaceCardData";
import readExternalJson from "./readExternalJson";
import getScryfallCard from "./getScryfallCard";

const { RATINGS_LOLA, RATINGS_MTGCSR } = constants;

export function generateMetadata(
  ScryfallCards: ScryfallData,
  ranksData: RanksData,
  version: string,
  languages: SCRYFALL_LANGS[]
): Promise<void> {
  return new Promise((resolve) => {
    console.log("Reading JSON files..");
    const cards = readExternalJson("cards.json");
    const altPrintings = readExternalJson("altPrintings.json") as Record<
      string,
      Record<string, number>
    >;
    const abilitiesRead = readExternalJson("abilities.json");
    let locRead = readExternalJson("loc.json");
    let enumsRead = readExternalJson("enums.json");

    // Write scryfall cards to a file. Its good for debugging.
    //const scStr = JSON.stringify(ScryfallCards);
    //const scJsonOut = path.join(APPDATA, EXTERNAL, `scryfall-cards.json`);
    //fs.writeFile(scJsonOut, scStr, () => {});
    // Same for ranks
    //const str = JSON.stringify(ranksData);
    //const jsonOut = path.join(APPDATA, EXTERNAL, `ranks-data.json`);
    //fs.writeFile(jsonOut, str, () => {});

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
        keys: { id: number; raw?: string; text: string }[];
      }) => {
        loc[LANGKEYS[lang.isoCode]] = {};
        lang.keys.forEach((item) => {
          loc[LANGKEYS[lang.isoCode]][item.id] = (item.raw || item.text)
            .replace(regex, "")
            .replace(JpRegex, "");
        });
      }
    );
    locRead = null;

    const getText = function (id: number, language: SCRYFALL_LANGS): string {
      return loc[language] == undefined ? loc["EN"][id] : loc[language][id];
    };

    // Altrough enums must be in other languages ill write them in english
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
        card.supertypes?.forEach((type) => {
          typeLine += enums["SuperType"][type] + " ";
        });
        card.types?.forEach((type) => {
          typeLine += enums["CardType"][type] + " ";
        });
        card.subtypes?.forEach((type) => {
          typeLine += enums["SubType"][type] + " ";
        });
        // Doing this throws an error in tool :(
        //typeLine = typeLine.slice(0, -1);

        // Clean up mana cost
        const manaCost: string[] = [];
        card.castingcost?.split("o").forEach((mana: string) => {
          if (mana !== "" && mana !== "0") {
            mana = mana
              .toLowerCase()
              .replace("(", "")
              .replace("/", "")
              .replace(")", "");
            manaCost.push(mana);
          }
        });

        let set: string = SET_NAMES[card.set || ""];

        let collector = card.collectorNumber || "";
        // Special collectors numbers that define Mythic edition and Gift pack cards
        if (collector.includes("GR")) {
          set = "Mythic Edition";
        }
        if (collector.includes("GP")) {
          set = "M19 Gift Pack";
        }

        const cardId = card.grpid || 0;
        const cardName = getText(card.titleId || 0, lang);
        const englishName = getText(card.titleId || 0, "EN").replace(
          " /// ",
          " // "
        );

        const cardObj: DbCardData = {
          id: cardId,
          name: cardName.replace(" /// ", " // "),
          titleId: card.titleId || 0,
          set: set,
          artid: card.artId || 0,
          type: typeLine,
          cost: manaCost,
          cmc: card.cmc || 0,
          rarity: RARITY[card.rarity || 1],
          cid: collector,
          frame: card.frameColors || [],
          artist: card.artistCredit || "",
          dfc: card.linkedFaceType || 0,
          isPrimary: card.isPrimaryCard || false,
          abilities: card.abilities?.map((ab) => ab.Id) || [],
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

        if (set == "AKR") {
          cardObj.booster = true;
        }

        let scryfallObject: CardApiResponse | undefined = undefined;
        let scryfallSet = SETS_DATA[set] ? SETS_DATA[set].scryfall : "";
        if (!card.isToken) {
          const orig = scryfallSet + collector;
          const replace = replaceCardData(cardId);
          if (replace.scryfallSet) scryfallSet = replace.scryfallSet;
          if (replace.collector) collector = replace.collector;

          if (card.IsRebalanced) {
            collector = `A-${collector}`;
          }

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

        if (cardId === 78768 || cardId === 78769 || cardId === 78770) {
          scryfallSet = "t" + scryfallSet;
        }

        // Get scryfall object
        scryfallObject = getScryfallCard(
          ScryfallCards,
          lang,
          scryfallSet,
          englishName,
          collector,
          cardObj.artist
        );

        if (card.linkedFaces && card.linkedFaces.length > 0) {
          cardObj.dfcId = card.linkedFaces[0];
        } else {
          cardObj.dfcId = false;
        }

        // Use the name if available
        if (scryfallObject && scryfallObject.printed_name) {
          cardObj.name = scryfallObject.printed_name;
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
          } else if (rData.rankSource === RATINGS_LOLA) {
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
          // Every language has failed..
          console.log(
            `No scryfall data for [${lang}] ${cardObj.name} (${englishName}) - ${scryfallSet}/${card.collectorNumber} (${collector}) artist: ${cardObj.artist} grpId: ${cardObj.id}`
          );
          cardObj.images = {};
        } else {
          if (scryfallObject.image_uris) {
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
                scryfallObject.image_uris[k] = scryfallObject.image_uris[k];
              }
            });
          }
          if (scryfallObject.booster == true) {
            cardObj.booster = true;
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
        sets: SETS_DATA,
        abilities: abilities,
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
