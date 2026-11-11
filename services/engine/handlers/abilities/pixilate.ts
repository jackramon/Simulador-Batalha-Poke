import { Pokemon, Move } from '../../../../types';

/**
 * Lógica para a habilidade Pele de Fada (Pixilate).
 * Regras Oficiais (Gen 7+):
 * 1. Transforma movimentos do tipo Normal em movimentos do tipo Fada.
 * 2. Aumenta o poder desses movimentos convertidos em 20% (1.2x).
 * 3. Não afeta movimentos da categoria Status.
 */

export function getEffectiveMoveType(attacker: Pokemon, move: Move): string {
    if (attacker.ability === 'pixilate' && move.type === 'normal' && move.damageClass !== 'status') {
        return 'fairy';
    }
    return move.type;
}

export function getPowerMultiplier(attacker: Pokemon, move: Move): number {
    if (attacker.ability === 'pixilate' && move.type === 'normal' && move.damageClass !== 'status') {
        return 1.2;
    }
    return 1.0;
}

export function isBoostedByPixilate(attacker: Pokemon, move: Move): boolean {
    return attacker.ability === 'pixilate' && move.type === 'normal' && move.damageClass !== 'status';
}
