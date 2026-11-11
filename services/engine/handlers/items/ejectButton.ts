
import { Pokemon, BattleState } from '../../../../types';
import { log } from '../../utils';
import * as Klutz from '../abilities/klutz';

/**
 * Lógica para o item Botão de Ejeção (Eject Button).
 * Efeito: Se o portador for atingido por um ataque de dano e sobreviver,
 * o item é consumido e o portador troca de lugar imediatamente.
 */
export function handleEjectButton(
    holder: Pokemon, 
    state: BattleState, 
    logs: {message: string, color: string}[]
): boolean {
    // 1. Verificações Básicas
    if (holder.heldItem !== 'eject-button' || holder.isFainted) {
        return false;
    }

    // 2. Verifica se o item está suprimido (Klutz, Magic Room - não imp., etc)
    if (Klutz.isItemSuppressed(holder, state)) {
        return false;
    }

    // 3. Verifica se há aliados vivos para trocar
    const isP1 = state.currentPokemon1?.id === holder.id;
    const team = isP1 ? state.team1 : state.team2;
    const hasBackups = team.some(p => !p.isFainted && p.id !== holder.id);

    if (!hasBackups) {
        return false;
    }

    // --- ATIVAÇÃO ---

    // 4. Consome o Item
    holder.heldItem = null;
    holder.consumedItem = 'eject-button';

    log(logs, `O Botão de Ejeção de ${holder.name} foi ativado!`, 'text-yellow-600 font-bold');
    
    // Retorna true para sinalizar que uma troca foi solicitada (defenderSwitchRequested)
    return true;
}
