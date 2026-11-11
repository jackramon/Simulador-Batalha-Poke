
import { Pokemon, BattleState } from '../../../../types';
import { log } from '../../utils';

/**
 * Lógica para a habilidade Véu Doce (Sweet Veil).
 * Regra Oficial: Impede que o Pokémon e seus aliados adormeçam.
 * Esta habilidade É ignorada por Mold Breaker.
 */

/**
 * Verifica se o Pokémon é imune ao sono devido ao Véu Doce.
 */
export function isImmuneToSleep(pokemon: Pokemon, state?: BattleState): boolean {
    if (pokemon.isFainted) return false;
    
    // No contexto 1v1 do simulador, verificamos apenas o portador.
    return pokemon.ability === 'sweet-veil';
}

/**
 * Verifica e cura o sono do Pokémon se ele possuir a habilidade Véu Doce.
 * Útil para gatilhos de entrada ou troca de habilidade.
 */
export function checkSweetVeil(pokemon: Pokemon, logs: {message: string, color: string}[]): boolean {
    if (pokemon.ability === 'sweet-veil' && pokemon.statusEffects.sleep && !pokemon.isFainted) {
        delete pokemon.statusEffects.sleep;
        log(logs, `${pokemon.name} acordou devido ao seu Véu Doce!`, 'text-blue-600 font-bold');
        return true;
    }
    return false;
}
