export interface Ability {
  id: number;
  text: number;
  baseId: number;
  baseIdNumeral: number;
  category: number;
  subCategory: number;
  abilityWord: number;
  requiresConfirmation: number;
  miscellaneousTerm: number;
  numericAid: number;
  manaCost: string;
  fullyParsed: true;
  paymentTypes: number[];
  relevantZones: number[];
  linkedHiddenAbilities: number[];
  referencedKeywords: number[];
  referencedKeywordTypes: number[];
  modalAbilityChildren: number[];
}

export interface Card {
  grpid: number;
  titleId: number;
  artId: number;
  isToken: false;
  isPrimaryCard: true;
  artSize: number;
  power: string;
  toughness: string;
  flavorId: 1;
  collectorNumber: string;
  collectorMax: string;
  altDeckLimit: null;
  cmc: number;
  rarity: number;
  artistCredit: string;
  set: string;
  usesSideboard: boolean;
  linkedFaceType: number;
  types: number[];
  subtypes: number[];
  supertypes: number[];
  cardTypeTextId: number;
  subtypeTextId: number;
  colors: number[];
  frameColors: number[];
  frameDetails: string[];
  colorIdentity: number[];
  abilities: {
    abilityId: number;
    textId: number;
  }[];
  hiddenAbilities: number[];
  linkedFaces: number[];
  castingcost: string;
  knownSupportedStyles: string[];
  DigitalReleaseSet: string;
  abilityIdToLinkedTokenGrpId: {
    abilityId: number;
    linkedTokenGrpId: number;
  }[];
  indicator: number[];
  extraFrameDetails: {
    type: number;
    detail: string;
  }[];
}
