
import { Move } from '../../../../types';

/**
 * Lógica para o movimento Desbastar (Chip Away) e similares (Sacred Sword, Darkest Lariat).
 * Regra Oficial: Ignora as mudanças de atributos do alvo (Defesa/Evasiva) ao calcular dano ou acerto.
 */

export function shouldIgnoreDefensiveStats(move: Move): boolean {
    return move.name === 'chip-away' || move.name === 'sacred-sword' || move.name === 'darkest-lariat';
}
