
import { Pokemon, BattleState } from '../../../../types';
import { log } from '../../utils';
import * as NeutralizingGas from './neutralizing_gas';

/**
 * Lógica para a habilidade Ventosas (Suction Cups).
 * Regra Oficial: Impede que o Pokémon seja forçado a trocar de lugar por movimentos do oponente.
 */
export function isImmuneToForcedSwitch(
    defender: Pokemon, 
    attackerAbility: string | undefined, 
    state?: BattleState, 
    logs?: {message: string, color: string}[]
): boolean {
    if (defender.ability !== 'suction-cups' || defender.isFainted) {
        return false;
    }

    // Verifica se a habilidade está suprimida pelo Gás Neutralizante
    if (state && !NeutralizingGas.canAbilityTrigger(defender, state)) {
        return false;
    }

    // Quebra-molde ignora Ventosas
    const ignoresAbilities = attackerAbility === 'mold-breaker' || 
                             attackerAbility === 'teravolt' || 
                             attackerAbility === 'turboblaze';
    
    if (ignoresAbilities) {
        return false;
    }

    if (logs) {
        log(logs, `${defender.name} se ancora firmemente com suas Ventosas!`, 'text-indigo-600 font-bold italic');
    }
    
    return true;
}
