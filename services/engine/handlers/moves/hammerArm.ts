
import { Pokemon, BattleState } from '../../../../types';
import * as StatChanges from '../effects/statChanges';

/**
 * Lógica para o movimento Braço de Martelo (Hammer Arm).
 * Regra Oficial: Causa dano e reduz a Velocidade do USUÁRIO em 1 estágio (100% de chance).
 * Idêntico ao Martelo de Gelo (Ice Hammer).
 */
export function handleHammerArmEffect(
    attacker: Pokemon,
    logs: {message: string, color: string}[],
    state?: BattleState
) {
    // Aplica redução de Velocidade (-1) no usuário
    // isOpponentSource = false, pois é um efeito colateral do próprio movimento
    StatChanges.applyMoveStatChange(
        attacker,
        'speed-down',
        logs,
        false, 
        false, 
        'hammer-arm',
        state
    );
}
