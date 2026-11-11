
import { Pokemon, Move } from '../../../../types';

/**
 * Lógica para a habilidade Carga Rochosa (Rocky Payload).
 * Regra Oficial: Aumenta o poder de movimentos do tipo Pedra em 50% (1.5x).
 * É a habilidade assinatura do Bombirdier.
 */
export function getPowerMultiplier(attacker: Pokemon, move: Move): number {
    if (attacker.ability === 'rocky-payload' && move.type === 'rock') {
        return 1.5;
    }
    return 1.0;
}
