
import { Pokemon, BattleState } from '../../../../types';
import * as StatChanges from './statChanges';

/**
 * Lógica para o movimento Desbravar (Trailblaze).
 * Regra Oficial: Causa dano e aumenta a Velocidade do usuário em 1 estágio (100% de chance).
 */
export function handleTrailblazeEffect(
    attacker: Pokemon,
    logs: {message: string, color: string}[],
    state?: BattleState
) {
    // Aplica aumento de Velocidade (+1) no usuário
    // isOpponentSource = false, pois é um efeito causado pelo próprio usuário
    StatChanges.applyMoveStatChange(
        attacker,
        'speed-up',
        logs,
        false, 
        false, // ignoresAbilities
        'trailblaze',
        state
    );
}
