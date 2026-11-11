
import { Pokemon, Move, BattleState } from '../../../../types';
import { log } from '../../utils';
import { ITEMS_DATA } from '../../../../data/items';
import * as NeutralizingGas from './neutralizing_gas';

/**
 * Lógica para a habilidade Mágico (Magician).
 * Regra Oficial: Se o Pokémon atingir um oponente com um movimento e não estiver
 * segurando um item, ele rouba o item segurado pelo alvo.
 */
export function handleMagician(
    attacker: Pokemon, 
    defender: Pokemon, 
    move: Move, 
    logs: {message: string, color: string}[],
    state?: BattleState
) {
    // 1. Verificações básicas: Movimento de dano, atacante vivo, defensor vivo
    if (move.damageClass === 'status' || attacker.isFainted || defender.isFainted) return;

    // 2. Verifica se a habilidade está ativa e não suprimida
    const isGasActive = state ? NeutralizingGas.isGasActive(state) : false;
    if (attacker.ability !== 'magician' || NeutralizingGas.isAbilitySuppressed(attacker.ability, isGasActive)) {
        return;
    }

    // 3. Condições de roubo: Atacante sem item e Defensor com item
    if (attacker.heldItem || !defender.heldItem) return;

    // 4. Imunidade: Viscosidade (Sticky Hold) impede o roubo de item
    // Nota: Sticky Hold também pode ser suprimida pelo Gás
    const defenderAbilitySuppressed = NeutralizingGas.isAbilitySuppressed(defender.ability, isGasActive);
    if (defender.ability === 'sticky-hold' && !defenderAbilitySuppressed) {
        log(logs, `A Viscosidade de ${defender.name} impediu que seu item fosse roubado!`, 'text-gray-500 italic text-xs');
        return;
    }

    const stolenItemKey = defender.heldItem;
    const itemName = ITEMS_DATA[stolenItemKey]?.name || stolenItemKey;

    // 5. Executa a transferência
    attacker.heldItem = stolenItemKey;
    defender.heldItem = null;
    defender.hadItem = true; // Marca que o defensor perdeu o item

    log(logs, `${attacker.name} roubou o item ${itemName} de ${defender.name} com sua habilidade Mágico!`, 'text-purple-600 font-bold italic');
}
