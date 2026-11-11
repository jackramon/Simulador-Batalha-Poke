import { Pokemon, BattleState } from '../../../../types';
import { log } from '../../utils';
import { ITEMS_DATA } from '../../../../data/items';
import * as NeutralizingGas from './neutralizing_gas';
import * as Unburden from './unburden';

/**
 * Lógica para a habilidade Coleta (Pickup).
 * Regra Oficial: No final do turno, se o Pokémon não estiver segurando nenhum item,
 * ele recupera um item que foi consumido por outro Pokémon no campo naquele turno.
 */
export function handlePickup(pokemon: Pokemon, state: BattleState, logs: {message: string, color: string}[]): boolean {
    // 1. Verificações básicas: Habilidade, Vida e Item Segurado
    if (pokemon.ability !== 'pickup' || pokemon.isFainted || pokemon.heldItem) {
        return false;
    }

    // Verifica se a habilidade está suprimida (ex: Gás Neutralizante)
    if (!NeutralizingGas.canAbilityTrigger(pokemon, state)) {
        return false;
    }

    // Identifica o oponente
    const isP1 = state.team1.some(p => p.id === pokemon.id);
    const opponent = isP1 ? state.currentPokemon2 : state.currentPokemon1;

    // Se o oponente consumiu um item neste turno (ou anteriormente e ainda não foi coletado)
    if (opponent && opponent.consumedItem) {
        const itemKey = opponent.consumedItem;
        const itemName = ITEMS_DATA[itemKey]?.name || itemKey;

        // Transfere o item
        pokemon.heldItem = itemKey;
        opponent.consumedItem = null;
        
        // Se recuperar um item, Unburden é desativado
        Unburden.deactivateUnburden(pokemon);

        log(logs, `${pokemon.name} coletou o item ${itemName} caído no campo!`, 'text-indigo-600 font-bold italic');
        return true;
    }

    return false;
}