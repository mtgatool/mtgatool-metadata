/* eslint-disable complexity */
import path from "path";
import fs from "fs";
import {
  APPDATA,
  OUTPUT,
  SETS_DATA,
  SCRYFALL_LANGS,
  RARITY,
  RATINGS_LOLA,
  RATINGS_LOLA_B,
  RATINGS_MTGCSR,
  DIGITAL_SETS,
} from "./metadata-constants";

import { DbCardDataV2, RanksData } from "./types/metadata";
import { Card, Ability } from "./types/jsons-data";

import readExternalJson from "./readExternalJson";

import parseStringArray from "./utils/parseStringArray";
import parseStringRecord from "./utils/parseStringRecord";

const cmcs: Record<string, number> = {};
cmcs.x = 0;
cmcs["0"] = 0;
cmcs["1"] = 1;
cmcs["2"] = 2;
cmcs["3"] = 3;
cmcs["4"] = 4;
cmcs["5"] = 5;
cmcs["6"] = 6;
cmcs["7"] = 7;
cmcs["8"] = 8;
cmcs["9"] = 9;
cmcs["10"] = 10;
cmcs["11"] = 11;
cmcs["12"] = 12;
cmcs["13"] = 13;
cmcs["14"] = 14;
cmcs["15"] = 15;
cmcs["16"] = 16;
cmcs["17"] = 17;
cmcs["18"] = 18;
cmcs["19"] = 19;
cmcs["20"] = 20;

export function generateMetadata(
  ranksData: RanksData,
  version: string,
  languages: SCRYFALL_LANGS[]
): Promise<void> {
  return new Promise((resolve) => {
    console.log("Reading JSON files..");
    const cards = readExternalJson("cards.json");

    const abilitiesRead = readExternalJson("abilities.json");
    let locRead = readExternalJson("loc.json");
    let enumsRead = readExternalJson("enums.json");

    // TEMP diagnostics: the 2026 SQLite schema may have renamed columns, which
    // would break the TitleId<->LocId localization join (all card names empty).
    console.log(
      "DEBUG loc[0]:",
      JSON.stringify(Array.isArray(locRead) ? locRead[0] : locRead).slice(0, 500)
    );
    console.log(
      "DEBUG cards[0]:",
      JSON.stringify(Array.isArray(cards) ? cards[0] : cards).slice(0, 700)
    );

    const setNames: Record<string, string> = {};
    Object.keys(SETS_DATA).forEach((k) => {
      const setObj = SETS_DATA[k];
      setNames[setObj.arenacode.toLowerCase()] = k;
      setNames[setObj.arenacode.toUpperCase()] = k;
      if (setObj.arenacode !== setObj.scryfall) {
        setNames[setObj.scryfall.toLowerCase()] = k;
        setNames[setObj.scryfall.toUpperCase()] = k;
      }
    });

    // Write scryfall cards to a file. Its good for debugging.
    //const scStr = JSON.stringify(ScryfallCards);
    //const scJsonOut = path.join(APPDATA, EXTERNAL, `scryfall-cards.json`);
    //fs.writeFile(scJsonOut, scStr, () => {});
    // Same for ranks
    //const str = JSON.stringify(ranksData);
    //const jsonOut = path.join(APPDATA, EXTERNAL, `ranks-data.json`);
    //fs.writeFile(jsonOut, str, () => {});

    // Read locales for all languages and clean up mana costs in the texts
    const regex = new RegExp("/o(?=[^{]*})/");
    // Clean up kanji descriptions for JP
    const JpRegex = new RegExp(/ *（[^）]*） */g);

    const loc: Record<SCRYFALL_LANGS, any> = {
      EN: {},
      FR: {},
      IT: {},
      DE: {},
      ES: {},
      JA: {},
      PT: {},
      // RU: {},
      KO: {},
      PH: {},
      // ZHS: {},
    };

    const NT = "#NoTranslationNeeded";

    // Ignore formatted cards from Loc, unless no other definition exists by overwrite
    locRead
      .sort((a: any, b: any) => b.Formatted - a.Formatted)
      .forEach((l: any) => {
        // 2026 localization data has rows with missing language fields (and some
        // with no English at all). Fall back to the English text for any missing
        // / #NoTranslationNeeded field, and skip rows without English entirely,
        // instead of calling .replace on undefined.
        if (l.enUS == null) return;
        const US = l.enUS.replace(regex, "").replace(JpRegex, "");
        const t = (v: any, jp = false): string => {
          if (v == null || v === NT) return US;
          const s = String(v).replace(regex, "");
          return jp ? s.replace(JpRegex, "") : s;
        };
        loc["EN"][l.LocId] = US;
        loc["FR"][l.LocId] = t(l.frFR);
        loc["IT"][l.LocId] = t(l.itIT);
        loc["DE"][l.LocId] = t(l.deDE);
        loc["ES"][l.LocId] = t(l.esES);
        loc["JA"][l.LocId] = t(l.jaJP, true);
        loc["PT"][l.LocId] = t(l.ptBR);
        loc["KO"][l.LocId] = t(l.koKR);
        // loc["ZHS"][l.LocId] = t(l.zhCN);
      });
    locRead = null;

    const getText = function (id: number, language: SCRYFALL_LANGS): string {
      if (id === -1) return "";
      const ret =
        loc[language] == undefined ? loc["EN"][id] : loc[language][id];

      if (!ret) {
        return "";
      }
      return ret;
    };

    // Altrough enums must be in other languages ill write them in english
    // for things like creature types.
    const enums: Record<string, Record<number, string>> = {};
    enumsRead.forEach((e: any) => {
      if (!enums[e.Type]) enums[e.Type] = {};
      enums[e.Type][e.Value] = getText(e.LocId, "EN");
    });
    enumsRead = null;

    let finalized = 0;
    languages.forEach((lang) => {
      // Read abilities for this language
      const abilities: Record<number, string> = {};
      abilitiesRead.forEach((ab: Ability) => {
        const abid = ab.Id;
        abilities[abid] = getText(ab.TextId, lang);
      });

      // main loop
      console.log("Generating " + lang);
      const cardsFinal: Record<number, DbCardDataV2> = {};
      cards.forEach((card: Card) => {
        if (card.ExpansionCode == "ArenaSUP") return;

        // Get types line based on enums
        const types: string[] = [];
        const typesSub: string[] = [];
        const typesSuper: string[] = [];
        parseStringArray(card.Supertypes).forEach((type) => {
          typesSuper.push(enums["SuperType"][parseInt(type)]);
        });

        parseStringArray(card.Types).forEach((type) => {
          types.push(enums["CardType"][parseInt(type)]);
        });

        parseStringArray(card.Subtypes).forEach((type) => {
          typesSub.push(enums["SubType"][parseInt(type)]);
        });

        // Clean up mana cost
        const manaCost: string[] = [];
        card.OldSchoolManaText?.split("o").forEach((mana: string) => {
          if (mana !== "" && mana !== "0") {
            mana = mana
              .toLowerCase()
              .replace("(", "")
              .replace("/", "")
              .replace(")", "");
            manaCost.push(mana);
          }
        });

        const englishName = getText(card.TitleId || -1, "EN");

        const cardObj: DbCardDataV2 = {
          GrpId: card.GrpId,
          TitleId: card.TitleId,
          Name: getText(card.TitleId || -1, lang),
          Set: card.ExpansionCode || "",
          DigitalSet: card.DigitalReleaseSet || "",
          AltName: getText(card.AltTitleId || -1, lang),
          FlavorText: getText(card.FlavorTextId || -1, lang),
          ArtistCredit: card.ArtistCredit,
          Rarity: RARITY[card.Rarity || 0],
          IsToken: !!card.IsToken,
          IsPrimaryCard: !!card.IsPrimaryCard,
          IsDigitalOnly: !!card.IsDigitalOnly,
          IsRebalanced: !!card.IsRebalanced,
          RebalancedCardGrpId: card.RebalancedCardGrpId,
          DefunctRebalancedCardGrpId: card.DefunctRebalancedCardGrpId,
          CollectorNumber: card.CollectorNumber,
          CollectorMax: card.CollectorMax,
          UsesSideboard: card.UsesSideboard,
          ManaCost: manaCost,
          Cmc: manaCost.reduce((acc, m) => acc + (cmcs[m] || 1), 0),
          LinkedFaceType: card.LinkedFaceType,
          RawFrameDetail: card.RawFrameDetail,
          Power: card.Power,
          Toughness: card.Toughness,
          Colors: Object.keys(parseStringRecord(card.Colors)).map(parseFloat),
          ColorIdentity: Object.keys(parseStringRecord(card.ColorIdentity)).map(
            parseFloat
          ),
          FrameColors: Object.keys(parseStringRecord(card.FrameColors)).map(
            parseFloat
          ),
          Types: types.join(" "),
          Subtypes: typesSub.join(" "),
          Supertypes: typesSuper.join(" "),
          AbilityIds: Object.keys(parseStringRecord(card.AbilityIds)).map(
            parseFloat
          ),
          HiddenAbilityIds: Object.keys(
            parseStringRecord(card.HiddenAbilityIds)
          ).map(parseFloat),
          LinkedFaceGrpIds: Object.keys(
            parseStringRecord(card.LinkedFaceGrpIds)
          ).map(parseFloat),
          AbilityIdToLinkedTokenGrpId: parseStringRecord(
            card.AbilityIdToLinkedTokenGrpId
          ),
          AbilityIdToLinkedConjurations: parseStringRecord(
            card.AbilityIdToLinkedConjurations
          ),
          AdditionalFrameDetails: Object.keys(
            parseStringRecord(card.AdditionalFrameDetails)
          ),
          RankData: {
            rankSource: -1,
          },
          Reprints: [],
        };

        const setCode = SETS_DATA[cardObj.Set]
          ? SETS_DATA[cardObj.Set].code
          : "";

        if (ranksData[setCode] && ranksData[setCode][englishName]) {
          const rData = ranksData[setCode][englishName];
          //console.log(setCode, scryfallName, JSON.stringify(rData).slice(0, 50));
          if (rData.rankSource === RATINGS_MTGCSR) {
            cardObj.RankData = rData;
          } else if (rData.rankSource === RATINGS_LOLA) {
            cardObj.RankData = rData;
          } else if (rData.rankSource === RATINGS_LOLA_B) {
            cardObj.RankData = rData;
          }
        }

        cardsFinal[cardObj.GrpId] = cardObj;
      });

      // Add reprints references. IMPORTANT: only match on a non-empty name.
      // 2026 data has cards whose name isn't localized yet (Name == ""); the old
      // O(n^2) match cross-referenced ALL of them against each other, which
      // exploded Reprints into millions of ids and blew JSON.stringify past
      // V8's max string length. Build a name -> GrpIds index once (O(n)) and
      // skip empty names, tokens and basics.
      const grpIdsByName: Record<string, number[]> = {};
      Object.keys(cardsFinal).forEach((key) => {
        const c = cardsFinal[parseInt(key)];
        if (c && c.Name && !c.IsToken && !c.Supertypes.includes("Basic")) {
          if (!grpIdsByName[c.Name]) grpIdsByName[c.Name] = [];
          grpIdsByName[c.Name].push(c.GrpId);
        }
      });
      Object.keys(cardsFinal).forEach((key) => {
        const card: DbCardDataV2 | undefined = cardsFinal[parseInt(key)];
        if (card && card.Name && !card.IsToken && !card.Supertypes.includes("Basic")) {
          const arr = (grpIdsByName[card.Name] || []).filter(
            (g) => g !== card.GrpId
          );
          if (arr.length > 0) {
            card.Reprints = arr;
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
        setNames: setNames,
        digitalSets: DIGITAL_SETS,
        abilities: abilities,
      };

      // Write to a file
      const str = JSON.stringify(jsonOutput);
      const jsonOut = path.join(
        APPDATA,
        OUTPUT,
        version,
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
