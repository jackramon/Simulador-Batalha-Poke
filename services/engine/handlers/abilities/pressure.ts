import { Pokemon } from '../../../../types';
import { log } from '../../utils';

/**
 * Lógica para a habilidade Pressão (Pressure).
 * Regras Oficiais:
 * 1. Exibe uma mensagem ao entrar em campo.
 * 2. Faz com que movimentos que alvejam o portador consumam 2 PP em vez de 1.
 */

export function announcePressure(pokemon: Pokemon, logs: {message: string, color: string}[]) {
    if (pokemon.ability === 'pressure' && !pokemon.isFainted) {
        log(logs, `${pokemon.name} está exercendo sua Pressão!`, 'text-purple-700 font-bold italic');
    }
}

/**
 * Retorna a quantidade de PP (usos) que um movimento deve consumir.
 * @param defender O Pokémon que está sendo alvejado.
 */
export function getPPCost(defender: Pokemon | null): number {
    if (defender && defender.ability === 'pressure' && !defender.isFainted) {
        return 2;
    }
    return 1;
}
