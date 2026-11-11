
import { Pokemon, BattleState } from '../../../../types';
import { log } from '../../utils';

/**
 * Lógica para a habilidade Cuspir Areia (Sand Spit).
 * Regra Oficial: Quando o Pokémon é atingido por um ataque, ele cria uma tempestade de areia.
 */
export function handleSandSpit(defender: Pokemon, state: BattleState, logs: {message: string, color: string}[]): boolean {
    if (defender.ability !== 'sand-spit' || defender.isFainted) return false;

    // Se já estiver em tempestade de areia, não faz nada
    if (state.weather === 'sand') return false;

    state.weather = 'sand';
    state.weatherTurns = 5;

    // Checagem de Smooth Rock (Pedra Lisa) para estender a duração
    if (defender.heldItem === 'smooth-rock') {
        state.weatherTurns = 8;
    }

    log(logs, `A habilidade Cuspir Areia de ${defender.name} criou uma tempestade de areia!`, 'text-yellow-700 font-bold');
    return true;
}
