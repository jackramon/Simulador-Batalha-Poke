
import { Pokemon, Move } from '../../../../types';
import { log } from '../../utils';

/**
 * Lógica para o movimento Hiperbroca (Hyper Drill) e similares que quebram proteção.
 * Regra Oficial: O movimento atravessa e anula efeitos de proteção como Protect, Detect, etc.
 * Outros movimentos que compartilham esta lógica: Feint, Hyperspace Hole, Hyperspace Fury, Phantom Force, Shadow Force.
 */
export function handleProtectionBreak(attacker: Pokemon, defender: Pokemon, move: Move, logs: {message: string, color: string}[]) {
    // Lista de movimentos que perfuram proteção
    const piercingMoves = ['hyper-drill', 'hyperspace-hole', 'hyperspace-fury', 'feint', 'phantom-force', 'shadow-force'];
    
    if (!piercingMoves.includes(move.name)) return;

    // Lista de status de proteção que podem ser quebrados
    const protectStatuses = [
        'protect', 'detect', 'spiky-shield', 'kings-shield', 
        'baneful-bunker', 'obstruct', 'silk-trap', 'burning-bulwark',
        'quick-guard'
    ];

    const hasProtection = protectStatuses.some(s => defender.statusEffects[s]);

    if (hasProtection) {
        // Remove todos os status de proteção ativos
        protectStatuses.forEach(s => {
            if (defender.statusEffects[s]) {
                delete defender.statusEffects[s];
            }
        });
        
        log(logs, `A ${move.displayName} de ${attacker.name} atravessou a proteção!`, 'text-red-600 font-bold');
    }
}
