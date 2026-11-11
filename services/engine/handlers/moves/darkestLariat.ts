import { Pokemon, Move, BattleState } from '../../../../types';

/**
 * Lógica para o movimento Lariat Sombrio (Darkest Lariat).
 * Tipo: Dark
 * Categoria: Physical
 * Poder: 85
 * Precisão: 100
 * Efeito: Ignora as mudanças de atributos do alvo (Defesa/Evasiva).
 * - A mecânica de ignorar atributos é tratada globalmente em chipAway.ts (shouldIgnoreDefensiveStats).
 * - Este handler apenas retorna o poder base para remover o badge de cálculo genérico.
 */
export function handleDarkestLariat(attacker: Pokemon, defender: Pokemon, move: Move, state?: BattleState): number {
    return move.power;
}
