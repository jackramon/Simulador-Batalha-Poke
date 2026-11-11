import { Pokemon, BattleState } from '../../../../types';
import { log } from '../../utils';
import { BATTLE_MESSAGES } from '../../../../data/battleMessages';
import { ITEMS_DATA } from '../../../../data/items';
import * as Effects from '../../../effectHandlers';
import * as Unnerve from '../abilities/unnerve';

/**
 * Lógica para o movimento Picada de Inseto (Bug Bite) e Beliscão (Pluck).
 * Regra Oficial: Se o alvo estiver segurando uma Berry, o usuário a come e ganha seu efeito.
 */
export function handleBugBiteEffect(attacker: Pokemon, defender: Pokemon, logs: {message: string, color: string}[], state?: BattleState) {
    if (defender.isFainted || attacker.isFainted) return;

    const item = defender.heldItem;
    if (item && item.endsWith('-berry')) {
        const itemName = ITEMS_DATA[item]?.name || item;
        
        log(logs, BATTLE_MESSAGES.BUG_BITE_EAT(attacker.name, itemName), 'text-green-600 font-bold italic');

        // Remove o item do defensor
        defender.heldItem = null;
        defender.hadItem = true;

        // Tensão (Unnerve) do oponente impede o consumo
        if (Unnerve.isOpponentUnnerved(attacker, state)) {
            log(logs, `Mas a Tensão de ${defender.name} impediu que ${attacker.name} comesse a fruta!`, 'text-gray-500 italic');
            return;
        }

        // Aplica o efeito da fruta diretamente no ATACANTE
        // Temporariamente "emprestamos" o item ao atacante para usar o checkConsumableItems centralizado
        const originalItem = attacker.heldItem;
        attacker.heldItem = item;
        
        // checkConsumableItems lida com Sitrus, Lum, Figy, Ripen, etc.
        const ate = Effects.checkConsumableItems(attacker, logs as any, state);
        
        // Se por algum motivo não comeu (ex: HP cheio pra Sitrus), removemos o item para simular que foi roubado/destruído
        if (!ate) {
            attacker.heldItem = originalItem;
        }
    }
}