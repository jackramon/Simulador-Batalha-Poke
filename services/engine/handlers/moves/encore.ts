
import { Pokemon, LogEntry } from '../../../../types';
import { log } from '../../utils';
import * as AromaVeil from '../abilities/aroma_veil';

/**
 * Lógica para o movimento Bis (Encore).
 * Categoria: Status.
 * Efeito: Obriga o alvo a usar apenas o último movimento executado por 3 turnos.
 * Falha se:
 * 1. O alvo não usou nenhum movimento ainda.
 * 2. O alvo já está sob efeito de Encore.
 * 3. O último movimento foi Encore, Mimic, Mirror Move, Sketch, Struggle, Transform, Assist, Copycat, Sleep Talk.
 * 4. O alvo tem imunidade (Aroma Veil).
 */
export function handleEncore(
    attacker: Pokemon, 
    defender: Pokemon, 
    logs: LogEntry[]
) {
    if (defender.isFainted) return;

    // 1. Verifica Imunidade de Habilidade (Aroma Veil)
    // O Véu de Aroma protege o Pokémon e aliados de efeitos mentais como Encore.
    if (AromaVeil.isImmune(defender, 'encore')) {
        log(logs, `O Véu de Aroma protegeu ${defender.name} de receber um bis!`, 'text-pink-500 italic text-xs');
        return;
    }

    // 2. Verifica se já está sob efeito
    if (defender.statusEffects['encore']) {
        log(logs, `Mas falhou! ${defender.name} já recebeu um bis.`, 'text-gray-500 italic');
        return;
    }

    // 3. Verifica último movimento
    const lastMove = defender.lastMoveUsed;

    if (!lastMove) {
        log(logs, `Mas falhou! ${defender.name} ainda não usou nenhum movimento.`, 'text-gray-500 italic');
        return;
    }

    // 4. Lista de movimentos inválidos para Encore
    const bannedMoves = [
        'encore', 'struggle', 'mimic', 'sketch', 'transform', 
        'assist', 'copycat', 'sleep-talk', 'metronome', 'mirror-move'
    ];

    if (bannedMoves.includes(lastMove.name)) {
        log(logs, `Mas falhou! O movimento ${lastMove.displayName} não pode receber bis.`, 'text-gray-500 italic');
        return;
    }

    // 5. Verifica se o movimento ainda tem PP (Simplificação: Assume que tem, pois acabou de usar)

    // 6. Aplica o status
    // Duração: 3 turnos (fixo em Gen 5+)
    defender.statusEffects['encore'] = {
        turns: 3,
        moveName: lastMove.name,
        isVolatile: true,
        batonPassable: false
    };

    log(logs, `${defender.name} recebeu um bis!`, 'text-pink-600 font-bold');
}
