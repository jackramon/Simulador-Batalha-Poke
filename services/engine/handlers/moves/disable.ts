
import { Pokemon, LogEntry } from '../../../../types';
import { log } from '../../utils';
import { BATTLE_MESSAGES } from '../../../../data/battleMessages';
import * as AromaVeil from '../abilities/aroma_veil';

/**
 * Lógica para o movimento Desabilitar (Disable).
 * Categoria: Status.
 * Efeito: Impede o alvo de usar o último movimento que executou por 4 turnos.
 * Falha se:
 * 1. O alvo não usou nenhum movimento ainda.
 * 2. O último movimento já está desabilitado.
 * 3. O alvo está protegido por Véu de Aroma (Aroma Veil).
 */
export function handleDisable(
    attacker: Pokemon, 
    defender: Pokemon, 
    logs: LogEntry[]
) {
    if (defender.isFainted) return;

    // 1. Verifica Imunidade de Habilidade (Aroma Veil)
    // O Véu de Aroma protege o Pokémon e aliados de efeitos mentais como Disable.
    if (AromaVeil.isImmuneToDisable(defender, false)) {
        log(logs, `O Véu de Aroma protegeu ${defender.name} de ser desabilitado!`, 'text-pink-500 italic text-xs');
        return;
    }

    const lastMove = defender.lastMoveUsed;

    // 2. Verifica se o alvo usou um movimento anteriormente
    if (!lastMove) {
        log(logs, `Mas falhou! ${defender.name} ainda não usou nenhum movimento.`, 'text-gray-500 italic');
        return;
    }

    // 3. Verifica se o movimento já está desabilitado
    if (defender.disabledMoves && defender.disabledMoves[lastMove.name]) {
        log(logs, `Mas falhou! O movimento ${lastMove.displayName} já está desativado.`, 'text-gray-500 italic');
        return;
    }

    // 4. Alguns movimentos não podem ser desabilitados (ex: Struggle, Max Moves)
    if (lastMove.name === 'struggle') {
        log(logs, `Mas falhou!`, 'text-gray-500 italic');
        return;
    }

    // Inicializa o objeto se não existir
    if (!defender.disabledMoves) {
        defender.disabledMoves = {};
    }

    // Aplica o efeito (4 turnos)
    defender.disabledMoves[lastMove.name] = 4;
    
    log(logs, `O movimento ${lastMove.displayName} de ${defender.name} foi desativado!`, 'text-purple-600 font-bold');
}
