
import { Pokemon, LogEntry } from '../../../../types';
import { log } from '../../utils';

export function handleSpite(attacker: Pokemon, defender: Pokemon, logs: LogEntry[]) {
    if (defender.isFainted) return;

    const lastMove = defender.lastMoveUsed;

    if (!lastMove) {
        log(logs, `Mas falhou! ${defender.name} ainda não usou nenhum movimento.`, 'text-gray-500 italic');
        return;
    }

    // Encontra o movimento no moveset do defensor para modificar o PP
    const targetMove = defender.moves.find(m => m.name === lastMove.name);

    if (!targetMove) {
         log(logs, `Mas falhou!`, 'text-gray-500 italic');
         return;
    }

    if (targetMove.uses <= 0) {
        log(logs, `Mas falhou! O movimento ${targetMove.displayName} não tem mais PP.`, 'text-gray-500 italic');
        return;
    }

    const reduction = 4;
    targetMove.uses = Math.max(0, targetMove.uses - reduction);

    log(logs, `O Rancor reduziu o PP de ${targetMove.displayName} em ${reduction}!`, 'text-purple-600 font-bold');
}
