
import { Pokemon, BattleState } from '../../../../types';
import { log } from '../../utils';

/**
 * Lógica para o movimento Espinhos Tóxicos (Toxic Spikes).
 * Categoria: Status.
 * Efeito: Espalha uma camada de espinhos tóxicos no campo do oponente.
 * Camadas:
 * - 1 camada: Envenenamento regular (Poison) ao entrar.
 * - 2 camadas: Envenenamento grave (Toxic) ao entrar.
 * Máximo de 2 camadas.
 */
export function handleToxicSpikes(
    attacker: Pokemon, 
    logs: {message: string, color: string}[], 
    state: BattleState
) {
    // Identifica o lado do oponente
    const isP1 = state.currentPokemon1?.id === attacker.id;
    const targetHazards = isP1 ? state.p2Hazards : state.p1Hazards;

    if (targetHazards.toxicSpikes >= 2) {
        log(logs, `Mas falhou! O campo já está cheio de espinhos tóxicos.`, 'text-gray-500 italic');
    } else {
        targetHazards.toxicSpikes++;
        log(logs, `Espinhos tóxicos foram espalhados no chão do time adversário!`, 'text-purple-600 font-bold');
    }
}
