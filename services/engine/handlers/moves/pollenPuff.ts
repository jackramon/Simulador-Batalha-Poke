
import { Pokemon } from '../../../../types';

/**
 * Lógica para o movimento Bola de Pólen (Pollen Puff).
 * Mecânica:
 * - Se o alvo for um inimigo, causa dano (handled pelo motor padrão).
 * - Se o alvo for um aliado, cura 50% do HP máximo do alvo.
 * 
 * Contexto Atual (1v1): O alvo é sempre o inimigo, então o movimento funciona como ataque.
 * Esta função prepara a base para verificar o relacionamento entre usuário e alvo.
 */

export function isAllyTarget(attacker: Pokemon, target: Pokemon): boolean {
    // Em um sistema futuro com times/duplas, verificaríamos se attacker e target têm o mesmo owner.
    // No sistema atual 1v1, o target é sempre o oponente.
    return false;
}

// Futura função de cura para ally target
export function getHealAmount(target: Pokemon): number {
    return Math.floor(target.maxHP * 0.5);
}
