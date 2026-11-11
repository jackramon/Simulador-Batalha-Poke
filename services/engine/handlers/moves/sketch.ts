
import { Pokemon, LogEntry, Move } from '../../../../types';
import { log } from '../../utils';

/**
 * Movimentos que não podem ser copiados por Esboço (Sketch).
 */
const UNSKETCHABLE_MOVES = [
    'sketch', 'struggle', 'chatter', 'metronome'
];

/**
 * Lógica para o movimento Esboço (Sketch).
 * Regra Oficial: O usuário aprende permanentemente o último movimento usado pelo alvo.
 * O movimento "Sketch" é substituído pelo novo movimento no moveset do usuário.
 */
export function handleSketch(
    attacker: Pokemon,
    defender: Pokemon,
    logs: LogEntry[]
) {
    if (attacker.isFainted || defender.isFainted) return;

    // 1. Verifica se o alvo já usou um movimento (lastMoveUsed)
    if (!defender.lastMoveUsed) {
        log(logs, `Mas falhou! ${defender.name} ainda não usou nenhum movimento.`, 'text-gray-500 italic');
        return;
    }

    const targetMove = defender.lastMoveUsed;

    // 2. Verifica se o movimento é proibido (Unsketchable)
    if (UNSKETCHABLE_MOVES.includes(targetMove.name)) {
        log(logs, `Mas falhou! O movimento ${targetMove.displayName} não pode ser esboçado.`, 'text-gray-500 italic');
        return;
    }

    // 3. Encontra o slot do movimento Esboço no moveset do usuário
    const sketchIndex = attacker.moves.findIndex(m => m.name === 'sketch');
    
    // Se o usuário não tiver Sketch (ex: chamado por Metronome), falha
    if (sketchIndex === -1) {
        log(logs, `Mas falhou!`, 'text-gray-500 italic');
        return;
    }

    // 4. Executa a cópia
    // Cria uma nova instância do movimento para garantir independência
    const learnedMove: Move = {
        ...targetMove,
        uses: targetMove.maxUses, // Restaura o PP total para o novo golpe
    };

    // Substitui Sketch pelo novo movimento
    attacker.moves[sketchIndex] = learnedMove;

    log(logs, `${attacker.name} esboçou ${learnedMove.displayName}!`, 'text-indigo-600 font-bold');
}
