
import { Pokemon, BattleState } from '../../../../types';
import { log } from '../../utils';
import { BATTLE_MESSAGES } from '../../../../data/battleMessages';
import { ITEMS_DATA } from '../../../../data/items';
import * as NeutralizingGas from '../abilities/neutralizing_gas';

/**
 * Lógica para o movimento Incinerar (Incinerate).
 * Regra Oficial: Se o alvo estiver segurando uma Fruta (Berry), ela é destruída (queimada) e perdida permanentemente.
 * O efeito falha se o alvo tiver a habilidade Viscosidade (Sticky Hold).
 */
export function handleIncinerate(
    attacker: Pokemon, 
    defender: Pokemon, 
    logs: {message: string, color: string}[],
    state?: BattleState
) {
    if (defender.isFainted || !defender.heldItem) return;

    // Incinerar só destrói Berries (Gen 6+)
    // Verifica se o ID do item termina com '-berry' (convenção usada em data/items/berries.ts)
    if (!defender.heldItem.endsWith('-berry')) {
        return;
    }

    // Verifica habilidade Sticky Hold (Viscosidade)
    const isGasActive = state ? NeutralizingGas.isGasActive(state) : false;
    if (defender.ability === 'sticky-hold' && !NeutralizingGas.isAbilitySuppressed(defender.ability, isGasActive)) {
        log(logs, BATTLE_MESSAGES.STICKY_HOLD_BLOCK(defender.name), 'text-gray-500 italic');
        return;
    }

    const itemKey = defender.heldItem;
    const itemName = ITEMS_DATA[itemKey]?.name || itemKey;

    // Remove o item (Destrói)
    defender.heldItem = null;
    defender.hadItem = true; // Marca que teve item para lógica de Unburden, etc.

    log(logs, BATTLE_MESSAGES.INCINERATE_BERRY(defender.name, itemName), 'text-orange-600 font-bold italic');
}
