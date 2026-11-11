import { Pokemon, Move, BattleState } from '../../../../types';

/**
 * Lógica para o movimento Ovo Bomba (Egg Bomb).
 * Tipo: Normal
 * Categoria: Physical
 * Poder: 100
 * Precisão: 75
 * Efeito: Causa dano sem efeitos secundários.
 * - Este handler apenas retorna o poder base para remover o badge de cálculo genérico.
 */
export function handleEggBomb(attacker: Pokemon, defender: Pokemon, move: Move, state?: BattleState): number {
    return move.power;
}
