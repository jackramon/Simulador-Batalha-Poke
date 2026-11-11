import { Move, Pokemon, LogEntry } from '../../../../types';
import { log } from '../../utils';

const BANNED_MOVES = [
    'mirror-move', 'copycat', 'struggle', 'assist', 'metronome', 'mimic', 'sketch', 'transform', 
    'focus-punch', 'beak-blast', 'shell-trap', 'destiny-bond', 'spite', 'thief', 
    'covet', 'trick', 'switcheroo', 'bestow', 'chatter', 'belch', 'celebrate', 
    'hold-hands', 'dynamax-cannon', 'dragon-energy', 'feint', 'mat-block', 
    'spotlight', 'crafty-shield', 'kings-shield', 'spiky-shield', 'baneful-bunker', 
    'obstruct', 'protect', 'detect', 'endure', 'sleep-talk', 'me-first', 'nature-power'
];

export function handleMirrorMove(attacker: Pokemon, defender: Pokemon, logs: LogEntry[]): Move | null {
    // Mirror Move copia o último movimento usado pelo ALVO (defender).
    const targetMove = defender.lastMoveUsed;

    if (!targetMove || BANNED_MOVES.includes(targetMove.name)) {
        log(logs, `Mas falhou!`, 'text-gray-500 italic');
        return null;
    }

    log(logs, `${attacker.name} imitou o movimento ${targetMove.displayName} com Movimento Espelho!`, 'text-indigo-600 font-bold');
    
    // Retorna uma cópia do movimento para execução
    return { ...targetMove };
}
