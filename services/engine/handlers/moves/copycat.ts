
import { Move, Pokemon, LogEntry } from '../../../../types';
import { log } from '../../utils';

const BANNED_MOVES = [
    'copycat', 'struggle', 'assist', 'metronome', 'mimic', 'sketch', 'transform', 
    'focus-punch', 'beak-blast', 'shell-trap', 'destiny-bond', 'spite', 'thief', 
    'covet', 'trick', 'switcheroo', 'bestow', 'chatter', 'belch', 'celebrate', 
    'hold-hands', 'dynamax-cannon', 'dragon-energy', 'feint', 'mat-block', 
    'spotlight', 'crafty-shield', 'kings-shield', 'spiky-shield', 'baneful-bunker', 
    'obstruct', 'protect', 'detect', 'endure', 'sleep-talk'
];

export function handleCopycat(attacker: Pokemon, defender: Pokemon, logs: LogEntry[]): Move | null {
    // Em 1v1, a lógica "último movimento usado" recai sobre o oponente, 
    // a menos que o atacante tenha usado algo antes (mas Copycat é usado no lugar).
    // O sistema atual rastreia lastMoveUsed.
    
    // Se o defensor usou um movimento neste turno (atacou antes), copiamos esse.
    // Se não, copiamos o último movimento do defensor no turno anterior.
    const targetMove = defender.lastMoveUsed;

    if (!targetMove || BANNED_MOVES.includes(targetMove.name)) {
        log(logs, `Mas falhou!`, 'text-gray-500 italic');
        return null;
    }

    log(logs, `${attacker.name} imitou o movimento ${targetMove.displayName}!`, 'text-indigo-600 font-bold');
    
    // Retorna uma cópia do movimento para execução
    return { ...targetMove };
}
