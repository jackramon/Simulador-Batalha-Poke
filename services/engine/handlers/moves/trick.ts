
import { Pokemon, BattleState, LogEntry } from '../../../../types';
import { log } from '../../utils';
import { ITEMS_DATA } from '../../../../data/items';
import * as NeutralizingGas from '../abilities/neutralizing_gas';
import * as Multitype from '../abilities/multitype';
import * as RKSSystem from '../abilities/rks_system';

/**
 * Verifica se o item pode ser trocado (não é Mega Stone, Z-Crystal, Plate em Arceus, etc).
 */
function isItemSwappable(pokemon: Pokemon, item: string | null): boolean {
    if (!item) return true; // Slot vazio é trocável
    
    // Placas em Arceus
    if (pokemon.name.includes('Arceus') && item.endsWith('-plate')) return false;
    
    // Memórias em Silvally
    if (pokemon.name.includes('Silvally') && item.endsWith('-memory')) return false;
    
    // Energia Booster em Pokémon Paradoxo com habilidade ativa
    if (item === 'booster-energy' && (pokemon.ability === 'protosynthesis' || pokemon.ability === 'quark-drive')) return false;
    
    return true;
}

/**
 * Lógica para o movimento Truque (Trick).
 * Regra Oficial: Troca o item segurado do usuário com o do alvo.
 * Falha se:
 * 1. Nenhum dos dois tiver item.
 * 2. Um dos itens não puder ser trocado (ex: Placa em Arceus).
 * 3. Um dos Pokémon tiver a habilidade Viscosidade (Sticky Hold).
 */
export function handleTrick(
    attacker: Pokemon, 
    defender: Pokemon, 
    logs: LogEntry[], 
    state?: BattleState
) {
    if (defender.isFainted) return;

    // 1. Falha se nenhum tiver item
    if (!attacker.heldItem && !defender.heldItem) {
        log(logs, `Mas falhou! Nenhum dos dois tem item para trocar.`, 'text-gray-500 italic');
        return;
    }

    const isGasActive = state ? NeutralizingGas.isGasActive(state) : false;

    // 2. Verifica Habilidade Viscosidade (Sticky Hold)
    // Se QUALQUER UM dos dois tiver Sticky Hold, a troca falha (Regra Gen 5+)
    if (defender.ability === 'sticky-hold' && !NeutralizingGas.isAbilitySuppressed(defender.ability, isGasActive)) {
        log(logs, `A Viscosidade de ${defender.name} impediu a troca!`, 'text-gray-500 italic');
        return;
    }
    if (attacker.ability === 'sticky-hold' && !NeutralizingGas.isAbilitySuppressed(attacker.ability, isGasActive)) {
        log(logs, `A Viscosidade de ${attacker.name} impediu a troca!`, 'text-gray-500 italic');
        return;
    }

    // 3. Verifica Itens Introcáveis
    if (!isItemSwappable(attacker, attacker.heldItem)) {
        log(logs, `Mas falhou! O item de ${attacker.name} não pode ser trocado.`, 'text-gray-500 italic');
        return;
    }
    if (!isItemSwappable(defender, defender.heldItem)) {
        log(logs, `Mas falhou! O item de ${defender.name} não pode ser trocado.`, 'text-gray-500 italic');
        return;
    }

    // 4. Executa a Troca
    const userItem = attacker.heldItem;
    const targetItem = defender.heldItem;
    
    const userItemName = userItem ? (ITEMS_DATA[userItem]?.name || userItem) : 'nada';
    const targetItemName = targetItem ? (ITEMS_DATA[targetItem]?.name || targetItem) : 'nada';

    attacker.heldItem = targetItem;
    defender.heldItem = userItem;

    // Atualiza flag de histórico de itens (para Unburden, etc)
    if (attacker.heldItem) attacker.hadItem = true;
    if (defender.heldItem) defender.hadItem = true;

    // Lógica de Reset para Itens de Escolha (Choice Items)
    // Se alguém PERDE um item Choice, o travamento de movimento é removido
    if (userItem && userItem.includes('choice')) {
        attacker.lockedMove = null;
    }
    if (targetItem && targetItem.includes('choice')) {
        defender.lockedMove = null;
    }

    log(logs, `${attacker.name} trocou itens com ${defender.name}!`, 'text-purple-600 font-bold');
    log(logs, `${attacker.name} recebeu ${targetItemName} e ${defender.name} recebeu ${userItemName}.`, 'text-gray-600 italic text-xs');

    // Atualiza formas se necessário (Arceus/Silvally que receberam item válido)
    Multitype.handleMultitype(attacker, logs);
    RKSSystem.handleRKSSystem(attacker, logs);
    Multitype.handleMultitype(defender, logs);
    RKSSystem.handleRKSSystem(defender, logs);
}
