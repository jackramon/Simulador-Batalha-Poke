
import { Pokemon, Move, StatStages, BattleState, LogEntry } from '../../../../types';
import { isContactMove } from '../../../battleUtils';
import { ABILITY_EFFECTS } from '../../../../data/abilities';
import { STAT_NAMES_PT } from '../../../../data/pokemon';
import { log } from '../../utils';
import * as InnardsOut from './innards_out';
import * as Damp from './damp';
import * as FellStinger from '../moves/fellStinger';
import * as Grudge from '../moves/grudge';
import * as AsOneSpectrier from './as_one_spectrier';
import * as BattleBond from './battle_bond';

export function handleKnockoutAbilities(attacker: Pokemon, defender: Pokemon, move: Move, logs: LogEntry[], defenderInitialHp: number = 0, state?: BattleState) {
    // --- GATILHO DE MOVIMENTO: Rancor (Grudge) ---
    // Se o defensor (quem desmaiou) tinha Grudge ativo, drena o PP do movimento do atacante.
    Grudge.handleGrudgeTrigger(defender, attacker, move, logs);

    // --- GATILHO DE MOVIMENTO: Laço do Destino (Destiny Bond) ---
    // Verifica antes das habilidades, pois é um efeito de status primário de nocaute.
    // O atacante deve estar vivo para ser levado.
    if (defender.statusEffects['destiny-bond'] && !attacker.isFainted) {
        log(logs, `${defender.name} levou ${attacker.name} consigo pelo Laço do Destino!`, 'text-purple-900 font-black');
        attacker.hp = 0;
        attacker.isFainted = true;
    }

    if (!attacker.isFainted) {
        // Moxie / Chilling Neigh / As One (Glastrier - TODO: Mover para handler específico se criado)
        if (attacker.ability === 'moxie' || attacker.ability === 'chilling-neigh' || attacker.ability === 'as-one-glastrier') {
             if (attacker.statStages.attack < 6) {
                 attacker.statStages.attack++;
                 const abilityName = ABILITY_EFFECTS[attacker.ability]?.name || attacker.ability;
                 log(logs, `${attacker.name} aumentou seu Ataque devido a ${abilityName}!`, 'text-green-600');
             }
        }
        
        // Grim Neigh / Soul-Heart / As One (Spectrier)
        // Soul-Heart ativa para QUALQUER desmaio, não só os causados pelo usuário,
        // mas no 1v1 simplificado, geralmente é o atacante quem nocauteia.
        if (attacker.ability === 'soul-heart') {
             if (attacker.statStages.spAttack < 6) {
                 attacker.statStages.spAttack++;
                 log(logs, `${attacker.name} aumentou seu Atq. Especial devido a Coração de Alma!`, 'text-green-600');
             }
        } else {
            // Grim Neigh e As One (Spectrier) exigem que o usuário cause o nocaute
            AsOneSpectrier.checkGrimNeighBoost(attacker, logs);
        }

        // Battle Bond (Laço de Batalha)
        BattleBond.handleBattleBond(attacker, logs);

        // Beast Boost (Ultra Impulso)
        if (attacker.ability === 'beast-boost') {
            const stats = [
                { key: 'attack', val: attacker.attackStat },
                { key: 'defense', val: attacker.defenseStat },
                { key: 'spAttack', val: attacker.spAttackStat },
                { key: 'spDefense', val: attacker.spDefenseStat },
                { key: 'speed', val: attacker.speedStat }
            ];
            stats.sort((a, b) => b.val - a.val);
            const highestStatKey = stats[0].key as keyof StatStages;
            
            if (attacker.statStages[highestStatKey] < 6) {
                attacker.statStages[highestStatKey]++;
                log(logs, `O Ultra Impulso de ${attacker.name} aumentou seu ${STAT_NAMES_PT[highestStatKey]}!`, 'text-indigo-600 font-bold');
            }
        }

        // Verifica efeito do Ferrão Mortal
        FellStinger.handleFellStinger(attacker, move, logs);
    }
    
    // Innards Out (Entranhas de Fora)
    if (defender.ability === 'innards-out' && defenderInitialHp > 0) {
        InnardsOut.handleInnardsOut(attacker, defender, defenderInitialHp, logs);
    }

    // Detonação (Aftermath)
    if (defender.ability === 'aftermath' && !attacker.isFainted) {
        // Bloqueio por Umidade (Damp)
        if (Damp.isDampActive(state)) {
            log(logs, `A habilidade Umidade impediu a Detonação de ${defender.name}!`, 'text-blue-500 italic text-xs');
            return;
        }

        if (isContactMove(move) && attacker.ability !== 'magic-guard') {
            const recoil = Math.floor(attacker.maxHP / 4);
            attacker.hp = Math.max(0, attacker.hp - recoil);
            log(logs, `Detonação! ${defender.name} causou dano ao sair!`, 'text-red-600 font-bold');
            
            if (attacker.hp === 0) {
                attacker.isFainted = true;
            }
        }
    }
}
