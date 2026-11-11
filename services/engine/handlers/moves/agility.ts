
import { Pokemon, BattleState } from '../../../../types';
import * as StatChanges from '../effects/statChanges';

/**
 * Lógica para o movimento Agilidade (Agility).
 * Regra Oficial: Aumenta a Velocidade do usuário em 2 estágios (Drasticamente).
 */
export function handleAgility(
    attacker: Pokemon,
    logs: {message: string, color: string}[],
    state?: BattleState
) {
    if (attacker.isFainted) return;

    // Aumenta Velocidade em 2 estágios
    // A magnitude (2) é tratada internamente em statChanges.ts ao detectar o nome 'agility' na lista 'magnitudeTwoMoves'
    StatChanges.applyMoveStatChange(
        attacker,
        'speed-up',
        logs,
        false, // isOpponentSource (False, é self-buff)
        false, // ignoresAbilities
        'agility',
        state
    );
}
