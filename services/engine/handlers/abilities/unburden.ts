import { Pokemon } from '../../../../types';
import { log } from '../../utils';

/**
 * Ativa o efeito da habilidade Desimpedido (Unburden).
 * Regra Oficial: Dobra a Velocidade quando o item segurado é consumido ou perdido.
 */
export function triggerUnburden(pokemon: Pokemon, logs: {message: string, color: string}[]) {
    if (pokemon.ability === 'unburden' && !pokemon.heldItem && !pokemon.statusEffects['unburden-active']) {
        pokemon.statusEffects['unburden-active'] = { turns: -1 }; // Efeito volátil persistente até troca ou recuperar item
        log(logs, `${pokemon.name} ficou Desimpedido e sua Velocidade dobrou!`, 'text-indigo-600 font-bold italic');
        return true;
    }
    return false;
}

/**
 * Desativa o bônus de Unburden.
 * Ocorre se o Pokémon recuperar um item (Recycle, Harvest, Pickup, etc).
 */
export function deactivateUnburden(pokemon: Pokemon) {
    if (pokemon.statusEffects && pokemon.statusEffects['unburden-active']) {
        delete pokemon.statusEffects['unburden-active'];
    }
}

/**
 * Verifica se o bônus está ativo e não suprimido.
 * Implementa reatividade: se o Pokémon estiver segurando um item, o bônus é perdido.
 */
export function isUnburdenActive(pokemon: Pokemon, isGasActive: boolean): boolean {
    if (isGasActive || pokemon.ability !== 'unburden' || pokemon.heldItem) {
        return false;
    }
    return !!pokemon.statusEffects['unburden-active'];
}
