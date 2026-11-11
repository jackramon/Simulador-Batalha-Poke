
import { Pokemon, LogEntry } from '../../../../types';
import { log } from '../../utils';

const EMBARGO_KEY = 'embargo';

/**
 * Lógica para o movimento Embargo.
 * Regra Oficial: Impede o alvo de usar o item segurado e impede o treinador de usar itens no alvo por 5 turnos.
 * Falha se:
 * 1. O alvo já estiver sob efeito de Embargo.
 */
export function handleEmbargo(
    attacker: Pokemon,
    defender: Pokemon,
    logs: LogEntry[]
) {
    if (defender.isFainted) return;

    // 1. Verifica se já está sob efeito
    if (defender.statusEffects[EMBARGO_KEY]) {
        log(logs, `Mas falhou! ${defender.name} já está sob embargo.`, 'text-gray-500 italic');
        return;
    }

    // 2. Aplica o status
    // Duração: 5 turnos
    defender.statusEffects[EMBARGO_KEY] = { turns: 5 };
    
    log(logs, `${defender.name} não pode usar itens!`, 'text-purple-600 font-bold italic');
}

/**
 * Processa o contador de turnos no final do round.
 */
export function handleEmbargoTurnEnd(pokemon: Pokemon, logs: LogEntry[]) {
    if (pokemon.statusEffects[EMBARGO_KEY]) {
        pokemon.statusEffects[EMBARGO_KEY].turns--;
        if (pokemon.statusEffects[EMBARGO_KEY].turns <= 0) {
            delete pokemon.statusEffects[EMBARGO_KEY];
            log(logs, `${pokemon.name} pode usar itens novamente!`, 'text-gray-600 font-bold');
        }
    }
}
