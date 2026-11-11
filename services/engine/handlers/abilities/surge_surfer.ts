
import { Pokemon } from '../../../../types';

/**
 * Lógica para a habilidade Surfista de Raio (Surge Surfer).
 * Regra Oficial: Dobra a Velocidade do Pokémon durante o Campo Elétrico (Electric Terrain).
 */
export function getSpeedMultiplier(pokemon: Pokemon, terrain: string): number {
    if (pokemon.ability === 'surge-surfer' && terrain === 'electric' && !pokemon.isFainted) {
        return 2;
    }
    return 1;
}
