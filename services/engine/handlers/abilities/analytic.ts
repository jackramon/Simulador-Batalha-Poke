
import { Pokemon, Move, BattleState } from '../../../../types';
import { getEffectiveSpeed } from '../../../battleUtils';

/**
 * Calcula o multiplicador de poder para a habilidade Analítico (Analytic).
 * Regra: Aumenta o poder em 30% (1.3x) se o usuário for o último a agir no turno.
 */
export function getPowerMultiplier(
    attacker: Pokemon, 
    defender: Pokemon, 
    move: Move, 
    state?: BattleState
): number {
    if (attacker.ability !== 'analytic') return 1.0;

    // Se não houver estado, não podemos validar ordem com precisão, assumimos 1.0
    if (!state) return 1.0;

    // 1. Ativa se o oponente trocou de Pokémon neste turno
    // No simulador, turnsActive é 0 no turno em que o Pokémon entra.
    if (defender.turnsActive === 0) {
        return 1.3;
    }

    // 2. Ativa se o usuário for efetivamente mais lento que o oponente
    const speedA = getEffectiveSpeed(attacker, state.weather);
    const speedB = getEffectiveSpeed(defender, state.weather);
    const trickRoom = state.trickRoomActive;

    const isSlower = trickRoom ? (speedA > speedB) : (speedA < speedB);
    
    // Nota: Em caso de empate de velocidade, Analytic só ativa se o RNG decidir 
    // que o usuário moveu depois. Para o simulador 1v1, simplificamos para SpeedA < SpeedB.
    if (isSlower) {
        return 1.3;
    }

    // Nota: Se usarmos movimentos de prioridade negativa futuramente, 
    // a verificação de prioridade do movimento também deve ser incluída aqui.
    if ((move.priority || 0) < 0) {
        return 1.3;
    }

    return 1.0;
}
