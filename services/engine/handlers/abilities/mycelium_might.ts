import { Pokemon, Move } from '../../../../types';

/**
 * Lógica para a habilidade Poder do Micélio (Mycelium Might).
 * Regra Oficial: Movimentos de status agem por último, mas ignoram as habilidades do oponente.
 */

/**
 * Retorna a prioridade modificada se a habilidade estiver ativa.
 */
export function getModifiedPriority(pokemon: Pokemon, move: Move, originalPriority: number): number {
    if (pokemon.ability === 'mycelium-might' && move.damageClass === 'status') {
        return -7; // Prioridade mínima oficial
    }
    return originalPriority;
}

/**
 * Verifica se a habilidade deve ignorar as habilidades do oponente.
 */
export function shouldIgnoreAbilities(pokemon: Pokemon, move: Move): boolean {
    return pokemon.ability === 'mycelium-might' && move.damageClass === 'status';
}
