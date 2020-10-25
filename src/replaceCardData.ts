// eslint-disable-next-line complexity
export default function replaceCardData(
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
