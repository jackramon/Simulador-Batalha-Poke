import { Pokemon, BattleState } from '../../../../types';
import { log } from '../../utils';
import * as NeutralizingGas from './neutralizing_gas';

/**
 * Lógica para a habilidade Cão de Guarda (Guard Dog).
 * 1. Aumenta o Ataque em 1 estágio quando intimidado (em vez de diminuir).
 * 2. Impede que o Pokémon seja forçado a trocar de lugar por movimentos do oponente.
 */
export function isImmuneToForcedSwitch(
    defender: Pokemon, 
    attackerAbility: string | undefined, 
    state?: BattleState, 
    logs?: {message: string, color: string}[]
): boolean {
    if (defender.ability !== 'guard-dog' || defender.isFainted) {
        return false;
    }

    // Verifica se a habilidade está suprimida pelo Gás Neutralizante
    if (state && !NeutralizingGas.canAbilityTrigger(defender, state)) {
        return false;
    }

    // Quebra-molde ignora Cão de Guarda
    const ignoresAbilities = attackerAbility === 'mold-breaker' || 
                             attackerAbility === 'teravolt' || 
                             attackerAbility === 'turboblaze';
    
    if (ignoresAbilities) {
        return false;
    }

    if (logs) {
        log(logs, `${defender.name} se recusa a sair por causa de seu instinto de Cão de Guarda!`, 'text-indigo-600 font-bold italic');
    }
    
    return true;
}

export function handleIntimidate(
    pokemon: Pokemon,
    logs: {message: string, color: string}[]
): boolean {
    if (pokemon.ability !== 'guard-dog' || pokemon.isFainted) {
        return false;
    }

    if (pokemon.statStages.attack < 6) {
        pokemon.statStages.attack += 1;
        log(logs, `O Ataque de ${pokemon.name} aumentou devido ao seu instinto de Cão de Guarda!`, 'text-green-600 font-bold');
    } else {
        log(logs, `O Ataque de ${pokemon.name} não pode aumentar mais!`, 'text-gray-500');
    }

    return true;
}
