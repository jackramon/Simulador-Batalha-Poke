
import { Pokemon, Move } from '../../../../types';
import { log } from '../../utils';

/**
 * Lógica para a habilidade Líbero (Libero) e Mutante (Protean).
 * Muda o tipo do Pokémon para o tipo do movimento que ele vai usar.
 * Regra Gen 9: Só ativa uma vez por entrada em campo.
 */
export function applyLibero(pokemon: Pokemon, move: Move, logs: {message: string, color: string}[]) {
    const changeAbilities = ['libero', 'protean'];
    if (!changeAbilities.includes(pokemon.ability)) return;

    // Verifica se já mudou de tipo nesta entrada (usamos um status temporário)
    if (pokemon.statusEffects['libero-activated']) return;

    if (pokemon.types.length !== 1 || pokemon.types[0] !== move.type) {
        pokemon.types = [move.type];
        pokemon.statusEffects['libero-activated'] = { turns: -1 };
        log(logs, `${pokemon.name} mudou seu tipo para ${move.type} devido à sua habilidade!`, 'text-indigo-500 italic');
    }
}
