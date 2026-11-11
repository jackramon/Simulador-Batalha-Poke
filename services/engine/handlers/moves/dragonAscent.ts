
import { Pokemon, BattleState } from '../../../../types';
import * as StatChanges from '../effects/statChanges';

/**
 * Lógica para o movimento Ascensão do Dragão (Dragon Ascent).
 * Regra Oficial: Causa dano e reduz a Defesa e a Defesa Especial do USUÁRIO em 1 estágio (100% de chance).
 * Nota: Apesar do nome, é um movimento do tipo Voador.
 */
export function handleDragonAscentEffect(
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
        'dragon-ascent',
        state
    );

    // Aplica redução de Defesa Especial (-1) no usuário
    StatChanges.applyMoveStatChange(
        attacker,
        'spDefense-down',
        logs,
        false, 
        false, 
        'dragon-ascent',
        state
    );
}
