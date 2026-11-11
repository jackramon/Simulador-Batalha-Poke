
import { Pokemon, LogEntry } from '../../../../types';
import { log } from '../../utils';
import { ITEMS_DATA } from '../../../../data/items';
import * as Unburden from '../abilities/unburden';

/**
 * Lógica para o movimento Reciclar (Recycle).
 * Regra Oficial: Restaura um item consumido pelo usuário.
 * Falha se o usuário estiver segurando um item ou se não tiver consumido nada.
 */
export function handleRecycle(user: Pokemon, logs: LogEntry[]) {
    if (user.isFainted) return;

    // 1. Verifica se já está segurando um item
    if (user.heldItem) {
        log(logs, `Mas falhou! ${user.name} já está segurando um item.`, 'text-gray-500 italic');
        return;
    }

    // 2. Verifica se algum item foi consumido anteriormente na batalha
    if (!user.consumedItem) {
        log(logs, `Mas falhou! Não há item para reciclar.`, 'text-gray-500 italic');
        return;
    }

    // 3. Restaura o item
    const itemKey = user.consumedItem;
    const itemName = ITEMS_DATA[itemKey]?.name || itemKey;

    user.heldItem = itemKey;
    user.consumedItem = null; // Limpa o registro de consumo para exigir novo consumo antes de reciclar novamente

    // Se recuperar um item, a habilidade Desimpedido (Unburden) é desativada
    Unburden.deactivateUnburden(user);

    log(logs, `${user.name} encontrou um(a) ${itemName}!`, 'text-green-600 font-bold italic');
}
