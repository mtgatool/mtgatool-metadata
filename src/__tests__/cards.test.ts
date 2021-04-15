/* eslint-env jest */
import path from "path";
import fs from "fs";

import { APPDATA, EXTERNAL } from "../metadata-constants";
import { Card } from "../types/jsons-data";

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
    expect(teferi.isToken).toBe(false);
    expect(teferi.isPrimaryCard).toBe(true);
    expect(teferi.artSize).toBe(1);
    expect(teferi.power).toBe("0");
    expect(teferi.toughness).toBe("4");
    expect(teferi.flavorId).toBeDefined();
    expect(teferi.collectorNumber).toBe("221");
    expect(teferi.collectorMax).toBe("264");
    expect(teferi.altDeckLimit).toBeNull();
    expect(teferi.cmc).toBe(3);
    expect(teferi.rarity).toBeDefined();
    expect(teferi.artistCredit).toBe("Chris Rallis");
    expect(teferi.set).toBe("WAR");
    expect(teferi.usesSideboard).toBe(false);
    expect(teferi.linkedFaceType).toBeDefined();
    expect(teferi.types).toBeDefined();
    expect(teferi.subtypes).toBeDefined();
    expect(teferi.supertypes).toBeDefined();
    expect(teferi.cardTypeTextId).toBeDefined();
    expect(teferi.subtypeTextId).toBeDefined();
    expect(teferi.colors.sort()).toEqual([1, 2].sort());
    expect(teferi.frameColors.sort()).toEqual([1, 2].sort());
    expect(teferi.frameDetails).toEqual(["gold"]);
    expect(teferi.colorIdentity.sort()).toEqual([1, 2].sort());
    expect(teferi.abilities).toEqual([
      {
        abilityId: 6363,
        textId: 234430,
      },
      {
        abilityId: 133144,
        textId: 336892,
      },
      {
        abilityId: 133145,
        textId: 336893,
      },
    ]);
    expect(teferi.hiddenAbilities).toEqual([]);
    expect(teferi.linkedFaces).toEqual([]);
    expect(teferi.castingcost).toBe("o1oWoU");
    // Removed on 0.1.2239.790924 (before 6/24/20)
    //expect(teferi.linkedTokens).toEqual([]);
    expect(teferi.abilityIdToLinkedTokenGrpId).toEqual([]);
    expect(teferi.knownSupportedStyles).toBeDefined();
    // Removed on 0.1.2213.786053 (5/19/20)
    //expect(teferi.knownAlternatePrintings).toStrictEqual([]);
    expect(teferi.DigitalReleaseSet).toBe("");
    expect(Object.keys(teferi).length).toBe(34);
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
    cardsObj[card.grpid] = card;
  });
  return cardsObj;
}
