
import { Pokemon } from '../../../../types';
import { log } from '../../utils';

/**
 * Lógica para a habilidade Início Lento (Slow Start).
 * Regra Oficial: Reduz o Ataque e a Velocidade do Pokémon pela metade durante 5 turnos.
 */

export function getStatMultiplier(pokemon: Pokemon, statType: string): number {
    if (pokemon.ability !== 'slow-start' || pokemon.isFainted) {
        return 1.0;
    }

    // A penalidade dura turnos 0, 1, 2, 3 e 4 (Total de 5 turnos ativos)
    if (pokemon.turnsActive < 5 && (statType === 'attack' || statType === 'speed')) {
        return 0.5;
    }

    return 1.0;
}

export function announceEntry(pokemon: Pokemon, logs: {message: string, color: string}[]) {
    if (pokemon.ability === 'slow-start') {
        log(logs, `${pokemon.name} não consegue pegar no tranco!`, 'text-gray-500 italic');
    }
}

export function checkRecovery(pokemon: Pokemon, logs: {message: string, color: string}[]) {
    // Quando turnsActive chega a 5 no final do turno, significa que o 6º turno será o primeiro sem a penalidade.
    if (pokemon.ability === 'slow-start' && pokemon.turnsActive === 5) {
        log(logs, `${pokemon.name} finalmente recuperou suas forças!`, 'text-indigo-600 font-bold');
    }
}
