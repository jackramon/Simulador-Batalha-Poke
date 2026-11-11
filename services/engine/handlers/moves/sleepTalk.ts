
import { Pokemon, Move, LogEntry } from '../../../../types';
import { log } from '../../utils';
import * as Comatose from '../abilities/comatose';

// Lista de movimentos que não podem ser chamados pelo Sleep Talk
const BANNED_MOVES = [
    'sleep-talk', 'assist', 'beak-blast', 'belch', 'bide', 'blazing-torque', 
    'celebrate', 'chatter', 'combat-torque', 'copycat', 'dynamax-cannon', 
    'focus-punch', 'hold-hands', 'magical-torque', 'me-first', 'metronome', 
    'mimic', 'mirror-move', 'nature-power', 'noxious-torque', 'shell-trap', 
    'sketch', 'struggle', 'uproar', 'wicked-torque'
];

/**
 * Lógica para o movimento Sonâmbulo (Sleep Talk).
 * Regras:
 * 1. O usuário deve estar dormindo (Status Sleep) ou ter a habilidade Comatoso.
 * 2. Seleciona aleatoriamente um dos outros movimentos conhecidos pelo usuário.
 * 3. O movimento selecionado é usado imediatamente.
 */
export function handleSleepTalk(
    attacker: Pokemon, 
    logs: LogEntry[]
): Move | null {
    const isAsleep = !!attacker.statusEffects.sleep || Comatose.isTreatedAsAsleep(attacker);

    if (!isAsleep) {
        log(logs, `Mas falhou! ${attacker.name} não está dormindo.`, 'text-gray-500 italic');
        return null;
    }

    const validMoves = attacker.moves.filter(m => !BANNED_MOVES.includes(m.name));

    if (validMoves.length === 0) {
        log(logs, `Mas falhou! Não há movimentos válidos para usar.`, 'text-gray-500 italic');
        return null;
    }

    const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
    
    log(logs, `${attacker.name} usou ${randomMove.displayName} sonâmbulo!`, 'text-indigo-600 font-bold');

    return randomMove;
}
