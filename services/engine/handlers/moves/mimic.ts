
import { Pokemon, LogEntry } from '../../../../types';
import { log } from '../../utils';

/**
 * Movimentos que não podem ser copiados por Mímica (Mimic).
 * Regra Oficial: Sketch, Transform, Mimic, Struggle, Chatter, Metronome.
 */
const BANNED_MOVES = [
    'mimic', 'sketch', 'transform', 'struggle', 'chatter', 'metronome'
];

/**
 * Lógica para o movimento Mímica (Mimic).
 * Regra Oficial: O usuário copia o último movimento usado pelo alvo. 
 * O movimento copiado substitui Mímica no moveset do usuário enquanto ele estiver em campo.
 */
export function handleMimic(
    attacker: Pokemon, 
    defender: Pokemon, 
    logs: LogEntry[]
) {
    if (defender.isFainted) return;

    // 1. Verifica se o alvo já usou algum movimento
    if (!defender.lastMoveUsed) {
        log(logs, `Mas falhou! ${defender.name} ainda não usou nenhum movimento.`, 'text-gray-500 italic');
        return;
    }

    const targetMove = defender.lastMoveUsed;

    // 2. Verifica se o movimento é proibido
    if (BANNED_MOVES.includes(targetMove.name)) {
        log(logs, `Mas falhou! O movimento ${targetMove.displayName} não pode ser copiado.`, 'text-gray-500 italic');
        return;
    }

    // 3. Encontra o índice do movimento Mímica no moveset do usuário
    const mimicIndex = attacker.moves.findIndex(m => m.name === 'mimic');
    
    // Se por algum motivo bizarro o usuário não tiver Mimic (ex: Hack, Metronome), cancela
    if (mimicIndex === -1) {
        log(logs, `Mas falhou!`, 'text-gray-500 italic');
        return;
    }

    // 4. Substitui Mímica pelo novo movimento
    // Cria uma cópia do movimento para não alterar a referência original do oponente
    // PP é resetado para o máximo no simulador (simplificação comum, ou 5 no original se for Sketch, mas Mimic copia max PP do move)
    const newMove = { 
        ...targetMove,
        uses: targetMove.maxUses, 
        maxUses: targetMove.maxUses 
    };
    
    attacker.moves[mimicIndex] = newMove;

    log(logs, `${attacker.name} aprendeu ${newMove.displayName} usando Mímica!`, 'text-purple-600 font-bold');
}
