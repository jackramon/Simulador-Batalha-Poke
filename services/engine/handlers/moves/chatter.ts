import { Pokemon, Move } from '../../../../types';

/**
 * Lógica para o movimento Tagarelice (Chatter).
 * 
 * Mecânica:
 * - Movimento do tipo Voador.
 * - Categoria Especial.
 * - Poder: 65.
 * - Precisão: 100%.
 * - Efeito: 100% de chance de confundir o alvo.
 * - É um movimento baseado em som (Sound Move).
 * 
 * Implementação:
 * - A confusão é tratada nativamente pelo sistema de efeitos secundários (secondaryEffectRouter)
 *   através da flag { status: 'confusion', chance: 100 } em data/moves/effects/flying.ts.
 * - Este arquivo serve como documentação e ponto de extensão.
 */

export function isChatter(move: Move): boolean {
    return move.name === 'chatter';
}
