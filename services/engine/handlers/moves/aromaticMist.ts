
import { Pokemon, BattleState } from '../../../../types';
import * as StatChanges from '../effects/statChanges';

/**
 * Lógica para o movimento Névoa Aromática (Aromatic Mist).
 * Regra Oficial: Aumenta a Defesa Especial de um aliado em 1 estágio.
 * Adaptação 1v1: Como não há aliados, o efeito é aplicado ao próprio usuário.
 */
export function handleAromaticMist(
    attacker: Pokemon,
    logs: {message: string, color: string}[],
    state?: BattleState
) {
    if (attacker.isFainted) return;

    // Aumenta Defesa Especial em 1 estágio
    // isOpponentSource = false (Self-buff neste contexto adaptado)
    StatChanges.applyMoveStatChange(
        attacker,
        'spDefense-up',
        logs,
        false, 
        false, // ignoresAbilities
        'aromatic-mist',
        state
    );
}
