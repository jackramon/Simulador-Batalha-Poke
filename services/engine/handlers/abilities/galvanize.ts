import { Pokemon, Move } from '../../../../types';

/**
 * Lógica para a habilidade Galvanizar (Galvanize).
 * Regras Oficiais (Gen 7+):
 * 1. Transforma movimentos do tipo Normal em movimentos do tipo Elétrico.
 * 2. Aumenta o poder desses movimentos convertidos em 20% (1.2x).
 * 3. Não afeta movimentos da categoria Status.
 */

export function getEffectiveMoveType(attacker: Pokemon, move: Move): string {
    if (attacker.ability === 'galvanize' && move.type === 'normal' && move.damageClass !== 'status') {
        return 'electric';
    }
    return move.type;
}

export function getPowerMultiplier(attacker: Pokemon, move: Move): number {
    if (attacker.ability === 'galvanize' && move.type === 'normal' && move.damageClass !== 'status') {
        return 1.2;
    }
    return 1.0;
}

export function isBoostedByGalvanize(attacker: Pokemon, move: Move): boolean {
    return attacker.ability === 'galvanize' && move.type === 'normal' && move.damageClass !== 'status';
}
