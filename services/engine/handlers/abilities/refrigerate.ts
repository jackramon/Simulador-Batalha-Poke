
import { Pokemon, Move } from '../../../../types';

/**
 * Lógica para a habilidade Refrigerar (Refrigerate).
 * Regras Oficiais (Gen 7+):
 * 1. Transforma movimentos do tipo Normal em movimentos do tipo Gelo.
 * 2. Aumenta o poder desses movimentos convertidos em 20% (1.2x).
 * 3. Não afeta movimentos da categoria Status.
 */

export function getEffectiveMoveType(attacker: Pokemon, move: Move): string {
    if (attacker.ability === 'refrigerate' && move.type === 'normal' && move.damageClass !== 'status') {
        return 'ice';
    }
    return move.type;
}

export function getPowerMultiplier(attacker: Pokemon, move: Move): number {
    if (attacker.ability === 'refrigerate' && move.type === 'normal' && move.damageClass !== 'status') {
        return 1.2;
    }
    return 1.0;
}

export function isBoostedByRefrigerate(attacker: Pokemon, move: Move): boolean {
    return attacker.ability === 'refrigerate' && move.type === 'normal' && move.damageClass !== 'status';
}
