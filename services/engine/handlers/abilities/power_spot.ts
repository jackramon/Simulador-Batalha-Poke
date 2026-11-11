
import { Pokemon, BattleState, Move } from '../../../../types';
import * as NeutralizingGas from './neutralizing_gas';

/**
 * Lógica para a habilidade Ponto de Energia (Power Spot).
 * Regra Oficial: Aumenta o poder dos movimentos dos aliados em 30% (1.3x).
 * No simulador 1v1, o bônus é aplicado se houver um aliado saudável na reserva com a habilidade.
 * Nota: O efeito NÃO se aplica ao próprio portador da habilidade.
 */
export function getPowerSpotMultiplier(attacker: Pokemon, move: Move, state?: BattleState): number {
    if (!state || move.damageClass === 'status' || attacker.isFainted) {
        return 1.0;
    }

    const isGasActive = NeutralizingGas.isGasActive(state);

    // Identifica a equipe do atacante
    const isP1 = state.team1.some(p => p.id === attacker.id);
    const team = isP1 ? state.team1 : state.team2;

    // Procura por um aliado na equipe que:
    // 1. Não seja o próprio atacante (Power Spot não afeta o usuário).
    // 2. Não esteja desmaiado.
    // 3. Tenha a habilidade Ponto de Energia não suprimida.
    const hasPowerSpotAlly = team.some(p => {
        return p.id !== attacker.id && 
               !p.isFainted && 
               p.ability === 'power-spot' && 
               !NeutralizingGas.isAbilitySuppressed(p.ability, isGasActive);
    });

    return hasPowerSpotAlly ? 1.3 : 1.0;
}
