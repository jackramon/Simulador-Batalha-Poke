
import { Pokemon, Move, BattleState, LogEntry } from '../../../types';
import { log } from '../utils';
import { getRawStat } from '../../battleUtils';
import { BATTLE_MESSAGES } from '../../../data/battleMessages';
import * as Truant from './abilities/truant';
import * as Steadfast from './abilities/steadfast';
import * as NeutralizingGas from './abilities/neutralizing_gas';
import * as EarlyBird from './abilities/early_bird';

export function checkStatusBlocking(
  attacker: Pokemon, 
  move: Move, 
  logs: LogEntry[], 
  state: BattleState,
  isSleepTalkTriggered: boolean = false
): boolean {
  // Returns true if the pokemon can move, false if blocked

  const isGasActive = state ? NeutralizingGas.isGasActive(state) : false;

  // Sky Drop: Se o Pokémon estiver sendo segurado no ar, não pode atacar
  if (attacker.statusEffects['sky-drop-target']) {
      log(logs, `${attacker.name} está sendo levado para o céu e não pode se mover!`, 'text-blue-500 italic');
      return false;
  }

  // Preguiça (Truant) Check modularizado
  if (Truant.shouldLoafAround(attacker, logs)) {
      return false;
  }

  if (attacker.isFlinched) {
    log(logs, `${attacker.name} recuou e não atacou!`, 'text-yellow-600');
    
    // Gatilho para Impassível (Steadfast)
    Steadfast.triggerSteadfast(attacker, state, logs);
    
    attacker.isFlinched = false;
    return false;
  }
  
  if (attacker.statusEffects.freeze) {
    if (Math.random() < 0.2 || (move.type === 'fire' || move.name === 'scald' || move.name === 'steam-eruption')) {
      delete attacker.statusEffects.freeze;
      log(logs, BATTLE_MESSAGES.THAWED(attacker.name), 'text-blue-500');
    } else {
      log(logs, BATTLE_MESSAGES.FROZEN_SOLID(attacker.name), 'text-blue-500');
      return false;
    }
  }

  if (attacker.statusEffects.sleep) {
    // Early Bird Integration: Incrementa 2 em vez de 1
    // NOTA: Se o movimento for disparado por Sleep Talk, não incrementamos contador, pois já foi feito na chamada principal.
    if (!isSleepTalkTriggered) {
        const increment = EarlyBird.getSleepIncrement(attacker, isGasActive);
        attacker.statusEffects.sleep.turns = (attacker.statusEffects.sleep.turns || 0) + increment;
        
        // Suporte para duração fixa (Rest) vs aleatória (Spore, Hypnosis)
        const sleepData = attacker.statusEffects.sleep as any;
        const threshold = sleepData.maxTurns ? sleepData.maxTurns : (Math.floor(Math.random() * 3) + 1);

        if (attacker.statusEffects.sleep.turns >= threshold) {
          delete attacker.statusEffects.sleep;
          log(logs, BATTLE_MESSAGES.WOKE_UP(attacker.name), 'text-blue-500 font-bold');
        } else {
           if (move.name !== 'snore' && move.name !== 'sleep-talk') {
            log(logs, BATTLE_MESSAGES.STILL_ASLEEP(attacker.name), 'text-blue-500');
            return false;
           }
        }
    } else {
        // Se foi disparado por Sleep Talk, permitimos a execução sem logar que está dormindo (pois é intencional)
    }
  }

  if (attacker.statusEffects.confusion) {
    if (Math.random() < 0.25) {
       delete attacker.statusEffects.confusion;
       log(logs, BATTLE_MESSAGES.CONFUSION_ENDED(attacker.name), 'text-yellow-600');
    } else {
      log(logs, BATTLE_MESSAGES.IS_CONFUSED(attacker.name), 'text-yellow-600');
      
      if (Math.random() < 0.5) {
         const attack = getRawStat(attacker, 'attack', state.weather);
         const defense = getRawStat(attacker, 'defense', state.weather);
         const level = 50;
         
         let confusionDmg = Math.floor(((2 * level / 5 + 2) * 40 * attack / defense) / 50 + 2);
         confusionDmg = Math.floor(confusionDmg * ((Math.random() * 0.15) + 0.85));
         confusionDmg = Math.max(1, confusionDmg);

         attacker.hp = Math.max(0, attacker.hp - confusionDmg);
         log(logs, BATTLE_MESSAGES.CONFUSION_SELF_HIT(confusionDmg), 'text-red-500 font-bold');
         
         if (attacker.hp === 0) {
           attacker.isFainted = true;
           log(logs, BATTLE_MESSAGES.FAINTED(attacker.name), 'text-red-900 font-bold');
         }
         return false;
      }
    }
  }

  if (attacker.statusEffects.paralysis && Math.random() < 0.25) {
    log(logs, BATTLE_MESSAGES.PARALYZED_CANT_MOVE(attacker.name), 'text-yellow-500');
    return false;
  }

  if (attacker.statusEffects.infatuation) {
    log(logs, BATTLE_MESSAGES.INFATUATED(attacker.name), 'text-pink-500');
    if (Math.random() < 0.5) {
        log(logs, BATTLE_MESSAGES.PARALYZED_BY_LOVE(attacker.name), 'text-pink-600 italic');
        return false;
    }
  }

  return true;
}
