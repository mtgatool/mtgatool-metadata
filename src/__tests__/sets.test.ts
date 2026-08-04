/* eslint-env jest */
import path from "path";
import fs from "fs";

import { APPDATA, EXTERNAL, SETS_DATA } from "../metadata-constants";
import { Card } from "../types/jsons-data";

describe("Check sets data", () => {
  const sets = getSets();

  const SET_NAMES: Record<string, string> = {};
  Object.keys(SETS_DATA).forEach((name) => {
    SET_NAMES[SETS_DATA[name].arenacode] = name;
  });

  test.each(sets)("Set %p (%p cards)", (setCode) => {
    expect(SET_NAMES[setCode]).toBeDefined();
  });
});

function getSets(): [string, number][] {
  const file = path.join(APPDATA, EXTERNAL, "cards.json");
  const fileStr = fs.readFileSync(file);
  const cards = JSON.parse(`{"value": ${fileStr.toString("utf-8")}}`);

  const sets: string[] = [];
  const setCards: Record<string, number> = {};
  // get all sets in cards.json
  cards.value.forEach((card: Card) => {
    // Alchemy cards report a bare rotation year ("Y22".."Y26") as their
    // expansion; the set they actually belong to is the digital release
    // ("Y26-ECL"). Matched by pattern rather than a list of years — the list
    // stopped at Y25, so every Y26 card fell through as a bare "Y26" and the
    // failure read as a missing set rather than a stale test.
    const cardSet = /^Y\d{2}$/.test(card.ExpansionCode)
      ? card.DigitalReleaseSet
      : card.ExpansionCode;
    if (cardSet) {
      if (!setCards[cardSet]) setCards[cardSet] = 1;
      else setCards[cardSet] += 1;
      // We ignore ArenaSUP
      if (
        !sets.includes(cardSet) &&
        cardSet !== "ArenaSUP" &&
        cardSet !== "WC"
      ) {
        sets.push(cardSet);
      }
    }
  });
  // Build return array
  // [[set, cards], [set, cards], [set, cards]]
  const ret: [string, number][] = [];
  sets.forEach((code) => {
    ret.push([code, setCards[code]]);
  });
  return ret;
}
