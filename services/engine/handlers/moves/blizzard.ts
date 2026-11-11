
import { Pokemon, Move, BattleState } from '../../../../types';

/**
 * Lógica para o movimento Nevasca (Blizzard).
 * Tipo: Gelo
 * Poder: 110
 * Precisão: 70
 * Efeito:
 * 1. 10% de chance de congelar o alvo (Gerenciado por efeitos secundários).
 * 2. Sob Granizo/Neve (Hail), o movimento nunca erra (Gerenciado em mechanics/accuracy.ts).
 */
export function getBlizzardPower(attacker: Pokemon, basePower: number): number {
    // Retorna o poder base. A lógica de precisão climática reside em accuracy.ts
    return basePower;
}
