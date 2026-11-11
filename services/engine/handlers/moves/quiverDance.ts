
import { Pokemon, BattleState } from '../../../../types';
import * as StatChanges from '../effects/statChanges';

/**
 * Lógica para o movimento Dança da Borboleta (Quiver Dance).
 * Regra Oficial: Aumenta o Ataque Especial, a Defesa Especial e a Velocidade do usuário em 1 estágio cada.
 */
export function handleQuiverDance(
    attacker: Pokemon,
    logs: {message: string, color: string}[],
    state?: BattleState
) {
    if (attacker.isFainted) return;

    // Aumenta Ataque Especial (+1)
    StatChanges.applyMoveStatChange(
        attacker,
        'spAttack-up',
        logs,
        false, // isOpponentSource (False, é self-buff)
        false, // ignoresAbilities
        'quiver-dance',
        state
    );

    // Aumenta Defesa Especial (+1)
    StatChanges.applyMoveStatChange(
        attacker,
        'spDefense-up',
        logs,
        false, 
        false, 
        'quiver-dance',
        state
    );

    // Aumenta Velocidade (+1)
    StatChanges.applyMoveStatChange(
        attacker,
        'speed-up',
        logs,
        false, 
        false, 
        'quiver-dance',
        state
    );
}
