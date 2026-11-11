
import { Pokemon, LogEntry, BattleState } from '../../../../types';
import { log } from '../../utils';
import { ITEMS_DATA } from '../../../../data/items';
import * as Multitype from '../abilities/multitype';
import * as RKSSystem from '../abilities/rks_system';

export function handleBestow(
    attacker: Pokemon,
    defender: Pokemon,
    logs: LogEntry[],
    state?: BattleState
) {
    if (defender.isFainted) return;

    // 1. O usuário deve ter um item
    if (!attacker.heldItem) {
        log(logs, `Mas falhou! ${attacker.name} não está segurando nada.`, 'text-gray-500 italic');
        return;
    }

    // 2. O alvo NÃO deve ter um item
    if (defender.heldItem) {
        log(logs, `Mas falhou! ${defender.name} já está segurando um item.`, 'text-gray-500 italic');
        return;
    }

    // 3. Verifica itens não transferíveis (Plates em Arceus, Memories em Silvally)
    // Nota: Mail e Z-Crystals não estão no simulador, mas Griseous Orb e Mega Stones poderiam ser checados.
    // Para simplificação 1v1, focamos nas trocas de forma conhecidas.
    const itemKey = attacker.heldItem;

    if (defender.name.includes('Arceus') && itemKey.endsWith('-plate')) {
        log(logs, `Mas falhou!`, 'text-gray-500 italic');
        return;
    }
    if (defender.name.includes('Silvally') && itemKey.endsWith('-memory')) {
         log(logs, `Mas falhou!`, 'text-gray-500 italic');
         return;
    }

    const itemName = ITEMS_DATA[itemKey]?.name || itemKey;

    // Executa a transferência
    defender.heldItem = itemKey;
    attacker.heldItem = null;
    defender.hadItem = true; // Marca que o alvo teve item (para Unburden, etc)

    log(logs, `${attacker.name} presenteou ${defender.name} com ${itemName}!`, 'text-purple-600 font-bold');

    // Atualiza formas se aplicável
    Multitype.handleMultitype(defender, logs);
    RKSSystem.handleRKSSystem(defender, logs);
}
