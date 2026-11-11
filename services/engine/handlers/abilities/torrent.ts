
import { Pokemon, Move } from '../../../../types';

/**
 * Calcula o multiplicador de poder para a habilidade Torrente (Torrent).
 * Regra: Aumenta o poder de movimentos do tipo Água em 50% (1.5x) 
 * quando o HP do usuário está em 1/3 ou menos do seu máximo.
 */
export function getPowerMultiplier(attacker: Pokemon, move: Move): number {
    if (attacker.ability === 'torrent' && move.type === 'water' && attacker.hp <= attacker.maxHP / 3) {
        return 1.5;
    }
    return 1;
}
