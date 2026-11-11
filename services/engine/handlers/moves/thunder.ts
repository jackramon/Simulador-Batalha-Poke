
import { Pokemon, Move, BattleState } from '../../../../types';

/**
 * Lógica para o movimento Trovão (Thunder).
 * Tipo: Elétrico
 * Poder: 110
 * Precisão: 70 (Base)
 * Efeitos:
 * 1. 30% de chance de paralisar (Gerenciado por efeitos secundários).
 * 2. Sob Chuva (Rain), nunca erra (Gerenciado em mechanics/accuracy.ts).
 * 3. Sob Sol (Sun), precisão cai para 50% (Gerenciado em mechanics/accuracy.ts).
 * 4. Atinge Pokémon voando (Fly/Bounce) (Gerenciado em moves/categories.ts).
 */
export function handleThunder(attacker: Pokemon, defender: Pokemon, move: Move, state?: BattleState): number {
    return move.power;
}
