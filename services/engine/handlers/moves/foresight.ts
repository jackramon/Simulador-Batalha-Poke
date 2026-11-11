
import { Pokemon, LogEntry } from '../../../../types';
import { log } from '../../utils';

/**
 * Lógica para o movimento Profecia (Foresight) e Rastreamento (Odor Sleuth).
 * Categoria: Status.
 * Efeitos:
 * 1. Reseta a Evasiva do alvo para 0 se estiver positiva.
 * 2. Se o alvo for do tipo Fantasma, ele perde a imunidade a golpes dos tipos Normal e Lutador.
 * 
 * Falha se o alvo não for Fantasma E não tiver Evasiva aumentada.
 */
export function handleForesight(
    attacker: Pokemon, 
    defender: Pokemon, 
    logs: LogEntry[]
) {
    if (defender.isFainted) return;

    let success = false;

    // 1. Reseta Evasiva se estiver aumentada
    if (defender.statStages.evasion !== 0) {
        defender.statStages.evasion = 0;
        success = true;
    }

    // 2. Aplica identificação em Fantasmas
    if (defender.types.includes('ghost')) {
        // Se já está identificado, não falha necessariamente se resetou evasiva,
        // mas a identificação em si é idempotente.
        if (!defender.statusEffects['foresight']) {
            defender.statusEffects['foresight'] = { 
                turns: -1, // Dura enquanto o Pokémon estiver em campo
                sourceMoveName: 'foresight'
            };
            success = true;
        }
    }

    if (success) {
        log(logs, `${defender.name} foi identificado!`, 'text-blue-600 font-bold');
    } else {
        log(logs, `Mas falhou!`, 'text-gray-500 italic');
    }
}
