import { Pokemon, LogEntry, BattleState } from '../../../../types';
import { log } from '../../utils';
import { applyMoveStatChange } from './statChanges';
import { calculateStat } from '../statCalculator';
import * as NeutralizingGas from '../abilities/neutralizing_gas';
import * as ClearBody from '../abilities/clear_body';
import * as WhiteSmoke from '../abilities/white_smoke';
import * as FullMetalBody from '../abilities/full_metal_body';
import * as HyperCutter from '../abilities/hyper_cutter';
import * as FlowerVeil from '../abilities/flower_veil';
import * as Infiltrator from '../abilities/infiltrator';

/**
 * Lógica para o movimento Drenagem de Força (Strength Sap).
 * O usuário restaura seu HP na mesma quantidade que o Ataque efetivo do alvo,
 * e então reduz o Ataque do alvo em 1 estágio.
 * Se o Ataque do alvo já estiver em -6, o movimento falha.
 * Se o alvo for imune à redução de Ataque (Clear Body, Mist, etc), o movimento falha completamente (não cura).
 */
export function handleStrengthSap(
    attacker: Pokemon,
    defender: Pokemon,
    logs: LogEntry[],
    state?: BattleState
) {
    // 1. Verifica se o Ataque do alvo já está no mínimo (-6)
    if (defender.statStages.attack <= -6) {
        log(logs, `Mas falhou! O Ataque de ${defender.name} não pode diminuir mais!`, 'text-gray-500 italic');
        return;
    }

    const ignoresAbilities = ['mold-breaker', 'teravolt', 'turboblaze'].includes(attacker.ability);

    // 2. Verifica Imunidades (Mist, Habilidades)
    // Se não puder reduzir o status, a cura também falha.
    
    // Verifica Mist
    if (state) {
        const isP1 = state.currentPokemon1?.id === defender.id;
        const hazards = isP1 ? state.p1Hazards : state.p2Hazards;
        
        if (hazards.mist > 0) {
            if (!Infiltrator.canInfiltrate(attacker, state)) {
                log(logs, `A névoa protegeu ${defender.name} da Drenagem de Força!`, 'text-blue-300 italic text-xs');
                return;
            }
        }
    }

    // Verifica Habilidades (se não forem ignoradas)
    if (!ignoresAbilities) {
        if (ClearBody.isImmuneToStatDrops(defender, false) || 
            WhiteSmoke.isImmuneToStatDrops(defender, false) ||
            FullMetalBody.isImmuneToStatDrops(defender)) {
            log(logs, `${defender.name} impediu a Drenagem de Força com sua habilidade!`, 'text-gray-500 italic text-xs');
            return;
        }

        if (HyperCutter.isImmuneToAttackDrop(defender, false)) {
            log(logs, `O Hiper Cortador de ${defender.name} impediu a Drenagem de Força!`, 'text-gray-500 italic text-xs');
            return;
        }

        if (FlowerVeil.isImmuneToStatDrops(defender, false)) {
            log(logs, `O Véu de Flor protegeu ${defender.name}!`, 'text-gray-500 italic text-xs');
            return;
        }
    }

    // 3. Calcula o Ataque efetivo do alvo ANTES da redução
    const isGasActive = state ? NeutralizingGas.isGasActive(state) : false;
    const weather = state ? state.weather : 'none';
    const terrain = state ? state.terrain : 'none';
    
    // Calcula o stat de ataque do defensor (incluindo buffs/debuffs e habilidades)
    const targetAttack = calculateStat(defender, 'attack', weather, isGasActive, false, terrain);

    // 4. Restaura o HP do usuário
    if (attacker.hp < attacker.maxHP) {
        const healAmount = Math.floor(targetAttack);
        const oldHp = attacker.hp;
        attacker.hp = Math.min(attacker.maxHP, attacker.hp + healAmount);
        const actualHeal = attacker.hp - oldHp;
        
        log(logs, `${attacker.name} restaurou sua saúde!`, 'text-green-600 font-bold');
        log(logs, `(Recuperou ${actualHeal} HP)`, 'text-green-500 italic text-xs');
    } else {
        log(logs, `O HP de ${attacker.name} já está cheio!`, 'text-gray-500 italic');
    }

    // 5. Reduz o Ataque do alvo em 1 estágio
    // Nota: Já verificamos imunidades, então chamamos applyMoveStatChange sabendo que vai funcionar
    // (ou refletir/inverter, que é permitido).
    applyMoveStatChange(
        defender, 
        'attack-down', 
        logs, 
        true, // isOpponentSource
        ignoresAbilities, // ignoresAbilities
        'strength-sap', 
        state,
        attacker // source
    );
}
