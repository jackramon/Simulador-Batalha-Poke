
import { Pokemon, LogEntry, BattleState } from '../../../../types';
import { log } from '../../utils';
import { ITEMS_DATA } from '../../../../data/items';
import * as NeutralizingGas from '../abilities/neutralizing_gas';
import * as KnockOff from './knockOff';

export function handleCorrosiveGas(
    attacker: Pokemon,
    defender: Pokemon,
    logs: LogEntry[],
    state?: BattleState
) {
    if (defender.isFainted) return;

    if (!defender.heldItem) {
        log(logs, `Mas falhou! ${defender.name} não tem nenhum item para corroer.`, 'text-gray-500 italic');
        return;
    }

    // Reuse check logic from Knock Off (Sticky Hold, Plates, etc.)
    // Se o item não pode ser removido (Knock Off falha), então Corrosive Gas também falha.
    if (!KnockOff.canRemoveItem(defender, state)) {
         // Specific Sticky Hold message if that's the cause
         const isGasActive = state ? NeutralizingGas.isGasActive(state) : false;
         if (defender.ability === 'sticky-hold' && !NeutralizingGas.isAbilitySuppressed(defender.ability, isGasActive)) {
             log(logs, `A Viscosidade de ${defender.name} protegeu o item!`, 'text-gray-500 italic');
         } else {
             log(logs, `Mas falhou! O item não pode ser corroído.`, 'text-gray-500 italic');
         }
         return;
    }

    const itemKey = defender.heldItem;
    const itemName = ITEMS_DATA[itemKey]?.name || itemKey;

    defender.heldItem = null;
    defender.hadItem = true; // Marca que o alvo teve item (para Unburden, etc)
    
    // NOTA: Não definimos consumedItem, pois o item é destruído e não pode ser recuperado por Recycle.

    log(logs, `O ${itemName} de ${defender.name} foi derretido!`, 'text-purple-600 font-bold');
}
