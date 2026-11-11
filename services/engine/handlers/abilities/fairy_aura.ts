import { Move, BattleState } from '../../../../types';
import * as NeutralizingGas from './neutralizing_gas';

/**
 * Lógica para a habilidade Aura de Fada (Fairy Aura).
 * Regra Oficial: Aumenta o poder de movimentos do tipo Fada de TODOS os Pokémon em campo em 33% (1.33x).
 * Interação: Se a habilidade Aura Inversa (Aura Break) estiver ativa no campo, o multiplicador torna-se 0.75x.
 */
export function getFairyAuraMultiplier(move: Move, state?: BattleState): number {
    if (!state || move.type !== 'fairy') return 1.0;

    const isGasActive = NeutralizingGas.isGasActive(state);
    const p1 = state.currentPokemon1;
    const p2 = state.currentPokemon2;

    // Verifica se a Aura de Fada está presente no campo e não suprimida
    const isFairyAuraActive = (p1?.ability === 'fairy-aura' && !p1.isFainted && !NeutralizingGas.isAbilitySuppressed(p1.ability, isGasActive)) || 
                              (p2?.ability === 'fairy-aura' && !p2.isFainted && !NeutralizingGas.isAbilitySuppressed(p2.ability, isGasActive));

    if (!isFairyAuraActive) return 1.0;

    // Verifica se a Aura Inversa (Aura Break) está presente para reverter o efeito
    const isAuraBreakActive = (p1?.ability === 'aura-break' && !p1.isFainted && !NeutralizingGas.isAbilitySuppressed(p1.ability, isGasActive)) || 
                              (p2?.ability === 'aura-break' && !p2.isFainted && !NeutralizingGas.isAbilitySuppressed(p2.ability, isGasActive));

    if (isAuraBreakActive) {
        return 0.75; // Reduz o poder em 25% (Inversão)
    }

    return 1.3333; // Aumenta o poder em 33.3%
}
