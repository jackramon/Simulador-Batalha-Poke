
import { Pokemon } from '../../../../types';
import { log } from '../../utils';

/**
 * Ativa o efeito da habilidade Escudo Destemido (Dauntless Shield).
 * Aumenta a Defesa do Pokémon em 1 estágio ao entrar em batalha.
 */
export function triggerDauntlessShield(pokemon: Pokemon, logs: {message: string, color: string}[]) {
    if (pokemon.statStages.defense < 6) {
        pokemon.statStages.defense++;
        log(logs, `O Escudo Destemido de ${pokemon.name} aumentou sua Defesa!`, 'text-blue-600 font-bold');
        return true;
    }
    return false;
}
