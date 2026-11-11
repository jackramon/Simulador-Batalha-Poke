
import { Pokemon } from '../../../../types';
import { log } from '../../utils';
import { ITEMS_DATA } from '../../../../data/items';
import { ABILITY_EFFECTS } from '../../../../data/abilities';

/**
 * Lógica para a habilidade Batedor de Carteira (Pickpocket).
 * Regra Oficial: Se o Pokémon for atingido por um movimento de contato e não estiver segurando um item,
 * ele rouba o item segurado pelo atacante.
 */
export function handlePickpocket(attacker: Pokemon, defender: Pokemon, isContact: boolean, logs: {message: string, color: string}[]) {
    // Requisitos: O Pokémon com a habilidade deve ser o defensor, ter sido atingido por contato,
    // estar vivo, não ter item e o atacante deve ter um item.
    if (defender.ability !== 'pickpocket' || !isContact || defender.isFainted || defender.heldItem || !attacker.heldItem) {
        return;
    }

    // Viscosidade (Sticky Hold) impede que o item seja roubado
    if (attacker.ability === 'sticky-hold') {
        const abilityName = ABILITY_EFFECTS['sticky-hold']?.name || 'Viscosidade';
        log(logs, `A ${abilityName} de ${attacker.name} impediu que seu item fosse roubado!`, 'text-gray-500 italic text-xs');
        return;
    }

    const stolenItemKey = attacker.heldItem;
    const itemName = ITEMS_DATA[stolenItemKey]?.name || stolenItemKey;

    // Transfere o item do atacante para o defensor
    defender.heldItem = stolenItemKey;
    attacker.heldItem = null;
    attacker.hadItem = true; // Registra que o atacante perdeu seu item original

    log(logs, `${defender.name} roubou o item ${itemName} de ${attacker.name} com seu Batedor de Carteira!`, 'text-purple-600 font-bold italic');
}
