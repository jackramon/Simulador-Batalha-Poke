
import { Pokemon, BattleState, LogEntry } from '../../../../types';
import { log } from '../../utils';

/**
 * Lógica para o movimento Névoa (Mist).
 * Regra Oficial: Cria um campo de névoa no lado do usuário que protege
 * a equipe de reduções de atributos (Stat Drops) por 5 turnos.
 * Pode ser infiltrado pela habilidade Infiltrator.
 */
export function handleMist(
    attacker: Pokemon, 
    logs: LogEntry[], 
    state?: BattleState
) {
    if (!state) return;

    // Identifica o lado do usuário
    const isP1 = state.currentPokemon1?.id === attacker.id;
    const hazards = isP1 ? state.p1Hazards : state.p2Hazards;

    if (hazards.mist > 0) {
        log(logs, `Mas falhou! A névoa já está ativa.`, 'text-gray-500 italic');
        return;
    }

    // Aplica o efeito por 5 turnos
    hazards.mist = 5;
    
    log(logs, `A equipe de ${attacker.name} foi protegida pela névoa!`, 'text-blue-300 font-bold');
}
