
import { Pokemon, Move, BattleState } from '../../../../types';

/**
 * Lógica para o movimento Sobrecarga (Overdrive).
 * Tipo: Elétrico
 * Poder Base: 80
 * Categoria: Especial
 * Propriedade: Som (Sound-based). Afetado por Punk Rock (Boost) e Soundproof (Imunidade).
 * Essas propriedades são gerenciadas pelas listas de categorias e handlers de habilidade.
 * Este arquivo serve como ponto de entrada modular.
 */
export function handleOverdrive(attacker: Pokemon, defender: Pokemon, move: Move, state?: BattleState): number {
    return move.power;
}
