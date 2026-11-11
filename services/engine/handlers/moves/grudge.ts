
import { Pokemon, Move, LogEntry } from '../../../../types';
import { log } from '../../utils';

/**
 * Lógica para o movimento Rancor (Grudge).
 * Regra Oficial: Se o usuário desmaiar como resultado direto de um ataque 
 * usado pelo oponente no turno em que Rancor foi usado, o movimento usado 
 * pelo atacante perde todo o seu PP (torna-se 0).
 */
export function handleGrudge(attacker: Pokemon, logs: LogEntry[]) {
    // Aplica o status 'grudge'. A duração é -1 (até desmaiar ou trocar, 
    // mas na prática dura até o fim do turno ou até o efeito ativar).
    // Nos jogos, dura até o Pokémon tentar usar outro golpe.
    attacker.statusEffects['grudge'] = { turns: -1 };
    
    log(logs, `${attacker.name} quer que o oponente se arrependa!`, 'text-purple-800 font-bold');
}

/**
 * Gatilho de Rancor ao desmaiar.
 * Chamado em knockout.ts.
 */
export function handleGrudgeTrigger(
    victim: Pokemon, 
    attacker: Pokemon, // Quem causou o nocaute
    move: Move,        // O movimento que causou o nocaute
    logs: LogEntry[]
) {
    if (victim.statusEffects['grudge']) {
        log(logs, `O Rancor de ${victim.name} esgotou o PP de ${move.displayName}!`, 'text-gray-800 font-black');
        
        // Zera o PP do movimento no atacante
        // Procura a referência do movimento na lista do atacante para persistir a mudança
        const attackerMove = attacker.moves.find(m => m.name === move.name);
        
        if (attackerMove) {
            attackerMove.uses = 0;
        } else {
            // Fallback: Zera na instância passada se não encontrar (ex: Metronome, Copycat)
            move.uses = 0;
        }
    }
}
