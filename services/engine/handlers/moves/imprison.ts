
import { Pokemon, LogEntry } from '../../../../types';
import { log } from '../../utils';

/**
 * Lógica para o movimento Selo (Imprison).
 * Regra Oficial: O usuário sela os movimentos do oponente.
 * Enquanto o usuário permanecer em campo, nenhum oponente pode usar 
 * qualquer movimento que o usuário também conheça.
 */
export function handleImprison(attacker: Pokemon, logs: LogEntry[]) {
    // Falha se já estiver ativo
    if (attacker.statusEffects['imprison']) {
        log(logs, `Mas falhou! ${attacker.name} já selou os movimentos.`, 'text-gray-500 italic');
        return;
    }

    // Aplica o status ao USUÁRIO
    // Duração -1 (Infinito enquanto estiver em campo)
    attacker.statusEffects['imprison'] = { turns: -1 };
    
    log(logs, `${attacker.name} selou os movimentos do oponente!`, 'text-purple-600 font-bold italic');
}
