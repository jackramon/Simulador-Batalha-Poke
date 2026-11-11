
import { Pokemon, Move } from '../../../../types';

/**
 * Calcula o multiplicador de poder para a habilidade Supercrescimento (Overgrow).
 * Regra: Aumenta o poder de movimentos do tipo Grama em 50% (1.5x) 
 * quando o HP do usuário está em 1/3 ou menos do seu máximo.
 */
export function getPowerMultiplier(attacker: Pokemon, move: Move): number {
    if (attacker.ability === 'overgrow' && move.type === 'grass' && attacker.hp <= attacker.maxHP / 3) {
        return 1.5;
    }
    return 1;
}
