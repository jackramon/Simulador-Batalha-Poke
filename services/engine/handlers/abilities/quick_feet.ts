import { Pokemon } from '../../../../types';

/**
 * Lógica para a habilidade Pés Rápidos (Quick Feet).
 * Regra Oficial: Aumenta a Velocidade em 50% se o Pokémon tiver uma condição de status.
 * Além disso, ignora a redução de velocidade causada pela paralisia.
 */

export function getSpeedMultiplier(pokemon: Pokemon, isGasActive: boolean = false): number {
    if (pokemon.ability !== 'quick-feet' || isGasActive || pokemon.isFainted) {
        return 1.0;
    }

    // Condições de status principais que ativam a habilidade
    const majorStatus = ['burn', 'paralysis', 'poison', 'toxic', 'sleep', 'freeze'];
    const hasStatus = Object.keys(pokemon.statusEffects).some(s => majorStatus.includes(s));

    return hasStatus ? 1.5 : 1.0;
}

/**
 * Verifica se o Pokémon ignora a redução de velocidade da paralisia.
 */
export function ignoresParalysisPenalty(pokemon: Pokemon, isGasActive: boolean = false): boolean {
    return pokemon.ability === 'quick-feet' && !isGasActive;
}
