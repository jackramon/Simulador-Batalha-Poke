import { Pokemon, Move, BattleState } from '../../../../types';
import * as NeutralizingGas from './neutralizing_gas';

/**
 * Lógica para a habilidade Bateria (Battery).
 * Regra Oficial: Aumenta o poder dos movimentos ESPECIAIS dos aliados em 30% (1.3x).
 * Adaptação 1v1: No simulador 1v1, o bônus é aplicado se houver um aliado saudável (não desmaiado) 
 * na equipe que possua a habilidade Bateria e não esteja com ela suprimida.
 */
export function getBatteryMultiplier(attacker: Pokemon, move: Move, state?: BattleState): number {
    if (!state || move.damageClass !== 'special' || attacker.isFainted) {
        return 1.0;
    }

    const isGasActive = NeutralizingGas.isGasActive(state);

    // Identifica a equipe do atacante
    const isP1 = state.team1.some(p => p.id === attacker.id);
    const team = isP1 ? state.team1 : state.team2;

    // Procura por um aliado na equipe que:
    // 1. Não seja o próprio atacante.
    // 2. Não esteja desmaiado (na reserva, mas pronto para dar suporte).
    // 3. Tenha a habilidade Bateria não suprimida.
    const hasBatteryAlly = team.some(p => {
        return p.id !== attacker.id && 
               !p.isFainted && 
               p.ability === 'battery' && 
               !NeutralizingGas.isAbilitySuppressed(p.ability, isGasActive);
    });

    return hasBatteryAlly ? 1.3 : 1.0;
}