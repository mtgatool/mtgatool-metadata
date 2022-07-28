/* eslint-env jest */
import path from "path";
import fs from "fs";

import { APPDATA, EXTERNAL } from "../metadata-constants";
import { Card } from "../types/jsons-data";
import parseStringArray from "../utils/parseStringArray";

describe("Check cards data", () => {
  const cards: Record<string, Card> = getCards();
  const teferi = cards["69670"];

  // Test if the cards proprties change from what we expect
  test("Cards properties", () => {
    expect(teferi).toBeDefined();
    // Those values set as toBeDefined we cant rely on their staticness
    expect(teferi.grpid).toBe(69670);
    expect(teferi.titleId).toBeDefined();
    expect(teferi.artId).toBeDefined();
    expect(teferi.artSize).toBe(1);
    expect(teferi.toughness).toBe("4");
    expect(teferi.flavorId).toBeDefined();
    expect(teferi.collectorNumber).toBe("221");
    expect(teferi.collectorMax).toBe("264");
    expect(teferi.cmc).toBe(3);
    expect(teferi.rarity).toBeDefined();
    expect(teferi.artistCredit).toBe("Chris Rallis");
    expect(teferi.set).toBe("WAR");
    expect(teferi.types).toBeDefined();
    expect(teferi.subtypes).toBeDefined();
    expect(teferi.supertypes).toBeDefined();
    expect(teferi.cardTypeTextId).toBeDefined();
    expect(teferi.subtypeTextId).toBeDefined();
    expect(parseStringArray(teferi.colors).map(parseInt).sort()).toEqual(
      [1, 2].sort()
    );
    expect(parseStringArray(teferi.frameColors).map(parseInt).sort()).toEqual(
      [1, 2].sort()
    );
    expect(teferi.rawFrameDetails).toEqual("3 abilities");
    expect(teferi.frameDetails).toEqual(["gold"]);
    expect(parseStringArray(teferi.colorIdentity).map(parseInt).sort()).toEqual(
      [1, 2].sort()
    );
    expect(teferi.castingcost).toBe("o1oWoU");
    expect(teferi.knownSupportedStyles).toBeDefined();
    expect(teferi.RebalancedCardLink).toBe(81199);
    expect(teferi.abilities).toEqual([
      {
        Id: 6363,
      },
      {
        Id: 133144,
      },
      {
        Id: 133145,
      },
    ]);
    expect(Object.keys(teferi).length).toBe(26);
  });
});

function getCards(): Record<string, Card> {
  const file = path.join(APPDATA, EXTERNAL, "cards.json");
  const cards: { value: Card[] } = JSON.parse(
    `{"value": ${fs.readFileSync(file)}}`
  );

  // get all cards in cards.json as grpId: card
  const cardsObj: Record<string, Card> = {};
  cards.value.forEach((card) => {
    cardsObj[card.grpid || 0] = card;
  });
  return cardsObj;
}
