
import type { ItemData } from './types';
import { MEDICINE_ITEMS, BATTLE_ITEMS } from './consumables';
import { BERRY_ITEMS } from './berries';
import { HELD_ITEMS } from './held';
import { SPECIAL_ITEMS } from './special';
import { TYPE_ENHANCING_ITEMS } from './mappings';
import { MEGA_STONE_ITEMS, MEGA_STONES, POKEMON_TO_MEGA_STONES } from './megaStones';

export const ITEMS_DATA: Record<string, ItemData> = {
  ...MEDICINE_ITEMS,
  ...BATTLE_ITEMS,
  ...BERRY_ITEMS,
  ...HELD_ITEMS,
  ...SPECIAL_ITEMS,
  ...MEGA_STONE_ITEMS
};

export { TYPE_ENHANCING_ITEMS, MEGA_STONES, POKEMON_TO_MEGA_STONES };
export type { ItemData };
