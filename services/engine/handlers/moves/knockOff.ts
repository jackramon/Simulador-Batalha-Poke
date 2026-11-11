
import { Pokemon, BattleState } from '../../../../types';
import { log } from '../../utils';
import { BATTLE_MESSAGES } from '../../../../data/battleMessages';
import { ITEMS_DATA } from '../../../../data/items';
import * as NeutralizingGas from '../abilities/neutralizing_gas';
import * as Multitype from '../abilities/multitype';
import * as RKSSystem from '../abilities/rks_system';

/**
 * Verifica se o item do Pokémon pode ser removido por Derrubada.
 * Regras:
 * 1. Não pode remover se o Pokémon tiver a habilidade Viscosidade (Sticky Hold), a menos que anulada.
 * 2. Não pode remover Placas de Arceus.
 * 3. Não pode remover Memórias de Silvally.
 * 4. (Simplificado) Não pode remover itens se o Pokémon já não tiver item.
 */
export function canRemoveItem(pokemon: Pokemon, state?: BattleState): boolean {
    if (!pokemon.heldItem) return false;

    // Habilidade Viscosidade (Sticky Hold)
    const isGasActive = state ? NeutralizingGas.isGasActive(state) : false;
    if (pokemon.ability === 'sticky-hold' && !NeutralizingGas.isAbilitySuppressed(pokemon.ability, isGasActive)) {
        return false;
    }

    const item = pokemon.heldItem;

    // Placas em Arceus
    if (pokemon.name.includes('Arceus') && item.endsWith('-plate')) {
        return false;
    }

    // Memórias em Silvally
    if (pokemon.name.includes('Silvally') && item.endsWith('-memory')) {
        return false;
    }

    // Energia Booster em Pokémon Paradoxo (Geralmente não removível se ativada, simplificação para não removível)
    if (item === 'booster-energy' && (pokemon.ability === 'protosynthesis' || pokemon.ability === 'quark-drive')) {
        return false;
    }

    return true;
}

/**
 * Calcula o poder do movimento Derrubada.
 * Regra: Poder aumenta em 50% (1.5x) se o alvo estiver segurando um item removível.
 */
export function getKnockOffPower(defender: Pokemon, basePower: number, state?: BattleState): number {
    if (canRemoveItem(defender, state)) {
        return Math.floor(basePower * 1.5);
    }
    return basePower;
}

/**
 * Executa o efeito de remoção do item.
 * Regra: Só remove se o alvo NÃO desmaiou com o ataque.
 */
export function handleKnockOffEffect(
    defender: Pokemon, 
    attacker: Pokemon,
    logs: {message: string, color: string}[],
    state?: BattleState
) {
    if (defender.isFainted) return;

    if (canRemoveItem(defender, state)) {
        const itemKey = defender.heldItem!;
        const itemName = ITEMS_DATA[itemKey]?.name || itemKey;

        // Se o item for Choice (Band, Specs, Scarf), remove o bloqueio de movimento
        if (itemKey.includes('choice')) {
            defender.lockedMove = null;
        }

        defender.heldItem = null;
        defender.hadItem = true; // Marca que teve item para lógica de Unburden (se aplicável no futuro)

        log(logs, `${attacker.name} derrubou o item ${itemName} de ${defender.name}!`, 'text-purple-600 font-bold italic');

        // Atualiza forma se necessário (ex: Genesect - não implementado, ou caso borda de Arceus/Silvally)
        Multitype.handleMultitype(defender, logs);
        RKSSystem.handleRKSSystem(defender, logs);

    } else if (defender.heldItem && defender.ability === 'sticky-hold') {
        // A verificação de supressão já foi realizada em canRemoveItem.
        // Se o código caiu neste bloco, é porque canRemoveItem retornou false E o Pokémon tem Sticky Hold.
        // Assumimos que Sticky Hold é a causa da proteção.
        log(logs, `A Viscosidade de ${defender.name} impediu que o item fosse derrubado!`, 'text-gray-500 italic');
    }
}
