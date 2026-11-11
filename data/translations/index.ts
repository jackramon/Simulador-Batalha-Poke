
import { statusTranslations } from './status';
import { normalMoves } from './normal';
import { fireMoves } from './fire';
import { waterMoves } from './water';
import { grassMoves } from './grass';
import { electricMoves } from './electric';
import { iceMoves } from './ice';
import { fightingMoves } from './fighting';
import { poisonMoves } from './poison';
import { groundMoves } from './ground';
import { flyingMoves } from './flying';
import { psychicMoves } from './psychic';
import { bugMoves } from './bug';
import { rockMoves } from './rock';
import { ghostMoves } from './ghost';
import { dragonMoves } from './dragon';
import { steelMoves } from './steel';
import { darkMoves } from './dark';
import { fairyMoves } from './fairy';
import { otherMoves } from './others';

// Import Descriptions
import { normalDescriptions } from './descriptions/normal';
import { fireDescriptions } from './descriptions/fire';
import { waterDescriptions } from './descriptions/water';
import { grassDescriptions } from './descriptions/grass';
import { electricDescriptions } from './descriptions/electric';
import { iceDescriptions } from './descriptions/ice';
import { fightingDescriptions } from './descriptions/fighting';
import { poisonDescriptions } from './descriptions/poison';
import { groundDescriptions } from './descriptions/ground';
import { flyingDescriptions } from './descriptions/flying';
import { psychicDescriptions } from './descriptions/psychic';
import { bugDescriptions } from './descriptions/bug';
import { rockDescriptions } from './descriptions/rock';
import { ghostDescriptions } from './descriptions/ghost';
import { dragonDescriptions } from './descriptions/dragon';
import { steelDescriptions } from './descriptions/steel';
import { darkDescriptions } from './descriptions/dark';
import { fairyDescriptions } from './descriptions/fairy';

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
