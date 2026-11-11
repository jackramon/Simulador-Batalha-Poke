
import { Pokemon, BattleState } from '../../../../types';
import * as StatChanges from './statChanges';

/**
 * Lógica para o movimento Superpoder (Superpower).
 * Regra Oficial: Causa dano e reduz o Ataque e a Defesa do USUÁRIO em 1 estágio (100% de chance).
 */
export function handleSuperpowerEffect(
    attacker: Pokemon,
    logs: {message: string, color: string}[],
    state?: BattleState
) {
    // Aplica redução de Ataque (-1) no usuário
    // isOpponentSource = false, pois é um efeito colateral do próprio movimento
    StatChanges.applyMoveStatChange(
        attacker,
        'attack-down',
        logs,
        false, 
        false, 
        'superpower',
        state
    );

    // Aplica redução de Defesa (-1) no usuário
    StatChanges.applyMoveStatChange(
        attacker,
        'defense-down',
        logs,
        false, 
        false, 
        'superpower',
        state
    );
}
