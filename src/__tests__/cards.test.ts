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
    expect(teferi.GrpId).toBe(69670);
    expect(teferi.ArtId).toBe(406680);
    expect(teferi.ArtPath).toBe(null);
    expect(teferi.TitleId).toBe(336891);
    expect(teferi.AltTitleId).toBe(0);
    expect(teferi.FlavorTextId).toBe(1);
    expect(teferi.TypeTextId).toBe(261939);
    expect(teferi.SubtypeTextId).toBe(46282);
    expect(teferi.ArtistCredit).toBe("Chris Rallis");
    expect(teferi.ArtSize).toBe(1);
    expect(teferi.Rarity).toBe(4);
    expect(teferi.ExpansionCode).toBe("WAR");
    expect(teferi.DigitalReleaseSet).toBe(null);
    expect(teferi.IsToken).toBe(0);
    expect(teferi.IsPrimaryCard).toBe(1);
    expect(teferi.IsDigitalOnly).toBe(0);
    expect(teferi.IsRebalanced).toBe(0);
    expect(teferi.RebalancedCardGrpId).toBe(81199);
    expect(teferi.DefunctRebalancedCardGrpId).toBe(0);
    expect(teferi.AlternateDeckLimit).toBe(0);
    expect(teferi.CollectorNumber).toBe("221");
    expect(teferi.CollectorMax).toBe("264");
    expect(teferi.UsesSideboard).toBe(0);
    expect(teferi.OldSchoolManaText).toBe("o1oWoU");
    expect(teferi.LinkedFaceType).toBe(0);
    expect(parseStringArray(teferi.RawFrameDetail)).toStrictEqual([
      "WU gold planeswalker",
      " 3 abilities",
    ]);
    expect(teferi.Watermark).toBe(null);
    expect(teferi.TextChangeData).toBe(null);
    expect(teferi.Power).toBe(null);
    expect(teferi.Toughness).toBe("4");
    expect(
      parseStringArray(teferi.Colors).map(parseFloat).sort()
    ).toStrictEqual([1, 2]);
    expect(
      parseStringArray(teferi.ColorIdentity).map(parseFloat).sort()
    ).toStrictEqual([1, 2]);
    expect(
      parseStringArray(teferi.FrameColors).map(parseFloat).sort()
    ).toStrictEqual([1, 2]);
    expect(teferi.IndicatorColors).toBe(null);
    expect(parseStringArray(teferi.Types).map(parseFloat).sort()).toStrictEqual(
      [8]
    );
    expect(
      parseStringArray(teferi.Subtypes).map(parseFloat).sort()
    ).toStrictEqual([325]);
    expect(
      parseStringArray(teferi.Supertypes).map(parseFloat).sort()
    ).toStrictEqual([2]);
    expect(
      parseStringArray(teferi.AbilityIds).map(parseFloat).sort()
    ).toStrictEqual([133144, 133145, 6363]);
    expect(teferi.HiddenAbilityIds).toBe(null);
    expect(teferi.LinkedFaceGrpIds).toBe(null);
    expect(teferi.LinkedAbilityTemplateCardGrpIds).toBe(null);
    expect(teferi.AbilityIdToLinkedTokenGrpId).toBe(null);
    expect(teferi.AbilityIdToLinkedConjurations).toBe(null);
    expect(
      parseStringArray(teferi.KnownSupportedStyles || "").sort()
    ).toStrictEqual(["DA", "SG"]);
    expect(teferi.AdditionalFrameDetails).toBe("gold");
    expect(teferi.ExtraFrameDetails).toBe(null);
    expect(teferi.Order_LandLast).toBe(0);
    expect(teferi.Order_ColorOrder).toBe(5);
    expect(teferi.Order_CreaturesFirst).toBe(1);
    expect(teferi.Order_ManaCostDifficulty).toBe(2);
    expect(teferi.Order_CMCWithXLast).toBe(3);
    expect(teferi.Order_Title).toBe("teferitimeraveler");
    expect(teferi.Order_MythicToCommon).toBe(1);
    expect(teferi.Order_BasicLandsFirst).toBe(1);
    expect(teferi.ReminderTextId).toBe(0);

    expect(Object.keys(teferi).sort()).toStrictEqual([
      "AbilityIdToLinkedConjurations",
      "AbilityIdToLinkedTokenGrpId",
      "AbilityIds",
      "AdditionalFrameDetails",
      "AltTitleId",
      "AlternateDeckLimit",
      "ArtId",
      "ArtPath",
      "ArtSize",
      "ArtistCredit",
      "CollectorMax",
      "CollectorNumber",
      "ColorIdentity",
      "Colors",
      "DefunctRebalancedCardGrpId",
      "DigitalReleaseSet",
      "ExpansionCode",
      "ExtraFrameDetails",
      "FlavorTextId",
      "FrameColors",
      "GrpId",
      "HiddenAbilityIds",
      "IndicatorColors",
      "IsDigitalOnly",
      "IsPrimaryCard",
      "IsRebalanced",
      "IsToken",
      "KnownSupportedStyles",
      "LinkedAbilityTemplateCardGrpIds",
      "LinkedFaceGrpIds",
      "LinkedFaceType",
      "OldSchoolManaText",
      "Order_BasicLandsFirst",
      "Order_CMCWithXLast",
      "Order_ColorOrder",
      "Order_CreaturesFirst",
      "Order_LandLast",
      "Order_ManaCostDifficulty",
      "Order_MythicToCommon",
      "Order_Title",
      "Power",
      "Rarity",
      "RawFrameDetail",
      "RebalancedCardGrpId",
      "ReminderTextId",
      "SubtypeTextId",
      "Subtypes",
      "Supertypes",
      "TextChangeData",
      "TitleId",
      "Toughness",
      "TypeTextId",
      "Types",
      "UsesSideboard",
      "Watermark",
    ]);
  });
});

function getCards(): Record<string, Card> {
  const file = path.join(APPDATA, EXTERNAL, "cards.json");
  let cards: { value: Card[] } = {
    value: [],
  };
  try {
    cards = JSON.parse(`{"value": ${fs.readFileSync(file, "utf8")}}`);
  } catch (e) {
    console.error(fs.readFileSync(file, "utf8"));
    console.error(e);
  }

  // get all cards in cards.json as grpId: card
  const cardsObj: Record<string, Card> = {};
  cards.value.forEach((card) => {
    cardsObj[card.GrpId || 0] = card;
  });
  return cardsObj;
}
