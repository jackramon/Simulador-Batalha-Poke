
import { Pokemon, BattleState, StatStages, LogEntry } from '../../types';
import { ITEMS_DATA } from '../../data/items';
import { STAT_NAMES_PT } from '../../data/pokemon';
import { log } from '../engine/utils';
import * as Klutz from '../engine/handlers/abilities/klutz';
import * as Unnerve from '../engine/handlers/abilities/unnerve';
import * as CheekPouch from '../engine/handlers/abilities/cheek_pouch';
import * as CudChew from '../engine/handlers/abilities/cud_chew';
import * as Unburden from '../engine/handlers/abilities/unburden';
import * as Symbiosis from '../engine/handlers/abilities/symbiosis';
import * as Gluttony from '../engine/handlers/abilities/gluttony';
import * as Ripen from '../engine/handlers/abilities/ripen';

// Mapa de Frutas de Estatística (Pinch Berries)
const STAT_BERRIES: Record<string, keyof StatStages> = {
  'liechi-berry': 'attack',
  'ganlon-berry': 'defense',
  'petaya-berry': 'spAttack',
  'apicot-berry': 'spDefense',
  'salac-berry': 'speed',
  'micle-berry': 'accuracy'
};

export const checkConsumableItems = (pokemon: Pokemon, logs: LogEntry[], state?: BattleState): boolean => {
  if (pokemon.isFainted) return false;
  
  if (Klutz.isItemSuppressed(pokemon, state)) return false;

  const item = pokemon.heldItem;
  if (!item) return false;

  // Unnerve check logic if opponent has it
  if (Unnerve.isOpponentUnnerved(pokemon, state) && ITEMS_DATA[item]?.category === 'berry') {
      return false;
  }

  let consumed = false;
  const itemName = ITEMS_DATA[item]?.name || item;

  // Sitrus Berry
  if (item === 'sitrus-berry') {
      const threshold = 0.5; // Always 50%
      if (pokemon.hp <= pokemon.maxHP * threshold) {
          const ripenMult = Ripen.getBerryMultiplier(pokemon, state);
          const healAmount = Math.floor(pokemon.maxHP * 0.25 * ripenMult);
          pokemon.hp = Math.min(pokemon.maxHP, pokemon.hp + healAmount);
          log(logs, `${pokemon.name} comeu sua ${itemName} e recuperou vida!`, 'text-green-600 font-bold');
          consumed = true;
      }
  }
  // Pinch Healing Berries (Figy, Wiki, etc)
  else if (['figy-berry', 'wiki-berry', 'mago-berry', 'aguav-berry', 'iapapa-berry'].includes(item)) {
      const threshold = Gluttony.getActivationThreshold(pokemon, item, state);
      if (pokemon.hp <= pokemon.maxHP * threshold) {
          const ripenMult = Ripen.getBerryMultiplier(pokemon, state);
          const healAmount = Math.floor(pokemon.maxHP * 0.33 * ripenMult);
          pokemon.hp = Math.min(pokemon.maxHP, pokemon.hp + healAmount);
          log(logs, `${pokemon.name} comeu sua ${itemName} e recuperou vida!`, 'text-green-600 font-bold');
          consumed = true;
      }
  }
  // Oran Berry
  else if (item === 'oran-berry') {
      if (pokemon.hp <= pokemon.maxHP / 2) {
          const ripenMult = Ripen.getBerryMultiplier(pokemon, state);
          const healAmount = 10 * ripenMult;
          pokemon.hp = Math.min(pokemon.maxHP, pokemon.hp + healAmount);
          log(logs, `${pokemon.name} comeu sua ${itemName} e recuperou ${healAmount} PV!`, 'text-green-600 font-bold');
          consumed = true;
      }
  }
  // Lum Berry (Status condition)
  else if (item === 'lum-berry') {
      // FIX CRÍTICO: Não limpar pokemon.statusEffects = {}
      // Isso apagava status internos como 'disguise-busted', criando um loop infinito.
      const curableStatuses = ['burn', 'paralysis', 'poison', 'toxic', 'sleep', 'freeze', 'confusion'];
      const hasCurableStatus = Object.keys(pokemon.statusEffects).some(s => curableStatuses.includes(s));
      
      if (hasCurableStatus) {
          curableStatuses.forEach(s => {
              if (pokemon.statusEffects[s]) delete pokemon.statusEffects[s];
          });
          log(logs, `${pokemon.name} comeu sua ${itemName} e curou seus status!`, 'text-blue-500 font-bold');
          consumed = true;
      }
  }
  // Stat Boosting Berries (Liechi, Ganlon, etc)
  else if (STAT_BERRIES[item]) {
      const threshold = Gluttony.getActivationThreshold(pokemon, item, state);
      if (pokemon.hp <= pokemon.maxHP * threshold) {
          const stat = STAT_BERRIES[item];
          if (pokemon.statStages[stat] < 6) {
              const ripenMult = Ripen.getBerryMultiplier(pokemon, state);
              const stages = 1 * ripenMult;
              
              pokemon.statStages[stat] = Math.min(6, pokemon.statStages[stat] + stages);
              const statName = STAT_NAMES_PT[stat];
              log(logs, `${pokemon.name} comeu sua ${itemName} e aumentou seu ${statName}!`, 'text-green-600 font-bold');
              consumed = true;
          }
      }
  }
  // White Herb
  else if (item === 'white-herb') {
      let restored = false;
      (Object.keys(pokemon.statStages) as (keyof StatStages)[]).forEach(stat => {
          if (pokemon.statStages[stat] < 0) {
              pokemon.statStages[stat] = 0;
              restored = true;
          }
      });
      if (restored) {
          log(logs, `${pokemon.name} usou sua ${itemName} para restaurar atributos!`, 'text-green-600');
          consumed = true;
      }
  }
  // Mental Herb
  else if (item === 'mental-herb') {
      if (pokemon.statusEffects.infatuation || pokemon.statusEffects.taunt || pokemon.statusEffects.torment || pokemon.statusEffects.encore || pokemon.statusEffects.disable || pokemon.statusEffects['heal-block']) {
          delete pokemon.statusEffects.infatuation;
          delete pokemon.statusEffects.taunt;
          delete pokemon.statusEffects.torment;
          delete pokemon.statusEffects.encore;
          delete pokemon.statusEffects.disable;
          delete pokemon.statusEffects['heal-block'];
          log(logs, `${pokemon.name} usou sua ${itemName} para curar condições mentais!`, 'text-blue-500');
          consumed = true;
      }
  }

  if (consumed) {
      pokemon.heldItem = null;
      pokemon.consumedItem = item;
      
      // Trigger Unburden
      Unburden.triggerUnburden(pokemon, logs as any);
      
      // Trigger Cheek Pouch
      if (ITEMS_DATA[item]?.category === 'berry') {
          CheekPouch.handleCheekPouch(pokemon, logs as any);
          CudChew.setupCudChew(pokemon, item, state);
      }
      
      // Trigger Symbiosis on ally (pass item)
      Symbiosis.handleSymbiosis(pokemon, logs as any, state);
      
      return true;
  }

  return false;
};
