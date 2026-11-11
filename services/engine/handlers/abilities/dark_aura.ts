import { Move, BattleState } from '../../../../types';
import * as NeutralizingGas from './neutralizing_gas';

/**
 * Lógica para a habilidade Aura Sombria (Dark Aura).
 * Regra Oficial: Aumenta o poder de movimentos do tipo Noturno de TODOS os Pokémon em campo em 33% (1.33x).
 * Interação: Se a habilidade Aura Inversa (Aura Break) estiver ativa no campo, o multiplicador torna-se 0.75x.
 */
export function getDarkAuraMultiplier(move: Move, state?: BattleState): number {
    if (!state || move.type !== 'dark') return 1.0;

    const isGasActive = NeutralizingGas.isGasActive(state);
    const p1 = state.currentPokemon1;
    const p2 = state.currentPokemon2;

    // Verifica se a Aura Sombria está presente no campo e não suprimida
    const isDarkAuraActive = (p1?.ability === 'dark-aura' && !p1.isFainted && !NeutralizingGas.isAbilitySuppressed(p1.ability, isGasActive)) || 
                             (p2?.ability === 'dark-aura' && !p2.isFainted && !NeutralizingGas.isAbilitySuppressed(p2.ability, isGasActive));

    if (!isDarkAuraActive) return 1.0;

    // Verifica se a Aura Inversa (Aura Break) está presente para reverter o efeito
    const isAuraBreakActive = (p1?.ability === 'aura-break' && !p1.isFainted && !NeutralizingGas.isAbilitySuppressed(p1.ability, isGasActive)) || 
                              (p2?.ability === 'aura-break' && !p2.isFainted && !NeutralizingGas.isAbilitySuppressed(p2.ability, isGasActive));

    if (isAuraBreakActive) {
        return 0.75; // Reduz o poder em 25% (Inversão)
    }

    return 1.3333; // Aumenta o poder em 33.3%
}
