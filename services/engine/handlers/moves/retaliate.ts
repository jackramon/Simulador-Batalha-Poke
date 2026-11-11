
import { Pokemon, BattleState } from '../../../../types';

/**
 * Lógica para o movimento Retaliação (Retaliate).
 * Regra Oficial: O poder base dobra (70 -> 140) se um aliado desmaiou no turno anterior.
 * 
 * Adaptação para o Simulador (1v1 Singles):
 * Detecta se o atacante acabou de entrar em campo (turnsActive === 0) 
 * e se há pelo menos um aliado desmaiado na equipe.
 * Isso simula o cenário de entrada após nocaute (Revenge Kill).
 */
export function getRetaliatePower(attacker: Pokemon, basePower: number, state?: BattleState): number {
    if (!state) return basePower;

    // 1. O usuário deve ter acabado de entrar (turno 0 de atividade)
    if (attacker.turnsActive > 0) {
        return basePower;
    }

    // 2. Determina a equipe do atacante
    const isP1 = state.team1.some(p => p.id === attacker.id);
    const team = isP1 ? state.team1 : state.team2;

    // 3. Verifica se há algum aliado desmaiado na equipe (que não seja o próprio atacante)
    const hasFaintedAlly = team.some(p => p.isFainted && p.id !== attacker.id);

    if (hasFaintedAlly) {
        return basePower * 2;
    }

    return basePower;
}
