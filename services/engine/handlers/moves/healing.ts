
import { Pokemon, Move, BattleState, LogEntry } from '../../../../types';
import { DRAIN_MOVES } from '../../../../data/moves';
import { log } from '../../utils';
import { BATTLE_MESSAGES } from '../../../../data/battleMessages';
import * as Klutz from '../abilities/klutz';
import * as LiquidOoze from '../abilities/liquid_ooze';
import * as AirLock from '../abilities/air_lock';
import * as PsychicNoise from './psychicNoise';

export function handleHealingMove(
    pokemon: Pokemon, 
    move: Move, 
    logs: LogEntry[],
    state?: BattleState
) {
    const healingMoves = [
        'recover', 'roost', 'slack-off', 'soft-boiled', 'milk-drink', 
        'morning-sun', 'synthesis', 'shore-up', 'heal-order', 'moonlight'
    ];

    if (healingMoves.includes(move.name)) {
        // Efeito Secundário de ROOST (Pouso)
        // Adiciona o status 'roosting' para remover tipo Voador até o final do turno
        if (move.name === 'roost') {
            pokemon.statusEffects['roosting'] = { turns: 1 };
        }

        // Verifica bloqueio por Ruído Psíquico / Heal Block
        if (PsychicNoise.isHealBlocked(pokemon)) {
            log(logs, BATTLE_MESSAGES.HEAL_BLOCK_PREVENT(pokemon.name), 'text-gray-500 italic');
            return;
        }

        let healRatio = 0.5; // Padrão: 50%

        const isWeatherSuppressed = AirLock.isWeatherSuppressed(state);
        const weather = isWeatherSuppressed ? 'none' : (state?.weather || 'none');

        // Lógica climática para Síntese, Luar e Sol da Manhã (Sol)
        if (['synthesis', 'morning-sun', 'moonlight'].includes(move.name)) {
            if (weather === 'sun') {
                healRatio = 2 / 3; // ~66.6%
            } else if (weather !== 'none') {
                // Chuva, Areia ou Granizo reduzem a cura
                healRatio = 0.25; // 25%
            }
        }

        // Lógica climática para Shore Up (Reforçar) - Areia
        if (move.name === 'shore-up') {
            if (weather === 'sand') {
                healRatio = 2 / 3; // ~66.6%
            }
        }

        const healAmount = Math.floor(pokemon.maxHP * healRatio);
        const actualHeal = Math.min(pokemon.maxHP - pokemon.hp, healAmount);

        if (actualHeal > 0 || pokemon.hp < pokemon.maxHP) {
            pokemon.hp += actualHeal;
            log(logs, `${pokemon.name} recuperou vida!`, 'text-green-600');
        } else {
            log(logs, `O HP de ${pokemon.name} já está cheio!`, 'text-gray-500 italic');
        }
    }
}

export function handleRecoil(attacker: Pokemon, move: Move, damage: number, hitIndex: number, logs: LogEntry[]) {
    if (move.name === 'struggle') {
        const recoil = Math.floor(attacker.maxHP * 0.25);
        attacker.hp = Math.max(0, attacker.hp - recoil);
        if (hitIndex === 0) log(logs, BATTLE_MESSAGES.STRUGGLE_RECOIL(attacker.name, recoil), 'text-red-500 font-bold');
        return;
    }

    if ((attacker.ability === 'rock-head' || attacker.ability === 'magic-guard')) return;

    if (move.recoilType === 'damage' && move.recoilValue) {
       const recoil = Math.floor(damage * move.recoilValue);
       attacker.hp = Math.max(0, attacker.hp - recoil);
       if (hitIndex === 0) log(logs, BATTLE_MESSAGES.RECOIL_DAMAGE(attacker.name, recoil), 'text-red-500');
    }

    if (move.recoilType === 'max-hp' && move.recoilValue) {
        const recoil = Math.floor(attacker.maxHP * move.recoilValue);
        attacker.hp = Math.max(0, attacker.hp - recoil);
        if (hitIndex === 0) log(logs, BATTLE_MESSAGES.SACRIFICE_RECOIL(attacker.name, recoil), 'text-red-600');
    }
}

export function handleDrain(attacker: Pokemon, defender: Pokemon, move: Move, damage: number, hitIndex: number, logs: LogEntry[]) {
    if (DRAIN_MOVES[move.name]) {
      // Heal Block também impede drenagem de cura (o dano ainda ocorre, mas a cura não)
      if (PsychicNoise.isHealBlocked(attacker)) {
          return;
      }

      let healAmount = Math.floor(damage * DRAIN_MOVES[move.name]);
      
      // Item: Raiz Grande (Big Root) aumenta a cura em 30%
      if (attacker.heldItem === 'big-root' && !Klutz.isItemSuppressed(attacker)) {
          healAmount = Math.floor(healAmount * 1.3);
      }

      if (defender.ability === 'liquid-ooze') {
          LiquidOoze.handleLiquidOozeDamage(attacker, defender, healAmount, logs);
      } else {
          // Garante que cure pelo menos 1 de HP se o dano for > 0
          if (damage > 0 && healAmount < 1) healAmount = 1;
          
          attacker.hp = Math.min(attacker.maxHP, attacker.hp + healAmount);
          if (hitIndex === 0) log(logs, BATTLE_MESSAGES.DRAIN_HEAL(attacker.name, healAmount), 'text-green-500');
      }
    }
}

export function handleLifeOrbRecoil(attacker: Pokemon, move: Move, logs: LogEntry[]) {
    if (attacker.ability === 'sheer-force' && move.effect && move.damageClass !== 'status') return;
    if (attacker.ability === 'magic-guard') return;
    
    if (Klutz.isItemSuppressed(attacker)) return;

    if (attacker.heldItem === 'life-orb') {
       const loDmg = Math.floor(attacker.maxHP * 0.1);
       attacker.hp = Math.max(0, attacker.hp - loDmg);
       log(logs, BATTLE_MESSAGES.LIFE_ORB_RECOIL(attacker.name), 'text-red-500');
    }
}
