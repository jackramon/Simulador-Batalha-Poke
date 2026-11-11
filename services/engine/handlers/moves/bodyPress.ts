import { Pokemon, Move, BattleState } from '../../../../types';

/**
 * Lógica para o movimento Prensa Corporal (Body Press).
 * Tipo: Fighting
 * Categoria: Physical
 * Poder: 80
 * Precisão: 100
 * Efeito: Usa a Defesa do usuário em vez do Ataque para calcular o dano.
 * - A mecânica de usar a Defesa já é tratada globalmente em damageUtils.ts.
 * - Este handler apenas retorna o poder base para remover o badge de cálculo genérico.
 */
export function handleBodyPress(attacker: Pokemon, defender: Pokemon, move: Move, state?: BattleState): number {
    return move.power;
}
