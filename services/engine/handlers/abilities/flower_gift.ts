import { Pokemon } from '../../../../types';

/**
 * Lógica para a habilidade Presente Floral (Flower Gift).
 * Regra Oficial: Enquanto o Pokémon com esta habilidade estiver em campo sob Sol Forte,
 * o Ataque e a Defesa Especial dele e de seus aliados aumentam em 50% (1.5x).
 */
export function getStatMultiplier(pokemon: Pokemon, statType: string, weather: string): number {
    if (pokemon.ability !== 'flower-gift' || pokemon.isFainted) {
        return 1.0;
    }

    if (weather === 'sun') {
        if (statType === 'attack' || statType === 'spDefense') {
            return 1.5;
        }
    }

    return 1.0;
}
