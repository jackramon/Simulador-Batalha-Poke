import { Pokemon, Move } from '../../../../types';
import { HIGH_CRIT_MOVES } from '../../../../data/moves/categories';

/**
 * Lógica para o movimento Ordem de Ataque (Attack Order).
 * 
 * Mecânica:
 * - Movimento do tipo Inseto.
 * - Categoria Física.
 * - Poder: 90.
 * - Precisão: 100%.
 * - Efeito: Tem alta chance de acerto crítico (+1 estágio).
 * 
 * Implementação:
 * - A lógica de High Crit é tratada nativamente pelo sistema de dano através da lista HIGH_CRIT_MOVES
 *   em services/engine/handlers/abilities/critical.ts e data/moves/categories.ts.
 * - Este arquivo serve como documentação e ponto de extensão caso o movimento ganhe efeitos adicionais.
 */

export function isAttackOrder(move: Move): boolean {
    return move.name === 'attack-order';
}

export function getCritStageBonus(move: Move): number {
    if (isAttackOrder(move)) {
        return 1;
    }
    return 0;
}
