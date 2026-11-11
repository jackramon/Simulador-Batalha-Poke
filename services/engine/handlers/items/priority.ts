
import { Pokemon, BattleState, LogEntry } from '../../../../types';
import { log } from '../../utils';
import * as Klutz from '../abilities/klutz';
import { ITEMS_DATA } from '../../../../data/items';

/**
 * Calcula o modificador de prioridade baseado no item segurado.
 * Retorna um valor fracionário (ex: 0.1 ou -0.1) para desempatar na mesma bracket de prioridade.
 */
export function getItemPriorityMod(pokemon: Pokemon, state: BattleState, logs: LogEntry[]): number {
    if (!pokemon.heldItem) return 0;
    
    // Verifica se o item está suprimido (Klutz, Magic Room, Embargo)
    if (Klutz.isItemSuppressed(pokemon, state)) return 0;

    const item = pokemon.heldItem;

    // 1. Quick Claw (Garra Rápida)
    // 20% de chance de agir primeiro na bracket
    if (item === 'quick-claw') {
        if (Math.random() < 0.2) {
            log(logs, `A Garra Rápida de ${pokemon.name} ativou!`, 'text-yellow-600 font-bold italic');
            return 0.1;
        }
    }

    // 2. Custap Berry (Fruta Pinha)
    // Ativa se HP <= 25%, garante prioridade na próxima ação
    if (item === 'custap-berry') {
        if (pokemon.hp <= pokemon.maxHP / 4) {
            const itemName = ITEMS_DATA[item]?.name || item;
            log(logs, `${pokemon.name} se preparou com a ${itemName}!`, 'text-green-600 font-bold italic');
            // Nota: O consumo real do item deve ser tratado na execução do movimento para respeitar a imutabilidade da ordenação.
            return 0.1;
        }
    }

    // 3. Lagging Tail (Cauda Pesada) / Full Incense (Incenso Cheio)
    // Força a agir por último na bracket
    if (item === 'lagging-tail' || item === 'full-incense') {
        return -0.1;
    }

    return 0;
}
