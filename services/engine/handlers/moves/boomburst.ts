import { Pokemon, Move, BattleState } from '../../../../types';

/**
 * Lógica para o movimento Explosão Sônica (Boomburst).
 * Tipo: Normal
 * Categoria: Especial
 * Poder: 140
 * Precisão: 100
 * Propriedade: Som (Sound-based).
 * - Ignora Substitutos.
 * - Afetado por Punk Rock (Aumenta dano causado / Reduz dano recebido).
 * - Bloqueado por Soundproof.
 * - Transformado em Água por Liquid Voice.
 * Todas as mecânicas de som são tratadas globalmente via categorias e handlers de habilidade.
 */
export function handleBoomburst(attacker: Pokemon, defender: Pokemon, move: Move, state?: BattleState): number {
    return move.power;
}
