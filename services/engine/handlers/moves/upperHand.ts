
import { Pokemon, Action } from '../../../../types';
import { MOVE_PRIORITIES } from '../../../../data/moves/categories';

/**
 * Lógica para o movimento Mão Superior (Upper Hand).
 * Regra Oficial: Ataca antes do movimento de prioridade do alvo e faz o alvo recuar.
 * Falha se o alvo não estiver usando um movimento de prioridade.
 */
export function canExecuteUpperHand(attacker: Pokemon, defender: Pokemon, defenderAction?: Action): boolean {
    // 1. Verifica se o defensor tem uma ação de movimento selecionada
    if (!defenderAction || defenderAction.type !== 'switch') {
        const defenderMove = defender.selectedMove;
        if (!defenderMove) return false;

        // 2. Verifica a prioridade do movimento do defensor
        // Nota: Upper Hand checa a prioridade BASE do movimento selecionado pelo alvo.
        const priority = MOVE_PRIORITIES[defenderMove.name] || 0;

        // 3. Sucesso apenas se o alvo usar golpe de prioridade e ainda não tiver agido
        if (priority > 0 && !defender.movedThisTurn) {
            return true;
        }
    }

    return false;
}
