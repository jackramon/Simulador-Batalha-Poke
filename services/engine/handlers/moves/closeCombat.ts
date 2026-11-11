
import { Pokemon, BattleState } from '../../../../types';
import * as StatChanges from './statChanges';

/**
 * Lógica para o movimento Corpo a Corpo (Close Combat).
 * Regra Oficial: Causa dano e reduz a Defesa e a Defesa Especial do USUÁRIO em 1 estágio (100% de chance).
 */
export function handleCloseCombatEffect(
    attacker: Pokemon,
    logs: {message: string, color: string}[],
    state?: BattleState
) {
    // Aplica redução de Defesa (-1) no usuário
    // isOpponentSource = false, pois é um efeito colateral do próprio movimento
    StatChanges.applyMoveStatChange(
        attacker,
        'defense-down',
        logs,
        false, 
        false, 
        'close-combat',
        state
    );

    // Aplica redução de Defesa Especial (-1) no usuário
    StatChanges.applyMoveStatChange(
        attacker,
        'spDefense-down',
        logs,
        false, 
        false, 
        'close-combat',
        state
    );
}
