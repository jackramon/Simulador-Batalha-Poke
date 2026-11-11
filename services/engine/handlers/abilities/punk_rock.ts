import { Pokemon, Move } from '../../../../types';
import { SOUND_MOVES } from '../../../../data/moves';

/**
 * Lógica para a habilidade Punk Rock.
 * Regras Oficiais:
 * 1. Aumenta o poder de movimentos baseados em som usados pelo Pokémon em 30% (1.3x).
 * 2. Reduz o dano recebido de movimentos baseados em som em 50% (0.5x).
 */

export function getPowerMultiplier(attacker: Pokemon, move: Move): number {
    if (attacker.ability === 'punk-rock' && SOUND_MOVES.includes(move.name)) {
        return 1.3;
    }
    return 1.0;
}

export function getDefensiveMultiplier(defender: Pokemon, move: Move, ignoresAbilities: boolean): number {
    if (defender.ability === 'punk-rock' && !ignoresAbilities && SOUND_MOVES.includes(move.name)) {
        return 0.5;
    }
    return 1.0;
}

export function isSoundMove(move: Move): boolean {
    return SOUND_MOVES.includes(move.name);
}
