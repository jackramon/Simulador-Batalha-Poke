
import { Pokemon, BattleState, LogEntry } from '../../../../types';
import { log } from '../../utils';

/**
 * Lógica para o movimento Salvaguarda (Safeguard).
 * Regra Oficial: Protege o time do usuário de condições de status por 5 turnos.
 * Não cura status já existentes.
 * Pode ser infiltrado pela habilidade Infiltrator.
 */
export function handleSafeguard(
    attacker: Pokemon, 
    logs: LogEntry[], 
    state?: BattleState
) {
    if (!state) return;

    // Identifica o lado do usuário
    const isP1 = state.currentPokemon1?.id === attacker.id;
    const hazards = isP1 ? state.p1Hazards : state.p2Hazards;

    if (hazards.safeguard > 0) {
        log(logs, `Mas falhou! A equipe já está protegida pela Salvaguarda.`, 'text-gray-500 italic');
        return;
    }

    // Aplica o efeito por 5 turnos
    hazards.safeguard = 5;
    
    log(logs, `A equipe de ${attacker.name} foi protegida por uma aura mística!`, 'text-green-600 font-bold');
}
