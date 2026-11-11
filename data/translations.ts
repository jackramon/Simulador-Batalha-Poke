
import { statusTranslations } from './translations/status';
import { normalMoves } from './translations/normal';
import { fireMoves } from './translations/fire';
import { waterMoves } from './translations/water';
import { grassMoves } from './translations/grass';
import { electricMoves } from './translations/electric';
import { iceMoves } from './translations/ice';
import { fightingMoves } from './translations/fighting';
import { poisonMoves } from './translations/poison';
import { groundMoves } from './translations/ground';
import { flyingMoves } from './translations/flying';
import { psychicMoves } from './translations/psychic';
import { bugMoves } from './translations/bug';
import { rockMoves } from './translations/rock';
import { ghostMoves } from './translations/ghost';
import { dragonMoves } from './translations/dragon';
import { steelMoves } from './translations/steel';
import { darkMoves } from './translations/dark';
import { fairyMoves } from './translations/fairy';
import { otherMoves } from './translations/others';

import { normalDescriptions } from './translations/descriptions/normal';
import { fireDescriptions } from './translations/descriptions/fire';
import { waterDescriptions } from './translations/descriptions/water';
import { grassDescriptions } from './translations/descriptions/grass';
import { electricDescriptions } from './translations/descriptions/electric';
import { iceDescriptions } from './translations/descriptions/ice';
import { fightingDescriptions } from './translations/descriptions/fighting';
import { poisonDescriptions } from './translations/descriptions/poison';
import { groundDescriptions } from './translations/descriptions/ground';
import { flyingDescriptions } from './translations/descriptions/flying';
import { psychicDescriptions } from './translations/descriptions/psychic';
import { bugDescriptions } from './translations/descriptions/bug';
import { rockDescriptions } from './translations/descriptions/rock';
import { ghostDescriptions } from './translations/descriptions/ghost';
import { dragonDescriptions } from './translations/descriptions/dragon';
import { steelDescriptions } from './translations/descriptions/steel';
import { darkDescriptions } from './translations/descriptions/dark';
import { fairyDescriptions } from './translations/descriptions/fairy';

export const STATUS_TRANSLATIONS = { ...statusTranslations };

export const MOVE_TRANSLATIONS: Record<string, string> = {
  ...normalMoves,
  ...fireMoves,
  ...waterMoves,
  ...grassMoves,
  ...electricMoves,
  ...iceMoves,
  ...fightingMoves,
  ...poisonMoves,
  ...groundMoves,
  ...flyingMoves,
  ...psychicMoves,
  ...bugMoves,
  ...rockMoves,
  ...ghostMoves,
  ...dragonMoves,
  ...steelMoves,
  ...darkMoves,
  ...fairyMoves,
  ...otherMoves
};

export const MOVE_DESCRIPTIONS: Record<string, string> = {
  ...normalDescriptions,
  ...fireDescriptions,
  ...waterDescriptions,
  ...grassDescriptions,
  ...electricDescriptions,
  ...iceDescriptions,
  ...fightingDescriptions,
  ...poisonDescriptions,
  ...groundDescriptions,
  ...flyingDescriptions,
  ...psychicDescriptions,
  ...bugDescriptions,
  ...rockDescriptions,
  ...ghostDescriptions,
  ...dragonDescriptions,
  ...steelDescriptions,
  ...darkDescriptions,
  ...fairyDescriptions
};
