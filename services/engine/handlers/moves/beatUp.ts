
import { Pokemon, BattleState } from '../../../../types';

/**
 * Obtém os membros da equipe elegíveis para participar da Surra.
 * Regra: Pokémon não desmaiados e sem condições de status não-voláteis.
 */
function getParticipatingTeam(attacker: Pokemon, state: BattleState): Pokemon[] {
    const isP1 = state.team1.some(p => p.id === attacker.id);
    const team = isP1 ? state.team1 : state.team2;

    const majorStatus = ['burn', 'paralysis', 'poison', 'toxic', 'sleep', 'freeze'];

    return team.filter(p => {
        if (p.isFainted) return false;
        // Verifica se tem status não-volátil
        const hasStatus = Object.keys(p.statusEffects).some(s => majorStatus.includes(s));
        return !hasStatus;
    });
}

/**
 * Calcula o número de acertos da Surra.
 * Igual ao número de participantes qualificados na equipe.
 */
export function getHitCount(attacker: Pokemon, state: BattleState): number {
    const participants = getParticipatingTeam(attacker, state);
    return participants.length;
}

/**
 * Calcula o poder base do acerto atual.
 * Fórmula (Gen 5+): (Base Attack do Membro / 10) + 5
 */
export function getBasePower(attacker: Pokemon, state: BattleState | undefined, hitIndex: number): number {
    if (!state) return 5; // Fallback seguro

    const participants = getParticipatingTeam(attacker, state);
    const member = participants[hitIndex];

    if (!member) return 5;

    // Usa o stat base de ataque (sem modificadores, IVs ou EVs - apenas a espécie)
    // No simulador, attackStat armazena o Base Stat da espécie.
    const baseAttack = member.attackStat;
    
    return Math.floor(baseAttack / 10) + 5;
}
