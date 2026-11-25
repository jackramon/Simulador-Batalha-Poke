
import { Pokemon, BattleState, LogEntry } from '../../../../types';
import { getPokemonPlayerNum } from '../../../../utils/pokemonIdentity';
import { log } from '../../utils';

/**
 * Lógica para o movimento Canção da Sorte (Lucky Chant).
 * Regra Oficial: Protege o time do usuário de acertos críticos por 5 turnos.
 */
export function handleLuckyChant(
    attacker: Pokemon, 
    logs: LogEntry[], 
    state?: BattleState
) {
    if (!state) return;

    // Identifica o lado do usuário
    const isP1 = getPokemonPlayerNum(state, attacker) === 1;
    const hazards = isP1 ? state.p1Hazards : state.p2Hazards;

    if (hazards.luckyChant > 0) {
        log(logs, `Mas falhou! A Canção da Sorte já está ativa.`, 'text-gray-500 italic');
        return;
    }

    // Aplica o efeito por 5 turnos
    hazards.luckyChant = 5;
    
    log(logs, `A Canção da Sorte protegeu a equipe de ${attacker.name} contra acertos críticos!`, 'text-blue-500 font-bold');
}

export function processLuckyChantTurnEnd(state: BattleState, logs: LogEntry[]) {
    for (const hazards of [state.p1Hazards, state.p2Hazards]) {
        if (hazards.luckyChant <= 0) continue;

        hazards.luckyChant--;
        if (hazards.luckyChant === 0) {
            log(logs, `A Canção da Sorte se dissipou.`, 'text-gray-500 italic');
        }
    }
}
