
import { Pokemon } from '../../../../types';
import { log } from '../../utils';
import { BATTLE_MESSAGES } from '../../../../data/battleMessages';
import { ITEMS_DATA } from '../../../../data/items';

/**
 * Lógica para o movimento Poltergeist.
 * Regra Oficial: Falha se o alvo não estiver segurando um item.
 * Se tiver item, revela o item e causa dano.
 */
export function checkFailure(defender: Pokemon, logs: {message: string, color: string}[]): boolean {
    // Falha se não tem item ou se o item já foi consumido/perdido (null)
    if (!defender.heldItem) {
        log(logs, BATTLE_MESSAGES.POLTERGEIST_FAIL(), 'text-gray-500 italic');
        return true; // Deve falhar
    }

    const itemName = ITEMS_DATA[defender.heldItem]?.name || defender.heldItem;
    log(logs, BATTLE_MESSAGES.POLTERGEIST_ACTIVATE(defender.name, itemName), 'text-purple-600 font-bold italic');
    
    return false; // Não falha, prossegue com o dano
}
