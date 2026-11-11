
import { Pokemon, BattleState } from '../../../../types';
import * as StatMoves from './statChanges';

/**
 * Lógica para o movimento Últimas Palavras (Parting Shot).
 * Regra Oficial: Reduz o Ataque e o Ataque Especial do alvo em 1 estágio.
 * Em seguida, o usuário troca de lugar (a lógica de troca é tratada em selfSwitch.ts).
 */
export function handlePartingShot(
    attacker: Pokemon, 
    defender: Pokemon, 
    logs: {message: string, color: string}[], 
    state?: BattleState
) {
    if (defender.isFainted) return;

    // Aplica redução de Ataque (-1)
    StatMoves.applyMoveStatChange(
        defender, 
        'attack-down', 
        logs, 
        true, // isOpponentSource
        false, // ignoresAbilities (seria true se atacante tivesse Mold Breaker, mas passamos false padrão aqui pois o handler pai já checaria imunidades gerais)
        'parting-shot', 
        state
    );

    // Aplica redução de Ataque Especial (-1)
    StatMoves.applyMoveStatChange(
        defender, 
        'spAttack-down', 
        logs, 
        true, 
        false, 
        'parting-shot', 
        state
    );
}
