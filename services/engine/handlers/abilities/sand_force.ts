
import { Pokemon, Move } from '../../../../types';

/**
 * Calcula o multiplicador de poder para a habilidade Força da Areia (Sand Force).
 * Regra: Aumenta o poder de movimentos do tipo Terra, Pedra e Aço em 30% (1.3x) 
 * durante uma Tempestade de Areia (Sandstorm).
 */
export function getPowerMultiplier(attacker: Pokemon, move: Move, weather: string): number {
    if (attacker.ability === 'sand-force' && weather === 'sand') {
        if (['ground', 'rock', 'steel'].includes(move.type)) {
            return 1.3;
        }
    }
    return 1;
}
