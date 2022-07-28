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
  grpid?: number;
  titleId?: number;
  artId?: number;
  isToken?: false;
  isPrimaryCard?: true;
  artSize?: number;
  power?: string;
  toughness?: string;
  flavorId?: number;
  collectorNumber?: string;
  collectorMax?: string;
  altDeckLimit?: null;
  cmc?: number;
  rarity?: number;
  artistCredit?: string;
  set?: string;
  usesSideboard?: boolean;
  linkedFaceType?: number;
  types?: string;
  subtypes?: string;
  supertypes?: string;
  cardTypeTextId?: number;
  subtypeTextId?: number;
  colors?: string;
  frameColors?: string;
  frameDetails?: string;
  colorIdentity?: string;
  IsRebalanced?: boolean;
  RebalancedCardLink?: string;
  IsDigitalOnly?: boolean;
  abilities?: string; // Id:TextId
  rawFrameDetails?: string;
  hiddenAbilities?: string;
  linkedFaces?: string;
  castingcost?: string;
  knownSupportedStyles?: string;
  DigitalReleaseSet?: string;
  abilityIdToLinkedTokenGrpId: string;
  indicator?: string;
  extraFrameDetails?: string;
}
