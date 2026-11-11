import { Pokemon, Move } from '../../../../types';
import { SOUND_MOVES } from '../../../../data/moves';

/**
 * Lógica para a habilidade Voz Líquida (Liquid Voice).
 * Regra Oficial: Transforma todos os movimentos baseados em som em movimentos do tipo Água.
 * Diferente de habilidades como Refrigerar, não concede bônus de dano (1.2x).
 */

/**
 * Retorna o tipo modificado do golpe se o atacante possuir Voz Líquida e o golpe for de som.
 */
export function getModifiedType(attacker: Pokemon, move: Move): string {
    if (attacker.ability === 'liquid-voice' && SOUND_MOVES.includes(move.name)) {
        return 'water';
    }
    return move.type;
}

/**
 * Verifica se o movimento atual está sob o efeito da Voz Líquida.
 */
export function isApplied(attacker: Pokemon, move: Move): boolean {
    return attacker.ability === 'liquid-voice' && SOUND_MOVES.includes(move.name);
}
