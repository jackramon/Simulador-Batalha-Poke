
import { Pokemon } from '../../../../types';
import { log } from '../../utils';

/**
 * Ativa o efeito da habilidade Espada Intrépida (Intrepid Sword).
 * Aumenta o Ataque do Pokémon em 1 estágio ao entrar em batalha.
 */
export function triggerIntrepidSword(pokemon: Pokemon, logs: {message: string, color: string}[]) {
    if (pokemon.statStages.attack < 6) {
        pokemon.statStages.attack++;
        log(logs, `A Espada Intrépida de ${pokemon.name} aumentou seu Ataque!`, 'text-blue-600 font-bold');
        return true;
    }
    return false;
}
