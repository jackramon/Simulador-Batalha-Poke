import { Pokemon, BattleState } from '../../../../types';
import * as NeutralizingGas from './neutralizing_gas';

/**
 * Lógica para a habilidade Guarda Amiga (Friend Guard).
 * Regra Oficial: Reduz o dano recebido pelos aliados em 25% (0.75x).
 * Adaptação 1v1: O bônus é aplicado se houver um aliado saudável na reserva com a habilidade.
 */
export function getFriendGuardMultiplier(defender: Pokemon, state?: BattleState): number {
    if (!state || defender.isFainted) {
        return 1.0;
    }

    const isGasActive = NeutralizingGas.isGasActive(state);
    const isP1 = state.team1.some(p => p.id === defender.id);
    const team = isP1 ? state.team1 : state.team2;

    // Procura por um aliado (teammate) que:
    // 1. Não seja o próprio defensor ativo.
    // 2. Não esteja desmaiado.
    // 3. Tenha a habilidade Guarda Amiga não suprimida.
    const hasFriendGuardAlly = team.some(p => 
        p.id !== defender.id && 
        !p.isFainted && 
        p.ability === 'friend-guard' && 
        !NeutralizingGas.isAbilitySuppressed(p.ability, isGasActive)
    );

    return hasFriendGuardAlly ? 0.75 : 1.0;
}
