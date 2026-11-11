
import { Pokemon, Move, BattleState } from '../../../../types';
import { log } from '../../utils';
import { BATTLE_MESSAGES } from '../../../../data/battleMessages';

/**
 * Lógica para o movimento Raio Solar (Solar Beam).
 * Regra Oficial: 
 * 1. Carrega no 1º turno, ataca no 2º.
 * 2. No Sol (Sun), ataca no mesmo turno.
 * 3. Na Chuva, Areia ou Granizo, o poder é reduzido pela metade (60 BP).
 */
export function getSolarBeamPower(
    attacker: Pokemon,
    defender: Pokemon,
    move: Move,
    state: BattleState | undefined,
    hitIndex: number,
    logs: {message: string, color: string}[]
): number {
    if (!state) return move.power;

    const weather = state.weather;
    // Reduz o poder se o clima for Chuva, Areia ou Granizo
    if (weather === 'rain' || weather === 'sand' || weather === 'hail') {
        if (hitIndex === 0) {
            log(logs, BATTLE_MESSAGES.WEATHER_REDUCED_POWER(move.displayName), 'text-gray-500 text-xs italic');
        }
        return Math.floor(move.power / 2);
    }

    return move.power;
}
