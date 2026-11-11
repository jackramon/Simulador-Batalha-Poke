import { Pokemon, Move, BattleState } from '../../../../types';
import * as NeutralizingGas from './neutralizing_gas';

/**
 * Lógica para a habilidade Sal Purificador (Purifying Salt).
 * Regras Oficiais (Gen 9):
 * 1. O Pokémon é imune a condições de status não-voláteis.
 * 2. O dano recebido de movimentos do tipo Fantasma é reduzido pela metade (0.5x).
 */

export function isImmuneToStatus(pokemon: Pokemon, state?: BattleState): boolean {
    if (pokemon.ability !== 'purifying-salt' || pokemon.isFainted) {
        return false;
    }

    // Verifica se a habilidade está suprimida pelo Gás Neutralizante
    if (state && !NeutralizingGas.canAbilityTrigger(pokemon, state)) {
        return false;
    }

    return true;
}

export function getDamageMultiplier(defender: Pokemon, move: Move, ignoresAbilities: boolean, isGasActive: boolean): number {
    if (defender.ability !== 'purifying-salt' || defender.isFainted || ignoresAbilities) {
        return 1.0;
    }

    // Verifica supressão por Gás
    if (isGasActive) {
        return 1.0;
    }

    // Reduz dano de movimentos do tipo Fantasma pela metade
    if (move.type === 'ghost') {
        return 0.5;
    }

    return 1.0;
}
