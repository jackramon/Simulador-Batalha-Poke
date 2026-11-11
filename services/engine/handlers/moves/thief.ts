
import { Pokemon, BattleState } from '../../../../types';
import { log } from '../../utils';
import { BATTLE_MESSAGES } from '../../../../data/battleMessages';
import { ITEMS_DATA } from '../../../../data/items';
import * as NeutralizingGas from '../abilities/neutralizing_gas';
import * as Multitype from '../abilities/multitype';
import * as RKSSystem from '../abilities/rks_system';

/**
 * Lógica para movimentos que roubam itens (Thief, Covet).
 * Regras:
 * 1. O usuário não deve estar segurando um item.
 * 2. O alvo deve estar segurando um item.
 * 3. Habilidade Sticky Hold (Viscosidade) bloqueia o roubo.
 * 4. Não pode roubar Placas de Arceus ou Memórias de Silvally se o alvo for o respectivo Pokémon.
 * 5. Não pode roubar Energia Booster se a habilidade paradoxo estiver ativa.
 */
export function handleItemSteal(attacker: Pokemon, defender: Pokemon, logs: {message: string, color: string}[], state?: BattleState) {
    if (attacker.isFainted || defender.isFainted) return;
    
    // O atacante não pode ter item para roubar
    if (attacker.heldItem) return;
    
    // O defensor deve ter item para ser roubado
    if (!defender.heldItem) return;

    // Sticky Hold (Viscosidade) protege o item
    const isGasActive = state ? NeutralizingGas.isGasActive(state) : false;
    if (defender.ability === 'sticky-hold' && !NeutralizingGas.isAbilitySuppressed(defender.ability, isGasActive)) {
        log(logs, BATTLE_MESSAGES.STICKY_HOLD_BLOCK(defender.name), 'text-gray-500 italic');
        return;
    }

    const itemKey = defender.heldItem;

    // Placas em Arceus não podem ser roubadas
    if (defender.name.includes('Arceus') && itemKey.endsWith('-plate')) {
        return;
    }

    // Memórias em Silvally não podem ser roubadas
    if (defender.name.includes('Silvally') && itemKey.endsWith('-memory')) {
        return;
    }

    // Energia Booster com habilidade ativa não pode ser roubada
    if (itemKey === 'booster-energy' && 
       (defender.ability === 'protosynthesis' || defender.ability === 'quark-drive') &&
       !NeutralizingGas.isAbilitySuppressed(defender.ability, isGasActive)) {
        return;
    }

    const itemName = ITEMS_DATA[itemKey]?.name || itemKey;

    // Se o item roubado for Choice, libera o travamento do defensor
    if (itemKey.includes('choice')) {
        defender.lockedMove = null;
    }

    // Executa o roubo
    attacker.heldItem = itemKey;
    defender.heldItem = null;
    defender.hadItem = true; // Marca que perdeu o item para fins de Unburden, etc.

    log(logs, BATTLE_MESSAGES.ITEM_STOLEN(attacker.name, itemName, defender.name), 'text-purple-600 font-bold');

    // Atualiza formas para ambos os envolvidos (caso Arceus/Silvally estejam envolvidos de forma válida)
    Multitype.handleMultitype(attacker, logs);
    RKSSystem.handleRKSSystem(attacker, logs);
    Multitype.handleMultitype(defender, logs);
    RKSSystem.handleRKSSystem(defender, logs);
}
