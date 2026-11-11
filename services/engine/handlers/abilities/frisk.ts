
import { Pokemon } from '../../../../types';
import { ITEMS_DATA } from '../../../../data/items';
import { log } from '../../utils';

/**
 * Lógica para a habilidade Revista (Frisk).
 * Regra Oficial: Ao entrar em batalha, o Pokémon identifica o item segurado pelo oponente.
 */
export function handleFrisk(
    pokemon: Pokemon,
    opponent: Pokemon | null,
    logs: { message: string, color: string }[]
): boolean {
    if (pokemon.ability !== 'frisk' || pokemon.isFainted || !opponent || opponent.isFainted) {
        return false;
    }

    const itemKey = opponent.heldItem;
    if (itemKey) {
        const itemName = ITEMS_DATA[itemKey]?.name || itemKey;
        log(logs, `${pokemon.name} revistou ${opponent.name} e encontrou um(a) ${itemName}!`, 'text-indigo-600 font-bold italic');
        return true;
    }

    return false;
}
