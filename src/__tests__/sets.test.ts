/* eslint-env jest */
import path from "path";
import fs from "fs";

import { APPDATA, EXTERNAL, SET_NAMES } from "../metadata-constants";
import { Card } from "../types/jsons-data";

describe("Check sets data", () => {
  const sets = getSets();
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
    if (card.set) {
      if (!setCards[card.set]) setCards[card.set] = 1;
      else setCards[card.set] += 1;
      // We ignore ArenaSUP
      if (!sets.includes(card.set) && card.set !== "ArenaSUP") {
        sets.push(card.set);
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
