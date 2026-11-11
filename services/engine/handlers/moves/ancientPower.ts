
import { Pokemon, BattleState } from '../../../../types';
import * as StatChanges from './statChanges';

/**
 * Lógica para o movimento Poder Antigo (Ancient Power).
 * Regra Oficial: Tem 10% de chance de aumentar todos os atributos do usuário em 1 estágio.
 * (Ataque, Defesa, Atq. Especial, Def. Especial e Velocidade).
 */
export function handleAncientPowerEffect(
    attacker: Pokemon,
    logs: {message: string, color: string}[],
    state?: BattleState
) {
    StatChanges.handleAllStatsUp(attacker, logs, state);
}
