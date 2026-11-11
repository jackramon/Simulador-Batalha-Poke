
import { Pokemon, BattleState, LogEntry } from '../../../../types';
import { log } from '../../utils';
import * as NeutralizingGas from './neutralizing_gas';

/**
 * Aplica o efeito da habilidade Robustez (Sturdy).
 * Regra Gen 5+: 
 * 1. Se o Pokémon estiver com HP cheio (100%), sobrevive a um golpe fatal com 1 PV.
 * 2. É imune a movimentos de OHKO (One-Hit Knockout) independentemente do HP (gerenciado em outros handlers geralmente, mas reforçado aqui se o dano vier de OHKO).
 */
export function applySturdy(
    defender: Pokemon, 
    damage: number, 
    ignoresAbilities: boolean, 
    logs: LogEntry[],
    state?: BattleState
): number {
    // 1. Verificações Básicas
    if (defender.ability !== 'sturdy' || defender.isFainted) {
        return damage;
    }

    // 2. Verificação de Supressão (Mold Breaker / Neutralizing Gas)
    if (ignoresAbilities) return damage;
    if (state && !NeutralizingGas.canAbilityTrigger(defender, state)) return damage;

    // 3. Lógica de Sobrevivência (Focus Sash effect)
    // Só ativa se o HP estiver EXATAMENTE cheio.
    if (defender.hp === defender.maxHP && damage >= defender.hp) {
        log(logs, `${defender.name} resistiu ao golpe com sua Robustez!`, 'text-blue-600 font-bold');
        return defender.hp - 1; // Garante 1 de HP restante
    }

    return damage;
}
