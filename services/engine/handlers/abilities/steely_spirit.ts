import { Pokemon, Move, BattleState } from '../../../../types';
import * as NeutralizingGas from './neutralizing_gas';

/**
 * Lógica para a habilidade Espírito Férreo (Steely Spirit).
 * Regra Oficial: Aumenta o poder dos movimentos do tipo AÇO do Pokémon e de seus aliados em 50% (1.5x).
 * Adaptação 1v1: O bônus é aplicado se o atacante tiver a habilidade ou se houver aliados 
 * saudáveis na equipe com a habilidade (acumula multiplicativamente).
 */
export function getSteelySpiritMultiplier(attacker: Pokemon, move: Move, state?: BattleState): number {
    if (!state || move.type !== 'steel' || attacker.isFainted) {
        return 1.0;
    }

    const isGasActive = NeutralizingGas.isGasActive(state);
    const isP1 = state.team1.some(p => p.id === attacker.id);
    const team = isP1 ? state.team1 : state.team2;

    let multiplier = 1.0;

    // 1. Verifica se o próprio atacante tem a habilidade e não está suprimida
    if (attacker.ability === 'steely-spirit' && !NeutralizingGas.isAbilitySuppressed(attacker.ability, isGasActive)) {
        multiplier *= 1.5;
    }

    // 2. Verifica aliados saudáveis na reserva com a habilidade
    const steelyAlliesCount = team.filter(p => 
        p.id !== attacker.id && 
        !p.isFainted && 
        p.ability === 'steely-spirit' && 
        !NeutralizingGas.isAbilitySuppressed(p.ability, isGasActive)
    ).length;

    if (steelyAlliesCount > 0) {
        // Acumula 1.5x para cada instância (regra oficial de stacking em Doubles adaptada para o time)
        multiplier *= Math.pow(1.5, steelyAlliesCount);
    }

    return multiplier;
}
