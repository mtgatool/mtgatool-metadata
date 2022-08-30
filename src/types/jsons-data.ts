export interface Ability {
  Id: number;
  BaseId: number;
  BaseIdNumeral: number;
  TextId: number;
  OldSchoolManaText: string | null;
  Category: number;
  SubCategory: number;
  AbilityWord: number;
  NumericAid: number;
  RequiresConfirmation: number;
  MiscellaneousTerm: number;
  PaymentType: number;
  LoyaltyCost: string | null;
  FullyParsed: number;
  IsIntrinsicAbility: number;
  RelevantZones: string | null;
  HiddenAbilityIds: string | null;
  HiddenByAbilityIds: string | null;
  ReferencedAbilityIds: string | null;
  ReferencedAbilityTypes: string | null;
  ModalChildIds: string | null;
  ModalParentIds: string | null;
  CostTypes: string | null;
}

export interface Card {
  grpId?: number;
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
