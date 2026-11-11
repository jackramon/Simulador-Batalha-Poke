import { Pokemon } from '../../../../types';

/**
 * Lógica para o movimento Vingança (Payback).
 * Regra Oficial: O poder base dobra (50 -> 100) se o usuário se mover depois do alvo.
 */
export function getPaybackPower(defender: Pokemon, basePower: number): { power: number, isBoosted: boolean } {
    const isBoosted = !!defender.movedThisTurn;
    return {
        power: isBoosted ? basePower * 2 : basePower,
        isBoosted
    };
}
