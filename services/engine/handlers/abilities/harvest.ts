import { Pokemon } from '../../../../types';
import { log } from '../../utils';
import { ITEMS_DATA } from '../../../../data/items';
import * as Unburden from './unburden';

/**
 * Lógica para a habilidade Colheita (Harvest).
 * Regra Oficial: Ao final de cada turno, tem 50% de chance de restaurar uma Fruta (Berry) consumida.
 * Sob Sol Forte (Sunny Day), a chance é de 100%.
 */
export function handleHarvest(pokemon: Pokemon, weather: string, logs: { message: string, color: string }[]) {
    // Requisitos: Ter a habilidade, estar vivo, não estar segurando item e ter consumido uma fruta
    if (pokemon.ability !== 'harvest' || pokemon.isFainted || pokemon.heldItem) return;
    
    const lastItem = pokemon.consumedItem;
    if (!lastItem || !lastItem.endsWith('-berry')) return;

    const isSun = weather === 'sun';
    const chance = isSun ? 1.0 : 0.5;

    if (Math.random() < chance) {
        const itemName = ITEMS_DATA[lastItem]?.name || lastItem;
        pokemon.heldItem = lastItem;
        pokemon.consumedItem = null;
        
        // Se recuperar o item, perde o bônus de Unburden (caso tenha mudado de habilidade ou por lógica interna)
        Unburden.deactivateUnburden(pokemon);

        log(logs, `${pokemon.name} colheu uma ${itemName} com sua habilidade!`, 'text-green-600 font-bold italic');
        return true;
    }
    
    return false;
}