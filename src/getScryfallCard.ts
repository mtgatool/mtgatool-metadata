import CardApiResponse from "scryfall-client/dist/types/api/card";
import {
  CID_ART_SETS,
  NO_DUPES_ART_SETS,
  SCRYFALL_LANGS,
  SCRYFALL_LANGS_CONST,
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
  const collector = parseInt(cid);

  const tryGetCard = () => {
    let ret: CardApiResponse | undefined = undefined;
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

    if (ret == undefined) {
      try {
        ret = ScryfallCards[lang]["byArt"][cardName][artist.toLowerCase()];
      } catch (e) {
        ret = undefined;
      }
    }
    return ret;
  };

  let card: CardApiResponse | undefined = undefined;
  card = tryGetCard();
  let i = 0;
  while (card === undefined && i < SCRYFALL_LANGS_CONST.length) {
    lang = SCRYFALL_LANGS_CONST[i];
    card = tryGetCard();
    i++;
  }

  return card;
}
