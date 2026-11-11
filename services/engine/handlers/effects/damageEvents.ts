
import { Pokemon, Move, BattleState, LogEntry } from '../../../../types';
import { DRAIN_MOVES } from '../../../../data/moves';
import { log } from '../../utils';
import { BATTLE_MESSAGES } from '../../../../data/battleMessages';
import { ABILITY_EFFECTS } from '../../../../data/abilities';
import { checkConsumableItems } from '../../../handlers/items';
import * as Klutz from '../abilities/klutz';
import * as LiquidOoze from '../abilities/liquid_ooze';
import * as StormDrain from '../abilities/storm_drain';
import * as FlashFire from '../abilities/flash_fire';
import * as SapSipper from '../abilities/sap_sipper';
import * as MotorDrive from '../abilities/motor_drive';
import * as LightningRod from '../abilities/lightning_rod';
import * as WindRider from '../abilities/wind_rider';
import * as SheerForce from '../abilities/sheer_force';
import * as MindBlown from '../moves/mindBlown';
import * as SteelBeam from '../moves/steelBeam';
import * as Chloroblast from '../moves/chloroblast';

export function handleRecoil(attacker: Pokemon, move: Move, damage: number, hitIndex: number, logs: LogEntry[], state?: BattleState) {
    if (move.name === 'struggle') {
        const recoil = Math.floor(attacker.maxHP * 0.25);
        attacker.hp = Math.max(0, attacker.hp - recoil);
        if (hitIndex === 0) log(logs, BATTLE_MESSAGES.STRUGGLE_RECOIL(attacker.name, recoil), 'text-red-500 font-bold');
        checkConsumableItems(attacker, logs, state);
        return;
    }

    // Magic Guard previne todo tipo de dano de recuo (exceto Struggle, tratado acima)
    if (attacker.ability === 'magic-guard') return;

    // Rock Head previne apenas recuo baseado em dano causado (ex: Flare Blitz, Head Smash)
    // NÃO previne recuo fixo de HP (Steel Beam, Mind Blown)
    const hasRockHead = attacker.ability === 'rock-head';

    // Recuo baseado no dano causado (ex: Flare Blitz)
    if (move.recoilType === 'damage' && move.recoilValue) {
       if (hasRockHead) return; // Rock Head previne aqui

       const recoil = Math.floor(damage * move.recoilValue);
       attacker.hp = Math.max(0, attacker.hp - recoil);
       if (hitIndex === 0) log(logs, BATTLE_MESSAGES.RECOIL_DAMAGE(attacker.name, recoil), 'text-red-500');
       checkConsumableItems(attacker, logs, state);
    }

    // Recuo baseado no HP Máximo (ex: Mind Blown, Steel Beam, Chloroblast)
    // Rock Head NÃO previne isso.
    if (move.recoilType === 'max-hp' && move.recoilValue) {
        if (hitIndex === 0) {
            if (move.name === 'mind-blown') {
                MindBlown.handleMindBlownRecoil(attacker, logs, state);
            } else if (move.name === 'steel-beam') {
                SteelBeam.handleSteelBeamRecoil(attacker, logs, state);
            } else if (move.name === 'chloroblast') {
                Chloroblast.handleChloroblastRecoil(attacker, logs, state);
            } else {
                // Lógica genérica fallback
                const recoil = Math.floor(attacker.maxHP * move.recoilValue);
                attacker.hp = Math.max(0, attacker.hp - recoil);
                log(logs, BATTLE_MESSAGES.SACRIFICE_RECOIL(attacker.name, recoil), 'text-red-600');
                checkConsumableItems(attacker, logs, state);
            }
        }
    }
}

export function handleDrain(attacker: Pokemon, defender: Pokemon, move: Move, damage: number, hitIndex: number, logs: LogEntry[]) {
    if (DRAIN_MOVES[move.name]) {
      let healAmount = Math.floor(damage * DRAIN_MOVES[move.name]);
      
      if (attacker.heldItem === 'big-root' && !Klutz.isItemSuppressed(attacker)) {
          healAmount = Math.floor(healAmount * 1.3);
          if (hitIndex === 0) {
              log(logs, `${attacker.name} absorveu mais energia com a Raiz Grande!`, 'text-green-600 font-bold italic text-xs');
          }
      }

      if (defender.ability === 'liquid-ooze') {
          LiquidOoze.handleLiquidOozeDamage(attacker, defender, healAmount, logs);
      } else {
          if (damage > 0 && healAmount < 1) healAmount = 1;
          
          attacker.hp = Math.min(attacker.maxHP, attacker.hp + healAmount);
          if (hitIndex === 0) log(logs, BATTLE_MESSAGES.DRAIN_HEAL(attacker.name, healAmount), 'text-green-500');
      }
    }
}

export function handleLifeOrbRecoil(attacker: Pokemon, move: Move, logs: LogEntry[]) {
    // Se a Força Bruta ativar para o movimento, o recuo da Life Orb é anulado
    if (SheerForce.isMoveBoosted(move) && attacker.ability === 'sheer-force') return;
    
    if (attacker.ability === 'magic-guard') return;
    if (Klutz.isItemSuppressed(attacker)) return;

    if (attacker.heldItem === 'life-orb') {
       const loDmg = Math.floor(attacker.maxHP * 0.1);
       attacker.hp = Math.max(0, attacker.hp - loDmg);
       log(logs, BATTLE_MESSAGES.LIFE_ORB_RECOIL(attacker.name), 'text-red-500');
    }
}

export function handleImmunityAbility(defender: Pokemon, immunityType: string, logs: LogEntry[]) {
    if (defender.isFainted) return;
    const abilityName = ABILITY_EFFECTS[defender.ability]?.name || defender.ability;
    
    if (immunityType === 'storm-drain') {
        StormDrain.triggerStormDrainBoost(defender, logs);
        return;
    }
    if (immunityType === 'flash-fire') {
        FlashFire.activateFlashFire(defender, logs);
        return;
    }
    if (immunityType === 'sap-sipper') {
        SapSipper.triggerSapSipperBoost(defender, logs);
        return;
    }
    if (immunityType === 'motor-drive') {
        MotorDrive.triggerMotorDriveBoost(defender, logs);
        return;
    }
    if (immunityType === 'lightning-rod') {
        LightningRod.triggerLightningRodBoost(defender, logs);
        return;
    }
    if (immunityType === 'wind-rider') {
        WindRider.triggerWindRiderBoost(defender, logs);
        return;
    }

    if (['water-absorb', 'volt-absorb', 'earth-eater', 'dry-skin'].includes(immunityType)) {
        defender.hp = Math.min(defender.maxHP, defender.hp + Math.floor(defender.maxHP/4));
        log(logs, `${defender.name} absorveu o ataque com ${abilityName} e recuperou vida!`, 'text-green-600 font-bold');
    } else {
        log(logs, `${defender.name} é imune devido a ${abilityName}!`, 'text-gray-500 italic');
    }
}
