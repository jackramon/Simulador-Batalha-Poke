
import { Pokemon, Move, BattleState } from '../../../../types';

/**
 * Lógica para o movimento Mega Chute (Mega Kick).
 * Movimento físico do tipo Normal com 120 de poder base.
 * Precisão baixa (75%).
 * Faz contato.
 */
export function handleMegaKick(attacker: Pokemon, defender: Pokemon, move: Move, state?: BattleState): number {
    // Mega Kick é um movimento de alto dano sem efeitos secundários.
    // O retorno é o poder base, permitindo que o pipeline padrão processe o dano.
    return move.power;
}
