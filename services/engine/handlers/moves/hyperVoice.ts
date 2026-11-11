
import { Pokemon, Move, BattleState } from '../../../../types';

/**
 * Lógica para o movimento Hiper Voz (Hyper Voice).
 * Tipo: Normal
 * Categoria: Especial
 * Poder: 90
 * Precisão: 100
 * Propriedade: Som (Sound-based).
 * - Ignora Substitutos.
 * - Afetado por Punk Rock (Aumenta dano causado / Reduz dano recebido).
 * - Bloqueado por Soundproof.
 * - Transformado em Água por Liquid Voice.
 * Todas as mecânicas de som são tratadas globalmente via categorias e handlers de habilidade.
 */
export function handleHyperVoice(attacker: Pokemon, defender: Pokemon, move: Move, state?: BattleState): number {
    return move.power;
}
