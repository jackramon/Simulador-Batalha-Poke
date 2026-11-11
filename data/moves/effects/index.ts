import { statusOnlyEffects } from './status_only';
import { normalEffects } from './normal';
import { fireEffects } from './fire';
import { waterEffects } from './water';
import { grassEffects } from './grass';
import { electricEffects } from './electric';
import { iceEffects } from './ice';
import { fightingEffects } from './fighting';
import { poisonEffects } from './poison';
import { groundEffects } from './ground';
import { flyingEffects } from './flying';
import { psychicEffects } from './psychic';
import { bugEffects } from './bug';
import { rockEffects } from './rock';
import { ghostEffects } from './ghost';
import { dragonEffects } from './dragon';
import { steelEffects } from './steel';
import { darkEffects } from './dark';
import { fairyEffects } from './fairy';

export const MOVE_EFFECTS: Record<string, { status: string, chance: number }> = {
  ...statusOnlyEffects,
  ...normalEffects,
  ...fireEffects,
  ...waterEffects,
  ...grassEffects,
  ...electricEffects,
  ...iceEffects,
  ...fightingEffects,
  ...poisonEffects,
  ...groundEffects,
  ...flyingEffects,
  ...psychicEffects,
  ...bugEffects,
  ...rockEffects,
  ...ghostEffects,
  ...dragonEffects,
  ...steelEffects,
  ...darkEffects,
  ...fairyEffects,
};