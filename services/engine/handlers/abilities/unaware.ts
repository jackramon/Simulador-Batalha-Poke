
import { Pokemon, BattleState } from '../../../../types';
import * as NeutralizingGas from './neutralizing_gas';
import * as MoldBreaker from './mold_breaker';

/**
 * Lógica para a habilidade Desatento (Unaware).
 * Regra Oficial: Ignora as mudanças de atributos do oponente.
 * - Ao atacar: Ignora Evasiva e Defesas do alvo.
 * - Ao defender: Ignora Precisão e Ataques do atacante.
 */

export function shouldIgnoreOpponentAttackStages(defender: Pokemon, attackerAbility: string, isGasActive: boolean): boolean {
    if (defender.ability !== 'unaware' || defender.isFainted) return false;
    if (isGasActive) return false;
    
    // Mold Breaker ignora o Unaware do defensor (Unaware é defensivo aqui)
    if (MoldBreaker.suppressesAbilities(attackerAbility)) return false;

    return true;
}

export function shouldIgnoreOpponentDefenseStages(attacker: Pokemon, isGasActive: boolean): boolean {
    if (attacker.ability !== 'unaware' || attacker.isFainted) return false;
    if (isGasActive) return false;
    
    // Unaware do atacante NÃO é ignorado pelo Mold Breaker do oponente 
    // (pois Unaware é usado ofensivamente aqui para ignorar buffs do alvo)
    return true;
}
