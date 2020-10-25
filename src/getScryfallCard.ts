import CardApiResponse from "scryfall-client/dist/types/api/card";
import {
  CID_ART_SETS,
  NO_DUPES_ART_SETS,
  SCRYFALL_LANGS,
} from "./metadata-constants";
import { ScryfallData } from "./types/scryfall";

export default function getScryfallCard(
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
