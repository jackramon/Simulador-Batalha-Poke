
import { Pokemon, Move, BattleState } from '../../../../types';
import * as Infiltrator from '../abilities/infiltrator';
import { log } from '../../utils';

/**
 * Calcula o multiplicador de dano baseado na presença de Refletir (Reflect) e Tela de Luz (Light Screen).
 * Regras Oficiais:
 * 1. Refletir reduz dano FÍSICO em 50% (0.5x).
 * 2. Tela de Luz reduz dano ESPECIAL em 50% (0.5x).
 * 3. Véu Aurora reduz ambos.
 * 4. Em batalhas duplas (não implementadas), reduz em 1/3 (~0.66x).
 * 5. Ignorado por Acertos Críticos.
 * 6. Ignorado pela habilidade Infiltrado (Infiltrator).
 */
export function getDamageMultiplier(
    state: BattleState | undefined,
    defender: Pokemon,
    attacker: Pokemon,
    move: Move,
    isCritical: boolean,
    logs: {message: string, color: string}[]
): number {
    if (!state) return 1.0;
    
    // Críticos ignoram barreiras
    if (isCritical) {
        return 1.0;
    }

    // Infiltrator ignora barreiras
    if (Infiltrator.canInfiltrate(attacker, state)) {
        return 1.0;
    }

    // Identifica o lado do defensor
    const isP1 = state.currentPokemon1?.id === defender.id;
    const hazards = isP1 ? state.p1Hazards : state.p2Hazards;

    if (move.damageClass === 'physical') {
        // Verifica Refletir ou Véu Aurora
        if (hazards.reflect > 0 || hazards.auroraVeil > 0) {
            return 0.5;
        }
    } else if (move.damageClass === 'special') {
        // Verifica Tela de Luz ou Véu Aurora
        if (hazards.lightScreen > 0 || hazards.auroraVeil > 0) {
            return 0.5;
        }
    }

    return 1.0;
}
