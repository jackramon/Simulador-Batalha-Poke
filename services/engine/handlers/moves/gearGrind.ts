import { Pokemon } from '../../../../types';

/**
 * Lógica para o movimento Engrenagem Moedora (Gear Grind).
 * Movimento físico do tipo Aço que atinge exatamente 2 vezes.
 * Poder Base: 50 (por acerto).
 * A quantidade de acertos é gerenciada por MULTI_HIT_MOVES em data/moves/categories.ts.
 */
export function getGearGrindPower(attacker: Pokemon, basePower: number): number {
    return basePower;
}
