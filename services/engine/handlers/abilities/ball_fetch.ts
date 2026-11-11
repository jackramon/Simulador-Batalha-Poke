import { Pokemon } from '../../../../types';
import { log } from '../../utils';
import { ITEMS_DATA } from '../../../../data/items';
import * as Unburden from './unburden';

/**
 * Lógica para a habilidade Busca-Bola (Ball Fetch).
 * Regra Adaptada para Duelo: Se o Pokémon não estiver segurando nenhum item, 
 * ele recupera o último item que consumiu durante a batalha.
 */
export function handleBallFetch(pokemon: Pokemon, logs: {message: string, color: string}[]): boolean {
    // Requisitos: Ter a habilidade, estar vivo, não estar segurando item e ter consumido um item previamente
    if (pokemon.ability !== 'ball-fetch' || pokemon.isFainted || pokemon.heldItem) {
        return false;
    }

    const itemToFetch = pokemon.consumedItem;
    if (itemToFetch) {
        const itemName = ITEMS_DATA[itemToFetch]?.name || itemToFetch;
        
        // 1. Atribui o item de volta ao slot ativo
        pokemon.heldItem = itemToFetch;
        
        // 2. Limpa o registro de consumo apenas após a atribuição bem-sucedida
        pokemon.consumedItem = null;
        
        // 3. Se recuperar um item, Unburden é desativado imediatamente
        Unburden.deactivateUnburden(pokemon);
        
        log(logs, `${pokemon.name} buscou sua ${itemName} de volta com Busca-Bola!`, 'text-indigo-600 font-bold italic');
        return true;
    }

    return false;
}
