
import { Pokemon, BattleState, LogEntry } from '../../../../types';
import { log } from '../../utils';

/**
 * Lógica para o movimento Tela de Luz (Light Screen).
 * Regra Oficial: Cria uma barreira mágica que reduz o dano de ataques Especiais recebidos.
 * Duração: 5 turnos (ou 8 turnos se o usuário estiver segurando Light Clay).
 * A redução de dano em si é calculada em services/engine/handlers/moves/reflect.ts.
 */
export function handleLightScreen(
    attacker: Pokemon, 
    logs: LogEntry[], 
    state?: BattleState
) {
    if (!state) return;

    // Identifica o lado do usuário
    const isP1 = state.currentPokemon1?.id === attacker.id;
    const hazards = isP1 ? state.p1Hazards : state.p2Hazards;

    if (hazards.lightScreen > 0) {
        log(logs, `Mas falhou! A Tela de Luz já está ativa.`, 'text-gray-500 italic');
        return;
    }

    // Verifica item Argila Luz (Light Clay)
    const duration = attacker.heldItem === 'light-clay' ? 8 : 5;

    // Aplica o efeito
    hazards.lightScreen = duration;
    
    log(logs, `Uma Tela de Luz aumentou a defesa especial do time de ${attacker.name}!`, 'text-yellow-600 font-bold');
}
