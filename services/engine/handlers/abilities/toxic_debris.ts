
import { Pokemon, BattleState } from '../../../../types';
import { log } from '../../utils';

/**
 * Ativa o efeito da habilidade Detritos Tóxicos (Toxic Debris).
 * Espalha Espinhos Tóxicos no campo do oponente quando atingido por um ataque físico.
 */
export function triggerToxicDebris(defender: Pokemon, state: BattleState, logs: {message: string, color: string}[]) {
    // Identifica qual oponente deve receber os hazards
    const isP1 = defender === state.currentPokemon1;
    const opponentHazards = isP1 ? state.p2Hazards : state.p1Hazards;

    if (opponentHazards.toxicSpikes < 2) {
        opponentHazards.toxicSpikes++;
        log(logs, `Os Detritos Tóxicos de ${defender.name} espalharam espinhos venenosos no campo adversário!`, 'text-purple-600 font-bold');
        return true;
    }
    return false;
}
